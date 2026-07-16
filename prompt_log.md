# Prompt 日志 — SurveyGo 在线问卷调查系统

> **说明：** 以下记录使用 AI 编程助手（Claude Code）开发 SurveyGo 的完整对话过程。每条 Prompt 附带 AI 输出的代码摘要，并标注对应的功能模块和文件路径，便于代码审查时对照。

---

## Prompt 1：数据库建表 + Flask 项目骨架

**提问内容：** "先这样吧，有问题再改...你可以一步一步地给我...给我大概"

**对应功能：** 系统基础设施搭建

**涉及文件：**
- `database/init.sql`
- `backend/requirements.txt`
- `backend/app/config.py`
- `backend/app/__init__.py`
- `backend/run.py`
- `backend/.env.example`
- `.gitignore`

**AI 输出摘要：**
`init.sql` — 创建 surveygo 数据库，5 张表（users、surveys、questions、responses、answers），含外键和索引，options 用 JSON 类型存储。  
`config.py` — 从 .env 读取 DB_HOST、DB_PASSWORD、JWT_SECRET 等环境变量。  
`app/__init__.py` — Flask 工厂函数 create_app()，注册 auth/survey/user 三个蓝图，配置 CORS。  
`requirements.txt` — flask、pymysql、flask-sqlalchemy、pyjwt、bcrypt、python-dotenv 等依赖。
> 📸 **截图位置：AI 对话截图 1**
![alt text](指令对话截图包/image.png)
![alt text](指令对话截图包/image-1.png)

---

## Prompt 2：SQLAlchemy 模型 + JWT 认证

**提问内容：** "继续以功能为模块继续"

**对应功能：** ORM 数据模型 + 用户认证基础设施

**涉及文件：**
- `backend/app/models.py`
- `backend/app/auth.py`
- `backend/app/routes/__init__.py`

**AI 输出摘要：**

`models.py` — 定义了 User、Survey、Question、Response、Answer 五个 SQLAlchemy 模型，包含 to_dict() 序列化方法。Survey.to_dict(include_questions=True) 可展开题目列表。share_code 使用 uuid.hex[:16] 自动生成。  
`auth.py` — hash_password() / check_password() 使用 bcrypt 加密密码。create_token() / decode_token() 实现 JWT 签发与解析。login_required 装饰器从 Authorization 头解析 Bearer token，解析成功后将 user_id 存入 g 上下文。

> 📸 **截图位置：AI 对话截图 2**
![alt text](指令对话截图包/image-2.png)
---

## Prompt 3：用户注册与登录 API

**提问内容：** "继续写下一个模块功能"

**对应功能：** 用户注册 + 登录接口

**涉及文件：**
- `backend/app/routes/auth_routes.py`

**AI 输出摘要：**

`POST /api/auth/register` — 校验用户名（2-20位，正则：`^[a-zA-Z0-9_一-龥]{2,20}$`）+ 密码（≥6位），查重后创建用户，返回 JWT token。  
`POST /api/auth/login` — 接受 username + password，查找用户并校验 bcrypt 哈希，返回 JWT token。  
统一返回格式 `{"code": xxx, "message": "...", "data": {...}}`。

> 📸 **截图位置：AI 对话截图 3**
![alt text](指令对话截图包/image-3.png)
---

## Prompt 4：问卷 CRUD + 答卷提交 + 统计数据

**提问内容：** "继续，下一个功能"

**对应功能：** 问卷全生命周期 API

**涉及文件：**
- `backend/app/routes/survey_routes.py`
- `backend/app/routes/user_routes.py`

**AI 输出摘要：**

`survey_routes.py` — 公开接口：GET 问卷列表（分页 + 关键词搜索）、GET 问卷详情含题目、POST 提交答卷（含必答题校验 + 截止时间检查）。需登录接口：POST 创建问卷（批量创建题目）、PUT 编辑问卷（全量替换题目）、DELETE 删除问卷（级联删除）、GET 统计数据（选择题选项分布百分比 + 简答题文本列表）。  
`user_routes.py` — GET 我的问卷列表（含草稿、按更新时间倒序）、GET 我的问卷详情、PUT 发布/关闭问卷。

> 📸 **截图位置：AI 对话截图 4**
![alt text](指令对话截图包/image-4.png)

---

## Prompt 5：前端工具库（API 封装 + JWT 管理）

**提问内容：** "OK，那开始写前端页面。记得一个一个功能实习，不要一口气完成"

**对应功能：** 前后端通信基础设施

**涉及文件：**
- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth.ts`
- `frontend/.env.local`

**AI 输出摘要：**

`auth.ts` — getToken() / setToken() / removeToken() / isLoggedIn() 四个函数，token 存储在 localStorage。  
`api.ts` — 封装 get() / post() / put() / del() 方法，自动拼接 BASE_URL（从 NEXT_PUBLIC_API_URL 环境变量读取），自动携带 Authorization: Bearer 头，收到 401 响应自动清除 token。

> 📸 **截图位置：AI 对话截图 5**
![alt text](指令对话截图包/image-5.png)
![alt text](指令对话截图包/image-6.png)
---

## Prompt 6：导航栏组件 + 根布局

**提问内容：** "下一步是导航栏组件 + 根布局的前端部分"

**对应功能：** 全局导航 + 页面布局框架

**涉及文件：**
- `frontend/src/components/Navbar.tsx`
- `frontend/src/app/layout.tsx`

**AI 输出摘要：**

`Navbar.tsx`（客户端组件）— 未登录显示"公开问卷 + 登录 + 注册"，已登录显示"公开问卷 + 创建问卷 + 我的问卷 + 退出登录"。usePathname() 监听路由变化刷新登录态，当前路由高亮。  
`layout.tsx` — 引入 Navbar，搭配 Footer，lang="zh-CN"，全局元数据设置，suppressHydrationWarning 避免浏览器扩展导致的水合错误。

> 📸 **截图位置：AI 对话截图 6**
![alt text](指令对话截图包/image-7.png)
---

## Prompt 7：首页（项目介绍 + 公开问卷列表）

**提问内容：** "继续写首页吧，下一个功能继续"

**对应功能：** 首页

**涉及文件：**
- `frontend/src/components/SurveyCard.tsx`
- `frontend/src/app/page.tsx`

**AI 输出摘要：**

`SurveyCard.tsx` — 问卷卡片组件，显示标题（truncate）、描述（line-clamp-2）、题数、日期。卡片使用白色背景 + 圆角 + 阴影 + hover 边框变蓝效果。  
`page.tsx`（客户端组件）— Hero 区用深色渐变背景 + 标题 + 介绍 + 注册/创建按钮。下方公开问卷列表从 /api/surveys 获取已发布问卷，三栏网格布局，支持关键词搜索。

> 📸 **截图位置：AI 对话截图 7**
![alt text](指令对话截图包/image-8.png)
---

## Prompt 8：登录 + 注册页面

**提问内容：** "继续下一个登录 + 注册页面 的功能模块"

**对应功能：** 用户登录/注册前端

**涉及文件：**
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`

**AI 输出摘要：**

`login/page.tsx` — 用户名 + 密码表单，调用 POST /api/auth/login，成功后存 token 并跳转 /my，失败显示红色错误提示。  
`register/page.tsx` — 用户名 + 密码表单，调用 POST /api/auth/register，成功后存 token 并跳转 /my。底部互链登录/注册页。

> 📸 **截图位置：AI 对话截图 8**
![alt text](指令对话截图包/image-9.png)
---

## Prompt 9：简化认证（去掉邮箱）

**提问内容：** "等一下吧，登录注册的功能不要有邮箱就用户名就行了。修改相关代码"

**对应功能：** 用户系统简化

**涉及文件：**
- `database/init.sql`
- `backend/app/models.py`
- `backend/app/routes/auth_routes.py`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`

**AI 输出摘要：**

数据库 users 表删除 email 列。User 模型删除 email 字段和 to_dict() 中的 email。注册接口删除 email 校验和存储逻辑。登录接口改为仅用 username 查找。前端注册页删除 email 输入框，登录页标签从"用户名或邮箱"改为"用户名"。

> 📸 **截图位置：AI 对话截图 9**
![alt text](指令对话截图包/image-10.png)
![alt text](指令对话截图包/image-11.png)
---

## Prompt 10：创建问卷页 + 题目编辑器

**提问内容：** "下一步是 创建问卷页，继续"

**对应功能：** 问卷创建页面

**涉及文件：**
- `frontend/src/components/QuestionEditor.tsx`
- `frontend/src/app/create/page.tsx`

**AI 输出摘要：**

`QuestionEditor.tsx` — 题目编辑器，支持三种题型切换（single/multi/text）、选项增删（2-10个）、必答题 checkbox、排序字母标识。newQuestion() 工厂函数生成默认题目数据。  
`create/page.tsx` — 问卷创建表单：标题输入、描述 textarea、题目列表（动态增删）、提交校验（标题非空 + 至少一题 + 选择题选项非空）。创建成功跳转 /my，未登录拦截显示去登录。

> 📸 **截图位置：AI 对话截图 10**
![alt text](指令对话截图包/image-12.png)
---

## Prompt 11：公开问卷填写页

**提问内容：** "继续下一个？下一步是 填写问卷页（/survey/[id]）功能"

**对应功能：** 问卷填写（公开访问）

**涉及文件：**
- `frontend/src/components/SurveyForm.tsx`
- `frontend/src/app/survey/[id]/page.tsx`

**AI 输出摘要：**

`SurveyForm.tsx` — 根据题型渲染表单：单选题用 radio button、多选题用 checkbox、简答题用 textarea。答案状态集中管理，提交时收集为标准 answers 格式。  
`survey/[id]/page.tsx` — 三种页面状态：加载中 / 填写态（问卷标题区 + 表单 + 提交按钮）/ 提交成功感谢页。从 URL 参数获取问卷 ID，调用 API 加载数据。

> 📸 **截图位置：AI 对话截图 11**
![alt text](指令对话截图包/image-13.png)
---

## Prompt 12：我的问卷页 + 统计面板

**提问内容：** "继续下一个功能"

**对应功能：** 个人问卷管理 + 数据统计

**涉及文件：**
- `frontend/src/components/StatsPanel.tsx`
- `frontend/src/app/my/page.tsx`

**AI 输出摘要：**

`StatsPanel.tsx` — 选择题用蓝色水平柱状图展示百分比和计数，简答题用列表展示所有文本回答，无数据时提示"暂无答卷数据"。  
`my/page.tsx` — 问卷卡片列表（标题 + 状态标签彩色区分 + 题数 + 答卷数）。操作按钮：发布/关闭切换、复制分享链接、查看统计（展开后显示 StatsPanel）、删除（确认弹窗）。未登录拦截。

> 📸 **截图位置：AI 对话截图 12**
![alt text](指令对话截图包/image-14.png)
---

## Prompt 13：修复按钮误触发表单提交 Bug

**提问内容：** "怎么回事我创建选项超过第三个然后点击加选项直接给我退出去了什么意思？"

**对应功能：** Bug 修复

**涉及文件：**
- `frontend/src/components/QuestionEditor.tsx`

**AI 输出摘要：**

问题定位：QuestionEditor 组件内三个 `<button>` 未设置 `type="button"`，在 `<form>` 内被浏览器默认为 `type="submit"`，点击"添加选项"时触发了整个问卷表单的提交。  
修复：为"删除题目"、"删除选项 ✕"、"+ 添加选项"三个按钮均添加 `type="button"` 属性。

> 📸 **截图位置：AI 对话截图 13**
![alt text](指令对话截图包/image-15.png)
---

## Prompt 14-16：UI 视觉优化（背景、卡片、设计感）

**提问内容：** "优化一下前端ui..."、"创建问卷和点开公共问卷之后的背景太白了"、"搞点设计感什么的"、"改的太low了回退，不要圆点"

**对应功能：** UI 样式迭代

**涉及文件：**
- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/create/page.tsx`
- `frontend/src/app/survey/[id]/page.tsx`

**AI 输出摘要：**

全局背景从纯白 #fff 改为浅灰 #f3f4f6。创建问卷页和填写页增加白色圆角卡片包裹、阴影层次、分割线分隔、悬浮效果。卡片统一高度使用 min-h + flex 布局。Footer 去掉"实训项目"文案。尝试圆点纹理后被否决，回退到干净纯色。

> 📸 **截图位置：AI 对话截图 14**
![alt text](指令对话截图包/image-16.png)
---

## Prompt 17：公开问卷卡片样式优化

**提问内容：** "把公开问卷的那个卡片样式优化。不需要显示'几份答卷'...每个卡片显示的样式基本相同"

**对应功能：** SurveyCard 组件优化

**涉及文件：**
- `frontend/src/components/SurveyCard.tsx`

**AI 输出摘要：**

去掉"X 份答卷"信息，精简卡片。添加 min-h-[120px] 保证同一行卡片高度一致。描述区域用 flex-1 撑满中间空间，空白描述显示"暂无描述"。底部加 border-t 分割线，左右分别显示"X 道题"和日期。

> 📸 **截图位置：AI 对话截图 15**
![alt text](指令对话截图包/image-17.png)
---

## Prompt 18：React Hook 调用顺序修复 + Vercel 部署构建

**提问内容：** "CSS 错误...你现在看代码有错误吗？"

**对应功能：** ESLint/TypeScript 规范修复

**涉及文件：**
- `frontend/src/app/my/page.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/survey/[id]/page.tsx`
- `frontend/src/components/Navbar.tsx`

**AI 输出摘要：**

修复 my/page.tsx 中 Hook 在条件返回后调用的问题——改用 useState 初始化登录态 + refresh 模式代替 useCallback。  
修复 page.tsx 中 useEffect 内调用 setState 的规范问题——改用取消令牌模式防止竞态。  
修复 survey/[id]/page.tsx 中 `<a>` 标签改为 `<Link>` 组件。  
修复 Navbar.tsx 中 useEffect 内同步 setState——改为渲染时直接读取 isLoggedIn()。

> 📸 **截图位置：AI 对话截图 16**
![alt text](指令对话截图包/image-18.png)
---


## 开发统计

| 指标 | 数量 |
|---|---|
| 总计 Prompt | 19 条 |
| 涉及文件 | 30+ 个 |
| 覆盖模块 | 数据库、后端 12 个 API、前端 5 个路由、部署 |
| 开发周期 | 3 天以上（分多次提交） |
