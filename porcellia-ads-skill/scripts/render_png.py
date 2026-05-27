"""Browserless integration: render the populated AMA HTML in a remote
headless Chromium and pull back every variation's 1:1 + 9:16 PNGs.

Why Browserless? claude.ai's Python sandbox has no browser binaries, so
the html-to-image step that the template uses can't run locally. Browserless
runs a real Chromium in their cloud and accepts a `function` payload that
runs in the page context. We post our populated HTML + a tiny script that
calls window.__exportAll() (added in assets/ama.html), and Browserless
returns the resulting array of {id, frame, dataURL}.

Environment:
    BROWSERLESS_TOKEN   — required
    BROWSERLESS_URL     — optional, defaults to https://chrome.browserless.io

If BROWSERLESS_TOKEN is not set, render_all() raises BrowserlessUnavailable
and the orchestrator falls back to handing the operator the populated HTML
to render in their local browser.
"""
from __future__ import annotations

import base64
import json
import os
from pathlib import Path


class BrowserlessUnavailable(Exception):
    pass


# This is the function Browserless executes inside the loaded page.
# It waits for the template's readiness signal, then calls __exportAll().
RENDER_FN = r"""
module.exports = async ({ page, context }) => {
  await page.setContent(context.html, { waitUntil: 'networkidle0', timeout: 60000 });
  // Wait for canvases to mount + images to decode.
  await page.waitForFunction(() => window.__porcelliaReady && window.__porcelliaReady(), { timeout: 60000 });
  // Give react one more tick after seed-images populate.
  await new Promise(r => setTimeout(r, 500));
  const out = await page.evaluate(async (pr) => {
    return await window.__exportAll({ pixelRatio: pr });
  }, context.pixelRatio || 2);
  return { data: out, type: 'application/json' };
};
"""


def render_all(html: str, output_dir: Path, pixel_ratio: int = 2) -> list[dict]:
    """Render the populated HTML in Browserless. Returns a list of
    {id, frame, path} dicts and writes the PNGs to output_dir."""
    token = os.environ.get("BROWSERLESS_TOKEN")
    if not token:
        raise BrowserlessUnavailable("BROWSERLESS_TOKEN not set")
    try:
        import requests
    except ImportError:
        raise BrowserlessUnavailable("`requests` not installed")

    base_url = os.environ.get("BROWSERLESS_URL", "https://chrome.browserless.io")
    url = f"{base_url}/function?token={token}"
    payload = {
        "code": RENDER_FN,
        "context": {"html": html, "pixelRatio": pixel_ratio},
    }
    r = requests.post(url, json=payload, timeout=240,
                      headers={"Content-Type": "application/json"})
    if r.status_code >= 400:
        raise BrowserlessUnavailable(f"Browserless returned {r.status_code}: {r.text[:300]}")
    body = r.json()
    # Browserless wraps as {data: <return value>} when responseType is json.
    results = body.get("data") if isinstance(body, dict) and "data" in body else body

    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[dict] = []
    for entry in results:
        vid = entry["id"]
        frame = entry["frame"]
        data_url = entry["dataURL"]
        b64 = data_url.split(",", 1)[1] if "," in data_url else data_url
        png_bytes = base64.b64decode(b64)
        suffix = "1x1" if frame == "square" else "9x16"
        path = output_dir / f"{vid}_{suffix}.png"
        path.write_bytes(png_bytes)
        written.append({"id": vid, "frame": frame, "path": str(path)})
    return written
