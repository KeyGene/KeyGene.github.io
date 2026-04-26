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
  // Task 2 fills in 35 entries here
];

export const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  // Task 4 fills in 16 entries here
};
