"""Outpaint providers — 1:1 source -> 1080x1920 via AI fill, with safe
padded fallback. fal.ai Flux Fill Pro is the primary; others stubbed so the
review UI can offer them once their keys are configured.

Environment variables this module reads (set in the claude.ai code-interpreter
session before running, or in the operator's local env):

    FAL_KEY            — fal.ai API key (required for flux-fill-pro / flux-fill)
    OPENAI_API_KEY     — OpenAI key (required for gpt-image-1)
    STABILITY_API_KEY  — Stability AI key
    FIREFLY_CLIENT_ID  /  FIREFLY_CLIENT_SECRET — Adobe Firefly
    IDEOGRAM_API_KEY   — Ideogram

If a key is missing, the provider raises a `ProviderUnavailable` exception
which the orchestrator catches to fall back to the padded version.
"""
from __future__ import annotations

import base64
import io
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image

from utils import build_padded_9x16, collect_image_stats, hex_to_rgb


class ProviderUnavailable(Exception):
    pass


@dataclass
class ModelInfo:
    id: str
    label: str
    provider: str
    cost_per_image: float
    speed: str
    strengths: str
    weaknesses: str


MODELS: list[ModelInfo] = [
    ModelInfo("padded",         "Brand-color padding (safe fallback)", "local",    0.000, "instant",
              "never fails, deterministic, on-brand color",
              "bars are visible; not 'real' outpaint"),
    ModelInfo("flux-fill-pro",  "fal.ai Flux Fill Pro",                "fal",      0.050, "~8s",
              "best texture continuation, premium product shots",
              "occasionally invents small objects"),
    ModelInfo("flux-fill",      "fal.ai Flux Fill",                    "fal",      0.025, "~5s",
              "solid all-rounder, batch work",
              "loses fine detail on complex scenes"),
    ModelInfo("gpt-image-1",    "OpenAI gpt-image-1",                  "openai",   0.040, "~15s",
              "follows directional prompts, legible compositions",
              "slower, can over-imagine"),
    ModelInfo("stability",      "Stability outpaint",                  "stability",0.020, "~4s",
              "solid colors, smooth gradients",
              "bland on rich textures"),
    ModelInfo("firefly",        "Adobe Firefly Fill",                  "adobe",    0.080, "~10s",
              "commercial-safe / IP-conservative",
              "most expensive, conservative output"),
    ModelInfo("ideogram",       "Ideogram Magic Fill",                 "ideogram", 0.040, "~6s",
              "color-rich compositions, brand palettes",
              "less consistent on photography"),
]


def models_as_dicts() -> list[dict]:
    return [m.__dict__ for m in MODELS]


# ────────────────────────────────────────────────────────────────────────────
# Heuristic recommender
# ────────────────────────────────────────────────────────────────────────────

def recommend_model(src_img: Image.Image, brand: dict) -> dict:
    """Pick the model most likely to produce a good 9:16 for THIS image.
    Returns {'pick': model_id, 'reasons': [...]}."""
    stats = collect_image_stats(src_img)
    reasons: list[str] = []
    pick = "flux-fill"

    if stats["stdev_mean"] < 25:
        pick = "stability"
        reasons.append("low color variation — solid/gradient extension is enough")
    elif stats["stdev_mean"] > 60:
        pick = "flux-fill-pro"
        reasons.append("rich texture — premium model handles continuity best")
    else:
        pick = "flux-fill"
        reasons.append("moderate complexity — standard model is fine")

    if brand.get("tier") == "premium":
        pick = "flux-fill-pro"
        reasons.append("premium brand tier — bias toward best quality")

    return {"pick": pick, "reasons": reasons}


# ────────────────────────────────────────────────────────────────────────────
# Provider implementations
# ────────────────────────────────────────────────────────────────────────────

def _make_outpaint_canvas_and_mask(src: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Build the 1080x1920 canvas with the source centered, plus a mask
    where black = keep, white = inpaint. Most providers consume this shape."""
    STORY_W, STORY_H = 1080, 1920
    square = src.convert("RGB").resize((STORY_W, STORY_W), Image.LANCZOS)
    canvas = Image.new("RGB", (STORY_W, STORY_H), (128, 128, 128))
    canvas.paste(square, (0, (STORY_H - STORY_W) // 2))
    # Mask: white at top + bottom strips, black in the middle.
    mask = Image.new("L", (STORY_W, STORY_H), 255)
    middle = Image.new("L", (STORY_W, STORY_W), 0)
    mask.paste(middle, (0, (STORY_H - STORY_W) // 2))
    return canvas, mask


def _png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _provider_padded(src: Image.Image, dst: Path, brand: dict, prompt: str) -> dict:
    accent = brand.get("accent", "#111111")
    style = brand.get("paddingStyle", "solid")
    out = build_padded_9x16(src, hex_to_rgb(accent), style=style)
    out.save(dst, format="JPEG", quality=90)
    return {"out_path": str(dst), "model": "padded", "stub": True, "cost": 0.0,
            "note": "padded fallback"}


def _provider_fal(src: Image.Image, dst: Path, brand: dict, prompt: str, model_id: str) -> dict:
    """fal.ai Flux Fill. Real call; raises ProviderUnavailable if no key."""
    key = os.environ.get("FAL_KEY")
    if not key:
        raise ProviderUnavailable("FAL_KEY not set")
    try:
        import requests
    except ImportError:
        raise ProviderUnavailable("`requests` not installed")

    canvas, mask = _make_outpaint_canvas_and_mask(src)
    canvas_b64 = base64.b64encode(_png_bytes(canvas)).decode("ascii")
    mask_b64 = base64.b64encode(_png_bytes(mask)).decode("ascii")
    endpoint_path = "fal-ai/flux-pro/v1/fill" if model_id == "flux-fill-pro" else "fal-ai/flux/dev/inpainting"
    url = f"https://fal.run/{endpoint_path}"
    payload = {
        "image_url": f"data:image/png;base64,{canvas_b64}",
        "mask_url":  f"data:image/png;base64,{mask_b64}",
        "prompt": prompt or "continue the background naturally, same lighting, same surface, no people, no text, no logos",
        "num_inference_steps": 28,
        "guidance_scale": 30.0 if model_id == "flux-fill-pro" else 3.5,
    }
    headers = {"Authorization": f"Key {key}", "Content-Type": "application/json"}
    r = requests.post(url, json=payload, headers=headers, timeout=120)
    if r.status_code >= 400:
        raise ProviderUnavailable(f"fal.ai {model_id} returned {r.status_code}: {r.text[:200]}")
    body = r.json()
    image_url = (body.get("images") or [{}])[0].get("url") or body.get("image", {}).get("url")
    if not image_url:
        raise ProviderUnavailable(f"fal.ai response missing image url: {body}")
    img_bytes = requests.get(image_url, timeout=60).content
    Image.open(io.BytesIO(img_bytes)).convert("RGB").save(dst, format="JPEG", quality=92)
    return {"out_path": str(dst), "model": model_id, "stub": False,
            "cost": next(m.cost_per_image for m in MODELS if m.id == model_id)}


def _provider_openai(src: Image.Image, dst: Path, brand: dict, prompt: str) -> dict:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise ProviderUnavailable("OPENAI_API_KEY not set")
    try:
        from openai import OpenAI
    except ImportError:
        raise ProviderUnavailable("`openai` SDK not installed")
    client = OpenAI(api_key=key)
    canvas, mask = _make_outpaint_canvas_and_mask(src)
    canvas_buf = io.BytesIO(); canvas.save(canvas_buf, format="PNG"); canvas_buf.seek(0)
    mask_buf = io.BytesIO(); mask.save(mask_buf, format="PNG"); mask_buf.seek(0)
    res = client.images.edit(
        model="gpt-image-1",
        image=canvas_buf,
        mask=mask_buf,
        prompt=prompt or "extend the background of this product photo naturally, no text, no people, same lighting",
        size="1024x1024",  # gpt-image-1 size will be resized to 1080x1920 below
        n=1,
    )
    img_b64 = res.data[0].b64_json
    out = Image.open(io.BytesIO(base64.b64decode(img_b64))).convert("RGB").resize((1080, 1920), Image.LANCZOS)
    out.save(dst, format="JPEG", quality=92)
    return {"out_path": str(dst), "model": "gpt-image-1", "stub": False, "cost": 0.04}


# ────────────────────────────────────────────────────────────────────────────
# Public API
# ────────────────────────────────────────────────────────────────────────────

def outpaint(src_path: Path, dst_path: Path, model_id: str = "flux-fill-pro",
             brand: Optional[dict] = None, prompt: str = "") -> dict:
    """Expand src 1:1 -> 1080x1920 9:16 using the chosen provider. Always
    writes a result to dst_path; falls back to padded if the provider fails."""
    brand = brand or {}
    src = Image.open(src_path)
    src.load()

    try:
        if model_id == "padded":
            return _provider_padded(src, dst_path, brand, prompt)
        if model_id in ("flux-fill-pro", "flux-fill"):
            return _provider_fal(src, dst_path, brand, prompt, model_id)
        if model_id == "gpt-image-1":
            return _provider_openai(src, dst_path, brand, prompt)
        # Other providers not yet wired; fall back.
        raise ProviderUnavailable(f"{model_id} not implemented yet")
    except ProviderUnavailable as e:
        result = _provider_padded(src, dst_path, brand, prompt)
        result["note"] = f"{model_id} unavailable ({e}); used padded fallback"
        result["model_requested"] = model_id
        return result


def write_padded_alongside(src_path: Path, out_dir: Path, vid: str, brand: dict) -> Path:
    """Always write a `_padded.jpg` next to whatever outpaint produced, so
    the review UI can offer the safe option in one click."""
    out = out_dir / f"{vid}_9x16_padded.jpg"
    src = Image.open(src_path); src.load()
    accent = brand.get("accent", "#111111")
    style = brand.get("paddingStyle", "solid")
    img = build_padded_9x16(src, hex_to_rgb(accent), style=style)
    img.save(out, format="JPEG", quality=90)
    return out
