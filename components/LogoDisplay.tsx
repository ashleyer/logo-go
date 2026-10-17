import React, { useState, useEffect, useRef } from 'react';
import { LogoData, LOGO_STYLES } from '../types';
import { DownloadIcon, SvgIcon, ImageIcon, ChevronDownIcon, CheckIcon, CloseIcon } from './icons';
import { downloadHighResPng, downloadScalableSvg, PngResolution, SvgMode } from '../utils/logoExport';

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

  // Download & Export States
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [selectedPngResolution, setSelectedPngResolution] = useState<PngResolution>(2048);
  const [selectedSvgMode, setSelectedSvgMode] = useState<SvgMode>('vector-embed');
  const [preserveTransparency, setPreserveTransparency] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Reset states whenever a new logo arrives
  useEffect(() => {
    setActivePaletteIndex(0);
    setColorTone('original');
    setBgMode('transparent');
    setIsDownloadMenuOpen(false);
    setExportSuccessMessage(null);
  }, [logo]);

  // Close download menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDownloadMenuOpen(false);
      }
    };
    if (isDownloadMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDownloadMenuOpen]);

  // File size metadata
  const sizeInBytes = logo ? Math.round(logo.base64.length * 0.75) : 0;
  const sizeInKb = (sizeInBytes / 1024).toFixed(1);
  const styleName = logo?.style ? (LOGO_STYLES.find((s) => s.id === logo.style)?.name || logo.style) : 'Custom';

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Get active CSS filter string for image preview and canvas export
  const getFilterString = (): string => {
    switch (colorTone) {
      case 'emerald':
        return 'hue-rotate(90deg) saturate(1.5) contrast(1.1)';
      case 'warm':
        return 'sepia(0.6) saturate(1.8) hue-rotate(-20deg)';
      case 'cyber':
        return 'hue-rotate(185deg) saturate(2.2) brightness(1.1)';
      case 'obsidian':
        return 'grayscale(1) contrast(1.6) brightness(0.9)';
      case 'sepia':
        return 'sepia(0.95) hue-rotate(-15deg) contrast(1.1)';
      case 'monochrome':
        return 'grayscale(1) contrast(2.2)';
      case 'custom':
        return `drop-shadow(0 0 1px ${customTintHex}) saturate(1.5)`;
      default:
        return 'none';
    }
  };

  const getFilterStyle = (): React.CSSProperties => {
    const fStr = getFilterString();
    return fStr !== 'none' ? { filter: fStr } : {};
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

  // Unified download trigger for high-res PNG
  const handleDownloadPng = async (res: PngResolution = selectedPngResolution) => {
    if (!logo || isExporting) return;
    setIsExporting(true);
    try {
      await downloadHighResPng(logo.base64, logo.mimeType, res, {
        styleName,
        colorTone,
        filterString: getFilterString(),
        bgMode,
        customBgHex,
        customTintHex,
        transparentBackground: preserveTransparency,
      });
      const resName = res === 4096 ? '4K Ultra HD (4096px)' : res === 2048 ? '2K HD (2048px)' : 'Standard (1024px)';
      setExportSuccessMessage(`Downloaded ${resName} PNG (${preserveTransparency ? 'Transparent' : 'Solid'})`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
      setIsDownloadMenuOpen(false);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Unified download trigger for scalable SVG
  const handleDownloadSvg = async (mode: SvgMode = selectedSvgMode) => {
    if (!logo || isExporting) return;
    setIsExporting(true);
    try {
      await downloadScalableSvg(logo.base64, logo.mimeType, mode, {
        styleName,
        colorTone,
        filterString: getFilterString(),
        bgMode,
        customBgHex,
        customTintHex,
        transparentBackground: preserveTransparency,
        rawSvgContent: logo.svgContent,
      });
      const modeName = mode === 'vector-paths' ? 'Pure Vector Paths' : 'Scalable Vector SVG';
      setExportSuccessMessage(`Downloaded ${modeName} (.svg)`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
      setIsDownloadMenuOpen(false);
    } catch (err) {
      console.error('Failed to export SVG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Header / Info & Download Bar */}
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

        {/* Primary Download Control Center */}
        {logo && (
          <div className="relative" ref={downloadMenuRef}>
            <div className="flex items-center gap-1.5">
              {/* Primary SVG Export Button */}
              <button
                type="button"
                onClick={() => handleDownloadSvg(selectedSvgMode)}
                disabled={isExporting}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50"
                title="Export generated logo as an SVG file for better scalability"
                aria-label="Export generated logo as SVG file for better scalability"
              >
                <SvgIcon className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                <span>Export SVG</span>
              </button>

              {/* Quick High-Res PNG Button */}
              <button
                type="button"
                onClick={() => handleDownloadPng(selectedPngResolution)}
                disabled={isExporting}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 shadow-xs hover:shadow-sm active:scale-95 disabled:opacity-50"
                title="Download High-Res HD PNG (2048x2048)"
              >
                <DownloadIcon className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                <span>HD PNG</span>
              </button>

              {/* Download Menu Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                aria-expanded={isDownloadMenuOpen}
                aria-haspopup="true"
                aria-label="Open logo download format options"
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-mono font-bold px-2 py-1.5 rounded-lg transition-all duration-200 shadow-2xs"
                title="More Download Options: 4K PNG, SVG Vector Paths, Transparency"
              >
                <span>Options</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${isDownloadMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>

            {/* Comprehensive Download Menu Popover */}
            {isDownloadMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-40 text-left animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <DownloadIcon className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900">
                      Save & Download Logo
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDownloadMenuOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                    aria-label="Close download menu"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 space-y-4">
                  {/* Background Transparency Option */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-mono font-bold text-slate-800">
                        Transparent Background
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        {preserveTransparency
                          ? 'Exports transparent alpha layer for any background'
                          : 'Includes current stage color & backdrop'}
                      </span>
                    </div>
                    <label htmlFor="preserve-transparency-toggle" className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="preserve-transparency-toggle"
                        type="checkbox"
                        aria-label="Preserve transparent background"
                        checked={preserveTransparency}
                        onChange={(e) => setPreserveTransparency(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Section 1: Scalable SVG Options */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <SvgIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>Vector SVG Format (.svg)</span>
                      </span>
                      <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                        Vector
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans mb-2">
                      Infinite resolution for Figma, Illustrator, Canva, Web, and Laser/Vinyl cutting.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadSvg('vector-embed')}
                        disabled={isExporting}
                        className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-all group flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-mono font-bold text-xs text-amber-950 flex items-center justify-between">
                            <span>Scalable Vector SVG</span>
                            <DownloadIcon className="w-3.5 h-3.5 text-amber-700 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            Crisp vector container with embedded HD graphics. Universal compatibility.
                          </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-amber-800 mt-2 block">
                          Download .svg ↗
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSvg('vector-paths')}
                        disabled={isExporting}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all group flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-mono font-bold text-xs text-slate-900 flex items-center justify-between">
                            <span>Vector Paths SVG</span>
                            <DownloadIcon className="w-3.5 h-3.5 text-slate-700 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            Pure SVG path outlines. Ideal for plotters, CAD & vector editing.
                          </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-700 mt-2 block">
                          Download Paths .svg ↗
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Section 2: High-Resolution PNG Options */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>High-Resolution PNG (.png)</span>
                      </span>
                      <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        Raster HD
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { res: 4096 as PngResolution, label: '4K Ultra HD', dims: '4096×4096', badge: '300 DPI Print' },
                        { res: 2048 as PngResolution, label: '2K HD', dims: '2048×2048', badge: 'Retina Web' },
                        { res: 1024 as PngResolution, label: 'Standard', dims: '1024×1024', badge: 'Icon / Avatar' },
                      ].map((preset) => (
                        <button
                          key={preset.res}
                          type="button"
                          onClick={() => handleDownloadPng(preset.res)}
                          disabled={isExporting}
                          className={`p-2 rounded-xl border text-left transition-all group flex flex-col justify-between ${
                            preset.res === 4096
                              ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/80'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="block font-mono font-bold text-xs text-slate-900">
                              {preset.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {preset.dims}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono font-bold text-emerald-700">
                            <span>{preset.badge}</span>
                            <DownloadIcon className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Feedback Toast */}
      {exportSuccessMessage && (
        <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-mono animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-600" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-0.5"
            aria-label="Dismiss feedback"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        </div>
      )}

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

            {/* Quick Action Overlay on Stage Hover */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-xs p-1.5 rounded-xl shadow-lg border border-slate-700/60 z-20">
              <button
                type="button"
                onClick={() => handleDownloadPng(2048)}
                disabled={isExporting}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all shadow-xs"
                title="Quick Save HD PNG"
              >
                <DownloadIcon className="w-3 h-3 text-white" />
                <span>PNG HD</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSvg(selectedSvgMode)}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-mono font-bold transition-all shadow-xs"
                title="Export logo as an SVG file for better scalability"
                aria-label="Export logo as SVG file for better scalability"
              >
                <SvgIcon className="w-3.5 h-3.5 text-slate-950" />
                <span>Export SVG</span>
              </button>
            </div>

            {/* Stage Bottom Info Bar */}
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-lg flex justify-between items-center text-[10px] font-mono text-slate-300">
              <span>Tune: {colorTone.toUpperCase()}</span>
              <span>Backdrop: {bgMode.toUpperCase()}</span>
              <span>Size: ~{sizeInKb} KB</span>
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-xs font-mono text-center">Your logo emblem will appear here once created.</p>
        )}
      </div>

      {/* Dedicated High-Quality Logo Export Toolbar */}
      {logo && (
        <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-50/90 via-emerald-50/50 to-slate-50 border border-amber-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <SvgIcon className="w-4 h-4 text-amber-600" />
              <span>High-Quality Logo Export</span>
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              Infinite Resolution &amp; Print-Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Primary SVG Export Button for Scalability */}
            <button
              type="button"
              onClick={() => handleDownloadSvg(selectedSvgMode)}
              disabled={isExporting}
              className="group flex items-center justify-between bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-mono font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50 border border-amber-600/30"
              title="Export the generated logo as a scalable vector SVG file for infinite resolution in Figma, Illustrator, Canva, web & print"
              aria-label="Export generated logo as SVG file for better scalability"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <SvgIcon className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <div className="leading-tight font-bold flex items-center gap-1.5">
                    <span>Export as SVG</span>
                    <span className="text-[9px] bg-white/25 text-white px-1.5 py-0.5 rounded font-mono font-semibold">Vector</span>
                  </div>
                  <div className="text-[9px] text-amber-100 font-sans font-normal">
                    {selectedSvgMode === 'vector-paths' ? 'Pure Vector Paths' : 'Infinite Scalability (.svg)'}
                  </div>
                </div>
              </div>
              <DownloadIcon className="w-4 h-4 text-white/90 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* High-Resolution PNG Export Button */}
            <button
              type="button"
              onClick={() => handleDownloadPng(selectedPngResolution)}
              disabled={isExporting}
              className="group flex items-center justify-between bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              title="Export logo as high-resolution PNG format (2048px / 4096px 4K)"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <DownloadIcon className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <div className="leading-tight font-bold">Export HD PNG</div>
                  <div className="text-[9px] text-slate-300 font-sans font-normal">
                    {selectedPngResolution === 4096 ? '4K Ultra HD (4096px)' : selectedPngResolution === 2048 ? '2K HD (2048px)' : 'Standard (1024px)'} • {preserveTransparency ? 'Alpha' : 'Solid'}
                  </div>
                </div>
              </div>
              <DownloadIcon className="w-4 h-4 text-slate-300 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Quick Format Customizer Row */}
          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-bold">SVG Mode:</span>
              <button
                type="button"
                onClick={() => setSelectedSvgMode('vector-embed')}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                  selectedSvgMode === 'vector-embed'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Scalable Vector
              </button>
              <button
                type="button"
                onClick={() => setSelectedSvgMode('vector-paths')}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                  selectedSvgMode === 'vector-paths'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Vector Paths
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="toolbar-transparency-toggle" className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold">
                <input
                  id="toolbar-transparency-toggle"
                  type="checkbox"
                  checked={preserveTransparency}
                  onChange={(e) => setPreserveTransparency(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                />
                <span>Transparent Alpha</span>
              </label>
            </div>
          </div>
        </div>
      )}

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
            <div className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              1. Emblem Color Harmony Filter:
            </div>
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
                <label htmlFor="custom-emblem-color-picker" className="text-xs font-mono font-bold text-slate-700">
                  Custom Emblem Color:
                </label>
                <input
                  id="custom-emblem-color-picker"
                  type="color"
                  aria-label="Custom emblem color picker"
                  value={customTintHex}
                  onChange={(e) => setCustomTintHex(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                />
                <input
                  id="custom-emblem-color-hex"
                  type="text"
                  aria-label="Custom emblem color hex code"
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
            <div className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              2. Stage Canvas Backdrop:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'transparent', label: 'Grid' },
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
                <label htmlFor="custom-backdrop-color-picker" className="text-xs font-mono font-bold text-slate-700">
                  Custom Backdrop Color:
                </label>
                <input
                  id="custom-backdrop-color-picker"
                  type="color"
                  aria-label="Custom backdrop color picker"
                  value={customBgHex}
                  onChange={(e) => setCustomBgHex(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                />
                <input
                  id="custom-backdrop-color-hex"
                  type="text"
                  aria-label="Custom backdrop color hex code"
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
              <div className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                3. Brand Color Harmony Swatches (Click any swatch to apply):
              </div>

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

