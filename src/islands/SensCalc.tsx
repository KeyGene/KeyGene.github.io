import { useState, useMemo, useEffect } from 'preact/hooks';

interface ScopeConfig {
  id: string;
  label: string;
  mult: number;
}

const SCOPES: ScopeConfig[] = [
  { id: '1x', label: '1x', mult: 1.0 },
  { id: '2x', label: '2x', mult: 1.2 },
  { id: '3x', label: '3x', mult: 1.35 },
  { id: '4x', label: '4x', mult: 1.45 },
  { id: '6x', label: '6x', mult: 1.55 },
  { id: '8x', label: '8x', mult: 1.65 },
  { id: '15x', label: '15x', mult: 1.8 },
];

interface ProPlayer {
  name: string;
  team: string;
  dpi: number;
  sens: number;
  vRatio: number;
  scopes: Record<string, number>;
  style: 'low' | 'high';
}

const PRO_SETTINGS: ProPlayer[] = [
  { name: 'Pio', team: 'Gen.G', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Inonix', team: 'Gen.G', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Esther', team: 'Gen.G', dpi: 800, sens: 45, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Loki', team: 'Twisted Minds', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'NiceWigg', team: 'Streamer', dpi: 400, sens: 55, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'TGLTN', team: 'Soniqs', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Shrimzy', team: 'Soniqs', dpi: 400, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Purddy', team: 'FaZe', dpi: 1600, sens: 50, vRatio: 100, scopes: {}, style: 'high' },
  { name: 'Ubah', team: 'FaZe', dpi: 800, sens: 52, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Hikari', team: 'NH', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Oath', team: 'Danawa', dpi: 1200, sens: 50, vRatio: 100, scopes: {}, style: 'high' },
  { name: 'Seoul', team: 'Danawa', dpi: 800, sens: 55, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'SalvaN', team: 'ENCE', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Adder', team: '17 Gaming', dpi: 800, sens: 44, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'MMing', team: '17 Gaming', dpi: 1600, sens: 40, vRatio: 100, scopes: {}, style: 'high' },
  { name: 'Aixleft', team: 'NH', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Stk', team: '17 Gaming', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'KaymindN', team: 'Retired', dpi: 400, sens: 60, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'ibiza', team: 'T1', dpi: 800, sens: 50, vRatio: 100, scopes: {}, style: 'low' },
  { name: 'Akad', team: 'T1', dpi: 800, sens: 48, vRatio: 100, scopes: {}, style: 'low' },
];

// Fill default scope sens
PRO_SETTINGS.forEach((p) => {
  SCOPES.forEach((s) => {
    if (!p.scopes[s.id]) p.scopes[s.id] = 50;
  });
});

interface Props {
  labels: {
    sens: string;
    vRatio: string;
    scopeSens: string;
    cm360: string;
    calcTitle: string;
    proSettings: string;
    filterAll: string;
    filterLow: string;
    filterHigh: string;
    apply: string;
    copyLink: string;
    shareCard: string;
    dpiConvert: string;
    newDpi: string;
    equivSens: string;
    copied: string;
  };
}

function calcCm360(dpi: number, sens: number, scopeMultiplier: number): number {
  if (!dpi || !sens) return Infinity;
  return (2.54 * 360) / (dpi * (sens / 50) * scopeMultiplier);
}

function formatCm(val: number): string {
  return val < 1000 ? val.toFixed(1) + ' cm' : '\u221E';
}

export default function SensCalc({ labels }: Props) {
  const [dpi, setDpi] = useState(800);
  const [sens, setSens] = useState(50);
  const [vRatio, setVRatio] = useState(100);
  const [scopeSens, setScopeSens] = useState<Record<string, number>>(
    Object.fromEntries(SCOPES.map((s) => [s.id, 50]))
  );
  const [newDpi, setNewDpi] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'high'>('all');
  const [toast, setToast] = useState('');
  const [toastFading, setToastFading] = useState(false);

  // Decode URL params on mount (?d=DPI&s=sens&v=vRatio + scope ids)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    const s = params.get('s');
    const v = params.get('v');
    if (d) setDpi(Math.max(100, Math.min(16000, parseInt(d) || 800)));
    if (s) setSens(Math.max(1, Math.min(100, parseInt(s) || 50)));
    if (v) setVRatio(Math.max(50, Math.min(150, parseInt(v) || 100)));
    const scopeUpdate: Record<string, number> = {};
    let hasScope = false;
    SCOPES.forEach((sc) => {
      const val = params.get(sc.id);
      if (val) {
        scopeUpdate[sc.id] = Math.max(1, Math.min(100, parseInt(val) || 50));
        hasScope = true;
      }
    });
    if (hasScope) setScopeSens((prev) => ({ ...prev, ...scopeUpdate }));
  }, []);

  const edpi = dpi * sens;
  const baseCm = calcCm360(dpi, sens, 1);

  const scopeResults = useMemo(
    () =>
      SCOPES.map((s) => ({
        ...s,
        cm: calcCm360(dpi, sens * ((scopeSens[s.id] ?? 50) / 50), s.mult),
      })),
    [dpi, sens, scopeSens]
  );

  const equivSens = useMemo(() => {
    const nd = parseInt(newDpi);
    if (!nd || nd < 100) return null;
    return ((dpi * sens) / nd).toFixed(1);
  }, [dpi, sens, newDpi]);

  const filteredPros = filter === 'all' ? PRO_SETTINGS : PRO_SETTINGS.filter((p) => p.style === filter);

  function showToast(msg: string) {
    setToast(msg);
    setToastFading(false);
    setTimeout(() => setToastFading(true), 1700);
    setTimeout(() => { setToast(''); setToastFading(false); }, 2000);
  }

  function applyPro(p: ProPlayer) {
    setDpi(p.dpi);
    setSens(p.sens);
    setVRatio(p.vRatio);
    setScopeSens({ ...p.scopes });
    setTimeout(() => {
      document.querySelector('.sc-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function copyLink() {
    const params = new URLSearchParams();
    params.set('d', String(dpi));
    params.set('s', String(sens));
    params.set('v', String(vRatio));
    SCOPES.forEach((s) => params.set(s.id, String(scopeSens[s.id] ?? 50)));
    const url = location.origin + location.pathname + '?' + params.toString();
    navigator.clipboard.writeText(url).then(() => showToast(labels.copied));
  }

  function updateScope(id: string, val: number) {
    setScopeSens((prev) => ({ ...prev, [id]: val }));
  }

  return (
    <div class="sc-root">
      <div class="sc-layout">
        {/* Calculator Panel */}
        <div class="sc-panel">
          <div class="sc-tag">{labels.calcTitle}</div>

          {/* DPI */}
          <div class="sc-row">
            <label class="sc-label">DPI</label>
            <input
              type="number"
              class="sc-input"
              value={dpi}
              min={100}
              max={16000}
              step={50}
              onInput={(e) => setDpi(parseInt((e.target as HTMLInputElement).value) || 800)}
            />
          </div>

          {/* General Sens */}
          <div class="sc-row">
            <label class="sc-label">{labels.sens}</label>
            <input
              type="range"
              class="sc-slider"
              min={1}
              max={100}
              value={sens}
              onInput={(e) => setSens(parseInt((e.target as HTMLInputElement).value))}
            />
            <span class="sc-val">{sens}</span>
          </div>

          {/* V-Ratio */}
          <div class="sc-row">
            <label class="sc-label">{labels.vRatio}</label>
            <input
              type="range"
              class="sc-slider"
              min={50}
              max={150}
              value={vRatio}
              onInput={(e) => setVRatio(parseInt((e.target as HTMLInputElement).value))}
            />
            <span class="sc-val">{vRatio}</span>
          </div>

          {/* Scope Sensitivities */}
          <div class="sc-scopes">
            <div class="sc-tag">{labels.scopeSens}</div>
            {scopeResults.map((s) => (
              <div class="sc-scope-row" key={s.id}>
                <span class="sc-scope-name">{s.label}</span>
                <input
                  type="range"
                  class="sc-slider"
                  min={1}
                  max={100}
                  value={scopeSens[s.id] ?? 50}
                  onInput={(e) => updateScope(s.id, parseInt((e.target as HTMLInputElement).value))}
                />
                <span class="sc-val">{scopeSens[s.id] ?? 50}</span>
                <span class="sc-scope-cm">{formatCm(s.cm)}</span>
              </div>
            ))}
          </div>

          {/* Results */}
          <div class="sc-results">
            <div class="sc-result-card">
              <div class="sc-result-value">{edpi.toLocaleString()}</div>
              <div class="sc-result-label">eDPI</div>
            </div>
            <div class="sc-result-card">
              <div class="sc-result-value">{formatCm(baseCm)}</div>
              <div class="sc-result-label">{labels.cm360}</div>
            </div>
          </div>

          {/* DPI Converter */}
          <div class="sc-convert">
            <div class="sc-tag">{labels.dpiConvert}</div>
            <div class="sc-row">
              <label class="sc-label">{labels.newDpi}</label>
              <input
                type="number"
                class="sc-input"
                value={newDpi}
                placeholder="e.g. 1600"
                min={100}
                max={16000}
                step={50}
                onInput={(e) => setNewDpi((e.target as HTMLInputElement).value)}
              />
            </div>
            {equivSens && (
              <div class="sc-convert-result">
                {labels.equivSens}: <strong>{equivSens}</strong>
              </div>
            )}
          </div>

          {/* Actions */}
          <div class="sc-actions">
            <button class="sc-btn sc-btn-outline" onClick={copyLink}>
              {labels.copyLink}
            </button>
            <button class="sc-btn sc-btn-red" onClick={async () => {
              const el = document.querySelector('.sc-panel');
              if (!el) return;
              const html2canvas = (window as any).html2canvas;
              if (!html2canvas) { showToast('⏳ Loading...'); return; }
              try {
                const canvas = await html2canvas(el, { backgroundColor: '#0a0a0a', scale: 2 });
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'keygene-sensitivity.png';
                a.click();
              } catch { showToast('Export failed'); }
            }}>
              {labels.shareCard}
            </button>
          </div>
        </div>

        {/* Pro Settings Panel */}
        <div class="sc-panel sc-pro-panel">
          <div class="sc-tag">{labels.proSettings}</div>

          <div class="sc-filters">
            {(['all', 'low', 'high'] as const).map((f) => (
              <button
                key={f}
                class={`sc-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? labels.filterAll : f === 'low' ? labels.filterLow : labels.filterHigh}
              </button>
            ))}
          </div>

          <div class="sc-pro-list">
            {filteredPros.map((p) => (
              <div class="sc-pro-card" key={p.name} onClick={() => applyPro(p)}>
                <div class="sc-pro-avatar">{p.name.charAt(0)}</div>
                <div class="sc-pro-info">
                  <div class="sc-pro-name">{p.name}</div>
                  <div class="sc-pro-team">{p.team}</div>
                  <div class="sc-pro-stats">
                    DPI <strong>{p.dpi}</strong>{' '}
                    {labels.sens} <strong>{p.sens}</strong>{' '}
                    eDPI <strong>{(p.dpi * p.sens).toLocaleString()}</strong>
                  </div>
                </div>
                <button class="sc-btn-apply" onClick={(e) => { e.stopPropagation(); applyPro(p); }}>
                  {labels.apply}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div class={`sc-toast${toastFading ? ' sc-toast-out' : ''}`}>{toast}</div>}

      <style>{`
        .sc-root { font-family: var(--font-sans); color: var(--color-text); }

        .sc-layout {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: var(--space-lg); max-width: 1100px; margin: 0 auto;
          padding: 0 var(--space-2xl) var(--space-2xl);
        }

        .sc-panel {
          background: var(--color-card-bg); border: 1px solid var(--color-card-border);
          border-radius: var(--radius-lg); padding: var(--space-lg);
        }

        .sc-pro-panel {
          max-height: calc(100vh - 200px); overflow-y: auto;
        }

        .sc-tag {
          display: inline-flex; align-items: center; gap: var(--space-sm);
          font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--color-red); margin-bottom: var(--space-md);
        }
        .sc-tag::before {
          content: ''; width: 20px; height: 2px; background: var(--color-red);
        }

        .sc-row {
          display: flex; align-items: center; gap: var(--space-sm); margin-bottom: 14px;
        }
        .sc-label {
          width: 80px; font-size: var(--text-xs); font-weight: 600;
          color: var(--color-text-muted); text-transform: uppercase;
          letter-spacing: 0.06em; flex-shrink: 0;
        }
        .sc-input {
          width: 100px; padding: 10px 14px; background: var(--color-surface);
          border: 1px solid var(--color-border); border-radius: var(--radius-sm);
          color: var(--color-text); font-family: var(--font-sans); font-size: 14px;
          outline: none; text-align: center; transition: border-color var(--transition-fast);
        }
        .sc-input:focus { border-color: var(--color-red); }

        .sc-slider {
          -webkit-appearance: none; flex: 1; height: 4px;
          border-radius: 2px; background: var(--color-border); outline: none;
        }
        .sc-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: var(--color-red); cursor: pointer;
          transition: transform 0.15s;
        }
        .sc-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .sc-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--color-red); border: none; cursor: pointer;
          transition: transform 0.15s;
        }
        .sc-slider::-moz-range-thumb:hover { transform: scale(1.2); }
        .sc-val {
          width: 50px; text-align: right; font-size: 14px;
          font-weight: 700; font-variant-numeric: tabular-nums; flex-shrink: 0;
        }

        .sc-scopes { margin-top: var(--space-md); }
        .sc-scope-row {
          display: flex; align-items: center; gap: var(--space-sm);
          padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-border);
        }
        .sc-scope-name {
          width: 36px; font-size: var(--text-sm); font-weight: 700; flex-shrink: 0;
        }
        .sc-scope-cm {
          width: 80px; text-align: right; font-size: var(--text-sm);
          color: var(--color-text-muted); font-variant-numeric: tabular-nums; flex-shrink: 0;
        }

        .sc-results {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: var(--space-sm); margin-top: var(--space-lg);
        }
        .sc-result-card {
          background: linear-gradient(135deg, #1a0a08, #0a0a0a);
          border: 1px solid var(--color-card-border); border-radius: var(--radius-md);
          padding: var(--space-md); text-align: center;
        }
        [data-theme="light"] .sc-result-card { background: linear-gradient(135deg, #f8f0ee, #f0f0f0); }
        .sc-result-value {
          font-size: var(--text-2xl); font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .sc-result-label {
          font-size: var(--text-xs); color: var(--color-text-muted);
          text-transform: uppercase; letter-spacing: 0.08em; margin-top: var(--space-xs);
        }

        .sc-convert { margin-top: var(--space-md); }
        .sc-convert-result {
          margin-top: var(--space-sm); font-size: 14px; color: var(--color-text-muted);
        }
        .sc-convert-result strong { color: var(--color-text); font-size: var(--text-lg); }

        .sc-actions { display: flex; gap: 10px; margin-top: var(--space-md); }
        .sc-btn-outline {
          flex: 1; padding: 12px 16px; border-radius: var(--radius-md);
          font-family: var(--font-sans); font-size: var(--text-sm); font-weight: 700;
          cursor: pointer; text-align: center; background: transparent;
          color: var(--color-text); border: 1px solid var(--btn-outline-border);
          transition: border-color var(--transition-fast);
        }
        .sc-btn-outline:hover { border-color: var(--btn-outline-hover); }
        .sc-btn-red {
          flex: 1; padding: 12px 16px; border-radius: var(--radius-md);
          font-family: var(--font-sans); font-size: var(--text-sm); font-weight: 700;
          cursor: pointer; text-align: center; background: var(--color-red);
          color: #fff; border: none; transition: background var(--transition-fast);
        }
        .sc-btn-red:hover { background: var(--color-red-hover); }

        .sc-filters { display: flex; gap: 6px; margin-bottom: var(--space-md); flex-wrap: wrap; }
        .sc-filter-btn {
          padding: 6px 14px; font-size: var(--text-xs); font-weight: 600;
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-sm); color: var(--color-text-muted);
          cursor: pointer; font-family: var(--font-sans); transition: all var(--transition-fast);
        }
        .sc-filter-btn.active, .sc-filter-btn:hover {
          color: var(--color-text); border-color: var(--color-red);
          background: rgba(238,63,44,0.1);
        }

        .sc-pro-list { display: flex; flex-direction: column; gap: var(--space-sm); }
        .sc-pro-card {
          display: flex; align-items: center; gap: 14px; padding: 14px;
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-md); cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .sc-pro-card:hover { border-color: var(--color-red); }
        .sc-pro-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, var(--color-red), #ff5a4a);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .sc-pro-info { flex: 1; min-width: 0; }
        .sc-pro-name { font-size: 14px; font-weight: 700; }
        .sc-pro-team { font-size: var(--text-xs); color: var(--color-text-muted); }
        .sc-pro-stats {
          display: flex; gap: var(--space-sm); font-size: var(--text-xs);
          color: var(--color-text-muted); margin-top: var(--space-xs);
        }
        .sc-pro-stats strong { color: var(--color-text); }
        .sc-btn-apply {
          padding: 6px 14px; font-size: var(--text-xs); font-weight: 700;
          background: var(--color-red); color: #fff; border: none;
          border-radius: var(--radius-sm); cursor: pointer; flex-shrink: 0;
          font-family: var(--font-sans); transition: background var(--transition-fast);
        }
        .sc-btn-apply:hover { background: var(--color-red-hover); }

        .sc-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          padding: 12px 24px; background: #222; color: #fff; border-radius: var(--radius-md);
          font-size: var(--text-sm); font-weight: 600; z-index: 1000;
          animation: sc-fade-in 0.3s ease; transition: opacity 0.3s;
        }
        .sc-toast-out { opacity: 0; }
        @keyframes sc-fade-in { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 900px) {
          .sc-layout { grid-template-columns: 1fr; padding: 0 var(--space-lg) var(--space-lg); }
          .sc-pro-panel { max-height: none; }
        }
        @media (max-width: 480px) {
          .sc-row { flex-wrap: wrap; gap: var(--space-sm); }
          .sc-label { width: 100%; }
          .sc-results { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
