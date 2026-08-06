# 宝宝日常记录服务

基于 Fastify + TypeScript 的宝宝日常记录管理系统，提供 Web 前端界面和 REST API 后端服务，支持喂奶、喝水、大便、小便、睡觉等日常记录的增删查改及图片上传功能。

## 技术栈

| 类别 | 技术 |
|------|------|
| 后端框架 | Fastify 5.x |
| 语言 | TypeScript 5.x |
| 数据存储 | JSON 文件（`data/records.json`） |
| 文件上传 | @fastify/multipart |
| 静态资源 | @fastify/static |
| 跨域 | @fastify/cors |
| 自动加载 | @fastify/autoload |
| 日志 | Pino + pino-pretty |
| 构建 | tsc 编译 → dist/ |

## 项目结构

```
server-fastify/
├── public/
│   └── index.html              # 前端单页应用（Canvas 转盘交互界面）
├── src/
│   ├── app.ts                  # 应用入口，配置 AutoLoad 自动加载 plugins 和 routes
│   ├── config.ts               # 全局配置（端口/日志/CORS/bodyLimit 等）
│   ├── plugins/                # 插件层（通过 fp 包装，自动注册）
│   │   ├── static.ts           # 静态文件服务 + 404 兜底（支持前端路由）
│   │   ├── cors.ts             # CORS 跨域配置
│   │   └── multipart.ts        # 文件上传配置（10MB 限制）
│   ├── routes/                 # 路由层（自动注册）
│   │   ├── root.ts             # 根路由
│   │   ├── api/
│   │   │   ├── index.ts        # /api 根路由
│   │   │   ├── records/
│   │   │   │   └── index.ts    # /api/records 记录 CRUD
│   │   │   └── upload/
│   │   │       └── index.ts    # /api/upload 文件上传
│   ├── services/               # 业务逻辑层
│   │   ├── recordStore.ts      # 记录存储服务（JSON 文件读写 + 图片管理）
│   │   └── response.ts         # 统一响应格式封装
├── data/                       # 数据目录（JSON 文件存储）
│   └── records.json            # 记录数据
├── .gitignore                  # 忽略规则（排除上传图片和数据文件）
├── package.json                # 依赖与脚本
└── tsconfig.json               # TypeScript 配置
```

## 模块说明

### `src/app.ts` — 应用入口

通过 `@fastify/autoload` 自动加载 `plugins/` 和 `routes/` 目录下的所有模块。配置服务端口、日志、body 大小限制等选项。

### `src/config.ts` — 全局配置

集中管理应用配置项，包括端口号（3030）、主机地址（0.0.0.0）、日志格式（pino-pretty 彩色输出）、CORS 策略、请求体大小限制（10MB，适配文件上传）等。

### `src/plugins/` — 插件层

| 插件 | 说明 |
|------|------|
| `static.ts` | 将 `public/` 目录注册为静态资源根目录。未匹配的 API 请求返回标准 JSON 错误，其他请求回退到 `index.html`（支持前端路由） |
| `cors.ts` | 配置跨域策略，允许所有来源的跨域请求 |
| `multipart.ts` | 配置 multipart 解析，限制单文件 10MB，单次仅允许上传 1 个文件 |

### `src/services/` — 业务服务层

#### `response.ts` — 统一响应格式

```typescript
interface ApiResponse<T> {
  code: number    // 0 = 成功，1 = 失败
  message: string  // 提示信息
  data: T | null   // 响应数据
}
```

提供 `success(data, message)` 和 `fail(message)` 两个工具函数。

#### `recordStore.ts` — 记录存储服务

核心数据管理模块，通过 JSON 文件持久化存储。

- **数据模型**：
  ```typescript
  interface RecordItem {
    id: string           // 唯一标识
    type: 'wn'|'hs'|'db'|'xb'|'sj'  // 喂奶/喝水/大便/小便/睡觉
    ml: string           // 毫升数（喂奶/喝水）
    img: string          // 图片路径（大便/小便）
    h: string            // 小时数（睡觉）
    timestamp: number    // Unix 时间戳
  }
  ```

- **方法**：
  - `list(dateStr?)` — 按日期查询记录列表，支持 `MM/DD` 格式过滤
  - `create(data)` — 创建新记录，自动生成 ID
  - `delete(id)` — 删除指定记录，**同步删除关联图片文件**
  - `clear()` — 清空所有记录，**同步删除所有关联图片文件**

- **图片管理**：
  - 图片存储于 `public/YYYY-MM-DD/` 目录下，文件名使用 UUID
  - 删除记录时自动检测并删除关联的图片物理文件
  - 清空记录时遍历删除所有图片

### `src/routes/` — 路由层

#### `GET /api/records` — 查询记录列表

**Query 参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `date` | string | 否 | 日期过滤，格式 `MM/DD`，如 `08/05` |

**响应**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": "...", "type": "wn", "ml": "120", "img": "", "h": "", "timestamp": 1722873600000 }
  ]
}
```

#### `POST /api/records` — 创建新记录

**请求体**：
```json
{
  "type": "wn",
  "ml": "120",
  "img": "",
  "h": "",
  "timestamp": 1722873600000
}
```

**响应**：`201 Created` + 标准响应格式，`data` 为创建的记录对象（含自动生成的 `id`）。

#### `DELETE /api/records/:id` — 删除指定记录

**路径参数**：
| 参数 | 说明 |
|------|------|
| `id` | 记录唯一标识 |

**响应**：
- `200 OK`：删除成功，返回 `{ code: 0, message: "删除成功", data: null }`
- `404 Not Found`：记录不存在

#### `DELETE /api/records` — 清空所有记录

**响应**：`200 OK` + 标准响应格式，**同步删除所有关联图片文件**。

#### `POST /api/upload` — 文件上传

**请求**：`multipart/form-data`，字段名为 `file`。支持 JPG/PNG/GIF/WebP 格式，最大 10MB。

**响应**：
```json
{
  "code": 0,
  "message": "上传成功",
  "data": { "url": "/2026-08-05/uuid.png" }
}
```

上传的文件保存在 `public/YYYY-MM-DD/` 目录下，可通过返回的 URL 直接访问。

## 前端功能（public/index.html）

单页 Web 应用，采用 Canvas 转盘交互设计：

- **转盘操作**：左右滑动切换记录类型（喂奶/喝水/大便/小便/睡觉），点击中心按钮输入数据
- **日期 Tab**：顶部可切换不同日期查看记录
- **统计卡片**：按类型显示当天记录次数
- **数据管理**：查看、删除历史记录
- **图片查看器**：支持缩放、拖拽、双指手势操作
- **Toast 提示**：操作反馈统一使用 Toast 组件提示

## 数据存储说明

- 记录数据存储于 `data/records.json`，首次访问时自动创建
- 上传图片存储于 `public/YYYY-MM-DD/` 目录下
- `data/` 目录和 `public/` 下的图片目录已加入 `.gitignore`，不会提交到版本库

## 快速开始

### 环境要求

- Node.js >= 18
- npm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

该命令会同时启动 TypeScript 编译监听和 Fastify 开发服务器，代码修改后自动编译重启。

### 生产模式

```bash
npm run start
```

### 编译

```bash
npm run build:ts
```

编译产物输出到 `dist/` 目录。

## 脚本说明

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 开发模式：tsc 监听编译 + Fastify 热重载 |
| `npm run start` | 生产模式：编译后启动 Fastify |
| `npm run build:ts` | 仅执行 TypeScript 编译 |
| `npm run watch:ts` | 仅启动 TypeScript 编译监听 |
| `npm run test` | 运行测试用例 |

## 默认配置

| 配置项 | 默认值 |
|--------|--------|
| 端口 | 3030 |
| 主机 | 0.0.0.0 |
| 日志级别 | info |
| Body 大小限制 | 10MB |
| CORS | 允许所有来源 |
