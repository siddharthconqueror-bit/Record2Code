'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const FAQS = [
  {
    q: 'Why does Record2Code use WHO ICD-10 instead of US ICD-10-CM?',
    a: 'Indian hospital information systems, the National Health Authority (NHA), and Ayushman Bharat PM-JAY mandate the official World Health Organization ICD-10 (2019 release). US ICD-10-CM contains non-standard 7th character extensions, localized billing codes, and stage-specific CKD subdivisions that do not conform to international WHO standards.',
  },
  {
    q: 'How does the dual coding (dagger † and asterisk *) system work?',
    a: 'WHO ICD-10 uses dual coding to represent conditions where an underlying systemic etiology causes a local organ manifestation. The dagger code (†) represents the etiology (e.g. E11.2† for Diabetic Nephropathy) and must be sequenced first. The asterisk code (*) represents the organ manifestation (e.g. N08.3* for Glomerular disorder) and is sequenced second.',
  },
  {
    q: 'Can I export reports without sending patient data to a server?',
    a: 'Yes. All PDF, Word (.doc), and CSV file generations occur entirely inside your browser using client-side Blobs. No patient names, hospital identifiers, or clinical reports are stored or transmitted to external servers.',
  },
  {
    q: 'How should I report a coding discrepancy or missing synonym?',
    a: 'Record2Code strictly utilizes verbatim codes from the WHO XML source. If a clinician uses an unusual synonym, use the Code Search box in the workspace to locate the official WHO title, or submit a request via the feedback form below.',
  },
  {
    q: 'Who is required to verify the final code assignments?',
    a: 'Every diagnostic code must be reviewed and accepted by a certified medical coder or medical records officer prior to submitting insurance claims or finalizing patient charts.',
  },
];

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hospital, setHospital] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          Support & Guidance
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Help Center & Clinical Coding Support
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
          Guidelines, frequently asked questions, and assistance for hospital medical coders across India.
        </p>
      </div>

      {/* Grid: FAQ & Contact Form */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: FAQs (7 cols) */}
        <section className="lg:col-span-7 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Common questions regarding WHO ICD-10 and Record2Code usage.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white border border-slate-200 rounded-xl p-4 transition-all duration-200 hover:border-teal-500 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-900 list-none">
                  <span className="pr-4">{faq.q}</span>
                  <span className="text-teal-700 transition-transform group-open:rotate-180 shrink-0 font-bold">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          {/* Quick Help Card */}
          <div className="p-5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 text-xs">
            <h3 className="font-bold text-teal-950 flex items-center gap-1.5 text-sm">
              <span>💡</span> Coding Refresher Reference
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Always check <strong>Includes</strong> notes to see which conditions belong under a 3-character category, and <strong>Excludes</strong> notes to ensure you are not missing a more specific code elsewhere in the book.
            </p>
            <div className="pt-2">
              <Link href="/workspace" className="text-teal-800 font-bold underline hover:text-teal-950">
                Launch Workspace to Inspect Notes →
              </Link>
            </div>
          </div>
        </section>

        {/* Right Column: Contact Form (5 cols) */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Contact Support & Feedback</h2>
            <p className="text-xs text-slate-500 mt-1">
              Have questions regarding classification rules or hospital deployment? Leave us a note.
            </p>
          </div>

          {submitted ? (
            <div className="p-5 rounded-lg bg-teal-50 border border-teal-200 text-center space-y-2 animate-fade-in">
              <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                ✓
              </div>
              <h3 className="font-bold text-teal-900 text-sm">Thank You for Reaching Out!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your message has been received by our clinical informatics team. We will review your query and get in touch with your hospital coding department shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
                className="mt-3 px-4 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma / Coder Ananya"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org.in"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Hospital / Institution</label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="e.g. Fortis Hospital, Bengaluru"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Message / Coding Question</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry, requested WHO code clarification, or suggestion..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
              >
                Submit Inquiry
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
