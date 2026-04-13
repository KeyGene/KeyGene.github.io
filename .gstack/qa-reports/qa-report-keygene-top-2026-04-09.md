# QA Report: KeyGene.top (keygene.github.io)

**Date:** 2026-04-09
**Tester:** GStack QA (automated)
**URL:** https://keygene.github.io / https://keygene.top
**Framework:** Static HTML + Leaflet.js + PUBG API
**Pages Tested:** 5 (首页, 战绩, 地图, 排行榜, 移动端)
**Screenshots:** 15+
**Duration:** ~10 minutes

---

## Health Score: 62 / 100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Console | 40 | 15% | 6.0 |
| Links | 100 | 10% | 10.0 |
| Visual | 70 | 10% | 7.0 |
| Functional | 55 | 20% | 11.0 |
| UX | 70 | 15% | 10.5 |
| Performance | 80 | 10% | 8.0 |
| Content | 77 | 5% | 3.85 |
| Accessibility | 55 | 15% | 8.25 |
| **Total** | | | **64.6** |

---

## Top 3 Things to Fix

1. **排行榜页面完全无法加载** - API 返回 400 错误，用户看到"排行榜数据加载失败"
2. **地图页面移动端严重错位** - 右半部分完全黑屏，地图瓦片无法正确加载
3. **封禁查询输入框占位符语言不一致** - 其他所有 UI 都是中文，唯独这个是英文 "Enter player name..."

---

## Issues

### ISSUE-001: 排行榜 API 加载失败 (Critical)

**Category:** Functional
**Severity:** Critical
**Page:** /leaderboard.html

**Description:**
排行榜页面加载时，API 请求返回 HTTP 400 错误。页面显示红色错误信息"排行榜数据加载失败。"所有 6 个排行模式（组排FPP、组排、双排FPP、双排、单排FPP、单排）均无法使用。

**Console Error:**
```
Failed to load resource: the server responded with a status of 400 ()
Leaderboard error: Error: Failed to fetch leaderboard
    at fetchLeaderboard (leaderboard:404:26)
    at async loadLeaderboard (leaderboard:451:22)
```

**Evidence:** screenshots/leaderboard.png

**Impact:** 整个排行榜功能完全不可用。用户从导航进入该页面会看到空白+错误信息，体验很差。

---

### ISSUE-002: 地图页面移动端显示严重错位 (Critical)

**Category:** Visual / Responsive
**Severity:** Critical
**Page:** /maps.html (viewport 375x812)

**Description:**
在移动设备尺寸下(375x812)，Leaflet 地图仅渲染左半部分区域，右半部分完全黑屏。地图上的标记点散布在黑色区域中，无法正常交互。左侧地图选择面板与地图区域重叠。

**Evidence:** screenshots/maps-mobile.png

**Impact:** 移动端用户完全无法正常使用地图功能。地图是核心功能之一，这个问题影响所有手机/平板用户。

---

### ISSUE-003: 封禁查询输入框占位符语言不一致 (Medium)

**Category:** Content / i18n
**Severity:** Medium
**Page:** /stats.html > 封禁查询 tab

**Description:**
当 UI 处于中文模式时，封禁查询 tab 内的输入框占位符显示为英文 "Enter player name..."，而页面上所有其他输入框和按钮都是中文（如"输入 PUBG 玩家名..."、"查询"）。

**Evidence:** screenshots/stats-ban.png

**Impact:** i18n 不一致，看起来不专业。用户可能困惑。

---

### ISSUE-004: 最近比赛中地图名称显示为技术 ID (Medium)

**Category:** Content / UX
**Severity:** Medium
**Page:** /stats.html > 最近比赛 tab

**Description:**
部分比赛记录的地图名称显示为内部技术标识符 "DESERT_MAIN_BINARYSP..." 而非用户友好的名称（如 "Miramar"）。名称被截断且不可读。与正确显示为 "ERANGEL" 的记录形成对比。

**Evidence:** screenshots/stats-recent.png

**Impact:** 用户无法识别这些比赛是在哪张地图上进行的。

---

### ISSUE-005: 排行榜页面 Footer 链接缺失 (Low)

**Category:** UX / Content
**Severity:** Low
**Page:** /leaderboard.html

**Description:**
排行榜页面的 footer 只有 3 个链接（关于、战绩、联系），而首页 footer 有 5 个链接（关于、战绩、地图、排行榜、联系）。缺少"地图"和"排行榜"链接，footer 不一致。

**Evidence:** screenshots/leaderboard.png vs screenshots/initial.png

**Impact:** 导航不一致，用户体验碎片化。

---

### ISSUE-006: 首页搜索不跳转到战绩页面 (Medium)

**Category:** Functional / UX
**Severity:** Medium
**Page:** / (首页)

**Description:**
在首页底部的"查看你的数据"区域搜索玩家名后，结果直接在首页内联显示（页面滚动到底部），而不是跳转到专门的 /stats.html 页面。这意味着用户只能看到简化的结果，无法直接访问完整的 tab 功能（武器分析、地图胜率、对比等）。

**Evidence:** screenshots/home-search-result.png

**Impact:** 用户需要额外步骤才能访问完整战绩功能。可以考虑搜索后直接跳转到 stats.html。

---

### ISSUE-007: Stats 页面 404 资源错误 (Medium)

**Category:** Console
**Severity:** Medium
**Page:** /stats.html

**Description:**
在战绩页面浏览过程中，控制台出现 404 资源加载失败错误。这发生在切换到武器分析 tab 时。

**Console Error:**
```
Failed to load resource: the server responded with a status of 404 ()
```

**Impact:** 虽然武器分析 tab 最终加载成功，但 404 错误表明有资源请求路径不正确，可能影响加载速度或部分功能。

---

### ISSUE-008: 移动端首页底部内容区域视觉问题 (Low)

**Category:** Visual / Responsive
**Severity:** Low
**Page:** / (首页, 375x812)

**Description:**
移动端首页底部的团队成员卡片区域和数据查询区域的红色边框样式看起来像是调试用的 outline，视觉上不协调。footer 区域的联系信息排版在小屏幕上显得拥挤。

**Evidence:** screenshots/home-mobile.png

**Impact:** 视觉打磨不够，影响移动端整体观感。

---

## Working Well

- **EN/ZH 语言切换** - 一键切换，所有主要内容正确翻译，响应迅速
- **战绩查询核心功能** - 搜索玩家、概览、最近比赛、武器分析、地图胜率、对比功能均正常运行
- **桌面端整体视觉** - 暗色主题配合 PUBG 风格，首页 hero 区域设计感强
- **导航结构** - 清晰的顶部导航，首页锚点滚动流畅
- **移动端汉堡菜单** - 菜单展开/收起正常，链接可点击
- **地图页面桌面端** - Leaflet 地图加载正常，标记点丰富，左侧面板交互正常

---

## Console Health Summary

| Page | Errors | Details |
|------|--------|---------|
| 首页 (/) | 0 | Clean |
| 战绩 (/stats.html) | 1 | 404 resource loading failure |
| 地图 (/maps.html) | 0 | Clean |
| 排行榜 (/leaderboard.html) | 2 | API 400 + fetch error |
| **Total** | **3** | |

---

## Pages Visited

| Page | Status | Notes |
|------|--------|-------|
| / (首页) | OK | Desktop + Mobile tested |
| /stats.html | OK (partial) | 7 tabs tested, minor issues |
| /maps.html | OK (desktop) / BROKEN (mobile) | Leaflet rendering issue on small viewport |
| /leaderboard.html | BROKEN | API failure, no data loads |

---

## Recommendations

1. **P0 - Fix leaderboard API:** The 400 error suggests either the API endpoint changed, the request parameters are wrong, or PUBG API key/quota issue. This is a complete feature outage.

2. **P0 - Fix maps mobile rendering:** The Leaflet map container likely needs `width: 100%` or the map needs `invalidateSize()` called after the container is visible on mobile. The left panel might need a collapsible/overlay design on mobile.

3. **P1 - Fix map name display:** Map technical IDs like "DESERT_MAIN_BINARYSP..." should be mapped to friendly names (Miramar, Erangel, etc.) in the match history display.

4. **P1 - Fix i18n consistency:** The ban check placeholder should respect the current language setting.

5. **P2 - Standardize footers:** All pages should have consistent footer links.

6. **P2 - Homepage search UX:** Consider redirecting to /stats.html with the search query pre-filled instead of inline results.

---

No test framework detected. Run `/qa` to bootstrap one and enable regression test generation.
