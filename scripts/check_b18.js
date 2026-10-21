const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8'));

console.log(data.filter(c => c.code.startsWith('B18.1')).map(c => c.code + ' ' + c.title + ' (leaf:' + c.isLeaf + ', opt:' + c.isOptionalSubdivision + ')'));
console.log(data.filter(c => c.code.startsWith('B18')).map(c => c.code + ' ' + c.title + ' (leaf:' + c.isLeaf + ', opt:' + c.isOptionalSubdivision + ')'));
