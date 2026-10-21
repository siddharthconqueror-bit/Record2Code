const fs = require('fs');
const path = require('path');
const icdData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8'));

const i63_2 = icdData.find(c => c.code === 'I63.2');
console.log('I63.2 includes:', i63_2.includes);
const i63_5 = icdData.find(c => c.code === 'I63.5');
console.log('I63.5 includes:', i63_5.includes);
const i63_9 = icdData.find(c => c.code === 'I63.9');
console.log('I63.9 includes:', i63_9.includes);
