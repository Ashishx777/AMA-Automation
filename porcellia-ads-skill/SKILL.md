---
name: porcellia-ads
description: Builds social-proof ad creative — AMA / Q&A / Reddit-thread, forum endorsement, testimonial card, DM / iMessage / WhatsApp screenshot, polaroid review, AirDrop / notification mockup, problem-vs-solution, before/after — for Porcellia brands Rara, The Solved Skin, Mileenia, Zauv, Parman, Pragyanam, Gyros, Subtle, Atovio. Operator drops a folder (copy.csv + brand.json + images/) into chat; the skill expands 1:1 sources to 9:16 via the project's design.ai image connector, renders all variations as PNGs, and presents an inline artifact in the chat for Keep / Drop review with a one-click clipboard-copy of the approval string. Operator pastes the approval back, gets a zip of the approved full-resolution PNGs. Everything happens inside claude.ai — no local Chrome, no local CLI. Use whenever the user asks for AMA ads, Reddit-thread ads, social-proof ads, before-after ads, or any creative for a Porcellia brand.
---

# Porcellia Ads — claude.ai skill

End-to-end social-proof ad pipeline that runs **entirely inside claude.ai**.
Operator drops a folder, gets back a clickable review artifact in the chat,
then pastes their approval string back for a final zip of keepers.

V1 supports the **AMA** archetype end-to-end; Forum and Social Proof master
have CSV schemas documented but the pipeline is not yet wired for them.

## Phase 0 — Self-update (silent unless updated)

On the first message of every new chat:

```bash
python scripts/self_update.py --target /mnt/user-data/scripts/porcellia-ads-skill
```

Updated? Say one line. No-op? Say nothing.

## Phase 1 — Greeting menu (clickable artifact)

On fresh chat with no upload / no clear intent, **render
`assets/welcome-menu.html` as an inline artifact**. Operator picks an
option (and a brand, if "Make ads"); the artifact copies the intent
string to their clipboard. They paste it back into chat.

One-line lead above the artifact: *"Pick below — click → paste back."*

Skip the menu if the operator already attached a folder, named a brand,
or asked a specific question.

## Architectural rule

Everything happens **inside the claude.ai chat**:
- Input via chat file attachment (folder or zip).
- Brand detection + pairing via chat conversation (with inline image thumbnails).
- Image expansion via the project's image-edit connector (Higgsfield / equivalent).
- PNG render via Browserless (called from the Python sandbox).
- Review surface = an **inline claude.ai artifact** (not a downloadable HTML).
- Approval = operator pastes a one-line string back into chat.
- Final delivery = a downloadable zip returned in the chat.

No local Chrome. No local CLI. No file open dialogs.

## The 5-phase flow

### 1. Intake + brand detection (conversational)

Operator drops a folder/zip. Look in `/mnt/user-data/uploads/` for:
- A CSV (any name; preference for one with "copy" in the name).
- Optional `brand.json`.
- Images — in an `images/` subfolder or loose.

Detect brand: `brand.json` → filename prefix → ask the operator (short list).

### 2. Pairing (conversational, only if needed)

If every CSV row's `id` matches an image filename → proceed silently.

If not → propose pairings as a markdown table with inline image thumbnails.
Operator confirms or asks for swaps. Write a corrected `copy.csv` with
explicit `image_filename` column and rename images on disk only after the
operator's confirmation.

### 3. Expand 1:1 → 9:16 via the design.ai connector

For each 1:1 image:
- Call the project's image-edit connector with the source + the row's
  `image_note` as prompt (or default: *"extend the background naturally,
  same lighting, same surface, no people, no text, no logos"*).
- Save to `/mnt/user-data/uploads/expanded/<id>_9x16.<ext>`.

Failures → skip; the pipeline substitutes a brand-color padded fallback.

### 4. Build

```bash
python /mnt/skills/porcellia-ads/scripts/build.py \
    --brand <brand-id> \
    --archetype ama \
    --uploads /mnt/user-data/uploads \
    --out     /mnt/user-data/outputs \
    --skip-outpaint
```

Reads CSV (column synonyms ok), populates EDITMODE, renders PNGs via
Browserless if `BROWSERLESS_TOKEN` is set, and produces a thumbnail-based
`review.html`. Final stdout line: `[ads-summary] {JSON}`.

### 5. Review as inline artifact + approval

**Read `review.html` and emit its content as an inline artifact in your
chat reply.** Don't link to it as a download — render it in the chat panel.

Inside the artifact, the operator:
- Clicks Keep / Drop per tile.
- Clicks **Re-expand…** on bad 9:16s, picks a model — the button copies
  `re-expand v3 with stability` to the clipboard.
- Clicks **Copy approval string** when done — copies `approve v1, v3, v5`
  to the clipboard.

Operator pastes the string back into chat. Then:

```bash
python /mnt/skills/porcellia-ads/scripts/build_approved_zip.py \
    --approved   "v1, v3, v5" \
    --pngs-dir   /mnt/user-data/outputs/pngs \
    --out        /mnt/user-data/outputs/<brand>-approved.zip \
    --populated-html /mnt/user-data/outputs/<brand>-ama-populated.html
```

Return the zip as a downloadable file.

For `re-expand <id> with <model>` paste-backs: call the connector again for
that image with the requested model, save to `uploads/expanded/`, re-run
`build.py --skip-outpaint`, render a fresh review artifact.

## Required environment

| Variable            | Used for               | Required?                                |
|---------------------|------------------------|------------------------------------------|
| `BROWSERLESS_TOKEN` | Headless PNG rendering | Strongly recommended for PNG output      |

**1:1 → 9:16 expansion** uses the project's design.ai image-edit connector,
not an API key in the sandbox.

Missing `BROWSERLESS_TOKEN` → no PNGs, but the review artifact still works
(thumbnails come from expanded/source images), and the approval zip includes
the populated HTML so the operator can export PNGs from the template's
in-page buttons.

## Worksheet generator (sub-flow)

If the operator has images but no copy yet:

```bash
python /mnt/skills/porcellia-ads/scripts/build_worksheet.py \
    --images   /mnt/user-data/uploads/images \
    --archetype ama \
    --out      /mnt/user-data/outputs/worksheet.xlsx
```

Returns a downloadable .xlsx with image thumbnails in column A. Copywriter
fills the empty cells, saves as CSV, sends back.

## Tone

Direct. Production mode. Surface paths, summaries, deltas. No celebration,
no emojis.

## Not in v1

- Forum + Social Proof master archetypes.
- Multi-brand batches.
- Webhook-driven repo refresh (claude.ai pulls on-demand per chat).
- Real-time Re-expand inside the artifact (currently paste-back-based).
