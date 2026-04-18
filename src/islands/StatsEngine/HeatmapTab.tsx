import { useState, useEffect } from 'preact/hooks';
import type { PlayerData, Labels } from './types';
import { PUBG_PROXY, SHARD, queueFetch } from './types';

interface Props {
  player: PlayerData;
  labels: Labels;
  matchCache: Record<string, any>;
}

export default function HeatmapTab({ player, labels, matchCache }: Props) {
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setGrid(null);
    setLoading(true);
    (async () => {
      const g = Array.from({ length: 7 }, () => Array(24).fill(0));
      const ids = player.matchIds.slice(0, 50);

      for (const mid of ids) {
        if (cancelled) break;
        try {
          if (!matchCache[mid]) {
            const r = await queueFetch(`${PUBG_PROXY}/shards/${SHARD}/matches/${mid}`);
            if (r.ok) matchCache[mid] = await r.json();
            else continue;
          }
          const d = new Date(matchCache[mid]?.data?.attributes?.createdAt);
          if (isNaN(d.getTime())) continue;
          const day = (d.getDay() + 6) % 7;
          g[day][d.getHours()]++;
        } catch { continue; }
      }

      if (!cancelled) { setGrid(g); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [player.id]);

  if (loading) return <div class="loading-msg">{labels.loadingMatches}</div>;
  if (!grid) return null;

  const maxVal = Math.max(1, ...grid.flat());
  const days = [labels.mon, labels.tue, labels.wed, labels.thu, labels.fri, labels.sat, labels.sun];

  return (
    <div>
      <div class="section-label">{labels.heatmapTitle}</div>
      <p style="color:var(--color-gray-500);font-size:12px;margin-bottom:16px;">{labels.heatmapDesc}</p>
      <div class="heatmap-grid">
        <div></div>
        {Array.from({ length: 24 }, (_, i) => <div class="heatmap-hour" key={i}>{i}</div>)}
        {grid.map((row, d) => (
          <>
            <div class="heatmap-label" key={`l${d}`}>{days[d]}</div>
            {row.map((v, h) => {
              const intensity = v / maxVal;
              const bg = v === 0 ? 'rgba(255,255,255,0.04)' : `rgba(238,63,44,${0.2 + intensity * 0.8})`;
              return <div class="heatmap-cell" style={`background:${bg}`} title={`${days[d]} ${h}:00 - ${v} ${labels.matchCount}`} key={`${d}-${h}`}></div>;
            })}
          </>
        ))}
      </div>
    </div>
  );
}
