#!/usr/bin/env python3
"""
Webhook 服务器（FastAPI）——部署在你自己的服务器上。
接收 GitHub Actions 的部署通知（POST /webhook/deploy，校验 X-Webhook-Token），
然后：docker login → 拉取最新镜像 → 停掉并重建站点容器。

配置全部来自环境变量（见 deploy/docker-compose.yml + deploy/.env）。
"""

import os
import sys
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
    logger.info(f"拉镜像回退源: daemon 默认 -> {PULL_MIRRORS}")
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
      - 'ghcr.io/jadeviewdocs/docs@sha256:deadbeef'  → repo=ghcr.io/…/docs,     ref='sha256:deadbeef', is_digest=True
      - 'ghcr.io/jadeviewdocs/docs'                  → repo=ghcr.io/…/docs,     ref='latest',        is_digest=False

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


def pull_image(client, image: str):
    """按「daemon 默认 → 各加速器」顺序拉镜像；429/超时退避重试，仍失败换下一个源。

    走加速器前缀拉到后，重新打成 image 规范标签，后续按 IMAGE_NAME 起容器不受影响。
    带 registry 主机的镜像（如 ghcr.io/...）只走 daemon 默认直连——公共加速器只代理 docker.io，
    加前缀反而 404/403；ghcr 国内直连可达。
    全部失败才抛异常——此时调用方不会拆旧容器，站点保持在线。
    """
    repo, ref, is_digest = _split_image(image)

    # repo 首段含 '.' 视为带 registry 主机（ghcr.io 等），跳过 docker.io 加速器
    has_registry = '.' in repo.split('/', 1)[0]

    # digest 是 registry 绑定的不可变引用，不能走 docker.io 前缀加速器
    # （加速器只代理 docker.io，前缀会命中 404/403）。digest 始终走 daemon 默认直连。
    candidates = ['']  # daemon 默认（直连 / daemon.json 里配置的 registry-mirrors）
    if not has_registry and not is_digest:
        for m in PULL_MIRRORS.split(','):
            m = m.strip().rstrip('/')
            if m and m not in candidates:
                candidates.append(m)

    # digest 引用分隔符是 @；tag 是 :
    sep = '@' if is_digest else ':'

    last_err = None
    for prefix in candidates:
        if prefix:
            candidate_ref = f"{prefix}/{repo}{sep}{ref}"
        else:
            candidate_ref = f"{repo}{sep}{ref}"
        source = prefix or 'daemon 默认'
        for attempt in range(1, PULL_RETRIES + 1):
            try:
                logger.info(f"拉取镜像: {candidate_ref}  (源: {source}, 第 {attempt}/{PULL_RETRIES} 次)")
                # docker-py 的 images.pull(image=repo, tag=tag) 形式对 digest 不适用；
                # digest/ref 直接拼成完整字符串走单参数 pull（docker SDK 支持 repo@digest）。
                if is_digest:
                    img = client.images.pull(candidate_ref)
                elif prefix:
                    img = client.images.pull(f"{prefix}/{repo}", tag=ref)
                else:
                    img = client.images.pull(repo, tag=ref)
                # 不论 digest/tag，最后都打一份 repo:latest 的标准标签，
                # 兼容后续 client.containers.run(image) 用 image_tag/latest 启动旧语义。
                if prefix or is_digest:
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
    #   1) 优先请求体 image（CI 传 digest，如 ghcr.io/jadeviewdocs/docs@sha256:abc）
    #      —— 不可变引用，保证 pull 的就是本次构建，不被并发 run 的 latest 覆盖。
    #   2) 次选请求体 image_tag（CI 同时传，如 ghcr.io/jadeviewdocs/docs:latest）
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
