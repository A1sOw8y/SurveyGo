"""
JWT 生成、验证与登录装饰器
"""
import functools
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from flask import request, jsonify, g

from app.config import Config


# ── 密码工具 ──
def hash_password(password: str) -> str:
    """对明文密码进行 bcrypt 哈希"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, password_hash: str) -> bool:
    """校验密码是否匹配"""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


# ── JWT 工具 ──
def create_token(user_id: int, username: str) -> str:
    """生成 JWT token"""
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    """解析 JWT token，失败返回 None"""
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ── 登录验证装饰器 ──
def login_required(f):
    """装饰器：要求请求头携带有效的 Authorization: Bearer <token>"""

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

        if not token:
            return jsonify({"code": 401, "message": "请先登录"}), 401

        payload = decode_token(token)
        if payload is None:
            return jsonify({"code": 401, "message": "token 无效或已过期，请重新登录"}), 401

        # 将用户信息存入 Flask g 对象，供后续视图函数使用
        g.current_user_id = payload["user_id"]
        g.current_username = payload["username"]
        return f(*args, **kwargs)

    return decorated
