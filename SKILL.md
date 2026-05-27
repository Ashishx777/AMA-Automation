# Social Proof Ad Templates

A library of reusable, in-browser ad-template HTML files for producing social-proof
creative across multiple brands at 1:1 (1080×1080) and 9:16 (1080×1920). Every
template is a single HTML file that mounts a React app, renders each variation as
a full-resolution canvas, and exports a 2× PNG via `html-to-image`.

When the user asks for a new social-proof ad, identify which template best matches
the format they're describing, copy that template into the project, then update
the `EDITMODE` JSON block (or use the in-app Tweaks panel) to seed brand copy.

---

## Shared conventions

All templates share the same skeleton, so once you know one you know them all:

- **Frame sizes** — every variation renders side-by-side at two aspect ratios:
  - `square` · 1080 × 1080 (1:1)
  - `story`  · 1080 × 1920 (9:16)
- **Persistence** — copy / layout / drag positions / brand list live inside an
  `/*EDITMODE-BEGIN*/{ … }/*EDITMODE-END*/` JSON block in an inline `<script>`.
  The Tweaks panel writes through `__edit_mode_set_keys` so changes survive
  reload.
- **Images** — per-variation images (`ImageStore`) are session-scoped and held
  in IndexedDB, **not** in the EDITMODE block, to keep the file slim.
- **Tweaks panel** — toolbar toggle activates a right-hand panel: brand picker,
  per-variation copy fields, layout chips, image drop zone, CSV import, color
  pickers (where layouts have slots), font picker.
- **Drag** — copy blocks and (where supported) images are draggable directly on
  each canvas with separate positions per aspect ratio.
- **Export** — every variation card has `Export 1:1`, `Export 9:16`, and
  `Export both` buttons that emit 2× PNGs.

---

## Templates in this project

### 1. `AMA AD TEMPLATE.html` — *AMA / Q&A ad*

Three-component AMA layout. A black "context bar" (C1) sits over a white
"question" pill (C2), joined as a single card; a separate rounded "answer"
bubble (C3) floats elsewhere on the frame. Both pieces drag independently.

- **Components per variation** — `c1` (context bar / hook), `c2` (question),
  `c3` (answer).
- **Image** — full-bleed background OR draggable + resizable foreground
  (`imageMode: 'background'` toggle).
- **Per-frame state** — `pos.{square|story}.qa`, `pos.{square|story}.ans`,
  `imgT.{square|story}` (image x/y/w/h fractions).
- **Brand-level** — name, font (system / serif / mono / rounded / display /
  elegant / inter).
- **Brands seeded in this file** — Rara, The Solved Skin, Mileenia, Zauv,
  Parman, Pragyanam, Gyros, Subtle, Atovio.
- **Use when** — the testimonial reads as a Q-and-A from a community thread,
  and you want the C1/C2 module to feel like a single sticker the answer
  responds to.
- **Dependencies** — inline JSX; uses `design-canvas.jsx` for the frame grid.

### 2. `Forum Post Ad Template.html` — *Forum endorsement post*

Mocked community forum post: a header bar with a community handle and a
generic platform mark, an OP handle row, a bold post title, a body paragraph,
and an engagement footer. Chrome and platform mark are **original** — not a
recreation of any existing forum.

- **Components per variation** — `community`, `handle`, `title`, `body`,
  engagement counts (`upvotes`, `comments`).
- **Theme swatches** — preset color themes pickable from a 4-up swatch grid
  in Tweaks.
- **Type** — Geist / IBM Plex / Space Grotesk loaded from Google Fonts.
- **Use when** — the social proof should read as a long-form endorsement /
  recommendation post on a forum, not a chat or review.

### 3. `Social Proof Ad Template.html` — *Master multi-layout template*

The largest template. One file holds **multiple ad types**, each with its own
set of layouts. A brand has a separate variation bucket per ad type
(`brand.adTypeVariations[adType]`), so switching ad-type tabs swaps the
canvas in place. Top-of-canvas tabs select the active ad type.

#### Ad types

`AD_TYPES` declares the available buckets (`ready: true` is wired up):

| id              | Label                | Ready |
| --------------- | -------------------- | ----- |
| testimonial     | Testimonial          | ✅    |
| dm              | Text / DM            | ✅    |
| review          | Review card          | ✅    |
| ui              | UI ad                | ✅    |
| labelled        | Labelled             | ✅    |
| problemsolution | Problem / Solution   | ✅    |
| beforeafter     | Before / After       | ✅    |
| forum           | Forum post           | 🚧    |
| tweet           | Tweet quote          | 🚧    |
| press           | Press wall           | 🚧    |
| starbanner      | Star banner          | 🚧    |
| ama             | AMA                  | 🚧    |

> Note: `forum` and `ama` are stubs in this template; the standalone
> `Forum Post Ad Template.html` and `AMA AD TEMPLATE.html` are the real
> implementations of those formats.

#### Layouts per ad type

From `window.ADTYPE_LAYOUT_LIST` / `window.ADTYPE_LAYOUT_LABELS`
(in `social-proof-adtypes.jsx` / built-in for `testimonial`):

- **testimonial**
  - `card` · *Card* — floating white review card with stars, headline, body,
    author. The most restrained layout.
  - `editorial` · *Editorial* — large pull-quote treatment with serif display
    type and oversized author block.
  - `tabbed` · *Tabbed* — segmented testimonial card with metadata tabs.
- **dm** (text / DM)
  - `dm-instagram` · *Instagram DM* — Instagram-style DM screen with status
    bar, gradient avatar, message bubbles, reactions.
  - `dm-imessage` · *iMessage* — iOS Messages screen, blue/grey bubbles.
  - `dm-whatsapp` · *WhatsApp* — WhatsApp green chat screen, double-tick.
  - `dm-sms` · *SMS* — generic SMS thread.
- **review** (review-card style)
  - `review-bubble` · *Bubble review* — speech-bubble quote with attribution.
  - `review-stars` · *Star card* — star rating dominant, body underneath.
  - `review-polaroid` · *Polaroid* — polaroid-style photo + handwritten quote.
- **ui** (mocked product UI screens)
  - `ui-airdrop` · *AirDrop* — AirDrop-style sheet floating over a frame.
  - `ui-notification` · *Notification* — push-notification stack.
  - `ui-composer` · *iMessage composer* — composer cell mid-typing a message.
  - `ui-review-cluster` · *Review cluster* — grid of mini review cards.
  - `ui-chat-cluster` · *Chat cluster* — grid of mini chat-bubble cards.
  - `ui-before-after` · *Before / After* — UI-skinned before/after card.
- **labelled**
  - `labelled-bubbles` · *Bubble callouts* — image with arrowed bubble
    callouts pointing at product features.
- **problemsolution**
  - `ps-split` · *Problems / Solution* — two-column "problems vs solution"
    breakdown with bubble bullets.
  - `ps-search` · *Search → Solution* — fake search bar with the product as
    the answer card.
- **beforeafter**
  - `ba-split` · *Side-by-side* — left/right tiled before/after with a
    "vs." badge. Has color slots for left/right backgrounds, text, and badge.
  - `ba-checktable` · *Check table* — feature table with checks against a
    dark "brand column".
  - `ba-pillpair` · *Pill pair* — two stacked pills (without / with) on a
    saturated background with glow.

#### Per-variation fields

```
{
  id, layout,
  headline, body, author, rating (0..5 half-steps), cta,
  pos:   { square: { roleA: {x,y}, … }, story: { … } },
  sizes: { roleA: {w[,h]}, … },
  bg:    { …color slots, see LAYOUT_COLOR_SLOTS },
  meta?: { layout-specific extras }
}
```

#### Brand-level fields

`{ id, name, accent, font, fontH2, adTypeVariations: { [adType]: Variation[] } }`

#### Color slots

Layouts under `window.LAYOUT_COLOR_SLOTS` expose named color pickers in
Tweaks. The slot list is the source of truth for which colors a layout reads
from `variation.bg`:

- `ba-split` — leftBg, rightBg, leftFg, rightFg, badge, badgeFg
- `ba-checktable` — pageBg, brandCol, headline, checkBg, checkFg
- `ba-pillpair` — pageBg, glow, headlineFg, dimCardBg, liveCardBg, cardFg
- `ps-split` — pageBg, accentRed, ink, bubbleBg, bubbleFg, divider
- `ps-search` — pageBg, ink, accentRed, inputBg, inputFg

#### Layouts that own their image slots

`window.LAYOUTS_NO_MAIN_IMAGE` suppresses the default per-variation
background uploader for layouts that scaffold their own image tiles:
`ui-before-after`, `ba-split`, `ba-checktable`, `ba-pillpair`,
`ps-split`, `ps-search`.

#### Brands seeded in this file

Rara, The Solved Skin, Mileenia, Zauv, Parman, Pragyanam.

#### Dependencies

- `design-canvas.jsx` — pan/zoom artboard grid (DCSection / DCArtboard).
- `social-proof-layouts.jsx` — testimonial layouts (card / editorial / tabbed)
  and shared primitives (PersonAvatar, Stars).
- `social-proof-adtypes.jsx` — every non-testimonial layout, plus the
  `window.ADTYPE_*` registries.

### 4. `Ad Variations v1.html` — *Earliest static AMA prototype*

Hard-coded list of 10 Rara variations rendered to canvas. Predecessor of
`AMA AD TEMPLATE.html`. **Reference only** — no Tweaks panel, no brand
switcher, no export. Use it to read the original copy or layout intent, not
as a starting point for new work.

---

## Picking the right template

| User says                                                  | Use                                |
| ---------------------------------------------------------- | ---------------------------------- |
| "AMA-style", "Q&A", "Reddit-thread feel", three-block ad   | `AMA AD TEMPLATE.html`             |
| Forum endorsement post, long-form recommendation thread    | `Forum Post Ad Template.html`      |
| Card review, editorial pull-quote, tabbed testimonial      | `Social Proof Ad Template.html` → `testimonial` |
| Screenshot of a DM / iMessage / WhatsApp / SMS chat        | `Social Proof Ad Template.html` → `dm` |
| Stars + quote review tile, polaroid review                 | `Social Proof Ad Template.html` → `review` |
| AirDrop sheet, notification stack, composer screenshot     | `Social Proof Ad Template.html` → `ui` |
| Image with arrow-callout bubbles labelling features        | `Social Proof Ad Template.html` → `labelled` |
| "Problems vs. solution" or "search → answer" card          | `Social Proof Ad Template.html` → `problemsolution` |
| Before / after split, check table, "without vs. with" pill | `Social Proof Ad Template.html` → `beforeafter` |

---

## Adding a new variation

1. Open the relevant template, find the brand inside the EDITMODE block.
2. Append an object to `variations` (or `adTypeVariations[adType]` for the
   master template). The minimum shape is `{ id, c1, c2, c3 }` for AMA, or
   `{ id, layout, headline, body, author, rating }` for Social Proof.
3. Reload — the new variation card appears in the canvas with default drag
   positions.
4. Drag pieces on either canvas, upload an image via the Tweaks panel, then
   click `Export both` to download 1080×1080 + 1080×1920 PNGs.

## Adding a new brand

Add an object to `brands` with a unique `id`, a display `name`, a `font` id
from the FONTS table, and one starter variation. The brand switcher (top of
canvas in Social Proof / AMA) will surface it immediately.

## Adding a new layout to the Social Proof template

1. Implement the layout component in `social-proof-adtypes.jsx`. It must
   accept `{ variation, pos, sizes, F, frame, editOn, onPosChange, onResize,
   accent, fontStack, fontH2 }` and render at frame-pixel scale.
2. Register it under the matching ad type in `window.ADTYPE_LAYOUTS`,
   `window.ADTYPE_LAYOUT_LIST`, and `window.ADTYPE_LAYOUT_LABELS`.
3. If the layout owns its own image slots, add it to
   `window.LAYOUTS_NO_MAIN_IMAGE`.
4. If the layout has color tokens, declare them in
   `window.LAYOUT_COLOR_SLOTS[layoutId]` so the Tweaks panel renders pickers.
