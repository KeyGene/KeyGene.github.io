// src/lib/quiz-share-card.ts — Canvas-based share card generator
import QRCode from 'qrcode';
import type { PersonalityType, DimScores, Lang, Variant } from '../data/quiz';
import { DIMENSION_LABELS, GROUP_COLORS, GROUP_INFO, scoreToPercent } from '../data/quiz';

export interface ShareCardLabels {
  resultLabel: string;
  scanLabel: string;
}

const SITE_ORIGIN = 'https://keygene.top';
const LANG_PREFIX_FOR_URL: Record<Lang, string> = { zh: '', en: '/en', ko: '/ko' };

interface GenerateOpts {
  type: PersonalityType;
  variant: Variant;
  scores: DimScores;
  lang: Lang;
  labels: ShareCardLabels;
}

const W = 750;
const H = 1334;

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
  const { type, variant, scores, lang, labels } = opts;
  const gc = GROUP_COLORS[type.group];

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  // Background
  ctx.fillStyle = '#111';
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
  ctx.fillStyle = '#fff';
  ctx.font = '700 24px Rubik, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('KEY GENE', 88, 62);

  // Label
  ctx.fillStyle = '#888';
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
  ctx.fillStyle = '#888';
  ctx.font = '500 20px Rubik, sans-serif';
  ctx.fillText(GROUP_INFO[type.group][lang], W / 2, 580);

  // Tagline (replaces old description on the share card)
  ctx.fillStyle = '#aaa';
  ctx.font = '400 20px Rubik, sans-serif';
  wrapText(ctx, type.tagline[lang], W / 2, 640, W - 100, 28);

  // Variant blurb (one line, truncate-by-wrap if long)
  ctx.fillStyle = '#bbb';
  ctx.font = '400 18px Rubik, sans-serif';
  wrapText(ctx, type.variants[variant].blurb[lang], W / 2, 700, W - 100, 26);

  // Dimension bars — now 5 dims
  const dims = ['RC', 'WT', 'SI', 'FL', 'ED'] as const;
  let barY = 820;
  for (const dim of dims) {
    const info = DIMENSION_LABELS[dim];
    const pct = scoreToPercent(scores[dim]);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#888';
    ctx.font = '500 16px Rubik, sans-serif';
    ctx.fillText(info.name[lang], 60, barY);

    ctx.textAlign = 'right';
    ctx.fillText(pct + '%', W - 60, barY);

    barY += 12;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, 60, barY, W - 120, 10, 5);
    ctx.fill();

    ctx.fillStyle = gc;
    roundRect(ctx, 60, barY, (W - 120) * pct / 100, 10, 5);
    ctx.fill();

    barY += 24;
    ctx.fillStyle = '#666';
    ctx.font = '400 14px Rubik, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(info.left[lang], 60, barY);
    ctx.textAlign = 'right';
    ctx.fillText(info.right[lang], W - 60, barY);

    barY += 36;
  }

  // ─── QR code (bottom-right) + URL (bottom-left) ───────────────────────
  const QR_SIZE = 140;
  const QR_X = W - QR_SIZE - 40;     // right edge - QR width - margin
  const QR_Y = H - QR_SIZE - 50;     // bottom edge - QR height - margin (room for label below)

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
    ctx.fillStyle = '#888';
    ctx.font = '500 16px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels.scanLabel, QR_X + QR_SIZE / 2, QR_Y + QR_SIZE + 28);
  } catch {
    // QR generation failed (offline / library issue) — silently skip; share card still useful
  }

  // URL on bottom-left
  ctx.fillStyle = '#555';
  ctx.font = '500 20px Rubik, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('keygene.top', 60, H - 50);

  return canvas.toDataURL('image/png');
}
