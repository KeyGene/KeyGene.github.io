# KEY GENE UI 设计与代码实现方案

> 基于现有设计系统：Rubik 字体、黑/红主色、clip-path 按钮、glass card、data-key i18n
> 所有页面支持 dark/light 主题切换、三语（EN/ZH/KO）
> 共享组件：shared.css + shared.js（主题、语言、导航）

---

## 设计系统参考

### 现有 CSS 变量（所有新页面必须复用）
```css
--black: #000000          /* 页面背景 */
--red: #EE3F2C            /* 主色 */
--red-hover: #ff5240      /* 按钮 hover */
--white: #ffffff          /* 主文字 */
--gray-400: #9ca3af       /* 次要文字 */
--gray-500: #6b7280       /* 辅助文字 */
--card-bg: rgba(255,255,255,0.06)     /* 卡片背景 */
--card-border: rgba(255,255,255,0.12) /* 卡片边框 */
--glass-bg: rgba(255,255,255,0.05)    /* 毛玻璃 */
```

### 现有组件复用
| 组件 | 类名 | 用途 |
|------|------|------|
| 切角按钮 | `.btn-clip .btn-red` | 主操作按钮 |
| 圆角按钮 | `.search-btn` / `.export-btn` | 搜索/导出 |
| 卡片 | `.stat-card` | 数据展示卡片 |
| 标签栏 | `.tab-bar .tab-btn` | 标签页切换 |
| 搜索框 | `.search-input` | 输入框 |
| section 标签 | `.section-label` | 区域标题（红色 + 左线） |
| 骨架屏 | `.skeleton` | 加载占位 |

---

## 一、导航栏下拉菜单

### 设计
在现有 `<nav>` 基础上，给有子页面的链接添加 hover 下拉。下拉菜单风格和 header 一致：毛玻璃背景 + 细边框。

```
┌─────────────────────────────────────────────────────────┐
│ 🔴 KEY GENE    Stats ▾    Maps ▾    Tools ▾    Quiz    │
│                 ┌──────────┐                             │
│                 │ 战绩查询  │                             │
│                 │ 队伍分析  │                             │
│                 │ 排行榜    │                             │
│                 └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### HTML 结构
```html
<nav>
  <div class="nav-dropdown">
    <a href="stats.html" class="nav-link" data-key="navStats">Stats</a>
    <div class="dropdown-menu">
      <a href="stats.html" data-key="navStatsLookup">战绩查询</a>
      <a href="team.html" data-key="navTeam">队伍分析</a>
      <a href="leaderboard.html" data-key="navLeaderboard">排行榜</a>
    </div>
  </div>
  <div class="nav-dropdown">
    <a href="maps.html" class="nav-link" data-key="navMaps">Maps</a>
    <div class="dropdown-menu">
      <a href="maps.html" data-key="navMapsInteractive">互动地图</a>
      <a href="flight.html" data-key="navFlight">航线模拟</a>
    </div>
  </div>
  <div class="nav-dropdown">
    <a class="nav-link" data-key="navTools">Tools</a>
    <div class="dropdown-menu">
      <a href="sensitivity.html" data-key="navSensitivity">灵敏度配置</a>
      <a href="weapons.html" data-key="navWeapons">武器数据库</a>
    </div>
  </div>
  <a href="quiz.html" data-key="navQuiz">Quiz</a>
</nav>
```

### CSS（添加到 shared.css）
```css
/* ===== DROPDOWN NAV ===== */
.nav-dropdown {
  position: relative;
}
.nav-dropdown > .nav-link {
  color: var(--gray-400);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 12px 8px;
  transition: color 0.2s;
  cursor: pointer;
}
.nav-dropdown > .nav-link::after {
  content: '';
  display: inline-block;
  width: 0; height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid currentColor;
  margin-left: 6px;
  vertical-align: middle;
  transition: transform 0.2s;
}
.nav-dropdown:hover > .nav-link { color: var(--white); }
.nav-dropdown:hover > .nav-link::after { transform: rotate(180deg); }

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  padding: 8px 0;
  background: var(--header-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--header-border);
  border-radius: 8px;
  z-index: 150;
}
.nav-dropdown:hover .dropdown-menu { display: block; }

.dropdown-menu a {
  display: block;
  padding: 10px 20px;
  color: var(--gray-400);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s, background 0.2s;
}
.dropdown-menu a:hover {
  color: var(--white);
  background: var(--subtle-bg);
}
```

### 移动端
在 `.mobile-nav` 中用缩进展示子菜单，不用 hover（触屏不适用）：
```css
.mobile-nav .mobile-sub {
  padding-left: 20px;
}
.mobile-nav .mobile-sub a {
  font-size: 18px;
  font-weight: 500;
  color: var(--gray-400);
}
```

---

## 二、灵敏度配置分享器 (`sensitivity.html`)

### 页面布局

```
┌──────────────────────────────────────────────────────────┐
│ Header (shared)                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ── SENSITIVITY CALCULATOR ──                            │
│  灵敏度计算器                                             │
│                                                          │
│  ┌─────────────────────┐  ┌───────────────────────────┐  │
│  │  CALCULATOR          │  │  PRO SETTINGS             │  │
│  │                      │  │                           │  │
│  │  DPI  [  800  ]      │  │  Filter: [All▾] [Low▾]   │  │
│  │  Sens [====50====]   │  │                           │  │
│  │  V-Ratio [====100=]  │  │  ┌─────────────────────┐  │  │
│  │                      │  │  │ 👤 Pio  │ Gen.G     │  │  │
│  │  ── SCOPE SENS ──    │  │  │ DPI 800 │ Sens 50   │  │  │
│  │  1x  [====] 28cm     │  │  │ [APPLY]              │  │  │
│  │  2x  [====] 42cm     │  │  └─────────────────────┘  │  │
│  │  3x  [====] 56cm     │  │  ┌─────────────────────┐  │  │
│  │  4x  [====] 70cm     │  │  │ 👤 NiceWigg │ ...   │  │  │
│  │  6x  [====] 84cm     │  │  │ DPI 400 │ Sens 55   │  │  │
│  │  8x  [====] 98cm     │  │  │ [APPLY]              │  │  │
│  │  15x [====] 112cm    │  │  └─────────────────────┘  │  │
│  │                      │  │                           │  │
│  │  ── RESULTS ──        │  │  ... more cards          │  │
│  │  eDPI: 40,000         │  │                           │  │
│  │  360°: 27.5 cm        │  │                           │  │
│  │                      │  │                           │  │
│  │  ── DPI CONVERT ──    │  │                           │  │
│  │  New DPI [____]       │  │                           │  │
│  │  = Sens → 25          │  │                           │  │
│  │                      │  │                           │  │
│  │  [🔗 Copy Link]       │  │                           │  │
│  │  [📸 Share Card]      │  │                           │  │
│  └─────────────────────┘  └───────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Footer (shared)                                          │
└──────────────────────────────────────────────────────────┘
```

### 移动端：上下堆叠
```
┌──────────────────────┐
│ Header               │
├──────────────────────┤
│ CALCULATOR           │
│ DPI [800]            │
│ Sens [====50====]    │
│ ...sliders...        │
│ eDPI: 40,000         │
│ [Share] [Copy Link]  │
├──────────────────────┤
│ PRO SETTINGS         │
│ [Filter ▾]           │
│ ┌──────────────────┐ │
│ │ Pio │ DPI 800    │ │
│ │ [APPLY]          │ │
│ └──────────────────┘ │
│ ...                  │
├──────────────────────┤
│ Footer               │
└──────────────────────┘
```

### CSS 关键样式
```css
/* sensitivity.html page styles */
.sens-page {
  padding-top: 72px; /* header height */
}
.sens-hero {
  text-align: center;
  padding: 48px 24px 32px;
}
.sens-hero-title {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}
.sens-hero-title .accent { color: var(--red); }
.sens-hero-sub {
  font-size: 15px;
  color: var(--gray-400);
  margin-top: 8px;
}

.sens-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 48px 60px;
}
@media (max-width: 900px) {
  .sens-layout { grid-template-columns: 1fr; padding: 0 24px 40px; }
}

/* Calculator panel */
.calc-panel {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 28px;
}

/* Input row */
.calc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.calc-label {
  width: 80px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-400);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.calc-input {
  flex: 1;
  padding: 10px 14px;
  background: var(--subtle-bg);
  border: 1px solid var(--subtle-border);
  border-radius: 6px;
  color: var(--white);
  font-family: var(--font);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.calc-input:focus { border-color: var(--red); }

/* Slider */
.calc-slider {
  -webkit-appearance: none;
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--subtle-border);
  outline: none;
}
.calc-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--red);
  cursor: pointer;
  transition: transform 0.1s;
}
.calc-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
.calc-value {
  width: 70px;
  text-align: right;
  font-size: 14px;
  font-weight: 700;
  color: var(--white);
  font-variant-numeric: tabular-nums;
}

/* Scope sensitivity rows */
.scope-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--subtle-border);
}
.scope-name {
  width: 36px;
  font-size: 13px;
  font-weight: 700;
  color: var(--white);
}
.scope-cm {
  width: 80px;
  text-align: right;
  font-size: 13px;
  color: var(--gray-400);
  font-variant-numeric: tabular-nums;
}

/* Results block */
.calc-results {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
  margin-bottom: 20px;
}
.calc-result-card {
  background: linear-gradient(135deg, #1a0a08, #0a0a0a);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}
.calc-result-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--white);
  font-variant-numeric: tabular-nums;
}
.calc-result-label {
  font-size: 10px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 4px;
}

/* Action buttons */
.calc-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.calc-actions .btn-clip { flex: 1; justify-content: center; font-size: 12px; }

/* Pro settings panel */
.pro-panel {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 28px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
.pro-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.pro-filter-btn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  background: var(--subtle-bg);
  border: 1px solid var(--subtle-border);
  border-radius: 6px;
  color: var(--gray-400);
  cursor: pointer;
  transition: all 0.2s;
}
.pro-filter-btn.active,
.pro-filter-btn:hover {
  color: var(--white);
  border-color: var(--red);
  background: rgba(238,63,44,0.1);
}

/* Pro player card */
.pro-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--subtle-bg);
  border: 1px solid var(--subtle-border);
  border-radius: 10px;
  margin-bottom: 10px;
  transition: border-color 0.2s;
  cursor: pointer;
}
.pro-card:hover { border-color: var(--red); }
.pro-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--red), #ff5a4a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}
.pro-info { flex: 1; }
.pro-name { font-size: 14px; font-weight: 700; }
.pro-team { font-size: 11px; color: var(--gray-500); }
.pro-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--gray-400);
  margin-top: 4px;
}
.pro-stats span { color: var(--white); font-weight: 700; }
.pro-apply {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 700;
  background: var(--red);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}
.pro-apply:hover { background: var(--red-hover); }
```

### JS 核心逻辑
```javascript
// sensitivity.html core logic

var SCOPES = ['1x','2x','3x','4x','6x','8x','15x'];
var SCOPE_MULTIPLIERS = {
  '1x': 1, '2x': 1.2, '3x': 1.35, '4x': 1.45,
  '6x': 1.55, '8x': 1.65, '15x': 1.8
};

// cm/360 calculation
function calcCm360(dpi, sens, scopeMultiplier) {
  // PUBG formula: cm/360 = (2.54 * 360) / (dpi * (sens/50) * scopeMultiplier)
  return (2.54 * 360) / (dpi * (sens / 50) * scopeMultiplier);
}

function updateCalc() {
  var dpi = parseInt(dpiInput.value) || 800;
  var sens = parseInt(sensSlider.value) || 50;
  var vRatio = parseInt(vRatioSlider.value) || 100;
  var edpi = dpi * sens;

  edpiDisplay.textContent = edpi.toLocaleString();
  cm360Display.textContent = calcCm360(dpi, sens, 1).toFixed(1) + ' cm';

  SCOPES.forEach(function(scope) {
    var scopeSens = parseInt(scopeSliders[scope].value) || 50;
    var cm = calcCm360(dpi, sens * (scopeSens / 50), SCOPE_MULTIPLIERS[scope]);
    scopeCmDisplays[scope].textContent = cm.toFixed(1) + ' cm';
  });
}

// URL encode/decode for sharing
function encodeConfig() {
  var params = new URLSearchParams();
  params.set('d', dpiInput.value);
  params.set('s', sensSlider.value);
  params.set('v', vRatioSlider.value);
  SCOPES.forEach(function(scope) {
    params.set(scope, scopeSliders[scope].value);
  });
  return location.origin + '/sensitivity.html?' + params.toString();
}

function decodeConfig() {
  var params = new URLSearchParams(location.search);
  if (params.has('d')) {
    dpiInput.value = params.get('d');
    sensSlider.value = params.get('s') || 50;
    vRatioSlider.value = params.get('v') || 100;
    SCOPES.forEach(function(scope) {
      if (params.has(scope)) scopeSliders[scope].value = params.get(scope);
    });
    updateCalc();
  }
}

// Pro settings data (static JSON object)
var PRO_SETTINGS = [
  { name: 'Pio', team: 'Gen.G', dpi: 800, sens: 50, vRatio: 100,
    scopes: { '1x':50,'2x':50,'3x':50,'4x':50,'6x':50,'8x':50,'15x':50 },
    style: 'low' },
  // ... 15-20 more players
];

// Apply pro config to calculator
function applyProConfig(pro) {
  dpiInput.value = pro.dpi;
  sensSlider.value = pro.sens;
  vRatioSlider.value = pro.vRatio;
  SCOPES.forEach(function(scope) {
    scopeSliders[scope].value = pro.scopes[scope] || 50;
  });
  updateCalc();
  // Scroll to calculator
  calcPanel.scrollIntoView({ behavior: 'smooth' });
}

// Share card generation (reuse html2canvas)
function generateShareCard() {
  html2canvas(document.getElementById('calcPanel'), {
    backgroundColor: '#000',
    scale: 2
  }).then(function(canvas) {
    var link = document.createElement('a');
    link.download = 'keygene-sensitivity.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}
```

### i18n 文本
```javascript
var texts = {
  en: {
    heroTitle: 'Sensitivity <span class="accent">Calculator</span>',
    heroSub: 'Find your perfect PUBG sensitivity. Compare with pro players.',
    dpi: 'DPI', sens: 'Sensitivity', vRatio: 'V-Ratio',
    scopeSens: 'Scope Sensitivity', edpi: 'eDPI', cm360: '360° Distance',
    proSettings: 'Pro Settings', filterAll: 'All', filterLow: 'Low Sens',
    filterHigh: 'High Sens', apply: 'Apply', copyLink: 'Copy Link',
    shareCard: 'Share Card', dpiConvert: 'DPI Converter',
    newDpi: 'New DPI', equivSens: 'Equivalent Sensitivity'
  },
  zh: {
    heroTitle: '灵敏度<span class="accent">计算器</span>',
    heroSub: '找到你的最佳 PUBG 灵敏度，对比职业选手配置',
    dpi: 'DPI', sens: '灵敏度', vRatio: '垂直倍率',
    scopeSens: '倍镜灵敏度', edpi: 'eDPI', cm360: '360° 转身距离',
    proSettings: '职业选手配置', filterAll: '全部', filterLow: '低灵敏',
    filterHigh: '高灵敏', apply: '应用', copyLink: '复制链接',
    shareCard: '生成分享卡', dpiConvert: 'DPI 换算',
    newDpi: '新 DPI', equivSens: '等效灵敏度'
  },
  ko: {
    heroTitle: '감도 <span class="accent">계산기</span>',
    heroSub: '최적의 PUBG 감도를 찾고 프로 선수와 비교하세요',
    dpi: 'DPI', sens: '감도', vRatio: '수직 배율',
    scopeSens: '배율 감도', edpi: 'eDPI', cm360: '360° 회전 거리',
    proSettings: '프로 설정', filterAll: '전체', filterLow: '저감도',
    filterHigh: '고감도', apply: '적용', copyLink: '링크 복사',
    shareCard: '공유 카드', dpiConvert: 'DPI 변환',
    newDpi: '새 DPI', equivSens: '동일 감도'
  }
};
```

---

## 三、Compare 分享海报（stats.html 改进）

### 设计
在 Compare 结果区域底部添加一个「生成 VS 海报」按钮。

```
┌──────────────────────────────────────┐
│  Player A  ──── VS ────  Player B    │
│  ┌──────────────────────────────┐    │
│  │   Radar Chart (already exists)│    │
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │   Compare Table (exists)      │    │
│  └──────────────────────────────┘    │
│                                      │
│       [ 📸 Generate VS Poster ]      │  ← 新增
│                                      │
└──────────────────────────────────────┘
```

### 海报生成区域（hidden，用于 html2canvas 截取）
```html
<div id="comparePoster" style="display:none; position:fixed; left:-9999px;">
  <div style="width:600px; padding:40px; background:#0a0a0a; color:#fff; font-family:Rubik;">
    <!-- KEY GENE logo -->
    <div style="text-align:center; margin-bottom:24px;">
      <span style="font-size:20px; font-weight:800;">KEY <span style="color:#EE3F2C;">GENE</span></span>
    </div>
    <!-- Player names + VS -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <span id="posterP1" style="font-size:24px; font-weight:800;"></span>
      <span style="font-size:18px; color:#EE3F2C; font-weight:800;">VS</span>
      <span id="posterP2" style="font-size:24px; font-weight:800;"></span>
    </div>
    <!-- Radar chart (clone canvas) -->
    <canvas id="posterRadar" width="500" height="300"></canvas>
    <!-- Key stats comparison -->
    <div id="posterStats"></div>
    <!-- Watermark -->
    <div style="text-align:center; margin-top:20px; font-size:11px; color:#6b7280;">
      keygene.top
    </div>
  </div>
</div>
```

### CSS
```css
.compare-poster-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 24px auto 0;
  padding: 12px 28px;
  background: var(--red);
  color: var(--white);
  border: none;
  border-radius: 8px;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.compare-poster-btn:hover { background: var(--red-hover); }
```

### JS
```javascript
function generateVSPoster() {
  // 1. Show poster container
  var poster = document.getElementById('comparePoster');
  poster.style.display = 'block';
  poster.style.position = 'fixed';
  poster.style.left = '-9999px';

  // 2. Fill in data
  document.getElementById('posterP1').textContent = player1Name;
  document.getElementById('posterP2').textContent = player2Name;

  // 3. Clone radar chart to poster canvas
  var srcCanvas = document.getElementById('compareRadarCanvas');
  var dstCanvas = document.getElementById('posterRadar');
  var ctx = dstCanvas.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0, 500, 300);

  // 4. html2canvas
  html2canvas(poster.firstElementChild, {
    backgroundColor: '#0a0a0a',
    scale: 2
  }).then(function(canvas) {
    var link = document.createElement('a');
    link.download = 'keygene-vs-' + player1Name + '-' + player2Name + '.png';
    link.href = canvas.toDataURL();
    link.click();
    poster.style.display = 'none';
  });
}
```

---

## 四、赛季总结报告（stats.html `Wrapped` 标签页）

### 标签栏新增
```html
<button class="tab-btn" data-tab="wrapped" data-key="tabWrapped">Wrapped</button>
```

### 页面布局（卡片式纵向滚动）

```
┌──────────────────────────────────────┐
│  Tab Bar: [Overview] ... [Wrapped]   │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐    │
│  │  CARD 1: SEASON REVIEW       │    │
│  │  ┌─────────────────────────┐ │    │
│  │  │  Season 31              │ │    │
│  │  │  PlayerName             │ │    │
│  │  │  🏅 Gold III            │ │    │
│  │  │  TPP · Squad            │ │    │
│  │  └─────────────────────────┘ │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  CARD 2: CORE STATS          │    │
│  │   ┌──────┐ ┌──────┐ ┌─────┐ │    │
│  │   │ 2,847│ │  523 │ │ 3.2 │ │    │
│  │   │Kills │ │Games │ │ K/D │ │    │
│  │   └──────┘ └──────┘ └─────┘ │    │
│  │   "超过了 92% 的玩家"         │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  CARD 3: FAVORITE WEAPONS    │    │
│  │   🥇 M416      42%          │    │
│  │   🥈 Kar98k    28%          │    │
│  │   🥉 Beryl M762  15%        │    │
│  │   [Pie Chart]                │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  CARD 4: MAP & RECORDS       │    │
│  │   [Map Radar]                │    │
│  │   最远击杀: 487m 🎯          │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  CARD 5: PLAYER TAGS         │    │
│  │   #钢枪王 #狙击之神 #活到最后 │    │
│  │                              │    │
│  │   KEY GENE logo              │    │
│  │   [📸 Generate Poster]       │    │
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

### CSS
```css
/* ===== WRAPPED TAB ===== */
.wrapped-container {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.wrapped-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

/* Card 1: Season header — gradient accent */
.wrapped-card.hero {
  background: linear-gradient(135deg, #1a0a08, #0a0a0a);
  border-color: rgba(238,63,44,0.2);
}
.wrapped-season {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--red);
  margin-bottom: 8px;
}
.wrapped-player {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.wrapped-rank {
  font-size: 20px;
  margin-top: 12px;
}
.wrapped-rank-name {
  font-size: 16px;
  font-weight: 800;
  color: #FFD700;
}

/* Card 2: Big numbers with count-up animation */
.wrapped-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.wrapped-big-stat {
  font-size: 36px;
  font-weight: 800;
  color: var(--white);
  font-variant-numeric: tabular-nums;
}
.wrapped-stat-label {
  font-size: 10px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.wrapped-percentile {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(238,63,44,0.1);
  border: 1px solid rgba(238,63,44,0.2);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--red);
}

/* Card 3: Weapon list */
.wrapped-weapon-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--subtle-border);
}
.wrapped-weapon-rank {
  font-size: 18px;
  width: 32px;
}
.wrapped-weapon-name {
  flex: 1;
  text-align: left;
  font-size: 15px;
  font-weight: 700;
}
.wrapped-weapon-pct {
  font-size: 15px;
  font-weight: 700;
  color: var(--red);
}

/* Card 5: Tags */
.wrapped-tag {
  display: inline-block;
  padding: 8px 16px;
  margin: 4px;
  background: rgba(238,63,44,0.08);
  border: 1px solid rgba(238,63,44,0.15);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--red);
}

/* Poster button */
.wrapped-poster-btn {
  margin-top: 20px;
  padding: 14px 32px;
  background: var(--red);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: var(--font);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.wrapped-poster-btn:hover { background: var(--red-hover); }
```

### JS 核心逻辑
```javascript
// Count-up animation
function animateNumber(el, target, duration) {
  var start = 0;
  var startTime = null;
  function step(time) {
    if (!startTime) startTime = time;
    var pct = Math.min((time - startTime) / duration, 1);
    el.textContent = Math.floor(pct * target).toLocaleString();
    if (pct < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Tag assignment logic
function assignTags(stats) {
  var tags = [];
  if (stats.kd >= 3) tags.push({ en:'Frag King', zh:'钢枪王', ko:'킬 머신' });
  if (stats.winRate >= 15) tags.push({ en:'Winner Winner', zh:'活到最后的人', ko:'치킨 매니아' });
  if (stats.longestKill >= 400) tags.push({ en:'Sniper God', zh:'狙击之神', ko:'저격의 신' });
  if (stats.headshotPct >= 30) tags.push({ en:'Headshot Machine', zh:'爆头机器', ko:'헤드샷 머신' });
  if (stats.games >= 500) tags.push({ en:'Grinder', zh:'肝帝', ko:'노력파' });
  if (stats.top10Pct >= 50) tags.push({ en:'Survivor', zh:'苟王', ko:'생존왕' });
  return tags.slice(0, 3); // max 3 tags
}

// Percentile lookup (hardcoded reference table)
var PERCENTILES = {
  kd:    [[5, 95],[3, 85],[2, 70],[1.5, 50],[1, 30]],
  kills: [[3000, 95],[1500, 80],[800, 60],[400, 40],[200, 20]],
  // ...
};
function getPercentile(stat, value) {
  var table = PERCENTILES[stat] || [];
  for (var i = 0; i < table.length; i++) {
    if (value >= table[i][0]) return table[i][1];
  }
  return 10;
}
```

---

## 五、武器数据库 (`weapons.html`)

### 页面布局

```
┌──────────────────────────────────────────────────────────┐
│ Header (shared)                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ── WEAPON DATABASE ──                                   │
│                                                          │
│  [🔍 Search...        ]  [All▾] [AR▾] [SR▾] [SMG▾] ... │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ M416 │ │Kar98k│ │ Mini │ │Beryl │ │ SLR  │          │
│  │ AR   │ │ SR   │ │ DMR  │ │ AR   │ │ DMR  │          │
│  │DMG 43│ │DMG 79│ │DMG 46│ │DMG 47│ │DMG 58│          │
│  │RPM720│ │RPM 1 │ │RPM.. │ │RPM.. │ │RPM.. │          │
│  │31.1⬆ │ │      │ │      │ │31.1⬇│ │      │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│  ┌──────┐ ┌──────┐ ...                                   │
│  │ UMP  │ │ AKM  │                                       │
│  └──────┘ └──────┘                                       │
│                                                          │
│  ═══════════════════════════════════════════════          │
│  WEAPON DETAIL (click to expand / modal)                 │
│  ┌──────────────────────────────────────────┐            │
│  │  M416                                    │            │
│  │  Assault Rifle · 5.56mm                   │            │
│  │                                          │            │
│  │  ┌────────────┐  ┌────────────────────┐  │            │
│  │  │ Base Stats  │  │ TTK Chart          │  │            │
│  │  │ DMG: 43     │  │ (Chart.js line)    │  │            │
│  │  │ RPM: 720    │  │ Lv1/Lv2/Lv3 vest  │  │            │
│  │  │ Vel: 880m/s │  │                    │  │            │
│  │  │ Reload: 2.1s│  │                    │  │            │
│  │  │ Mag: 30/40  │  │                    │  │            │
│  │  └────────────┘  └────────────────────┘  │            │
│  │                                          │            │
│  │  ┌────────────────────┐  ┌────────────┐  │            │
│  │  │ Recoil Pattern      │  │ Attachments│  │            │
│  │  │ (canvas scatter)    │  │ Muzzle: ✅ │  │            │
│  │  │ • • •               │  │ Grip: ✅   │  │            │
│  │  │  • •  •             │  │ Mag: ✅    │  │            │
│  │  │   •    •            │  │ Stock: ✅  │  │            │
│  │  └────────────────────┘  │ Scope: ✅  │  │            │
│  │                          └────────────┘  │            │
│  │  Patch: 31.1 — Damage 44→43              │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
│  ═══════════════════════════════════════════════          │
│  WEAPON COMPARE (select 2-3 weapons)                     │
│  ┌──────────────────────────────────────────┐            │
│  │  [M416 ×] [Beryl ×] [+ Add weapon]       │            │
│  │                                          │            │
│  │  [Radar Chart]     [TTK Comparison]       │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Footer (shared)                                          │
└──────────────────────────────────────────────────────────┘
```

### CSS
```css
/* weapons.html page styles */
.weapons-page { padding-top: 72px; }
.weapons-hero {
  text-align: center;
  padding: 48px 24px 24px;
}

/* Filter bar */
.weapons-filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  max-width: 1100px;
  margin: 0 auto 24px;
  padding: 0 48px;
}
.weapons-search {
  flex: 1;
  min-width: 200px;
  padding: 10px 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--white);
  font-family: var(--font);
  font-size: 14px;
  outline: none;
}
.weapons-search:focus { border-color: var(--red); }
.category-btn {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  background: var(--subtle-bg);
  border: 1px solid var(--subtle-border);
  border-radius: 6px;
  color: var(--gray-400);
  cursor: pointer;
  transition: all 0.2s;
}
.category-btn.active {
  color: var(--white);
  border-color: var(--red);
  background: rgba(238,63,44,0.1);
}

/* Weapon grid */
.weapons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 48px;
}

/* Weapon card */
.weapon-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}
.weapon-card:hover {
  border-color: rgba(238,63,44,0.3);
  transform: translateY(-2px);
}
.weapon-card.selected {
  border-color: var(--red);
  background: rgba(238,63,44,0.05);
}
.weapon-icon {
  width: 120px;
  height: 60px;
  margin: 0 auto 12px;
  object-fit: contain;
  /* fallback: silhouette SVG or text */
}
.weapon-name {
  font-size: 15px;
  font-weight: 700;
}
.weapon-type {
  font-size: 11px;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
}
.weapon-quick-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--gray-400);
}
.weapon-quick-stats span { color: var(--white); font-weight: 700; }

/* Patch badge */
.weapon-patch {
  display: inline-block;
  margin-top: 8px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
}
.weapon-patch.buff { background: rgba(16,185,129,0.15); color: #10B981; }
.weapon-patch.nerf { background: rgba(238,63,44,0.15); color: var(--red); }

/* Detail modal/panel */
.weapon-detail {
  max-width: 1100px;
  margin: 32px auto;
  padding: 0 48px;
}
.weapon-detail-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 32px;
}
.weapon-detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}
.weapon-detail-name { font-size: 28px; font-weight: 800; }
.weapon-detail-meta { font-size: 13px; color: var(--gray-500); }

.weapon-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .weapon-detail-grid { grid-template-columns: 1fr; }
}

/* Base stats list */
.weapon-stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--subtle-border);
  font-size: 13px;
}
.weapon-stat-row .label { color: var(--gray-400); }
.weapon-stat-row .value { font-weight: 700; }

/* TTK chart container */
.ttk-chart-container {
  background: var(--subtle-bg);
  border-radius: 10px;
  padding: 20px;
}
.ttk-chart-container canvas { max-height: 250px; }

/* Recoil pattern */
.recoil-canvas {
  width: 200px;
  height: 300px;
  background: var(--subtle-bg);
  border-radius: 10px;
}

/* Weapon compare section */
.weapon-compare {
  max-width: 1100px;
  margin: 32px auto;
  padding: 0 48px;
}
.weapon-compare-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.compare-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(238,63,44,0.1);
  border: 1px solid rgba(238,63,44,0.2);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--white);
}
.compare-chip .remove {
  cursor: pointer;
  color: var(--gray-500);
  font-size: 16px;
}
.compare-chip .remove:hover { color: var(--red); }
.compare-add {
  padding: 6px 14px;
  border: 1px dashed var(--subtle-border);
  border-radius: 20px;
  font-size: 13px;
  color: var(--gray-500);
  cursor: pointer;
  background: none;
}
.compare-add:hover { border-color: var(--red); color: var(--white); }
```

### 数据结构 (`assert/data/weapons.json`)
```json
{
  "weapons": [
    {
      "id": "m416",
      "name": { "en": "M416", "zh": "M416", "ko": "M416" },
      "type": "ar",
      "ammo": "5.56mm",
      "damage": 43,
      "rpm": 720,
      "velocity": 880,
      "reloadTime": 2.1,
      "magSize": [30, 40],
      "ttk": {
        "noVest": [0, 0.083, 0.166],
        "vest1": [0, 0.083, 0.166, 0.249],
        "vest2": [0, 0.083, 0.166, 0.249, 0.332],
        "vest3": [0, 0.083, 0.166, 0.249, 0.332, 0.415]
      },
      "recoilPattern": [[0,0],[1,3],[2,7],[3,12],[4,15],[5,14],[6,18],[7,22],[8,20],[9,25]],
      "attachments": ["muzzle","grip","mag","stock","scope"],
      "patch": { "version": "31.1", "change": "DMG 44→43", "type": "nerf" }
    }
  ],
  "categories": {
    "ar": { "en": "Assault Rifle", "zh": "步枪", "ko": "돌격소총" },
    "sr": { "en": "Sniper Rifle", "zh": "狙击枪", "ko": "저격소총" },
    "dmr": { "en": "DMR", "zh": "精确射手步枪", "ko": "지정사수소총" },
    "smg": { "en": "SMG", "zh": "冲锋枪", "ko": "기관단총" },
    "sg": { "en": "Shotgun", "zh": "霰弹枪", "ko": "산탄총" },
    "pistol": { "en": "Pistol", "zh": "手枪", "ko": "권총" },
    "melee": { "en": "Melee", "zh": "近战", "ko": "근접무기" }
  }
}
```

---

## 六、队伍数据对比 (`team.html`)

### 页面布局

```
┌──────────────────────────────────────────────────────────┐
│ Header (shared)                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ── TEAM ANALYZER ──                                     │
│  输入 4 名队友，生成团队分析报告                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  [Player 1    ] [Player 2    ] [Season▾] [Mode▾] │    │
│  │  [Player 3    ] [Player 4    ] [  ANALYZE  ]      │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌───────────────────────┐  ┌───────────────────────┐    │
│  │  TEAM RADAR            │  │  ROLE ASSIGNMENT       │    │
│  │  (Chart.js radar       │  │                       │    │
│  │   4 players overlaid)  │  │  🔫 突破手: Player1    │    │
│  │                        │  │  🎯 狙击手: Player3    │    │
│  │                        │  │  🧠 指挥官: Player2    │    │
│  │                        │  │  🛡️ 辅助位: Player4    │    │
│  │                        │  │                       │    │
│  └───────────────────────┘  └───────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  PLAYER CARDS (horizontal scroll on mobile)       │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │    │
│  │  │Player1 │ │Player2 │ │Player3 │ │Player4 │     │    │
│  │  │K/D: 3.2│ │K/D: 2.1│ │K/D: 2.8│ │K/D: 1.5│     │    │
│  │  │WR: 18% │ │WR: 22% │ │WR: 15% │ │WR: 20% │     │    │
│  │  │突破手   │ │指挥官   │ │狙击手   │ │辅助位   │     │    │
│  │  │87% fit │ │92% fit │ │78% fit │ │85% fit │     │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘     │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  [ 📸 Generate Team Card ] [ 🔗 Copy Link ]              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Footer (shared)                                          │
└──────────────────────────────────────────────────────────┘
```

### CSS
```css
/* team.html page styles */
.team-page { padding-top: 72px; }

.team-input-area {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 48px 32px;
}
.team-input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 120px 120px;
  gap: 10px;
  align-items: center;
}
@media (max-width: 768px) {
  .team-input-grid { grid-template-columns: 1fr 1fr; }
}
.team-input {
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--white);
  font-family: var(--font);
  font-size: 14px;
  outline: none;
}
.team-input:focus { border-color: var(--red); }
.team-select {
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--white);
  font-family: var(--font);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
.team-analyze-btn {
  grid-column: span 2;
  padding: 14px;
  background: var(--red);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: var(--font);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
@media (max-width: 768px) {
  .team-analyze-btn { grid-column: span 2; }
}

/* Results area */
.team-results {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 48px 60px;
}
.team-results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
@media (max-width: 768px) {
  .team-results-grid { grid-template-columns: 1fr; }
}

/* Radar panel */
.team-radar-panel {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 28px;
}
.team-radar-panel canvas { max-height: 350px; }

/* Role panel */
.team-role-panel {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 28px;
}
.role-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--subtle-border);
}
.role-icon { font-size: 24px; width: 36px; text-align: center; }
.role-info { flex: 1; }
.role-name { font-size: 14px; font-weight: 700; }
.role-desc { font-size: 11px; color: var(--gray-500); }
.role-player { font-size: 15px; font-weight: 800; color: var(--red); }

/* Player cards row */
.team-player-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 768px) {
  .team-player-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
.team-player-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}
.team-player-name { font-size: 16px; font-weight: 800; margin-bottom: 12px; }
.team-player-stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 4px 0;
  color: var(--gray-400);
}
.team-player-stat .value { color: var(--white); font-weight: 700; }
.team-player-role {
  margin-top: 12px;
  padding: 6px 12px;
  background: rgba(238,63,44,0.1);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--red);
}
.team-player-fit {
  font-size: 11px;
  color: var(--gray-500);
  margin-top: 4px;
}

/* Team colors */
.team-color-1 { --tc: #EE3F2C; }
.team-color-2 { --tc: #3B82F6; }
.team-color-3 { --tc: #10B981; }
.team-color-4 { --tc: #F59E0B; }
```

### 角色推荐算法
```javascript
var ROLES = [
  {
    id: 'fragger',
    icon: '🔫',
    name: { en:'Fragger', zh:'突破手', ko:'돌격수' },
    desc: { en:'Highest kill potential', zh:'击杀能力最强', ko:'가장 높은 킬 잠재력' },
    weights: { kills: 0.4, damage: 0.3, kd: 0.2, assists: 0.1 }
  },
  {
    id: 'sniper',
    icon: '🎯',
    name: { en:'Sniper', zh:'狙击手', ko:'저격수' },
    desc: { en:'Longest range eliminations', zh:'最远距离击杀', ko:'최장 거리 처치' },
    weights: { longestKill: 0.5, headshotPct: 0.3, kd: 0.2 }
  },
  {
    id: 'igl',
    icon: '🧠',
    name: { en:'IGL', zh:'指挥官', ko:'지휘관' },
    desc: { en:'Best win rate & survival', zh:'胜率与生存最均衡', ko:'승률과 생존 최고' },
    weights: { winRate: 0.4, top10: 0.3, kd: 0.2, games: 0.1 }
  },
  {
    id: 'support',
    icon: '🛡️',
    name: { en:'Support', zh:'辅助位', ko:'서포터' },
    desc: { en:'Most assists & team play', zh:'助攻最多，团队协作', ko:'어시스트 및 팀 플레이' },
    weights: { assists: 0.4, top10: 0.3, damage: 0.2, games: 0.1 }
  }
];

function assignRoles(players) {
  // 1. Z-score normalize each stat across 4 players
  // 2. For each role, compute weighted score per player
  // 3. Greedy assignment: highest score gets the role, remove player, repeat
}
```

---

## 七、航线跳伞模拟器 (`flight.html`)

### 页面布局

```
┌──────────────────────────────────────────────────────────┐
│ Header (shared)                                          │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────────────────────────────────┐    │
│ │ SIDEBAR   │ │                                      │    │
│ │           │ │         LEAFLET MAP                   │    │
│ │ Maps:     │ │                                      │    │
│ │ ● Erangel │ │     ✈️ ─────────── ✈️                │    │
│ │ ○ Miramar │ │     │  flight path  │                │    │
│ │ ○ Taego   │ │     │               │                │    │
│ │ ○ Deston  │ │  ┌──┤  ● School     │                │    │
│ │           │ │  │  │  ● Pochinki   │                │    │
│ │ ─────────│ │  │  │               │                │    │
│ │ Flight:   │ │  │  └───────────────┘                │    │
│ │ 距离: 8km │ │  │  green/yellow/red                 │    │
│ │ 时间: 62s │ │  │  drop range rings                 │    │
│ │           │ │  │                                    │    │
│ │ ─────────│ │  └────────────────────────────────────│    │
│ │ 推荐跳点: │ │                                      │    │
│ │ 1. School │ │                                      │    │
│ │    A级 近  │ │                                      │    │
│ │ 2. Rozhok │ │                                      │    │
│ │    B级 中  │ │                                      │    │
│ │ 3. Yasnaya│ │                                      │    │
│ │    A级 远  │ │                                      │    │
│ │           │ │                                      │    │
│ │ ─────────│ │                                      │    │
│ │ [Clear]   │ │                                      │    │
│ │ [Share]   │ │                                      │    │
│ └──────────┘ └──────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────┤
│ Footer (shared)                                          │
└──────────────────────────────────────────────────────────┘
```

### CSS
```css
/* flight.html — reuse maps.html layout pattern */
.flight-page {
  display: flex;
  height: calc(100vh - 72px);
  margin-top: 72px;
}

.flight-sidebar {
  width: 320px;
  background: var(--black);
  border-right: 1px solid var(--card-border);
  overflow-y: auto;
  padding: 20px;
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .flight-page { flex-direction: column; height: auto; }
  .flight-sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--card-border); }
}

.flight-map-container {
  flex: 1;
  position: relative;
}

/* Flight info card */
.flight-info {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
.flight-info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}
.flight-info-row .label { color: var(--gray-400); }
.flight-info-row .value { font-weight: 700; }

/* Drop spot recommendation */
.drop-list { margin-top: 16px; }
.drop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--subtle-bg);
  border: 1px solid var(--subtle-border);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.drop-item:hover { border-color: var(--red); }
.drop-rank {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--red);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}
.drop-info { flex: 1; }
.drop-name { font-size: 14px; font-weight: 700; }
.drop-meta { font-size: 11px; color: var(--gray-500); margin-top: 2px; }
.drop-distance {
  font-size: 13px;
  font-weight: 700;
  color: var(--gray-400);
}
.drop-distance.near { color: #10B981; }
.drop-distance.mid { color: #F59E0B; }
.drop-distance.far { color: var(--red); }

/* Map overlays */
.flight-path {
  stroke: var(--red);
  stroke-width: 3;
  stroke-dasharray: 12, 6;
}
/* Drop range rings via Leaflet circle options */
/* green: #10B981, yellow: #F59E0B, red: #EE3F2C */
```

### JS 核心逻辑
```javascript
// flight.html core
var flightStart = null;
var flightEnd = null;
var PLANE_SPEED = 130; // km/h
var DROP_RANGES = {
  near: 750,   // meters, vertical drop
  mid: 1500,   // 45° dive
  far: 2500    // max glide
};

// Click handler: first click = start, second = end
map.on('click', function(e) {
  if (!flightStart) {
    flightStart = e.latlng;
    startMarker = L.marker(e.latlng, { icon: planeIcon }).addTo(map);
  } else if (!flightEnd) {
    flightEnd = e.latlng;
    endMarker = L.marker(e.latlng, { icon: planeIcon }).addTo(map);
    drawFlightPath();
    calculateDropSpots();
  }
});

function drawFlightPath() {
  // Polyline with dash pattern
  flightLine = L.polyline([flightStart, flightEnd], {
    color: '#EE3F2C', weight: 3, dashArray: '12, 6'
  }).addTo(map);

  // 10-second interval markers along path
  var dist = map.distance(flightStart, flightEnd); // meters
  var flightTime = dist / (PLANE_SPEED * 1000 / 3600); // seconds
  for (var t = 10; t < flightTime; t += 10) {
    var pct = t / flightTime;
    var lat = flightStart.lat + (flightEnd.lat - flightStart.lat) * pct;
    var lng = flightStart.lng + (flightEnd.lng - flightStart.lng) * pct;
    // small circle marker at each interval
  }

  // Draw 3 range rings along path (sample every 500m)
  // For each sample point, draw circles at 750m, 1500m, 2500m
  // Union of circles forms the drop zone corridor
}

function calculateDropSpots() {
  // For each predefined drop spot on this map:
  // 1. Calculate perpendicular distance to flight line
  // 2. Classify as near/mid/far/unreachable
  // 3. Sort by (reachability, loot rating, competition level)
  // 4. Display top 5 in sidebar
}
```

---

## 八、投掷物工具（maps.html 增强）

### 设计
在 maps.html 工具栏（和现有 grid/measure 工具并列）添加「Throwables」按钮。

```
┌──────────────────────────────────────┐
│ 工具栏: [Grid] [Measure] [Throw] [Edit] │
├──────────────────────────────────────┤
│                                      │
│  Throwable mode active:              │
│  Select: [🧨 Frag] [💨 Smoke]        │
│          [⚡ Flash] [🔥 Molotov]      │
│                                      │
│  Click map: set throw origin (A)     │
│  Click again: set target (B)         │
│                                      │
│  Distance: 42m ✅ In range            │
│  (or: 72m ❌ Too far, move 12m closer)│
│                                      │
│  Arc visualization on map            │
│                                      │
└──────────────────────────────────────┘
```

### CSS（添加到 maps.html 内联样式）
```css
/* Throwable mode */
.throw-toolbar {
  display: flex;
  gap: 6px;
  padding: 10px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  margin-bottom: 12px;
}
.throw-type-btn {
  padding: 6px 12px;
  font-size: 12px;
  background: var(--subtle-bg);
  border: 1px solid var(--subtle-border);
  border-radius: 6px;
  color: var(--gray-400);
  cursor: pointer;
}
.throw-type-btn.active {
  border-color: var(--red);
  color: var(--white);
  background: rgba(238,63,44,0.1);
}
.throw-result {
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  margin-top: 12px;
  font-size: 13px;
}
.throw-in-range { color: #10B981; }
.throw-out-range { color: var(--red); }
```

### 投掷物数据
```javascript
var THROWABLES = {
  frag:    { name:{en:'Frag Grenade',zh:'手榴弹',ko:'수류탄'}, fuse:5, maxDist:60, radius:15, icon:'🧨' },
  smoke:   { name:{en:'Smoke Grenade',zh:'烟雾弹',ko:'연막탄'}, fuse:3, maxDist:60, radius:10, icon:'💨' },
  flash:   { name:{en:'Flash Bang',zh:'闪光弹',ko:'섬광탄'}, fuse:2.5, maxDist:55, radius:0, angle:100, icon:'⚡' },
  molotov: { name:{en:'Molotov',zh:'燃烧瓶',ko:'화염병'}, fuse:0, maxDist:40, radius:5, icon:'🔥' },
  sticky:  { name:{en:'Sticky Bomb',zh:'粘性炸弹',ko:'접착폭탄'}, fuse:3, maxDist:35, radius:10, icon:'💣' }
};
```

---

## 九、共享分享卡片生成器

所有页面的分享功能统一封装：

### JS（添加到 shared.js 或新建 assert/js/share-utils.js）
```javascript
/**
 * Generate a share card image from a DOM element
 * @param {HTMLElement} el - element to capture
 * @param {string} filename - download filename
 * @param {Object} opts - html2canvas options override
 */
function generateShareCard(el, filename, opts) {
  var defaults = {
    backgroundColor: '#0a0a0a',
    scale: 2,
    useCORS: true,
    logging: false
  };
  var options = Object.assign({}, defaults, opts || {});

  return html2canvas(el, options).then(function(canvas) {
    var link = document.createElement('a');
    link.download = filename || 'keygene-share.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    return canvas;
  });
}
```

---

## 十、文件结构总览

```
KeyGene.github.io/
├── index.html                 (现有，更新导航)
├── stats.html                 (现有，+Wrapped标签 +Compare海报)
├── maps.html                  (现有，+投掷物工具)
├── quiz.html                  (现有，更新导航)
├── leaderboard.html           (现有，更新导航)
├── sensitivity.html           (新建)
├── weapons.html               (新建)
├── team.html                  (新建)
├── flight.html                (新建)
├── sw.js                      (更新 precache 列表)
├── assert/
│   ├── css/shared.css         (更新：+dropdown nav 样式)
│   ├── js/shared.js           (更新：+dropdown nav JS)
│   ├── js/share-utils.js      (新建：通用分享卡片)
│   ├── data/
│   │   ├── weapons.json       (新建：武器数据库)
│   │   ├── pro-settings.json  (新建：职业选手灵敏度)
│   │   └── dropspots.json     (新建：热门降落点)
│   └── images/
│       └── weapons/           (新建：武器图标)
└── docs/
    ├── features-design.md     (现有：功能需求文档)
    └── ui-design.md           (本文档：UI设计方案)
```

---

## 十一、实现顺序

1. **shared.css/js 更新** — 下拉导航 + share-utils.js（所有页面受益）
2. **sensitivity.html** — 完整新页面，纯前端
3. **Compare 海报** — stats.html 小改动
4. **Wrapped 标签页** — stats.html 新标签
5. **weapons.html** — 完整新页面 + weapons.json 数据
6. **team.html** — 完整新页面，复用 API
7. **flight.html** — 完整新页面，复用 Leaflet
8. **投掷物工具** — maps.html 增强
9. **所有现有页面导航更新** — 换成 dropdown nav
10. **sw.js 更新** — 新页面加入 precache
