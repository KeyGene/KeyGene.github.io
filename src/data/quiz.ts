// src/data/quiz.ts — Phase 1 rewrite for 16personalities-style quiz

// ─── Types ─────────────────────────────────────────────────────────────

export type DimCode = 'RC' | 'WT' | 'SI' | 'FL' | 'ED';
export type Pole = 'R' | 'C' | 'W' | 'T' | 'S' | 'I' | 'F' | 'L' | 'E' | 'D';
/** All 16 valid 4-letter base codes (RWSF, RWSL, ..., CTIL). Excludes the variant suffix. */
export type TypeCode = `${'R' | 'C'}${'W' | 'T'}${'S' | 'I'}${'F' | 'L'}`;
export type Variant = 'E' | 'D';
export type GroupId = 'rush' | 'brain' | 'shadow' | 'leader';
export type Lang = 'zh' | 'en' | 'ko';

export interface I18n {
  zh: string;
  en: string;
  ko: string;
}
export interface I18nList {
  zh: string[];
  en: string[];
  ko: string[];
}

export interface QuizQuestion {
  id: number;          // 1..35
  dim: DimCode;        // which dimension this question scores
  direction: 1 | -1;   // +1: agree → first pole (R/W/S/F/E); -1: agree → second pole (C/T/I/L/D)
  text: I18n;          // single-statement, first-person, ~15-30 chars in zh
}

export interface PersonalityType {
  code: TypeCode;      // 4-letter base code (variant suffix is NOT stored on type — applied at runtime)
  group: GroupId;
  nickname: I18n;
  tagline: I18n;       // NEW — ~25 char one-liner shown in result hero + types overview
  description: I18n;   // existing — used in result page "描述" section
  strengths: I18nList;
  weaknesses: I18nList;
  partner: string[];   // codes (4 letters)
  nemesis: string;     // code (4 letters)
  image: string;       // path to character image
  variants: {          // NEW — A/D differentiation copy
    E: { label: I18n; blurb: I18n };  // ~80 char description of "Even" variant of this type
    D: { label: I18n; blurb: I18n };  // ~80 char description of "Driven" variant of this type
  };
  // Phase 3 fields (optional, may be empty in Phase 1):
  heroDescription?: I18n;
  sections?: Array<{
    id: 'core' | 'teamwork' | 'tactics';
    title: I18n;
    body: I18n;
  }>;
}

// ─── Constants ─────────────────────────────────────────────────────────

export const GROUP_COLORS: Record<GroupId, string> = {
  rush: '#EE3F2C',
  brain: '#7B5EA7',
  shadow: '#2D7D46',
  leader: '#D4A017',
};

export const GROUP_INFO: Record<GroupId, I18n> = {
  rush:   { zh: '猛攻组 Rush',   en: 'Rush Group',   ko: '돌격조 Rush' },
  brain:  { zh: '谋略组 Brain',  en: 'Brain Group',  ko: '전략조 Brain' },
  shadow: { zh: '潜伏组 Shadow', en: 'Shadow Group', ko: '잠복조 Shadow' },
  leader: { zh: '指挥组 Leader', en: 'Leader Group', ko: '지휘조 Leader' },
};

export const DIMENSION_LABELS: Record<DimCode, { left: I18n; right: I18n; name: I18n }> = {
  RC: {
    left:  { zh: '钢枪 Rush',     en: 'Rush',       ko: '돌격 Rush' },
    right: { zh: '苟活 Cautious', en: 'Cautious',   ko: '신중 Cautious' },
    name:  { zh: '战斗风格',       en: 'Combat Style', ko: '전투 스타일' },
  },
  WT: {
    left:  { zh: '独狼 Solo', en: 'Solo', ko: '솔로 Solo' },
    right: { zh: '开黑 Team', en: 'Team', ko: '팀 Team' },
    name:  { zh: '社交倾向', en: 'Social Style', ko: '소셜 성향' },
  },
  SI: {
    left:  { zh: '算圈 Strategic', en: 'Strategic', ko: '전략 Strategic' },
    right: { zh: '莽夫 Instinct',  en: 'Instinct',  ko: '본능 Instinct' },
    name:  { zh: '决策方式', en: 'Decision Making', ko: '의사결정' },
  },
  FL: {
    left:  { zh: '刚枪 Fight', en: 'Fight', ko: '교전 Fight' },
    right: { zh: '打野 Loot',  en: 'Loot',  ko: '파밍 Loot' },
    name:  { zh: '资源取向', en: 'Resource Style', ko: '자원 성향' },
  },
  ED: {
    left:  { zh: '淡定 Even',   en: 'Even',   ko: '평정 Even' },
    right: { zh: '求胜 Driven', en: 'Driven', ko: '승부욕 Driven' },
    name:  { zh: '心态',         en: 'Identity', ko: '정체성' },
  },
};

// ─── Scoring helpers ───────────────────────────────────────────────────

export interface DimScores {
  RC: number; WT: number; SI: number; FL: number; ED: number;
}

export const ZERO_SCORES: DimScores = { RC: 0, WT: 0, SI: 0, FL: 0, ED: 0 };

/**
 * Convert a Likert circle position (0..6, 0 = strongly agree, 6 = strongly disagree)
 * + a question's direction into a signed contribution in [-3, 3].
 */
export function contribution(circleIndex: number, direction: 1 | -1): number {
  return (3 - circleIndex) * direction;
}

/**
 * From accumulated dimension scores, compute the 4-letter base code + variant suffix.
 * Score >= 0 picks the first pole (R/W/S/F/E), score < 0 picks the second (C/T/I/L/D).
 */
export function scoreToCode(scores: DimScores): { code: TypeCode; variant: Variant } {
  const code = (
    (scores.RC >= 0 ? 'R' : 'C') +
    (scores.WT >= 0 ? 'W' : 'T') +
    (scores.SI >= 0 ? 'S' : 'I') +
    (scores.FL >= 0 ? 'F' : 'L')
  ) as TypeCode;
  const variant: Variant = scores.ED >= 0 ? 'E' : 'D';
  return { code, variant };
}

/**
 * Convert a single-dimension score (-21..+21) to a percentage (0..100) toward the first pole.
 * 100 = fully first pole, 0 = fully second pole, 50 = balanced.
 */
export function scoreToPercent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(((score + 21) / 42) * 100)));
}

// ─── Questions and types: filled in subsequent tasks ───────────────────

export const QUESTIONS: QuizQuestion[] = [
  { id: 1,  dim: 'RC', direction:  1, text: { zh: '刚落地听到脚步声我会立刻冲过去刚枪。', en: '', ko: '' } },
  { id: 2,  dim: 'RC', direction:  1, text: { zh: '我喜欢主动找架打而不是等别人先动手。', en: '', ko: '' } },
  { id: 3,  dim: 'RC', direction:  1, text: { zh: '看到敌人在 200 米外的空旷地带我会冲过去。', en: '', ko: '' } },
  { id: 4,  dim: 'RC', direction:  1, text: { zh: '决赛圈我宁可主动出击也不愿意被动包夹。', en: '', ko: '' } },
  { id: 5,  dim: 'RC', direction:  1, text: { zh: '三级装备到位我马上想出去找人打。', en: '', ko: '' } },
  { id: 6,  dim: 'RC', direction: -1, text: { zh: '听到枪声我的第一反应是先离远点观察。', en: '', ko: '' } },
  { id: 7,  dim: 'RC', direction: -1, text: { zh: '宁可绕路十分钟也不愿意正面冲一栋楼。', en: '', ko: '' } },
  { id: 8,  dim: 'WT', direction:  1, text: { zh: '单排比四排让我更舒服。', en: '', ko: '' } },
  { id: 9,  dim: 'WT', direction:  1, text: { zh: '我宁可一个人安静练枪也不想跟队友语音吹牛。', en: '', ko: '' } },
  { id: 10, dim: 'WT', direction:  1, text: { zh: '队友倒了如果会暴露我位置我会先打赢再扶。', en: '', ko: '' } },
  { id: 11, dim: 'WT', direction:  1, text: { zh: '我相信自己的枪法胜过相信队友的报点。', en: '', ko: '' } },
  { id: 12, dim: 'WT', direction:  1, text: { zh: '排位我更喜欢挂机随机匹配的陌生人。', en: '', ko: '' } },
  { id: 13, dim: 'WT', direction: -1, text: { zh: '搜到多余的好装备我会立刻丢给队友。', en: '', ko: '' } },
  { id: 14, dim: 'WT', direction: -1, text: { zh: '队友倒地哪怕拉烟硬冲我也要扶。', en: '', ko: '' } },
  { id: 15, dim: 'SI', direction:  1, text: { zh: '第一个圈一刷出来我就立刻规划转移路线。', en: '', ko: '' } },
  { id: 16, dim: 'SI', direction:  1, text: { zh: '我会研究航线和圈刷新概率来判断落点。', en: '', ko: '' } },
  { id: 17, dim: 'SI', direction:  1, text: { zh: '我喜欢提前占好位置等敌人主动撞上来。', en: '', ko: '' } },
  { id: 18, dim: 'SI', direction:  1, text: { zh: '决赛圈我会先想清楚再开枪。', en: '', ko: '' } },
  { id: 19, dim: 'SI', direction:  1, text: { zh: '看到敌人我会先记位置稍后再处理而不是立刻交火。', en: '', ko: '' } },
  { id: 20, dim: 'SI', direction: -1, text: { zh: '看到敌人我直接开车撞过去最痛快。', en: '', ko: '' } },
  { id: 21, dim: 'SI', direction: -1, text: { zh: '听到枪响管他几个人，先冲再说。', en: '', ko: '' } },
  { id: 22, dim: 'FL', direction:  1, text: { zh: '我跳点选热门点位就为了找架打。', en: '', ko: '' } },
  { id: 23, dim: 'FL', direction:  1, text: { zh: '比起搜物资我更想找人对枪。', en: '', ko: '' } },
  { id: 24, dim: 'FL', direction:  1, text: { zh: '枪法练好比装备齐全更重要。', en: '', ko: '' } },
  { id: 25, dim: 'FL', direction:  1, text: { zh: '我宁可拿三级甲打十枪也不要四级甲蹲在房里。', en: '', ko: '' } },
  { id: 26, dim: 'FL', direction:  1, text: { zh: '本局零杀吃鸡对我来说没意思。', en: '', ko: '' } },
  { id: 27, dim: 'FL', direction: -1, text: { zh: '落地优先把整片房区搜干净。', en: '', ko: '' } },
  { id: 28, dim: 'FL', direction: -1, text: { zh: '看到八倍镜我比看到敌人还兴奋。', en: '', ko: '' } },
  { id: 29, dim: 'ED', direction:  1, text: { zh: '比赛输了我能很快放下接着打下一局。', en: '', ko: '' } },
  { id: 30, dim: 'ED', direction:  1, text: { zh: '成盒后我不会反复看回放找不甘心的地方。', en: '', ko: '' } },
  { id: 31, dim: 'ED', direction:  1, text: { zh: '队友失误骂我我也不会破防。', en: '', ko: '' } },
  { id: 32, dim: 'ED', direction:  1, text: { zh: '段位掉了一截我也不会立刻打到打回来为止。', en: '', ko: '' } },
  { id: 33, dim: 'ED', direction:  1, text: { zh: '对枪输了我归结为对面运气好而不是自己菜。', en: '', ko: '' } },
  { id: 34, dim: 'ED', direction: -1, text: { zh: '被同一个人打死两次我会研究他的打法。', en: '', ko: '' } },
  { id: 35, dim: 'ED', direction: -1, text: { zh: '排位掉分我会反复研究战绩复盘。', en: '', ko: '' } },
];

export const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  // Task 4 fills in 16 entries here
};
