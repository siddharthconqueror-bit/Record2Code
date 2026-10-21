'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
}

export interface StagedCode extends IcdCode {
  acceptedAt: string;
  matchedText?: string;
  symbol?: string; // † or *
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

const PRESET_CASES = [
  {
    id: 'dm_ckd',
    name: 'Diabetic with CKD',
    summary:
      '64-year-old female with long-standing Type 2 diabetes mellitus, Stage 3 chronic kidney disease (eGFR 42 mL/min), essential hypertension, and severe peripheral polyneuropathy.',
  },
  {
    id: 'copd_inf',
    name: 'COPD with Infection',
    summary:
      '71-year-old male with chronic obstructive pulmonary disease presenting with acute lower respiratory infection, productive purulent cough, and severe dyspnea.',
  },
  {
    id: 'htn_hf',
    name: 'Cardiac (HTN + HF)',
    summary:
      '68-year-old male with hypertensive heart disease and congestive heart failure. Bilateral lower extremity pitting edema and elevated BNP.',
  },
  {
    id: 'ge_dehyd',
    name: 'Gastroenteritis & Dehydration',
    summary:
      '29-year-old male with acute diarrhoea and gastroenteritis of presumed infectious origin, severe volume depletion, tachycardia, and dry mucous membranes.',
  },
];

export default function WorkspacePage() {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_CASES[0].id);
  const [noteText, setNoteText] = useState(PRESET_CASES[0].summary);
  const [viewMode, setViewMode] = useState<'raw' | 'marked'>('marked');

  // Suggestions state from Phase 2 engine
  const [suggestedCodes, setSuggestedCodes] = useState<CodeSuggestion[]>([]);
  const [conflicts, setConflicts] = useState<ExcludesConflict[]>([]);
  const [docQueries, setDocQueries] = useState<DocumentationQuery[]>([]);
  const [negatedSpans, setNegatedSpans] = useState<NegatedSpan[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [includeOptionalSubdivisions, setIncludeOptionalSubdivisions] = useState(false);

  // Inspector & Accepted
  const [selectedCode, setSelectedCode] = useState<IcdCode | null>(null);
  const [acceptedCodes, setAcceptedCodes] = useState<StagedCode[]>([]);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IcdCode[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Function to run the Phase 2 code suggestion engine
  const runCodeSuggestions = async (
    textToAnalyze: string,
    withOptional: boolean = includeOptionalSubdivisions
  ) => {
    if (!textToAnalyze.trim()) {
      setSuggestedCodes([]);
      setConflicts([]);
      setDocQueries([]);
      setNegatedSpans([]);
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          includeOptionalSubdivisions: withOptional,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestedCodes(data.suggestions || []);
        setConflicts(data.conflicts || []);
        setDocQueries(data.docQueries || []);
        setNegatedSpans(data.negatedSpans || []);

        // Default selected code to first suggestion if not already selected
        if (data.suggestions && data.suggestions.length > 0) {
          setSelectedCode(data.suggestions[0]);
        }
      }
    } catch (err) {
      console.error('Code suggestion error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run suggestion on mount and preset changes
  useEffect(() => {
    const currentPreset = PRESET_CASES.find((p) => p.id === selectedPreset);
    if (currentPreset) {
      setNoteText(currentPreset.summary);
      runCodeSuggestions(currentPreset.summary, includeOptionalSubdivisions);
    }
  }, [selectedPreset]);

  // Handle Search Input Query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/codes?q=${encodeURIComponent(searchQuery)}&limit=15`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.codes || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPreset = (preset: (typeof PRESET_CASES)[0]) => {
    setSelectedPreset(preset.id);
  };

  const handleManualSuggestClick = () => {
    runCodeSuggestions(noteText, includeOptionalSubdivisions);
  };

  const handleToggleOptionalSubdivisions = () => {
    const newVal = !includeOptionalSubdivisions;
    setIncludeOptionalSubdivisions(newVal);
    runCodeSuggestions(noteText, newVal);
  };

  const handleAddCodeFromSearch = (code: IcdCode) => {
    if (!suggestedCodes.some((c) => c.code === code.code)) {
      const manualSuggestion: CodeSuggestion = {
        ...code,
        evidence: {
          matchedText: 'Manual Search Lookup',
          startIndex: 0,
          endIndex: 0,
          matchStrength: 'High',
          matchReason: 'Manually searched and added by clinical coder',
        },
      };
      setSuggestedCodes((prev) => [manualSuggestion, ...prev]);
    }
    setSelectedCode(code);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAcceptCode = (code: IcdCode) => {
    if (!acceptedCodes.some((c) => c.code === code.code)) {
      const staged: StagedCode = {
        ...code,
        acceptedAt: new Date().toLocaleTimeString(),
      };
      const updated = [...acceptedCodes, staged];
      setAcceptedCodes(updated);
      try {
        localStorage.setItem('record2code_accepted_codes', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleRejectCode = (codeStr: string) => {
    setSuggestedCodes((prev) => prev.filter((c) => c.code !== codeStr));
    if (selectedCode?.code === codeStr) {
      setSelectedCode(suggestedCodes.find((c) => c.code !== codeStr) || null);
    }
  };

  const handleRemoveAccepted = (codeStr: string) => {
    const updated = acceptedCodes.filter((c) => c.code !== codeStr);
    setAcceptedCodes(updated);
    try {
      localStorage.setItem('record2code_accepted_codes', JSON.stringify(updated));
    } catch {}
  };

  // Helper to render interactive marked view in Column 1
  const renderMarkedReportText = () => {
    if (!noteText) return <span className="text-slate-400 italic">No report text.</span>;

    // Collect highlighting spans from suggestions and negations
    interface TextHighlight {
      start: number;
      end: number;
      type: 'suggestion' | 'negation';
      code?: string;
      label?: string;
    }

    const highlights: TextHighlight[] = [];

    // Add negated spans
    negatedSpans.forEach((n) => {
      highlights.push({
        start: n.startIndex,
        end: n.endIndex,
        type: 'negation',
        label: `Ruled Out: ${n.trigger}`,
      });
    });

    // Add suggestion evidence spans
    suggestedCodes.forEach((s) => {
      if (s.evidence && s.evidence.startIndex >= 0 && s.evidence.endIndex > s.evidence.startIndex) {
        highlights.push({
          start: s.evidence.startIndex,
          end: s.evidence.endIndex,
          type: 'suggestion',
          code: s.code,
          label: `${s.code}: ${s.title}`,
        });
      }
    });

    // Sort by start index
    highlights.sort((a, b) => a.start - b.start);

    // Build segments
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    highlights.forEach((h, idx) => {
      // Non-highlighted text before this highlight
      if (h.start > lastIdx) {
        elements.push(
          <span key={`text_${idx}`}>{noteText.slice(lastIdx, Math.min(h.start, noteText.length))}</span>
        );
      }

      const snippet = noteText.slice(Math.max(lastIdx, h.start), Math.min(h.end, noteText.length));
      if (snippet.length > 0) {
        if (h.type === 'negation') {
          elements.push(
            <span
              key={`neg_${idx}`}
              title={h.label}
              className="bg-rose-50 text-rose-800 line-through decoration-rose-400 px-1 py-0.5 rounded border border-rose-200 font-medium inline-block mx-0.5"
            >
              {snippet}
              <span className="no-underline text-[9px] font-bold text-rose-600 ml-1 uppercase">
                [Ruled Out]
              </span>
            </span>
          );
        } else {
          const isSelected = selectedCode?.code === h.code;
          elements.push(
            <span
              key={`sug_${idx}`}
              onClick={() => {
                const found = suggestedCodes.find((c) => c.code === h.code);
                if (found) setSelectedCode(found);
              }}
              title={h.label}
              className={`cursor-pointer px-1 py-0.5 rounded transition-colors font-medium inline-block mx-0.5 border ${
                isSelected
                  ? 'bg-teal-200 text-teal-950 border-teal-500 font-bold ring-2 ring-teal-400'
                  : 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100'
              }`}
            >
              {snippet}
              {h.code && (
                <span className="ml-1 text-[9px] font-mono font-bold bg-white/80 text-teal-800 px-1 rounded border border-teal-300">
                  {h.code}
                </span>
              )}
            </span>
          );
        }
      }
      lastIdx = Math.max(lastIdx, h.end);
    });

    if (lastIdx < noteText.length) {
      elements.push(<span key="text_end">{noteText.slice(lastIdx)}</span>);
    }

    return elements;
  };

  return (
    <main className="max-w-[1580px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 flex-1 flex flex-col">
      {/* Workspace Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-teal-50 text-teal-700 font-bold text-xs">
              ICD-10 (WHO)
            </span>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Clinical Coding Workspace
            </h1>
          </div>
          <span className="text-xs text-slate-400">|</span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Preset Cases:</span>
            {PRESET_CASES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  selectedPreset === preset.id
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            <strong>{acceptedCodes.length}</strong> accepted codes
          </span>
          <Link
            href="/export"
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>Proceed to Export</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 3-COLUMN WORKSPACE GRID */}
      <div className="grid lg:grid-cols-12 gap-5 items-start flex-1">
        {/* COLUMN 1: DOCTOR'S REPORT (4 cols) */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[740px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-sm font-bold text-slate-900">Patient Clinical Report</h2>
            </div>
            {/* View Toggle */}
            <div className="inline-flex p-0.5 bg-slate-200 rounded-md text-[11px] font-semibold">
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'raw' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Raw Text
              </button>
              <button
                onClick={() => setViewMode('marked')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'marked' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Marked Evidence
              </button>
            </div>
          </div>

          {/* Action Trigger Banner */}
          <div className="p-3 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between gap-2">
            <div className="text-xs text-teal-900 font-medium">
              <span>Automatic Clinical Coding Engine</span>
              <span className="block text-[10px] text-teal-700">Matches terms to official WHO ICD-10 specification</span>
            </div>
            <button
              onClick={handleManualSuggestClick}
              disabled={isAnalyzing || !noteText.trim()}
              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Suggest codes</span>
                </>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar font-sans text-xs leading-relaxed">
            {viewMode === 'raw' ? (
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type or paste doctor's note here and click 'Suggest codes'..."
                className="w-full h-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 resize-none leading-relaxed"
              />
            ) : (
              <div className="space-y-3">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-500 text-[11px] flex items-center justify-between">
                  <span>De-identified Clinical Record</span>
                  <span className="font-mono">{noteText.length} characters</span>
                </div>
                <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-slate-800 leading-relaxed space-y-3">
                  <p className="text-xs">{renderMarkedReportText()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-teal-100 border border-teal-300"></span>
                    Suggested match
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300 line-through"></span>
                    Negated / Ruled out
                  </span>
                  <span className="text-slate-400">• Click any highlighted text to inspect details</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom stats & reset */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>{noteText.split(/\s+/).filter(Boolean).length} words</span>
            <button
              onClick={() => {
                setNoteText('');
                setSuggestedCodes([]);
                setConflicts([]);
                setDocQueries([]);
                setNegatedSpans([]);
              }}
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold"
            >
              Clear Note
            </button>
          </div>
        </section>

        {/* COLUMN 2: SUGGESTED CODES & SEARCH (4 cols) */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[740px]">
          {/* Header & Search */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-sm font-bold text-slate-900">Suggested Codes</h2>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-100 text-teal-800 rounded-full">
                {suggestedCodes.length} suggestions
              </span>
            </div>

            {/* Subdivisions toggle switch */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              <label htmlFor="optSubToggle" className="cursor-pointer font-medium text-slate-700">
                Show 5th-character site subdivisions
              </label>
              <input
                id="optSubToggle"
                type="checkbox"
                checked={includeOptionalSubdivisions}
                onChange={handleToggleOptionalSubdivisions}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* Code Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search official ICD-10 (e.g. E11 or cholera)..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-2.5 top-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {/* Search Dropdown Results */}
              {searchQuery && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                  {isSearching ? (
                    <div className="p-3 text-xs text-slate-400 text-center">Searching 16,455 WHO codes...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No exact code or title match found</div>
                  ) : (
                    searchResults.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => handleAddCodeFromSearch(item)}
                        className="w-full text-left p-2.5 hover:bg-teal-50/60 transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-teal-800 mr-2">{item.code}</span>
                          <span className="text-slate-800">{item.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">Add +</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* List of Suggested Codes + Excludes Alerts & Queries */}
          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {/* Excludes Conflict Warning Box */}
            {conflicts.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <span className="text-base">⚠️</span>
                  <span>Excludes Conflict Detected ({conflicts.length})</span>
                </div>
                {conflicts.map((conf, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] pl-2 border-l-2 border-amber-400 text-amber-900 space-y-0.5"
                  >
                    <p className="font-bold">
                      {conf.codeA} vs. {conf.codeB}
                    </p>
                    <p className="text-amber-800">{conf.ruleText}</p>
                    <p className="text-amber-700 italic">Action: {conf.recommendation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Documentation Query Box */}
            {docQueries.length > 0 && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-sky-900">
                  <span className="text-base">📋</span>
                  <span>Documentation Query ({docQueries.length})</span>
                </div>
                {docQueries.map((q) => (
                  <div
                    key={q.id}
                    className="text-[11px] pl-2 border-l-2 border-sky-400 text-sky-900 space-y-0.5"
                  >
                    <p className="font-bold text-sky-800">{q.condition}</p>
                    <p>{q.query}</p>
                    <p className="text-sky-700 italic">Guidance: {q.suggestedAction}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions Stream */}
            {suggestedCodes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <p>No suggested codes for this report.</p>
                <p className="text-[11px]">Click &ldquo;Suggest codes&rdquo; or search for a code above.</p>
              </div>
            ) : (
              suggestedCodes.map((code) => {
                const isSelected = selectedCode?.code === code.code;
                const isAccepted = acceptedCodes.some((c) => c.code === code.code);

                // Match strength badge styling
                const strengthColor =
                  code.evidence?.matchStrength === 'High'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : code.evidence?.matchStrength === 'Medium'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200';

                return (
                  <div
                    key={code.code}
                    onClick={() => setSelectedCode(code)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Code, Chapter, Badges & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-teal-900 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
                            {code.code}
                            {code.daggerAsterisk === 'dagger' && ' †'}
                            {code.daggerAsterisk === 'asterisk' && ' *'}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${strengthColor}`}
                          >
                            {code.evidence?.matchStrength || 'High'} Match
                          </span>
                          {code.isLeaf && (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              Terminal Leaf
                            </span>
                          )}
                          {code.isOptionalSubdivision && (
                            <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                              5th-char site
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-900 leading-snug">
                          {code.title}
                        </p>
                      </div>

                      {/* Action buttons (Accept / Reject) */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isAccepted ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Accepted ✓
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptCode(code);
                            }}
                            className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                          >
                            Accept
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectCode(code.code);
                          }}
                          title="Reject code suggestion"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Evidence Callout */}
                    {code.evidence && (
                      <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                        <div className="flex items-start gap-1">
                          <span className="text-teal-700 font-bold shrink-0">Evidence:</span>
                          <span className="italic font-medium text-slate-900">
                            &ldquo;{code.evidence.matchedText}&rdquo;
                          </span>
                        </div>
                        {code.evidence.matchReason && (
                          <p className="text-[10px] text-slate-500">{code.evidence.matchReason}</p>
                        )}
                      </div>
                    )}

                    {/* Includes & Excludes count footer */}
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Includes: {code.includes?.length || 0}</span>
                      <span>Excludes: {code.excludes?.length || 0}</span>
                      {code.block && <span>Block: {code.block}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Staged Codes Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-2">
              <span>Accepted Final Codes ({acceptedCodes.length}):</span>
              {acceptedCodes.length > 0 && (
                <button
                  onClick={() => {
                    setAcceptedCodes([]);
                    try {
                      localStorage.removeItem('record2code_accepted_codes');
                    } catch {}
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              {acceptedCodes.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">
                  No codes accepted yet. Review suggestions and click &ldquo;Accept&rdquo; above.
                </span>
              ) : (
                acceptedCodes.map((ac, idx) => (
                  <span
                    key={ac.code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-teal-300 text-xs text-teal-900 font-mono shadow-2xs"
                  >
                    <span className="text-[10px] text-teal-600 font-sans font-bold">#{idx + 1}</span>
                    <strong>{ac.code}</strong>
                    <button
                      onClick={() => handleRemoveAccepted(ac.code)}
                      className="text-slate-400 hover:text-rose-600 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* COLUMN 3: CODE DETAILS INSPECTOR (4 cols) */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[740px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-sm font-bold text-slate-900">Code Details & Book Rules</h2>
            </div>
            {selectedCode && (
              <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {selectedCode.code}
              </span>
            )}
          </div>

          {/* Details Content */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 text-xs">
            {selectedCode ? (
              <>
                {/* Title & Hierarchy Block */}
                <div className="space-y-2 pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedCode.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Chapter</span>
                      <span className="font-semibold text-slate-800">
                        {selectedCode.chapter} • {selectedCode.chapter_title}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Block Range</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {selectedCode.block || 'None'}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Parent Code</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {selectedCode.parent || 'Top-level category'}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Leaf Status</span>
                      <span className="font-semibold text-slate-800">
                        {selectedCode.isLeaf ? 'Terminal (Billable Leaf)' : 'Has Subcategories'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Includes Notes */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    Includes Notes ({selectedCode.includes?.length || 0})
                  </h4>
                  {selectedCode.includes && selectedCode.includes.length > 0 ? (
                    <ul className="space-y-1 pl-2">
                      {selectedCode.includes.map((inc, i) => (
                        <li key={i} className="text-slate-700 bg-teal-50/50 p-1.5 rounded border border-teal-100/60 leading-relaxed">
                          • {inc}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic pl-2">No specific Includes notes for this code.</p>
                  )}
                </div>

                {/* Excludes Notes */}
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    Excludes Notes ({selectedCode.excludes?.length || 0})
                  </h4>
                  {selectedCode.excludes && selectedCode.excludes.length > 0 ? (
                    <ul className="space-y-1 pl-2">
                      {selectedCode.excludes.map((exc, i) => (
                        <li key={i} className="text-amber-950 bg-amber-50/60 p-1.5 rounded border border-amber-200/80 leading-relaxed">
                          ⚠️ {exc}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic pl-2">No specific Excludes notes for this code.</p>
                  )}
                </div>

                {/* Accept Button from Details */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleAcceptCode(selectedCode)}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    Accept {selectedCode.code} into Final Codes
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Select any suggested code from the middle column to inspect its parent, block, Includes, and Excludes rules.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
