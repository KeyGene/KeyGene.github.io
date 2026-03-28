# KEY GENE Website Redesign - DESIGN.md

## Current Site Assessment

### What Works
- Bilingual i18n (zh/en) with auto-detection
- PUBG API player stats integration (unique & useful feature)
- Custom domain + GitHub Pages deployment

### What's Outdated
| Problem | Details |
|---------|---------|
| **Visual style** | 2018-era "gaming neon" aesthetic — particles.js, glow text, pulse animations everywhere. Looks like a template, not a brand. |
| **Copy/tone** | "BOOOOM!!!" repeated 3 times, overly dramatic for 2026. Reads like a hype montage, not a team identity. |
| **Layout** | Single long scroll with no navigation, no clear hierarchy. Every section uses the same bg-white/10 card. |
| **Performance** | 1.6MB logo PNG, 50KB particles.js, no lazy loading. Slow on mobile. |
| **Security** | PUBG API JWT token exposed in client-side JS (line 359). |
| **Tech** | Vanilla HTML with inline scripts, no build pipeline, no component reuse. Tailwind v4 vendored as minified blob. |
| **Assets** | Explosion-style logo feels amateur. favicon.ico is 259KB (should be <10KB). |
| **Year in footer** | Hardcoded "2025" |

---

## Redesign Direction

### Design Philosophy
**From "loud gaming template" to "clean competitive identity".**

Think: Team Liquid, 100 Thieves, Gen.G — modern esports teams use restrained, confident design. The site should feel like a professional team brand, not a fan page.

### Visual Identity

#### Color Palette
```
Primary:    #0A0A0A (near-black background)
Accent:     #FF5722 (deep orange — keep brand continuity)
Secondary:  #1A1A2E (dark navy for cards/sections)
Text:       #F5F5F5 (off-white, easier on eyes than pure white)
Muted:      #6B7280 (gray-500 for secondary text)
Success:    #10B981 (stats positive)
Danger:     #EF4444 (stats negative)
```

Drop the multi-color rainbow approach (orange, red, pink, coral, tomato all at once). Use **one accent color** consistently.

#### Typography
```
Headings:   Inter or Space Grotesk (geometric, modern, gaming-adjacent without being over-the-top)
Body:       Inter
Monospace:  JetBrains Mono (for stats display)
```

#### Layout System
- **Max-width**: 1200px centered container
- **Grid**: CSS Grid for sections, not just centered stacks
- **Spacing**: Generous whitespace (think Apple, not arcade)
- **Cards**: Subtle borders (`border border-white/10`), no translucent white backgrounds

---

### New Site Structure

```
[Nav Bar]  Logo | About | Stats | Roster | Join | EN/ZH toggle

[Hero]
  - Full-viewport height
  - Redesigned logo (SVG, not 1.6MB PNG)
  - One-line tagline (not three lines of BOOM)
  - Subtle background: CSS gradient mesh or low-opacity video, NOT particles.js

[About]
  - 2-column layout: team photo/artwork left, text right
  - Short, confident copy (3-4 sentences max)
  - Founded year, game focus, team vibe

[Player Stats]
  - Keep the PUBG API integration (best feature)
  - Better UI: card-based stats grid instead of text dump
  - Each stat in its own card with icon + value + label
  - Add platform selector (Steam/Console)
  - Move API key to a serverless proxy (Cloudflare Worker / Vercel Edge)

[Team Roster] (NEW)
  - Grid of member cards
  - Each: avatar, IGN, role, signature stat
  - Makes the team feel real

[Join / Contact]
  - Clean CTA section
  - Discord link (if applicable, more modern than email)
  - Keep email as secondary option

[Footer]
  - Dynamic year
  - Social links
  - Minimal
```

---

### Copy Direction

**Current tone**: Overly dramatic, repetitive ("BOOOOM!!!" x3), trying too hard.

**New tone**: Confident, concise, slightly casual. Let the gameplay speak.

| Section | Current | Proposed |
|---------|---------|----------|
| Tagline | "KEY CRACKS CIRCLE, GENE TRIGGERS BOOOOM!!!" | "We don't just survive the circle. We own it." |
| Quote | "In the silence between chaos, GENE ignites the storm." | Cut entirely, or use a real player quote |
| About | 5 lines of purple prose about childhood dreams | "KEY GENE is a competitive PUBG squad built on friendship and fire. We started as schoolyard teammates, now we fight for finals." |
| Join CTA | "If you don't have teammates to rely on..." | "Looking for a squad? We're recruiting." |

Chinese translations should match this tighter, more modern tone.

---

### Tech Stack Upgrade

| Current | Proposed | Why |
|---------|----------|-----|
| Vanilla HTML | **Astro** (static site generator) | Component-based, zero JS by default, perfect for GitHub Pages |
| Inline CSS + Tailwind blob | **Tailwind CSS v4** (PostCSS) | Proper build, purged CSS, ~5KB output |
| particles.js | **Remove** or replace with CSS-only grain/noise | Dated effect, hurts performance |
| 1.6MB PNG logo | **SVG logo** | Crisp at any size, <10KB |
| Exposed API key | **Cloudflare Worker proxy** | Security: API key stays server-side |
| No build step | **Vite + Astro** | Fast builds, asset optimization |
| No lazy loading | **Native lazy loading** + image optimization | Better mobile performance |

Alternative if Astro is too complex: keep it as a single `index.html` but use a proper Tailwind build pipeline (PostCSS CLI) and move the API proxy to a Cloudflare Worker.

---

### Animation Philosophy

**Kill**: pulse on everything, particles.js, typewriter title, breathing effect, spinning loader emoji.

**Keep/Add**:
- Subtle fade-in on scroll (IntersectionObserver, not CSS class on load)
- Hover micro-interactions on cards (slight lift + shadow)
- Stats counter animation (numbers count up on reveal)
- Smooth page transitions between language switch

Rule: **If it loops forever, cut it.** Animations should trigger once and settle.

---

### Responsive Strategy

| Breakpoint | Layout |
|------------|--------|
| < 640px | Single column, hamburger nav, stacked stat cards |
| 640-1024px | 2-column grid for roster and stats |
| > 1024px | Full layout, side-by-side about section |

---

### i18n Improvements

- Keep the `data-key` approach but extract translations to a JSON file
- Add a visible language toggle in the nav (not just auto-detect)
- Consider adding Japanese/Korean if recruiting from those regions
- Use `<html lang="zh">` / `<html lang="en">` properly for SEO

---

### Priority Implementation Order

1. **API key security** — Move to serverless proxy immediately (this is exposed right now)
2. **Logo redesign** — SVG version, compress favicon to <10KB
3. **Layout & navigation** — Add nav bar, restructure sections
4. **Visual refresh** — New color system, typography, remove particles
5. **Copy rewrite** — Tighter, more confident tone in both languages
6. **Stats UI upgrade** — Card grid instead of text dump
7. **Team roster section** — New content
8. **Tech migration** — Astro or at minimum a proper build step
9. **Performance** — Lazy loading, image optimization, CSS purging

---

### Reference Sites (Design Inspiration)
- Team Liquid (teamliquid.com) — Clean, dark, confident
- 100 Thieves (100thieves.com) — Bold brand, restrained layout
- Gen.G (geng.gg) — Modern esports with good i18n
- LOUD (loud.gg) — Energetic but not chaotic
