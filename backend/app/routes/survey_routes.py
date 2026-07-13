"""
问卷蓝图：CRUD、公开查看、提交答卷、统计数据
"""
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, g
from app import db
from app.models import Survey, Question, Response, Answer
from app.auth import login_required

survey_bp = Blueprint("survey", __name__)

# ═══════════════════════════════════════════════
#  公开接口（无需登录）
# ═══════════════════════════════════════════════


# ── GET /api/surveys ── 公开问卷列表（分页+搜索）
@survey_bp.route("", methods=["GET"])
def list_surveys():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)
    keyword = request.args.get("keyword", "").strip()

    q = Survey.query.filter(Survey.status == "published")

    if keyword:
        q = q.filter(Survey.title.contains(keyword))

    pagination = q.order_by(Survey.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
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


# ── GET /api/surveys/<id> ── 问卷详情（含题目，供填写页）
@survey_bp.route("/<int:survey_id>", methods=["GET"])
def get_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    # 仅返回已发布的问卷（创建者本人可通过 /api/user/surveys 看到草稿）
    if survey.status != "published":
        return jsonify({"code": 404, "message": "问卷未发布或不存在"}), 404

    return jsonify({
        "code": 200,
        "data": survey.to_dict(include_questions=True),
    }), 200


# ── POST /api/surveys/<id>/submit ── 提交答卷
@survey_bp.route("/<int:survey_id>/submit", methods=["POST"])
def submit_response(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    if survey.status != "published":
        return jsonify({"code": 400, "message": "问卷未开放填写"}), 400

    if survey.deadline and datetime.now(timezone.utc) > survey.deadline.replace(tzinfo=timezone.utc):
        return jsonify({"code": 400, "message": "问卷已截止"}), 400

    data = request.get_json(silent=True) or {}
    answers_input = data.get("answers") or []

    if not isinstance(answers_input, list) or len(answers_input) == 0:
        return jsonify({"code": 400, "message": "请至少回答一道题"}), 400

    # 校验必答题
    question_map = {q.id: q for q in survey.questions.all()}
    submitted_question_ids = set()
    errors = []

    for ans in answers_input:
        qid = ans.get("question_id")
        submitted_question_ids.add(qid)
        question = question_map.get(qid)

        if not question:
            errors.append(f"题目 id={qid} 不存在")
            continue

        if question.type == "text":
            if question.required and not (ans.get("text_content") or "").strip():
                errors.append(f"「{question.title}」为必填")
        else:
            if question.required and not (ans.get("option_ids") or "").strip():
                errors.append(f"「{question.title}」为必选")

    # 检查必答题是否全部提交
    for qid, q in question_map.items():
        if q.required and qid not in submitted_question_ids:
            errors.append(f"「{q.title}」为必答题，请作答")

    if errors:
        return jsonify({"code": 400, "message": "；".join(errors)}), 400

    # 保存答卷
    response = Response(survey_id=survey.id)
    db.session.add(response)
    db.session.flush()  # 获取 response.id

    for ans in answers_input:
        answer = Answer(
            response_id=response.id,
            question_id=ans.get("question_id"),
            option_ids=ans.get("option_ids", ""),
            text_content=ans.get("text_content", ""),
        )
        db.session.add(answer)

    db.session.commit()

    return jsonify({
        "code": 201,
        "message": "提交成功，感谢您的参与！",
        "data": {"response_id": response.id},
    }), 201


# ═══════════════════════════════════════════════
#  需登录接口
# ═══════════════════════════════════════════════


# ── POST /api/surveys ── 创建问卷
@survey_bp.route("", methods=["POST"])
@login_required
def create_survey():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    questions_input = data.get("questions") or []

    if not title:
        return jsonify({"code": 400, "message": "问卷标题不能为空"}), 400

    survey = Survey(
        title=title,
        description=description,
        creator_id=g.current_user_id,
    )
    db.session.add(survey)
    db.session.flush()  # 获取 survey.id

    # 批量创建题目
    for idx, q in enumerate(questions_input):
        question = Question(
            survey_id=survey.id,
            type=q.get("type", "text"),
            title=(q.get("title") or "").strip(),
            options=q.get("options") if q.get("type") in ("single", "multi") else None,
            sort_order=q.get("sort_order", idx),
            required=q.get("required", True),
        )
        db.session.add(question)

    db.session.commit()

    return jsonify({
        "code": 201,
        "message": "问卷创建成功",
        "data": survey.to_dict(include_questions=True),
    }), 201


# ── PUT /api/surveys/<id> ── 编辑问卷（仅创建者）
@survey_bp.route("/<int:survey_id>", methods=["PUT"])
@login_required
def update_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    if survey.creator_id != g.current_user_id:
        return jsonify({"code": 403, "message": "无权操作此问卷"}), 403

    data = request.get_json(silent=True) or {}
    title = data.get("title")
    description = data.get("description")
    questions_input = data.get("questions")

    if title is not None:
        survey.title = title.strip()
    if description is not None:
        survey.description = description.strip()

    # 更新题目：全量替换（删旧插新）
    if questions_input is not None:
        Question.query.filter_by(survey_id=survey.id).delete()
        for idx, q in enumerate(questions_input):
            question = Question(
                survey_id=survey.id,
                type=q.get("type", "text"),
                title=(q.get("title") or "").strip(),
                options=q.get("options") if q.get("type") in ("single", "multi") else None,
                sort_order=q.get("sort_order", idx),
                required=q.get("required", True),
            )
            db.session.add(question)

    db.session.commit()

    return jsonify({
        "code": 200,
        "message": "问卷更新成功",
        "data": survey.to_dict(include_questions=True),
    }), 200


# ── DELETE /api/surveys/<id> ── 删除问卷（仅创建者）
@survey_bp.route("/<int:survey_id>", methods=["DELETE"])
@login_required
def delete_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    if survey.creator_id != g.current_user_id:
        return jsonify({"code": 403, "message": "无权操作此问卷"}), 403

    db.session.delete(survey)
    db.session.commit()

    return jsonify({"code": 200, "message": "问卷已删除"}), 200


# ── GET /api/surveys/<id>/stats ── 统计数据（仅创建者）
@survey_bp.route("/<int:survey_id>/stats", methods=["GET"])
@login_required
def get_stats(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    if survey.creator_id != g.current_user_id:
        return jsonify({"code": 403, "message": "无权查看此数据"}), 403

    total_responses = survey.responses.count()
    stats = []

    for question in survey.questions.all():
        item = {
            "question_id": question.id,
            "title": question.title,
            "type": question.type,
        }

        if question.type in ("single", "multi"):
            # 统计每个选项的被选次数
            option_counts = {}
            for opt in (question.options or []):
                option_counts[opt["id"]] = {"text": opt["text"], "count": 0}

            for answer in Answer.query.filter_by(question_id=question.id).all():
                if answer.option_ids:
                    for oid in answer.option_ids.split(","):
                        oid = oid.strip()
                        if oid in option_counts:
                            option_counts[oid]["count"] += 1

            item["options"] = [
                {
                    "id": oid,
                    "text": v["text"],
                    "count": v["count"],
                    "percentage": round(v["count"] / total_responses * 100, 1) if total_responses > 0 else 0,
                }
                for oid, v in option_counts.items()
            ]
        else:
            # 简答题：返回所有文本答案列表
            item["answers"] = [
                {"id": ans.id, "content": ans.text_content or ""}
                for ans in Answer.query.filter_by(question_id=question.id).all()
            ]

        stats.append(item)

    return jsonify({
        "code": 200,
        "data": {
            "total_responses": total_responses,
            "stats": stats,
        },
    }), 200
