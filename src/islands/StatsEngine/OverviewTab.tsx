import type { PlayerData, Labels } from './types';
import { formatTier } from './types';

interface Props {
  player: PlayerData;
  labels: Labels;
}

export default function OverviewTab({ player, labels }: Props) {
  const s = player.stats;
  const kd = s.losses > 0 ? (s.kills / s.losses).toFixed(2) : '\u221E';
  const wr = s.roundsPlayed > 0 ? (s.wins / s.roundsPlayed * 100).toFixed(1) : '0';
  const t10 = s.roundsPlayed > 0 ? (s.top10s / s.roundsPlayed * 100).toFixed(1) : '0';
  const lk = s.longestKill ? s.longestKill.toFixed(0) : '0';
  const mk = s.roundMostKills || 0;
  const rank = formatTier(player.rankedTier);

  const showToast = (text: string) => {
    const toast = document.createElement('div');
    toast.textContent = text;
    toast.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:8px 20px;border-radius:8px;font-size:14px;z-index:9999;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };
  const exportImage = async () => {
    const el = document.getElementById('overviewCapture');
    if (!el || !(window as any).html2canvas) { showToast('\u23F3'); return; }
    try {
      const canvas = await (window as any).html2canvas(el, { backgroundColor: '#000000', scale: 2 });
      const link = document.createElement('a');
      link.download = `${player.name}-stats.png`;
      link.href = canvas.toDataURL();
      link.click();
      showToast('\u2705 Exported!');
    } catch {
      showToast('\u274C Export failed');
    }
  };

  return (
    <div>
      <div class="player-banner" id="overviewCapture">
        <div class="player-avatar">{(player.name?.[0] || '?').toUpperCase()}</div>
        <div class="player-info">
          <div class="player-name">{player.name}</div>
          <div class="player-meta">{labels.platform}</div>
        </div>
        <div class="rank-badge">
          <div class="rank-badge-icon">{rank.icon}</div>
          <div class="rank-badge-name">{rank.name}</div>
          <div class="rank-badge-label">{labels.rank}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card-value" style="color:var(--color-red)">{kd}</div><div class="stat-card-label">{labels.kd}</div></div>
        <div class="stat-card"><div class="stat-card-value" style="color:#10B981">{wr}%</div><div class="stat-card-label">{labels.winRate}</div></div>
        <div class="stat-card"><div class="stat-card-value">{s.roundsPlayed.toLocaleString()}</div><div class="stat-card-label">{labels.matches}</div></div>
        <div class="stat-card"><div class="stat-card-value">{s.kills.toLocaleString()}</div><div class="stat-card-label">{labels.kills}</div></div>
        <div class="stat-card"><div class="stat-card-value">{t10}%</div><div class="stat-card-label">{labels.top10Rate}</div></div>
        <div class="stat-card"><div class="stat-card-value">{s.wins.toLocaleString()}</div><div class="stat-card-label">{labels.wins}</div></div>
      </div>

      <div class="section-label">{labels.bestRecords}</div>
      <div class="records-row">
        <div class="record-card"><div class="record-card-value">{lk}m</div><div class="record-card-label">{labels.longestKill}</div></div>
        <div class="record-card" style="border-left-color:#FFD700"><div class="record-card-value">{mk}</div><div class="record-card-label">{labels.mostKills}</div></div>
        <div class="record-card" style="border-left-color:#10B981"><div class="record-card-value">{s.maxKillStreaks || 0}</div><div class="record-card-label">{labels.mostDamage}</div></div>
      </div>

      <div class="export-bar">
        <button class="export-btn" onClick={exportImage}>{'\u{1F4F8}'} {labels.exportImage}</button>
      </div>
    </div>
  );
}
