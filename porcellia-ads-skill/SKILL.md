---
name: porcellia-ads
description: Builds social-proof ad creative — AMA / Q&A / Reddit-thread, forum endorsement, testimonial card, DM / iMessage / WhatsApp screenshot, polaroid review, AirDrop / notification mockup, problem-vs-solution, before/after — for Porcellia brands Rara, The Solved Skin, Mileenia, Zauv, Parman, Pragyanam, Gyros, Subtle, Atovio. Operator drops a folder (copy.csv + brand.json + images/) into chat; the skill reads each row, auto-expands any 1:1 source image to 9:16 via AI outpaint (with a brand-color padded fallback), renders all variations at 1080×1080 + 1080×1920 PNGs through a headless browser service, and returns a zip plus a local review.html where the operator marks Keep / Drop per variation, can Re-expand any image with a different AI model from a cost+strength comparison, and downloads only the approved PNGs as a final zip. Use whenever the user asks for AMA ads, Reddit-thread ads, social-proof ads, before-after ads, or any creative for a Porcellia brand — either by uploading a copy-and-images folder, or in prose ("3 AMAs for Mileenia, copy attached, here are the images").
---

# Porcellia Ads — claude.ai skill

End-to-end social-proof ad pipeline. Operator drops a folder, gets back a
zip of finished 1:1 + 9:16 PNGs plus a review page to pick the keepers.
V1 supports the **AMA** archetype end-to-end; Forum and Social Proof
master are next.

## What this skill does

1. Reads `copy.csv` + `brand.json` + an `images/` folder the operator drops in chat.
2. For every image that's 1:1, auto-expands it to 9:16 via a real AI
   outpaint provider (fal.ai Flux Fill Pro by default) — the previous
   manual Photoshop step is gone.
3. Mutates the EDITMODE block in `assets/ama.html` so it carries the new
   brand + variations, with both per-frame images base64-embedded.
4. Renders all PNGs through Browserless (a hosted headless browser).
5. Produces a `review.html` with Keep / Drop / Re-expand-with-model-picker
   per variation, and an Export-approved button that zips only the kept
   PNGs.
6. Returns the whole package as a downloadable zip.

## Required environment

The skill calls two external services. Set their keys in the chat session
(use `os.environ['…'] = …` in a Python cell *before* running the build,
or instruct the operator to add them to their claude.ai project secrets):

| Variable             | Used by                  | Required?                                              |
|----------------------|--------------------------|--------------------------------------------------------|
| `FAL_KEY`            | fal.ai outpaint          | Required for real outpaint; without it falls back to padded |
| `BROWSERLESS_TOKEN`  | PNG rendering            | Required for PNG output; without it skill returns HTML only |
| `OPENAI_API_KEY`     | OpenAI outpaint (option) | Only if operator picks gpt-image-1 in the model picker |
| `STABILITY_API_KEY`  | Stability outpaint       | Only if picked                                          |

If a key is missing, the skill **still completes** — outpaint falls back
to a brand-color padded image (visible bars but never wrong), and PNG
rendering falls back to "operator opens the HTML and clicks Export Both
per card." The skill is honest about what happened in the summary.

## How to drive it (instructions to Claude)

### 1. Detect the request

Trigger when the user mentions:
- AMA / Q&A / Reddit-thread / ask-me-anything ad
- Any of the brand ids: `rara`, `solvedskin`, `mileenia`, `zauv`,
  `parman`, `pragyanam`, `gyros`, `subtle`, `atovio`
- A folder / CSV / image batch they want made into ads

### 2. Gather inputs

If the operator uploaded files via the chat:
- Look in `/mnt/user-data/uploads/` for a CSV (any name; one that has
  `copy` in the name wins if multiple).
- Look for `brand.json` (optional).
- Look for an `images/` subfolder. If files were uploaded loose,
  treat anything in `/mnt/user-data/uploads/` with an image extension
  as an image and use the uploads dir as the images dir.

If anything required is missing, ask **once**, briefly. Don't loop.

### 3. Run the build

```bash
python /mnt/skills/porcellia-ads/scripts/build.py \
    --brand <brand-id> \
    --archetype ama \
    --uploads /mnt/user-data/uploads \
    --out     /mnt/user-data/outputs \
    --outpaint-model flux-fill-pro      # default; safe to omit
```

The script:
- Reads CSV with **column synonyms** (handles `context_bar/c1`,
  `question_text/c2`, `answer_text/c3`).
- Classifies each image (square / vertical / landscape).
- For 1:1 sources, calls the outpaint provider. If `FAL_KEY` is missing
  or the call fails, falls back to padded automatically.
- Populates the AMA template's EDITMODE block.
- If `BROWSERLESS_TOKEN` is set, renders PNGs via Browserless. Otherwise
  skips render and writes only the populated HTML.
- Writes `review.html` with Keep / Drop / Re-expand / Export-approved.
- Zips everything to `/mnt/user-data/outputs/<brand>-<archetype>.zip`.

Final line of stdout is `[ads-summary] {JSON}` — parse that to know
exactly what happened.

### 4. Report back to the operator

Use the summary JSON. A short message is best:

> Rendered 8 variations for **Mileenia** (AMA). 6 used real outpaint (Flux Fill Pro, $0.05/img), 2 used padded fallback. PNGs and review page are in your downloads — open `review.html`, mark Keep / Drop, hit **Export approved** to get the final zip.

Always link or mention:
- The output zip (primary deliverable).
- `review.html` (so they actually open it).
- Whether any 9:16 used the padded fallback (so they know which to scrutinize).

### 5. If the operator says "re-expand v3 with Stability"

Re-run only that variation:

```bash
python /mnt/skills/porcellia-ads/scripts/build.py \
    --brand <brand-id> --archetype ama \
    --uploads <same uploads folder, but only the row for v3 needed> \
    --out /mnt/user-data/outputs \
    --outpaint-model stability
```

Or, faster, manipulate the single-row CSV and re-run for that variation
only. The review UI also writes a queue to `localStorage.reexpandQueue`
when the operator hits Re-expand — they can paste that JSON back in chat
and ask Claude to process it.

## Folder contract

```
uploads/
├─ copy.csv                  ← any column scheme; synonyms handled
├─ brand.json                ← optional brand override
└─ images/                   ← OR loose at uploads/ root
    ├─ v1.jpg
    ├─ v2.png
    └─ v3.webp
```

Image filenames must start with (or contain) the variation `id` from
the CSV. The CSV may not have an `id` column — synonyms are mapped, or
ids are auto-generated as `v1, v2, …` in row order.

## Outputs

```
outputs/
├─ <brand>-<archetype>.zip            ← primary deliverable (everything below)
├─ review.html                        ← Keep / Drop / Re-expand / Export-approved
├─ <brand>-<archetype>-populated.html ← editable in browser (opens the template
│                                       with all copy + images pre-filled)
├─ pngs/
│   ├─ v1_1x1.png
│   ├─ v1_9x16.png
│   └─ …
└─ expanded/                          ← intermediate 9:16 outpaint outputs
    ├─ v1_9x16.jpg
    ├─ v1_9x16_padded.jpg             ← safe-fallback version
    └─ …
```

## Tone

Direct. One short message to ask for anything missing, then run. After
the run, surface the summary in 2–4 lines and the path to the zip and
review.html. No celebration, no emojis. Production mode.
