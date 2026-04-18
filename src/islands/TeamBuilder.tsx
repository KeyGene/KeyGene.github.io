import { useState, useRef, useEffect } from 'preact/hooks';

interface Labels {
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  analyze: string;
  loading: string;
  teamRadar: string;
  roleAssignment: string;
  teamPoster: string;
  copyLink: string;
  copied: string;
  teamHeroSub: string;
  kd: string;
  winRate: string;
  kills: string;
  damage: string;
  assists: string;
  top10: string;
  matches: string;
  roleFragger: string;
  roleSniper: string;
  roleIgl: string;
  roleSupport: string;
  roleDescFragger: string;
  roleDescSniper: string;
  roleDescIgl: string;
  roleDescSupport: string;
  server: string;
}

interface Props {
  labels: Labels;
}

const PUBG_PROXY = '/api';
const SHARD_OPTIONS = ['steam', 'kakao', 'psn', 'xbox'] as const;
const HEADERS = { Accept: 'application/vnd.api+json' };
const TEAM_COLORS = ['#EE3F2C', '#3B82F6', '#10B981', '#F59E0B'];

interface RoleDef {
  id: string;
  icon: string;
  weights: Record<string, number>;
  name: string;
  desc: string;
}

interface PlayerData {
  name: string;
  id: string;
  stats: any;
}

interface RoleAssignment {
  role: RoleDef;
  playerIdx: number;
  score: number;
}

function zScores(values: number[]): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length) || 1;
  return values.map(v => (v - mean) / std);
}

function assignRoles(players: PlayerData[], roles: RoleDef[]): RoleAssignment[] {
  const statKeys = ['kills', 'damage', 'kd', 'assists', 'longestKill', 'headshots', 'winRate', 'top10', 'games'];
  const statValues: Record<string, number[]> = {};

  statKeys.forEach(key => {
    const vals = players.map(p => {
      const s = p.stats;
      switch (key) {
        case 'kills': return s.kills || 0;
        case 'damage': return s.damageDealt || 0;
        case 'kd': return s.losses > 0 ? s.kills / s.losses : 0;
        case 'assists': return s.assists || 0;
        case 'longestKill': return s.longestKill || 0;
        case 'headshots': return s.headshotKills || 0;
        case 'winRate': return s.roundsPlayed > 0 ? s.wins / s.roundsPlayed : 0;
        case 'top10': return s.roundsPlayed > 0 ? s.top10s / s.roundsPlayed : 0;
        case 'games': return s.roundsPlayed || 0;
        default: return 0;
      }
    });
    statValues[key] = zScores(vals);
  });

  const scores = roles.map(role =>
    players.map((_, pi) => {
      let score = 0;
      Object.keys(role.weights).forEach(key => {
        score += (statValues[key]?.[pi] ?? 0) * role.weights[key];
      });
      return { player: pi, score };
    })
  );

  const assigned: Record<number, number> = {};
  const usedPlayers: Record<number, boolean> = {};
  const result: RoleAssignment[] = [];

  for (let round = 0; round < roles.length; round++) {
    let bestScore = -Infinity, bestRole = -1, bestPlayer = -1;
    for (let ri = 0; ri < roles.length; ri++) {
      if (assigned[ri] !== undefined) continue;
      for (let pi = 0; pi < players.length; pi++) {
        if (usedPlayers[pi]) continue;
        if (scores[ri][pi].score > bestScore) {
          bestScore = scores[ri][pi].score;
          bestRole = ri;
          bestPlayer = pi;
        }
      }
    }
    assigned[bestRole] = bestPlayer;
    usedPlayers[bestPlayer] = true;
    result.push({ role: roles[bestRole], playerIdx: bestPlayer, score: bestScore });
  }

  return result.sort((a, b) => roles.indexOf(a.role) - roles.indexOf(b.role));
}

async function fetchPlayer(name: string, shard: string): Promise<PlayerData> {
  const r1 = await fetch(`${PUBG_PROXY}/shards/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`, { headers: HEADERS });
  if (!r1.ok) throw new Error('Player not found: ' + name);
  const data = await r1.json();
  const pid = data.data[0].id;
  const r2 = await fetch(`${PUBG_PROXY}/shards/${shard}/players/${pid}/seasons/lifetime`, { headers: HEADERS });
  const sData = await r2.json();
  const s = sData.data.attributes.gameModeStats.squad;
  return { name, id: pid, stats: s };
}

export default function TeamBuilder({ labels }: Props) {
  const [names, setNames] = useState(['', '', '', '']);
  const [shard, setShard] = useState('steam');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState<PlayerData[] | null>(null);
  const [toast, setToast] = useState('');
  const radarRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  const ROLES: RoleDef[] = [
    { id: 'fragger', icon: '\u{1F52B}', weights: { kills: 0.4, damage: 0.3, kd: 0.2, assists: 0.1 }, name: labels.roleFragger, desc: labels.roleDescFragger },
    { id: 'sniper', icon: '\u{1F3AF}', weights: { longestKill: 0.5, headshots: 0.3, kd: 0.2 }, name: labels.roleSniper, desc: labels.roleDescSniper },
    { id: 'igl', icon: '\u{1F9E0}', weights: { winRate: 0.4, top10: 0.3, kd: 0.2, games: 0.1 }, name: labels.roleIgl, desc: labels.roleDescIgl },
    { id: 'support', icon: '\u{1F6E1}\uFE0F', weights: { assists: 0.4, top10: 0.3, damage: 0.2, games: 0.1 }, name: labels.roleSupport, desc: labels.roleDescSupport },
  ];

  // Load from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loaded = ['p1', 'p2', 'p3', 'p4'].map(k => params.get(k) || '');
    if (loaded.some(Boolean)) {
      setNames(loaded);
      if (loaded.filter(Boolean).length >= 2) {
        handleAnalyze(loaded);
      }
    }
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }

  async function handleAnalyze(overrideNames?: string[]) {
    const n = (overrideNames || names).filter(Boolean);
    if (n.length < 2) return;
    setLoading(true);
    setError('');
    setPlayers(null);
    try {
      const result = await Promise.all(n.map(name => fetchPlayer(name, shard)));
      setPlayers(result);
      renderRadar(result);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  function renderRadar(pls: PlayerData[]) {
    // Dynamically load Chart.js
    const tryRender = () => {
      const Chart = (window as any).Chart;
      if (!Chart) { setTimeout(tryRender, 100); return; }
      if (!radarRef.current) { setTimeout(tryRender, 50); return; }
      if (chartRef.current) chartRef.current.destroy();

      const radarLabels = [labels.kd, labels.winRate, labels.kills, labels.damage, labels.assists, labels.top10];
      const datasets = pls.map((p, i) => {
        const s = p.stats;
        return {
          label: p.name,
          data: [
            Math.min((s.losses > 0 ? s.kills / s.losses : 0) / 5 * 100, 100),
            Math.min((s.roundsPlayed > 0 ? s.wins / s.roundsPlayed * 100 : 0) / 30 * 100, 100),
            Math.min(s.kills / 3000 * 100, 100),
            Math.min(s.damageDealt / 500000 * 100, 100),
            Math.min(s.assists / 1000 * 100, 100),
            Math.min((s.roundsPlayed > 0 ? s.top10s / s.roundsPlayed * 100 : 0) / 60 * 100, 100),
          ],
          borderColor: TEAM_COLORS[i],
          backgroundColor: TEAM_COLORS[i] + '20',
          borderWidth: 2,
          pointBackgroundColor: TEAM_COLORS[i],
        };
      });

      chartRef.current = new Chart(radarRef.current, {
        type: 'radar',
        data: { labels: radarLabels, datasets },
        options: {
          responsive: true,
          scales: { r: { grid: { color: 'rgba(255,255,255,0.08)' }, angleLines: { color: 'rgba(255,255,255,0.08)' }, ticks: { display: false }, pointLabels: { color: '#9ca3af', font: { size: 11 } }, suggestedMin: 0, suggestedMax: 100 } },
          plugins: { legend: { labels: { color: '#9ca3af' } } },
        },
      });
    };
    tryRender();
  }

  function encodeParams() {
    const params = new URLSearchParams();
    names.forEach((n, i) => { if (n) params.set(`p${i + 1}`, n); });
    return window.location.origin + window.location.pathname + '?' + params.toString();
  }

  const roles = players ? assignRoles(players, ROLES) : [];

  return (
    <div>
      {/* Hero */}
      <div style="padding:48px 24px 32px;text-align:center">
        <div style="display:inline-flex;align-items:center;gap:8px;font-size:var(--text-xs);font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-red);margin-bottom:var(--space-md)">
          <span style="width:24px;height:2px;background:var(--color-red);display:inline-block" />
          {labels.teamRadar.replace(/radar/i, 'Analyzer').includes('Analyzer') ? 'Team Analyzer' : labels.teamRadar}
        </div>
        <h1 class="team-hero-title" style="font-size:var(--text-3xl);font-weight:800;letter-spacing:-0.04em;text-transform:uppercase;margin-bottom:10px">
          TEAM <span style="color:var(--color-red)">ANALYZER</span>
        </h1>
        <p style="color:var(--color-text-muted);font-size:var(--text-base);max-width:480px;margin:0 auto">{labels.teamHeroSub}</p>
      </div>

      {/* Input */}
      <div style="max-width:800px;margin:0 auto;padding:0 var(--space-2xl) var(--space-xl)">
        <div class="team-input-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          {[0, 1, 2, 3].map(i => (
            <input
              key={i}
              type="text"
              value={names[i]}
              onInput={(e) => {
                const next = [...names];
                next[i] = (e.target as HTMLInputElement).value;
                setNames(next);
              }}
              placeholder={[labels.player1, labels.player2, labels.player3, labels.player4][i]}
              style="padding:12px 16px;background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:var(--radius-md);color:var(--color-text);font-family:var(--font-sans);font-size:14px;outline:none"
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--color-red)'; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--color-card-border)'; }}
            />
          ))}
        </div>
        <div style="margin-top:10px;display:flex;gap:10px">
          <div style="position:relative;flex:none">
            <label style="position:absolute;top:-18px;left:2px;font-size:11px;color:var(--color-text-muted);font-weight:600;letter-spacing:0.05em;text-transform:uppercase">{labels.server}</label>
            <select
              value={shard}
              onChange={(e) => setShard((e.target as HTMLSelectElement).value)}
              style="padding:12px 16px;background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:var(--radius-md);color:var(--color-text);font-family:var(--font-sans);font-size:14px;outline:none;cursor:pointer;appearance:auto"
            >
              {SHARD_OPTIONS.map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button
            class="btn-clip btn-red"
            onClick={() => handleAnalyze()}
            disabled={loading || names.filter(Boolean).length < 2}
            style={{flex:1,opacity:loading?0.5:1,cursor:loading||names.filter(Boolean).length<2?'not-allowed':'pointer'}}
          >
            {labels.analyze}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style="text-align:center;padding:40px;color:var(--color-text-muted)">
          {labels.loading}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style="text-align:center;padding:20px;color:var(--color-red)">
          {error}
        </div>
      )}

      {/* Results */}
      {players && (
        <div class="team-results" style="max-width:1100px;margin:0 auto;padding:0 var(--space-2xl) 60px">
          <div class="team-results-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
            {/* Radar */}
            <div style="background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:var(--radius-lg);padding:28px">
              <div style="display:inline-flex;align-items:center;gap:8px;font-size:var(--text-xs);font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-red);margin-bottom:var(--space-md)">
                <span style="width:20px;height:2px;background:var(--color-red);display:inline-block" />
                {labels.teamRadar}
              </div>
              <canvas ref={radarRef} style="max-height:350px" />
            </div>

            {/* Roles */}
            <div style="background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:var(--radius-lg);padding:28px">
              <div style="display:inline-flex;align-items:center;gap:8px;font-size:var(--text-xs);font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-red);margin-bottom:var(--space-md)">
                <span style="width:20px;height:2px;background:var(--color-red);display:inline-block" />
                {labels.roleAssignment}
              </div>
              {roles.map(r => (
                <div key={r.role.id} style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--color-border)">
                  <div style="font-size:24px;width:36px;text-align:center">{r.role.icon}</div>
                  <div style="flex:1">
                    <div style="font-size:14px;font-weight:700">{r.role.name}</div>
                    <div style="font-size:var(--text-xs);color:var(--color-text-muted)">{r.role.desc}</div>
                  </div>
                  <div style="font-size:15px;font-weight:800;color:var(--color-red);text-align:right">
                    {players[r.playerIdx].name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Player cards */}
          <div class="team-player-grid" style="display:grid;gap:12px;margin-bottom:24px">
            {players.map((p, i) => {
              const s = p.stats;
              const kd = s.losses > 0 ? (s.kills / s.losses).toFixed(2) : '0.00';
              const wr = s.roundsPlayed > 0 ? (s.wins / s.roundsPlayed * 100).toFixed(1) + '%' : '0%';
              const myRole = roles.find(r => r.playerIdx === i);
              return (
                <div key={i} style={`background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:var(--radius-lg);padding:20px;text-align:center;border-top:3px solid ${TEAM_COLORS[i]}`}>
                  <div style="font-size:16px;font-weight:800;margin-bottom:12px">{p.name}</div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;color:var(--color-text-muted)">
                    <span>K/D</span><span style="color:var(--color-text);font-weight:700">{kd}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;color:var(--color-text-muted)">
                    <span>{labels.winRate}</span><span style="color:var(--color-text);font-weight:700">{wr}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;color:var(--color-text-muted)">
                    <span>{labels.kills}</span><span style="color:var(--color-text);font-weight:700">{(s.kills || 0).toLocaleString()}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;color:var(--color-text-muted)">
                    <span>{labels.matches}</span><span style="color:var(--color-text);font-weight:700">{(s.roundsPlayed || 0).toLocaleString()}</span>
                  </div>
                  {myRole && (
                    <div style="margin-top:12px;padding:6px 12px;background:rgba(238,63,44,0.1);border-radius:6px;font-size:12px;font-weight:700;color:var(--color-red);display:inline-block">
                      {myRole.role.icon} {myRole.role.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
<div style="display:flex;gap:12px;justify-content:center">
            <button
              class="btn-clip btn-outline"
              onClick={() => {
                navigator.clipboard.writeText(encodeParams()).then(() => showToast(labels.copied));
              }}
            >
              {labels.copyLink}
            </button>
            <button
              class="btn-clip btn-red"
              onClick={async () => {
                const el = document.querySelector('.team-results');
                if (!el) return;
                const html2canvas = (window as any).html2canvas;
                if (!html2canvas) { showToast('⏳ Loading...'); return; }
                try {
                  const canvas = await html2canvas(el, { backgroundColor: '#0a0a0a', scale: 2 });
                  const a = document.createElement('a');
                  a.href = canvas.toDataURL('image/png');
                  a.download = 'keygene-team.png';
                  a.click();
                } catch { showToast('Export failed'); }
              }}
            >
              {labels.teamPoster}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 24px;background:#222;color:#fff;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:600;z-index:1000">
          {toast}
        </div>
      )}
    </div>
  );
}
