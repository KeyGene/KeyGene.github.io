import { useState, useEffect, useRef } from 'preact/hooks';
import type { PlayerData, Labels, WeaponStat } from './types';
import { PUBG_PROXY, SHARD, weaponName, queueFetch } from './types';

interface Props {
  player: PlayerData;
  labels: Labels;
  matchCache: Record<string, any>;
  telemetryCache: Record<string, any>;
}

export default function WeaponsTab({ player, labels, matchCache, telemetryCache }: Props) {
  const [weaponStats, setWeaponStats] = useState<[string, WeaponStat][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const killChartRef = useRef<HTMLCanvasElement>(null);
  const dmgChartRef = useRef<HTMLCanvasElement>(null);
  const chartsCreated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ws: Record<string, WeaponStat> = {};
      const ids = player.matchIds.slice(0, 10);
      let anyTelemetry = false;

      for (const mid of ids) {
        if (cancelled) break;
        try {
          if (!matchCache[mid]) {
            const r = await queueFetch(`${PUBG_PROXY}/shards/${SHARD}/matches/${mid}`);
            if (r.ok) matchCache[mid] = await r.json();
            else continue;
          }
          const m = matchCache[mid];
          const telAsset = m.included.find((i: any) => i.type === 'asset');
          if (!telAsset) continue;
          const telUrl = telAsset.attributes.URL;

          if (!telemetryCache[mid]) {
            const tr = await fetch(telUrl);
            if (tr.ok) telemetryCache[mid] = await tr.json();
            else continue;
          }
          const tel = telemetryCache[mid];
          anyTelemetry = true;

          tel.forEach((ev: any) => {
            if (ev._T === 'LogPlayerKillV2' && ev.killer && ev.killer.accountId === player.id) {
              const w = ev.killerDamageInfo?.damageCauserName || 'Unknown';
              if (!ws[w]) ws[w] = { kills: 0, headshots: 0, damage: 0 };
              ws[w].kills++;
              if (ev.killerDamageInfo?.damageReason === 'HeadShot') ws[w].headshots++;
            }
            if (ev._T === 'LogPlayerTakeDamage' && ev.attacker && ev.attacker.accountId === player.id && ev.damage > 0) {
              const w = ev.damageCauserName || 'Unknown';
              if (!ws[w]) ws[w] = { kills: 0, headshots: 0, damage: 0 };
              ws[w].damage += ev.damage;
            }
          });
        } catch { continue; }
      }

      if (cancelled) return;
      if (!anyTelemetry || Object.keys(ws).length === 0) {
        setNoData(true);
        setLoading(false);
        return;
      }

      const sorted = Object.entries(ws).sort((a, b) => b[1].kills - a[1].kills).slice(0, 15);
      setWeaponStats(sorted);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [player.id]);

  useEffect(() => {
    if (!weaponStats || chartsCreated.current) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    const lbls = weaponStats.map(([w]) => weaponName(w));
    const killData = weaponStats.map(([, s]) => s.kills);
    const dmgData = weaponStats.map(([, s]) => Math.round(s.damage));

    const chartOpts = {
      indexAxis: 'y' as const,
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } },
        y: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } }
      }
    };

    if (killChartRef.current) {
      new Chart(killChartRef.current, {
        type: 'bar',
        data: { labels: lbls, datasets: [{ data: killData, backgroundColor: '#EE3F2C', borderRadius: 4 }] },
        options: chartOpts
      });
    }
    if (dmgChartRef.current) {
      new Chart(dmgChartRef.current, {
        type: 'bar',
        data: { labels: lbls, datasets: [{ data: dmgData, backgroundColor: '#ff6b4a', borderRadius: 4 }] },
        options: chartOpts
      });
    }
    chartsCreated.current = true;
  }, [weaponStats]);

  if (loading) return <div class="loading-msg">{labels.loadingWeapons}</div>;
  if (noData) return <div class="empty-msg">{labels.noWeapons}</div>;
  if (!weaponStats) return null;

  return (
    <div>
      <div class="section-label">{labels.weaponKills}</div>
      <div class="chart-container"><canvas ref={killChartRef}></canvas></div>

      <div class="section-label" style="margin-top:24px">{labels.weaponDamage}</div>
      <div class="chart-container"><canvas ref={dmgChartRef}></canvas></div>

      <table class="weapons-table" style="margin-top:20px">
        <thead><tr><th>{labels.weapon}</th><th>{labels.kills}</th><th>{labels.headshots}</th><th>{labels.damage}</th></tr></thead>
        <tbody>
          {weaponStats.map(([w, s]) => (
            <tr key={w}>
              <td>{weaponName(w)}</td>
              <td style="color:var(--color-red);font-weight:700">{s.kills}</td>
              <td>{s.headshots}</td>
              <td>{Math.round(s.damage).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
