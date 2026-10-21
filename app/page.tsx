import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  const steps = [
    {
      num: '01',
      title: 'Paste Patient Report',
      desc: 'Paste or type a de-identified doctor’s note, discharge summary, or surgical history.',
      icon: (
        <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      accent: 'border-t-teal-600',
    },
    {
      num: '02',
      title: 'Review Suggested Codes',
      desc: 'Examine suggested WHO ICD-10 codes with highlighted evidence, dagger/asterisk links, and Includes/Excludes notes.',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      accent: 'border-t-blue-600',
    },
    {
      num: '03',
      title: 'Export Verified Codes',
      desc: 'Accept or reject codes, re-order clinical sequence, and download in PDF, Word, or CSV format.',
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      accent: 'border-t-emerald-600',
    },
  ];

  const chapters = [
    { num: 'I', range: 'A00–B99', title: 'Certain infectious and parasitic diseases' },
    { num: 'II', range: 'C00–D48', title: 'Neoplasms' },
    { num: 'III', range: 'D50–D89', title: 'Diseases of the blood & immune mechanism' },
    { num: 'IV', range: 'E00–E90', title: 'Endocrine, nutritional & metabolic diseases' },
    { num: 'V', range: 'F00–F99', title: 'Mental and behavioural disorders' },
    { num: 'VI', range: 'G00–G99', title: 'Diseases of the nervous system' },
    { num: 'VII', range: 'H00–H59', title: 'Diseases of the eye and adnexa' },
    { num: 'VIII', range: 'H60–H95', title: 'Diseases of the ear & mastoid process' },
    { num: 'IX', range: 'I00–I99', title: 'Diseases of the circulatory system' },
    { num: 'X', range: 'J00–J99', title: 'Diseases of the respiratory system' },
    { num: 'XI', range: 'K00–K93', title: 'Diseases of the digestive system' },
    { num: 'XII', range: 'L00–L99', title: 'Diseases of the skin & subcutaneous tissue' },
    { num: 'XIII', range: 'M00–M99', title: 'Diseases of the musculoskeletal system' },
    { num: 'XIV', range: 'N00–N99', title: 'Diseases of the genitourinary system' },
    { num: 'XV', range: 'O00–O99', title: 'Pregnancy, childbirth & puerperium' },
    { num: 'XVI', range: 'P00–P96', title: 'Perinatal period conditions' },
    { num: 'XVII', range: 'Q00–Q99', title: 'Congenital malformations & chromosomal' },
    { num: 'XVIII', range: 'R00–R99', title: 'Symptoms & abnormal clinical findings' },
    { num: 'XIX', range: 'S00–T98', title: 'Injury, poisoning & external consequences' },
    { num: 'XX', range: 'V01–Y98', title: 'External causes of morbidity & mortality' },
    { num: 'XXI', range: 'Z00–Z99', title: 'Factors influencing health status' },
    { num: 'XXII', range: 'U04–U85', title: 'Codes for special purposes (e.g. COVID-19)' },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Section */}
      <section className="grid lg:grid-cols-12 gap-8 items-center pt-2 pb-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            WHO ICD-10 (2019 Specification) • Tailored for Indian Hospitals
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            From patient report to <span className="text-teal-700">ICD-10 code</span>, with evidence beside it.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
            A fast, distraction-free clinical coding assistant for hospital medical coders and trainees across India. Paste doctor notes, search 16,455 official WHO codes, inspect dagger/asterisk conventions, and export compliant records.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/workspace"
              className="px-6 py-3 rounded-lg text-sm font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Open Clinical Workspace</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/trainee"
              className="px-5 py-3 rounded-lg text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Practise in Trainee Mode
            </Link>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
            <span className="text-emerald-600 font-bold">✓</span> No US ICD-10-CM confusion • Pure WHO International Classification
          </p>
        </div>

        {/* Hero Interactive SVG Diagram */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Workflow Concept</span>
            <span className="text-teal-700 font-mono">Live Demo Mockup</span>
          </div>
          <svg viewBox="0 0 460 300" className="w-full h-auto drop-shadow-xs" role="img" aria-label="A patient report is converted into ICD-10 codes">
            <rect x="10" y="20" width="190" height="260" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="28" y="42" width="100" height="10" rx="4" fill="#0f172a" />
            <g fill="#e2e8f0">
              <rect x="28" y="70" width="150" height="7" rx="3" />
              <rect x="28" y="88" width="130" height="7" rx="3" />
              <rect x="28" y="130" width="150" height="7" rx="3" />
              <rect x="28" y="148" width="110" height="7" rx="3" />
              <rect x="28" y="190" width="140" height="7" rx="3" />
            </g>
            {/* Highlighted text snippets */}
            <rect x="28" y="104" width="140" height="15" rx="3" fill="#ccfbf1" stroke="#5eead4" />
            <rect x="28" y="162" width="100" height="15" rx="3" fill="#fef3c7" stroke="#fde68a" />
            <rect x="28" y="215" width="130" height="15" rx="3" fill="#e0e7ff" stroke="#c7d2fe" />

            {/* Transition arrow */}
            <path d="M215 150h45m-12-10 12 10-12 10" stroke="#0f766e" strokeWidth="4" fill="none" strokeLinecap="round" />

            {/* Generated Codes */}
            <rect x="275" y="40" width="175" height="66" rx="8" fill="#0f766e" />
            <text x="292" y="68" fill="#ffffff" fontFamily="monospace" fontSize="19" fontWeight="700">E11.2†</text>
            <text x="292" y="90" fill="#ccfbf1" fontSize="11">Type 2 DM with renal comp.</text>

            <rect x="275" y="118" width="175" height="66" rx="8" fill="#1d4ed8" />
            <text x="292" y="146" fill="#ffffff" fontFamily="monospace" fontSize="19" fontWeight="700">N08.3*</text>
            <text x="292" y="168" fill="#dbeafe" fontSize="11">Diabetic glomerular disorder</text>

            <rect x="275" y="196" width="175" height="66" rx="8" fill="#334155" />
            <text x="292" y="224" fill="#ffffff" fontFamily="monospace" fontSize="19" fontWeight="700">I10</text>
            <text x="292" y="246" fill="#cbd5e1" fontSize="11">Essential hypertension</text>
          </svg>
        </div>
      </section>

      {/* 3-Step Simple Diagram */}
      <section className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How Record2Code Works</h2>
          <p className="text-sm text-slate-600 mt-1">A streamlined 3-step workflow designed specifically for hospital clinical coding accuracy.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <div
              key={s.num}
              className={`bg-white border border-slate-200 border-t-4 ${s.accent} rounded-xl p-6 shadow-xs relative transition-transform hover:-translate-y-0.5 duration-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">{s.num} STEP</span>
                <div className="p-2 bg-slate-50 rounded-lg">{s.icon}</div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center text-slate-400 text-xs shadow-xs">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3 Wide Rectangular Explanatory Illustrations */}
      <section className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Core Application Views</h2>
          <p className="text-sm text-slate-600 mt-1">Visual preview of the clinical workspace, official code evaluation, and structured export.</p>
        </div>

        <div className="grid gap-6">
          {/* Card 1: Medical Record Parsing */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 space-y-2">
              <span className="px-2.5 py-1 text-[11px] font-bold bg-teal-50 text-teal-800 rounded border border-teal-200 uppercase tracking-wider">
                1. Clinical Report View
              </span>
              <h3 className="text-xl font-bold text-slate-900">De-Identified Note Parsing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Paste patient discharge summaries, operative notes, or outpatient charts. Supports preset practice cases, character/word counting, and instant marked review.
              </p>
            </div>
            <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-700 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-slate-400 text-[10px]">
                <span>INPATIENT PROGRESS SUMMARY</span>
                <span>DE-IDENTIFIED</span>
              </div>
              <p className="text-slate-800 leading-relaxed">
                "Patient presenting for glycemic optimization. History of longstanding{' '}
                <mark className="bg-teal-100 text-teal-900 px-1 py-0.5 rounded font-bold">Type 2 diabetes mellitus with renal complications</mark>. Lab shows eGFR 42 mL/min consistent with diabetic kidney involvement..."
              </p>
            </div>
          </div>

          {/* Card 2: Code List & Book Notes */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 space-y-2">
              <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-800 rounded border border-blue-200 uppercase tracking-wider">
                2. Code List & Notes
              </span>
              <h3 className="text-xl font-bold text-slate-900">Official WHO ICD-10 Inspector</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every code card displays its chapter, parent 3-character category, block range, terminal leaf status, and crucial Includes and Excludes instructions directly from the official WHO specification.
              </p>
            </div>
            <div className="md:col-span-7 bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-teal-50/60 border border-teal-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-300">E11.2†</span>
                  <span className="font-semibold text-slate-800">Type 2 diabetes mellitus with renal complications</span>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">Dagger Code</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-50/60 border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300">N08.3*</span>
                  <span className="font-semibold text-slate-800">Glomerular disorders in diabetes mellitus</span>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">Asterisk Partner</span>
              </div>
            </div>
          </div>

          {/* Card 3: Exported Report */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 space-y-2">
              <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 rounded border border-emerald-200 uppercase tracking-wider">
                3. Final Review & Export
              </span>
              <h3 className="text-xl font-bold text-slate-900">Zero-Server Client Export</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Export approved code lists instantly to PDF, formatted Microsoft Word (.doc), and CSV spreadsheets directly in your browser. Complete with patient reference number, date, and certified coder verification notes.
              </p>
            </div>
            <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-center gap-3">
              <span className="px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5">
                📄 Download PDF
              </span>
              <span className="px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5">
                📝 Download Word (.doc)
              </span>
              <span className="px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5">
                📊 Download CSV
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Dagger & Asterisk Educational Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">WHO Convention Guide</span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">Dual Coding: Cause (†) & Body Effect (*)</h3>
          <p className="text-sm text-slate-600 max-w-2xl">
            Under WHO ICD-10 rules, diagnostic manifestations require pairing an underlying etiology code with a manifestation code.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-lg bg-teal-50/70 border border-teal-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-teal-900">Dagger Code (†)</span>
              <span className="text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-300">Primary Diagnosis</span>
            </div>
            <p className="text-xs text-slate-700">Identifies the underlying disease or cause (e.g., E11.2† Type 2 diabetes with renal complications). Always sequenced first.</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-blue-900">Asterisk Code (*)</span>
              <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300">Manifestation</span>
            </div>
            <p className="text-xs text-slate-700">Identifies the clinical manifestation in an organ or system (e.g., N08.3* Glomerular disorders). Never sequenced as the primary code.</p>
          </div>
        </div>
      </section>

      {/* 22 Chapters Grid */}
      <section className="space-y-4 pt-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Full Coverage: All 22 WHO ICD-10 Chapters</h2>
          <p className="text-sm text-slate-600 mt-1">16,455 total codes indexed from Chapter I (Infectious diseases) to Chapter XXII (Special purposes).</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {chapters.map((ch) => (
            <div
              key={ch.num}
              className="bg-white border border-slate-200 hover:border-teal-500 rounded-lg p-3 text-xs transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[10px]">
                  Chapter {ch.num}
                </span>
                <span className="font-mono text-[11px] text-slate-500">{ch.range}</span>
              </div>
              <p className="text-slate-800 font-medium line-clamp-2">{ch.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to code your first report?</h2>
          <p className="text-sm text-teal-100">
            Switch between full 3-column clinical coding and interactive trainee evaluation. No account required.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/workspace"
            className="px-5 py-3 rounded-lg text-sm font-bold bg-white text-teal-900 hover:bg-teal-50 transition-colors shadow-sm"
          >
            Launch Workspace
          </Link>
          <Link
            href="/trainee"
            className="px-5 py-3 rounded-lg text-sm font-semibold bg-teal-900 text-teal-100 border border-teal-700 hover:bg-teal-800 transition-colors"
          >
            Trainee Practice
          </Link>
        </div>
      </section>
    </main>
  );
}
