import { useState, useEffect, useRef } from 'preact/hooks';
import type { PlayerData, Labels } from './types';
import { PUBG_PROXY, SHARD, HEADERS, queueFetch } from './types';

const STORAGE_KEY = 'keygene_ban_history';

interface HistoryItem { name: string; status: string; time: number; }

function getHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveHistory(list: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 10)));
}

interface Props {
  player: PlayerData | null;
  labels: Labels;
}

export default function BanCheckTab({ player, labels }: Props) {
  const [input, setInput] = useState(player?.name || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; statusClass: string; statusText: string; level: string; totalMatches: number; recent2w: number } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(getHistory());
  const autoChecked = useRef(false);

  const addToHistory = (name: string, status: string) => {
    let h = getHistory().filter(x => x.name.toLowerCase() !== name.toLowerCase());
    h.unshift({ name, status, time: Date.now() });
    saveHistory(h);
    setHistory([...h]);
  };

  const removeHistory = (idx: number) => {
    const h = getHistory();
    h.splice(idx, 1);
    saveHistory(h);
    setHistory([...h]);
  };

  const doBanCheck = async (nameOverride?: string) => {
    const name = (nameOverride || input).trim();
    if (!name) return;
    setInput(name);
    setLoading(true); setResult(null);

    try {
      const r = await fetch(`${PUBG_PROXY}/shards/${SHARD}/players?filter[playerNames]=${encodeURIComponent(name)}`, { headers: HEADERS });
      if (r.status === 404) {
        setResult({ status: 'banned', statusClass: 'banned', statusText: labels.banLikelyBanned + ' \u26A0\uFE0F', level: '--', totalMatches: 0, recent2w: 0 });
        addToHistory(name, 'banned');
        setLoading(false);
        return;
      }
      if (r.status === 429 || r.status >= 500) {
        setResult({ status: 'unknown', statusClass: 'unknown', statusText: labels.banUncertain + ' \u2753', level: '--', totalMatches: 0, recent2w: 0 });
        setLoading(false);
        return;
      }
      if (!r.ok) {
        setResult({ status: 'unknown', statusClass: 'unknown', statusText: labels.banUncertain + ' \u2753', level: '--', totalMatches: 0, recent2w: 0 });
        setLoading(false);
        return;
      }
      const data = await r.json();
      if (!data.data || !data.data[0]) {
        setResult({ status: 'banned', statusClass: 'banned', statusText: labels.banLikelyBanned + ' \u26A0\uFE0F', level: '--', totalMatches: 0, recent2w: 0 });
        addToHistory(name, 'banned');
        setLoading(false);
        return;
      }
      const pid = data.data[0].id;
      const matchIds = (data.data[0].relationships?.matches?.data || []).map((m: any) => m.id);

      const sr = await fetch(`${PUBG_PROXY}/shards/${SHARD}/players/${pid}/seasons/lifetime`, { headers: HEADERS });
      const sData = await sr.json();
      const modes = sData.data.attributes.gameModeStats;
      let totalMatches = 0;
      for (const mode of Object.values(modes) as any[]) {
        totalMatches += (mode.roundsPlayed || 0);
      }

      let recent2w = 0;
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recentCheck = matchIds.slice(0, 20);
      for (const mid of recentCheck) {
        try {
          const mr = await queueFetch(`${PUBG_PROXY}/shards/${SHARD}/matches/${mid}`);
          if (mr.ok) {
            const md = await mr.json();
            if (new Date(md.data.attributes.createdAt).getTime() >= twoWeeksAgo) recent2w++;
          }
        } catch {}
      }

      let level = '--';
      try {
        const mr = await fetch(`${PUBG_PROXY}/shards/${SHARD}/players/${pid}/survival_mastery`, { headers: HEADERS });
        if (mr.ok) {
          const md = await mr.json();
          level = 'Lv.' + (md.data.attributes.level || '--');
        }
      } catch {}

      let status: string, statusClass: string, statusText: string;
      if (recent2w > 0) {
        status = 'ok'; statusClass = 'not-banned'; statusText = labels.banNotBanned + ' \u{1F44D}';
      } else if (totalMatches > 50) {
        status = 'banned'; statusClass = 'banned'; statusText = labels.banLikelyBanned + ' \u26A0\uFE0F';
      } else {
        status = 'unknown'; statusClass = 'unknown'; statusText = labels.banUncertain + ' \u2753';
      }

      setResult({ status, statusClass, statusText, level, totalMatches, recent2w });
      addToHistory(name, status);
      setLoading(false);
    } catch {
      setResult({ status: 'unknown', statusClass: 'unknown', statusText: labels.banUncertain + ' \u2753', level: '--', totalMatches: 0, recent2w: 0 });
      addToHistory(name, 'unknown');
      setLoading(false);
    }
  };

  // Auto-check when player is set; reset on player change so new searches re-trigger
  useEffect(() => {
    if (player) {
      autoChecked.current = false;
    }
  }, [player?.id]);
  useEffect(() => {
    if (player && !autoChecked.current) {
      autoChecked.current = true;
      setInput(player.name);
      doBanCheck(player.name);
    }
  }, [player?.id]);

  return (
    <div class="ban-check-wrap">
      {!player && !result && !loading && (
        <div class="empty-msg">{labels.banSearchFirst}</div>
      )}

      <div class="ban-search-box">
        <input
          type="text" value={input}
          onInput={e => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={e => { if (e.key === 'Enter') doBanCheck(); }}
          placeholder={labels.banPlaceholder}
          aria-label={labels.banPlaceholder}
        />
        <button class="ban-check-btn" onClick={() => doBanCheck()} disabled={loading}>{labels.banCheckBtn}</button>
      </div>

      {loading && <div class="loading-msg">{labels.banChecking}</div>}

      {result && (
        <div>
          <div class={`ban-result ${result.statusClass}`}>{result.statusText}</div>
          <div class="ban-info">
            <div class="ban-info-item"><span class="ban-info-value">{result.level}</span><span>{labels.banLevel}</span></div>
            <div class="ban-info-item"><span class="ban-info-value">{result.totalMatches}</span><span>{labels.banTotalMatches}</span></div>
            <div class="ban-info-item"><span class="ban-info-value">{result.recent2w}</span><span>{labels.banRecent2w}</span></div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div class="ban-history">
          <div class="ban-history-title">{labels.banHistory}</div>
          <div class="ban-history-list">
            {history.map((item, i) => (
              <div class="ban-history-item" key={item.name + item.time}>
                <button type="button" class="ban-history-name-btn" aria-label={`Re-check ${item.name}`} onClick={() => doBanCheck(item.name)}>
                  {item.name}
                </button>
                <span style="display:flex;align-items:center;gap:12px;">
                  <span style={`color:${item.status === 'ok' ? '#10B981' : item.status === 'banned' ? 'var(--color-red)' : '#F59E0B'};font-weight:600;font-size:12px;`}>
                    {item.status === 'ok' ? labels.banNotBanned : item.status === 'banned' ? labels.banLikelyBanned : labels.banUncertain}
                  </span>
                  <button type="button" class="ban-history-remove" aria-label={`Remove ${item.name}`} onClick={() => removeHistory(i)}>&times;</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
