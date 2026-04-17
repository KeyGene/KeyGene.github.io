import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

/* ── Types ── */
interface MapDef {
  id: string;
  en: string;
  zh: string;
  ko: string;
  descEn: string;
  descZh: string;
  descKo: string;
  size: string;
  players: number;
  km: number;
}

interface Labels {
  toolGrid: string;
  toolMeasure: string;
  toolThrow: string;
  toolEdit: string;
  throwFrag: string;
  throwSmoke: string;
  throwFlash: string;
  throwMolotov: string;
  throwInRange: string;
  throwOutRange: string;
  markerTitle: string;
  markerNoData: string;
  editBanner: string;
  editExport: string;
  editReset: string;
  editChanges: string;
  editConfirmReset: string;
  players: string;
  lang: string;
}

/* ── Constants ── */
const MAPS: MapDef[] = [
  { id: 'Erangel', size: '8\u00d78 km', players: 100, km: 8, en: 'Erangel', zh: '艾伦格', ko: '에란겔', descEn: 'Classic island map', descZh: '经典海岛地图', descKo: '클래식 섬 맵' },
  { id: 'Miramar', size: '8\u00d78 km', players: 100, km: 8, en: 'Miramar', zh: '米拉玛', ko: '미라마', descEn: 'Desert terrain', descZh: '沙漠地形', descKo: '사막 지형' },
  { id: 'Sanhok', size: '4\u00d74 km', players: 100, km: 4, en: 'Sanhok', zh: '萨诺', ko: '사녹', descEn: 'Tropical jungle', descZh: '热带丛林', descKo: '열대 정글' },
  { id: 'Vikendi', size: '6\u00d76 km', players: 100, km: 6, en: 'Vikendi', zh: '维寒迪', ko: '비켄디', descEn: 'Snow map', descZh: '雪地地图', descKo: '설원 맵' },
  { id: 'Taego', size: '8\u00d78 km', players: 100, km: 8, en: 'Taego', zh: '泰戈', ko: '태이고', descEn: 'Korean countryside', descZh: '韩国乡村', descKo: '한국 시골' },
  { id: 'Deston', size: '8\u00d78 km', players: 100, km: 8, en: 'Deston', zh: '帝斯顿', ko: '데스턴', descEn: 'Urban metropolis', descZh: '都市大都会', descKo: '도시 대도시' },
  { id: 'Karakin', size: '2\u00d72 km', players: 64, km: 2, en: 'Karakin', zh: '卡拉金', ko: '카라킨', descEn: 'Small arid map', descZh: '小型干旱地图', descKo: '소규모 건조 맵' },
  { id: 'Haven', size: '1\u00d71 km', players: 32, km: 1, en: 'Haven', zh: '海文', ko: '헤이븐', descEn: 'Urban CQB', descZh: '城市近战', descKo: '시가전 맵' },
  { id: 'Paramo', size: '3\u00d73 km', players: 64, km: 3, en: 'Paramo', zh: '帕拉莫', ko: '파라모', descEn: 'Volcanic terrain', descZh: '火山地形', descKo: '화산 지형' },
  { id: 'Rondo', size: '8\u00d78 km', players: 100, km: 8, en: 'Rondo', zh: '荣都', ko: '론도', descEn: 'Neon city', descZh: '霓虹都市', descKo: '네온 시티' },
];

const TILE_URL = 'https://r2.pubgmaptile.top/maptile/';
const TILE_MAPS = ['Erangel', 'Miramar', 'Vikendi', 'Taego', 'Deston', 'Rondo'];

const MARKER_TYPES: Record<string, { en: string; ko: string; icon: string }> = {
  '密室':     { en: 'Secret Room',      ko: '비밀의 방',   icon: '/assert/maps/icons/secret-room.svg' },
  '载具':     { en: 'Vehicle',           ko: '차량',        icon: '/assert/maps/icons/vehicle.svg' },
  '滑翔机':   { en: 'Glider',            ko: '글라이더',    icon: '/assert/maps/icons/glider.svg' },
  '金条':     { en: 'Gold Bar',          ko: '금괴',        icon: '/assert/maps/icons/gold.svg' },
  '撬棍房':   { en: 'Crowbar Room',      ko: '빠루 방',     icon: '/assert/maps/icons/crowbar.svg' },
  '实验营地': { en: 'Experimental Camp', ko: '실험 캠프',   icon: '/assert/maps/icons/camp.svg' },
  '安全门':   { en: 'Safe Door',         ko: '안전문',      icon: '/assert/maps/icons/safe-door.svg' },
  '熊洞':     { en: 'Bear Cave',         ko: '곰 동굴',     icon: '/assert/maps/icons/bear-cave.svg' },
};

const THROWABLES: Record<string, { range: number; radius: number; color: string; emoji: string }> = {
  frag:    { range: 55, radius: 15, color: '#EE3F2C', emoji: '\u{1F4A3}' },
  smoke:   { range: 55, radius: 10, color: '#94A3B8', emoji: '\u{1F4A8}' },
  flash:   { range: 50, radius: 10, color: '#FBBF24', emoji: '\u26A1' },
  molotov: { range: 35, radius: 4,  color: '#F97316', emoji: '\u{1F525}' },
};

/* ── Helpers ── */
function mapName(m: MapDef, lang: string): string {
  return (m as any)[lang] || m.en;
}
function mapDesc(m: MapDef, lang: string): string {
  const key = 'desc' + lang.charAt(0).toUpperCase() + lang.slice(1);
  return (m as any)[key] || m.descEn;
}

/* ── Component ── */
export default function LeafletMap({ labels }: { labels: Labels }) {
  const lang = labels.lang;
  const mapElRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const gridLayerRef = useRef<any>(null);
  const markerLayersRef = useRef<Record<string, any>>({});
  const markerHiddenRef = useRef<Record<string, boolean>>({});
  const allMarkerDataRef = useRef<any>(null);
  const editChangesRef = useRef<Record<string, Record<number, { lat: number; lng: number }>>>({});

  const measurePointsRef = useRef<any[]>([]);
  const measureLineRef = useRef<any>(null);
  const measureTooltipRef = useRef<any>(null);
  const measureMarkersRef = useRef<any[]>([]);

  const throwLayersRef = useRef<any[]>([]);
  const throwOriginRef = useRef<any>(null);

  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [gridVisible, setGridVisible] = useState(true);
  const [measureMode, setMeasureMode] = useState(false);
  const [throwMode, setThrowMode] = useState(false);
  const [throwType, setThrowType] = useState('frag');
  const [editMode, setEditMode] = useState(false);
  const [editCount, setEditCount] = useState(0);
  const [coord, setCoord] = useState('--');
  const [markerFilters, setMarkerFilters] = useState<{ type: string; label: string; icon: string; count: number }[]>([]);

  // Refs for latest state in callbacks
  const currentMapIndexRef = useRef(currentMapIndex);
  currentMapIndexRef.current = currentMapIndex;
  const measureModeRef = useRef(measureMode);
  measureModeRef.current = measureMode;
  const throwModeRef = useRef(throwMode);
  throwModeRef.current = throwMode;
  const throwTypeRef = useRef(throwType);
  throwTypeRef.current = throwType;
  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;

  const L = useRef<any>(null);

  /* ── Leaflet helper functions ── */
  function metersToLng(m: number): number {
    const km = MAPS[currentMapIndexRef.current].km;
    return m / (km * 1000) * 360;
  }
  function metersToLat(m: number): number {
    const km = MAPS[currentMapIndexRef.current].km;
    return m / (km * 1000) * 180;
  }
  function distMeters(p1: any, p2: any): number {
    const km = MAPS[currentMapIndexRef.current].km;
    const dx = (p2.lng - p1.lng) / 360 * km * 1000;
    const dy = (p2.lat - p1.lat) / 180 * km * 1000;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ── Clear helpers ── */
  function clearMeasure() {
    measurePointsRef.current = [];
    const map = leafletRef.current;
    if (!map) return;
    if (measureLineRef.current) { map.removeLayer(measureLineRef.current); measureLineRef.current = null; }
    if (measureTooltipRef.current) { map.removeLayer(measureTooltipRef.current); measureTooltipRef.current = null; }
    measureMarkersRef.current.forEach((m: any) => map.removeLayer(m));
    measureMarkersRef.current = [];
  }

  function clearThrow() {
    throwOriginRef.current = null;
    const map = leafletRef.current;
    if (!map) return;
    throwLayersRef.current.forEach((l: any) => map.removeLayer(l));
    throwLayersRef.current = [];
  }

  /* ── Grid ── */
  function createGrid() {
    const Lf = L.current;
    const map = leafletRef.current;
    if (!Lf || !map) return;
    if (gridLayerRef.current) map.removeLayer(gridLayerRef.current);
    const group = Lf.layerGroup();
    const cols = 10;
    const lngStep = 360 / cols;
    const latStep = 180 / cols;
    const letters = 'ABCDEFGHIJ';
    for (let i = 1; i < cols; i++) {
      const lng = -180 + i * lngStep;
      const lat = -90 + i * latStep;
      Lf.polyline([[-90, lng], [90, lng]], { color: 'rgba(255,255,255,0.15)', weight: 1, interactive: false }).addTo(group);
      Lf.polyline([[lat, -180], [lat, 180]], { color: 'rgba(255,255,255,0.15)', weight: 1, interactive: false }).addTo(group);
    }
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const label = letters[c] + (r + 1);
        const lng = -180 + (c + 0.5) * lngStep;
        const lat = 90 - (r + 0.5) * latStep;
        Lf.marker([lat, lng], {
          interactive: false,
          icon: Lf.divIcon({ className: 'grid-label', html: label, iconSize: [30, 18], iconAnchor: [15, 9] }),
        }).addTo(group);
      }
    }
    group.addTo(map);
    gridLayerRef.current = group;
  }

  /* ── Load tiles ── */
  function loadMapTiles(index: number) {
    const Lf = L.current;
    const map = leafletRef.current;
    if (!Lf || !map) return;
    const m = MAPS[index];
    const tileBounds = Lf.latLngBounds([[-90, -180], [90, 180]]);
    if (tileLayerRef.current) { map.removeLayer(tileLayerRef.current); tileLayerRef.current = null; }
    if (overlayRef.current) { map.removeLayer(overlayRef.current); overlayRef.current = null; }

    if (TILE_MAPS.includes(m.id)) {
      tileLayerRef.current = Lf.tileLayer(TILE_URL + m.id + '/{z}/{x}/{y}.webp', {
        minZoom: 0, maxZoom: 5, tms: true, noWrap: true, tileSize: 256, bounds: tileBounds,
      }).addTo(map);
    } else {
      overlayRef.current = Lf.imageOverlay('/assert/maps/' + m.id + '.webp', tileBounds).addTo(map);
    }
    map.setView([0, 0], 2);
  }

  /* ── Markers ── */
  function showMarkersForCurrentMap() {
    const Lf = L.current;
    const map = leafletRef.current;
    if (!Lf || !map) return;
    Object.values(markerLayersRef.current).forEach((lg: any) => map.removeLayer(lg));
    markerLayersRef.current = {};

    const mapId = MAPS[currentMapIndexRef.current].id;
    const markers = (allMarkerDataRef.current || {})[mapId] || [];

    if (markers.length === 0) {
      setMarkerFilters([]);
      return;
    }

    const grouped: Record<string, any[]> = {};
    markers.forEach((m: any) => {
      if (!grouped[m.type]) grouped[m.type] = [];
      grouped[m.type].push(m);
    });

    const filters: typeof markerFilters = [];
    for (const [type, items] of Object.entries(grouped)) {
      const mt = MARKER_TYPES[type] || { en: type, ko: type, icon: '' };
      const lg = Lf.layerGroup();

      items.forEach((item: any) => {
        const icon = Lf.icon({
          iconUrl: mt.icon, iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -14],
        });
        const idx = markers.indexOf(item);
        const marker = Lf.marker([item.lat, item.lng], { icon, draggable: editModeRef.current });
        const mLabel = lang === 'zh' ? type : ((mt as any)[lang] || mt.en);
        function buildPopup(lat: number, lng: number) {
          return '<b>' + mLabel + '</b>' + (item.title ? '<br>' + item.title : '')
            + '<br><span style="font-size:10px;color:#999;font-family:monospace">#' + idx
            + ' | lat: ' + lat.toFixed(4) + ', lng: ' + lng.toFixed(4) + '</span>';
        }
        marker.bindPopup(buildPopup(item.lat, item.lng), { className: 'dark-popup', closeButton: false });
        marker.on('dragend', function () {
          const pos = marker.getLatLng();
          const mid = MAPS[currentMapIndexRef.current].id;
          if (!editChangesRef.current[mid]) editChangesRef.current[mid] = {};
          editChangesRef.current[mid][idx] = { lat: pos.lat, lng: pos.lng };
          item.lat = pos.lat;
          item.lng = pos.lng;
          marker.setPopupContent(buildPopup(pos.lat, pos.lng));
          let total = 0;
          for (const k in editChangesRef.current) total += Object.keys(editChangesRef.current[k]).length;
          setEditCount(total);
        });
        marker.addTo(lg);
      });

      if (!markerHiddenRef.current[type]) lg.addTo(map);
      markerLayersRef.current[type] = lg;
      filters.push({
        type,
        label: lang === 'zh' ? type : ((mt as any)[lang] || mt.en),
        icon: mt.icon,
        count: items.length,
      });
    }
    setMarkerFilters(filters);
  }

  async function loadMarkers() {
    if (!allMarkerDataRef.current) {
      try {
        const res = await fetch('/assert/maps/markers.json');
        allMarkerDataRef.current = await res.json();
      } catch { allMarkerDataRef.current = {}; }
    }
    showMarkersForCurrentMap();
  }

  /* ── Map click handler ── */
  function onMapClick(e: any) {
    const Lf = L.current;
    const map = leafletRef.current;
    if (!Lf || !map) return;

    if (throwModeRef.current) {
      onThrowClick(e);
      return;
    }

    if (measureModeRef.current) {
      measurePointsRef.current.push(e.latlng);
      const dot = Lf.circleMarker(e.latlng, { radius: 4, color: '#EE3F2C', fillColor: '#EE3F2C', fillOpacity: 1, weight: 2 });
      dot.addTo(map);
      measureMarkersRef.current.push(dot);

      if (measurePointsRef.current.length === 2) {
        const p1 = measurePointsRef.current[0], p2 = measurePointsRef.current[1];
        measureLineRef.current = Lf.polyline([p1, p2], { color: '#EE3F2C', weight: 2, dashArray: '6,4', className: 'measure-line' }).addTo(map);
        const km = MAPS[currentMapIndexRef.current].km;
        const dx = (p2.lng - p1.lng) / 360 * km;
        const dy = (p2.lat - p1.lat) / 180 * km;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mid = Lf.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);
        const lbl = dist >= 1 ? dist.toFixed(2) + ' km' : (dist * 1000).toFixed(0) + ' m';
        measureTooltipRef.current = Lf.tooltip({ permanent: true, direction: 'top', className: 'measure-tooltip', offset: [0, -8] })
          .setLatLng(mid).setContent(lbl).addTo(map);
        measurePointsRef.current = [];
      }
      return;
    }

    // Default: show coord popup
    Lf.popup({ closeButton: true, className: 'dark-popup' })
      .setLatLng(e.latlng)
      .setContent('<span style="font-family:monospace;font-size:12px">lat: ' + e.latlng.lat.toFixed(4) + '<br>lng: ' + e.latlng.lng.toFixed(4) + '</span>')
      .openOn(map);
  }

  /* ── Throw click ── */
  function onThrowClick(e: any) {
    const Lf = L.current;
    const map = leafletRef.current;
    if (!Lf || !map) return;
    const th = THROWABLES[throwTypeRef.current];

    if (!throwOriginRef.current) {
      throwOriginRef.current = e.latlng;
      const rangeLng = metersToLng(th.range);
      const rangeLat = metersToLat(th.range);
      const pts: any[] = [];
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push(Lf.latLng(
          throwOriginRef.current.lat + Math.sin(a) * rangeLat,
          throwOriginRef.current.lng + Math.cos(a) * rangeLng,
        ));
      }
      const rangeShape = Lf.polygon(pts, {
        color: th.color, fillColor: th.color, fillOpacity: 0.08, weight: 1.5, dashArray: '6,4', interactive: false,
      }).addTo(map);
      throwLayersRef.current.push(rangeShape);
      const originDot = Lf.circleMarker(throwOriginRef.current, {
        radius: 5, color: th.color, fillColor: th.color, fillOpacity: 1, weight: 2,
      }).addTo(map);
      throwLayersRef.current.push(originDot);
    } else {
      const target = e.latlng;
      const dist = distMeters(throwOriginRef.current, target);
      const inRange = dist <= th.range;

      const line = Lf.polyline([throwOriginRef.current, target], {
        color: inRange ? '#10B981' : '#EF4444', weight: 2, dashArray: '4,4',
      }).addTo(map);
      throwLayersRef.current.push(line);

      const targetDot = Lf.circleMarker(target, {
        radius: 4, color: inRange ? '#10B981' : '#EF4444',
        fillColor: inRange ? '#10B981' : '#EF4444', fillOpacity: 1, weight: 2,
      }).addTo(map);
      throwLayersRef.current.push(targetDot);

      if (inRange) {
        const radLng = metersToLng(th.radius);
        const radLat = metersToLat(th.radius);
        const radPts: any[] = [];
        for (let j = 0; j < 48; j++) {
          const b = (j / 48) * Math.PI * 2;
          radPts.push(Lf.latLng(target.lat + Math.sin(b) * radLat, target.lng + Math.cos(b) * radLng));
        }
        const radShape = Lf.polygon(radPts, {
          color: th.color, fillColor: th.color, fillOpacity: 0.2, weight: 1.5, interactive: false,
        }).addTo(map);
        throwLayersRef.current.push(radShape);
      }

      const mid = Lf.latLng((throwOriginRef.current.lat + target.lat) / 2, (throwOriginRef.current.lng + target.lng) / 2);
      const ttKey = 'throw' + throwTypeRef.current.charAt(0).toUpperCase() + throwTypeRef.current.slice(1) as keyof Labels;
      const status = inRange ? ('\u2705 ' + labels.throwInRange) : ('\u274C ' + labels.throwOutRange);
      const popup = Lf.popup({ className: 'throw-info-popup', closeButton: true })
        .setLatLng(mid)
        .setContent('<b>' + th.emoji + ' ' + (labels as any)[ttKey] + '</b><br>'
          + dist.toFixed(1) + 'm / ' + th.range + 'm max<br>' + status)
        .openOn(map);
      throwLayersRef.current.push(popup);
      throwOriginRef.current = null;
    }
  }

  /* ── Select map ── */
  const selectMap = useCallback((index: number) => {
    currentMapIndexRef.current = index;
    setCurrentMapIndex(index);
    loadMapTiles(index);
    clearMeasure();
    clearThrow();
    showMarkersForCurrentMap();
  }, []);

  /* ── Init ── */
  useEffect(() => {
    let cancelled = false;
    let onResize: (() => void) | null = null;

    function tryInit() {
      if (cancelled) return;
      const Lf = (window as any).L;
      if (!Lf) { setTimeout(tryInit, 100); return; }
      L.current = Lf;

    const pubgCRS = Lf.extend({}, Lf.CRS.EPSG4326, {
      transformation: new Lf.Transformation(1 / 360, 0.5, 1 / 180, 0.5),
    });

    const map = Lf.map(mapElRef.current, {
      crs: pubgCRS,
      minZoom: 0,
      maxZoom: 5,
      center: [0, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
    });
    map.setMaxBounds(Lf.latLngBounds([[-90, -180], [90, 180]]));
    Lf.control.zoom({ position: 'bottomright' }).addTo(map);
    leafletRef.current = map;

    map.on('click', onMapClick);

    map.on('mousemove', (e: any) => {
      const m = MAPS[currentMapIndexRef.current];
      const kmSize = m.km;
      const x = ((e.latlng.lng + 180) / 360 * kmSize).toFixed(2);
      const y = ((90 - e.latlng.lat) / 180 * kmSize).toFixed(2);
      const col = Math.min(9, Math.max(0, Math.floor((e.latlng.lng + 180) / 360 * 10)));
      const row = Math.min(9, Math.max(0, Math.floor((90 - e.latlng.lat) / 180 * 10)));
      const cell = 'ABCDEFGHIJ'[col] + (row + 1);
      setCoord(cell + ' | ' + x + ', ' + y + ' km');
    });
    map.on('mouseout', () => setCoord('--'));

    loadMapTiles(0);
    createGrid();
    loadMarkers();

    setTimeout(() => map.invalidateSize(), 200);
    onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    } // end tryInit

    tryInit();

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener('resize', onResize);
      if (leafletRef.current) leafletRef.current.remove();
    };
  }, []);

  /* ── Toggle grid ── */
  function toggleGrid() {
    const map = leafletRef.current;
    if (!map) return;
    if (gridVisible) {
      if (gridLayerRef.current) map.removeLayer(gridLayerRef.current);
    } else {
      if (!gridLayerRef.current) createGrid();
      else gridLayerRef.current.addTo(map);
    }
    setGridVisible(!gridVisible);
  }

  /* ── Toggle measure ── */
  function toggleMeasure() {
    if (measureMode) {
      clearMeasure();
    }
    if (!measureMode && throwMode) {
      clearThrow();
      setThrowMode(false);
    }
    setMeasureMode(!measureMode);
  }

  /* ── Toggle throw ── */
  function toggleThrowMode() {
    if (!throwMode && measureMode) {
      clearMeasure();
      setMeasureMode(false);
    }
    if (throwMode) clearThrow();
    setThrowMode(!throwMode);
  }

  /* ── Toggle edit ── */
  function toggleEditMode() {
    const next = !editMode;
    setEditMode(next);
    editModeRef.current = next;
    if (allMarkerDataRef.current) showMarkersForCurrentMap();
  }

  /* ── Export ── */
  function exportMarkers() {
    const output = JSON.parse(JSON.stringify(allMarkerDataRef.current));
    for (const mid in editChangesRef.current) {
      for (const idx in editChangesRef.current[mid]) {
        const c = editChangesRef.current[mid][idx as any];
        output[mid][parseInt(idx)].lat = parseFloat(c.lat.toFixed(6));
        output[mid][parseInt(idx)].lng = parseFloat(c.lng.toFixed(6));
      }
    }
    const json = JSON.stringify(output, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'markers.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Reset edits ── */
  function resetEdits() {
    if (!confirm(labels.editConfirmReset)) return;
    editChangesRef.current = {};
    setEditCount(0);
    allMarkerDataRef.current = null;
    loadMarkers();
  }

  /* ── Toggle marker filter ── */
  function toggleMarkerFilter(type: string) {
    const map = leafletRef.current;
    if (!map) return;
    const hidden = !markerHiddenRef.current[type];
    markerHiddenRef.current[type] = hidden;
    if (hidden) map.removeLayer(markerLayersRef.current[type]);
    else markerLayersRef.current[type].addTo(map);
    setMarkerFilters(prev => [...prev]); // trigger re-render
  }

  const m = MAPS[currentMapIndex];
  const cursorStyle = (measureMode || throwMode) ? 'crosshair' : undefined;

  return (
    <div class="map-viewer-wrapper" style="display:flex;height:calc(100vh - 64px);overflow:hidden;">
      {/* ── Sidebar ── */}
      <div class="map-sidebar">
        {MAPS.map((mp, i) => (
          <div
            key={mp.id}
            class={`map-sidebar-item${i === currentMapIndex ? ' active' : ''}`}
            onClick={() => selectMap(i)}
          >
            <img class="thumb" src={`/assert/maps/${mp.id}_thumb.webp`} alt={mp.en} loading="lazy" />
            <div class="name">{mapName(mp, lang)}</div>
          </div>
        ))}
      </div>

      {/* ── Map container ── */}
      <div class="map-container" style="flex:1;position:relative;">
        <div ref={mapElRef} id="leafletMap" style={`width:100%;height:100%;background:#0a0a0a;${cursorStyle ? 'cursor:' + cursorStyle : ''}`} />

        {/* Marker Filter Panel */}
        <div class="marker-panel">
          <div class="marker-panel-title">{labels.markerTitle}</div>
          {markerFilters.length === 0 && <div class="marker-no-data">{labels.markerNoData}</div>}
          {markerFilters.map(f => (
            <div
              key={f.type}
              class={`marker-filter${markerHiddenRef.current[f.type] ? ' hidden' : ''}`}
              onClick={() => toggleMarkerFilter(f.type)}
            >
              {f.icon && <img src={f.icon} alt="" style="width:20px;height:20px;" />}
              <span class="mf-name">{f.label}</span>
              <span class="mf-count">{f.count}</span>
            </div>
          ))}
        </div>

        {/* Map Tools */}
        <div class="map-tools">
          <button class={`map-tool-btn${gridVisible ? ' active' : ''}`} onClick={toggleGrid} title="Grid">
            <span class="tooltip">{labels.toolGrid}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
          </button>
          <button class={`map-tool-btn${measureMode ? ' active' : ''}`} onClick={toggleMeasure} title="Measure">
            <span class="tooltip">{labels.toolMeasure}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 22L22 2" /><path d="M6 18l2-2M10 14l2-2M14 10l2-2M18 6l2-2" /></svg>
          </button>
          <button class={`map-tool-btn${throwMode ? ' active' : ''}`} onClick={toggleThrowMode} title="Throwables">
            <span class="tooltip">{labels.toolThrow}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" /><path d="M12 3a4 4 0 014 4" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
          <button class={`map-tool-btn${editMode ? ' active' : ''}`} onClick={toggleEditMode} title="Edit">
            <span class="tooltip">{labels.toolEdit}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
        </div>

        {/* Throwable type selector */}
        <div class={`throw-panel${throwMode ? ' show' : ''}`}>
          {(['frag', 'smoke', 'flash', 'molotov'] as const).map(t => (
            <button
              key={t}
              class={`throw-type-btn${throwType === t ? ' active' : ''}`}
              onClick={() => { setThrowType(t); throwTypeRef.current = t; clearThrow(); }}
            >
              {THROWABLES[t].emoji}
              <span class="tt-label">{(labels as any)['throw' + t.charAt(0).toUpperCase() + t.slice(1)]}</span>
            </button>
          ))}
        </div>

        {/* Edit banner */}
        {editMode && (
          <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:1000;background:rgba(238,63,44,0.95);color:#fff;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 2px 12px rgba(0,0,0,0.3);">
            <span>{labels.editBanner}</span>
            <button onClick={exportMarkers} style="margin-left:12px;padding:4px 12px;background:#fff;color:#333;border:none;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer;">{labels.editExport}</button>
            <button onClick={resetEdits} style="margin-left:6px;padding:4px 12px;background:rgba(255,255,255,0.2);color:#fff;border:none;border-radius:4px;font-size:12px;cursor:pointer;">{labels.editReset}</button>
            <span style="margin-left:10px;font-size:11px;opacity:0.8;">{editCount}{labels.editChanges}</span>
          </div>
        )}

        {/* Coordinate display */}
        <div class="coord-display">{coord}</div>

        {/* Map info overlay */}
        <div class="map-info-overlay">
          <div class="map-info-name">{mapName(m, lang)}</div>
          <div class="map-info-desc">{mapDesc(m, lang)}</div>
          <div class="map-info-badges">
            <span class="badge badge-size">{m.size}</span>
            <span class="badge badge-players">{m.players}{labels.players}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
