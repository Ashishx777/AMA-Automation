# Brand list

Brands seeded in `assets/ama.html`. The skill defaults to these unless
the user supplies a `brand.json` override.

| id           | name             | font     | typical accent | tier    |
|--------------|------------------|----------|----------------|---------|
| `rara`       | Rara             | system   | #1a1612        | core    |
| `solvedskin` | The Solved Skin  | elegant  | #2a1a14        | premium |
| `mileenia`   | Mileenia         | elegant  | #c89a5e        | premium |
| `zauv`       | Zauv             | display  | #1e1e1e        | core    |
| `parman`     | Parman           | serif    | #2a2018        | premium |
| `pragyanam`  | Pragyanam        | serif    | #2d2014        | premium |
| `gyros`      | Gyros            | rounded  | #1d1d1d        | core    |
| `subtle`     | Subtle           | inter    | #1a1a1a        | core    |
| `atovio`     | Atovio           | display  | #111111        | core    |

`tier` is informational in v1 and biases the outpaint model recommender
toward higher-quality options once a real provider is wired.

## New brand?

Ask the user for:

```json
{
  "id": "new-brand",
  "name": "Display Name",
  "font": "elegant",
  "accent": "#hexcolor",
  "paddingStyle": "solid",
  "tier": "premium"
}
```

Pass that as `--brand-json` to `build_ama.py`. The skill will add it to
the EDITMODE block as a fresh brand entry.
