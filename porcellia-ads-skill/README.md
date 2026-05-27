# porcellia-ads — claude.ai web skill

End-to-end social-proof ad pipeline that runs inside claude.ai. Zip this
folder, upload it at **claude.ai → Settings → Skills → Create**, and from
then on any chat that asks for an AMA / Reddit-thread ad for one of the
Porcellia brands triggers it automatically.

## Folder

```
porcellia-ads-skill/
  SKILL.md                 ← Claude's instructions (description triggers the skill)
  assets/
    ama.html               ← AMA template, patched with:
                              • frame-aware ImageStore lookup
                              • EDITMODE-seed-images on load
                              • window.__exportAll() for headless export
                              • data-export-canvas attributes per frame
  scripts/
    build.py               ← orchestrator (entry point)
    utils.py               ← CSV column mapping, image classification, padded fallback
    outpaint.py            ← provider catalog + fal.ai/OpenAI implementations
    render_png.py          ← Browserless integration (HTML → PNG zip)
    review.py              ← review.html generator (Keep/Drop/Re-expand/Export)
  reference/
    csv-schemas.md         ← columns per archetype
    brand-list.md          ← seeded brands and defaults
```

## Required environment

Set these in the chat (or claude.ai project secrets) before running:

- `FAL_KEY` — for real 1:1 → 9:16 outpaint via fal.ai Flux Fill
- `BROWSERLESS_TOKEN` — for headless PNG rendering
- Optional: `OPENAI_API_KEY`, `STABILITY_API_KEY` for alternate outpaint models

If a key is missing, the skill degrades gracefully:
- No `FAL_KEY` → padded fallback (brand-color bars, visible but safe)
- No `BROWSERLESS_TOKEN` → operator opens the populated HTML and clicks Export

## Operator flow inside claude.ai

1. Operator drops a folder into chat: `copy.csv` + `brand.json` (optional) + `images/`.
2. Operator: *"Make AMAs for Mileenia."*
3. Skill runs `build.py`:
   - Reads CSV (handles `context_bar/c1` and `question_text/c2` and `answer_text/c3` synonyms)
   - For each 1:1 image: outpaints to 9:16 via fal.ai Flux Fill Pro (default)
   - Populates the AMA template
   - Renders all PNGs via Browserless
   - Builds `review.html`
   - Zips everything
4. Skill replies with the zip + a one-line summary ("8 variations, 6 outpainted, 2 padded").
5. Operator opens `review.html` from the zip, clicks **Keep / Drop** per variation,
   and hits **Export approved (.zip)** to get only the keepers.
6. If any 9:16 looks wrong, operator clicks **Re-expand…** to pick a different
   AI model from a cost/strength comparison; the queued re-expand request is
   captured in `localStorage` and can be sent back to claude.ai to run.

## What's different from the local CLI

The `pipeline/` folder in the same repo is a Node.js CLI that does the
same work on the operator's local machine, with a folder picker and
Playwright headless export. The web skill is the same idea but adapted
to claude.ai's sandbox: chat attachments instead of a folder, Python +
PIL instead of Node + sharp, and the operator clicks Export in their own
browser instead of getting PNGs back directly (the sandbox can't run
Playwright).

## Quick test, locally

If you want to verify the skill folder works before uploading:

```bash
cd porcellia-ads-skill
mkdir -p /tmp/uploads/images
cp ../pipeline/jobs/example-mileenia/copy.csv /tmp/uploads/
cp ../pipeline/jobs/example-mileenia/brand.json /tmp/uploads/
# drop v1.jpg, v2.jpg, v3.jpg into /tmp/uploads/images/

python scripts/build_ama.py \
    --csv      /tmp/uploads/copy.csv \
    --images   /tmp/uploads/images \
    --brand    mileenia \
    --template assets/ama.html \
    --out      /tmp/out/mileenia-ama.html \
    --brand-json /tmp/uploads/brand.json

# open /tmp/out/mileenia-ama.html in a browser
```

Open the result — every variation should render with copy + image
pre-filled at both ratios. Click `Export both` on any card to confirm
PNG export still works.
