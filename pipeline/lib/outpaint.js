// Outpaint interface. V1 is a STUB: every "outpaint" call falls back to the
// brand-color padded 9:16 image (see lib/image-utils.js). Real providers
// (fal.ai Flux Fill, OpenAI gpt-image-1, Stability, Firefly, Ideogram) plug
// in by implementing the same shape and registering in PROVIDERS.

import { buildPaddedFallback } from './image-utils.js';

export const MODELS = [
  {
    id: 'padded',
    label: 'Brand-color padding (safe fallback)',
    cost: 0,
    speed: 'instant',
    strengths: 'never fails, deterministic, on-brand color',
    weaknesses: 'bars are visible; not "real" outpaint',
    provider: 'local',
  },
  // Real providers — disabled in v1, enable by setting `enabled: true` and
  // implementing the call in PROVIDERS below.
  { id: 'flux-fill-pro', label: 'fal.ai Flux Fill Pro', cost: 0.05, speed: '~8s',
    strengths: 'best texture continuation, premium product shots',
    weaknesses: 'occasionally invents small objects',
    provider: 'fal', enabled: false },
  { id: 'flux-fill', label: 'fal.ai Flux Fill', cost: 0.025, speed: '~5s',
    strengths: 'solid all-rounder, batch work',
    weaknesses: 'loses fine detail on complex scenes',
    provider: 'fal', enabled: false },
  { id: 'gpt-image-1', label: 'OpenAI gpt-image-1', cost: 0.04, speed: '~15s',
    strengths: 'follows directional prompts, legible compositions',
    weaknesses: 'slower, can over-imagine',
    provider: 'openai', enabled: false },
  { id: 'stability', label: 'Stability outpaint', cost: 0.02, speed: '~4s',
    strengths: 'solid colors, smooth gradients',
    weaknesses: 'bland on rich textures',
    provider: 'stability', enabled: false },
  { id: 'firefly', label: 'Adobe Firefly Fill', cost: 0.08, speed: '~10s',
    strengths: 'commercial-safe / IP-conservative',
    weaknesses: 'most expensive, conservative output',
    provider: 'adobe', enabled: false },
  { id: 'ideogram', label: 'Ideogram Magic Fill', cost: 0.04, speed: '~6s',
    strengths: 'color-rich compositions, brand palettes',
    weaknesses: 'less consistent on photography',
    provider: 'ideogram', enabled: false },
];

// outpaint({ srcPath, outPath, modelId, accent, paddingStyle, prompt })
// -> { outPath, model, cost, fallbackPath, stub: boolean }
export async function outpaint({ srcPath, outPath, modelId = 'padded', accent, paddingStyle, prompt }) {
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];

  // Always produce a padded fallback alongside whatever the model returns,
  // so the review UI can offer the safe option in one click.
  const fallbackPath = outPath.replace(/\.(jpe?g|png)$/i, '_padded.jpg');
  await buildPaddedFallback(srcPath, fallbackPath, { accent, style: paddingStyle });

  if (model.provider === 'local' || model.enabled === false) {
    // V1 stub path: real "expansion" is just the padded fallback.
    await buildPaddedFallback(srcPath, outPath, { accent, style: paddingStyle });
    return {
      outPath,
      model: model.id,
      cost: 0,
      fallbackPath,
      stub: true,
      note: 'outpaint stubbed — using padded fallback; wire a provider in lib/outpaint.js to enable real expansion',
    };
  }

  // Future: dispatch to provider.
  // const result = await PROVIDERS[model.provider]({ srcPath, outPath, prompt });
  // return { outPath: result.outPath, model: model.id, cost: model.cost, fallbackPath, stub: false };

  throw new Error(`Provider "${model.provider}" not implemented yet`);
}

// Lightweight heuristic recommender. Reads simple image stats (color count,
// edge-ish energy via sharp's stats) and ranks models. In v1 only `padded`
// is enabled, but the ranking is still useful in the review UI to show what
// WOULD be recommended.
export function recommendModel(imageStats, brand = {}) {
  const reasons = [];
  let pick = 'flux-fill-pro';

  const channelDev = imageStats?.channels?.[0]?.stdev ?? 0;
  if (channelDev < 25) {
    pick = 'stability';
    reasons.push('low color variation → solid/gradient extension is enough');
  } else if (channelDev > 60) {
    pick = 'flux-fill-pro';
    reasons.push('rich texture → premium model handles continuity best');
  } else {
    pick = 'flux-fill';
    reasons.push('moderate complexity → standard model is fine');
  }

  if (brand.tier === 'premium') {
    pick = 'flux-fill-pro';
    reasons.push('premium brand tier → bias toward best quality');
  }

  return { pick, reasons };
}
