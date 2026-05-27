#!/usr/bin/env python3
"""Build the final approved-only zip from operator paste-back.

Operator clicks Keep/Drop in the review artifact, then hits "Copy approval
string" — clipboard now has e.g.:

    approve v1, v3, v5, v7

They paste that into chat. Claude parses ids (plus optional ratio filter)
and runs this script.

What's included in the zip:
  - For every approved id: <brand>_<id>_1x1.png and/or <brand>_<id>_9x16.png
    (full-resolution 2x PNG renders).
  - approved.json — manifest with ids, ratio, files, missing list, timestamp.
  - If NO PNGs were rendered (Browserless was skipped at build time), the
    populated HTML is included as `no_pngs_export.html` so the operator can
    still export from the in-template buttons. Otherwise the HTML is NOT
    included.

What's NEVER included:
  - Dropped (non-approved) variations.
  - Intermediate connector outputs (uploads/expanded/*).
  - Padded fallback JPGs.
  - The review HTML.
  - Operator's input CSV / brand.json / images / worksheet.
"""
from __future__ import annotations

import argparse
import json
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path


RATIO_TO_SUFFIX = {"square": "1x1", "story": "9x16"}


def parse_ids(raw: str) -> list[str]:
    """Accept any reasonable separator + ignore the leading 'approve' verb
    and any ratio-only suffix the operator added in chat."""
    text = raw.replace("—", " ").replace("|", " ").replace(",", " ")
    tokens = [t.strip() for t in text.split() if t.strip()]
    drop = {"approve", "approved", "story", "square", "only", "both", "ratio"}
    return [t for t in tokens if t.lower() not in drop]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--approved", required=True,
                    help="Operator paste-back, e.g. 'approve v1, v3, v5'")
    ap.add_argument("--brand", required=True,
                    help="Brand id — used as filename prefix (mileenia_v1_1x1.png)")
    ap.add_argument("--ratio", choices=["both", "square", "story"], default="both",
                    help="Which frames to include")
    ap.add_argument("--pngs-dir", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--populated-html", type=Path, default=None,
                    help="Populated HTML to include as fallback ONLY if no PNGs exist")
    args = ap.parse_args()

    ids = parse_ids(args.approved)
    if not ids:
        print(json.dumps({
            "status": "error",
            "error": "no variation ids in --approved (paste was empty after stripping verbs)",
        }))
        return 2

    frames = ["square", "story"] if args.ratio == "both" else [args.ratio]
    args.out.parent.mkdir(parents=True, exist_ok=True)

    approved_files: list[tuple[Path, str]] = []  # (source_path, export_name)
    missing: list[dict] = []                      # ids whose PNGs aren't on disk

    for vid in ids:
        for frame in frames:
            suffix = RATIO_TO_SUFFIX[frame]
            src = args.pngs_dir / f"{vid}_{suffix}.png"
            if src.exists():
                export_name = f"{args.brand}_{vid}_{suffix}.png"
                approved_files.append((src, export_name))
            else:
                missing.append({"id": vid, "ratio": frame})

    have_pngs = len(approved_files) > 0
    include_html = (not have_pngs) and args.populated_html and args.populated_html.exists()

    manifest = {
        "brand": args.brand,
        "approved_ids": ids,
        "ratio": args.ratio,
        "files": [name for _, name in approved_files],
        "missing": missing,
        "html_fallback_included": include_html,
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }

    with zipfile.ZipFile(args.out, "w", zipfile.ZIP_DEFLATED) as zf:
        for src, name in approved_files:
            zf.write(src, name)
        if include_html:
            # Renamed for clarity in the zip.
            zf.write(args.populated_html, "no_pngs_export.html")
        zf.writestr("approved.json", json.dumps(manifest, indent=2))

    # Single-line stdout summary Claude parses + surfaces.
    summary = {
        "status": "ok",
        "out": str(args.out),
        "brand": args.brand,
        "approved_ids": ids,
        "ratio": args.ratio,
        "files_exported": len(approved_files),
        "missing": missing,
        "html_fallback_included": include_html,
        "warning": (
            "no PNGs found — Browserless render must have been skipped. "
            "Zip contains the populated HTML; open it in Chrome and use "
            "the per-card Export buttons."
        ) if include_html else None,
    }
    print("[zip-summary] " + json.dumps(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
