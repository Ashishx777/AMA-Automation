"""Generate review.html — the operator's review/export workbench.

Single self-contained HTML page that:
  - Tiles every variation as 1:1 + 9:16 PNGs (paths relative to the
    review.html itself, so the whole folder is portable).
  - Keep / Drop toggle per tile.
  - Re-expand button per tile that opens a model picker (cost / speed /
    strengths / recommended-for-this-image badge).
  - Export approved: zips kept PNGs client-side using JSZip and triggers
    a download. No server, no extra install.
"""
from __future__ import annotations

import json
from pathlib import Path


def write_review_page(out_path: Path, payload: dict) -> Path:
    out_path.write_text(_render_html(payload), encoding="utf-8")
    return out_path


def _render_html(payload: dict) -> str:
    data_json = json.dumps(payload, ensure_ascii=False)
    brand_name = (payload.get("brand") or {}).get("name") or payload.get("brand", {}).get("id") or "Ads"
    accent = (payload.get("brand") or {}).get("accent") or "#c89a5e"
    archetype = (payload.get("archetype") or "").upper()
    stub_banner = ""
    if payload.get("anyStub"):
        stub_banner = (
            '<div class="stub-banner">'
            'Some 9:16 frames used the <b>padded fallback</b> '
            '(no AI outpaint key configured for that model). '
            'Use <b>Re-expand…</b> on any tile to retry with another model.'
            '</div>'
        )
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Review · {_esc(brand_name)} · {_esc(archetype)}</title>
<style>
  :root {{ --bg:#0f0f10; --panel:#161618; --line:#2a2a2d; --text:#ececee;
          --dim:#8a8a91; --keep:#1f7a3a; --drop:#8a2424; --accent:{_esc(accent)}; }}
  * {{ box-sizing: border-box; }}
  body {{ margin:0; font:14px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif;
          background:var(--bg); color:var(--text); }}
  header {{ padding:18px 24px; border-bottom:1px solid var(--line); display:flex; gap:24px; align-items:baseline; position:sticky; top:0; background:var(--bg); z-index:10; }}
  header h1 {{ margin:0; font-size:18px; font-weight:600; }}
  header .meta {{ color:var(--dim); font-size:13px; }}
  header .actions {{ margin-left:auto; display:flex; gap:8px; }}
  button {{ font:inherit; padding:8px 14px; border-radius:8px; border:1px solid var(--line);
            background:#1f1f23; color:var(--text); cursor:pointer; }}
  button:hover {{ background:#25252a; }}
  button.primary {{ background:var(--accent); color:#111; border-color:transparent; font-weight:600; }}
  .stub-banner {{ margin:12px 24px 0; padding:10px 14px; background:#2a2410; border:1px solid #5a4a18; border-radius:8px; color:#e8c97a; font-size:12px; }}
  .grid {{ display:grid; gap:20px; padding:24px;
            grid-template-columns:repeat(auto-fill, minmax(620px, 1fr)); }}
  .tile {{ background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:16px;
           display:flex; flex-direction:column; gap:12px; }}
  .tile[data-keep="true"]  {{ border-color:var(--keep); }}
  .tile[data-keep="false"] {{ border-color:var(--drop); opacity:.55; }}
  .tile h2 {{ margin:0; font-size:14px; font-weight:600; display:flex; gap:10px; align-items:baseline; }}
  .tile h2 .badge {{ font-size:11px; color:var(--dim); font-weight:400; padding:2px 6px; border:1px solid var(--line); border-radius:999px; }}
  .frames {{ display:grid; grid-template-columns:1fr .56fr; gap:12px; align-items:start; }}
  .frame {{ background:#0a0a0b; border-radius:8px; overflow:hidden; aspect-ratio:auto; }}
  .frame img {{ display:block; width:100%; height:auto; }}
  .copy {{ font-size:12px; color:var(--dim); }}
  .copy b {{ color:var(--text); }}
  .actions-row {{ display:flex; gap:8px; flex-wrap:wrap; }}
  .actions-row button {{ padding:6px 10px; font-size:12px; }}
  .actions-row .keep {{ background:#1c3a25; border-color:#245430; }}
  .actions-row .keep[data-on="true"] {{ background:var(--keep); }}
  .actions-row .drop {{ background:#3a1c1c; border-color:#542424; }}
  .actions-row .drop[data-on="true"] {{ background:var(--drop); }}
  .actions-row .reexp {{ margin-left:auto; }}
  dialog {{ background:var(--panel); color:var(--text); border:1px solid var(--line); border-radius:14px; padding:20px; max-width:760px; width:90%; }}
  dialog::backdrop {{ background:rgba(0,0,0,0.6); }}
  dialog h3 {{ margin-top:0; }}
  .model-list {{ display:grid; gap:8px; }}
  .model {{ border:1px solid var(--line); border-radius:10px; padding:10px 12px; cursor:pointer; }}
  .model:hover {{ background:#1f1f23; }}
  .model[data-recommended="true"] {{ border-color:var(--accent); }}
  .model.selected {{ outline:2px solid var(--accent); }}
  .model .row1 {{ display:flex; gap:10px; align-items:baseline; }}
  .model .row1 .name {{ font-weight:600; }}
  .model .row1 .cost {{ color:var(--dim); font-size:12px; }}
  .model .row1 .star {{ color:var(--accent); }}
  .model .row2 {{ color:var(--dim); font-size:12px; margin-top:2px; }}
  .toast {{ position:fixed; bottom:24px; right:24px; padding:12px 16px; background:var(--accent); color:#111; border-radius:10px; font-weight:600; opacity:0; transition:opacity .25s; }}
  .toast.show {{ opacity:1; }}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
</head>
<body>
<header>
  <div>
    <h1>{_esc(brand_name)} · {_esc(archetype)}</h1>
    <div class="meta" id="counts"></div>
  </div>
  <div class="actions">
    <button id="keep-all">Keep all</button>
    <button id="drop-all">Drop all</button>
    <button id="export" class="primary">Export approved (.zip)</button>
  </div>
</header>
{stub_banner}
<div class="grid" id="grid"></div>

<dialog id="model-dialog">
  <h3>Re-expand image</h3>
  <p id="md-target" class="meta"></p>
  <div class="model-list" id="md-models"></div>
  <div style="display:flex; gap:8px; margin-top:16px;">
    <button id="md-cancel">Cancel</button>
    <button id="md-generate" class="primary">Generate preview</button>
  </div>
</dialog>

<div id="toast" class="toast"></div>

<script id="data" type="application/json">{data_json}</script>
<script>
const DATA = JSON.parse(document.getElementById('data').textContent);
const state = Object.fromEntries(DATA.variations.map(v => [v.id, {{ keep: true }}]));
const grid = document.getElementById('grid');
const counts = document.getElementById('counts');

function showToast(msg) {{
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}}

function updateCounts() {{
  const kept = Object.values(state).filter(s => s.keep).length;
  counts.textContent = `${{kept}} / ${{DATA.variations.length}} kept`;
}}

function render() {{
  grid.innerHTML = '';
  for (const v of DATA.variations) {{
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.keep = state[v.id].keep;
    const badge = v.sourceKind === 'square'
      ? `<span class="badge">1:1 → 9:16 (${{v.outpaintModel || 'padded'}})</span>`
      : v.sourceKind === 'missing'
        ? '<span class="badge" style="color:#e88">no image</span>'
        : '';
    tile.innerHTML = `
      <h2>${{v.id}} ${{badge}}</h2>
      <div class="frames">
        <div class="frame"><img src="${{v.square}}" alt="1:1" loading="lazy" /></div>
        <div class="frame"><img src="${{v.story}}" alt="9:16" loading="lazy" /></div>
      </div>
      <div class="copy">${{v.copyPreview}}</div>
      <div class="actions-row">
        <button class="keep" data-on="${{state[v.id].keep}}" data-id="${{v.id}}" data-action="keep">Keep</button>
        <button class="drop" data-on="${{!state[v.id].keep}}" data-id="${{v.id}}" data-action="drop">Drop</button>
        ${{v.sourceKind === 'square' ? `<button class="reexp" data-id="${{v.id}}" data-action="reexpand">Re-expand…</button>` : ''}}
      </div>`;
    grid.appendChild(tile);
  }}
  updateCounts();
}}

grid.addEventListener('click', (e) => {{
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'keep') {{ state[id].keep = true; render(); }}
  if (btn.dataset.action === 'drop') {{ state[id].keep = false; render(); }}
  if (btn.dataset.action === 'reexpand') openModelDialog(id);
}});

document.getElementById('keep-all').onclick = () => {{ for (const v of DATA.variations) state[v.id].keep = true; render(); }};
document.getElementById('drop-all').onclick = () => {{ for (const v of DATA.variations) state[v.id].keep = false; render(); }};

// ─── Re-expand model picker ───────────────────────────────────────────────
const dlg = document.getElementById('model-dialog');
let dlgTarget = null;
function openModelDialog(id) {{
  dlgTarget = id;
  const v = DATA.variations.find(x => x.id === id);
  document.getElementById('md-target').textContent = `Variation ${{id}} · recommended: ${{v.recommendedModel || 'flux-fill-pro'}}`;
  const list = document.getElementById('md-models');
  list.innerHTML = '';
  for (const m of DATA.models) {{
    const recommended = m.id === (v.recommendedModel || 'flux-fill-pro');
    const div = document.createElement('div');
    div.className = 'model'; div.dataset.id = m.id; div.dataset.recommended = recommended;
    const costText = m.cost_per_image === 0 ? 'free' : '$' + m.cost_per_image.toFixed(3) + '/img';
    div.innerHTML = `
      <div class="row1">
        ${{recommended ? '<span class="star">★</span>' : ''}}
        <span class="name">${{m.label}}</span>
        <span class="cost">${{costText}} · ${{m.speed}}</span>
      </div>
      <div class="row2"><b>Strong:</b> ${{m.strengths}} &nbsp; <b>Weak:</b> ${{m.weaknesses}}</div>`;
    div.onclick = () => {{
      list.querySelectorAll('.model').forEach(n => n.classList.remove('selected'));
      div.classList.add('selected');
      list.dataset.selected = m.id;
    }};
    list.appendChild(div);
  }}
  dlg.showModal();
}}
document.getElementById('md-cancel').onclick = () => dlg.close();
document.getElementById('md-generate').onclick = () => {{
  const picked = document.getElementById('md-models').dataset.selected;
  if (!picked) {{ showToast('Pick a model first'); return; }}
  // In v1, "re-expand" is offered as a follow-up command back in claude.ai chat.
  // We capture the intent in localStorage so the operator can copy it.
  const queue = JSON.parse(localStorage.getItem('reexpandQueue') || '[]');
  queue.push({{ variation: dlgTarget, model: picked, ts: Date.now() }});
  localStorage.setItem('reexpandQueue', JSON.stringify(queue));
  dlg.close();
  showToast(`Queued ${{dlgTarget}} for re-expand with ${{picked}}. Copy the queue from localStorage and paste it back into claude.ai.`);
}};

// ─── Export approved → zip ────────────────────────────────────────────────
document.getElementById('export').onclick = async () => {{
  const zip = new JSZip();
  const folder = zip.folder('approved');
  const queue = JSON.parse(localStorage.getItem('reexpandQueue') || '[]');
  let count = 0;
  for (const v of DATA.variations) {{
    if (!state[v.id].keep) continue;
    for (const f of [v.square, v.story]) {{
      try {{
        const res = await fetch(f);
        const blob = await res.blob();
        folder.file(f.split('/').pop(), blob);
        count++;
      }} catch (e) {{ console.warn('fetch failed for', f, e); }}
    }}
  }}
  zip.file('selections.json', JSON.stringify({{
    brand: DATA.brand, archetype: DATA.archetype,
    approved: Object.entries(state).filter(([,s]) => s.keep).map(([id]) => id),
    rejected: Object.entries(state).filter(([,s]) => !s.keep).map(([id]) => id),
    reexpandQueue: queue,
    ts: new Date().toISOString(),
  }}, null, 2));
  const blob = await zip.generateAsync({{ type: 'blob' }});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${{DATA.brand.id || 'ads'}}-${{DATA.archetype}}-approved.zip`;
  a.click();
  showToast(`Zipped ${{count}} files.`);
}};

render();
</script>
</body>
</html>"""


def _esc(s: object) -> str:
    s = "" if s is None else str(s)
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;").replace("'", "&#39;"))
