# CSV schemas

One row per variation. The `id` column matches the image filename stem.

## AMA (v1 — supported)

| column       | required | notes                                                |
|--------------|----------|------------------------------------------------------|
| `id`         | yes      | Must match image filename. Use `v1, v2, …` if unsure.|
| `c1`         | yes      | Black context bar / hook — usually a short statement or emoji-tagged line. |
| `c2`         | yes      | White question pill — the question being answered.   |
| `c3`         | yes      | Separate rounded answer bubble — the testimonial line. |
| `image_note` | no       | Plain-English description of the image. Not rendered; used as an outpaint prompt when a real provider is wired. |

### Example

```csv
id,c1,c2,c3,image_note
v1,"Has anyone tried Mileenia for hair fall?","Does it actually work after pregnancy?","Yes — six weeks in, less shedding, more baby hairs. Honestly didn't expect it.","close-up of a woman touching her hair, soft window light"
v2,"Real talk — is the price worth it?","I'm done buying overhyped serums.","I bought one bottle to test. Now I'm three bottles in. That's my answer.","bottle on a marble bathroom shelf, morning light"
```

## Forum (planned — not wired in v1)

| column      | required | notes                          |
|-------------|----------|--------------------------------|
| `id`        | yes      | Matches image filename.        |
| `community` | yes      | Community handle in header.    |
| `handle`    | yes      | OP handle.                     |
| `title`     | yes      | Bold post title.               |
| `body`      | yes      | Body paragraph.                |
| `upvotes`   | no       | Engagement count.              |
| `comments`  | no       | Engagement count.              |

## Social Proof master (planned — not wired in v1)

The master template is layout-driven. Add a `layout` column whose value
is one of:

- `testimonial`: `card` · `editorial` · `tabbed`
- `dm`: `dm-instagram` · `dm-imessage` · `dm-whatsapp` · `dm-sms`
- `review`: `review-bubble` · `review-stars` · `review-polaroid`
- `ui`: `ui-airdrop` · `ui-notification` · `ui-composer` · `ui-review-cluster` · `ui-chat-cluster` · `ui-before-after`
- `labelled`: `labelled-bubbles`
- `problemsolution`: `ps-split` · `ps-search`
- `beforeafter`: `ba-split` · `ba-checktable` · `ba-pillpair`

Field set per layout lives in the master template's variation schema:
`headline, body, author, rating, cta`, plus layout-specific extras in
`meta`. See the project root `SKILL.md` for the full breakdown.
