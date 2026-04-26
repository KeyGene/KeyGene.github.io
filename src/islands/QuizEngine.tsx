import { useState, useMemo, useEffect } from 'preact/hooks';
import type { QuizQuestion, DimScores, Lang } from '../data/quiz';
import { contribution, scoreToCode, ZERO_SCORES } from '../data/quiz';

interface Labels {
  quizTag: string;
  quizTitle1: string;
  quizTitle2: string;
  quizSub: string;
  quizStart: string;
  quizCounterText: string;
  quizLastResult: string;
  quizPrev: string;
  quizAgree: string;
  quizDisagree: string;
  quizCounterFmt: string;
  // Likert level aria-labels (7 positions, 0=strongly agree, 6=strongly disagree)
  quizLikertA3: string;
  quizLikertA2: string;
  quizLikertA1: string;
  quizLikertN: string;
  quizLikertD1: string;
  quizLikertD2: string;
  quizLikertD3: string;
}

interface Props {
  questions: QuizQuestion[];
  lang: Lang;
  labels: Labels;
}

type Screen = 'landing' | 'quiz';

const CIRCLE_SIZES = [28, 22, 16, 12, 16, 22, 28];
const ADVANCE_DELAY_MS = 400;
const REDUCED_ADVANCE_DELAY_MS = 150; // for prefers-reduced-motion users

const LANG_PREFIX: Record<Lang, string> = { zh: '', en: '/en', ko: '/ko' };

function fmtCounter(template: string, i: number, total: number): string {
  return template.replace('{i}', String(i)).replace('{total}', String(total));
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function QuizEngine({ questions, lang, labels }: Props) {
  const TOTAL = questions.length;
  const [screen, setScreen] = useState<Screen>('landing');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(TOTAL).fill(null));
  const [transition, setTransition] = useState<'idle' | 'fading-out'>('idle');

  // Counter from localStorage (kept compatible with old data)
  const counter = useMemo(() => {
    try {
      const c = parseInt(localStorage.getItem('quizCompletions') || '0');
      return c + Math.floor(Math.random() * 50) + 128;
    } catch { return 128; }
  }, []);

  // Saved result (only honored if it has the new shape: variant field present)
  const savedResult = useMemo(() => {
    try {
      const s = localStorage.getItem('quizLastResult');
      if (!s) return null;
      const parsed = JSON.parse(s);
      if (typeof parsed?.variant !== 'string') return null; // old format
      return parsed as { code: string; variant: 'E' | 'D' };
    } catch { return null; }
  }, []);

  function startQuiz() {
    setCurrentQ(0);
    setAnswers(new Array(TOTAL).fill(null));
    setScreen('quiz');
  }

  function viewSavedResult() {
    if (!savedResult) return;
    window.location.assign(`${LANG_PREFIX[lang]}/quiz/result/${savedResult.code}?v=${savedResult.variant}`);
  }

  function selectCircle(circleIndex: number) {
    if (transition !== 'idle') return; // ignore clicks during transition

    const next = [...answers];
    next[currentQ] = circleIndex;
    setAnswers(next);

    const reduced = prefersReducedMotion();
    setTransition('fading-out');
    setTimeout(() => {
      if (currentQ < TOTAL - 1) {
        setCurrentQ((q) => q + 1);
        setTransition('idle');
      } else {
        finalize(next);
      }
    }, reduced ? REDUCED_ADVANCE_DELAY_MS : ADVANCE_DELAY_MS);
  }

  function finalize(finalAnswers: (number | null)[]) {
    const scores: DimScores = { ...ZERO_SCORES };
    questions.forEach((q, i) => {
      const ci = finalAnswers[i];
      if (ci !== null) scores[q.dim] += contribution(ci, q.direction);
    });
    const { code, variant } = scoreToCode(scores);
    try {
      localStorage.setItem('quizLastResult', JSON.stringify({ code, variant, scores }));
      const c = parseInt(localStorage.getItem('quizCompletions') || '0');
      localStorage.setItem('quizCompletions', String(c + 1));
    } catch {}
    window.location.assign(`${LANG_PREFIX[lang]}/quiz/result/${code}?v=${variant}`);
  }

  function goPrev() {
    if (currentQ > 0 && transition === 'idle') {
      setCurrentQ((q) => q - 1);
    }
  }

  // Browser back: treat as previous question while on quiz screen.
  useEffect(() => {
    if (screen !== 'quiz') return;
    const onPop = (e: PopStateEvent) => { e.preventDefault(); goPrev(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [screen, currentQ, transition]);

  const styles = `
    /* Fade transitions — disabled for prefers-reduced-motion */
    .qe-fade-out { opacity: 0; transition: opacity 200ms ease-out; }
    .qe-fade-in  { opacity: 1; transition: opacity 200ms ease-in;  }
    @media (prefers-reduced-motion: reduce) {
      .qe-fade-out, .qe-fade-in { transition: none !important; opacity: 1 !important; }
    }

    /* Quiz container responsive padding */
    .qe-quiz-container {
      max-width: 640px;
      margin: 0 auto;
      padding: 90px clamp(12px, 5vw, 24px) calc(120px + env(safe-area-inset-bottom, 0px));
    }

    /* Question text scales down on small screens */
    .qe-question-text {
      font-size: clamp(18px, 4.5vw, 22px);
      font-weight: 700;
      line-height: 1.5;
      margin: clamp(28px, 6vw, 48px) 0 clamp(36px, 7vw, 56px);
      text-align: center;
    }

    /* Likert row: gap shrinks on small screens, 7 buttons + 6 gaps must fit */
    .qe-likert-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(2px, 1.8vw, 18px);
      margin-bottom: 20px;
    }

    /* Likert button: outer is the touch target (≥40px), inner span is the visible dot */
    .qe-circle-btn {
      width: clamp(40px, 12vw, 52px);
      height: clamp(40px, 12vw, 52px);
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .qe-circle-btn:focus-visible { outline: 2px solid var(--color-red); outline-offset: 2px; border-radius: 50%; }
    .qe-circle-dot {
      display: block;
      transition: transform 150ms, background 150ms, border-color 150ms;
    }
    @media (hover: hover) {
      .qe-circle-btn:hover .qe-circle-dot { transform: scale(1.1); }
    }
    .qe-circle-btn.selected .qe-circle-dot { transform: scale(1.1); }
    @media (prefers-reduced-motion: reduce) {
      .qe-circle-dot { transition: none !important; }
    }

    /* Pole labels under the Likert row */
    .qe-pole-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--color-text-muted);
      max-width: 520px;
      margin: 0 auto;
      padding: 0 clamp(2px, 1vw, 8px);
    }

    /* Floating Previous button */
    .qe-prev-btn {
      position: fixed;
      left: 24px;
      bottom: calc(24px + env(safe-area-inset-bottom, 0px));
      padding: 10px 18px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      font-family: inherit;
    }
    @media (max-width: 768px) { .qe-prev-btn { display: none !important; } }
  `;

  // ARIA labels for the 7 Likert positions, in order [agree3, agree2, agree1, neutral, disagree1, disagree2, disagree3]
  const likertAria = [
    labels.quizLikertA3, labels.quizLikertA2, labels.quizLikertA1,
    labels.quizLikertN,
    labels.quizLikertD1, labels.quizLikertD2, labels.quizLikertD3,
  ];

  // ─── LANDING ───────────────────────────────────────────────────────
  if (screen === 'landing') {
    return (
      <div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:90px 24px 60px;">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
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
            <button type="button" onClick={viewSavedResult} style="color:var(--color-red);text-decoration:underline;cursor:pointer;background:none;border:none;padding:0;font:inherit;">
              {labels.quizLastResult}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── QUIZ ──────────────────────────────────────────────────────────
  const q = questions[currentQ];
  const selectedCircle = answers[currentQ];
  const fadeClass = transition === 'fading-out' ? 'qe-fade-out' : 'qe-fade-in';
  const progressPct = ((currentQ + 1) / TOTAL) * 100;

  return (
    <div style="position:relative;min-height:100dvh;">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Sticky progress bar */}
      <div style="position:fixed;top:0;left:0;right:0;height:4px;background:var(--color-border);z-index:50;">
        <div style={`height:100%;background:var(--color-red);width:${progressPct}%;transition:width 300ms ease-out;`} />
      </div>

      <div class={`${fadeClass} qe-quiz-container`}>
        <div style="text-align:center;font-size:13px;color:var(--color-text-muted);margin-bottom:20px;letter-spacing:0.06em;">
          {fmtCounter(labels.quizCounterFmt, currentQ + 1, TOTAL)}
        </div>

        <div className="qe-question-text">
          {q.text[lang]}
        </div>

        <div role="radiogroup" aria-label={q.text[lang]} className="qe-likert-row">
          {CIRCLE_SIZES.map((size, ci) => {
            const isAgree = ci < 3;
            const isNeutral = ci === 3;
            const baseColor = isNeutral ? 'var(--color-text-muted)' : isAgree ? '#2D7D46' : '#EE3F2C';
            const selected = selectedCircle === ci;
            return (
              <button
                key={ci}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={likertAria[ci]}
                className={`qe-circle-btn ${selected ? 'selected' : ''}`}
                onClick={() => selectCircle(ci)}
              >
                <span
                  aria-hidden="true"
                  className="qe-circle-dot"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    border: `2px solid ${baseColor}`,
                    background: selected ? baseColor : 'transparent',
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="qe-pole-labels">
          <span>{labels.quizAgree}</span>
          <span>{labels.quizDisagree}</span>
        </div>

        {currentQ > 0 && (
          <button
            type="button"
            className="qe-prev-btn"
            onClick={goPrev}
            aria-label={labels.quizPrev}
          >
            ← {labels.quizPrev}
          </button>
        )}
      </div>
    </div>
  );
}
