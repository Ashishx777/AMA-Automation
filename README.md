# Porcellia Ads — Design System

Social-proof ad creative system for the Porcellia brand roster:
**Rara · The Solved Skin · Mileenia · Zauv · Parman · Pragyanam · Gyros · Subtle · Atovio**.
Produces ads at 1080×1080 and 1080×1920 with AI-assisted 1:1 → 9:16 expansion.

---

## Two ways to drive it

| Path | Where it runs | When to use |
|---|---|---|
| **claude.ai Project** (recommended) | Web — Claude reads this repo as Project Knowledge, runs Python in the chat sandbox, calls outpaint + Browserless | Non-technical operators, anyone on the team |
| **Local Node CLI** (`pipeline/`) | The operator's Windows machine — Playwright headless, no internet dependencies | Power users, big batches, working offline |

The same templates and the same job-folder contract (CSV + brand.json + images/) feed either.

---

## Repo layout

```
.
├─ README.md                              ← you are here
├─ PROJECT_INSTRUCTIONS.md                ← paste into claude.ai project-instructions
├─ SKILL.md                               ← original comprehensive design doc (all 3 templates)
│
├─ porcellia-ads-skill/                   ← claude.ai-side pipeline
│  ├─ SKILL.md                            instructions Claude follows in chat
│  ├─ assets/ama.html                     AMA template, patched for headless export
│  ├─ scripts/
│  │   ├─ build.py                        orchestrator (CSV → outpaint → render → review → zip)
│  │   ├─ build_worksheet.py              generates .xlsx worksheet with image thumbnails
│  │   ├─ utils.py                        CSV column synonyms, image classification
│  │   ├─ outpaint.py                     fal.ai / OpenAI / Stability + padded fallback
│  │   ├─ render_png.py                   Browserless integration
│  │   └─ review.py                       review.html generator (Keep/Drop/Re-expand/Export-zip)
│  ├─ reference/
│  │   ├─ csv-schemas.md                  CSV columns per archetype
│  │   └─ brand-list.md                   seeded brands and defaults
│  └─ worksheets/
│     ├─ AMA-worksheet-TEMPLATE.csv       blank copywriter template
│     └─ AMA-worksheet-EXAMPLE-mileenia.csv 5 finished rows for tone reference
│
├─ pipeline/                              ← local Node CLI (Playwright + sharp + commander)
│  ├─ bin/render.js                       CLI entry
│  └─ lib/                                csv / editmode / image-utils / outpaint / render-html / review / notify
│
└─ Source templates at repo root          ← raw React-in-HTML files
   ├─ AMA AD TEMPLATE.html
   ├─ Forum Post Ad Template.html
   ├─ Social Proof Ad Template.html
   ├─ design-canvas.jsx
   ├─ social-proof-adtypes.jsx
   └─ social-proof-layouts.jsx
```

---

## Job folder contract (both paths)

```
<your-job>/
├─ copy.csv          one row per variation
├─ brand.json        optional brand override
└─ images/
    ├─ v1.jpg        filename starts with the id in copy.csv
    ├─ v2.jpg
    └─ …
```

CSV column names are flexible: `context_bar / question_text / answer_text` (the existing
Porcellia convention) and `c1 / c2 / c3` (canonical) are both accepted.

For copywriters who want to see images next to copy fields, generate a visual
worksheet first:

```
python porcellia-ads-skill/scripts/build_worksheet.py \
    --images <folder>/images --archetype ama \
    --out    <folder>/worksheet.xlsx
```

The .xlsx has each image as a thumbnail in column A with empty copy cells next to it.
Save back as CSV when filled.

---

## Run end-to-end (claude.ai Project)

1. Operator opens the "Porcellia Ads" project in claude.ai.
2. Drops the job folder into chat.
3. Says: *"AMAs for Mileenia"* (or whichever brand + archetype).
4. Claude runs `porcellia-ads-skill/scripts/build.py`, returns a zip plus a review page.
5. Operator opens `review.html`, marks Keep / Drop per variation, hits **Export approved (.zip)**.

Required environment variables (set in the chat session or as project secrets):

| Variable             | Used for                                 | Required? |
|----------------------|------------------------------------------|-----------|
| `FAL_KEY`            | fal.ai outpaint                          | Strongly recommended — without it the 9:16 falls back to brand-color padding |
| `BROWSERLESS_TOKEN`  | Headless PNG rendering                   | Required for PNG output. Without it the skill returns a populated HTML that the operator opens locally and exports manually. |

Both have generous free tiers for testing.

---

## Run end-to-end (local CLI)

```powershell
cd pipeline
npm install                  # one-time; postinstall runs playwright install chromium
node bin/render.js --brand mileenia --archetype ama --folder ..\path\to\job
```

Output goes into `<job>/out/` — PNGs + review.html. Toast notification fires when done.

---

## Adding a new brand

1. Add the brand to `porcellia-ads-skill/reference/brand-list.md` (so the skill description matches).
2. Either:
   - Add the brand entry to the seeded `brands` array in `assets/ama.html`, or
   - Pass per-job overrides in `brand.json` (no template edit needed).

## Adding a new archetype

V1 supports AMA end-to-end. Forum and Social Proof master have their CSV schemas
documented in `porcellia-ads-skill/reference/csv-schemas.md`. Wiring them in is a
matter of adding an adapter in `scripts/build.py` and a template path in the `TEMPLATES`
dict.

---

## Honest caveats

- **Outpaint quality varies.** ~10% of expansions need a different model. The review
  UI's "Re-expand…" button is for exactly that — pick a different provider per variation.
- **Browserless costs scale with volume.** Free tier covers light use; production batches
  may want a paid tier or a self-hosted Playwright service.
- **Forum + Social Proof master pipelines are not wired in v1.** Use the original
  templates manually for those, or wait for v2.
