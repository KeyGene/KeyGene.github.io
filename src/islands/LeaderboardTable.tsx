import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

interface Labels {
  rank: string;
  player: string;
  games: string;
  winRate: string;
  kills: string;
  kda: string;
  avgDmg: string;
  loading: string;
  error: string;
  noData: string;
  server: string;
  season: string;
  mode: string;
  seasonLoading: string;
  seasonCurrent: string;
}

interface Props {
  labels: Labels;
  lang: string;
}

interface SeasonData {
  id: string;
  attributes: { isCurrentSeason: boolean };
}

interface PlayerData {
  id: string;
  attributes: {
    rank: number;
    stats?: {
      games?: number;
      winRatio?: number;
      kills?: number;
      kda?: number;
      averageDamage?: number;
    };
  };
}

const API = '/api';
const HEADERS = { Accept: 'application/vnd.api+json' };

const SERVERS = [
  { value: 'steam', label: 'Steam' },
  { value: 'kakao', label: 'Kakao' },
  { value: 'console', label: 'Console' },
  { value: 'stadia', label: 'Stadia' },
];

const MODES = [
  { value: 'squad-fpp', label: 'Squad FPP' },
  { value: 'squad', label: 'Squad' },
  { value: 'duo-fpp', label: 'Duo FPP' },
  { value: 'duo', label: 'Duo' },
  { value: 'solo-fpp', label: 'Solo FPP' },
  { value: 'solo', label: 'Solo' },
];

export default function LeaderboardTable({ labels, lang }: Props) {
  const [server, setServer] = useState('steam');
  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [mode, setMode] = useState('squad-fpp');
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const retriedRef = useRef(false);

  const formatSeasonLabel = (s: SeasonData) => {
    const label = s.id
      .replace('division.bro.official.pc-', 'S')
      .replace('division.bro.official.', 'S');
    return label + (s.attributes.isCurrentSeason ? ` ${labels.seasonCurrent}` : '');
  };

  // Load seasons when server changes
  useEffect(() => {
    let cancelled = false;
    setSeasonsLoading(true);
    setSeasons([]);
    setSeasonId('');
    setPlayers([]);

    (async () => {
      try {
        const res = await fetch(`${API}/shards/${server}/seasons`, { headers: HEADERS });
        if (!res.ok) throw new Error('Failed to fetch seasons');
        const json = await res.json();
        const list: SeasonData[] = (json.data || []).sort((a: SeasonData, b: SeasonData) => {
          if (a.attributes.isCurrentSeason) return -1;
          if (b.attributes.isCurrentSeason) return 1;
          return b.id.localeCompare(a.id);
        });
        if (cancelled) return;
        setSeasons(list);
        setSeasonsLoading(false);
        if (list.length > 0) setSeasonId(list[0].id);
      } catch {
        if (!cancelled) {
          setSeasonsLoading(false);
          setError(labels.error);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [server]);

  // Load leaderboard when season/mode changes
  const loadLeaderboard = useCallback(async (sid: string, gm: string, retried: boolean) => {
    if (!sid) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${API}/shards/${server}/leaderboards/${sid}/${gm}`,
        { headers: HEADERS }
      );
      if (!res.ok) {
        let detail = '';
        try { const j = await res.json(); detail = j.errors?.[0]?.detail || ''; } catch {}
        if (res.status === 400 && detail.includes('missing data')) {
          throw { noData: true };
        }
        throw new Error(labels.error);
      }
      const json = await res.json();
      const list: PlayerData[] = (json.included || []).sort(
        (a: PlayerData, b: PlayerData) => a.attributes.rank - b.attributes.rank
      );
      if (list.length === 0) {
        setError(labels.noData);
      }
      setPlayers(list);
      setLoading(false);
    } catch (err: any) {
      // Season fallback: try next season once (without re-triggering effect)
      if (!retried && seasons.length > 1) {
        const idx = seasons.findIndex(s => s.id === sid);
        if (idx >= 0 && idx < seasons.length - 1) {
          const next = seasons[idx + 1].id;
          // call with retried=true so further failures don't recurse
          return loadLeaderboard(next, gm, true).then(() => {
            // update UI state only after successful retry to avoid effect re-entry
            retriedRef.current = true;
            setSeasonId(next);
          });
        }
      }
      setPlayers([]);
      setError(err?.noData ? labels.noData : (err?.message || labels.error));
      setLoading(false);
    }
  }, [server, seasons, labels]);

  useEffect(() => {
    if (seasonId) {
      if (retriedRef.current) { retriedRef.current = false; return; }
      loadLeaderboard(seasonId, mode, false);
    }
  }, [seasonId, mode]);

  const statsUrl = (name: string) => {
    const base = lang === 'zh' ? '/stats' : `/${lang}/stats`;
    return `${base}?player=${encodeURIComponent(name)}`;
  };

  return (
    <div>
      {/* Filters */}
      <div class="lb-filters">
        <div class="lb-filter-group">
          <span class="lb-filter-label">{labels.server}</span>
          <select class="lb-select" value={server} onChange={e => setServer((e.target as HTMLSelectElement).value)}>
            {SERVERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div class="lb-filter-group">
          <span class="lb-filter-label">{labels.season}</span>
          <select class="lb-select" value={seasonId} onChange={e => setSeasonId((e.target as HTMLSelectElement).value)} disabled={seasonsLoading}>
            {seasonsLoading
              ? <option value="">{labels.seasonLoading}</option>
              : seasons.map(s => <option key={s.id} value={s.id}>{formatSeasonLabel(s)}</option>)
            }
          </select>
        </div>
        <div class="lb-filter-group">
          <span class="lb-filter-label">{labels.mode}</span>
          <select class="lb-select" value={mode} onChange={e => setMode((e.target as HTMLSelectElement).value)}>
            {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div class="lb-status">
          <div class="lb-spinner" />
          <div>{labels.loading}</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div class="lb-status lb-error">{error}</div>
      )}

      {/* Table */}
      {!loading && !error && players.length > 0 && (
        <div class="lb-table-wrap">
          <table class="lb-table">
            <thead>
              <tr>
                <th>{labels.rank}</th>
                <th class="col-player">{labels.player}</th>
                <th class="col-games">{labels.games}</th>
                <th>{labels.winRate}</th>
                <th>{labels.kills}</th>
                <th>{labels.kda}</th>
                <th class="col-avgdmg">{labels.avgDmg}</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => {
                const a = p.attributes;
                const s = a.stats || {};
                const rank = a.rank;
                const winRate = s.winRatio != null ? (s.winRatio * 100).toFixed(1) + '%' : '--';
                const kda = s.kda != null ? s.kda.toFixed(2) : '--';
                const avgDmg = s.averageDamage != null ? Math.round(s.averageDamage) : '--';

                return (
                  <tr key={p.id} class={rank <= 3 ? `rank-${rank}` : ''}>
                    <td><span class="rank-num">{rank}</span></td>
                    <td class="player-name-cell col-player">
                      <a href={statsUrl(p.id)}>{p.id || '--'}</a>
                    </td>
                    <td class="col-games">{s.games ?? '--'}</td>
                    <td>{winRate}</td>
                    <td>{s.kills ?? '--'}</td>
                    <td>{kda}</td>
                    <td class="col-avgdmg">{avgDmg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
