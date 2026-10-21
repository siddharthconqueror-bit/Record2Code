const fs = require('fs');
const path = require('path');
const { genericMatchText } = require('./test_engine');

console.log('================================================================================');
console.log('RECORD2CODE TRAINEE MODE QUALITY VERIFICATION');
console.log('================================================================================\n');

// 1. Load ICD-10 data
const icdRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8');
const icdCodes = JSON.parse(icdRaw);
const codeMap = new Map(icdCodes.map(c => [c.code, c]));
console.log(`[PASS] Loaded ${icdCodes.length} WHO ICD-10 reference codes.`);

// 2. Load Trainee cases
const casesRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'trainee-cases.json'), 'utf8');
const cases = JSON.parse(casesRaw);
console.log(`[PASS] Loaded ${cases.length} trainee cases from data/trainee-cases.json.\n`);

let checksPassed = true;

// Check A: Verify every code in case bank exists in data/icd10.json
console.log('--- Check 1: Existence of all codes in WHO ICD-10 database ---');
const missingCodes = [];
for (const c of cases) {
  for (const code of c.correctCodes) {
    if (!codeMap.has(code)) {
      missingCodes.push({ caseId: c.id, type: 'correctCode', code });
    }
  }
  for (const code of c.candidateCodes) {
    if (!codeMap.has(code)) {
      missingCodes.push({ caseId: c.id, type: 'candidateCode', code });
    }
  }
}

if (missingCodes.length === 0) {
  console.log('[PASS] All correct codes and candidate options exist in data/icd10.json!\n');
} else {
  console.error('[FAIL] Missing codes detected:', missingCodes);
  checksPassed = false;
}

// Check B: Every case has correct answers different from wrong options
console.log('--- Check 2: Correct answers vs Candidate options validation ---');
let invalidOptionsCount = 0;
for (const c of cases) {
  const correctSet = new Set(c.correctCodes);
  const candSet = new Set(c.candidateCodes);
  
  // All correct codes must be in candidate codes
  const missingCorrect = c.correctCodes.filter(code => !candSet.has(code));
  if (missingCorrect.length > 0) {
    console.error(`[FAIL] ${c.id}: Candidate options missing correct code(s):`, missingCorrect);
    invalidOptionsCount++;
  }
  
  // Must have wrong options (candidate count > correct count)
  if (c.candidateCodes.length <= c.correctCodes.length) {
    console.error(`[FAIL] ${c.id}: No distractor/wrong options provided in candidate list!`);
    invalidOptionsCount++;
  }

  // Candidates count must be between 4 and 7 (nominally 5-6)
  if (c.candidateCodes.length < 4 || c.candidateCodes.length > 7) {
    console.warn(`[WARN] ${c.id}: Candidate count is ${c.candidateCodes.length}`);
  }
}

if (invalidOptionsCount === 0) {
  console.log('[PASS] Every case has valid correct options and distinct wrong distractor options.\n');
} else {
  checksPassed = false;
}

// Check C: No two cases have the same clinical note
console.log('--- Check 3: Uniqueness of Case Notes ---');
const noteMap = new Map();
const duplicateNotes = [];
for (const c of cases) {
  const noteKey = (c.clinicalNote || c.vignette || '').trim().toLowerCase();
  if (noteMap.has(noteKey)) {
    duplicateNotes.push({ id1: noteMap.get(noteKey), id2: c.id, note: noteKey.slice(0, 60) + '...' });
  } else {
    noteMap.set(noteKey, c.id);
  }
}

if (duplicateNotes.length === 0) {
  console.log(`[PASS] All ${cases.length} case clinical notes are completely unique with zero duplicates!\n`);
} else {
  console.error('[FAIL] Duplicate case notes found:', duplicateNotes);
  checksPassed = false;
}

// Check D: Run suggestion engine on each case note and log differences to trainee-review.txt
console.log('--- Check 4: Suggestion Engine Comparison & Review Log Generation ---');
const reviewEntries = [];
let matchCount = 0;

for (const c of cases) {
  const note = c.clinicalNote || c.vignette;
  const suggestions = genericMatchText(note);
  const suggestedCodes = suggestions.map(s => s.code);
  
  const expectedCodes = c.correctCodes;
  const missingFromEngine = expectedCodes.filter(exp => !suggestedCodes.includes(exp));
  const extraInEngine = suggestedCodes.filter(sg => !expectedCodes.includes(sg));

  const isExactMatch = missingFromEngine.length === 0 && extraInEngine.length === 0;
  if (isExactMatch) {
    matchCount++;
  } else {
    reviewEntries.push({
      id: c.id,
      title: c.title,
      difficulty: c.difficulty,
      note,
      correctCodes: expectedCodes,
      suggestedCodes,
      missingFromEngine,
      extraInEngine,
      rationale: c.rationale,
      tip: c.tip
    });
  }
}

console.log(`Engine comparison finished: ${matchCount} exact matches, ${reviewEntries.length} flagged for clinical review.`);

// Format trainee-review.txt
let reviewTxtContent = `================================================================================
RECORD2CODE TRAINEE MODE CLINICAL REVIEW LOG
Generated: ${new Date().toISOString()}
Total Cases Reviewed: ${cases.length}
Exact Engine Matches: ${matchCount}
Cases Requiring Human Review / Engine Differences: ${reviewEntries.length}
================================================================================

PURPOSE:
This review file highlights cases where the automated suggestion engine output
differs from the case's authoritative gold-standard answer.
Per WHO ICD-10 coding guidelines:
- Complex clinical vignettes often describe previous medical history, surgical
  interventions, differential workups, or negated conditions.
- Gold standard answers represent the primary encounter diagnosis / dagger-asterisk
  sequencing that a trained human coder must select.
- Authoritative answers were NOT modified or compromised to force matching.

--------------------------------------------------------------------------------
`;

reviewEntries.forEach((entry, idx) => {
  reviewTxtContent += `
[CASE ${idx + 1}] ID: ${entry.id} | ${entry.title} (${entry.difficulty})
CLINICAL NOTE:
"${entry.note}"

EXPECTED GOLD-STANDARD CODES:
${entry.correctCodes.join(', ')}

ENGINE SUGGESTED CODES:
${entry.suggestedCodes.length > 0 ? entry.suggestedCodes.join(', ') : 'None'}

DIFFERENCE ANALYSIS:
- Missing in Engine: ${entry.missingFromEngine.length > 0 ? entry.missingFromEngine.join(', ') : 'None'}
- Extra in Engine:   ${entry.extraInEngine.length > 0 ? entry.extraInEngine.join(', ') : 'None'}

CLINICAL RATIONALE:
${entry.rationale}

CODING TIP:
${entry.tip}
--------------------------------------------------------------------------------
`;
});

const reviewFilePath = path.join(__dirname, '..', 'trainee-review.txt');
fs.writeFileSync(reviewFilePath, reviewTxtContent, 'utf8');
console.log(`[PASS] Written complete human review log to ${reviewFilePath}\n`);

console.log('================================================================================');
if (checksPassed) {
  console.log('OVERALL QUALITY VERIFICATION RESULT: PASS (All criteria fulfilled)');
} else {
  console.log('OVERALL QUALITY VERIFICATION RESULT: FAIL (Please resolve flagged issues)');
}
console.log('================================================================================');
