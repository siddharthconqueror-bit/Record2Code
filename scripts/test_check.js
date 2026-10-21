const fs = require('fs');
const path = require('path');

const icdRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8');
const icdCodes = JSON.parse(icdRaw);
const codeMap = new Map(icdCodes.map(c => [c.code, c]));

console.log('ICD-10 codes loaded:', icdCodes.length);
