#!/usr/bin/env python3
"""Build the final approved-only zip from operator paste-back.

Operator clicks Keep/Drop in the review artifact, then hits
"Copy approval string". Clipboard:

    approve v1, v3, v5

They paste that into chat. Claude parses ids (+ optional ratio filter) and
runs this script.

Zip layout (one folder per approved variation, two PNGs inside, NOTHING ELSE):

    <brand>-approved.zip
    ├─ v1/
    │   ├─ v1_1x1.png
    │   └─ v1_9x16.png
    ├─ v3/
    │   ├─ v3_1x1.png
    │   └─ v3_9x16.png
    └─ v5/
        ├─ v5_1x1.png
        └─ v5_9x16.png

No manifest. No populated-HTML fallback. No metadata files. Just the ads.

If --ratio is `square` only the 1x1 PNG appears in each folder.
If --ratio is `story` only the 9x16.

If NO PNGs exist (Browserless wasn't set at build time), this script
**refuses to write a zip** and returns exit 3 with a clear summary. The
operator (via Claude) should set BROWSERLESS_TOKEN and re-run the build.
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
    """Accept any reasonable separator and ignore the leading 'approve'
    verb plus any ratio-only suffix the operator added in chat."""
    text = raw.replace("—", " ").replace("|", " ").replace(",", " ")
    tokens = [t.strip() for t in text.split() if t.strip()]
    drop = {"approve", "approved", "story", "square", "only", "both", "ratio"}
    return [t for t in tokens if t.lower() not in drop]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--approved", required=True,
                    help="Operator paste-back, e.g. 'approve v1, v3, v5'")
    ap.add_argument("--brand", required=True,
                    help="Brand id — used in the zip filename only")
    ap.add_argument("--ratio", choices=["both", "square", "story"], default="both",
                    help="Which frames to include in each variation folder")
    ap.add_argument("--pngs-dir", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    ids = parse_ids(args.approved)
    if not ids:
        print("[zip-summary] " + json.dumps({
            "status": "error",
            "error": "no variation ids in --approved (paste was empty after stripping verbs)",
        }))
        return 2

    frames = ["square", "story"] if args.ratio == "both" else [args.ratio]

    # Plan: per variation, collect the PNG sources that exist.
    # variation_files: dict[vid -> list of (src_path, file_name_in_zip)]
    variation_files: dict[str, list[tuple[Path, str]]] = {}
    missing: list[dict] = []

    for vid in ids:
        files_for_v: list[tuple[Path, str]] = []
        for frame in frames:
            suffix = RATIO_TO_SUFFIX[frame]
            src = args.pngs_dir / f"{vid}_{suffix}.png"
            if src.exists():
                files_for_v.append((src, f"{vid}_{suffix}.png"))
            else:
                missing.append({"id": vid, "ratio": frame})
        if files_for_v:
            variation_files[vid] = files_for_v

    total_files = sum(len(v) for v in variation_files.values())

    # If no PNGs at all, refuse the export.
    if total_files == 0:
        print("[zip-summary] " + json.dumps({
            "status": "no_pngs",
            "error": (
                "no PNG files for any approved id. Browserless render was likely "
                "skipped at build time. Set BROWSERLESS_TOKEN in this session and "
                "re-run build.py, then approve again."
            ),
            "approved_ids": ids,
            "ratio": args.ratio,
            "missing": missing,
            "pngs_dir": str(args.pngs_dir),
        }))
        return 3

    # Write the zip — per-variation folders, only PNGs.
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.out, "w", zipfile.ZIP_DEFLATED) as zf:
        for vid, files in variation_files.items():
            for src, fname in files:
                # Each PNG goes under <vid>/<vid>_<suffix>.png
                zf.write(src, f"{vid}/{fname}")

    summary = {
        "status": "ok",
        "out": str(args.out),
        "brand": args.brand,
        "approved_ids": ids,
        "ratio": args.ratio,
        "variations_exported": list(variation_files.keys()),
        "files_exported": total_files,
        "missing": missing,
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }
    print("[zip-summary] " + json.dumps(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
