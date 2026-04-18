import { useState, useMemo, useEffect, useRef } from 'preact/hooks';

interface Weapon {
  id: string;
  name: string;
  type: string;
  ammo: string;
  damage: number;
  rpm: number;
  velocity: number;
  reloadTime: number;
  magSize: number[];
  recoil: number[][];
  attachments: string[];
  patch: { version: string; change: string; type: string } | null;
}

interface CategoryMap {
  [key: string]: { en: string; zh: string; ko: string };
}

interface WeaponsData {
  categories: CategoryMap;
  weapons: Weapon[];
}

interface Props {
  data: WeaponsData;
  lang: string;
  labels: {
    all: string;
    search: string;
    sortDmg: string;
    sortRof: string;
    sortRng: string;
    detailClose: string;
    detailReload: string;
    detailMag: string;
    detailAttachments: string;
    detailBaseStats: string;
    detailRecoil: string;
    detailDamage: string;
    detailRpm: string;
    detailVelocity: string;
    compareTitle: string;
    compareClear: string;
    compareHint: string;
  };
}

type SortKey = 'damage' | 'rpm' | 'velocity' | null;

export default function WeaponFilter({ data, lang, labels }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const detailRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const categories = Object.keys(data.categories);

  const catName = (cat: string) => {
    const c = data.categories[cat];
    return c ? (c[lang as keyof typeof c] || c.en) : cat;
  };

  const filtered = useMemo(() => {
    let list = data.weapons.filter((w) => {
      if (category !== 'all' && w.type !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!w.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (sortKey) {
      list = [...list].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
    }
    return list;
  }, [search, category, sortKey, data.weapons]);

  const maxDmg = 120;
  const maxRpm = 1100;
  const maxVel = 1000;

  const handleCardClick = (w: Weapon, e: MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggleCompare(w.id);
    } else {
      setSelectedWeapon(w);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareList((prev) => {
      const idx = prev.indexOf(id);
      if (idx !== -1) return prev.filter((x) => x !== id);
      if (prev.length < 3) return [...prev, id];
      return prev;
    });
  };

  // Draw recoil pattern when detail opens
  useEffect(() => {
    if (!selectedWeapon) return;
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      drawRecoil(selectedWeapon.recoil);
    }, 50);
  }, [selectedWeapon]);

  // Render radar chart when compare list changes
  useEffect(() => {
    if (compareList.length < 2) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }
    const t = setTimeout(() => {
      compareRef.current?.scrollIntoView({ behavior: 'smooth' });
      renderRadarChart();
    }, 50);
    return () => clearTimeout(t);
  }, [compareList]);

  // Cleanup chart on unmount
  useEffect(() => () => {
    if (chartInstanceRef.current) { try { chartInstanceRef.current.destroy(); } catch {} chartInstanceRef.current = null; }
  }, []);

  function drawRecoil(pattern: number[][]) {
    const canvas = document.getElementById('recoilCanvas') as HTMLCanvasElement | null;
    if (!canvas || !pattern || pattern.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 300);

    // Crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(100, 0); ctx.lineTo(100, 300);
    ctx.moveTo(0, 280); ctx.lineTo(200, 280);
    ctx.stroke();

    const maxX = Math.max(...pattern.map((p) => Math.abs(p[0]))) || 1;
    const maxY = Math.max(...pattern.map((p) => p[1])) || 1;

    pattern.forEach((p, i) => {
      const x = 100 + (p[0] / maxX) * 80;
      const y = 280 - (p[1] / maxY) * 250;
      const alpha = 0.4 + (i / pattern.length) * 0.6;

      ctx.fillStyle = `rgba(238,63,44,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      if (i > 0) {
        const px = 100 + (pattern[i - 1][0] / maxX) * 80;
        const py = 280 - (pattern[i - 1][1] / maxY) * 250;
        ctx.strokeStyle = 'rgba(238,63,44,0.3)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    });
  }

  function renderRadarChart() {
    const Chart = (window as any).Chart;
    if (!Chart || !chartRef.current) return;

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const colors = ['#EE3F2C', '#3b82f6', '#10B981'];
    const radarLabels = [labels.detailDamage, labels.detailRpm, labels.detailVelocity, labels.detailMag, labels.detailReload];

    const datasets = compareList.map((id, i) => {
      const w = data.weapons.find((x) => x.id === id)!;
      return {
        label: w.name,
        data: [
          (w.damage / 120) * 100,
          (w.rpm / 1100) * 100,
          (w.velocity / 1000) * 100,
          (w.magSize[1] / 150) * 100,
          (1 - w.reloadTime / 7) * 100,
        ],
        borderColor: colors[i],
        backgroundColor: colors[i] + '1a',
        borderWidth: 2,
        pointBackgroundColor: colors[i],
      };
    });

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'radar',
      data: { labels: radarLabels, datasets },
      options: {
        responsive: true,
        scales: {
          r: {
            grid: { color: 'rgba(255,255,255,0.08)' },
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            ticks: { display: false },
            pointLabels: { color: '#9ca3af', font: { size: 11 } },
            suggestedMin: 0,
            suggestedMax: 100,
          },
        },
        plugins: { legend: { labels: { color: '#9ca3af' } } },
      },
    });
  }

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .weapons-filter { padding: 0 24px !important; }
          .weapons-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important; }
          .weapon-detail-section { padding: 0 24px !important; }
          .weapon-detail-section .detail-grid { grid-template-columns: 1fr !important; }
          .weapon-compare-section { padding: 0 24px !important; }
        }
        .weapons-cat-btn:hover { border-color: rgba(238,63,44,0.4) !important; color: #fff !important; }
        .weapons-sort-btn:hover { border-color: rgba(238,63,44,0.4) !important; }
      `}</style>

      {/* Filter bar */}
      <div className="weapons-filter" style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
        maxWidth: '1100px', margin: '0 auto 16px', padding: '0 var(--space-2xl)',
      }}>
        <input
          type="text"
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          placeholder={labels.search}
          style={{
            flex: '1', minWidth: '180px', padding: '10px 16px',
            background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)',
            borderRadius: 'var(--radius-md)', color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', outline: 'none',
          }}
        />
        <CatBtn active={category === 'all'} onClick={() => setCategory('all')}>{labels.all}</CatBtn>
        {categories.map((c) => (
          <CatBtn key={c} active={category === c} onClick={() => setCategory(c)}>{catName(c)}</CatBtn>
        ))}
      </div>

      {/* Sort bar */}
      <div style={{
        display: 'flex', gap: '8px', maxWidth: '1100px', margin: '0 auto 12px',
        padding: '0 var(--space-2xl)',
      }}>
        <SortBtn active={sortKey === 'damage'} onClick={() => setSortKey(sortKey === 'damage' ? null : 'damage')}>{labels.sortDmg}</SortBtn>
        <SortBtn active={sortKey === 'rpm'} onClick={() => setSortKey(sortKey === 'rpm' ? null : 'rpm')}>{labels.sortRof}</SortBtn>
        <SortBtn active={sortKey === 'velocity'} onClick={() => setSortKey(sortKey === 'velocity' ? null : 'velocity')}>{labels.sortRng}</SortBtn>
      </div>

      {/* Compare hint */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto 24px', padding: '0 var(--space-2xl)',
        fontSize: '11px', color: 'var(--color-text-muted)',
      }}>
        {labels.compareHint}
      </div>

      {/* Grid */}
      <div className="weapons-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 'var(--space-md)', maxWidth: '1100px', margin: '0 auto', padding: '0 var(--space-2xl)',
      }}>
        {filtered.map((w) => {
          const isCompared = compareList.includes(w.id);
          return (
            <div key={w.id} style={{
              background: isCompared ? 'rgba(238,63,44,0.05)' : 'var(--color-card-bg)',
              border: `1px solid ${isCompared ? 'var(--color-red)' : 'var(--color-card-border)'}`,
              borderRadius: 'var(--radius-lg)', padding: '20px',
              transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer',
            }}
              onClick={(e) => handleCardClick(w, e as unknown as MouseEvent)}
              onMouseEnter={(e) => {
                if (!isCompared) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(238,63,44,0.3)';
                }
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                if (!isCompared) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-card-border)';
                }
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{w.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {catName(w.type)} · {w.ammo}
                </div>
              </div>
              <StatBar label="DMG" value={w.damage} max={maxDmg} />
              <StatBar label="RPM" value={w.rpm} max={maxRpm} />
              <StatBar label="VEL" value={w.velocity} max={maxVel} />
              {w.patch && (
                <div style={{
                  marginTop: '8px', padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                  borderRadius: 'var(--radius-sm)', display: 'inline-block',
                  background: w.patch.type === 'buff' ? 'rgba(16,185,129,0.15)' : 'rgba(238,63,44,0.15)',
                  color: w.patch.type === 'buff' ? '#10B981' : 'var(--color-red)',
                }}>
                  {w.patch.version}: {w.patch.change}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedWeapon && (
        <div ref={detailRef} className="weapon-detail-section" style={{
          maxWidth: '1100px', margin: '32px auto', padding: '0 var(--space-2xl)',
        }}>
          <div style={{
            background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)',
            borderRadius: '16px', padding: '32px',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800 }}>{selectedWeapon.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {catName(selectedWeapon.type)} · {selectedWeapon.ammo}
                </div>
              </div>
              <button onClick={() => setSelectedWeapon(null)} style={{
                padding: '8px 16px', background: 'var(--color-surface)',
                border: '1px solid var(--color-border)', borderRadius: '6px',
                color: 'var(--color-text-muted)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
              }}>
                {labels.detailClose}
              </button>
            </div>

            {/* Detail grid */}
            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left: stats + attachments */}
              <div>
                <div style={{
                  fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--color-red)', marginBottom: '12px',
                }}>
                  {labels.detailBaseStats}
                </div>
                {[
                  [labels.detailDamage, selectedWeapon.damage],
                  [labels.detailRpm, selectedWeapon.rpm],
                  [labels.detailVelocity, `${selectedWeapon.velocity} m/s`],
                  [labels.detailReload, `${selectedWeapon.reloadTime}s`],
                  [labels.detailMag, `${selectedWeapon.magSize[0]} / ${selectedWeapon.magSize[1]}`],
                ].map(([label, value]) => (
                  <div key={label as string} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px',
                  }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                  </div>
                ))}

                <div style={{
                  marginTop: '16px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--color-red)', marginBottom: '8px',
                }}>
                  {labels.detailAttachments}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedWeapon.attachments.map((a) => (
                    <span key={a} style={{
                      padding: '4px 12px', fontSize: '11px', fontWeight: 600,
                      background: 'rgba(238,63,44,0.08)', border: '1px solid rgba(238,63,44,0.15)',
                      borderRadius: '16px', color: 'var(--color-red)',
                    }}>
                      {a}
                    </span>
                  ))}
                </div>

                {selectedWeapon.patch && (
                  <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Patch {selectedWeapon.patch.version}:{' '}
                    <span style={{
                      color: selectedWeapon.patch.type === 'buff' ? '#10B981' : 'var(--color-red)',
                      fontWeight: 700,
                    }}>
                      {selectedWeapon.patch.change}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: recoil pattern */}
              <div>
                <div style={{
                  fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--color-red)', marginBottom: '12px',
                }}>
                  {labels.detailRecoil}
                </div>
                <div style={{
                  background: 'var(--color-surface)', borderRadius: '10px', padding: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <canvas id="recoilCanvas" width={200} height={300} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare section */}
      {compareList.length >= 2 && (
        <div ref={compareRef} className="weapon-compare-section" style={{
          maxWidth: '1100px', margin: '32px auto', padding: '0 var(--space-2xl)',
        }}>
          {/* Compare chips */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px',
          }}>
            {compareList.map((id) => {
              const w = data.weapons.find((x) => x.id === id);
              return w ? (
                <span key={id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', background: 'rgba(238,63,44,0.1)',
                  border: '1px solid rgba(238,63,44,0.2)', borderRadius: '20px',
                  fontSize: '13px', fontWeight: 600, color: 'var(--color-text)',
                }}>
                  {w.name}
                  <span
                    onClick={() => toggleCompare(id)}
                    style={{ cursor: 'pointer', color: 'var(--color-text-muted)', marginLeft: '4px' }}
                  >
                    &times;
                  </span>
                </span>
              ) : null;
            })}
            <button onClick={() => setCompareList([])} style={{
              padding: '4px 12px', fontSize: '11px', fontWeight: 600,
              background: 'transparent', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}>
              {labels.compareClear}
            </button>
          </div>

          {/* Radar chart */}
          <div style={{
            background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)',
            borderRadius: '12px', padding: '24px',
          }}>
            <canvas ref={chartRef} style={{ maxHeight: '350px' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11px' }}>
      <span style={{ width: '30px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</span>
      <div style={{
        flex: 1, height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: 'var(--color-red)',
          borderRadius: '3px', transition: 'width 0.3s',
        }} />
      </div>
      <span style={{ width: '36px', textAlign: 'right', fontWeight: 700, color: 'var(--color-text)' }}>{value}</span>
    </div>
  );
}

function CatBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button className="weapons-cat-btn" onClick={onClick} style={{
      padding: '8px 16px', fontSize: '12px', fontWeight: 600,
      background: active ? 'rgba(238,63,44,0.1)' : 'var(--color-surface)',
      border: `1px solid ${active ? 'var(--color-red)' : 'var(--color-border)'}`,
      borderRadius: '6px',
      color: active ? '#fff' : 'var(--color-text-muted)',
      cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
    }}>
      {children}
    </button>
  );
}

function SortBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button className="weapons-sort-btn" onClick={onClick} style={{
      padding: '6px 12px', fontSize: '11px', fontWeight: 600,
      background: active ? 'rgba(238,63,44,0.1)' : 'transparent',
      border: `1px solid ${active ? 'var(--color-red)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-sm)',
      color: active ? '#fff' : 'var(--color-text-muted)',
      cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
    }}>
      {active ? '▼ ' : ''}{children}
    </button>
  );
}
