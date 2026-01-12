#!/usr/bin/env python3
"""
Webhook 服务器 - 使用 FastAPI
接收 GitHub Actions 的部署通知，异步执行部署
禁用文档，拦截非法请求
"""

import os
import hmac
import traceback
from contextlib import asynccontextmanager
import docker
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

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
            print(f"拦截非法请求: {method} {path} from {request.client.host}")
            return JSONResponse(
                status_code=404,
                content={'error': 'Not Found'}
            )
        
        # 检查请求方法
        if path == '/webhook/deploy' and method != 'POST':
            print(f"拦截非法方法: {method} {path}")
            return JSONResponse(
                status_code=405,
                content={'error': 'Method Not Allowed'}
            )
        
        if path == '/health' and method != 'GET':
            return JSONResponse(
                status_code=405,
                content={'error': 'Method Not Allowed'}
            )
        
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    print("=" * 50)
    print("Webhook 服务器启动 (FastAPI)")
    print(f"镜像: {IMAGE_NAME}")
    print(f"容器: {CONTAINER_NAME}")
    print(f"Docker Hub 用户: {DOCKERHUB_USER or '未配置'}")
    print("端点: POST /webhook/deploy")
    print("健康检查: GET /health")
    print("=" * 50)
    yield
    print("Webhook 服务器关闭")


# 禁用所有文档
app = FastAPI(
    title="Webhook Server",
    docs_url=None,        # 禁用 /docs
    redoc_url=None,       # 禁用 /redoc
    openapi_url=None,     # 禁用 /openapi.json
    lifespan=lifespan
)

# 添加安全中间件
app.add_middleware(SecurityMiddleware)


def verify_token(token: str) -> bool:
    """验证 Webhook Token"""
    if not token or not WEBHOOK_TOKEN:
        return False
    return hmac.compare_digest(token, WEBHOOK_TOKEN)


def do_deploy(data: dict):
    """执行实际的部署操作"""
    print("=" * 50)
    print(f"开始部署: {data.get('repository', 'unknown')}")
    commit = data.get('commit', '')
    print(f"Commit: {commit[:8] if commit else 'unknown'}")
    print("=" * 50)

    try:
        client = docker.from_env()

        # 登录 Docker Hub
        if DOCKERHUB_USER and DOCKERHUB_TOKEN:
            print(f"登录 Docker Hub: {DOCKERHUB_USER}")
            try:
                client.login(username=DOCKERHUB_USER, password=DOCKERHUB_TOKEN)
                print("登录成功")
            except Exception as e:
                print(f"登录失败（继续尝试拉取公开镜像）: {e}")

        # 拉取新镜像
        print(f"拉取镜像: {IMAGE_NAME}")
        client.images.pull(IMAGE_NAME)
        print("镜像拉取成功")

        # 停止并删除旧容器
        try:
            old_container = client.containers.get(CONTAINER_NAME)
            print(f"停止旧容器: {CONTAINER_NAME}")
            old_container.stop(timeout=30)
            print("旧容器已停止")
            old_container.remove()
            print("旧容器已删除")
        except docker.errors.NotFound:
            print("旧容器不存在，跳过")
        except Exception as e:
            print(f"停止旧容器时出错: {e}")
            try:
                old_container.remove(force=True)
                print("旧容器已强制删除")
            except:
                pass

        # 启动新容器
        print(f"启动新容器: {CONTAINER_NAME}")
        container = client.containers.run(
            IMAGE_NAME,
            name=CONTAINER_NAME,
            detach=True,
            restart_policy={'Name': 'unless-stopped'},
            ports={'80/tcp': 8080},
            labels={'createdBy': '1Panel'}
        )
        print(f"新容器已启动: {container.id[:12]}")

        # 清理未使用的镜像
        try:
            client.images.prune()
            print("旧镜像已清理")
        except:
            pass

        print("=" * 50)
        print("部署成功!")
        print("=" * 50)

    except Exception as e:
        print("=" * 50)
        print(f"部署失败: {e}")
        traceback.print_exc()
        print("=" * 50)


@app.post("/webhook/deploy")
async def deploy(request: Request, background_tasks: BackgroundTasks):
    """处理部署请求 - 立即返回，后台执行"""
    # 验证 Token
    token = request.headers.get('X-Webhook-Token', '')
    if not verify_token(token):
        print(f"Token 验证失败: {request.client.host}")
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        data = await request.json()
    except:
        data = {}

    print(f"收到部署请求: {data.get('repository', 'unknown')} from {request.client.host}")

    # 添加后台任务
    background_tasks.add_task(do_deploy, data)

    # 立即返回 202 Accepted
    return JSONResponse(
        status_code=202,
        content={
            'status': 'accepted',
            'message': '部署请求已接收'
        }
    )


@app.get("/health")
async def health():
    """健康检查"""
    return {'status': 'ok'}


if __name__ == '__main__':
    uvicorn.run(
        app,
        host='0.0.0.0',
        port=9000,
        access_log=False  # 禁用 uvicorn 默认访问日志，使用自定义日志
    )
