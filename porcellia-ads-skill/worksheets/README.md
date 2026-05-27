# Worksheet templates

Hand these to the copywriter. Two files:

| File | Purpose |
|---|---|
| `AMA-worksheet-TEMPLATE.csv` | Empty rows with column hints. Duplicate this file, rename, and fill. |
| `AMA-worksheet-EXAMPLE-mileenia.csv` | 5 finished AMA variations for Mileenia — use as a tone reference. |

## How the copywriter fills it

Open in Google Sheets or Excel. One row per ad variation. Three copy
columns, plus an image note:

| Column         | What goes here                                                  |
|----------------|-----------------------------------------------------------------|
| `id`           | Just `v1, v2, v3 …` — has to match the image filename.          |
| `context_bar`  | Short hook line that becomes the **black bar** on top. Can carry an emoji. Sounds like the OP's caption. |
| `question_text`| The question being asked — becomes the **white pill** below the black bar. |
| `answer_text`  | The reply — becomes the **rounded bubble** floating elsewhere on the frame. |
| `image_note`   | One-line description of the photo. Not shown to viewers. Used as an AI prompt when a 1:1 image is auto-expanded to 9:16. |

Keep lines tight — context bar < 8 words, question < 12, answer < 30.

## How the operator pairs images

For every row in the sheet, drop a matching image into `images/`:

```
my-mileenia-batch/
├─ copy.csv                ← the filled worksheet
├─ brand.json              ← optional
└─ images/
    ├─ v1.jpg              ← matches row id = v1
    ├─ v2.jpg              ← matches row id = v2
    ├─ v3.png
    ├─ v4.webp
    └─ v5.jpg
```

Filenames just have to **start with** the id — `v1.jpg`, `v1-final.png`,
`mileenia-v1.webp` all match row `v1`.

## Then?

Drop the whole folder into a claude.ai chat where the **Porcellia Ads**
skill is enabled. Say "make AMAs for Mileenia." The skill processes
everything and returns a zip plus a review page.

## Column naming — flexibility

The skill accepts either schema, the copywriter can use whichever they're
used to:

| Template name (what the worksheet uses) | Alternate name (also accepted) |
|---|---|
| `context_bar` | `c1` |
| `question_text` | `c2` |
| `answer_text` | `c3` |

So if you already have CSVs using `c1 / c2 / c3` (like the ones in
`pipeline/jobs/example-mileenia/`), those work without renaming columns.
