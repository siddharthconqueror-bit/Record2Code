import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

let cachedCodes: IcdCode[] | null = null;
let codeIndex: Map<string, IcdCode> | null = null;

function getCodes(): { list: IcdCode[]; map: Map<string, IcdCode> } {
  if (!cachedCodes || !codeIndex) {
    const jsonPath = path.join(process.cwd(), 'data', 'icd10.json');
    const raw = fs.readFileSync(jsonPath, 'utf8');
    cachedCodes = JSON.parse(raw) as IcdCode[];
    codeIndex = new Map<string, IcdCode>();
    for (const item of cachedCodes) {
      codeIndex.set(item.code.toUpperCase(), item);
    }
  }
  return { list: cachedCodes, map: codeIndex };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase();
  const codeParam = searchParams.get('code')?.trim().toUpperCase();
  const limit = parseInt(searchParams.get('limit') || '40', 10);
  const all = searchParams.get('all') === 'true';

  const { list: allCodes, map: mapIndex } = getCodes();

  // Exact single code lookup
  if (codeParam) {
    const found = mapIndex.get(codeParam);
    if (found) {
      return NextResponse.json(found);
    }
    return NextResponse.json({ error: 'Code not found' }, { status: 404 });
  }

  // Search by query (code or title)
  if (q) {
    const matches: IcdCode[] = [];
    const qUpper = q.toUpperCase();

    // 1. Exact code match first
    const exact = mapIndex.get(qUpper);
    if (exact) {
      matches.push(exact);
    }

    // 2. Code starts with query
    for (const item of allCodes) {
      if (matches.length >= limit) break;
      if (item.code.toUpperCase().startsWith(qUpper) && !matches.includes(item)) {
        matches.push(item);
      }
    }

    // 3. Title contains query
    for (const item of allCodes) {
      if (matches.length >= limit) break;
      if (item.title.toLowerCase().includes(q) && !matches.includes(item)) {
        matches.push(item);
      }
    }

    return NextResponse.json({
      total: matches.length,
      codes: matches,
    });
  }

  // Return all codes if explicitly requested
  if (all) {
    return NextResponse.json({
      total: allCodes.length,
      codes: allCodes,
    });
  }

  // Default: sample 30 codes
  return NextResponse.json({
    total: allCodes.length,
    codes: allCodes.slice(0, Math.min(limit, 30)),
  });
}
