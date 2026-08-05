import React, { useState, useEffect, useRef } from 'react';
import { LogoData, LOGO_STYLES } from '../types';
import { DownloadIcon } from './icons';

interface LogoDisplayProps {
  logo: LogoData | null;
}

type ColorTone = 'original' | 'emerald' | 'warm' | 'cyber' | 'obsidian' | 'sepia' | 'monochrome' | 'custom';
type BgMode = 'transparent' | 'white' | 'cream' | 'dark' | 'emerald' | 'custom';

export const LogoDisplay: React.FC<LogoDisplayProps> = ({ logo }) => {
  const [activePaletteIndex, setActivePaletteIndex] = useState<number>(0);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Color Tuning States
  const [colorTone, setColorTone] = useState<ColorTone>('original');
  const [customTintHex, setCustomTintHex] = useState<string>('#10B981');
  const [bgMode, setBgMode] = useState<BgMode>('transparent');
  const [customBgHex, setCustomBgHex] = useState<string>('#0F172A');

  const imgRef = useRef<HTMLImageElement>(null);

  // Reset states whenever a new logo arrives
  useEffect(() => {
    setActivePaletteIndex(0);
    setColorTone('original');
    setBgMode('transparent');
  }, [logo]);

  // File size metadata
  const sizeInBytes = logo ? Math.round(logo.base64.length * 0.75) : 0;
  const sizeInKb = (sizeInBytes / 1024).toFixed(1);
  const styleName = logo?.style ? (LOGO_STYLES.find((s) => s.id === logo.style)?.name || logo.style) : 'Custom';
  const downloadFilename = `logo-go-${logo?.style || 'custom'}.png`;

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Get active CSS filter string for image preview
  const getFilterStyle = (): React.CSSProperties => {
    switch (colorTone) {
      case 'emerald':
        return { filter: 'hue-rotate(90deg) saturate(1.5) contrast(1.1)' };
      case 'warm':
        return { filter: 'sepia(0.6) saturate(1.8) hue-rotate(-20deg)' };
      case 'cyber':
        return { filter: 'hue-rotate(185deg) saturate(2.2) brightness(1.1)' };
      case 'obsidian':
        return { filter: 'grayscale(1) contrast(1.6) brightness(0.9)' };
      case 'sepia':
        return { filter: 'sepia(0.95) hue-rotate(-15deg) contrast(1.1)' };
      case 'monochrome':
        return { filter: 'grayscale(1) contrast(2.2)' };
      case 'custom':
        return {
          filter: `drop-shadow(0 0 1px ${customTintHex}) saturate(1.5)`,
        };
      default:
        return {};
    }
  };

  // Get background style for stage
  const getBgStyle = (): React.CSSProperties => {
    switch (bgMode) {
      case 'white':
        return { backgroundColor: '#FFFFFF' };
      case 'cream':
        return { backgroundColor: '#FEFAE0' };
      case 'dark':
        return { backgroundColor: '#0F172A' };
      case 'emerald':
        return { backgroundColor: '#022C22' };
      case 'custom':
        return { backgroundColor: customBgHex };
      default:
        return {
          backgroundImage:
            'radial-gradient(#CBD5E1 1px, transparent 1px), radial-gradient(#CBD5E1 1px, #F8FAFC 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
        };
    }
  };

  // Enhanced download with applied backdrop & color tune
  const handleDownloadTuned = (dimension: number = 2048) => {
    if (!logo) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `data:${logo.mimeType};base64,${logo.base64}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = dimension;
      canvas.height = dimension;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background if not transparent
      if (bgMode !== 'transparent') {
        let fillCol = '#FFFFFF';
        if (bgMode === 'white') fillCol = '#FFFFFF';
        else if (bgMode === 'cream') fillCol = '#FEFAE0';
        else if (bgMode === 'dark') fillCol = '#0F172A';
        else if (bgMode === 'emerald') fillCol = '#022C22';
        else if (bgMode === 'custom') fillCol = customBgHex;

        ctx.fillStyle = fillCol;
        ctx.fillRect(0, 0, dimension, dimension);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply filter to canvas context if supported
      const filterObj = getFilterStyle();
      if (filterObj.filter) {
        ctx.filter = filterObj.filter;
      }

      ctx.drawImage(img, 0, 0, dimension, dimension);

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `logo-go-${logo.style || 'custom'}-${colorTone}-${dimension}px.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to export tuned logo:', err);
      }
    };
  };

  return (
    <>
      {/* Header / Info bar */}
      <div className="flex items-center justify-between mb-2 min-h-[38px] flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-800">
            Your Emblem Studio
          </h3>
          {logo && logo.style && (
            <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {styleName}
            </span>
          )}
          {(colorTone !== 'original' || bgMode !== 'transparent') && (
            <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs">
              ✨ Color Tuned
            </span>
          )}
        </div>

        {logo && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleDownloadTuned(512)}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all duration-200 border border-slate-200"
              title="Download standard quality tuned logo (512x512)"
            >
              <DownloadIcon className="w-3 h-3 text-slate-600" aria-hidden="true" />
              <span>Standard</span>
            </button>
            <button
              onClick={() => handleDownloadTuned(2048)}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all duration-200 shadow-xs"
              title="Download pristine HD tuned logo (2048x2048)"
            >
              <DownloadIcon className="w-3 h-3 text-white" aria-hidden="true" />
              <span>HD (2048px)</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Emblem Stage Canvas */}
      <div
        style={getBgStyle()}
        className="aspect-square border border-slate-200 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden group transition-all duration-300 shadow-inner"
      >
        {logo ? (
          <>
            <img
              ref={imgRef}
              src={`data:${logo.mimeType};base64,${logo.base64}`}
              alt={logo.prompt_for_alt ? `Logo generated for: ${logo.prompt_for_alt}` : 'The generated logo.'}
              style={getFilterStyle()}
              className="max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-md"
            />
            {/* Overlay Tint for custom hex */}
            {colorTone === 'custom' && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-color opacity-50 transition-all duration-300"
                style={{ backgroundColor: customTintHex }}
              />
            )}
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-lg flex justify-between items-center text-[10px] font-mono text-slate-300">
              <span>Tune: {colorTone.toUpperCase()}</span>
              <span>Backdrop: {bgMode.toUpperCase()}</span>
              <span>Size: ~{sizeInKb} KB</span>
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-xs font-mono text-center">Your logo emblem will appear here once created.</p>
        )}
      </div>

      {/* Advanced Interactive Color Tuning Control Suite */}
      {logo && (
        <div className="mt-5 border-t border-slate-200 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>🎨</span> Dynamic Color Tuning Suite
            </h4>
            <button
              onClick={() => {
                setColorTone('original');
                setBgMode('transparent');
              }}
              className="text-[10px] font-mono text-slate-500 hover:text-rose-600 underline"
            >
              Reset Tuning
            </button>
          </div>

          {/* Preset Color Tone Selector */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              1. Emblem Color Harmony Filter:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'original', label: 'Original AI', icon: '✨' },
                  { id: 'emerald', label: 'Emerald Brand', icon: '🌿' },
                  { id: 'warm', label: 'Golden Sunset', icon: '🌅' },
                  { id: 'cyber', label: 'Cyber Neon', icon: '⚡' },
                  { id: 'obsidian', label: 'Obsidian Dark', icon: '🕶️' },
                  { id: 'sepia', label: 'Vintage Sepia', icon: '📜' },
                  { id: 'monochrome', label: 'Monochrome B&W', icon: '🏁' },
                  { id: 'custom', label: 'Custom Tint', icon: '🎨' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setColorTone(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                    colorTone === t.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Tint Picker */}
            {colorTone === 'custom' && (
              <div className="mt-2.5 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-700">Custom Emblem Color:</span>
                <input
                  type="color"
                  value={customTintHex}
                  onChange={(e) => setCustomTintHex(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={customTintHex}
                  onChange={(e) => setCustomTintHex(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded uppercase"
                  placeholder="#HEX"
                />
              </div>
            )}
          </div>

          {/* Background Canvas Selector */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              2. Stage Canvas Backdrop:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'transparent', label: 'Grid Grid' },
                  { id: 'white', label: 'Pure White' },
                  { id: 'cream', label: 'Warm Cream' },
                  { id: 'dark', label: 'Slate Dark' },
                  { id: 'emerald', label: 'Emerald Night' },
                  { id: 'custom', label: 'Custom Color' },
                ] as const
              ).map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setBgMode(bg.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    bgMode === bg.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>

            {bgMode === 'custom' && (
              <div className="mt-2.5 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-700">Custom Backdrop Color:</span>
                <input
                  type="color"
                  value={customBgHex}
                  onChange={(e) => setCustomBgHex(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={customBgHex}
                  onChange={(e) => setCustomBgHex(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded uppercase"
                  placeholder="#HEX"
                />
              </div>
            )}
          </div>

          {/* Dynamic Color Palette Theory Swatches with Quick Tune */}
          {logo.palettes && logo.palettes.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                3. Brand Color Harmony Swatches (Click any swatch to apply):
              </label>

              {/* Palette Tabs */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {logo.palettes.map((palette, idx) => (
                  <button
                    key={palette.themeName}
                    onClick={() => setActivePaletteIndex(idx)}
                    type="button"
                    className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                      activePaletteIndex === idx
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {palette.themeName}
                    <span className="ml-1 text-[9px] opacity-80 uppercase">
                      ({palette.theoryType})
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Palette Details */}
              {logo.palettes[activePaletteIndex] && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-xs text-slate-700 font-sans italic mb-3 leading-relaxed bg-white p-2 rounded-lg border-l-2 border-emerald-500 shadow-2xs">
                    "{logo.palettes[activePaletteIndex].description}"
                  </p>

                  <div className="grid grid-cols-5 gap-2">
                    {logo.palettes[activePaletteIndex].colors.map((color) => (
                      <div
                        key={color.hex}
                        className="group relative flex flex-col items-center bg-white p-1.5 rounded-lg border border-slate-200 hover:border-emerald-400 transition-colors cursor-pointer"
                        title={`${color.name} (${color.hex})`}
                      >
                        {/* Swatch preview */}
                        <div
                          style={{ backgroundColor: color.hex }}
                          className="w-full aspect-square rounded-md border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform relative overflow-hidden flex items-center justify-center"
                        >
                          {/* Quick Swatch Action Menu on Hover */}
                          <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-0.5">
                            <button
                              onClick={() => {
                                setColorTone('custom');
                                setCustomTintHex(color.hex);
                              }}
                              className="text-[8px] font-mono font-bold bg-emerald-600 text-white px-1 py-0.5 rounded w-full text-center hover:bg-emerald-500"
                              title="Set as Emblem Tint"
                            >
                              Tint
                            </button>
                            <button
                              onClick={() => {
                                setBgMode('custom');
                                setCustomBgHex(color.hex);
                              }}
                              className="text-[8px] font-mono font-bold bg-slate-700 text-white px-1 py-0.5 rounded w-full text-center hover:bg-slate-600"
                              title="Set as Backdrop"
                            >
                              Backdrop
                            </button>
                            <button
                              onClick={() => handleCopyHex(color.hex)}
                              className="text-[8px] font-mono font-bold bg-white text-slate-900 px-1 py-0.5 rounded w-full text-center hover:bg-slate-100"
                            >
                              {copiedHex === color.hex ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold text-slate-800 mt-1 truncate w-full text-center">
                          {color.name}
                        </span>
                        <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase select-all">
                          {color.hex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
