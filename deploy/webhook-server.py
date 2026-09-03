#!/usr/bin/env python3
"""
Webhook 服务器（FastAPI）——部署在你自己的服务器上。
接收 GitHub Actions 的部署通知（POST /webhook/deploy，校验 X-Webhook-Token），
然后：docker login → 拉取最新镜像 → 停掉并重建站点容器。

配置全部来自环境变量（见 deploy/docker-compose.yml + deploy/.env）。
"""

import os
import sys
import json
import time
import hmac
import logging
import traceback
from contextlib import asynccontextmanager

import docker
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)
sys.stdout.reconfigure(line_buffering=True)

WEBHOOK_TOKEN = os.environ.get('WEBHOOK_TOKEN', '')
DOCKERHUB_USER = os.environ.get('DOCKERHUB_USER', '')
DOCKERHUB_TOKEN = os.environ.get('DOCKERHUB_TOKEN', '')
# 阿里云 ACR 凭据：国内服务器从 ACR 拉镜像最快（有独立 registry 主机，走 daemon 直连，
# 无公共加速器 429/403 问题）。ACR_IMAGE 是基础镜像名（不带 tag/digest）。
ACR_USERNAME = os.environ.get('ACR_USERNAME', '')
ACR_PASSWORD = os.environ.get('ACR_PASSWORD', '')
ACR_IMAGE = os.environ.get('ACR_IMAGE', '')
IMAGE_NAME = os.environ.get('IMAGE_NAME', 'yiminger/jadeview_docs:latest')
CONTAINER_NAME = os.environ.get('CONTAINER_NAME', 'docs-site')
# 站点对外端口：重建容器时映射 host:SITE_PORT -> container:80。
# 必须与 docker-compose.yml 里 docs 服务端口、以及反代指向端口一致；默认 8088。
SITE_PORT = int(os.environ.get('SITE_PORT', '8088'))

# 拉镜像加速器回退列表（逗号分隔，只写主机名、不带 scheme）。
# 拉取顺序为「daemon 默认(直连/daemon.json 里的 registry-mirrors) → 本列表逐个」，
# 命中 429/超时先退避重试，仍失败自动换下一个源；拉到后重打成 IMAGE_NAME 规范标签。
# 国内公共加速器时常失效，失效了改这里(或 compose 的 PULL_MIRRORS 环境变量)即可，无需动代码。
PULL_MIRRORS = os.environ.get(
    'PULL_MIRRORS',
    'docker.1ms.run,docker.m.daocloud.io,docker.1panel.live,hub.rat.dev',
)
PULL_RETRIES = int(os.environ.get('PULL_RETRIES', '3'))

ALLOWED_PATHS = {'/webhook/deploy', '/health'}


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        if path not in ALLOWED_PATHS:
            logger.warning(f"拦截非法请求: {method} {path} from {request.client.host}")
            return JSONResponse(status_code=404, content={'error': 'Not Found'})
        if path == '/webhook/deploy' and method != 'POST':
            return JSONResponse(status_code=405, content={'error': 'Method Not Allowed'})
        if path == '/health' and method != 'GET':
            return JSONResponse(status_code=405, content={'error': 'Method Not Allowed'})
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 50)
    logger.info("Webhook 服务器启动 (FastAPI)")
    logger.info(f"镜像: {IMAGE_NAME}")
    logger.info(f"容器: {CONTAINER_NAME}  端口: {SITE_PORT} -> 80")
    logger.info(f"Docker Hub 用户: {DOCKERHUB_USER or '未配置'}")
    logger.info(f"阿里云 ACR: {ACR_IMAGE or '未配置'}  用户: {ACR_USERNAME or '未配置'}")
    logger.info(f"拉镜像顺序: ACR -> docker.io 加速器 {PULL_MIRRORS}")
    logger.info("端点: POST /webhook/deploy")
    logger.info("=" * 50)
    yield
    logger.info("Webhook 服务器关闭")


app = FastAPI(title="Webhook Server", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
app.add_middleware(SecurityMiddleware)


def verify_token(token: str) -> bool:
    if not token or not WEBHOOK_TOKEN:
        return False
    return hmac.compare_digest(token, WEBHOOK_TOKEN)


def _split_image(image: str):
    """把镜像引用拆成 (repo, tag_or_digest, is_digest)。

    支持三种形式：
      - 'yiminger/jadeview_docs:latest'              → repo=…/jadeview_docs,     ref='latest',        is_digest=False
      - 'crpi-xxx.acr.aliyuncs.com/x/docs@sha256:deadbeef' → repo=.../docs,      ref='sha256:deadbeef', is_digest=True
      - 'crpi-xxx.acr.aliyuncs.com/x/docs'            → repo=…/docs,             ref='latest',        is_digest=False

    CI 现在优先传 digest 形式——避免两个并发 workflow 同时 push :latest 时，
    webhook 收到请求时 latest 标签已被后一条 run 覆盖，pull 拉到错内容。
    """
    # digest 形式：@sha256:<hex>（优先级高于 tag，防止 @sha256:...:64 被当作 tag 分隔错）
    if '@sha256:' in image:
        repo, digest = image.rsplit('@', 1)
        return repo, digest, True
    last = image.rsplit('/', 1)[-1]
    if ':' in last:
        repo, tag = image.rsplit(':', 1)
    else:
        repo, tag = image, 'latest'
    return repo, tag, False


def _is_transient(err_msg: str) -> bool:
    """判断是否为可退避重试的临时错误（限流/超时），而非镜像不存在等硬错误。"""
    m = err_msg.lower()
    return any(k in m for k in ('429', 'too many requests', 'timeout',
                                'deadline', 'temporarily', 'connection',
                                'i/o timeout', 'reset by peer'))


def _pull_with_progress(client, repository: str, tag: str | None = None):
    """流式拉镜像并周期打印进度，返回拉到的镜像对象。

    docker-py 的 images.pull() 是静默阻塞的——大镜像（几百 MB）在慢速链路上
    下载十几分钟毫无日志输出，看起来像卡死。改为消费 /images/create 的事件流，
    每 20s 打一行「N/M 层就绪 + 活跃层字节数」，让下载进度可见。
    error 事件抛异常，交由外层 pull_image 的重试/换源逻辑处理。
    """
    last_log = time.monotonic()
    layers = {}  # layer_id -> (status, progressDetail)
    stream = client.api.pull(repository, tag=tag, stream=True)
    for raw in stream:
        evt = json.loads(raw) if isinstance(raw, (str, bytes)) else raw
        if 'error' in evt:
            raise RuntimeError(evt['error'])
        lid = evt.get('id')
        if lid:
            layers[lid] = (evt.get('status', ''), evt.get('progressDetail') or {})
        now = time.monotonic()
        if now - last_log >= 20:
            last_log = now
            done = sum(1 for s, _ in layers.values() if s in ('Already exists', 'Pull complete'))
            active = [
                f"{lid[:12]} {s} {d.get('current', 0) >> 20}/{d.get('total', 0) >> 20}MB"
                for lid, (s, d) in layers.items()
                if s in ('Downloading', 'Extracting', 'Download complete') and d.get('total')
            ]
            suffix = f"，进行中: {'; '.join(active[:3])}" if active else ''
            logger.info(f"拉取进度: {done}/{len(layers)} 层就绪{suffix}")
    if tag and tag.startswith('sha256:'):
        return client.images.get(f"{repository}@{tag}")
    return client.images.get(f"{repository}:{tag}" if tag else repository)


def pull_image(client, image: str):
    """按「ACR 主镜像 → docker.io 加速器」顺序拉镜像。

    阿里云 ACR 有独立 registry 主机（crpi-xxx...aliyuncs.com），在国内走 daemon 直连
    速度最快，作为第一候选；仅当目标是 docker.io 的 tag 时才追加公共加速器前缀。
    429/超时退避重试，全部失败才抛异常——此时调用方不会拆旧容器，站点保持在线。
    """
    repo, ref, is_digest = _split_image(image)

    # repo 首段含 '.' 视为自带 registry 主机（acr/dockerhub），只走 daemon 直连——
    # 公共加速器只代理 docker.io，加前缀反而 404/403。无 registry 主机的才是 docker.io。
    is_dockerio = '.' not in repo.split('/', 1)[0]

    last_err = None
    if is_digest:
        # digest 是 registry 绑定的不可变引用，不能走 docker.io 前缀加速器
        prefixes = ['']  # daemon 默认（直连 / daemon.json 里的 registry-mirrors）
    elif is_dockerio:
        prefixes = ['']
        for m in PULL_MIRRORS.split(','):
            m = m.strip().rstrip('/')
            if m and m not in prefixes:
                prefixes.append(m)
    else:
        prefixes = ['']  # acr 等独立 registry：直连

    for prefix in prefixes:
        if prefix:
            pull_repo = f"{prefix}/{repo}"
            source = prefix
        else:
            pull_repo = repo
            source = 'ACR' if not is_dockerio else 'daemon 默认'
        for attempt in range(1, PULL_RETRIES + 1):
            try:
                logger.info(f"拉取镜像: {repo}{'@' if is_digest else ':'}{ref}  (源: {source}, 第 {attempt}/{PULL_RETRIES} 次)")
                img = _pull_with_progress(client, pull_repo, ref)
                # 统一回打主 repo:latest 标准标签，兼容后续 containers.run(image) 启动语义。
                if is_digest or prefix:
                    img.tag(repo, 'latest')
                    logger.info(f"已重打标准标签: {repo}:latest")
                logger.info("镜像拉取成功")
                return
            except Exception as e:
                last_err = e
                msg = str(e)
                logger.warning(f"拉取失败（源: {source}）: {msg}")
                if _is_transient(msg) and attempt < PULL_RETRIES:
                    backoff = min(5 * attempt, 15)
                    logger.info(f"临时错误，{backoff}s 后重试…")
                    time.sleep(backoff)
                    continue
                break  # 硬错误或本源重试用尽 → 换下一个源
    raise RuntimeError(f"所有镜像源均拉取失败，最后错误: {last_err}")


def do_deploy(data: dict):
    logger.info("=" * 50)
    logger.info(f"开始部署: {data.get('repository', 'unknown')}")
    commit = data.get('commit', '')
    logger.info(f"Commit: {commit[:8] if commit else 'unknown'}")
    # 镜像选择：
    #   1) 优先请求体 image（CI 传 digest，如 crpi-xxx...aliyuncs.com/jadeview_docs/jadeview_docs@sha256:abc）
    #      —— 不可变引用，保证 pull 的就是本次构建，不被并发 run 的 latest 覆盖。
    #   2) 次选请求体 image_tag（CI 同时传，如 crpi-xxx...aliyuncs.com/jadeview_docs/jadeview_docs:latest）
    #      —— 老版 webhook 没做 digest 兼容时的兜底。
    #   3) 最后兜底环境变量 IMAGE_NAME（docker.io 域名，兼容最老调用方）。
    pull_image_ref = data.get('image') or data.get('image_tag') or IMAGE_NAME
    # containers.run() 不支持 image@digest；但 pull_image 成功后已经把标准标签
    # repo:latest 打回，run 阶段用 image_tag/latest 即可（层完全一致，id 相同），
    # 不会出现"pull 了 digest 但 run 时拉了另一个 latest"的 race。
    run_image_ref = data.get('image_tag') or IMAGE_NAME
    if data.get('digest'):
        logger.info(f"构建 digest: {data['digest']}")
    logger.info(f"拉取镜像: {pull_image_ref}")
    logger.info(f"启动镜像: {run_image_ref}")
    logger.info("=" * 50)

    try:
        client = docker.from_env()

        if DOCKERHUB_USER and DOCKERHUB_TOKEN:
            logger.info(f"登录 Docker Hub: {DOCKERHUB_USER}")
            try:
                client.login(username=DOCKERHUB_USER, password=DOCKERHUB_TOKEN)
                logger.info("登录成功")
            except Exception as e:
                logger.warning(f"登录失败（继续尝试拉取公开镜像）: {e}")

        # 阿里云 ACR 私有包登录：CI 同时推送到 ACR_IMAGE，国内服务器优先从 ACR 直连拉取
        # （速度快）。配置了 ACR_USERNAME/ACR_PASSWORD（访问凭证）就在拉取前登录，
        # 凭据写入 docker config，pull 时自动携带。
        if ACR_USERNAME and ACR_PASSWORD and ACR_IMAGE:
            acr_host = ACR_IMAGE.split('/', 1)[0]
            logger.info(f"登录阿里云 ACR: {acr_host} ({ACR_USERNAME})")
            try:
                client.login(username=ACR_USERNAME, password=ACR_PASSWORD, registry=acr_host)
                logger.info("ACR 登录成功")
            except Exception as e:
                logger.warning(f"ACR 登录失败: {e}")
        elif 'aliyuncs.com' in pull_image_ref:
            logger.warning("目标镜像在阿里云 ACR 但未配置 ACR_USERNAME/ACR_PASSWORD，"
                           "匿名拉取私有包将失败")

        pull_image(client, pull_image_ref)

        try:
            old = client.containers.get(CONTAINER_NAME)
            logger.info(f"停止旧容器: {CONTAINER_NAME}")
            old.stop(timeout=30)
            old.remove()
            logger.info("旧容器已移除")
        except docker.errors.NotFound:
            logger.info("旧容器不存在，跳过")
        except Exception as e:
            logger.error(f"移除旧容器出错: {e}")
            try:
                old.remove(force=True)
            except Exception:
                pass

        logger.info(f"启动新容器: {CONTAINER_NAME}  (host {SITE_PORT} -> container 80)")
        container = client.containers.run(
            run_image_ref,
            name=CONTAINER_NAME,
            detach=True,
            restart_policy={'Name': 'unless-stopped'},
            ports={'80/tcp': SITE_PORT},
        )
        logger.info(f"新容器已启动: {container.id[:12]}")

        try:
            client.images.prune()
            logger.info("无用镜像已清理")
        except Exception:
            pass

        logger.info("部署成功!")
    except Exception as e:
        logger.error(f"部署失败: {e}")
        logger.error(traceback.format_exc())


@app.post("/webhook/deploy")
async def deploy(request: Request, background_tasks: BackgroundTasks):
    token = request.headers.get('X-Webhook-Token', '')
    if not verify_token(token):
        logger.warning(f"Token 验证失败: {request.client.host}")
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        data = await request.json()
    except Exception:
        data = {}
    logger.info(f"收到部署请求: {data.get('repository', 'unknown')} from {request.client.host}")
    background_tasks.add_task(do_deploy, data)
    return JSONResponse(status_code=202, content={'status': 'accepted', 'message': '部署请求已接收'})


@app.get("/health")
async def health():
    return {'status': 'ok'}


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=9000, log_level='info')
