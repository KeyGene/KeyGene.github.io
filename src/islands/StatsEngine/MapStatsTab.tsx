import { useState, useEffect, useRef } from 'preact/hooks';
import type { PlayerData, Labels, MapStat } from './types';
import { PUBG_PROXY, SHARD, mapName, queueFetch } from './types';

interface Props {
  player: PlayerData;
  labels: Labels;
  matchCache: Record<string, any>;
}

export default function MapStatsTab({ player, labels, matchCache }: Props) {
  const [mapStats, setMapStats] = useState<[string, MapStat][] | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartCreated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ms: Record<string, MapStat> = {};
      const ids = player.matchIds.slice(0, 20);

      for (const mid of ids) {
        if (cancelled) break;
        try {
          if (!matchCache[mid]) {
            const r = await queueFetch(`${PUBG_PROXY}/shards/${SHARD}/matches/${mid}`);
            if (r.ok) matchCache[mid] = await r.json();
            else continue;
          }
          const m = matchCache[mid];
          const mn = mapName(m.data.attributes.mapName);
          const roster = m.included.find((i: any) => i.type === 'participant' && i.attributes.stats.playerId === player.id);
          if (!roster) continue;
          const ps = roster.attributes.stats;
          const rosterRef = m.included.find((i: any) => i.type === 'roster' && i.relationships.participants.data.some((p: any) => p.id === roster.id));
          const won = rosterRef ? rosterRef.attributes.stats.rank === 1 : false;

          if (!ms[mn]) ms[mn] = { games: 0, wins: 0, kills: 0, deaths: 0 };
          ms[mn].games++;
          if (won) ms[mn].wins++;
          ms[mn].kills += ps.kills;
          if (ps.deathType !== 'alive') ms[mn].deaths++;
        } catch { continue; }
      }

      if (cancelled) return;
      if (Object.keys(ms).length === 0) { setMapStats([]); setLoading(false); return; }
      const entries = Object.entries(ms).sort((a, b) => b[1].games - a[1].games);
      setMapStats(entries);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [player.id]);

  useEffect(() => {
    if (!mapStats || mapStats.length === 0 || chartCreated.current) return;
    const Chart = (window as any).Chart;
    if (!Chart || !chartRef.current) return;

    const colors = ['#EE3F2C','#ff6b4a','#FFD700','#10B981','#3b82f6','#8b5cf6','#f59e0b','#ec4899'];
    new Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels: mapStats.map(([n]) => n),
        datasets: [{
          data: mapStats.map(([, s]) => s.games),
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 16 } } } }
    });
    chartCreated.current = true;
  }, [mapStats]);

  if (loading) return <div class="loading-msg">{labels.loadingMaps}</div>;
  if (!mapStats || mapStats.length === 0) return <div class="empty-msg">{labels.noMatches}</div>;

  return (
    <div>
      <div class="section-label">{labels.mapWinRate}</div>
      <div class="chart-container" style="max-width:400px;margin:0 auto 24px;"><canvas ref={chartRef}></canvas></div>
      <div class="map-grid">
        {mapStats.map(([name, s]) => {
          const wr = (s.wins / s.games * 100).toFixed(1);
          const kd = s.deaths > 0 ? (s.kills / s.deaths).toFixed(2) : '\u221E';
          return (
            <div class="map-card" key={name}>
              <div class="map-card-name">{name}</div>
              <div class="map-card-stat">{labels.winRate}: <span style="color:#10B981">{wr}%</span></div>
              <div class="map-card-stat">{labels.games}: <span>{s.games}</span></div>
              <div class="map-card-stat">{labels.kd}: <span style="color:var(--red)">{kd}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
