"""Shared utilities: CSV column mapping, image classification, file resolution.

Real production CSVs from the Porcellia team use header names like
`context_bar / question_text / answer_text` (see uploads/Mileenia_Fashion.csv
and uploads/subtle-ama-copy.csv). The AMA template, however, persists copy
under `c1 / c2 / c3`. This module normalizes both shapes into a single
canonical schema so the same downstream code handles either.
"""
from __future__ import annotations

import base64
import csv as csv_mod
import io
from pathlib import Path
from typing import Optional

try:
    from PIL import Image, ImageEnhance, ImageFilter
except ImportError:
    raise SystemExit("Pillow required: pip install pillow")


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Column synonym map per archetype. Left side = canonical (what the
# template stores), right side = any header the operator may have used.
COLUMN_SYNONYMS: dict[str, dict[str, list[str]]] = {
    "ama": {
        "id":         ["id", "ID", "variation", "variation_id"],
        "c1":         ["c1", "context_bar", "context", "hook", "context bar"],
        "c2":         ["c2", "question_text", "question", "q"],
        "c3":         ["c3", "answer_text", "answer", "a"],
        "image_note": ["image_note", "image", "image_description", "image desc", "shot_note"],
    },
    "forum": {
        "id":        ["id", "ID"],
        "community": ["community", "subreddit", "sub"],
        "handle":    ["handle", "op", "username"],
        "title":     ["title", "post_title"],
        "body":      ["body", "post_body", "post"],
        "upvotes":   ["upvotes", "votes", "score"],
        "comments":  ["comments", "comment_count"],
    },
}

STORY_W, STORY_H = 1080, 1920
SQUARE_TOLERANCE = 0.02


def read_csv(path: Path, archetype: str) -> list[dict[str, str]]:
    """Read csv with flexible column-name mapping. Generates v1, v2, … if
    no `id` column is present."""
    syn = COLUMN_SYNONYMS.get(archetype)
    if syn is None:
        raise SystemExit(f"Unknown archetype: {archetype!r}")

    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv_mod.DictReader(f)
        raw_rows = list(reader)
        headers = reader.fieldnames or []

    if not raw_rows:
        raise SystemExit(f"CSV is empty: {path}")

    # Map every actual header to a canonical name (or pass through verbatim).
    lower_headers = {h.lower().strip(): h for h in headers}
    header_map: dict[str, str] = {}
    for canonical, options in syn.items():
        for opt in options:
            if opt.lower() in lower_headers:
                header_map[lower_headers[opt.lower()]] = canonical
                break

    # Detect rows that are accidental re-headers in a stitched CSV. The
    # Mileenia_Fashion.csv has a duplicate header row partway through —
    # we just skip any row whose values exactly match the header.
    def is_header_row(row: dict[str, str]) -> bool:
        return all((row.get(k) or "").strip().lower() == k.lower() for k in row.keys())

    canonical_rows: list[dict[str, str]] = []
    auto_id = 0
    seen_ids: set[str] = set()
    for row in raw_rows:
        if is_header_row(row):
            continue
        out: dict[str, str] = {}
        for raw_k, raw_v in row.items():
            canonical_k = header_map.get(raw_k, raw_k)
            out[canonical_k] = (raw_v or "").strip()
        # Auto-id if missing or empty.
        if not out.get("id"):
            auto_id += 1
            out["id"] = f"v{auto_id}"
        if out["id"] in seen_ids:
            # Make ids unique by suffixing — don't crash.
            i = 2
            while f"{out['id']}_{i}" in seen_ids:
                i += 1
            out["id"] = f"{out['id']}_{i}"
        seen_ids.add(out["id"])
        canonical_rows.append(out)

    if not canonical_rows:
        raise SystemExit(f"CSV had no data rows: {path}")

    return canonical_rows


def find_image(images_dir: Path, vid: str) -> Optional[Path]:
    """Return path of image whose stem starts with (or equals) `vid`."""
    if not images_dir.exists():
        return None
    lid = vid.lower()
    candidates: list[Path] = []
    for p in images_dir.iterdir():
        if not p.is_file():
            continue
        if p.suffix.lower() not in IMAGE_EXTS:
            continue
        stem = p.stem.lower()
        if (
            stem == lid
            or stem.startswith(lid + "-")
            or stem.startswith(lid + "_")
            or stem.endswith("-" + lid)
            or stem.endswith("_" + lid)
            or ("-" + lid + "-") in stem
            or ("_" + lid + "_") in stem
        ):
            candidates.append(p)
    if not candidates:
        return None
    candidates.sort(key=lambda p: 0 if p.stem.lower() == lid else 1)
    return candidates[0]


def classify(img: Image.Image) -> str:
    """Return one of: square, vertical, landscape, other."""
    w, h = img.size
    if abs(w - h) / max(w, h) < SQUARE_TOLERANCE:
        return "square"
    ratio = w / h
    if ratio < 1 and (h / w) >= 1.6:
        return "vertical"
    return "landscape" if ratio > 1 else "other"


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def to_data_url(img: Image.Image, fmt: str = "JPEG", quality: int = 88) -> str:
    """Convert a PIL image to a data:image/...;base64,... URL."""
    buf = io.BytesIO()
    if fmt.upper() == "PNG":
        img.save(buf, format="PNG")
        mime = "image/png"
    else:
        img.convert("RGB").save(buf, format="JPEG", quality=quality)
        mime = "image/jpeg"
    return f"data:{mime};base64,{base64.b64encode(buf.getvalue()).decode('ascii')}"


def build_padded_9x16(src: Image.Image, accent: str | tuple, style: str = "solid") -> Image.Image:
    """1:1 (any size) -> 1080x1920 with brand-color or blurred-mirror padding."""
    if isinstance(accent, str):
        accent = hex_to_rgb(accent)
    square = src.convert("RGB").resize((STORY_W, STORY_W), Image.LANCZOS)
    top_offset = (STORY_H - STORY_W) // 2
    if style == "mirror":
        base = src.convert("RGB").resize((STORY_W, STORY_H), Image.LANCZOS)
        base = base.filter(ImageFilter.GaussianBlur(radius=40))
        base = ImageEnhance.Brightness(base).enhance(0.85)
        base.paste(square, (0, top_offset))
        return base
    bg = Image.new("RGB", (STORY_W, STORY_H), accent)
    bg.paste(square, (0, top_offset))
    return bg


def collect_image_stats(img: Image.Image) -> dict:
    """Cheap heuristics for the model recommender — color stdev (texture
    richness) and edge-ish energy in the outer ring."""
    rgb = img.convert("RGB").resize((256, 256))
    from PIL import ImageStat
    stat = ImageStat.Stat(rgb)
    return {
        "stdev_mean": sum(stat.stddev) / 3,
        "brightness_mean": sum(stat.mean) / 3,
        "size": img.size,
    }
