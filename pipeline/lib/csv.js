// Reads copy.csv into an array of variations for the chosen archetype.
// CSV header determines the field set. For AMA we expect: id, c1, c2, c3,
// and optional image_note. Extra columns are passed through verbatim so
// future archetypes can extend the schema without changing this loader.

import { readFileSync } from 'node:fs';
import Papa from 'papaparse';

const ARCHETYPE_REQUIRED = {
  ama:   ['id', 'c1', 'c2', 'c3'],
  forum: ['id', 'community', 'handle', 'title', 'body'],
  // Social Proof master is layout-driven; required fields per layout live
  // in the adapter, not here.
};

export function readCopyCsv(csvPath, archetype) {
  const raw = readFileSync(csvPath, 'utf8');
  const { data, errors, meta } = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (errors.length) {
    const first = errors[0];
    throw new Error(`CSV parse error on row ${first.row}: ${first.message}`);
  }

  const required = ARCHETYPE_REQUIRED[archetype];
  if (required) {
    for (const col of required) {
      if (!meta.fields.includes(col)) {
        throw new Error(
          `copy.csv is missing required column "${col}" for archetype "${archetype}". ` +
          `Found columns: ${meta.fields.join(', ')}`
        );
      }
    }
  }

  // Trim whitespace on every cell + drop rows with empty id.
  const rows = data
    .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? '').trim()])))
    .filter((r) => r.id);

  // Deduplicate ids — a duplicate id would silently overwrite an earlier image.
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.id)) {
      throw new Error(`Duplicate variation id in copy.csv: "${r.id}"`);
    }
    seen.add(r.id);
  }

  return rows;
}
