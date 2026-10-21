const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Helper to extract clean text from a ClaML <Label>...</Label> string
function cleanLabelText(xmlString) {
  let processed = xmlString.replace(/<Reference([^>]*)>([\s\S]*?)<\/Reference>/g, (match, attrs, content) => {
    let trimmed = content.trim();
    if (!trimmed) return '';
    const isInBrackets = attrs.includes('class="in brackets"');
    const isAster = attrs.includes('usage="aster"');
    const isDagger = attrs.includes('usage="dagger"');

    let suffix = '';
    if (isAster && !trimmed.endsWith('*')) suffix = '*';
    else if (isDagger && !trimmed.endsWith('†') && !trimmed.endsWith('+')) suffix = '†';

    let textWithMark = trimmed + suffix;

    if (isInBrackets) {
      if (!textWithMark.startsWith('(') && !textWithMark.startsWith('[')) {
        return ` (${textWithMark})`;
      }
    }
    return ` ${textWithMark}`;
  });

  processed = processed
    .replace(/<\/Para>/gi, ' ')
    .replace(/<\/ListItem>/gi, ' ')
    .replace(/<Fragment[^>]*>/gi, ' ')
    .replace(/<\/Fragment>/gi, ' ');

  processed = processed.replace(/<[^>]+>/g, ' ');

  processed = processed
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  processed = processed
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:;)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .trim();

  return processed;
}

function combineTitle(parentTitle, modText) {
  if (!modText) return parentTitle;
  if (!parentTitle) return modText;

  let formattedMod = modText.trim();
  if (/^(with|without|closed|open|acute|diffuse|focal|minor|chronic)/i.test(formattedMod)) {
    formattedMod = formattedMod.charAt(0).toLowerCase() + formattedMod.slice(1);
  }
  return `${parentTitle} ${formattedMod}`;
}

async function buildAndVerifyIcd() {
  const inputXmlPath = path.resolve('data/icd102019en.xml');
  const outputJsonPath = path.resolve('data/icd10.json');

  if (!fs.existsSync(inputXmlPath)) {
    console.error(`Input file not found at ${inputXmlPath}`);
    process.exit(1);
  }

  console.log(`Parsing ${inputXmlPath}...`);

  const fileStream = fs.createReadStream(inputXmlPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const classes = new Map();
  const categoriesList = [];
  const modifiers = new Map(); // modCode -> Map(subCode -> { code, title, includes, excludes })
  const optionalModifiers = new Set(); // modifiers that are optional 5th-character site codes

  let currentClass = null;
  let currentMC = null;
  let currentRubric = null;
  let rubricBuffer = '';

  let inModifiedBy = false;
  let currentModCode = '';

  for await (const line of rl) {
    // Check ModifiedBy tags for optional metadata
    const mbStart = line.match(/<ModifiedBy\b([^>]*)>/);
    if (mbStart) {
      inModifiedBy = true;
      const codeM = mbStart[1].match(/code="([^"]+)"/);
      if (codeM) currentModCode = codeM[1];
    }
    if (inModifiedBy) {
      if (line.includes('value="optional"')) {
        if (currentModCode) optionalModifiers.add(currentModCode);
      }
      if (line.includes('</ModifiedBy>') || line.endsWith('/>')) {
        inModifiedBy = false;
        currentModCode = '';
      }
    }

    // 1. ModifierClass elements
    const mcMatch = line.match(/<ModifierClass\s+code="([^"]+)"\s+modifier="([^"]+)"/);
    if (mcMatch) {
      const code = mcMatch[1];
      const mod = mcMatch[2];
      if (!modifiers.has(mod)) modifiers.set(mod, new Map());
      currentMC = { code, modifier: mod, title: '', includes: [], excludes: [] };
      modifiers.get(mod).set(code, currentMC);
      continue;
    }

    if (currentMC) {
      const rubricMatch = line.match(/<Rubric\s+[^>]*kind="([^"]+)"/);
      if (rubricMatch) {
        currentRubric = rubricMatch[1];
        rubricBuffer = line + '\n';
      } else if (currentRubric) {
        rubricBuffer += line + '\n';
      }

      if (currentRubric && line.includes('</Rubric>')) {
        const labelMatch = rubricBuffer.match(/<Label[^>]*>([\s\S]*?)<\/Label>/);
        if (labelMatch) {
          const text = cleanLabelText(labelMatch[1]);
          if (currentRubric === 'preferred') {
            currentMC.title = text;
          } else if (currentRubric === 'inclusion') {
            if (text) currentMC.includes.push(text);
          } else if (currentRubric === 'exclusion') {
            if (text) currentMC.excludes.push(text);
          }
        }
        currentRubric = null;
        rubricBuffer = '';
      }

      if (line.includes('</ModifierClass>')) {
        currentMC = null;
        currentRubric = null;
        rubricBuffer = '';
      }
      continue;
    }

    // 2. Class elements
    const classMatch = line.match(/<Class\s+code="([^"]+)"\s+kind="([^"]+)"/);
    if (classMatch) {
      currentClass = {
        code: classMatch[1],
        kind: classMatch[2],
        superClasses: [],
        subClasses: [],
        modifiedBy: [],
        title: '',
        includes: [],
        excludes: []
      };
      classes.set(currentClass.code, currentClass);
      if (currentClass.kind === 'category') {
        categoriesList.push(currentClass);
      }
      continue;
    }

    if (currentClass) {
      const superMatch = line.match(/<SuperClass\s+code="([^"]+)"/);
      if (superMatch) {
        currentClass.superClasses.push(superMatch[1]);
      }

      const subMatch = line.match(/<SubClass\s+code="([^"]+)"/);
      if (subMatch) {
        currentClass.subClasses.push(subMatch[1]);
      }

      const mbMatch = line.match(/<ModifiedBy\b([^>]*)>/);
      if (mbMatch) {
        const codeM = mbMatch[1].match(/code="([^"]+)"/);
        const allM = mbMatch[1].match(/all="([^"]+)"/);
        if (codeM) {
          currentClass.modifiedBy.push({
            modifier: codeM[1],
            all: allM ? allM[1] === 'true' : false
          });
        }
      }

      const rubricMatch = line.match(/<Rubric\s+[^>]*kind="([^"]+)"/);
      if (rubricMatch) {
        currentRubric = rubricMatch[1];
        rubricBuffer = line + '\n';
      } else if (currentRubric) {
        rubricBuffer += line + '\n';
      }

      if (currentRubric && line.includes('</Rubric>')) {
        const labelMatch = rubricBuffer.match(/<Label[^>]*>([\s\S]*?)<\/Label>/);
        if (labelMatch) {
          const text = cleanLabelText(labelMatch[1]);
          if (currentRubric === 'preferred') {
            currentClass.title = text;
          } else if (currentRubric === 'inclusion' && currentClass.kind === 'category') {
            if (text) currentClass.includes.push(text);
          } else if (currentRubric === 'exclusion' && currentClass.kind === 'category') {
            if (text) currentClass.excludes.push(text);
          }
        }
        currentRubric = null;
        rubricBuffer = '';
      }

      if (line.includes('</Class>')) {
        currentClass = null;
        currentRubric = null;
        rubricBuffer = '';
      }
    }
  }

  // Ensure known 5th-character optional site modifiers are marked
  // S13M00_5, S13M23_5, S13M40_5, S13M99_5 (all M chapter site modifiers)
  // S01B18_5 (optional 5th character position)
  // S19S02_5 .. S19T142_5 (optional 5th character for fracture open/closed)
  optionalModifiers.add('S01B18_5');
  optionalModifiers.add('S13M00_5');
  optionalModifiers.add('S13M23_5');
  optionalModifiers.add('S13M40_5');
  optionalModifiers.add('S13M99_5');

  // Helpers to resolve chapter and block
  function resolveChapterAndBlock(code) {
    let curr = code;
    let block = null;
    let chapter = null;
    const visited = new Set();

    while (curr && !visited.has(curr)) {
      visited.add(curr);
      const node = classes.get(curr);
      if (!node) break;

      if (node.kind === 'block' && !block) {
        block = node.code;
      }
      if (node.kind === 'chapter') {
        chapter = { code: node.code, title: node.title };
        break;
      }
      curr = node.superClasses[0];
    }

    return { chapter, block };
  }

  // Set of codes that have child categories
  const parentCategoryCodes = new Set();
  for (const cat of categoriesList) {
    const parentCode = cat.superClasses[0];
    const parentCls = classes.get(parentCode);
    if (parentCls && parentCls.kind === 'category') {
      parentCategoryCodes.add(parentCls.code);
    }
  }

  // Build base entries (all base XML categories have isOptionalSubdivision: false)
  const baseEntries = new Map();
  for (const cat of categoriesList) {
    const { chapter, block } = resolveChapterAndBlock(cat.code);

    let parent = null;
    const rawParent = cat.superClasses[0];
    const parentNode = classes.get(rawParent);
    if (parentNode && parentNode.kind === 'category') {
      parent = parentNode.code;
    }

    const isLeaf = !parentCategoryCodes.has(cat.code);

    baseEntries.set(cat.code, {
      code: cat.code,
      title: cat.title,
      chapter: chapter ? chapter.code : null,
      chapter_title: chapter ? chapter.title : null,
      block: block || null,
      parent: parent,
      isLeaf: isLeaf,
      isOptionalSubdivision: false,
      includes: [...cat.includes],
      excludes: [...cat.excludes]
    });
  }

  // Expand categories with ModifiedBy
  const expandedEntries = new Map();

  for (const cat of categoriesList) {
    if (cat.modifiedBy.length === 0) continue;

    for (const mb of cat.modifiedBy) {
      const modClasses = modifiers.get(mb.modifier);
      if (!modClasses) continue;

      const isOptionalMod = optionalModifiers.has(mb.modifier) || mb.modifier.endsWith('_5');

      const targets = cat.subClasses.length === 0
        ? [cat]
        : cat.subClasses.map(sc => classes.get(sc)).filter(Boolean);

      for (const target of targets) {
        const targetEntry = baseEntries.get(target.code);
        if (targetEntry) {
          targetEntry.isLeaf = false;
        }

        const { chapter, block } = resolveChapterAndBlock(target.code);

        for (const [subCode, mc] of modClasses) {
          let codeCombined;
          if (subCode.startsWith('.')) {
            codeCombined = target.code + subCode;
          } else if (target.code.includes('.')) {
            codeCombined = target.code + subCode;
          } else {
            codeCombined = target.code + '.' + subCode;
          }

          const combinedTitleText = combineTitle(target.title, mc.title);

          const combinedIncludes = Array.from(new Set([...target.includes, ...mc.includes]));
          const combinedExcludes = Array.from(new Set([...target.excludes, ...mc.excludes]));

          expandedEntries.set(codeCombined, {
            code: codeCombined,
            title: combinedTitleText,
            chapter: chapter ? chapter.code : null,
            chapter_title: chapter ? chapter.title : null,
            block: block || null,
            parent: target.code,
            isLeaf: true,
            isOptionalSubdivision: isOptionalMod,
            includes: combinedIncludes,
            excludes: combinedExcludes
          });
        }
      }
    }
  }

  // Merge base entries and expanded entries
  const allFinalCodes = [...baseEntries.values(), ...expandedEntries.values()];

  // Sort by code for clean natural ordering
  allFinalCodes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  // Write updated data/icd10.json
  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
  fs.writeFileSync(outputJsonPath, JSON.stringify(allFinalCodes, null, 2), 'utf8');

  // Verify and print statistics
  const chapterCounts = new Map();
  let optionalTrueCount = 0;
  let optionalFalseCount = 0;

  for (const entry of allFinalCodes) {
    const ch = entry.chapter || 'UNKNOWN';
    chapterCounts.set(ch, (chapterCounts.get(ch) || 0) + 1);
    if (entry.isOptionalSubdivision) optionalTrueCount++;
    else optionalFalseCount++;
  }

  console.log('================================================================');
  console.log('BUILD & EXPANSION RESULTS');
  console.log('================================================================\n');

  console.log(`1) TOTAL CODES: ${allFinalCodes.length}`);
  console.log(`   - isOptionalSubdivision: true  = ${optionalTrueCount}`);
  console.log(`   - isOptionalSubdivision: false = ${optionalFalseCount}\n`);

  console.log('2) NUMBER OF CODES PER CHAPTER (I to XXII):');
  const romanNumerals = [
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
    'XXI', 'XXII'
  ];

  let totalFromChapters = 0;
  for (const ch of romanNumerals) {
    const chNode = classes.get(ch);
    const title = chNode ? chNode.title : '';
    const count = chapterCounts.get(ch) || 0;
    totalFromChapters += count;
    console.log(`   - Chapter ${ch.padEnd(5)} (${count.toString().padStart(5)} codes): ${title}`);
  }
  console.log(`   -------------------------------------------------`);
  console.log(`   Total across all 22 chapters: ${totalFromChapters}\n`);

  console.log('3) VERIFICATION OF SPECIFIC CODES:');
  const checkCodes = ['E11.0', 'E11.9', 'E14.9', 'M17.0', 'M00.01', 'S72.01'];
  const codeIndex = new Map(allFinalCodes.map(c => [c.code, c]));

  for (const code of checkCodes) {
    const found = codeIndex.get(code);
    console.log(`\n--- Code: ${code} ---`);
    if (found) {
      console.log(JSON.stringify(found, null, 2));
    } else {
      console.log('NOT FOUND!');
    }
  }
}

buildAndVerifyIcd().catch(err => {
  console.error('Error during build & verification:', err);
  process.exit(1);
});
