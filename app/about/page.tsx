import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="space-y-3 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          About Record2Code
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Clinical Coding Intelligence for Indian Healthcare
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          Record2Code is a purpose-built coding workspace engineered for hospital medical coders, billing teams, and trainees across India.
        </p>
      </div>

      {/* Mission & Purpose */}
      <section className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">What Record2Code Is</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In hospital operations, transforming lengthy unstructured medical records into standardized diagnostic codes is vital for patient care records, disease surveillance, and insurance reimbursement.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Record2Code streamlines this process by pairing clinical notes directly with the official WHO ICD-10 database. Coders can review suggested codes side-by-side with the doctor’s documentation, verify Includes and Excludes guidelines, and export finalized records without server bottlenecks.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            Key Operating Principles
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="text-teal-700 font-bold">1.</span>
              <span><strong>Zero Guesswork:</strong> Every code and title is pulled directly from the official WHO specification (16,455 codes across 22 chapters). Never edited or hallucinated.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-teal-700 font-bold">2.</span>
              <span><strong>Human-in-the-Loop:</strong> AI and heuristic tools suggest; qualified medical coders verify and accept.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-teal-700 font-bold">3.</span>
              <span><strong>Privacy First:</strong> Designed strictly for de-identified notes with zero patient data retention on external servers.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Why Official WHO ICD-10 (Not US ICD-10-CM) */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-teal-100 text-teal-800 rounded">
            Important Classification Distinction
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Official WHO ICD-10 vs. US ICD-10-CM
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Many online tools and coding websites default to the United States clinical modification (ICD-10-CM). This causes major compliance errors in Indian hospitals:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-teal-900 text-sm">Official WHO ICD-10 (Used Here)</h4>
              <span className="text-xs font-bold text-teal-700">Standard in India</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard adopted by the World Health Organization and Indian health systems (including Ayushman Bharat PM-JAY and national registries). Contains 22 chapters, standard dagger/asterisk conventions, and no US-specific modifier digits.
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">US ICD-10-CM (Not Applicable)</h4>
              <span className="text-xs font-bold text-rose-700">US Only</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Contains over 70,000 localized US codes, stage-wise CKD numbers (e.g. N18.3), and 7th character encounter extensions (A/D/S) that are invalid under international WHO reporting.
            </p>
          </div>
        </div>
      </section>

      {/* Who Record2Code is For */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Who Record2Code is For</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-lg">
              🏥
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hospital Medical Coders</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rapidly cross-reference diagnoses against the official WHO index. Verify Excludes notes and avoid claim rejections.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg">
              🎓
            </div>
            <h3 className="font-bold text-slate-900 text-base">Trainee Coders & Students</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Practise with realistic clinical vignettes in Trainee Mode. Learn dual coding rules, acute vs. chronic sequencing, and negation detection.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-lg">
              📑
            </div>
            <h3 className="font-bold text-slate-900 text-base">Audit & Billing Teams</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export verified code summaries in Word, PDF, or CSV for internal QA audits, hospital information systems (HIS), and third-party claims.
            </p>
          </div>
        </div>
      </section>

      {/* Ready Navigation */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Start exploring the workspace</h3>
          <p className="text-xs text-slate-500">Test with preset cases or enter your own de-identified doctor’s note.</p>
        </div>
        <Link
          href="/workspace"
          className="px-5 py-2.5 rounded-lg text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs"
        >
          Open Workspace
        </Link>
      </div>
    </main>
  );
}
