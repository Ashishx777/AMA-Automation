"""Generate the review HTML for use as a claude.ai INLINE ARTIFACT.

This is NOT a downloadable page the operator opens in Chrome. Claude renders
it inline in the chat panel by emitting the content of `review.html` inside
an artifact tag. The operator interacts with it without leaving claude.ai.

Constraints (artifact iframe sandbox):
  - All thumbnails must be base64 dataURLs embedded directly (the iframe can't
    fetch files from /mnt/user-data/outputs/).
  - No File System Access API, no Service Workers, no top-level navigation.
  - Buttons can use `navigator.clipboard.writeText()` to put paste-back
    strings on the operator's clipboard.

Flow:
  - Operator scans the tiles, clicks Keep / Drop on each.
  - When done, clicks "Copy approval string". Clipboard now contains
    `approve v1, v3, v5`. Operator pastes that into chat.
  - Claude reads it and runs `build_approved_zip.py` to produce the final
    zip of full-resolution PNGs.
  - For wrong outpaints: click "Re-expand…" on a tile, pick a model — the
    button copies `re-expand v3 with stability` to clipboard for paste-back.
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
            'Some 9:16 frames fell back to <b>brand-color padding</b> '
            '(the design.ai image connector didn\'t expand them). '
            'Use <b>Re-expand…</b> on a tile to retry with a different model.'
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
  header {{ padding:16px 20px; border-bottom:1px solid var(--line);
            display:flex; gap:16px; align-items:baseline; flex-wrap:wrap;
            position:sticky; top:0; background:var(--bg); z-index:10; }}
  header h1 {{ margin:0; font-size:16px; font-weight:600; }}
  header .meta {{ color:var(--dim); font-size:12px; }}
  header .actions {{ margin-left:auto; display:flex; gap:8px; }}
  button {{ font:inherit; padding:7px 12px; border-radius:8px; border:1px solid var(--line);
            background:#1f1f23; color:var(--text); cursor:pointer; }}
  button:hover {{ background:#25252a; }}
  button.primary {{ background:var(--accent); color:#111; border-color:transparent; font-weight:600; }}
  .stub-banner {{ margin:10px 20px 0; padding:9px 12px; background:#2a2410;
                  border:1px solid #5a4a18; border-radius:8px; color:#e8c97a; font-size:12px; }}
  .grid {{ display:grid; gap:14px; padding:18px;
            grid-template-columns:repeat(auto-fill, minmax(420px, 1fr)); }}
  .tile {{ background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:12px;
           display:flex; flex-direction:column; gap:10px; }}
  .tile[data-keep="true"]  {{ border-color:var(--keep); }}
  .tile[data-keep="false"] {{ border-color:var(--drop); opacity:.55; }}
  .tile h2 {{ margin:0; font-size:13px; font-weight:600; display:flex; gap:8px; align-items:baseline; }}
  .tile h2 .badge {{ font-size:10px; color:var(--dim); font-weight:400; padding:1px 6px;
                     border:1px solid var(--line); border-radius:999px; }}
  .frames {{ display:grid; grid-template-columns:1fr .56fr; gap:8px; align-items:start; }}
  .frame {{ background:#0a0a0b; border-radius:6px; overflow:hidden; }}
  .frame img {{ display:block; width:100%; height:auto; }}
  .copy {{ font-size:11px; color:var(--dim); line-height:1.4; }}
  .copy b {{ color:var(--text); }}
  .actions-row {{ display:flex; gap:6px; flex-wrap:wrap; }}
  .actions-row button {{ padding:5px 9px; font-size:11px; }}
  .actions-row .keep {{ background:#1c3a25; border-color:#245430; }}
  .actions-row .keep[data-on="true"] {{ background:var(--keep); }}
  .actions-row .drop {{ background:#3a1c1c; border-color:#542424; }}
  .actions-row .drop[data-on="true"] {{ background:var(--drop); }}
  .actions-row .reexp {{ margin-left:auto; }}
  dialog {{ background:var(--panel); color:var(--text); border:1px solid var(--line);
            border-radius:12px; padding:18px; max-width:680px; width:92%; }}
  dialog::backdrop {{ background:rgba(0,0,0,0.6); }}
  dialog h3 {{ margin-top:0; font-size:14px; }}
  .model-list {{ display:grid; gap:7px; }}
  .model {{ border:1px solid var(--line); border-radius:8px; padding:8px 11px; cursor:pointer; }}
  .model:hover {{ background:#1f1f23; }}
  .model[data-recommended="true"] {{ border-color:var(--accent); }}
  .model.selected {{ outline:2px solid var(--accent); }}
  .model .row1 {{ display:flex; gap:8px; align-items:baseline; font-size:12px; }}
  .model .row1 .name {{ font-weight:600; }}
  .model .row1 .cost {{ color:var(--dim); font-size:11px; }}
  .model .row1 .star {{ color:var(--accent); }}
  .model .row2 {{ color:var(--dim); font-size:11px; margin-top:2px; }}
  .toast {{ position:fixed; bottom:18px; right:18px; padding:10px 14px;
            background:var(--accent); color:#111; border-radius:8px; font-weight:600;
            font-size:12px; opacity:0; transition:opacity .25s; pointer-events:none; }}
  .toast.show {{ opacity:1; }}
  .paste-back {{ font-family: ui-monospace, "SF Mono", Menlo, monospace;
                 font-size:11px; padding:8px 10px; background:#0a0a0b; border-radius:6px;
                 border:1px solid var(--line); color:var(--text); user-select:all; }}
</style>
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
    <button id="copy-approval" class="primary">Copy approval string</button>
  </div>
</header>
{stub_banner}
<div class="grid" id="grid"></div>

<dialog id="model-dialog">
  <h3>Re-expand image</h3>
  <p id="md-target" class="meta"></p>
  <div class="model-list" id="md-models"></div>
  <div style="display:flex; gap:8px; margin-top:14px;">
    <button id="md-cancel">Cancel</button>
    <button id="md-copy" class="primary">Copy re-expand command</button>
  </div>
  <p class="meta" style="margin-top:10px; font-size:11px;">
    Paste the copied line back into chat. Claude re-runs that one variation
    with the model you picked.
  </p>
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

async function toClipboard(text) {{
  try {{
    await navigator.clipboard.writeText(text);
    return true;
  }} catch (e) {{
    // Fallback for restrictive sandboxes — select a hidden textarea
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try {{ ok = document.execCommand('copy'); }} catch (e2) {{}}
    document.body.removeChild(ta);
    return ok;
  }}
}}

function updateCounts() {{
  const kept = Object.values(state).filter(s => s.keep).length;
  counts.textContent = kept + ' / ' + DATA.variations.length + ' kept';
}}

function render() {{
  grid.innerHTML = '';
  for (const v of DATA.variations) {{
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.keep = state[v.id].keep;
    const badge = v.sourceKind === 'square'
      ? '<span class="badge">1:1 → 9:16 (' + (v.outpaintModel || 'padded') + ')</span>'
      : v.sourceKind === 'missing'
        ? '<span class="badge" style="color:#e88">no image</span>'
        : '';
    tile.innerHTML =
      '<h2>' + v.id + ' ' + badge + '</h2>' +
      '<div class="frames">' +
        (v.square ? '<div class="frame"><img src="' + v.square + '" alt="1:1" /></div>' : '<div class="frame" style="aspect-ratio:1/1"></div>') +
        (v.story  ? '<div class="frame"><img src="' + v.story  + '" alt="9:16" /></div>' : '<div class="frame" style="aspect-ratio:9/16"></div>') +
      '</div>' +
      '<div class="copy">' + v.copyPreview + '</div>' +
      '<div class="actions-row">' +
        '<button class="keep" data-on="' + state[v.id].keep + '" data-id="' + v.id + '" data-action="keep">Keep</button>' +
        '<button class="drop" data-on="' + (!state[v.id].keep) + '" data-id="' + v.id + '" data-action="drop">Drop</button>' +
        (v.sourceKind === 'square' ? '<button class="reexp" data-id="' + v.id + '" data-action="reexpand">Re-expand…</button>' : '') +
      '</div>';
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

// ─── Approval string (paste-back to chat) ────────────────────────────────
document.getElementById('copy-approval').onclick = async () => {{
  const approved = Object.entries(state).filter(([,s]) => s.keep).map(([id]) => id);
  if (!approved.length) {{ showToast('Nothing kept yet'); return; }}
  const text = 'approve ' + approved.join(', ');
  const ok = await toClipboard(text);
  showToast(ok ? 'Copied: "' + text + '" — paste into chat' : 'Copy failed — text shown in console');
  if (!ok) console.log('PASTE THIS BACK:', text);
}};

// ─── Re-expand model picker ──────────────────────────────────────────────
const dlg = document.getElementById('model-dialog');
let dlgTarget = null;
function openModelDialog(id) {{
  dlgTarget = id;
  const v = DATA.variations.find(x => x.id === id);
  document.getElementById('md-target').textContent =
    'Variation ' + id + ' · recommended: ' + (v.recommendedModel || 'flux-fill-pro');
  const list = document.getElementById('md-models');
  list.innerHTML = '';
  for (const m of DATA.models) {{
    const recommended = m.id === (v.recommendedModel || 'flux-fill-pro');
    const div = document.createElement('div');
    div.className = 'model'; div.dataset.id = m.id; div.dataset.recommended = recommended;
    const costText = m.cost_per_image === 0 ? 'free' : '$' + m.cost_per_image.toFixed(3) + '/img';
    div.innerHTML =
      '<div class="row1">' +
        (recommended ? '<span class="star">★</span>' : '') +
        '<span class="name">' + m.label + '</span>' +
        '<span class="cost">' + costText + ' · ' + m.speed + '</span>' +
      '</div>' +
      '<div class="row2"><b>Strong:</b> ' + m.strengths + ' &nbsp; <b>Weak:</b> ' + m.weaknesses + '</div>';
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
document.getElementById('md-copy').onclick = async () => {{
  const picked = document.getElementById('md-models').dataset.selected;
  if (!picked) {{ showToast('Pick a model first'); return; }}
  const text = 're-expand ' + dlgTarget + ' with ' + picked;
  const ok = await toClipboard(text);
  showToast(ok ? 'Copied: "' + text + '" — paste into chat' : 'Copy failed — text shown in console');
  if (!ok) console.log('PASTE THIS BACK:', text);
  dlg.close();
}};

render();
</script>
</body>
</html>"""


def _esc(s: object) -> str:
    s = "" if s is None else str(s)
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;").replace("'", "&#39;"))
