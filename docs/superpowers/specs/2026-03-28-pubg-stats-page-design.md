# PUBG Stats Tool Page — Design Spec

## Overview

A standalone `stats.html` page linked from the KEY GENE main site, providing comprehensive PUBG player statistics tools. Single-page with top horizontal tabs for switching between features.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page structure | Single page, multi-tab | Shared player context across tabs, fewer page loads |
| Layout | Top search bar + horizontal tabs | Maximizes content area, familiar pattern (op.gg style) |
| Overview style | Compact card grid (3x2) | High info density, one-screen view |
| Match history | Table rows | Efficient for scanning many matches |
| Player comparison | Radar chart + data table | Visual impact from Chart.js radar, detail from table |
| Heatmap | 7x24 grid (weekday x hour) | Best fit for limited match data (~50 recent matches) |

## File & URL

- **File**: `stats.html` (root of repo, alongside `index.html`)
- **URL**: `keygene.top/stats.html` or `keygene.top/stats`
- **Entry point**: Nav link from main site header ("Stats" → `stats.html`)

## Visual Identity

Inherits from main site:
- **Background**: `#000000`
- **Accent**: `#EE3F2C`
- **Card BG**: `rgba(255,255,255,0.06)`
- **Card border**: `rgba(255,255,255,0.12)`
- **Text**: `#FFFFFF` (primary), `#9CA3AF` (secondary), `#6B7280` (muted)
- **Success**: `#10B981`
- **Gold**: `#FFD700` (rank badge)
- **Font**: Rubik (400/500/600/700/800)

## Page Structure

```
┌─────────────────────────────────────────────────┐
│ Header: Logo | ← Back to Home | EN/ZH           │
├─────────────────────────────────────────────────┤
│ Search Bar: [Player Name Input] [Search Button]  │
├─────────────────────────────────────────────────┤
│ Tabs: 概览 | 最近比赛 | 武器分析 | 地图胜率 | 对比 | 热力图 │
├─────────────────────────────────────────────────┤
│                                                   │
│              Tab Content Area                     │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Header
- Simplified header: Logo (helmet + KEY GENE), back link to main site, language toggle
- No full nav — this is a tool page, not the main site
- Fixed position, same glassmorphism style as main site

### Search Bar
- Full-width input + search button below header
- Persists across all tabs (searching updates all tabs)
- Shows current player name after search
- Platform selector: Steam (default) — can extend later

### Tab Bar
- Horizontal scrollable on mobile
- Active tab: white text + red bottom border
- Inactive: gray text
- Tabs: 概览 / 最近比赛 / 武器分析 / 地图胜率 / 对比 / 热力图

## Tab Specifications

### 1. Overview Tab (概览)

**Data source**: `GET /shards/steam/players/{id}/seasons/lifetime`

**Layout**:
```
┌──────────────────────────────────────────┐
│ [Avatar] SymarsYoung        [Rank Badge] │
│          Steam · Squad       MASTER       │
├──────────────────────────────────────────┤
│  5.33    │  22.1%   │  1,761             │
│  K/D     │  Win Rate│  Matches           │
│──────────┼──────────┼────────────────────│
│  7,899   │  62.1%   │   389              │
│  Kills   │  Top 10  │  Wins              │
├──────────────────────────────────────────┤
│ ── Best Records                          │
│ ┌──────────┬──────────┬──────────┐       │
│ │ 482m     │ 18       │ 3,214    │       │
│ │ Longest  │ Most Kill│ Most Dmg │       │
│ └──────────┴──────────┴──────────┘       │
├──────────────────────────────────────────┤
│        [📸 Generate Stats Image]         │
└──────────────────────────────────────────┘
```

**Components**:
- Player info banner: avatar (first letter, gradient bg), name, platform, rank badge
- 6 stat cards in 3x2 grid: K/D (red), Win Rate (green), Matches, Kills, Top 10 Rate, Wins
- Best records row: 3 cards with left color border (red/gold/green)
- Export button: generates PNG via html2canvas

**Rank badge mapping** (from `rankPointTitle` or estimated from `rankPoint`):
- Uses PUBG rank icons or styled text badges

**Stats fields used**:
- `roundsPlayed`, `wins`, `kills`, `losses`, `top10s`
- `longestKill`, `roundMostKills`, `bestRankPoint`
- Derived: K/D = kills/losses, winRate = wins/roundsPlayed, top10Rate = top10s/roundsPlayed

### 2. Recent Matches Tab (最近比赛)

**Data source**:
- `GET /shards/steam/players/{id}` → `relationships.matches.data[]` (up to 50 match IDs)
- `GET /shards/steam/matches/{matchId}` for each match

**Layout**: Table with columns:

| Time | Map | Mode | Rank | Kills | Damage | K/D |
|------|-----|------|------|-------|--------|-----|

**Details**:
- Fetch most recent 20 matches (parallel requests, max 5 concurrent)
- Map names: Erangel, Miramar, Sanhok, Vikendi, Taego, Deston, Rondo, Karakin
- Rank column: color-coded (#1 = gold, top 10 = green, others = white)
- Time: relative ("2h ago", "yesterday")
- Sort by time descending (newest first)
- Row click could expand to show more details (stretch goal)

**Rate limiting**: PUBG API allows 10 req/min. Batch match fetches with delays.

### 3. Weapon Analysis Tab (武器分析)

**Data source**: Match telemetry (from match detail → `assets[].attributes.URL`)

**Layout**:
- Horizontal bar chart: top 10 weapons by kills
- Second chart: top 10 weapons by damage dealt
- Table below with all weapons: Name | Kills | Headshots | Damage | Usage Count

**Technical notes**:
- Telemetry files are large JSON. Parse `LogPlayerKill` and `LogPlayerTakeDamage` events.
- Filter by the searched player's `accountId`
- Aggregate across available matches (recent 10-20)
- Cache telemetry data in memory to avoid re-fetching
- Chart.js horizontal bar chart

**Weapon name mapping**: PUBG uses internal names (e.g., `Item_Weapon_M416_C`). Need a lookup table mapping to display names.

### 4. Map Win Rate Tab (地图胜率)

**Data source**: Same match data as Recent Matches tab (shared cache)

**Layout**:
- Doughnut/pie chart showing match distribution by map
- Below: card per map with stats

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Erangel    │ │  Miramar    │ │  Sanhok     │
│  Win: 25%   │ │  Win: 18%   │ │  Win: 30%   │
│  Games: 40  │ │  Games: 25  │ │  Games: 15  │
│  K/D: 5.1   │ │  K/D: 4.8   │ │  K/D: 6.2   │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Map identification**: From match `attributes.mapName` field.

### 5. Player Comparison Tab (对比)

**Data source**: `lifetime` stats for two players

**Layout**:
```
┌─────────────────────────────────────────┐
│ [Player 1 Input]  VS  [Player 2 Input]  │
├─────────────────────────────────────────┤
│           Radar Chart (6-axis)           │
│     K/D / WinRate / Matches / Kills     │
│         / Top10Rate / LongestKill        │
├─────────────────────────────────────────┤
│ Player 1  │  Stat     │  Player 2       │
│   5.33    │  K/D      │    3.21         │ ← higher value highlighted red
│   22.1%   │  Win Rate │    15.3%        │
│   ...     │  ...      │    ...          │
└─────────────────────────────────────────┘
```

**Details**:
- Pre-fill Player 1 with currently searched player
- Radar chart: Chart.js radar type, two datasets overlapping
- Normalize values to 0-100 scale for radar (e.g., K/D max ~10, WinRate max 100%)
- Data table: winning stat highlighted in red, losing in gray

### 6. Activity Heatmap Tab (热力图)

**Data source**: Match timestamps from recent matches

**Layout**: GitHub-style contribution grid
```
       00  01  02  03  ... 23
Mon    ░░  ░░  ██  ██  ... ░░
Tue    ░░  ░░  ░░  ██  ... ░░
Wed    ░░  ░░  ██  ██  ... ██
...
Sun    ░░  ░░  ░░  ░░  ... ██
```

**Details**:
- 7 rows (Mon-Sun) × 24 columns (hours)
- Color scale: transparent → light red → dark red (#EE3F2C) based on match count
- Cell tooltip: "Tuesday 20:00 - 5 matches"
- Pure CSS/HTML grid, no chart library needed
- Data from match `createdAt` timestamps, grouped by local weekday + hour

## Dependencies

| Library | Version | Size | Purpose |
|---------|---------|------|---------|
| Chart.js | 4.x | ~60KB gzipped | Radar chart, bar charts, doughnut chart |
| html2canvas | 1.4.x | ~40KB gzipped | Stats image export |

Both loaded via CDN (cdnjs/jsdelivr).

## Data Flow

```
User enters player name
  → GET /players?filter[playerNames]=X → player ID
  → GET /players/{id}/seasons/lifetime → stats (shared across tabs)
  → GET /players/{id} → match IDs list

Tab-specific (lazy loaded on tab switch):
  → Recent Matches: GET /matches/{id} × N
  → Weapons: GET telemetry URL from match assets
  → Map: derived from match data
  → Compare: additional player lookup
  → Heatmap: derived from match timestamps
```

**Caching strategy**:
- Player stats cached in JS variable, cleared on new search
- Match data cached per match ID (won't change)
- Telemetry cached per match ID
- Tab content rendered lazily on first visit, cached DOM after

## Rate Limiting

PUBG API: 10 requests per minute.

- Overview + player lookup: 2 requests (immediate)
- Recent matches: up to 20 requests (staggered, 5 concurrent max with delays)
- Telemetry: 1 large request per match
- Compare: 2 additional requests

Strategy: Queue-based fetcher with rate limiting. Show loading states per tab.

## Mobile Responsive

| Breakpoint | Adaptations |
|------------|-------------|
| < 768px | Tab bar horizontal scroll, stat grid 2×3, table horizontal scroll, radar chart smaller, heatmap cells smaller |
| 768-1024px | Minor adjustments to padding |
| > 1024px | Full layout |

## i18n

Extends main site pattern (`data-key` attributes + JS translation object).

New keys needed for: all stat labels, tab names, rank names, weapon names, map names, time relative strings, error messages, loading states.

## Image Export (战绩生成图片)

- Button on Overview tab
- Uses html2canvas to capture the overview content area
- Adds KEY GENE branding watermark (logo + URL) at bottom
- Downloads as `{playerName}-stats.png`
- Resolution: 2x for retina quality

## Error States

- Player not found: "未找到该玩家" message in content area
- API rate limited: "请求过于频繁，请稍后再试" with countdown
- Network error: "网络错误，请检查连接"
- No match data: "该玩家暂无比赛数据"
- Telemetry unavailable: "武器数据暂不可用" (telemetry expires after 14 days)

## Security

- PUBG API key remains client-side (same as current site — API key is rate-limited and read-only)
- No user input is used in HTML without escaping
- External CDN scripts loaded with integrity hashes
