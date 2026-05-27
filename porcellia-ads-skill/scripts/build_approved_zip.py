#!/usr/bin/env python3
"""Build the final approved-only zip after the operator reviews.

The operator clicks Keep/Drop in the review artifact, then hits
"Copy approval string" which puts something like:

    approve v1, v3, v5, v7

on their clipboard. They paste that into chat. Claude parses the ids and
runs this script to produce the final zip of full-resolution PNGs.

Usage::

    python build_approved_zip.py \\
        --approved   "v1,v3,v5,v7" \\
        --pngs-dir   /mnt/user-data/outputs/pngs \\
        --out        /mnt/user-data/outputs/<brand>-approved.zip \\
        [--summary-json /mnt/user-data/outputs/approval-summary.json]

If --pngs-dir contains no PNGs (Browserless was skipped), the script
falls back to packaging the populated HTML and tells the operator to
export from there.
"""
from __future__ import annotations

import argparse
import json
import sys
import zipfile
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--approved", required=True,
                    help="Comma- or space-separated variation ids (e.g. 'v1,v3,v5')")
    ap.add_argument("--pngs-dir", required=True, type=Path)
    ap.add_argument("--out",       required=True, type=Path)
    ap.add_argument("--populated-html", type=Path, default=None,
                    help="Optional populated HTML to include if no PNGs exist")
    ap.add_argument("--summary-json", type=Path, default=None)
    args = ap.parse_args()

    # Normalize the approved list
    ids = [s.strip() for s in args.approved.replace(",", " ").split() if s.strip()]
    ids = [s for s in ids if s.lower() != "approve"]  # drop the "approve" verb if pasted
    if not ids:
        print("[zip] No ids in --approved", file=sys.stderr)
        return 2

    args.out.parent.mkdir(parents=True, exist_ok=True)
    pngs = sorted(args.pngs_dir.glob("*.png")) if args.pngs_dir.exists() else []
    approved_files: list[Path] = []
    missing: list[str] = []

    for vid in ids:
        sq = args.pngs_dir / f"{vid}_1x1.png"
        st = args.pngs_dir / f"{vid}_9x16.png"
        any_found = False
        if sq.exists():
            approved_files.append(sq); any_found = True
        if st.exists():
            approved_files.append(st); any_found = True
        if not any_found:
            missing.append(vid)

    with zipfile.ZipFile(args.out, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in approved_files:
            zf.write(p, p.name)
        if not approved_files and args.populated_html and args.populated_html.exists():
            # No PNGs available — include the populated HTML so operator can
            # still export from the in-template buttons.
            zf.write(args.populated_html, args.populated_html.name)
        zf.writestr("approved.json", json.dumps({
            "approved_ids": ids,
            "files": [p.name for p in approved_files],
            "missing": missing,
        }, indent=2))

    summary = {
        "out": str(args.out),
        "approved_ids": ids,
        "files": [p.name for p in approved_files],
        "missing": missing,
    }
    if args.summary_json:
        args.summary_json.write_text(json.dumps(summary, indent=2))
    print("[zip] " + json.dumps(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
