#!/usr/bin/env python3
"""
Webhook 服务器 - 接收 GitHub Actions 的部署通知
使用 Docker Hub 作为镜像仓库
"""

import os
import hmac
import traceback
import docker
from flask import Flask, request, jsonify

app = Flask(__name__)

# 从环境变量读取配置
WEBHOOK_TOKEN = os.environ.get('WEBHOOK_TOKEN', '')
DOCKERHUB_USER = os.environ.get('DOCKERHUB_USER', '')
DOCKERHUB_TOKEN = os.environ.get('DOCKERHUB_TOKEN', '')
IMAGE_NAME = os.environ.get('IMAGE_NAME', '')
CONTAINER_NAME = os.environ.get('CONTAINER_NAME', 'docs-site')


def verify_token(token):
    """验证 Webhook Token"""
    if not token or not WEBHOOK_TOKEN:
        return False
    return hmac.compare_digest(token, WEBHOOK_TOKEN)


@app.route('/webhook/deploy', methods=['POST'])
def deploy():
    """处理部署请求"""
    # 验证 Token
    token = request.headers.get('X-Webhook-Token', '')
    if not verify_token(token):
        print("Token 验证失败")
        return jsonify({'error': 'Invalid token'}), 401

    data = request.get_json() or {}
    print(f"收到部署请求: {data.get('repository', 'unknown')}")
    print(f"Commit: {data.get('commit', 'unknown')[:8]}")

    try:
        client = docker.from_env()

        # 登录 Docker Hub（可选，公开镜像不需要）
        if DOCKERHUB_USER and DOCKERHUB_TOKEN:
            print(f"登录 Docker Hub: {DOCKERHUB_USER}")
            try:
                client.login(username=DOCKERHUB_USER, password=DOCKERHUB_TOKEN)
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
            # 强制删除
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

        print("=" * 30)
        print("部署成功!")
        print("=" * 30)
        return jsonify({'status': 'success', 'message': '部署成功'})

    except Exception as e:
        error_msg = str(e)
        print("=" * 30)
        print(f"部署失败: {error_msg}")
        print("详细错误:")
        traceback.print_exc()
        print("=" * 30)
        return jsonify({'status': 'error', 'message': error_msg}), 500


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    print("=" * 50)
    print("Webhook 服务器启动")
    print(f"镜像: {IMAGE_NAME}")
    print(f"容器: {CONTAINER_NAME}")
    print(f"Docker Hub 用户: {DOCKERHUB_USER or '未配置'}")
    print("端点: http://0.0.0.0:9000/webhook/deploy")
    print("=" * 50)
    app.run(host='0.0.0.0', port=9000)
