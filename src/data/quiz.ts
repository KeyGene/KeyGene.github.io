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
  RWSF: {
    code: 'RWSF',
    group: 'rush',
    nickname: { zh: '单排战神', en: 'Solo War God', ko: '솔로 전쟁의 신' },
    tagline: { zh: '单排天花板的钉子户', en: 'The solo-queue ceiling-dweller', ko: '솔로 큐의 천장' },
    description: { zh: '圈算得比数学家准，枪刚得比职业哥猛，单排天花板，排行榜钉子户', en: 'Calculates circles better than a mathematician, aims harder than pros. The ceiling of solo queue, permanently on the leaderboard.', ko: '자기장을 수학자보다 정확하게 계산하고, 프로보다 거세게 쏜다. 솔로 랭크의 천장, 리더보드 상주자.' },
    strengths: { zh: ['枪法在线', '意识顶级', '单排能力'], en: ['Deadly aim', 'Top game sense', 'Solo carry'], ko: ['치명적 에임', '최상급 판단력', '솔로 캐리'] },
    weaknesses: { zh: ['容易上头', '团队配合差'], en: ['Hot-headed', 'Poor teamwork'], ko: ['쉽게 흥분', '팀워크 부족'] },
    partner: ['RTSL'],
    nemesis: 'CWSF',
    image: '/assert/images/quiz/RWSF.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RWSF 里那种"输了也不破防"的玩家：连吃几把成盒，下一把仍能保持冷静推进。',
          en: "You're the RWSF who doesn't tilt — back-to-back losses don't slow you down next match.",
          ko: '연패해도 멘탈이 흔들리지 않는 RWSF — 바로 다음 판에서 평정심 유지.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RWSF 里那种"输一把研究三天"的玩家：被阴一次，回放、热区、反向找回，一定找回来。',
          en: "You're the RWSF who studies the loss for three days — one bad encounter and you'll grind until you reverse it.",
          ko: '한 판 지면 3일 동안 연구하는 RWSF — 한 번 당하면 반드시 되돌려놓는다.',
        },
      },
    },
  },
  RWSL: {
    code: 'RWSL',
    group: 'brain',
    nickname: { zh: '独狼', en: 'Lone Wolf', ko: '고독한 늑대' },
    tagline: { zh: '阴角里冒出来收人头的那个', en: 'Emerges from corners to collect kills', ko: '모서리에서 갑자기 등장하는 그 사람' },
    description: { zh: '全程阴在没人知道的角落，决赛圈突然冒出来收人头，击杀回放对面直接懵逼', en: 'Lurking in unknown corners the whole game, suddenly appears in final circle to clean up. Kill cam leaves enemies confused.', ko: '아무도 모르는 구석에 숨어있다가 최종 자기장에서 갑자기 나타나 정리한다. 킬캠 본 적이 멘붕.' },
    strengths: { zh: ['生存能力强', '收割意识', '隐蔽性强'], en: ['Great survival', 'Cleanup instinct', 'Master of stealth'], ko: ['뛰어난 생존력', '정리 본능', '은신의 달인'] },
    weaknesses: { zh: ['团战拉胯', '前期存在感低'], en: ['Weak in team fights', 'Low early presence'], ko: ['팀전에 약함', '초반 존재감 없음'] },
    partner: ['RTSF'],
    nemesis: 'CWIF',
    image: '/assert/images/quiz/RWSL.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RWSL 里那种"被发现了也无所谓"的玩家：阴人失手，换个角落继续等，心态稳如老狗。',
          en: "You're the RWSL who shrugs when spotted — caught lurking, just find another corner and settle in again.",
          ko: '들켜도 개의치 않는 RWSL — 발각되면 다른 구석으로 이동하고 다시 기다린다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RWSL 里那种"这局被绕背就记仇"的玩家：每次死于侧翼，下局必换位置、换路线，直到没人知道你在哪。',
          en: "You're the RWSL who logs every flank death — each time you get caught, next game you reroute and reposition until you're invisible.",
          ko: '측면 기습 당하면 반드시 복수하는 RWSL — 매번 죽은 위치를 기억하고 다음 판에 완전히 다른 경로로 간다.',
        },
      },
    },
  },
  RWIF: {
    code: 'RWIF',
    group: 'rush',
    nickname: { zh: '1V4莽夫', en: '1V4 Berserker', ko: '1대4 광전사' },
    tagline: { zh: '听到枪响血就上头', en: 'Gunfire is his caffeine', ko: '총소리만 들으면 흥분한다' },
    description: { zh: '听到枪响血直接上头，管他几个人莽就完了，赢了我是神输了就是伞兵', en: "Hears gunshots and blood starts pumping. Doesn't matter how many, just rush. Win = god, lose = bot.", ko: '총소리 들리면 피가 끓는다. 몇 명이든 상관없이 돌격. 이기면 신, 지면 봇.' },
    strengths: { zh: ['近战无敌', '反应快', '压迫力强'], en: ['CQB god', 'Fast reflexes', 'Overwhelming pressure'], ko: ['근접전 무적', '빠른 반응', '압도적 압박'] },
    weaknesses: { zh: ['容易送快递', '没有大局观'], en: ['Often becomes a loot box', 'No macro awareness'], ko: ['자주 택배 배달', '거시적 판단 없음'] },
    partner: ['CTSL'],
    nemesis: 'CTSF',
    image: '/assert/images/quiz/RWIF.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RWIF 里那种"莽死了就乐"的玩家：1V4 送包是常态，笑一声接着冲，输赢本来就在其次。',
          en: "You're the RWIF who laughs at every wipe — dying 1V4 is part of the fun, you queue up again with a grin.",
          ko: '1대4로 죽어도 웃는 RWIF — 다음 판에도 똑같이 돌격하면 그만, 이기고 지는 건 부차적인 일.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RWIF 里那种"莽死了要研究为什么"的玩家：每次1V4 团灭，回放、路线、时机，莽得要有章法。',
          en: "You're the RWIF who reviews every wipe — each 1V4 fail goes into the playbook so the next rush is smarter.",
          ko: '1대4 전멸 후 반드시 복기하는 RWIF — 리플레이 돌리고 다음 돌격은 더 영리하게 간다.',
        },
      },
    },
  },
  RWIL: {
    code: 'RWIL',
    group: 'brain',
    nickname: { zh: '野区仓鼠', en: 'Loot Hamster', ko: '파밍 햄스터' },
    tagline: { zh: '三级装备齐了还在搜', en: 'Still looting after he\'s fully kitted', ko: '풀파츠인데도 계속 파밍 중' },
    description: { zh: '专跳没人的野区疯狂舔包，三级头三级甲八倍镜全齐了还在搜，背包比枪法值钱', en: 'Drops in empty fields to loot endlessly. Full level 3 gear with 8x scope and still searching. Backpack worth more than aim.', ko: '아무도 없는 외진 곳에 떨어져서 미친 듯이 파밍. 3레벨 풀셋에 8배율까지 다 갖췄는데 아직도 파밍 중. 가방이 에임보다 비싸다.' },
    strengths: { zh: ['资源管理强', '生存率高', '装备豪华'], en: ['Resource management', 'High survival rate', 'Best gear'], ko: ['자원 관리', '높은 생존율', '최고급 장비'] },
    weaknesses: { zh: ['实战经验少', '关键时刻手抖'], en: ['Low combat experience', 'Chokes in clutch'], ko: ['실전 경험 부족', '중요한 순간 손이 떨림'] },
    partner: ['RWIF'],
    nemesis: 'RTSF',
    image: '/assert/images/quiz/RWIL.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RWIL 里那种"输了背包没空不算输"的玩家：关键圈手抖阵亡，笑着说"起码装备帅"，下局继续搜。',
          en: "You're the RWIL who finds peace in a full backpack — clutch fail or not, you'll loot even better next game.",
          ko: '가방만 꽉 차면 된다는 RWIL — 실전에서 손 떨려도 괜찮아, 다음 판에 더 잘 파밍하면 그만.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RWIL 里那种"决赛圈手抖死了绝对复盘"的玩家：装备全齐还输，说明实战缺练，搜完就要去刷枪感。',
          en: "You're the RWIL who grinds aim after every clutch fail — fully kitted and still lost means you need more combat reps.",
          ko: '풀파츠인데 실전에서 지면 반드시 복기하는 RWIL — 장비 문제가 아니라는 걸 알기에 에임 훈련 바로 시작.',
        },
      },
    },
  },
  RTSF: {
    code: 'RTSF',
    group: 'rush',
    nickname: { zh: '意识钢枪', en: 'Tactical Fragger', ko: '전술적 프래거' },
    tagline: { zh: '报点像开了雷达', en: 'Calls plays like he\'s on radar', ko: '레이더라도 단 듯한 콜' },
    description: { zh: '"左边232一个！烟雾弹拉了冲！" 报点像开了雷达，带队钢枪从没怂过', en: '"One at 232 left! Smoke\'s popped, push!" Callouts like a radar, leads pushes and never backs down.', ko: '"왼쪽 232에 한 명! 연막 터졌다, 돌격!" 콜아웃이 레이더급, 팀 돌격을 이끌며 절대 물러서지 않는다.' },
    strengths: { zh: ['报点精准', '指挥能力', '攻防意识'], en: ['Precise callouts', 'Leadership', 'Attack-defense awareness'], ko: ['정확한 콜아웃', '리더십', '공방 판단력'] },
    weaknesses: { zh: ['太强势', '队友跟不上节奏'], en: ['Too aggressive', "Teammates can't keep up"], ko: ['너무 공격적', '팀원이 못 따라옴'] },
    partner: ['RTSL'],
    nemesis: 'CTSL',
    image: '/assert/images/quiz/RTSF.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RTSF 里那种"队友没跟上也不急"的玩家：推进失败就收，下次调整节奏，永远不因一次崩盘发火。',
          en: "You're the RTSF who keeps cool when the push fails — regroup, reset the pace, never flame after a collapse.",
          ko: '돌격 실패해도 화내지 않는 RTSF — 다음 라운드에 페이스 조절하면 된다, 한 번 실패로 폭발하지 않는다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RTSF 里那种"队友没执行好要复盘"的玩家：每次进攻失败，时机、路线、报点全要拆开来分析。',
          en: "You're the RTSF who dissects every failed push — timing, route, callout, all broken down until the next push lands.",
          ko: '돌격이 실패할 때마다 철저히 분석하는 RTSF — 타이밍, 경로, 콜아웃 전부 해부해서 다음 돌격을 완성한다.',
        },
      },
    },
  },
  RTSL: {
    code: 'RTSL',
    group: 'brain',
    nickname: { zh: '舔包保姆', en: 'Loot Nanny', ko: '파밍 유모' },
    tagline: { zh: '把好装备全丢给队友', en: 'Drops every good drop for teammates', ko: '좋은 장비는 다 팀원에게' },
    description: { zh: '航线研究得比飞行员还细，搜完把三级甲和高倍镜全丢给队友，自己穿二级甲舔剩的', en: 'Studies flight paths more carefully than pilots. Gives all level 3 gear and scopes to teammates, wears level 2 leftovers.', ko: '항로를 조종사보다 세밀하게 연구한다. 3레벨 장비와 배율 스코프를 전부 팀원에게 주고 자기는 2레벨 남은 거 입는다.' },
    strengths: { zh: ['团队意识强', '资源分配好', '航线规划'], en: ['Great team player', 'Resource distribution', 'Flight path planning'], ko: ['뛰어난 팀 플레이', '자원 배분', '항로 계획'] },
    weaknesses: { zh: ['个人战力低', '太无私'], en: ['Low solo combat power', 'Too selfless'], ko: ['낮은 개인 전투력', '너무 희생적'] },
    partner: ['RWSF', 'RTSF'],
    nemesis: 'RWIF',
    image: '/assert/images/quiz/RTSL.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RTSL 里那种"送完装备输了也不心疼"的玩家：把三级甲丢完然后穿二级甲阵亡，反正是为了大家。',
          en: "You're the RTSL who has zero regrets after losing — you gave the level 3 gear away and died in level 2, and that's fine.",
          ko: '장비 다 주고 지더라도 후회 없는 RTSL — 팀을 위해 희생했으니 결과가 어떻든 마음이 편하다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RTSL 里那种"我把装备给你了你一定要赢"的玩家：无私分配只为最终吃鸡，输了会复盘谁没发挥好。',
          en: "You're the RTSL who expects a win in return for every gear drop — selfless yes, but losses get reviewed for accountability.",
          ko: '장비를 줬으면 반드시 이겨야 한다는 RTSL — 희생했는데 지면 누가 못했는지 반드시 복기한다.',
        },
      },
    },
  },
  RTIF: {
    code: 'RTIF',
    group: 'rush',
    nickname: { zh: '伞兵', en: 'Paratrooper', ko: '돌격병' },
    tagline: { zh: '落地就喊"拉我拉我"', en: 'Lands and immediately yells "rez me"', ko: '착지하자마자 "살려줘"' },
    description: { zh: '落地就冲，倒地就喊"拉我拉我"，扶起来继续莽，队友天天给他收尸', en: 'Rushes on landing, goes down screaming "pick me up!", gets revived and rushes again. Teammates collect his crate daily.', ko: '착지하자마자 돌격, 쓰러지면 "일으켜줘!" 외치고, 살아나면 또 돌격. 팀원들이 매일 시체 수습.' },
    strengths: { zh: ['永不服输', '勇气可嘉', '吸引火力'], en: ['Never gives up', 'Admirable courage', 'Great distraction'], ko: ['절대 포기 안 함', '대단한 용기', '어그로 끌기'] },
    weaknesses: { zh: ['疯狂送快递', '拖累队友'], en: ['Constant loot deliveries', 'Drags team down'], ko: ['끊임없는 택배 배달', '팀 발목 잡기'] },
    partner: ['CTIF'],
    nemesis: 'CWSF',
    image: '/assert/images/quiz/RTIF.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RTIF 里那种"送了就送了下局继续"的玩家：天天被抬，天天继续冲，反正伞兵不论输赢都乐在其中。',
          en: "You're the RTIF who treats every wipe as a warm-up — got carried today, charge again tomorrow, it's always fun either way.",
          ko: '매번 살려달라고 해도 전혀 개의치 않는 RTIF — 오늘도 택배, 내일도 돌격, 재밌으면 됐다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RTIF 里那种"老是第一个倒地必须改"的玩家：勇气不缺，但每次最先死，说明时机和路线要重新算。',
          en: "You're the RTIF who hates always being first down — courage is there but dying first every time means timing needs work.",
          ko: '항상 제일 먼저 쓰러지는 게 싫은 RTIF — 용기는 있지만 매번 먼저 죽는다면 타이밍을 다시 계산해야 한다.',
        },
      },
    },
  },
  RTIL: {
    code: 'RTIL',
    group: 'brain',
    nickname: { zh: '顺丰快递', en: 'Express Delivery', ko: '특급 택배' },
    tagline: { zh: '出门两秒变成空投', en: 'Two seconds out the door, two-second airdrop', ko: '문 열고 2초 만에 에어드롭' },
    description: { zh: '搜了一背包空投物资信心满满出门刚枪，两秒倒地，对面开开心心舔包签收', en: 'Fills backpack with airdrop loot, confidently pushes, gets knocked in 2 seconds. Enemy happily signs for the delivery.', ko: '에어드롭 물자로 가방 가득 채우고 자신만만하게 교전, 2초 만에 다운. 상대가 기분 좋게 택배 수령.' },
    strengths: { zh: ['搜刮效率高', '乐观心态', '永远有信心'], en: ['Efficient looting', 'Optimistic', 'Always confident'], ko: ['효율적인 파밍', '긍정적 마인드', '항상 자신감'] },
    weaknesses: { zh: ['装备白搜', '实战不行'], en: ['Loots for nothing', "Can't win fights"], ko: ['헛파밍', '실전에 약함'] },
    partner: ['CTSF'],
    nemesis: 'CWIF',
    image: '/assert/images/quiz/RTIL.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RTIL 里那种"送了好装备只是这局不顺"的玩家：两秒倒地，笑着说"他赚到了"，下局乐呵呵继续搜。',
          en: "You're the RTIL who laughs off every delivery — knocked in 2 seconds, you shrug and start looting again next game.",
          ko: '2초 만에 죽어도 웃어넘기는 RTIL — "상대가 좋은 거 먹었네" 하고 다음 판에 또 파밍 시작.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RTIL 里那种"这背包不能白搜"的玩家：搜了好装备被打死，必须搞清楚是时机差还是位置差，下次绝不白送。',
          en: "You're the RTIL who refuses to loot for nothing — every 2-second death gets a post-match debrief until the gear actually pays off.",
          ko: '헛파밍이 싫어서 반드시 복기하는 RTIL — 2초 만에 죽는 게 반복된다면 타이밍인지 포지션인지 반드시 원인을 찾는다.',
        },
      },
    },
  },
  CWSF: {
    code: 'CWSF',
    group: 'shadow',
    nickname: { zh: '伏地魔', en: 'Prone Sniper', ko: '엎드려 저격수' },
    tagline: { zh: '麦田里趴着等你路过', en: 'Prone in the wheat, waiting', ko: '밀밭에 엎드려서 기다린다' },
    description: { zh: '麦田里趴得跟地形贴图似的，架着8倍镜等你路过，800米爆头你连人都找不到', en: "Lies in wheat fields like a terrain texture. Waits with 8x scope, headshots you from 800m and you can't even find them.", ko: '밀밭에 지형 텍스처처럼 엎드려 있다가 8배율로 지나가는 걸 기다린다. 800m에서 헤드샷, 어디서 쐈는지도 모른다.' },
    strengths: { zh: ['狙击精准', '耐心极强', '隐蔽能力'], en: ['Sniper accuracy', 'Extreme patience', 'Perfect concealment'], ko: ['저격 정확도', '극한의 인내심', '완벽한 은폐'] },
    weaknesses: { zh: ['近战拉胯', '跑毒容易死'], en: ['Weak in CQB', 'Dies to zone'], ko: ['근접전 약함', '자기장에 죽음'] },
    partner: ['CTSL'],
    nemesis: 'RWIF',
    image: '/assert/images/quiz/CWSF.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CWSF 里那种"打偏了就换角度继续等"的玩家：一枪没打中不慌，重新趴好，下一颗子弹自然会到位。',
          en: "You're the CWSF who resets after a miss — one shot off means reposition, breathe, and wait for the next clean angle.",
          ko: '빗맞혀도 동요하지 않는 CWSF — 자세 다시 잡고 다음 각도에서 기다리면 된다, 서두를 필요 없다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CWSF 里那种"每次失手都要找原因"的玩家：800米打偏一发，一定复盘弹道、风偏、体位，绝不允许同样的错重现。',
          en: "You're the CWSF who logs every missed shot — 800m miss means a full review of trajectory, sway, and stance before the next session.",
          ko: '빗맞을 때마다 원인을 파악하는 CWSF — 800m 빗나감은 탄도, 흔들림, 자세까지 전부 복기해서 같은 실수를 반복하지 않는다.',
        },
      },
    },
  },
  CWSL: {
    code: 'CWSL',
    group: 'shadow',
    nickname: { zh: '跑毒专业户', en: 'Zone Runner', ko: '자기장 달리기 전문가' },
    tagline: { zh: '永远贴边跑毒', en: 'Always on the zone edge', ko: '항상 자기장 끝을 따라가는' },
    description: { zh: '毒圈路线算得比GPS还准，永远贴边跑毒苟命，决赛圈才冒出来阴人', en: 'Calculates zone routes better than GPS. Always edge-running the zone to survive, only appears in final circle to ambush.', ko: '자기장 경로를 GPS보다 정확하게 계산한다. 항상 가장자리를 타며 생존, 최종 자기장에서야 나타나 기습.' },
    strengths: { zh: ['跑毒意识', '生存能力', '决赛圈强'], en: ['Zone awareness', 'Survival skills', 'Strong in final circles'], ko: ['자기장 판단력', '생존 능력', '최종전에 강함'] },
    weaknesses: { zh: ['前期划水', '击杀少'], en: ['Passive early game', 'Low kills'], ko: ['초반 방관', '킬 수 적음'] },
    partner: ['CWSF'],
    nemesis: 'RTSF',
    image: '/assert/images/quiz/CWSL.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CWSL 里那种"最终圈阴人失败也行"的玩家：前期苟得好，结果没拿鸡，无所谓，路线本来就是正确的。',
          en: "You're the CWSL who's fine with a final-circle whiff — perfect zone run is its own reward whether or not the chicken comes.",
          ko: '최종전 기습 실패해도 괜찮은 CWSL — 자기장 루트는 완벽했다, 결과보다 과정이 맞았으면 됐다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CWSL 里那种"苟到决赛圈还没吃鸡说明收割时机没算好"的玩家：苟活只是手段，最后那刀一定要补上。',
          en: "You're the CWSL who demands the payoff — surviving to final circle and not winning means the cleanup timing needs fixing.",
          ko: '최종 자기장까지 살아남고도 못 이기면 반드시 이유를 찾는 CWSL — 생존은 수단이고 마지막 정리 타이밍을 반드시 개선한다.',
        },
      },
    },
  },
  CWIF: {
    code: 'CWIF',
    group: 'shadow',
    nickname: { zh: '厕所老六', en: 'Bathroom Camper', ko: '화장실 캠퍼' },
    tagline: { zh: '门后那个一开门就架枪的', en: 'The one camping behind the door', ko: '문 뒤에서 각 잡고 있는 그 사람' },
    description: { zh: '门后蹲、马桶旁、楼梯拐角全是他的工位，你推门那一刻他已经架好枪等你了', en: "Behind doors, beside toilets, stairwell corners — all his workstations. The moment you push the door, he's already aimed at you.", ko: '문 뒤, 변기 옆, 계단 코너 전부 그의 자리. 문 여는 순간 이미 조준하고 기다리고 있다.' },
    strengths: { zh: ['阴人一绝', '反应速度', '位置选择'], en: ['Ambush master', 'Fast reactions', 'Position selection'], ko: ['매복의 달인', '빠른 반응', '포지션 선정'] },
    weaknesses: { zh: ['被骂老六', '主动进攻弱'], en: ['Gets called a rat', 'Weak on offense'], ko: ['쥐캠이라 욕먹음', '공격에 약함'] },
    partner: ['CWSL'],
    nemesis: 'RTSF',
    image: '/assert/images/quiz/CWIF.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CWIF 里那种"被找到了就换个厕所"的玩家：阴人被识破，不急不躁，换个楼继续架枪等下一个推门的人。',
          en: "You're the CWIF who just picks a new bathroom when found — getting spotted is part of the game, a fresh corner is always nearby.",
          ko: '발각되면 그냥 다른 화장실 찾는 CWIF — 들키는 것도 게임의 일부, 새로운 코너는 항상 있다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CWIF 里那种"被识破说明这个位置人尽皆知"的玩家：阴人失败就更新位置库，绝不让同一个点被破防两次。',
          en: "You're the CWIF who retires exposed spots — get caught once and that position is blacklisted, the ambush library keeps growing.",
          ko: '한 번 들킨 위치는 다시 안 쓰는 CWIF — 같은 자리에서 두 번 당하는 건 절대 없다, 매복 포지션 데이터베이스를 계속 업데이트한다.',
        },
      },
    },
  },
  CWIL: {
    code: 'CWIL',
    group: 'shadow',
    nickname: { zh: '0杀吃鸡王', en: 'Zero Kill Winner', ko: '0킬 치킨디너 왕' },
    tagline: { zh: '全程零开枪决赛圈吃鸡', en: 'Wins without firing a shot', ko: '한 발도 안 쏘고 치킨 먹는' },
    description: { zh: '全程跑毒躲人一枪没开，决赛圈对面在毒里被毒死，大吉大利0杀吃鸡', en: 'Runs from zone, avoids everyone, never fires a shot. Last enemy dies to zone. Winner winner chicken dinner, 0 kills.', ko: '자기장 피하고 사람 피하고 총 한 발도 안 쏜다. 최종 자기장에서 상대가 자기장에 죽는다. 0킬 치킨디너.' },
    strengths: { zh: ['生存大师', '跑毒路线', '佛系心态'], en: ['Survival master', 'Zone routing', 'Zen mindset'], ko: ['생존 마스터', '자기장 경로', '무아지경 멘탈'] },
    weaknesses: { zh: ['没有战斗力', '刺激感为零'], en: ['Zero combat power', 'Zero excitement'], ko: ['전투력 제로', '스릴 제로'] },
    partner: ['RTSF'],
    nemesis: 'RWSF',
    image: '/assert/images/quiz/CWIL.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CWIL 里那种"0杀吃鸡就是最高艺术"的玩家：全程没开枪拿鸡，泰然自若，这才叫真正的生存哲学。',
          en: "You're the CWIL who sees 0-kill wins as pure art — zone out everything, let the world burn, and collect the chicken in peace.",
          ko: '0킬 치킨디너를 최고의 예술로 보는 CWIL — 모든 걸 피하고 마지막에 조용히 치킨을 먹는 것, 이게 진짜 생존 철학.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CWIL 里那种"0杀吃鸡也要优化路线"的玩家：每次都想把跑毒路线压缩到极致，0杀也要赢得最干净。',
          en: "You're the CWIL who optimizes every 0-kill run — there's always a cleaner route, a tighter timeline, a more perfect no-shot chicken.",
          ko: '0킬 치킨도 더 완벽하게 하고 싶은 CWIL — 매번 자기장 루트를 최적화해서 가장 깔끔한 0킬 우승을 목표로 한다.',
        },
      },
    },
  },
  CTSF: {
    code: 'CTSF',
    group: 'leader',
    nickname: { zh: '占楼钉子户', en: 'Building Squatter', ko: '건물 점거왕' },
    tagline: { zh: '占了楼就当自己家', en: 'Occupies a building like he owns it', ko: '건물 하나 잡으면 자기 집인 줄' },
    description: { zh: '"卡窗架枪谁都别动！" 占了楼就当自己家，交叉火力摆满，攻楼的全成快递员', en: '"Hold windows, nobody move!" Takes a building and calls it home. Crossfire everywhere, attackers become loot deliveries.', ko: '"창문 잡고 아무도 움직이지 마!" 건물 점거하면 내 집처럼 쓴다. 크로스파이어 깔아놓으면 공격자들은 전부 택배기사.' },
    strengths: { zh: ['防守大师', '交叉火力', '团队协调'], en: ['Defense master', 'Crossfire setup', 'Team coordination'], ko: ['수비 마스터', '크로스파이어', '팀 협동'] },
    weaknesses: { zh: ['机动性差', '被绕容易崩'], en: ['Low mobility', 'Collapses when flanked'], ko: ['기동성 부족', '우회당하면 무너짐'] },
    partner: ['CTIF'],
    nemesis: 'RWIF',
    image: '/assert/images/quiz/CTSF.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CTSF 里那种"楼被打穿了就换楼"的玩家：阵地失守不慌乱，迅速找下一栋楼，防守指挥从不失控。',
          en: "You're the CTSF who calmly moves to the next building — losing one fort doesn't break you, there's always another floor to hold.",
          ko: '건물이 뚫려도 당황하지 않는 CTSF — 진지를 잃으면 다음 건물로 이동, 수비 지휘는 항상 냉정하게 유지.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CTSF 里那种"楼被打穿说明交叉火力没架好"的玩家：每次阵地失守必须复盘，窗口分配、掩护角度，一处都不能差。',
          en: "You're the CTSF who treats every breached building as a failure report — crossfire gaps get identified and closed before the next hold.",
          ko: '건물이 뚫릴 때마다 반드시 복기하는 CTSF — 창문 배치, 커버 각도 전부 점검해서 같은 구멍이 생기지 않도록 한다.',
        },
      },
    },
  },
  CTSL: {
    code: 'CTSL',
    group: 'leader',
    nickname: { zh: '苟王', en: 'Stealth King', ko: '생존왕' },
    tagline: { zh: '全程不开枪决赛圈收割', en: 'Silent run, final-circle harvest', ko: '끝까지 안 쏘다가 막판에 정리' },
    description: { zh: '带队跑毒避战发育一条龙，全程不开一枪，决赛圈三队互打的时候出来收割吃鸡', en: 'Leads team through zone-running, avoidance, and farming. Zero shots fired until final circle when 3 teams fight and they clean up.', ko: '팀을 이끌고 자기장 타면서 교전 회피하고 파밍 올인. 총 한 발도 안 쏘다가 최종전에서 3팀이 싸울 때 나타나서 정리하고 치킨디너.' },
    strengths: { zh: ['大局观强', '指挥能力', '收割时机'], en: ['Great macro sense', 'Command ability', 'Perfect cleanup timing'], ko: ['뛰어난 거시적 판단', '지휘 능력', '완벽한 정리 타이밍'] },
    weaknesses: { zh: ['太保守', '队友嫌无聊'], en: ['Too passive', 'Teammates find it boring'], ko: ['너무 소극적', '팀원들이 지루해함'] },
    partner: ['CWSF'],
    nemesis: 'RTSF',
    image: '/assert/images/quiz/CTSL.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CTSL 里那种"没收到割也无所谓"的玩家：带队苟到最后，时机没来就撤，结果不理想也不影响下一局指挥。',
          en: "You're the CTSL who accepts a missed harvest — led the team to final circle, timing didn't align, and that's okay for next time.",
          ko: '최종전 타이밍을 놓쳐도 괜찮은 CTSL — 팀을 잘 이끌었으면 됐다, 결과가 아쉬워도 다음 판에 영향 없다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CTSL 里那种"苟到最后没吃鸡就是收割时机没对"的玩家：每次决赛圈复盘，三方交火哪一秒插刀最划算。',
          en: "You're the CTSL who reviews every third-party window — if the chicken slipped away, it means you need to find the exact right second to push.",
          ko: '최종전 타이밍을 반드시 분석하는 CTSL — 치킨 못 먹었다면 3자 교전 중 어느 순간에 끼어들었어야 하는지 복기한다.',
        },
      },
    },
  },
  CTIF: {
    code: 'CTIF',
    group: 'leader',
    nickname: { zh: '描边急救包', en: 'Walking Medkit', ko: '걸어다니는 구급상자' },
    tagline: { zh: '拉烟扶人比 120 还快', en: 'Smokes and revives faster than 911', ko: '연막+살리기는 119보다 빠른' },
    description: { zh: '子弹完美描边就是打不中人，但拉烟扶队友比120还快，队伍编外急救箱', en: "Bullets trace perfect outlines but never hit. Smoke + revive faster than an ambulance. The team's unofficial first aid kit.", ko: '총알이 완벽하게 윤곽만 그리고 안 맞는다. 하지만 연막 치고 부활시키는 건 구급차보다 빠르다. 팀의 비공식 구급상자.' },
    strengths: { zh: ['拉烟扶人快', '团队精神', '永不放弃'], en: ['Fast smoke revives', 'Team spirit', 'Never gives up'], ko: ['빠른 연막 부활', '팀 정신', '절대 포기 안 함'] },
    weaknesses: { zh: ['枪法描边', '输出基本为零'], en: ["Can't aim", 'Near-zero damage output'], ko: ['에임 없음', '데미지 거의 제로'] },
    partner: ['RTSF'],
    nemesis: 'RWSF',
    image: '/assert/images/quiz/CTIF.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CTIF 里那种"打不中人没关系扶起来就行"的玩家：子弹描边是特色，只要队友活着最终赢了，你的工作就完成了。',
          en: "You're the CTIF who's at peace with zero damage — teammates alive and winning is the only score that matters to you.",
          ko: '데미지 0이어도 편안한 CTIF — 팀원이 살아있고 이기면 그게 내 역할을 다한 것, 에임은 부차적인 문제.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CTIF 里那种"总不能永远不输出"的玩家：拉烟扶人没问题，但每次全队输出只靠别人，你知道自己迟早要练枪。',
          en: "You're the CTIF who knows the aim gap has to close — smoke revives are locked in, now it's time to grind until the bullets actually land.",
          ko: '언젠가는 에임도 키워야 한다는 걸 아는 CTIF — 연막 부활은 완벽하지만 데미지 0이 반복되면 반드시 에임 훈련을 시작한다.',
        },
      },
    },
  },
  CTIL: {
    code: 'CTIL',
    group: 'leader',
    nickname: { zh: '快乐组排', en: 'Happy Squad', ko: '즐거운 스쿼드' },
    tagline: { zh: '跑毒路上唱歌讲段子', en: 'Sings and jokes through the rotation', ko: '자기장 도는 길에 노래하고 농담' },
    description: { zh: '跑毒路上唱歌讲段子，队友倒了先笑再扶，吃不吃鸡不重要开黑就是快乐', en: "Sings and tells jokes while running from zone. Teammate goes down — laughs first, revives second. Winning doesn't matter, playing together is the fun.", ko: '자기장 피하면서 노래하고 개그한다. 팀원 다운되면 먼저 웃고 그다음 살린다. 치킨디너는 중요하지 않다, 같이 노는 게 즐거우니까.' },
    strengths: { zh: ['团队氛围', '心态超好', '快乐源泉'], en: ['Great vibes', 'Best attitude', 'Source of joy'], ko: ['좋은 분위기', '최고의 멘탈', '즐거움의 원천'] },
    weaknesses: { zh: ['不认真打', '经常坑队友'], en: ["Doesn't take it seriously", 'Often trolls teammates'], ko: ['진지하지 않음', '자주 팀원 트롤'] },
    partner: ['CTIF'],
    nemesis: 'RWSF',
    image: '/assert/images/quiz/CTIL.webp',
    variants: {
      E: {
        label: { zh: '淡定型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CTIL 里那种"输了也能讲出三个段子的"玩家：全队阵亡语音里还在哈哈大笑，下局继续，开黑本来就是为了开心。',
          en: "You're the CTIL who has three jokes ready after a wipe — squad gone, mic still going, next game queued, having fun is the whole point.",
          ko: '팀 전멸 후에도 개그 세 개는 준비되어 있는 CTIL — 다 죽어도 웃음소리는 끊기지 않고, 다음 판 바로 큐, 즐거우면 됐다.',
        },
      },
      D: {
        label: { zh: '求胜型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CTIL 里那种"笑着笑着也想赢"的玩家：欢乐氛围不减，但鸡没吃到心里还是有点痒，段子讲完了还是要研究一下战术。',
          en: "You're the CTIL who keeps the jokes but still wants the win — fun squad energy all game, and yet not getting chicken still stings a little.",
          ko: '웃으면서도 이기고 싶은 CTIL — 즐거운 분위기는 유지하지만 치킨 못 먹으면 살짝 아쉽고, 개그 끝나면 전술 분석도 한다.',
        },
      },
    },
  },
};
