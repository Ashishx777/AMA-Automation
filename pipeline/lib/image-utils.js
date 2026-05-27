// Image inspection + padded 9:16 fallback generation.
//
// The pipeline classifies every source image by aspect ratio:
//   - square   (|w - h| / max < 0.02)            -> needs expansion to 9:16
//   - vertical (h / w >= 1.6 and h / w <= 1.9)   -> already 9:16-ish, use as-is
//   - landscape / other                          -> use as-is; outpaint later if needed
//
// For square sources we generate a "padded fallback" 9:16 (1080x1920) that's
// guaranteed not to fail: the source centered on a brand-color background,
// optionally with a blurred mirror extension for `paddingStyle: "mirror"`.

import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, parse } from 'node:path';

const STORY_W = 1080;
const STORY_H = 1920;
const SQUARE_TOLERANCE = 0.02;

export async function classify(imagePath) {
  const meta = await sharp(imagePath).metadata();
  const w = meta.width;
  const h = meta.height;
  const ratio = w / h;
  const isSquare = Math.abs(w - h) / Math.max(w, h) < SQUARE_TOLERANCE;
  const isVertical = ratio < 1 && h / w >= 1.6;
  let kind = 'other';
  if (isSquare) kind = 'square';
  else if (isVertical) kind = 'vertical';
  else if (ratio > 1) kind = 'landscape';
  return { width: w, height: h, ratio, kind };
}

// Build a 1080x1920 padded fallback from a 1:1 source.
// Strategy:
//   - solid:  fill background with brand.accent (or #111 if absent), center
//             the square in the middle 1080x1080 region.
//   - mirror: blur-and-stretch the source vertically to fill 1080x1920,
//             then overlay the crisp source centered in the middle.
export async function buildPaddedFallback(srcPath, outPath, { accent = '#111111', style = 'solid' } = {}) {
  const top = (STORY_H - STORY_W) / 2; // 420
  const square = await sharp(srcPath).resize(STORY_W, STORY_W, { fit: 'cover' }).toBuffer();

  if (style === 'mirror') {
    const blurred = await sharp(srcPath)
      .resize(STORY_W, STORY_H, { fit: 'cover' })
      .blur(40)
      .modulate({ brightness: 0.85 })
      .toBuffer();
    await sharp(blurred)
      .composite([{ input: square, top: Math.round(top), left: 0 }])
      .jpeg({ quality: 90 })
      .toFile(outPath);
  } else {
    await sharp({
      create: {
        width: STORY_W,
        height: STORY_H,
        channels: 3,
        background: accent,
      },
    })
      .composite([{ input: square, top: Math.round(top), left: 0 }])
      .jpeg({ quality: 90 })
      .toFile(outPath);
  }
  return outPath;
}

// Resolve an image for a given variation id. Looks in <imagesDir> for any
// file whose stem starts with `<id>` or contains `-<id>` / `_<id>`.
// Returns the absolute path or null if nothing matches.
export async function resolveImageForId(imagesDir, id) {
  if (!existsSync(imagesDir)) return null;
  const entries = await readdir(imagesDir);
  const candidates = entries.filter((name) => {
    const stem = parse(name).name.toLowerCase();
    const ext = extname(name).toLowerCase();
    if (!/\.(jpe?g|png|webp|gif)$/i.test(ext)) return false;
    const lid = id.toLowerCase();
    return (
      stem === lid ||
      stem.startsWith(lid + '-') ||
      stem.startsWith(lid + '_') ||
      stem.endsWith('-' + lid) ||
      stem.endsWith('_' + lid) ||
      stem.includes('-' + lid + '-') ||
      stem.includes('_' + lid + '_')
    );
  });
  if (!candidates.length) return null;
  // Prefer exact stem match.
  candidates.sort((a, b) => {
    const ax = parse(a).name.toLowerCase() === id.toLowerCase() ? 0 : 1;
    const bx = parse(b).name.toLowerCase() === id.toLowerCase() ? 0 : 1;
    return ax - bx;
  });
  return join(imagesDir, candidates[0]);
}
