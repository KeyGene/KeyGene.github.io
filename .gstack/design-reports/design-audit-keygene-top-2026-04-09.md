# Design Audit: KeyGene.top

**Date:** 2026-04-09
**Type:** MARKETING/LANDING PAGE (gaming/esports)
**Pages Reviewed:** 4 (Homepage, Stats, Maps, Leaderboard)
**Viewports Tested:** Mobile (375), Tablet (768), Desktop (1280)

---

## Design Score: B (76/100)
## AI Slop Score: A (95/100)

This site has genuine design identity. Not template-generated, not AI slop. It has a clear point of view: dark, aggressive, PUBG-themed. The problems are in polish and consistency, not in vision.

---

## First Impression

The site communicates **competitive gaming intensity**. Dark backgrounds, fire-lit hero imagery, red accent color. This is a squad's home base, and it feels like one.

I notice **the hero section is strong**. Full-bleed PUBG destruction imagery with bold Chinese typography feels intentional and brand-appropriate. The glass card on the right (recruitment CTA) is a nice touch.

The first 3 things my eye goes to are: **the headline "我们不只是在缩圈中生存"**, **the burning cityscape background**, **the red "查询战绩" CTA button**. These are the right 3 things, in the right order. Hierarchy works.

If I had to describe this in one word: **purposeful**.

---

## Inferred Design System

### Fonts
| Font | Usage |
|------|-------|
| Rubik (400-900) | Primary font, all UI text |
| Times New Roman | Fallback only (not visually rendered) |
| Arial | Fallback only |

**Verdict: B+.** Single font family (Rubik) is a solid choice for a gaming brand. Good weight range (400-900). Not a generic default (not Inter/Roboto). Could benefit from a display typeface for hero headings to add more personality.

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Black | #000000 | Background |
| Red | #EE3F2C | Primary accent, CTAs, active states |
| White | #FFFFFF | Primary text |
| Gray 400 | #9CA3AF | Secondary text |
| Gray 500 | #6B7280 | Tertiary text, labels |
| Gray 800 | #1F1F1F | Card backgrounds |
| Gold | #FFD700 | Rank #1 highlight |
| Green | #10B981 | Server status online |

**Verdict: A-.** Tight palette. Red on black is classic esports. No random colors. Semantic usage is consistent (red = action, gold = winning, green = status). Very disciplined.

### Heading Scale
| Level | Size | Weight |
|-------|------|--------|
| H1 | 64px | 800 |
| H2 | 42px | 800 |
| H3 | 20px | 700 |

**Verdict: B.** Clean scale. H1→H2 ratio is ~1.52x (good). H2→H3 jump is steep (2.1x), which means H3 feels like body text. No H4-H6 used. Heading hierarchy is technically correct (no skipped levels on homepage).

### CSS Variables
The site uses CSS custom properties (`--red`, `--black`, `--white`, `--gray-400`, etc.). Good discipline. Colors are tokenized.

---

## Category Scores

### 1. Visual Hierarchy & Composition: A- (90/100)

**Strengths:**
- Clear focal point on every page
- Hero section reads as one composition, not a dashboard
- Stats bar (1.8K+ / 62.1% / 5.30) provides instant credibility
- Glass card CTA is contextually placed (right of hero, not blocking imagery)
- Section rhythm varies (hero → about with image → roster grid → data section → join CTA)

**Findings:**
- FINDING-001 (polish): Below-the-fold "about" section has large empty black space before content appears on tablet viewport
- FINDING-002 (polish): Footer competes slightly with the join CTA section. Both have email links.

### 2. Typography: B (80/100)

**Strengths:**
- Single font family (Rubik) used consistently
- Weight hierarchy (800 for headings, 600 for labels, 400 for body) is clear
- Hero headline at 64px is bold and readable against the background
- Text-transform uppercase used selectively (nav, tags) not everywhere

**Findings:**
- FINDING-003 (medium): Nav links are 14px at 19px height, below 44px touch target. Fine for desktop mouse, but header is also used on tablet.
- FINDING-004 (polish): Line-height on hero heading could be tighter (currently default, should be ~1.1 for display text)
- FINDING-005 (medium): Body text in "about" section may exceed 75-char measure on wide viewports
- FINDING-006 (polish): No `text-wrap: balance` on headings. "我们不只是/在缩圈中 生存。/我们主宰它。" wraps well manually, but other headings could benefit.

### 3. Color & Contrast: A (92/100)

**Strengths:**
- Red (#EE3F2C) on black provides excellent contrast
- White text on dark backgrounds exceeds WCAG AA
- No color-only encoding. Server status uses green + text label
- Dark mode is the only mode (appropriate for gaming). Surface elevation used with subtle rgba layers.
- No red/green-only combinations

**Findings:**
- FINDING-007 (polish): Gray-500 (#6B7280) text on pure black (#000) is 4.6:1 contrast. Passes AA for normal text (4.5:1) but barely. Some label text is 11px which would need 7:1.
- FINDING-008 (polish): No `color-scheme: dark` on html element

### 4. Spacing & Layout: B+ (84/100)

**Strengths:**
- Consistent 48px horizontal padding on desktop
- 8px-based spacing scale (evident in gaps: 8, 12, 16, 24, 32, 48, 64)
- Grid layout for roster cards, stats cards
- Max content width observed (~1200px)
- No horizontal scroll detected

**Findings:**
- FINDING-009 (medium): Border-radius is mostly 0 (clip-path buttons) or 12px (cards). The two systems coexist but the clip-path approach (angled corners) is more brand-aligned. Mixed radius + clip-path feels unsettled.
- FINDING-010 (polish): No `env(safe-area-inset-*)` for notch devices

### 5. Interaction States: B- (72/100)

**Strengths:**
- Hover states present on nav links (color transition)
- Button hover includes `translateY(-1px)` lift effect
- Active states on tab buttons (red underline)
- Loading spinners use brand red

**Findings:**
- FINDING-011 (high): `focus-visible` ring not explicitly styled. Browsers may show default blue ring which clashes with the dark/red theme.
- FINDING-012 (medium): No visible disabled state on search button when input is empty
- FINDING-013 (medium): Empty states in stats page just show text ("搜索玩家查看战绩"). No illustration, icon, or suggested action beyond the search.
- FINDING-014 (polish): Cursor not explicitly set to `pointer` on all interactive elements (relies on browser defaults)

### 6. Responsive Design: B (78/100)

**Strengths:**
- Hamburger menu on mobile works correctly
- Hero text scales down proportionally
- Roster grid goes from 4-col to 2-col on mobile
- Sidebar map selector becomes horizontal scroll on mobile
- `viewport` meta is correct (no `user-scalable=no`)

**Findings:**
- FINDING-015 (high): Nav link touch targets are 29x19px on tablet, far below 44px minimum
- FINDING-016 (medium): Maps page on mobile had rendering issues (fixed in recent commit, but map tiles may still not fully cover viewport)
- FINDING-017 (medium): Tablet viewport (768px) shows a lot of empty black space below the hero. The "about" section doesn't fill the visual gap.
- FINDING-018 (polish): Footer links on mobile are horizontally spaced but could benefit from vertical stacking at very narrow widths

### 7. Motion & Animation: C+ (68/100)

**Strengths:**
- Subtle hover transitions on buttons and links (0.2s)
- Loading spinner animation is smooth
- Glass card entrance (opacity + translateY) on hero section

**Findings:**
- FINDING-019 (high): `transition: all` used broadly instead of specific properties. This animates layout properties which can cause jank.
- FINDING-020 (medium): No scroll-linked animations. For a gaming site, this is a missed opportunity. Sections could reveal on scroll with subtle entrance animations.
- FINDING-021 (medium): No `prefers-reduced-motion` media query detected. All transitions run regardless of user preference.
- FINDING-022 (polish): Only 1-2 intentional motion patterns. Gaming sites benefit from 3+ (entrance, hover, scroll-reveal, loading).

### 8. Content & Microcopy: B+ (84/100)

**Strengths:**
- Hero copy is strong and specific ("我们不只是在缩圈中生存，我们主宰它" is memorable)
- No generic SaaS copy ("Welcome to..." / "Your all-in-one solution...")
- EN/ZH toggle is a real feature, not decoration. Both languages are well-written.
- Button labels are specific ("查询战绩", "加入战队", "联系我们")
- Stats show real data (1.8K+ matches, 62.1% win rate, 5.30 K/D)

**Findings:**
- FINDING-023 (polish): Some labels in stats page still show English ("Assists", "Survived") even in Chinese mode
- FINDING-024 (polish): Error message for leaderboard could be warmer/more helpful

### 9. AI Slop Detection: A (95/100)

This site passes the slop test with flying colors.

| Anti-Pattern | Present? |
|-------------|----------|
| Purple/violet gradient | No. Red/black/dark gray. |
| 3-column feature grid with icons in circles | No. Roster uses player avatars, not icons. |
| Icons in colored circles | No. |
| Centered everything | No. Left-aligned hero text, mixed alignment. |
| Uniform bubbly border-radius | No. Mix of clip-path angles and subtle radius. |
| Decorative blobs/waves | No. Clean dark backgrounds. |
| Emoji as design elements | No (except small rank emoji in stats, contextual). |
| Colored left-border cards | No. |
| Generic hero copy | No. Brand-specific gaming copy. |
| Cookie-cutter section rhythm | No. Sections vary in layout and height. |

**Verdict:** This looks human-designed. The clip-path angled buttons, the PUBG-specific imagery, the dark fire-lit palette, the real player data... all point to someone who plays PUBG and built a site for their squad. Not a template. Not AI-generated.

### 10. Performance as Design: C (64/100)

**Findings:**
- FINDING-025 (high): Total page load 11.8s. DOM ready at 5.3s. This is slow. Hero image + Google Fonts + API calls all contribute.
- FINDING-026 (medium): LCP is likely the hero background image. Should be preloaded (it IS preloaded via `<link rel="preload">`, so the issue is the image itself being large).
- FINDING-027 (medium): `font-display: swap` is declared but Rubik from Google Fonts still adds latency. Consider self-hosting.
- FINDING-028 (polish): Images use WebP format (good). Hero has mobile/desktop variants (good).

---

## Litmus Checks

| # | Check | Result |
|---|-------|--------|
| 1 | Brand/product unmistakable in first screen? | **YES.** KEY GENE logo + PUBG imagery + squad identity. |
| 2 | One strong visual anchor present? | **YES.** Hero cityscape with bold headline. |
| 3 | Page understandable by scanning headlines only? | **YES.** "我们不只是..." → "因友谊而生" → "认识队员" → "查看数据" → "准备跳伞" |
| 4 | Each section has one job? | **YES.** Hero=identity, About=story, Roster=team, Stats=data, Join=CTA |
| 5 | Are cards actually necessary? | **YES.** Roster cards display player identity. Stats cards display data. Both justified. |
| 6 | Does motion improve hierarchy? | **PARTIAL.** Hover transitions help. No scroll animations reduces dynamism. |
| 7 | Premium without decorative shadows? | **YES.** Site barely uses shadows. Clean dark surfaces. |

---

## Hard Rejection Criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Generic SaaS card grid as first impression | **PASS.** Hero is a full-bleed composition. |
| 2 | Beautiful image with weak brand | **PASS.** Brand is clearly integrated. |
| 3 | Strong headline with no clear action | **PASS.** Two CTAs below headline. |
| 4 | Busy imagery behind text | **PASS.** Hero image is dark enough for text legibility. |
| 5 | Sections repeating same mood | **PASS.** Mood varies (intense → warm → factual → inviting). |
| 6 | Carousel with no narrative purpose | **PASS.** No carousels. |
| 7 | App UI made of stacked cards | **PASS.** Not an app UI layout. |

**No hard rejections.** Site passes all 7 criteria.

---

## Score Summary

| Category | Weight | Grade | Score |
|----------|--------|-------|-------|
| Visual Hierarchy | 15% | A- | 90 |
| Typography | 15% | B | 80 |
| Color & Contrast | 10% | A | 92 |
| Spacing & Layout | 15% | B+ | 84 |
| Interaction States | 10% | B- | 72 |
| Responsive | 10% | B | 78 |
| Content Quality | 10% | B+ | 84 |
| AI Slop | 5% | A | 95 |
| Motion | 5% | C+ | 68 |
| Performance | 5% | C | 64 |
| **Weighted Total** | | **B (80.1)** | |

**Design Score: B**
**AI Slop Score: A**

---

## Quick Wins (Top 5 highest-impact, lowest-effort fixes)

1. **Add `focus-visible` styling** — 5 lines of CSS. Use `outline: 2px solid var(--red); outline-offset: 2px` on `:focus-visible`. Prevents ugly blue rings.

2. **Replace `transition: all` with specific properties** — Find-and-replace across files. Use `transition: color 0.2s, background 0.2s, transform 0.15s` instead of `transition: all`.

3. **Add `prefers-reduced-motion` media query** — Wrap all transitions in `@media (prefers-reduced-motion: no-preference) { }`. Accessibility win.

4. **Increase nav link padding for touch targets** — Change nav `a` padding from text-only to `padding: 12px 8px` so touch area is 44px+ tall.

5. **Add scroll-reveal animations** — Add a simple `.reveal` class with `opacity: 0 → 1` + `translateY(24px → 0)` on scroll using IntersectionObserver. Transforms the page feel with ~20 lines of JS.

---

## Deferred (Not fixable from code alone)

- Hero image optimization (may need re-export at lower quality/resolution)
- i18n completeness (some English labels in Chinese mode need content review)
- Leaderboard data availability (PUBG API limitation, not a design issue)
