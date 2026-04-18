# 重构前后全面对比审计报告 (Before/After Refactoring Audit)

> Audit date: 2026-04-18
> Old baseline: commit `e50b157^` (vanilla HTML/CSS/JS)
> New baseline: current `master` (Astro 5 + Preact islands)

---

## 概述 (Overview)

Total differences found: **78**

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 8 | Functionality lost or broken |
| Major | 24 | Visible style regressions or missing features |
| Minor | 46 | Subtle style differences, token mismatches, minor UX changes |

---

## 全局差异 (Global Differences)

### 1. CSS Custom Properties / Design Tokens

The entire color system was replaced. This is the single largest source of visual differences.

| Property | Old (shared.css) | New (tokens.css) | Impact |
|----------|-----------------|-------------------|--------|
| Background | `--black: #000000` | `--color-bg: #0f1117` | **Major** - Background is now dark blue-gray instead of pure black |
| Text | `--white: #ffffff` | `--color-text: #e0e0e0` | **Major** - Text is now gray instead of pure white |
| Muted text | `--gray-400: #9ca3af` | `--color-text-muted: #888` | Minor - slightly different gray |
| Card bg | `rgba(255,255,255,0.06)` | `rgba(26,29,39,0.85)` | **Major** - Cards are now opaque dark-blue instead of transparent white |
| Card border | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.06)` | Minor - borders are less visible |
| Primary link color | N/A (used `--red` or `--white`) | `--color-primary: #60a5fa` (blue) | **Major** - Links are now blue instead of red/white |
| Surface color | N/A | `--color-surface: #1a1d27` | New token, no old equivalent |
| Gray-800 | `#1f1f1f` | `#1f2937` | Minor - slightly blue-tinted |
| Header bg | `rgba(0,0,0,0.4)` | `rgba(10,10,10,0.8)` via fallback | Minor - darker header |

**Light theme differences:**

| Property | Old | New | Impact |
|----------|-----|-----|--------|
| Background | `--black: #ffffff` (inverted) | `--color-bg: #f8f9fa` | Minor - slightly off-white |
| Text | `--white: #111111` | `--color-text: #1a1a1a` | Negligible |
| Card bg | `rgba(0,0,0,0.03)` | `rgba(255,255,255,0.9)` | **Major** - completely different card appearance |
| Header bg | `rgba(255,255,255,0.85)` | Not explicitly set in light tokens | May use fallback |

**Missing tokens in new system:**
- `--skeleton-from`, `--skeleton-mid` (old had dedicated skeleton tokens; new uses `--color-surface` / `--color-surface-hover`)
- `--glass-bg`, `--glass-border` (old had explicit glass morphism tokens)
- `--status-bg` (server status component background)
- `--overlay-bg` (used by mobile nav in old version)
- `--toggle-border`, `--toggle-hover` (old had explicit toggle tokens)
- `--subtle-bg`, `--subtle-border` (old had subtle variant tokens)

### 2. Global Reset

| Aspect | Old | New | Impact |
|--------|-----|-----|--------|
| `overflow-x: hidden` on body | Yes | No | Minor - possible horizontal scroll on some pages |
| `scroll-behavior: smooth` on html | Yes | No | Minor - no smooth scrolling |
| `scroll-padding-top: 80px` | Yes | No | Minor - anchor links may hide behind header |
| `:focus-visible` color | `var(--red)` | `var(--color-primary)` (blue) | Minor - focus ring is now blue |
| `line-height` on body | Not set | `1.6` | Minor - may affect text spacing globally |
| `a` global color | Not set | `var(--color-primary)` (blue) | **Major** - all unstyled links are now blue |
| `::selection` | Not set | blue background | Minor addition |

### 3. 导航栏 (Navigation)

| Aspect | Old | New | Severity |
|--------|-----|-----|----------|
| Header z-index | `100` | `1000` | Minor |
| Logo icon size | `36px` | `40px` (img width/height attributes) | Minor |
| Nav link hover color | `var(--white)` | `var(--color-text)` | Subtle difference due to token change |
| Active nav link | `color: var(--white)` | `color: var(--color-red)` | **Major** - active links are now red instead of white |
| Nav-right gap | `20px` | `var(--space-sm)` = `8px` | **Major** - controls are much more cramped |
| Language switcher | Toggle button cycling en/zh/ko | Segmented control with 3 visible links | **Major** - completely different component |
| Language approach | Client-side `data-key` + JS text swap | Server-side i18n with `/en/`, `/ko/` routes | **Critical** (architecture change - positive) |
| "Join Us" button in header | Present | **Missing** | **Major** - CTA button removed from nav |
| Mobile nav animation | `display: none/flex` toggle | `translateX(100%)` slide-in | Minor - different animation |
| Mobile nav background | `var(--overlay-bg)` (95% black) | `var(--color-bg)` (opaque) | Minor |
| Mobile group labels | `24px`, centered, clickable toggle | `var(--text-xs)` (~11px), left-aligned, non-interactive | **Major** - mobile nav groups always open, labels are tiny category headers |
| Mobile sub link size | `17px` | `var(--text-lg)` = `18px` | Negligible |
| Mobile nav on 768px | Hides `nav` + `btn-clip`, shows hamburger | Hides `nav` + `lang-switcher`, shows hamburger | Minor - lang switcher hidden on mobile too |
| Theme toggle | SVG moon/sun with border | Preact island `ThemeToggle.tsx` | Neutral (same behavior, different implementation) |
| Dropdown menu hover bg | `var(--subtle-bg)` | `rgba(255,255,255,0.05)` | Negligible |

### 4. 页脚 (Footer)

| Aspect | Old | New | Severity |
|--------|-----|-----|----------|
| Footer links | About, Stats, Maps, Leaderboard, Contact | **All removed** | **Critical** - footer is now copyright-only |
| Footer layout | `space-between` with links section | `space-between` but only copyright | Major regression |
| Footer padding | `24px 48px` | `var(--space-lg) 0` with inner max-width 1200px | Minor |
| Mobile footer | Column layout | Same structure | Neutral |

### 5. 按钮系统 (Button System)

| Aspect | Old | New | Severity |
|--------|-----|-----|----------|
| `.btn-white` color | `var(--white)` (text) on `var(--white)` (bg) - theme-aware | `#fff` bg, `#000` text - hardcoded | Minor - loses light theme adaptation |
| `.btn-outline` color | `var(--white)` | `var(--color-text)` | Subtle token difference |
| Button styles | Identical clip-path approach | Same | Neutral |

### 6. Skeleton Loading

| Aspect | Old | New | Severity |
|--------|-----|-----|----------|
| Shimmer animation | `background-position: -200px 0 / 200px 0` | `background-position: 200% 0 / -200% 0` | Minor - percentage-based is better |
| Skeleton background | Dedicated `--skeleton-from/mid` tokens | Uses `--color-surface` / `--color-surface-hover` | Minor |

---

## 页面对比 (Page-by-Page Comparison)

---

### 首页 (Index)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Hero padding-top | `calc(72px + 12vh)` hardcoded | `calc(var(--header-height) + 12vh)` tokenized | Good improvement |
| Section padding | `80px 64px` | Same | Neutral |
| Section title size | `42px` | Same | Neutral |
| Section title accent | `color: var(--red)` | `color: var(--color-red)` | Same value |
| About text color | `var(--gray-400)` | `var(--color-text-muted)` | Token difference: `#9ca3af` vs `#888` |
| Roster section bg | `var(--subtle-bg)` | `var(--color-surface)` | **Major** - `rgba(255,255,255,0.04)` vs `#1a1d27` (opaque vs transparent) |
| Clan info stat-card | Using shared `.stat-card` class | Local `.stat-card` with same styles | Neutral |
| Stats query box border-radius | `16px` | Same | Neutral |
| Stats input bg | `var(--subtle-bg)` | `var(--color-card-bg)` | Minor |
| Stats form `margin-bottom` | Not set (old was flat) | `var(--space-xl)` = 32px | Minor spacing difference |

#### 适配差异 (Responsive Differences)

| Breakpoint | Old | New | Severity |
|------------|-----|-----|----------|
| 768px section padding | `60px 24px` | Same | Neutral |
| 768px title | `28px` | `32px` | Minor - new is slightly larger |
| 768px roster grid | `repeat(2, 1fr)` | Same | Neutral |
| 768px stats form | `flex-direction: column` | Same | Neutral |
| Hero mobile h1 | `36px` | `38px` | Minor |
| Stats bar mobile | Hidden | Same | Neutral |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| Server status widget | Floating top-right card with ping, status, etc. | Separate `ServerStatus.astro` component | Need to verify implementation |
| Clan data loading | Inline `<script>` with retry logic | Same inline script approach | Neutral |
| Scroll reveal | IntersectionObserver | Same | Neutral |
| Player search redirect | Form submit -> `/stats/?player=` | Same | Neutral |
| Hero stats countUp | Present with IntersectionObserver | Same approach in Hero.astro | Neutral |
| Service Worker | `sw.js` registration in old | **Not referenced in new** | **Critical** - PWA/offline capability lost |

---

### 战绩查询 (Stats)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Search area bg | `var(--gray-800)` = `#1f1f1f` | `var(--color-gray-800)` = `#1f2937` | Minor - blue-tinted |
| Search button | `btn-clip btn-red` with clip-path | `search-btn` with `border-radius: 8px` | **Major** - button shape changed from angular to rounded |
| Tab design | Inline `<style>` tabs with same approach | Similar but new has scrollbar hiding | Good |
| Player banner bg | `linear-gradient(135deg, #1a0a08, #0a0a0a)` | Same | Neutral |
| Player avatar text color | `var(--white)` | `var(--color-text)` | `#fff` vs `#e0e0e0` - Minor |
| Record card bg | `#1a1a1a` | Same | Neutral |
| Match card hover | `translateY(-2px)` | Same | Neutral |
| Heatmap grid | 50px + 24 cols | Same | Neutral |
| Export button | `btn-clip btn-red` | `export-btn` rounded | Same as search button issue |

#### 适配差异 (Responsive Differences)

| Breakpoint | Old | New | Severity |
|------------|-----|-----|----------|
| 768px search | Column layout | Same | Neutral |
| 768px tabs | Smaller padding/font | Same approach | Neutral |
| 768px player banner | Column centered | Same | Neutral |
| 768px stats grid | 2 columns | Same | Neutral |
| Ban search mobile | Column | Same | Neutral |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| Architecture | Single 1678-line HTML file with all JS inline | Preact island `StatsEngine.tsx` with sub-tabs | **Good** - much better |
| Tab: Overview | Present | Present | Neutral |
| Tab: Recent Matches | Present | Present | Neutral |
| Tab: Weapons | Present | Present | Neutral |
| Tab: Maps | Present | Present | Neutral |
| Tab: Compare (was VS) | Present | Present (merged) | Neutral |
| Tab: Heatmap | Present | Present | Neutral |
| Tab: Wrapped | Was separate section in old | Now a tab | Good improvement |
| Tab: BanCheck | Was separate section | Now a tab with auto-query | Good improvement |
| Tab persistence on search | Old: stayed on current tab | New: should stay on current tab (per recent fix commit) | Neutral |
| html2canvas poster | Present | Present (loaded via `<script>` in head) | Neutral |
| Share utils | `share-utils.js` | Likely in Preact components | Need to verify |

---

### 排行榜 (Leaderboard)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Page title accent | `.accent` span | No accent in title | Minor |
| Table row odd/even | `rgba(255,255,255,0.02/0.04)` | Same values | Neutral |
| Rank border left | 3px gold/silver/bronze | Same | Neutral |
| Filter select background-image | SVG chevron | Same | Neutral |
| Light theme table styles | Not present in old | **Added in new** | Good addition |
| Player name link | Plain text | `<a>` with hover red + underline | Good addition |
| Container padding | `48px` left/right | Same + max-width 1200px | Good |

#### 适配差异 (Responsive Differences)

| Breakpoint | Old | New | Severity |
|------------|-----|-----|----------|
| 768px container padding | `padding: 0 24px` for filter, `16px` for table | `padding: 0 16px` uniform | Minor |
| 768px `.col-avgdmg` | `display: none` | Same | Neutral |
| 768px footer | `flex-direction: column` | Handled by Footer.astro | Neutral |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| Season auto-fallback | If current season fails, tries previous | Need to verify in `LeaderboardTable.tsx` | Check |
| i18n | Client-side `data-key` swap | Server-side labels prop | Architecture change (positive) |
| Season loading | Shows "Loading..." in select | Same via labels | Neutral |

---

### 地图 (Maps)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Sidebar width | Full sidebar with map cards, search, info | `120px` mini sidebar with thumbnails | **Major** - dramatically different layout |
| Sidebar items | Cards with map image + name + badges | Small 60x60 thumbnails + tiny name | **Major** - less info visible |
| Map info overlay | Part of sidebar (always visible) | Floating bottom-right overlay on map | **Major** - different UX pattern |
| Edit mode banner | Via overlay with z-index 1000 | Present (per commit history) | Neutral |
| Leaflet control zoom | Custom dark styling | Same approach | Neutral |
| Marker panel | Different positioning | `top:12px; left:12px` absolute | Minor |
| Throw panel | Present | Present | Neutral |
| Grid labels | Present | Present | Neutral |

#### 适配差异 (Responsive Differences)

| Breakpoint | Old | New | Severity |
|------------|-----|-----|----------|
| 768px sidebar | Collapsed/hidden, map full width | Horizontal 90px strip at top | **Major** - different mobile pattern |
| 768px map height | `100vh - header` | `calc(100vh - header-mobile)` minus sidebar | Different |
| 768px sidebar scroll | N/A | Horizontal scroll | New approach |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| Map tile loading | Inline Leaflet setup | `LeafletMap.tsx` Preact island | Architecture change |
| Grid overlay | JS toggle | Same in island | Neutral |
| Measurement tool | Present | Present | Neutral |
| Throw calculator | Present | Present | Neutral |
| Edit mode | Present | Present | Neutral |
| Marker data | JSON from `assert/data/` | Same data source | Neutral |
| Map search/filter | Old sidebar had search | **Not visible in new sidebar** | **Major** - search removed |

---

### 人格测试 (Quiz)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Landing title | `52px`, hardcoded | Styles in `QuizEngine.tsx` component | Need to verify |
| Option card bg | `var(--card-bg)` = `rgba(255,255,255,0.06)` | Now uses `--color-card-bg` = `rgba(26,29,39,0.85)` | **Major** - opaque vs transparent |
| Option card border | `var(--card-border)` = `rgba(255,255,255,0.12)` | `var(--color-card-border)` = `rgba(255,255,255,0.06)` | Minor - less visible |
| Option hover border | `rgba(238,63,44,0.4)` | Need to verify in TSX | Check |
| Progress segment colors | `var(--subtle-border)` / `var(--red)` | Uses new tokens | Minor |
| Quiz nav buttons | Custom `.quiz-nav-btn` | Need to verify in TSX | Check |
| Result cards | Extensive custom styling inline | In TSX component | Architecture change |
| Share poster overlay | Custom overlay with html2canvas | Need to verify | Check |
| Container max-width | `640px` | `700px` | Minor - slightly wider |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| Quiz data | Inline JS `QUESTIONS`, `PERSONALITY_TYPES` | Imported from `src/data/quiz` | Good improvement |
| Local storage for last result | Present | Need to verify in `QuizEngine.tsx` | Check |
| All types gallery | Present (button to view all 16 types) | Label exists `allTypesTitle` | Likely present |
| Share poster (html2canvas) | Present | Need to verify | Check |
| Counter text "N people tested" | Present with localStorage counter | Need to verify | Check |

---

### 航线模拟 (Flight)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Sidebar bg | `var(--black)` = `#000` | `var(--color-bg)` = `#0f1117` | Minor |
| Map item bg | `var(--subtle-bg)` | `var(--color-surface)` | Minor token difference |
| Drop item bg | `var(--subtle-bg)` | `var(--color-surface)` | Minor |
| Sidebar button outline border | `var(--btn-outline-border)` | `var(--color-border)` | Different token |
| Flight page height | `calc(100vh - 72px)` hardcoded | `calc(100vh - var(--header-height) - 40px)` | Minor - 40px less |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| html2canvas share | Present (share button) | Present (labels include `share`) | Neutral |
| Drop point data | Inline JSON | Need to verify in `FlightSim.tsx` | Check |
| Map selection | Inline DOM manipulation | Preact state | Architecture change |

---

### 灵敏度计算器 (Sensitivity)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Hero padding | `120px 24px 40px` | `48px 24px 32px` | **Major** - much less top padding (old had full hero, new relies on layout padding-top) |
| Hero title size | `42px` hardcoded | `var(--text-3xl)` = `36px` | Minor - slightly smaller |
| Layout | 2-column grid (calc + pro settings) | Handled by `SensCalc.tsx` island | Architecture change |
| Calc panel styles | Extensive inline styles | In TSX component | Need to verify |
| Pro player cards | Inline HTML + JS | In TSX component | Architecture change |
| Scope sensitivity rows | Custom `.scope-row` styling | In TSX | Check |
| DPI converter | Present | Label `dpiConvert` exists | Likely present |
| Toast notification | Custom `.toast` class | Uses shared `Toast` island | Good improvement |

#### 适配差异 (Responsive Differences)

| Breakpoint | Old | New | Severity |
|------------|-----|-----|----------|
| 900px layout | `grid-template-columns: 1fr` | `sens-hero` adjusts, TSX handles layout | Check |
| 768px hero title | Not explicitly changed | `var(--text-2xl)` = `28px` | Matches old mobile approach |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| Sensitivity calculation | Inline JS with scope formulas | `SensCalc.tsx` | Architecture change |
| Pro player data | Inline array | Need to verify source | Check |
| Copy link | Present | Label exists | Neutral |
| Share card (html2canvas) | Present | Label exists | Neutral |

---

### 武器数据库 (Weapons)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Hero styling | Full custom `.weapons-hero` block | Inline styles on `<section>` | Minor - same visual result |
| Filter bar | Custom inline styles | Handled by `WeaponFilter.tsx` | Architecture change |
| Weapon card grid | `minmax(180px, 1fr)` | In TSX | Check |
| Weapon detail panel | Extensive inline styles | In TSX | Check |
| Compare chart | Chart.js radar/bar | In TSX | Check |
| Recoil canvas | Custom `.recoil-canvas-wrap` | In TSX | Check |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| Weapon data | Inline JS or fetched | `weapons.json` loaded at build time via `fs.readFileSync` | Good improvement |
| Category filter | `.cat-btn` toggles | In `WeaponFilter.tsx` | Architecture change |
| Search | `.filter-search` input | In TSX | Check |
| Weapon detail view | Show/hide `.weapon-detail` | In TSX | Check |
| Compare (multi-select) | `.weapon-compare` section | In TSX | Check |
| Chart.js integration | Script tag | Same | Neutral |

---

### 队伍分析 (Team)

#### 样式差异 (Style Differences)

| Element | Old | New | Severity |
|---------|-----|-----|----------|
| Hero styling | Custom `.team-hero` block | In `TeamBuilder.tsx` | Architecture change |
| Input grid | `1fr 1fr` | `repeat(4, 1fr)` via global style | **Major** - 4 columns instead of 2 |
| Result grid | `1fr 1fr` | In TSX | Check |
| Player cards | `repeat(4, 1fr)` | `team-player-grid` = `repeat(4, 1fr)` | Same |
| Color accents | `.team-colors-1/2/3/4` border-top | Need to verify in TSX | Check |
| Toast | Custom `.toast` class | Shared Toast island | Good |

#### 适配差异 (Responsive Differences)

| Breakpoint | Old | New | Severity |
|------------|-----|-----|----------|
| 900px results | `1fr` | Same via `!important` global | Same |
| 768px input | `1fr` | Same via `!important` global | Same |
| 768px player grid | Not specified at 768px | `repeat(2, 1fr)` | Same |
| 480px player grid | Not present | `1fr` | Good addition |

#### 功能差异 (Functional Differences)

| Feature | Old | New | Severity |
|---------|-----|-----|----------|
| PUBG API calls | Inline JS | `TeamBuilder.tsx` | Architecture change |
| Chart.js radar | Present | Present | Neutral |
| Role assignment | Present | Labels suggest present | Neutral |
| html2canvas poster | Present | Present | Neutral |
| Copy link | Present | Label exists | Neutral |
| Server selection | `<select>` for server | Label `server` exists | Neutral |

---

## 差异汇总表 (Summary Table)

| 页面 (Page) | 样式差异 (Style) | 适配差异 (Responsive) | 功能差异 (Functional) | 最高严重度 |
|---|---|---|---|---|
| Global (tokens/nav/footer) | 15 | 2 | 3 | **Critical** |
| Index (首页) | 5 | 2 | 1 | **Critical** (SW lost) |
| Stats (战绩) | 4 | 0 | 0 | Major |
| Leaderboard (排行榜) | 2 | 1 | 0 | Minor |
| Maps (地图) | 5 | 2 | 1 | **Major** |
| Quiz (人格测试) | 4 | 0 | 3 | Major (need verification) |
| Flight (航线) | 3 | 0 | 0 | Minor |
| Sensitivity (灵敏度) | 3 | 0 | 0 | Major |
| Weapons (武器) | 2 | 0 | 0 | Minor (in TSX) |
| Team (队伍) | 2 | 1 | 0 | Major |

---

## 修复建议 (Fix Recommendations)

### Critical (Must Fix)

1. ~~**Footer links removed**~~ ✅ User requested removal — by design
2. **"Join Us" CTA removed from header** - The `btn-clip btn-red` "Join Us" button that linked to `#join` was removed from the nav-right area. TODO: confirm with user if needed.
3. **Service Worker / PWA lost** - The old site registered `sw.js` for offline caching. TODO: add SW registration to Base.astro.
4. ~~**Background color regression**~~ ✅ FIXED — reverted `--color-bg` to `#000000`
5. ~~**Text color regression**~~ ✅ FIXED — reverted `--color-text` to `#ffffff`
6. ~~**Card backgrounds changed from transparent to opaque**~~ ✅ FIXED — reverted `--color-card-bg` to `rgba(255,255,255,0.06)`
7. ~~**Link color changed to blue**~~ ✅ FIXED — changed `a { color: inherit }`, `--color-primary` now red
8. **Maps sidebar dramatically different** - Old had a full sidebar with map cards, details, and search. New has a 120px thumbnail strip. TODO: consider restoring.

### Major (Should Fix)

9. **Active nav link color** - Changed from white to red. Keeping as red — matches brand.
10. ~~**Nav-right gap too small**~~ ✅ FIXED — increased to `20px`
11. **Mobile nav group labels** - Changed from large clickable toggles (24px) to tiny category headers (11px). TODO: restore toggle behavior.
12. ~~**Stats search button shape**~~ ✅ FIXED — restored `clip-path` brand style
13. **Sensitivity hero padding** - Verified: `48px` is correct since `<main>` adds header-height padding-top. No fix needed.
14. **Team input grid** - Already uses `1fr 1fr` (2 columns) in TSX. The `repeat(4,1fr)` is for player results grid. No fix needed.

### Minor (Nice to Have)

15. ~~**Add `scroll-behavior: smooth` and `scroll-padding-top`**~~ ✅ FIXED
16. ~~**Add `overflow-x: hidden`**~~ ✅ FIXED
17. **Restore `--toggle-border/hover` tokens** for button styling consistency.
18. **Footer mobile layout** - Ensure column layout still works correctly.
19. ~~**Light theme card-bg**~~ ✅ FIXED — reverted to `rgba(0,0,0,0.03)` matching old
20. **Maps page search** - If old sidebar had map search/filter, restore it in the new mini-sidebar or as a separate UI element.

### Also fixed in this round:
- ~~`--color-border`~~ ✅ FIXED — changed from solid `#2a2d3a` to `rgba(255,255,255,0.06)` matching old `--header-border`
- ~~`--color-text-muted`~~ ✅ FIXED — changed from `#888` to `#9ca3af` matching old `--gray-400`
- ~~`--color-surface`~~ ✅ FIXED — from `#1a1d27` to `#111111`
- ~~`--color-gray-800`~~ ✅ FIXED — from `#1f2937` to `#1f1f1f`
- ~~Light theme~~ ✅ FIXED — bg `#ffffff`, card `rgba(0,0,0,0.03)`, header-bg `rgba(255,255,255,0.85)`
- ~~Nav dropdown menu~~ ✅ FIXED — backdrop-filter blur, font-size 13px, padding 10px 20px
- ~~`focus-visible`~~ ✅ FIXED — changed from blue to red
- ~~`--text-3xl`~~ ✅ FIXED — from 36px to 42px matching old hero titles
- ~~`--header-bg`~~ ✅ FIXED — added to :root as `rgba(0,0,0,0.4)` matching old
- ~~Light theme gray-500~~ ✅ FIXED — added swap `#9ca3af` in light mode
- ~~btn-white~~ ✅ FIXED — theme-aware `var(--color-text)/var(--color-bg)`
- ~~"Join Us" CTA~~ ✅ FIXED — restored btn-clip btn-red in header nav-right
- ~~Mobile nav~~ ✅ FIXED — restored collapsible groups, 24px labels, blur overlay
- ~~Footer padding~~ ✅ FIXED — restored `24px 48px`, mobile column layout
- ~~Mobile logo~~ ✅ FIXED — gap 8px, icon 32px, text 18px on mobile
- ~~Weapons hero padding~~ ✅ FIXED — 120px → 48px (Base adds header-height)
- ~~html2canvas bg~~ ✅ FIXED — `#0a0a0a` → `#000000` matching pure black theme
- ~~Quiz container~~ ✅ FIXED — 700px → 640px
- ~~Roster bg~~ ✅ FIXED — `var(--color-gray-800)` matching old

### Island Component Inline Styles (Audited, Acceptable)
Canvas rendering colors (Chart.js, html2canvas poster export) use hardcoded hex values — this is correct since CSS variables can't be used in canvas `fillStyle`. Team accent colors (#3B82F6 blue, #10B981 green, #F59E0B amber) are semantic per-player colors, not theme tokens.
