import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="mb-6 md:mb-8 border-b border-slate-200/80 pb-5 pt-2">
      <div className="flex items-center gap-3.5">
        {/* Emblem from attached logo */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0">
          <svg viewBox="0 0 300 300" className="w-full h-full text-[#2D5A3E]">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="150" cy="150" r="125" strokeWidth="20" />
              <line x1="100" y1="45" x2="100" y2="255" strokeWidth="20" />
              <path d="M 235 88 A 72 72 0 1 0 235 212" strokeWidth="20" />
              <line x1="150" y1="150" x2="250" y2="150" strokeWidth="20" />
            </g>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D5A3E] font-sans">
            Logo-go Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#2D5A3E]/85 font-sans mt-0.5 font-medium">
            Instant AI Logo Generator &amp; Motion Stage
          </p>
        </div>
      </div>
    </header>
  );
};

