# SurveyGo API 接口文档

> 后端部署地址：`https://surveygo-production-d2eb.up.railway.app`  
> 请求格式：`application/json`  
> 认证方式：需登录的接口在请求头携带 `Authorization: Bearer <token>`

---

## 统一响应格式

```json
{
  "code": 200,
  "message": "ok",
  "data": {}
}
```

| code | 含义 |
|---|---|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或 token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如用户名已存在） |

---

## 一、用户认证

### 1. 用户注册

```
POST /api/auth/register
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 2-20位，字母/数字/下划线/中文 |
| password | string | 是 | 至少6位 |

**请求示例：**
```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

**成功响应 (201)：**
```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "username": "zhangsan", "created_at": "2026-07-16T10:30:00Z" }
  }
}
```


---

### 2. 用户登录

```
POST /api/auth/login
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例：**
```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

**成功响应 (200)：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "username": "zhangsan", "created_at": "2026-07-16T10:30:00Z" }
  }
}
```


---

## 二、问卷（公开访问，无需登录）

### 3. 公开问卷列表

```
GET /api/surveys?page=1&per_page=12&keyword=消费
```

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| page | int | 否 | 1 | 页码 |
| per_page | int | 否 | 12 | 每页数量 |
| keyword | string | 否 | - | 按标题模糊搜索 |

**成功响应 (200)：**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "大学生消费习惯调查",
        "description": "了解大学生的日常消费情况",
        "status": "published",
        "question_count": 5,
        "response_count": 23,
        "created_at": "2026-07-16T08:00:00Z",
        "updated_at": "2026-07-16T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "per_page": 12
  }
}
```


---

### 4. 问卷详情（含题目，供填写页使用）

```
GET /api/surveys/<问卷ID>
```

**注意：** 仅返回状态为"已发布"的问卷，草稿无法通过此接口访问。

**成功响应 (200)：**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "大学生消费习惯调查",
    "description": "了解大学生的日常消费情况",
    "status": "published",
    "question_count": 3,
    "response_count": 23,
    "questions": [
      {
        "id": 1,
        "type": "single",
        "title": "你的年级是？",
        "options": [
          { "id": "o1", "text": "大一" },
          { "id": "o2", "text": "大二" },
          { "id": "o3", "text": "大三" },
          { "id": "o4", "text": "大四" }
        ],
        "required": true
      },
      {
        "id": 2,
        "type": "multi",
        "title": "你常用的消费方式？",
        "options": [
          { "id": "o5", "text": "网购" },
          { "id": "o6", "text": "实体店" },
          { "id": "o7", "text": "外卖" }
        ],
        "required": false
      },
      {
        "id": 3,
        "type": "text",
        "title": "你有什么建议？",
        "options": [],
        "required": true
      }
    ]
  }
}
```


---

### 5. 提交答卷

```
POST /api/surveys/<问卷ID>/submit
```

**请求体：**

| 字段 | 类型 | 说明 |
|---|---|---|
| answers | array | 答案数组，每项见下表 |

**answers 数组每项：**

| 字段 | 类型 | 说明 |
|---|---|---|
| question_id | int | 题目 ID |
| option_ids | string | 选中选项ID，单选如 `"o1"`，多选如 `"o1,o3"`，简答题为空 |
| text_content | string | 简答题文字内容 |

**请求示例：**
```json
{
  "answers": [
    { "question_id": 1, "option_ids": "o2", "text_content": "" },
    { "question_id": 2, "option_ids": "o5,o7", "text_content": "" },
    { "question_id": 3, "option_ids": "", "text_content": "食堂价格偏高，建议增加优惠" }
  ]
}
```

**成功响应 (201)：**
```json
{
  "code": 201,
  "message": "提交成功，感谢您的参与！",
  "data": { "response_id": 1 }
}
```


---

## 三、问卷管理（需登录）

> 以下接口需在请求头携带：`Authorization: Bearer <token>`

### 6. 创建问卷

```
POST /api/surveys
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| title | string | 是 | 问卷标题 |
| description | string | 否 | 问卷说明 |
| questions | array | 否 | 题目数组 |

**questions 数组每项：**

| 字段 | 类型 | 说明 |
|---|---|---|
| type | string | `single` / `multi` / `text` |
| title | string | 题目文字 |
| options | array | 选择题选项，格式 `[{"id":"o1","text":"选项A"}]` |
| sort_order | int | 排序序号 |
| required | bool | 是否必答（默认 true） |

**请求示例：**
```json
{
  "title": "大学生消费习惯调查",
  "description": "了解大学生的日常消费情况",
  "questions": [
    {
      "type": "single",
      "title": "你的年级是？",
      "options": [
        { "id": "o1", "text": "大一" },
        { "id": "o2", "text": "大二" }
      ],
      "sort_order": 0,
      "required": true
    },
    {
      "type": "text",
      "title": "你有什么建议？",
      "sort_order": 1,
      "required": false
    }
  ]
}
```

**成功响应 (201)：**
```json
{
  "code": 201,
  "message": "问卷创建成功",
  "data": {
    "id": 1,
    "title": "大学生消费习惯调查",
    "status": "draft",
    "question_count": 2,
    "response_count": 0
  }
}
```


---

### 7. 编辑问卷

```
PUT /api/surveys/<问卷ID>
```

**说明：** 仅创建者本人可操作。传入的字段覆盖原有值，`questions` 传入后会全量替换旧题目。

**请求体：** 同"创建问卷"接口，所有字段可选。

**成功响应 (200)：**
```json
{
  "code": 200,
  "message": "问卷更新成功",
  "data": { ... }
}
```


---

### 8. 删除问卷

```
DELETE /api/surveys/<问卷ID>
```

**说明：** 仅创建者可操作，会级联删除所有题目和答卷数据，不可恢复。

**成功响应 (200)：**
```json
{ "code": 200, "message": "问卷已删除" }
```

---

### 9. 发布 / 关闭问卷

```
PUT /api/user/surveys/<问卷ID>/publish
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| action | string | 是 | `publish`（发布）或 `close`（关闭） |

**请求示例：**
```json
{ "action": "publish" }
```

**成功响应 (200)：**
```json
{ "code": 200, "message": "问卷状态已更新为「已发布」" }
```

---

### 10. 我的问卷列表

```
GET /api/user/surveys?page=1&per_page=12
```

**说明：** 返回当前登录用户的所有问卷（含草稿、已发布、已关闭），按更新时间倒序。需登录。

**成功响应 (200)：**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "大学生消费习惯调查",
        "status": "published",
        "question_count": 5,
        "response_count": 23,
        "created_at": "2026-07-16T08:00:00Z",
        "updated_at": "2026-07-16T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "per_page": 12
  }
}
```

---

### 11. 我的问卷详情

```
GET /api/user/surveys/<问卷ID>
```

**说明：** 查看自己的某份问卷详情（含题目），即使处于草稿状态也可查看。返回格式同接口 4。

---

### 12. 统计数据

```
GET /api/surveys/<问卷ID>/stats
```

**说明：** 仅创建者可查看，返回每道题的答题分布。

**成功响应 (200)：**
```json
{
  "code": 200,
  "data": {
    "total_responses": 23,
    "stats": [
      {
        "question_id": 1,
        "title": "你的年级是？",
        "type": "single",
        "options": [
          { "id": "o1", "text": "大一", "count": 5, "percentage": 21.7 },
          { "id": "o2", "text": "大二", "count": 8, "percentage": 34.8 },
          { "id": "o3", "text": "大三", "count": 6, "percentage": 26.1 },
          { "id": "o4", "text": "大四", "count": 4, "percentage": 17.4 }
        ]
      },
      {
        "question_id": 3,
        "title": "你有什么建议？",
        "type": "text",
        "answers": [
          { "id": 1, "content": "食堂价格偏高" },
          { "id": 2, "content": "建议增加校园优惠活动" }
        ]
      }
    ]
  }
}
```


---

## 附录

### 题目类型

| type | 含义 | 选项 |
|---|---|---|
| `single` | 单选题 | 需提供 options |
| `multi` | 多选题 | 需提供 options |
| `text` | 简答题 | 不需要 options |

### 问卷状态

| status | 含义 |
|---|---|
| `draft` | 草稿（不公开，不出现在列表） |
| `published` | 已发布（公开可填） |
| `closed` | 已关闭（可见但不可填） |

### 接口汇总

| 编号 | 方法 | 路径 | 鉴权 |
|---|---|---|---|
| 1 | POST | `/api/auth/register` | 无 |
| 2 | POST | `/api/auth/login` | 无 |
| 3 | GET | `/api/surveys` | 无 |
| 4 | GET | `/api/surveys/<id>` | 无 |
| 5 | POST | `/api/surveys/<id>/submit` | 无 |
| 6 | POST | `/api/surveys` | JWT |
| 7 | PUT | `/api/surveys/<id>` | JWT |
| 8 | DELETE | `/api/surveys/<id>` | JWT |
| 9 | PUT | `/api/user/surveys/<id>/publish` | JWT |
| 10 | GET | `/api/user/surveys` | JWT |
| 11 | GET | `/api/user/surveys/<id>` | JWT |
| 12 | GET | `/api/surveys/<id>/stats` | JWT |
