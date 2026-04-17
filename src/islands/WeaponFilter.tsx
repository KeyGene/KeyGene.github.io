import { useState, useMemo } from 'preact/hooks';

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
  };
}

type SortKey = 'damage' | 'rpm' | 'velocity' | null;

export default function WeaponFilter({ data, lang, labels }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>(null);

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

  return (
    <div>
      {/* Filter bar */}
      <div style={{
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
        display: 'flex', gap: '8px', maxWidth: '1100px', margin: '0 auto 24px',
        padding: '0 var(--space-2xl)',
      }}>
        <SortBtn active={sortKey === 'damage'} onClick={() => setSortKey(sortKey === 'damage' ? null : 'damage')}>{labels.sortDmg}</SortBtn>
        <SortBtn active={sortKey === 'rpm'} onClick={() => setSortKey(sortKey === 'rpm' ? null : 'rpm')}>{labels.sortRof}</SortBtn>
        <SortBtn active={sortKey === 'velocity'} onClick={() => setSortKey(sortKey === 'velocity' ? null : 'velocity')}>{labels.sortRng}</SortBtn>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 'var(--space-md)', maxWidth: '1100px', margin: '0 auto', padding: '0 var(--space-2xl)',
      }}>
        {filtered.map((w) => (
          <div key={w.id} style={{
            background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
            transition: 'border-color 0.2s, transform 0.2s', cursor: 'default',
          }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(238,63,44,0.3)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-card-border)';
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
        ))}
      </div>
    </div>
  );
}

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11px' }}>
      <span style={{ width: '30px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</span>
      <div style={{
        flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden',
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
    <button onClick={onClick} style={{
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
    <button onClick={onClick} style={{
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
