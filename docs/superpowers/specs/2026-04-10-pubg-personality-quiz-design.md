# PUBG Personality Quiz Design Spec

**Date:** 2026-04-10
**Page:** `quiz.html` (new page)
**Scope:** 16-question PUBG personality test with 16 result types, share card generation, dual entry points (homepage hero + navbar)

---

## Overview

A PUBG-themed personality test inspired by MBTI. 4 dimensions, 4 questions each, 16 questions total. Each question presents a PUBG gameplay scenario with 4 choices. Results map to one of 16 player personality types with authentic Chinese PUBG slang nicknames.

---

## Personality Framework

### Four Dimensions

| Dimension | Letter | Left Pole | Right Pole | Core Question |
|-----------|--------|-----------|------------|---------------|
| Combat Style | **R/C** | Rush (钢枪) | Cautious (苟活) | Do you push fights or avoid them? |
| Social | **W/T** | Wolf (独狼) | Team (开黑) | Solo carry or team play? |
| Decision | **S/I** | Strategic (算圈) | Instinct (莽夫) | Plan ahead or wing it? |
| Resource | **F/L** | Fight (刚枪) | Loot (打野) | Chase kills or chase loot? |

### Scoring

- Each question has 4 options, scoring +2, +1, -1, or -2 on the relevant dimension
- Positive score = left pole (R/W/S/F), negative score = right pole (C/T/I/L)
- Score range per dimension: -8 to +8
- Final type = 4-letter code (e.g., RWSF, CTIL)

### 16 Personality Types

| Code | Nickname (ZH) | Nickname (EN) | Description (ZH) |
|------|---------------|---------------|-------------------|
| RWSF | 单排战神 | Solo War God | 圈算得比数学家准，枪刚得比职业哥猛，单排天花板，排行榜钉子户 |
| RWSL | 独狼 | Lone Wolf | 全程阴在没人知道的角落，决赛圈突然冒出来收人头，击杀回放对面直接懵逼 |
| RWIF | 1V4莽夫 | 1V4 Berserker | 听到枪响血直接上头，管他几个人莽就完了，赢了我是神输了就是伞兵 |
| RWIL | 野区仓鼠 | Loot Hamster | 专跳没人的野区疯狂舔包，三级头三级甲八倍镜全齐了还在搜，背包比枪法值钱 |
| RTSF | 意识钢枪 | Tactical Fragger | "左边232一个！烟雾弹拉了冲！" 报点像开了雷达，带队钢枪从没怂过 |
| RTSL | 舔包保姆 | Loot Nanny | 航线研究得比飞行员还细，搜完把三级甲和高倍镜全丢给队友，自己穿二级甲舔剩的 |
| RTIF | 伞兵 | Paratrooper | 落地就冲，倒地就喊"拉我拉我"，扶起来继续莽，队友天天给他收尸 |
| RTIL | 顺丰快递 | Express Delivery | 搜了一背包空投物资信心满满出门刚枪，两秒倒地，对面开开心心舔包签收 |
| CWSF | 伏地魔 | Prone Sniper | 麦田里趴得跟地形贴图似的，架着8倍镜等你路过，800米爆头你连人都找不到 |
| CWSL | 跑毒专业户 | Zone Runner | 毒圈路线算得比GPS还准，永远贴边跑毒苟命，决赛圈才冒出来阴人 |
| CWIF | 厕所老六 | Bathroom Camper | 门后蹲、马桶旁、楼梯拐角全是他的工位，你推门那一刻他已经架好枪等你了 |
| CWIL | 0杀吃鸡王 | Zero Kill Winner | 全程跑毒躲人一枪没开，决赛圈对面在毒里被毒死，大吉大利0杀吃鸡 |
| CTSF | 占楼钉子户 | Building Squatter | "卡窗架枪谁都别动！" 占了楼就当自己家，交叉火力摆满，攻楼的全成快递员 |
| CTSL | 苟王 | Stealth King | 带队跑毒避战发育一条龙，全程不开一枪，决赛圈三队互打的时候出来收割吃鸡 |
| CTIF | 描边急救包 | Walking Medkit | 子弹完美描边就是打不中人，但拉烟扶队友比120还快，队伍编外急救箱 |
| CTIL | 快乐组排 | Happy Squad | 跑毒路上唱歌讲段子，队友倒了先笑再扶，吃不吃鸡不重要开黑就是快乐 |

### Per-Type Extended Data

Each type includes:
- **Strengths:** 2-3 red tags (e.g., "枪法在线", "意识顶级")
- **Weaknesses:** 2-3 gray tags (e.g., "容易上头", "团队配合差")
- **Best Partner:** 1-2 complementary type codes + nicknames
- **Nemesis:** 1 type you're weak against

---

## 16 Questions

### Dimension 1: R/C Combat Style (Q1-Q4)

**Q1. 刚落地捡到一把枪，隔壁楼有脚步声，你会：**
- A) 直接冲过去刚，落地不钢不是人 → R+2
- B) 先把这栋楼搜完再说，装备压制 → C+1
- C) 脚步声近就干，远就先搜 → R+1
- D) 赶紧换栋楼，惹不起躲得起 → C+2

**Q2. 决赛圈还剩4队，你的位置不错，你会：**
- A) 主动找人打，不打等着被包夹？ → R+2
- B) 架好枪等有人先动手，谁露头打谁 → C+1
- C) 听到交火就插一脚，收人头 → R+1
- D) 趴着不动，等他们互打剩最后一队我再收 → C+2

**Q3. 空投落在200米外的空地上，你会：**
- A) 直接冲，空投就是给猛男准备的 → R+2
- B) 开车过去抢完就跑 → R+1
- C) 先观察有没有人盯着，安全了再去 → C+1
- D) 不去，空投就是陷阱 → C+2

**Q4. 你有一把满配M4和三级甲，这时候你想：**
- A) 装备到位了该出去杀人了 → R+2
- B) 找个好位置架起来守点 → C+1
- C) 去人多的地方找刺激 → R+1
- D) 接着搜，看能不能搜到8倍镜 → C+2

### Dimension 2: W/T Social (Q5-Q8)

**Q5. 你最喜欢的游戏模式是：**
- A) 单排，生死靠自己 → W+2
- B) 双排，一个靠谱队友就够 → W+1
- C) 四排开黑，兄弟们一起上 → T+2
- D) 四排但不想语音，默契配合就行 → T+1

**Q6. 队友倒在对面枪口下，你会：**
- A) 他自己倒的自己爬，我先打赢再说 → W+2
- B) 看情况，能扶就扶，不能扶就算了 → W+1
- C) 拉烟冲过去扶，兄弟不能丢 → T+2
- D) 先把对面打掉再去扶，这是正确打法 → T+1

**Q7. 搜到一个三级头，你已经有了，队友还是二级，你会：**
- A) 留着呗，万一我这个被打烂了换 → W+2
- B) 看队友要不要，不主动给 → W+1
- C) 直接丢给队友，团队装备最大化 → T+2
- D) 给队里枪法最好的那个人 → T+1

**Q8. 排队等匹配的时候你在：**
- A) 一个人练枪 → W+2
- B) 刷手机等着 → W+1
- C) 跟队友语音吹牛聊天 → T+2
- D) 在群里约人凑队 → T+1

### Dimension 3: S/I Decision (Q9-Q12)

**Q9. 第一个圈刷出来了，你的第一反应是：**
- A) 马上看圈心位置，规划转移路线 → S+2
- B) 先搜完这片再走，到时候再说 → I+1
- C) 找车提前去圈心占位 → S+1
- D) 圈不急，毒来了再跑 → I+2

**Q10. 你开车路上看到右边房区有人，你会：**
- A) 记住位置，标记一下，后面绕过来打 → S+2
- B) 直接开车撞过去 → I+2
- C) 先跑，等下找个好位置回来阴他 → S+1
- D) 看心情，有时候冲有时候跑 → I+1

**Q11. 你进了一个大城区，你的搜楼顺序是：**
- A) 从边缘搜到中心，有计划有路线 → S+2
- B) 哪栋楼顺眼搜哪栋 → I+2
- C) 先占高楼架枪观察，确认安全再搜 → S+1
- D) 跟着脚步声走，有人就打没人就搜 → I+1

**Q12. 决赛圈即将刷新，你会：**
- A) 提前预判下个圈在哪，抢占有利地形 → S+2
- B) 等圈刷了再动，随机应变 → I+1
- C) 看地形找最近的硬掩体 → S+1
- D) 管他刷哪，兵来将挡水来土掩 → I+2

### Dimension 4: F/L Resource (Q13-Q16)

**Q13. 跳伞你喜欢跳哪里：**
- A) 军事基地、P城，人多肥的地方 → F+2
- B) 航线正下方的中型城区 → F+1
- C) 离航线远的小城镇 → L+1
- D) 最远的野区房子，越没人越好 → L+2

**Q14. 你搜完一片区域，接下来你想：**
- A) 去找人打，装备够用就行 → F+2
- B) 听哪边有枪声往哪边走 → F+1
- C) 去下一片没人搜过的地方继续搜 → L+1
- D) 找个安全地方蹲着等圈 → L+2

**Q15. 你理想中的一局吃鸡是：**
- A) 15杀吃鸡，全程高能 → F+2
- B) 七八杀，关键时刻打赢了就行 → F+1
- C) 三四杀，决赛圈赢了就够 → L+1
- D) 0杀也行，只要赢了 → L+2

**Q16. 你更在意哪个数据：**
- A) K/D，杀人才是核心 → F+2
- B) 场均伤害 → F+1
- C) 胜率，赢才是目的 → L+1
- D) 前十率，活下来才是王道 → L+2

---

## UI Design

### Page Flow

```
Homepage hero CTA / Navbar link
    ↓
quiz.html Landing (title + start button)
    ↓
Question flow (1/16 progress bar)
    ↓  Manual "next" button, "prev" button to go back
Result page (code + nickname + description + radar + partner)
    ↓
Share card (Canvas-generated image, save/download)
    ↓
"Retry" / "View all types"
```

### Landing Screen

- Full-screen dark background, site-consistent style
- Title: "你是哪种吃鸡玩家？" / "What PUBG Player Are You?"
- Subtitle: "16题测出你的PUBG人格" / "16 questions to find your PUBG personality"
- Red CTA button "开始测试" / "Start Test", clip-path angled corners
- Small text below: "已有 N 人完成测试" (localStorage counter, decorative)

### Question Screen

- **Top:** Red progress bar (1/16 → 16/16), clickable to jump back to any answered question
- **Center:** Question text, large white text on dark background
- **Below:** 4 option cards, vertical stack, dark card background + hover red border
- **Selected state:** Card gets red border + subtle red tint
- **Bottom navigation:**
  - Left: "上一题" / "Previous" button (hidden on Q1)
  - Right: "下一题" / "Next" button (appears after selecting an option, "查看结果" on Q16)
- **No auto-advance.** User selects option, can change mind, then manually clicks next.
- **Mobile:** Option cards full-width, comfortable tap targets (min 48px height)

### Result Screen

Inspired by MBTI result pages (e.g., sbti.unun.dev) but adapted to our dark/red PUBG theme. Stacked card layout, each card with dark glass background (rgba(255,255,255,0.06)) and subtle border.

**Card 1: Hero Result Card (top, most prominent)**
- Dark card with group theme color accent (red/purple/green/gold top border or glow)
- "你的吃鸡人格是：" / "Your PUBG personality is:" (small gray text)
- **Nickname in huge bold text** (e.g., "1V4莽夫") with group theme color
- **4-letter code below** (e.g., "RWIF") in red/accent color, slightly smaller
- **Character illustration** centered below (SVG placeholder initially, replaced with AI-generated PNG later)
- One-line tagline from description in gray text below image

**Card 2: Type Summary Card**
- "你的主类型" / "Your main type" label
- **CODE（Nickname）** in large text (e.g., "RWIF（1V4莽夫）")
- Group badge with theme color (e.g., "🔴 猛攻组 Rush" red pill badge)
- Short personality summary (2-3 sentences from description)

**Card 3: Dimension Breakdown Card**
- 4 dimension bars, each showing position between two poles
- Bar style: dark track with group-colored fill, pole labels on each end
- Example: `钢枪 ██████████░░░░ 苟活` with percentage
- Each bar labeled with dimension name

**Card 4: Strengths & Weaknesses Card**
- Split into two sections side by side
- **Strengths:** 2-3 tags with red/green background
- **Weaknesses:** 2-3 tags with gray background
- Tags are pill-shaped badges

**Card 5: Relationships Card**
- **Best Partner:** 1-2 complementary types, each showing small avatar + code + nickname, clickable
- **Nemesis:** 1 type you're weak against, same format
- Small text explaining why they complement/counter you

**Card 6: Actions Card**
- "生成分享图" / "Generate Share Card" primary red CTA button
- "再测一次" / "Retry" secondary outline button
- "查看全部人格" / "View All Types" text link

**Mobile layout:** Cards stack vertically, full-width with 16px side padding, 12px gap between cards.
**Desktop layout:** Cards centered, max-width 640px, same stacked layout.

### Share Card

- Canvas-rendered, 750x1334px (mobile portrait ratio)
- Dark background (#000 or #111) with group theme color accents
- Content layout (top to bottom):
  - KEY GENE logo (small, top-left)
  - "你的吃鸡人格是" label
  - Character illustration (centered, largest element)
  - Nickname in huge bold text with theme color
  - 4-letter code
  - One-line description in gray
  - 4 mini dimension bars
  - Site URL: keygene.top (bottom)
- Red/theme color border or glow effect around card edge
- Download as PNG on click/tap

### Entry Points

**Homepage hero area:**
- New CTA button in the hero section, near or below existing recruitment CTA
- Text: "测测你的吃鸡人格" / "Find Your PUBG Personality"
- Style: Secondary CTA, clip-path angled corners, same visual weight as existing buttons

**Navbar:**
- New link "人格" / "Quiz" after the last nav item (Competitive/竞技榜)
- Updated on all 5 pages (index, stats, maps, leaderboard, quiz)
- Mobile nav overlay also updated

---

## Technical Implementation

- **Single static HTML file** (`quiz.html`), consistent with existing site architecture
- **No build tools, no frameworks.** Vanilla HTML/CSS/JS.
- **Quiz data** (questions, options, scoring, personality types) stored as JS objects in the file
- **Scoring logic** runs entirely client-side
- **Radar chart** drawn with Canvas API
- **Share card** rendered with Canvas API (same pattern as stats.html image export)
- **i18n** uses existing `data-key` + `texts` object pattern, zh/en toggle
- **CSS** uses existing CSS custom properties (--red, --black, --white, etc.)
- **Accessibility:**
  - `focus-visible` styling (already global)
  - `prefers-reduced-motion` respected (already global)
  - Keyboard navigable (tab through options, enter to select)
  - ARIA labels on progress bar and interactive elements
- **localStorage:**
  - Save completion count (decorative counter)
  - Save last result (so user can revisit without retaking)

---

## i18n Keys Required

All visible text needs zh/en entries in the `texts` object. Key areas:
- Landing screen (title, subtitle, CTA)
- All 16 question texts + 64 option texts
- All 16 personality type names + descriptions + strengths/weaknesses
- Result page labels (dimensions, partner, nemesis)
- Navigation link text
- Share card text

---

## Files Changed

| File | Change |
|------|--------|
| `quiz.html` | New file, entire quiz page |
| `index.html` | Add hero CTA entry point + navbar link + mobile-nav link |
| `stats.html` | Add navbar/header link |
| `maps.html` | Add navbar link + mobile-nav link |
| `leaderboard.html` | Add navbar link + mobile-nav link |

---

## Character Illustrations

Each personality type needs a chibi-style cartoon character illustration (similar to MBTI personality avatars). 16 images total, stored in `assert/images/quiz/`.

### Recommended Tools (Free)

1. **即梦 (Jimeng)** jimeng.jianying.com ... Best pick. Chinese prompt support, Seedream 3.0 quality, free tier covers 16 images. Use style lock to keep consistency.
2. **Ideogram** ideogram.ai ... Free, best text rendering if you want code/nickname on the image.
3. **AnimFun.ai** anifun.ai ... Free unlimited, dedicated chibi model, no sign-up needed.

### Style Reference

Cute minimal cartoon character, chibi proportions (big head, small body), simple geometric shapes, flat color, PUBG themed, white or transparent background, full body, front view, clean vector illustration style.

### Generation Tips

- Generate one character first, get the style right, then use style reference/lock to generate the rest
- Square ratio (1:1), at least 512x512px
- White background for easy integration with dark site (or transparent PNG)
- Save as: `assert/images/quiz/RWSF.png`, `assert/images/quiz/RWSL.png`, etc.

### Character Design System

Inspired by 16personalities.com: unified art style across all 16 characters, but each has unique hair, skin tone, clothing, accessories, pose, expression, and theme color. Characters are grouped into 4 color families.

**Four Groups & Theme Colors:**

| Group | Theme Color | Types | Vibe |
|-------|------------|-------|------|
| 猛攻组 Rush | Red / Orange | RWSF, RWIF, RTSF, RTIF | Aggressive, combat-ready |
| 谋略组 Brain | Purple / Blue | RWSL, RWIL, RTSL, RTIL | Clever, planning, support |
| 潜伏组 Shadow | Green / Dark | CWSF, CWSL, CWIF, CWIL | Stealth, patience, hidden |
| 指挥组 Leader | Gold / Yellow | CTSF, CTSL, CTIF, CTIL | Leadership, team, command |

### Prompts (即梦 Jimeng)

Upload MBTI character reference image as style reference. Use "图生图" or "风格参考" mode.

**统一画风前缀（每个 prompt 开头加）：**

```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格
```

**16个角色完整 prompt（可直接复制粘贴）：**

**RWSF 单排战神（红橙组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，红橙色系主题，方正脸型棱角分明，黑色板寸短发干练利落，剑眉星目，深棕色瞳孔，瞳孔里有战意光芒，鼻梁高挺，嘴角微微上扬露出自信的半笑，小麦色健康肤色，穿红色战术背心和黑色作战裤，双臂交叉抱胸，头顶漂浮小金色皇冠，脚边有弹壳
```

**RWSL 独狼（紫蓝组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，深紫色系主题，尖下巴窄脸型，银灰色碎刘海遮住右眼，左眼露出来是冰蓝色瞳孔带冷光，眉毛细长微挑，薄嘴唇紧抿，苍白皮肤，穿深紫色兜帽斗篷和暗色衣服，一根手指放嘴唇做嘘手势，冷酷神秘的氛围
```

**RWIF 1V4莽夫（红橙组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，亮橙色系主题，圆脸宽额头，火红色短寸头炸毛竖起来像火焰，浓眉大圆眼瞪得溜圆，瞳孔是热烈的橙红色，鼻子圆圆的，咧嘴大笑露出牙齿，黝黑皮肤，左脸有一条小创可贴，穿橙色无袖背心露出手臂，双手各举一把手枪，背后有爆炸效果
```

**RWIL 野区仓鼠（紫蓝组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，浅蓝紫色系主题，圆圆的胖脸蛋，蓬松栗棕色蘑菇头短发，圆溜溜的大眼睛是榛子色的，眼神天真好奇，小圆鼻子，嘴巴鼓成O型腮帮子塞满像仓鼠，白皙皮肤脸颊粉红，穿蓝紫色连帽卫衣，背着一个比身体还大的鼓鼓背包，双手抱着各种物资
```

**RTSF 意识钢枪（红橙组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，暗红色系主题，国字脸轮廓硬朗，利落黑色侧分短发一丝不苟，浓黑剑眉，深棕色锐利眼神目光如炬，高鼻梁薄嘴唇微抿，古铜色皮肤，戴黑色战术耳麦带麦克风，穿暗红色军事夹克，一手指向前方发号施令
```

**RTSL 舔包保姆（紫蓝组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，柔和蓝色系主题，鹅蛋脸柔和圆润，温柔棕色长发扎低马尾辫有几缕碎发垂在脸旁，弯弯的柳叶眉，大大的深蓝色水汪汪眼睛，小巧鼻子，嘴角上扬温暖微笑带酒窝，白皙皮肤脸颊微粉，穿浅蓝色围裙风格背心，双手向前捧着一个头盔递出去，身边漂浮小爱心
```

**RTIF 伞兵（红橙组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，明亮橙黄色系主题，圆脸婴儿肥，乱蓬蓬的金色卷毛头发被风吹得炸开，眉毛高高挑起惊恐状，大大的绿色眼睛瞪到最大，嘴巴张成大O型在尖叫，满脸雀斑，浅肤色，穿橙色跳伞服，身上连着白色降落伞，四肢张开下落姿势，一只鞋飞出去了
```

**RTIL 顺丰快递（紫蓝组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，蓝灰色系主题，方圆脸老实相，黑色齐刘海短发很规矩，八字眉耷拉着，圆圆的棕色眼睛里满是委屈和困惑，小鼻子，嘴巴微微撇着快哭的样子，正常肤色，戴蓝色快递帽，穿蓝色制服，抱着一个溢出枪械的纸箱正在向前绊倒，物品洒落
```

**CWSF 伏地魔（绿暗组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，深绿色系主题，窄长脸型像蛇，墨绿色短发贴着头皮很服帖，细长丹凤眼半睁半闭是暗绿色瞳孔带幽光，眉毛又平又直，薄嘴唇没有表情，惨白皮肤，穿全身深绿色吉利服身上沾着草和树叶，趴伏姿势只露出眼睛，手持带瞄准镜的狙击枪，周围有草丛
```

**CWSL 跑毒专业户（绿暗组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，青绿色系主题，椭圆脸型利落干练，深棕色高马尾辫扎得很紧，戴青绿色运动发带，弯眉毛不紧不慢，琥珀色大眼睛镇定自若地斜看手腕，小翘鼻，嘴唇微抿淡定从容，小麦肤色额头有几滴汗珠，穿绿色运动服和跑鞋，奔跑姿势看手表，身后有蓝色电圈效果
```

**CWIF 厕所老六（绿暗组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，暗绿色系主题，三角形尖下巴脸型像狐狸，戴黑色毛线帽压得很低，从帽子下面露出几缕深绿色碎发，眉毛一高一低，一只黄绿色眼睛从门缝里露出来闪烁着狡猾的光，嘴角歪歪地阴笑，肤色偏暗，穿深灰绿色卫衣，躲在一扇门后面只露出半个身子，手里攥着霰弹枪
```

**CWIL 0杀吃鸡王（绿暗组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，淡绿薄荷色系主题，圆圆的佛系脸型很柔和，光头圆脑袋反光，弯弯的细眉毛像月牙，眼睛闭着弯成两条线在微笑，圆鼻头，嘴角上扬一脸祥和慈悲，白皙皮肤泛着健康的粉色，穿宽松浅绿色和服风格上衣，盘腿打坐冥想姿势，背后背着平底锅，头顶漂浮一只金色小鸡
```

**CTSF 占楼钉子户（金黄组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，金色系主题，方正国字脸下巴很宽，深棕色一丝不苟的偏分短发，戴金边方框眼镜，粗眉毛皱着，深棕色眼睛从镜片后面俯视你，高鼻梁，嘴巴紧闭一脸威严不怒自威，古铜肤色，穿金黄色军装外套挂着勋章，双手叉腰站在高处，脚下有建筑轮廓
```

**CTSL 苟王（金黄组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，暗金色系主题，瘦长瓜子脸，黑色中分长刘海顺滑地遮住右眼只露左眼，左眼是琥珀金色的很有算计感，细长眉毛微挑，尖鼻子，嘴角勾起狐狸般的狡猾微笑，白皙皮肤，穿橄榄绿配金色纹路的迷彩外套，踮脚走路姿势，一手指着太阳穴做聪明手势，脚边有小灌木
```

**CTIF 描边急救包（金黄组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，暖黄色系主题，圆脸肉嘟嘟的，蓬松红棕色短卷发毛茸茸像小绵羊，弯弯的粗眉毛皱在一起很着急，大大的棕色圆眼睛湿润含泪但很坚定，圆鼻头红红的，嘴巴张开喊着什么，白里透红的肤色脸蛋红扑扑，穿黄色卫衣戴红十字臂章，双手抱着白色急救箱奔跑，身边有子弹飞过全部打偏
```

**CTIL 快乐组排（金黄组）：**
```
极简Q版卡通人物，大头小身比例约3:2，圆润几何风格，扁平插画，大眼睛，柔和色彩，纯白色背景，单个人物居中，全身正面站立，干净矢量风，无文字无边框，类似16personalities官网MBTI人格小人的插画风格，明亮黄色系主题，圆脸笑得眯起来，彩色渐变挑染的蓬松短发有粉色蓝色黄色发缕，眉毛弯弯的很开心，大眼睛笑成月牙形是亮棕色的，小翘鼻子，嘴巴张得大大的哈哈大笑露出两颗小虎牙，肤色健康带晒痕，穿亮黄色T恤和宽松短裤，戴大号彩色游戏耳机，坐姿，周围漂浮音符和笑脸
```

---

## Out of Scope

- Server-side storage or analytics (pure client-side)
- Social media API integration (share via screenshot/save only)
- Animated transitions between questions (keep it snappy)
- Result comparison with friends (future feature)
