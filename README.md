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
| 转盘组件 | turntable-selection |
| 前端 | 原生 HTML/CSS/JavaScript（ES Modules 模块化） |
| 构建 | tsc 编译 → dist/ |

## 项目结构

```
server-fastify/
├── public/
│   ├── index.html                  # 前端入口（HTML 结构 + 模块引入）
│   ├── app.css                     # 基础样式（布局/组件/弹窗/时间字段）
│   ├── siam.svg                    # 站点图标
│   ├── turntable-selection.mjs     # 转盘组件（npm 包 dist 产物）
│   ├── themes/
│   │   ├── dark.css                # 暗色主题变量
│   │   └── light.css               # 亮色主题变量
│   └── js/
│       ├── config.js               # 应用配置 + 记录类型定义
│       ├── state.js                # 全局状态（数据/转盘实例/回调集合）
│       ├── utils.js                # 工具函数（Toast/弹窗/格式化/DOM）
│       ├── api.js                  # API 接口封装
│       ├── turntable.js            # 转盘组件初始化 + 主题配色
│       ├── theme.js                # 主题管理器（切换/持久化/转盘重建）
│       ├── viewer.js               # 图片查看器（缩放/平移/双指手势）
│       ├── components.js           # 可复用表单字段（时间/数值/图片）
│       └── app.js                  # 应用主逻辑（加载/渲染/初始化）
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
├── data/                       # 数据目录（运行时自动创建）
│   └── records.json            # 记录数据
├── .gitignore                  # 忽略规则
├── ecosystem.config.js         # PM2 部署配置
├── package.json                # 依赖与脚本
└── tsconfig.json               # TypeScript 配置
```

## 后端模块说明

### `src/app.ts` — 应用入口

通过 `@fastify/autoload` 自动加载 `plugins/` 和 `routes/` 目录下的所有模块。配置服务端口、日志、body 大小限制等选项。

### `src/config.ts` — 全局配置

集中管理应用配置项：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `port` | 3030 | 服务端口 |
| `host` | `0.0.0.0` | 监听地址 |
| `logger.level` | `info` | 日志级别 |
| `bodyLimit` | 10MB | 请求体大小限制（适配文件上传） |
| `cors.origin` | `*` | 跨域来源 |
| `trustProxy` | `true` | 信任代理 |
| `requestTimeout` | 6000ms | 请求超时 |

### `src/plugins/` — 插件层

| 插件 | 说明 |
|------|------|
| `static.ts` | 将 `public/` 目录注册为静态资源根目录。API 请求返回 JSON 错误，其他请求回退到 `index.html` |
| `cors.ts` | 配置跨域策略，允许所有来源的跨域请求 |
| `multipart.ts` | 配置 multipart 解析，限制单文件 10MB |

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
    id: string           // 唯一标识（自动生成）
    type: 'wn'|'hs'|'db'|'xb'|'sj'  // 喂奶/喝水/大便/小便/睡觉
    ml: string           // 毫升数（喂奶/喝水）
    img: string          // 图片路径（大便/小便）
    h: string            // 小时数（睡觉）
    timestamp: number    // Unix 时间戳
  }
  ```

- **方法**：
  - `list(dateStr?)` — 按日期查询记录列表，支持 `MM/DD` 格式过滤，按时间倒序排列
  - `create(data)` — 创建新记录，自动生成 ID（时间戳+随机字符串）
  - `delete(id)` — 删除指定记录，**同步删除关联图片文件**
  - `clear()` — 清空所有记录，**同步删除所有关联图片文件**

- **图片管理**：
  - 图片存储于 `public/YYYY-MM-DD/` 目录下，文件名使用 UUID
  - 删除记录时自动检测并删除关联的图片物理文件
  - 清空记录时遍历删除所有图片

### `src/routes/` — API 路由

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

**响应**：`201 Created`，`data` 为创建的记录对象（含自动生成的 `id`）。

#### `DELETE /api/records/:id` — 删除指定记录

**路径参数**：

| 参数 | 说明 |
|------|------|
| `id` | 记录唯一标识 |

**响应**：
- `200 OK`：删除成功
- `404 Not Found`：记录不存在

#### `DELETE /api/records` — 清空所有记录

**响应**：`200 OK` + 标准响应格式，**同步删除所有关联图片文件**。

#### `POST /api/upload` — 文件上传

**请求**：`multipart/form-data`，字段名为 `file`。

| 项目 | 说明 |
|------|------|
| 支持格式 | JPG / PNG / GIF / WebP |
| 大小限制 | 10MB |
| 存储路径 | `public/YYYY-MM-DD/uuid.ext` |

**响应**：
```json
{
  "code": 0,
  "message": "上传成功",
  "data": { "url": "/2026-08-05/uuid.png" }
}
```

## 前端说明

### 概述

单页 Web 应用，采用 `turntable-selection` 转盘组件，原生 ES Modules 模块化架构。支持**日间/夜间主题切换**，CSS 变量统一管理主题样式，配置与业务逻辑分离。

### 功能特性

- **转盘交互**：基于 `turntable-selection` 组件，支持滑动切换 + 点击选中
- **主题切换**：日间/夜间模式一键切换，偏好持久化存储，转盘 Canvas 颜色自动同步
- **时间编辑**：记录时间支持 `MM-DD hh:mm:ss` 格式显示，点击可修改
- **日期 Tab**：顶部切换不同日期查看记录，自动滚动定位
- **统计卡片**：按类型显示当天记录次数，标题内合计 ml/h 数值
- **数据管理**：查看、删除历史记录，删除后自动刷新
- **图片上传**：自定义美化的上传区域，支持预览
- **图片查看器**：支持缩放、拖拽、双指手势操作
- **Toast 提示**：操作反馈统一提示，文字颜色自适应主题

### 架构设计

前端代码按**依赖方向**分层组织，零循环依赖：

```
┌─────────────────────────────────────────────────────────┐
│                     app.js (主入口)                      │
│                   编排初始化 + 事件绑定                    │
└──────────┬──────────┬──────────┬──────────┬─────────────┘
           │          │          │          │
    ┌──────▼──┐  ┌────▼───┐  ┌──▼────┐  ┌──▼────────┐
    │ viewer  │  │components│ │theme  │  │ turntable │
    └──────┬──┘  └────┬───┘  └──┬────┘  └─────┬──────┘
           │          │        │              │
           └──────────┴────────┴──────────────┘
                              │
                     ┌────────▼────────┐
                     │   state.js      │  状态/实例/回调
                     └────────┬────────┘
                     ┌────────▼────────┐
                     │   utils.js      │  工具函数
                     └────────┬────────┘
                     ┌────────▼────────┐
                     │   config.js     │  配置/类型
                     └─────────────────┘
                     ┌─────────────────┐
                     │    api.js       │  API 封装
                     └─────────────────┘
```

### 模块说明

| 模块 | 职责 | 依赖 |
|------|------|------|
| `config.js` | AppConfig 配置 + options 记录类型定义 | 无 |
| `state.js` | 全局状态、转盘实例引用、回调集合 | 无 |
| `utils.js` | Toast/弹窗/时间格式化/DOM 创建 | 无 |
| `api.js` | 通用请求封装 + API 接口集合 | 无 |
| `turntable.js` | 转盘组件初始化、数据映射、主题配色读取 | config, state |
| `theme.js` | 主题切换/持久化/转盘重建 | state, turntable, utils |
| `viewer.js` | 图片查看器缩放/平移/双指手势 | state, utils, config |
| `components.js` | 可复用表单字段（时间/数值/图片） | state, utils |
| `app.js` | 主编排逻辑：数据加载、UI 渲染、初始化 | 全部模块 |

### 主题系统

采用双 CSS 文件 + `data-theme` 属性方案，支持日间/夜间模式：

- **`themes/dark.css`**：默认暗色主题变量（无 `data-theme` 时生效）
- **`themes/light.css`**：亮色主题变量（`data-theme="light"` 时生效）
- **`app.css`**：布局/组件基础样式（引用 CSS 变量）
- **切换逻辑**：`ThemeManager` 通过修改 `data-theme` 属性触发变量更新，转盘实例同步重建
- **FOUC 预防**：`<head>` 内联脚本预先设置主题，避免样式加载闪烁

### 主题配置（CSS 变量）

所有可配置样式通过 CSS 变量管理，分别定义在 `dark.css` 和 `light.css` 中：

```css
/* dark.css — 默认暗色主题 */
:root {
  --bg-primary: #272727;
  --bg-secondary: #1e1e1e;
  --accent: #4ECDC4;
  --text-primary: #fff;
  /* ... 更多变量 */
}

/* light.css — 亮色主题（在暗色基础上覆盖） */
html[data-theme="light"] {
  --bg-primary: #f5f5f5;
  --bg-secondary: #fff;
  --accent: #4ECDC4;
  --text-primary: #333;
  /* ... 覆盖变量 */
}
```

### 应用配置（AppConfig）

前端交互配置通过 `AppConfig` 对象集中管理，定义在 `js/config.js`：

```javascript
export const AppConfig = {
    turntable: {
        duration: 450,
        swipeThreshold: 30,
        tapThreshold: 15,
        aspectRatio: 0.5,
        sectorGap: 8,
        innerRadiusRatio: 0.52,
        label: { radiusRatio: 0.62, fontSizeRatio: 0.11, /* ... */ },
        button: { text: '+', radiusRatio: 0.48, /* ... */ },
    },
    grid: { columns: 4, gap: 12 },
    viewer: { minScale: 0.5, maxScale: 5, scaleStep: 0.25 },
};
```

### 记录类型配置（options）

```javascript
export const options = [
    { type: 'wn', label: '喂奶', color: 'rgba(255,138,128,0.5)', options: [{ key: 'ml', label: 'ml' }] },
    { type: 'hs', label: '喝水', color: 'rgba(79,165,255,0.5)', options: [{ key: 'ml', label: 'ml' }] },
    { type: 'db', label: '大便', color: 'rgba(139,98,58,0.5)', options: [{ key: 'img', label: 'img' }] },
    { type: 'xb', label: '小便', color: 'rgba(255,206,86,0.5)', options: [{ key: 'img', label: 'img' }] },
    { type: 'sj', label: '睡觉', color: 'rgba(149,117,205,0.5)', options: [{ key: 'h', label: 'h' }] },
];
```

## 数据存储说明

- 记录数据存储于 `data/records.json`，首次访问时自动创建
- 上传图片存储于 `public/YYYY-MM-DD/` 目录下
- `data/` 目录和 `public/` 下的图片目录已加入 `.gitignore`

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

该命令使用 `ts-node` 直接运行 TypeScript，支持 `--watch` 热重载。

### 生产模式

```bash
npm run start
```

编译 TypeScript 并启动生产服务器。

### 仅编译

```bash
npm run build:ts
```

编译产物输出到 `dist/` 目录。

### PM2 部署

```bash
npm run pm2start
```

使用 PM2 启动生产服务（需全局安装 PM2）。

## 脚本说明

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 开发模式：ts-node 热重载 |
| `npm run start` | 生产模式：编译后启动 |
| `npm run build:ts` | 仅执行 TypeScript 编译 |
| `npm run watch:ts` | TypeScript 编译监听 |
| `npm run test` | 运行测试用例 |
| `npm run pm2start` | PM2 生产部署 |

## 默认配置

| 配置项 | 默认值 |
|--------|--------|
| 端口 | 3030 |
| 主机 | 0.0.0.0 |
| 日志级别 | info |
| Body 大小限制 | 10MB |
| CORS | 允许所有来源 |

## 许可

ISC
