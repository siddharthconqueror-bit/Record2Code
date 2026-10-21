const fs = require('fs');
const path = require('path');

const codes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8'));
const codeMap = new Map(codes.map(c => [c.code, c]));

function getCandidates(correctCodes) {
  const result = new Set(correctCodes);
  
  for (const c of correctCodes) {
    const prefix = c.split('.')[0];
    // Find siblings
    const siblings = codes.filter(item => item.code.startsWith(prefix) && !correctCodes.includes(item.code));
    // Pick 2-3 siblings or parent
    const shuffledSiblings = siblings.sort(() => 0.5 - Math.random());
    for (const sib of shuffledSiblings.slice(0, 3)) {
      if (result.size < 5) result.add(sib.code);
    }
  }

  // Add 1-2 unrelated from other chapters
  const randomCodes = ['I10', 'E11.9', 'J45.9', 'N39.0', 'K29.7', 'R50.9', 'B54', 'S72.9', 'D50.9', 'A09.9'];
  const shuffledRandom = randomCodes.sort(() => 0.5 - Math.random());
  for (const r of shuffledRandom) {
    if (result.size >= 5 && Math.random() > 0.5) break;
    if (result.size < 6 && !result.has(r)) {
      result.add(r);
    }
    if (result.size >= 6) break;
  }

  return Array.from(result).sort(() => 0.5 - Math.random());
}

console.log('Sample for K29.1:', getCandidates(['K29.1']));
console.log('Sample for E11.2, N08.3:', getCandidates(['E11.2', 'N08.3']));
console.log('Sample for J44.0, J22:', getCandidates(['J44.0', 'J22']));
