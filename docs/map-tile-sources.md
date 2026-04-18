# KeyGene Map Tile Sources

Documentation of the map tile loading strategy for the PUBG map viewer (`/maps/`) and flight simulator (`/flight/`) pages.

## Primary Tile Server (remote)

**URL pattern**: `https://r2.pubgmaptile.top/maptile/{mapId}/{z}/{x}/{y}.webp`

**Tile spec**: `minZoom: 0, maxZoom: 5, tms: true, noWrap: true, tileSize: 256`

**Used by**:
- `src/islands/LeafletMap.tsx` (interactive maps page)
- `src/islands/FlightSim.tsx` (flight simulator)

**Covered maps** (listed in `TILE_MAPS` array in both files):
- `Erangel`
- `Miramar`
- `Vikendi`
- `Taego`
- `Deston`
- `Rondo`

## Fallback: Static Images (local)

**Path pattern**: `/assert/maps/{mapId}.webp`

Plus `/assert/maps/{mapId}_thumb.webp` for sidebar thumbnails (only on maps page).

**Used for** maps NOT in `TILE_MAPS` whitelist — rendered as a single `L.imageOverlay` instead of a zoomable tile grid:

- `Sanhok`
- `Karakin`
- `Haven`
- `Paramo`

**Files in `public/assert/maps/`**: `Deston.webp`, `Erangel.webp`, `Haven.webp`, `Karakin.webp`, `Miramar.webp`, `Paramo.webp`, `Rondo.webp`, `Sanhok.webp`, `Taego.webp`, `Vikendi.webp` (each paired with a `_thumb.webp`).

## Conventions

- **Map ID casing**: capitalized (e.g. `Erangel`, not `erangel`). Matches both file paths and the `TILE_MAPS` whitelist.
- **Coordinates**: `L.latLngBounds([[-90, -180], [90, 180]])` — same for tiles and overlays.
- **On map switch**: remove existing `tileLayerRef` or `overlayRef` before adding the new one (pattern used in both islands).

## Known issues / history

- **2026-04-19**: FlightSim was using `https://tiles.pubgmap.top/` (returned nothing) and lowercase IDs (`erangel`). Swapped to `r2.pubgmaptile.top` and capitalized IDs, matching LeafletMap. Also added image overlay fallback for Sanhok/Karakin/Haven/Paramo.

## Checklist when editing map code

When modifying `LeafletMap.tsx` or `FlightSim.tsx`, keep in sync:

1. `TILE_URL` constant (both must point to the same tile server).
2. `TILE_MAPS` array (which maps use remote tiles vs local overlay).
3. Map ID casing in the `MAPS` array (must match files in `public/assert/maps/`).
4. Error handling — if remote tiles start failing, consider temporarily switching all maps to the local imageOverlay path.

If the remote tile server (`r2.pubgmaptile.top`) goes down, edits go in both files:
- Remove all IDs from `TILE_MAPS`, so every map uses `imageOverlay` with the local webp.
