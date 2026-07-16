# SurveyGo — 在线问卷调查系统

> 一个轻量级的在线问卷调查平台。创建问卷、分享链接、回收答卷、查看统计，全流程覆盖。



**线上地址：**
- 🔗 直达：[https://surveygo.vercel.app](https://surveygo.vercel.app)

- 🖥️ 前端：[surveygo.vercel.app](https://surveygo.vercel.app)
- 🔌 后端：[API 健康检查](https://surveygo-production.up.railway.app/api/health)
- 📂 GitHub：[A1sOw8y/SurveyGo](https://github.com/A1sOw8y/SurveyGo)
---

## 项目介绍

SurveyGo 是一个"创建 → 分发 → 填写 → 统计"全流程的在线问卷调查系统，类似于简易版的问卷星。

**核心功能：**
- 🔐 用户注册/登录，基于 JWT 令牌认证
- 📝 创建问卷：支持单选、多选、简答三种题型，可增删题目和选项
- 🔗 发布后生成分享链接，任何人无需登录即可填写
- 📊 实时统计：选择题用柱状图展示分布，简答题列出所有回答
- 🎨 响应式 UI，适配桌面和移动端

---

## 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 前端 | Next.js 14 (App Router) + TypeScript + Tailwind CSS | 服务端渲染 + 客户端交互 |
| 后端 | Flask 3.x + SQLAlchemy + PyJWT + bcrypt | RESTful API，JWT 认证 |
| 数据库 | MySQL 8.0 | 关系型数据存储 |
| AI 工具 | Claude Code + DeepSeek API | AI 辅助编程 |
| 部署 | Vercel（前端）+ Railway（后端 + MySQL） | 免费云部署 |

---

## 项目结构

```
SurveyGo/
├── frontend/                    # Next.js 前端
│   ├── src/
│   │   ├── app/                 # 页面路由（App Router）
│   │   │   ├── page.tsx             # 首页（项目介绍 + 公开问卷）
│   │   │   ├── login/page.tsx       # 登录页
│   │   │   ├── register/page.tsx    # 注册页
│   │   │   ├── create/page.tsx      # 创建问卷页
│   │   │   ├── survey/[id]/page.tsx # 问卷填写页（公开）
│   │   │   └── my/page.tsx          # 个人中心（我的问卷 + 统计）
│   │   ├── components/          # UI 组件
│   │   │   ├── Navbar.tsx           # 导航栏
│   │   │   ├── SurveyCard.tsx       # 问卷卡片
│   │   │   ├── SurveyForm.tsx       # 问卷填写表单
│   │   │   ├── QuestionEditor.tsx   # 题目编辑器
│   │   │   └── StatsPanel.tsx       # 统计面板
│   │   └── lib/                 # 工具函数
│   │       ├── api.ts               # API 请求封装
│   │       └── auth.ts              # JWT 存储管理
│   └── package.json
│
├── backend/                     # Flask 后端
│   ├── app/
│   │   ├── __init__.py          # Flask 工厂函数 + 自动建表
│   │   ├── models.py            # 数据库模型（5 张表）
│   │   ├── auth.py              # JWT 签发/校验 + bcrypt 密码加密
│   │   ├── config.py            # 环境变量配置
│   │   └── routes/
│   │       ├── auth_routes.py       # 注册 / 登录
│   │       ├── survey_routes.py     # 问卷 CRUD + 提交 + 统计
│   │       └── user_routes.py       # 我的问卷 + 发布/关闭
│   ├── requirements.txt
│   └── run.py
│
├── database/
│   └── init.sql                 # 数据库建表脚本
│
├── docs/                        # 文档
│   ├── API文档.md               # 接口文档（12 个接口）
│   ├── prompt_log.md            # AI 对话日志（19 条 Prompt）
│   └── AI代码审查报告.md         # AI Code Review 报告（27 条建议）
│
└── 指令对话截图包/               # AI 对话截图
```

---

## 前端路由

| 路由 | 页面 | 说明 | 需登录 |
|---|---|---|---|
| `/` | 首页 | 项目介绍 + 公开问卷列表 + 搜索 | 否 |
| `/login` | 登录 | 用户名 + 密码登录 | 否 |
| `/register` | 注册 | 用户名 + 密码注册 | 否 |
| `/create` | 创建问卷 | 设置标题、描述、增删题目 | 是 |
| `/survey/[id]` | 填写问卷 | 公开页，拿到链接就能填 | 否 |
| `/my` | 我的问卷 | 问卷列表、发布/关闭、查看统计 | 是 |

## 后端 API

> 共 12 个接口，完整文档见 [API文档.md](API文档.md)

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/auth/register` | 无 | 用户注册 |
| POST | `/api/auth/login` | 无 | 用户登录 |
| GET | `/api/surveys` | 无 | 公开问卷列表（分页+搜索） |
| GET | `/api/surveys/<id>` | 无 | 问卷详情（含题目） |
| POST | `/api/surveys/<id>/submit` | 无 | 提交答卷 |
| POST | `/api/surveys` | JWT | 创建问卷 |
| PUT | `/api/surveys/<id>` | JWT | 编辑问卷 |
| DELETE | `/api/surveys/<id>` | JWT | 删除问卷 |
| GET | `/api/surveys/<id>/stats` | JWT | 统计数据 |
| GET | `/api/user/surveys` | JWT | 我的问卷列表 |
| GET | `/api/user/surveys/<id>` | JWT | 我的问卷详情 |
| PUT | `/api/user/surveys/<id>/publish` | JWT | 发布/关闭问卷 |

---

## 数据库设计

5 张表，关系如下：

```
users 1 ── N surveys          用户创建多份问卷
surveys 1 ── N questions      一份问卷包含多道题
surveys 1 ── N responses      一份问卷有多份答卷
responses 1 ── N answers      一份答卷包含多个答案
questions 1 ── N answers      每道题对应多个答案记录
```

题目选项使用 JSON 字段存储，选择题结构示例：
```json
[{"id": "o1", "text": "选项A"}, {"id": "o2", "text": "选项B"}]
```

---

## 本地运行指南

### 环境要求

- Node.js 18+
- Python 3.10+
- MySQL 8.0+

### 1. 克隆项目

```bash
git clone https://github.com/A1sOw8y/SurveyGo.git
cd SurveyGo
```

### 2. 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

### 3. 启动后端

```bash
cd backend
cp .env.example .env          # 编辑 .env，填入你的数据库密码
pip install -r requirements.txt
python run.py                  # 启动在 http://localhost:5000
```

### 4. 启动前端

```bash
cd frontend
cp .env.local.example .env.local  # 或直接使用默认 localhost:5000
npm install
npm run dev                       # 启动在 http://localhost:3000
```

### 5. 使用

浏览器打开 http://localhost:3000，注册账号，创建问卷，发布后复制链接即可分享。

---

## 环境变量说明

### 后端 (.env)

| 变量 | 说明 | 示例 |
|---|---|---|
| `DB_HOST` | 数据库地址 | `localhost` |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_USER` | 数据库用户名 | `root` |
| `DB_PASSWORD` | 数据库密码 | `123654` |
| `DB_NAME` | 数据库名称 | `surveygo` |
| `JWT_SECRET` | JWT 签名密钥 | 随机字符串 |
| `JWT_EXPIRATION_HOURS` | Token 有效期（小时） | `72` |

### 前端 (.env.local)

| 变量 | 说明 | 示例 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `http://localhost:5000` |

---

## AI 辅助编程说明

本项目使用 **Claude Code**（通过 DeepSeek API）作为 AI 编程助手进行开发。开发过程中共记录了 19 条 Prompt，覆盖从数据库设计、后端 API、前端页面到线上部署的全流程。详细的 Prompt 日志见 [prompt_log.md](prompt_log.md)。

---

## 部署方案

| 服务 | 平台 | 配置要点 |
|---|---|---|
| 前端 | Vercel | Root Directory: `frontend`，Framework: Next.js |
| 后端 | Railway | Root Directory: `backend`，Builder: Nixpacks |
| 数据库 | Railway MySQL | 通过环境变量连接 |

---

