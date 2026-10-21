'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ExportCodeItem {
  code: string;
  title: string;
  chapter: string;
  block?: string;
  notes?: string;
}

const DEFAULT_CODES: ExportCodeItem[] = [
  {
    code: 'E11.2',
    title: 'Type 2 diabetes mellitus with renal complications',
    chapter: 'IV',
    block: 'E10-E14',
    notes: 'Primary diagnosis (Dagger code †)',
  },
  {
    code: 'N08.3',
    title: 'Glomerular disorders in diabetes mellitus',
    chapter: 'XIV',
    block: 'N00-N08',
    notes: 'Manifestation code (Asterisk partner *)',
  },
  {
    code: 'I10',
    title: 'Essential (primary) hypertension',
    chapter: 'IX',
    block: 'I10-I15',
    notes: 'Comorbidity',
  },
  {
    code: 'J44.1',
    title: 'Chronic obstructive pulmonary disease with acute exacerbation, unspecified',
    chapter: 'X',
    block: 'J40-J47',
    notes: 'Secondary diagnosis',
  },
];

export default function ExportPage() {
  const [patientRef, setPatientRef] = useState('ENC-2026-IND-8841');
  const [hospitalName, setHospitalName] = useState('Apollo Indraprastha Healthcare, New Delhi');
  const [coderName, setCoderName] = useState('Senior Clinical Coder (Cert. #IND-4421)');
  const [encounterDate, setEncounterDate] = useState(new Date().toISOString().split('T')[0]);
  const [codes, setCodes] = useState<ExportCodeItem[]>(DEFAULT_CODES);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newTitleInput, setNewTitleInput] = useState('');

  // Load accepted codes from Workspace if available
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('record2code_accepted_codes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCodes(
            parsed.map((item: any) => ({
              code: item.code,
              title: item.title,
              chapter: item.chapter,
              block: item.block,
              notes: item.evidence?.matchReason || 'Accepted from workspace',
            }))
          );
        }
      }
    } catch {}
  }, []);

  // 1. Client-Side Download CSV
  const handleDownloadCSV = () => {
    const headers = ['Sequence', 'ICD-10 Code', 'Diagnosis Title', 'Chapter', 'Block Range', 'Clinical Notes'];
    const rows = codes.map((c, i) => [
      i + 1,
      `"${c.code}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"Chapter ${c.chapter}"`,
      `"${c.block || ''}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const meta = [
      ['Record2Code - Official WHO ICD-10 Coding Summary'],
      [`Patient / Encounter Ref:`, `"${patientRef}"`],
      [`Healthcare Facility:`, `"${hospitalName}"`],
      [`Certified Coder:`, `"${coderName}"`],
      [`Date Generated:`, `"${encounterDate}"`],
      [`Compliance Notice:`, `"A certified medical coder must verify all codes prior to claim submission."`],
      [],
    ];

    const csvContent =
      '\uFEFF' +
      meta.map((e) => e.join(',')).join('\n') +
      headers.join(',') +
      '\n' +
      rows.map((e) => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Record2Code_${patientRef || 'Encounter'}_${encounterDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Client-Side Download Word (.doc)
  const handleDownloadWord = () => {
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Record2Code Coding Summary</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
          h1 { color: #00685f; font-size: 20pt; border-bottom: 2pt solid #00685f; padding-bottom: 6px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
          .meta-table td { padding: 4px 8px; }
          .meta-label { font-weight: bold; color: #475569; width: 160px; }
          .code-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt; }
          .code-table th { background-color: #f1f5f9; color: #0f172a; border: 1pt solid #cbd5e1; padding: 8px; text-align: left; }
          .code-table td { border: 1pt solid #e2e8f0; padding: 8px; }
          .code-cell { font-family: 'Courier New', monospace; font-weight: bold; color: #00685f; }
          .notice-box { margin-top: 25px; padding: 12px; background-color: #fffbeb; border: 1pt solid #fef3c7; border-left: 4pt solid #d97706; font-size: 9pt; color: #92400e; }
        </style>
      </head>
      <body>
        <h1>Record2Code • WHO ICD-10 Clinical Coding Summary</h1>
        <table class="meta-table">
          <tr><td class="meta-label">Patient / Encounter Ref:</td><td>${patientRef}</td></tr>
          <tr><td class="meta-label">Healthcare Facility:</td><td>${hospitalName}</td></tr>
          <tr><td class="meta-label">Reviewing Coder:</td><td>${coderName}</td></tr>
          <tr><td class="meta-label">Date Generated:</td><td>${encounterDate}</td></tr>
          <tr><td class="meta-label">Standard Applied:</td><td>Official WHO ICD-10 (2019 Release)</td></tr>
        </table>

        <h3>Accepted Diagnostic Codes</h3>
        <table class="code-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 90px;">ICD-10 Code</th>
              <th>Diagnosis Description</th>
              <th style="width: 80px;">Chapter</th>
              <th style="width: 90px;">Block</th>
              <th>Clinical Notes</th>
            </tr>
          </thead>
          <tbody>
            ${codes
              .map(
                (c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="code-cell">${c.code}</td>
                <td><strong>${c.title}</strong></td>
                <td>Chapter ${c.chapter}</td>
                <td>${c.block || '—'}</td>
                <td>${c.notes || '—'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="notice-box">
          <strong>Mandatory Compliance Notice:</strong> All diagnostic codes listed above are generated from the official World Health Organization ICD-10 standard. Under Indian health administration and insurance guidelines, a certified medical coder must verify all codes prior to claim submission.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Record2Code_${patientRef || 'Encounter'}_${encounterDate}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Client-Side Print / PDF
  const handleDownloadPDF = () => {
    window.print();
  };

  const handleAddCode = () => {
    if (!newCodeInput.trim() || !newTitleInput.trim()) return;
    setCodes((prev) => [
      ...prev,
      {
        code: newCodeInput.trim().toUpperCase(),
        title: newTitleInput.trim(),
        chapter: 'I',
        notes: 'Manual entry',
      },
    ]);
    setNewCodeInput('');
    setNewTitleInput('');
  };

  const handleRemoveCode = (codeToRemove: string) => {
    setCodes((prev) => prev.filter((c) => c.code !== codeToRemove));
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 print-container">
      {/* Page Header (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            Export Module
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Finalize & Export Coded Records
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Generate client-side PDF, Microsoft Word, and CSV files instantly with zero server storage.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Download PDF</span>
            <span className="text-[10px] opacity-80">(Print)</span>
          </button>
          <button
            onClick={handleDownloadWord}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Download Word (.doc)</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Printable Letterhead Header */}
        <div className="border-b border-slate-200 pb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-800 text-white font-bold text-xs font-mono">
                WHO ICD-10
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Record2Code Clinical Coding Summary
              </h2>
            </div>
            <p className="text-xs text-slate-500">Official World Health Organization ICD-10 Classification Summary</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Date Generated:</p>
            <p className="font-mono">{encounterDate}</p>
          </div>
        </div>

        {/* Encounter Metadata Form */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-600 block uppercase text-[10px]">Patient / Encounter ID</label>
            <input
              type="text"
              value={patientRef}
              onChange={(e) => setPatientRef(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 block uppercase text-[10px]">Hospital / Healthcare Facility</label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 block uppercase text-[10px]">Reviewing Medical Coder</label>
            <input
              type="text"
              value={coderName}
              onChange={(e) => setCoderName(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 block uppercase text-[10px]">Encounter Date</label>
            <input
              type="date"
              value={encounterDate}
              onChange={(e) => setEncounterDate(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Coded Diagnoses Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Accepted ICD-10 Diagnostic Codes ({codes.length})
            </h3>
            <span className="text-xs text-slate-400 no-print">Sequenced for Clinical Priority</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-4 w-28">Code</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-3 w-24">Chapter</th>
                  <th className="py-2.5 px-3 w-28">Block</th>
                  <th className="py-2.5 px-4">Clinical Notes</th>
                  <th className="py-2.5 px-3 w-12 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No codes accepted. Return to the{' '}
                      <Link href="/workspace" className="text-teal-700 underline font-semibold">
                        Workspace
                      </Link>{' '}
                      to add codes.
                    </td>
                  </tr>
                ) : (
                  codes.map((c, i) => (
                    <tr key={c.code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-medium">
                        {i + 1}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {c.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        Ch. {c.chapter}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {c.block || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 italic text-[11px]">
                        {c.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center no-print">
                        <button
                          onClick={() => handleRemoveCode(c.code)}
                          className="text-slate-400 hover:text-rose-600 font-bold"
                          title="Remove code"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Code Quick Bar (Hidden in Print) */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-2 no-print text-xs">
          <span className="font-semibold text-slate-600">Quick Add:</span>
          <input
            type="text"
            placeholder="Code (e.g. A00.0)"
            value={newCodeInput}
            onChange={(e) => setNewCodeInput(e.target.value)}
            className="w-28 p-1.5 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Diagnosis Title (e.g. Cholera due to Vibrio...)"
            value={newTitleInput}
            onChange={(e) => setNewTitleInput(e.target.value)}
            className="flex-1 min-w-[200px] p-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
          />
          <button
            onClick={handleAddCode}
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-semibold transition-colors"
          >
            Add to List
          </button>
        </div>

        {/* Mandatory Verification Note */}
        <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span className="text-base">⚠️</span>
            <span>Mandatory Clinical Coder Verification</span>
          </div>
          <p className="leading-relaxed">
            This coded summary was generated via Record2Code applying the official WHO ICD-10 (2019 Release) nomenclature. Under national healthcare compliance and insurance guidelines, all codes must be reviewed and countersigned by a certified medical coder prior to official archiving or billing submission.
          </p>
        </div>
      </div>
    </main>
  );
}
