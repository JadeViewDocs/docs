#!/usr/bin/env python3
"""
Webhook 服务器 - 使用 FastAPI
接收 GitHub Actions 的部署通知，异步执行部署
"""

import os
import sys
import hmac
import logging
import traceback
from contextlib import asynccontextmanager
import docker
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

# 配置日志 - 确保立即输出
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# 强制 stdout 不缓冲
sys.stdout.reconfigure(line_buffering=True)

# 从环境变量读取配置
WEBHOOK_TOKEN = os.environ.get('WEBHOOK_TOKEN', '')
DOCKERHUB_USER = os.environ.get('DOCKERHUB_USER', '')
DOCKERHUB_TOKEN = os.environ.get('DOCKERHUB_TOKEN', '')
IMAGE_NAME = os.environ.get('IMAGE_NAME', '')
CONTAINER_NAME = os.environ.get('CONTAINER_NAME', 'docs-site')

# 允许的路径白名单
ALLOWED_PATHS = {'/webhook/deploy', '/health'}


class SecurityMiddleware(BaseHTTPMiddleware):
    """安全中间件 - 拦截非法请求"""
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        
        # 只允许白名单路径
        if path not in ALLOWED_PATHS:
            logger.warning(f"拦截非法请求: {method} {path} from {request.client.host}")
            return JSONResponse(status_code=404, content={'error': 'Not Found'})
        
        # 检查请求方法
        if path == '/webhook/deploy' and method != 'POST':
            return JSONResponse(status_code=405, content={'error': 'Method Not Allowed'})
        
        if path == '/health' and method != 'GET':
            return JSONResponse(status_code=405, content={'error': 'Method Not Allowed'})
        
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    logger.info("=" * 50)
    logger.info("Webhook 服务器启动 (FastAPI)")
    logger.info(f"镜像: {IMAGE_NAME}")
    logger.info(f"容器: {CONTAINER_NAME}")
    logger.info(f"Docker Hub 用户: {DOCKERHUB_USER or '未配置'}")
    logger.info("端点: POST /webhook/deploy")
    logger.info("=" * 50)
    yield
    logger.info("Webhook 服务器关闭")


# 禁用所有文档
app = FastAPI(
    title="Webhook Server",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan
)

app.add_middleware(SecurityMiddleware)


def verify_token(token: str) -> bool:
    """验证 Webhook Token"""
    if not token or not WEBHOOK_TOKEN:
        return False
    return hmac.compare_digest(token, WEBHOOK_TOKEN)


def do_deploy(data: dict):
    """执行实际的部署操作"""
    logger.info("=" * 50)
    logger.info(f"开始部署: {data.get('repository', 'unknown')}")
    commit = data.get('commit', '')
    logger.info(f"Commit: {commit[:8] if commit else 'unknown'}")
    logger.info("=" * 50)

    try:
        logger.info("连接 Docker...")
        client = docker.from_env()
        logger.info("Docker 连接成功")

        # 登录 Docker Hub
        if DOCKERHUB_USER and DOCKERHUB_TOKEN:
            logger.info(f"登录 Docker Hub: {DOCKERHUB_USER}")
            try:
                client.login(username=DOCKERHUB_USER, password=DOCKERHUB_TOKEN)
                logger.info("登录成功")
            except Exception as e:
                logger.warning(f"登录失败（继续尝试拉取公开镜像）: {e}")

        # 拉取新镜像
        logger.info(f"拉取镜像: {IMAGE_NAME}")
        client.images.pull(IMAGE_NAME)
        logger.info("镜像拉取成功")

        # 停止并删除旧容器
        try:
            old_container = client.containers.get(CONTAINER_NAME)
            logger.info(f"停止旧容器: {CONTAINER_NAME}")
            old_container.stop(timeout=30)
            logger.info("旧容器已停止")
            old_container.remove()
            logger.info("旧容器已删除")
        except docker.errors.NotFound:
            logger.info("旧容器不存在，跳过")
        except Exception as e:
            logger.error(f"停止旧容器时出错: {e}")
            try:
                old_container.remove(force=True)
                logger.info("旧容器已强制删除")
            except Exception as e2:
                logger.error(f"强制删除失败: {e2}")

        # 启动新容器
        logger.info(f"启动新容器: {CONTAINER_NAME}")
        container = client.containers.run(
            IMAGE_NAME,
            name=CONTAINER_NAME,
            detach=True,
            restart_policy={'Name': 'unless-stopped'},
            ports={'80/tcp': 8080},
            labels={'createdBy': '1Panel'}
        )
        logger.info(f"新容器已启动: {container.id[:12]}")

        # 清理未使用的镜像
        try:
            client.images.prune()
            logger.info("旧镜像已清理")
        except:
            pass

        logger.info("=" * 50)
        logger.info("部署成功!")
        logger.info("=" * 50)

    except Exception as e:
        logger.error("=" * 50)
        logger.error(f"部署失败: {e}")
        logger.error(traceback.format_exc())
        logger.error("=" * 50)


@app.post("/webhook/deploy")
async def deploy(request: Request, background_tasks: BackgroundTasks):
    """处理部署请求"""
    token = request.headers.get('X-Webhook-Token', '')
    if not verify_token(token):
        logger.warning(f"Token 验证失败: {request.client.host}")
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        data = await request.json()
    except:
        data = {}

    logger.info(f"收到部署请求: {data.get('repository', 'unknown')} from {request.client.host}")

    # 添加后台任务
    background_tasks.add_task(do_deploy, data)

    return JSONResponse(
        status_code=202,
        content={'status': 'accepted', 'message': '部署请求已接收'}
    )


@app.get("/health")
async def health():
    """健康检查"""
    return {'status': 'ok'}


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=9000, log_level='info')
