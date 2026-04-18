import { useState, useEffect, useRef } from 'preact/hooks';
import type { TabId, PlayerData, Labels } from './types';
import { PUBG_PROXY, SHARD, HEADERS } from './types';
import OverviewTab from './OverviewTab';
import RecentMatchesTab from './RecentMatchesTab';
import WeaponsTab from './WeaponsTab';
import MapStatsTab from './MapStatsTab';
import CompareTab from './CompareTab';
import HeatmapTab from './HeatmapTab';
import WrappedTab from './WrappedTab';
import BanCheckTab from './BanCheckTab';

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'overview', labelKey: 'tabOverview' },
  { id: 'matches', labelKey: 'tabMatches' },
  { id: 'weapons', labelKey: 'tabWeapons' },
  { id: 'maps', labelKey: 'tabMaps' },
  { id: 'compare', labelKey: 'tabCompare' },
  { id: 'heatmap', labelKey: 'tabHeatmap' },
  { id: 'wrapped', labelKey: 'tabWrapped' },
  { id: 'bancheck', labelKey: 'tabBanCheck' },
];

interface Props {
  initialPlayer?: string;
  labels: Labels;
}

export default function StatsEngine({ initialPlayer, labels }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchInput, setSearchInput] = useState(initialPlayer || '');
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<false | true | 'rate'>(false);
  const matchCache = useRef<Record<string, any>>({});
  const telemetryCache = useRef<Record<string, any>>({});

  const doSearch = async (name?: string) => {
    if (loading) return;
    const query = (name || searchInput).trim();
    if (!query) return;
    setSearchInput(query);
    setPlayer(null);
    setLoading(true);
    setError(false);
    matchCache.current = {};
    telemetryCache.current = {};

    try {
      const r = await fetch(`${PUBG_PROXY}/shards/${SHARD}/players?filter[playerNames]=${encodeURIComponent(query)}`, { headers: HEADERS });
      if (r.status === 429) { setError('rate'); setLoading(false); return; }
      if (!r.ok) throw new Error('not found');
      const data = await r.json();
      if (!data?.data?.[0]) throw new Error('not found');
      const p = data.data[0];
      const pid = p.id;
      const matchIds = (p.relationships?.matches?.data || []).map((m: any) => m.id);

      const sr = await fetch(`${PUBG_PROXY}/shards/${SHARD}/players/${pid}/seasons/lifetime`, { headers: HEADERS });
      if (!sr.ok) throw new Error('season failed');
      const sData = await sr.json();
      const stats = sData?.data?.attributes?.gameModeStats?.squad;
      if (!stats) throw new Error('no squad stats');

      let rankedTier = null;
      try {
        const seasonsR = await fetch(`${PUBG_PROXY}/shards/${SHARD}/seasons`, { headers: HEADERS });
        if (seasonsR.ok) {
          const seasons = (await seasonsR.json()).data;
          const cur = seasons.find((s: any) => s.attributes.isCurrentSeason);
          if (cur) {
            const rr = await fetch(`${PUBG_PROXY}/shards/${SHARD}/players/${pid}/seasons/${cur.id}/ranked`, { headers: HEADERS });
            if (rr.ok) {
              const rd = (await rr.json()).data.attributes.rankedGameModeStats;
              const sq = rd.squad || rd['squad-fpp'];
              if (sq) rankedTier = sq.currentTier;
            }
          }
        }
      } catch {}

      setPlayer({ id: pid, name: p.attributes.name, stats, matchIds, rankedTier });
      setLoading(false);
      history.replaceState(null, '', `?player=${encodeURIComponent(p.attributes.name)}`);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPlayer) doSearch(initialPlayer);
    const onPop = () => {
      const p = new URLSearchParams(window.location.search).get('player');
      if (p && p !== searchInput) doSearch(p);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const renderTab = () => {
    if (loading) return <div class="loading-msg" role="status" aria-live="polite">{labels.loading}</div>;
    if (error) return <div class="empty-msg" role="alert" aria-live="assertive">{error === 'rate' ? labels.rateLimited : labels.playerNotFound}</div>;
    if (!player) return <div class="empty-msg">{labels.searchPrompt}</div>;

    switch (activeTab) {
      case 'overview': return <OverviewTab player={player} labels={labels} />;
      case 'matches': return <RecentMatchesTab player={player} labels={labels} matchCache={matchCache.current} />;
      case 'weapons': return <WeaponsTab player={player} labels={labels} matchCache={matchCache.current} telemetryCache={telemetryCache.current} />;
      case 'maps': return <MapStatsTab player={player} labels={labels} matchCache={matchCache.current} />;
      case 'compare': return <CompareTab player={player} labels={labels} />;
      case 'heatmap': return <HeatmapTab player={player} labels={labels} matchCache={matchCache.current} />;
      case 'wrapped': return <WrappedTab player={player} labels={labels} matchCache={matchCache.current} telemetryCache={telemetryCache.current} />;
      case 'bancheck': return <BanCheckTab player={player} labels={labels} />;
      default: return null;
    }
  };

  return (
    <div>
      {/* Search Bar */}
      <div class="search-area">
        <div class="search-inner">
          <input
            type="text"
            class="search-input"
            aria-label={labels.searchPlaceholder}
            placeholder={labels.searchPlaceholder}
            value={searchInput}
            onInput={e => setSearchInput((e.target as HTMLInputElement).value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
          />
          <button class="search-btn" onClick={() => doSearch()} disabled={loading}>{labels.searchBtn}</button>
        </div>
      </div>

      {/* Tab Bar */}
      <div class="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            class={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {labels[tab.labelKey]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div class="tab-content active">
        {renderTab()}
      </div>
    </div>
  );
}
