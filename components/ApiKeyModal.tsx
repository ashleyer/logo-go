import React, { useState, useEffect } from 'react';
import { CloseIcon, KeyIcon, CheckCircleIcon, SparklesIcon } from './icons';
import { 
  getApiKey, 
  getKeySource, 
  setStoredApiKey, 
  removeStoredApiKey, 
  validateApiKey 
} from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [currentSource, setCurrentSource] = useState<'environment' | 'storage' | 'none'>('none');
  const [activeKeyMasked, setActiveKeyMasked] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const activeKey = getApiKey();
      const source = getKeySource();
      setCurrentSource(source);
      setStatusMessage(null);
      if (activeKey && activeKey.length > 8) {
        setActiveKeyMasked(`${activeKey.slice(0, 6)}...${activeKey.slice(-4)}`);
      } else {
        setActiveKeyMasked('');
      }
      setKeyInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    if (!cleanKey) {
      setStatusMessage({ type: 'error', text: 'Please enter your Gemini API key.' });
      return;
    }

    setIsValidating(true);
    setStatusMessage({ type: 'info', text: 'Validating key with Google Gemini API...' });

    try {
      const result = await validateApiKey(cleanKey);
      if (result.valid) {
        setStoredApiKey(cleanKey);
        setCurrentSource('storage');
        setActiveKeyMasked(`${cleanKey.slice(0, 6)}...${cleanKey.slice(-4)}`);
        setStatusMessage({
          type: 'success',
          text: 'API Key successfully verified and saved! Full Gemini AI generation and Veo animations are now active.',
        });
        setKeyInput('');
        onKeyUpdated();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to validate API key. Please verify at aistudio.google.com/apikey.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Network error while contacting Gemini API.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveKey = () => {
    removeStoredApiKey();
    setCurrentSource(getKeySource());
    const remaining = getApiKey();
    if (remaining) {
      setActiveKeyMasked(`${remaining.slice(0, 6)}...${remaining.slice(-4)}`);
    } else {
      setActiveKeyMasked('');
    }
    setStatusMessage({
      type: 'info',
      text: 'Custom key removed from browser storage.',
    });
    onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="api-key-modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <KeyIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="api-key-modal-title" className="text-base sm:text-lg font-bold font-mono text-slate-900">
                Gemini API Key Settings
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Configure your API key for Vercel &amp; custom hosting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Close dialog"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Current Status Box */}
          <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Connection Status
              </span>
              {currentSource !== 'none' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active ({currentSource === 'environment' ? 'Vercel / Cloud' : 'Browser Storage'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Procedural Engine Active
                </span>
              )}
            </div>

            {currentSource !== 'none' ? (
              <div className="space-y-1 text-xs font-mono text-slate-600">
                <p>
                  <span className="text-slate-400">Current Key:</span>{' '}
                  <span className="font-bold text-slate-800">{activeKeyMasked}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {currentSource === 'environment'
                    ? 'Supplied via VITE_GEMINI_API_KEY environment variable.'
                    : 'Saved securely in your browser localStorage.'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                No Gemini API key is currently detected on this domain. The app is running smoothly using the built-in <strong>Vector Design Engine</strong>. Enter your Gemini API key below to unlock Google Imagen AI neural logo generation, Veo animations, and smart brand suggestions.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAndTest} className="space-y-3">
            <div>
              <label htmlFor="gemini-key-input" className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                Enter or Update Gemini API Key
              </label>
              <div className="relative">
                <input
                  id="gemini-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API key (e.g. AQ... or AIza...)"
                  disabled={isValidating}
                  className="w-full px-3.5 py-2.5 pr-20 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {statusMessage && (
              <div 
                className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 ${
                  statusMessage.type === 'success' 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
                    : statusMessage.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-900'
                    : 'bg-blue-50 border border-blue-200 text-blue-900'
                }`}
              >
                <span className="flex-shrink-0">
                  {statusMessage.type === 'success' ? '✓' : statusMessage.type === 'error' ? '⚠️' : 'ℹ️'}
                </span>
                <span className="leading-relaxed">{statusMessage.text}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isValidating || !keyInput.trim()}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    <span>Verifying with Gemini...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 text-emerald-200" />
                    <span>Verify &amp; Save Key</span>
                  </>
                )}
              </button>

              {currentSource === 'storage' && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-mono font-semibold text-xs rounded-xl transition-colors"
                >
                  Clear Key
                </button>
              )}
            </div>
          </form>

          {/* Quick Help Guide */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-600">
              Where to get your key &amp; how to configure Vercel:
            </h3>
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-sans text-slate-600">
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-emerald-700">1.</span>
                <p>
                  Get your free Gemini API key from Google AI Studio at{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline font-bold font-mono"
                  >
                    aistudio.google.com/apikey ↗
                  </a>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-emerald-700">2.</span>
                <p>
                  <strong>For this browser:</strong> Paste it above and click <em>Verify &amp; Save Key</em>. It starts working immediately without any redeploy!
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-emerald-700">3.</span>
                <p>
                  <strong>For all Vercel visitors:</strong> In your Vercel Dashboard → <em>Project Settings</em> → <em>Environment Variables</em>, add:
                  <br />
                  <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">
                    VITE_GEMINI_API_KEY
                  </code>{' '}
                  = <em>your_api_key</em>, then click <strong>Redeploy</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono font-bold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
