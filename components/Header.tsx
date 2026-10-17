import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { GoogleIcon, CloudIcon, CheckCircleIcon, CloseIcon } from './icons';

interface HeaderProps {
  user?: User | null;
  isLoadingAuth?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  cloudSavedCount?: number;
  onOpenHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoadingAuth = false,
  onSignIn,
  onSignOut,
  cloudSavedCount = 0,
  onOpenHistory,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  return (
    <header className="mb-6 md:mb-8 border-b border-slate-200/80 pb-5 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3.5">
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

        {/* Secure Cloud Account & Login Action */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          {isLoadingAuth ? (
            <div className="h-9 px-3.5 bg-slate-100 rounded-xl animate-pulse flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping"></span>
              <span>Authenticating...</span>
            </div>
          ) : user ? (
            /* Signed In User Pill & Menu */
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 pl-3 pr-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="true"
              >
                <div className="flex items-center gap-1.5 text-left">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-mono font-bold text-slate-900 leading-tight">
                      {user.displayName || 'Logo Creator'}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-mono font-medium flex items-center gap-1">
                      <CloudIcon className="w-3 h-3 text-emerald-600 inline" />
                      <span>Cloud Synced</span>
                    </span>
                  </div>
                </div>

                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Profile'}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shadow-2xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {/* Account Dropdown */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      Cloud Account
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-3">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {user.displayName || 'Creator'}
                    </p>
                    <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                      {user.email}
                    </p>

                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CloudIcon className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-mono font-bold text-emerald-950">
                          Saved in Cloud
                        </span>
                      </div>
                      <span className="bg-emerald-600 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                        {cloudSavedCount}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {onOpenHistory && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onOpenHistory();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-between"
                      >
                        <span>View Saved Creations</span>
                        <span>→</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        if (onSignOut) onSignOut();
                      }}
                      className="w-full text-center px-3 py-2 text-xs font-mono font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Sign In With Google Button */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSignIn}
                className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono font-bold rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                title="Sign in with Google to save created logos across sessions and devices"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Sign In to Save Logos</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
