const fs = require('fs');
const path = require('path');

const icdRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'icd10.json'), 'utf8');
const icdCodes = JSON.parse(icdRaw);
const codeMap = new Map(icdCodes.map(c => [c.code, c]));

// 65 authentic, highly detailed clinical cases from Indian hospitals across all required chapters & specialties
const rawCases = [
  // 1. DIABETES & COMBINATIONS (1-5)
  {
    id: 'tc_01',
    difficulty: 'Intermediate',
    title: 'Type 2 Diabetes with Diabetic Nephropathy',
    clinicalNote: 'A 62-year-old male from Jaipur with a 14-year history of Type 2 diabetes mellitus presents to the nephrology OPD with persistent heavy proteinuria (2.8 g/24h) and elevated serum creatinine of 2.6 mg/dL. Renal biopsy confirms Kimmelstiel-Wilson nodules, diagnostic of diabetic glomerulosclerosis secondary to type 2 diabetes.',
    correctCodes: ['E11.2', 'N08.3'],
    rationale: 'Dual coding required: E11.2 (etiology dagger) sequenced first, followed by N08.3 (manifestation asterisk) for diabetic nephropathy.',
    tip: 'In WHO ICD-10, always sequence the dagger (†) underlying etiology code before the asterisk (*) organ manifestation code.',
    candidates: ['E11.2', 'N08.3', 'E11.9', 'N18.9', 'I10', 'E10.2']
  },
  {
    id: 'tc_02',
    difficulty: 'Intermediate',
    title: 'Type 2 Diabetes with Nonproliferative Retinopathy',
    clinicalNote: 'A 56-year-old female from Delhi attending the diabetes clinic has fundus examination revealing bilateral microaneurysms, dot-and-blot haemorrhages, and hard exudates consistent with diabetic retinopathy due to long-standing type 2 diabetes.',
    correctCodes: ['E11.3', 'H36.0'],
    rationale: 'Diabetic retinopathy requires E11.3† as primary etiology and H36.0* as manifestation code.',
    tip: 'Never report H36.0* alone without its governing diabetes dagger code.',
    candidates: ['E11.3', 'H36.0', 'E11.9', 'H35.0', 'H25.9', 'E10.3']
  },
  {
    id: 'tc_03',
    difficulty: 'Intermediate',
    title: 'Type 2 Diabetes with Diabetic Polyneuropathy',
    clinicalNote: 'A 60-year-old male from Bengaluru with known type 2 diabetes presents with progressive bilateral symmetrical burning pain, tingling, and stocking-distribution sensory loss in lower limbs. Nerve conduction studies confirm diabetic polyneuropathy.',
    correctCodes: ['E11.4', 'G63.2'],
    rationale: 'Diabetic polyneuropathy is dual-coded: E11.4† for diabetes with neurological complications, followed by G63.2* for diabetic polyneuropathy.',
    tip: 'G63.2 is an asterisk code and cannot be used as primary diagnosis.',
    candidates: ['E11.4', 'G63.2', 'G62.9', 'E11.9', 'M79.2', 'E10.4']
  },
  {
    id: 'tc_04',
    difficulty: 'Intermediate',
    title: 'Type 2 Diabetes with Peripheral Angiopathy & Foot Ulcer',
    clinicalNote: 'A 68-year-old male from Lucknow with poorly controlled type 2 diabetes presents with a non-healing right neuropathic/ischaemic heel ulcer. Doppler ultrasound confirms peripheral arterial angiopathy secondary to diabetes.',
    correctCodes: ['E11.5', 'I79.2'],
    rationale: 'Code E11.5† identifies type 2 diabetes with circulatory complications, paired with I79.2* for peripheral angiopathy in diseases classified elsewhere.',
    tip: 'Look for circulatory involvement modifier (E11.5) when ischemic diabetic foot complications are documented.',
    candidates: ['E11.5', 'I79.2', 'L97', 'I70.2', 'E11.9', 'R02']
  },
  {
    id: 'tc_05',
    difficulty: 'Beginner',
    title: 'Type 2 Diabetes Mellitus without Complications',
    clinicalNote: 'A 49-year-old female from Pune attends an outpatient check-up. Fasting blood glucose is 168 mg/dL and HbA1c is 8.2%. Full screening shows no evidence of renal, retinal, or neural complications. Diagnosed with uncomplicated type 2 diabetes mellitus.',
    correctCodes: ['E11.9'],
    rationale: 'E11.9 is the specific WHO ICD-10 code for type 2 diabetes mellitus without complications.',
    tip: 'When workup confirms absence of target organ damage, assign subcode .9.',
    candidates: ['E11.9', 'E11.2', 'E10.9', 'E14.9', 'R73.0', 'I10']
  },

  // 2. INFECTIONS (6-13)
  {
    id: 'tc_06',
    difficulty: 'Beginner',
    title: 'Plasmodium Vivax Malaria',
    clinicalNote: 'A 32-year-old male resident of Mumbai presents to the fever clinic with high-grade tertian fever with chills, rigors, and profuse sweating. Peripheral blood smear microscopy confirms Plasmodium vivax trophozoites with a negative falciparum test.',
    correctCodes: ['B51.9'],
    rationale: 'B51.9 represents Plasmodium vivax malaria without complications.',
    tip: 'Distinguish between B50 (falciparum), B51 (vivax), B52 (malariae), and B54 (unspecified malaria).',
    candidates: ['B51.9', 'B50.9', 'B54', 'A97.0', 'A01.0', 'R50.9']
  },
  {
    id: 'tc_07',
    difficulty: 'Beginner',
    title: 'Dengue Fever without Warning Signs',
    clinicalNote: 'A 24-year-old female from Chennai presents with acute fever of 3 days duration accompanied by severe retro-orbital pain, arthralgia, and flushing rash. Dengue NS1 antigen is positive; platelets are 160,000/mcL with no hematocrit hemoconcentration or bleeding.',
    correctCodes: ['A97.0'],
    rationale: 'In WHO ICD-10, A97.0 designates dengue without warning signs.',
    tip: 'Do not use symptom codes like R50.9 when a confirmed virological etiology is documented.',
    candidates: ['A97.0', 'A97.1', 'A97.2', 'A97.9', 'R50.9', 'B51.9']
  },
  {
    id: 'tc_08',
    difficulty: 'Beginner',
    title: 'Enteric (Typhoid) Fever',
    clinicalNote: 'A 21-year-old male college student in Hyderabad presents with step-ladder remittent pyrexia for 10 days, abdominal discomfort, coated tongue, and hepatosplenomegaly. Blood culture is positive for Salmonella enterica serotype Typhi.',
    correctCodes: ['A01.0'],
    rationale: 'A01.0 specifically denotes typhoid fever due to Salmonella typhi.',
    tip: 'Paratyphoid fever is classified under A01.1 through A01.4, not A01.0.',
    candidates: ['A01.0', 'A01.1', 'A02.0', 'A09.9', 'R50.9', 'K52.9']
  },
  {
    id: 'tc_09',
    difficulty: 'Intermediate',
    title: 'Sputum Smear-Positive Pulmonary Tuberculosis',
    clinicalNote: 'A 38-year-old male from Patna presents with chronic evening fever, night sweats, 6-kg weight loss, and productive cough with hemoptysis for 6 weeks. Sputum smear microscopy reveals 3+ Acid Fast Bacilli (AFB positive for Mycobacterium tuberculosis).',
    correctCodes: ['A15.0'],
    rationale: 'A15.0 classifies tuberculosis of lung, confirmed by sputum microscopy with or without culture.',
    tip: 'Clinical TB without bacteriological or histological confirmation must be assigned to A16.-, not A15.-.',
    candidates: ['A15.0', 'A15.1', 'A16.0', 'A16.2', 'J18.9', 'R04.2']
  },
  {
    id: 'tc_10',
    difficulty: 'Beginner',
    title: 'Acute Hepatitis A with Jaundice',
    clinicalNote: 'A 17-year-old student from Ahmedabad presents with acute onset jaundice, dark urine, anorexia, and tender hepatomegaly following consumption of street food. Serum IgM anti-HAV is strongly positive, ALT is 1420 IU/L. Diagnosed with acute hepatitis A without hepatic coma.',
    correctCodes: ['B15.9'],
    rationale: 'B15.9 represents hepatitis A without hepatic coma.',
    tip: 'Use B15.0 only if acute hepatic coma/encephalopathy is documented.',
    candidates: ['B15.9', 'B15.0', 'B16.9', 'B17.1', 'K72.0', 'R17']
  },
  {
    id: 'tc_11',
    difficulty: 'Beginner',
    title: 'Acute Amoebic Dysentery',
    clinicalNote: 'A 29-year-old male in Kolkata presents with severe cramping abdominal pain, tenesmus, and bloody mucoid stools 8 times daily. Stool wet mount reveals active Entamoeba histolytica trophozoites with ingested red blood cells.',
    correctCodes: ['A06.0'],
    rationale: 'A06.0 is the specific code for acute amoebic dysentery (intestinal amoebiasis).',
    tip: 'Do not code nonspecific gastroenteritis (A09) when a protozoal cause is confirmed.',
    candidates: ['A06.0', 'A06.4', 'A09.9', 'K52.9', 'A03.9', 'A00.9']
  },
  {
    id: 'tc_12',
    difficulty: 'Beginner',
    title: 'Cholera due to Vibrio cholerae',
    clinicalNote: 'A 42-year-old male admitted to the infectious diseases isolation ward in Cuttack with acute voluminous profuse "rice-water" diarrhoea and severe dehydration. Stool culture isolates Vibrio cholerae 01.',
    correctCodes: ['A00.0'],
    rationale: 'A00.0 denotes cholera due to Vibrio cholerae 01, biovar cholerae.',
    tip: 'Check whether Vibrio cholerae 01 (A00.0) or eltor (A00.1) is isolated in microbiology reports.',
    candidates: ['A00.0', 'A00.1', 'A00.9', 'A09.9', 'E86', 'K52.9']
  },
  {
    id: 'tc_13',
    difficulty: 'Intermediate',
    title: 'Leptospirosis with Jaundice',
    clinicalNote: 'A 34-year-old municipal sanitary worker in Kochi presents following monsoon water-logging with high fever, marked conjunctival suffusion, severe calf tenderness, jaundice, and elevated creatinine. Leptospira IgM ELISA is positive.',
    correctCodes: ['A27.0'],
    rationale: 'A27.0 specifically classifies leptospirosis icterohaemorrhagica (Weil disease).',
    tip: 'Leptospirosis presenting with jaundice and renal dysfunction is coded to A27.0 rather than A27.9.',
    candidates: ['A27.0', 'A27.8', 'A27.9', 'B15.9', 'R17', 'N17.9']
  },

  // 3. CARDIOVASCULAR (14-19)
  {
    id: 'tc_14',
    difficulty: 'Beginner',
    title: 'Acute ST-Elevation Myocardial Infarction of Anterior Wall',
    clinicalNote: 'A 52-year-old male from Mumbai presents to the emergency room with 2 hours of crushing retrosternal chest pain radiating to the left arm. ECG demonstrates hyperacute ST-segment elevation across leads V1-V4, with peak Troponin-I > 50 ng/mL.',
    correctCodes: ['I21.0'],
    rationale: 'I21.0 is the specific WHO code for acute transmural myocardial infarction of anterior wall.',
    tip: 'ICD-10 category I21 specifies anatomical site (anterior I21.0, inferior I21.1, other sites I21.2).',
    candidates: ['I21.0', 'I21.1', 'I21.9', 'I20.0', 'I25.2', 'R07.4']
  },
  {
    id: 'tc_15',
    difficulty: 'Beginner',
    title: 'Essential (Primary) Hypertension',
    clinicalNote: 'A 50-year-old female schoolteacher in Bhopal presents for executive health check-up. Persistent blood pressure over 3 visits averages 154/96 mmHg. Renal function, urinalysis, and echocardiography are normal. Primary essential hypertension diagnosed.',
    correctCodes: ['I10'],
    rationale: 'I10 designates essential (primary) hypertension without secondary cause.',
    tip: 'Check I10 Excludes notes: excludes hypertensive heart disease (I11) and hypertensive kidney disease (I12).',
    candidates: ['I10', 'I11.9', 'I12.9', 'I15.9', 'R03.0', 'I13.9']
  },
  {
    id: 'tc_16',
    difficulty: 'Intermediate',
    title: 'Hypertensive Heart Disease with Congestive Heart Failure',
    clinicalNote: 'A 66-year-old male from Nagpur with a 20-year history of poorly treated systemic hypertension presents with orthopnea, paroxysmal nocturnal dyspnea, and bilateral pedal edema. Echocardiogram shows concentric left ventricular hypertrophy and congestive heart failure.',
    correctCodes: ['I11.0'],
    rationale: 'Combination code I11.0 represents hypertensive heart disease with (congestive) heart failure.',
    tip: 'Do not code separate I10 and I50 when the combination code I11.0 accounts for both.',
    candidates: ['I11.0', 'I10', 'I50.0', 'I11.9', 'I13.0', 'I50.9']
  },
  {
    id: 'tc_17',
    difficulty: 'Beginner',
    title: 'Unstable Angina Pectoris',
    clinicalNote: 'A 58-year-old male businessman in Delhi presents with crescendo angina: retrosternal chest tightness occurring on minimal exertion and at rest. Serial cardiac enzymes remain negative, ECG shows transient ST depression.',
    correctCodes: ['I20.0'],
    rationale: 'I20.0 classifies unstable angina (angina with increasing frequency or severity).',
    tip: 'Do not code acute myocardial infarction (I21) when troponins are strictly negative.',
    candidates: ['I20.0', 'I20.8', 'I20.9', 'I21.9', 'R07.2', 'I25.1']
  },
  {
    id: 'tc_18',
    difficulty: 'Intermediate',
    title: 'Rheumatic Mitral Stenosis',
    clinicalNote: 'A 36-year-old female from a rural district in Bihar presents with fatigue and dyspnea on exertion. Cardiac auscultation reveals a loud first heart sound, opening snap, and mid-diastolic rumbling murmur. Echocardiography confirms chronic rheumatic mitral valve stenosis.',
    correctCodes: ['I05.0'],
    rationale: 'I05.0 classifies rheumatic mitral stenosis.',
    tip: 'Mitral stenosis is presumed rheumatic in WHO ICD-10 unless explicitly documented as nonrheumatic.',
    candidates: ['I05.0', 'I05.1', 'I05.2', 'I34.0', 'I08.0', 'I06.0']
  },
  {
    id: 'tc_19',
    difficulty: 'Beginner',
    title: 'Atrial Fibrillation',
    clinicalNote: 'A 71-year-old female in Chandigarh presents to cardiology with palpitations and lightheadedness. Pulse is irregularly irregular at 128 bpm. 12-lead ECG demonstrates absence of P waves and irregular f-waves, confirming atrial fibrillation.',
    correctCodes: ['I48'],
    rationale: 'I48 represents atrial fibrillation and flutter in WHO ICD-10 2019 edition.',
    tip: 'In WHO ICD-10 2019, atrial fibrillation is mapped to 3-character category I48.',
    candidates: ['I48', 'I47.1', 'I49.9', 'R00.2', 'I45.9', 'I50.9']
  },

  // 4. RESPIRATORY (20-25)
  {
    id: 'tc_20',
    difficulty: 'Intermediate',
    title: 'COPD with Acute Lower Respiratory Infection',
    clinicalNote: 'A 69-year-old chronic bidi smoker in Kanpur with established COPD presents with high fever, increased productive cough with thick green purulent sputum, and dyspnea. Chest radiograph shows acute lower respiratory tract infection.',
    correctCodes: ['J44.0', 'J22'],
    rationale: 'J44.0 denotes COPD with acute lower respiratory infection; instructional note mandates adding code J22 for the infection.',
    tip: 'Always check WHO tabular instructional notes underneath J44.0 specifying "Use additional code to identify infection".',
    candidates: ['J44.0', 'J22', 'J44.1', 'J18.9', 'J44.9', 'J45.9']
  },
  {
    id: 'tc_21',
    difficulty: 'Beginner',
    title: 'COPD with Acute Exacerbation, Unspecified',
    clinicalNote: 'A 64-year-old male from Varanasi with severe COPD presents with sudden worsening of baseline dyspnea and wheezing triggered by winter smog. Chest X-ray confirms hyperinflated lung fields without consolidation or acute infection.',
    correctCodes: ['J44.1'],
    rationale: 'J44.1 designates chronic obstructive pulmonary disease with acute exacerbation, unspecified.',
    tip: 'When an exacerbation occurs without an acute lower respiratory tract infection, assign J44.1.',
    candidates: ['J44.1', 'J44.0', 'J44.8', 'J44.9', 'J45.9', 'R06.0']
  },
  {
    id: 'tc_22',
    difficulty: 'Beginner',
    title: 'Bronchial Asthma, Unspecified',
    clinicalNote: 'A 28-year-old female software engineer in Bengaluru presents with episodic wheezing, nocturnal dry cough, and chest tightness provoked by cold air. Spirometry reveals reversible airway obstruction. Diagnosed with bronchial asthma.',
    correctCodes: ['J45.9'],
    rationale: 'J45.9 represents asthma, unspecified.',
    tip: 'Distinguish between allergic asthma (J45.0), nonallergic asthma (J45.1), and unspecified (J45.9).',
    candidates: ['J45.9', 'J45.0', 'J45.1', 'J46', 'J44.9', 'R05']
  },
  {
    id: 'tc_23',
    difficulty: 'Beginner',
    title: 'Lobar Pneumonia, Unspecified',
    clinicalNote: 'A 45-year-old male farmer from Haryana presents with high fever, chills, pleuritic right-sided chest pain, and rust-colored sputum. Chest radiograph reveals dense consolidation of the right middle lobe, diagnosing lobar pneumonia.',
    correctCodes: ['J18.1'],
    rationale: 'J18.1 classifies lobar pneumonia, unspecified organism.',
    tip: 'When the radiologist or physician specifies lobar consolidation, choose J18.1 over J18.9.',
    candidates: ['J18.1', 'J18.0', 'J18.9', 'J15.9', 'J90', 'R07.1']
  },
  {
    id: 'tc_24',
    difficulty: 'Beginner',
    title: 'Bronchiectasis',
    clinicalNote: 'A 53-year-old female from Pune presents with a history of recurrent chest infections, copious foul-smelling daily sputum production, and digital clubbing. High-resolution chest CT reveals "signet ring" bronchial dilatation, confirming cylindrical bronchiectasis.',
    correctCodes: ['J47'],
    rationale: 'J47 is the WHO ICD-10 code for bronchiectasis.',
    tip: 'Category J47 is a 3-character terminal leaf code in WHO ICD-10.',
    candidates: ['J47', 'J44.9', 'J98.4', 'A16.2', 'J18.9', 'R05']
  },
  {
    id: 'tc_25',
    difficulty: 'Intermediate',
    title: 'Pleural Effusion (Exudative Pleurisy)',
    clinicalNote: 'A 35-year-old male in Lucknow presents with progressive breathlessness and dull aching left-sided chest pain on deep inspiration. Physical exam shows decreased vocal fremitus and stony dullness; diagnostic thoracentesis confirms an exudative pleural effusion not elsewhere classified.',
    correctCodes: ['J90'],
    rationale: 'J90 denotes pleural effusion, not elsewhere classified.',
    tip: 'Check excludes: tuberculous pleural effusion is coded to A15-A16, not J90.',
    candidates: ['J90', 'J91', 'R09.1', 'J94.8', 'A15.6', 'J18.9']
  },

  // 5. KIDNEY & UROLOGY (26-30)
  {
    id: 'tc_26',
    difficulty: 'Intermediate',
    title: 'Chronic Kidney Disease Stage 4',
    clinicalNote: 'A 65-year-old male in Ahmedabad with progressive renal decline over 3 years presents for follow-up. Serum creatinine is 3.4 mg/dL and estimated GFR is 22 mL/min/1.73m2. The nephrologist confirms chronic kidney disease stage 4 (severe).',
    correctCodes: ['N18.4'],
    rationale: 'N18.4 specifically corresponds to Chronic kidney disease, stage 4 (eGFR 15-29 mL/min).',
    tip: 'WHO ICD-10 stages CKD under N18: N18.1 (stage 1) through N18.5 (stage 5 / end stage).',
    candidates: ['N18.4', 'N18.3', 'N18.5', 'N18.9', 'N19', 'I12.9']
  },
  {
    id: 'tc_27',
    difficulty: 'Beginner',
    title: 'Calculus of Kidney (Nephrolithiasis)',
    clinicalNote: 'A 39-year-old male in Jaipur presents to emergency with excruciating acute right flank colicky pain radiating to the groin with microscopic hematuria. Non-contrast CT KUB reveals a 7-mm obstructing stone in the right renal pelvis without hydronephrosis.',
    correctCodes: ['N20.0'],
    rationale: 'N20.0 is the specific code for calculus of kidney (nephrolithiasis).',
    tip: 'Differentiate between calculus of kidney (N20.0) and calculus of ureter (N20.1).',
    candidates: ['N20.0', 'N20.1', 'N20.2', 'N23', 'R31', 'N13.2']
  },
  {
    id: 'tc_28',
    difficulty: 'Intermediate',
    title: 'Nephrotic Syndrome with Minor Glomerular Abnormality (Minimal Change Disease)',
    clinicalNote: 'A 7-year-old male child in Kolkata presents with generalized puffiness of face, anasarca, and frothy urine. Urinalysis shows 4+ proteinuria, serum albumin is 1.8 g/dL, and lipid profile shows severe hypercholesterolemia. Renal histology demonstrates minimal change nephrotic syndrome.',
    correctCodes: ['N04.0'],
    rationale: 'N04.0 classifies nephrotic syndrome with minor glomerular abnormality (minimal change lesion).',
    tip: 'The 4th character .0 in category N04 specifies minor glomerular lesion.',
    candidates: ['N04.0', 'N04.9', 'N00.9', 'N05.9', 'R60.1', 'E88.0']
  },
  {
    id: 'tc_29',
    difficulty: 'Beginner',
    title: 'Acute Tubulo-Interstitial Nephritis (Acute Pyelonephritis)',
    clinicalNote: 'A 27-year-old female in Pune presents with high fever, rigors, nausea, and severe left costovertebral angle flank tenderness. Urinalysis reveals pyuria, white blood cell casts, and bacteriuria. Diagnosed with acute non-obstructive pyelonephritis.',
    correctCodes: ['N10'],
    rationale: 'N10 is the WHO ICD-10 3-character code for acute tubulo-interstitial nephritis (acute pyelonephritis).',
    tip: 'Chronic pyelonephritis is classified under N11, not N10.',
    candidates: ['N10', 'N11.9', 'N12', 'N39.0', 'R30.0', 'N28.8']
  },
  {
    id: 'tc_30',
    difficulty: 'Beginner',
    title: 'Urinary Tract Infection, Site Not Specified',
    clinicalNote: 'A 33-year-old female in Delhi attends the clinic complaining of painful micturition, urinary frequency, and suprapubic discomfort for 3 days. Midstream urine culture grows E. coli > 10^5 CFU/mL. Diagnosed with acute urinary tract infection.',
    correctCodes: ['N39.0'],
    rationale: 'N39.0 is the specific code for urinary tract infection, site not specified.',
    tip: 'Use N39.0 when the infection is localized to the lower urinary tract without pyelonephritis (N10).',
    candidates: ['N39.0', 'N30.0', 'N30.9', 'N10', 'R30.0', 'B96.2']
  },

  // 6. GASTROINTESTINAL & HEPATOBILIARY (31-36)
  {
    id: 'tc_31',
    difficulty: 'Beginner',
    title: 'Other Acute Gastritis',
    clinicalNote: 'A 44-year-old male in Mumbai with a history of heavy NSAID use for backache presents with acute severe epigastric burning pain, nausea, and vomiting. Upper GI endoscopy reveals diffuse erythema, mucosal friability, and erosions in the gastric antrum.',
    correctCodes: ['K29.1'],
    rationale: 'K29.1 designates other acute gastritis.',
    tip: 'Choose K29.1 over the generic K29.7 when endoscopy confirms acute gastritis.',
    candidates: ['K29.1', 'K29.7', 'K29.0', 'K25.0', 'K21.0', 'R10.1']
  },
  {
    id: 'tc_32',
    difficulty: 'Beginner',
    title: 'Acute Appendicitis without Perforation',
    clinicalNote: 'A 19-year-old male in Chennai presents to the emergency surgical unit with periumbilical pain migrating to the right iliac fossa, localized guarding, and McBurney point tenderness. Ultrasound reveals a non-compressible blind-ending appendix measuring 9 mm with surrounding fat stranding, without perforation or abscess.',
    correctCodes: ['K35.8'],
    rationale: 'K35.8 denotes other and unspecified acute appendicitis (acute appendicitis without perforation or peritonitis).',
    tip: 'K35.2 / K35.3 are used when generalized or localized peritonitis/perforation is present.',
    candidates: ['K35.8', 'K35.2', 'K35.3', 'K36', 'K37', 'R10.3']
  },
  {
    id: 'tc_33',
    difficulty: 'Intermediate',
    title: 'Calculus of Gallbladder with Acute Cholecystitis',
    clinicalNote: 'A 48-year-old multiparous female in Bhopal presents with sudden excruciating right upper quadrant pain radiating to the right scapula, accompanied by fever and vomiting. Positive Murphy sign. Ultrasound reveals gallstones impacted in the cystic duct with a 5-mm thickened gallbladder wall and pericholecystic fluid.',
    correctCodes: ['K80.0'],
    rationale: 'K80.0 classifies calculus of gallbladder with acute cholecystitis.',
    tip: 'Use combination code K80.0 instead of separate codes for gallstones (K80.2) and cholecystitis (K81.0).',
    candidates: ['K80.0', 'K80.1', 'K80.2', 'K81.0', 'K82.9', 'R10.1']
  },
  {
    id: 'tc_34',
    difficulty: 'Beginner',
    title: 'Acute Pancreatitis',
    clinicalNote: 'A 40-year-old male in Bengaluru presents with agonizing epigastric pain radiating directly to the back, relieved by leaning forward. Serum amylase is 980 U/L and serum lipase is 1450 U/L. Contrast abdominal CT shows acute interstitial edematous pancreatitis.',
    correctCodes: ['K85.9'],
    rationale: 'K85.9 represents acute pancreatitis, unspecified.',
    tip: 'In WHO ICD-10 category K85, K85.9 is used for acute pancreatitis without etiology specified in category.',
    candidates: ['K85.9', 'K86.0', 'K86.1', 'K80.0', 'R10.1', 'K29.1']
  },
  {
    id: 'tc_35',
    difficulty: 'Intermediate',
    title: 'Gastro-Oesophageal Reflux Disease with Oesophagitis',
    clinicalNote: 'A 51-year-old male in Delhi complains of chronic retrosternal heartburn and acid regurgitation worse after meals. Upper gastrointestinal endoscopy confirms Los Angeles Grade B erosive reflux oesophagitis.',
    correctCodes: ['K21.0'],
    rationale: 'K21.0 is the specific WHO ICD-10 code for gastro-oesophageal reflux disease with oesophagitis.',
    tip: 'Differentiate K21.0 (with oesophagitis) from K21.9 (without oesophagitis).',
    candidates: ['K21.0', 'K21.9', 'K20', 'K22.1', 'K29.7', 'R12']
  },
  {
    id: 'tc_36',
    difficulty: 'Intermediate',
    title: 'Other and Unspecified Cirrhosis of Liver',
    clinicalNote: 'A 58-year-old male from Nagpur with a long history of chronic alcohol consumption presents with abdominal distension, spider nevi, and splenomegaly. Abdominal sonography and elastography confirm micronodular cirrhosis of the liver without portal vein thrombosis.',
    correctCodes: ['K74.6'],
    rationale: 'K74.6 designates other and unspecified cirrhosis of liver.',
    tip: 'K70.3 is used for alcoholic cirrhosis; when coded generally or non-specifically, K74.6 represents cirrhosis.',
    candidates: ['K74.6', 'K70.3', 'K74.0', 'K72.9', 'R18', 'I85.9']
  },

  // 7. PREGNANCY & OBSTETRICS (37-41)
  {
    id: 'tc_37',
    difficulty: 'Intermediate',
    title: 'Pre-eclampsia, Unspecified',
    clinicalNote: 'A 26-year-old primigravida at 34 weeks of gestation in Mumbai attends antenatal clinic. Blood pressure is 156/102 mmHg and spot urine protein-to-creatinine ratio is 0.65 (significant proteinuria). Platelets, AST, and ALT are within normal limits.',
    correctCodes: ['O14.9'],
    rationale: 'O14.9 classifies pre-eclampsia, unspecified.',
    tip: 'Differentiate between mild-to-moderate pre-eclampsia (O14.0), severe pre-eclampsia (O14.1), and eclampsia (O15).',
    candidates: ['O14.9', 'O14.0', 'O14.1', 'O15.0', 'O13', 'I10']
  },
  {
    id: 'tc_38',
    difficulty: 'Intermediate',
    title: 'Gestational Diabetes Mellitus',
    clinicalNote: 'A 30-year-old woman at 26 weeks of gestation in Hyderabad has an abnormal 75g oral glucose tolerance test with a fasting blood glucose of 104 mg/dL and 2-hour value of 172 mg/dL. She had normal pre-pregnancy glycemia.',
    correctCodes: ['O24.4'],
    rationale: 'O24.4 designates diabetes mellitus arising in pregnancy (gestational diabetes).',
    tip: 'Do not code pre-existing type 2 diabetes (O24.1) when hyperglycemia first appears during pregnancy.',
    candidates: ['O24.4', 'O24.1', 'O24.0', 'O24.9', 'E11.9', 'R73.0']
  },
  {
    id: 'tc_39',
    difficulty: 'Beginner',
    title: 'Mild Hyperemesis Gravidarum',
    clinicalNote: 'A 22-year-old pregnant female at 9 weeks gestation in Lucknow presents with intractable nausea and vomiting of pregnancy resulting in 3% weight loss and mild ketonuria, without dehydration or electrolyte disturbance.',
    correctCodes: ['O21.0'],
    rationale: 'O21.0 represents mild hyperemesis gravidarum starting before the end of the 22nd week of gestation.',
    tip: 'When hyperemesis causes metabolic disturbance (hypokalemia, alkalosis), code O21.1.',
    candidates: ['O21.0', 'O21.1', 'O21.9', 'R11', 'K29.7', 'O20.0']
  },
  {
    id: 'tc_40',
    difficulty: 'Intermediate',
    title: 'Tubal Ectopic Pregnancy',
    clinicalNote: 'A 28-year-old female at 7 weeks gestation in Chennai presents with acute lower abdominal pain and scanty vaginal bleeding. Pelvic transvaginal ultrasound demonstrates an empty uterine cavity and a gestational sac with positive cardiac activity in the right fallopian tube.',
    correctCodes: ['O00.1'],
    rationale: 'O00.1 specifically denotes tubal pregnancy.',
    tip: 'Category O00 specifies anatomical location: abdominal (O00.0), tubal (O00.1), or ovarian (O00.2).',
    candidates: ['O00.1', 'O00.0', 'O00.9', 'O02.1', 'O03.9', 'R10.2']
  },
  {
    id: 'tc_41',
    difficulty: 'Beginner',
    title: 'Missed Abortion',
    clinicalNote: 'A 31-year-old female at 11 weeks amenorrhea in Jaipur presents for routine first-trimester scan. Ultrasound reveals an intrauterine embryo corresponding to 7 weeks with absent fetal heart pulsation and closed internal os. Diagnosed with missed abortion.',
    correctCodes: ['O02.1'],
    rationale: 'O02.1 is the specific code for missed abortion (early fetal death with retention of dead products of conception).',
    tip: 'Check category O02 (other abnormal products of conception) for missed abortion.',
    candidates: ['O02.1', 'O03.9', 'O02.0', 'O20.0', 'O06.9', 'N93.9']
  },

  // 8. MUSCULOSKELETAL & INJURY (42-46)
  {
    id: 'tc_42',
    difficulty: 'Beginner',
    title: 'Fracture of Shaft of Femur',
    clinicalNote: 'A 35-year-old male construction laborer in Bengaluru is brought to the orthopedic casualty after falling from scaffolding. Examination shows deformity and abnormal mobility of the mid-thigh. X-ray confirms a closed transverse fracture of the shaft of the right femur.',
    correctCodes: ['S72.3'],
    rationale: 'S72.3 designates fracture of shaft of femur.',
    tip: 'Fractures of the femur are anatomically subdivided: neck (S72.0), pertrochanteric (S72.1), shaft (S72.3), lower end (S72.4).',
    candidates: ['S72.3', 'S72.0', 'S72.1', 'S72.4', 'S72.9', 'T14.2']
  },
  {
    id: 'tc_43',
    difficulty: 'Beginner',
    title: 'Colles Fracture (Lower End of Radius)',
    clinicalNote: 'A 63-year-old postmenopausal woman in Pune slips on wet tiles and falls on an outstretched hand. She presents with severe wrist pain and "dinner fork" deformity. Radiographs demonstrate a closed fracture of the lower end of the right radius with dorsal displacement.',
    correctCodes: ['S52.5'],
    rationale: 'S52.5 classifies fracture of lower end of radius (Colles fracture).',
    tip: 'S52.5 includes Colles fracture and Smith fracture of the distal radius.',
    candidates: ['S52.5', 'S52.6', 'S52.0', 'S62.0', 'M81.0', 'T14.2']
  },
  {
    id: 'tc_44',
    difficulty: 'Beginner',
    title: 'Primary Osteoarthritis of Knee',
    clinicalNote: 'A 61-year-old female in Chandigarh presents with bilateral knee pain for 2 years, worse on weight-bearing and climbing stairs, with crepitus and morning stiffness lasting 15 minutes. Knee radiographs show joint space narrowing and subchondral sclerosis diagnostic of primary osteoarthritis of the knee.',
    correctCodes: ['M17.1'],
    rationale: 'M17.1 denotes other primary gonarthrosis (primary osteoarthritis of knee).',
    tip: 'WHO ICD-10 distinguishes bilateral primary gonarthrosis (M17.0) from unilateral primary gonarthrosis (M17.1).',
    candidates: ['M17.1', 'M17.0', 'M17.9', 'M19.9', 'M16.1', 'M25.5']
  },
  {
    id: 'tc_45',
    difficulty: 'Intermediate',
    title: 'Lumbar Intervertebral Disc Displacement',
    clinicalNote: 'A 42-year-old male accountant in Delhi presents with severe lower back pain radiating down the posterior right thigh to the lateral foot (sciatica). Straight leg raise test is positive at 35 degrees. MRI confirms L4-L5 posterior disc herniation compressing the traversing nerve root.',
    correctCodes: ['M51.2'],
    rationale: 'M51.2 denotes other specified intervertebral disc displacement (lumbar disc herniation).',
    tip: 'Use M51.1 if the coder codes lumbar disc disorder with radiculopathy; M51.2 specifies disc herniation/displacement.',
    candidates: ['M51.2', 'M51.1', 'M54.5', 'M54.4', 'M51.9', 'G55.1']
  },
  {
    id: 'tc_46',
    difficulty: 'Beginner',
    title: 'Concussion (Commotio Cerebri)',
    clinicalNote: 'A 23-year-old male motorcycle pillion rider in Mumbai struck his head on pavement during an accident. He experienced 4 minutes of brief loss of consciousness, retro-orbital headache, and post-traumatic amnesia. Non-contrast brain CT scan is normal.',
    correctCodes: ['S06.0'],
    rationale: 'S06.0 classifies concussion.',
    tip: 'Category S06 covers intracranial injuries; S06.0 is assigned when imaging shows no structural hematoma or contusion.',
    candidates: ['S06.0', 'S06.1', 'S06.2', 'S06.9', 'R40.2', 'S09.9']
  },

  // 9. SKIN & SUBCUTANEOUS (47-50)
  {
    id: 'tc_47',
    difficulty: 'Beginner',
    title: 'Cellulitis of Lower Limb',
    clinicalNote: 'A 54-year-old male in Hyderabad presents with a 3-day history of a rapidly spreading, painful, erythematous, warm, and swollen area with ill-defined margins over his left pretibial region accompanied by low-grade fever.',
    correctCodes: ['L03.1'],
    rationale: 'L03.1 classifies cellulitis of limb (including lower leg).',
    tip: 'L03 categorizes cellulitis by anatomical site; L03.1 is for limbs.',
    candidates: ['L03.1', 'L03.0', 'L03.9', 'A46', 'L02.4', 'I80.2']
  },
  {
    id: 'tc_48',
    difficulty: 'Beginner',
    title: 'Psoriasis Vulgaris (Plaque Psoriasis)',
    clinicalNote: 'A 37-year-old male in Ahmedabad presents with chronic symmetrical erythematous plaques covered with silvery-white micaceous scales over both extensor elbows and knees. Auspitz sign is positive.',
    correctCodes: ['L40.0'],
    rationale: 'L40.0 designates psoriasis vulgaris (common plaque psoriasis).',
    tip: 'Pustular psoriasis is coded to L40.1, whereas chronic plaque psoriasis is L40.0.',
    candidates: ['L40.0', 'L40.1', 'L40.5', 'L40.9', 'L30.9', 'L20.9']
  },
  {
    id: 'tc_49',
    difficulty: 'Beginner',
    title: 'Atopic Dermatitis, Unspecified',
    clinicalNote: 'A 14-year-old boy in Kochi presents with intense pruritus and lichenified erythematous eczematous patches over the antecubital and popliteal flexures. Family history is positive for allergic rhinitis and asthma.',
    correctCodes: ['L20.9'],
    rationale: 'L20.9 denotes atopic dermatitis, unspecified.',
    tip: 'Category L20 classifies atopic eczema; infantile is L20.0, flexural/unspecified is L20.9.',
    candidates: ['L20.9', 'L20.8', 'L30.9', 'L23.9', 'L27.0', 'L29.9']
  },
  {
    id: 'tc_50',
    difficulty: 'Beginner',
    title: 'Impetigo (Contagiosa)',
    clinicalNote: 'A 6-year-old girl in Patna presents with itchy, fragile vesicles around the nose and mouth that ruptured to form thick golden "honey-colored" adherent crusts. Diagnosed with impetigo contagiosa.',
    correctCodes: ['L01.0'],
    rationale: 'L01.0 classifies impetigo (any organism, any site).',
    tip: 'L01.0 covers impetigo contagiosa; bullous impetigo is L01.1.',
    candidates: ['L01.0', 'L01.1', 'L02.0', 'L08.9', 'B08.4', 'B00.1']
  },

  // 10. HEMATOLOGY (51-54)
  {
    id: 'tc_51',
    difficulty: 'Beginner',
    title: 'Iron Deficiency Anaemia, Unspecified',
    clinicalNote: 'A 24-year-old female in Varanasi presents with fatigue, pallor, and exertional breathlessness. Hemoglobin is 7.2 g/dL, MCV 66 fL, MCH 21 pg, and serum ferritin is severely reduced at 4 ng/mL, confirming microcytic hypochromic iron deficiency anaemia.',
    correctCodes: ['D50.9'],
    rationale: 'D50.9 classifies iron deficiency anaemia, unspecified.',
    tip: 'D50.0 is used when secondary to blood loss (chronic); D50.9 is for general/unspecified iron deficiency anaemia.',
    candidates: ['D50.9', 'D50.0', 'D50.8', 'D51.9', 'D64.9', 'E61.1']
  },
  {
    id: 'tc_52',
    difficulty: 'Beginner',
    title: 'Vitamin B12 Deficiency Anaemia, Unspecified',
    clinicalNote: 'A 52-year-old strict vegetarian male in Ahmedabad presents with progressive lethargy, tingling paresthesias in toes, and smooth sore tongue. Complete blood count shows macrocytic anaemia with Hb 8.1 g/dL, MCV 112 fL, and serum vitamin B12 level of 85 pg/mL.',
    correctCodes: ['D51.9'],
    rationale: 'D51.9 designates vitamin B12 deficiency anaemia, unspecified.',
    tip: 'Category D51 differentiates dietary (D51.3), pernicious (D51.0), and unspecified (D51.9).',
    candidates: ['D51.9', 'D51.3', 'D51.0', 'D52.9', 'D50.9', 'D64.9']
  },
  {
    id: 'tc_53',
    difficulty: 'Intermediate',
    title: 'Sickle-Cell Anaemia with Crisis',
    clinicalNote: 'A 19-year-old male from a tribal district in Odisha with known homozygous sickle cell disorder presents with agonizing musculoskeletal bone pain in both legs and lumbar spine precipitated by dehydration. Diagnosed with sickle-cell painful vaso-occlusive crisis.',
    correctCodes: ['D57.0'],
    rationale: 'D57.0 classifies sickle-cell anaemia with crisis (vaso-occlusive crisis).',
    tip: 'Sickle-cell anaemia without crisis is D57.1; with crisis is D57.0.',
    candidates: ['D57.0', 'D57.1', 'D57.2', 'D58.9', 'D64.9', 'M79.6']
  },
  {
    id: 'tc_54',
    difficulty: 'Intermediate',
    title: 'Immune (Idiopathic) Thrombocytopenic Purpura',
    clinicalNote: 'A 29-year-old female in Lucknow presents with spontaneous petechiae and ecchymoses on both arms and legs and epistaxis. Platelet count is 14,000/mcL; bone marrow examination reveals increased megakaryocytes with normal erythroid and myeloid lines.',
    correctCodes: ['D69.3'],
    rationale: 'D69.3 denotes immune thrombocytopenic purpura.',
    tip: 'Category D69 classifies purpura and other hemorrhagic conditions; D69.3 is ITP.',
    candidates: ['D69.3', 'D69.4', 'D69.6', 'D65', 'D68.9', 'R58']
  },

  // 11. OPHTHALMOLOGY & ENT (55-58)
  {
    id: 'tc_55',
    difficulty: 'Beginner',
    title: 'Senile Nuclear Cataract',
    clinicalNote: 'A 68-year-old male retired farmer in Jaipur complains of gradual, painless, bilateral diminution of distant vision and glare while driving at night. Slit-lamp biomicroscopy reveals dense yellowish-brown nuclear opacification of both crystalline lenses.',
    correctCodes: ['H25.1'],
    rationale: 'H25.1 classifies senile nuclear cataract.',
    tip: 'Senile cataract types in H25 include incipient (H25.0), nuclear (H25.1), and morgagnian (H25.2).',
    candidates: ['H25.1', 'H25.0', 'H25.2', 'H25.9', 'H26.9', 'H40.1']
  },
  {
    id: 'tc_56',
    difficulty: 'Beginner',
    title: 'Primary Open-Angle Glaucoma',
    clinicalNote: 'A 59-year-old female in Chennai attends eye OPD. Intraocular pressure is 28 mmHg in right eye and 26 mmHg in left eye. Visual field testing reveals arcuate scotomas and fundus reveals glaucomatous optic disc cupping (cup-to-disc ratio 0.8). Gonioscopy confirms open anterior chamber angles.',
    correctCodes: ['H40.1'],
    rationale: 'H40.1 designates primary open-angle glaucoma.',
    tip: 'Angle-closure glaucoma is coded to H40.2; open-angle is H40.1.',
    candidates: ['H40.1', 'H40.2', 'H40.0', 'H40.9', 'H25.9', 'H53.4']
  },
  {
    id: 'tc_57',
    difficulty: 'Beginner',
    title: 'Acute Suppurative Otitis Media',
    clinicalNote: 'A 5-year-old boy in Delhi is brought with high fever and acute severe right ear pain followed by sudden bloody purulent otorrhea and relief of pain. Otoscopy reveals a perforation in the pars tensa of the right tympanic membrane with pulsatile pus discharge.',
    correctCodes: ['H66.0'],
    rationale: 'H66.0 represents acute suppurative otitis media.',
    tip: 'Chronic suppurative otitis media is coded to H66.1-H66.3, while acute is H66.0.',
    candidates: ['H66.0', 'H66.1', 'H66.3', 'H65.0', 'H60.9', 'H92.0']
  },
  {
    id: 'tc_58',
    difficulty: 'Beginner',
    title: 'Meniere Disease',
    clinicalNote: 'A 46-year-old male in Bengaluru presents with episodic spontaneous rotational vertigo lasting 3 hours, associated with fluctuating low-frequency sensorineural hearing loss, roaring tinnitus, and aural fullness in the left ear.',
    correctCodes: ['H81.0'],
    rationale: 'H81.0 specifically denotes Meniere disease (endolymphatic hydrops).',
    tip: 'Benign paroxysmal positional vertigo (BPPV) is H81.1; Meniere is H81.0.',
    candidates: ['H81.0', 'H81.1', 'H81.3', 'H81.9', 'R42', 'H90.3']
  },

  // 12. MENTAL HEALTH & NEUROLOGY (59-61)
  {
    id: 'tc_59',
    difficulty: 'Beginner',
    title: 'Moderate Depressive Episode',
    clinicalNote: 'A 34-year-old female software developer in Pune presents with persistent depressed mood, anhedonia, psychomotor retardation, feelings of worthlessness, and insomnia for 6 weeks, with marked impairment in work and social activities.',
    correctCodes: ['F32.1'],
    rationale: 'F32.1 designates moderate depressive episode.',
    tip: 'Severity of depressive episodes is classified as mild (F32.0), moderate (F32.1), or severe (F32.2/F32.3).',
    candidates: ['F32.1', 'F32.0', 'F32.2', 'F33.1', 'F41.1', 'R45.3']
  },
  {
    id: 'tc_60',
    difficulty: 'Beginner',
    title: 'Generalized Anxiety Disorder',
    clinicalNote: 'A 28-year-old male in Hyderabad presents with uncontrollable excessive anxiety and worry about everyday matters for over 8 months, accompanied by motor tension, muscle aches, restlessness, palpitations, and irritability without panic attacks.',
    correctCodes: ['F41.1'],
    rationale: 'F41.1 classifies generalized anxiety disorder.',
    tip: 'Panic disorder without agoraphobia is F41.0; generalized chronic anxiety is F41.1.',
    candidates: ['F41.1', 'F41.0', 'F41.2', 'F40.0', 'F32.0', 'R45.0']
  },
  {
    id: 'tc_61',
    difficulty: 'Beginner',
    title: 'Migraine without Aura (Common Migraine)',
    clinicalNote: 'A 31-year-old woman in Mumbai presents with recurrent episodes of moderate-to-severe throbbing unilateral hemicranial headache lasting 18 hours, exacerbated by physical exertion, accompanied by nausea, photophobia, and phonophobia, without visual aura.',
    correctCodes: ['G43.0'],
    rationale: 'G43.0 denotes migraine without aura (common migraine).',
    tip: 'Migraine with aura is G43.1; migraine without aura is G43.0.',
    candidates: ['G43.0', 'G43.1', 'G43.9', 'G44.2', 'R51', 'G44.0']
  },

  // 13. PEDIATRICS (62-63)
  {
    id: 'tc_62',
    difficulty: 'Beginner',
    title: 'Acute Bronchiolitis due to Respiratory Syncytial Virus (RSV)',
    clinicalNote: 'A 5-month-old male infant in Delhi presents during winter with runny nose, rapid breathing, subcostal retractions, tachypnea, and audible expiratory wheezing and fine crepitations. Nasopharyngeal swab rapid antigen test is positive for respiratory syncytial virus (RSV).',
    correctCodes: ['J21.0'],
    rationale: 'J21.0 classifies acute bronchiolitis due to respiratory syncytial virus.',
    tip: 'Category J21 classifies acute bronchiolitis: .0 for RSV, .8 for other organisms, .9 for unspecified.',
    candidates: ['J21.0', 'J21.8', 'J21.9', 'J20.9', 'J18.9', 'J45.9']
  },
  {
    id: 'tc_63',
    difficulty: 'Beginner',
    title: 'Neonatal Jaundice, Unspecified',
    clinicalNote: 'A 4-day-old full-term male newborn in Chandigarh develops yellowish discoloration of the face, trunk, and sclera. Total serum bilirubin is 13.8 mg/dL with unconjugated predominance; direct Coombs test is negative and no maternal-fetal ABO or Rh incompatibility exists. Diagnosed with physiological neonatal jaundice.',
    correctCodes: ['P59.9'],
    rationale: 'P59.9 classifies neonatal jaundice, unspecified.',
    tip: 'Isoimmunization-related jaundice is in P55; physiological or unspecified neonatal jaundice is P59.9.',
    candidates: ['P59.9', 'P58.9', 'P55.1', 'P59.0', 'R17', 'B15.9']
  },

  // 14. NEGATION / DIFFERENTIAL CASES (64-66)
  {
    id: 'tc_64',
    difficulty: 'Intermediate',
    title: 'Gastro-oesophageal Reflux (Acute MI Ruled Out)',
    clinicalNote: 'A 47-year-old male in Mumbai presented to emergency with retrosternal burning chest pain. Electrocardiogram and serial cardiac troponin tests were completely normal, ruling out acute myocardial infarction. Upper endoscopy reveals normal stomach and esophagus without mucosal breaks. Diagnosed with gastro-oesophageal reflux disease without oesophagitis.',
    correctCodes: ['K21.9'],
    rationale: 'Only code the confirmed final diagnosis K21.9. Acute myocardial infarction was investigated and ruled out, so I21 must not be coded.',
    tip: 'Do not code suspected diagnoses that are ruled out during hospitalization.',
    candidates: ['K21.9', 'I21.9', 'I20.9', 'K21.0', 'R07.4', 'K29.7']
  },
  {
    id: 'tc_65',
    difficulty: 'Intermediate',
    title: 'Acute Mesenteric Lymphadenitis (Appendicitis Ruled Out)',
    clinicalNote: 'A 12-year-old boy in Chennai presented with right lower quadrant abdominal pain, nausea, and low-grade fever. Emergency ultrasound demonstrated a normal, compressible vermiform appendix without inflammation, ruling out acute appendicitis, but demonstrated multiple enlarged inflammatory mesenteric lymph nodes. Diagnosed with acute non-specific mesenteric lymphadenitis.',
    correctCodes: ['I88.0'],
    rationale: 'I88.0 classifies non-specific mesenteric lymphadenitis. Appendicitis was investigated and ruled out and must not be coded.',
    tip: 'Negation rule: conditions explicitly documented as "ruled out" or "negative for" must never be assigned an ICD code.',
    candidates: ['I88.0', 'K35.8', 'K37', 'K35.2', 'R10.3', 'A09.9']
  },
  {
    id: 'tc_66',
    difficulty: 'Intermediate',
    title: 'Tension-Type Headache (Subarachnoid Haemorrhage Excluded)',
    clinicalNote: 'A 36-year-old female in Bengaluru presented with bilateral band-like pressing occipital headache. Emergency non-contrast brain CT scan and cerebrospinal fluid lumbar puncture were clear, excluding subarachnoid haemorrhage and intracranial bleeding. Neurologist confirmed episodic tension-type headache.',
    correctCodes: ['G44.2'],
    rationale: 'G44.2 classifies tension-type headache. Subarachnoid hemorrhage (I60) was ruled out and excluded.',
    tip: 'When a catastrophic diagnosis is investigated and ruled out, assign only the established definitive diagnosis.',
    candidates: ['G44.2', 'I60.9', 'G43.9', 'R51', 'G44.0', 'I61.9']
  }
];

// Validation: check every single code against data/icd10.json
console.log(`Validating ${rawCases.length} cases against data/icd10.json...`);
let hasError = false;

for (const c of rawCases) {
  for (const code of c.correctCodes) {
    if (!codeMap.has(code)) {
      console.error(`ERROR in ${c.id}: correctCode ${code} NOT FOUND in icd10.json!`);
      hasError = true;
    }
  }
  for (const cand of c.candidates) {
    if (!codeMap.has(cand)) {
      console.error(`ERROR in ${c.id}: candidate ${cand} NOT FOUND in icd10.json!`);
      hasError = true;
    }
  }
  // Check candidates contain all correct codes
  for (const code of c.correctCodes) {
    if (!c.candidates.includes(code)) {
      console.error(`ERROR in ${c.id}: candidates missing correct code ${code}`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
}

// Convert to standard format
const finalCases = rawCases.map((c, idx) => ({
  id: c.id,
  difficulty: c.difficulty,
  title: c.title,
  clinicalNote: c.clinicalNote,
  vignette: c.clinicalNote,
  question: 'Select the correct WHO ICD-10 diagnostic code(s) for this patient encounter:',
  candidateCodes: c.candidates,
  correctCodes: c.correctCodes,
  rationale: c.rationale,
  explanation: `${c.rationale} ${c.tip}`,
  keyRule: c.tip,
  tip: c.tip,
  codingTip: c.tip
}));

const outPath = path.join(__dirname, '..', 'data', 'trainee-cases.json');
fs.writeFileSync(outPath, JSON.stringify(finalCases, null, 2), 'utf8');
console.log(`Successfully wrote ${finalCases.length} validated cases to ${outPath}!`);
