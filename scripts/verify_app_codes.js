const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('data/icd10.json', 'utf8'));
const codeMap = new Map(data.map(c => [c.code, c]));

console.log('Total codes in icd10.json:', codeMap.size);

// Scan files
const filesToScan = [
  'app/page.tsx',
  'app/workspace/page.tsx',
  'app/trainee/page.tsx',
  'app/export/page.tsx',
  'app/about/page.tsx',
  'app/support/page.tsx',
  'components/Navbar.tsx',
  'components/Footer.tsx',
  'components/LoadingScreen.tsx'
];

// Regex to capture potential ICD-10 codes: e.g. letter followed by 2 digits, optionally dot and digits
const codeRegex = /\b([A-Z][0-9]{2}(?:\.[0-9]{1,2})?)\b/g;

// Known non-code tokens to exclude (e.g. RGB/hex, year numbers, versions, HTML classes, etc.)
const ignoreTokens = new Set(['L12', 'M14', 'M00', 'V01', 'X59', 'Y98', 'U85', 'Z99', 'A00', 'B99', 'C00', 'D48', 'D50', 'D89', 'E00', 'E90', 'F00', 'F99', 'G00', 'G99', 'H00', 'H59', 'H60', 'H95', 'I00', 'I99', 'J00', 'J99', 'K00', 'K93', 'L00', 'L99', 'N00', 'N99', 'O00', 'O99', 'P00', 'P96', 'Q00', 'Q99', 'R00', 'R99', 'S00', 'T98', 'U00', 'Z00']);

const foundCodesByFile = new Map();

for (const relPath of filesToScan) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');

  // Look for codes mentioned in arrays or text
  const matches = content.match(codeRegex) || [];
  const validMatches = new Set();

  for (const m of matches) {
    // Check if it looks like an ICD-10 code (e.g. E11.2, N08.3, I10, A97.0, etc.)
    if (/^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/.test(m)) {
      validMatches.add(m);
    }
  }

  foundCodesByFile.set(relPath, Array.from(validMatches));
}

for (const [file, codes] of foundCodesByFile) {
  console.log(`\nFile: ${file}`);
  for (const c of codes) {
    const exists = codeMap.has(c);
    console.log(`  ${c.padEnd(8)}: ${exists ? 'EXISTS in icd10.json' : 'MISSING!'}`);
  }
}
