// Reads and rewrites the EDITMODE JSON block embedded in a template HTML.
//
// Templates contain a block like:
//
//   const TWEAKS = /*EDITMODE-BEGIN*/{ ... JSON ... }/*EDITMODE-END*/;
//
// This module replaces the active brand's variations with the operator's
// rows, then writes a job-scoped copy of the template HTML next to the
// rendered output. The original template is never modified.

import { readFileSync, writeFileSync } from 'node:fs';

const BEGIN = '/*EDITMODE-BEGIN*/';
const END = '/*EDITMODE-END*/';

export function readEditmode(templatePath) {
  const html = readFileSync(templatePath, 'utf8');
  const start = html.indexOf(BEGIN);
  const end = html.indexOf(END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`EDITMODE block not found in ${templatePath}`);
  }
  const jsonStart = start + BEGIN.length;
  const jsonText = html.slice(jsonStart, end);
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`EDITMODE block in ${templatePath} is not valid JSON: ${e.message}`);
  }
  return { html, jsonStart, jsonEnd: end, data: parsed };
}

// Build a job-scoped template HTML where the EDITMODE block contains ONLY
// the active brand, and that brand's variations are replaced with `rows`.
// Other brands are kept (so the template still functions if opened in the
// browser later), but the active brand is the one we render.
export function writeJobTemplate({
  templatePath,
  outHtmlPath,
  brandId,
  brandOverrides, // optional brand.json merge
  rows,           // array of variation objects from copy.csv
  archetype,
}) {
  const { html, jsonStart, jsonEnd, data } = readEditmode(templatePath);
  const brands = Array.isArray(data.brands) ? [...data.brands] : [];
  const idx = brands.findIndex((b) => b.id === brandId);

  const seededBrand = idx >= 0 ? brands[idx] : null;
  if (!seededBrand && !brandOverrides) {
    throw new Error(
      `Brand "${brandId}" not seeded in template and no brand.json provided. ` +
      `Seeded brands: ${brands.map((b) => b.id).join(', ')}`
    );
  }

  const baseBrand = seededBrand
    ? { ...seededBrand }
    : { id: brandId, name: brandId, font: 'system', variations: [] };

  // Merge brand.json overrides in (font, accent, name, paddingStyle, tier).
  if (brandOverrides) {
    Object.assign(baseBrand, brandOverrides);
  }

  // Replace variations with the CSV rows, shaped for the archetype.
  baseBrand.variations = rows.map((r) => buildVariation(r, archetype));

  if (idx >= 0) brands[idx] = baseBrand;
  else brands.unshift(baseBrand);

  const newData = {
    ...data,
    activeBrandId: brandId,
    brands,
  };

  const newJson = JSON.stringify(newData, null, 2);
  const newHtml = html.slice(0, jsonStart) + newJson + html.slice(jsonEnd);
  writeFileSync(outHtmlPath, newHtml, 'utf8');
  return { outHtmlPath, brand: baseBrand };
}

function buildVariation(row, archetype) {
  if (archetype === 'ama') {
    return {
      id: row.id,
      c1: row.c1 || '',
      c2: row.c2 || '',
      c3: row.c3 || '',
      // pos and imgT left absent so the template applies defaults; operator
      // can still drag in-browser if they open the job-scoped HTML.
    };
  }
  if (archetype === 'forum') {
    return {
      id: row.id,
      community: row.community || '',
      handle: row.handle || '',
      title: row.title || '',
      body: row.body || '',
      upvotes: row.upvotes || '',
      comments: row.comments || '',
    };
  }
  // Generic passthrough for future archetypes.
  return { ...row };
}
