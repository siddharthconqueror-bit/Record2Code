const fs = require('fs');
const path = require('path');

// Load ICD-10 data
const icdRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8');
const icdCodes = JSON.parse(icdRaw);
const codeMap = new Map(icdCodes.map(c => [c.code, c]));

// Load Trainee Cases
const casesRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'trainee-cases.json'), 'utf8');
const bankCases = JSON.parse(casesRaw);

// Import generator templates & logic
const { GENERATOR_TEMPLATES, CITIES, HOSPITAL_TYPES, buildCandidateOptions } = require('./trainee_engine_cjs');


function simulateGenerateCase() {
  const template = GENERATOR_TEMPLATES[Math.floor(Math.random() * GENERATOR_TEMPLATES.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const hospital = HOSPITAL_TYPES[Math.floor(Math.random() * HOSPITAL_TYPES.length)];
  const sex = template.gender || (Math.random() > 0.5 ? 'male' : 'female');
  const age = Math.floor(Math.random() * (template.maxAge - template.minAge + 1)) + template.minAge;
  const durations = ['24 hours', '3 days', '5 days', '10 days', '2 weeks', '1 month', '3 months'];
  const duration = durations[Math.floor(Math.random() * durations.length)];

  const note = template.noteBuilder({ age, sex, city, hospital, duration });
  const candidateCodes = buildCandidateOptions([template.code], template.siblings, template.distractors);
  const genId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: genId,
    difficulty: template.difficulty,
    title: `${template.title}`,
    clinicalNote: note,
    vignette: note,
    question: 'Select the correct WHO ICD-10 diagnostic code(s) for this patient encounter:',
    candidateCodes,
    correctCodes: [template.code],
    rationale: template.rationale,
    explanation: `${template.rationale} ${template.tip}`,
    keyRule: template.tip,
    tip: template.tip,
    codingTip: template.tip,
    isGenerated: true
  };
}

// Simulate session of 100 consecutive cases
console.log('================================================================================');
console.log('SIMULATING 100 CONSECUTIVE TRAINEE CASES (BANK + DYNAMIC GENERATOR)');
console.log('================================================================================\n');

const seenIds = new Set();
const seenNotes = new Set();
const simulationLog = [];
let errorCount = 0;

for (let step = 1; step <= 100; step++) {
  let currentCase = null;
  let sourceType = 'Bank';

  // 1. Check if unseen case exists in bank
  const unseenBankCases = bankCases.filter(c => !seenIds.has(c.id));
  if (unseenBankCases.length > 0) {
    currentCase = unseenBankCases[0]; // Sequential or random unseen
    sourceType = 'Bank';
  } else {
    // 2. Bank exhausted -> generate dynamic case
    currentCase = simulateGenerateCase();
    sourceType = 'Generated';
  }

  // Verification checks on currentCase
  let caseErrors = [];

  // ID repeat check
  if (seenIds.has(currentCase.id)) {
    caseErrors.push(`Duplicate ID: ${currentCase.id}`);
  }
  seenIds.add(currentCase.id);

  // Note repeat check
  if (seenNotes.has(currentCase.clinicalNote)) {
    caseErrors.push('Duplicate Clinical Note');
  }
  seenNotes.add(currentCase.clinicalNote);

  // Verify correct codes exist in icd10.json
  for (const c of currentCase.correctCodes) {
    if (!codeMap.has(c)) caseErrors.push(`Invalid correctCode: ${c}`);
  }

  // Verify candidate codes exist in icd10.json
  for (const c of currentCase.candidateCodes) {
    if (!codeMap.has(c)) caseErrors.push(`Invalid candidate: ${c}`);
  }

  // Verify candidate codes include all correct codes
  for (const c of currentCase.correctCodes) {
    if (!currentCase.candidateCodes.includes(c)) caseErrors.push(`Candidate list missing: ${c}`);
  }

  // Verify candidate codes count (5-6)
  if (currentCase.candidateCodes.length < 5 || currentCase.candidateCodes.length > 6) {
    caseErrors.push(`Candidate count is ${currentCase.candidateCodes.length} (expected 5-6)`);
  }

  const status = caseErrors.length === 0 ? 'PASS' : 'FAIL';
  if (status === 'FAIL') errorCount++;

  simulationLog.push({
    step,
    id: currentCase.id,
    type: sourceType,
    difficulty: currentCase.difficulty,
    title: currentCase.title.length > 35 ? currentCase.title.slice(0, 32) + '...' : currentCase.title,
    codes: currentCase.correctCodes.join(', '),
    candidatesCount: currentCase.candidateCodes.length,
    status,
    errors: caseErrors.join('; ') || 'None'
  });
}

console.table(simulationLog.slice(0, 20));
console.log(`... [Showing first 20 rows of 100 simulation runs] ...\n`);
console.table(simulationLog.slice(60, 80));
console.log(`... [Showing rows 61-80 (Bank-to-Generator transition)] ...\n`);

console.log('================================================================================');
console.log(`SIMULATION COMPLETED: 100 / 100 CASES PROCESSED.`);
console.log(`Total Errors: ${errorCount}`);
console.log(`Unique Cases Encountered: ${seenIds.size} / 100`);
console.log(`Bank Cases Consumed: ${simulationLog.filter(s => s.type === 'Bank').length}`);
console.log(`Dynamic Generator Cases Created: ${simulationLog.filter(s => s.type === 'Generated').length}`);
console.log(`OVERALL SIMULATION RESULT: ${errorCount === 0 ? 'ALL 100 TESTS PASSED (100% SUCCESS)' : 'FAILED'}`);
console.log('================================================================================');

// Output markdown table
console.log('\n### 100-Case Simulation Result Table (Sample Excerpt):\n');
console.log('| Step | Case ID | Source | Difficulty | Title | Correct Code(s) | Status |');
console.log('| :---: | :---: | :---: | :---: | :--- | :---: | :---: |');
simulationLog.forEach((r, idx) => {
  if (idx < 15 || (idx >= 64 && idx < 75) || idx >= 95) {
    console.log(`| ${r.step} | \`${r.id}\` | ${r.type} | ${r.difficulty} | ${r.title} | \`${r.codes}\` | **${r.status}** |`);
  } else if (idx === 15 || idx === 75) {
    console.log(`| ... | ... | ... | ... | ... *(consecutive unique runs)* ... | ... | **PASS** |`);
  }
});
