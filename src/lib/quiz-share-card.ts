// src/lib/quiz-share-card.ts — Canvas-based share card generator
import QRCode from 'qrcode';
import type { PersonalityType, DimScores, Lang, Variant } from '../data/quiz';
import { DIMENSION_LABELS, GROUP_COLORS, GROUP_INFO, scoreToPercent } from '../data/quiz';

export interface ShareCardLabels {
  resultLabel: string;
  scanLabel: string;
  welcomeText: string;
  squadText: string;
}

export type ShareCardTheme = 'light' | 'dark';

const SITE_ORIGIN = 'https://keygene.top';
const LANG_PREFIX_FOR_URL: Record<Lang, string> = { zh: '', en: '/en', ko: '/ko' };

interface GenerateOpts {
  type: PersonalityType;
  variant: Variant;
  scores: DimScores;
  lang: Lang;
  labels: ShareCardLabels;
  theme?: ShareCardTheme;
}

interface Palette {
  bg: string;          // canvas background
  text: string;        // primary text (KEY GENE)
  textMuted: string;   // labels, dim names, percentages, group badge
  textSubtle: string;  // tagline
  textHint: string;    // variant blurb
  textDim: string;     // pole labels
  textUrl: string;     // keygene.top URL footer
  trackBg: string;     // dimension bar track
  welcomeLine: string; // welcome small text
}

const PALETTE_DARK: Palette = {
  bg: '#111111',
  text: '#ffffff',
  textMuted: '#888888',
  textSubtle: '#aaaaaa',
  textHint: '#bbbbbb',
  textDim: '#666666',
  textUrl: '#555555',
  trackBg: 'rgba(255,255,255,0.1)',
  welcomeLine: '#aaaaaa',
};
const PALETTE_LIGHT: Palette = {
  bg: '#f5f5f5',
  text: '#111111',
  textMuted: '#666666',
  textSubtle: '#444444',
  textHint: '#444444',
  textDim: '#888888',
  textUrl: '#999999',
  trackBg: 'rgba(0,0,0,0.08)',
  welcomeLine: '#666666',
};

const W = 750;
const H = 1450;

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img); // resolve anyway; downstream try/catch handles draw failure
    img.src = src;
  });
}

export async function generateShareCard(opts: GenerateOpts): Promise<string> {
  const { type, variant, scores, lang, labels, theme = 'dark' } = opts;
  const gc = GROUP_COLORS[type.group];
  const P = theme === 'light' ? PALETTE_LIGHT : PALETTE_DARK;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  // Background
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = gc;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  const [logoImg, avatarImg] = await Promise.all([
    loadImage('/assert/images/helmet-red.png'),
    loadImage(type.image),
  ]);

  // Logo
  try { ctx.drawImage(logoImg, 30, 30, 48, 48); } catch {}
  ctx.fillStyle = P.text;
  ctx.font = '700 24px Rubik, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('KEY GENE', 88, 62);

  // Label
  ctx.fillStyle = P.textMuted;
  ctx.font = '400 22px Rubik, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(labels.resultLabel, W / 2, 140);

  // Avatar
  try { ctx.drawImage(avatarImg, W / 2 - 120, 180, 240, 240); } catch {}

  // Nickname
  ctx.fillStyle = gc;
  ctx.font = '900 56px Rubik, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(type.nickname[lang], W / 2, 490);

  // Code with variant suffix
  ctx.fillStyle = gc;
  ctx.font = '700 32px Rubik, sans-serif';
  ctx.fillText(`${type.code}-${variant}`, W / 2, 540);

  // Group badge
  ctx.fillStyle = P.textMuted;
  ctx.font = '500 20px Rubik, sans-serif';
  ctx.fillText(GROUP_INFO[type.group][lang], W / 2, 580);

  // Tagline
  ctx.fillStyle = P.textSubtle;
  ctx.font = '400 20px Rubik, sans-serif';
  wrapText(ctx, type.tagline[lang], W / 2, 640, W - 100, 28);

  // Variant blurb
  ctx.fillStyle = P.textHint;
  ctx.font = '400 18px Rubik, sans-serif';
  wrapText(ctx, type.variants[variant].blurb[lang], W / 2, 700, W - 100, 26);

  // Dimension bars
  const dims = ['RC', 'WT', 'SI', 'FL', 'ED'] as const;
  let barY = 820;
  for (const dim of dims) {
    const info = DIMENSION_LABELS[dim];
    const pct = scoreToPercent(scores[dim]);

    ctx.textAlign = 'left';
    ctx.fillStyle = P.textMuted;
    ctx.font = '500 16px Rubik, sans-serif';
    ctx.fillText(info.name[lang], 60, barY);

    ctx.textAlign = 'right';
    ctx.fillText(pct + '%', W - 60, barY);

    barY += 12;
    ctx.fillStyle = P.trackBg;
    roundRect(ctx, 60, barY, W - 120, 10, 5);
    ctx.fill();

    ctx.fillStyle = gc;
    roundRect(ctx, 60, barY, (W - 120) * pct / 100, 10, 5);
    ctx.fill();

    barY += 24;
    ctx.fillStyle = P.textDim;
    ctx.font = '400 14px Rubik, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(info.left[lang], 60, barY);
    ctx.textAlign = 'right';
    ctx.fillText(info.right[lang], W - 60, barY);

    barY += 36;
  }

  // ─── QR code (bottom-right) + URL (bottom-left) ───────────────────────
  // Bottom row aligns with dim bars: content area x=60 to x=W-60=690.
  // QR + 8px white backdrop must end at x=690 to match bar right edge.
  const CONTENT_LEFT = 60;
  const CONTENT_RIGHT = W - 60;       // 690
  const QR_SIZE = 140;
  const QR_X = CONTENT_RIGHT - QR_SIZE - 8;   // 690 - 140 - 8 = 542 (8 = backdrop pad)
  const QR_Y = 1240;                  // 60px below dim bars (1180)

  const resultUrl = `${SITE_ORIGIN}${LANG_PREFIX_FOR_URL[lang]}/quiz/result/${type.code}?v=${variant}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(resultUrl, {
      width: QR_SIZE * 2,           // 2x for crisp rendering
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#111111', light: '#ffffff' },
    });
    const qrImg = await loadImage(qrDataUrl);
    // White background with rounded corners as backdrop for the QR
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, QR_X - 8, QR_Y - 8, QR_SIZE + 16, QR_SIZE + 16, 10);
    ctx.fill();
    ctx.drawImage(qrImg, QR_X, QR_Y, QR_SIZE, QR_SIZE);

    // "扫码查看" / "Scan to view" label below QR
    ctx.fillStyle = P.textMuted;
    ctx.font = '500 16px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels.scanLabel, QR_X + QR_SIZE / 2, QR_Y + QR_SIZE + 28);
  } catch {
    // QR generation failed (offline / library issue) — silently skip; share card still useful
  }

  // ─── Bottom-left: large logo + welcome message + URL ──────────────────
  // Aligns left edge with dim-bar content area (x=60).
  const BIG_LOGO_SIZE = 96;
  const BIG_LOGO_X = CONTENT_LEFT;
  const BIG_LOGO_Y = QR_Y + 4;     // visually align top with QR top
  try { ctx.drawImage(logoImg, BIG_LOGO_X, BIG_LOGO_Y, BIG_LOGO_SIZE, BIG_LOGO_SIZE); } catch {}

  // Welcome line 1 ("欢迎加入" / "Welcome to" / "환영합니다") — small, muted
  const TEXT_X = BIG_LOGO_X + BIG_LOGO_SIZE + 18;
  ctx.fillStyle = P.welcomeLine;
  ctx.font = '500 22px Rubik, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(labels.welcomeText, TEXT_X, BIG_LOGO_Y + 38);

  // Welcome line 2 ("KEY GENE 战队" etc.) — bold, brand red (always — represents the brand, not the type's group)
  ctx.fillStyle = '#EE3F2C';
  ctx.font = '800 30px Rubik, sans-serif';
  ctx.fillText(labels.squadText, TEXT_X, BIG_LOGO_Y + 78);

  // URL on bottom-left, below the logo block
  ctx.fillStyle = P.textUrl;
  ctx.font = '500 20px Rubik, sans-serif';
  ctx.fillText('keygene.top', BIG_LOGO_X, BIG_LOGO_Y + BIG_LOGO_SIZE + 32);

  return canvas.toDataURL('image/png');
}
