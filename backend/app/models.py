"""
5 张表的 SQLAlchemy 模型定义
对应 database/init.sql
"""
import uuid
from datetime import datetime, timezone
from app import db


def _new_share_code():
    """生成问卷分享码（16位随机字符串）"""
    return uuid.uuid4().hex[:16]


# ── 1. 用户表 ──
class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username      = db.Column(db.String(50), unique=True, nullable=False)
    email         = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # 关系
    surveys = db.relationship("Survey", backref="creator", lazy="dynamic",
                              cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ── 2. 问卷表 ──
class Survey(db.Model):
    __tablename__ = "surveys"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    creator_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status      = db.Column(db.Enum("draft", "published", "closed"), default="draft")
    share_code  = db.Column(db.String(32), unique=True, default=_new_share_code)
    deadline    = db.Column(db.DateTime, nullable=True)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                            onupdate=lambda: datetime.now(timezone.utc))

    # 关系
    questions = db.relationship("Question", backref="survey", lazy="dynamic",
                                cascade="all, delete-orphan", order_by="Question.sort_order")
    responses = db.relationship("Response", backref="survey", lazy="dynamic",
                                cascade="all, delete-orphan")

    def to_dict(self, include_questions=False):
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "creator_id": self.creator_id,
            "status": self.status,
            "share_code": self.share_code,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "question_count": self.questions.count(),
            "response_count": self.responses.count(),
        }
        if include_questions:
            data["questions"] = [q.to_dict() for q in self.questions.all()]
        return data


# ── 3. 题目表 ──
class Question(db.Model):
    __tablename__ = "questions"

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    survey_id  = db.Column(db.Integer, db.ForeignKey("surveys.id"), nullable=False)
    type       = db.Column(db.Enum("single", "multi", "text"), nullable=False)
    title      = db.Column(db.String(500), nullable=False)
    options    = db.Column(db.JSON, nullable=True)  # [{"id":"o1","text":"选项A"},...]
    sort_order = db.Column(db.Integer, default=0)
    required   = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "survey_id": self.survey_id,
            "type": self.type,
            "title": self.title,
            "options": self.options or [],
            "sort_order": self.sort_order,
            "required": self.required,
        }


# ── 4. 答卷表 ──
class Response(db.Model):
    __tablename__ = "responses"

    id           = db.Column(db.Integer, primary_key=True, autoincrement=True)
    survey_id    = db.Column(db.Integer, db.ForeignKey("surveys.id"), nullable=False)
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # 关系
    answers = db.relationship("Answer", backref="response", lazy="dynamic",
                              cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "survey_id": self.survey_id,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }


# ── 5. 答案明细表 ──
class Answer(db.Model):
    __tablename__ = "answers"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    response_id = db.Column(db.Integer, db.ForeignKey("responses.id"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    option_ids  = db.Column(db.String(200), nullable=True)  # "o1,o3"
    text_content = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "response_id": self.response_id,
            "question_id": self.question_id,
            "option_ids": self.option_ids,
            "text_content": self.text_content,
        }
