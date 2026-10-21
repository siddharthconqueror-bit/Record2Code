const fs = require('fs');
const readline = require('readline');

async function checkMetaUsage() {
  const rl = readline.createInterface({ input: fs.createReadStream('data/icd102019en.xml') });
  let inModBy = false;
  let currentModCode = '';
  const optionalMods = new Set();
  const allMods = new Set();
  const modOccurrences = new Map(); // modCode -> { total: number, optionalCount: number }

  for await (const line of rl) {
    if (line.includes('<ModifiedBy')) {
      inModBy = true;
      const m = line.match(/code="([^"]+)"/);
      if (m) {
        currentModCode = m[1];
        allMods.add(currentModCode);
        if (!modOccurrences.has(currentModCode)) {
          modOccurrences.set(currentModCode, { total: 0, optionalCount: 0 });
        }
        modOccurrences.get(currentModCode).total++;
      }
    }
    if (inModBy) {
      if (line.includes('value="optional"')) {
        optionalMods.add(currentModCode);
        if (currentModCode && modOccurrences.has(currentModCode)) {
          modOccurrences.get(currentModCode).optionalCount++;
        }
      }
      if (line.includes('</ModifiedBy>') || line.endsWith('/>')) {
        inModBy = false;
        currentModCode = '';
      }
    }
  }

  console.log('All modifiers count in ModifiedBy:', allMods.size);
  console.log('Modifiers with optional usage count:', optionalMods.size);
  for (const [mod, stats] of modOccurrences) {
    console.log(`  ${mod.padEnd(12)}: total=${stats.total}, optional=${stats.optionalCount}`);
  }
}
checkMetaUsage();
