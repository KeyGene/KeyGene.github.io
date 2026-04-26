import { useState, useEffect, useMemo } from 'preact/hooks';
import type { PersonalityType, DimScores, Variant, Lang } from '../data/quiz';
import { DIMENSION_LABELS, GROUP_COLORS, GROUP_INFO, scoreToPercent } from '../data/quiz';
import { generateShareCard } from '../lib/quiz-share-card';

interface Labels {
  resultLabel: string;
  resultStrengths: string;
  resultWeaknesses: string;
  resultPartner: string;
  resultNemesis: string;
  resultRetry: string;
  resultShare: string;
  resultViewAll: string;
  resultVariantTitle: string;
  resultDescriptionTitle: string;
  shareSave: string;
  shareClose: string;
  shareScanLabel: string;
  shareWelcome: string;
  shareSquad: string;
}

interface Props {
  type: PersonalityType;
  variant: Variant;
  lang: Lang;
  labels: Labels;
  partnerTypes: PersonalityType[];
  nemesisType: PersonalityType | null;
}

const LANG_PREFIX: Record<Lang, string> = { zh: '', en: '/en', ko: '/ko' };

export default function QuizResult({ type, variant: variantProp, lang, labels, partnerTypes, nemesisType }: Props) {
  // Derive variant from URL on client (SSG can't see the ?v= query at build time, so prop is always 'E')
  const [variant] = useState<Variant>(() => {
    if (typeof window === 'undefined') return variantProp;
    const v = new URLSearchParams(window.location.search).get('v');
    return v === 'D' ? 'D' : 'E';
  });
  const gc = GROUP_COLORS[type.group];

  const matchingScores: DimScores | null = useMemo(() => {
    try {
      const s = localStorage.getItem('quizLastResult');
      if (!s) return null;
      const parsed = JSON.parse(s);
      if (parsed?.code !== type.code || parsed?.variant !== variant) return null;
      const sc = parsed.scores;
      if (!sc || typeof sc.RC !== 'number' || typeof sc.ED !== 'number') return null;
      return sc as DimScores;
    } catch { return null; }
  }, [type.code, variant]);

  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Esc closes share overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showShare) setShowShare(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showShare]);

  async function onShare() {
    if (!matchingScores) return;
    setGenerating(true);
    try {
      const url = await generateShareCard({
        type, variant, scores: matchingScores, lang,
        labels: {
          resultLabel: labels.resultLabel,
          scanLabel: labels.shareScanLabel,
          welcomeText: labels.shareWelcome,
          squadText: labels.shareSquad,
        },
      });
      setShareUrl(url);
      setShowShare(true);
    } finally {
      setGenerating(false);
    }
  }

  function onSave() {
    if (!shareUrl) return;
    const a = document.createElement('a');
    a.download = `pubg-personality-${type.code}-${variant}.png`;
    a.href = shareUrl;
    a.click();
  }

  function onRetry() {
    window.location.assign(`${LANG_PREFIX[lang]}/quiz`);
  }

  const variantLabel = type.variants[variant].label[lang];
  const variantTitle = labels.resultVariantTitle.replace('{label}', variantLabel);

  return (
    <div className="qr-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .qr-container {
          max-width: 720px;
          margin: 0 auto;
          padding: 80px clamp(12px, 4vw, 16px) calc(60px + env(safe-area-inset-bottom, 0px));
        }
        .qr-card { background: var(--color-card-bg); border: 1px solid var(--color-card-border); border-radius: 16px; padding: clamp(20px, 5vw, 32px) clamp(16px, 4vw, 24px); margin-bottom: 12px; }
        .qr-hero-img { width: clamp(160px, 50vw, 240px); height: clamp(160px, 50vw, 240px); margin: 0 auto 20px; border-radius: 16px; overflow: hidden; background: var(--color-surface); }
        .qr-hero-img img { width: 100%; height: 100%; object-fit: contain; }
        .qr-hero-nickname { font-size: clamp(28px, 8vw, 42px); font-weight: 900; line-height: 1.1; letter-spacing: -0.02em; }
        .qr-hero-code { font-size: clamp(18px, 5vw, 24px); font-weight: 700; letter-spacing: 0.1em; margin: 8px 0 16px; }
        .qr-pct-bar-fill { transition: width 600ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .qr-pct-bar-fill { transition: none !important; }
        }
        .qr-actions button { margin: 6px; padding: 12px 24px; }
        @media (max-width: 480px) {
          .qr-actions button { display: block; width: 100%; max-width: 320px; margin: 8px auto !important; }
        }
        .qr-sw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) {
          .qr-sw-grid { grid-template-columns: 1fr !important; }
        }
        .qr-sw-col { min-width: 0; }
        .qr-sw-title { display: block; font-size: 13px; font-weight: 600; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.06em; line-height: 1; }
        .qr-sw-title-muted { color: var(--color-text-muted); }
        .qr-sw-pills { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; flex-wrap: wrap; align-items: flex-start; gap: 8px; }
        .qr-sw-pill { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; line-height: 1.4; white-space: nowrap; }
        .qr-sw-pill-strength { background: rgba(238,63,44,0.15); color: #ff6b5a; }
        .qr-sw-pill-weakness { background: var(--color-border); color: var(--color-text-muted); }
        .qr-relation-card:hover { transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) {
          .qr-relation-card { transition: none !important; }
          .qr-relation-card:hover { transform: none !important; }
        }
      ` }} />

      {/* Hero */}
      <div className="qr-card" style={`text-align:center;position:relative;overflow:hidden;background:${gc}14;`}>
        <div style={`position:absolute;top:0;left:0;right:0;height:4px;background:${gc};`} />
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:12px;letter-spacing:0.06em;">{labels.resultLabel}</div>
        <div className="qr-hero-img">
          <img src={type.image} alt={type.nickname[lang]} />
        </div>
        <div className="qr-hero-nickname" style={`color:${gc};`}>
          {type.nickname[lang]}
        </div>
        <div className="qr-hero-code" style={`color:${gc};`}>
          {type.code}-{variant}
        </div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:14px;">
          {(['RC','WT','SI','FL','ED'] as const).map((d) => {
            const info = DIMENSION_LABELS[d];
            const polePos = matchingScores ? (matchingScores[d] >= 0 ? 0 : 1) : 0;
            const poleLabel = polePos === 0 ? info.left[lang] : info.right[lang];
            return (
              <span key={d} style={`padding:4px 10px;border-radius:14px;background:${gc}22;color:${gc};font-size:12px;font-weight:600;`}>
                {poleLabel}
              </span>
            );
          })}
        </div>
        <div style="font-size:16px;color:var(--color-text-muted);line-height:1.5;max-width:520px;margin:0 auto;">
          {type.tagline[lang]}
        </div>
      </div>

      {/* Percentage card — only shown if scores match */}
      {matchingScores && (
        <div className="qr-card">
          {(['RC','WT','SI','FL','ED'] as const).map((d) => {
            const info = DIMENSION_LABELS[d];
            const pct = scoreToPercent(matchingScores[d]);
            return (
              <div key={d} style="margin-bottom:18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px;color:var(--color-text-muted);">
                  <span style="font-weight:600;">{info.name[lang]}</span>
                  <span>{pct}%</span>
                </div>
                <div style="height:8px;border-radius:4px;background:var(--color-border);position:relative;overflow:hidden;">
                  <div className="qr-pct-bar-fill" style={`position:absolute;top:0;left:0;height:100%;border-radius:4px;width:${pct}%;background:${gc};`} />
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--color-text-muted);">
                  <span>{info.left[lang]}</span>
                  <span>{info.right[lang]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Variant blurb */}
      <div className="qr-card">
        <div style={`font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${gc};margin-bottom:10px;`}>
          {variantTitle}
        </div>
        <div style="font-size:15px;color:var(--color-text-muted);line-height:1.7;">
          {type.variants[variant].blurb[lang]}
        </div>
      </div>

      {/* Description */}
      <div className="qr-card">
        <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);margin-bottom:10px;">
          {labels.resultDescriptionTitle}
        </div>
        <div style={`font-size:22px;font-weight:800;margin-bottom:12px;color:${gc};`}>
          {type.code}-{variant} ({type.nickname[lang]})
        </div>
        <div style={`display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px;background:${gc}22;color:${gc};`}>
          <span style={`width:8px;height:8px;border-radius:50%;background:${gc};display:inline-block;`} />
          {GROUP_INFO[type.group][lang]}
        </div>
        <div style="font-size:15px;color:var(--color-text-muted);line-height:1.7;">
          {type.description[lang]}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="qr-card">
        <div className="qr-sw-grid">
          <div className="qr-sw-col">
            <h4 className="qr-sw-title" style={`color:${gc};`}>{labels.resultStrengths}</h4>
            <ul className="qr-sw-pills">
              {type.strengths[lang].map((s) => (
                <li key={s} className="qr-sw-pill qr-sw-pill-strength">{s}</li>
              ))}
            </ul>
          </div>
          <div className="qr-sw-col">
            <h4 className="qr-sw-title qr-sw-title-muted">{labels.resultWeaknesses}</h4>
            <ul className="qr-sw-pills">
              {type.weaknesses[lang].map((w) => (
                <li key={w} className="qr-sw-pill qr-sw-pill-weakness">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Partner & Nemesis */}
      <div className="qr-card">
        <div style="margin-bottom:18px;">
          <h4 style={`font-size:13px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;color:${gc};`}>{labels.resultPartner}</h4>
          {partnerTypes.map((pt) => (
            <a
              key={pt.code}
              href={`${LANG_PREFIX[lang]}/quiz/types/${pt.code}`}
              className="qr-relation-card"
              style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--color-surface);border-radius:10px;margin-bottom:8px;text-decoration:none;color:inherit;cursor:pointer;transition:transform 150ms;"
            >
              <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--color-card-bg);flex-shrink:0;">
                <img src={pt.image} alt={pt.nickname[lang]} style="width:100%;height:100%;object-fit:contain;" />
              </div>
              <div>
                <div style="font-size:14px;font-weight:700;">{pt.code}</div>
                <div style="font-size:12px;color:var(--color-text-muted);">{pt.nickname[lang]}</div>
              </div>
            </a>
          ))}
        </div>
        {nemesisType && (
          <div>
            <h4 style="font-size:13px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);">{labels.resultNemesis}</h4>
            <a
              href={`${LANG_PREFIX[lang]}/quiz/types/${nemesisType.code}`}
              className="qr-relation-card"
              style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--color-surface);border-radius:10px;text-decoration:none;color:inherit;cursor:pointer;transition:transform 150ms;"
            >
              <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--color-card-bg);flex-shrink:0;">
                <img src={nemesisType.image} alt={nemesisType.nickname[lang]} style="width:100%;height:100%;object-fit:contain;" />
              </div>
              <div>
                <div style="font-size:14px;font-weight:700;">{nemesisType.code}</div>
                <div style="font-size:12px;color:var(--color-text-muted);">{nemesisType.nickname[lang]}</div>
              </div>
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="qr-card qr-actions" style="text-align:center;">
        {matchingScores && (
          <button class="btn-clip btn-red" onClick={onShare} disabled={generating}>
            {labels.resultShare}
          </button>
        )}
        <button class="btn-clip btn-outline" onClick={onRetry}>
          {labels.resultRetry}
        </button>
        <a
          href={`${LANG_PREFIX[lang]}/quiz/types`}
          style="display:inline-block;margin-top:16px;font-size:13px;color:var(--color-text-muted);text-decoration:underline;cursor:pointer;"
        >
          {labels.resultViewAll}
        </a>
      </div>

      {/* Share overlay */}
      {showShare && shareUrl && (
        <div
          style="position:fixed;inset:0;z-index:400;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;"
          onClick={(e) => { if (e.target === e.currentTarget) setShowShare(false); }}
        >
          <button onClick={() => setShowShare(false)} style="position:fixed;top:calc(20px + env(safe-area-inset-top, 0px));right:24px;z-index:410;background:none;border:none;cursor:pointer;color:#fff;font-size:28px;width:44px;height:44px;line-height:1;">&times;</button>
          <img src={shareUrl} alt="Share Card" style="max-width:90%;max-height:70vh;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);" />
          <div style="margin-top:20px;display:flex;gap:12px;">
            <button class="btn-clip btn-red" onClick={onSave} style="padding:12px 24px;">{labels.shareSave}</button>
            <button class="btn-clip btn-outline" onClick={() => setShowShare(false)} style="padding:12px 24px;">{labels.shareClose}</button>
          </div>
        </div>
      )}
    </div>
  );
}
