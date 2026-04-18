import { useState, useMemo, useEffect } from 'preact/hooks';
import type { QuizQuestion, PersonalityType } from '../data/quiz';

interface Labels {
  quizTag: string;
  quizTitle1: string;
  quizTitle2: string;
  quizSub: string;
  quizStart: string;
  quizCounterText: string;
  quizLastResult: string;
  quizPrev: string;
  quizNext: string;
  quizViewResult: string;
  resultLabel: string;
  resultGroupLabel: string;
  resultStrengths: string;
  resultWeaknesses: string;
  resultPartner: string;
  resultNemesis: string;
  resultRetry: string;
  resultShare: string;
  shareSave: string;
  shareClose: string;
  resultViewAll: string;
  allTypesTitle: string;
}

interface DimensionLabel {
  left: Record<string, string>;
  right: Record<string, string>;
  name: Record<string, string>;
}

interface Props {
  questions: QuizQuestion[];
  types: Record<string, PersonalityType>;
  groupColors: Record<string, string>;
  groupInfo: Record<string, Record<string, string>>;
  dimensionLabels: Record<string, DimensionLabel>;
  lang: string;
  labels: Labels;
}

type Screen = 'landing' | 'quiz' | 'result';

export default function QuizEngine({ questions, types, groupColors, groupInfo, dimensionLabels, lang, labels }: Props) {
  const [screen, setScreen] = useState<Screen>('landing');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(16).fill(null));
  const [resultCode, setResultCode] = useState<string | null>(null);
  const [resultScores, setResultScores] = useState<Record<string, number>>({ RC: 0, WT: 0, SI: 0, FL: 0 });
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [shareDataURL, setShareDataURL] = useState<string | null>(null);

  // Esc key closes overlays
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showShareOverlay) setShowShareOverlay(false);
      else if (showAllTypes) setShowAllTypes(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showShareOverlay, showAllTypes]);

  // Counter from localStorage
  const counter = useMemo(() => {
    try {
      const c = parseInt(localStorage.getItem('quizCompletions') || '0');
      return c + Math.floor(Math.random() * 50) + 128;
    } catch { return 128; }
  }, []);

  // Check saved result
  const savedResult = useMemo(() => {
    try {
      const s = localStorage.getItem('quizLastResult');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }, []);

  function startQuiz() {
    setCurrentQ(0);
    setAnswers(new Array(16).fill(null));
    setScreen('quiz');
  }

  function selectOption(qi: number, oi: number) {
    const next = [...answers];
    next[qi] = oi;
    setAnswers(next);
  }

  function goNext() {
    if (answers[currentQ] === null) return;
    if (currentQ < 15) {
      setCurrentQ(currentQ + 1);
    } else {
      // Calculate
      const scores: Record<string, number> = { RC: 0, WT: 0, SI: 0, FL: 0 };
      questions.forEach((q, i) => {
        if (answers[i] !== null) {
          scores[q.dim] += q.options[answers[i]!].value;
        }
      });
      const code =
        (scores.RC >= 0 ? 'R' : 'C') +
        (scores.WT >= 0 ? 'W' : 'T') +
        (scores.SI >= 0 ? 'S' : 'I') +
        (scores.FL >= 0 ? 'F' : 'L');
      setResultCode(code);
      setResultScores(scores);
      setScreen('result');
      try {
        localStorage.setItem('quizLastResult', JSON.stringify({ code, scores }));
        const c = parseInt(localStorage.getItem('quizCompletions') || '0');
        localStorage.setItem('quizCompletions', String(c + 1));
      } catch {}
      window.scrollTo(0, 0);
    }
  }

  function goPrev() {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  }

  function showSavedResult() {
    if (savedResult) {
      setResultCode(savedResult.code);
      setResultScores(savedResult.scores);
      setScreen('result');
    }
  }

  function viewTypeResult(code: string) {
    const scores: Record<string, number> = { RC: 0, WT: 0, SI: 0, FL: 0 };
    scores.RC = code[0] === 'R' ? 4 : -4;
    scores.WT = code[1] === 'W' ? 4 : -4;
    scores.SI = code[2] === 'S' ? 4 : -4;
    scores.FL = code[3] === 'F' ? 4 : -4;
    setResultCode(code);
    setResultScores(scores);
    setShowAllTypes(false);
    setScreen('result');
    window.scrollTo(0, 0);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 0) w = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const chars = text.split('');
    let line = '';
    let ly = y;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, ly);
        line = chars[i];
        ly += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, ly);
  }

  function generateShareCard() {
    if (!resultCode || !types[resultCode]) return;
    const type = types[resultCode];
    const gc = groupColors[type.group];

    const canvas = document.createElement('canvas');
    const W = 750, H = 1334;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = gc;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // Load images then draw
    const logoImg = new Image();
    const avatarImg = new Image();
    let loaded = 0;

    function onLoad() {
      loaded++;
      if (loaded < 2) return;

      // Logo
      try { ctx!.drawImage(logoImg, 30, 30, 48, 48); } catch {}
      ctx!.fillStyle = '#fff';
      ctx!.font = '700 24px Rubik, sans-serif';
      ctx!.textAlign = 'left';
      ctx!.fillText('KEY GENE', 88, 62);

      // Label
      ctx!.fillStyle = '#888';
      ctx!.font = '400 22px Rubik, sans-serif';
      ctx!.textAlign = 'center';
      ctx!.fillText(labels.resultLabel, W / 2, 140);

      // Avatar
      try { ctx!.drawImage(avatarImg, W / 2 - 120, 180, 240, 240); } catch {}

      // Nickname
      ctx!.fillStyle = gc;
      ctx!.font = '900 56px Rubik, sans-serif';
      ctx!.textAlign = 'center';
      ctx!.fillText(type.nickname[lang as keyof typeof type.nickname] as string, W / 2, 490);

      // Code
      ctx!.fillStyle = gc;
      ctx!.font = '700 32px Rubik, sans-serif';
      ctx!.fillText(type.code, W / 2, 540);

      // Group badge
      ctx!.fillStyle = '#888';
      ctx!.font = '500 20px Rubik, sans-serif';
      ctx!.fillText(groupInfo[type.group]?.[lang] || '', W / 2, 580);

      // Description
      ctx!.fillStyle = '#aaa';
      ctx!.font = '400 20px Rubik, sans-serif';
      const desc = type.description[lang as keyof typeof type.description] as string;
      wrapText(ctx!, desc, W / 2, 640, W - 100, 28);

      // Dimension bars
      const dims = ['RC', 'WT', 'SI', 'FL'];
      let barY = 800;
      dims.forEach(dim => {
        const info = dimensionLabels[dim];
        const pct = Math.round(((resultScores[dim] + 8) / 16) * 100);

        ctx!.textAlign = 'left';
        ctx!.fillStyle = '#888';
        ctx!.font = '500 16px Rubik, sans-serif';
        ctx!.fillText(info.name[lang], 60, barY);

        ctx!.textAlign = 'right';
        ctx!.fillText(pct + '%', W - 60, barY);

        // Track
        const trackX = 60, trackW = W - 120, trackH = 10;
        barY += 12;
        ctx!.fillStyle = 'rgba(255,255,255,0.1)';
        roundRect(ctx!, trackX, barY, trackW, trackH, 5);
        ctx!.fill();

        // Fill
        ctx!.fillStyle = gc;
        roundRect(ctx!, trackX, barY, trackW * pct / 100, trackH, 5);
        ctx!.fill();

        // Pole labels
        barY += 24;
        ctx!.fillStyle = '#666';
        ctx!.font = '400 14px Rubik, sans-serif';
        ctx!.textAlign = 'left';
        ctx!.fillText(info.left[lang], 60, barY);
        ctx!.textAlign = 'right';
        ctx!.fillText(info.right[lang], W - 60, barY);

        barY += 40;
      });

      // Strengths
      barY += 10;
      ctx!.textAlign = 'center';
      ctx!.fillStyle = gc;
      ctx!.font = '600 18px Rubik, sans-serif';
      const strengths = (type.strengths[lang as keyof typeof type.strengths] as string[])
        || (type.strengths.zh as string[])
        || [];
      ctx!.fillText(strengths.join('  ·  '), W / 2, barY);

      // URL
      ctx!.fillStyle = '#555';
      ctx!.font = '500 20px Rubik, sans-serif';
      ctx!.textAlign = 'center';
      ctx!.fillText('keygene.top', W / 2, H - 40);

      setShareDataURL(canvas.toDataURL('image/png'));
      setShowShareOverlay(true);
    }

    logoImg.crossOrigin = 'anonymous';
    avatarImg.crossOrigin = 'anonymous';
    logoImg.onload = onLoad;
    avatarImg.onload = onLoad;
    logoImg.onerror = onLoad;
    avatarImg.onerror = onLoad;
    logoImg.src = '/assert/images/helmet-red.png';
    avatarImg.src = type.image;
  }

  function downloadShare() {
    if (!shareDataURL) return;
    const link = document.createElement('a');
    link.download = 'pubg-personality-' + (resultCode || 'result') + '.png';
    link.href = shareDataURL;
    link.click();
  }

  const responsiveStyles = `
    @media (max-width: 768px) {
      .quiz-question { font-size: 18px !important; }
      .quiz-result-nickname { font-size: 32px !important; }
      .quiz-sw-grid { grid-template-columns: 1fr !important; }
      .quiz-types-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    .quiz-option { min-height: 48px; display: flex; align-items: center; transition: border-color 0.2s, background 0.2s, color 0.2s; }
    .quiz-option:hover { border-color: rgba(238,63,44,0.4) !important; color: #fff !important; }
    .quiz-prev-btn { transition: border-color 0.2s, color 0.2s; }
    .quiz-prev-btn:hover { border-color: var(--color-text-muted) !important; color: var(--color-text) !important; }
    .quiz-type-card { transition: transform 0.2s; }
    .quiz-type-card:hover { transform: translateY(-3px); }
    .quiz-result-card { padding: 32px 24px; }
    @media (max-width: 768px) {
      .quiz-result-card { padding: 24px 16px !important; }
    }
  `;

  // ===== LANDING =====
  if (screen === 'landing') {
    return (
      <div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:90px 24px 60px;">
        <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
        <div style="display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-red);margin-bottom:20px;">
          <span style="width:24px;height:2px;background:var(--color-red);display:inline-block;" />
          {labels.quizTag}
        </div>
        <h1 style="font-size:clamp(36px,8vw,52px);font-weight:800;letter-spacing:-0.04em;text-transform:uppercase;line-height:1.1;margin:0 0 16px;">
          {labels.quizTitle1}<br />
          <span style="color:var(--color-red);">{labels.quizTitle2}</span>
        </h1>
        <p style="font-size:16px;color:var(--color-text-muted);line-height:1.6;max-width:480px;margin:0 0 40px;">
          {labels.quizSub}
        </p>
        <button class="btn-clip btn-red" onClick={startQuiz} style="font-size:16px;padding:16px 40px;">
          {labels.quizStart}
        </button>
        <div style="margin-top:24px;font-size:13px;color:var(--color-text-muted);">
          {counter} {labels.quizCounterText}
        </div>
        {savedResult && (
          <div style="margin-top:16px;font-size:14px;">
            <button type="button" onClick={showSavedResult} style="color:var(--color-red);text-decoration:underline;cursor:pointer;background:none;border:none;padding:0;font:inherit;">
              {labels.quizLastResult}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== QUIZ =====
  if (screen === 'quiz') {
    const q = questions[currentQ];
    return (
      <div class="quiz-container" style="max-width:640px;margin:0 auto;padding:90px 24px 60px;">
        <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
        {/* Progress counter */}
        <div style="text-align:center;font-size:13px;color:var(--color-text-muted);margin-bottom:8px;letter-spacing:0.06em;">
          {currentQ + 1} / 16
        </div>
        {/* Progress bar */}
        <div style="display:flex;gap:4px;margin-bottom:32px;" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={currentQ + 1} aria-label={`Question ${currentQ + 1} of ${questions.length}`}>
          {questions.map((_, i) => {
            const clickable = i < currentQ || answers[i] !== null;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Go to question ${i + 1}`}
                disabled={!clickable}
                onClick={() => { if (clickable) setCurrentQ(i); }}
                style={{
                  flex: 1,
                  height: '4px',
                  padding: 0,
                  border: 'none',
                  borderRadius: '2px',
                  cursor: clickable ? 'pointer' : 'default',
                  background:
                    answers[i] !== null
                      ? 'var(--color-red)'
                      : i === currentQ
                        ? 'rgba(238,63,44,0.5)'
                        : 'var(--color-border)',
                }}
              />
            );
          })}
        </div>
        {/* Question text */}
        <div class="quiz-question" style="font-size:22px;font-weight:700;line-height:1.4;margin-bottom:28px;text-align:center;">
          {q.text[lang as keyof typeof q.text]}
        </div>
        {/* Options */}
        <div role="radiogroup" aria-label={q.text[lang as keyof typeof q.text]} style="display:flex;flex-direction:column;gap:12px;">
          {q.options.map((opt, oi) => {
            const selected = answers[currentQ] === oi;
            return (
              <button
                key={oi}
                type="button"
                role="radio"
                aria-checked={selected}
                className="quiz-option"
                onClick={() => selectOption(currentQ, oi)}
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  width: '100%',
                  background: selected ? 'rgba(238,63,44,0.08)' : 'var(--color-card-bg)',
                  border: `1.5px solid ${selected ? 'var(--color-red)' : 'var(--color-card-border)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: '1.5',
                  color: selected ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}
              >
                {opt.text[lang as keyof typeof opt.text]}
              </button>
            );
          })}
        </div>
        {/* Nav */}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:32px;gap:12px;">
          {currentQ > 0 ? (
            <button
              onClick={goPrev}
              className="quiz-prev-btn"
              style="padding:12px 24px;font-weight:600;font-size:14px;border:1px solid var(--color-border);background:transparent;color:var(--color-text-muted);border-radius:8px;cursor:pointer;"
            >
              {labels.quizPrev}
            </button>
          ) : (
            <span />
          )}
          <button
            class="btn-clip btn-red"
            onClick={goNext}
            disabled={answers[currentQ] === null}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              opacity: answers[currentQ] === null ? '0.3' : '1',
              cursor: answers[currentQ] === null ? 'not-allowed' : 'pointer',
            }}
          >
            {currentQ === 15 ? labels.quizViewResult : labels.quizNext}
          </button>
        </div>
      </div>
    );
  }

  // ===== RESULT =====
  if (screen === 'result' && resultCode && types[resultCode]) {
    const type = types[resultCode];
    const gc = groupColors[type.group];

    return (
      <div class="quiz-container" style="max-width:640px;margin:0 auto;padding:90px 16px 60px;">
        <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
        {/* Hero card */}
        <div className="quiz-result-card" style={`background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:16px;margin-bottom:12px;text-align:center;position:relative;overflow:hidden;`}>
          <div style={`position:absolute;top:0;left:0;right:0;height:4px;background:${gc};`} />
          <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:8px;letter-spacing:0.06em;">{labels.resultLabel}</div>
          <div class="quiz-result-nickname" style={`font-size:42px;font-weight:900;line-height:1.1;margin-bottom:8px;letter-spacing:-0.02em;color:${gc};`}>
            {type.nickname[lang as keyof typeof type.nickname]}
          </div>
          <div style={`font-size:20px;font-weight:700;letter-spacing:0.1em;margin-bottom:20px;color:${gc};`}>
            {resultCode}
          </div>
          <div style="width:200px;height:200px;margin:0 auto 16px;border-radius:16px;overflow:hidden;background:var(--color-surface);">
            <img src={type.image} alt={type.nickname[lang as keyof typeof type.nickname]} style="width:100%;height:100%;object-fit:contain;" />
          </div>
          <div style="font-size:14px;color:var(--color-text-muted);line-height:1.5;">
            {type.description[lang as keyof typeof type.description]}
          </div>
        </div>

        {/* Summary card */}
        <div className="quiz-result-card" style="background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:16px;margin-bottom:12px;">
          <div style="font-size:22px;font-weight:800;margin-bottom:12px;">
            {resultCode}({type.nickname[lang as keyof typeof type.nickname]})
          </div>
          <div style={`display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px;background:${gc}22;color:${gc};`}>
            <span style={`width:8px;height:8px;border-radius:50%;background:${gc};display:inline-block;`} />
            {groupInfo[type.group]?.[lang]}
          </div>
          <div style="font-size:15px;color:var(--color-text-muted);line-height:1.7;">
            {type.description[lang as keyof typeof type.description]}
          </div>
        </div>

        {/* Dimensions card */}
        <div className="quiz-result-card" style="background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:16px;margin-bottom:12px;">
          {['RC', 'WT', 'SI', 'FL'].map((dim) => {
            const info = dimensionLabels[dim];
            const pct = Math.round(((resultScores[dim] + 8) / 16) * 100);
            return (
              <div key={dim} style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12px;color:var(--color-text-muted);">
                  <span style="font-weight:600;">{info.name[lang]}</span>
                  <span>{pct}%</span>
                </div>
                <div style="height:8px;border-radius:4px;background:var(--color-border);position:relative;overflow:hidden;">
                  <div style={`position:absolute;top:0;left:0;height:100%;border-radius:4px;width:${pct}%;background:${gc};transition:width 0.6s ease;`} />
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--color-text-muted);">
                  <span>{info.left[lang]}</span>
                  <span>{info.right[lang]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="quiz-result-card" style="background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:16px;margin-bottom:12px;">
          <div class="quiz-sw-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div>
              <h4 style={`font-size:13px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;color:${gc};`}>{labels.resultStrengths}</h4>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                {(type.strengths[lang as keyof typeof type.strengths] as string[]).map((s) => (
                  <span key={s} style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;background:rgba(238,63,44,0.15);color:#ff6b5a;">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 style="font-size:13px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);">{labels.resultWeaknesses}</h4>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                {(type.weaknesses[lang as keyof typeof type.weaknesses] as string[]).map((w) => (
                  <span key={w} style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;background:var(--color-border);color:var(--color-text-muted);">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Relationships */}
        <div className="quiz-result-card" style="background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:16px;margin-bottom:12px;">
          <div style="margin-bottom:16px;">
            <h4 style={`font-size:13px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;color:${gc};`}>{labels.resultPartner}</h4>
            {type.partner.map((p) => {
              const pt = types[p];
              if (!pt) return null;
              return (
                <div key={p} style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--color-surface);border-radius:10px;margin-bottom:8px;">
                  <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--color-card-bg);">
                    <img src={pt.image} alt={pt.nickname[lang as keyof typeof pt.nickname]} style="width:100%;height:100%;object-fit:contain;" />
                  </div>
                  <div>
                    <div style="font-size:14px;font-weight:700;">{p}</div>
                    <div style="font-size:12px;color:var(--color-text-muted);">{pt.nickname[lang as keyof typeof pt.nickname]}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);">{labels.resultNemesis}</h4>
            {(() => {
              const nt = types[type.nemesis];
              if (!nt) return null;
              return (
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--color-surface);border-radius:10px;">
                  <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--color-card-bg);">
                    <img src={nt.image} alt={nt.nickname[lang as keyof typeof nt.nickname]} style="width:100%;height:100%;object-fit:contain;" />
                  </div>
                  <div>
                    <div style="font-size:14px;font-weight:700;">{type.nemesis}</div>
                    <div style="font-size:12px;color:var(--color-text-muted);">{nt.nickname[lang as keyof typeof nt.nickname]}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Actions */}
        <div style="background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:16px;padding:32px 24px;text-align:center;">
          <button class="btn-clip btn-red" onClick={generateShareCard} style="margin:6px;padding:12px 24px;">
            {labels.resultShare}
          </button>
          <button class="btn-clip btn-outline" onClick={startQuiz} style="margin:6px;padding:12px 24px;">
            {labels.resultRetry}
          </button>
          <br />
          <button
            type="button"
            onClick={() => setShowAllTypes(true)}
            style="display:inline-block;margin-top:16px;font-size:13px;color:var(--color-text-muted);text-decoration:underline;cursor:pointer;background:none;border:none;padding:0;font:inherit;"
          >
            {labels.resultViewAll}
          </button>
        </div>

        {/* Share card overlay */}
        {showShareOverlay && shareDataURL && (
          <div
            style="position:fixed;inset:0;z-index:400;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;"
            onClick={(e) => { if (e.target === e.currentTarget) setShowShareOverlay(false); }}
          >
            <button
              onClick={() => setShowShareOverlay(false)}
              style="position:fixed;top:20px;right:24px;z-index:410;background:none;border:none;cursor:pointer;color:#fff;font-size:28px;"
            >
              &times;
            </button>
            <img
              src={shareDataURL}
              alt="Share Card"
              style="max-width:90%;max-height:70vh;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);"
            />
            <div style="margin-top:20px;display:flex;gap:12px;">
              <button class="btn-clip btn-red" onClick={downloadShare} style="padding:12px 24px;">
                {labels.shareSave}
              </button>
              <button class="btn-clip btn-outline" onClick={() => setShowShareOverlay(false)} style="padding:12px 24px;">
                {labels.shareClose}
              </button>
            </div>
          </div>
        )}

        {/* All types overlay */}
        {showAllTypes && (
          <div
            style="position:fixed;inset:0;z-index:300;background:var(--color-backdrop, rgba(0,0,0,0.85));overflow-y:auto;padding:80px 24px 40px;"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAllTypes(false); }}
          >
            <button
              onClick={() => setShowAllTypes(false)}
              style="position:fixed;top:20px;right:24px;z-index:310;background:none;border:none;cursor:pointer;color:var(--color-text, #fff);font-size:28px;"
            >
              &times;
            </button>
            <div style="text-align:center;font-size:28px;font-weight:800;margin-bottom:32px;letter-spacing:-0.02em;color:var(--color-text, #fff);">
              {labels.allTypesTitle}
            </div>
            <div class="quiz-types-grid" style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;">
              {Object.values(types).map((t) => (
                <button
                  key={t.code}
                  type="button"
                  className="quiz-type-card"
                  aria-label={t.nickname[lang as keyof typeof t.nickname]}
                  onClick={() => viewTypeResult(t.code)}
                  style={`background:var(--color-card-bg);border:1px solid var(--color-card-border);border-radius:12px;padding:16px;text-align:center;cursor:pointer;font-family:inherit;color:inherit;`}
                >
                  <div style="width:64px;height:64px;margin:0 auto 8px;">
                    <img src={t.image} alt={t.nickname[lang as keyof typeof t.nickname]} style="width:100%;height:100%;object-fit:contain;" />
                  </div>
                  <div style={`font-size:14px;font-weight:700;letter-spacing:0.06em;color:${groupColors[t.group]};`}>{t.code}</div>
                  <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">
                    {t.nickname[lang as keyof typeof t.nickname]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
