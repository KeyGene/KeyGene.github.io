# Implementation Plan: PUBG Personality Quiz

**Spec:** `docs/superpowers/specs/2026-04-10-pubg-personality-quiz-design.md`
**Target:** `quiz.html` (new) + nav updates to 4 existing pages

---

## Task 1: Create `quiz.html` — Page Shell & CSS

**Goal:** Scaffold the new page with HTML structure, all CSS, and meta tags. No JS yet.

**Steps:**

1. Create `quiz.html` based on existing page patterns (stats.html for meta/head structure, index.html for nav structure)
2. HTML structure:
   - `<html lang="zh-CN" style="color-scheme: dark;">`
   - Meta tags (SEO, OG, hreflang) following stats.html pattern
   - Google Fonts (Rubik 400-900)
   - Header with full nav matching index.html (not stats.html's simplified header), including mobile nav overlay
   - Three screen containers: `#landingScreen`, `#quizScreen`, `#resultScreen` (only one visible at a time)
   - Footer matching index.html
3. CSS (inline `<style>`, matching site patterns):
   - CSS custom properties: `--red: #EE3F2C; --black: #000; --white: #fff; --gray-400; --gray-500; --gray-800; --card-bg; --card-border`
   - Global resets, `focus-visible`, `prefers-reduced-motion` (same as other pages)
   - Header/nav styles matching index.html exactly (including mobile nav, hamburger, `.btn-clip`, `.btn-red`)
   - Landing screen: full-viewport, centered content, title/subtitle/CTA
   - Quiz screen: progress bar, question text, option cards (vertical stack), prev/next buttons
   - Result screen: stacked cards (max-width 640px centered), 6 card types
   - Option cards: dark bg, hover red border, selected state (red border + tint), min-height 48px
   - Progress bar: red fill, clickable segments
   - Dimension bars: dark track with colored fill
   - Strength/weakness tags: pill-shaped badges
   - Share card overlay/modal
   - Responsive: mobile full-width cards with 16px padding, 12px gap
   - `.btn-clip` with `clip-path: polygon(...)` for angled corners (copy from index.html)

**Commit point:** `feat: add quiz.html page shell with HTML structure and CSS`

---

## Task 2: Quiz Data — Questions, Types, Scoring

**Goal:** Add all quiz data as JS objects inside `quiz.html`.

**Steps:**

1. Add `<script>` section at bottom of quiz.html
2. Define `QUESTIONS` array (16 items), each with:
   ```js
   { id: 1, dimension: 'RC', text: { zh: '...', en: '...' }, options: [
     { text: { zh: '...', en: '...' }, score: { dimension: 'RC', value: 2 } },
     ...
   ]}
   ```
   - Copy all 16 questions from spec (Q1-Q16)
   - EN translations for all question and option texts
3. Define `PERSONALITY_TYPES` object (16 entries keyed by code), each with:
   ```js
   { code: 'RWSF', group: 'rush',
     nickname: { zh: '单排战神', en: 'Solo War God' },
     description: { zh: '...', en: '...' },
     strengths: { zh: ['枪法在线', '意识顶级'], en: ['Deadly aim', 'Top game sense'] },
     weaknesses: { zh: ['容易上头', '团队配合差'], en: ['Hot-headed', 'Poor teamwork'] },
     partner: ['RTSL'],
     nemesis: 'CWSF',
     image: 'assert/images/quiz/RWSF.svg'
   }
   ```
   - All 16 types with zh/en for all text fields
   - Strengths, weaknesses, partner, nemesis per spec
4. Define `GROUP_COLORS` mapping:
   ```js
   { rush: '#EE3F2C', brain: '#7B5EA7', shadow: '#2D7D46', leader: '#D4A017' }
   ```

**Commit point:** `feat: add quiz data — 16 questions, 16 personality types, scoring tables`

---

## Task 3: Quiz Flow Logic

**Goal:** Implement the interactive quiz flow: landing → questions → result.

**Steps:**

1. Landing screen logic:
   - "Start" button → hide landing, show quiz screen, display Q1
   - Show decorative counter from localStorage (`quizCompletions` key)
2. Question rendering:
   - `renderQuestion(index)` — updates progress bar, question text, option cards
   - Option selection: click sets `.selected` class, stores answer in `answers[]` array
   - Clicking a different option changes selection (no auto-advance)
   - Progress bar: filled segments for answered questions, current segment highlighted, clickable to jump back
3. Navigation:
   - "Next" button: appears after option selected, advances to next question
   - On Q16, button text changes to "查看结果" / "View Result"
   - "Previous" button: hidden on Q1, visible on Q2+, goes back preserving previous answer
4. Scoring:
   - `calculateResult()` — iterate `answers[]`, sum scores per dimension (RC, WT, SI, FL)
   - Map positive/negative to letter: RC → R or C, WT → W or T, SI → S or I, FL → F or L
   - Combine 4 letters → type code (e.g., "RWSF")
   - Store dimension scores for bar display (percentage: `(score + 8) / 16 * 100`)
5. Result trigger:
   - After Q16 "View Result" click → calculate, hide quiz screen, show result screen
   - Save result to localStorage (`lastQuizResult: { code, scores, date }`)
   - Increment completion counter in localStorage
6. Returning user:
   - On page load, check localStorage for `lastQuizResult`
   - If exists, show "查看上次结果" / "View Last Result" link on landing screen

**Commit point:** `feat: implement quiz flow — question navigation, scoring, result calculation`

---

## Task 4: Result Screen — 6-Card Layout

**Goal:** Render the result page with all 6 stacked cards per spec.

**Steps:**

1. `renderResult(typeCode, dimensionScores)` function:
2. **Card 1 — Hero Result:**
   - Group theme color accent (top border)
   - "你的吃鸡人格是：" label
   - Nickname in large bold text with group color
   - 4-letter code below in accent color
   - Character illustration (`<img>` from type's image path)
   - Tagline from first sentence of description
3. **Card 2 — Type Summary:**
   - CODE（Nickname）in large text
   - Group badge (colored pill: e.g., "猛攻组 Rush")
   - Full personality description (2-3 sentences)
4. **Card 3 — Dimension Breakdown:**
   - 4 horizontal bars showing position between poles
   - Each bar: dark track, colored fill to percentage, pole labels on ends
   - Dimension name label above each bar
   - Percentage text
5. **Card 4 — Strengths & Weaknesses:**
   - Two-column layout (or stacked on mobile)
   - Strength tags: pill badges with subtle red/green bg
   - Weakness tags: pill badges with gray bg
6. **Card 5 — Relationships:**
   - Best Partner: type code + nickname + small avatar image, each clickable (scrolls to a modal or tooltip showing that type)
   - Nemesis: same format
   - Short explanation text
7. **Card 6 — Actions:**
   - "生成分享图" primary red CTA
   - "再测一次" outline button → reset state, show landing
   - "查看全部人格" text link → (future: modal or section showing all 16 types grid)

**Commit point:** `feat: implement result screen with 6-card stacked layout`

---

## Task 5: Share Card — Canvas Generation

**Goal:** Generate a downloadable share card image using Canvas API.

**Steps:**

1. "Generate Share Card" button triggers `generateShareCard()`
2. Create offscreen canvas 750x1334px
3. Draw layers (top to bottom):
   - Dark background (#111)
   - Group theme color border/glow (4px colored border)
   - KEY GENE logo (load from `assert/images/helmet-red.png`)
   - "你的吃鸡人格是" label text
   - Character illustration (load from type's image)
   - Nickname in large bold Rubik font with theme color
   - 4-letter code
   - One-line description in gray
   - 4 mini dimension bars (simplified horizontal bars)
   - "keygene.top" URL at bottom
4. Use `Promise.all` to preload images before drawing
5. Convert canvas to blob, trigger download as `pubg-personality-{CODE}.png`
6. Show overlay/modal with canvas preview and download button
7. Font loading: use Rubik from Google Fonts (ensure loaded before canvas draw via `document.fonts.ready`)

**Commit point:** `feat: implement Canvas share card generation`

---

## Task 6: i18n Support

**Goal:** Add full zh/en toggle support matching site pattern.

**Steps:**

1. Add `texts` object with `en` and `zh` keys covering:
   - Nav links (copy from index.html: `navHome`, `navAbout`, `navRoster`, `navStats`, `navMaps`, `navLeaderboard`, `navJoin`, plus new `navQuiz`)
   - Landing screen: `quizTitle`, `quizSubtitle`, `quizStart`, `quizCounter`
   - Quiz screen: `quizProgress`, `quizPrev`, `quizNext`, `quizViewResult`
   - Result labels: `resultLabel`, `resultGroupLabel`, `resultStrengths`, `resultWeaknesses`, `resultPartner`, `resultNemesis`
   - Action buttons: `resultShare`, `resultRetry`, `resultViewAll`
   - Footer links
2. `setLanguageText(lang)` function: same pattern as index.html (query `[data-key]` elements, set textContent or innerHTML)
3. Quiz content i18n: question text and option text use `currentLang` to pick from `{ zh, en }` objects in data
4. Result content i18n: personality type fields also use `currentLang`
5. Lang toggle button: `EN / ZH`, click toggles, saves to localStorage
6. On page load: check localStorage for saved lang preference

**Commit point:** `feat: add full zh/en i18n support to quiz page`

---

## Task 7: Nav Updates — All Pages

**Goal:** Add "Quiz" / "人格" link to navigation on all 5 pages.

**Steps:**

1. **`index.html`** (lines 748-755 desktop nav, 793-805 mobile nav):
   - Desktop nav: Add `<a href="quiz.html" data-key="navQuiz">Quiz</a>` after leaderboard link
   - Mobile nav: Add same link with `onclick="closeMobileNav()"`
   - i18n texts (line 997 en, 1026 zh): Add `navQuiz: "Quiz"` / `navQuiz: "人格"`
2. **`maps.html`**:
   - Desktop nav: Add quiz link after leaderboard
   - Mobile nav: Add quiz link
   - i18n texts: Add `navQuiz` key
3. **`leaderboard.html`**:
   - Desktop nav: Add quiz link after leaderboard
   - Mobile nav: Add quiz link
   - i18n texts: Add `navQuiz` key
4. **`stats.html`** (simplified header with `.header-right`):
   - Add quiz link in `.header-right` div: `<a href="quiz.html" data-key="navQuiz">Quiz</a>` before the back link or lang toggle
   - i18n texts: Add `navQuiz` key
5. **`quiz.html`**: Mark quiz link as `.active` in its own nav

**Commit point:** `feat: add Quiz nav link to all pages`

---

## Task 8: Homepage Hero CTA

**Goal:** Add quiz entry point in the homepage hero section.

**Steps:**

1. In `index.html` hero-actions div (line 826-829):
   - Add a third CTA button: `<a href="quiz.html" class="btn-clip btn-outline" data-key="heroQuizBtn">Find Your PUBG Personality</a>`
   - Or add it as a separate banner/card below the hero-actions, styled as a secondary CTA
2. i18n texts:
   - en: `heroQuizBtn: "Find Your PUBG Personality"`
   - zh: `heroQuizBtn: "测测你的吃鸡人格"`
3. Style: Use `btn-clip btn-outline` to match existing hero button style, or create a distinct accent style

**Commit point:** `feat: add quiz CTA entry point to homepage hero`

---

## Execution Order

Tasks 1-6 are sequential (each builds on the previous).
Task 7 and 8 can be done after Task 1 (independent of quiz logic) but best done after Task 6 so the i18n key `navQuiz` is consistent.

**Recommended order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

Each task has its own commit. Total: 8 commits.

---

## Key Patterns to Follow

- **No build tools.** Everything inline in one HTML file.
- **CSS custom properties.** Use `var(--red)`, `var(--black)`, etc. from `:root`.
- **i18n pattern.** `data-key` attributes on elements + `texts.en` / `texts.zh` JS objects + `setLanguageText()`.
- **clip-path buttons.** `clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)` for brand angled corners.
- **Canvas for export.** Same approach as stats.html's html2canvas usage.
- **localStorage.** For lang preference, quiz result, completion counter.
- **Rubik font.** All text uses Rubik, weights 400-900.
- **Mobile-first responsive.** Full-width on mobile, max-width centered on desktop.
