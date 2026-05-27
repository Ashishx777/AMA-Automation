#!/usr/bin/env python3
"""Self-update: pull the latest scripts/templates from GitHub.

Designed to run at the start of every chat (claude.ai) or before every
local CLI invocation. It's cheap when there's no update (one HEAD request
for the latest commit SHA) and only downloads when something actually changed.

Behavior:
  1. Reads the current commit SHA from <target>/.version (if it exists).
  2. Fetches the latest SHA on the configured branch from GitHub's API.
  3. If they match, prints "already on latest" and exits 0.
  4. If they differ, downloads the repo tarball at the latest SHA, extracts
     it, copies the contents over <target>, writes the new SHA to .version.

Usage::

    python self_update.py [--target /tmp/porcellia-ads-skill] [--check-only]
                          [--repo Ashishx777/AMA-Automation] [--branch main]

In a claude.ai chat, the standard invocation is:

    python self_update.py --target /mnt/user-data/scripts/porcellia-ads-skill

Then Claude uses that target dir for all subsequent build.py / review.py
calls in the chat. Old project-bundled scripts get superseded.

Failure modes:
  - No network → prints a warning, exits 0 (don't block the run).
  - Rate-limited (GitHub API) → exits 0, warning to console.
  - Partial download → cleans up, exits 1 (next run retries).
"""
from __future__ import annotations

import argparse
import io
import json
import shutil
import sys
import tarfile
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_REPO = "Ashishx777/AMA-Automation"
DEFAULT_BRANCH = "main"
DEFAULT_TARGET = Path("/mnt/user-data/scripts/porcellia-ads-skill")
TIMEOUT = 20


def _http_get(url: str, accept: str = "application/json") -> bytes:
    req = urllib.request.Request(url, headers={
        "Accept": accept,
        "User-Agent": "porcellia-ads-self-updater",
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read()


def get_latest_sha(repo: str, branch: str) -> str:
    url = f"https://api.github.com/repos/{repo}/branches/{branch}"
    body = json.loads(_http_get(url))
    return body["commit"]["sha"]


def fetch_tarball(repo: str, sha: str) -> bytes:
    # codeload.github.com serves the tarball directly without the api.github.com
    # Accept-header dance and works on public repos with no auth.
    url = f"https://codeload.github.com/{repo}/tar.gz/{sha}"
    req = urllib.request.Request(url, headers={"User-Agent": "porcellia-ads-self-updater"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read()


def extract_subfolder_into(tarball_bytes: bytes, subfolder: str, target: Path) -> None:
    """Extract <repo-root>/<subfolder>/... from the tarball into <target>/.

    GitHub tarballs wrap everything in a top-level folder like
    `Ashishx777-AMA-Automation-<short-sha>`. We strip that prefix and copy
    everything under `subfolder` (or the whole repo if subfolder is empty)
    into `target`.
    """
    target.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(tarball_bytes), mode="r:gz") as tar:
        members = tar.getmembers()
        if not members:
            raise RuntimeError("Empty tarball")
        root_prefix = members[0].name.split("/", 1)[0] + "/"
        for m in members:
            if not m.name.startswith(root_prefix):
                continue
            rel = m.name[len(root_prefix):]
            if subfolder:
                # Skip the subfolder directory entry itself; we're extracting
                # its contents into `target` directly.
                if rel == subfolder or rel == subfolder + "/":
                    continue
                if not rel.startswith(subfolder + "/"):
                    continue
                rel = rel[len(subfolder) + 1:]
            if not rel or rel.endswith("/"):
                # Skip empty or directory-only entries; mkdir happens lazily.
                if not rel:
                    continue
            dest = target / rel
            if m.isdir():
                dest.mkdir(parents=True, exist_ok=True)
            elif m.isreg():
                dest.parent.mkdir(parents=True, exist_ok=True)
                f = tar.extractfile(m)
                if f is None:
                    continue
                with open(dest, "wb") as out:
                    shutil.copyfileobj(f, out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", type=Path, default=DEFAULT_TARGET,
                    help="Where to install the latest skill files")
    ap.add_argument("--repo", default=DEFAULT_REPO)
    ap.add_argument("--branch", default=DEFAULT_BRANCH)
    ap.add_argument("--subfolder", default="porcellia-ads-skill",
                    help="Repo subfolder to extract; empty for whole repo")
    ap.add_argument("--check-only", action="store_true",
                    help="Just print the comparison, don't download")
    ap.add_argument("--force", action="store_true",
                    help="Re-download even if the SHA matches")
    args = ap.parse_args()

    version_file = args.target / ".version"
    current_sha = version_file.read_text().strip() if version_file.exists() else None

    try:
        latest_sha = get_latest_sha(args.repo, args.branch)
    except urllib.error.URLError as e:
        print(f"[update] network unavailable ({e}); continuing with current "
              f"version {current_sha[:7] if current_sha else 'unknown'}", file=sys.stderr)
        return 0
    except Exception as e:
        print(f"[update] could not fetch latest SHA: {e}; continuing", file=sys.stderr)
        return 0

    short_curr = current_sha[:7] if current_sha else "none"
    short_new = latest_sha[:7]
    same = current_sha == latest_sha and not args.force

    if args.check_only:
        status = "up-to-date" if same else "update-available"
        print(json.dumps({
            "status": status,
            "current": current_sha,
            "latest": latest_sha,
            "target": str(args.target),
            "repo": args.repo,
            "branch": args.branch,
        }))
        return 0

    if same:
        print(f"[update] already on latest ({short_new}) at {args.target}")
        return 0

    print(f"[update] {short_curr} -> {short_new}  (downloading...)")
    try:
        tar_bytes = fetch_tarball(args.repo, latest_sha)
    except Exception as e:
        print(f"[update] download failed: {e}", file=sys.stderr)
        return 1

    try:
        extract_subfolder_into(tar_bytes, args.subfolder, args.target)
    except Exception as e:
        print(f"[update] extraction failed: {e}", file=sys.stderr)
        return 1

    version_file.write_text(latest_sha)
    print(f"[update] updated {args.target} to {short_new}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
