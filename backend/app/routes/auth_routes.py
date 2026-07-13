"""
用户认证蓝图：注册 / 登录
"""
import re
from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from app.auth import hash_password, check_password, create_token

auth_bp = Blueprint("auth", __name__)

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_一-龥]{2,20}$")


# ── POST /api/auth/register ──
@auth_bp.route("/register", methods=["POST"])
def register():
    """用户注册"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    errors = []
    if not _USERNAME_RE.match(username):
        errors.append("用户名为2-20位字母、数字、下划线或中文")
    if len(password) < 6:
        errors.append("密码至少6位")

    if errors:
        return jsonify({"code": 400, "message": "；".join(errors)}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"code": 409, "message": "用户名已被注册"}), 409

    user = User(
        username=username,
        password_hash=hash_password(password),
    )
    db.session.add(user)
    db.session.commit()

    token = create_token(user.id, user.username)
    return jsonify({
        "code": 201,
        "message": "注册成功",
        "data": {"token": token, "user": user.to_dict()},
    }), 201


# ── POST /api/auth/login ──
@auth_bp.route("/login", methods=["POST"])
def login():
    """用户登录"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"code": 400, "message": "用户名和密码不能为空"}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not check_password(password, user.password_hash):
        return jsonify({"code": 401, "message": "用户名或密码错误"}), 401

    token = create_token(user.id, user.username)
    return jsonify({
        "code": 200,
        "message": "登录成功",
        "data": {"token": token, "user": user.to_dict()},
    }), 200
