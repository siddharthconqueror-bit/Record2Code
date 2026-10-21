'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show for at most 1.2s to ensure fast UX and not block user
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div
      role="status"
      aria-label="Loading Record2Code"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm transition-opacity duration-300"
    >
      <div className="flex flex-col items-center gap-6 px-4">
        {/* Logo with fade-in animation */}
        <div className="animate-logo-fade flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Record2Code Logo"
            width={240}
            height={60}
            priority
            className="h-12 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* ECG Heartbeat Line */}
        <div className="w-64 h-16 relative flex items-center justify-center">
          <svg
            viewBox="0 0 300 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-hidden="true"
          >
            {/* Background subtle grid guide */}
            <path
              d="M0 40 H300"
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Animated ECG Pulse Line */}
            <path
              d="M0 40 L60 40 L75 40 L85 25 L95 60 L110 5 L125 70 L135 35 L145 45 L155 40 L210 40 L220 30 L230 48 L240 40 L300 40"
              stroke="#14b8a6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ecg-line"
            />
          </svg>
        </div>

        <p className="text-xs font-medium text-teal-300 tracking-wider uppercase animate-pulse">
          Loading WHO ICD-10 Workspace...
        </p>
      </div>

      <style jsx>{`
        .ecg-line {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawEcg 1.2s ease-in-out forwards;
        }

        @keyframes drawEcg {
          0% {
            stroke-dashoffset: 400;
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        .animate-logo-fade {
          animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.96);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ecg-line,
          .animate-logo-fade {
            animation: none !important;
            stroke-dashoffset: 0 !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
