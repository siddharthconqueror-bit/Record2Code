import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateSuggestions, IcdCode } from '@/lib/suggest';

let cachedCodes: IcdCode[] | null = null;

function getCodes(): IcdCode[] {
  if (!cachedCodes) {
    const jsonPath = path.join(process.cwd(), 'data', 'icd10.json');
    const raw = fs.readFileSync(jsonPath, 'utf8');
    cachedCodes = JSON.parse(raw) as IcdCode[];
  }
  return cachedCodes;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, includeOptionalSubdivisions = false } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing "text" field' },
        { status: 400 }
      );
    }

    const allCodes = getCodes();
    const result = generateSuggestions(text, allCodes, {
      includeOptionalSubdivisions: Boolean(includeOptionalSubdivisions),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('API /api/suggest error:', err);
    return NextResponse.json(
      { error: 'Failed to process suggestion' },
      { status: 500 }
    );
  }
}
