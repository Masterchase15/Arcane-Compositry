/**
 * scripts/check-spells.js - checks every data file for mistakes.
 *
 *   npm run check-data        (npm run check-spells does the same thing)
 *
 * Run this after editing data/spells/*.js, data/items.js or data/classes.js by
 * hand. It reports typos such as a misspelled class or school, a missing
 * description, or two entries sharing an id.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateEntry, LISTS, listFile } from '../server/catalog.js';

let problems = 0;
// Classes first: spells are checked against the class names.
for (const list of ['classes', ...LISTS.filter((l) => l !== 'classes')]) {
  const file = listFile(list);
  const label = path.basename(file);
  let entries;
  try {
    entries = (await import(pathToFileURL(file).href)).default;
  } catch (err) {
    console.log(`\n${label} could not be read: ${err.message}`);
    problems++;
    continue;
  }
  const seen = new Set();
  for (const raw of entries) {
    const { entry, errors } = await validateEntry(list, raw);
    if (seen.has(entry.id)) errors.push(`duplicate id "${entry.id}"`);
    seen.add(entry.id);
    if (errors.length) {
      problems++;
      console.log(`\n${label} - "${raw?.name || raw?.id || '(unnamed)'}":`);
      for (const e of errors) console.log(`   - ${e}`);
    }
  }
  console.log(`${label}: ${entries.length} entries checked.`);
}
console.log(problems ? `\n${problems} entr${problems === 1 ? 'y needs' : 'ies need'} fixing.` : '\nEverything looks good.');
process.exit(problems ? 1 : 0);
