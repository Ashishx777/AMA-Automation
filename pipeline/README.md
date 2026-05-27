# Porcellia Ads Pipeline

Folder-driven batch renderer for the Porcellia social-proof ad templates
(`AMA AD TEMPLATE.html`, `Forum Post Ad Template.html`,
`Social Proof Ad Template.html`).

**V1 supports AMA only.** Other archetypes plug in by adding an adapter under
`lib/adapters/`.

---

## How it works

The operator points the CLI at a **job folder**:

```
jobs/my-job/
  copy.csv          # one row per variation
  brand.json        # optional: font, accent, color overrides
  images/           # one image per variation, named by id
    v1.jpg
    v2.jpg
    v3.jpg
  out/              # script writes results here
    v1_1x1.png
    v1_9x16.png
    ...
    review.html     # auto-opens when done
    approved/       # populated after operator clicks "Save selections"
    rejected/
```

The CLI:

1. Reads `copy.csv` and `brand.json`.
2. For each image: detects aspect ratio; if 1:1, runs outpaint (stubbed in
   v1, returns brand-color-padded 9:16 fallback) to produce a 9:16 source.
3. Generates a **job-scoped copy** of the template HTML with the EDITMODE
   block rewritten to contain only this brand + these variations.
4. Launches headless Chromium, pre-populates the template's IndexedDB
   `ImageStore` with per-variation images, calls `htmlToImage.toPng` on
   each 1:1 and 9:16 canvas at `pixelRatio: 2`, writes PNGs to `out/`.
5. Builds `out/review.html` — a local page that tiles every variation with
   Keep / Drop / Re-expand actions.
6. Fires a Windows toast notification and opens the review page in the
   default browser.

Operator clicks Keep/Drop, hits **Save selections** — kept PNGs move into
`out/approved/`, rejected into `out/rejected/`.

---

## Install

```
cd pipeline
npm install
```

(Postinstall runs `playwright install chromium` automatically.)

---

## Run

End-to-end on the example job:

```
npm run example
```

Or any job folder:

```
node bin/render.js --brand mileenia --archetype ama --folder path\to\job
```

Flags:

- `--brand <id>` — must match a brand seeded in the template, or in `brand.json`
- `--archetype <id>` — `ama` (v1); `forum` / `social` in later versions
- `--folder <path>` — absolute or relative path to the job folder
- `--template-dir <path>` — defaults to `../` (the project root holding the HTML templates)
- `--no-open` — skip opening the review page in the browser

---

## Outpaint

V1 stubs outpaint. Any 1:1 source image is expanded to 9:16 by **padding with
the brand accent color** on top and bottom (or with a blurred mirror of the
source if `brand.json` sets `paddingStyle: "mirror"`).

To wire a real provider, implement `outpaint(imagePath, opts)` in
`lib/outpaint.js` against fal.ai / OpenAI / Stability / Firefly / Ideogram.
The signature already returns `{ outPath, model, cost, fallbackPath }`.

---

## CSV format (AMA)

| id | c1 | c2 | c3 | image_note (optional) |
|----|----|----|----|------------------------|
| v1 | "Hourly running session??" | "Do your feet not hurt after a full office day?" | "Honestly no..." | "running shoes on a busy office floor" |

- `id` — must match the image filename (`v1.jpg`, `v1-final.png`, etc.)
- `c1` — black context bar / hook
- `c2` — white question pill
- `c3` — separate rounded answer bubble
- `image_note` — informational only; not rendered, used as outpaint prompt
  when a real provider is wired

---

## brand.json

Optional. If omitted, the pipeline falls back to the brand seeded in the
template HTML.

```json
{
  "id": "mileenia",
  "name": "Mileenia",
  "font": "elegant",
  "accent": "#c89a5e",
  "paddingStyle": "solid",
  "tier": "premium"
}
```
