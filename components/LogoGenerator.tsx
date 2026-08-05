
import React, { useState, useRef } from 'react';
import { Loader } from './Loader';
import { SparklesIcon, UploadIcon, ImageIcon, CloseIcon, HistoryIcon } from './icons';
import { LogoStyleId, LOGO_STYLES, ReferenceImage } from '../types';

interface LogoGeneratorProps {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  selectedStyle: LogoStyleId;
  setSelectedStyle: React.Dispatch<React.SetStateAction<LogoStyleId>>;
  referenceImage: ReferenceImage | null;
  setReferenceImage: React.Dispatch<React.SetStateAction<ReferenceImage | null>>;
  onGenerate: () => void;
  onGenerateBatch: () => void;
  isLoading: boolean;
  suggestions: string[];
  isLoadingSuggestions: boolean;
  historyCount?: number;
  onOpenHistory?: () => void;
}

export const LogoGenerator: React.FC<LogoGeneratorProps> = ({ 
  prompt, 
  setPrompt, 
  selectedStyle,
  setSelectedStyle,
  referenceImage,
  setReferenceImage,
  onGenerate, 
  onGenerateBatch,
  isLoading, 
  suggestions, 
  isLoadingSuggestions,
  historyCount = 0,
  onOpenHistory
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSuggestionClick = (suggestion: string) => {
    // Correctly handle an empty prompt to avoid a leading comma
    setPrompt(prev => prev.trim() ? `${prev.trim()}, ${suggestion}` : suggestion);
  };

  const processFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG, JPG, WebP, SVG, etc.).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract pure base64 string after comma
      const commaIndex = result.indexOf(',');
      const base64 = commaIndex !== -1 ? result.substring(commaIndex + 1) : result;

      setReferenceImage({
        base64,
        mimeType: file.type || 'image/png',
        fileName: file.name,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const canGenerate = prompt.trim().length > 0 || referenceImage !== null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-3 flex items-center gap-3 font-mono text-slate-900">
        <span className="bg-emerald-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm font-mono shadow-xs">1</span>
        The Vision
      </h2>
      <p className="text-slate-600 text-xs sm:text-sm mb-5 font-sans leading-relaxed">
        Describe your Business/Organization/Group, person (name or initials), mission statement, impression & characteristics, and color choices, or upload an existing logo, a UI screenshot, an image you like, or a sketch for reference.
      </p>

      {/* Visual Logo Style Selector */}
      <div className="mb-5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
          <span>🎨</span> Select Aesthetic Style
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LOGO_STYLES.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                disabled={isLoading}
                type="button"
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 focus:outline-none h-22 ${
                  isSelected 
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' 
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <span className={`font-mono font-bold text-xs ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                  {style.name}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight font-sans">
                  {style.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Reference / Upload Section */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span>🖼️</span> Reference Image / Sketch <span className="text-[10px] font-normal text-slate-400 lowercase">(optional)</span>
          </label>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {referenceImage ? (
          <div className="bg-slate-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between gap-3 relative">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                <img 
                  src={referenceImage.previewUrl || `data:${referenceImage.mimeType};base64,${referenceImage.base64}`} 
                  alt="Uploaded reference" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono font-bold text-slate-800 truncate">
                  {referenceImage.fileName || 'Uploaded Reference Image'}
                </p>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                  Ready to Enhance & Vectorize
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReferenceImage(null)}
              disabled={isLoading}
              className="p-1.5 bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-full transition-colors focus:outline-none"
              title="Remove reference image"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-400'
            }`}
          >
            <UploadIcon className="w-5 h-5 text-emerald-600" />
            <p className="text-xs font-mono font-bold text-slate-800">
              Upload an existing logo, a UI screenshot, an image you like, or a sketch for reference
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              PNG, JPG, WebP, SVG — Gemini will enhance & vectorize your design
            </p>
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="logo-prompt" className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>✍️</span> Business/Organization/Group, Person, Mission, Impression & Color Choices
            </label>
          </div>

          {/* Structured template helper chips */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => handleSuggestionClick('Business/Organization/Group: "Studio Vanguard"')}
              className="text-[10px] font-mono font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 py-0.5 rounded-md transition-colors"
            >
              + Business/Organization/Group
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick('Person: "A.R."')}
              className="text-[10px] font-mono font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 py-0.5 rounded-md transition-colors"
            >
              + Person / Initials
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick('Mission: "Pioneer sustainable tech"')}
              className="text-[10px] font-mono font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 py-0.5 rounded-md transition-colors"
            >
              + Mission / Goals
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick('Impression: "Sleek, confident, minimalist"')}
              className="text-[10px] font-mono font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 py-0.5 rounded-md transition-colors"
            >
              + Impression / Effect
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick('Colors: Emerald green & matte gold')}
              className="text-[10px] font-mono font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 py-0.5 rounded-md transition-colors"
            >
              + Color Choices
            </button>
          </div>

          <textarea
            id="logo-prompt"
            className="w-full flex-grow bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-none placeholder:text-slate-400 text-xs sm:text-sm leading-relaxed font-sans"
            rows={referenceImage ? 3 : 4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              referenceImage 
                ? 'e.g., Person: Alex Rivera (AR), Business/Organization/Group: Apex Athletics, Mission: Peak performance, Impression: Energetic falcon emblem, Colors: Navy & emerald...'
                : 'e.g., Person: Jordan Lee (JL), Business/Organization/Group: Solstice Cafe, Mission: Community warmth, Impression: Minimalist & organic, Colors: Terracotta & sage green...'
            }
            disabled={isLoading}
          />
      </div>

      { (isLoadingSuggestions || suggestions.length > 0) &&
        <div className="mt-3">
            <h4 className="text-xs font-mono font-bold text-slate-600 mb-2">AI Suggestions...</h4>
            {isLoadingSuggestions ? (
                <div role="status" className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader className="w-3.5 h-3.5" />
                    Generating keyword ideas...
                </div>
            ) : (
                <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSuggestionClick(s)}
                            aria-label={`Add suggestion: ${s}`}
                            className="bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 px-2.5 py-1 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 transition-colors focus:outline-none"
                        >
                           {`+ "${s}"`}
                        </button>
                    ))}
                </div>
            )}
        </div>
      }

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Primary Logo Generation Button */}
          <button
            onClick={onGenerate}
            disabled={isLoading || !canGenerate}
            aria-busy={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-mono font-bold py-3.5 px-3 rounded-xl flex items-center justify-center transition-all duration-200 text-xs sm:text-sm shadow-md"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-1.5 text-emerald-200" aria-hidden="true" />
                <span>{referenceImage ? "Enhance Logo" : "Create 1 Emblem"}</span>
              </>
            )}
          </button>

          {/* Create 25 Logo Versions Button */}
          <button
            onClick={onGenerateBatch}
            disabled={isLoading || !canGenerate}
            aria-busy={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-mono font-bold py-3.5 px-3 rounded-xl flex items-center justify-center transition-all duration-200 text-xs sm:text-sm shadow-md border border-slate-700"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2" />
                <span>Creating 25...</span>
              </>
            ) : (
              <>
                <span className="mr-1.5 text-xs font-mono font-black text-emerald-400">25×</span>
                <span>Create Variations</span>
              </>
            )}
          </button>
        </div>

        {/* Session Creations Gallery Shortcut */}
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <HistoryIcon className="w-4 h-4 text-emerald-600" />
            <span>Open Session Gallery</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {historyCount} Saved
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
