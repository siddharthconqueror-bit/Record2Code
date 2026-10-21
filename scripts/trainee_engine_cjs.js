const traineeCasesData = require('../data/trainee-cases.json');

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
  'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow', 'Kochi', 'Chandigarh',
  'Indore', 'Bhopal', 'Patna', 'Nagpur', 'Coimbatore', 'Surat',
  'Varanasi', 'Guwahati', 'Visakhapatnam', 'Thiruvananthapuram'
];

const HOSPITAL_TYPES = [
  'Government General Hospital',
  'District Civil Hospital',
  'Government Medical College Hospital',
  'Super Specialty Hospital',
  'Charitable Trust Hospital',
  'Urban Community Health Centre'
];

const GENERATOR_TEMPLATES = [
  {
    code: 'K35.8',
    difficulty: 'Beginner',
    title: 'Acute Appendicitis without Perforation',
    category: 'Gastroenterology / Surgery',
    minAge: 16,
    maxAge: 45,
    siblings: ['K35.2', 'K35.3', 'K36', 'K37'],
    distractors: ['R10.3', 'A09.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the casualty department of ${hospital} with acute right lower quadrant abdominal pain of ${duration} duration, accompanied by anorexia and low-grade pyrexia. Abdominal examination demonstrates localized tenderness at McBurney point with involuntary guarding. Grayscale ultrasound confirms an inflamed, aperistaltic vermiform appendix measuring 9.5 mm in outer diameter with no evidence of perforation, peritonitis, or appendicular abscess.`,
    rationale: 'K35.8 classifies other and unspecified acute appendicitis (acute appendicitis without perforation or peritonitis).',
    tip: 'When appendicitis presents without generalized peritonitis (K35.2) or localized peritonitis/abscess (K35.3), assign K35.8.'
  },
  {
    code: 'K29.1',
    difficulty: 'Beginner',
    title: 'Other Acute Gastritis',
    category: 'Gastroenterology',
    minAge: 25,
    maxAge: 65,
    siblings: ['K29.0', 'K29.7', 'K29.6', 'K29.5'],
    distractors: ['K25.0', 'R10.1'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} attending the gastroenterology clinic at ${hospital} in ${city} complains of acute epigastric burning pain, nausea, and dyspepsia for ${duration} following a course of prescription NSAIDs. Upper GI endoscopy reveals acute mucosal erythema and multiple superficial erosions confined to the gastric antrum, confirming acute gastritis.`,
    rationale: 'K29.1 represents other acute gastritis.',
    tip: 'Assign specific subcode K29.1 when endoscopy or clinical documentation specifies acute gastritis.'
  },
  {
    code: 'J45.9',
    difficulty: 'Beginner',
    title: 'Bronchial Asthma, Unspecified',
    category: 'Pulmonology',
    minAge: 18,
    maxAge: 55,
    siblings: ['J45.0', 'J45.1', 'J46', 'J44.9'],
    distractors: ['R05', 'J20.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the pulmonary outpatient clinic at ${hospital} with recurrent episodes of breathlessness, dry cough, and audible wheezing of ${duration} duration. Symptoms are typically exacerbated at night and upon exposure to dust. Spirometry demonstrates reversible airflow obstruction with post-bronchodilator improvement > 12%. Diagnosed with bronchial asthma.`,
    rationale: 'J45.9 classifies asthma, unspecified.',
    tip: 'When clinical records do not specify allergic or nonallergic etiology, assign J45.9.'
  },
  {
    code: 'I10',
    difficulty: 'Beginner',
    title: 'Essential (Primary) Hypertension',
    category: 'Cardiology',
    minAge: 35,
    maxAge: 70,
    siblings: ['I11.9', 'I12.9', 'I15.9', 'I13.9'],
    distractors: ['R03.0', 'I50.9'],
    noteBuilder: ({ age, sex, city, hospital }) =>
      `A ${age}-year-old ${sex} presents to the internal medicine clinic at ${hospital} in ${city} for an executive medical screening. Blood pressure consistently measures 152/96 mmHg over consecutive office visits. Diagnostic workup including renal function tests, urinalysis, and echocardiogram is unremarkable. Diagnosed with essential primary hypertension.`,
    rationale: 'I10 designates essential (primary) hypertension without secondary cause.',
    tip: 'Check I10 excludes notes: excludes hypertensive heart disease (I11) and hypertensive renal disease (I12).'
  },
  {
    code: 'B51.9',
    difficulty: 'Beginner',
    title: 'Plasmodium Vivax Malaria without Complications',
    category: 'Infectious Disease',
    minAge: 18,
    maxAge: 60,
    siblings: ['B50.9', 'B52.9', 'B54', 'B51.0'],
    distractors: ['A97.0', 'R50.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} presents to the acute fever ward at ${hospital} in ${city} with high fever, shaking chills, rigors, and drenching sweats of ${duration} duration. Rapid diagnostic antigen test and Giemsa-stained peripheral blood smear microscopy confirm Plasmodium vivax trophozoites. Falciparum antigen test is negative and no cerebral or vital organ complications are detected.`,
    rationale: 'B51.9 represents Plasmodium vivax malaria without complications.',
    tip: 'In WHO ICD-10, always verify the Plasmodium species before selecting between B50 (falciparum) and B51 (vivax).'
  },
  {
    code: 'A97.0',
    difficulty: 'Beginner',
    title: 'Dengue Fever without Warning Signs',
    category: 'Infectious Disease',
    minAge: 16,
    maxAge: 50,
    siblings: ['A97.1', 'A97.2', 'A97.9', 'A90'],
    distractors: ['B51.9', 'R50.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the casualty department at ${hospital} with acute high fever, retro-orbital headache, arthralgia, and myalgia of ${duration} duration during post-monsoon season. Laboratory workup confirms positive dengue NS1 antigen with platelet count of 152,000/mcL. Hematocrit is normal with no clinical warning signs of plasma leakage or shock.`,
    rationale: 'A97.0 designates dengue without warning signs.',
    tip: 'WHO ICD-10 classifies dengue under A97: A97.0 without warning signs, A97.1 with warning signs, and A97.2 severe dengue.'
  },
  {
    code: 'A01.0',
    difficulty: 'Beginner',
    title: 'Typhoid Fever',
    category: 'Infectious Disease',
    minAge: 14,
    maxAge: 48,
    siblings: ['A01.1', 'A01.2', 'A02.0', 'A09.9'],
    distractors: ['R50.9', 'K52.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} is admitted to ${hospital} with continuous remittent fever, malaise, headache, abdominal distension, and loose stools of ${duration} duration. Blood culture isolated Salmonella enterica serotype Typhi sensitive to ceftriaxone, confirming typhoid fever.`,
    rationale: 'A01.0 denotes typhoid fever due to Salmonella typhi.',
    tip: 'Paratyphoid fever is classified under A01.1 through A01.4; do not confuse with Salmonella typhi (A01.0).'
  },
  {
    code: 'D50.9',
    difficulty: 'Beginner',
    title: 'Iron Deficiency Anaemia, Unspecified',
    category: 'Hematology',
    gender: 'female',
    minAge: 20,
    maxAge: 45,
    siblings: ['D50.0', 'D50.8', 'D51.9', 'D64.9'],
    distractors: ['E61.1', 'R53'],
    noteBuilder: ({ age, city, hospital, duration }) =>
      `A ${age}-year-old female in ${city} presents to the outpatient clinic at ${hospital} complaining of progressive easy fatigability, exertional breathlessness, and dizziness of ${duration} duration. Physical examination shows marked conjunctival and palmar pallor. Complete blood count reveals Hb 7.4 g/dL, MCV 68 fL, MCH 22 pg, and serum ferritin of 5 ng/mL, confirming microcytic hypochromic iron deficiency anaemia.`,
    rationale: 'D50.9 classifies iron deficiency anaemia, unspecified.',
    tip: 'Use D50.9 when iron deficiency anaemia is diagnosed without specific documentation of chronic blood loss (D50.0).'
  },
  {
    code: 'S72.3',
    difficulty: 'Beginner',
    title: 'Fracture of Shaft of Femur',
    category: 'Orthopedics / Trauma',
    minAge: 20,
    maxAge: 65,
    siblings: ['S72.0', 'S72.1', 'S72.4', 'S72.9'],
    distractors: ['T14.2', 'M84.3'],
    noteBuilder: ({ age, sex, city, hospital }) =>
      `A ${age}-year-old ${sex} in ${city} is brought to the orthopedic emergency at ${hospital} following a motor vehicular accident. The patient has severe pain, swelling, and deformity of the right mid-thigh. Radiographs demonstrate an acute closed transverse fracture of the shaft of the right femur.`,
    rationale: 'S72.3 classifies fracture of shaft of femur.',
    tip: 'Subcategories of S72 define specific anatomical segments: neck (.0), pertrochanteric (.1), shaft (.3), lower end (.4).'
  },
  {
    code: 'N39.0',
    difficulty: 'Beginner',
    title: 'Urinary Tract Infection, Site Not Specified',
    category: 'Urology / Nephrology',
    gender: 'female',
    minAge: 20,
    maxAge: 55,
    siblings: ['N30.0', 'N30.9', 'N10', 'N12'],
    distractors: ['R30.0', 'B96.2'],
    noteBuilder: ({ age, city, hospital, duration }) =>
      `A ${age}-year-old female in ${city} visits the outpatient department at ${hospital} with burning micturition, increased urinary frequency, and lower abdominal discomfort of ${duration} duration. Urinalysis reveals numerous pus cells and midstream urine culture yields > 100,000 CFU/mL of Escherichia coli. Diagnosed with acute urinary tract infection.`,
    rationale: 'N39.0 is the specific WHO code for urinary tract infection, site not specified.',
    tip: 'Assign N39.0 when the infection involves the urinary tract without documented acute pyelonephritis (N10).'
  },
  {
    code: 'K80.0',
    difficulty: 'Intermediate',
    title: 'Calculus of Gallbladder with Acute Cholecystitis',
    category: 'Gastroenterology / Surgery',
    gender: 'female',
    minAge: 38,
    maxAge: 68,
    siblings: ['K80.1', 'K80.2', 'K81.0', 'K82.9'],
    distractors: ['R10.1', 'K85.9'],
    noteBuilder: ({ age, city, hospital, duration }) =>
      `A ${age}-year-old female in ${city} presents to the acute surgical unit at ${hospital} with severe right upper quadrant colic radiating to the back and right shoulder of ${duration} duration, accompanied by fever and vomiting. Positive Murphy sign on palpation. High-resolution abdominal sonography reveals multiple mobile gallstones with a 5.5-mm thickened gallbladder wall and pericholecystic edema, diagnosing acute calculous cholecystitis.`,
    rationale: 'K80.0 classifies calculus of gallbladder with acute cholecystitis.',
    tip: 'Use combination code K80.0 instead of separate dual codes for cholelithiasis and cholecystitis.'
  },
  {
    code: 'K85.9',
    difficulty: 'Beginner',
    title: 'Acute Pancreatitis, Unspecified',
    category: 'Gastroenterology',
    minAge: 25,
    maxAge: 60,
    siblings: ['K85.0', 'K85.1', 'K86.0', 'K86.1'],
    distractors: ['R10.1', 'K29.1'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the emergency room at ${hospital} with severe epigastric pain radiating through to the back of ${duration} duration, exacerbated when lying supine and partially relieved by leaning forward. Serum amylase is 840 U/L and serum lipase is 1280 U/L. Contrast-enhanced CT scan of the abdomen confirms acute interstitial pancreatitis.`,
    rationale: 'K85.9 represents acute pancreatitis, unspecified.',
    tip: 'Assign K85.9 when acute pancreatitis is diagnosed without specific alcohol or biliary subtype documented.'
  },
  {
    code: 'O14.9',
    difficulty: 'Intermediate',
    title: 'Pre-eclampsia, Unspecified',
    category: 'Obstetrics',
    gender: 'female',
    minAge: 22,
    maxAge: 36,
    siblings: ['O14.0', 'O14.1', 'O15.0', 'O13'],
    distractors: ['I10', 'O24.4'],
    noteBuilder: ({ age, city, hospital }) =>
      `A ${age}-year-old primigravida at 34 weeks of gestation in ${city} attends the antenatal clinic at ${hospital}. Physical examination reveals persistent resting blood pressure of 154/98 mmHg. Urinalysis demonstrates significant proteinuria (2+ on dipstick, protein-to-creatinine ratio 0.55). Complete blood count and liver transaminases are normal. Diagnosed with pre-eclampsia.`,
    rationale: 'O14.9 classifies pre-eclampsia, unspecified.',
    tip: 'Gestational hypertension with significant proteinuria meets the diagnostic criteria for pre-eclampsia (O14.-).'
  },
  {
    code: 'L03.1',
    difficulty: 'Beginner',
    title: 'Cellulitis of Limb (Lower Limb)',
    category: 'Dermatology',
    minAge: 28,
    maxAge: 72,
    siblings: ['L03.0', 'L03.8', 'L03.9', 'L02.4'],
    distractors: ['A46', 'I80.2'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} attends the outpatient clinic at ${hospital} with an acutely painful, warm, erythematous, and swollen area over the right pretibial lower leg of ${duration} duration. The rash has poorly demarcated margins and is accompanied by regional lymphadenopathy and low-grade pyrexia. Diagnosed with acute lower limb cellulitis.`,
    rationale: 'L03.1 classifies cellulitis of limb (including leg and arm).',
    tip: 'Category L03 classifies cellulitis by anatomical region; L03.1 is specifically designated for limbs.'
  },
  {
    code: 'H40.1',
    difficulty: 'Beginner',
    title: 'Primary Open-Angle Glaucoma',
    category: 'Ophthalmology',
    minAge: 48,
    maxAge: 75,
    siblings: ['H40.0', 'H40.2', 'H40.9', 'H42.0'],
    distractors: ['H25.9', 'H53.4'],
    noteBuilder: ({ age, sex, city, hospital }) =>
      `A ${age}-year-old ${sex} attending the ophthalmology OPD at ${hospital} in ${city} is found to have elevated intraocular pressures (26 mmHg in right eye, 27 mmHg in left eye). Fundus evaluation shows symmetrical bilateral optic disc cupping with cup-to-disc ratio of 0.75. Automated perimetry confirms visual field loss and gonioscopy confirms wide open anterior chamber angles. Diagnosed with primary open-angle glaucoma.`,
    rationale: 'H40.1 designates primary open-angle glaucoma.',
    tip: 'Primary angle-closure glaucoma is assigned to H40.2; primary open-angle glaucoma is H40.1.'
  },
  {
    code: 'L40.0',
    difficulty: 'Beginner',
    title: 'Psoriasis Vulgaris (Plaque Psoriasis)',
    category: 'Dermatology',
    minAge: 20,
    maxAge: 60,
    siblings: ['L40.1', 'L40.5', 'L40.8', 'L40.9'],
    distractors: ['L30.9', 'L20.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} presents to the dermatology clinic at ${hospital} in ${city} with chronic, well-demarcated erythematous plaques covered by coarse silvery-white scales distributed symmetrically over both extensor knees and elbows of ${duration} duration. Pinpoint bleeding is noted upon mechanical scraping of scales (positive Auspitz sign). Diagnosed with psoriasis vulgaris.`,
    rationale: 'L40.0 classifies psoriasis vulgaris (common plaque psoriasis).',
    tip: 'Differentiate common plaque psoriasis (L40.0) from generalized pustular psoriasis (L40.1).'
  },
  {
    code: 'H81.0',
    difficulty: 'Beginner',
    title: 'Meniere Disease',
    category: 'ENT / Otology',
    minAge: 32,
    maxAge: 65,
    siblings: ['H81.1', 'H81.3', 'H81.8', 'H81.9'],
    distractors: ['R42', 'H90.3'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the ENT consultation room at ${hospital} complaining of episodic true rotational vertigo lasting 2 to 4 hours per episode over the past ${duration}. The vertigo is characteristically accompanied by left-sided low-frequency tinnitus, fluctuating hearing loss, and a sensation of aural fullness in the affected ear. Diagnosed with Meniere disease.`,
    rationale: 'H81.0 specifically classifies Meniere disease (endolymphatic hydrops).',
    tip: 'Benign paroxysmal positional vertigo (BPPV) is classified under H81.1, while Meniere disease is H81.0.'
  },
  {
    code: 'M17.1',
    difficulty: 'Beginner',
    title: 'Other Primary Gonarthrosis (Osteoarthritis of Knee)',
    category: 'Orthopedics / Rheumatology',
    minAge: 52,
    maxAge: 78,
    siblings: ['M17.0', 'M17.2', 'M17.9', 'M16.1'],
    distractors: ['M25.5', 'M19.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the joint clinic at ${hospital} with deep aching right knee pain for ${duration}, aggravated by walking and stair-climbing and relieved by rest. Plain standing radiographs demonstrate medial joint space narrowing, subchondral sclerosis, and marginal osteophytosis diagnostic of unilateral primary osteoarthritis of the knee.`,
    rationale: 'M17.1 denotes other primary gonarthrosis (unilateral primary osteoarthritis of knee).',
    tip: 'Bilateral primary osteoarthritis of knee is coded to M17.0, whereas unilateral primary osteoarthritis is M17.1.'
  },
  {
    code: 'S06.0',
    difficulty: 'Beginner',
    title: 'Concussion',
    category: 'Neurology / Trauma',
    minAge: 16,
    maxAge: 50,
    siblings: ['S06.1', 'S06.2', 'S06.3', 'S06.9'],
    distractors: ['R40.2', 'S09.9'],
    noteBuilder: ({ age, sex, city, hospital }) =>
      `A ${age}-year-old ${sex} in ${city} is brought to ${hospital} casualty following a direct blow to the forehead during a sports match. The patient experienced a 3-minute loss of consciousness followed by headache, dizziness, and mild retrograde amnesia. Neurological examination is non-focal and non-contrast head CT scan shows no intracranial hemorrhage, contusion, or skull fracture. Diagnosed with concussion.`,
    rationale: 'S06.0 classifies concussion.',
    tip: 'Concussion (S06.0) is assigned when closed head trauma causes brief neurological dysfunction without intracranial mass lesion.'
  },
  {
    code: 'K21.0',
    difficulty: 'Beginner',
    title: 'Gastro-Oesophageal Reflux Disease with Oesophagitis',
    category: 'Gastroenterology',
    minAge: 30,
    maxAge: 68,
    siblings: ['K21.9', 'K20', 'K22.1', 'K29.7'],
    distractors: ['R12', 'I20.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the gastroenterology clinic at ${hospital} with frequent retrosternal burning distress and acid regurgitation of ${duration} duration, intensified by reclining after meals. Upper gastrointestinal endoscopy confirms mucosal breaks and linear erosions in the distal esophagus diagnostic of erosive reflux oesophagitis.`,
    rationale: 'K21.0 denotes gastro-oesophageal reflux disease with oesophagitis.',
    tip: 'Differentiate K21.0 (GERD with oesophagitis) from K21.9 (GERD without oesophagitis).'
  },
  {
    code: 'N10',
    difficulty: 'Beginner',
    title: 'Acute Tubulo-Interstitial Nephritis (Acute Pyelonephritis)',
    category: 'Nephrology',
    gender: 'female',
    minAge: 18,
    maxAge: 50,
    siblings: ['N11.9', 'N12', 'N39.0', 'N15.9'],
    distractors: ['R30.0', 'N28.8'],
    noteBuilder: ({ age, city, hospital, duration }) =>
      `A ${age}-year-old female in ${city} is admitted to ${hospital} with high spiking fever, shaking chills, nausea, and severe unilateral costovertebral flank pain of ${duration} duration. Urinalysis demonstrates significant leukocyturia, white cell casts, and bacteriuria, confirming acute pyelonephritis without obstruction.`,
    rationale: 'N10 is the WHO ICD-10 3-character code for acute tubulo-interstitial nephritis (acute pyelonephritis).',
    tip: 'Chronic pyelonephritis is coded under N11; acute non-obstructive pyelonephritis is assigned to N10.'
  },
  {
    code: 'N20.0',
    difficulty: 'Beginner',
    title: 'Calculus of Kidney (Nephrolithiasis)',
    category: 'Urology',
    minAge: 25,
    maxAge: 60,
    siblings: ['N20.1', 'N20.2', 'N20.9', 'N23'],
    distractors: ['R31', 'N13.2'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the emergency room at ${hospital} with sudden severe spasmodic right flank pain radiating towards the groin of ${duration} duration, accompanied by microscopic hematuria. Non-contrast spiral CT of the abdomen confirms a 6.5-mm radio-opaque calculus lodged in the right renal pelvis without ureteric obstruction.`,
    rationale: 'N20.0 specifically denotes calculus of kidney (nephrolithiasis).',
    tip: 'Calculus of kidney is coded to N20.0, whereas calculus of ureter is N20.1.'
  },
  {
    code: 'J18.1',
    difficulty: 'Beginner',
    title: 'Lobar Pneumonia, Unspecified',
    category: 'Pulmonology',
    minAge: 24,
    maxAge: 70,
    siblings: ['J18.0', 'J18.9', 'J15.9', 'J12.9'],
    distractors: ['J90', 'R07.1'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the casualty department of ${hospital} with high-grade pyrexia, shaking chills, pleuritic chest pain, and rust-colored sputum of ${duration} duration. Auscultation reveals bronchial breath sounds and crackles over the right hemithorax. Chest radiography reveals dense homogeneous lobar consolidation of the right lower lobe, confirming lobar pneumonia.`,
    rationale: 'J18.1 classifies lobar pneumonia, unspecified organism.',
    tip: 'When radiological examination documents lobar consolidation, select J18.1 rather than unspecified pneumonia (J18.9).'
  },
  {
    code: 'E03.9',
    difficulty: 'Beginner',
    title: 'Hypothyroidism, Unspecified',
    category: 'Endocrinology',
    gender: 'female',
    minAge: 28,
    maxAge: 65,
    siblings: ['E03.0', 'E03.1', 'E03.8', 'E06.3'],
    distractors: ['R53', 'E00.9'],
    noteBuilder: ({ age, city, hospital, duration }) =>
      `A ${age}-year-old female in ${city} visits the endocrine OPD at ${hospital} reporting progressive lethargy, weight gain of 6 kg, dry skin, constipation, and cold intolerance over the past ${duration}. Laboratory evaluation demonstrates a markedly elevated serum TSH of 24.5 mIU/L with reduced free T4 of 0.4 ng/dL. Diagnosed with primary hypothyroidism.`,
    rationale: 'E03.9 represents hypothyroidism, unspecified.',
    tip: 'Use E03.9 for acquired primary hypothyroidism when specific thyroiditis subtype is not documented.'
  },
  {
    code: 'F32.1',
    difficulty: 'Beginner',
    title: 'Moderate Depressive Episode',
    category: 'Psychiatry',
    minAge: 22,
    maxAge: 55,
    siblings: ['F32.0', 'F32.2', 'F32.9', 'F33.1'],
    distractors: ['F41.1', 'R45.3'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} attends the psychiatry consultation clinic at ${hospital} presenting with persistent depressed mood, loss of interest in all activities, early morning awakening, lack of energy, and feelings of worthlessness of ${duration} duration. The patient exhibits moderate difficulty in continuing ordinary work and social activities. Diagnosed with a single episode of moderate depression.`,
    rationale: 'F32.1 designates moderate depressive episode.',
    tip: 'Severity of depressive episodes in ICD-10 category F32 is stratified as mild (F32.0), moderate (F32.1), or severe (F32.2).'
  },
  {
    code: 'I20.0',
    difficulty: 'Beginner',
    title: 'Unstable Angina',
    category: 'Cardiology',
    minAge: 45,
    maxAge: 72,
    siblings: ['I20.1', 'I20.8', 'I20.9', 'I25.1'],
    distractors: ['I21.9', 'R07.2'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to the cardiac emergency unit at ${hospital} with retrosternal chest tightness occurring on minimal physical exertion and at rest of ${duration} duration. Baseline ECG reveals transient horizontal ST-segment depression in anterolateral leads, but high-sensitivity Troponin-I remains strictly negative over 6-hour serial testing. Diagnosed with unstable angina.`,
    rationale: 'I20.0 designates unstable angina (crescendo / rest angina).',
    tip: 'When myocardial necrosis is excluded by negative serial troponins, code unstable angina (I20.0) instead of acute MI (I21).'
  },
  {
    code: 'S52.5',
    difficulty: 'Beginner',
    title: 'Fracture of Lower End of Radius (Colles Fracture)',
    category: 'Orthopedics / Trauma',
    minAge: 35,
    maxAge: 76,
    siblings: ['S52.6', 'S52.0', 'S52.1', 'S52.9'],
    distractors: ['S62.0', 'T14.2'],
    noteBuilder: ({ age, sex, city, hospital }) =>
      `A ${age}-year-old ${sex} in ${city} arrives at ${hospital} casualty following a slip-and-fall accident landing on an outstretched hand. Physical exam reveals painful swelling and dinner-fork deformity of the right wrist. X-rays confirm a closed displaced fracture of the lower end of the right radius.`,
    rationale: 'S52.5 classifies fracture of lower end of radius.',
    tip: 'Category S52 classifies forearm fractures; S52.5 includes classic Colles and Smith fractures of the distal radius.'
  },
  {
    code: 'J47',
    difficulty: 'Beginner',
    title: 'Bronchiectasis',
    category: 'Pulmonology',
    minAge: 25,
    maxAge: 68,
    siblings: ['J44.9', 'J98.4', 'J45.9', 'J43.9'],
    distractors: ['A16.2', 'R05'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} presents to ${hospital} chest clinic with chronic cough and daily expectoration of copious mucopurulent sputum for ${duration}. The patient has clubbing of fingernails. High-resolution CT scan of the thorax reveals bronchial lumen dilatation greater than the adjacent pulmonary artery (signet-ring sign) and bronchial wall thickening, diagnostic of bronchiectasis.`,
    rationale: 'J47 is the WHO ICD-10 code for bronchiectasis.',
    tip: 'Category J47 is a 3-character terminal leaf code in WHO ICD-10.'
  },
  {
    code: 'P59.9',
    difficulty: 'Beginner',
    title: 'Neonatal Jaundice, Unspecified',
    category: 'Neonatology / Pediatrics',
    minAge: 1,
    maxAge: 7,
    siblings: ['P59.0', 'P59.3', 'P58.9', 'P55.1'],
    distractors: ['R17', 'B15.9'],
    noteBuilder: ({ age, city, hospital }) =>
      `A ${age}-day-old full-term male neonate at ${hospital} in ${city} is evaluated for visible yellowish discoloration of the face, conjunctiva, and upper chest. Total serum bilirubin is 13.2 mg/dL with unconjugated fraction of 12.4 mg/dL. Direct Coombs test is negative, blood group typing reveals no ABO or Rh incompatibility, and the infant is actively feeding. Diagnosed with uncomplicated physiological neonatal jaundice.`,
    rationale: 'P59.9 represents neonatal jaundice, unspecified.',
    tip: 'When neonatal jaundice is non-hemolytic and physiological, code to category P59.'
  },
  {
    code: 'I63.9',
    difficulty: 'Intermediate',
    title: 'Cerebral Infarction, Unspecified (Acute Ischemic Stroke)',
    category: 'Neurology',
    minAge: 50,
    maxAge: 80,
    siblings: ['I63.0', 'I63.3', 'I63.5', 'I64'],
    distractors: ['I61.9', 'G81.9'],
    noteBuilder: ({ age, sex, city, hospital, duration }) =>
      `A ${age}-year-old ${sex} in ${city} is brought to the acute stroke unit at ${hospital} with acute right-sided hemiplegia and expressive dysphasia of ${duration} duration. Non-contrast brain CT scan rules out intracranial haemorrhage, and brain diffusion-weighted MRI reveals an acute ischemic lesion in the left middle cerebral artery territory, diagnosing acute cerebral infarction.`,
    rationale: 'I63.9 classifies cerebral infarction, unspecified (acute ischemic stroke).',
    tip: 'Ensure intracranial hemorrhage (I61) is ruled out by neuroimaging before assigning cerebral infarction (I63).'
  }
];

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildCandidateOptions(correctCodes, siblings = [], distractors = []) {
  const result = new Set(correctCodes);

  // Add siblings
  const shuffledSiblings = shuffleArray(siblings.filter(s => !result.has(s)));
  for (const s of shuffledSiblings) {
    if (result.size < 5) {
      result.add(s);
    }
  }

  // Add distractors
  const defaultDistractors = ['I10', 'E11.9', 'J45.9', 'N39.0', 'K29.7', 'R50.9', 'B54', 'S72.9', 'D50.9', 'A09.9'];
  const pool = shuffleArray([...distractors, ...defaultDistractors].filter(d => !result.has(d)));
  for (const d of pool) {
    if (result.size < 6) {
      result.add(d);
    }
    if (result.size >= 5 && Math.random() > 0.4) break;
  }

  return shuffleArray(Array.from(result));
}

function getBankCases() {
  return traineeCasesData;
}

module.exports = {
  CITIES,
  HOSPITAL_TYPES,
  GENERATOR_TEMPLATES,
  shuffleArray,
  buildCandidateOptions,
  getBankCases
};
