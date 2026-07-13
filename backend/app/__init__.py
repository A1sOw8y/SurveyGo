from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# 扩展实例（延迟绑定，在 create_app 中 init_app）
db = SQLAlchemy()


def create_app():
    """Flask 应用工厂函数"""
    app = Flask(__name__)

    # 配置
    app.config.from_object("app.config.Config")

    # 扩展初始化
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    db.init_app(app)

    # 注册蓝图
    from app.routes.auth_routes import auth_bp
    from app.routes.survey_routes import survey_bp
    from app.routes.user_routes import user_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(survey_bp, url_prefix="/api/surveys")
    app.register_blueprint(user_bp, url_prefix="/api/user")

    # 健康检查
    @app.route("/api/health")
    def health():
        return {"code": 200, "message": "ok"}

    return app
