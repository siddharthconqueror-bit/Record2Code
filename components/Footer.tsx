import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Important notice"></span>
            <span className="font-semibold text-slate-700">
              Clinical Coding Notice:
            </span>
            <span>
              All suggested codes are generated from the official WHO ICD-10 specification. A certified medical coder must verify all codes prior to claim submission or clinical documentation filing.
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Official WHO ICD-10 (2019 Release)</span>
            <span>•</span>
            <span>Indian Hospital Health Informatics</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} Record2Code. Designed for Indian hospital medical coders and trainees.</p>
          <p>Strictly non-identifiable / de-identified patient records only.</p>
        </div>
      </div>
    </footer>
  );
}
