// Headless renderer.
//
// Given a job-scoped template HTML (already mutated by writeJobTemplate) and
// per-variation images (1:1 source + 9:16 source), this:
//   1. Launches headless Chromium.
//   2. Loads the template as a file:// URL.
//   3. Seeds the template's IndexedDB ImageStore with the 1:1 source for
//      each variation, so the 1:1 canvas renders correctly.
//   4. For the 9:16 canvas, temporarily swaps in the 9:16 source (which may
//      be outpainted/padded), captures it, then restores.
//   5. Uses the page's own htmlToImage.toPng on the canvas DOM nodes at
//      pixelRatio: 2, matching the template's existing Export logic.
//   6. Writes <id>_1x1.png and <id>_9x16.png into outDir.
//
// The template's canvas nodes carry data attributes set by the React render:
//   data-export-frame="square" or "story" and data-variation-id="<id>".
// If those don't exist (older template), we fall back to indexed queries
// over `.canvas-square` / `.canvas-story` selectors. The selector pair is
// configurable per archetype in CANVAS_SELECTORS.

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';

// Tries data-attribute first, then falls back to nth-of-type queries.
const CANVAS_SELECTORS = {
  ama: {
    square: '[data-export-frame="square"][data-variation-id="{id}"], .ama-frame-square[data-variation-id="{id}"]',
    story:  '[data-export-frame="story"][data-variation-id="{id}"],  .ama-frame-story[data-variation-id="{id}"]',
    // Fallback: index-based selectors using the variation card order.
    indexedSquare: '.variation-card:nth-of-type({idx}) [data-frame="square"], .variation-card:nth-of-type({idx}) .square-frame',
    indexedStory:  '.variation-card:nth-of-type({idx}) [data-frame="story"],  .variation-card:nth-of-type({idx}) .story-frame',
  },
};

async function fileToDataUrl(path) {
  const buf = await readFile(path);
  const ext = path.split('.').pop().toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Stuff a dataURL into the template's IndexedDB ImageStore under `id`.
async function seedImageStore(page, id, dataUrl) {
  await page.evaluate(
    async ([id, dataUrl]) => {
      // Prefer the in-page ImageStore if it exposed itself on window.
      if (window.ImageStore && typeof window.ImageStore.set === 'function') {
        window.ImageStore.set(id, dataUrl);
        return;
      }
      // Fallback: write directly to the IDB the template uses.
      // Template opens DB "ama-images" by default — but we don't hardcode
      // the name; we open every DB the page has and write to the one whose
      // object store is "images". This is best-effort.
      const dbs = await indexedDB.databases?.() ?? [];
      for (const meta of dbs) {
        await new Promise((resolve) => {
          const req = indexedDB.open(meta.name, meta.version || 1);
          req.onsuccess = () => {
            const db = req.result;
            if (Array.from(db.objectStoreNames).includes('images')) {
              const tx = db.transaction('images', 'readwrite');
              tx.objectStore('images').put(dataUrl, id);
              tx.oncomplete = () => { db.close(); resolve(); };
              tx.onerror = () => { db.close(); resolve(); };
            } else { db.close(); resolve(); }
          };
          req.onerror = () => resolve();
        });
      }
    },
    [id, dataUrl]
  );
}

async function exportFrame(page, archetype, variationId, frame, outPath, frameW, frameH) {
  const sel = CANVAS_SELECTORS[archetype][frame].replaceAll('{id}', variationId);
  // Wait briefly for layout to settle (images decoded, fonts loaded).
  await page.waitForTimeout(200);
  const dataUrl = await page.evaluate(
    async ([selector, w, h]) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      if (typeof htmlToImage === 'undefined') return null;
      return await htmlToImage.toPng(node, { pixelRatio: 2, width: w, height: h, cacheBust: true });
    },
    [sel, frameW, frameH]
  );
  if (!dataUrl) {
    throw new Error(`Could not find canvas for ${variationId}/${frame} (selector: ${sel})`);
  }
  const base64 = dataUrl.split(',')[1];
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(base64, 'base64'));
}

export async function renderAll({ templatePath, archetype, variations, outDir, frames = ['square', 'story'] }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 2400, height: 1600 } });
  const page = await ctx.newPage();

  // Surface page console errors to ours — easier debugging.
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[page error]', msg.text());
  });

  const url = pathToFileURL(templatePath).href;
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait until htmlToImage + ImageStore are present.
  await page.waitForFunction(() => typeof htmlToImage !== 'undefined', null, { timeout: 15000 });

  const FRAME_SIZE = { square: [1080, 1080], story: [1080, 1920] };
  const results = [];

  for (const v of variations) {
    // For 1:1: seed the square source.
    if (v.imageSquarePath) {
      const du = await fileToDataUrl(v.imageSquarePath);
      await seedImageStore(page, v.id, du);
      await page.waitForTimeout(150);
    }
    if (frames.includes('square')) {
      const outPath = join(outDir, `${v.id}_1x1.png`);
      await exportFrame(page, archetype, v.id, 'square', outPath, ...FRAME_SIZE.square);
      results.push({ id: v.id, frame: 'square', path: outPath });
    }
    // For 9:16: swap in the 9:16 source (may be outpainted), then export.
    if (frames.includes('story')) {
      if (v.imageStoryPath) {
        const du = await fileToDataUrl(v.imageStoryPath);
        await seedImageStore(page, v.id, du);
        await page.waitForTimeout(150);
      }
      const outPath = join(outDir, `${v.id}_9x16.png`);
      await exportFrame(page, archetype, v.id, 'story', outPath, ...FRAME_SIZE.story);
      results.push({ id: v.id, frame: 'story', path: outPath });

      // Restore the square source for any subsequent re-renders (defensive).
      if (v.imageSquarePath) {
        const du = await fileToDataUrl(v.imageSquarePath);
        await seedImageStore(page, v.id, du);
      }
    }
  }

  await browser.close();
  return results;
}
