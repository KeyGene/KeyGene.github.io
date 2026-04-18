import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

/* ── Types ── */
interface DropSpot {
  name: Record<string, string>;
  lat: number;
  lng: number;
  loot: string;
  contest: number;
}

interface MapDef {
  id: string;
  en: string;
  zh: string;
  ko: string;
  size: number;
}

interface Labels {
  mapSelect: string;
  flightInfo: string;
  recommended: string;
  clear: string;
  share: string;
  clickHint: string;
  clickEnd: string;
  distance: string;
  flightTime: string;
  mapLabel: string;
  loot: string;
  lang: string;
}

interface DropResult {
  spot: DropSpot;
  dist: number;
  zone: 'near' | 'mid' | 'far';
  x: number;
  y: number;
}

/* ── Constants ── */
const TILE_URL = 'https://tiles.pubgmap.top/';
const MAPS: MapDef[] = [
  { id: 'erangel', en: 'Erangel', zh: '艾伦格', ko: '에란겔', size: 8 },
  { id: 'miramar', en: 'Miramar', zh: '米拉玛', ko: '미라마', size: 8 },
  { id: 'taego', en: 'Taego', zh: '泰戈', ko: '태이고', size: 8 },
  { id: 'deston', en: 'Deston', zh: '德斯顿', ko: '데스턴', size: 8 },
];

const PLANE_SPEED = 130; // km/h
const DROP_NEAR = 750;
const DROP_MID = 1500;
const DROP_FAR = 2500;

const ZONE_COLORS = { near: '#10B981', mid: '#F59E0B', far: '#EE3F2C' };

/* ── Helpers ── */
function mapName(m: MapDef, lang: string) {
  return (m as any)[lang] || m.en;
}

function pointToLineDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/* ── Component ── */
export default function FlightSim({ labels }: { labels: Labels }) {
  const lang = labels.lang;

  const [mapIdx, setMapIdx] = useState(0);
  const [flightStart, setFlightStart] = useState<{ x: number; y: number } | null>(null);
  const [flightEnd, setFlightEnd] = useState<{ x: number; y: number } | null>(null);
  const [dropSpots, setDropSpots] = useState<Record<string, DropSpot[]>>({});
  const [drops, setDrops] = useState<DropResult[]>([]);
  const [toast, setToast] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const flightLineRef = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const dropMarkersRef = useRef<any[]>([]);

  // Load drop spots
  useEffect(() => {
    fetch('/assert/data/dropspots.json')
      .then(r => r.json())
      .then(d => setDropSpots(d))
      .catch(() => {});
  }, []);

  // Init Leaflet
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const pubgCRS = L.extend({}, L.CRS.EPSG4326, {
      transformation: new L.Transformation(1 / 360, 0.5, 1 / 180, 0.5),
    });

    const map = L.map(mapRef.current, {
      crs: pubgCRS, minZoom: 0, maxZoom: 5,
      center: [0, 0], zoom: 2,
      zoomControl: false, attributionControl: false,
    });
    map.setMaxBounds(L.latLngBounds([[-90, -180], [90, 180]]));
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    leafletMapRef.current = map;

    loadTiles(0);
    map.on('click', handleMapClick);

    setTimeout(() => map.invalidateSize(), 200);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
    };
  }, []);

  // Reload tiles when map changes
  useEffect(() => {
    if (leafletMapRef.current) loadTiles(mapIdx);
  }, [mapIdx]);

  function loadTiles(idx: number) {
    const L = (window as any).L;
    const map = leafletMapRef.current;
    if (!L || !map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const bounds = L.latLngBounds([[-90, -180], [90, 180]]);
    tileLayerRef.current = L.tileLayer(
      TILE_URL + MAPS[idx].id + '/{z}/{x}/{y}.webp',
      { minZoom: 0, maxZoom: 5, tms: true, noWrap: true, tileSize: 256, bounds },
    ).addTo(map);
    map.setView([0, 0], 2);
  }

  const handleMapClick = useCallback((e: any) => {
    setFlightStart(prev => {
      if (!prev) return { x: e.latlng.lat, y: e.latlng.lng };
      setFlightEnd(prevEnd => {
        if (!prevEnd) return { x: e.latlng.lat, y: e.latlng.lng };
        return prevEnd;
      });
      return prev;
    });
  }, []);

  // Draw flight line + markers whenever start/end change
  useEffect(() => {
    const L = (window as any).L;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    // Clear previous
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (flightLineRef.current) { map.removeLayer(flightLineRef.current); flightLineRef.current = null; }
    circlesRef.current.forEach(c => map.removeLayer(c));
    circlesRef.current = [];
    dropMarkersRef.current.forEach(m => map.removeLayer(m));
    dropMarkersRef.current = [];

    if (flightStart) {
      const sm = L.marker([flightStart.x, flightStart.y], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:20px;height:20px;background:var(--color-red);border-radius:50%;border:2px solid #fff;"></div>',
          iconSize: [20, 20], iconAnchor: [10, 10],
        }),
      }).addTo(map);
      markersRef.current.push(sm);
    }

    if (flightStart && flightEnd) {
      const em = L.marker([flightEnd.x, flightEnd.y], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:20px;height:20px;background:#3B82F6;border-radius:50%;border:2px solid #fff;"></div>',
          iconSize: [20, 20], iconAnchor: [10, 10],
        }),
      }).addTo(map);
      markersRef.current.push(em);

      flightLineRef.current = L.polyline(
        [[flightStart.x, flightStart.y], [flightEnd.x, flightEnd.y]],
        { color: '#EE3F2C', weight: 3, dashArray: '12, 6', opacity: 0.8 },
      ).addTo(map);

      // Range circles
      const m = MAPS[mapIdx];
      const degPerMeter = 180 / (m.size * 1000);
      for (let i = 0; i <= 8; i++) {
        const pct = i / 8;
        const lat = flightStart.x + (flightEnd.x - flightStart.x) * pct;
        const lng = flightStart.y + (flightEnd.y - flightStart.y) * pct;
        [
          { r: DROP_NEAR, color: '#10B981', opacity: 0.08 },
          { r: DROP_MID, color: '#F59E0B', opacity: 0.05 },
          { r: DROP_FAR, color: '#EE3F2C', opacity: 0.03 },
        ].forEach(ring => {
          const c = L.circle([lat, lng], {
            radius: ring.r * degPerMeter * 111000,
            color: ring.color, weight: 0, fillColor: ring.color, fillOpacity: ring.opacity,
          }).addTo(map);
          circlesRef.current.push(c);
        });
      }

      // Calculate drops
      const spots = dropSpots[m.id] || [];
      const degPerKm = 180 / m.size;
      const results: DropResult[] = spots
        .map(spot => {
          const dist = pointToLineDist(spot.lat, spot.lng, flightStart.x, flightStart.y, flightEnd.x, flightEnd.y);
          const distMeters = (dist / degPerKm) * 1000;
          const zone: 'near' | 'mid' | 'far' | 'out' =
            distMeters <= DROP_NEAR ? 'near' : distMeters <= DROP_MID ? 'mid' : distMeters <= DROP_FAR ? 'far' : 'out';
          return { spot, dist: distMeters, zone, x: spot.lat, y: spot.lng };
        })
        .filter((r): r is DropResult => r.zone !== 'out')
        .sort((a, b) => {
          const zo: Record<string, number> = { near: 0, mid: 1, far: 2 };
          const lo: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 };
          return (zo[a.zone] - zo[b.zone]) || (lo[a.spot.loot] - lo[b.spot.loot]);
        })
        .slice(0, 6);

      setDrops(results);

      // Drop markers on map
      results.forEach(r => {
        const name = r.spot.name[lang] || r.spot.name.en;
        const col = ZONE_COLORS[r.zone];
        const dm = L.marker([r.x, r.y], {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:#222;border:1px solid ${col};border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;color:#fff;white-space:nowrap;font-family:var(--font-sans);">${name} <span style="color:${col};">${r.spot.loot}</span></div>`,
            iconSize: null as any, iconAnchor: [40, 12],
          }),
        }).addTo(map);
        dropMarkersRef.current.push(dm);
      });
    } else {
      setDrops([]);
    }
  }, [flightStart, flightEnd, mapIdx, dropSpots, lang]);

  function clearFlight() {
    setFlightStart(null);
    setFlightEnd(null);
    setDrops([]);
  }

  function selectMap(idx: number) {
    clearFlight();
    setMapIdx(idx);
  }

  function panTo(x: number, y: number) {
    leafletMapRef.current?.panTo([x, y]);
  }

  // Flight info calculations
  const m = MAPS[mapIdx];
  const degPerKm = 180 / m.size;
  let distKm = 0;
  let flightTimeSec = 0;
  if (flightStart && flightEnd) {
    const dLat = flightEnd.x - flightStart.x;
    const dLng = flightEnd.y - flightStart.y;
    distKm = Math.sqrt(dLat * dLat + dLng * dLng) / degPerKm;
    flightTimeSec = (distKm / PLANE_SPEED) * 3600;
  }

  return (
    <div class="flight-page">
      {/* Sidebar */}
      <div class="flight-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">{labels.mapSelect}</div>
          <div>
            {MAPS.map((mp, i) => (
              <div
                key={mp.id}
                class={`map-item${i === mapIdx ? ' active' : ''}`}
                onClick={() => selectMap(i)}
              >
                <span class="dot" />
                <span class="name">{mapName(mp, lang)}</span>
              </div>
            ))}
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-label">{labels.flightInfo}</div>
          <div class="flight-info">
            {!flightStart && <div class="info-hint">{labels.clickHint}</div>}
            {flightStart && !flightEnd && <div class="info-hint">{labels.clickEnd}</div>}
            {flightStart && flightEnd && (
              <>
                <div class="info-row">
                  <span class="label">{labels.distance}</span>
                  <span class="value">{distKm.toFixed(1)} km</span>
                </div>
                <div class="info-row">
                  <span class="label">{labels.flightTime}</span>
                  <span class="value">{Math.round(flightTimeSec)}s</span>
                </div>
                <div class="info-row">
                  <span class="label">{labels.mapLabel}</span>
                  <span class="value">{mapName(m, lang)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {drops.length > 0 && (
          <div class="sidebar-section">
            <div class="sidebar-label">{labels.recommended}</div>
            <div>
              {drops.map((r, i) => {
                const name = r.spot.name[lang] || r.spot.name.en;
                const contest = '\u2694\uFE0F'.repeat(Math.min(r.spot.contest, 5));
                return (
                  <div
                    key={i}
                    class="drop-item"
                    onClick={() => panTo(r.x, r.y)}
                  >
                    <div class="drop-rank">{i + 1}</div>
                    <div class="drop-info">
                      <div class="drop-name">{name}</div>
                      <div class="drop-meta">{r.spot.loot} {labels.loot} · {contest}</div>
                    </div>
                    <div class={`drop-dist ${r.zone}`}>
                      {(r.dist / 1000).toFixed(1)}km
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div class="sidebar-actions">
          <button class="sidebar-btn sidebar-btn-outline" onClick={clearFlight}>
            {labels.clear}
          </button>
          <button class="sidebar-btn sidebar-btn-red" onClick={async () => {
            const el = document.querySelector('.flight-page');
            if (!el) return;
            const html2canvas = (window as any).html2canvas;
            if (!html2canvas) {
              navigator.clipboard?.writeText(window.location.href);
              setToast('Link copied');
              setTimeout(() => setToast(''), 2000);
              return;
            }
            try {
              const canvas = await html2canvas(el, { backgroundColor: '#0a0a0a', scale: 2 });
              const a = document.createElement('a');
              a.href = canvas.toDataURL('image/png');
              a.download = 'keygene-flight.png';
              a.click();
            } catch { setToast('Export failed'); setTimeout(() => setToast(''), 2000); }
          }}>
            {labels.share}
          </button>
        </div>
      </div>

      {/* Map */}
      <div class="flight-map">
        <div ref={mapRef} id="leafletMap" />
      </div>
      {toast && <div style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;background:#222;color:#fff;border-radius:8px;font-size:14px;font-weight:600;z-index:1000">
        {toast}
      </div>}
    </div>
  );
}
