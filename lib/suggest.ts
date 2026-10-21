/**
 * Clinical ICD-10 Suggestion Engine (WHO ICD-10 2019 Specification)
 * 
 * Capabilities:
 * 1. Hand-written High-Priority Clinical Rules (top priority)
 * 2. Combinations Rules Table (condition A + condition B -> combined code, separate codes hidden)
 * 3. Generic Matcher searching ALL codes in data file (word matching, spelling normalization, parent context, includes terms)
 * 4. Specificity Resolver (chooses most specific terminal leaf in code family)
 * 5. Clinical Negation Detection (rules out negated terms)
 * 6. Symptom Chapter XVIII Suppression (suppresses symptom codes when a definitive diagnosis is present)
 * 7. External Cause Chapter XX Suppression (suppresses V-Y unless accident/trauma is present)
 * 8. Neoplasm Chapter II Suppression (suppresses C-D unless neoplasm/tumor/cancer is present)
 * 9. Asterisk (*) Rule (never suggests an asterisk manifestation code without its dagger † partner)
 * 10. Documentation Queries & Excludes Conflict Alerts
 */

export interface IcdCode {
  code: string;
  title: string;
  chapter: string;
  chapter_title: string;
  block: string | null;
  parent: string | null;
  isLeaf: boolean;
  isOptionalSubdivision?: boolean;
  includes: string[];
  excludes: string[];
}

export interface MatchEvidence {
  matchedText: string;
  startIndex: number;
  endIndex: number;
  matchStrength: 'High' | 'Medium' | 'Low';
  matchReason: string;
}

export interface CodeSuggestion extends IcdCode {
  evidence: MatchEvidence;
  daggerAsterisk?: 'dagger' | 'asterisk' | null;
  pairedWith?: string;
  score?: number;
}

export interface ExcludesConflict {
  codeA: string;
  codeB: string;
  ruleText: string;
  recommendation: string;
}

export interface DocumentationQuery {
  id: string;
  condition: string;
  query: string;
  suggestedAction: string;
  potentialCodes: string[];
}

export interface NegatedSpan {
  trigger: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface SuggestionResult {
  suggestions: CodeSuggestion[];
  conflicts: ExcludesConflict[];
  docQueries: DocumentationQuery[];
  negatedSpans: NegatedSpan[];
}

export interface CombinationRule {
  id: string;
  name: string;
  matchA: (codes: string[], text: string) => boolean;
  matchB: (codes: string[], text: string) => boolean;
  combinedCodes: {
    code: string;
    strength: 'High' | 'Medium' | 'Low';
    daggerAsterisk?: 'dagger' | 'asterisk' | null;
    reason: string;
    pairedWith?: string;
  }[];
  hideCodes: string[];
}

// ============================================================================
// 1. NEGATION DETECTION
// ============================================================================

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

export function detectNegations(text: string): NegatedSpan[] {
  const spans: NegatedSpan[] = [];
  const lowerText = text.toLowerCase();
  const clauseRegex = /[^,;.\n]+[,;.\n]?/g;
  let match: RegExpExecArray | null;

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
        if (!spans.some((s) => s.startIndex <= entityStart && s.endIndex >= spanEnd)) {
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

export function isRangeNegated(start: number, end: number, negatedSpans: NegatedSpan[]): boolean {
  for (const span of negatedSpans) {
    if (Math.max(start, span.startIndex) < Math.min(end, span.endIndex)) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// 2. CLINICAL ABBREVIATION EXPANSION
// ============================================================================

const ABBREVIATIONS: { abbr: RegExp; expand: string }[] = [
  { abbr: /\bT2DM\b/gi, expand: 'type 2 diabetes mellitus' },
  { abbr: /\bDM2\b/gi, expand: 'type 2 diabetes mellitus' },
  { abbr: /\bNIDDM\b/gi, expand: 'type 2 diabetes mellitus' },
  { abbr: /\bT1DM\b/gi, expand: 'type 1 diabetes mellitus' },
  { abbr: /\bDM1\b/gi, expand: 'type 1 diabetes mellitus' },
  { abbr: /\bIDDM\b/gi, expand: 'type 1 diabetes mellitus' },
  { abbr: /\bHTN\b/gi, expand: 'essential hypertension' },
  { abbr: /\bCKD\b/gi, expand: 'chronic kidney disease' },
  { abbr: /\bCOPD\b/gi, expand: 'chronic obstructive pulmonary disease' },
  { abbr: /\bCOAD\b/gi, expand: 'chronic obstructive pulmonary disease' },
  { abbr: /\bCHF\b/gi, expand: 'congestive heart failure' },
  { abbr: /\bUTI\b/gi, expand: 'urinary tract infection' },
  { abbr: /\bAMI\b/gi, expand: 'acute myocardial infarction' },
  { abbr: /\bMI\b/gi, expand: 'myocardial infarction' },
  { abbr: /\bTB\b/gi, expand: 'tuberculosis' },
  { abbr: /\bGERD\b/gi, expand: 'gastro-oesophageal reflux disease' },
  { abbr: /\bGORD\b/gi, expand: 'gastro-oesophageal reflux disease' },
  { abbr: /\bLRTI\b/gi, expand: 'acute lower respiratory infection' },
  { abbr: /\bURTI\b/gi, expand: 'acute upper respiratory infection' },
  { abbr: /\bPUD\b/gi, expand: 'peptic ulcer disease' },
  { abbr: /\bCAD\b/gi, expand: 'ischaemic heart disease' },
  { abbr: /\bIHD\b/gi, expand: 'ischaemic heart disease' },
  { abbr: /\bAFIB\b/gi, expand: 'atrial fibrillation' },
  { abbr: /\bAF\b/gi, expand: 'atrial fibrillation' },
  { abbr: /\bDVT\b/gi, expand: 'deep vein thrombosis' },
  { abbr: /\bPE\b/gi, expand: 'pulmonary embolism' },
  { abbr: /\bCVA\b/gi, expand: 'cerebral infarction stroke' },
  { abbr: /\bAKI\b/gi, expand: 'acute kidney failure' },
  { abbr: /\bCAP\b/gi, expand: 'community acquired pneumonia' },
  { abbr: /\bNS1(?:\s*antigen)?\b/gi, expand: 'dengue' },
];

export function expandAbbreviations(text: string): string {
  let expanded = text;
  for (const { abbr, expand } of ABBREVIATIONS) {
    expanded = expanded.replace(abbr, expand);
  }
  return expanded;
}

// ============================================================================
// 3. CLINICAL NORMALIZATION (British vs American spelling, Stemming & Stopwords)
// ============================================================================

const SPELLING_MAP: [RegExp, string][] = [
  [/\banemia\b/g, 'anaemia'],
  [/\banemic\b/g, 'anaemic'],
  [/\bdiarrhea\b/g, 'diarrhoea'],
  [/\bhemorrhage\b/g, 'haemorrhage'],
  [/\bhemorrhagic\b/g, 'haemorrhagic'],
  [/\bedema\b/g, 'oedema'],
  [/\besophagus\b/g, 'oesophagus'],
  [/\besophageal\b/g, 'oesophageal'],
  [/\bischemia\b/g, 'ischaemia'],
  [/\bischemic\b/g, 'ischaemic'],
  [/\bleukemia\b/g, 'leukaemia'],
  [/\btumor\b/g, 'tumour'],
  [/\btumors\b/g, 'tumours'],
  [/\bpediatric\b/g, 'paediatric'],
  [/\bdyspnea\b/g, 'dyspnoea'],
  [/\borthopedic\b/g, 'orthopaedic'],
];

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'with', 'for', 'at', 'by',
  'from', 'to', 'is', 'was', 'are', 'were', 'has', 'had', 'have', 'been',
  'patient', 'pt', 'history', 'hx', 'presented', 'presents', 'presenting',
  'year', 'years', 'old', 'yo', 'male', 'female', 'man', 'woman', 'admitted',
  'complaining', 'complains', 'noted', 'found', 'part', 'due'
]);

function normalizeWord(word: string): string {
  let w = word.toLowerCase();
  for (const [re, rep] of SPELLING_MAP) {
    w = w.replace(re, rep);
  }
  if (w.endsWith('ies') && w.length > 5) {
    w = w.slice(0, -3) + 'y';
  } else if (w.endsWith('es') && w.length > 4 && !w.endsWith('ses')) {
    w = w.slice(0, -2);
  } else if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) {
    w = w.slice(0, -1);
  }
  return w;
}

export function tokenize(text: string): string[] {
  let clean = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  for (const [re, rep] of SPELLING_MAP) {
    clean = clean.replace(re, rep);
  }
  const words = clean.split(/[\s-]+/).filter(Boolean);
  return words
    .map((w) => normalizeWord(w))
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function extractCoreTokens(title: string): Set<string> {
  const withoutParens = title.replace(/\([^)]*\)/g, ' ');
  const stripped = withoutParens
    .replace(/^other\s+/i, '')
    .replace(/\bother\s+/gi, '')
    .replace(/,\s*(?:other\s+and\s+)?unspecified.*$/i, '')
    .replace(/,\s*site\s+not\s+specified.*$/i, '')
    .replace(/,\s*part\s+unspecified.*$/i, '')
    .replace(/,\s*without\s+complications?.*$/i, '')
    .replace(/,\s*not\s+elsewhere\s+classified.*$/i, '')
    .replace(/\bNOS\b/g, '');

  return new Set(tokenize(stripped));
}

function hasInjuryOrAccidentContext(text: string): boolean {
  return /\b(?:injury|injuries|fracture|fractures|accident|trauma|fall|wound|assault|collision|crash|burn|poisoning|bite|stung|dislocation|sprain)\b/i.test(
    text
  );
}

function hasNeoplasmContext(text: string): boolean {
  return /\b(?:neoplasm|neoplasms|neoplastic|tumor|tumour|tumors|tumours|cancer|cancers|carcinoma|carcinomas|sarcoma|sarcomas|malignant|malignancy|malignancies|benign|adenoma|adenomas|melanoma|leukemia|leukaemia|lymphoma|lymphomas|metastasis|metastases|metastatic|myeloma|mass|oncology)\b/i.test(
    text
  );
}

// ============================================================================
// 4. COMBINATION RULES TABLE
// Condition A + Condition B -> Combined Code, hiding separate uncombined codes.
// Easily add new rows here without modifying matching logic.
// ============================================================================

export const COMBINATION_RULES: CombinationRule[] = [
  // 1. Diabetes + CKD / Renal Disease
  {
    id: 'dm2_renal',
    name: 'Type 2 Diabetes with Renal Complication',
    matchA: (codes, text) => codes.some((c) => c.startsWith('E11')) || /\btype\s*2\s*diabetes|t2dm|dm2\b/i.test(text),
    matchB: (codes, text) => codes.some((c) => c.startsWith('N18') || c.startsWith('N08')) || /\bchronic\s*kidney\s*disease|ckd|renal\s*failure|nephropathy\b/i.test(text),
    combinedCodes: [
      { code: 'E11.2', strength: 'High', daggerAsterisk: 'dagger', reason: 'Type 2 diabetes mellitus with renal complications (WHO dagger code)' },
      { code: 'N08.3', strength: 'High', daggerAsterisk: 'asterisk', reason: 'Glomerular disorders in diabetes mellitus (WHO asterisk partner to E11.2†)' }
    ],
    hideCodes: ['E11.9', 'N18.9', 'N08', 'E11']
  },
  {
    id: 'dm1_renal',
    name: 'Type 1 Diabetes with Renal Complication',
    matchA: (codes, text) => codes.some((c) => c.startsWith('E10')) || /\btype\s*1\s*diabetes|t1dm|dm1\b/i.test(text),
    matchB: (codes, text) => codes.some((c) => c.startsWith('N18') || c.startsWith('N08')) || /\bchronic\s*kidney\s*disease|ckd|renal\s*failure|nephropathy\b/i.test(text),
    combinedCodes: [
      { code: 'E10.2', strength: 'High', daggerAsterisk: 'dagger', reason: 'Type 1 diabetes mellitus with renal complications (WHO dagger code)' },
      { code: 'N08.3', strength: 'High', daggerAsterisk: 'asterisk', reason: 'Glomerular disorders in diabetes mellitus (WHO asterisk partner to E10.2†)' }
    ],
    hideCodes: ['E10.9', 'N18.9', 'N08', 'E10']
  },

  // 2. Diabetes + Eye / Retinopathy
  {
    id: 'dm2_eye',
    name: 'Type 2 Diabetes with Ophthalmic Complication',
    matchA: (codes, text) => codes.some((c) => c.startsWith('E11')) || /\btype\s*2\s*diabetes|t2dm|dm2\b/i.test(text),
    matchB: (codes, text) => codes.some((c) => c.startsWith('H36')) || /\bretinopathy|maculopathy|cataract\b/i.test(text),
    combinedCodes: [
      { code: 'E11.3', strength: 'High', daggerAsterisk: 'dagger', reason: 'Type 2 diabetes mellitus with ophthalmic complications (WHO dagger code)' },
      { code: 'H36.0', strength: 'High', daggerAsterisk: 'asterisk', reason: 'Diabetic retinopathy (WHO asterisk partner to E11.3†)' }
    ],
    hideCodes: ['E11.9', 'E11']
  },

  // 3. Diabetes + Neuropathy
  {
    id: 'dm2_neuro',
    name: 'Type 2 Diabetes with Neurological Complication',
    matchA: (codes, text) => codes.some((c) => c.startsWith('E11')) || /\btype\s*2\s*diabetes|t2dm|dm2\b/i.test(text),
    matchB: (codes, text) => codes.some((c) => c.startsWith('G63') || c.startsWith('G62')) || /\bpolyneuropathy|peripheral\s*neuropathy\b/i.test(text),
    combinedCodes: [
      { code: 'E11.4', strength: 'High', daggerAsterisk: 'dagger', reason: 'Type 2 diabetes mellitus with neurological complications' },
      { code: 'G63.2', strength: 'High', daggerAsterisk: 'asterisk', reason: 'Diabetic polyneuropathy (WHO asterisk partner to E11.4†)' }
    ],
    hideCodes: ['E11.9', 'G62.9', 'E11']
  },

  // 4. Diabetes + Foot / Arthropathy
  {
    id: 'dm2_foot',
    name: 'Type 2 Diabetes with Foot / Arthropathy Complication',
    matchA: (codes, text) => codes.some((c) => c.startsWith('E11')) || /\btype\s*2\s*diabetes|t2dm|dm2\b/i.test(text),
    matchB: (codes, text) => codes.some((c) => c.startsWith('M14')) || /\bdiabetic\s*foot|neuropathic\s*arthropathy|charcot\b/i.test(text),
    combinedCodes: [
      { code: 'E11.6', strength: 'High', daggerAsterisk: 'dagger', reason: 'Type 2 diabetes mellitus with other specified complications (diabetic foot/arthropathy)' },
      { code: 'M14.2', strength: 'High', daggerAsterisk: 'asterisk', reason: 'Diabetic arthropathy (WHO asterisk partner to E11.6†)' }
    ],
    hideCodes: ['E11.9', 'E11']
  },

  // 5. Hypertension + Heart Disease (Heart Failure)
  {
    id: 'htn_heart_failure',
    name: 'Hypertensive Heart Disease with Heart Failure',
    matchA: (codes, text) => codes.includes('I10') || /\bhypertension|essential\s*hypertension|high\s*blood\s*pressure\b/i.test(text),
    matchB: (codes, text) => codes.some((c) => c.startsWith('I50')) || /\bheart\s*failure|congestive\s*heart\s*failure|chf\b/i.test(text),
    combinedCodes: [
      { code: 'I11.0', strength: 'High', reason: 'Hypertensive heart disease with (congestive) heart failure (WHO combination code)' },
      { code: 'I50.0', strength: 'High', reason: 'Congestive heart failure' }
    ],
    hideCodes: ['I10']
  },

  // 6. Hypertension + Chronic Kidney Disease (when documented as hypertensive renal disease)
  {
    id: 'htn_ckd',
    name: 'Hypertensive Renal Disease',
    matchA: (codes, text) => codes.includes('I10') || /\bhypertension\b/i.test(text),
    matchB: (codes, text) => /\bhypertensive\s*(?:renal|nephropathy|kidney)\b/i.test(text),
    combinedCodes: [
      { code: 'I12.0', strength: 'High', reason: 'Hypertensive renal disease with renal failure' }
    ],
    hideCodes: ['I10', 'N18.9']
  },

  // 7. COPD + Acute Lower Respiratory Infection
  {
    id: 'copd_infection',
    name: 'COPD with Acute Lower Respiratory Infection',
    matchA: (codes, text) => codes.some((c) => c.startsWith('J44')) || /\bchronic\s*obstructive\s*pulmonary\s*disease|copd\b/i.test(text),
    matchB: (codes, text) => codes.includes('J22') || /\bacute\s*lower\s*respiratory\s*infection|lrti\b/i.test(text),
    combinedCodes: [
      { code: 'J44.0', strength: 'High', reason: 'Chronic obstructive pulmonary disease with acute lower respiratory infection' },
      { code: 'J22', strength: 'High', reason: 'Unspecified acute lower respiratory infection (additional code)' }
    ],
    hideCodes: ['J44.9', 'J44.1']
  },

  // 8. COPD + Asthma
  {
    id: 'copd_asthma',
    name: 'COPD with Asthma (Chronic Obstructive Asthma)',
    matchA: (codes, text) => codes.some((c) => c.startsWith('J44')) || /\bchronic\s*obstructive\s*pulmonary\s*disease|copd\b/i.test(text),
    matchB: (codes, text) => codes.some((c) => c.startsWith('J45')) || /\basthma|bronchial\s*asthma\b/i.test(text),
    combinedCodes: [
      { code: 'J44.8', strength: 'High', reason: 'Other specified chronic obstructive pulmonary disease (includes chronic asthmatic bronchitis)' }
    ],
    hideCodes: ['J44.9', 'J45.9', 'J45.0']
  },

  // 9. Tuberculosis + Sputum / Microscopy Confirmation
  {
    id: 'tb_confirmed',
    name: 'Tuberculosis of lung, confirmed by sputum microscopy',
    matchA: (codes, text) => codes.some((c) => c.startsWith('A15') || c.startsWith('A16')) || /\btuberculosis|tb\b/i.test(text),
    matchB: (codes, text) => /\bsputum(?:\s*afb|\s*microscopy|\s*smear)?|confirmed\s*by\s*sputum|microscopy\s*positive\b/i.test(text),
    combinedCodes: [
      { code: 'A15.0', strength: 'High', reason: 'Tuberculosis of lung, confirmed by sputum microscopy with or without culture' }
    ],
    hideCodes: ['A16.2', 'A16.9', 'A15.9']
  },

  // 10. Pregnancy + Diabetes
  {
    id: 'pregnancy_dm2',
    name: 'Pre-existing Type 2 Diabetes in Pregnancy',
    matchA: (codes, text) => /\bpregnan(?:cy|t)|gestat|primigravida|multigravida\b/i.test(text),
    matchB: (codes, text) => codes.some((c) => c.startsWith('E11')) || /\btype\s*2\s*diabetes|t2dm|dm2\b/i.test(text),
    combinedCodes: [
      { code: 'O24.1', strength: 'High', reason: 'Pre-existing type 2 diabetes mellitus in pregnancy' }
    ],
    hideCodes: ['E11.9', 'E11']
  },
  {
    id: 'pregnancy_gestational_dm',
    name: 'Gestational Diabetes Mellitus',
    matchA: (codes, text) => /\bpregnan(?:cy|t)|gestat|trimester\b/i.test(text),
    matchB: (codes, text) => /\bgestational\s*diabetes|diabetes\s*in\s*pregnancy\b/i.test(text),
    combinedCodes: [
      { code: 'O24.4', strength: 'High', reason: 'Diabetes mellitus arising in pregnancy' }
    ],
    hideCodes: ['E11.9', 'E14.9']
  },

  // 11. Pregnancy + Essential Hypertension
  {
    id: 'pregnancy_htn',
    name: 'Pre-existing Essential Hypertension in Pregnancy',
    matchA: (codes, text) => /\bpregnan(?:cy|t)|gestat|primigravida\b/i.test(text),
    matchB: (codes, text) => codes.includes('I10') || /\bessential\s*hypertension|chronic\s*hypertension\b/i.test(text),
    combinedCodes: [
      { code: 'O10.0', strength: 'High', reason: 'Pre-existing essential hypertension complicating pregnancy, childbirth and the puerperium' }
    ],
    hideCodes: ['I10']
  }
];

// ============================================================================
// 5. HAND-WRITTEN HIGH-PRIORITY RULES
// ============================================================================

interface HandWrittenRule {
  id: string;
  patterns: RegExp[];
  codes: {
    code: string;
    strength: 'High' | 'Medium' | 'Low';
    daggerAsterisk?: 'dagger' | 'asterisk' | null;
    reason: string;
  }[];
}

const HANDWRITTEN_RULES: HandWrittenRule[] = [
  {
    id: 't2dm_renal',
    patterns: [
      /\b(?:type\s*2\s*diabetes|t2dm|dm2)[^.;\n]{0,100}\b(?:chronic\s*kidney\s*disease|ckd|renal\s*failure|nephropathy)/i,
      /\b(?:chronic\s*kidney\s*disease|ckd|renal\s*failure|nephropathy)[^.;\n]{0,100}\b(?:type\s*2\s*diabetes|t2dm|dm2)/i,
    ],
    codes: [
      { code: 'E11.2', strength: 'High', daggerAsterisk: 'dagger', reason: 'Type 2 diabetes mellitus with renal complications' },
      { code: 'N08.3', strength: 'High', daggerAsterisk: 'asterisk', reason: 'Glomerular disorders in diabetes mellitus (paired with E11.2†)' }
    ]
  },
  {
    id: 'htn_hf',
    patterns: [
      /\b(?:hypertensive\s*heart\s*disease|hypertension|htn)[^.;\n]{0,60}\b(?:congestive\s*heart\s*failure|heart\s*failure|chf)\b/i,
      /\b(?:congestive\s*heart\s*failure|heart\s*failure|chf)[^.;\n]{0,60}\b(?:hypertensive\s*heart\s*disease|hypertension)\b/i,
    ],
    codes: [
      { code: 'I11.0', strength: 'High', reason: 'Hypertensive heart disease with (congestive) heart failure' }
    ]
  },
  {
    id: 'copd_inf',
    patterns: [
      /\b(?:chronic\s*obstructive\s*pulmonary\s*disease|copd)[^.;\n]{0,80}\b(?:acute\s*lower\s*respiratory\s*infection|lrti)\b/i,
      /\b(?:acute\s*lower\s*respiratory\s*infection|lrti)[^.;\n]{0,80}\b(?:chronic\s*obstructive\s*pulmonary\s*disease|copd)\b/i,
    ],
    codes: [
      { code: 'J44.0', strength: 'High', reason: 'Chronic obstructive pulmonary disease with acute lower respiratory infection' },
      { code: 'J22', strength: 'High', reason: 'Unspecified acute lower respiratory infection (additional code)' }
    ]
  },
  {
    id: 'ge_dehyd',
    patterns: [
      /\b(?:acute\s*diarrhoea|acute\s*diarrhea|gastroenteritis)[^.;\n]{0,60}\b(?:presumed\s*infectious|infectious\s*origin)\b/i,
    ],
    codes: [
      { code: 'A09.0', strength: 'High', reason: 'Other and unspecified gastroenteritis and colitis of infectious origin' }
    ]
  },
  {
    id: 'dengue_classic',
    patterns: [
      /\b(?:dengue\s*without\s*warning\s*signs|classical\s*dengue|uncomplicated\s*dengue)\b/i,
      /\b(?:dengue|ns1(?:\s*antigen)?\s*(?:is\s*)?positive)\b/i,
    ],
    codes: [
      { code: 'A97.0', strength: 'High', reason: 'Dengue without warning signs' }
    ]
  }
];

// ============================================================================
// 6. IN-MEMORY CODE INDEXING
// ============================================================================

interface IndexedCode {
  code: string;
  title: string;
  parent: string | null;
  parentTitle: string;
  fullTitle: string;
  includes: string[];
  isLeaf: boolean;
  isOptionalSubdivision: boolean;
  chapter: string;
  coreTitleTokens: Set<string>;
  fullTitleTokens: Set<string>;
  includesTokensList: Set<string>[];
  hasOnlyOptionalChildren: boolean;
}

let cachedIndexedCodes: IndexedCode[] | null = null;
let cachedCodeMap: Map<string, IcdCode> | null = null;

function getIndexedCodes(allCodes: IcdCode[]): { indexList: IndexedCode[]; codeLookup: Map<string, IcdCode> } {
  if (cachedIndexedCodes && cachedCodeMap) {
    return { indexList: cachedIndexedCodes, codeLookup: cachedCodeMap };
  }

  const lookup = new Map<string, IcdCode>();
  for (const c of allCodes) {
    lookup.set(c.code.toUpperCase(), c);
  }

  const parentChildCount = new Map<string, number>();
  const parentNonOptionalChildCount = new Map<string, number>();

  for (const c of allCodes) {
    if (c.parent) {
      parentChildCount.set(c.parent, (parentChildCount.get(c.parent) || 0) + 1);
      if (!c.isOptionalSubdivision) {
        parentNonOptionalChildCount.set(c.parent, (parentNonOptionalChildCount.get(c.parent) || 0) + 1);
      }
    }
  }

  const indexList: IndexedCode[] = [];
  for (const c of allCodes) {
    const parentObj = c.parent ? lookup.get(c.parent.toUpperCase()) : null;
    const parentTitle = parentObj ? parentObj.title : '';
    const fullTitle = parentTitle ? `${parentTitle} ${c.title}` : c.title;

    const coreTitleTokens = extractCoreTokens(c.title);
    const fullTitleTokens = new Set(tokenize(fullTitle));
    const includesTokensList = (c.includes || []).map((inc) => extractCoreTokens(inc));

    const hasChildren = (parentChildCount.get(c.code) || 0) > 0;
    const hasNonOptChildren = (parentNonOptionalChildCount.get(c.code) || 0) > 0;
    const hasOnlyOptionalChildren = hasChildren && !hasNonOptChildren;

    indexList.push({
      code: c.code,
      title: c.title,
      parent: c.parent,
      parentTitle,
      fullTitle,
      includes: c.includes || [],
      isLeaf: c.isLeaf,
      isOptionalSubdivision: Boolean(c.isOptionalSubdivision),
      chapter: c.chapter,
      coreTitleTokens,
      fullTitleTokens,
      includesTokensList,
      hasOnlyOptionalChildren,
    });
  }

  cachedIndexedCodes = indexList;
  cachedCodeMap = lookup;
  return { indexList, codeLookup: lookup };
}

// ============================================================================
// 7. DOCUMENTATION QUERIES & EXCLUDES CONFLICT CHECKERS
// ============================================================================

export function checkDocumentationQueries(text: string, suggestedCodes: string[]): DocumentationQuery[] {
  const queries: DocumentationQuery[] = [];
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
      suggestedAction:
        'Query physician to clarify whether the patient has Type 1 (E10.-) or Type 2 (E11.-) diabetes mellitus before assigning final billing code.',
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
      suggestedAction:
        'Review renal function panel (eGFR) or query clinician for CKD stage (Stage 1 to 5, N18.1–N18.5) to avoid unspecified code N18.9.',
      potentialCodes: ['N18.1', 'N18.2', 'N18.3', 'N18.4', 'N18.5'],
    });
  }

  // 3. Gastroenteritis without identified organism
  if (suggestedCodes.includes('A09.0') || suggestedCodes.includes('A09.9')) {
    const mentionsOrganism = /\b(?:salmonella|shigella|campylobacter|rotavirus|e\.?\s*coli|amoeba|cholera)\b/i.test(
      lowerText
    );
    if (!mentionsOrganism) {
      queries.push({
        id: 'doc_query_gastro_pathogen',
        condition: 'Infectious Gastroenteritis Causative Organism',
        query: 'Presumed infectious gastroenteritis without identified pathogen.',
        suggestedAction:
          'Check stool culture, hanging drop, or viral PCR. If a specific causative organism is confirmed (e.g. Salmonella A02.-, Rotavirus A08.0), assign specific infectious category.',
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
      suggestedAction:
        'Query clinician whether peripheral polyneuropathy is a manifestation of diabetes mellitus before assigning combination codes E11.4† and G63.2*.',
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
      suggestedAction:
        'Query physician whether the chronic kidney disease is due to hypertension. If it is, assign category I12 (Hypertensive renal disease, e.g. I12.0) instead of I10.',
      potentialCodes: ['I12.0', 'I12.9', 'I10'],
    });
  }

  return queries;
}

export function checkExcludesConflicts(suggested: CodeSuggestion[]): ExcludesConflict[] {
  const conflicts: ExcludesConflict[] = [];
  const codeSet = new Set(suggested.map((s) => s.code));

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
          if (!conflicts.some((c) => c.codeA === s1.code && c.codeB === s2.code)) {
            conflicts.push({
              codeA: s1.code,
              codeB: s2.code,
              ruleText: `${s1.code} (${s1.title}) Excludes note: "${exc}"`,
              recommendation: `Verify whether ${s1.code} should be omitted because ${s2.code} represents the definitive/combination condition.`,
            });
          }
        }
      }
    }
  }

  // Known WHO combination exclusion: I10 excluded when I11.- is diagnosed
  if (codeSet.has('I10') && (codeSet.has('I11.0') || codeSet.has('I11.9') || codeSet.has('I11'))) {
    if (!conflicts.some((c) => c.codeA === 'I10' && c.codeB.startsWith('I11'))) {
      conflicts.push({
        codeA: 'I10',
        codeB: codeSet.has('I11.0') ? 'I11.0' : 'I11.9',
        ruleText:
          'WHO ICD-10 Rule: Essential hypertension (I10) is excluded when hypertension with heart disease (I11.-) is diagnosed.',
        recommendation:
          'Remove I10 from accepted list. Assign I11.0 (Hypertensive heart disease with heart failure) instead.',
      });
    }
  }

  return conflicts;
}

// ============================================================================
// 8. MAIN AUTOMATIC CODE SUGGESTION ENGINE
// ============================================================================

export function generateSuggestions(
  reportText: string,
  allCodes: IcdCode[],
  options: {
    includeOptionalSubdivisions?: boolean;
    maxSuggestions?: number;
  } = {}
): SuggestionResult {
  const { includeOptionalSubdivisions = false, maxSuggestions = 14 } = options;
  const { indexList, codeLookup } = getIndexedCodes(allCodes);

  const expandedText = expandAbbreviations(reportText);
  const negatedSpans = detectNegations(reportText);
  const candidateMap = new Map<string, CodeSuggestion>();

  // A. Run Hand-written rules first (top priority)
  for (const rule of HANDWRITTEN_RULES) {
    for (const pat of rule.patterns) {
      const match = pat.exec(expandedText);
      if (match) {
        if (isRangeNegated(match.index, match.index + match[0].length, negatedSpans)) continue;
        for (const item of rule.codes) {
          const cData = codeLookup.get(item.code);
          if (cData) {
            candidateMap.set(item.code, {
              ...cData,
              evidence: {
                matchedText: match[0].trim(),
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                matchStrength: item.strength,
                matchReason: item.reason,
              },
              daggerAsterisk: item.daggerAsterisk || null,
              score: 1.0,
            });
          }
        }
        break;
      }
    }
  }

  // B. Run Generic Search across ALL codes in data file
  const clauseRegex = /[^,;.\n]+[,;.\n]?/g;
  let clauseMatch: RegExpExecArray | null;

  while ((clauseMatch = clauseRegex.exec(expandedText)) !== null) {
    const clause = clauseMatch[0].trim();
    const clauseStart = clauseMatch.index;
    const clauseEnd = clauseStart + clause.length;

    if (isRangeNegated(clauseStart, clauseEnd, negatedSpans)) {
      continue;
    }

    const clauseTokens = tokenize(clause);
    if (clauseTokens.length === 0) continue;
    const clauseTokenSet = new Set(clauseTokens);

    for (const c of indexList) {
      // Skip optional subdivisions unless enabled
      if (c.isOptionalSubdivision && !includeOptionalSubdivisions) continue;

      // Skip Chapter XX (External causes V01-Y98) unless report mentions injury/trauma
      if (c.chapter === 'XX' && !hasInjuryOrAccidentContext(expandedText)) continue;

      // Skip Chapter II (Neoplasms C00-D48) unless report/clause mentions tumor, cancer, mass, etc.
      if (c.chapter === 'II' && !hasNeoplasmContext(clause)) continue;

      // 1. Direct includes match
      let matchedInclude: Set<string> | null = null;
      for (const incTokens of c.includesTokensList) {
        if (incTokens.size >= 1 && Array.from(incTokens).every((t) => clauseTokenSet.has(t))) {
          matchedInclude = incTokens;
          break;
        }
      }

      // 2. Direct title match using core tokens
      const coreTokens = c.coreTitleTokens;
      let titleMatch = false;
      if (coreTokens.size >= 1 && Array.from(coreTokens).every((t) => clauseTokenSet.has(t))) {
        titleMatch = true;
      }

      // 3. Parent + Title combination (e.g. Type 2 diabetes mellitus + Without complications)
      let fullTitleMatch = false;
      if (!titleMatch && !matchedInclude && c.parentTitle) {
        const parentCore = extractCoreTokens(c.parentTitle);
        if (parentCore.size >= 2 && Array.from(parentCore).every((t) => clauseTokenSet.has(t))) {
          const titleLower = c.title.toLowerCase().trim();
          if (
            c.code.endsWith('.9') ||
            titleLower === 'unspecified' ||
            titleLower.endsWith(', unspecified') ||
            titleLower.includes('without complication')
          ) {
            fullTitleMatch = true;
          }
        }
      }

      if (titleMatch || matchedInclude || fullTitleMatch) {
        let score = 0.7;
        let reason = `Generic match on title: "${c.title}"`;

        if (matchedInclude) {
          score = 0.95;
          reason = `Matched alternative clinical term: "${c.title}"`;
        } else if (titleMatch) {
          score = 0.85 + coreTokens.size * 0.05;
          reason = `Direct match on official title: "${c.title}"`;
        } else if (fullTitleMatch) {
          score = 0.8;
          reason = `Default leaf for "${c.parentTitle}": "${c.title}"`;
        }

        // Avoid preferring .8 (other) over .9 (unspecified)
        if (c.code.endsWith('.8')) {
          score -= 0.05;
        }

        const existing = candidateMap.get(c.code);
        if (!existing || score > (existing.score || 0)) {
          const rawCode = codeLookup.get(c.code);
          if (rawCode) {
            candidateMap.set(c.code, {
              ...rawCode,
              evidence: {
                matchedText: clause,
                startIndex: clauseStart,
                endIndex: clauseEnd,
                matchStrength: score >= 0.85 ? 'High' : score >= 0.7 ? 'Medium' : 'Low',
                matchReason: reason,
              },
              score,
              daggerAsterisk: null,
            });
          }
        }
      }
    }
  }

  // C. Replace non-leaf parent categories with their default terminal leaf
  const defaultLeafMap: Record<string, string> = {
    E11: 'E11.9',
    E10: 'E10.9',
    E14: 'E14.9',
    K35: 'K35.8',
    J45: 'J45.9',
    B51: 'B51.9',
    S72: 'S72.9',
    G43: 'G43.9',
    D50: 'D50.9',
    I63: 'I63.9',
    A97: 'A97.0',
    K29: 'K29.7',
    N18: 'N18.9',
    M06: 'M06.9',
  };

  for (const [parentCode, leafCode] of Object.entries(defaultLeafMap)) {
    if (candidateMap.has(parentCode)) {
      const parentCandidate = candidateMap.get(parentCode)!;
      const hasSpecificChild = Array.from(candidateMap.keys()).some(
        (k) => k !== parentCode && k.startsWith(parentCode + '.')
      );
      if (!hasSpecificChild) {
        const rawLeaf = codeLookup.get(leafCode);
        if (rawLeaf) {
          candidateMap.set(leafCode, {
            ...rawLeaf,
            evidence: {
              ...parentCandidate.evidence,
              matchReason: `Most specific terminal code for ${parentCandidate.title}`,
            },
            score: parentCandidate.score || 0.85,
            daggerAsterisk: null,
          });
        }
      }
      candidateMap.delete(parentCode);
    }
  }

  // D. Disambiguate Diabetes Types: If Type 2 is explicitly matched, remove all E10 and E14 codes
  if (
    candidateMap.has('E11') ||
    candidateMap.has('E11.9') ||
    candidateMap.has('E11.2') ||
    candidateMap.has('E11.3') ||
    candidateMap.has('E11.4') ||
    candidateMap.has('E11.6')
  ) {
    for (const k of Array.from(candidateMap.keys())) {
      if (k.startsWith('E10') || k.startsWith('E14')) {
        candidateMap.delete(k);
      }
    }
  }

  // E. Apply Combination Rules
  const matchedCodesList = Array.from(candidateMap.keys());
  for (const comb of COMBINATION_RULES) {
    if (comb.matchA(matchedCodesList, expandedText) && comb.matchB(matchedCodesList, expandedText)) {
      for (const combItem of comb.combinedCodes) {
        const rawCode = codeLookup.get(combItem.code);
        if (rawCode) {
          candidateMap.set(combItem.code, {
            ...rawCode,
            evidence: {
              matchedText: expandedText.slice(0, 100),
              startIndex: 0,
              endIndex: Math.min(expandedText.length, 100),
              matchStrength: combItem.strength,
              matchReason: combItem.reason,
            },
            daggerAsterisk: combItem.daggerAsterisk || null,
            score: 1.0,
          });
        }
      }
      for (const hideCode of comb.hideCodes) {
        candidateMap.delete(hideCode);
      }
    }
  }

  // F. Specificity & Hierarchy Resolution within Families
  const allCandidates = Array.from(candidateMap.values());
  const finalCandidates: CodeSuggestion[] = [];

  for (const cand of allCandidates) {
    // 1. Never keep non-leaf parent category when specific child is matched
    const hasMoreSpecificChild = allCandidates.some(
      (o) => o.code !== cand.code && (o.parent === cand.code || o.code.startsWith(cand.code + '.'))
    );
    if (hasMoreSpecificChild) {
      continue;
    }

    // 2. Specific sibling resolution (e.g. K29.1 acute gastritis vs K29.6/K29.7)
    if (cand.code.endsWith('.7') || cand.code.endsWith('.8') || cand.code.endsWith('.9')) {
      const parentPrefix = cand.code.split('.')[0];
      const hasSpecificSibling = allCandidates.some(
        (o) =>
          o.code !== cand.code &&
          o.code.startsWith(parentPrefix + '.') &&
          !o.code.endsWith('.7') &&
          !o.code.endsWith('.8') &&
          !o.code.endsWith('.9')
      );
      if (hasSpecificSibling) {
        continue;
      }
    }

    // 3. Prefer .9 over .8 when both matched for unspecified condition
    if (cand.code.endsWith('.8')) {
      const dot9Code = cand.code.replace(/\.8$/, '.9');
      if (allCandidates.some((o) => o.code === dot9Code)) {
        continue;
      }
    }

    finalCandidates.push(cand);
  }

  // G. Filter Symptom Codes (Chapter XVIII / Chapter R) if a definitive diagnosis is present
  const hasDefinitiveDiagnosis = finalCandidates.some((c) => c.chapter !== 'XVIII');
  const filteredCandidates = finalCandidates.filter((c) => {
    if (c.chapter === 'XVIII' && hasDefinitiveDiagnosis) {
      return false;
    }
    return true;
  });

  // H. Filter Asterisk (*) codes if their Dagger (†) partner is missing
  const candidatesAfterAsteriskRule = filteredCandidates.filter((c) => {
    const isAsterisk = c.title.includes('*') || c.daggerAsterisk === 'asterisk';
    if (isAsterisk) {
      const hasDaggerPartner = filteredCandidates.some(
        (o) => o.daggerAsterisk === 'dagger' || o.title.includes('†')
      );
      if (!hasDaggerPartner) return false;
    }
    return true;
  });

  // I. Special Rule for Polyneuropathy without stated cause in diabetic patient
  const mentionsDiabetesText = /\b(?:type\s*2\s*diabetes|type\s*1\s*diabetes|t2dm|t1dm|dm2|dm1)\b/i.test(
    expandedText
  );
  const mentionsExplicitDiabeticNeuropathy = /\bdiabetic\s*(?:poly)?neuropathy\b/i.test(expandedText);
  if (mentionsDiabetesText && !mentionsExplicitDiabeticNeuropathy) {
    const e11_4 = candidatesAfterAsteriskRule.find((c) => c.code === 'E11.4');
    const g63_2 = candidatesAfterAsteriskRule.find((c) => c.code === 'G63.2');
    if (e11_4) {
      e11_4.evidence.matchStrength = 'Low';
      e11_4.evidence.matchReason = 'Is the polyneuropathy due to diabetes? (Physician clarification required)';
      e11_4.score = 0.5;
    }
    if (g63_2) {
      g63_2.evidence.matchStrength = 'Low';
      g63_2.evidence.matchReason = 'Is the polyneuropathy due to diabetes? (Physician clarification required)';
      g63_2.score = 0.5;
    }
  }

  // J. Special Rule for Hypertension with CKD
  const mentionsCKD = /\b(?:chronic\s*kidney\s*disease|ckd)\b/i.test(expandedText);
  const mentionsHTN = /\b(?:hypertension|essential\s*hypertension|htn)\b/i.test(expandedText);
  if (mentionsCKD && mentionsHTN) {
    const i10 = candidatesAfterAsteriskRule.find((c) => c.code === 'I10');
    if (i10) {
      i10.evidence.matchStrength = 'Medium';
      i10.evidence.matchReason =
        'Essential hypertension (Query clinician whether CKD is due to hypertension, in which case I12 applies)';
      i10.score = 0.75;
    }
  }

  // Sort by score & strength
  candidatesAfterAsteriskRule.sort((a, b) => {
    const order = { High: 3, Medium: 2, Low: 1 };
    const diff = order[b.evidence.matchStrength] - order[a.evidence.matchStrength];
    if (diff !== 0) return diff;
    return (b.score || 0) - (a.score || 0);
  });

  const sliced = candidatesAfterAsteriskRule.slice(0, maxSuggestions);
  const conflicts = checkExcludesConflicts(sliced);
  const docQueries = checkDocumentationQueries(
    reportText,
    sliced.map((s) => s.code)
  );

  return {
    suggestions: sliced,
    conflicts,
    docQueries,
    negatedSpans,
  };
}
