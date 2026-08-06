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
| 前端 | 原生 HTML/CSS/JavaScript（Canvas 绘制） |
| 构建 | tsc 编译 → dist/ |

## 项目结构

```
server-fastify/
├── public/
│   ├── index.html              # 前端单页应用（Canvas 转盘交互 + 深色主题）
│   └── siam.svg                # 站点图标
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

## 前端说明（public/index.html）

### 概述

单页 Web 应用，采用 Canvas 转盘交互设计，**深色主题**。代码结构模块化，CSS 变量统一管理主题样式，AppConfig 集中管理配置项。

### 功能特性

- **转盘交互**：Canvas 绘制扇形转盘，左右滑动切换记录类型（喂奶/喝水/大便/小便/睡觉）
- **扇形间距**：等宽间距设计，从边缘到圆心间距保持一致
- **中心按钮**：点击半圆按钮打开输入弹窗
- **日期 Tab**：顶部切换不同日期查看记录
- **统计卡片**：按类型显示当天记录次数
- **数据管理**：查看、删除历史记录
- **图片上传**：自定义美化的上传区域，支持预览
- **图片查看器**：支持缩放、拖拽、双指手势操作
- **Toast 提示**：操作反馈统一提示

### 主题配置（CSS 变量）

所有可配置样式通过 CSS 变量管理，定义在 `:root` 中：

```css
:root {
  /* 背景色 */
  --bg-primary: #272727;           /* 主背景色 */
  --bg-secondary: #1e1e1e;         /* 次级背景色 */
  --bg-tertiary: #2a2a2a;          /* 三级背景色 */
  
  /* 主题色 */
  --accent: #4ECDC4;               /* 主题强调色 */
  
  /* 文字颜色 */
  --text-primary: #fff;            /* 主文字颜色 */
  --text-secondary: rgba(255, 255, 255, 0.5);
  --text-muted: #888;
  
  /* 弹窗颜色 */
  --modal-bg: #1e1e1e;
  --modal-text: #fff;
  --modal-muted: rgba(255, 255, 255, 0.5);
  
  /* 按钮颜色 */
  --btn-cancel-bg: rgba(255, 255, 255, 0.1);
  --btn-confirm-bg: var(--accent);
  --btn-danger: #e74c3c;
  
  /* 输入框颜色 */
  --input-border: rgba(255, 255, 255, 0.2);
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-text: rgba(255, 255, 255, 0.9);
  
  /* 上传按钮 */
  --upload-border: rgba(255, 255, 255, 0.2);
  --upload-border-hover: var(--accent);
  
  /* 图片查看器 */
  --viewer-bg: rgba(0, 0, 0, 0.9);
}
```

### 应用配置（AppConfig）

前端交互配置通过 `AppConfig` 对象集中管理：

```javascript
const AppConfig = {
    canvas: {
        aspectRatio: 0.5,           // 画布高度/宽度比例
        duration: 450,              // 动画时长（毫秒）
        swipeThreshold: 30,         // 滑动判定阈值（像素）
        tapThreshold: 15,           // 点击判定阈值（像素）
        labelRadiusRatio: 0.62,     // 标签半径占比
        labelFontRatio: 0.11,       // 标签字体大小占比
        btnRadiusRatio: 0.48,       // 按钮半径占比
        btnFontRatio: 0.6,          // 按钮字体大小占比
        btnHitTolerance: 10,        // 按钮点击容差
        innerRadiusRatio: 0.52,     // 圆心空白（内/外半径比）
        sectorGap: 8,               // 扇形间距（像素）
        colors: { ... },            // 绘制颜色配置
    },
    grid: {
        columns: 4,                 // 网格列数
        gap: 12,                    // 卡片间距
    },
    viewer: {
        minScale: 0.5,              // 最小缩放比例
        maxScale: 5,                // 最大缩放比例
        scaleStep: 0.25,            // 缩放步长
    },
};
```

### 记录类型配置（options）

```javascript
const options = [
    { type: 'wn', label: '喂奶', color: 'rgba(255,138,128,0.5)', options: [{ key: 'ml', label: 'ml' }] },
    { type: 'hs', label: '喝水', color: 'rgba(79,165,255,0.5)', options: [{ key: 'ml', label: 'ml' }] },
    { type: 'db', label: '大便', color: 'rgba(139,98,58,0.5)', options: [{ key: 'img', label: 'img' }] },
    { type: 'xb', label: '小便', color: 'rgba(255,206,86,0.5)', options: [{ key: 'img', label: 'img' }] },
    { type: 'sj', label: '睡觉', color: 'rgba(149,117,205,0.5)', options: [{ key: 'h', label: 'h' }] },
];
```

### 前端代码模块

| 模块 | 说明 |
|------|------|
| CSS 变量 | 全局主题配置，所有颜色/间距/阴影 |
| AppConfig | Canvas/网格/查看器等交互配置 |
| options | 记录类型数据配置 |
| API | 后端接口封装（list/create/delete/upload） |
| 常量 | HALF_PI、TAU 等数学常量 |
| 状态管理 | 全局 state 对象，存储可变状态 |
| 工具函数 | withShadow、drawArc、drawText、showToast 等 |
| Canvas 绘制 | draw、drawSectors、drawSemicircleButton |
| 动画 | easeOutCubic、animate、rotateTo |
| 交互 | onPointerDown、onPointerUp、isInsideButton |
| 日期 Tab | getAllDates、renderDateTabs |
| 卡片列表 | getDateCounts、renderCards |
| 数据列表弹窗 | getDataByType、openDataList |
| 图片查看器 | openImgViewer、setViewerScale、applyViewerTransform |
| 输入弹窗 | createNumberField、createImageField、openInputDialog、submitInput |
| 初始化 | init、resize |

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
