import { useState, useRef, useEffect } from 'preact/hooks';
import type { PlayerData, Labels } from './types';
import { PUBG_PROXY, SHARD, HEADERS } from './types';

interface Props {
  player: PlayerData;
  labels: Labels;
}

export default function CompareTab({ player, labels }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [metrics, setMetrics] = useState<any[] | null>(null);
  const [player2Name, setPlayer2Name] = useState('');
  const radarRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const doCompare = async () => {
    const name2 = input.trim();
    if (!name2) return;
    setLoading(true); setError(false); setMetrics(null);

    try {
      const r1 = await fetch(`${PUBG_PROXY}/shards/${SHARD}/players?filter[playerNames]=${encodeURIComponent(name2)}`, { headers: HEADERS });
      if (!r1.ok) throw new Error();
      const pid2 = (await r1.json()).data[0].id;
      const r2 = await fetch(`${PUBG_PROXY}/shards/${SHARD}/players/${pid2}/seasons/lifetime`, { headers: HEADERS });
      const s2 = (await r2.json()).data.attributes.gameModeStats.squad;

      const s1 = player.stats;
      setPlayer2Name(name2);

      const m = [
        { key: 'kd', label: labels.kd, v1: s1.losses > 0 ? s1.kills/s1.losses : 0, v2: s2.losses > 0 ? s2.kills/s2.losses : 0, fmt: (v: number) => v.toFixed(2), max: 10 },
        { key: 'wr', label: labels.winRate, v1: s1.roundsPlayed > 0 ? s1.wins/s1.roundsPlayed*100 : 0, v2: s2.roundsPlayed > 0 ? s2.wins/s2.roundsPlayed*100 : 0, fmt: (v: number) => v.toFixed(1) + '%', max: 100 },
        { key: 'matches', label: labels.matches, v1: s1.roundsPlayed, v2: s2.roundsPlayed, fmt: (v: number) => v.toLocaleString(), max: Math.max(s1.roundsPlayed, s2.roundsPlayed) * 1.1 },
        { key: 'kills', label: labels.kills, v1: s1.kills, v2: s2.kills, fmt: (v: number) => v.toLocaleString(), max: Math.max(s1.kills, s2.kills) * 1.1 },
        { key: 't10', label: labels.top10Rate, v1: s1.roundsPlayed > 0 ? s1.top10s/s1.roundsPlayed*100 : 0, v2: s2.roundsPlayed > 0 ? s2.top10s/s2.roundsPlayed*100 : 0, fmt: (v: number) => v.toFixed(1) + '%', max: 100 },
        { key: 'lk', label: labels.longestKill, v1: s1.longestKill || 0, v2: s2.longestKill || 0, fmt: (v: number) => v.toFixed(0) + 'm', max: Math.max(s1.longestKill||0, s2.longestKill||0) * 1.1 || 1 },
      ];
      setMetrics(m);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!metrics || !radarRef.current) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels: metrics.map(m => m.label),
        datasets: [
          { label: player.name, data: metrics.map(m => m.v1 / m.max * 100), borderColor: '#EE3F2C', backgroundColor: 'rgba(238,63,44,0.15)', borderWidth: 2, pointBackgroundColor: '#EE3F2C' },
          { label: player2Name, data: metrics.map(m => m.v2 / m.max * 100), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 2, pointBackgroundColor: '#3b82f6' },
        ]
      },
      options: {
        responsive: true,
        scales: { r: { grid: { color: 'rgba(255,255,255,0.08)' }, angleLines: { color: 'rgba(255,255,255,0.08)' }, ticks: { display: false }, pointLabels: { color: '#9ca3af', font: { size: 11 } }, suggestedMin: 0, suggestedMax: 100 } },
        plugins: { legend: { labels: { color: '#9ca3af' } } }
      }
    });
  }, [metrics]);

  const generatePoster = () => {
    const el = document.getElementById('compareCapture');
    if (!el || !(window as any).html2canvas) return;
    (window as any).html2canvas(el, { backgroundColor: '#0a0a0a', scale: 2, useCORS: true, logging: false }).then((canvas: HTMLCanvasElement) => {
      const link = document.createElement('a');
      link.download = `keygene-vs-${player.name}-${player2Name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div>
      <div class="compare-search">
        <input type="text" value={player.name} disabled style="opacity:0.6;flex:1;min-width:150px;padding:12px 16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:var(--white);font-family:var(--font);font-size:14px;" />
        <span class="vs-label">{labels.vs}</span>
        <input
          type="text" value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doCompare(); }}
          placeholder={labels.enterPlayer2}
          style="flex:1;min-width:150px;padding:12px 16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:var(--white);font-family:var(--font);font-size:14px;outline:none;"
        />
        <button class="search-btn" onClick={doCompare}>{labels.compareBtn}</button>
      </div>

      {loading && <div class="loading-msg">{labels.loading}</div>}
      {error && <div class="empty-msg">{labels.playerNotFound}</div>}

      {metrics && (
        <div>
          <div id="compareCapture">
            <div class="chart-container" style="max-width:500px;margin:0 auto 24px;"><canvas ref={radarRef}></canvas></div>
            <table class="compare-table">
              <thead><tr><th>{player.name}</th><th>{labels.stat}</th><th>{player2Name}</th></tr></thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.key}>
                    <td class={m.v1 >= m.v2 ? 'compare-winner' : 'compare-loser'}>{m.fmt(m.v1)}</td>
                    <td style="color:var(--gray-500)">{m.label}</td>
                    <td class={m.v2 >= m.v1 ? 'compare-winner' : 'compare-loser'}>{m.fmt(m.v2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style="text-align:center;margin-top:16px;font-size:11px;color:var(--gray-500);">keygene.top</div>
          </div>
          <button class="compare-poster-btn" onClick={generatePoster}>{labels.vsPoster}</button>
        </div>
      )}
    </div>
  );
}
