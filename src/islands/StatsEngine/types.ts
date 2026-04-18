export type TabId = 'overview' | 'matches' | 'weapons' | 'maps' | 'compare' | 'heatmap' | 'wrapped' | 'bancheck';

export interface PlayerData {
  id: string;
  name: string;
  stats: SquadStats;
  matchIds: string[];
  rankedTier: TierInfo | null;
}

export interface TierInfo {
  tier: string;
  subTier?: string;
}

export interface SquadStats {
  kills: number;
  losses: number;
  wins: number;
  roundsPlayed: number;
  top10s: number;
  longestKill: number;
  roundMostKills: number;
  maxKillStreaks: number;
  damageDealt: number;
  headshotKills: number;
  assists: number;
  [key: string]: any;
}

export interface MatchParticipantStats {
  playerId: string;
  kills: number;
  damageDealt: number;
  assists: number;
  timeSurvived: number;
  deathType: string;
  [key: string]: any;
}

export interface WeaponStat {
  kills: number;
  headshots: number;
  damage: number;
}

export interface MapStat {
  games: number;
  wins: number;
  kills: number;
  deaths: number;
}

export interface Labels {
  [key: string]: string;
}

export const PUBG_PROXY = '/api';
export const SHARD = 'steam';
export const HEADERS = { Accept: 'application/vnd.api+json' };

export const WEAPON_NAMES: Record<string, string> = {
  'Item_Weapon_M416_C':'M416','Item_Weapon_AK47_C':'AKM','Item_Weapon_SCAR-L_C':'SCAR-L',
  'Item_Weapon_Mini14_C':'Mini 14','Item_Weapon_Kar98k_C':'Kar98k','Item_Weapon_SKS_C':'SKS',
  'Item_Weapon_AWM_C':'AWM','Item_Weapon_M24_C':'M24','Item_Weapon_UMP_C':'UMP45',
  'Item_Weapon_Vector_C':'Vector','Item_Weapon_Groza_C':'Groza','Item_Weapon_AUG_C':'AUG',
  'Item_Weapon_QBZ95_C':'QBZ','Item_Weapon_SLR_C':'SLR','Item_Weapon_QBU88_C':'QBU',
  'Item_Weapon_DP28_C':'DP-28','Item_Weapon_M249_C':'M249','Item_Weapon_UZI_C':'Micro UZI',
  'Item_Weapon_Tommy_C':'Tommy Gun','Item_Weapon_Win94_C':'Win94','Item_Weapon_Saiga12_C':'S12K',
  'Item_Weapon_DoubleBarrel_C':'Double Barrel','Item_Weapon_Berreta686_C':'S686',
  'Item_Weapon_Winchester_C':'S1897','Item_Weapon_VSS_C':'VSS','Item_Weapon_MK14_C':'Mk14',
  'Item_Weapon_Mosin_C':'Mosin','Item_Weapon_M16A4_C':'M16A4','Item_Weapon_Mk47Mutant_C':'Mk47 Mutant',
  'Item_Weapon_BerylM762_C':'Beryl M762','Item_Weapon_G36C_C':'G36C','Item_Weapon_MP5K_C':'MP5K',
  'Item_Weapon_Bizon_C':'Bizon','Item_Weapon_MG3_C':'MG3','Item_Weapon_ACE32_C':'ACE32',
  'Item_Weapon_K2_C':'K2','Item_Weapon_FAMAS_C':'FAMAS','Item_Weapon_L6_C':'Lynx AMR',
  'Item_Weapon_P90_C':'P90','Item_Weapon_MP9_C':'MP9',
  'Item_Weapon_Pan_C':'Pan','Item_Weapon_Machete_C':'Machete','Item_Weapon_Sickle_C':'Sickle',
  'Item_Weapon_Crowbar_C':'Crowbar',
  'Item_Weapon_M9_C':'P92','Item_Weapon_Desert_Eagle_C':'Deagle','Item_Weapon_Rhino_C':'R45',
  'Item_Weapon_NagantM1895_C':'R1895','Item_Weapon_Skorpion_C':'Skorpion','Item_Weapon_vz61Skorpion_C':'Skorpion',
  'Item_Weapon_P18C_C':'P18C','Item_Weapon_FlareGun_C':'Flare Gun',
  'Item_Weapon_G18_C':'P18C',
  'Item_Weapon_Crossbow_C':'Crossbow',
};

const WEAP_SHORT: Record<string, string> = {
  'WeapHK416_C':'M416','WeapAK47_C':'AKM','WeapSCAR-L_C':'SCAR-L',
  'WeapMini14_C':'Mini 14','WeapKar98k_C':'Kar98k','WeapSKS_C':'SKS',
  'WeapAWM_C':'AWM','WeapM24_C':'M24','WeapUMP_C':'UMP45',
  'WeapVector_C':'Vector','WeapGroza_C':'Groza','WeapAUG_C':'AUG',
  'WeapQBZ95_C':'QBZ','WeapSLR_C':'SLR','WeapQBU88_C':'QBU',
  'WeapDP28_C':'DP-28','WeapM249_C':'M249','WeapUZI_C':'Micro UZI',
  'WeapTommy_C':'Tommy Gun','WeapWin94_C':'Win94','WeapSaiga12_C':'S12K',
  'WeapBerreta686_C':'S686','WeapWinchester_C':'S1897','WeapVSS_C':'VSS',
  'WeapMK14_C':'Mk14','WeapMosin_C':'Mosin','WeapM16A4_C':'M16A4',
  'WeapMk47Mutant_C':'Mk47 Mutant','WeapBerylM762_C':'Beryl M762',
  'WeapG36C_C':'G36C','WeapMP5K_C':'MP5K','WeapBizon_C':'Bizon',
  'WeapMG3_C':'MG3','WeapACE32_C':'ACE32','WeapK2_C':'K2',
  'WeapFAMAS_C':'FAMAS','WeapL6_C':'Lynx AMR','WeapP90_C':'P90','WeapMP9_C':'MP9',
  'WeapPan_C':'Pan','WeapMachete_C':'Machete','WeapSickle_C':'Sickle','WeapCrowbar_C':'Crowbar',
  'WeapDesert_Eagle_C':'Deagle','WeapM9_C':'P92','WeapRhino_C':'R45',
  'WeapNagantM1895_C':'R1895','WeapSkorpion_C':'Skorpion','WeapP18C_C':'P18C',
  'WeapG18_C':'P18C','WeapFlareGun_C':'Flare Gun','WeapCrossbow_C':'Crossbow',
  'WeapDoubleBarrel_C':'Double Barrel',
};

export function weaponName(raw: string): string {
  return WEAPON_NAMES[raw] || WEAP_SHORT[raw] || raw.replace(/^(Item_Weapon_|Weap)/, '').replace(/_C$/, '').replace(/_/g, ' ');
}

export const MAP_NAMES: Record<string, string> = {
  'Baltic_Main':'Erangel','Chimera_Main':'Paramo','Desert_Main':'Miramar',
  'DihorOtok_Main':'Vikendi','Erangel_Main':'Erangel','Heaven_Main':'Haven',
  'Kiki_Main':'Deston','Range_Main':'Camp Jackal','Savage_Main':'Sanhok',
  'Summerland_Main':'Karakin','Tiger_Main':'Taego','Neon_Main':'Rondo',
};

export function mapName(raw: string): string {
  if (MAP_NAMES[raw]) return MAP_NAMES[raw];
  const base = raw.replace(/_Main.*$/, '_Main');
  if (MAP_NAMES[base]) return MAP_NAMES[base];
  return raw.replace(/_Main.*$/, '');
}

export const TIER_ICONS: Record<string, string> = {
  'Bronze': '\u{1F949}', 'Silver': '\u{1F948}', 'Gold': '\u{1F947}',
  'Platinum': '\u{1F48E}', 'Diamond': '\u{1F4A0}', 'Master': '\u{1F3C6}', 'Grandmaster': '\u{1F451}'
};

export function formatTier(tierObj: TierInfo | null): { name: string; icon: string } {
  if (!tierObj || !tierObj.tier) return { name: 'Unranked', icon: '\u2014' };
  const name = tierObj.subTier ? `${tierObj.tier} ${tierObj.subTier}` : tierObj.tier;
  return { name, icon: TIER_ICONS[tierObj.tier] || '\u2014' };
}

export function timeAgo(dateStr: string, labels: Labels): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + (labels.ago_m || 'm ago');
  if (diff < 86400) return Math.floor(diff / 3600) + (labels.ago_h || 'h ago');
  return Math.floor(diff / 86400) + (labels.ago_d || 'd ago');
}

// Rate-limited fetch queue
const fetchQueue: { url: string; resolve: (r: Response) => void; reject: (e: any) => void }[] = [];
let fetching = false;

export function queueFetch(url: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    fetchQueue.push({ url, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (fetching || fetchQueue.length === 0) return;
  fetching = true;
  const { url, resolve, reject } = fetchQueue.shift()!;
  try {
    const r = await fetch(url, { headers: HEADERS });
    if (r.status === 429) {
      fetchQueue.unshift({ url, resolve, reject });
      await new Promise(r => setTimeout(r, 6500));
    } else {
      resolve(r);
    }
  } catch (e) { reject(e); }
  fetching = false;
  if (fetchQueue.length > 0) setTimeout(processQueue, 350);
}

export const MAP_COLORS: Record<string, string> = {
  'Erangel':'#2d8a4e','Miramar':'#c2a040','Sanhok':'#4a9e3f','Vikendi':'#5b8fb9',
  'Taego':'#8b6e4e','Deston':'#6b5b95','Karakin':'#d4a04a','Rondo':'#e06050',
  'Paramo':'#7a8b5c','Haven':'#4a6fa5',
};
