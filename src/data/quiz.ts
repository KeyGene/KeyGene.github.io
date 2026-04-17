// Quiz data extracted from quiz.html

export interface QuizOption {
  text: { zh: string; en: string; ko: string };
  value: number;
}

export interface QuizQuestion {
  id: number;
  dim: 'RC' | 'WT' | 'SI' | 'FL';
  text: { zh: string; en: string; ko: string };
  options: QuizOption[];
}

export interface PersonalityType {
  code: string;
  group: 'rush' | 'brain' | 'shadow' | 'leader';
  nickname: { zh: string; en: string; ko: string };
  description: { zh: string; en: string; ko: string };
  strengths: { zh: string[]; en: string[]; ko: string[] };
  weaknesses: { zh: string[]; en: string[]; ko: string[] };
  partner: string[];
  nemesis: string;
  image: string;
}

export const GROUP_COLORS: Record<string, string> = {
  rush: '#EE3F2C',
  brain: '#7B5EA7',
  shadow: '#2D7D46',
  leader: '#D4A017',
};

export const GROUP_INFO: Record<string, { zh: string; en: string; ko: string }> = {
  rush: { zh: '猛攻组 Rush', en: 'Rush Group', ko: '돌격조 Rush' },
  brain: { zh: '谋略组 Brain', en: 'Brain Group', ko: '전략조 Brain' },
  shadow: { zh: '潜伏组 Shadow', en: 'Shadow Group', ko: '잠복조 Shadow' },
  leader: { zh: '指挥组 Leader', en: 'Leader Group', ko: '지휘조 Leader' },
};

export const DIMENSION_LABELS: Record<string, {
  left: { zh: string; en: string; ko: string };
  right: { zh: string; en: string; ko: string };
  name: { zh: string; en: string; ko: string };
}> = {
  RC: { left: { zh: '钢枪 Rush', en: 'Rush', ko: '돌격 Rush' }, right: { zh: '苟活 Cautious', en: 'Cautious', ko: '신중 Cautious' }, name: { zh: '战斗风格', en: 'Combat Style', ko: '전투 스타일' } },
  WT: { left: { zh: '独狼 Solo', en: 'Solo', ko: '솔로 Solo' }, right: { zh: '开黑 Team', en: 'Team', ko: '팀 Team' }, name: { zh: '社交倾向', en: 'Social Style', ko: '소셜 성향' } },
  SI: { left: { zh: '算圈 Strategic', en: 'Strategic', ko: '전략 Strategic' }, right: { zh: '莽夫 Instinct', en: 'Instinct', ko: '본능 Instinct' }, name: { zh: '决策方式', en: 'Decision Making', ko: '의사결정' } },
  FL: { left: { zh: '刚枪 Fight', en: 'Fight', ko: '교전 Fight' }, right: { zh: '打野 Loot', en: 'Loot', ko: '파밍 Loot' }, name: { zh: '资源取向', en: 'Resource Style', ko: '자원 성향' } },
};

export const QUESTIONS: QuizQuestion[] = [
  { id:1, dim:'RC', text:{ zh:'刚落地捡到一把枪，隔壁楼有脚步声，你会：', en:'You just landed and found a gun. There are footsteps in the next building. You:', ko:'방금 착지해서 총을 주웠는데 옆 건물에서 발소리가 들린다. 당신은:' },
    options:[
      { text:{ zh:'直接冲过去刚，落地不钢不是人', en:'Rush over immediately, no guts no glory', ko:'바로 돌격한다, 착지하고 안 싸우면 겁쟁이지' }, value:2 },
      { text:{ zh:'先把这栋楼搜完再说，装备压制', en:'Loot this building first, gear advantage', ko:'이 건물부터 다 뒤진다, 장비 우위가 먼저' }, value:-1 },
      { text:{ zh:'脚步声近就干，远就先搜', en:'Fight if close, loot if far', ko:'가까우면 싸우고, 멀면 먼저 파밍' }, value:1 },
      { text:{ zh:'赶紧换栋楼，惹不起躲得起', en:'Switch buildings, avoid trouble', ko:'얼른 다른 건물로 이동, 피할 수 있으면 피한다' }, value:-2 }
    ]},
  { id:2, dim:'RC', text:{ zh:'决赛圈还剩4队，你的位置不错，你会：', en:'Final circle, 4 teams left, you have good position. You:', ko:'최종 자기장, 4팀 남았고 포지션이 좋다. 당신은:' },
    options:[
      { text:{ zh:'主动找人打，不打等着被包夹？', en:'Push fights, waiting gets you sandwiched', ko:'먼저 싸움을 건다, 기다리면 협공당한다' }, value:2 },
      { text:{ zh:'架好枪等有人先动手，谁露头打谁', en:'Hold angles, shoot whoever peeks first', ko:'각을 잡고 기다린다, 먼저 보이는 놈을 쏜다' }, value:-1 },
      { text:{ zh:'听到交火就插一脚，收人头', en:'Third-party any fight you hear', ko:'교전 소리 들리면 끼어들어서 킬 먹는다' }, value:1 },
      { text:{ zh:'趴着不动，等他们互打剩最后一队我再收', en:'Stay prone, let them fight it out', ko:'엎드려서 안 움직인다, 서로 싸우게 놔두고 마지막에 정리' }, value:-2 }
    ]},
  { id:3, dim:'RC', text:{ zh:'空投落在200米外的空地上，你会：', en:'An airdrop lands 200m away in the open. You:', ko:'200m 밖 평지에 에어드롭이 떨어졌다. 당신은:' },
    options:[
      { text:{ zh:'直接冲，空投就是给猛男准备的', en:'Rush it, airdrops are for the brave', ko:'바로 달린다, 에어드롭은 용감한 자의 것' }, value:2 },
      { text:{ zh:'开车过去抢完就跑', en:'Drive there, grab and go', ko:'차 타고 가서 먹고 바로 튄다' }, value:1 },
      { text:{ zh:'先观察有没有人盯着，安全了再去', en:'Watch first, go when safe', ko:'먼저 관찰하고 안전하면 간다' }, value:-1 },
      { text:{ zh:'不去，空投就是陷阱', en:'Skip it, airdrops are traps', ko:'안 간다, 에어드롭은 함정이야' }, value:-2 }
    ]},
  { id:4, dim:'RC', text:{ zh:'你有一把满配M4和三级甲，这时候你想：', en:'You have a fully kitted M4 and level 3 vest. You think:', ko:'풀파츠 M4에 3레벨 조끼까지 있다. 이때 당신은:' },
    options:[
      { text:{ zh:'装备到位了该出去杀人了', en:'Geared up, time to hunt', ko:'장비 갖췄으니 사냥 나간다' }, value:2 },
      { text:{ zh:'找个好位置架起来守点', en:'Find a good spot and hold angles', ko:'좋은 자리 잡고 각을 세운다' }, value:-1 },
      { text:{ zh:'去人多的地方找刺激', en:'Head to hot areas for action', ko:'사람 많은 곳으로 간다' }, value:1 },
      { text:{ zh:'接着搜，看能不能搜到8倍镜', en:'Keep looting for an 8x scope', ko:'계속 파밍한다, 8배율 스코프 찾아야지' }, value:-2 }
    ]},
  { id:5, dim:'WT', text:{ zh:'你最喜欢的游戏模式是：', en:'Your favorite game mode is:', ko:'가장 좋아하는 게임 모드는:' },
    options:[
      { text:{ zh:'单排，生死靠自己', en:'Solo, life and death on my own', ko:'솔로, 내 목숨은 내가 책임진다' }, value:2 },
      { text:{ zh:'双排，一个靠谱队友就够', en:'Duo, one reliable teammate is enough', ko:'듀오, 믿을 수 있는 팀원 하나면 충분' }, value:1 },
      { text:{ zh:'四排开黑，兄弟们一起上', en:'Squad with the boys', ko:'스쿼드, 형제들이랑 함께 간다' }, value:-2 },
      { text:{ zh:'四排但不想语音，默契配合就行', en:'Squad but no voice chat, just vibes', ko:'스쿼드인데 보이스 안 쓰고 호흡으로 맞춘다' }, value:-1 }
    ]},
  { id:6, dim:'WT', text:{ zh:'队友倒在对面枪口下，你会：', en:'Your teammate gets knocked in enemy fire. You:', ko:'팀원이 적 총에 맞아 쓰러졌다. 당신은:' },
    options:[
      { text:{ zh:'他自己倒的自己爬，我先打赢再说', en:'His fault, I focus on winning the fight first', ko:'자기가 죽은 거니까 알아서 기어, 나는 싸움부터 이긴다' }, value:2 },
      { text:{ zh:'看情况，能扶就扶，不能扶就算了', en:'Depends on the situation', ko:'상황 봐서 살릴 수 있으면 살리고 아니면 포기' }, value:1 },
      { text:{ zh:'拉烟冲过去扶，兄弟不能丢', en:'Pop smoke and rush to revive, no man left behind', ko:'연막 터뜨리고 달려가서 일으킨다, 동료는 버리지 않는다' }, value:-2 },
      { text:{ zh:'先把对面打掉再去扶，这是正确打法', en:'Kill the enemy first, then revive — correct play', ko:'적부터 처리하고 살린다, 이게 정석이지' }, value:-1 }
    ]},
  { id:7, dim:'WT', text:{ zh:'搜到一个三级头，你已经有了，队友还是二级，你会：', en:'Found a level 3 helmet, you already have one, teammate has level 2. You:', ko:'3레벨 헬멧을 주웠는데 이미 있고, 팀원은 2레벨이다. 당신은:' },
    options:[
      { text:{ zh:'留着呗，万一我这个被打烂了换', en:'Keep it as backup', ko:'가지고 있는다, 혹시 내 거 부서지면 교체용' }, value:2 },
      { text:{ zh:'看队友要不要，不主动给', en:"See if they ask, won't offer", ko:'팀원이 달라고 하면 줄까 말까, 먼저 주진 않는다' }, value:1 },
      { text:{ zh:'直接丢给队友，团队装备最大化', en:'Drop it for teammate, maximize team gear', ko:'바로 팀원에게 준다, 팀 장비 최적화가 우선' }, value:-2 },
      { text:{ zh:'给队里枪法最好的那个人', en:'Give it to the best shooter on the team', ko:'팀에서 총 제일 잘 쏘는 사람한테 준다' }, value:-1 }
    ]},
  { id:8, dim:'WT', text:{ zh:'排队等匹配的时候你在：', en:"While waiting in queue you're:", ko:'매칭 대기 중에 당신은:' },
    options:[
      { text:{ zh:'一个人练枪', en:'Practicing aim in training mode', ko:'혼자 훈련장에서 에임 연습' }, value:2 },
      { text:{ zh:'刷手机等着', en:'Scrolling phone', ko:'폰 만지면서 기다린다' }, value:1 },
      { text:{ zh:'跟队友语音吹牛聊天', en:'Chatting and joking with teammates on voice', ko:'팀원들이랑 보이스로 수다 떤다' }, value:-2 },
      { text:{ zh:'在群里约人凑队', en:'Looking for more players in group chat', ko:'단톡방에서 같이 할 사람 구한다' }, value:-1 }
    ]},
  { id:9, dim:'SI', text:{ zh:'第一个圈刷出来了，你的第一反应是：', en:'First circle appears. Your first reaction:', ko:'첫 번째 자기장이 떴다. 당신의 첫 반응은:' },
    options:[
      { text:{ zh:'马上看圈心位置，规划转移路线', en:'Check circle center, plan rotation route', ko:'바로 자기장 중심 확인하고 이동 경로 계획' }, value:2 },
      { text:{ zh:'先搜完这片再走，到时候再说', en:'Finish looting here first, deal with it later', ko:'여기 파밍부터 끝내고 그때 가서 생각한다' }, value:-1 },
      { text:{ zh:'找车提前去圈心占位', en:'Find a vehicle, get to center early', ko:'차 찾아서 미리 자기장 중심에 자리 잡는다' }, value:1 },
      { text:{ zh:'圈不急，毒来了再跑', en:'No rush, run when the zone comes', ko:'급할 거 없다, 자기장 오면 그때 뛴다' }, value:-2 }
    ]},
  { id:10, dim:'SI', text:{ zh:'你开车路上看到右边房区有人，你会：', en:'Driving and you spot players in buildings to the right. You:', ko:'차를 몰고 가는데 오른쪽 건물에 사람이 보인다. 당신은:' },
    options:[
      { text:{ zh:'记住位置，标记一下，后面绕过来打', en:'Mark position, flank them later', ko:'위치 기억하고 마킹, 나중에 우회해서 친다' }, value:2 },
      { text:{ zh:'直接开车撞过去', en:'Drive straight into them', ko:'차로 바로 돌진한다' }, value:-2 },
      { text:{ zh:'先跑，等下找个好位置回来阴他', en:'Drive past, find a good angle to ambush later', ko:'일단 지나가고 좋은 자리 잡아서 매복한다' }, value:1 },
      { text:{ zh:'看心情，有时候冲有时候跑', en:'Depends on mood', ko:'기분 따라 다르다, 돌격할 때도 있고 도망갈 때도 있고' }, value:-1 }
    ]},
  { id:11, dim:'SI', text:{ zh:'你进了一个大城区，你的搜楼顺序是：', en:'You enter a big city. Your looting order is:', ko:'큰 도시에 들어왔다. 건물 파밍 순서는:' },
    options:[
      { text:{ zh:'从边缘搜到中心，有计划有路线', en:'Edge to center, planned route', ko:'외곽에서 중심으로, 계획적인 루트' }, value:2 },
      { text:{ zh:'哪栋楼顺眼搜哪栋', en:'Whichever building looks good', ko:'눈에 띄는 건물부터 아무거나' }, value:-2 },
      { text:{ zh:'先占高楼架枪观察，确认安全再搜', en:'Take high ground first, scout then loot', ko:'높은 건물 먼저 올라가서 정찰하고 안전하면 파밍' }, value:1 },
      { text:{ zh:'跟着脚步声走，有人就打没人就搜', en:'Follow footsteps — fight if found, loot if not', ko:'발소리 따라간다, 사람 있으면 싸우고 없으면 파밍' }, value:-1 }
    ]},
  { id:12, dim:'SI', text:{ zh:'决赛圈即将刷新，你会：', en:'Final circle is about to shift. You:', ko:'최종 자기장이 곧 줄어든다. 당신은:' },
    options:[
      { text:{ zh:'提前预判下个圈在哪，抢占有利地形', en:'Predict next circle, grab advantageous terrain', ko:'다음 자기장 예측해서 유리한 지형 선점' }, value:2 },
      { text:{ zh:'等圈刷了再动，随机应变', en:'Wait for it to appear, then adapt', ko:'자기장 뜨면 그때 움직인다, 임기응변' }, value:-1 },
      { text:{ zh:'看地形找最近的硬掩体', en:'Find the nearest hard cover', ko:'지형 보고 가까운 엄폐물 찾는다' }, value:1 },
      { text:{ zh:'管他刷哪，兵来将挡水来土掩', en:"Whatever happens, I'll deal with it", ko:'어디로 줄든 상관없다, 닥치면 어떻게든 한다' }, value:-2 }
    ]},
  { id:13, dim:'FL', text:{ zh:'跳伞你喜欢跳哪里：', en:'Where do you like to drop:', ko:'낙하산 어디로 뛰는 걸 좋아하나요:' },
    options:[
      { text:{ zh:'军事基地、P城，人多肥的地方', en:'Military base, Pochinki — hot and rich', ko:'군사기지, 포친키 — 사람 많고 파밍 좋은 곳' }, value:2 },
      { text:{ zh:'航线正下方的中型城区', en:'Medium towns right under the flight path', ko:'항로 바로 아래 중간 규모 마을' }, value:1 },
      { text:{ zh:'离航线远的小城镇', en:'Small towns far from flight path', ko:'항로에서 먼 작은 마을' }, value:-1 },
      { text:{ zh:'最远的野区房子，越没人越好', en:'The furthest houses, the fewer people the better', ko:'가장 먼 외진 집, 사람 없을수록 좋다' }, value:-2 }
    ]},
  { id:14, dim:'FL', text:{ zh:'你搜完一片区域，接下来你想：', en:'You finished looting an area. Next you want to:', ko:'한 구역 파밍을 끝냈다. 다음에 하고 싶은 건:' },
    options:[
      { text:{ zh:'去找人打，装备够用就行', en:'Go find fights, good enough gear', ko:'싸움하러 간다, 장비는 이 정도면 충분' }, value:2 },
      { text:{ zh:'听哪边有枪声往哪边走', en:'Head toward gunshots', ko:'총소리 나는 쪽으로 간다' }, value:1 },
      { text:{ zh:'去下一片没人搜过的地方继续搜', en:'Move to the next unlooted area', ko:'아직 안 뒤진 다음 구역으로 파밍하러 간다' }, value:-1 },
      { text:{ zh:'找个安全地方蹲着等圈', en:'Find a safe spot and wait for zone', ko:'안전한 곳에서 쪼그리고 자기장 기다린다' }, value:-2 }
    ]},
  { id:15, dim:'FL', text:{ zh:'你理想中的一局吃鸡是：', en:'Your ideal chicken dinner game:', ko:'당신이 생각하는 이상적인 치킨디너는:' },
    options:[
      { text:{ zh:'15杀吃鸡，全程高能', en:'15 kills win, non-stop action', ko:'15킬 치킨디너, 처음부터 끝까지 액션' }, value:2 },
      { text:{ zh:'七八杀，关键时刻打赢了就行', en:'7-8 kills, clutch when it matters', ko:'7~8킬, 중요한 순간에 이기면 된다' }, value:1 },
      { text:{ zh:'三四杀，决赛圈赢了就够', en:'3-4 kills, win the final fight', ko:'3~4킬, 최종전만 이기면 충분' }, value:-1 },
      { text:{ zh:'0杀也行，只要赢了', en:'0 kills is fine, as long as I win', ko:'0킬도 괜찮아, 이기기만 하면 된다' }, value:-2 }
    ]},
  { id:16, dim:'FL', text:{ zh:'你更在意哪个数据：', en:'Which stat do you care about most:', ko:'어떤 스탯을 가장 중요하게 생각하나요:' },
    options:[
      { text:{ zh:'K/D，杀人才是核心', en:'K/D — kills are everything', ko:'K/D — 킬이 전부다' }, value:2 },
      { text:{ zh:'场均伤害', en:'Average damage per game', ko:'게임당 평균 데미지' }, value:1 },
      { text:{ zh:'胜率，赢才是目的', en:'Win rate — winning is the goal', ko:'승률 — 이기는 게 목적이다' }, value:-1 },
      { text:{ zh:'前十率，活下来才是王道', en:'Top 10 rate — survival is king', ko:'톱10 비율 — 생존이 왕도다' }, value:-2 }
    ]},
];

export const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  RWSF: { code:'RWSF', group:'rush',
    nickname:{ zh:'单排战神', en:'Solo War God', ko:'솔로 전쟁의 신' },
    description:{ zh:'圈算得比数学家准，枪刚得比职业哥猛，单排天花板，排行榜钉子户', en:'Calculates circles better than a mathematician, aims harder than pros. The ceiling of solo queue, permanently on the leaderboard.', ko:'자기장을 수학자보다 정확하게 계산하고, 프로보다 거세게 쏜다. 솔로 랭크의 천장, 리더보드 상주자.' },
    strengths:{ zh:['枪法在线','意识顶级','单排能力'], en:['Deadly aim','Top game sense','Solo carry'], ko:['치명적 에임','최상급 판단력','솔로 캐리'] },
    weaknesses:{ zh:['容易上头','团队配合差'], en:['Hot-headed','Poor teamwork'], ko:['쉽게 흥분','팀워크 부족'] },
    partner:['RTSL'], nemesis:'CWSF',
    image:'/assert/images/quiz/RWSF.svg' },
  RWSL: { code:'RWSL', group:'brain',
    nickname:{ zh:'独狼', en:'Lone Wolf', ko:'고독한 늑대' },
    description:{ zh:'全程阴在没人知道的角落，决赛圈突然冒出来收人头，击杀回放对面直接懵逼', en:'Lurking in unknown corners the whole game, suddenly appears in final circle to clean up. Kill cam leaves enemies confused.', ko:'아무도 모르는 구석에 숨어있다가 최종 자기장에서 갑자기 나타나 정리한다. 킬캠 본 적이 멘붕.' },
    strengths:{ zh:['生存能力强','收割意识','隐蔽性强'], en:['Great survival','Cleanup instinct','Master of stealth'], ko:['뛰어난 생존력','정리 본능','은신의 달인'] },
    weaknesses:{ zh:['团战拉胯','前期存在感低'], en:['Weak in team fights','Low early presence'], ko:['팀전에 약함','초반 존재감 없음'] },
    partner:['RTSF'], nemesis:'CWIF',
    image:'/assert/images/quiz/RWSL.svg' },
  RWIF: { code:'RWIF', group:'rush',
    nickname:{ zh:'1V4莽夫', en:'1V4 Berserker', ko:'1대4 광전사' },
    description:{ zh:'听到枪响血直接上头，管他几个人莽就完了，赢了我是神输了就是伞兵', en:"Hears gunshots and blood starts pumping. Doesn't matter how many, just rush. Win = god, lose = bot.", ko:'총소리 들리면 피가 끓는다. 몇 명이든 상관없이 돌격. 이기면 신, 지면 봇.' },
    strengths:{ zh:['近战无敌','反应快','压迫力强'], en:['CQB god','Fast reflexes','Overwhelming pressure'], ko:['근접전 무적','빠른 반응','압도적 압박'] },
    weaknesses:{ zh:['容易送快递','没有大局观'], en:['Often becomes a loot box','No macro awareness'], ko:['자주 택배 배달','거시적 판단 없음'] },
    partner:['CTSL'], nemesis:'CTSF',
    image:'/assert/images/quiz/RWIF.svg' },
  RWIL: { code:'RWIL', group:'brain',
    nickname:{ zh:'野区仓鼠', en:'Loot Hamster', ko:'파밍 햄스터' },
    description:{ zh:'专跳没人的野区疯狂舔包，三级头三级甲八倍镜全齐了还在搜，背包比枪法值钱', en:'Drops in empty fields to loot endlessly. Full level 3 gear with 8x scope and still searching. Backpack worth more than aim.', ko:'아무도 없는 외진 곳에 떨어져서 미친 듯이 파밍. 3레벨 풀셋에 8배율까지 다 갖췄는데 아직도 파밍 중. 가방이 에임보다 비싸다.' },
    strengths:{ zh:['资源管理强','生存率高','装备豪华'], en:['Resource management','High survival rate','Best gear'], ko:['자원 관리','높은 생존율','최고급 장비'] },
    weaknesses:{ zh:['实战经验少','关键时刻手抖'], en:['Low combat experience','Chokes in clutch'], ko:['실전 경험 부족','중요한 순간 손이 떨림'] },
    partner:['RWIF'], nemesis:'RTSF',
    image:'/assert/images/quiz/RWIL.svg' },
  RTSF: { code:'RTSF', group:'rush',
    nickname:{ zh:'意识钢枪', en:'Tactical Fragger', ko:'전술적 프래거' },
    description:{ zh:'"左边232一个！烟雾弹拉了冲！" 报点像开了雷达，带队钢枪从没怂过', en:'"One at 232 left! Smoke\'s popped, push!" Callouts like a radar, leads pushes and never backs down.', ko:'"왼쪽 232에 한 명! 연막 터졌다, 돌격!" 콜아웃이 레이더급, 팀 돌격을 이끌며 절대 물러서지 않는다.' },
    strengths:{ zh:['报点精准','指挥能力','攻防意识'], en:['Precise callouts','Leadership','Attack-defense awareness'], ko:['정확한 콜아웃','리더십','공방 판단력'] },
    weaknesses:{ zh:['太强势','队友跟不上节奏'], en:['Too aggressive',"Teammates can't keep up"], ko:['너무 공격적','팀원이 못 따라옴'] },
    partner:['RTSL'], nemesis:'CTSL',
    image:'/assert/images/quiz/RTSF.svg' },
  RTSL: { code:'RTSL', group:'brain',
    nickname:{ zh:'舔包保姆', en:'Loot Nanny', ko:'파밍 유모' },
    description:{ zh:'航线研究得比飞行员还细，搜完把三级甲和高倍镜全丢给队友，自己穿二级甲舔剩的', en:'Studies flight paths more carefully than pilots. Gives all level 3 gear and scopes to teammates, wears level 2 leftovers.', ko:'항로를 조종사보다 세밀하게 연구한다. 3레벨 장비와 배율 스코프를 전부 팀원에게 주고 자기는 2레벨 남은 거 입는다.' },
    strengths:{ zh:['团队意识强','资源分配好','航线规划'], en:['Great team player','Resource distribution','Flight path planning'], ko:['뛰어난 팀 플레이','자원 배분','항로 계획'] },
    weaknesses:{ zh:['个人战力低','太无私'], en:['Low solo combat power','Too selfless'], ko:['낮은 개인 전투력','너무 희생적'] },
    partner:['RWSF','RTSF'], nemesis:'RWIF',
    image:'/assert/images/quiz/RTSL.svg' },
  RTIF: { code:'RTIF', group:'rush',
    nickname:{ zh:'伞兵', en:'Paratrooper', ko:'돌격병' },
    description:{ zh:'落地就冲，倒地就喊"拉我拉我"，扶起来继续莽，队友天天给他收尸', en:'Rushes on landing, goes down screaming "pick me up!", gets revived and rushes again. Teammates collect his crate daily.', ko:'착지하자마자 돌격, 쓰러지면 "일으켜줘!" 외치고, 살아나면 또 돌격. 팀원들이 매일 시체 수습.' },
    strengths:{ zh:['永不服输','勇气可嘉','吸引火力'], en:['Never gives up','Admirable courage','Great distraction'], ko:['절대 포기 안 함','대단한 용기','어그로 끌기'] },
    weaknesses:{ zh:['疯狂送快递','拖累队友'], en:['Constant loot deliveries','Drags team down'], ko:['끊임없는 택배 배달','팀 발목 잡기'] },
    partner:['CTIF'], nemesis:'CWSF',
    image:'/assert/images/quiz/RTIF.svg' },
  RTIL: { code:'RTIL', group:'brain',
    nickname:{ zh:'顺丰快递', en:'Express Delivery', ko:'특급 택배' },
    description:{ zh:'搜了一背包空投物资信心满满出门刚枪，两秒倒地，对面开开心心舔包签收', en:'Fills backpack with airdrop loot, confidently pushes, gets knocked in 2 seconds. Enemy happily signs for the delivery.', ko:'에어드롭 물자로 가방 가득 채우고 자신만만하게 교전, 2초 만에 다운. 상대가 기분 좋게 택배 수령.' },
    strengths:{ zh:['搜刮效率高','乐观心态','永远有信心'], en:['Efficient looting','Optimistic','Always confident'], ko:['효율적인 파밍','긍정적 마인드','항상 자신감'] },
    weaknesses:{ zh:['装备白搜','实战不行'], en:['Loots for nothing',"Can't win fights"], ko:['헛파밍','실전에 약함'] },
    partner:['CTSF'], nemesis:'CWIF',
    image:'/assert/images/quiz/RTIL.svg' },
  CWSF: { code:'CWSF', group:'shadow',
    nickname:{ zh:'伏地魔', en:'Prone Sniper', ko:'엎드려 저격수' },
    description:{ zh:'麦田里趴得跟地形贴图似的，架着8倍镜等你路过，800米爆头你连人都找不到', en:"Lies in wheat fields like a terrain texture. Waits with 8x scope, headshots you from 800m and you can't even find them.", ko:'밀밭에 지형 텍스처처럼 엎드려 있다가 8배율로 지나가는 걸 기다린다. 800m에서 헤드샷, 어디서 쐈는지도 모른다.' },
    strengths:{ zh:['狙击精准','耐心极强','隐蔽能力'], en:['Sniper accuracy','Extreme patience','Perfect concealment'], ko:['저격 정확도','극한의 인내심','완벽한 은폐'] },
    weaknesses:{ zh:['近战拉胯','跑毒容易死'], en:['Weak in CQB','Dies to zone'], ko:['근접전 약함','자기장에 죽음'] },
    partner:['CTSL'], nemesis:'RWIF',
    image:'/assert/images/quiz/CWSF.svg' },
  CWSL: { code:'CWSL', group:'shadow',
    nickname:{ zh:'跑毒专业户', en:'Zone Runner', ko:'자기장 달리기 전문가' },
    description:{ zh:'毒圈路线算得比GPS还准，永远贴边跑毒苟命，决赛圈才冒出来阴人', en:'Calculates zone routes better than GPS. Always edge-running the zone to survive, only appears in final circle to ambush.', ko:'자기장 경로를 GPS보다 정확하게 계산한다. 항상 가장자리를 타며 생존, 최종 자기장에서야 나타나 기습.' },
    strengths:{ zh:['跑毒意识','生存能力','决赛圈强'], en:['Zone awareness','Survival skills','Strong in final circles'], ko:['자기장 판단력','생존 능력','최종전에 강함'] },
    weaknesses:{ zh:['前期划水','击杀少'], en:['Passive early game','Low kills'], ko:['초반 방관','킬 수 적음'] },
    partner:['CWSF'], nemesis:'RTSF',
    image:'/assert/images/quiz/CWSL.svg' },
  CWIF: { code:'CWIF', group:'shadow',
    nickname:{ zh:'厕所老六', en:'Bathroom Camper', ko:'화장실 캠퍼' },
    description:{ zh:'门后蹲、马桶旁、楼梯拐角全是他的工位，你推门那一刻他已经架好枪等你了', en:"Behind doors, beside toilets, stairwell corners — all his workstations. The moment you push the door, he's already aimed at you.", ko:'문 뒤, 변기 옆, 계단 코너 전부 그의 자리. 문 여는 순간 이미 조준하고 기다리고 있다.' },
    strengths:{ zh:['阴人一绝','反应速度','位置选择'], en:['Ambush master','Fast reactions','Position selection'], ko:['매복의 달인','빠른 반응','포지션 선정'] },
    weaknesses:{ zh:['被骂老六','主动进攻弱'], en:['Gets called a rat','Weak on offense'], ko:['쥐캠이라 욕먹음','공격에 약함'] },
    partner:['CWSL'], nemesis:'RTSF',
    image:'/assert/images/quiz/CWIF.svg' },
  CWIL: { code:'CWIL', group:'shadow',
    nickname:{ zh:'0杀吃鸡王', en:'Zero Kill Winner', ko:'0킬 치킨디너 왕' },
    description:{ zh:'全程跑毒躲人一枪没开，决赛圈对面在毒里被毒死，大吉大利0杀吃鸡', en:'Runs from zone, avoids everyone, never fires a shot. Last enemy dies to zone. Winner winner chicken dinner, 0 kills.', ko:'자기장 피하고 사람 피하고 총 한 발도 안 쏜다. 최종 자기장에서 상대가 자기장에 죽는다. 0킬 치킨디너.' },
    strengths:{ zh:['生存大师','跑毒路线','佛系心态'], en:['Survival master','Zone routing','Zen mindset'], ko:['생존 마스터','자기장 경로','무아지경 멘탈'] },
    weaknesses:{ zh:['没有战斗力','刺激感为零'], en:['Zero combat power','Zero excitement'], ko:['전투력 제로','스릴 제로'] },
    partner:['RTSF'], nemesis:'RWSF',
    image:'/assert/images/quiz/CWIL.svg' },
  CTSF: { code:'CTSF', group:'leader',
    nickname:{ zh:'占楼钉子户', en:'Building Squatter', ko:'건물 점거왕' },
    description:{ zh:'"卡窗架枪谁都别动！" 占了楼就当自己家，交叉火力摆满，攻楼的全成快递员', en:'"Hold windows, nobody move!" Takes a building and calls it home. Crossfire everywhere, attackers become loot deliveries.', ko:'"창문 잡고 아무도 움직이지 마!" 건물 점거하면 내 집처럼 쓴다. 크로스파이어 깔아놓으면 공격자들은 전부 택배기사.' },
    strengths:{ zh:['防守大师','交叉火力','团队协调'], en:['Defense master','Crossfire setup','Team coordination'], ko:['수비 마스터','크로스파이어','팀 협동'] },
    weaknesses:{ zh:['机动性差','被绕容易崩'], en:['Low mobility','Collapses when flanked'], ko:['기동성 부족','우회당하면 무너짐'] },
    partner:['CTIF'], nemesis:'RWIF',
    image:'/assert/images/quiz/CTSF.svg' },
  CTSL: { code:'CTSL', group:'leader',
    nickname:{ zh:'苟王', en:'Stealth King', ko:'생존왕' },
    description:{ zh:'带队跑毒避战发育一条龙，全程不开一枪，决赛圈三队互打的时候出来收割吃鸡', en:'Leads team through zone-running, avoidance, and farming. Zero shots fired until final circle when 3 teams fight and they clean up.', ko:'팀을 이끌고 자기장 타면서 교전 회피하고 파밍 올인. 총 한 발도 안 쏘다가 최종전에서 3팀이 싸울 때 나타나서 정리하고 치킨디너.' },
    strengths:{ zh:['大局观强','指挥能力','收割时机'], en:['Great macro sense','Command ability','Perfect cleanup timing'], ko:['뛰어난 거시적 판단','지휘 능력','완벽한 정리 타이밍'] },
    weaknesses:{ zh:['太保守','队友嫌无聊'], en:['Too passive','Teammates find it boring'], ko:['너무 소극적','팀원들이 지루해함'] },
    partner:['CWSF'], nemesis:'RTSF',
    image:'/assert/images/quiz/CTSL.svg' },
  CTIF: { code:'CTIF', group:'leader',
    nickname:{ zh:'描边急救包', en:'Walking Medkit', ko:'걸어다니는 구급상자' },
    description:{ zh:'子弹完美描边就是打不中人，但拉烟扶队友比120还快，队伍编外急救箱', en:"Bullets trace perfect outlines but never hit. Smoke + revive faster than an ambulance. The team's unofficial first aid kit.", ko:'총알이 완벽하게 윤곽만 그리고 안 맞는다. 하지만 연막 치고 부활시키는 건 구급차보다 빠르다. 팀의 비공식 구급상자.' },
    strengths:{ zh:['拉烟扶人快','团队精神','永不放弃'], en:['Fast smoke revives','Team spirit','Never gives up'], ko:['빠른 연막 부활','팀 정신','절대 포기 안 함'] },
    weaknesses:{ zh:['枪法描边','输出基本为零'], en:["Can't aim",'Near-zero damage output'], ko:['에임 없음','데미지 거의 제로'] },
    partner:['RTSF'], nemesis:'RWSF',
    image:'/assert/images/quiz/CTIF.svg' },
  CTIL: { code:'CTIL', group:'leader',
    nickname:{ zh:'快乐组排', en:'Happy Squad', ko:'즐거운 스쿼드' },
    description:{ zh:'跑毒路上唱歌讲段子，队友倒了先笑再扶，吃不吃鸡不重要开黑就是快乐', en:"Sings and tells jokes while running from zone. Teammate goes down — laughs first, revives second. Winning doesn't matter, playing together is the fun.", ko:'자기장 피하면서 노래하고 개그한다. 팀원 다운되면 먼저 웃고 그다음 살린다. 치킨디너는 중요하지 않다, 같이 노는 게 즐거우니까.' },
    strengths:{ zh:['团队氛围','心态超好','快乐源泉'], en:['Great vibes','Best attitude','Source of joy'], ko:['좋은 분위기','최고의 멘탈','즐거움의 원천'] },
    weaknesses:{ zh:['不认真打','经常坑队友'], en:["Doesn't take it seriously",'Often trolls teammates'], ko:['진지하지 않음','자주 팀원 트롤'] },
    partner:['CTIF'], nemesis:'RWSF',
    image:'/assert/images/quiz/CTIL.svg' },
};
