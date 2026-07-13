"""
用户蓝图：我的问卷列表、发布/关闭问卷
"""
from flask import Blueprint, request, jsonify, g
from app import db
from app.models import Survey
from app.auth import login_required

user_bp = Blueprint("user", __name__)


# ── GET /api/user/surveys ── 我的问卷列表（含草稿）
@user_bp.route("/surveys", methods=["GET"])
@login_required
def my_surveys():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)

    pagination = (
        Survey.query
        .filter_by(creator_id=g.current_user_id)
        .order_by(Survey.updated_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        "code": 200,
        "data": {
            "items": [s.to_dict() for s in pagination.items],
            "total": pagination.total,
            "page": page,
            "per_page": per_page,
        },
    }), 200


# ── GET /api/user/surveys/<id> ── 查看自己某个问卷的详情（含题目和统计）
@user_bp.route("/surveys/<int:survey_id>", methods=["GET"])
@login_required
def my_survey_detail(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    if survey.creator_id != g.current_user_id:
        return jsonify({"code": 403, "message": "无权查看此问卷"}), 403

    return jsonify({
        "code": 200,
        "data": survey.to_dict(include_questions=True),
    }), 200


# ── PUT /api/user/surveys/<id>/publish ── 发布/关闭问卷
@user_bp.route("/surveys/<int:survey_id>/publish", methods=["PUT"])
@login_required
def toggle_publish(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    if survey.creator_id != g.current_user_id:
        return jsonify({"code": 403, "message": "无权操作此问卷"}), 403

    data = request.get_json(silent=True) or {}
    action = data.get("action", "publish")  # publish | close

    if action == "publish":
        survey.status = "published"
    elif action == "close":
        survey.status = "closed"
    else:
        return jsonify({"code": 400, "message": "无效操作，action 仅支持 publish 或 close"}), 400

    db.session.commit()

    status_text = {"published": "已发布", "closed": "已关闭"}.get(survey.status, survey.status)
    return jsonify({"code": 200, "message": f"问卷状态已更新为「{status_text}」"}), 200
