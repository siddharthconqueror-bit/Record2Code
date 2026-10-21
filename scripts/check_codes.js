const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8'));

const codes = [
  'I21.0', 'B51.9', 'B18.1', 'K74.6', 'A15.0', 'M06.9', 'N10',
  'J44.1', 'A97.0', 'O14.9', 'K21.0', 'E03.9', 'N18.4', 'K80.0', 'D57.0', 'I63.9',
  'E11.9', 'J18.9', 'I10', 'K29.1', 'E11.2', 'N08.3', 'I11.0', 'J45.9',
  'A01.0', 'G43.9', 'K35.8', 'N39.0', 'D50.9', 'S72.9'
];

codes.forEach(c => {
  const f = data.find(x => x.code === c);
  console.log(c + ' -> ' + (f ? f.title + ' (Leaf: ' + f.isLeaf + ')' : 'NOT FOUND'));
});
