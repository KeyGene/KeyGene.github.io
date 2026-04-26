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
    left:  { zh: '干拉 Rush',     en: 'Rush',       ko: '돌격 Rush' },
    right: { zh: '老六 Cautious', en: 'Cautious',   ko: '신중 Cautious' },
    name:  { zh: '战斗风格',       en: 'Combat Style', ko: '전투 스타일' },
  },
  WT: {
    left:  { zh: '独狼 Solo', en: 'Solo', ko: '솔로 Solo' },
    right: { zh: '开黑 Team', en: 'Team', ko: '팀 Team' },
    name:  { zh: '社交倾向', en: 'Social Style', ko: '소셜 성향' },
  },
  SI: {
    left:  { zh: '运营 Strategic', en: 'Strategic', ko: '전략 Strategic' },
    right: { zh: '莽夫 Instinct',  en: 'Instinct',  ko: '본능 Instinct' },
    name:  { zh: '决策方式', en: 'Decision Making', ko: '의사결정' },
  },
  FL: {
    left:  { zh: '刚枪 Fight', en: 'Fight', ko: '교전 Fight' },
    right: { zh: '打野 Loot',  en: 'Loot',  ko: '파밍 Loot' },
    name:  { zh: '资源取向', en: 'Resource Style', ko: '자원 성향' },
  },
  ED: {
    left:  { zh: '佛系 Even',   en: 'Even',   ko: '평정 Even' },
    right: { zh: '分奴 Driven', en: 'Driven', ko: '승부욕 Driven' },
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
    heroDescription: {
      zh: 'RWSF 是 PUBG 单排榜上最纯粹的终结者：你不靠队友、不靠苟分，靠的是判断力比对手快半拍、枪法比对手稳一档。圈、点、人——全在你的脑海里展开。',
      en: "RWSF is the purest finisher on the solo-queue ladder: no teammates carrying you, no zone-edge cheese — just sharper reads and steadier aim. Circles, angles, enemies — it all maps out in your head.",
      ko: 'RWSF는 솔로 큐 레더의 가장 순수한 종결자다. 팀원에게 의존하지 않고, 자기장에 숨지도 않는다. 더 빠른 판단과 더 안정적인 에임 — 자기장·각도·적 모두 머릿속에 펼쳐진다.',
    },
    description: { zh: '圈算得比数学家准，枪刚得比职业哥猛，单排天花板，排行榜钉子户', en: 'Calculates circles better than a mathematician, aims harder than pros. The ceiling of solo queue, permanently on the leaderboard.', ko: '자기장을 수학자보다 정확하게 계산하고, 프로보다 거세게 쏜다. 솔로 랭크의 천장, 리더보드 상주자.' },
    strengths: { zh: ['枪法在线', '意识顶级', '单排能力'], en: ['Deadly aim', 'Top game sense', 'Solo carry'], ko: ['치명적 에임', '최상급 판단력', '솔로 캐리'] },
    weaknesses: { zh: ['容易上头', '团队配合差'], en: ['Hot-headed', 'Poor teamwork'], ko: ['쉽게 흥분', '팀워크 부족'] },
    partner: ['RTSL'],
    nemesis: 'CWSF',
    image: '/assert/images/quiz/RWSF.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RWSF 里那种"输了也不破防"的玩家：连吃几把成盒，下一把仍能保持冷静推进。',
          en: "You're the RWSF who doesn't tilt — back-to-back losses don't slow you down next match.",
          ko: '연패해도 멘탈이 흔들리지 않는 RWSF — 바로 다음 판에서 평정심 유지.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RWSF 里那种"输一把研究三天"的玩家：被阴一次，回放、热区、反向找回，一定找回来。',
          en: "You're the RWSF who studies the loss for three days — one bad encounter and you'll grind until you reverse it.",
          ko: '한 판 지면 3일 동안 연구하는 RWSF — 한 번 당하면 반드시 되돌려놓는다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'RWSF 的核心是"一个人也要把整局打赢"的强烈驱动。你不会等队友救命，不会期待运气加持——每一次交战都按自己的节奏推进。圈、点、人都在脑海里同时计算，看到机会就咬上去。这种独立性既是天赋，也是一种自我要求。',
          en: "At the core, RWSF is driven by the conviction that one person can win a whole match. You don't wait to be saved and you don't bank on luck — every engagement runs on your own rhythm. Zones, angles, enemies are all running in parallel in your head, and the moment a chance appears, you take it. That independence is both a gift and a standard you hold yourself to.",
          ko: 'RWSF의 핵심은 "혼자서도 한 판 전체를 이길 수 있다"는 강한 확신이다. 팀원의 구조를 기다리지 않고 운에 기대지도 않으며, 모든 교전을 자기 페이스로 끌어간다. 자기장·각도·적의 위치를 동시에 머릿속에서 계산하다가 기회가 보이면 즉시 물어버린다. 이런 독립성은 재능인 동시에 스스로에게 거는 요구다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'RWSF 在四排里其实不太自在。习惯独立做决定，让你在等人开会的时候有点烦躁——你已经规划好下一波路线了，他们还在讨论该不该刚。报点你愿意做，但更愿意自己跟上去验证。最配合得来的队友是那种"知道把决定权交给你的人"，不需要你解释每一个动作。',
          en: "RWSF doesn't fully relax in a four-stack. The habit of deciding alone makes the team-meeting wait a bit grating — your next rotation is already mapped, while they're still arguing whether to push. You'll do callouts, but you'd rather verify them yourself. The teammates who fit best are the ones who recognize when to hand decisions to you without asking for an explanation.",
          ko: 'RWSF는 4인 스쿼드에서 완전히 편하지는 않다. 혼자 결정 내리는 게 익숙해서, 팀회의 기다리는 게 약간 짜증난다 — 다음 동선은 이미 머릿속에 그려져 있는데 다른 사람들은 아직 "갈까 말까"를 논쟁 중이다. 콜아웃은 하지만 직접 확인하는 걸 더 선호한다. 가장 잘 맞는 팀원은 "결정권을 너에게 넘길 줄 아는 사람"이다 — 일일이 설명할 필요 없는 사람.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: '中跳到次热点，落地三十秒内拿到趁手的枪——这是 RWSF 的开局节奏。中前期沿着圈缘小口径推进，遇到合适距离的目标立刻接火，但绝不在不利地形死磕。决赛圈最舒服：你已经记下了所有还活着的队伍位置，等的就是那个让你 1v1 收割的时机。',
          en: "A medium-popularity drop, a serviceable gun within 30 seconds of landing — that's RWSF's opening rhythm. You push along the zone's edge in the early-to-mid game, opening fire the moment a target is at the right range, but never grinding it out on unfavorable terrain. The final circle is your comfort zone: you already have every surviving squad mapped, waiting for the 1v1 window that lets you clean up.",
          ko: '인기도 중간인 곳에 착지해서 30초 안에 손에 맞는 총을 잡는다 — 이게 RWSF의 오프닝 리듬이다. 중반까지 자기장 가장자리를 따라 작은 보폭으로 전진하고, 적절한 거리의 목표가 보이면 즉시 교전하지만 불리한 지형에서는 절대 끝까지 안 싸운다. 최종 자기장이 가장 편하다 — 살아남은 모든 팀의 위치를 이미 파악했고, 정리할 수 있는 1대1 타이밍만 기다린다.',
        },
      },
    ],
  },
  RWSL: {
    code: 'RWSL',
    group: 'brain',
    nickname: { zh: '独狼', en: 'Lone Wolf', ko: '고독한 늑대' },
    tagline: { zh: '阴角里冒出来收人头的那个', en: 'Emerges from corners to collect kills', ko: '모서리에서 갑자기 등장하는 그 사람' },
    heroDescription: {
      zh: 'RWSL 是那种让对手死前都不知道自己在哪里的刺客——全程潜伏、全程隐形，只在决赛圈最后几人的时候悄然现身，一刀收局。',
      en: "RWSL is the assassin enemies never see coming — lurking silently through the whole match, slipping into the final circle right when the survivors least expect it.",
      ko: 'RWSL은 상대가 죽기 직전까지 어디 있는지 모르게 하는 자객이다. 게임 내내 잠복하다가 최종 자기장에서 조용히 등장해 마지막을 정리한다.',
    },
    description: { zh: '全程阴在没人知道的角落，决赛圈突然冒出来收人头，击杀回放对面直接懵逼', en: 'Lurking in unknown corners the whole game, suddenly appears in final circle to clean up. Kill cam leaves enemies confused.', ko: '아무도 모르는 구석에 숨어있다가 최종 자기장에서 갑자기 나타나 정리한다. 킬캠 본 적이 멘붕.' },
    strengths: { zh: ['生存能力强', '收割意识', '隐蔽性强'], en: ['Great survival', 'Cleanup instinct', 'Master of stealth'], ko: ['뛰어난 생존력', '정리 본능', '은신의 달인'] },
    weaknesses: { zh: ['团战拉胯', '前期存在感低'], en: ['Weak in team fights', 'Low early presence'], ko: ['팀전에 약함', '초반 존재감 없음'] },
    partner: ['RTSF'],
    nemesis: 'CWIF',
    image: '/assert/images/quiz/RWSL.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RWSL 里那种"被发现了也无所谓"的玩家：阴人失手，换个角落继续等，心态稳如老狗。',
          en: "You're the RWSL who shrugs when spotted — caught lurking, just find another corner and settle in again.",
          ko: '들켜도 개의치 않는 RWSL — 발각되면 다른 구석으로 이동하고 다시 기다린다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RWSL 里那种"这局被绕背就记仇"的玩家：每次死于侧翼，下局必换位置、换路线，直到没人知道你在哪。',
          en: "You're the RWSL who logs every flank death — each time you get caught, next game you reroute and reposition until you're invisible.",
          ko: '측면 기습 당하면 반드시 복수하는 RWSL — 매번 죽은 위치를 기억하고 다음 판에 완전히 다른 경로로 간다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'RWSL 的核心驱动是"让对手永远摸不到我"。全程隐身不是懦弱，是一种掌控感——知道自己在哪、对面不知道，才是优势的起点。等待和潜伏对 RWSL 来说不是消极，而是精心设计好的节奏，决赛圈的那一刀才是这整局的答案。',
          en: "RWSL's core drive is making sure enemies never know where you are. Full-game invisibility isn't cowardice — it's control. Knowing your own position while the enemy doesn't is where every advantage begins. Waiting and lurking aren't passive for RWSL; they're a carefully engineered rhythm whose answer arrives at the very end.",
          ko: 'RWSL의 핵심 동력은 "상대가 내 위치를 절대 모르게 한다"는 것이다. 게임 내내 보이지 않는 것은 비겁함이 아니라 통제감이다. 내 위치는 알고 적은 모르는 것 — 그게 모든 이점의 출발점이다. RWSL에게 기다리고 숨는 행위는 소극적인 게 아니라 정교하게 설계된 리듬이며, 최종전의 그 한 칼이 이 한 판 전체의 정답이다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'RWSL 在队伍里是那个"总是不知道在哪"的人——不是消失，而是提前绕到侧翼埋伏。报点不多，但每次开口都是真正有用的情报。不抢物资、不催推进，但如果队友需要他收割，他会在对方最意想不到的位置突然出现。',
          en: "In a squad, RWSL is the one nobody can track — not gone, just already flanking. Callouts are rare but always actionable intel. No gear-stealing, no pushing teammates to move. When the squad needs a cleanup, though, RWSL appears from the one angle nobody expected.",
          ko: '스쿼드에서 RWSL은 "어디 있는지 모르는 그 사람"이다 — 사라진 게 아니라 이미 측면으로 돌아서 매복 중이다. 콜아웃이 많지 않지만 말할 때는 항상 진짜 정보다. 장비를 빼앗지 않고 돌격을 재촉하지도 않는다. 하지만 팀이 정리를 필요로 할 때, RWSL은 아무도 예상 못 한 각도에서 갑자기 나타난다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'RWSL 跳最安静的点位，落地先搜好装备再规划潜伏路线。前期绕开战场，沿着圈外缘移动，专门挑刚打完架、人数折损的队伍下手。决赛圈不主动开枪，等其他队打到只剩一两个人的时候，从侧翼或后方一波带走——击杀回放往往让对面懵好几秒。',
          en: "RWSL drops at the quietest POI, gears up, then plans the lurk route before committing to anything. Early game means bypassing fights and circling the zone's outer edge, picking off squads that just finished a firefight and are running low. In the final circle, RWSL doesn't initiate — he waits for the survivors to whittle each other down, then flanks or backpeeks the last one or two standing.",
          ko: 'RWSL은 가장 조용한 장소에 착지해서 장비를 챙기고 매복 경로를 계획한다. 초반은 교전을 우회하며 자기장 바깥 가장자리로 이동하고, 방금 교전 끝내서 인원이 줄어든 팀을 노린다. 최종 자기장에서는 먼저 교전을 시작하지 않는다 — 다른 팀들이 서로 깎아먹을 때까지 기다리다가 마지막 1~2명을 측면이나 후방에서 한 방에 정리한다. 킬캠 본 상대가 멍하니 몇 초 있는 게 보통이다.',
        },
      },
    ],
  },
  RWIF: {
    code: 'RWIF',
    group: 'rush',
    nickname: { zh: '1V4莽夫', en: '1V4 Berserker', ko: '1대4 광전사' },
    tagline: { zh: '听到枪响血就上头', en: 'Gunfire is his caffeine', ko: '총소리만 들으면 흥분한다' },
    heroDescription: {
      zh: 'RWIF 把每一场遭遇战都当成个人的荣耀时刻——几个人不重要，装备差不差不重要，听到枪声就是冲，输赢是其次，过瘾是第一。',
      en: "RWIF treats every encounter as a personal proving ground — numbers don't matter, gear doesn't matter. The gunshot is the starting pistol and there's only one direction: forward.",
      ko: 'RWIF는 모든 교전을 자신의 무대로 삼는다. 몇 명인지, 장비가 어떤지는 중요하지 않다. 총소리가 나면 돌격이 먼저고 결과는 나중이다.',
    },
    description: { zh: '听到枪响血直接上头，管他几个人莽就完了，赢了我是神输了就是伞兵', en: "Hears gunshots and blood starts pumping. Doesn't matter how many, just rush. Win = god, lose = bot.", ko: '총소리 들리면 피가 끓는다. 몇 명이든 상관없이 돌격. 이기면 신, 지면 봇.' },
    strengths: { zh: ['近战无敌', '反应快', '压迫力强'], en: ['CQB god', 'Fast reflexes', 'Overwhelming pressure'], ko: ['근접전 무적', '빠른 반응', '압도적 압박'] },
    weaknesses: { zh: ['容易送快递', '没有大局观'], en: ['Often becomes a loot box', 'No macro awareness'], ko: ['자주 택배 배달', '거시적 판단 없음'] },
    partner: ['CTSL'],
    nemesis: 'CTSF',
    image: '/assert/images/quiz/RWIF.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RWIF 里那种"莽死了就乐"的玩家：1V4 送包是常态，笑一声接着冲，输赢本来就在其次。',
          en: "You're the RWIF who laughs at every wipe — dying 1V4 is part of the fun, you queue up again with a grin.",
          ko: '1대4로 죽어도 웃는 RWIF — 다음 판에도 똑같이 돌격하면 그만, 이기고 지는 건 부차적인 일.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RWIF 里那种"莽死了要研究为什么"的玩家：每次1V4 团灭，回放、路线、时机，莽得要有章法。',
          en: "You're the RWIF who reviews every wipe — each 1V4 fail goes into the playbook so the next rush is smarter.",
          ko: '1대4 전멸 후 반드시 복기하는 RWIF — 리플레이 돌리고 다음 돌격은 더 영리하게 간다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'RWIF 的世界里只有一个频道：交战。听到枪声就兴奋，不管几个人对几个人、装备差距多大——本能告诉他，先冲再说。不是没有判断力，而是那种判断的结论永远是"打"。这种纯粹的攻击性让他在遭遇战里无出其右，也让他成为全队耗血最快的人。',
          en: "RWIF's world has one channel: combat. Gunshots trigger excitement regardless of numbers or gear gap — instinct always delivers the same conclusion: push. It's not an absence of judgment; the judgment just always lands on \"fight.\" That pure aggression makes him unmatched in close engagements and also the fastest player in the lobby to burn through health.",
          ko: 'RWIF의 세계에는 채널이 하나밖에 없다. 교전. 총소리가 들리면 흥분하고, 몇 대 몇이든 장비 차이가 얼마든 상관없다 — 본능이 항상 같은 결론을 내린다: 돌격. 판단력이 없는 게 아니라 판단의 결론이 항상 "싸운다"인 것이다. 이 순수한 공격성은 근접 교전에서 타의 추종을 불허하게 하는 동시에 팀에서 체력이 가장 빨리 깎이는 사람으로 만든다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'RWIF 的队友永远要做好两件事：扶他和跟上他。他不会等人集合再动，也不会因为另外三个人还没到就停下来——枪声就是他的出发信号。对队友是真心的，物资愿意分、倒地了会喊位置，但"等一下"这三个字在他的频道里接收不到。最好的搭档是那种能在他冲进去之前踩好侧翼位置的人。',
          en: "RWIF's teammates need two skills: reviving him and keeping up with him. He won't wait for everyone to group up, and gunfire means he's already gone before the squad agrees on a plan. He's genuinely generous — shares loot, marks position when downed — but the phrase \"wait a second\" simply doesn't arrive in his channel. The best partner is someone who can slip into a flanking position before he's already in the doorway.",
          ko: 'RWIF의 팀원은 두 가지를 항상 준비해야 한다: 살리기와 따라가기. 모두가 집합할 때까지 기다리지 않고, 총소리가 나면 이미 달려가고 있다. 진심으로 동료에게 잘해준다 — 물자 나눠주고 다운되면 위치 알려준다 — 하지만 "잠깐만"이라는 말은 그의 채널에 수신되지 않는다. 가장 맞는 파트너는 그가 문 앞에 도착하기 전에 이미 측면을 잡아주는 사람이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'RWIF 直接跳热点，落地第一件事是找枪找人，不是搜物资。近身压制是他最大的优势——速度快、反应快、脸皮厚，能在对方站稳脚跟前就把人打倒。中期跟着枪声走，谁在打架他就往哪里凑。决赛圈他往往是最先冲进去的那个，给剩余队友创造机会，哪怕自己先倒也值得。',
          en: "RWIF drops into hot zones and the first task is gun and enemy, not loot. Close-range suppression is his edge — fast, reactive, relentless. He can knock someone before they steady their aim. Mid-game he chases gunshots, inserting himself into whoever is fighting. In the final circle he's usually the first one to push the cluster, creating chaos for teammates to exploit even if he's the first one down.",
          ko: 'RWIF는 핫존에 착지하고 첫 번째 할 일은 총과 적을 찾는 것, 파밍이 아니다. 근거리 제압이 그의 최대 강점이다 — 빠르고, 반응 빠르고, 두껍다. 상대가 자리 잡기 전에 먼저 쓰러뜨린다. 중반에는 총소리를 따라가서 싸우고 있는 팀에 끼어든다. 최종 자기장에서는 보통 가장 먼저 돌격해 혼란을 만들고 팀원에게 기회를 준다 — 자신이 먼저 쓰러지더라도 그만한 가치가 있다.',
        },
      },
    ],
  },
  RWIL: {
    code: 'RWIL',
    group: 'brain',
    nickname: { zh: '野区仓鼠', en: 'Loot Hamster', ko: '파밍 햄스터' },
    tagline: { zh: '三级装备齐了还在搜', en: 'Still looting after he\'s fully kitted', ko: '풀파츠인데도 계속 파밍 중' },
    heroDescription: {
      zh: 'RWIL 的安全感来自背包——三级头三级甲八倍镜一样不少，才算准备好开打。在他眼里，搜到位的装备本来就比冒然交火更有价值。',
      en: "RWIL's confidence is built from the bottom of a full backpack — level 3 everything before committing to any fight. For him, perfect gear is a better investment than a risky early gunfight.",
      ko: 'RWIL의 자신감은 가방에서 나온다. 3레벨 풀셋이 갖춰져야 비로소 싸울 준비가 된 것이다. 그에게 완벽한 장비는 위험한 교전보다 훨씬 가치 있는 투자다.',
    },
    description: { zh: '专跳没人的野区疯狂舔包，三级头三级甲八倍镜全齐了还在搜，背包比枪法值钱', en: 'Drops in empty fields to loot endlessly. Full level 3 gear with 8x scope and still searching. Backpack worth more than aim.', ko: '아무도 없는 외진 곳에 떨어져서 미친 듯이 파밍. 3레벨 풀셋에 8배율까지 다 갖췄는데 아직도 파밍 중. 가방이 에임보다 비싸다.' },
    strengths: { zh: ['资源管理强', '生存率高', '装备豪华'], en: ['Resource management', 'High survival rate', 'Best gear'], ko: ['자원 관리', '높은 생존율', '최고급 장비'] },
    weaknesses: { zh: ['实战经验少', '关键时刻手抖'], en: ['Low combat experience', 'Chokes in clutch'], ko: ['실전 경험 부족', '중요한 순간 손이 떨림'] },
    partner: ['RWIF'],
    nemesis: 'RTSF',
    image: '/assert/images/quiz/RWIL.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RWIL 里那种"输了背包没空不算输"的玩家：关键圈手抖阵亡，笑着说"起码装备帅"，下局继续搜。',
          en: "You're the RWIL who finds peace in a full backpack — clutch fail or not, you'll loot even better next game.",
          ko: '가방만 꽉 차면 된다는 RWIL — 실전에서 손 떨려도 괜찮아, 다음 판에 더 잘 파밍하면 그만.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RWIL 里那种"决赛圈手抖死了绝对复盘"的玩家：装备全齐还输，说明实战缺练，搜完就要去刷枪感。',
          en: "You're the RWIL who grinds aim after every clutch fail — fully kitted and still lost means you need more combat reps.",
          ko: '풀파츠인데 실전에서 지면 반드시 복기하는 RWIL — 장비 문제가 아니라는 걸 알기에 에임 훈련 바로 시작.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'RWIL 的核心是"准备好了才出手"的信条。完整的三级套装不是执念，是一种实际的安全感——有了它，才愿意真正投入战斗。这种对充分准备的渴望让他成为全队装备最豪华的人，但也让他错过不少实战窗口。安全感来自背包的重量，而不是击杀数量。',
          en: "RWIL's core belief is that action follows preparation. A full level-3 kit isn't obsession — it's a genuine sense of security. With the right gear, committing to a fight feels rational. That appetite for readiness makes him the best-equipped player in the squad, but it also costs him windows when fights need to happen now. His confidence is measured in backpack weight, not kill count.",
          ko: 'RWIL의 핵심 신조는 "준비가 되어야 행동한다"는 것이다. 3레벨 풀셋은 집착이 아니라 실질적인 안정감이다 — 그게 갖춰져야 진심으로 싸울 마음이 생긴다. 이 충분한 준비에 대한 열망이 그를 팀에서 장비가 가장 풍족한 사람으로 만들지만, 지금 바로 싸워야 할 때 기회를 놓치게 만들기도 한다. 자신감은 킬 수가 아니라 가방 무게에서 나온다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'RWIL 在队伍里是资源中枢——他搜到的东西多，愿意分享，但也清楚什么时候要留住高倍镜。他不催推进，偶尔会成为拖慢节奏的那个人。跟他合作最舒服的队友是能帮他在正确时机推出去的人——让他意识到"装备够了"，他就能爆发出意外的战斗力。',
          en: "In a squad, RWIL is the resource hub — loots more than anyone, shares willingly, but also knows when to keep the 8x for himself. He won't push the pace, and occasionally he's the anchor slowing the squad down. The teammates who work best with him are those who can nudge him out at the right moment — once he hears \"you're kitted enough,\" he can surprise everyone with how effectively he fights.",
          ko: '스쿼드에서 RWIL은 자원 허브다 — 누구보다 많이 파밍하고 기꺼이 나눠주지만, 8배율 스코프를 자기가 가져야 할 때도 안다. 돌격을 재촉하지 않으며 가끔 팀 페이스를 늦추는 사람이 되기도 한다. 가장 잘 맞는 팀원은 적절한 순간에 그를 밀어낼 수 있는 사람이다 — "장비 충분하다"는 말을 들으면 의외의 전투력을 발휘한다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'RWIL 跳偏僻区域，先把整片搜满再说。中期移动缓慢但方向明确——永远往下一个野区走，顺路抬包。交火时倾向于中远距离压制而不是近身进楼，因为装备优势在距离里才发挥得出来。决赛圈如果装备齐全，往往能爆发出让对手意外的输出——只要那时候手不抖。',
          en: "RWIL drops in remote areas and methodically clears the entire loot zone before moving. Mid-game movement is deliberate — always heading toward the next cluster, scooping crates along the way. In fights, he prefers mid-to-long-range suppression over pushing buildings because gear advantage only pays off at range. In the final circle, if fully kitted, RWIL can surprise the lobby with his output — as long as his hands hold steady under pressure.",
          ko: 'RWIL은 외진 곳에 착지해서 그 지역을 전부 파밍하고 나서 이동한다. 중반 이동이 느리지만 방향은 명확하다 — 항상 다음 파밍 지역으로, 에어드롭도 챙기면서. 교전에서는 건물에 들어가는 근접전보다 중거리 제압을 선호한다 — 장비 우위는 거리가 있어야 발휘되기 때문이다. 최종 자기장에서 풀파츠를 갖추면 의외의 딜량으로 상대를 놀라게 할 수 있다 — 손만 안 떨린다면.',
        },
      },
    ],
  },
  RTSF: {
    code: 'RTSF',
    group: 'rush',
    nickname: { zh: '意识钢枪', en: 'Tactical Fragger', ko: '전술적 프래거' },
    tagline: { zh: '报点像开了雷达', en: 'Calls plays like he\'s on radar', ko: '레이더라도 단 듯한 콜' },
    heroDescription: {
      zh: 'RTSF 是战场上的指挥官：信息在他嘴里比子弹飞得还快，推进节奏、报点时机、烟雾弹落点——每一步都有意识在前面撑着。',
      en: "RTSF is the battlefield commander: information leaves his mouth faster than bullets fly. Push timing, callout cadence, smoke placement — every move is backed by game sense one step ahead of everyone else.",
      ko: 'RTSF는 전장의 지휘관이다. 정보가 총알보다 빠르게 입에서 나온다. 돌격 타이밍, 콜아웃 리듬, 연막 위치 — 모든 움직임이 한발 앞선 판단력으로 뒷받침된다.',
    },
    description: { zh: '"左边232一个！烟雾弹拉了冲！" 报点像开了雷达，带队钢枪从没怂过', en: '"One at 232 left! Smoke\'s popped, push!" Callouts like a radar, leads pushes and never backs down.', ko: '"왼쪽 232에 한 명! 연막 터졌다, 돌격!" 콜아웃이 레이더급, 팀 돌격을 이끌며 절대 물러서지 않는다.' },
    strengths: { zh: ['报点精准', '指挥能力', '攻防意识'], en: ['Precise callouts', 'Leadership', 'Attack-defense awareness'], ko: ['정확한 콜아웃', '리더십', '공방 판단력'] },
    weaknesses: { zh: ['太强势', '队友跟不上节奏'], en: ['Too aggressive', "Teammates can't keep up"], ko: ['너무 공격적', '팀원이 못 따라옴'] },
    partner: ['RTSL'],
    nemesis: 'CTSL',
    image: '/assert/images/quiz/RTSF.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RTSF 里那种"队友没跟上也不急"的玩家：推进失败就收，下次调整节奏，永远不因一次崩盘发火。',
          en: "You're the RTSF who keeps cool when the push fails — regroup, reset the pace, never flame after a collapse.",
          ko: '돌격 실패해도 화내지 않는 RTSF — 다음 라운드에 페이스 조절하면 된다, 한 번 실패로 폭발하지 않는다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RTSF 里那种"队友没执行好要复盘"的玩家：每次进攻失败，时机、路线、报点全要拆开来分析。',
          en: "You're the RTSF who dissects every failed push — timing, route, callout, all broken down until the next push lands.",
          ko: '돌격이 실패할 때마다 철저히 분석하는 RTSF — 타이밍, 경로, 콜아웃 전부 해부해서 다음 돌격을 완성한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'RTSF 是那种"没有信息流就打不出好枪"的选手。他的钢枪不是盲目的，而是建立在对战场完整认知上的主动出击——知道敌人在哪、判断好时机、报点精准到格——然后带着全队一起冲。他的价值不只是枪法，而是让整队的攻击变成有组织的压迫。',
          en: "RTSF is a player who can't operate at full speed without information flow. His aggression isn't blind — it's built on complete battlefield awareness. He knows enemy positions, times the push precisely, calls the grid square, then leads the squad forward. His value isn't just in aiming; it's turning the entire team's attack into organized pressure.",
          ko: 'RTSF는 정보 흐름 없이는 제대로 싸울 수 없는 선수다. 그의 공격성은 맹목적인 게 아니라 전장에 대한 완전한 인식 위에 세워진 능동적 출격이다 — 적의 위치를 알고, 타이밍을 잡고, 그리드 좌표로 정확하게 콜아웃하고, 팀을 이끌고 전진한다. 그의 가치는 에임만이 아니라 팀 전체의 공격을 조직적인 압박으로 바꾸는 데 있다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'RTSF 在队伍里是天然的发令者——不争着指挥，但一旦局面需要决断，声音自然就出来了。会主动把侧翼位置分配给队友，确认执行再推进；但如果队友跟不上他的节奏，他会感到挫败。最佳搭档是执行力强、听指令不磨蹭的队友——RTSF 开口那一刻，对方就要到位了。',
          en: "RTSF is the squad's natural trigger-caller — not forcing the role, but the voice comes out when a decision is needed. He assigns flank positions, confirms execution before pushing, and gets frustrated when teammates can't match his tempo. The ideal partner is someone fast and obedient — when RTSF calls, they're already in position.",
          ko: '스쿼드에서 RTSF는 자연스러운 지시자다 — 억지로 지휘 역할을 차지하는 게 아니라 결단이 필요한 순간 목소리가 나온다. 측면 위치를 팀원에게 배분하고 실행 확인 후 전진한다. 하지만 팀원이 그의 페이스를 못 따라가면 좌절한다. 가장 이상적인 파트너는 빠르고 지시를 잘 따르는 사람 — RTSF가 말하는 순간 이미 그 자리에 있어야 한다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'RTSF 偏好跳航线附近的中热点，落地快拿枪，30 秒内报出第一个敌方位置。推进有章法：先卡路线切断撤退、再烟雾配合强攻。决赛圈绝不等对面把阵地架好——他要在对手立足之前就带队拿下制高点，用火力优势把最后几队一一清理。',
          en: "RTSF favors mid-hot drop zones near the flight path — fast gun pickup, first enemy callout within 30 seconds. Pushes are structured: cut the retreat route first, then smoke-and-assault. In the final circle, he refuses to let the enemy settle into position. He leads the squad to seize high ground before the last squads establish footing, then methodically burns them down with firepower advantage.",
          ko: 'RTSF는 항로 근처의 중간 인기 지역에 착지하고, 빠르게 총을 잡고, 30초 안에 첫 번째 적 위치를 콜아웃한다. 돌격에는 체계가 있다: 먼저 퇴로를 차단하고 연막 지원 하에 강습한다. 최종 자기장에서는 절대 상대가 자리 잡도록 내버려두지 않는다 — 마지막 팀들이 발판을 잡기 전에 제고지를 선점하고 화력 우위로 하나씩 제거한다.',
        },
      },
    ],
  },
  RTSL: {
    code: 'RTSL',
    group: 'brain',
    nickname: { zh: '舔包保姆', en: 'Loot Nanny', ko: '파밍 유모' },
    tagline: { zh: '把好装备全丢给队友', en: 'Drops every good drop for teammates', ko: '좋은 장비는 다 팀원에게' },
    heroDescription: {
      zh: 'RTSL 是队里最无私的那一个：三级甲丢给输出位、高倍镜留给狙击手，自己穿着二级甲跑毒，因为他心里清楚，团队赢比自己装备好更重要。',
      en: "RTSL is the team's most selfless player: level 3 vest goes to the fragger, scope goes to the sniper, and he runs in level 2 because he knows — team win beats personal kit every time.",
      ko: 'RTSL은 팀에서 가장 희생적인 플레이어다. 3레벨 조끼는 딜러에게, 스코프는 저격수에게, 자신은 2레벨로 자기장을 뛴다. 팀 승리가 개인 장비보다 중요하다는 걸 알기 때문이다.',
    },
    description: { zh: '航线研究得比飞行员还细，搜完把三级甲和高倍镜全丢给队友，自己穿二级甲舔剩的', en: 'Studies flight paths more carefully than pilots. Gives all level 3 gear and scopes to teammates, wears level 2 leftovers.', ko: '항로를 조종사보다 세밀하게 연구한다. 3레벨 장비와 배율 스코프를 전부 팀원에게 주고 자기는 2레벨 남은 거 입는다.' },
    strengths: { zh: ['团队意识强', '资源分配好', '航线规划'], en: ['Great team player', 'Resource distribution', 'Flight path planning'], ko: ['뛰어난 팀 플레이', '자원 배분', '항로 계획'] },
    weaknesses: { zh: ['个人战力低', '太无私'], en: ['Low solo combat power', 'Too selfless'], ko: ['낮은 개인 전투력', '너무 희생적'] },
    partner: ['RWSF', 'RTSF'],
    nemesis: 'RWIF',
    image: '/assert/images/quiz/RTSL.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RTSL 里那种"送完装备输了也不心疼"的玩家：把三级甲丢完然后穿二级甲阵亡，反正是为了大家。',
          en: "You're the RTSL who has zero regrets after losing — you gave the level 3 gear away and died in level 2, and that's fine.",
          ko: '장비 다 주고 지더라도 후회 없는 RTSL — 팀을 위해 희생했으니 결과가 어떻든 마음이 편하다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RTSL 里那种"我把装备给你了你一定要赢"的玩家：无私分配只为最终吃鸡，输了会复盘谁没发挥好。',
          en: "You're the RTSL who expects a win in return for every gear drop — selfless yes, but losses get reviewed for accountability.",
          ko: '장비를 줬으면 반드시 이겨야 한다는 RTSL — 희생했는데 지면 누가 못했는지 반드시 복기한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'RTSL 的核心是"团队赢比我赢更重要"。这不是口号，是真实的行为逻辑——看到三级甲，第一反应是"谁更需要"，而不是装上自己背包。他的满足感来自于鸡腿里所有人名字都在，而不是击杀统计。这种无私构成了 RTSL 的独特竞争力：队伍配合越久，越难被击败。',
          en: "RTSL's core principle is that team wins matter more than personal glory. This isn't a slogan — it's a real behavioral pattern. Spotting level-3 armor triggers \"who needs it more,\" not \"mine.\" His satisfaction comes from seeing every squadmate's name on the winner screen, not from his kill stat. This selflessness is RTSL's unique edge: the longer the squad plays together, the harder they are to beat.",
          ko: 'RTSL의 핵심은 "팀이 이기는 게 내가 이기는 것보다 중요하다"는 것이다. 이건 구호가 아니라 실제 행동 논리다 — 3레벨 조끼를 발견하면 첫 반응이 "내 가방에"가 아니라 "누가 더 필요해?"다. 그의 만족감은 치킨디너 화면에 팀원 이름이 전부 있는 것에서 온다. 킬 통계가 아니라. 이 희생 정신이 RTSL의 독특한 강점이다 — 같이 플레이할수록 팀이 더 강해진다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'RTSL 是天生的保障位。他记得队友的装备状态，谁缺什么他心里有数；推进时候负责堵侧翼、拉烟掩护、而不是在最前面刚正面。和他组队的人往往感觉"莫名其妙就活得很好"——因为 RTSL 在背后默默做了太多别人注意不到的事。他唯一的弱点是战力不够时可能成为拖累。',
          en: "RTSL is the natural support anchor. He tracks teammate gear states and knows exactly who needs what before they ask. During pushes, his role is flank-cover, smoke, overwatch — not the front breach. Squadmates often feel inexplicably well-fed and alive, because RTSL is quietly handling details nobody else notices. His only risk: if his own combat power is too low, he becomes a liability instead of an asset.",
          ko: 'RTSL은 타고난 서포터다. 팀원의 장비 상태를 파악하고 있으며 누가 무엇이 필요한지 요청 전에 이미 안다. 돌격할 때는 최전방이 아니라 측면 커버, 연막, 엄호를 맡는다. 그와 함께 하는 팀원은 "왜인지 모르게 잘 살아있다"는 느낌을 받는다 — RTSL이 남들이 눈치채지 못한 많은 것을 조용히 처리하고 있기 때문이다. 유일한 약점은 자신의 전투력이 너무 낮으면 짐이 될 수 있다는 것이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'RTSL 研究航线比飞行员还认真——他计算落点不是为了找人，而是找最适合全队发育的位置，让所有人都能搜到基本装备。转移时提前规划路线避开人多区域；战斗时站掩护而不是强推。决赛圈他的任务是拉烟、供给、跟紧核心输出——即使吃鸡时击杀是零，他的贡献也是整个战局最关键的那部分。',
          en: "RTSL studies flight paths more seriously than a pilot — not to find fights but to identify the best landing spots for the whole squad to gear up cleanly. Rotations are pre-planned to avoid traffic. In engagements he covers, smokes, and supplies rather than hard-pushing. In the final circle his job is smoke, ammo, and staying glued to the main fragger — even with zero kills at the end, his contribution was the load-bearing piece of every win.",
          ko: 'RTSL은 조종사보다 진지하게 항로를 연구한다 — 싸움을 찾기 위해서가 아니라 팀 전체가 기본 장비를 갖출 수 있는 최적의 착지 지점을 찾기 위해서다. 이동 경로는 인구 밀집 지역을 피해 미리 계획한다. 교전에서는 강습이 아니라 커버, 연막, 보급을 맡는다. 최종 자기장에서 그의 역할은 연막, 탄약, 핵심 딜러에 붙어있기다 — 최종 킬이 0이어도, 그의 기여가 모든 승리의 핵심 축이었다.',
        },
      },
    ],
  },
  RTIF: {
    code: 'RTIF',
    group: 'rush',
    nickname: { zh: '伞兵', en: 'Paratrooper', ko: '돌격병' },
    tagline: { zh: '落地就喊"拉我拉我"', en: 'Lands and immediately yells "rez me"', ko: '착지하자마자 "살려줘"' },
    heroDescription: {
      zh: 'RTIF 的勇气从不缺货，缺的只是活到决赛圈的路线——落地冲、扶起来继续冲，他的队友是全队最辛苦的急救组，也是唯一愿意跟他并肩的人。',
      en: "RTIF has more courage than most — what he lacks is a route to the final circle. Land, rush, get downed, get up, repeat. His teammates are the most overworked medics in the lobby and the only ones willing to run alongside him.",
      ko: 'RTIF에게 용기는 넘쳐나지만 최종 자기장까지 살아남는 경로가 부족하다. 착지, 돌격, 다운, 부활, 반복. 그의 팀원은 게임에서 가장 바쁜 구급대원이자 유일하게 옆에서 달리는 사람들이다.',
    },
    description: { zh: '落地就冲，倒地就喊"拉我拉我"，扶起来继续莽，队友天天给他收尸', en: 'Rushes on landing, goes down screaming "pick me up!", gets revived and rushes again. Teammates collect his crate daily.', ko: '착지하자마자 돌격, 쓰러지면 "일으켜줘!" 외치고, 살아나면 또 돌격. 팀원들이 매일 시체 수습.' },
    strengths: { zh: ['永不服输', '勇气可嘉', '吸引火力'], en: ['Never gives up', 'Admirable courage', 'Great distraction'], ko: ['절대 포기 안 함', '대단한 용기', '어그로 끌기'] },
    weaknesses: { zh: ['疯狂送快递', '拖累队友'], en: ['Constant loot deliveries', 'Drags team down'], ko: ['끊임없는 택배 배달', '팀 발목 잡기'] },
    partner: ['CTIF'],
    nemesis: 'CWSF',
    image: '/assert/images/quiz/RTIF.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RTIF 里那种"送了就送了下局继续"的玩家：天天被抬，天天继续冲，反正伞兵不论输赢都乐在其中。',
          en: "You're the RTIF who treats every wipe as a warm-up — got carried today, charge again tomorrow, it's always fun either way.",
          ko: '매번 살려달라고 해도 전혀 개의치 않는 RTIF — 오늘도 택배, 내일도 돌격, 재밌으면 됐다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RTIF 里那种"老是第一个倒地必须改"的玩家：勇气不缺，但每次最先死，说明时机和路线要重新算。',
          en: "You're the RTIF who hates always being first down — courage is there but dying first every time means timing needs work.",
          ko: '항상 제일 먼저 쓰러지는 게 싫은 RTIF — 용기는 있지만 매번 먼저 죽는다면 타이밍을 다시 계산해야 한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'RTIF 的核心是一种朴素的英雄主义：相信冲上去是正确的事，哪怕结果是成盒。他的动机不是策略，而是情绪——队伍被压制，他不能坐得住；有人倒地，他必须去扶。这种不计后果的勇气既是团队的生命线，也是拖垮战局的隐患，取决于队友能否接住他制造的机会。',
          en: "RTIF's core is a simple, unvarnished heroism: charging in is the right thing, even when it ends in a crate. His motivation isn't strategy — it's emotion. When the squad is pinned, he can't sit still; when someone's downed, he has to move. That reckless courage is simultaneously the team's lifeline and the variable that can collapse a match, depending on whether teammates can capitalize on the openings he creates.",
          ko: 'RTIF의 핵심은 소박한 영웅주의다. 돌격하는 것이 옳다고 믿는다, 결과가 택배 상자일지라도. 그의 동기는 전략이 아니라 감정이다 — 팀이 압박당하면 가만히 있을 수 없고, 팀원이 다운되면 반드시 달려간다. 이 무모한 용기는 팀의 생명줄이기도 하고 전국을 망칠 변수이기도 하다 — 팀원이 그가 만드는 기회를 잡을 수 있느냐에 달려있다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'RTIF 的队友是世界上最辛苦的急救员——因为他们要一遍又一遍地把他拉起来。但 RTIF 也是最懂得感恩的那种人：被扶起来之后会死命护着扶他的人，物资第一时间分享，语音里永远是正能量。队友需要记住的是：他的冲锋是真心的，不是莽，是对大家的信任——他相信你会跟上。',
          en: "RTIF's teammates are the world's most overworked paramedics — because they have to revive him repeatedly. But RTIF is also deeply grateful: once revived he protects whoever saved him fiercely, shares loot immediately, and keeps voice chat positive. Teammates should remember that his charges aren't recklessness — they're trust. He genuinely believes you'll follow him in.",
          ko: 'RTIF의 팀원은 세상에서 가장 힘든 구급대원이다 — 반복적으로 살려야 하기 때문이다. 하지만 RTIF는 가장 감사함을 아는 타입이기도 하다. 살려준 다음에는 죽어라 지켜주고, 물자는 즉시 나눠주고, 보이스챗은 항상 긍정적이다. 팀원이 기억해야 할 것은: 그의 돌격은 무모함이 아니라 신뢰다 — 그는 진심으로 당신이 따라올 거라 믿는다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'RTIF 落地就找离他最近的枪声方向——那就是他的落点目标。没有完整的战术计划，但有完整的攻击意愿。擅长近战突破、打破僵局；在对方没反应过来的时候，一波强推往往能奏效。问题是，他不总会等到最合适的时机，导致经常成为开场第一个倒地的人。决赛圈里他最有价值的角色是正面佯攻，给队友创造侧翼机会。',
          en: "RTIF's drop decision is simple: nearest gunshot. No master plan, but full attacking intent. He excels at close-range breaches and breaking stalemates — a hard push while the enemy is still reacting often lands clean. The problem is timing: he rarely waits for the optimal window, which is why he's frequently the first casualty. In the final circle his highest value is the frontal feint, drawing fire so teammates can work the flank.",
          ko: 'RTIF의 착지 결정은 단순하다: 가장 가까운 총소리 방향. 완전한 전술 계획은 없지만 완전한 공격 의지는 있다. 근접전 돌파와 교착 상태 타파에 뛰어나다 — 적이 아직 반응하지 못한 순간의 강습은 종종 통한다. 문제는 타이밍이다: 최적의 순간을 잘 기다리지 않아서 첫 번째로 쓰러지는 경우가 많다. 최종 자기장에서 가장 가치 있는 역할은 정면 페인트 — 총을 끌어서 팀원이 측면을 칠 기회를 만든다.',
        },
      },
    ],
  },
  RTIL: {
    code: 'RTIL',
    group: 'brain',
    nickname: { zh: '顺丰快递', en: 'Express Delivery', ko: '특급 택배' },
    tagline: { zh: '出门两秒变成空投', en: 'Two seconds out the door, two-second airdrop', ko: '문 열고 2초 만에 에어드롭' },
    heroDescription: {
      zh: 'RTIL 是战场上最慷慨的运输员：搜满一背包好装备、信心十足推出去，两秒倒地，对面笑着签收。他的热情是真诚的，只是收件人总是敌人。',
      en: "RTIL is the battlefield's most generous delivery driver — full backpack of top loot, confident push out the door, two-second knockout. His enthusiasm is genuine; it's just that the recipient is always the enemy.",
      ko: 'RTIL은 전장에서 가장 관대한 배달원이다. 최고의 파밍으로 가방을 채우고 자신만만하게 문을 열면 2초 안에 다운된다. 열정은 진짜인데, 수령인은 항상 적이다.',
    },
    description: { zh: '搜了一背包空投物资信心满满出门刚枪，两秒倒地，对面开开心心舔包签收', en: 'Fills backpack with airdrop loot, confidently pushes, gets knocked in 2 seconds. Enemy happily signs for the delivery.', ko: '에어드롭 물자로 가방 가득 채우고 자신만만하게 교전, 2초 만에 다운. 상대가 기분 좋게 택배 수령.' },
    strengths: { zh: ['搜刮效率高', '乐观心态', '永远有信心'], en: ['Efficient looting', 'Optimistic', 'Always confident'], ko: ['효율적인 파밍', '긍정적 마인드', '항상 자신감'] },
    weaknesses: { zh: ['装备白搜', '实战不行'], en: ['Loots for nothing', "Can't win fights"], ko: ['헛파밍', '실전에 약함'] },
    partner: ['CTSF'],
    nemesis: 'CWIF',
    image: '/assert/images/quiz/RTIL.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 RTIL 里那种"送了好装备只是这局不顺"的玩家：两秒倒地，笑着说"他赚到了"，下局乐呵呵继续搜。',
          en: "You're the RTIL who laughs off every delivery — knocked in 2 seconds, you shrug and start looting again next game.",
          ko: '2초 만에 죽어도 웃어넘기는 RTIL — "상대가 좋은 거 먹었네" 하고 다음 판에 또 파밍 시작.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 RTIL 里那种"这背包不能白搜"的玩家：搜了好装备被打死，必须搞清楚是时机差还是位置差，下次绝不白送。',
          en: "You're the RTIL who refuses to loot for nothing — every 2-second death gets a post-match debrief until the gear actually pays off.",
          ko: '헛파밍이 싫어서 반드시 복기하는 RTIL — 2초 만에 죽는 게 반복된다면 타이밍인지 포지션인지 반드시 원인을 찾는다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'RTIL 的核心矛盾在于：搜物资的能力和运用物资的能力之间的巨大落差。他有耐心、有眼力，能在别人都搜完离开的地方再挖出一件好东西——但一到真实交火，那份自信往往垮得很快。他不是不想赢，而是实战的节奏和他准备的节奏永远对不上。',
          en: "RTIL's defining tension is the gap between his looting ability and his ability to use what he finds. He's patient and sharp-eyed, extracting one more piece of good gear long after others have moved on — but the moment real gunfire starts, that confidence often collapses. He genuinely wants to win; the problem is that the tempo of real combat never quite syncs with the tempo of his preparation.",
          ko: 'RTIL의 핵심 모순은 파밍 능력과 파밍한 것을 사용하는 능력 사이의 큰 격차에 있다. 인내심이 있고 눈이 좋아서, 다른 사람들이 다 수거하고 떠난 곳에서 좋은 물건을 하나 더 찾아낸다 — 하지만 실제 교전이 시작되면 그 자신감이 무너지는 경우가 많다. 이기고 싶은 마음은 진심이지만, 실전의 리듬이 그의 준비 리듬과 언제나 맞지 않는다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'RTIL 是队伍里的后勤官：搜到装备愿意分享，发现物资点会通报队友，在后方默默补给。但他在推进时不是第一个冲出去的人——往往等队友打完，他才出来舔包。队友对他的印象通常是"人很好，就是战力不稳"。最适合他的队伍是有强力输出位愿意带他跑的阵容。',
          en: "RTIL is the team's logistics officer: shares gear readily, flags loot spots for squadmates, quietly resupplies from the back. He's not the first one out when the push happens — usually he arrives to loot the crates after teammates finish the fight. Squadmates typically think of him as \"genuinely nice, just inconsistent in a fight.\" The setup that suits him best is a squad with strong fraggers willing to carry him through the clutch moments.",
          ko: '스쿼드에서 RTIL은 보급 담당이다. 장비를 기꺼이 나눠주고, 파밍 포인트를 팀원에게 알리며, 후방에서 조용히 보급한다. 돌격할 때 가장 먼저 나가는 사람이 아니다 — 보통 팀원이 교전을 끝내고 나서야 나와서 박스를 연다. 팀원의 인상은 보통 "사람은 좋은데 실전이 불안정하다"다. 그에게 가장 맞는 팀 구성은 강한 딜러가 있어서 중요한 순간에 데려가줄 수 있는 팀이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'RTIL 偏好跳有大量物资但不太热门的点位——既能搜得充分，又不用立刻面对枪声。他搜物资的效率极高，能在别人还没离开的时候就已经背好整套装备。但从搜完到"敢出门"之间，往往存在一段心理上的犹豫期，这段时间里圈已经在催了。决赛圈进入最后的时候，他往往超时进场，成为队友头疼的变数。',
          en: "RTIL favors loot-rich but lower-traffic drop zones — enough gear to pack out fully, without an immediate firefight on landing. His looting efficiency is exceptional; he's packed and ready before others finish their first building. But between \"done looting\" and \"willing to push the door,\" there's a hesitation window where the circle is already ticking. By the final stages, RTIL often arrives late, turning himself into the variable his teammates were hoping wouldn't show up.",
          ko: 'RTIL은 파밍이 풍부하지만 그다지 핫하지 않은 지역에 착지하는 걸 선호한다 — 충분히 채울 수 있으면서 착지 즉시 총소리를 안 들어도 되는 곳. 파밍 효율이 매우 높아서 다른 사람들이 첫 번째 건물도 다 안 끝낼 때 이미 풀셋이다. 하지만 "파밍 완료"에서 "문을 열 용기"까지 심리적 망설임 기간이 있는데, 그 시간에 자기장은 이미 줄어들고 있다. 최종전에서는 종종 늦게 등장해서 팀원들이 걱정하던 변수가 된다.',
        },
      },
    ],
  },
  CWSF: {
    code: 'CWSF',
    group: 'shadow',
    nickname: { zh: '伏地魔', en: 'Prone Sniper', ko: '엎드려 저격수' },
    tagline: { zh: '麦田里趴着等你路过', en: 'Prone in the wheat, waiting', ko: '밀밭에 엎드려서 기다린다' },
    heroDescription: {
      zh: 'CWSF 是用耐心换击杀的狙击哲学家——趴在麦田里等上十分钟换一颗精准的子弹，在他眼里不叫龟缩，叫做最优的交换比。',
      en: "CWSF is a sniper-philosopher who trades patience for kills — ten minutes prone in a wheat field for one clean shot is not camping, it's the optimal exchange rate.",
      ko: 'CWSF는 인내로 킬을 교환하는 저격 철학자다. 밀밭에 10분 엎드려서 정확한 한 발을 기다리는 것, 그에게 이건 캠핑이 아니라 최적의 교환비다.',
    },
    description: { zh: '麦田里趴得跟地形贴图似的，架着8倍镜等你路过，800米爆头你连人都找不到', en: "Lies in wheat fields like a terrain texture. Waits with 8x scope, headshots you from 800m and you can't even find them.", ko: '밀밭에 지형 텍스처처럼 엎드려 있다가 8배율로 지나가는 걸 기다린다. 800m에서 헤드샷, 어디서 쐈는지도 모른다.' },
    strengths: { zh: ['狙击精准', '耐心极强', '隐蔽能力'], en: ['Sniper accuracy', 'Extreme patience', 'Perfect concealment'], ko: ['저격 정확도', '극한의 인내심', '완벽한 은폐'] },
    weaknesses: { zh: ['近战拉胯', '跑毒容易死'], en: ['Weak in CQB', 'Dies to zone'], ko: ['근접전 약함', '자기장에 죽음'] },
    partner: ['CTSL'],
    nemesis: 'RWIF',
    image: '/assert/images/quiz/CWSF.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CWSF 里那种"打偏了就换角度继续等"的玩家：一枪没打中不慌，重新趴好，下一颗子弹自然会到位。',
          en: "You're the CWSF who resets after a miss — one shot off means reposition, breathe, and wait for the next clean angle.",
          ko: '빗맞혀도 동요하지 않는 CWSF — 자세 다시 잡고 다음 각도에서 기다리면 된다, 서두를 필요 없다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CWSF 里那种"每次失手都要找原因"的玩家：800米打偏一发，一定复盘弹道、风偏、体位，绝不允许同样的错重现。',
          en: "You're the CWSF who logs every missed shot — 800m miss means a full review of trajectory, sway, and stance before the next session.",
          ko: '빗맞을 때마다 원인을 파악하는 CWSF — 800m 빗나감은 탄도, 흔들림, 자세까지 전부 복기해서 같은 실수를 반복하지 않는다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'CWSF 的核心哲学是"以最小的风险换取最大的伤害"。每一颗子弹在扣下扳机之前已经在脑海里飞完了全程——弹道、距离、目标移动路径全部计算完毕。他不是不会近战，而是认为暴露自己去近战太低效。趴在麦田里等一颗精准的头射，对他来说才是最合理的交战方式。',
          en: "CWSF's core philosophy is minimum exposure for maximum damage. Every bullet completes its full trajectory in his mind before he pulls the trigger — ballistics, distance, target movement path all calculated in advance. He can do close range; he just considers getting into close range an inefficient risk. Lying in a wheat field waiting for the precise headshot is, to him, the most rational engagement possible.",
          ko: 'CWSF의 핵심 철학은 "최소한의 위험으로 최대의 피해를"이다. 모든 총알은 방아쇠를 당기기 전에 이미 머릿속에서 전 과정을 날아갔다 — 탄도, 거리, 목표 이동 경로가 전부 계산 완료된 상태다. 근접전을 못 하는 게 아니라, 자신을 노출해서 근접전을 하는 게 비효율적이라고 판단한다. 밀밭에 엎드려서 정확한 헤드샷을 기다리는 것이 그에게는 가장 합리적인 교전 방식이다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'CWSF 是队伍的远程精确火力支援——他在后方，队友在前方，分工非常清晰。他不擅长语音协调，但擅长在队友推进时突然击倒最致命的那个目标。一旦队友遭遇近战，他的存在感会大幅下降，因为近距离乱战不是他能介入的环境。最佳配合是能帮他卡住进攻路线的队友，让他安心施展远程压制。',
          en: "CWSF is the squad's long-range precision support — he's in the back, teammates push forward, division of labor is clean. He's not a voice-chat coordinator, but he excels at knocking the most dangerous target right when a push begins. In close-range scrums, his presence evaporates because the chaos removes his operating environment. The ideal partner is someone who can hold the attack lane and give him the stable backfield he needs to deliver precision fire.",
          ko: 'CWSF는 팀의 원거리 정밀 화력 지원이다 — 그는 후방에, 팀원은 전방에, 역할 분담이 명확하다. 보이스챗 조율을 잘하는 편이 아니지만, 팀원이 돌격할 때 가장 위험한 목표를 갑자기 쓰러뜨리는 데 탁월하다. 팀원이 근접전에 말리면 그의 존재감이 크게 떨어진다 — 근거리 혼전은 그가 개입할 수 있는 환경이 아니다. 가장 이상적인 파트너는 공격 경로를 막아주어 그가 안심하고 원거리 제압을 펼칠 수 있게 해주는 사람이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'CWSF 落地首选低流量山地或开阔丘陵，上制高点、架好狙击枪、扫描视野。不主动移动到下一个战场——等战场来找他。中期几乎不在枪声里，但每隔一段时间会有人莫名其妙在开阔地倒下。转移只在万不得已时进行，而且一定找好下一个绝佳射击位才会起身。决赛圈如果有一块好地形，他能以一人之力封锁整片区域的进入路线。',
          en: "CWSF drops on low-traffic ridgelines or open hills, claims high ground, sights in the rifle, and scans. He doesn't chase the next fight — he waits for it to materialize in front of him. Mid-game he's largely absent from gunshot audio, but people keep dropping in open ground at inexplicable moments. He only relocates when forced to, and only after he's already identified the next ideal firing position. In the final circle, given good terrain, one CWSF can lock down an entire approach route by himself.",
          ko: 'CWSF는 유동 인구가 적은 산지나 개활 구릉에 착지해서 제고지를 잡고, 저격총을 설치하고, 시야를 스캔한다. 다음 전장으로 이동하지 않는다 — 전장이 자신 앞에 나타나길 기다린다. 중반에는 총소리에서 거의 존재감이 없지만, 이상하게 개활지에서 사람들이 계속 쓰러진다. 이동은 불가피할 때만 하며, 반드시 다음 최적 사격 포지션을 이미 파악한 후에만 자리를 뜬다. 최종 자기장에서 좋은 지형만 있으면 혼자서 전체 접근 경로를 봉쇄할 수 있다.',
        },
      },
    ],
  },
  CWSL: {
    code: 'CWSL',
    group: 'shadow',
    nickname: { zh: '跑毒专业户', en: 'Zone Runner', ko: '자기장 달리기 전문가' },
    tagline: { zh: '永远贴边跑毒', en: 'Always on the zone edge', ko: '항상 자기장 끝을 따라가는' },
    heroDescription: {
      zh: 'CWSL 把毒圈当成战场上最可靠的队友——别人在打架，他在算路线；别人在掉血，他已经贴着圈边到位，静待决赛圈揭幕。',
      en: "CWSL treats the blue zone as his most reliable teammate — while others fight, he's routing; while others bleed, he's already edge-running into position, ready for the final curtain.",
      ko: 'CWSL에게 자기장은 전장에서 가장 믿음직한 동료다. 남들이 싸우는 동안 그는 경로를 계산하고, 남들이 피를 흘리는 동안 그는 이미 가장자리를 타며 최종전을 기다린다.',
    },
    description: { zh: '毒圈路线算得比GPS还准，永远贴边跑毒苟命，决赛圈才冒出来阴人', en: 'Calculates zone routes better than GPS. Always edge-running the zone to survive, only appears in final circle to ambush.', ko: '자기장 경로를 GPS보다 정확하게 계산한다. 항상 가장자리를 타며 생존, 최종 자기장에서야 나타나 기습.' },
    strengths: { zh: ['跑毒意识', '生存能力', '决赛圈强'], en: ['Zone awareness', 'Survival skills', 'Strong in final circles'], ko: ['자기장 판단력', '생존 능력', '최종전에 강함'] },
    weaknesses: { zh: ['前期划水', '击杀少'], en: ['Passive early game', 'Low kills'], ko: ['초반 방관', '킬 수 적음'] },
    partner: ['CWSF'],
    nemesis: 'RTSF',
    image: '/assert/images/quiz/CWSL.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CWSL 里那种"最终圈阴人失败也行"的玩家：前期苟得好，结果没拿鸡，无所谓，路线本来就是正确的。',
          en: "You're the CWSL who's fine with a final-circle whiff — perfect zone run is its own reward whether or not the chicken comes.",
          ko: '최종전 기습 실패해도 괜찮은 CWSL — 자기장 루트는 완벽했다, 결과보다 과정이 맞았으면 됐다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CWSL 里那种"苟到决赛圈还没吃鸡说明收割时机没算好"的玩家：苟活只是手段，最后那刀一定要补上。',
          en: "You're the CWSL who demands the payoff — surviving to final circle and not winning means the cleanup timing needs fixing.",
          ko: '최종 자기장까지 살아남고도 못 이기면 반드시 이유를 찾는 CWSL — 생존은 수단이고 마지막 정리 타이밍을 반드시 개선한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'CWSL 的核心信条是"活着才有一切"。他不追求击杀，不追求声名，只追求在每一个收圈节点稳稳站在安全区内。这种生存主义不是懦弱，而是对 PUBG 底层逻辑最冷静的理解——活到最后才有权利谈结果。他把毒圈当成最稳定的战略资产，用它来压制对手的行动自由。',
          en: "CWSL's core belief is that staying alive is the prerequisite for everything else. He doesn't chase kills or recognition — only ensuring he's inside the safe zone at every circle tick. That survivalism isn't cowardice; it's the most clear-eyed reading of PUBG's underlying logic. Only the last person standing gets to talk about results. He treats the blue zone as the most reliable strategic asset in the game, using it to constrain what enemies can do.",
          ko: 'CWSL의 핵심 신조는 "살아있어야 모든 것이 가능하다"다. 킬을 추구하지 않고, 명성을 추구하지 않으며, 오직 모든 자기장 수축 시점에 안전 지역 안에 확실히 있는 것만 추구한다. 이 생존주의는 비겁함이 아니라 PUBG의 기저 논리에 대한 가장 냉정한 이해다 — 마지막까지 살아남아야 결과를 말할 자격이 생긴다. 자기장을 게임에서 가장 믿을 수 있는 전략 자산으로 활용해서 적의 행동 자유를 제한한다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'CWSL 在队伍里是毒圈路线的绝对权威——他说往哪走，往往就真的是最快的路。他不争夺战斗决定权，但对于"要不要跑毒"这件事寸步不让。会因为队友贪刚死在毒里而感到可惜，也愿意等全队收拢再移动。最理想的队友是愿意跟着他的节奏走、相信"慢就是快"的人。',
          en: "CWSL is the squad's absolute authority on zone routing — when he says move, that path is usually the most efficient available. He won't contest combat decisions, but on the question of when to rotate he does not yield. He quietly mourns teammates who die in the blue chasing a fight, and he's willing to hold position until the squad regroups before moving. His ideal teammate trusts \"slow is smooth, smooth is fast\" as a genuine philosophy.",
          ko: '스쿼드에서 CWSL은 자기장 경로에 관한 절대적인 권위자다 — 그가 어디로 가자고 하면 그게 보통 가장 빠른 길이다. 교전 결정권을 다투지 않지만, "자기장을 피해야 하는가"에 대해서는 한 치도 양보하지 않는다. 교전에 욕심 내다 자기장에서 죽는 팀원을 안타까워하고, 팀 전체가 집결할 때까지 기다렸다가 이동하는 걸 선호한다. 가장 이상적인 팀원은 "천천히가 빠른 길"을 진심으로 믿고 그의 리듬을 따를 수 있는 사람이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'CWSL 不看热点，只看圈的预测落位——落在大概率圈心方向的空旷区域，然后不动，等圈来找自己。前期把物资搜够但绝不贪图最后一格装备；中期永远贴着圈的边缘滑动，不走冤枉路。决赛圈他往往已经在最好的坐标上等候——剩余三四个队伍还在互相硬刚，他在侧翼摘熟了的果子。',
          en: "CWSL ignores hot zones entirely — he reads circle probability and drops somewhere in the predicted final-circle direction, then waits for the zone to come to him. Early game he loots enough but never chases the last piece of gear; mid-game he slides along the inner edge of every circle, eliminating unnecessary travel. In the final circle he's already in position while three or four squads are still trading bullets — he picks the ripened fruit from the flank.",
          ko: 'CWSL은 핫존을 전혀 신경 쓰지 않는다 — 자기장 확률을 읽고 최종 자기장이 형성될 가능성이 높은 방향의 개활지에 착지한 다음, 움직이지 않고 자기장이 자신에게 오길 기다린다. 초반에는 장비를 충분히 챙기되 마지막 한 칸 장비 때문에 욕심내지 않는다. 중반에는 매 자기장의 안쪽 가장자리를 따라 미끄러지듯 이동한다. 최종 자기장에서는 이미 최적의 좌표에서 대기 중인 경우가 많다 — 나머지 팀들이 서로 싸우는 동안 그는 측면에서 익은 열매를 딴다.',
        },
      },
    ],
  },
  CWIF: {
    code: 'CWIF',
    group: 'shadow',
    nickname: { zh: '厕所老六', en: 'Bathroom Camper', ko: '화장실 캠퍼' },
    tagline: { zh: '门后那个一开门就架枪的', en: 'The one camping behind the door', ko: '문 뒤에서 각 잡고 있는 그 사람' },
    heroDescription: {
      zh: 'CWIF 把室内当成自己的主场——门后、马桶旁、楼梯拐角都是他的据点，你每推一扇门，都是在他的预设角度里走进去的。',
      en: "CWIF owns every indoor space he enters — doorframes, stairwell corners, bathroom tiles — all of it is his turf. Every door you push is already inside his crosshair.",
      ko: 'CWIF는 실내를 자신의 홈 그라운드로 만든다. 문 뒤, 계단 코너, 변기 옆 — 모두 그의 거점이다. 당신이 여는 모든 문은 이미 그의 조준선 안에 들어와 있다.',
    },
    description: { zh: '门后蹲、马桶旁、楼梯拐角全是他的工位，你推门那一刻他已经架好枪等你了', en: "Behind doors, beside toilets, stairwell corners — all his workstations. The moment you push the door, he's already aimed at you.", ko: '문 뒤, 변기 옆, 계단 코너 전부 그의 자리. 문 여는 순간 이미 조준하고 기다리고 있다.' },
    strengths: { zh: ['阴人一绝', '反应速度', '位置选择'], en: ['Ambush master', 'Fast reactions', 'Position selection'], ko: ['매복의 달인', '빠른 반응', '포지션 선정'] },
    weaknesses: { zh: ['被骂老六', '主动进攻弱'], en: ['Gets called a rat', 'Weak on offense'], ko: ['쥐캠이라 욕먹음', '공격에 약함'] },
    partner: ['CWSL'],
    nemesis: 'RTSF',
    image: '/assert/images/quiz/CWIF.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CWIF 里那种"被找到了就换个厕所"的玩家：阴人被识破，不急不躁，换个楼继续架枪等下一个推门的人。',
          en: "You're the CWIF who just picks a new bathroom when found — getting spotted is part of the game, a fresh corner is always nearby.",
          ko: '발각되면 그냥 다른 화장실 찾는 CWIF — 들키는 것도 게임의 일부, 새로운 코너는 항상 있다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CWIF 里那种"被识破说明这个位置人尽皆知"的玩家：阴人失败就更新位置库，绝不让同一个点被破防两次。',
          en: "You're the CWIF who retires exposed spots — get caught once and that position is blacklisted, the ambush library keeps growing.",
          ko: '한 번 들킨 위치는 다시 안 쓰는 CWIF — 같은 자리에서 두 번 당하는 건 절대 없다, 매복 포지션 데이터베이스를 계속 업데이트한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'CWIF 是一个把"预见性"当作武器的选手。他不靠枪法赢人，靠的是在对手推门那一刻已经把枪架好的习惯——没有哪扇门是随便打开的，每一个进入建筑的敌人都是走进了他早已设计好的埋伏。这种先手优势让他在室内几乎无敌，但一旦出了门，优势就荡然无存。',
          en: "CWIF weaponizes anticipation. He doesn't win on raw aim — he wins because the gun is already up the moment the door handle turns. No door gets opened randomly; every enemy who enters a building is walking into an ambush he designed in advance. That pre-emptive edge makes him near-unstoppable indoors, but it evaporates the second he steps outside.",
          ko: 'CWIF는 "예견성"을 무기로 삼는 선수다. 에임으로 이기는 게 아니라, 상대가 문을 여는 순간 이미 총이 겨눠져 있는 습관으로 이긴다 — 어떤 문도 아무 생각 없이 열리지 않으며, 건물에 들어오는 모든 적은 그가 미리 설계한 매복 안으로 걸어들어간다. 이 선제적 우위가 실내에서 그를 거의 상대 불가능하게 만들지만, 밖으로 나오는 순간 그 우위는 사라진다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'CWIF 在队伍里的角色是固守要点的钉子——他一旦拿下一栋楼，那栋楼就是全队的前沿据点。他不擅长主动进攻，但擅长把拿到手的东西守住。队友进攻时他负责后方安全和侧翼封堵，防止被绕背。最好的配合是让他守住一栋重要建筑，队友在外面自由操作——双方各做自己最擅长的事。',
          en: "CWIF's squad role is the immovable nail — once he takes a building, that building becomes the team's forward operating position. Offensive pushes aren't his strength, but holding what's captured absolutely is. When teammates attack, he handles rear security and flank closure, preventing back-peeks. The optimal split is CWIF on a key building while squadmates operate freely outside — each doing exactly what they're best at.",
          ko: '스쿼드에서 CWIF의 역할은 거점을 지키는 못이다 — 한 번 건물을 점령하면 그 건물이 팀의 전방 거점이 된다. 공세는 강점이 아니지만 점령한 것을 지키는 건 탁월하다. 팀원이 공격할 때 그는 후방 안전과 측면 봉쇄를 담당해서 기습당하지 않도록 한다. 최적의 배분은 CWIF가 중요한 건물 하나를 지키고 팀원들이 밖에서 자유롭게 활동하는 것 — 서로 가장 잘하는 것을 하는 것.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'CWIF 不跳热点——他跳的是热点旁边、进出路线必经的那栋建筑。落地快速清楼，然后选定最佳伏击位置：门框旁、窗户侧、楼梯顶端。全程不主动出击，等对方来推。中期转移也一定要找到下一个封锁点才会动。决赛圈如果能抢到一栋好楼，他能凭借预设角度守住整个残局，让对手不得不来送人头。',
          en: "CWIF doesn't drop into hot zones — he drops into the building on the approach route that hot-zone players must pass through. He clears fast, then picks his optimal ambush spot: door frame, window side, stairwell top. No proactive pushes — he waits for them to come. Mid-game he doesn't relocate until the next choke point is identified. In the final circle, one good building is enough for him to anchor the endgame, forcing every remaining squad to funnel into his preset crosshairs.",
          ko: 'CWIF는 핫존에 착지하지 않는다 — 핫존 플레이어들이 반드시 지나가는 접근 경로상의 건물에 착지한다. 빠르게 건물을 정리하고 최적의 매복 위치를 선정한다: 문 옆, 창문 측면, 계단 꼭대기. 절대 먼저 나가지 않고 상대가 밀고 오길 기다린다. 중반 이동도 다음 거점이 정해질 때까지 하지 않는다. 최종 자기장에서 좋은 건물 하나만 선점하면 잔존 팀 전체가 그의 미리 잡은 조준선으로 몰려들도록 만들 수 있다.',
        },
      },
    ],
  },
  CWIL: {
    code: 'CWIL',
    group: 'shadow',
    nickname: { zh: '0杀吃鸡王', en: 'Zero Kill Winner', ko: '0킬 치킨디너 왕' },
    tagline: { zh: '全程零开枪决赛圈吃鸡', en: 'Wins without firing a shot', ko: '한 발도 안 쏘고 치킨 먹는' },
    heroDescription: {
      zh: 'CWIL 把"不交火"做成了一门艺术：跑毒、躲人、绕路、等毒——全程没开一枪，最后一名对手被毒死，大吉大利今晚吃鸡，0杀。',
      en: "CWIL has turned \"no engagement\" into an art form: zone-run, dodge, reroute, outlast — not a single shot fired, and the last enemy dies to the blue. Winner winner, 0 kills.",
      ko: 'CWIL은 "교전 없음"을 하나의 예술로 만들었다. 자기장 타고, 피하고, 우회하고, 버티다 보면 마지막 상대가 자기장에 죽는다. 0킬 치킨디너.',
    },
    description: { zh: '全程跑毒躲人一枪没开，决赛圈对面在毒里被毒死，大吉大利0杀吃鸡', en: 'Runs from zone, avoids everyone, never fires a shot. Last enemy dies to zone. Winner winner chicken dinner, 0 kills.', ko: '자기장 피하고 사람 피하고 총 한 발도 안 쏜다. 최종 자기장에서 상대가 자기장에 죽는다. 0킬 치킨디너.' },
    strengths: { zh: ['生存大师', '跑毒路线', '佛系心态'], en: ['Survival master', 'Zone routing', 'Zen mindset'], ko: ['생존 마스터', '자기장 경로', '무아지경 멘탈'] },
    weaknesses: { zh: ['没有战斗力', '刺激感为零'], en: ['Zero combat power', 'Zero excitement'], ko: ['전투력 제로', '스릴 제로'] },
    partner: ['RTSF'],
    nemesis: 'RWSF',
    image: '/assert/images/quiz/CWIL.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CWIL 里那种"0杀吃鸡就是最高艺术"的玩家：全程没开枪拿鸡，泰然自若，这才叫真正的生存哲学。',
          en: "You're the CWIL who sees 0-kill wins as pure art — zone out everything, let the world burn, and collect the chicken in peace.",
          ko: '0킬 치킨디너를 최고의 예술로 보는 CWIL — 모든 걸 피하고 마지막에 조용히 치킨을 먹는 것, 이게 진짜 생존 철학.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CWIL 里那种"0杀吃鸡也要优化路线"的玩家：每次都想把跑毒路线压缩到极致，0杀也要赢得最干净。',
          en: "You're the CWIL who optimizes every 0-kill run — there's always a cleaner route, a tighter timeline, a more perfect no-shot chicken.",
          ko: '0킬 치킨도 더 완벽하게 하고 싶은 CWIL — 매번 자기장 루트를 최적화해서 가장 깔끔한 0킬 우승을 목표로 한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'CWIL 把"不开枪"升华成了一门哲学。在他看来，击杀是风险，暴露是成本，而"让最后一个对手死于毒圈"是 PUBG 逻辑最纯粹的胜利。这不是运气，是精确的路线管理和耐心的代价——他把整局的能量全部投注在生存效率上，而非输出效率上。',
          en: "CWIL has elevated \"not shooting\" into a philosophy. In his view, kills are risk, exposure is cost, and letting the last enemy die to the blue zone is the purest victory PUBG's logic allows. This is not luck — it's precise route management and the price of patience. He channels the entire match's energy into survival efficiency, not damage efficiency.",
          ko: 'CWIL은 "쏘지 않는 것"을 철학으로 승화시켰다. 그의 관점에서 킬은 위험이고, 노출은 비용이며, "마지막 상대를 자기장이 죽게 만드는 것"이 PUBG 논리가 허용하는 가장 순수한 승리다. 이건 운이 아니라 정밀한 경로 관리와 인내의 대가다 — 한 판의 에너지 전체를 생존 효율에 집중하고 딜 효율은 포기한다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'CWIL 在队伍里是让人既依赖又无奈的存在。他的路线能力顶级，毒圈里从不迷路；但他不打架、不推进、不刚正面——有时候全队撑不住，他已经跑到下一个安全点等着了。和他组队要有心理准备：他不是逃跑，只是他对"哪里是安全的"判断得比任何人都准确，而且会用整局验证这一点。',
          en: "CWIL is the teammate squads both rely on and feel helpless about. His zone routing is top-tier — he never gets caught in the blue. But he won't fight, won't push, won't contest anything head-on. Sometimes while the squad is struggling, he's already at the next safe coordinate waiting. Playing with CWIL requires accepting that he's not abandoning you — he simply has more accurate readings of \"what is safe\" than anyone else, and the full match is his proof.",
          ko: '스쿼드에서 CWIL은 의지가 되면서도 답답한 존재다. 경로 능력은 탁월해서 자기장에서 절대 죽지 않는다. 하지만 싸우지 않고, 돌격하지 않고, 정면 교전을 하지 않는다 — 팀이 버티지 못하는 상황에서 그는 이미 다음 안전 지점에서 기다리고 있는 경우가 있다. 그와 함께 플레이하려면 마음의 준비가 필요하다: 그가 도망치는 게 아니라, 단지 "무엇이 안전한가"에 대한 판단이 다른 누구보다 정확하고, 그 사실을 한 판 전체로 증명하는 것이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'CWIL 落地选择人最少的边缘地带，装备够用就走，不恋战。全程移动路线根据圈的预测实时调整，从不贪图额外的舔包机会。遇到其他玩家，绕路、躲避、换方向——枪声对他是警报，不是邀请。决赛圈他往往已经在圈内最边缘的安全位等候，等其他人互杀完毕，然后静静地接受系统的胜利判定。',
          en: "CWIL drops at the map's emptiest edge, gathers just enough gear to survive, and moves. Route decisions are continuously updated against circle predictions and he never gets greedy about extra loot. When he encounters another player, the response is detour, dodge, redirect — gunshots are alarms, not invitations. In the final circle, CWIL is usually already at the innermost safe edge, waiting for everyone else to eliminate each other, then quietly accepting the system's victory declaration.",
          ko: 'CWIL은 맵의 가장 인구가 없는 외곽에 착지해서 생존에 충분한 장비만 챙기고 이동한다. 경로 결정은 자기장 예측에 따라 실시간으로 업데이트되고, 추가 파밍에 욕심내지 않는다. 다른 플레이어와 마주치면 우회, 회피, 방향 전환 — 총소리는 경보이지 초대장이 아니다. 최종 자기장에서는 보통 이미 자기장 안 가장 안전한 가장자리에서 기다리다가, 다른 모두가 서로를 제거하고 난 뒤 조용히 시스템의 승리 판정을 수락한다.',
        },
      },
    ],
  },
  CTSF: {
    code: 'CTSF',
    group: 'leader',
    nickname: { zh: '占楼钉子户', en: 'Building Squatter', ko: '건물 점거왕' },
    tagline: { zh: '占了楼就当自己家', en: 'Occupies a building like he owns it', ko: '건물 하나 잡으면 자기 집인 줄' },
    heroDescription: {
      zh: 'CTSF 把建筑防守做到了极致：进楼先规划窗口分配，交叉火力铺开，每一个推进的敌人都会发现这栋楼早已是他设计好的绞肉机。',
      en: "CTSF takes building defense to its logical extreme — enter a structure and immediately blueprint the window layout, layer crossfires, and wait. Every attacker walks into a grinder he already designed.",
      ko: 'CTSF는 건물 수비를 극한까지 끌어올린다. 건물에 들어서자마자 창문 배치를 계획하고 크로스파이어를 깐다. 공격해오는 모든 적은 그가 설계한 분쇄기 안으로 걸어들어온다.',
    },
    description: { zh: '"卡窗架枪谁都别动！" 占了楼就当自己家，交叉火力摆满，攻楼的全成快递员', en: '"Hold windows, nobody move!" Takes a building and calls it home. Crossfire everywhere, attackers become loot deliveries.', ko: '"창문 잡고 아무도 움직이지 마!" 건물 점거하면 내 집처럼 쓴다. 크로스파이어 깔아놓으면 공격자들은 전부 택배기사.' },
    strengths: { zh: ['防守大师', '交叉火力', '团队协调'], en: ['Defense master', 'Crossfire setup', 'Team coordination'], ko: ['수비 마스터', '크로스파이어', '팀 협동'] },
    weaknesses: { zh: ['机动性差', '被绕容易崩'], en: ['Low mobility', 'Collapses when flanked'], ko: ['기동성 부족', '우회당하면 무너짐'] },
    partner: ['CTIF'],
    nemesis: 'RWIF',
    image: '/assert/images/quiz/CTSF.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CTSF 里那种"楼被打穿了就换楼"的玩家：阵地失守不慌乱，迅速找下一栋楼，防守指挥从不失控。',
          en: "You're the CTSF who calmly moves to the next building — losing one fort doesn't break you, there's always another floor to hold.",
          ko: '건물이 뚫려도 당황하지 않는 CTSF — 진지를 잃으면 다음 건물로 이동, 수비 지휘는 항상 냉정하게 유지.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CTSF 里那种"楼被打穿说明交叉火力没架好"的玩家：每次阵地失守必须复盘，窗口分配、掩护角度，一处都不能差。',
          en: "You're the CTSF who treats every breached building as a failure report — crossfire gaps get identified and closed before the next hold.",
          ko: '건물이 뚫릴 때마다 반드시 복기하는 CTSF — 창문 배치, 커버 각도 전부 점검해서 같은 구멍이 생기지 않도록 한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'CTSF 是把建筑防守当成艺术的玩家。他进楼的第一件事不是翻物资，而是站在正中间环顾一圈——哪个窗口能封正面，哪个门需要掩护，交叉火力怎么布置。这种战术直觉让他能在极短时间内把一栋普通建筑变成铜墙铁壁，让来犯之敌全部成为他布局下的牺牲品。',
          en: "CTSF treats building defense as an art form. His first move after entering any structure is to stand in the center and take stock — which window covers the front, which door needs covering, how to layer the crossfire. That tactical instinct lets him convert an ordinary building into a fortress in moments, turning every attacker into a victim of his pre-designed layout.",
          ko: 'CTSF는 건물 수비를 예술로 삼는 플레이어다. 건물에 들어와서 첫 번째로 하는 일은 물자 뒤지기가 아니라 한가운데 서서 주위를 한 바퀴 둘러보는 것이다 — 어느 창문이 정면을 막을 수 있는지, 어느 문에 엄호가 필요한지, 크로스파이어를 어떻게 배치할지. 이 전술적 직관이 평범한 건물을 순식간에 철옹성으로 만들어서 모든 공격자를 자신이 설계한 구조의 희생양으로 만든다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'CTSF 在四排里是天然的据点指挥官——他会自动分配每个队友的守卫位置，"你守北窗，你盯楼梯，你卡大门"。有时候语气强硬，但这种强硬背后是清晰的战局判断。最大的问题是，当局势要求机动时他可能慢半拍；最好的队友是那种执行力强、不会随便离开分配位置的人。',
          en: "CTSF is the natural strongpoint commander in a four-stack — he automatically assigns every teammate a defensive position. \"You take the north window, you watch the stairs, you hold the main door.\" The tone can be forceful, but behind it is clear battlefield reasoning. His biggest weakness is being half a beat slow when the situation calls for mobility. His best teammates are those with high execution discipline who don't drift from assigned positions.",
          ko: '스쿼드에서 CTSF는 자연스러운 거점 지휘관이다 — 자동으로 팀원 각자에게 수비 위치를 배분한다. "너 북쪽 창문, 너 계단 감시, 너 정문 잡아." 어조가 강할 때도 있지만 그 뒤에는 명확한 전황 판단이 있다. 가장 큰 약점은 기동이 필요한 상황에서 반 박자 느릴 수 있다는 것이다. 가장 좋은 팀원은 실행력이 강하고 배분된 위치에서 함부로 이탈하지 않는 사람이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'CTSF 落地选制高点建筑，快速清楼后立刻封锁窗口。中期极少主动推进——他是让对面来找他的那种人。每次转移都是战略性的：新楼必须比旧楼更易守难攻，更靠近预计圈心。决赛圈他最舒服——守着一栋楼，等其他队打完再收人头，或者凭借优势阵地压垮最后一支队伍，用火力把他们逼出掩体。',
          en: "CTSF drops on commanding buildings, clears fast, and immediately locks down the windows. Mid-game pushes are rare — he makes the enemy come to him. Every relocation is strategic: the new building must be more defensible than the last and closer to the predicted circle center. The final circle is his ideal state — holding one building, letting other squads fight each other, then sweeping in for kills or forcing the last squad out of cover with positional firepower.",
          ko: 'CTSF는 제고지 건물에 착지해서 빠르게 정리하고 즉시 창문을 봉쇄한다. 중반에 먼저 나가서 싸우는 경우가 거의 없다 — 적이 자신을 찾아오게 만드는 타입이다. 모든 이동은 전략적이다: 새 건물이 이전보다 수비하기 좋고 예상 자기장 중심에 더 가까워야 한다. 최종 자기장이 가장 편하다 — 건물 하나를 지키면서 다른 팀들이 싸우다 지치면 킬을 챙기거나, 진지 우위로 마지막 팀을 엄호에서 몰아낸 다음 제압한다.',
        },
      },
    ],
  },
  CTSL: {
    code: 'CTSL',
    group: 'leader',
    nickname: { zh: '苟王', en: 'Stealth King', ko: '생존왕' },
    tagline: { zh: '全程不开枪决赛圈收割', en: 'Silent run, final-circle harvest', ko: '끝까지 안 쏘다가 막판에 정리' },
    heroDescription: {
      zh: 'CTSL 是以大局观指挥全队的隐形棋手：避战、发育、蓄力，把三队混战的那一刻当作全局唯一的出手时机，悄然出现收割。',
      en: "CTSL is the team's invisible chess master — ducking fights, farming the macro, holding fire until three squads collide in the final circle. That single moment of chaos is the only move that was ever planned.",
      ko: 'CTSL은 팀을 이끄는 보이지 않는 체스 고수다. 교전을 피하고, 파밍하고, 3팀이 맞붙는 그 순간만을 위해 기다린다. 그 혼돈의 순간이 처음부터 계획된 유일한 행동이다.',
    },
    description: { zh: '带队跑毒避战发育一条龙，全程不开一枪，决赛圈三队互打的时候出来收割吃鸡', en: 'Leads team through zone-running, avoidance, and farming. Zero shots fired until final circle when 3 teams fight and they clean up.', ko: '팀을 이끌고 자기장 타면서 교전 회피하고 파밍 올인. 총 한 발도 안 쏘다가 최종전에서 3팀이 싸울 때 나타나서 정리하고 치킨디너.' },
    strengths: { zh: ['大局观强', '指挥能力', '收割时机'], en: ['Great macro sense', 'Command ability', 'Perfect cleanup timing'], ko: ['뛰어난 거시적 판단', '지휘 능력', '완벽한 정리 타이밍'] },
    weaknesses: { zh: ['太保守', '队友嫌无聊'], en: ['Too passive', 'Teammates find it boring'], ko: ['너무 소극적', '팀원들이 지루해함'] },
    partner: ['CWSF'],
    nemesis: 'RTSF',
    image: '/assert/images/quiz/CTSL.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CTSL 里那种"没收到割也无所谓"的玩家：带队苟到最后，时机没来就撤，结果不理想也不影响下一局指挥。',
          en: "You're the CTSL who accepts a missed harvest — led the team to final circle, timing didn't align, and that's okay for next time.",
          ko: '최종전 타이밍을 놓쳐도 괜찮은 CTSL — 팀을 잘 이끌었으면 됐다, 결과가 아쉬워도 다음 판에 영향 없다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CTSL 里那种"苟到最后没吃鸡就是收割时机没对"的玩家：每次决赛圈复盘，三方交火哪一秒插刀最划算。',
          en: "You're the CTSL who reviews every third-party window — if the chicken slipped away, it means you need to find the exact right second to push.",
          ko: '최종전 타이밍을 반드시 분석하는 CTSL — 치킨 못 먹었다면 3자 교전 중 어느 순간에 끼어들었어야 하는지 복기한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'CTSL 的核心是"整盘棋"思维。他的视野永远比眼前的交火更宽——当别人在计算谁先打谁，他在计算三支队伍打完之后谁的状态最差，什么时候插刀最合算。这种宏观控盘能力让他在混乱的战场上保持清醒，也让队友觉得他有时候不够"提气"——因为他真的不准备现在动手。',
          en: "CTSL thinks in the full game, not the current fight. While others are calculating who shoots first, he's calculating which squad will be the most depleted after three-way combat ends and when the knife goes in at optimal value. That macro control keeps him clear-headed in chaotic lobbies — and also makes teammates feel he's sometimes not \"fired up enough,\" because he genuinely isn't planning to act yet.",
          ko: 'CTSL의 핵심은 "전체 판" 사고방식이다. 그의 시야는 눈앞의 교전보다 항상 더 넓다 — 다른 사람들이 누가 먼저 쏠지 계산할 때, 그는 세 팀이 싸우고 나서 누가 가장 지쳐있을지, 어느 타이밍에 끼어드는 게 가장 이득인지를 계산하고 있다. 이 거시적 통제 능력이 혼란한 전장에서 그를 냉정하게 유지해주고, 또 팀원들이 "왜 지금 안 움직이냐"고 느끼게 만든다 — 왜냐면 그는 진짜로 아직 행동할 계획이 없기 때문이다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'CTSL 是团队的隐形大脑：他不一定最多话，但往往是决策时最后说话的那个人，而且他说的通常是对的。带队跑毒、规划路线、决定出手时机——这些他都愿意做；但如果队友想要激进推进，他会想方设法泼冷水，直到时机真的成熟。最合适的队友是能忍住冲劲、相信"等比冲更有价值"的人。',
          en: "CTSL is the team's invisible brain — not always the most vocal, but the voice that lands last when a decision is being made, and usually the correct one. Zone-leading, routing, deciding when to strike — he handles all of it willingly. But when teammates want to go aggressive, he'll find every reason to slow them down until the moment is genuinely right. His ideal teammate is someone who can suppress the urge to rush and believe that waiting genuinely pays off more.",
          ko: '스쿼드에서 CTSL은 팀의 보이지 않는 두뇌다 — 항상 가장 말이 많은 건 아니지만, 결단이 필요할 때 마지막으로 말하는 사람이고 보통 그게 맞다. 팀 이동, 경로 계획, 출격 타이밍 결정 — 이것들을 기꺼이 처리한다. 하지만 팀원이 공격적으로 가고 싶을 때는 온갖 이유를 대며 막는다, 타이밍이 진짜 무르익을 때까지. 가장 이상적인 팀원은 돌격 충동을 참을 수 있고 "기다리는 것이 더 가치있다"를 진심으로 믿는 사람이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'CTSL 带队跳偏僻安全区，前期完全回避所有战斗，专心发育和移动。中期在圈缘安全位置观望，等候三方以上的枪声信号。决赛圈阶段最关键的是判断力：他能在三队混战的五秒内准确识别哪一方残血最多、剩余人数最少——然后带队从最意想不到的角度切入，完成当局最精彩的收割动作。',
          en: "CTSL leads the squad to quiet drop spots, dodges every fight in the early game, and focuses purely on gear and positioning. Mid-game is spent watching from safe zone edges, listening for the three-or-more-squad firefight signal. The final circle is where his judgment peaks: within five seconds of a three-way brawl starting, he can identify which squad is most depleted and fewest in number — then lead the squad in from the most unexpected angle for the match's most decisive cleanup.",
          ko: 'CTSL은 팀을 조용한 낙하 지점으로 이끌고, 초반에는 모든 교전을 완전히 회피하며 발전과 이동에만 집중한다. 중반에는 자기장 가장자리 안전한 위치에서 관망하며 3팀 이상의 총소리 신호를 기다린다. 최종 자기장 단계에서 그의 판단력이 정점을 찍는다: 3자 혼전이 시작되고 5초 안에 어느 팀이 가장 체력이 낮고 인원이 적은지 파악하고 — 그 다음 가장 예상 못 한 각도에서 팀을 이끌고 끼어들어 해당 판에서 가장 화려한 정리를 완성한다.',
        },
      },
    ],
  },
  CTIF: {
    code: 'CTIF',
    group: 'leader',
    nickname: { zh: '描边急救包', en: 'Walking Medkit', ko: '걸어다니는 구급상자' },
    tagline: { zh: '拉烟扶人比 120 还快', en: 'Smokes and revives faster than 911', ko: '연막+살리기는 119보다 빠른' },
    heroDescription: {
      zh: 'CTIF 枪法不行，但他的价值从来不在输出——烟雾弹比任何人扔得准，队友倒地的那一刻他已经在路上了，团队的生命延续靠的就是他。',
      en: "CTIF can't hit a thing, but his value was never about damage — his smokes land perfectly, and the moment a teammate goes down he's already moving. The team's second life runs through him.",
      ko: 'CTIF는 에임이 없지만 그의 가치는 처음부터 딜량에 있지 않았다. 연막은 누구보다 정확하게 던지고, 팀원이 다운되는 순간 이미 달려가고 있다. 팀의 두 번째 생명은 그를 통해 이어진다.',
    },
    description: { zh: '子弹完美描边就是打不中人，但拉烟扶队友比120还快，队伍编外急救箱', en: "Bullets trace perfect outlines but never hit. Smoke + revive faster than an ambulance. The team's unofficial first aid kit.", ko: '총알이 완벽하게 윤곽만 그리고 안 맞는다. 하지만 연막 치고 부활시키는 건 구급차보다 빠르다. 팀의 비공식 구급상자.' },
    strengths: { zh: ['拉烟扶人快', '团队精神', '永不放弃'], en: ['Fast smoke revives', 'Team spirit', 'Never gives up'], ko: ['빠른 연막 부활', '팀 정신', '절대 포기 안 함'] },
    weaknesses: { zh: ['枪法描边', '输出基本为零'], en: ["Can't aim", 'Near-zero damage output'], ko: ['에임 없음', '데미지 거의 제로'] },
    partner: ['RTSF'],
    nemesis: 'RWSF',
    image: '/assert/images/quiz/CTIF.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CTIF 里那种"打不中人没关系扶起来就行"的玩家：子弹描边是特色，只要队友活着最终赢了，你的工作就完成了。',
          en: "You're the CTIF who's at peace with zero damage — teammates alive and winning is the only score that matters to you.",
          ko: '데미지 0이어도 편안한 CTIF — 팀원이 살아있고 이기면 그게 내 역할을 다한 것, 에임은 부차적인 문제.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CTIF 里那种"总不能永远不输出"的玩家：拉烟扶人没问题，但每次全队输出只靠别人，你知道自己迟早要练枪。',
          en: "You're the CTIF who knows the aim gap has to close — smoke revives are locked in, now it's time to grind until the bullets actually land.",
          ko: '언젠가는 에임도 키워야 한다는 걸 아는 CTIF — 연막 부활은 완벽하지만 데미지 0이 반복되면 반드시 에임 훈련을 시작한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'CTIF 的核心动力来自责任感，而不是击杀欲。他能接受自己输出为零，但无法接受队友倒地没人去扶。这种以"不让队友成盒"为底线的行为逻辑，让他在混战中总是绕最远的路去救最危险的人，哪怕拉烟冲进火线也不犹豫。枪法描边是技术问题，责任感是人格问题，两者在他身上分得很清楚。',
          en: "CTIF's core drive is responsibility, not kill-hunger. He can accept zero damage output; he cannot accept a downed teammate lying uncollected. That \"no one gets left behind\" baseline makes him run the longest route to reach the most endangered player in a firefight, throwing smoke and charging through the line without hesitation. Poor aim is a technical problem; responsibility is a character issue — he keeps those two things clearly separate.",
          ko: 'CTIF의 핵심 동력은 킬 욕구가 아니라 책임감이다. 자신의 딜량이 0인 건 받아들일 수 있지만, 팀원이 쓰러져서 아무도 살리러 가지 않는 건 받아들일 수 없다. "팀원을 박스로 두지 않는다"는 이 행동 논리가, 혼전에서 가장 위험한 사람에게 도달하기 위해 가장 먼 길을 달리게 만들고, 연막 치고 총선 속에 뛰어드는 것도 망설이지 않게 만든다. 에임 없음은 기술적 문제, 책임감은 인격의 문제 — 그에게 이 둘은 명확히 구분되어 있다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'CTIF 是队伍里情绪最稳定的那个——不管局面多难看，他永远不骂人，只会想下一步怎么补救。他记得每一个队友的位置，知道谁的状态最危险；交战时他从不抢着对枪，因为他知道自己的子弹比不过队友的，但他的烟雾弹和救援速度没有任何人能比。和他组队，队友的续航能力会明显提升，团灭率会明显下降。',
          en: "CTIF is the squad's emotional anchor — no matter how badly a round goes, he never flames, only plans the next recovery step. He tracks every teammate's position and knows whose health is most critical. In fights he never races to gun someone down because he knows his bullets won't land, but nobody matches his smoke placement or revive speed. Playing alongside CTIF measurably extends teammate survivability and reduces full-team wipes.",
          ko: '스쿼드에서 CTIF는 감정적으로 가장 안정된 사람이다 — 상황이 아무리 나빠도 절대 욕하지 않고, 다음 회복 방법을 생각한다. 팀원 모두의 위치를 파악하고 누구의 상태가 가장 위험한지 안다. 교전에서 총을 쏘려고 먼저 달려가지 않는다 — 자신의 총알이 팀원보다 못하다는 걸 알기 때문이다. 하지만 연막 배치와 소생 속도는 누구도 따라올 수 없다. 그와 함께 하면 팀원 생존 지속력이 눈에 띄게 높아지고 전멸률이 크게 낮아진다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'CTIF 不在乎跳什么点位，因为他的战术定位不取决于落地装备——他的价值在于战斗过程中的支援动作。推进时他走侧翼掩护而不是正面强攻；遭遇交火他第一时间观察谁最需要帮助，然后烟雾弹一扔开始行动。决赛圈他的角色是让队伍保持满状态进入最后阶段——保障每个人都活着、都有弹、都有药。这是无声的胜利贡献，统计面板上不会显示，但队友都清楚。',
          en: "CTIF doesn't care about drop location because his tactical value has nothing to do with landing gear — it's built entirely in the support actions during combat. On a push he takes the flank for overwatch, not the breach. In a firefight he immediately scans for who needs help most, then smokes and moves. In the final circle his job is keeping the squad at full capacity heading into the last exchange — everyone alive, ammo up, meds stocked. It's a silent contribution that never shows on the stats panel, but the whole squad knows it.",
          ko: 'CTIF는 어디에 착지하는지 신경 쓰지 않는다 — 그의 전술적 가치는 착지 장비와 관계없이 전투 중 지원 행동에 있기 때문이다. 돌격할 때는 정면 강습이 아니라 측면 엄호를 맡는다. 교전 중에는 즉시 누가 도움이 가장 필요한지 파악하고 연막을 던지고 움직인다. 최종 자기장에서 그의 역할은 팀이 마지막 교환에 완전한 상태로 들어가게 하는 것이다 — 모두 살아있고, 탄약 충분, 의약품 보충. 이건 통계 화면에 나타나지 않는 조용한 기여지만, 팀원 모두가 알고 있다.',
        },
      },
    ],
  },
  CTIL: {
    code: 'CTIL',
    group: 'leader',
    nickname: { zh: '快乐组排', en: 'Happy Squad', ko: '즐거운 스쿼드' },
    tagline: { zh: '跑毒路上唱歌讲段子', en: 'Sings and jokes through the rotation', ko: '자기장 도는 길에 노래하고 농담' },
    heroDescription: {
      zh: 'CTIL 把组排本身当成目的——胜负是结果，语音里的笑声才是他每天上线的理由；队友阵亡了先笑，鸡没吃到无所谓，开心就够了。',
      en: "CTIL treats the squad itself as the destination — winning is a side effect, the voice-chat laughter is the real reason to log on. Teammates wiped? Still laughing. No chicken? Doesn't matter. Fun was the whole point.",
      ko: 'CTIL에게 스쿼드 자체가 목적이다. 승패는 결과고, 보이스챗의 웃음소리가 매일 접속하는 이유다. 팀원이 전멸해도 먼저 웃고, 치킨 못 먹어도 괜찮다. 즐거우면 충분하다.',
    },
    description: { zh: '跑毒路上唱歌讲段子，队友倒了先笑再扶，吃不吃鸡不重要开黑就是快乐', en: "Sings and tells jokes while running from zone. Teammate goes down — laughs first, revives second. Winning doesn't matter, playing together is the fun.", ko: '자기장 피하면서 노래하고 개그한다. 팀원 다운되면 먼저 웃고 그다음 살린다. 치킨디너는 중요하지 않다, 같이 노는 게 즐거우니까.' },
    strengths: { zh: ['团队氛围', '心态超好', '快乐源泉'], en: ['Great vibes', 'Best attitude', 'Source of joy'], ko: ['좋은 분위기', '최고의 멘탈', '즐거움의 원천'] },
    weaknesses: { zh: ['不认真打', '经常坑队友'], en: ["Doesn't take it seriously", 'Often trolls teammates'], ko: ['진지하지 않음', '자주 팀원 트롤'] },
    partner: ['CTIF'],
    nemesis: 'RWSF',
    image: '/assert/images/quiz/CTIL.webp',
    variants: {
      E: {
        label: { zh: '佛系型', en: 'Even', ko: '평정형' },
        blurb: {
          zh: '你是 CTIL 里那种"输了也能讲出三个段子的"玩家：全队阵亡语音里还在哈哈大笑，下局继续，开黑本来就是为了开心。',
          en: "You're the CTIL who has three jokes ready after a wipe — squad gone, mic still going, next game queued, having fun is the whole point.",
          ko: '팀 전멸 후에도 개그 세 개는 준비되어 있는 CTIL — 다 죽어도 웃음소리는 끊기지 않고, 다음 판 바로 큐, 즐거우면 됐다.',
        },
      },
      D: {
        label: { zh: '分奴型', en: 'Driven', ko: '승부욕형' },
        blurb: {
          zh: '你是 CTIL 里那种"笑着笑着也想赢"的玩家：欢乐氛围不减，但鸡没吃到心里还是有点痒，段子讲完了还是要研究一下战术。',
          en: "You're the CTIL who keeps the jokes but still wants the win — fun squad energy all game, and yet not getting chicken still stings a little.",
          ko: '웃으면서도 이기고 싶은 CTIL — 즐거운 분위기는 유지하지만 치킨 못 먹으면 살짝 아쉽고, 개그 끝나면 전술 분석도 한다.',
        },
      },
    },
    sections: [
      {
        id: 'core',
        title: { zh: '核心特质', en: 'Core traits', ko: '핵심 특성' },
        body: {
          zh: 'CTIL 的核心是"开黑本身就是目的"。输赢对他而言是游戏附带的结果，但一起大笑、一起吐槽、一起经历那些荒唐时刻才是他每天上线的理由。这种态度让他成为公认的开黑最佳人选——有他在，气氛永远不会沉；但也正因如此，他偶尔会在不该放松的时刻先笑为敬。',
          en: "CTIL's core belief is that the squad session itself is the destination. Winning or losing is a side effect; the shared laughter, mutual roasting, and collective experience of absurd moments are the reason he logs on. That attitude makes him the universally agreed best person to squad with — vibes never sink when he's around. The flip side: he sometimes delivers a punchline at exactly the wrong tactical moment.",
          ko: 'CTIL의 핵심은 "같이 하는 것 자체가 목적"이다. 이기고 지는 건 부수적인 결과이고, 함께 웃고, 서로 놀리고, 황당한 순간들을 같이 경험하는 것이 매일 접속하는 이유다. 이 태도가 그를 모두가 인정하는 파티 플레이 최적 인원으로 만든다 — 그가 있으면 분위기가 절대 가라앉지 않는다. 반면에 전술적으로 가장 긴장해야 할 순간에 먼저 웃음을 던지는 일도 있다.',
        },
      },
      {
        id: 'teamwork',
        title: { zh: '队友相处', en: 'With teammates', ko: '팀원과의 관계' },
        body: {
          zh: 'CTIL 是让游戏不无聊的那个人。他记得每个队友的游戏习惯，知道谁容易上头、谁需要夸奖才能发挥好，然后以玩笑的方式把情绪管理做到位。被他坑了，往往也没法生气——因为他自己笑得比你还真诚。最适合他的队伍是那种不计较输赢、只想享受组排过程的老朋友。',
          en: "CTIL is the person who makes the game worth showing up for. He knows each teammate's play style, knows who tilts easily and who needs encouragement to perform, and handles the emotional climate through humor. When he accidentally costs the squad, it's hard to stay angry — because he's already laughing more genuinely than you are. His ideal squad is old friends who care more about the experience of playing together than the outcome.",
          ko: 'CTIL은 게임을 지루하지 않게 만드는 사람이다. 팀원 각자의 플레이 스타일을 파악하고, 누가 쉽게 멘탈이 나가는지, 누가 칭찬을 받아야 잘 하는지 알고서 농담을 통해 감정 관리를 해낸다. 그가 팀을 망쳐도 화내기 어렵다 — 그 자신이 누구보다 진심으로 웃고 있기 때문이다. 가장 맞는 팀은 결과보다 함께 하는 과정을 더 즐기는 오랜 친구들이다.',
        },
      },
      {
        id: 'tactics',
        title: { zh: '战术风格', en: 'Tactical style', ko: '전술 스타일' },
        body: {
          zh: 'CTIL 没有固定的战术风格——他的落点由气氛决定，"那个楼名字有趣"也是选点理由。战斗时跟着队友走，偶尔做出意外之举制造混乱（有时候对己方，有时候对敌方）。他不是故意坑队友，只是很难完全专注。最难得的是，他有时候在最荒唐的局里打出神之一手，让人哭笑不得——大概是因为他完全没有心理负担。',
          en: "CTIL has no fixed tactical style — drop location can be decided by \"that POI name is funny.\" In combat he follows the squad and occasionally does something unexpected that creates chaos for both sides. He's not trying to troll; he just can't maintain full concentration. What makes him surprisingly effective sometimes is that in the most chaotic round, he'll pull off a god-tier play that leaves everyone dumbfounded — probably because he carries absolutely zero psychological pressure.",
          ko: 'CTIL은 고정된 전술 스타일이 없다 — 낙하 지점이 "그 건물 이름이 재밌어 보여서"로 결정되기도 한다. 전투에서는 팀원을 따라가다가 가끔 예상치 못한 행동을 해서 양측에 혼란을 만든다. 고의로 팀을 망치려는 게 아니라 완전한 집중을 유지하기 어려운 것이다. 의외인 점은, 가장 황당한 판에서 신의 한 수를 꺼내들어 모두를 어이없게 만들기도 한다는 것이다 — 아마도 심리적 부담이 완전히 없기 때문일 것이다.',
        },
      },
    ],
  },
};
