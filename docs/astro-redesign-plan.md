# KeyGene PUBG Astro 重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite keygene.top from 11 static HTML pages to an Astro 5 + Preact island architecture with View Transitions, static i18n routes, design tokens, and Cloudflare Pages deployment.

**Architecture:** Three-layer system — Astro pages (zero JS shells), Astro components (static reusable UI), and Preact islands (interactive hydrated components). Static i18n generates `/`, `/en/`, `/ko/` routes. View Transitions with morph animations provide SPA-like navigation.

**Tech Stack:** Astro 5, Preact, TypeScript, @vite-pwa/astro, Leaflet, Chart.js, html2canvas, Cloudflare Pages

**Spec:** `docs/astro-redesign-design.md`

---

## Phase 1: Project Scaffold

### Task 1: Initialize Astro Project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`

- [ ] **Step 1: Initialize Astro in the existing repo**

Run inside `F:/Repo/Repo-SY/KeyGene.github.io`:

```bash
npm create astro@latest . -- --template minimal --no-install --typescript strict
```

If prompted about existing files, choose to keep them. The old HTML files will coexist during migration.

- [ ] **Step 2: Install dependencies**

```bash
npm install astro @astrojs/preact preact @vite-pwa/astro
npm install -D typescript @types/leaflet
```

- [ ] **Step 3: Configure astro.config.mjs**

```js
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://keygene.top',
  integrations: [preact()],
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en', 'ko'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    ssr: {
      noExternal: ['leaflet'],
    },
  },
});
```

- [ ] **Step 4: Update .gitignore**

Append to `.gitignore`:

```
node_modules/
dist/
.astro/
```

- [ ] **Step 5: Verify build**

```bash
npx astro build
```

Expected: empty build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/env.d.ts .gitignore
git commit -m "feat: initialize Astro 5 project with Preact integration"
```

---

### Task 2: Design Tokens

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Create design token file**

```css
:root {
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-surface-hover: #1e2235;
  --color-border: #2a2d3a;
  --color-text: #e0e0e0;
  --color-text-muted: #888;
  --color-primary: #60a5fa;
  --color-primary-hover: #93bbfd;
  --color-red: #EE3F2C;
  --color-red-hover: #ff5240;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --color-card-bg: rgba(26, 29, 39, 0.85);
  --color-card-border: rgba(255, 255, 255, 0.06);
  --color-backdrop: rgba(15, 17, 23, 0.5);

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  --font-sans: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Consolas', 'Monaco', monospace;
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --text-3xl: 36px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  --header-height: 72px;
  --header-height-mobile: 60px;
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
}

[data-theme="light"] {
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-surface-hover: #f0f0f0;
  --color-border: #e0e0e0;
  --color-text: #1a1a1a;
  --color-text-muted: #666;
  --color-card-bg: rgba(255, 255, 255, 0.9);
  --color-card-border: rgba(0, 0, 0, 0.08);
  --color-backdrop: rgba(248, 249, 250, 0.5);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

::selection {
  background: var(--color-primary);
  color: #fff;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-hover) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: add design token system with dark/light themes"
```

---

### Task 3: Base Layout

**Files:**
- Create: `src/layouts/Base.astro`

- [ ] **Step 1: Create Base.astro layout**

```astro
---
import { ViewTransitions } from 'astro:transitions';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import '../styles/tokens.css';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const { title, description = 'PUBG 战队工具站 — 战绩查询、地图工具、灵敏度计算', ogImage } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const lang = Astro.currentLocale ?? 'zh';
---

<!doctype html>
<html lang={lang} data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} | KeyGene</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />
    <meta property="og:title" content={`${title} | KeyGene`} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:type" content="website" />
    {ogImage && <meta property="og:image" content={ogImage} />}
    <link rel="icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
    <ViewTransitions />
  </head>
  <body>
    <Nav />
    <main transition:animate="fade">
      <slot />
    </main>
    <Footer />
    <script is:inline>
      (function() {
        var t = localStorage.getItem('keygene_theme');
        if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      })();
    </script>
  </body>
</html>

<style>
  main {
    min-height: calc(100vh - var(--header-height) - 80px);
    padding-top: var(--header-height);
  }

  @media (max-width: 768px) {
    main {
      padding-top: var(--header-height-mobile);
    }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: add Base.astro layout with View Transitions"
```

---

### Task 4: Nav Component

**Files:**
- Create: `src/components/Nav.astro`
- Create: `src/islands/ThemeToggle.tsx`

- [ ] **Step 1: Create ThemeToggle island**

```tsx
import { useState, useEffect } from 'preact/hooks';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('keygene_theme');
    const isDark = saved !== 'light';
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('keygene_theme', next ? 'dark' : 'light');
  }

  return (
    <button onClick={toggle} class="theme-toggle" aria-label="Toggle theme">
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Create Nav.astro**

```astro
---
import ThemeToggle from '../islands/ThemeToggle.tsx';
import { t } from '../i18n/utils';

const lang = Astro.currentLocale ?? 'zh';
const localePath = (path: string) => lang === 'zh' ? path : `/${lang}${path}`;

const navGroups = [
  {
    label: t('navStats', lang),
    items: [
      { href: localePath('/stats/'), label: t('navStatsLookup', lang) },
      { href: localePath('/leaderboard/'), label: t('navLeaderboard', lang) },
    ],
  },
  {
    label: t('navMaps', lang),
    items: [
      { href: localePath('/maps/'), label: t('navMapsInteractive', lang) },
      { href: localePath('/flight/'), label: t('navFlight', lang) },
    ],
  },
  {
    label: t('navTools', lang),
    items: [
      { href: localePath('/sensitivity/'), label: t('navSensitivity', lang) },
      { href: localePath('/weapons/'), label: t('navWeapons', lang) },
      { href: localePath('/team/'), label: t('navTeam', lang) },
    ],
  },
];

const langLinks = [
  { code: 'zh', label: '中文', prefix: '' },
  { code: 'en', label: 'EN', prefix: '/en' },
  { code: 'ko', label: '한국어', prefix: '/ko' },
];

const currentPath = Astro.url.pathname.replace(/^\/(en|ko)/, '');
---

<header transition:persist>
  <div class="header-inner">
    <a href={localePath('/')} class="logo" transition:name="logo">
      <img src="/assert/images/helmet-red.png" alt="KeyGene" width="36" height="36" />
      <span>KEY<span class="accent">GENE</span></span>
    </a>

    <nav class="desktop-nav">
      {navGroups.map((group) => (
        <div class="nav-dropdown">
          <a href={group.items[0].href} class="nav-link">{group.label}</a>
          <div class="dropdown-menu">
            {group.items.map((item) => (
              <a href={item.href}>{item.label}</a>
            ))}
          </div>
        </div>
      ))}
      <a href={localePath('/quiz/')} class="nav-link">{t('navQuiz', lang)}</a>
    </nav>

    <div class="nav-right">
      <ThemeToggle client:load />

      <div class="lang-switcher">
        {langLinks.map((l) => (
          <a
            href={`${l.prefix}${currentPath}`}
            class:list={['lang-link', { active: lang === l.code }]}
          >
            {l.label}
          </a>
        ))}
      </div>

      <button class="hamburger" id="hamburgerBtn" aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</header>

<div class="mobile-nav" id="mobileNav">
  <button class="mobile-nav-close" id="mobileNavClose" aria-label="Close">
    <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
  {navGroups.map((group) => (
    <div class="mobile-group">
      <div class="mobile-group-label">{group.label}</div>
      <div class="mobile-sub">
        {group.items.map((item) => (
          <a href={item.href}>{item.label}</a>
        ))}
      </div>
    </div>
  ))}
  <a href={localePath('/quiz/')} class="mobile-link">{t('navQuiz', lang)}</a>
  <div class="mobile-lang">
    {langLinks.map((l) => (
      <a href={`${l.prefix}${currentPath}`} class:list={['lang-link', { active: lang === l.code }]}>{l.label}</a>
    ))}
  </div>
</div>

<script>
  document.addEventListener('astro:page-load', () => {
    const btn = document.getElementById('hamburgerBtn');
    const nav = document.getElementById('mobileNav');
    const close = document.getElementById('mobileNavClose');
    if (!btn || !nav || !close) return;

    btn.addEventListener('click', () => nav.classList.add('open'));
    close.addEventListener('click', () => nav.classList.remove('open'));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

    nav.querySelectorAll('.mobile-group-label').forEach((label) => {
      label.addEventListener('click', () => {
        label.parentElement?.classList.toggle('expanded');
      });
    });
  });
</script>

<style>
  header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--header-height);
    background: var(--color-backdrop);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--color-border);
    z-index: 100;
    display: flex;
    align-items: center;
  }

  .header-inner {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: 2px;
  }
  .logo .accent { color: var(--color-red); }

  .desktop-nav {
    display: flex;
    align-items: center;
    gap: var(--space-xl);
  }

  .nav-dropdown { position: relative; }

  .nav-link {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: 500;
    padding: var(--space-sm) 0;
    transition: color var(--transition-fast);
  }
  .nav-link:hover { color: var(--color-text); }

  .nav-dropdown .nav-link::after {
    content: '';
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid currentColor;
    margin-left: 6px;
    vertical-align: middle;
    transition: transform var(--transition-fast);
  }

  .nav-dropdown:hover .nav-link::after {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: -12px;
    padding-top: 4px;
    min-width: 160px;
  }

  .nav-dropdown:hover .dropdown-menu { display: block; }

  .dropdown-menu a {
    display: block;
    padding: 10px 20px;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    background: var(--color-card-bg);
    backdrop-filter: blur(12px);
    border: 1px solid var(--color-card-border);
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .dropdown-menu a:first-child { border-radius: var(--radius-md) var(--radius-md) 0 0; }
  .dropdown-menu a:last-child { border-radius: 0 0 var(--radius-md) var(--radius-md); }
  .dropdown-menu a:hover {
    color: var(--color-text);
    background: var(--color-surface-hover);
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .lang-switcher {
    display: flex;
    gap: 4px;
  }
  .lang-link {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  .lang-link:hover { border-color: var(--color-border); }
  .lang-link.active {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .hamburger {
    display: none;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: var(--space-xs);
  }

  /* Mobile nav */
  .mobile-nav {
    display: none;
    position: fixed;
    inset: 0;
    background: var(--color-bg);
    z-index: 200;
    flex-direction: column;
    padding: var(--space-2xl) var(--space-lg);
    overflow-y: auto;
  }
  .mobile-nav.open { display: flex; }

  .mobile-nav-close {
    position: absolute;
    top: var(--space-md);
    right: var(--space-md);
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
  }

  .mobile-group { margin-bottom: var(--space-md); }
  .mobile-group-label {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
    padding: var(--space-sm) 0;
    cursor: pointer;
  }
  .mobile-sub {
    display: none;
    padding-left: var(--space-md);
  }
  .mobile-group.expanded .mobile-sub { display: block; }
  .mobile-sub a, .mobile-link {
    display: block;
    padding: var(--space-sm) 0;
    color: var(--color-text-muted);
    font-size: var(--text-base);
  }

  .mobile-lang {
    margin-top: var(--space-xl);
    display: flex;
    gap: var(--space-sm);
  }

  @media (max-width: 768px) {
    header { height: var(--header-height-mobile); }
    .desktop-nav { display: none; }
    .lang-switcher { display: none; }
    .hamburger { display: block; }
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.astro src/islands/ThemeToggle.tsx
git commit -m "feat: add Nav component with dropdowns, mobile nav, and ThemeToggle island"
```

---

### Task 5: Footer Component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Create Footer.astro**

```astro
---
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';
---

<footer>
  <div class="footer-inner">
    <span class="copyright">&copy; {new Date().getFullYear()} KeyGene</span>
    <div class="footer-links">
      <a href="https://github.com/KeyGene" target="_blank" rel="noopener">{t('footGithub', lang)}</a>
      <span class="sep">·</span>
      <a href="https://space.bilibili.com/YOUR_ID" target="_blank" rel="noopener">{t('footBilibili', lang)}</a>
    </div>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--color-border);
    padding: var(--space-lg) 0;
  }
  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .copyright {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  .footer-links {
    display: flex;
    gap: var(--space-sm);
    font-size: var(--text-sm);
  }
  .footer-links a { color: var(--color-text-muted); }
  .footer-links a:hover { color: var(--color-text); }
  .sep { color: var(--color-border); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: add Footer component"
```

---

## Phase 2: i18n System

### Task 6: Extract Translations

**Files:**
- Create: `src/i18n/zh.json`
- Create: `src/i18n/en.json`
- Create: `src/i18n/ko.json`
- Create: `src/i18n/utils.ts`

- [ ] **Step 1: Create i18n utility**

```ts
import zh from './zh.json';
import en from './en.json';
import ko from './ko.json';

const translations: Record<string, Record<string, string>> = { zh, en, ko };

export function t(key: string, lang: string = 'zh'): string {
  return translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
}

export function useTranslations(lang: string) {
  return (key: string) => t(key, lang);
}
```

- [ ] **Step 2: Extract translations from existing HTML pages**

This is the most labor-intensive step. Go through each HTML page's `texts{}` object and consolidate into 3 JSON files. Deduplicate shared keys (nav, footer, common labels).

Create `src/i18n/zh.json` — extract all Chinese strings:

```json
{
  "siteTitle": "KeyGene PUBG 战队工具站",
  "siteDesc": "PUBG 战队工具站 — 战绩查询、地图工具、灵敏度计算",

  "navStats": "战绩",
  "navStatsLookup": "战绩查询",
  "navLeaderboard": "排行榜",
  "navMaps": "地图",
  "navMapsInteractive": "互动地图",
  "navFlight": "航线模拟",
  "navTools": "工具",
  "navSensitivity": "灵敏度",
  "navWeapons": "武器库",
  "navTeam": "阵容分析",
  "navQuiz": "趣味测试",

  "footGithub": "GitHub",
  "footBilibili": "哔哩哔哩",
  "footCopyright": "© 2026 KeyGene"
}
```

Create `src/i18n/en.json` — same keys, English values. Create `src/i18n/ko.json` — same keys, Korean values.

**Important:** Walk through each existing HTML file and extract every key from its `texts.zh`, `texts.en`, `texts.ko` objects. Group by page prefix if needed (e.g., `statsTabOverview`, `statsTabWeapons`, `mapGridLabel`). Aim for ~200 unique keys total.

Source files to extract from:
- `index.html` — nav, hero, roster, join section, footer (~30 keys)
- `stats.html` — tabs, labels, stats fields, poster button (~60 keys)
- `maps.html` — map names, toolbar, markers, throwables (~40 keys)
- `quiz.html` — quiz UI, results (~20 keys)
- `leaderboard.html` — filters, table headers (~15 keys)
- `sensitivity.html` — calculator labels (~15 keys)
- `weapons.html` — categories, stat labels (~15 keys)
- `team.html` — builder labels (~10 keys)
- `flight.html` — simulator labels (~10 keys)

- [ ] **Step 3: Verify all keys are present in all 3 files**

```bash
node -e "
const zh = require('./src/i18n/zh.json');
const en = require('./src/i18n/en.json');
const ko = require('./src/i18n/ko.json');
const zhKeys = Object.keys(zh);
const enKeys = Object.keys(en);
const koKeys = Object.keys(ko);
const missing_en = zhKeys.filter(k => !en[k]);
const missing_ko = zhKeys.filter(k => !ko[k]);
console.log('ZH keys:', zhKeys.length);
console.log('Missing in EN:', missing_en);
console.log('Missing in KO:', missing_ko);
"
```

Expected: 0 missing keys in each language.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/
git commit -m "feat: add i18n system with zh/en/ko translations"
```

---

## Phase 3: Homepage Migration (Validate Pipeline)

### Task 7: Homepage — Static Shell

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/components/Hero.astro`
- Create: `src/components/ServerStatus.astro`

- [ ] **Step 1: Create Hero.astro**

```astro
---
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';
---

<section class="hero">
  <div class="hero-bg">
    <img src="/assert/images/hero-bg.jpg" alt="" loading="eager" />
  </div>
  <div class="hero-content">
    <h1 transition:name="site-title">KEY<span class="accent">GENE</span></h1>
    <p class="tagline">{t('heroTagline', lang)}</p>
    <div class="hero-actions">
      <a href={lang === 'zh' ? '/stats/' : `/${lang}/stats/`} class="btn-clip btn-red">
        {t('heroSearchBtn', lang)}
      </a>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    height: 70vh;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute;
    inset: 0;
  }
  .hero-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.4;
  }
  .hero-content {
    position: relative;
    text-align: center;
    z-index: 1;
  }
  .hero-content h1 {
    font-size: clamp(2.5rem, 8vw, 5rem);
    font-weight: 900;
    letter-spacing: 4px;
    color: var(--color-text);
  }
  .accent { color: var(--color-red); }
  .tagline {
    font-size: var(--text-lg);
    color: var(--color-text-muted);
    margin-top: var(--space-md);
  }
  .hero-actions {
    margin-top: var(--space-xl);
  }
  .btn-clip {
    display: inline-block;
    padding: 12px 32px;
    font-size: var(--text-base);
    font-weight: 600;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
  }
  .btn-red {
    background: var(--color-red);
    color: #fff;
  }
  .btn-red:hover { background: var(--color-red-hover); }
</style>
```

- [ ] **Step 2: Create ServerStatus.astro**

This is a static component — the actual status check happens client-side. Provide a skeleton that the page script will populate.

```astro
---
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';
---

<div class="server-status" id="serverStatus">
  <span class="status-dot"></span>
  <span class="status-text">{t('serverChecking', lang)}</span>
</div>

<style>
  .server-status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-warning);
  }
  .server-status.online .status-dot { background: var(--color-success); }
  .server-status.offline .status-dot { background: var(--color-error); }
</style>
```

- [ ] **Step 3: Create index.astro**

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import ServerStatus from '../components/ServerStatus.astro';
import { t } from '../i18n/utils';

const lang = Astro.currentLocale ?? 'zh';
---

<Base title={t('siteTitle', lang)}>
  <Hero />

  <section class="quick-search">
    <div class="container">
      <ServerStatus />
      <form action={lang === 'zh' ? '/stats/' : `/${lang}/stats/`} method="get" class="search-form">
        <input
          type="text"
          name="player"
          placeholder={t('searchPlaceholder', lang)}
          class="search-input"
          autocomplete="off"
        />
        <button type="submit" class="btn-clip btn-red">{t('searchBtn', lang)}</button>
      </form>
    </div>
  </section>

  <section class="team-info">
    <div class="container">
      <h2>{t('teamTitle', lang)}</h2>
      <div class="team-grid">
        <div class="team-card">
          <h3>KEYGENE</h3>
          <p>{t('teamMain', lang)}</p>
        </div>
        <div class="team-card">
          <h3>KEGE</h3>
          <p>{t('teamAlt', lang)}</p>
        </div>
      </div>
    </div>
  </section>
</Base>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-lg);
  }
  .quick-search {
    padding: var(--space-2xl) 0;
    text-align: center;
  }
  .search-form {
    display: flex;
    gap: var(--space-md);
    max-width: 500px;
    margin: var(--space-lg) auto 0;
  }
  .search-input {
    flex: 1;
    padding: 12px var(--space-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    outline: none;
  }
  .search-input:focus {
    border-color: var(--color-primary);
  }
  .team-info {
    padding: var(--space-2xl) 0;
  }
  .team-info h2 {
    font-size: var(--text-xl);
    margin-bottom: var(--space-lg);
    text-align: center;
  }
  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-lg);
  }
  .team-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    backdrop-filter: blur(8px);
  }
  .team-card h3 {
    font-size: var(--text-lg);
    margin-bottom: var(--space-sm);
    letter-spacing: 2px;
  }
  .team-card p {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
</style>
```

- [ ] **Step 4: Test the build and dev server**

```bash
npx astro dev
```

Open `http://localhost:4321` — verify:
- Hero section renders with background image
- Nav dropdown works on hover
- Theme toggle switches dark/light
- Language links navigate to `/en/` and `/ko/` variants
- Footer renders

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/components/Hero.astro src/components/ServerStatus.astro
git commit -m "feat: migrate homepage to Astro with Hero and ServerStatus components"
```

---

## Phase 4: Simple Page Migrations

### Task 8: Weapons Page

**Files:**
- Create: `src/pages/weapons.astro`
- Create: `src/components/WeaponCard.astro`
- Create: `src/islands/WeaponFilter.tsx`

- [ ] **Step 1: Create WeaponCard.astro**

```astro
---
interface Props {
  name: string;
  type: string;
  damage: number;
  fireRate: number;
  range: number;
  image?: string;
}

const { name, type, damage, fireRate, range, image } = Astro.props;
---

<div class="weapon-card" transition:name={`weapon-${name.toLowerCase().replace(/\s+/g, '-')}`}>
  {image && <img src={image} alt={name} class="weapon-img" loading="lazy" />}
  <h3 class="weapon-name">{name}</h3>
  <span class="weapon-type">{type}</span>
  <div class="weapon-stats">
    <div class="stat">
      <div class="stat-bar" style={`width: ${damage}%`}></div>
      <span class="stat-label">DMG {damage}</span>
    </div>
    <div class="stat">
      <div class="stat-bar rate" style={`width: ${fireRate}%`}></div>
      <span class="stat-label">ROF {fireRate}</span>
    </div>
    <div class="stat">
      <div class="stat-bar range" style={`width: ${range}%`}></div>
      <span class="stat-label">RNG {range}</span>
    </div>
  </div>
</div>

<style>
  .weapon-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    backdrop-filter: blur(8px);
    transition: border-color var(--transition-fast);
  }
  .weapon-card:hover { border-color: var(--color-primary); }
  .weapon-img {
    width: 100%;
    height: 120px;
    object-fit: contain;
    margin-bottom: var(--space-md);
  }
  .weapon-name {
    font-size: var(--text-base);
    font-weight: 600;
    margin-bottom: var(--space-xs);
  }
  .weapon-type {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .weapon-stats {
    margin-top: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .stat {
    position: relative;
    height: 20px;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .stat-bar {
    height: 100%;
    background: var(--color-red);
    border-radius: var(--radius-sm);
    opacity: 0.7;
  }
  .stat-bar.rate { background: var(--color-primary); }
  .stat-bar.range { background: var(--color-success); }
  .stat-label {
    position: absolute;
    top: 50%;
    left: var(--space-sm);
    transform: translateY(-50%);
    font-size: var(--text-xs);
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
</style>
```

- [ ] **Step 2: Create WeaponFilter.tsx island**

```tsx
import { useState, useMemo } from 'preact/hooks';

interface Weapon {
  name: string;
  category: string;
  damage: number;
  fireRate: number;
  range: number;
  image?: string;
}

interface Props {
  weapons: Weapon[];
  categories: string[];
  labels: {
    all: string;
    searchPlaceholder: string;
    sortDamage: string;
    sortFireRate: string;
    sortRange: string;
  };
}

export default function WeaponFilter({ weapons, categories, labels }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<'damage' | 'fireRate' | 'range'>('damage');

  const filtered = useMemo(() => {
    let result = weapons;
    if (category !== 'all') result = result.filter((w) => w.category === category);
    if (search) result = result.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));
    result = [...result].sort((a, b) => b[sort] - a[sort]);
    return result;
  }, [weapons, search, category, sort]);

  return (
    <div>
      <div class="filter-bar">
        <input
          type="text"
          placeholder={labels.searchPlaceholder}
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          class="filter-input"
        />
        <div class="filter-cats">
          <button
            class={`cat-btn ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            {labels.all}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              class={`cat-btn ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div class="filter-sort">
          <button class={`sort-btn ${sort === 'damage' ? 'active' : ''}`} onClick={() => setSort('damage')}>
            {labels.sortDamage}
          </button>
          <button class={`sort-btn ${sort === 'fireRate' ? 'active' : ''}`} onClick={() => setSort('fireRate')}>
            {labels.sortFireRate}
          </button>
          <button class={`sort-btn ${sort === 'range' ? 'active' : ''}`} onClick={() => setSort('range')}>
            {labels.sortRange}
          </button>
        </div>
      </div>
      <div class="weapon-grid">
        {filtered.map((w) => (
          <div key={w.name} class="weapon-card">
            {w.image && <img src={w.image} alt={w.name} class="weapon-img" loading="lazy" />}
            <h3 class="weapon-name">{w.name}</h3>
            <span class="weapon-type">{w.category}</span>
            <div class="weapon-stats">
              <div class="stat"><div class="stat-bar dmg" style={`width:${w.damage}%`} /><span class="stat-label">DMG {w.damage}</span></div>
              <div class="stat"><div class="stat-bar rof" style={`width:${w.fireRate}%`} /><span class="stat-label">ROF {w.fireRate}</span></div>
              <div class="stat"><div class="stat-bar rng" style={`width:${w.range}%`} /><span class="stat-label">RNG {w.range}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create weapons.astro page**

```astro
---
import Base from '../layouts/Base.astro';
import WeaponFilter from '../islands/WeaponFilter.tsx';
import { t } from '../i18n/utils';

const lang = Astro.currentLocale ?? 'zh';

const weaponsData = await fetch(new URL('/assert/data/weapons.json', Astro.site)).then(r => r.json()).catch(() => {
  const fs = await import('node:fs');
  return JSON.parse(fs.readFileSync('public/assert/data/weapons.json', 'utf-8'));
});

const categories = [...new Set(weaponsData.map((w: any) => w.category))];
---

<Base title={t('navWeapons', lang)}>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title" transition:name="page-title">{t('weaponsTitle', lang)}</h1>
      <WeaponFilter
        client:visible
        weapons={weaponsData}
        categories={categories}
        labels={{
          all: t('weaponsAll', lang),
          searchPlaceholder: t('weaponsSearch', lang),
          sortDamage: t('weaponsSortDmg', lang),
          sortFireRate: t('weaponsSortRof', lang),
          sortRange: t('weaponsSortRng', lang),
        }}
      />
    </div>
  </section>
</Base>

<style>
  .container { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-lg); }
  .page-section { padding: var(--space-2xl) 0; }
  .page-title {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-xl);
    text-align: center;
  }
</style>
```

- [ ] **Step 4: Test in dev server, verify filter/sort works**

- [ ] **Step 5: Commit**

```bash
git add src/pages/weapons.astro src/components/WeaponCard.astro src/islands/WeaponFilter.tsx
git commit -m "feat: migrate weapons page to Astro with Preact filter island"
```

---

### Task 9: Sensitivity Calculator Page

**Files:**
- Create: `src/pages/sensitivity.astro`
- Create: `src/islands/SensCalc.tsx`

- [ ] **Step 1: Create SensCalc.tsx**

Port the sensitivity calculator logic from `sensitivity.html` into a Preact island. The calculator converts sensitivity values between different games/DPI settings.

Extract the calculation logic from the existing `sensitivity.html` inline script. The island should contain:
- DPI input slider
- Game sensitivity sliders (hipfire, ADS for each scope)
- Real-time cm/360° calculation
- Preset buttons for common pro player settings

- [ ] **Step 2: Create sensitivity.astro page shell**

```astro
---
import Base from '../layouts/Base.astro';
import SensCalc from '../islands/SensCalc.tsx';
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';
---

<Base title={t('navSensitivity', lang)}>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title" transition:name="page-title">{t('sensTitle', lang)}</h1>
      <SensCalc client:visible lang={lang} />
    </div>
  </section>
</Base>

<style>
  .container { max-width: 800px; margin: 0 auto; padding: 0 var(--space-lg); }
  .page-section { padding: var(--space-2xl) 0; }
  .page-title { font-size: var(--text-2xl); margin-bottom: var(--space-xl); text-align: center; }
</style>
```

- [ ] **Step 3: Test and commit**

```bash
git add src/pages/sensitivity.astro src/islands/SensCalc.tsx
git commit -m "feat: migrate sensitivity calculator to Astro with Preact island"
```

---

### Task 10: Team Builder Page

**Files:**
- Create: `src/pages/team.astro`
- Create: `src/islands/TeamBuilder.tsx`

- [ ] **Step 1: Port team builder from team.html**

Extract the drag-and-drop team composition logic into `TeamBuilder.tsx`. The island handles:
- Player role slots (IGL, fragger, support, flex)
- Drag-and-drop between slots
- Team stat summary

- [ ] **Step 2: Create team.astro shell**

```astro
---
import Base from '../layouts/Base.astro';
import TeamBuilder from '../islands/TeamBuilder.tsx';
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';
---

<Base title={t('navTeam', lang)}>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title" transition:name="page-title">{t('teamTitle', lang)}</h1>
      <TeamBuilder client:visible lang={lang} />
    </div>
  </section>
</Base>

<style>
  .container { max-width: 1000px; margin: 0 auto; padding: 0 var(--space-lg); }
  .page-section { padding: var(--space-2xl) 0; }
  .page-title { font-size: var(--text-2xl); margin-bottom: var(--space-xl); text-align: center; }
</style>
```

- [ ] **Step 3: Test and commit**

```bash
git add src/pages/team.astro src/islands/TeamBuilder.tsx
git commit -m "feat: migrate team builder to Astro with Preact island"
```

---

### Task 11: Flight Simulator Page

**Files:**
- Create: `src/pages/flight.astro`
- Create: `src/islands/FlightSim.tsx`

- [ ] **Step 1: Port flight simulator from flight.html**

Extract the Canvas-based flight path simulation into `FlightSim.tsx`. The island handles:
- Map background rendering on Canvas
- Flight path line drawing
- Drop zone range circles
- Distance/time calculations

- [ ] **Step 2: Create flight.astro shell**

```astro
---
import Base from '../layouts/Base.astro';
import FlightSim from '../islands/FlightSim.tsx';
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';
---

<Base title={t('navFlight', lang)}>
  <section class="page-section">
    <div class="container-wide">
      <h1 class="page-title" transition:name="page-title">{t('flightTitle', lang)}</h1>
      <FlightSim client:load lang={lang} />
    </div>
  </section>
</Base>

<style>
  .container-wide { max-width: 1400px; margin: 0 auto; padding: 0 var(--space-lg); }
  .page-section { padding: var(--space-2xl) 0; }
  .page-title { font-size: var(--text-2xl); margin-bottom: var(--space-xl); text-align: center; }
</style>
```

- [ ] **Step 3: Test and commit**

```bash
git add src/pages/flight.astro src/islands/FlightSim.tsx
git commit -m "feat: migrate flight simulator to Astro with Preact island"
```

---

## Phase 5: Complex Page Migrations

### Task 12: Stats Page (Largest — 1,678 lines)

**Files:**
- Create: `src/pages/stats.astro`
- Create: `src/islands/StatsEngine.tsx`
- Create: `src/islands/StatsEngine/PlayerSearch.tsx`
- Create: `src/islands/StatsEngine/OverviewTab.tsx`
- Create: `src/islands/StatsEngine/RecentMatchesTab.tsx`
- Create: `src/islands/StatsEngine/WeaponsTab.tsx`
- Create: `src/islands/StatsEngine/MapStatsTab.tsx`
- Create: `src/islands/StatsEngine/CompareTab.tsx`
- Create: `src/islands/StatsEngine/HeatmapTab.tsx`
- Create: `src/islands/StatsEngine/BanCheckTab.tsx`
- Create: `src/islands/StatsEngine/SharePoster.tsx`
- Create: `src/islands/StatsEngine/types.ts`

This is the most complex page. Break StatsEngine into sub-components:

- [ ] **Step 1: Define shared types**

```ts
// src/islands/StatsEngine/types.ts
export interface PlayerStats {
  name: string;
  platform: string;
  level: number;
  stats: Record<string, ModeStats>;
}

export interface ModeStats {
  kills: number;
  deaths: number;
  wins: number;
  games: number;
  kd: number;
  winRate: number;
  top10Rate: number;
  avgDamage: number;
  headshots: number;
  longestKill: number;
  timePlayed: number;
}

export interface MatchData {
  id: string;
  mode: string;
  map: string;
  placement: number;
  kills: number;
  damage: number;
  date: string;
}

export type TabId = 'overview' | 'recent' | 'weapons' | 'mapStats' | 'compare' | 'heatmap' | 'banCheck';
```

- [ ] **Step 2: Create StatsEngine.tsx — the tab container**

```tsx
import { useState, useCallback } from 'preact/hooks';
import PlayerSearch from './PlayerSearch';
import OverviewTab from './OverviewTab';
import RecentMatchesTab from './RecentMatchesTab';
import WeaponsTab from './WeaponsTab';
import MapStatsTab from './MapStatsTab';
import CompareTab from './CompareTab';
import HeatmapTab from './HeatmapTab';
import BanCheckTab from './BanCheckTab';
import SharePoster from './SharePoster';
import type { PlayerStats, TabId } from './types';

interface Props {
  lang: string;
  labels: Record<string, string>;
  initialPlayer?: string;
}

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'overview', labelKey: 'statsTabOverview' },
  { id: 'recent', labelKey: 'statsTabRecent' },
  { id: 'weapons', labelKey: 'statsTabWeapons' },
  { id: 'mapStats', labelKey: 'statsTabMaps' },
  { id: 'compare', labelKey: 'statsTabCompare' },
  { id: 'heatmap', labelKey: 'statsTabHeatmap' },
  { id: 'banCheck', labelKey: 'statsTabBanCheck' },
];

export default function StatsEngine({ lang, labels, initialPlayer }: Props) {
  const [player, setPlayer] = useState<PlayerStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchPlayer = useCallback(async (name: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/stats?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(labels.statsError || 'Player not found');
      const data = await res.json();
      setPlayer(data);
    } catch (e: any) {
      setError(e.message);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, [labels]);

  const tabContent = () => {
    if (!player) return null;
    switch (activeTab) {
      case 'overview': return <OverviewTab player={player} labels={labels} />;
      case 'recent': return <RecentMatchesTab player={player} labels={labels} />;
      case 'weapons': return <WeaponsTab player={player} labels={labels} />;
      case 'mapStats': return <MapStatsTab player={player} labels={labels} />;
      case 'compare': return <CompareTab player={player} labels={labels} lang={lang} />;
      case 'heatmap': return <HeatmapTab player={player} labels={labels} />;
      case 'banCheck': return <BanCheckTab labels={labels} lang={lang} />;
      default: return null;
    }
  };

  return (
    <div class="stats-engine">
      <PlayerSearch onSearch={searchPlayer} loading={loading} labels={labels} initialPlayer={initialPlayer} />

      {error && <div class="error-msg">{error}</div>}

      {loading && (
        <div class="skeleton-container">
          <div class="skeleton" style="height:200px;margin-bottom:16px" />
          <div class="skeleton" style="height:300px" />
        </div>
      )}

      {player && !loading && (
        <>
          <div class="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                class={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {labels[tab.labelKey] || tab.id}
              </button>
            ))}
          </div>

          <div class="tab-content">{tabContent()}</div>

          <SharePoster player={player} labels={labels} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create each tab sub-component**

Port the rendering logic for each tab from the existing `stats.html` inline script. Each tab is a focused Preact component that receives `player` and `labels` props.

Key components to implement:
- `PlayerSearch.tsx` — input + platform selector + search button
- `OverviewTab.tsx` — K/D, win rate, games, kills, top10%, best records grid + Chart.js radar chart
- `RecentMatchesTab.tsx` — recent matches list with placement, kills, damage
- `WeaponsTab.tsx` — weapon usage stats, accuracy
- `MapStatsTab.tsx` — per-map win rate breakdown
- `CompareTab.tsx` — side-by-side player comparison (second player search)
- `HeatmapTab.tsx` — kill/death heatmap overlay
- `BanCheckTab.tsx` — ban status check via API
- `SharePoster.tsx` — html2canvas poster generation button

- [ ] **Step 4: Create stats.astro page**

```astro
---
import Base from '../layouts/Base.astro';
import StatsEngine from '../islands/StatsEngine/StatsEngine.tsx';
import { t } from '../i18n/utils';

const lang = Astro.currentLocale ?? 'zh';
const playerParam = Astro.url.searchParams.get('player') ?? '';

const labelKeys = [
  'statsTitle', 'statsSearchPlaceholder', 'statsError', 'statsTabOverview',
  'statsTabRecent', 'statsTabWeapons', 'statsTabMaps', 'statsTabCompare',
  'statsTabHeatmap', 'statsTabBanCheck', 'statsKD', 'statsWinRate',
  'statsGames', 'statsKills', 'statsTop10', 'statsDamage', 'statsLongestKill',
  'statsHeadshots', 'statsPoster', 'statsPosterGen',
];
const labels: Record<string, string> = {};
labelKeys.forEach((k) => { labels[k] = t(k, lang); });
---

<Base title={t('statsTitle', lang)}>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title" transition:name="page-title">{t('statsTitle', lang)}</h1>
      <StatsEngine client:load lang={lang} labels={labels} initialPlayer={playerParam} />
    </div>
  </section>
</Base>

<style>
  .container { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-lg); }
  .page-section { padding: var(--space-2xl) 0; }
  .page-title { font-size: var(--text-2xl); margin-bottom: var(--space-xl); text-align: center; }
</style>
```

- [ ] **Step 5: Test player search flow end-to-end**

```bash
npx astro dev
```

Navigate to `/stats/?player=GenG_Pio` — verify:
- Search auto-triggers from URL param
- Skeleton shows during loading
- Overview tab populates with data
- Tab switching works without reload
- Charts render (Chart.js)
- Share poster button works

- [ ] **Step 6: Commit**

```bash
git add src/pages/stats.astro src/islands/StatsEngine/
git commit -m "feat: migrate stats page to Astro with StatsEngine Preact island (7 tabs)"
```

---

### Task 13: Maps Page

**Files:**
- Create: `src/pages/maps.astro`
- Create: `src/islands/LeafletMap.tsx`

- [ ] **Step 1: Create LeafletMap.tsx island**

This is the second most complex island. Port from `maps.html`:

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Map as LeafletMap, CRS } from 'leaflet';

interface Props {
  lang: string;
  labels: Record<string, string>;
}

export default function MapIsland({ lang, labels }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletMap | null>(null);
  const [activeMap, setActiveMap] = useState('erangel');
  const [showGrid, setShowGrid] = useState(true);
  const [measureMode, setMeasureMode] = useState(false);
  const [throwMode, setThrowMode] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      // Port the custom pubgCRS from maps.html
      const mapSize = 816000;
      const pubgCRS = L.Util.extend({}, L.CRS.Simple, {
        projection: L.Projection.LonLat,
        transformation: new L.Transformation(1 / mapSize, 0, -1 / mapSize, 1),
      });

      const map = L.map(mapRef.current!, {
        crs: pubgCRS,
        minZoom: 0,
        maxZoom: 5,
        zoomControl: true,
        attributionControl: false,
      });

      leafletRef.current = map;
      loadMap('erangel', map, L);
    });

    return () => {
      leafletRef.current?.remove();
    };
  }, []);

  // ... port remaining map logic: loadMap, grid overlay, markers, measure tool, throwables

  return (
    <div class="map-container">
      <div class="map-sidebar">
        {/* Map selector thumbnails */}
        {['erangel', 'miramar', 'sanhok', 'vikendi', 'taego', 'deston', 'rondo'].map((m) => (
          <button
            key={m}
            class={`map-thumb ${activeMap === m ? 'active' : ''}`}
            onClick={() => { setActiveMap(m); /* loadMap(m) */ }}
          >
            <img src={`/assert/images/maps/${m}-thumb.jpg`} alt={m} />
            <span>{m}</span>
          </button>
        ))}
      </div>
      <div class="map-main">
        <div class="map-toolbar">
          <button class={`tool-btn ${showGrid ? 'active' : ''}`} onClick={() => setShowGrid(!showGrid)}>
            {labels.mapGrid || 'Grid'}
          </button>
          <button class={`tool-btn ${measureMode ? 'active' : ''}`} onClick={() => setMeasureMode(!measureMode)}>
            {labels.mapMeasure || 'Measure'}
          </button>
          <button class={`tool-btn ${throwMode ? 'active' : ''}`} onClick={() => setThrowMode(!throwMode)}>
            {labels.toolThrow || 'Throw'}
          </button>
        </div>
        <div ref={mapRef} class="map-view" />
      </div>
    </div>
  );
}
```

**Note:** The full Leaflet map island is complex (~400 lines). Port all logic from the existing `maps.html` inline script, including:
- Custom CRS for PUBG coordinates
- Tile layer loading from R2 CDN
- Grid overlay (A1-J10 labels)
- Marker system with categories and filters
- Measure tool (click-to-measure distance)
- Throwables tool (frag/smoke/flash/molotov range circles)
- Map info overlay
- Coordinate display

- [ ] **Step 2: Create maps.astro page**

```astro
---
import Base from '../layouts/Base.astro';
import LeafletMap from '../islands/LeafletMap.tsx';
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';

const mapLabelKeys = [
  'mapTitle', 'mapGrid', 'mapMeasure', 'mapEdit', 'toolThrow',
  'throwFrag', 'throwSmoke', 'throwFlash', 'throwMolotov',
  'throwInRange', 'throwOutRange',
];
const labels: Record<string, string> = {};
mapLabelKeys.forEach((k) => { labels[k] = t(k, lang); });
---

<Base title={t('mapTitle', lang)}>
  <LeafletMap client:load lang={lang} labels={labels} />
</Base>

<style is:global>
  @import 'leaflet/dist/leaflet.css';
</style>
```

- [ ] **Step 3: Test map rendering, grid, markers, throwables**

- [ ] **Step 4: Commit**

```bash
git add src/pages/maps.astro src/islands/LeafletMap.tsx
git commit -m "feat: migrate maps page to Astro with LeafletMap Preact island"
```

---

### Task 14: Quiz Page

**Files:**
- Create: `src/pages/quiz.astro`
- Create: `src/islands/QuizEngine.tsx`

- [ ] **Step 1: Create QuizEngine.tsx**

Port the 16-question quiz state machine from `quiz.html`:

```tsx
import { useState, useCallback } from 'preact/hooks';

interface Question {
  text: string;
  options: { label: string; scores: Record<string, number> }[];
}

interface Result {
  type: string;
  title: string;
  description: string;
  image?: string;
}

interface Props {
  questions: Question[];
  results: Result[];
  lang: string;
  labels: Record<string, string>;
}

export default function QuizEngine({ questions, results, lang, labels }: Props) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);

  const answer = useCallback((option: Question['options'][0]) => {
    const newScores = { ...scores };
    Object.entries(option.scores).forEach(([k, v]) => {
      newScores[k] = (newScores[k] || 0) + v;
    });
    setScores(newScores);

    if (current + 1 >= questions.length) {
      const topType = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0];
      setResult(results.find((r) => r.type === topType) || results[0]);
    } else {
      setCurrent(current + 1);
    }
  }, [current, scores, questions, results]);

  const restart = () => {
    setStarted(false);
    setCurrent(0);
    setScores({});
    setResult(null);
  };

  if (!started) {
    return (
      <div class="quiz-start">
        <h2>{labels.quizTitle}</h2>
        <p>{labels.quizDesc}</p>
        <button class="btn-clip btn-red" onClick={() => setStarted(true)}>
          {labels.quizStartBtn}
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div class="quiz-result">
        <h2>{result.title}</h2>
        <p>{result.description}</p>
        <button class="btn-clip btn-red" onClick={restart}>{labels.quizRetry}</button>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div class="quiz-question">
      <div class="progress-bar">
        <div class="progress-fill" style={`width:${((current + 1) / questions.length) * 100}%`} />
      </div>
      <p class="q-count">{current + 1} / {questions.length}</p>
      <h3>{q.text}</h3>
      <div class="options">
        {q.options.map((opt, i) => (
          <button key={i} class="option-btn" onClick={() => answer(opt)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create quiz.astro**

```astro
---
import Base from '../layouts/Base.astro';
import QuizEngine from '../islands/QuizEngine.tsx';
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';
// Questions and results data — extract from quiz.html inline data
// For now, import from a data file
import { questions, results } from '../data/quiz';
---

<Base title={t('navQuiz', lang)}>
  <section class="page-section">
    <div class="container">
      <QuizEngine
        client:visible
        questions={questions}
        results={results}
        lang={lang}
        labels={{
          quizTitle: t('quizTitle', lang),
          quizDesc: t('quizDesc', lang),
          quizStartBtn: t('quizStartBtn', lang),
          quizRetry: t('quizRetry', lang),
        }}
      />
    </div>
  </section>
</Base>

<style>
  .container { max-width: 700px; margin: 0 auto; padding: 0 var(--space-lg); }
  .page-section { padding: var(--space-2xl) 0; }
</style>
```

- [ ] **Step 3: Extract quiz question/result data from quiz.html to `src/data/quiz.ts`**

- [ ] **Step 4: Test full quiz flow, commit**

```bash
git add src/pages/quiz.astro src/islands/QuizEngine.tsx src/data/quiz.ts
git commit -m "feat: migrate quiz to Astro with QuizEngine Preact island"
```

---

### Task 15: Leaderboard Page

**Files:**
- Create: `src/pages/leaderboard.astro`
- Create: `src/islands/LeaderboardTable.tsx`

- [ ] **Step 1: Create LeaderboardTable.tsx**

Port from `leaderboard.html` — API-driven table with server/season/mode filters:

```tsx
import { useState, useEffect, useCallback } from 'preact/hooks';

interface LeaderboardEntry {
  rank: number;
  name: string;
  games: number;
  wins: number;
  kills: number;
  kd: number;
  winRate: number;
  avgDamage: number;
}

interface Props {
  lang: string;
  labels: Record<string, string>;
}

export default function LeaderboardTable({ lang, labels }: Props) {
  const [server, setServer] = useState('steam');
  const [season, setSeason] = useState('');
  const [mode, setMode] = useState('squad-fpp');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [seasons, setSeasons] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSeasons();
  }, [server]);

  const fetchSeasons = async () => {
    try {
      const res = await fetch(`/api/leaderboard/seasons?platform=${server}`);
      const data = await res.json();
      setSeasons(data);
      if (data.length > 0) {
        setSeason(data[0].id);
      }
    } catch {}
  };

  useEffect(() => {
    if (season) loadLeaderboard();
  }, [server, season, mode]);

  const loadLeaderboard = useCallback(async (retried = false) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/leaderboard?platform=${server}&season=${season}&mode=${mode}`);
      if (!res.ok) throw new Error('API error');
      const result = await res.json();
      setData(result);
    } catch (e) {
      if (!retried && seasons.length > 1) {
        const idx = seasons.findIndex((s) => s.id === season);
        if (idx >= 0 && idx < seasons.length - 1) {
          setSeason(seasons[idx + 1].id);
          return;
        }
      }
      setError(labels.leaderboardError || 'No data available');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [server, season, mode, seasons, labels]);

  return (
    <div class="leaderboard">
      <div class="filters">
        <select value={server} onChange={(e) => setServer((e.target as HTMLSelectElement).value)}>
          <option value="steam">Steam</option>
          <option value="kakao">Kakao</option>
          <option value="xbox">Xbox</option>
          <option value="psn">PSN</option>
        </select>
        <select value={season} onChange={(e) => setSeason((e.target as HTMLSelectElement).value)}>
          {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={mode} onChange={(e) => setMode((e.target as HTMLSelectElement).value)}>
          <option value="squad-fpp">Squad FPP</option>
          <option value="squad">Squad TPP</option>
          <option value="duo-fpp">Duo FPP</option>
          <option value="duo">Duo TPP</option>
          <option value="solo-fpp">Solo FPP</option>
          <option value="solo">Solo TPP</option>
        </select>
      </div>

      {loading && <div class="skeleton" style="height:400px" />}
      {error && <div class="error-msg">{error}</div>}

      {!loading && data.length > 0 && (
        <table class="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{labels.lbName || 'Name'}</th>
              <th>{labels.lbGames || 'Games'}</th>
              <th>{labels.lbWins || 'Wins'}</th>
              <th>{labels.lbKD || 'K/D'}</th>
              <th>{labels.lbDamage || 'Avg DMG'}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.rank}>
                <td class="rank">{row.rank}</td>
                <td><a href={`/${lang === 'zh' ? '' : lang + '/'}stats/?player=${row.name}`}>{row.name}</a></td>
                <td>{row.games}</td>
                <td>{row.wins}</td>
                <td>{row.kd.toFixed(2)}</td>
                <td>{row.avgDamage.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create leaderboard.astro**

```astro
---
import Base from '../layouts/Base.astro';
import LeaderboardTable from '../islands/LeaderboardTable.tsx';
import { t } from '../i18n/utils';
const lang = Astro.currentLocale ?? 'zh';

const lbKeys = ['leaderboardTitle', 'leaderboardError', 'lbName', 'lbGames', 'lbWins', 'lbKD', 'lbDamage'];
const labels: Record<string, string> = {};
lbKeys.forEach((k) => { labels[k] = t(k, lang); });
---

<Base title={t('leaderboardTitle', lang)}>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title" transition:name="page-title">{t('leaderboardTitle', lang)}</h1>
      <LeaderboardTable client:visible lang={lang} labels={labels} />
    </div>
  </section>
</Base>

<style>
  .container { max-width: 1000px; margin: 0 auto; padding: 0 var(--space-lg); }
  .page-section { padding: var(--space-2xl) 0; }
  .page-title { font-size: var(--text-2xl); margin-bottom: var(--space-xl); text-align: center; }
</style>
```

- [ ] **Step 3: Test filter switching, season fallback, commit**

```bash
git add src/pages/leaderboard.astro src/islands/LeaderboardTable.tsx
git commit -m "feat: migrate leaderboard to Astro with Preact island and season fallback"
```

---

## Phase 6: UX Enhancements

### Task 16: Toast Notification System

**Files:**
- Create: `src/islands/Toast.tsx`

- [ ] **Step 1: Create Toast.tsx**

```tsx
import { useState, useEffect, useCallback } from 'preact/hooks';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

let addToast: (msg: string, type: ToastType, duration?: number) => void;

export const toast = {
  success: (msg: string, duration = 5000) => addToast?.(msg, 'success', duration),
  error: (msg: string, duration = 5000) => addToast?.(msg, 'error', duration),
  info: (msg: string, duration = 5000) => addToast?.(msg, 'info', duration),
  warning: (msg: string, duration = 5000) => addToast?.(msg, 'warning', duration),
};

let nextId = 0;

export default function Toast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  addToast = useCallback((message: string, type: ToastType, duration = 5000) => {
    const id = nextId++;
    setItems((prev) => [...prev.slice(-2), { id, message, type, duration }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  if (items.length === 0) return null;

  const colors: Record<ToastType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-primary)',
    warning: 'var(--color-warning)',
  };

  return (
    <div class="toast-container">
      {items.map((item) => (
        <div key={item.id} class="toast-item" style={`border-left: 3px solid ${colors[item.type]}`}>
          <span>{item.message}</span>
          <button class="toast-close" onClick={() => setItems((p) => p.filter((t) => t.id !== item.id))}>×</button>
          <div class="toast-progress" style={`animation-duration:${item.duration}ms; background:${colors[item.type]}`} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add Toast to Base.astro layout**

Add after `<Footer />`:

```astro
import Toast from '../islands/Toast.tsx';
<!-- ... -->
<Toast client:load />
```

- [ ] **Step 3: Commit**

```bash
git add src/islands/Toast.tsx src/layouts/Base.astro
git commit -m "feat: add global Toast notification system"
```

---

### Task 17: Command Palette (Cmd+K)

**Files:**
- Create: `src/islands/CommandPalette.tsx`

- [ ] **Step 1: Create CommandPalette.tsx**

```tsx
import { useState, useEffect, useRef, useMemo } from 'preact/hooks';

interface CommandItem {
  id: string;
  title: string;
  section: string;
  href?: string;
  action?: () => void;
  icon?: string;
}

interface Props {
  items: CommandItem[];
  labels: Record<string, string>;
}

export default function CommandPalette({ items, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.title.toLowerCase().includes(q) || i.section.toLowerCase().includes(q));
  }, [items, query]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) {
      const item = filtered[selected];
      if (item.href) window.location.href = item.href;
      if (item.action) item.action();
      setOpen(false);
    }
  };

  if (!open) return null;

  const sections = [...new Set(filtered.map((i) => i.section))];

  return (
    <div class="cmd-overlay" onClick={() => setOpen(false)}>
      <div class="cmd-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onInput={(e) => { setQuery((e.target as HTMLInputElement).value); setSelected(0); }}
          onKeyDown={onKeyDown}
          placeholder={labels.cmdPlaceholder || 'Search...'}
          class="cmd-input"
        />
        <div class="cmd-results">
          {sections.map((section) => (
            <div key={section}>
              <div class="cmd-section">{section}</div>
              {filtered.filter((i) => i.section === section).map((item) => {
                const idx = filtered.indexOf(item);
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    class={`cmd-item ${idx === selected ? 'selected' : ''}`}
                    onClick={() => { if (item.action) item.action(); setOpen(false); }}
                  >
                    {item.title}
                  </a>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && <div class="cmd-empty">{labels.cmdNoResults || 'No results'}</div>}
        </div>
        <div class="cmd-footer">
          <kbd>↑↓</kbd> {labels.cmdNav || 'navigate'} · <kbd>↵</kbd> {labels.cmdSelect || 'select'} · <kbd>esc</kbd> {labels.cmdClose || 'close'}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CommandPalette to Base.astro**

Build the command items list from page routes and pass to the island:

```astro
import CommandPalette from '../islands/CommandPalette.tsx';
<!-- Add before closing body -->
<CommandPalette
  client:idle
  items={[
    { id: 'stats', title: t('navStatsLookup', lang), section: t('cmdPages', lang), href: localePath('/stats/') },
    { id: 'maps', title: t('navMapsInteractive', lang), section: t('cmdPages', lang), href: localePath('/maps/') },
    { id: 'quiz', title: t('navQuiz', lang), section: t('cmdPages', lang), href: localePath('/quiz/') },
    { id: 'lb', title: t('navLeaderboard', lang), section: t('cmdPages', lang), href: localePath('/leaderboard/') },
    { id: 'sens', title: t('navSensitivity', lang), section: t('cmdTools', lang), href: localePath('/sensitivity/') },
    { id: 'weapons', title: t('navWeapons', lang), section: t('cmdTools', lang), href: localePath('/weapons/') },
    { id: 'team', title: t('navTeam', lang), section: t('cmdTools', lang), href: localePath('/team/') },
    { id: 'flight', title: t('navFlight', lang), section: t('cmdTools', lang), href: localePath('/flight/') },
  ]}
  labels={{ cmdPlaceholder: t('cmdPlaceholder', lang), cmdPages: t('cmdPages', lang), cmdTools: t('cmdTools', lang), cmdNoResults: t('cmdNoResults', lang) }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/islands/CommandPalette.tsx src/layouts/Base.astro
git commit -m "feat: add Cmd+K command palette for global search"
```

---

### Task 18: Keyboard Navigation

**Files:**
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Add keyboard shortcuts and skip-nav to Base.astro**

Add before `<Nav />`:

```html
<a href="#main-content" class="skip-nav">Skip to content</a>
```

Add `id="main-content"` to `<main>`.

Add keyboard shortcut script:

```astro
<script>
  document.addEventListener('astro:page-load', () => {
    let gPressed = false;
    let gTimeout: number;

    document.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        gPressed = true;
        clearTimeout(gTimeout);
        gTimeout = window.setTimeout(() => { gPressed = false; }, 500);
        return;
      }

      if (gPressed) {
        gPressed = false;
        const routes: Record<string, string> = { s: '/stats/', m: '/maps/', q: '/quiz/', l: '/leaderboard/' };
        if (routes[e.key]) {
          e.preventDefault();
          window.location.href = routes[e.key];
        }
      }
    });
  });
</script>
```

Add skip-nav style:

```css
.skip-nav {
  position: absolute;
  top: -100%;
  left: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  z-index: 999;
  font-size: var(--text-sm);
}
.skip-nav:focus {
  top: var(--space-md);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: add keyboard shortcuts (G+S/M/Q/L) and skip-nav accessibility"
```

---

### Task 19: PWA with Workbox

**Files:**
- Modify: `astro.config.mjs`
- Create: `public/manifest.json`

- [ ] **Step 1: Create web app manifest**

```json
{
  "name": "KeyGene PUBG Tools",
  "short_name": "KeyGene",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f1117",
  "theme_color": "#EE3F2C",
  "icons": [
    { "src": "/assert/images/helmet-red.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assert/images/helmet-red.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Add PWA integration to astro.config.mjs**

```js
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://keygene.top',
  integrations: [
    preact(),
    AstroPWA({
      registerType: 'prompt',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{html,css,js,png,jpg,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/keygene\.top\/api\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } },
          },
          {
            urlPattern: /^https:\/\/.*\.r2\.dev\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'tile-cache', expiration: { maxEntries: 500, maxAgeSeconds: 86400 * 30 } },
          },
        ],
      },
    }),
  ],
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en', 'ko'],
    routing: { prefixDefaultLocale: false },
  },
});
```

- [ ] **Step 3: Add update prompt using Toast**

In Base.astro, add:

```astro
<script>
  import { toast } from '../islands/Toast';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      toast.info('New version available — refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    });
  }
</script>
```

- [ ] **Step 4: Remove old sw.js (replaced by Workbox)**

Delete `sw.js` from root — Workbox generates the service worker at build time.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs public/manifest.json src/layouts/Base.astro
git rm sw.js
git commit -m "feat: add PWA with Workbox, replace manual service worker"
```

---

## Phase 7: Deployment

### Task 20: Cloudflare Pages Setup

**Files:**
- Create: `wrangler.toml` (optional, for CF Workers integration)
- Modify: `package.json` (add build script)

- [ ] **Step 1: Ensure build script in package.json**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

- [ ] **Step 2: Test production build locally**

```bash
npm run build && npx astro preview
```

Verify all pages render, transitions work, islands hydrate.

- [ ] **Step 3: Create Cloudflare Pages project**

In Cloudflare Dashboard:
1. Pages → Create a project → Connect to GitHub repo `KeyGene.github.io`
2. Build settings: Framework preset = Astro, Build command = `npm run build`, Output directory = `dist`
3. Set custom domain: `keygene.top`

Or via CLI:

```bash
npx wrangler pages project create keygene-top
```

- [ ] **Step 4: Push and verify deployment**

```bash
git push origin master
```

Cloudflare Pages auto-builds and deploys. Verify at the preview URL, then at `keygene.top`.

- [ ] **Step 5: Verify all pages and features on live site**

Checklist:
- [ ] Homepage renders with hero, search, team info
- [ ] Nav dropdowns work on desktop and mobile
- [ ] Theme toggle persists across pages
- [ ] Language switch navigates to /en/ and /ko/ routes
- [ ] View Transitions animate between pages (morph on shared elements)
- [ ] Stats search returns player data
- [ ] Maps load tiles, grid, markers, throwables
- [ ] Quiz flow completes 16 questions → result
- [ ] Leaderboard filters work, season fallback active
- [ ] Sensitivity calculator functions
- [ ] Weapons filter/sort works
- [ ] Team builder drag-and-drop works
- [ ] Flight sim renders
- [ ] Cmd+K opens command palette
- [ ] G+S/M/Q/L keyboard shortcuts navigate
- [ ] PWA install prompt appears
- [ ] Offline: cached pages load

- [ ] **Step 6: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final deployment adjustments"
```

---

### Task 21: Clean Up Old Files

**Files:**
- Delete: `index.html`, `stats.html`, `maps.html`, `quiz.html`, `leaderboard.html`, `sensitivity.html`, `weapons.html`, `team.html`, `flight.html`, `prototype.html`
- Delete: `assert/css/shared.css`, `assert/js/shared.js`, `sw.js`
- Keep: `assert/images/`, `assert/data/`, `assert/js/share-utils.js` (moved to island util)
- Delete: `404.html` (replace with `src/pages/404.astro`)

- [ ] **Step 1: Create 404.astro**

```astro
---
import Base from '../layouts/Base.astro';
---

<Base title="404">
  <div class="not-found">
    <h1>404</h1>
    <p>Page not found</p>
    <a href="/" class="btn-clip btn-red">Back to Home</a>
  </div>
</Base>

<style>
  .not-found {
    text-align: center;
    padding: 120px var(--space-lg);
  }
  .not-found h1 {
    font-size: 6rem;
    font-weight: 900;
    color: var(--color-red);
  }
  .not-found p {
    font-size: var(--text-lg);
    color: var(--color-text-muted);
    margin: var(--space-md) 0 var(--space-xl);
  }
</style>
```

- [ ] **Step 2: Remove old files**

```bash
git rm index.html stats.html maps.html quiz.html leaderboard.html sensitivity.html weapons.html team.html flight.html prototype.html 404.html
git rm assert/css/shared.css assert/js/shared.js sw.js
git add src/pages/404.astro
git commit -m "chore: remove old static HTML files, replaced by Astro"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-5 | Project scaffold: Astro init, tokens, Base layout, Nav, Footer |
| 2 | 6 | i18n: extract translations, create JSON files, utility |
| 3 | 7 | Homepage migration (validates full pipeline) |
| 4 | 8-11 | Simple pages: weapons, sensitivity, team, flight |
| 5 | 12-15 | Complex pages: stats, maps, quiz, leaderboard |
| 6 | 16-19 | UX: toast, Cmd+K, keyboard nav, PWA |
| 7 | 20-21 | Deploy to Cloudflare Pages, clean up old files |

**Total:** 21 tasks across 7 phases. Each phase produces working, deployable software.
