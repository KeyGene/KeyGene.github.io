# KeyGene PUBG 网站 — Astro 重构设计规格

**日期：** 2026-04-17
**状态：** 已批准
**范围：** 将 keygene.top 从静态 HTML 全面重写为 Astro 5

---

## 1. 目标

将 11 个静态 HTML 页面（共 9,600 行，重复的导航/页脚/国际化，内联 JS/CSS）重构为 Astro 5 项目：

- 类 App 导航体验，带形变过渡动画（~800ms → ~120ms）
- 静态内容零 JS，交互部分使用 Preact 岛屿架构
- SEO 友好的静态多语言路由
- 统一的设计令牌系统
- Cloudflare Pages 部署，边缘 CDN 加速

---

## 2. 架构

### 三层架构

**页面层（Astro — 零 JS）：** 9 个 `.astro` 页面，渲染静态外壳。每个页面导入共享的 `Base.astro` 布局（head、导航、页脚、视图过渡）。页面不包含内联 JS — 交互部分委托给岛屿组件。

- index.astro、stats.astro、maps.astro、quiz.astro、leaderboard.astro
- sensitivity.astro、weapons.astro、team.astro、flight.astro

**组件层（Astro — 零 JS）：** 可复用的静态 UI 组件，不向客户端发送任何 JavaScript。

- Nav.astro — 统一的下拉导航，替代 11 个重复导航
- Footer.astro — 统一页脚
- Hero.astro — 首页主视觉区
- ServerStatus.astro — PUBG 服务器状态组件
- WeaponCard.astro — 武器展示卡片（用于武器页网格）
- PlayerCard.astro — 玩家概览卡片
- MapThumbnail.astro — 地图选择缩略图
- Skeleton.astro — 加载骨架屏占位组件（CSS 微光动画）

**岛屿层（Preact — 按需加载 JS）：** 在客户端水合的交互组件。每个岛屿独立加载，使用各自的水合策略。

| 岛屿组件 | 水合策略 | 用途 |
|----------|----------|------|
| StatsEngine.tsx | client:load | 玩家搜索、7 个标签页、图表、海报生成 |
| LeafletMap.tsx | client:load | 瓦片地图、标记、网格、测距、投掷物工具 |
| QuizEngine.tsx | client:visible | 16 题测试状态机 |
| LeaderboardTable.tsx | client:visible | 赛季/服务器/模式筛选，可排序表格 |
| SensCalc.tsx | client:visible | 灵敏度计算器（滑块交互） |
| FlightSim.tsx | client:load | 航线模拟 Canvas |
| TeamBuilder.tsx | client:visible | 拖拽式阵容搭配 |
| CommandPalette.tsx | client:idle | Cmd+K 全局搜索面板 |
| ThemeToggle.tsx | client:load | 深色/浅色主题切换 |
| Toast.tsx | client:load | 全局消息提示系统 |

### 布局结构

```
Base.astro
├── <head>（meta、字体、tokens.css、视图过渡指令）
├── <Nav />（含语言切换器、ThemeToggle 岛屿）
├── <slot />（页面内容）
├── <Footer />
├── <CommandPalette client:idle />
└── <Toast client:load />
```

---

## 3. 国际化 — 静态路由

**策略：** 使用 Astro 内置 i18n 路由，按语言生成静态页面。

| 语言 | 路径前缀 | 示例 |
|------|----------|------|
| 中文（默认） | `/` | `/stats/` |
| 英文 | `/en/` | `/en/stats/` |
| 韩文 | `/ko/` | `/ko/stats/` |

**实现方式：**
- `astro.config.mjs`：配置 `i18n: { defaultLocale: 'zh', locales: ['zh', 'en', 'ko'], routing: { prefixDefaultLocale: false } }`
- 翻译文件：`src/i18n/zh.json`、`en.json`、`ko.json` — 单一数据源，零重复
- 辅助函数：`t(key)` 根据当前语言读取对应 JSON
- 语言切换组件：渲染 `/stats/`、`/en/stats/`、`/ko/stats/` 链接 — 配合 View Transitions，切换语言瞬间完成

**迁移：** 将所有页面内的 `texts{}` 对象提取到 3 个 JSON 文件中，合并重复键（导航、页脚、通用标签）。预估约 200 个唯一键值。

---

## 4. 页面过渡 — 形变动画

**技术：** Astro View Transitions API（基于浏览器 View Transitions API，带降级方案）。

**行为：**
- `Base.astro` head 中添加 `<ViewTransitions />` 启用客户端导航
- 共享元素添加 `transition:name="标识符"` — 从旧位置动画过渡到新位置
- 非共享内容交叉淡入淡出
- 导航和页脚通过 `transition:persist` 保持不变（不重新渲染）

**共享元素候选项：**
- 导航激活指示器 → 滑动到新位置
- 页面标题 → 在页面间形变过渡
- 武器卡片 → 展开为武器详情（如添加详情页）
- 玩家名称 → 从搜索携带到战绩页
- 地图缩略图 → 展开为完整地图视图

**降级方案：** 不支持 View Transitions API 的浏览器执行即时替换（无动画，但也无完整刷新 — 仍为类 SPA 体验）。

---

## 5. 设计令牌

用系统化的令牌层替代分散的 CSS 值，位于 `src/styles/tokens.css`：

```css
:root {
  /* 颜色 */
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-border: #2a2d3a;
  --color-text: #e0e0e0;
  --color-text-muted: #888;
  --color-primary: #60a5fa;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* 间距 */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* 字体 */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Consolas', 'Monaco', monospace;
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 22px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}

[data-theme="light"] {
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-border: #e0e0e0;
  --color-text: #1a1a1a;
  --color-text-muted: #666;
}
```

所有组件统一使用令牌。切换主题 = 替换令牌值，组件零改动。

---

## 6. UX 增强

### 6.1 全局搜索（Cmd+K）

CommandPalette.tsx — Preact 岛屿，`client:idle`（页面可交互后加载）。

- 触发：Cmd+K（Mac）/ Ctrl+K（Windows），或点击导航栏搜索图标
- 分区：玩家（最近搜索）、页面（所有站内页面）、武器（来自 weapons.json）、地图（来自地图列表）
- 键盘：方向键导航，Enter 选中，Esc 关闭
- 搜索为客户端模糊匹配（页面/武器/地图无需 API 调用；玩家搜索按 Enter 后调用 API）

### 6.2 PWA 增强

用 `@vite-pwa/astro`（Workbox）替代手动 `sw.js`：

- 预缓存：构建时自动缓存所有静态页面和资源（自动生成清单）
- 运行时缓存：API 响应使用 stale-while-revalidate 策略
- 离线：展示缓存页面，API 依赖功能显示优雅的离线提示
- 更新：Toast 提示「新版本可用 — 点击刷新」
- 安装：完整的 Web App Manifest（图标、主题色、display: standalone）

### 6.3 键盘导航

- 全局快捷键：`G 然后 S` = 战绩、`G 然后 M` = 地图、`G 然后 Q` = 测试、`G 然后 L` = 排行榜
- 焦点管理：Tab 可见焦点环、跳转导航链接、ARIA 地标
- 弹窗/浮层：Esc 关闭、焦点陷阱
- 地图页：方向键平移、+/- 缩放（Leaflet 已原生支持）

### 6.4 加载状态

Skeleton.astro 组件，CSS 微光动画（无需 JS）：

- 战绩页：玩家卡片、图表区域、标签内容的骨架屏
- 排行榜：骨架表格行
- 地图：侧边栏加载骨架
- 武器：卡片网格骨架
- 渐进填充：数据到达时逐步替换骨架元素（Preact 状态过渡）

### 6.5 Toast 消息提示

Toast.tsx — 全局 Preact 岛屿，`client:load`。

- 类型：成功（绿色）、错误（红色）、信息（蓝色）、警告（黄色）
- 自动消失，带进度条（默认 5 秒，可配置）
- 可堆叠（最多显示 3 条）
- 用法：`import { toast } from '../islands/Toast'` → `toast.success('玩家数据已加载')`
- 替代：内联错误信息、alert() 调用、仅控制台的错误

---

## 7. 项目结构

```
keygene.top/
├── src/
│   ├── components/          # Astro 组件（零 JS）
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── ServerStatus.astro
│   │   ├── WeaponCard.astro
│   │   ├── PlayerCard.astro
│   │   ├── MapThumbnail.astro
│   │   └── Skeleton.astro
│   ├── islands/             # Preact 岛屿（发送 JS）
│   │   ├── StatsEngine.tsx
│   │   ├── LeafletMap.tsx
│   │   ├── QuizEngine.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── SensCalc.tsx
│   │   ├── FlightSim.tsx
│   │   ├── TeamBuilder.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── Toast.tsx
│   ├── layouts/
│   │   └── Base.astro       # 共享布局（head、导航、页脚、过渡）
│   ├── pages/
│   │   ├── index.astro
│   │   ├── stats.astro
│   │   ├── maps.astro
│   │   ├── quiz.astro
│   │   ├── leaderboard.astro
│   │   ├── sensitivity.astro
│   │   ├── weapons.astro
│   │   ├── team.astro
│   │   └── flight.astro
│   ├── i18n/
│   │   ├── zh.json
│   │   ├── en.json
│   │   └── ko.json
│   └── styles/
│       └── tokens.css        # 设计令牌
├── public/
│   ├── assert/images/        # 现有图片（保持路径）
│   ├── assert/data/          # weapons.json、dropspots.json
│   └── favicon.ico
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## 8. 部署 — Cloudflare Pages

- **构建：** `astro build` → 输出到 `dist/`
- **部署：** Cloudflare Pages 连接 GitHub 仓库，推送到 `main` 自动部署
- **API 代理：** 现有 Cloudflare Workers 的 `/api/*` — 无需改动，Pages 和 Workers 共存于同一域名
- **自定义域名：** keygene.top 指向 Cloudflare Pages
- **预览：** 每个 PR 自动生成预览 URL（如 `abc123.keygene-top.pages.dev`）

---

## 9. 迁移策略

| 当前 | Astro | 说明 |
|------|-------|------|
| 11 个内联 JS/CSS 的 HTML 文件 | 9 个 .astro 页面 + Base.astro 布局 | 导航/页脚/head 去重 |
| shared.css（333 行） | tokens.css + 组件作用域样式 | 系统化设计令牌 |
| shared.js（152 行） | ThemeToggle.tsx + Base.astro 脚本 | 按职责拆分 |
| 每页 texts{} 国际化对象 | zh.json / en.json / ko.json | 单一数据源，零重复 |
| 每页内联 \<script\> | Preact 岛屿 .tsx 文件 | 可复用、可测试 |
| sw.js（手动） | @vite-pwa/astro（Workbox） | 自动生成，更智能的缓存 |
| GitHub Pages | Cloudflare Pages | 边缘 CDN、自动部署、预览 URL |
| 无页面过渡 | View Transitions + 形变动画 | ~800ms → ~120ms |
| html2canvas 分享卡片 | 保留为岛屿内工具函数 | 由 StatsEngine 导入 |

**方法：** 逐页迁移。先从布局 + 导航 + 最简单的页面（首页）开始，验证完整流程，再按复杂度依次迁移剩余页面。

---

## 10. 核心依赖

| 包名 | 用途 | 体积 |
|------|------|------|
| astro | 核心框架 | 仅构建时 |
| @astrojs/preact | Preact 集成 | 仅构建时 |
| preact | 岛屿运行时 | ~3 KB |
| @vite-pwa/astro | PWA/Workbox | 仅构建时 |
| leaflet | 地图瓦片 | ~40 KB（现有） |
| chart.js | 战绩图表 | ~60 KB（现有） |
| html2canvas | 分享卡片生成 | ~40 KB（现有） |

无新增重量级运行时依赖。Preact（3 KB）是唯一新增的客户端包。
