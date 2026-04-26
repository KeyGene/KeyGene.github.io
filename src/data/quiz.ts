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
  { id: 1,  dim: 'RC', direction:  1, text: { zh: '刚落地听到脚步声我会立刻冲过去刚枪。', en: 'When I hear footsteps right after landing, I rush in to fight.', ko: '착지 직후 발소리가 들리면 바로 달려가서 싸운다.' } },
  { id: 2,  dim: 'RC', direction:  1, text: { zh: '我喜欢主动找架打而不是等别人先动手。', en: 'I prefer to push fights rather than wait for enemies to come to me.', ko: '적이 먼저 치기를 기다리는 것보다 내가 먼저 교전을 걸고 싶다.' } },
  { id: 3,  dim: 'RC', direction:  1, text: { zh: '看到敌人在 200 米外的空旷地带我会冲过去。', en: 'I chase an enemy spotted in the open even at 200 meters.', ko: '200미터 밖 개활지에 적이 보이면 돌격한다.' } },
  { id: 4,  dim: 'RC', direction:  1, text: { zh: '决赛圈我宁可主动出击也不愿意被动包夹。', en: 'In the final circle I would rather push than sit back and get flanked.', ko: '최종 자기장에서 포위당하느니 먼저 치고 나간다.' } },
  { id: 5,  dim: 'RC', direction:  1, text: { zh: '三级装备到位我马上想出去找人打。', en: 'The moment I get level 3 gear I want to go hunt people down.', ko: '3레벨 장비가 갖춰지면 바로 나가서 싸우고 싶다.' } },
  { id: 6,  dim: 'RC', direction: -1, text: { zh: '听到枪声我的第一反应是先离远点观察。', en: 'When I hear gunshots my first instinct is to back off and observe.', ko: '총소리가 들리면 먼저 거리를 벌리고 관찰하는 게 본능이다.' } },
  { id: 7,  dim: 'RC', direction: -1, text: { zh: '宁可绕路十分钟也不愿意正面冲一栋楼。', en: 'I would rather take a ten-minute detour than rush a building head-on.', ko: '10분을 돌아가더라도 건물을 정면 돌격하고 싶지 않다.' } },
  { id: 8,  dim: 'WT', direction:  1, text: { zh: '单排比四排让我更舒服。', en: 'I\'m more comfortable playing solo than in a 4-stack.', ko: '4인 스쿼드보다 솔로 플레이가 더 편하다.' } },
  { id: 9,  dim: 'WT', direction:  1, text: { zh: '我宁可一个人安静练枪也不想跟队友语音吹牛。', en: 'I would rather grind aim training in silence than voice-chat and goof off with teammates.', ko: '팀원과 잡담하며 보이스채팅하는 것보다 혼자 조용히 에임 연습하는 게 낫다.' } },
  { id: 10, dim: 'WT', direction:  1, text: { zh: '队友倒了如果会暴露我位置我会先打赢再扶。', en: 'If reviving a downed teammate would expose my position I finish the fight first.', ko: '팀원을 살리다 내 위치가 노출되면 먼저 교전을 끝내고 살린다.' } },
  { id: 11, dim: 'WT', direction:  1, text: { zh: '我相信自己的枪法胜过相信队友的报点。', en: 'I trust my own aim more than I trust my teammates\' callouts.', ko: '팀원의 콜아웃보다 내 에임을 더 믿는다.' } },
  { id: 12, dim: 'WT', direction:  1, text: { zh: '排位我更喜欢挂机随机匹配的陌生人。', en: 'In ranked I prefer queuing with random strangers over a premade group.', ko: '랭크에서 팀 짜고 들어가는 것보다 낯선 사람과 랜덤 매칭하는 게 더 낫다.' } },
  { id: 13, dim: 'WT', direction: -1, text: { zh: '搜到多余的好装备我会立刻丢给队友。', en: 'When I find duplicate good gear I immediately pass it to a teammate.', ko: '좋은 장비가 남으면 바로 팀원에게 건네준다.' } },
  { id: 14, dim: 'WT', direction: -1, text: { zh: '队友倒地哪怕拉烟硬冲我也要扶。', en: 'I will always revive a downed teammate even if it means popping smoke and pushing through.', ko: '연막을 터뜨리고 돌격해야 해도 반드시 팀원을 살린다.' } },
  { id: 15, dim: 'SI', direction:  1, text: { zh: '第一个圈一刷出来我就立刻规划转移路线。', en: 'The moment the first circle appears I plan the rotation.', ko: '첫 자기장이 뜨자마자 이동 경로를 계획한다.' } },
  { id: 16, dim: 'SI', direction:  1, text: { zh: '我会研究航线和圈刷新概率来判断落点。', en: 'I study the flight path and circle odds to pick my drop spot.', ko: '항로와 자기장 확률을 분석해서 착지 지점을 정한다.' } },
  { id: 17, dim: 'SI', direction:  1, text: { zh: '我喜欢提前占好位置等敌人主动撞上来。', en: 'I like to set up position early and let enemies walk into me.', ko: '미리 좋은 자리를 잡고 적이 스스로 다가올 때까지 기다리는 걸 좋아한다.' } },
  { id: 18, dim: 'SI', direction:  1, text: { zh: '决赛圈我会先想清楚再开枪。', en: 'In the final circle I think through the situation before I start shooting.', ko: '최종 자기장에서는 교전 전에 먼저 상황을 파악하고 생각한다.' } },
  { id: 19, dim: 'SI', direction:  1, text: { zh: '看到敌人我会先记位置稍后再处理而不是立刻交火。', en: 'When I spot an enemy I note their position and deal with them later rather than engaging immediately.', ko: '적을 발견하면 즉시 교전하지 않고 위치를 기억해뒀다가 나중에 처리한다.' } },
  { id: 20, dim: 'SI', direction: -1, text: { zh: '看到敌人我直接开车撞过去最痛快。', en: 'When I see an enemy the most satisfying play is just ramming them with a vehicle.', ko: '적을 보면 차로 그냥 박아버리는 게 제일 통쾌하다.' } },
  { id: 21, dim: 'SI', direction: -1, text: { zh: '听到枪响管他几个人，先冲再说。', en: 'Gunshots nearby? I charge in first and worry about how many there are later.', ko: '총소리가 들리면 몇 명인지 상관없이 일단 돌격부터 한다.' } },
  { id: 22, dim: 'FL', direction:  1, text: { zh: '我跳点选热门点位就为了找架打。', en: 'I drop into hot-zone POIs specifically to find fights.', ko: '교전을 찾아 일부러 핫존에 떨어진다.' } },
  { id: 23, dim: 'FL', direction:  1, text: { zh: '比起搜物资我更想找人对枪。', en: 'I would rather go find a gunfight than loot buildings.', ko: '파밍보다 적을 찾아 총싸움하는 게 더 좋다.' } },
  { id: 24, dim: 'FL', direction:  1, text: { zh: '枪法练好比装备齐全更重要。', en: 'Sharpening your aim matters more than having full gear.', ko: '장비를 갖추는 것보다 에임을 키우는 게 더 중요하다.' } },
  { id: 25, dim: 'FL', direction:  1, text: { zh: '我宁可拿三级甲打十枪也不要四级甲蹲在房里。', en: 'I would rather take ten gunfights in level 3 vest than camp indoors with a level 4.', ko: '4레벨 조끼 입고 집에 숨는 것보다 3레벨로 열 번 싸우는 게 낫다.' } },
  { id: 26, dim: 'FL', direction:  1, text: { zh: '本局零杀吃鸡对我来说没意思。', en: 'Winning with zero kills is a boring chicken dinner to me.', ko: '킬 없이 치킨 먹는 건 재미없다.' } },
  { id: 27, dim: 'FL', direction: -1, text: { zh: '落地优先把整片房区搜干净。', en: 'Right after landing I focus on clearing out the whole building cluster first.', ko: '착지하면 먼저 건물 지역 전체를 싹 다 파밍한다.' } },
  { id: 28, dim: 'FL', direction: -1, text: { zh: '看到八倍镜我比看到敌人还兴奋。', en: 'Finding an 8x scope gets me more hyped than spotting an enemy.', ko: '8배율 스코프를 찾으면 적을 발견한 것보다 더 흥분된다.' } },
  { id: 29, dim: 'ED', direction:  1, text: { zh: '比赛输了我能很快放下接着打下一局。', en: 'After a loss I move on quickly to the next match.', ko: '한 판 지면 빠르게 털어내고 다음 판으로 간다.' } },
  { id: 30, dim: 'ED', direction:  1, text: { zh: '成盒后我不会反复看回放找不甘心的地方。', en: 'After getting knocked I don\'t keep rewatching the kill cam looking for what I missed.', ko: '다운된 후 미련이 남는 장면을 찾으려고 킬캠을 반복해서 돌려보지 않는다.' } },
  { id: 31, dim: 'ED', direction:  1, text: { zh: '队友失误骂我我也不会破防。', en: 'Even when teammates blame me for their mistakes, I stay calm.', ko: '팀원이 자기 실수를 나한테 뒤집어씌워도 멘탈이 흔들리지 않는다.' } },
  { id: 32, dim: 'ED', direction:  1, text: { zh: '段位掉了一截我也不会立刻打到打回来为止。', en: 'I don\'t grind back rank loss the same night.', ko: '티어가 떨어져도 당장 그날 밤 되찾겠다고 연속으로 돌리지 않는다.' } },
  { id: 33, dim: 'ED', direction:  1, text: { zh: '对枪输了我归结为对面运气好而不是自己菜。', en: 'When I lose a gunfight I chalk it up to their luck, not my skill.', ko: '총싸움에서 지면 내 실력이 아닌 상대 운이 좋았다고 생각한다.' } },
  { id: 34, dim: 'ED', direction: -1, text: { zh: '被同一个人打死两次我会研究他的打法。', en: 'Getting killed twice by the same player makes me study their playstyle.', ko: '같은 사람한테 두 번 죽으면 그 사람 플레이 스타일을 분석한다.' } },
  { id: 35, dim: 'ED', direction: -1, text: { zh: '排位掉分我会反复研究战绩复盘。', en: 'After losing rank points I go back and review my match stats carefully.', ko: '랭크 점수가 깎이면 전적을 꼼꼼히 복기한다.' } },
];

export const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  // Task 4 fills in 16 entries here
};
