const fs = require('fs');
const path = require('path');

// Read icd10.json
const icdPath = path.join(__dirname, '..', 'data', 'icd10.json');
const allCodes = JSON.parse(fs.readFileSync(icdPath, 'utf8'));

// We can compile/run lib/suggest.ts or load transpiled or use ts-node / simple js loader.
// Let's create a quick runner using esbuild-register or ts-node or bundle it.
// Let's check if ts-node or npx tsx is available.
