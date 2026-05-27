# Example job — Mileenia AMA

Three AMA variations seeded for smoke-testing the pipeline.

## To run

From `pipeline/`:

```
npm install
npm run example
```

## What to put in `images/`

Drop three image files named `v1.*`, `v2.*`, `v3.*` (any of `.jpg .png .webp`).
Filename just has to start with the variation id — `v1.jpg`, `v1-final.png`,
`mileenia-v1.webp` all work. The pipeline will:

- Use 1:1 sources directly on the 1:1 canvas.
- Auto-pad 1:1 sources with brand color (`#c89a5e`) for the 9:16 canvas
  (until a real outpaint provider is wired in `lib/outpaint.js`).
- Use already-9:16 sources directly on both canvases.

If `images/` is empty the pipeline still runs and renders copy-only frames.
