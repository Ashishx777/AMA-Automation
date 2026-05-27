#!/usr/bin/env node
// Porcellia Ads pipeline — entry point.
//
//   node bin/render.js --brand mileenia --archetype ama --folder jobs/example-mileenia
//
// Reads <folder>/copy.csv + <folder>/brand.json + <folder>/images/, renders
// 1:1 and 9:16 PNGs into <folder>/out/, builds review.html, fires a toast.

import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readCopyCsv } from '../lib/csv.js';
import { writeJobTemplate } from '../lib/editmode.js';
import { classify, resolveImageForId } from '../lib/image-utils.js';
import { outpaint } from '../lib/outpaint.js';
import { renderAll } from '../lib/render-html.js';
import { writeReviewPage } from '../lib/review.js';
import { toast, openInBrowser } from '../lib/notify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const program = new Command();
program
  .name('porcellia-ads')
  .description('Folder-driven batch renderer for Porcellia social-proof ad templates')
  .requiredOption('--brand <id>',     'brand id (must match brand.json or seeded brand in template)')
  .requiredOption('--archetype <id>', 'archetype id: ama (v1)')
  .requiredOption('--folder <path>',  'job folder containing copy.csv, brand.json, images/')
  .option('--template-dir <path>',    'directory holding the HTML templates', resolve(__dirname, '..', '..'))
  .option('--no-open',                'skip opening the review page in browser')
  .parse(process.argv);

const opts = program.opts();

const ARCHETYPE_TEMPLATE = {
  ama:   'AMA AD TEMPLATE.html',
  forum: 'Forum Post Ad Template.html',
};

async function main() {
  const folder = resolve(opts.folder);
  const archetype = opts.archetype.toLowerCase();
  const brandId = opts.brand.toLowerCase();

  if (!ARCHETYPE_TEMPLATE[archetype]) {
    fail(`Unknown archetype "${archetype}". Supported in v1: ama`);
  }
  if (!existsSync(folder)) fail(`Folder not found: ${folder}`);

  const csvPath   = join(folder, 'copy.csv');
  const brandPath = join(folder, 'brand.json');
  const imagesDir = join(folder, 'images');
  const outDir    = join(folder, 'out');
  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, 'expanded'), { recursive: true });

  if (!existsSync(csvPath)) fail(`Missing copy.csv in ${folder}`);

  log(`Reading copy from ${csvPath}`);
  const rows = readCopyCsv(csvPath, archetype);
  log(`  ${rows.length} variation${rows.length === 1 ? '' : 's'}`);

  const brandOverrides = existsSync(brandPath)
    ? JSON.parse(readFileSync(brandPath, 'utf8'))
    : null;

  const templatePath = join(opts.templateDir, ARCHETYPE_TEMPLATE[archetype]);
  if (!existsSync(templatePath)) fail(`Template not found: ${templatePath}`);

  const jobTemplatePath = join(outDir, ARCHETYPE_TEMPLATE[archetype]);
  log(`Writing job-scoped template -> ${jobTemplatePath}`);
  const { brand } = writeJobTemplate({
    templatePath,
    outHtmlPath: jobTemplatePath,
    brandId,
    brandOverrides,
    rows,
    archetype,
  });

  // Resolve image per variation, classify, outpaint if needed.
  log(`Resolving images from ${imagesDir}`);
  const variations = [];
  for (const r of rows) {
    const v = { id: r.id, copyPreview: copyPreview(r, archetype) };
    const srcPath = await resolveImageForId(imagesDir, r.id);
    if (!srcPath) {
      log(`  ${r.id}: no image (will render copy-only)`);
      v.sourceKind = 'missing';
      variations.push(v);
      continue;
    }
    const cls = await classify(srcPath);
    log(`  ${r.id}: ${cls.kind} ${cls.width}x${cls.height}`);
    v.imageSquarePath = srcPath; // 1:1 canvas always uses the original
    v.sourceKind = cls.kind;

    if (cls.kind === 'square') {
      const expandedPath = join(outDir, 'expanded', `${r.id}_9x16.jpg`);
      const result = await outpaint({
        srcPath,
        outPath: expandedPath,
        modelId: 'padded', // v1 stub
        accent: brand.accent,
        paddingStyle: brand.paddingStyle,
        prompt: r.image_note,
      });
      v.imageStoryPath = result.outPath;
      v.outpaintModel = result.model;
      v.outpaintStub = result.stub;
      v.fallbackPath = result.fallbackPath;
    } else {
      v.imageStoryPath = srcPath;
    }
    variations.push(v);
  }

  log(`Rendering ${variations.length} variations headlessly…`);
  await renderAll({
    templatePath: jobTemplatePath,
    archetype,
    variations,
    outDir,
  });

  log(`Building review page`);
  const reviewPath = await writeReviewPage({
    outDir,
    variations,
    archetype,
    brand,
    stubOutpaint: variations.some((v) => v.outpaintStub),
  });

  log(`Done. Output in ${outDir}`);
  await toast('Porcellia Ads', `${variations.length} variations rendered for ${brand.name || brand.id}. Opening review…`);
  if (opts.open !== false) await openInBrowser(reviewPath);
}

function copyPreview(row, archetype) {
  if (archetype === 'ama') {
    return `<b>C1:</b> ${escape(row.c1)} &nbsp; <b>C2:</b> ${escape(row.c2)} &nbsp; <b>C3:</b> ${escape(row.c3)}`;
  }
  if (archetype === 'forum') {
    return `<b>${escape(row.title)}</b> · ${escape(row.handle)} · ${escape((row.body || '').slice(0, 80))}…`;
  }
  return Object.entries(row).slice(0, 4).map(([k, v]) => `<b>${escape(k)}:</b> ${escape(v)}`).join(' &nbsp; ');
}

function escape(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function log(msg)  { console.log(`[ads] ${msg}`); }
function fail(msg) { console.error(`[ads] ${msg}`); process.exit(1); }

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
