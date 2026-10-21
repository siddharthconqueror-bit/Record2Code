'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBankCases, generateDynamicCase, TraineeCase as EngineCase } from '@/lib/trainee-engine';

interface IcdCode {
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

// Re‑use the case type from the engine
type TraineeCase = EngineCase;

export default function TraineePage() {
  // ----- State -----
  const [bankCases, setBankCases] = useState<TraineeCase[]>([]);
  const [filter, setFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [activeCase, setActiveCase] = useState<TraineeCase | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [detailedCodes, setDetailedCodes] = useState<Record<string, IcdCode>>({});
  const [inspectedCode, setInspectedCode] = useState<IcdCode | null>(null);
  const [total, setTotal] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);

  // ----- Helpers for localStorage -----
  const loadSeenIds = () => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('seenCaseIds');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };
  const saveSeenIds = (ids: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('seenCaseIds', JSON.stringify(ids));
    } catch {}
  };

  // ----- Load static bank on mount -----
  useEffect(() => {
    setBankCases(getBankCases());
    setSeenIds(loadSeenIds());
  }, []);

  // ----- Pick next case -----
  const pickNextCase = () => {
    const eligibleBank = bankCases.filter((c) => {
      const diffMatch = filter === 'All' || c.difficulty === filter;
      return diffMatch && !seenIds.includes(c.id);
    });
    let next: TraineeCase;
    if (eligibleBank.length > 0) {
      next = eligibleBank[Math.floor(Math.random() * eligibleBank.length)];
    } else {
      next = generateDynamicCase(filter === 'All' ? undefined : filter);
    }
    setActiveCase(next);
    // Track seen IDs (including generated ones to avoid immediate repeats)
    if (!seenIds.includes(next.id)) {
      const newSeen = [...seenIds, next.id];
      setSeenIds(newSeen);
      saveSeenIds(newSeen);
    }
    // Reset UI for new case
    setSelectedCodes([]);
    setSubmitted(false);
    setDetailedCodes({});
    setInspectedCode(null);
  };

  // Load first case when bank or filter changes
  useEffect(() => {
    if (bankCases.length > 0) pickNextCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCases, filter]);

  // Fetch ICD‑10 details for the candidate codes of the active case
  useEffect(() => {
    if (!activeCase) return;
    const fetchDetails = async () => {
      const map: Record<string, IcdCode> = {};
      for (const code of activeCase.candidateCodes) {
        try {
          const res = await fetch(`/api/codes?code=${encodeURIComponent(code)}`);
          if (res.ok) {
            const data: IcdCode = await res.json();
            map[code] = data;
          }
        } catch {}
      }
      setDetailedCodes(map);
      if (activeCase.candidateCodes.length && map[activeCase.candidateCodes[0]]) {
        setInspectedCode(map[activeCase.candidateCodes[0]]);
      }
    };
    fetchDetails();
  }, [activeCase]);

  const toggleCodeSelection = (code: string) => {
    if (submitted) return;
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const isCorrect =
    submitted &&
    activeCase &&
    selectedCodes.length === activeCase.correctCodes.length &&
    activeCase.correctCodes.every((c) => selectedCodes.includes(c));

  const handleSubmit = () => {
    if (!activeCase) return;
    setSubmitted(true);
    setTotal((t) => t + 1);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  // ----- UI -----
  const caseIndex = seenIds.length; // includes current case

  return (
    <main className="max-w-[1580px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">TRAINEE</span>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Interactive Clinical Coding Practice</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 rounded-md text-xs border border-slate-300 bg-slate-50"
          >
            <option value="All">All</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
            Case <strong>{caseIndex}</strong>
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
            Score: <strong>{correctCount}/{total}</strong>
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
            Streak: <strong>{streak}</strong>
          </span>
          <Link href="/workspace" className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
            Switch to Workspace
          </Link>
        </div>
      </div>

      {/* 3‑COLUMN LAYOUT */}
      <div className="grid lg:grid-cols-12 gap-5 items-start flex-1">
        {/* Column 1 – Vignette */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[700px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-sm font-bold text-slate-900">
                {activeCase?.title || 'Loading case...'}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Clinical Vignette</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 text-xs leading-relaxed">
            <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-lg text-slate-800">
              <h3 className="font-bold text-blue-950 mb-1.5 uppercase text-[11px] tracking-wider">Attending Physician Note</h3>
              <p className="leading-relaxed">{activeCase?.vignette}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-900 text-xs">Coding Assignment:</h4>
              <p className="text-slate-600">{activeCase?.question}</p>
            </div>
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
              <span className="font-bold block">Trainee Tip:</span>
              <p>{activeCase?.tip || 'Select the correct codes.'}</p>
            </div>
          </div>
        </section>

        {/* Column 2 – Candidate Codes */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[700px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Choose ICD-10 Codes</h2>
            <span className="text-[11px] font-semibold text-slate-500">{selectedCodes.length} selected</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-2.5">
            <p className="text-xs text-slate-500 mb-1">Click to select or unselect codes. Click on any row to inspect book rules in Column 3:</p>
            {activeCase?.candidateCodes.map((codeStr) => {
              const codeObj = detailedCodes[codeStr];
              const isSelected = selectedCodes.includes(codeStr);
              const isCorrectCode = activeCase?.correctCodes.includes(codeStr);
              let badgeStyle = 'border-slate-200 bg-white hover:border-slate-300';
              if (isSelected) badgeStyle = 'border-blue-600 bg-blue-50/50 shadow-2xs';
              if (submitted) {
                if (isSelected && isCorrectCode) badgeStyle = 'border-emerald-500 bg-emerald-50/60';
                else if (isSelected && !isCorrectCode) badgeStyle = 'border-rose-500 bg-rose-50/60';
                else if (!isSelected && isCorrectCode) badgeStyle = 'border-amber-500 bg-amber-50/60 border-dashed';
              }
              return (
                <div
                  key={codeStr}
                  onClick={() => {
                    toggleCodeSelection(codeStr);
                    if (codeObj) setInspectedCode(codeObj);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${badgeStyle}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">{codeStr}</span>
                        {codeObj && (
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Ch. {codeObj.chapter}</span>
                        )}
                        {submitted && isCorrectCode && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">Correct ✓</span>
                        )}
                        {submitted && isSelected && !isCorrectCode && (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">Incorrect ✕</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900">{codeObj ? codeObj.title : 'Loading description...'}</p>
                    </div>
                    <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-1" />
                  </div>
                </div>
              );
            })}
            {/* Result card */}
            {submitted && (
              <div className={`p-4 rounded-xl border mt-4 space-y-2.5 text-xs animate-fade-in ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{isCorrect ? '🎉 Excellent! Correctly Coded' : '⚠️ Coding Discrepancy Found'}</span>
                  <span className="font-mono font-bold text-xs">Score: {isCorrect ? '100%' : 'Needs Review'}</span>
                </div>
                <p className="leading-relaxed">{activeCase?.explanation}</p>
                <div className="pt-2 border-t border-slate-200/60 font-semibold text-[11px]"><strong>Key Coding Rule:</strong> {activeCase?.keyRule}</div>
              </div>
            )}
          </div>
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button onClick={() => { setSelectedCodes([]); setSubmitted(false); }} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Reset Selection</button>
            <button onClick={handleSubmit} disabled={selectedCodes.length === 0} className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs">
              {submitted ? 'Re‑Evaluate' : 'Submit for Code Evaluation'}
            </button>
            {submitted && (
              <button onClick={pickNextCase} className="px-3 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-xs font-medium">
                Next case
              </button>
            )}
          </div>
        </section>

        {/* Column 3 – Details */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[700px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-sm font-bold text-slate-900">Book Notes &amp; Rules</h2>
            </div>
            {inspectedCode && (
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {inspectedCode.code}
              </span>
            )}
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 text-xs">
            {inspectedCode ? (
              <>
                <div className="space-y-2 pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{inspectedCode.title}</h3>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Chapter</span>
                      <span className="font-semibold text-slate-800">{inspectedCode.chapter} • {inspectedCode.chapter_title}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Block</span>
                      <span className="font-mono font-semibold text-slate-800">{inspectedCode.block || 'None'}</span>
                    </div>
                  </div>
                </div>
                {/* Includes */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    Includes Notes ({inspectedCode.includes?.length || 0})
                  </h4>
                  {inspectedCode.includes && inspectedCode.includes.length > 0 ? (
                    <ul className="space-y-1 pl-2">
                      {inspectedCode.includes.map((inc, i) => (
                        <li key={i} className="text-slate-700 bg-teal-50/50 p-1.5 rounded border border-teal-100">• {inc}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic pl-2">No Includes notes listed.</p>
                  )}
                </div>
                {/* Excludes */}
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    Excludes Notes ({inspectedCode.excludes?.length || 0})
                  </h4>
                  {inspectedCode.excludes && inspectedCode.excludes.length > 0 ? (
                    <ul className="space-y-1 pl-2">
                      {inspectedCode.excludes.map((exc, i) => (
                        <li key={i} className="text-slate-700 bg-amber-50/50 p-1.5 rounded border border-amber-100">• {exc}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic pl-2">No Excludes notes listed.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-400 italic">Select a code to view details.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
