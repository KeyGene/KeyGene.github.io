# KeyGene PUBG Website — Astro Redesign Spec

**Date:** 2026-04-17
**Status:** Approved
**Scope:** Full rewrite of keygene.top from static HTML to Astro 5

---

## 1. Goals

Transform 11 static HTML pages (9,600 lines, duplicated nav/footer/i18n, inline JS/CSS) into an Astro 5 project with:

- App-like navigation with morph transitions (~800ms → ~120ms)
- Zero JS for static content, Preact islands for interactive parts
- SEO-friendly static i18n routes
- Unified design token system
- Cloudflare Pages deployment with edge CDN

---

## 2. Architecture

### Three Layers

**Pages (Astro — 0 JS):** 9 `.astro` pages that render static shells. Each page imports a shared `Base.astro` layout (head, nav, footer, view transitions). Pages contain no inline JS — interactive parts are delegated to islands.

- index.astro, stats.astro, maps.astro, quiz.astro, leaderboard.astro
- sensitivity.astro, weapons.astro, team.astro, flight.astro

**Components (Astro — 0 JS):** Reusable static UI pieces. These ship zero JavaScript to the client.

- Nav.astro — single dropdown nav, replaces 11 duplicated navs
- Footer.astro — single footer
- Hero.astro — homepage hero section
- ServerStatus.astro — PUBG server status widget
- WeaponCard.astro — weapon display card (used in weapons page grid)
- PlayerCard.astro — player summary card
- MapThumbnail.astro — map selector thumbnail
- Skeleton.astro — loading skeleton placeholder (shimmer animation via CSS)

**Islands (Preact — JS on demand):** Interactive components that hydrate on the client. Each island loads independently with its own hydration strategy.

| Island | Hydration | Purpose |
|--------|-----------|---------|
| StatsEngine.tsx | client:load | Player search, 7 tabs, charts, poster generation |
| LeafletMap.tsx | client:load | Tile map, markers, grid, measure, throwables |
| QuizEngine.tsx | client:visible | 16-question quiz state machine |
| LeaderboardTable.tsx | client:visible | Season/server/mode filters, sortable table |
| SensCalc.tsx | client:visible | Sensitivity calculator with sliders |
| FlightSim.tsx | client:load | Flight path canvas simulation |
| TeamBuilder.tsx | client:visible | Drag-and-drop team composition |
| CommandPalette.tsx | client:idle | Cmd+K global search overlay |
| ThemeToggle.tsx | client:load | Dark/light theme switcher |
| Toast.tsx | client:load | Global toast notification system |

### Layout

```
Base.astro
├── <head> (meta, fonts, tokens.css, view transition directives)
├── <Nav /> (with LangSwitcher, ThemeToggle island)
├── <slot /> (page content)
├── <Footer />
├── <CommandPalette client:idle />
└── <Toast client:load />
```

---

## 3. i18n — Static Routes

**Strategy:** Astro's built-in i18n routing generates static pages per locale.

| Locale | Path prefix | Example |
|--------|-------------|---------|
| zh (default) | `/` | `/stats/` |
| en | `/en/` | `/en/stats/` |
| ko | `/ko/` | `/ko/stats/` |

**Implementation:**
- `astro.config.mjs`: configure `i18n: { defaultLocale: 'zh', locales: ['zh', 'en', 'ko'], routing: { prefixDefaultLocale: false } }`
- Translation files: `src/i18n/zh.json`, `en.json`, `ko.json` — single source of truth, no duplication
- Helper: `t(key)` function reads from the correct JSON based on current locale
- LangSwitcher component: renders links to `/stats/`, `/en/stats/`, `/ko/stats/` — with View Transitions, switching language is instant

**Migration:** Extract all per-page `texts{}` objects into 3 JSON files. Deduplicate shared keys (nav, footer, common labels). Estimated ~200 unique keys across all pages.

---

## 4. Page Transitions — Morph

**Technology:** Astro View Transitions API (built on the browser View Transitions API with fallback).

**Behavior:**
- `<ViewTransitions />` in Base.astro head enables client-side navigation
- Shared elements get `transition:name="identifier"` — they animate from old position to new position
- Non-shared content cross-fades
- Nav and footer persist (never re-render) via `transition:persist`

**Shared element candidates:**
- Nav active indicator → slides to new position
- Page title → morphs between pages
- Weapon cards → expand into weapon detail (if detail page added)
- Player name → carries from search to stats view
- Map thumbnails → expand into full map view

**Fallback:** Browsers without View Transitions API get instant swap (no animation, but no full reload either — still SPA-like).

---

## 5. Design Tokens

Replace scattered CSS values with a systematic token layer in `src/styles/tokens.css`:

```css
:root {
  /* Colors */
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-border: #2a2d3a;
  --color-text: #e0e0e0;
  --color-text-muted: #888;
  --color-primary: #60a5fa;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Consolas', 'Monaco', monospace;
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 22px;

  /* Radius */
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

All components use tokens exclusively. Theme switch = swap token values, zero component changes.

---

## 6. UX Enhancements

### 6.1 Global Search (Cmd+K)

CommandPalette.tsx — Preact island, `client:idle` (loads after page is interactive).

- Trigger: Cmd+K (Mac) / Ctrl+K (Windows), or click search icon in nav
- Sections: Players (recent searches), Pages (all site pages), Weapons (from weapons.json), Maps (from map list)
- Keyboard: arrow keys to navigate, Enter to select, Esc to close
- Search is client-side fuzzy match (no API call for pages/weapons/maps; player search hits API on Enter)

### 6.2 PWA Enhanced

Replace manual `sw.js` with `@vite-pwa/astro` (Workbox):

- Precache: all static pages and assets at build time (auto-generated manifest)
- Runtime cache: API responses cached with stale-while-revalidate
- Offline: show cached pages, graceful offline indicator for API-dependent features
- Update: toast notification "New version available — click to refresh"
- Install: proper web app manifest with icons, theme color, display: standalone

### 6.3 Keyboard Navigation

- Global shortcuts: `G then S` = Stats, `G then M` = Maps, `G then Q` = Quiz, `G then L` = Leaderboard
- Focus management: visible focus rings on Tab, skip-nav link, proper ARIA landmarks
- Modal/overlay: Esc to close, focus trap inside
- Map page: arrow keys to pan, +/- to zoom (Leaflet already supports this)

### 6.4 Loading States

Skeleton.astro component with CSS shimmer animation (no JS needed):

- Stats page: skeleton for player card, chart area, tab content
- Leaderboard: skeleton table rows
- Maps: skeleton sidebar while tiles load
- Weapons: skeleton card grid
- Progressive fill: data replaces skeleton elements as it arrives (Preact state transitions)

### 6.5 Toast Notifications

Toast.tsx — global Preact island, `client:load`.

- Types: success (green), error (red), info (blue), warning (yellow)
- Auto-dismiss with progress bar (5s default, configurable)
- Stackable (max 3 visible)
- Usage: `import { toast } from '../islands/Toast'` → `toast.success('Player data loaded')`
- Replaces: inline error messages, alert() calls, console-only errors

---

## 7. Project Structure

```
keygene.top/
├── src/
│   ├── components/          # Astro components (0 JS)
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── ServerStatus.astro
│   │   ├── WeaponCard.astro
│   │   ├── PlayerCard.astro
│   │   ├── MapThumbnail.astro
│   │   └── Skeleton.astro
│   ├── islands/             # Preact islands (ship JS)
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
│   │   └── Base.astro       # Shared layout (head, nav, footer, transitions)
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
│       └── tokens.css        # Design tokens
├── public/
│   ├── assert/images/        # Existing images (keep paths)
│   ├── assert/data/          # weapons.json, dropspots.json
│   └── favicon.ico
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## 8. Deployment — Cloudflare Pages

- **Build:** `astro build` → outputs to `dist/`
- **Deploy:** Cloudflare Pages connected to GitHub repo, auto-deploys on push to `main`
- **API proxy:** Existing Cloudflare Workers at `/api/*` — no changes needed, Pages + Workers coexist on same domain
- **Custom domain:** keygene.top pointed to Cloudflare Pages
- **Preview:** Every PR gets a preview URL (e.g., `abc123.keygene-top.pages.dev`)

---

## 9. Migration Strategy

| Current | Astro | Notes |
|---------|-------|-------|
| 11 HTML files with inline JS/CSS | 9 .astro pages + Base.astro layout | Nav/footer/head deduplicated |
| shared.css (333 lines) | tokens.css + scoped component styles | Systematic design tokens |
| shared.js (152 lines) | ThemeToggle.tsx + Base.astro script | Split by concern |
| Per-page texts{} i18n | zh.json / en.json / ko.json | Single source, zero duplication |
| Per-page inline <script> | Preact island .tsx files | Reusable, testable |
| sw.js (manual) | @vite-pwa/astro (Workbox) | Auto-generated, smarter caching |
| GitHub Pages | Cloudflare Pages | Edge CDN, auto-deploy, preview URLs |
| No transitions | View Transitions + morph | ~800ms → ~120ms navigation |
| html2canvas share cards | Keep as utility in islands | Imported by StatsEngine |

**Approach:** Page-by-page migration. Start with layout + nav + simplest page (index), validate the full pipeline, then migrate remaining pages in complexity order.

---

## 10. Key Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| astro | Core framework | build-time only |
| @astrojs/preact | Preact integration | build-time only |
| preact | Island runtime | ~3 KB |
| @vite-pwa/astro | PWA/Workbox | build-time only |
| leaflet | Map tiles | ~40 KB (existing) |
| chart.js | Stats charts | ~60 KB (existing) |
| html2canvas | Share card generation | ~40 KB (existing) |

No new heavy runtime dependencies. Preact (3 KB) is the only addition to client bundle.
