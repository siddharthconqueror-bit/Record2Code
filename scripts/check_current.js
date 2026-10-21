const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/icd10.json', 'utf8'));
console.log('Current total codes:', data.length);
console.log('Sample M code:', data.find(c => c.code.startsWith('M00.0')));
