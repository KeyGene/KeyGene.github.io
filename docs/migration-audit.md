# KeyGene.top Astro 迁移全面审计报告

> 审计日期: 2026-04-17
> 对比范围: 旧版静态 HTML (commit e50b157^) vs 新版 Astro 5 + Preact Islands

---

## 目录

1. [全局问题](#全局问题)
2. [首页 (index)](#首页-index)
3. [地图 (maps)](#地图-maps)
4. [航线 (flight)](#航线-flight)
5. [武器 (weapons)](#武器-weapons)
6. [灵敏度 (sensitivity)](#灵敏度-sensitivity)
7. [人格测试 (quiz)](#人格测试-quiz)
8. [排行榜 (leaderboard)](#排行榜-leaderboard)
9. [数据中心 (stats)](#数据中心-stats)
10. [团队分析 (team)](#团队分析-team)
11. [改进方案优先级](#改进方案优先级)

---

## 全局问题

### SEO 回归
| 项目 | 旧版 | 新版 | 状态 |
|------|------|------|------|
| JSON-LD 结构化数据 | ✅ WebApplication schema | ❌ 缺失 | 回归 |
| `<meta name="keywords">` | ✅ 全部页面 | ❌ 缺失 | 回归 |
| `<link rel="canonical">` | ✅ 全部页面 | ❌ 缺失 | 回归 |
| hreflang 备选链接 | ✅ en/zh/ko/x-default | ❌ 缺失 | 回归 |
| OG meta | ✅ 完整 | ⚠️ 部分 (缺 og:url, og:description) | 部分回归 |

### CSS 变量命名不一致
| 页面 | 使用的命名 | 说明 |
|------|-----------|------|
| stats.astro | `--red`, `--gray-500`, `--card-bg` | 旧版命名 |
| leaderboard.astro | `--color-red`, `--color-gray-400` | 新版 tokens 命名 |
| team/weapons/quiz | `--color-red`, `--color-card-bg` | 新版 tokens 命名 |

**方案**: 统一使用 tokens.css 命名规范，stats.astro 的全局样式需要迁移到新变量名。

### 无障碍 (Accessibility)
| 项目 | 旧版 | 新版 | 状态 |
|------|------|------|------|
| `prefers-reduced-motion` | ✅ leaderboard 有 | ❌ 全部缺失 | 回归 |
| `focus-visible` 样式 | ✅ 全局定义 | ❌ 需确认 tokens.css | 待验证 |
| 键盘导航 | ❌ 无 | ❌ 无 | 均缺失 |

### html2canvas 背景色不统一
| 页面 | 背景色 |
|------|--------|
| team | `#111` |
| stats (overview) | `#0a0a0a` |
| stats (compare) | `#0a0a0a` |
| sensitivity | `#111` |
| flight | `#111` |

**方案**: 统一为 `#0a0a0a` 或使用 CSS 变量。

---

## 武器 (weapons)

### 功能差异

| 功能 | 旧版 | 新版 | 优先级 |
|------|------|------|--------|
| 武器详情面板 | ✅ 点击展开详情 | ✅ 已实现 | 已修复 |
| 武器对比雷达图 | ✅ Shift+点击对比 | ✅ 已实现 | 已修复 |
| 排序按钮 | ❌ 无 | ✅ DMG/RPM/VEL 排序 | 新增功能 |
| 枪械 emoji (🔫) | ✅ 每张卡片 32px | ❌ 已移除 | 低优 |
| 弹速显示 | ❌ 卡片无弹速 | ✅ 第三个 StatBar | 新增功能 |

### 样式差异

| 属性 | 旧版 | 新版 | 影响 |
|------|------|------|------|
| Hero 上内边距 | `120px 24px 32px` | `var(--space-xl) 0 var(--space-2xl)` ≈ `32px 0 48px` | ⚠️ 明显差异 |
| Hero 标题字号 | `42px` 硬编码 | `var(--text-3xl)` token | 需确认 token 值 |
| 网格最小列宽 | `minmax(180px, 1fr)` | `minmax(220px, 1fr)` | 新版卡片更宽 |
| 卡片数据字号 | `12px` | `11px` (StatBar) | 略小 |
| 内联样式 vs CSS 类 | CSS 类 (.weapon-card) | 全部内联 style={{}} | 可维护性下降 |

### ⚠️ 严重问题：零响应式样式

**旧版 @media (max-width: 768px)**:
- filter-bar padding: `0 24px`
- grid columns: `minmax(150px, 1fr)`
- detail/compare padding: `0 24px`
- hero padding: `100px 24px 24px`
- hero title: `28px`
- detail grid: `1fr` 单列

**新版**: 无任何 @media 查询。移动端布局完全未适配。

### 按钮 hover 丢失

内联样式无法实现 `:hover` 伪类:
- CatBtn: 无 hover 效果
- SortBtn: 无 hover 效果
- 详情关闭按钮: 无 hover
- 对比 chip 移除: 无 hover

### 改进方案

1. **P0**: 添加响应式 @media 查询 (参照旧版 768px 断点)
2. **P1**: CatBtn/SortBtn 改用 CSS 类替代内联样式，恢复 hover 效果
3. **P2**: Hero 区域上内边距对齐旧版 (`120px` → 当前 `32px`)
4. **P3**: 考虑将内联样式迁移到 `<style>` 标签 (参照 SensCalc 方式)

---

## 灵敏度 (sensitivity)

### 功能差异

| 功能 | 旧版 | 新版 | 优先级 |
|------|------|------|--------|
| URL 参数解码 (分享链接恢复) | ✅ `decodeConfig()` 读取 `?d=&s=&v=` | ❌ 缺失 | **P0** |
| 分享卡片 | ✅ `generateShareCard()` | ✅ 已实现 html2canvas | 已修复 |
| 应用职业选手设置后滚动 | ✅ `scrollIntoView()` | ❌ 缺失 | P1 |
| Schema.org JSON-LD | ✅ WebApplication | ❌ 缺失 | P2 |

### 样式差异

| 属性 | 旧版 | 新版 |
|------|------|------|
| Hero 上内边距 | `120px 24px 40px` | `48px 24px 32px` |
| 布局左右内边距 | `0 48px 60px` | `0 var(--space-2xl) var(--space-2xl)` |
| 面板圆角 | `12px` | `var(--radius-lg)` |
| 面板内边距 | `28px` | `var(--space-lg)` |
| 结果卡片圆角 | `10px` | `var(--radius-md)` |
| 结果数值字号 | `28px` | `var(--text-2xl)` |

### 响应式: ✅ 已保留

旧版 @900px 和 @480px 断点在新版中均已复现。

### 改进方案

1. **P0**: 恢复 URL 参数解码功能 — 用户通过 `?d=800&s=50&v=1.0` 分享灵敏度配置
2. **P1**: 应用职业选手设置后 scrollIntoView 到计算面板
3. **P2**: 恢复 JSON-LD 结构化数据

---

## 人格测试 (quiz)

### 功能差异

| 功能 | 旧版 | 新版 | 优先级 |
|------|------|------|--------|
| 分享卡片 (Canvas 绘制) | ✅ 750x1334 自定义画布，含 logo/头像/昵称/分数/描述 | ❌ **完全缺失** | **P0** |
| 分享覆盖层 | ✅ 预览 + 保存/关闭 | ❌ 缺失 | P0 |
| 选项 hover 效果 | ✅ border-color 变化 | ❌ 内联样式无法 :hover | P1 |
| 选项最小高度 | ✅ `min-height: 48px; display: flex; align-items: center` | ❌ 缺失 | P1 |
| 类型小卡片 hover | ✅ `translateY(-2px)` + border-color | ❌ 缺失 | P2 |

### ⚠️ 严重问题：零响应式样式

**旧版 @media (max-width: 768px)**:
- `.landing-title { font-size: 36px }`
- `.quiz-container { padding: 80px 16px 40px }`
- `.question-text { font-size: 18px }`
- `.result-container { padding: 80px 12px 40px }`
- `.result-nickname { font-size: 32px }`
- `.sw-grid { grid-template-columns: 1fr }`
- `.types-grid { grid-template-columns: repeat(2, 1fr) }`

**新版**: 零 @media 查询。landing-title 使用了 `clamp(36px, 8vw, 52px)` 部分补偿。

### ⚠️ 内容被 Header 遮挡

| 区域 | 旧版 padding-top | 新版 padding-top |
|------|------------------|------------------|
| 测试容器 | `100px` | `24px` |
| 结果容器 | `100px` | `24px` |

固定 header 高度 72px，新版 24px 的上内边距会导致内容被遮挡。

### 改进方案

1. **P0**: 恢复分享卡片功能 (Canvas 绘制 750x1334，含品牌元素)
2. **P0**: 添加响应式 @media 查询
3. **P0**: 修复 padding-top 为 `calc(var(--header-height) + 24px)` 或更大值
4. **P1**: 选项卡片改用 CSS 类，恢复 hover 效果
5. **P1**: 恢复 `min-height: 48px` 保证点击区域一致
6. **P2**: all-types 覆盖层使用主题变量替代硬编码颜色

---

## 排行榜 (leaderboard)

### 功能差异

| 功能 | 旧版 | 新版 | 优先级 |
|------|------|------|--------|
| 玩家名链接到数据页 | ❌ 纯文本 | ✅ `<a>` 链接 | 新增改进 |
| 表格行 hover 过渡 | ✅ `transition: background 0.15s` | ❌ 缺失 | P2 |
| JSON-LD / canonical / hreflang | ✅ 完整 | ❌ 缺失 | P2 |

### 样式差异

| 属性 | 旧版 | 新版 | 影响 |
|------|------|------|------|
| 容器最大宽度 | `1200px` | `1000px` | 新版窄 200px |
| 容器侧边 padding | `48px` | `24px` | 新版更紧凑 |
| 加载动画类名 | `.lb-status .spinner` | `.lb-spinner` | 无视觉差异 |

### 响应式: ✅ 基本保留

768px 断点规则基本一致，avgdmg 列正确隐藏。

### 改进方案

1. **P2**: 添加 `transition: background 0.15s` 到表格行
2. **P2**: 考虑恢复 1200px 最大宽度
3. **P3**: 恢复 SEO 元数据

---

## 数据中心 (stats)

### 功能差异

| 功能 | 旧版 | 新版 | 优先级 |
|------|------|------|--------|
| Wrapped 数字计数动画 | ✅ requestAnimationFrame 从0数到目标值 | ❌ 缺失 | P1 |
| 热力图自定义 tooltip | ✅ CSS `::after` 伪元素，悬浮显示详情 | ❌ 仅 native title | P1 |
| 导出图片范围 | ✅ 整个 tab-overview | ⚠️ 仅 overviewCapture 区域 | P2 |
| 导出完成 toast | ✅ 显示提示 | ❌ 缺失 | P2 |
| 按钮 emoji 前缀 | ✅ 📸 前缀 | ❌ 缺失 | P3 |
| ban-result 过渡动画 | ✅ `transition: opacity 0.3s` | ❌ 缺失 | P3 |
| Wrapped 段位名称显示 | ✅ rank-name (金色 16px 加粗) | ❌ 缺失 | P2 |

### 样式差异

Stats 页面的全局样式是旧版的直接拷贝，因此 CSS 值基本一致。但使用了旧版变量命名 (`--red` 而非 `--color-red`)。

### 响应式: ✅ 保留

768px 断点规则完整保留。

### 改进方案

1. **P1**: 恢复 Wrapped 数字计数动画
2. **P1**: 恢复热力图自定义 tooltip (CSS ::after)
3. **P2**: 扩大导出图片范围 + toast 反馈
4. **P2**: 恢复 Wrapped 段位名称显示
5. **P3**: CSS 变量名迁移到 tokens 规范

---

## 团队分析 (team)

### 功能差异

| 功能 | 旧版 | 新版 | 优先级 |
|------|------|------|--------|
| 海报生成 | ✅ `generateShareCard()` | ✅ 已实现 html2canvas | 已修复 |
| 服务器/模式选择器 | ✅ 下拉选择 steam/kakao/psn/xbox | ❌ 硬编码 `steam` squad | P1 |
| Hero 副标题 | ✅ 描述性文字 | ❌ 缺失 | P2 |
| Toast 淡入动画 | ✅ `transition: opacity 0.3s` | ❌ 瞬间出现/消失 | P3 |

### 🐛 代码 BUG

**TeamBuilder.tsx 约 272 行**:
```tsx
style="...opacity:loading?0.5:1"
```
这是**字符串字面量**，不是计算表达式。`opacity` 始终为无效值 `"loading?0.5:1"`。
**修复**: 改为 `style={{...opacity: loading ? 0.5 : 1}}`

### 样式差异

| 属性 | 旧版 | 新版 |
|------|------|------|
| 全部使用 CSS 类 | ✅ `.team-card`, `.role-row` 等 | ❌ 全部内联样式 |
| Hero padding | `120px 24px 32px` | `48px 24px 32px` |
| 按钮 hover | ✅ CSS :hover | ❌ 内联无法 hover |
| Input focus | ✅ CSS :focus | ⚠️ JS onFocus handler |

### 响应式差异

| 断点 | 旧版 | 新版 |
|------|------|------|
| @900px | results-grid → 1列, cards → 2列 | ❌ 缺失 900px 断点 |
| @768px | input → 1列, hero → 100px/28px, padding → 24px | ⚠️ 仅 player-grid 响应式 |
| @480px | player-grid → 1列 | ✅ 已修复 |

**缺失**: input 网格未响应式 (始终 2 列)、hero 未响应式、results padding 未响应式。

### 改进方案

1. **P0**: 修复 opacity BUG (字符串字面量 → 计算表达式)
2. **P1**: 添加 @900px 和 @768px 响应式断点
3. **P1**: 恢复服务器/模式选择器
4. **P2**: 按钮改用 CSS 类恢复 hover 效果
5. **P2**: 恢复 Hero 副标题

---

## 首页 (index)

### 功能差异

| 功能 | 旧版 | 新版 | 状态 |
|------|------|------|------|
| Hero 区域 | ✅ 背景图+文字+按钮 | ✅ Hero.astro 组件 | 等效 |
| 服务器状态轮询 | ✅ serverStatusPoller | ✅ ServerStatus.astro | 等效 |
| 战绩查询表单 | ✅ 跳转 stats.html | ✅ 跳转 /stats/ | 等效 |
| 战队数据加载 (PUBG API) | ✅ loadClanData() | ✅ is:inline script | 等效 |
| Hero 数字计数动画 | ✅ countUp() | ✅ countUp() | 等效 |
| 滚动显现动画 | ✅ IntersectionObserver | ✅ reveal script | 等效 |
| Glass Card (液态玻璃) | ✅ 咨询卡片 | ✅ glass-card | 等效 |

### 样式差异

| 属性 | 旧版 | 新版 |
|------|------|------|
| Hero padding | `0 64px; padding-top: calc(72px + 12vh)` | 类似，使用 `var(--header-height)` |
| Hero h1 字号 | `64px` | 相同 |
| Section padding | `80px 64px` | `80px 64px` 相同 |
| 容器最大宽度 | `1200px` | `1200px` 相同 |

### 响应式: ✅ 完整保留

新版 @768px 断点包含: section padding, about-grid 1列, roster-grid 2列, stats-form 纵向, join-actions 居中等。

### 改进方案

首页迁移完整度最高，无重大差异。
1. **P2**: 恢复 SEO 元数据 (JSON-LD 等)
2. **P3**: Hero 移动端断点样式在 Hero.astro 组件内，需确认 `stats-bar { display: none }` 移动端隐藏是否生效

---

## 地图 (maps)

### 功能差异

| 功能 | 旧版 | 新版 | 状态 |
|------|------|------|------|
| 网格工具 | ✅ 10x10 网格 | ✅ 相同 | 等效 |
| 测距工具 | ✅ 点击画线 | ✅ 相同 | 等效 |
| 投掷物工具 | ✅ 4种投掷物+范围圈 | ✅ 相同 | 等效 |
| 编辑模式 | ✅ 拖拽标点+导出JSON | ✅ 相同 | 等效 |
| 标点面板 | ✅ 按类型筛选 | ✅ 相同 | 等效 |
| 10张地图 | ✅ | ✅ | 等效 |

### 已修复问题

| 问题 | 状态 |
|------|------|
| 移动端 margin-top 缺失 | ✅ 已修复 (60px) |
| `<style is:global>` CSS 丢失 | ✅ 已修复 |
| Leaflet 加载竞态条件 | ✅ 已修复 (tryInit 重试) |

### 样式差异

| 属性 | 旧版 | 新版 |
|------|------|------|
| CSS 变量 | `--red`, `--card-border` | `--color-red`, `--color-border` (带 fallback) |
| 滚动条颜色 | `var(--gray-800)` | ✅ 已改为 `var(--color-gray-800, #333)` |
| 投掷物面板背景 | `rgba(0,0,0,0.85)` | `rgba(0,0,0,0.85)` 相同 |

### 响应式: ✅ 完整保留

两个 @768px 断点均已复现: sidebar 横向布局 + 工具面板位置调整。

### 改进方案

1. **P3**: 滚动条颜色改为使用主题变量

---

## 航线 (flight)

### 功能差异

| 功能 | 旧版 | 新版 | 状态 |
|------|------|------|------|
| 航线路径绘制 | ✅ 点击起终点 | ✅ 相同 | 等效 |
| 推荐跳点排名 | ✅ 按距离/资源质量 | ✅ 相同 | 等效 |
| 清除/分享按钮 | ✅ | ✅ | 等效 |
| 分享卡片 | ✅ html2canvas | ✅ 已修复 | 等效 |

### 已修复问题

| 问题 | 状态 |
|------|------|
| 高度计算 160px | ✅ 改为 `var(--header-height)` |
| 分享卡片缺失 | ✅ 已添加 html2canvas |

### 响应式: ✅ 保留

@768px 断点: flex-direction column, sidebar 高度限制。

### 改进方案

航线页迁移完整，无重大差异。

---

## 改进方案执行状态

### P0 — 必须修复 ✅ 全部完成

| # | 页面 | 问题 | 状态 |
|---|------|------|------|
| 1 | team | opacity BUG (字符串字面量) | ✅ 已修复 |
| 2 | quiz | 分享卡片完全缺失 (Canvas 绘制 750x1334) | ✅ 已修复 |
| 3 | quiz | 零响应式样式 | ✅ 已修复 |
| 4 | quiz | padding-top 24px 被 header 遮挡 | ✅ 已修复 (90px) |
| 5 | weapons | 零响应式样式 | ✅ 已修复 |
| 6 | sensitivity | URL 参数解码缺失 (分享链接) | ✅ 已修复 |

### P1 — 应该修复 ✅ 全部完成

| # | 页面 | 问题 | 状态 |
|---|------|------|------|
| 7 | weapons | hover 效果丢失 (CatBtn/SortBtn) | ✅ 已修复 |
| 8 | quiz | 选项 hover + min-height 丢失 | ✅ 已修复 |
| 9 | stats | Wrapped 数字计数动画缺失 | ✅ 已修复 |
| 10 | stats | 热力图 tooltip 退化 | ✅ 已修复 |
| 11 | team | @900px/@768px 响应式断点 | ✅ 已修复 |
| 12 | team | 服务器/模式选择器缺失 | ✅ 已修复 |
| 13 | sensitivity | 应用设置后 scrollIntoView | ✅ 已修复 |

### P2 — 建议修复 ✅ 全部完成

| # | 页面 | 问题 | 状态 |
|---|------|------|------|
| 14 | 全局 | SEO 元数据回归 (JSON-LD/canonical/hreflang) | ✅ 已修复 |
| 15 | 全局 | html2canvas 背景色统一 → #0a0a0a | ✅ 已修复 |
| 16 | stats | 导出 toast 反馈 | ✅ 已修复 |
| 17 | stats | Wrapped 段位名称显示 (金色) | ✅ 已修复 |
| 18 | team | Hero 副标题恢复 | ✅ 已修复 |
| 19 | team | 按钮 hover 效果恢复 | ✅ 已修复 |
| 20 | leaderboard | 表格行 hover 过渡动画 | ✅ 已修复 |
| 21 | leaderboard | 容器宽度 1000→1200 | ✅ 已修复 |
| 22 | weapons | Hero padding 对齐 | ✅ 已修复 |

### P3 — 可选改进 ✅ 全部完成

| # | 页面 | 问题 | 状态 |
|---|------|------|------|
| 23 | 全局 | `prefers-reduced-motion` 支持 | ✅ 已修复 |
| 24 | stats | CSS 变量名迁移到 tokens 规范 | ✅ 已修复 |
| 25 | maps | 滚动条颜色硬编码 → 变量 | ✅ 已修复 |
| 26 | stats | 按钮 emoji 前缀恢复 📸 | ✅ 已修复 |
| 27 | quiz | all-types 覆盖层使用主题变量 | ✅ 已修复 |

---

## 执行统计

| 优先级 | 总数 | 已完成 | 待实现 | 完成率 |
|--------|------|--------|--------|--------|
| P0 | 6 | 6 | 0 | **100%** |
| P1 | 7 | 7 | 0 | **100%** |
| P2 | 9 | 9 | 0 | **100%** |
| P3 | 5 | 5 | 0 | **100%** |
| **合计** | **27** | **27** | **0** | **100%** |

### 全部 27 项改进已完成 ✅

---

## 第二轮深度审计 (2026-04-18)

逐页对比旧版 HTML 与新版 Astro 的全部样式、功能、适配差异。

### 已修复问题

| # | 页面 | 问题 | 严重度 | 状态 |
|---|------|------|--------|------|
| 28 | stats (全局) | 73处旧CSS变量未迁移 (--red/--white/--gray等) → tokens 变量不存在导致颜色丢失 | **高** | ✅ 已修复 |
| 29 | stats (islands) | CompareTab/HeatmapTab/WrappedTab 残留旧变量 | **高** | ✅ 已修复 |
| 30 | tokens.css | 缺少 --color-gray-500/--color-gray-800 定义 | **高** | ✅ 已修复 |
| 31 | quiz | 选项 transition (border/bg/color) 丢失 → 选中闪跳 | **中** | ✅ 已修复 |
| 32 | quiz | 分享覆盖层缺少 backdrop-filter: blur(10px) | **低** | ✅ 已修复 |
| 33 | quiz | 类型卡片 :hover translateY(-3px) 无法用 inline style | **中** | ✅ 已修复 |
| 34 | quiz | 结果卡片移动端 padding 无缩小 (32px→24px @768px) | **低** | ✅ 已修复 |
| 35 | quiz | 上一题按钮 hover 效果丢失 | **低** | ✅ 已修复 |
| 36 | leaderboard | 容器 padding 48px → 24px (比旧版窄) | **中** | ✅ 已修复 |
| 37 | nav | 当前页面导航高亮缺失 | **中** | ✅ 已修复 |
| 38 | stats | ban-result transition: opacity 0.3s 丢失 | **低** | ✅ 已修复 |

### 已知差异 (设计取舍，非bug)

| 页面 | 差异描述 | 说明 |
|------|----------|------|
| index | 无中间断点 (平板 1024px) | 新版仅 768px 断点 |
| index | 无视差滚动 (hero parallax) | Astro VT 替代 |
| quiz | 着陆页 padding 72→90px | 适配更高的 header |
| flight | 10秒时间标记改为8点范围圆 | 简化实现 |
| sensitivity | 按钮从 clip-path 切角改为 border-radius | 设计统一 |
| team | Season/Mode 选择器改为 Shard 选择器 | API 适配 |
| weapons | 武器卡片从图标改为文字+进度条 | 新设计 |
| i18n | 从客户端 data-key 换为服务端渲染 | 架构升级 |

### 第二轮追加修复

| # | 页面 | 问题 | 状态 |
|---|------|------|------|
| 39 | index | Roster section 缺少 .reveal 滚动动画 | ✅ 已修复 |
| 40 | sensitivity | 滑块 thumb hover scale(1.2) 丢失 | ✅ 已修复 |
| 41 | stats | Compare input 专属样式缺失 | ✅ 已修复 |

### 待评估项 (需设计决策)

| 页面 | 问题 | 复杂度 |
|------|------|--------|
| weapons | 缺少武器图标 (.weapon-icon 120x60) | 中 (需图片资源) |
| weapons | 缺少 TTK 对比图表 | 高 |
| team | 缺少阵容 fit 百分比显示 | 中 |

---

## 第三轮审计：响应式 / 无障碍 / SEO / 一致性 (2026-04-18)

### 已修复

| # | 类别 | 问题 | 状态 |
|---|------|------|------|
| 42 | SEO | 缺少 og:url meta 标签 | ✅ 已修复 |
| 43 | 无障碍 | 全局缺少 :focus-visible 样式 | ✅ 已修复 (tokens.css) |
| 44 | 无障碍 | leaderboard outline:none 破坏键盘导航 | ✅ 已修复 → focus-visible |
| 45 | 无障碍 | Nav 移动端关闭按钮缺少 aria-label | ✅ 已修复 |
| 46 | 无障碍 | CommandPalette 搜索框缺少 aria-label | ✅ 已修复 |
| 47 | 无障碍 | StatsEngine 搜索框缺少 aria-label | ✅ 已修复 |
| 48 | 字体 | leaderboard 使用未定义 --font-body 变量 | ✅ 已修复 → --font-sans |
| 49 | 字体 | FlightSim 硬编码 font-family:Rubik | ✅ 已修复 → var(--font-sans) |

### 第四轮修复 (2026-04-18)

| # | 类别 | 问题 | 状态 |
|---|------|------|------|
| 50 | 亮色主题 | CompareTab 输入框 rgba(255,255,255,0.06) 亮色不可见 → 改用 CSS 类 | ✅ 已修复 |
| 51 | 亮色主题 | WeaponFilter 进度条背景 → var(--color-border) | ✅ 已修复 |
| 52 | 亮色主题 | leaderboard 表格/选择器缺少 light theme 覆盖 | ✅ 已修复 |
| 53 | 性能 | Hero 图片缺少 width/height (CLS) | ✅ 已修复 |
| 54 | 性能 | about-team 图片缺少 width/height + loading=lazy | ✅ 已修复 |
| 55 | 响应式 | 404 页面无移动端断点 | ✅ 已修复 |
| 56 | 无障碍 | CompareTab 输入框缺少 aria-label | ✅ 已修复 |

### 第五轮修复 (2026-04-18)

| # | 类别 | 问题 | 状态 |
|---|------|------|------|
| 57 | 一致性 | en/ko stats.astro style块存在重复CSS规则 | ✅ 已修复 (完整同步) |
| 58 | 亮色主题 | quiz/team/weapons 已确认使用 CSS 变量, 自动适配亮色 | ✅ 确认OK |

### 亮色主题验证结果

| 页面 | 亮色支持 | 说明 |
|------|----------|------|
| index | ✅ | Hero.astro + tokens.css 覆盖 |
| stats | ✅ | 专属 light 覆盖 (banner/badge/record/match-map/wrapped) |
| leaderboard | ✅ | 第四轮添加 table/select light 覆盖 |
| maps | ✅ | .leaflet-container 有 light 覆盖 |
| quiz | ✅ | 全部使用 var(--color-*) tokens |
| weapons | ✅ | 全部使用 var(--color-*) tokens (Chart.js grid除外) |
| team | ✅ | 全部使用 var(--color-*) tokens (Chart.js grid除外) |
| sensitivity | ✅ | SensCalc 有专属 light 覆盖 |
| flight | ⚠️ | Leaflet map tiles 始终深色; 侧边栏/按钮使用 tokens |

### 第六轮修复 (2026-04-18)

| # | 类别 | 问题 | 状态 |
|---|------|------|------|
| 59 | 按钮 | TeamBuilder analyze 按钮 inline → btn-clip btn-red | ✅ 已修复 |
| 60 | 按钮 | TeamBuilder copy/poster 按钮 inline → btn-clip btn-outline/btn-red | ✅ 已修复 |
| 61 | 清理 | 移除 team-btn-outline/team-btn-red 无用样式 | ✅ 已修复 |

### 已知待改进 (低优先级, 非阻塞)

| 类别 | 问题 | 复杂度 |
|------|------|--------|
| 响应式 | FlightSim/LeafletMap 缺少 @media 断点 (依赖 inline style) | 中 |
| SEO | JSON-LD 为全站通用, 缺少页面专属 schema | 低 |
| Chart.js | Compare/Weapon radar chart grid 用硬编码 rgba(255,255,255,0.08) | 低 |

---

## 总审计统计

| 轮次 | 修复数 | 重点 |
|------|--------|------|
| 第一轮 | 27 | 功能缺失 (分享卡/响应式/hover/URL参数) |
| 第二轮 | 14 | CSS变量迁移 / Quiz交互 / Nav高亮 |
| 第三轮 | 8 | SEO (og:url) / 无障碍 / 字体一致性 |
| 第四轮 | 7 | 亮色主题 / CLS性能 / 404响应式 |
| 第五轮 | 2 | en/ko同步 / 亮色主题验证 |
| 第六轮 | 3 | 按钮风格统一 |
| 第七轮 | 0 | FlightSim响应式确认OK (flight.astro已覆盖) |
| 第八轮 | 0 | 全面回归扫描: 旧变量0处, font-family一致, en/ko同步, build 28页0错误 |
| 第九轮 | 4 | Toast淡出动画 / 分享按钮错误反馈 |
| 第十轮 | 6 | 首页/Stats/Quiz 深度对比修复 |
| 第十一~十二轮 | 8 | Maps/Leaderboard/Stats/Quiz 深度对比修复 |
| **合计** | **79** | **已修复 72, 设计决策 4, 低优先级 3** |

### 第十一~十二轮修复 (2026-04-18)

| # | 类别 | 问题 | 状态 |
|---|------|------|------|
| 72 | Quiz | 分享弹窗关闭按钮用内联样式应为 btn-clip btn-outline | ✅ 已修复 |
| 73 | Stats | WeaponsTab 武器名映射缺少 Weap* 格式 (显示原始名) | ✅ 已修复 |
| 74 | Stats | 429 限流错误显示为 "玩家未找到" 应为限流提示 | ✅ 已修复 |
| 75 | Stats | 搜索后 URL 不更新 (已在第十轮修复, 此轮添加限流) | ✅ 已修复 |
| 76 | 排行榜 | 移动端容器 48px 边距未缩减为 16px | ✅ 已修复 |
| 77 | 排行榜 | SEO description 用了 lbNoData 错误消息 | ✅ 已修复 |
| 78 | 排行榜 | focus-visible 双重 outline+border 视觉回归 | ✅ 已修复 |
| 79 | Maps | 切换地图后移动端侧栏未 scrollIntoView | ✅ 已修复 |

### 第十轮修复 (2026-04-18)

| # | 类别 | 问题 | 状态 |
|---|------|------|------|
| 66 | 首页 | stats-input 背景用 --color-bg 应为 --color-card-bg | ✅ 已修复 |
| 67 | 首页 | clanInfo 在 clan API 失败时未隐藏 | ✅ 已修复 |
| 68 | 首页 | 移除死代码 playerStats/statsGrid/copyContainer | ✅ 已修复 |
| 69 | Stats | BanCheck 搜索框在已有玩家时被隐藏 (无法查其他人) | ✅ 已修复 |
| 70 | Stats | 搜索后 URL ?player= 不更新 (不可分享) | ✅ 已修复 |
| 71 | Quiz | 重试按钮应为 btn-outline (非 btn-red) | ✅ 已修复 |

### 第九轮修复 (2026-04-18)

| # | 类别 | 问题 | 状态 |
|---|------|------|------|
| 62 | 交互 | SensCalc toast 消失无淡出动画 | ✅ 已修复 |
| 63 | 交互 | SensCalc 分享卡按钮 html2canvas 未加载时静默失败 | ✅ 已修复 |
| 64 | 交互 | FlightSim 分享按钮无用户反馈 (fallback clipboard + toast) | ✅ 已修复 |
| 65 | 交互 | TeamBuilder 海报按钮 html2canvas 未加载时静默失败 | ✅ 已修复 |

### 第八轮验证 (2026-04-18)

全面回归扫描结果:
- ✅ 旧 CSS 变量 (`--red`, `--white`, `--gray-*`, `--card-bg`, `--font`) — 0 处残留
- ✅ 硬编码 `font-family` — 0 处 (全部使用 `var(--font-sans)`)
- ✅ en/ko 样式同步 — leaderboard/team/weapons 与 zh 一致
- ✅ `outline: none` — 仅出现在有 `:focus` border 替代的 input 上
- ✅ Build — 28 pages, 0 errors
- ✅ 49 files changed, 1969 insertions, 974 deletions
