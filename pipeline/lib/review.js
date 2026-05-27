// Generates out/review.html — a fully static local review page.
//
// For each variation it tiles the 1:1 and 9:16 next to each other, with:
//   - Keep / Drop toggle
//   - Re-expand button (model picker modal; v1 only shows "padded" but the
//     full catalog is rendered for design completeness)
// On "Save selections" the page uses the File System Access API (Chromium)
// to drop kept files into out/approved/ and rejected into out/rejected/.
// If FSA isn't available (older browsers) it falls back to downloading a
// manifest.json + a shell script the operator runs to move files.

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MODELS } from './outpaint.js';

export async function writeReviewPage({ outDir, variations, archetype, brand, stubOutpaint }) {
  const reviewPath = join(outDir, 'review.html');

  // Snapshot data the page needs (no fetch — embed inline).
  const data = {
    archetype,
    brand,
    stubOutpaint,
    models: MODELS,
    variations: variations.map((v) => ({
      id: v.id,
      copyPreview: v.copyPreview,
      square: `${v.id}_1x1.png`,
      story: `${v.id}_9x16.png`,
      sourceKind: v.sourceKind, // 'square' | 'vertical' | 'landscape' | 'other' | 'missing'
      outpaintModel: v.outpaintModel || null,
      outpaintStub: !!v.outpaintStub,
      fallbackPath: v.fallbackPath ? v.fallbackPath.split(/[\\/]/).pop() : null,
    })),
  };

  await writeFile(reviewPath, buildHtml(data), 'utf8');
  return reviewPath;
}

function buildHtml(data) {
  const json = JSON.stringify(data);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Review — ${escapeHtml(data.brand.name || data.brand.id)} · ${escapeHtml(data.archetype)}</title>
<style>
  :root {
    --bg: #0f0f10;
    --panel: #161618;
    --line: #2a2a2d;
    --text: #ececee;
    --dim: #8a8a91;
    --keep: #1f7a3a;
    --drop: #8a2424;
    --accent: ${escapeHtml(data.brand.accent || '#c89a5e')};
  }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif;
         background: var(--bg); color: var(--text); }
  header { padding: 18px 24px; border-bottom: 1px solid var(--line); display: flex; gap: 24px; align-items: baseline; }
  header h1 { margin: 0; font-size: 18px; font-weight: 600; }
  header .meta { color: var(--dim); font-size: 13px; }
  header .actions { margin-left: auto; display: flex; gap: 8px; }
  button { font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--line);
           background: #1f1f23; color: var(--text); cursor: pointer; }
  button:hover { background: #25252a; }
  button.primary { background: var(--accent); color: #111; border-color: transparent; font-weight: 600; }
  .grid { display: grid; gap: 20px; padding: 24px;
          grid-template-columns: repeat(auto-fill, minmax(640px, 1fr)); }
  .tile { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 16px;
          display: flex; flex-direction: column; gap: 12px; }
  .tile[data-keep="true"]  { border-color: var(--keep); }
  .tile[data-keep="false"] { border-color: var(--drop); opacity: 0.55; }
  .tile h2 { margin: 0; font-size: 14px; font-weight: 600; display: flex; gap: 10px; align-items: baseline; }
  .tile h2 .badge { font-size: 11px; color: var(--dim); font-weight: 400; padding: 2px 6px; border: 1px solid var(--line); border-radius: 999px; }
  .frames { display: grid; grid-template-columns: 1fr 0.56fr; gap: 12px; align-items: start; }
  .frame { background: #0a0a0b; border-radius: 8px; overflow: hidden; }
  .frame img { display: block; width: 100%; height: auto; }
  .copy { font-size: 12px; color: var(--dim); }
  .copy b { color: var(--text); }
  .actions-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .actions-row button { padding: 6px 10px; font-size: 12px; }
  .actions-row .keep { background: #1c3a25; border-color: #245430; }
  .actions-row .keep[data-on="true"] { background: var(--keep); }
  .actions-row .drop { background: #3a1c1c; border-color: #542424; }
  .actions-row .drop[data-on="true"] { background: var(--drop); }
  .actions-row .reexp { margin-left: auto; }
  dialog { background: var(--panel); color: var(--text); border: 1px solid var(--line); border-radius: 14px; padding: 20px; max-width: 720px; }
  dialog::backdrop { background: rgba(0,0,0,0.6); }
  dialog h3 { margin-top: 0; }
  .model-list { display: grid; gap: 8px; }
  .model { border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; cursor: pointer; }
  .model:hover { background: #1f1f23; }
  .model[data-recommended="true"] { border-color: var(--accent); }
  .model .row1 { display: flex; gap: 10px; align-items: baseline; }
  .model .row1 .name { font-weight: 600; }
  .model .row1 .cost { color: var(--dim); font-size: 12px; }
  .model .row1 .star { color: var(--accent); }
  .model .row2 { color: var(--dim); font-size: 12px; margin-top: 2px; }
  .stub-banner { padding: 10px 14px; background: #2a2410; border: 1px solid #5a4a18; border-radius: 8px; color: #e8c97a; font-size: 12px; }
</style>
</head>
<body>
<header>
  <div>
    <h1>${escapeHtml(data.brand.name || data.brand.id)} · ${escapeHtml(data.archetype.toUpperCase())}</h1>
    <div class="meta" id="counts"></div>
  </div>
  <div class="actions">
    <button id="keep-all">Keep all</button>
    <button id="drop-all">Drop all</button>
    <button id="save" class="primary">Save selections</button>
  </div>
</header>
${data.stubOutpaint ? `<div class="stub-banner" style="margin: 12px 24px 0;">Outpaint is currently <b>stubbed</b> — every 9:16 was generated by padding the 1:1 source with brand color. Wire a provider in <code>lib/outpaint.js</code> to enable real expansion.</div>` : ''}
<div class="grid" id="grid"></div>

<dialog id="model-dialog">
  <h3>Re-expand image</h3>
  <p id="md-target" class="meta"></p>
  <div class="model-list" id="md-models"></div>
  <div style="display: flex; gap: 8px; margin-top: 16px;">
    <button id="md-cancel">Cancel</button>
    <button id="md-generate" class="primary">Generate preview</button>
  </div>
</dialog>

<script id="data" type="application/json">${json}</script>
<script>
  const DATA = JSON.parse(document.getElementById('data').textContent);
  const state = Object.fromEntries(DATA.variations.map(v => [v.id, { keep: true, outpaintModel: v.outpaintModel }]));

  const grid = document.getElementById('grid');
  const counts = document.getElementById('counts');

  function updateCounts() {
    const kept = Object.values(state).filter(s => s.keep).length;
    const total = DATA.variations.length;
    counts.textContent = kept + ' / ' + total + ' kept';
  }

  function render() {
    grid.innerHTML = '';
    for (const v of DATA.variations) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.keep = state[v.id].keep;
      tile.innerHTML = \`
        <h2>
          \${v.id}
          \${v.sourceKind === 'square' ? '<span class="badge">1:1 → 9:16 (' + (v.outpaintStub ? 'padded' : v.outpaintModel) + ')</span>' : ''}
          \${v.sourceKind === 'missing' ? '<span class="badge" style="color:#e88">no image</span>' : ''}
        </h2>
        <div class="frames">
          <div class="frame"><img src="\${v.square}" alt="1:1" loading="lazy" /></div>
          <div class="frame"><img src="\${v.story}" alt="9:16" loading="lazy" /></div>
        </div>
        <div class="copy">\${v.copyPreview}</div>
        <div class="actions-row">
          <button class="keep" data-on="\${state[v.id].keep}" data-id="\${v.id}" data-action="keep">Keep</button>
          <button class="drop" data-on="\${!state[v.id].keep}" data-id="\${v.id}" data-action="drop">Drop</button>
          \${v.sourceKind === 'square' ? '<button class="reexp" data-id="' + v.id + '" data-action="reexpand">Re-expand…</button>' : ''}
        </div>
      \`;
      grid.appendChild(tile);
    }
    updateCounts();
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'keep') { state[id].keep = true; render(); }
    if (btn.dataset.action === 'drop') { state[id].keep = false; render(); }
    if (btn.dataset.action === 'reexpand') openModelDialog(id);
  });

  document.getElementById('keep-all').onclick = () => { for (const v of DATA.variations) state[v.id].keep = true; render(); };
  document.getElementById('drop-all').onclick = () => { for (const v of DATA.variations) state[v.id].keep = false; render(); };

  // ---- Model dialog ----
  const dlg = document.getElementById('model-dialog');
  let dlgTarget = null;
  function openModelDialog(id) {
    dlgTarget = id;
    document.getElementById('md-target').textContent = 'Variation ' + id;
    const list = document.getElementById('md-models');
    list.innerHTML = '';
    for (const m of DATA.models) {
      const recommended = m.id === 'flux-fill-pro';
      const div = document.createElement('div');
      div.className = 'model';
      div.dataset.id = m.id;
      div.dataset.recommended = recommended;
      div.innerHTML = \`
        <div class="row1">
          \${recommended ? '<span class="star">★</span>' : ''}
          <span class="name">\${m.label}</span>
          <span class="cost">\${m.cost === 0 ? 'free' : '$' + m.cost.toFixed(3) + '/img'} · \${m.speed}</span>
        </div>
        <div class="row2"><b>Strong:</b> \${m.strengths} &nbsp; <b>Weak:</b> \${m.weaknesses}</div>
      \`;
      div.onclick = () => {
        list.querySelectorAll('.model').forEach(n => n.style.outline = 'none');
        div.style.outline = '2px solid var(--accent)';
        list.dataset.selected = m.id;
      };
      list.appendChild(div);
    }
    dlg.showModal();
  }
  document.getElementById('md-cancel').onclick = () => dlg.close();
  document.getElementById('md-generate').onclick = () => {
    const picked = document.getElementById('md-models').dataset.selected;
    alert('Re-expand for ' + dlgTarget + ' with ' + picked + '\\n\\n(v1: pipeline is stubbed — wire a provider in lib/outpaint.js to enable this.)');
    dlg.close();
  };

  // ---- Save selections ----
  document.getElementById('save').onclick = async () => {
    const manifest = {
      brand: DATA.brand, archetype: DATA.archetype, ts: new Date().toISOString(),
      approved: Object.entries(state).filter(([,s]) => s.keep).map(([id]) => id),
      rejected: Object.entries(state).filter(([,s]) => !s.keep).map(([id]) => id),
    };
    // Try File System Access API first.
    if (window.showDirectoryPicker) {
      try {
        const root = await window.showDirectoryPicker({ mode: 'readwrite' });
        const approvedDir = await root.getDirectoryHandle('approved', { create: true });
        const rejectedDir = await root.getDirectoryHandle('rejected', { create: true });
        for (const v of DATA.variations) {
          const targetDir = state[v.id].keep ? approvedDir : rejectedDir;
          for (const file of [v.square, v.story]) {
            const srcHandle = await root.getFileHandle(file).catch(() => null);
            if (!srcHandle) continue;
            const fileObj = await srcHandle.getFile();
            const writable = await (await targetDir.getFileHandle(file, { create: true })).createWritable();
            await writable.write(await fileObj.arrayBuffer());
            await writable.close();
          }
        }
        const mfHandle = await root.getFileHandle('selections.json', { create: true });
        const w = await mfHandle.createWritable();
        await w.write(JSON.stringify(manifest, null, 2));
        await w.close();
        alert('Saved. Check approved/ and rejected/ in the out folder.');
        return;
      } catch (err) {
        console.warn('FSA failed, falling back to download', err);
      }
    }
    // Fallback: download manifest only; operator runs move script.
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'selections.json';
    a.click();
    alert('Downloaded selections.json — drop it back into the out folder and run\\n  node bin/apply-selections.js out/selections.json\\nto move the files.');
  };

  render();
</script>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
