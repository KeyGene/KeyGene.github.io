import { useState, useEffect } from 'preact/hooks';
import type { PlayerData, Labels, WeaponStat } from './types';
import { PUBG_PROXY, SHARD, weaponName, queueFetch, formatTier } from './types';

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setVal(Math.round(target * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

interface Props {
  player: PlayerData;
  labels: Labels;
  matchCache: Record<string, any>;
  telemetryCache: Record<string, any>;
}

function getPercentile(kd: number): number {
  if (kd >= 5) return 95;
  if (kd >= 3) return 85;
  if (kd >= 2) return 70;
  if (kd >= 1.5) return 50;
  if (kd >= 1) return 30;
  return 15;
}

function assignTags(s: any): string[] {
  const tags: string[] = [];
  const kd = s.losses > 0 ? s.kills / s.losses : 0;
  const wr = s.roundsPlayed > 0 ? s.wins / s.roundsPlayed * 100 : 0;
  const hsPct = s.kills > 0 ? (s.headshotKills || 0) / s.kills * 100 : 0;
  if (kd >= 3) tags.push('tagFragKing');
  if (wr >= 15) tags.push('tagCamper');
  if ((s.longestKill || 0) >= 400) tags.push('tagSniperGod');
  if (hsPct >= 25) tags.push('tagHeadshotMachine');
  if (s.roundsPlayed >= 500) tags.push('tagGrinder');
  const t10 = s.roundsPlayed > 0 ? s.top10s / s.roundsPlayed * 100 : 0;
  if (t10 >= 50) tags.push('tagSurvivor');
  return tags.slice(0, 3);
}

function cleanWeaponName(raw: string): string {
  return raw
    .replace(/^WeapHK416_C$/, 'M416')
    .replace(/^WeapBerylM762_C$/, 'Beryl M762')
    .replace(/^WeapK98_C$/, 'Kar98k')
    .replace(/^WeapAKM_C$/, 'AKM')
    .replace(/^WeapMini14_C$/, 'Mini 14')
    .replace(/^WeapSKS_C$/, 'SKS')
    .replace(/^WeapDP28_C$/, 'DP-28')
    .replace(/^WeapSCAR-L_C$/, 'SCAR-L')
    .replace(/^WeapM16A4_C$/, 'M16A4')
    .replace(/^WeapUMP_C$/, 'UMP45')
    .replace(/^Weap/, '')
    .replace(/_C$/, '');
}

export default function WrappedTab({ player, labels, matchCache, telemetryCache }: Props) {
  const [weaponData, setWeaponData] = useState<[string, number][]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const weaponKills: Record<string, number> = {};
      const ids = player.matchIds.slice(0, 10);
      for (const mid of ids) {
        if (cancelled) break;
        try {
          if (!matchCache[mid]) {
            const r = await queueFetch(`${PUBG_PROXY}/shards/${SHARD}/matches/${mid}`);
            if (r.ok) matchCache[mid] = await r.json();
            else continue;
          }
          const match = matchCache[mid];
          if (!match.included) continue;
          const telAsset = match.included.find((i: any) => i.type === 'asset');
          if (telAsset && !telemetryCache[mid]) {
            try {
              const tr = await queueFetch(telAsset.attributes.URL);
              if (tr.ok) telemetryCache[mid] = await tr.json();
            } catch {}
          }
          if (telemetryCache[mid]) {
            const kills = telemetryCache[mid].filter((e: any) => e._T === 'LogPlayerKillV2' && e.killer && e.killer.accountId === player.id);
            kills.forEach((k: any) => {
              const w = k.killerDamageInfo?.damageCauserName || 'Unknown';
              weaponKills[w] = (weaponKills[w] || 0) + 1;
            });
          }
        } catch { continue; }
      }
      if (!cancelled) {
        setWeaponData(Object.entries(weaponKills).sort((a, b) => b[1] - a[1]).slice(0, 3));
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [player.id]);

  const s = player.stats;
  const kd = s.losses > 0 ? (s.kills / s.losses).toFixed(2) : '0.00';
  const wr = s.roundsPlayed > 0 ? (s.wins / s.roundsPlayed * 100).toFixed(1) : '0.0';
  const pct = getPercentile(parseFloat(kd));
  const avgDmg = s.roundsPlayed > 0 ? Math.round(s.damageDealt / s.roundsPlayed) : 0;
  const tags = assignTags(s);
  const totalWeaponKills = weaponData.reduce((sum, w) => sum + w[1], 0) || 1;
  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

  const animKills = useCountUp(s.kills, 1200);
  const animMatches = useCountUp(s.roundsPlayed, 1200);
  const animAvgDmg = useCountUp(avgDmg, 1000);
  const animLongestKill = useCountUp(Math.round(s.longestKill || 0), 1000);
  const animMostKills = useCountUp(s.roundMostKills || 0, 800);

  const generatePoster = () => {
    const el = document.getElementById('wrappedCapture');
    if (!el || !(window as any).html2canvas) return;
    (window as any).html2canvas(el, { backgroundColor: '#000000', scale: 2, useCORS: true, logging: false }).then((canvas: HTMLCanvasElement) => {
      const link = document.createElement('a');
      link.download = `keygene-wrapped-${player.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      const toast = document.createElement('div');
      toast.textContent = '\u2705 Exported!';
      toast.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:8px 20px;border-radius:8px;font-size:14px;z-index:9999;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    });
  };

  return (
    <div>
      <div class="wrapped-container" id="wrappedCapture">
        <div class="wrapped-card hero-card">
          <div class="wrapped-season">{labels.wrappedSeason}</div>
          <div class="wrapped-player">{player.name}</div>
          <div class="wrapped-rank">
            <div class="wrapped-rank-icon">{formatTier(player.rankedTier).icon}</div>
            <div style="font-size:16px;font-weight:800;color:#FFD700;margin-top:4px;">{formatTier(player.rankedTier).name}</div>
            <div style="font-size:13px;color:var(--color-text-muted);margin-top:4px;">{labels.wrappedModeTag || 'Steam \u00b7 Squad \u00b7 Lifetime'}</div>
          </div>
        </div>

        <div class="wrapped-card">
          <div class="wrapped-stats-grid">
            <div>
              <div class="wrapped-big-stat">{animKills.toLocaleString()}</div>
              <div class="wrapped-stat-label">{labels.kills}</div>
            </div>
            <div>
              <div class="wrapped-big-stat">{animMatches.toLocaleString()}</div>
              <div class="wrapped-stat-label">{labels.matches}</div>
            </div>
            <div>
              <div class="wrapped-big-stat">{kd}</div>
              <div class="wrapped-stat-label">K/D</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <div class="wrapped-percentile">{'\u{1F525}'} {labels.wrappedBeats?.replace('{pct}', String(pct))}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
            <div><span style="font-size:20px;font-weight:800;">{wr}%</span><br/><span class="wrapped-stat-label">{labels.winRate}</span></div>
            <div><span style="font-size:20px;font-weight:800;">{animAvgDmg}</span><br/><span class="wrapped-stat-label">{labels.wrappedAvgDmg}</span></div>
          </div>
        </div>

        <div class="wrapped-card">
          <div style="font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-red);margin-bottom:16px;">{labels.wrappedWeapons}</div>
          {loaded && weaponData.length > 0 ? weaponData.map((w, i) => {
            const wpct = Math.round(w[1] / totalWeaponKills * 100);
            const name = cleanWeaponName(w[0]);
            return (
              <div class="wrapped-weapon-row" key={w[0]}>
                <span class="wrapped-weapon-rank">{medals[i] || ''}</span>
                <span class="wrapped-weapon-name">{name}</span>
                <div class="wrapped-weapon-bar"><div class="wrapped-weapon-bar-fill" style={`width:${wpct}%`}></div></div>
                <span class="wrapped-weapon-pct">{wpct}%</span>
              </div>
            );
          }) : loaded ? (
            <div style="color:var(--color-gray-500);font-size:13px;">{labels.wrappedNoWeapon || 'No weapon data available'}</div>
          ) : (
            <div class="loading-msg" style="padding:10px">{labels.loading}</div>
          )}
        </div>

        <div class="wrapped-card">
          <div style="font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-red);margin-bottom:16px;">{labels.wrappedRecords}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <span style="font-size:24px;font-weight:800;">{animLongestKill}m</span>
              <div class="wrapped-stat-label">{'\u{1F3AF}'} {labels.wrappedFarthest}</div>
            </div>
            <div>
              <span style="font-size:24px;font-weight:800;">{animMostKills}</span>
              <div class="wrapped-stat-label">{'\u{1F480}'} {labels.mostKills}</div>
            </div>
          </div>
        </div>

        <div class="wrapped-card">
          <div style="font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-red);margin-bottom:16px;">{labels.wrappedTags}</div>
          <div>
            {tags.length > 0 ? tags.map(tag => <span class="wrapped-tag" key={tag}>#{labels[tag] || tag}</span>) : <span class="wrapped-tag">#{labels.wrappedPubgTag || 'PUBG Player'}</span>}
          </div>
          <div class="wrapped-logo">KEY<span class="accent">GENE</span></div>
        </div>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <button class="wrapped-poster-btn" onClick={generatePoster}>{'\u{1F4F8}'} {labels.wrappedPoster}</button>
      </div>
    </div>
  );
}
