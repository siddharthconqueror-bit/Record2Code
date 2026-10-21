const fs = require('fs');
const path = require('path');
const icdData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8'));

const d30_0 = icdData.find(c => c.code === 'D30.0');
console.log('D30.0:', d30_0);
