const fs = require('fs');
const readline = require('readline');

async function testOptionalTracking() {
  const fileStream = fs.createReadStream('data/icd102019en.xml', { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const optionalModifiers = new Set();
  let inModifiedBy = false;
  let currentModCode = '';

  for await (const line of rl) {
    const mbStart = line.match(/<ModifiedBy\b([^>]*)>/);
    if (mbStart) {
      inModifiedBy = true;
      const codeM = mbStart[1].match(/code="([^"]+)"/);
      if (codeM) currentModCode = codeM[1];
    }
    if (inModifiedBy) {
      if (line.includes('value="optional"')) {
        if (currentModCode) optionalModifiers.add(currentModCode);
      }
      if (line.includes('</ModifiedBy>') || line.endsWith('/>')) {
        inModifiedBy = false;
        currentModCode = '';
      }
    }
  }

  // Also check modifiers whose own Rubric text mentions "optional"
  // e.g. S01B18_5 ("provided for optional use in a supplementary character position")
  // J96_5 ("provided for optional use with subcategories")
  console.log('Optional modifiers identified from XML metadata:', Array.from(optionalModifiers));
}
testOptionalTracking();
