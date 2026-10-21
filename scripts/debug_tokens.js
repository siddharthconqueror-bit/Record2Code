const fs = require('fs');
const path = require('path');
const icdData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8'));

// Let's see what tokens tokenize("Other acute gastritis") produces:
const SPELLING_MAP = [
  [/\banemia\b/g, 'anaemia'],
  [/\bdiarrhea\b/g, 'diarrhoea'],
];
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'with', 'for', 'at', 'by',
  'from', 'to', 'is', 'was', 'are', 'were', 'has', 'had', 'have', 'been',
  'patient', 'pt', 'history', 'hx', 'presented', 'presents', 'presenting',
  'year', 'years', 'old', 'yo', 'male', 'female', 'man', 'woman', 'admitted',
  'complaining', 'complains', 'noted', 'found', 'part', 'due'
]);

function normalizeWord(word) {
  let w = word.toLowerCase();
  for (const [re, rep] of SPELLING_MAP) w = w.replace(re, rep);
  if (w.endsWith('ies') && w.length > 5) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('es') && w.length > 4 && !w.endsWith('ses')) w = w.slice(0, -2);
  else if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) w = w.slice(0, -1);
  return w;
}

function tokenize(text) {
  let clean = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const words = clean.split(/[\s-]+/).filter(Boolean);
  return words.map(w => normalizeWord(w)).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function extractCoreTokens(title) {
  const withoutParens = title.replace(/\([^)]*\)/g, ' ');
  const stripped = withoutParens
    .replace(/,\s*(?:other\s+and\s+)?unspecified.*$/i, '')
    .replace(/,\s*site\s+not\s+specified.*$/i, '')
    .replace(/,\s*part\s+unspecified.*$/i, '')
    .replace(/,\s*without\s+complications?.*$/i, '')
    .replace(/,\s*not\s+elsewhere\s+classified.*$/i, '')
    .replace(/\bNOS\b/g, '');
  return new Set(tokenize(stripped));
}

console.log('K29.1 title:', extractCoreTokens('Other acute gastritis'));
console.log('Report "acute gastritis":', new Set(tokenize('acute gastritis')));
