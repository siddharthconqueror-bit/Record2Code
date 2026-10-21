const fs = require('fs');
const path = require('path');
const icdData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8'));

const k29_1 = icdData.find(c => c.code === 'K29.1');
console.log('K29.1:', k29_1);
