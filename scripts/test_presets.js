const fs = require('fs');
const path = require('path');

// Load ICD-10 data
const icdData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8'));
const codeMap = new Map();
for (const item of icdData) {
  codeMap.set(item.code.toUpperCase(), item);
}

// Negation detection
const PRE_NEGATION_TRIGGERS = [
  'no history of',
  'no evidence of',
  'no signs of',
  'no sign of',
  'no report of',
  'negative for',
  'ruled out',
  'rules out',
  'r/o',
  'free of',
  'without any',
  'without signs of',
  'without evidence of',
  'without',
  'denies any',
  'denies',
  'denied',
  'did not show',
  'unlikely',
  'absence of',
  'not present',
  'no',
];

const POST_NEGATION_TRIGGERS = [
  'ruled out',
  'was ruled out',
  'is ruled out',
  'not seen',
  'not identified',
  'not present',
  'negative',
];

function detectNegations(text) {
  const spans = [];
  const lowerText = text.toLowerCase();
  const clauseRegex = /[^,;.\n]+[,;.\n]?/g;
  let match;

  while ((match = clauseRegex.exec(lowerText)) !== null) {
    const clause = match[0];
    const clauseStart = match.index;

    for (const trigger of PRE_NEGATION_TRIGGERS) {
      const triggerRegex = new RegExp(`\\b${trigger}\\b`, 'i');
      const trigMatch = triggerRegex.exec(clause);
      if (trigMatch) {
        const trigPos = trigMatch.index;
        const negatedStart = clauseStart + trigPos;
        const spanEnd = clauseStart + clause.length;

        spans.push({
          trigger,
          text: text.slice(negatedStart, spanEnd).trim(),
          startIndex: negatedStart,
          endIndex: spanEnd,
        });
        break;
      }
    }

    for (const trigger of POST_NEGATION_TRIGGERS) {
      const triggerRegex = new RegExp(`\\b([a-z0-9\\s]{3,30})\\s+${trigger}\\b`, 'i');
      const trigMatch = triggerRegex.exec(clause);
      if (trigMatch) {
        const entityText = trigMatch[1];
        const entityStart = clauseStart + trigMatch.index;
        const spanEnd = entityStart + trigMatch[0].length;
        if (!spans.some(s => s.startIndex <= entityStart && s.endIndex >= spanEnd)) {
          spans.push({
            trigger,
            text: text.slice(entityStart, spanEnd).trim(),
            startIndex: entityStart,
            endIndex: spanEnd,
          });
        }
      }
    }
  }

  return spans;
}

function isRangeNegated(start, end, negatedSpans) {
  for (const span of negatedSpans) {
    if (Math.max(start, span.startIndex) < Math.min(end, span.endIndex)) {
      return true;
    }
  }
  return false;
}

function checkDocumentationQueries(text, suggestedCodes) {
  const queries = [];
  const lowerText = text.toLowerCase();

  // 1. Diabetes without specified type
  const mentionsDiabetes = /\b(?:diabetes|diabetic|dm)\b/i.test(lowerText);
  const mentionsType1 = /\b(?:type\s*1|type\s*i\b|t1dm|dm1|iddm)\b/i.test(lowerText);
  const mentionsType2 = /\b(?:type\s*2|type\s*ii\b|t2dm|dm2|niddm)\b/i.test(lowerText);
  if (mentionsDiabetes && !mentionsType1 && !mentionsType2) {
    queries.push({
      id: 'doc_query_diabetes_type',
      condition: 'Diabetes Mellitus Type',
      query: 'Diabetes type is not specified (Type 1 vs Type 2).',
      action: 'Query physician to clarify whether the patient has Type 1 (E10.-) or Type 2 (E11.-) diabetes mellitus before assigning final billing code.',
      potentialCodes: ['E10.9', 'E11.9', 'E14.9'],
    });
  }

  // 2. CKD without specified stage or eGFR
  const mentionsCKD = /\b(?:chronic\s*kidney\s*disease|ckd|chronic\s*renal\s*failure)\b/i.test(lowerText);
  const mentionsStage = /\b(?:stage\s*[1-5]|egfr\b)/i.test(lowerText);
  if (mentionsCKD && !mentionsStage) {
    queries.push({
      id: 'doc_query_ckd_stage',
      condition: 'Chronic Kidney Disease Stage',
      query: 'Chronic kidney disease is documented without specific stage or eGFR level.',
      action: 'Review renal function panel (eGFR) or query clinician for CKD stage (Stage 1 to 5, N18.1–N18.5) to avoid unspecified code N18.9.',
      potentialCodes: ['N18.1', 'N18.2', 'N18.3', 'N18.4', 'N18.5'],
    });
  }

  // 3. Gastroenteritis without identified organism
  if (suggestedCodes.includes('A09.0') || suggestedCodes.includes('A09.9')) {
    const mentionsOrganism = /\b(?:salmonella|shigella|campylobacter|rotavirus|e\.?\s*coli|amoeba|cholera)\b/i.test(lowerText);
    if (!mentionsOrganism) {
      queries.push({
        id: 'doc_query_gastro_pathogen',
        condition: 'Infectious Gastroenteritis Causative Organism',
        query: 'Presumed infectious gastroenteritis without identified pathogen.',
        action: 'Check stool culture or viral PCR. If a specific causative organism is confirmed (e.g. Salmonella A02.-), assign specific infectious category.',
        potentialCodes: ['A02.0', 'A08.0', 'A09.0'],
      });
    }
  }

  // 4. Polyneuropathy in Diabetic patient without stated causal relationship
  const mentionsPolyneuropathy = /\b(?:polyneuropathy|peripheral\s*neuropathy)\b/i.test(lowerText);
  const mentionsExplicitDiabeticNeuropathy = /\bdiabetic\s*(?:poly)?neuropathy\b/i.test(lowerText);
  if (mentionsDiabetes && mentionsPolyneuropathy && !mentionsExplicitDiabeticNeuropathy) {
    queries.push({
      id: 'doc_query_diabetic_polyneuropathy',
      condition: 'Polyneuropathy Etiology',
      query: 'Is the polyneuropathy due to diabetes?',
      action: 'Query clinician whether peripheral polyneuropathy is a manifestation of diabetes mellitus before assigning combination codes E11.4† and G63.2*.',
      potentialCodes: ['E11.4', 'G63.2', 'G62.9'],
    });
  }

  // 5. Coexisting Hypertension and Chronic Kidney Disease
  const mentionsHTN = /\b(?:hypertension|essential\s*hypertension|high\s*blood\s*pressure|htn)\b/i.test(lowerText);
  if (mentionsHTN && mentionsCKD) {
    queries.push({
      id: 'doc_query_htn_ckd',
      condition: 'Hypertension with Chronic Kidney Disease',
      query: 'Is the kidney disease due to hypertension?',
      action: 'Query physician whether the chronic kidney disease is due to hypertension. If it is, assign category I12 (Hypertensive renal disease) instead of I10.',
      potentialCodes: ['I12.0', 'I12.9', 'I10'],
    });
  }

  return queries;
}

function checkExcludesConflicts(suggested) {
  const conflicts = [];
  const codeSet = new Set(suggested.map(s => s.code));

  for (let i = 0; i < suggested.length; i++) {
    const s1 = suggested[i];
    const excludes1 = s1.excludes || [];

    for (let j = 0; j < suggested.length; j++) {
      if (i === j) continue;
      const s2 = suggested[j];
      const code2Base = s2.code.split('.')[0];

      for (const exc of excludes1) {
        const excLower = exc.toLowerCase();
        if (excLower.includes(s2.code.toLowerCase()) || excLower.includes(code2Base.toLowerCase())) {
          conflicts.push({
            codeA: s1.code,
            codeB: s2.code,
            ruleText: `${s1.code} (${s1.title}) Excludes note: "${exc}"`,
          });
        }
      }
    }
  }

  if (codeSet.has('I10') && (codeSet.has('I11.0') || codeSet.has('I11.9'))) {
    conflicts.push({
      codeA: 'I10',
      codeB: codeSet.has('I11.0') ? 'I11.0' : 'I11.9',
      ruleText: 'WHO ICD-10 Rule: Essential hypertension (I10) is excluded when hypertension with heart disease (I11.-) is present.',
    });
  }

  return conflicts;
}

function suggest(text, options = {}) {
  const includeOptionalSubdivisions = options.includeOptionalSubdivisions || false;
  const negatedSpans = detectNegations(text);
  const candidates = new Map();
  const lowerText = text.toLowerCase();

  const mentionsCKD = /\b(?:chronic\s*kidney\s*disease|ckd|chronic\s*renal\s*failure)\b/i.test(lowerText);
  const mentionsExplicitDiabeticNeuropathy = /\bdiabetic\s*(?:poly)?neuropathy\b/i.test(lowerText);

  // 1. Type 2 Diabetes with Renal Complications
  const t2dmRenalMatch = /\b(?:type\s*2\s*diabetes|t2dm|dm2|non-insulin-dependent\s*diabetes|type\s*ii\s*diabetes)[^.;\n]{0,120}\b(?:ckd|chronic\s*kidney\s*disease|renal|nephropathy|egfr|glomerul)/i.exec(text)
    || /\b(?:ckd|chronic\s*kidney\s*disease|renal\s*disease|nephropathy)[^.;\n]{0,120}\b(?:type\s*2\s*diabetes|t2dm|dm2|type\s*ii\s*diabetes)/i.exec(text);

  if (t2dmRenalMatch && !isRangeNegated(t2dmRenalMatch.index, t2dmRenalMatch.index + t2dmRenalMatch[0].length, negatedSpans)) {
    const e11_2 = codeMap.get('E11.2');
    const n08_3 = codeMap.get('N08.3');
    if (e11_2) {
      candidates.set('E11.2', {
        ...e11_2,
        matchedText: t2dmRenalMatch[0].trim(),
        strength: 'High',
        reason: 'Type 2 diabetes mellitus with renal complications (WHO dagger/asterisk pairing with N08.3*)',
        symbol: 'dagger',
      });
    }
    if (n08_3) {
      candidates.set('N08.3', {
        ...n08_3,
        matchedText: t2dmRenalMatch[0].trim(),
        strength: 'High',
        reason: 'Glomerular disorders in diabetes mellitus (WHO asterisk manifestation code paired with E11.2†)',
        symbol: 'asterisk',
      });
    }
  }

  // 2. Type 2 Diabetes with Neurological Complications / Polyneuropathy
  const polyMatch = /\b(?:severe\s*)?(?:peripheral\s*)?polyneuropathy\b/i.exec(text)
    || /\b(?:peripheral\s*)?neuropathy\b/i.exec(text);

  if (polyMatch && !isRangeNegated(polyMatch.index, polyMatch.index + polyMatch[0].length, negatedSpans)) {
    const mentionsDiabetes = /\b(?:type\s*2\s*diabetes|type\s*1\s*diabetes|t2dm|t1dm|dm2|dm1|diabetes)\b/i.test(lowerText);
    if (mentionsDiabetes) {
      if (mentionsExplicitDiabeticNeuropathy) {
        // Explicit diabetic polyneuropathy -> High strength
        const e11_4 = codeMap.get('E11.4');
        const g63_2 = codeMap.get('G63.2');
        if (e11_4) {
          candidates.set('E11.4', {
            ...e11_4,
            matchedText: polyMatch[0].trim(),
            strength: 'High',
            reason: 'Type 2 diabetes mellitus with neurological complications (explicitly documented as diabetic)',
            symbol: 'dagger',
          });
        }
        if (g63_2) {
          candidates.set('G63.2', {
            ...g63_2,
            matchedText: polyMatch[0].trim(),
            strength: 'High',
            reason: 'Diabetic polyneuropathy (explicitly documented as diabetic)',
            symbol: 'asterisk',
          });
        }
      } else {
        // Diabetic patient with polyneuropathy but NO stated cause -> Low strength with query
        const e11_4 = codeMap.get('E11.4');
        const g63_2 = codeMap.get('G63.2');
        if (e11_4) {
          candidates.set('E11.4', {
            ...e11_4,
            matchedText: polyMatch[0].trim(),
            strength: 'Low',
            reason: 'Is the polyneuropathy due to diabetes? (Physician clarification required before assigning diabetic etiology)',
            symbol: 'dagger',
          });
        }
        if (g63_2) {
          candidates.set('G63.2', {
            ...g63_2,
            matchedText: polyMatch[0].trim(),
            strength: 'Low',
            reason: 'Is the polyneuropathy due to diabetes? (Physician clarification required before assigning diabetic etiology)',
            symbol: 'asterisk',
          });
        }
      }
    } else {
      // Non-diabetic polyneuropathy
      const g62_9 = codeMap.get('G62.9');
      if (g62_9) {
        candidates.set('G62.9', {
          ...g62_9,
          matchedText: polyMatch[0].trim(),
          strength: 'High',
          reason: 'Polyneuropathy, unspecified',
          symbol: null,
        });
      }
    }
  }

  // 3. CKD Stage
  const ckdMatch = /\b(?:stage\s*3\s*chronic\s*kidney\s*disease|ckd\s*(?:stage\s*)?3[ab]?|chronic\s*kidney\s*disease\s*,?\s*stage\s*3|egfr\s*(?:of\s*)?(?:3[0-9]|4[0-9]|5[0-9])\b)/i.exec(text);
  if (ckdMatch && !isRangeNegated(ckdMatch.index, ckdMatch.index + ckdMatch[0].length, negatedSpans)) {
    const n18_3 = codeMap.get('N18.3');
    if (n18_3) {
      candidates.set('N18.3', {
        ...n18_3,
        matchedText: ckdMatch[0].trim(),
        strength: 'High',
        reason: 'Chronic kidney disease, stage 3 (eGFR 30–59 mL/min)',
        symbol: null,
      });
    }
  }

  // 4. Hypertension (I10): check if CKD is co-present
  const htnMatch = /\b(?:essential\s*(?:\(primary\)\s*)?hypertension|primary\s*hypertension|systemic\s*hypertension|high\s*blood\s*pressure)\b/i.exec(text)
    || /\bhypertension\b/i.exec(text)
    || /\bhtn\b/i.exec(text);

  if (htnMatch && !isRangeNegated(htnMatch.index, htnMatch.index + htnMatch[0].length, negatedSpans)) {
    const i10 = codeMap.get('I10');
    if (i10) {
      if (mentionsCKD) {
        // When hypertension and CKD are both present, do NOT suggest I10 as High! Suggest Medium with note on I12
        candidates.set('I10', {
          ...i10,
          matchedText: htnMatch[0].trim(),
          strength: 'Medium',
          reason: 'Essential (primary) hypertension (Query whether CKD is due to hypertension, in which case I12 applies)',
          symbol: null,
        });
      } else {
        candidates.set('I10', {
          ...i10,
          matchedText: htnMatch[0].trim(),
          strength: 'High',
          reason: 'Essential (primary) hypertension',
          symbol: null,
        });
      }
    }
  }

  // 5. Hypertensive Heart Disease with Heart Failure
  const htnHfMatch = /\b(?:hypertensive\s*heart\s*disease)[^.;\n]{0,60}\b(?:heart\s*failure|congestive\s*heart\s*failure|chf)\b/i.exec(text)
    || /\b(?:congestive\s*heart\s*failure|chf|heart\s*failure)[^.;\n]{0,60}\b(?:hypertensive\s*heart\s*disease)\b/i.exec(text);

  if (htnHfMatch && !isRangeNegated(htnHfMatch.index, htnHfMatch.index + htnHfMatch[0].length, negatedSpans)) {
    const i11_0 = codeMap.get('I11.0');
    const i50_0 = codeMap.get('I50.0');
    if (i11_0) {
      candidates.set('I11.0', {
        ...i11_0,
        matchedText: htnHfMatch[0].trim(),
        strength: 'High',
        reason: 'Hypertensive heart disease with (congestive) heart failure',
        symbol: null,
      });
    }
    if (i50_0) {
      candidates.set('I50.0', {
        ...i50_0,
        matchedText: htnHfMatch[0].trim(),
        strength: 'High',
        reason: 'Congestive heart failure',
        symbol: null,
      });
    }
  }

  // 6. COPD with Acute Lower Respiratory Infection
  const copdInfMatch = /\b(?:chronic\s*obstructive\s*pulmonary\s*disease|copd|coad)[^.;\n]{0,90}\b(?:acute\s*lower\s*respiratory\s*infection|lower\s*respiratory\s*infection)\b/i.exec(text)
    || /\b(?:acute\s*lower\s*respiratory\s*infection|lower\s*respiratory\s*infection)[^.;\n]{0,90}\b(?:chronic\s*obstructive\s*pulmonary\s*disease|copd|coad)\b/i.exec(text);

  if (copdInfMatch && !isRangeNegated(copdInfMatch.index, copdInfMatch.index + copdInfMatch[0].length, negatedSpans)) {
    const j44_0 = codeMap.get('J44.0');
    const j22 = codeMap.get('J22');
    if (j44_0) {
      candidates.set('J44.0', {
        ...j44_0,
        matchedText: copdInfMatch[0].trim(),
        strength: 'High',
        reason: 'Chronic obstructive pulmonary disease with acute lower respiratory infection',
        symbol: null,
      });
    }
    // When J44.0 is suggested because of 'acute lower respiratory infection', suggest J22 as the additional code!
    if (j22) {
      candidates.set('J22', {
        ...j22,
        matchedText: 'acute lower respiratory infection',
        strength: 'High',
        reason: 'Unspecified acute lower respiratory infection (additional code for acute lower respiratory infection in J44.0)',
        symbol: null,
      });
    }
  }

  // Only suggest J18.9 if pneumonia is written in the report!
  const pneumoniaMatch = /\b(?:pneumonia|bronchopneumonia)\b/i.exec(text);
  if (pneumoniaMatch && !isRangeNegated(pneumoniaMatch.index, pneumoniaMatch.index + pneumoniaMatch[0].length, negatedSpans)) {
    const j18_9 = codeMap.get('J18.9');
    if (j18_9) {
      candidates.set('J18.9', {
        ...j18_9,
        matchedText: pneumoniaMatch[0].trim(),
        strength: 'High',
        reason: 'Pneumonia, unspecified organism',
        symbol: null,
      });
    }
  }

  // 7. Gastroenteritis & Dehydration
  const gastroMatch = /\b(?:acute\s*diarrhoea\s*and\s*gastroenteritis|acute\s*gastroenteritis|infectious\s*gastroenteritis|diarrhoea\s*(?:and|of)\s*(?:presumed\s*)?infectious\s*origin|gastroenteritis\s*of\s*(?:presumed\s*)?infectious\s*origin)\b/i.exec(text)
    || /\b(?:acute\s*diarrhoea|acute\s*diarrhea)[^.;\n]{0,40}\b(?:gastroenteritis)\b/i.exec(text);

  if (gastroMatch && !isRangeNegated(gastroMatch.index, gastroMatch.index + gastroMatch[0].length, negatedSpans)) {
    const a09_0 = codeMap.get('A09.0');
    if (a09_0) {
      candidates.set('A09.0', {
        ...a09_0,
        matchedText: gastroMatch[0].trim(),
        strength: 'High',
        reason: 'Other and unspecified gastroenteritis and colitis of infectious origin',
        symbol: null,
      });
    }
  }

  const dehyMatch = /\b(?:severe\s*volume\s*depletion|volume\s*depletion|dehydration|hypovolaemia|hypovolemia)\b/i.exec(text);
  if (dehyMatch && !isRangeNegated(dehyMatch.index, dehyMatch.index + dehyMatch[0].length, negatedSpans)) {
    const e86 = codeMap.get('E86');
    if (e86) {
      candidates.set('E86', {
        ...e86,
        matchedText: dehyMatch[0].trim(),
        strength: 'High',
        reason: 'Volume depletion (includes dehydration and extracellular volume depletion)',
        symbol: null,
      });
    }
  }

  // Filter parents when child is present
  const list = Array.from(candidates.values());
  const filtered = list.filter(cand => {
    if (!cand.isLeaf) {
      const hasLeaf = list.some(o => o.isLeaf && (o.parent === cand.code || o.code.startsWith(cand.code + '.')));
      if (hasLeaf) return false;
    }
    return true;
  });

  // Rank: High first, then Medium, then Low
  filtered.sort((a, b) => {
    const order = { High: 3, Medium: 2, Low: 1 };
    const diff = order[b.strength] - order[a.strength];
    if (diff !== 0) return diff;
    return a.code.localeCompare(b.code);
  });

  const conflicts = checkExcludesConflicts(filtered);
  const docQueries = checkDocumentationQueries(text, filtered.map(f => f.code));

  return { suggestions: filtered, conflicts, docQueries, negatedSpans };
}

// TEST CASES
const PRESETS = [
  {
    name: 'Preset 1: Diabetic with CKD',
    text: '64-year-old female with long-standing Type 2 diabetes mellitus, Stage 3 chronic kidney disease (eGFR 42 mL/min), essential hypertension, and severe peripheral polyneuropathy.'
  },
  {
    name: 'Preset 2: COPD with Infection',
    text: '71-year-old male with chronic obstructive pulmonary disease presenting with acute lower respiratory infection, productive purulent cough, and severe dyspnea.'
  },
  {
    name: 'Preset 3: Cardiac (HTN + HF)',
    text: '68-year-old male with hypertensive heart disease and congestive heart failure. Bilateral lower extremity pitting edema and elevated BNP.'
  },
  {
    name: 'Preset 4: Gastroenteritis & Dehydration',
    text: '29-year-old male with acute diarrhoea and gastroenteritis of presumed infectious origin, severe volume depletion, tachycardia, and dry mucous membranes.'
  }
];

console.log('====================================================');
console.log('TESTING 4 PRESETS WITH FIXES');
console.log('====================================================\n');

for (const p of PRESETS) {
  console.log('========================================');
  console.log(p.name);
  console.log('Text: ' + p.text);
  console.log('----------------------------------------');
  const res = suggest(p.text);
  console.log(`Suggested Codes (${res.suggestions.length}):`);
  for (const s of res.suggestions) {
    console.log(`  - [${s.code}] ${s.title}`);
    console.log(`    Strength: ${s.strength} ${s.symbol ? '[' + s.symbol + ']' : ''}`);
    console.log(`    Evidence: "${s.matchedText}"`);
    console.log(`    Reason: ${s.reason}`);
  }
  if (res.conflicts.length > 0) {
    console.log('\nExcludes Conflicts:');
    res.conflicts.forEach(c => console.log(`  ⚠️ ${c.codeA} excludes ${c.codeB} -> ${c.ruleText}`));
  }
  if (res.docQueries.length > 0) {
    console.log('\nDocumentation Queries:');
    res.docQueries.forEach(q => {
      console.log(`  📋 [${q.condition}] Query: "${q.query}"`);
      console.log(`     Action: ${q.action}`);
      console.log(`     Potential Codes: ${q.potentialCodes ? q.potentialCodes.join(', ') : ''}`);
    });
  }
  console.log('');
}
