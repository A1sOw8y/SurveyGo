# AI 代码审查报告 — SurveyGo 在线问卷调查系统

> **审查工具：** Claude Code  
> **审查范围：** 后端 Flask（8 个文件）+ 前端 Next.js（14 个文件）  
> **审查日期：** 2026 年 7 月 16 日

---

## 一、审查总览

| 维度 | 评分 | 说明 |
|---|---|---|
| 功能完整性 | ⭐⭐⭐⭐⭐ | 12 个 API + 5 个路由，全链路跑通 |
| 代码结构 | ⭐⭐⭐⭐ | 前后端分离清晰，目录合理 |
| 安全性 | ⭐⭐⭐ | 基本鉴权到位，有加固空间 |
| 健壮性 | ⭐⭐⭐ | 基础校验完善，存在边缘遗漏 |
| 可维护性 | ⭐⭐⭐⭐ | 命名规范统一，可读性好 |

**总体评价：** 项目功能完整、结构清晰，代码质量在实训项目中属于上乘。以下按严重程度列出发现的问题与优化建议。

---

## 二、🔴 严重问题（必须修复）

### 1. 缺少全局错误边界（Error Boundary）

**文件：** 所有前端页面

**问题描述：** 项目中没有任何 React Error Boundary 组件。一旦某个组件渲染时抛出 JavaScript 异常，整个页面会崩溃白屏，没有任何恢复机制。

**修改建议：** 创建一个错误边界组件，包裹在根布局中：
```tsx
// frontend/src/components/ErrorBoundary.tsx
"use client";
import { Component, ReactNode } from "react";

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">页面出现异常，请刷新重试</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-blue-600 hover:underline"
          >
            点击重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 三、🟡 高优先级（建议修复）

### 2. 导航栏登录状态滞后

**文件：** `frontend/src/components/Navbar.tsx`（第 12 行）

**问题描述：** `isLoggedIn()` 在渲染时直接读 localStorage 判断登录态。但 Navbar 组件只在路由切换时（`usePathname()` 变化）重新渲染。导致：登录成功后导航栏仍显示"登录/注册"按钮，退出登录后仍显示"退出登录"，必须手动切换页面才能刷新。

**修改建议：** 使用 React Context 或自定义 Hook 管理登录态，在 token 变化时通知所有组件重渲染。短期方案是在登录/退出操作后调用 `router.refresh()`。

---

### 3. 搜索输入无防抖处理

**文件：** `frontend/src/app/page.tsx`（第 22-42 行）

**问题描述：** 每次键盘输入都立即触发后端 API 调用。输入"你好吗"会连续发出 4 个网络请求，浪费带宽和后端资源。虽然有 cancel 标记避免了 UI 错乱，但请求实际已经发出。

**修改建议：** 增加 300 毫秒的防抖延迟，等用户停止输入后再发请求：
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    // 发起请求
  }, 300);
  return () => clearTimeout(timer);  // 清理上一次的定时器
}, [keyword]);
```

---

### 4. 选项 ID 生成器使用模块级可变变量

**文件：** `frontend/src/components/QuestionEditor.tsx`（第 22-26 行）

**问题描述：**
```tsx
let _optSeq = 0;
function newOptionId(): string {
  _optSeq++;
  return `o${_optSeq}`;
}
```
`_optSeq` 是组件外部的全局变量，多个题目编辑器实例共享同一个计数器。跨页面也不会重置，序号会无限增长。React 严格模式（开发环境）下还会出现计数跳跃。

**修改建议：** 使用随机 ID 替代全局递增计数器：
```tsx
function newOptionId(): string {
  return `o_${Math.random().toString(36).slice(2, 8)}`;
}
```

---

### 5. CORS 配置允许所有来源

**文件：** `backend/app/__init__.py`（第 17 行）

**问题描述：**
```python
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
```
`origins: "*"` 允许任意网站调用后端 API。同时 `*` 与 `supports_credentials=True` 在 CORS 规范中互斥，浏览器会直接拦截这类请求。

**修改建议：** 部署时明确指定前端域名：
```python
CORS(app, resources={r"/api/*": {
    "origins": ["https://surveygo.vercel.app", "http://localhost:3000"]
}}, supports_credentials=True)
```

---

### 6. JWT 密钥有硬编码的默认值

**文件：** `backend/app/config.py`（第 24 行）

**问题描述：**
```python
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
```
如果部署时忘记配置环境变量，会使用不安全的固定密钥。攻击者可以用这个密钥伪造任意用户的 JWT token。

**修改建议：** 不提供默认值，配置缺失时直接报错：
```python
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("必须设置 JWT_SECRET 环境变量")
```

---

### 7. 统计接口存在 N+1 查询问题

**文件：** `backend/app/routes/survey_routes.py`（第 244-281 行）

**问题描述：** 统计功能对每道题单独执行一次数据库查询。一份有 20 道题的问卷，会执行 20 次独立的 SQL 查询。答卷越多，性能越差。

**当前逻辑：**
```python
for question in survey.questions.all():
    for answer in Answer.query.filter_by(question_id=question.id).all():
        # 逐题查询答案 ...
```

**修改建议：** 一次性查出所有答案，在 Python 中按 `question_id` 分组处理：
```python
all_answers = (
    Answer.query
    .join(Question)
    .filter(Question.survey_id == survey_id)
    .all()
)
# 按 question_id 分组
from itertools import groupby
grouped = groupby(all_answers, key=lambda a: a.question_id)
```

---

### 8. 问卷列表存在 N+1 计数查询

**文件：** `backend/app/models.py`（第 68-69 行）

**问题描述：**
```python
data["question_count"] = self.questions.count()
data["response_count"] = self.responses.count()
```
这两个 `.count()` 每次调用都会执行 `SELECT COUNT(*)`。在列表接口中，每页 12 个问卷会产生 24 次额外的数据库查询。

**修改建议：** 在列表接口中使用 SQLAlchemy 的 `with_expression` 预加载计数，或者在 `to_dict()` 中增加一个参数来控制是否计算数量，列表场景跳过计数。

---

## 四、🟢 中优先级（建议修复）

### 9. 后端缺少全局 JSON 错误处理

**文件：** `backend/app/__init__.py`

**问题描述：** 没有注册任何自定义错误处理器。404、500 等错误会返回 Flask 默认的 HTML 页面而非 JSON，不符合 API 规范。多处使用的 `get_or_404()` 也会返回 HTML 而非结构化的 JSON 错误。

**修改建议：** 在 `create_app()` 中添加错误处理器：
```python
@app.errorhandler(404)
def not_found(e):
    return jsonify({"code": 404, "message": "资源不存在"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"code": 500, "message": "服务器内部错误"}), 500
```

---

### 10. 数据库写入操作缺少异常保护

**文件：** `backend/app/routes/` 下所有路由文件

**问题描述：** 所有 `db.session.add()` 和 `db.session.commit()` 调用都没有 try/except 包裹。一旦数据库连接断开、字段约束冲突等，用户会看到原始的 500 错误堆栈。

**修改建议：** 对数据库写操作增加异常捕获：
```python
try:
    db.session.add(user)
    db.session.commit()
except Exception as e:
    db.session.rollback()
    return jsonify({"code": 500, "message": "操作失败，请稍后重试"}), 500
```

---

### 11. 分页参数无上限限制

**文件：** `backend/app/routes/survey_routes.py`（第 22 行）

**问题描述：** 客户端可以传入 `per_page=99999`，导致数据库一次性查询并序列化海量数据，造成内存压力。

**修改建议：** 限制每页最大 50 条：
```python
per_page = min(request.args.get("per_page", 12, type=int), 50)
```

---

### 12. 题目类型和标题缺少后端校验

**文件：** `backend/app/routes/survey_routes.py`

**问题描述：** `q.get("type", "text")` 接受任意字符串值。如果前端传入 `"type": "checkbox"`，数据库 ENUM 字段会拒绝并抛出未处理的异常。同时题目标题为空字符串也可以通过校验。

**修改建议：** 创建题目时增加校验：
```python
ALLOWED_TYPES = {"single", "multi", "text"}
q_type = q.get("type", "text")
if q_type not in ALLOWED_TYPES:
    return jsonify({"code": 400, "message": f"无效的题目类型: {q_type}"}), 400
q_title = (q.get("title") or "").strip()
if not q_title:
    return jsonify({"code": 400, "message": "题目标题不能为空"}), 400
```

---

### 13. 提交答案时不校验选项 ID 的合法性

**文件：** `backend/app/routes/survey_routes.py`

**问题描述：** 提交答卷时，只检查了必答题是否作答，但没有验证传入的 `option_ids` 是否真实存在于该题的选项中。攻击者可以提交任意 option_id，这些"幽灵数据"会在统计时被静默忽略。

**修改建议：** 对选择题的答案，逐一校验每个 `option_id` 是否在 `question.options` 中存在：
```python
valid_option_ids = {opt["id"] for opt in (question.options or [])}
for oid in ans.get("option_ids", "").split(","):
    if oid and oid not in valid_option_ids:
        return jsonify({"code": 400, "message": f"无效的选项: {oid}"}), 400
```

---

### 14. 登录接口存在用户名枚举风险

**文件：** `backend/app/routes/auth_routes.py`（第 61-64 行）

**问题描述：** 登录时先查用户，存在才做密码校验。bcrypt 哈希计算耗时明显，攻击者可以通过响应时间的差异判断哪些用户名已注册。

**修改建议：** 无论用户是否存在，都执行一次 bcrypt 校验以消除时间差：
```python
user = User.query.filter_by(username=username).first()
dummy_hash = "$2b$12$..."  # 一个固定的假哈希
if user:
    valid = check_password(password, user.password_hash)
else:
    check_password(password, dummy_hash)  # 消耗相同时间但不用结果
    return jsonify({"code": 401, "message": "用户名或密码错误"}), 401
```

---

### 15. 缺少请求频率限制

**文件：** `backend/app/routes/auth_routes.py` 及所有公开接口

**问题描述：** 登录、注册、提交答卷等接口没有任何频率限制。攻击者可以对登录接口发起暴力破解，或者向提交接口灌入大量垃圾数据。

**修改建议：** 使用 Flask-Limiter 对敏感接口添加频率限制：
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(app, key_func=get_remote_address)

@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    ...
```

---

### 16. 操作按钮缺少请求中的禁用状态

**文件：** `frontend/src/app/my/page.tsx`

**问题描述：** 发布、删除等按钮在请求进行中没有被禁用。用户双击"删除"按钮会发出两次 DELETE 请求，第二个请求必然失败但前端没有任何提示。

**修改建议：** 维护一个"正在操作的问卷 ID 集合"，请求期间禁用对应按钮并显示 loading 状态。

---

### 17. 无障碍（Accessibility）不完善

**涉及文件：** `QuestionEditor.tsx`、`SurveyForm.tsx`、`StatsPanel.tsx`

**问题描述：**
- 题型选择 `<select>` 没有关联 `<label>` 标签
- 统计柱状图使用普通 `<div>` 实现，缺少 `role="progressbar"` 和 `aria-valuenow` 等无障碍属性
- 没有 skip-to-content 跳转链接，键盘用户操作不便

**修改建议：** 为核心交互元素添加 ARIA 属性和语义化标签。

---

## 五、🟦 低优先级（可选优化）

| # | 问题 | 所在文件 |
|---|---|---|
| 19 | JWT 存储在 localStorage，存在 XSS 被窃取风险。可用 httpOnly Cookie 替代 | `auth.ts` |
| 20 | 登录/注册前端没有校验用户名格式和密码长度，placeholder 提示形同虚设 | `login/page.tsx`, `register/page.tsx` |
| 21 | 401 检测用响应体 `code` 字段而非 HTTP `res.status`，不够稳健 | `api.ts` |
| 22 | 网络请求没有超时机制，后端无响应时请求会一直挂起 | `api.ts` |
| 23 | SurveyCard 组件解构了 `response_count` prop 但从未使用（无用代码） | `SurveyCard.tsx` |
| 24 | `load_dotenv()` 在模块顶层执行，import 即产生副作用 | `config.py` |
| 25 | `login_required` 装饰器未校验 token payload 中 key 是否存在 | `auth.py` |
| 26 | 密码强度要求过低（仅 ≥6 位），允许 `123456` 等弱密码 | `auth_routes.py` |
| 27 | 数据库连接池无 `pool_pre_ping` 配置，空闲连接可能被 MySQL 关闭 | `config.py` |
| 28 | `debug=False` 硬编码，本地开发不方便 | `run.py` |

---

## 六、审查结论

| 等级 | 数量 | 处理建议 |
|---|---|---|
| 🔴 严重 | 1 | 部署前建议修复 |
| 🟡 高 | 7 | 建议提交前修复 |
| 🟢 中 | 9 | 有时间建议修复 |
| 🟦 低 | 10 | 后续迭代优化 |

**优先处理建议：**

1. **最优先** — 添加 Error Boundary，花五分钟就能保护整个应用不白屏崩溃
2. **部署前** — 收窄 CORS 配置、确认生产环境 JWT 密钥已正确设置
3. **有时间** — 解决统计接口的 N+1 查询问题，大幅提升大问卷的加载速度

---

> **项目总体评价：** 作为独立完成的实训项目，SurveyGo 在功能完整性、代码组织和前后端衔接方面都表现出色。以上问题以优化建议为主，不影响核心功能的正常运行。修复高优先级问题后，代码质量可达到小型生产项目的标准。
