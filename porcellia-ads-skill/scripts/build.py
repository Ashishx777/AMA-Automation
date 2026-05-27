#!/usr/bin/env python3
"""porcellia-ads — orchestrator.

The single entry the skill calls. Workflow:

    1. Scan inputs from --uploads (default: /mnt/user-data/uploads):
       - copy.csv       (any CSV; column synonyms handled by utils.read_csv)
       - brand.json     (optional brand overrides)
       - images/        (subdir or flat list of image files)
    2. For each row: find image, classify, run outpaint if 1:1.
    3. Mutate the EDITMODE block in assets/ama.html so the only seeded brand
       is the active one and its variations are the CSV rows, with
       `_seedSquare` + `_seedStory` dataURLs attached.
    4. If BROWSERLESS_TOKEN is set: render PNGs via Browserless.
       Otherwise: skip rendering; the operator will open the HTML and click
       Export. Either way a review.html is written.
    5. Zip everything in --out (default: /mnt/user-data/outputs).

Run::

    python build.py --brand mileenia --archetype ama \\
        --uploads /mnt/user-data/uploads \\
        --out     /mnt/user-data/outputs \\
        [--outpaint-model flux-fill-pro] [--pixel-ratio 2]
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import zipfile
from pathlib import Path

# Make sibling scripts importable when run as `python scripts/build.py`.
_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR))

from utils import (read_csv, find_image, classify, to_data_url,
                   build_padded_9x16, hex_to_rgb, IMAGE_EXTS)
from outpaint import outpaint, write_padded_alongside, models_as_dicts, recommend_model
from render_png import render_all, BrowserlessUnavailable
from review import write_review_page
from PIL import Image


EDITMODE_BEGIN = "/*EDITMODE-BEGIN*/"
EDITMODE_END = "/*EDITMODE-END*/"
SKILL_ROOT = _SCRIPT_DIR.parent
TEMPLATES = {
    "ama": SKILL_ROOT / "assets" / "ama.html",
}


def log(msg: str) -> None:
    print(f"[ads] {msg}", flush=True)


def find_uploads(uploads_dir: Path) -> tuple[Path, Path | None, Path]:
    """Return (csv_path, brand_json_path_or_none, images_dir).
    If `images/` subdir exists, use it; otherwise treat the uploads dir
    itself as the image source (flat layout)."""
    csvs = [p for p in uploads_dir.iterdir() if p.suffix.lower() == ".csv"]
    if not csvs:
        raise SystemExit(f"No CSV found in {uploads_dir}")
    csv_path = sorted(csvs, key=lambda p: 0 if "copy" in p.stem.lower() else 1)[0]
    brand_path = uploads_dir / "brand.json"
    brand_path = brand_path if brand_path.exists() else None
    imgs_sub = uploads_dir / "images"
    images_dir = imgs_sub if imgs_sub.exists() else uploads_dir
    return csv_path, brand_path, images_dir


def load_template(path: Path) -> tuple[str, int, int, dict]:
    html = path.read_text(encoding="utf-8")
    a = html.find(EDITMODE_BEGIN)
    b = html.find(EDITMODE_END)
    if a == -1 or b == -1 or b <= a:
        raise SystemExit(f"EDITMODE block not found in {path}")
    start = a + len(EDITMODE_BEGIN)
    return html, start, b, json.loads(html[start:b])


def replace_block(html: str, start: int, end: int, new_data: dict) -> str:
    return html[:start] + json.dumps(new_data, indent=2, ensure_ascii=False) + html[end:]


def shape_variation_ama(row: dict) -> dict:
    return {
        "id": row["id"],
        "c1": row.get("c1", ""),
        "c2": row.get("c2", ""),
        "c3": row.get("c3", ""),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand", required=True)
    ap.add_argument("--archetype", default="ama")
    ap.add_argument("--uploads", type=Path, default=Path("/mnt/user-data/uploads"))
    ap.add_argument("--out",     type=Path, default=Path("/mnt/user-data/outputs"))
    ap.add_argument("--outpaint-model", default="flux-fill-pro",
                    help="Outpaint model id. Falls back to padded if its key is missing.")
    ap.add_argument("--skip-outpaint", action="store_true",
                    help="Use pre-expanded 9:16s from <uploads>/expanded/ (Claude already "
                         "called the design.ai image connector). Falls back to padded if a "
                         "specific variation's expanded image is missing.")
    ap.add_argument("--pixel-ratio", type=int, default=2)
    ap.add_argument("--no-render", action="store_true",
                    help="Skip Browserless render; only produce the populated HTML.")
    args = ap.parse_args()

    archetype = args.archetype.lower()
    if archetype not in TEMPLATES:
        raise SystemExit(f"Archetype {archetype!r} not supported. v1 supports: {list(TEMPLATES)}")

    args.out.mkdir(parents=True, exist_ok=True)
    pngs_dir = args.out / "pngs"
    pngs_dir.mkdir(exist_ok=True)
    expanded_dir = args.out / "expanded"
    expanded_dir.mkdir(exist_ok=True)

    log(f"Scanning {args.uploads}")
    csv_path, brand_path, images_dir = find_uploads(args.uploads)
    log(f"  csv:       {csv_path.name}")
    log(f"  brand:     {brand_path.name if brand_path else '(none)'}")
    log(f"  images in: {images_dir}")

    rows = read_csv(csv_path, archetype)
    log(f"  rows:      {len(rows)}")

    brand_overrides = json.loads(brand_path.read_text(encoding="utf-8")) if brand_path else {}

    template_path = TEMPLATES[archetype]
    html, jstart, jend, data = load_template(template_path)
    brands = list(data.get("brands", []))
    idx = next((i for i, b in enumerate(brands) if b.get("id") == args.brand), -1)
    base_brand = dict(brands[idx]) if idx >= 0 else {
        "id": args.brand, "name": args.brand, "font": "system", "variations": []
    }
    for k, v in brand_overrides.items():
        if k in {"name", "font", "accent", "paddingStyle", "tier"}:
            base_brand[k] = v
    accent = base_brand.get("accent") or "#111111"

    new_variations: list[dict] = []
    review_variations: list[dict] = []
    any_stub = False

    for row in rows:
        if archetype == "ama":
            v = shape_variation_ama(row)
        else:
            v = dict(row)

        src_path = find_image(images_dir, row["id"])
        if src_path is None:
            review_variations.append({
                "id": v["id"], "sourceKind": "missing",
                "square": "", "story": "",
                "copyPreview": _copy_preview(row, archetype),
                "outpaintModel": None, "recommendedModel": None,
            })
            new_variations.append(v)
            continue

        with Image.open(src_path) as src:
            src.load()
            kind = classify(src)
            # 1:1 source seeds both frames in the template (square as-is,
            # story = outpaint or padded).
            v["_seedSquare"] = to_data_url(src.convert("RGB"))
            rec = recommend_model(src, base_brand)
            if kind == "square":
                expanded_path = expanded_dir / f"{row['id']}_9x16.jpg"
                # Always write a padded fallback alongside.
                write_padded_alongside(src_path, expanded_dir, row["id"], base_brand)

                # --skip-outpaint: look for an already-expanded image that the
                # design.ai connector (e.g. Higgsfield) produced upstream of
                # this script. Accept any common extension.
                preexpanded = None
                if args.skip_outpaint:
                    for ext in (".jpg", ".jpeg", ".png", ".webp"):
                        cand = args.uploads / "expanded" / f"{row['id']}_9x16{ext}"
                        if cand.exists():
                            preexpanded = cand; break
                    if preexpanded:
                        # Use the connector's output as the 9:16; copy it into
                        # out/expanded so downstream looks the same.
                        from shutil import copyfile
                        copyfile(preexpanded, expanded_path)
                        result = {"out_path": str(expanded_path), "model": "design.ai-connector", "stub": False}
                    else:
                        # Connector didn't supply one for this row — fall back to padded.
                        result = outpaint(
                            src_path=src_path, dst_path=expanded_path,
                            model_id="padded", brand=base_brand,
                            prompt=row.get("image_note", ""),
                        )
                else:
                    result = outpaint(
                        src_path=src_path, dst_path=expanded_path,
                        model_id=args.outpaint_model, brand=base_brand,
                        prompt=row.get("image_note", ""),
                    )
                if result.get("stub"):
                    any_stub = True
                with Image.open(expanded_path) as story:
                    story.load()
                    v["_seedStory"] = to_data_url(story.convert("RGB"))
                review_variations.append({
                    "id": v["id"], "sourceKind": "square",
                    "square": "", "story": "",  # filled after PNG render
                    "copyPreview": _copy_preview(row, archetype),
                    "outpaintModel": result.get("model"),
                    "recommendedModel": rec["pick"],
                })
            else:
                v["_seedStory"] = to_data_url(src.convert("RGB"))
                review_variations.append({
                    "id": v["id"], "sourceKind": kind,
                    "square": "", "story": "",
                    "copyPreview": _copy_preview(row, archetype),
                    "outpaintModel": None,
                    "recommendedModel": rec["pick"],
                })
        new_variations.append(v)

    base_brand["variations"] = new_variations
    if idx >= 0:
        brands[idx] = base_brand
    else:
        brands.insert(0, base_brand)
    data["brands"] = brands
    data["activeBrandId"] = args.brand

    populated_html = replace_block(html, jstart, jend, data)
    populated_path = args.out / f"{args.brand}-{archetype}-populated.html"
    populated_path.write_text(populated_html, encoding="utf-8")
    log(f"Wrote populated template: {populated_path}")

    # ── Render PNGs ─────────────────────────────────────────────────────
    rendered: list[dict] = []
    render_skipped_reason = None
    if args.no_render:
        render_skipped_reason = "--no-render flag set"
    else:
        try:
            rendered = render_all(populated_html, pngs_dir, pixel_ratio=args.pixel_ratio)
            log(f"Rendered {len(rendered)} PNGs via Browserless")
        except BrowserlessUnavailable as e:
            render_skipped_reason = str(e)
            log(f"Skipping render: {e}")

    # ── Populate review variations with PNG paths (rel to review.html) ──
    by_key = {(r["id"], r["frame"]): r["path"] for r in rendered}
    for rv in review_variations:
        sq_path = by_key.get((rv["id"], "square"))
        st_path = by_key.get((rv["id"], "story"))
        rv["square"] = _rel(args.out, sq_path) if sq_path else f"pngs/{rv['id']}_1x1.png"
        rv["story"]  = _rel(args.out, st_path) if st_path else f"pngs/{rv['id']}_9x16.png"

    # ── Write review.html ─────────────────────────────────────────────────
    review_payload = {
        "archetype": archetype,
        "brand": base_brand,
        "anyStub": any_stub,
        "models": models_as_dicts(),
        "variations": review_variations,
    }
    review_path = write_review_page(args.out / "review.html", review_payload)
    log(f"Wrote review page: {review_path}")

    # ── Zip everything ───────────────────────────────────────────────────
    zip_path = args.out / f"{args.brand}-{archetype}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(review_path, "review.html")
        zf.write(populated_path, populated_path.name)
        for p in pngs_dir.glob("*.png"):
            zf.write(p, f"pngs/{p.name}")
        for p in expanded_dir.glob("*.jpg"):
            zf.write(p, f"expanded/{p.name}")
    log(f"Zipped: {zip_path}")

    # ── Summary JSON (printed to stdout for the skill to surface) ───────
    summary = {
        "brand": base_brand.get("name", base_brand["id"]),
        "archetype": archetype,
        "variations": len(review_variations),
        "rendered_pngs": len(rendered),
        "render_skipped_reason": render_skipped_reason,
        "any_stub_outpaint": any_stub,
        "outputs": {
            "zip": str(zip_path),
            "review_html": str(review_path),
            "populated_html": str(populated_path),
            "pngs_dir": str(pngs_dir),
        },
    }
    print("\n[ads-summary] " + json.dumps(summary))
    return 0


def _copy_preview(row: dict, archetype: str) -> str:
    if archetype == "ama":
        return (f"<b>C1:</b> {_esc(row.get('c1',''))} &nbsp; "
                f"<b>C2:</b> {_esc(row.get('c2',''))} &nbsp; "
                f"<b>C3:</b> {_esc(row.get('c3',''))}")
    return " ".join(f"<b>{_esc(k)}:</b> {_esc(v)}" for k, v in list(row.items())[:4])


def _esc(s: object) -> str:
    return ("" if s is None else str(s)).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _rel(base: Path, p: str | None) -> str:
    if not p:
        return ""
    try:
        return str(Path(p).resolve().relative_to(base.resolve()))
    except Exception:
        return str(p)


if __name__ == "__main__":
    sys.exit(main())
