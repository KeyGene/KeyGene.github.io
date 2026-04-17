import { useState, useEffect } from 'preact/hooks';
import type { PlayerData, Labels } from './types';
import { PUBG_PROXY, SHARD, HEADERS, mapName, timeAgo, queueFetch, MAP_COLORS } from './types';

interface Props {
  player: PlayerData;
  labels: Labels;
  matchCache: Record<string, any>;
}

export default function RecentMatchesTab({ player, labels, matchCache }: Props) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (player.matchIds.length === 0) { setLoading(false); return; }
      const ids = player.matchIds.slice(0, 20);
      const results: any[] = [];

      for (const mid of ids) {
        if (cancelled) break;
        try {
          if (!matchCache[mid]) {
            const r = await queueFetch(`${PUBG_PROXY}/shards/${SHARD}/matches/${mid}`);
            if (r.ok) matchCache[mid] = await r.json();
            else continue;
          }
          const m = matchCache[mid];
          const attr = m.data.attributes;
          const roster = m.included.find((i: any) => i.type === 'participant' && i.attributes.stats.playerId === player.id);
          if (!roster) continue;
          const ps = roster.attributes.stats;
          const rosterRef = m.included.find((i: any) => i.type === 'roster' && i.relationships.participants.data.some((p: any) => p.id === roster.id));
          const rk = rosterRef ? rosterRef.attributes.stats.rank : '?';
          const mn = mapName(attr.mapName);
          const mapBg = MAP_COLORS[mn] || '#333';
          const isWin = rk === 1;

          results.push({ mid, mn, mapBg, rk, isWin, ps, attr });
          if (!cancelled) setCards([...results]);
        } catch { continue; }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [player.id]);

  if (loading && cards.length === 0) {
    return <div class="loading-msg">{labels.loadingMatches}</div>;
  }
  if (!loading && cards.length === 0) {
    return <div class="empty-msg">{labels.noMatches}</div>;
  }

  return (
    <div>
      <div class="match-list">
        {cards.map(c => {
          const rkClass = c.rk === 1 ? 'rank-gold' : c.rk <= 10 ? 'rank-top10' : 'rank-normal';
          return (
            <div class="match-card" style={c.isWin ? 'border-left:3px solid #FFD700;' : ''} key={c.mid}>
              <div class="match-map" style={`background:linear-gradient(135deg, ${c.mapBg}, ${c.mapBg}88);`}>{c.mn}</div>
              <div class="match-rank-col">
                <div class={`match-rank-num ${rkClass}`}>{c.isWin ? '\u{1F414}' : '#' + c.rk}</div>
                <div class="match-rank-label">{labels.rankCol}</div>
              </div>
              <div class="match-details">
                <div class="match-detail-item">
                  <div class="match-detail-value" style="color:var(--red)">{c.ps.kills}</div>
                  <div class="match-detail-label">{labels.kills}</div>
                </div>
                <div class="match-detail-item">
                  <div class="match-detail-value">{c.ps.damageDealt.toFixed(0)}</div>
                  <div class="match-detail-label">{labels.damage}</div>
                </div>
                <div class="match-detail-item">
                  <div class="match-detail-value">{c.ps.assists || 0}</div>
                  <div class="match-detail-label">{labels.assists}</div>
                </div>
                <div class="match-detail-item">
                  <div class="match-detail-value">{Math.floor(c.ps.timeSurvived / 60)}m</div>
                  <div class="match-detail-label">{labels.survived}</div>
                </div>
              </div>
              <div class="match-meta">
                <div class="match-time">{timeAgo(c.attr.createdAt, labels)}</div>
                <div class="match-mode">{c.attr.gameMode}</div>
              </div>
            </div>
          );
        })}
      </div>
      {loading && <div class="loading-msg" style="padding:20px">{labels.loadingMatches}</div>}
    </div>
  );
}
