import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HistoryItem, LOGO_STYLES } from '../types';
import {
  CloseIcon,
  TrashIcon,
  VideoIcon,
  ShareIcon,
  HistoryIcon,
  MaximizeIcon,
  MinimizeIcon,
  DownloadIcon,
  SvgIcon,
  SplitIcon,
  SwapIcon,
  CheckIcon,
  CopyIcon,
} from './icons';
import { ShareModal } from './ShareModal';
import { downloadHighResPng, downloadScalableSvg } from '../utils/logoExport';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  activeId: string | null;
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  items,
  activeId,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'split'>('grid');
  const [filterMode, setFilterMode] = useState<'all' | 'logos' | 'videos'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareItem, setShareItem] = useState<HistoryItem | null | undefined>(undefined);
  const [previewVideoItem, setPreviewVideoItem] = useState<HistoryItem | null>(null);

  // Split-Screen comparison states
  const [slotAId, setSlotAId] = useState<string | null>(null);
  const [slotBId, setSlotBId] = useState<string | null>(null);
  const [splitBgMode, setSplitBgMode] = useState<'checkered' | 'white' | 'dark'>('checkered');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Initialize and synchronize Slot A and Slot B
  useEffect(() => {
    if (items.length > 0) {
      if (!slotAId || !items.some((i) => i.id === slotAId)) {
        setSlotAId(activeId && items.some((i) => i.id === activeId) ? activeId : items[0].id);
      }
    }
  }, [items, activeId, slotAId]);

  useEffect(() => {
    if (items.length > 1) {
      if (!slotBId || !items.some((i) => i.id === slotBId) || slotBId === slotAId) {
        const candidate = items.find((i) => i.id !== slotAId);
        if (candidate) {
          setSlotBId(candidate.id);
        }
      }
    }
  }, [items, slotAId, slotBId]);

  // Lock body scrolling when gallery is open so page behind doesn't jump
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const videoCount = items.filter((item) => !!item.video).length;

  const filteredItems = items.filter((item) => {
    if (filterMode === 'videos') return !!item.video;
    return true;
  });

  const handleSwapSlots = () => {
    const temp = slotAId;
    setSlotAId(slotBId);
    setSlotBId(temp);
  };

  const handleOpenCompareWith = (item: HistoryItem) => {
    if (slotAId && slotAId !== item.id) {
      setSlotBId(item.id);
    } else {
      setSlotAId(item.id);
      const second = items.find((i) => i.id !== item.id);
      if (second) setSlotBId(second.id);
    }
    setViewMode('split');
    if (!isExpanded && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsExpanded(true);
    }
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const getSplitCanvasBg = (): React.CSSProperties => {
    switch (splitBgMode) {
      case 'white':
        return { backgroundColor: '#FFFFFF' };
      case 'dark':
        return { backgroundColor: '#0F172A' };
      default:
        return {
          backgroundImage:
            'radial-gradient(#CBD5E1 1px, transparent 1px), radial-gradient(#CBD5E1 1px, #F8FAFC 1px)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 8px 8px',
        };
    }
  };

  const itemA = items.find((i) => i.id === slotAId) || items[0] || null;
  const itemB =
    items.find((i) => i.id === slotBId) ||
    items.find((i) => i.id !== itemA?.id) ||
    items[1] ||
    null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900 z-40 cursor-pointer backdrop-blur-xs"
            />

            {/* Sidebar / Fullpage Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 bg-white shadow-2xl z-50 flex flex-col text-slate-900 transition-all duration-300 ease-in-out ${
                isExpanded || viewMode === 'split'
                  ? 'inset-0 left-0 right-0 w-full h-full max-w-full'
                  : 'right-0 w-full max-w-md sm:max-w-xl lg:max-w-2xl border-l border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex flex-col gap-3 bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-base font-bold font-mono text-slate-900">Session Gallery</h2>
                    <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                      {items.length} Total
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle: Grid | List | Split */}
                    <div className="flex items-center bg-slate-200/80 border border-slate-300 rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Grid View"
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
                          viewMode === 'list'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="List View"
                      >
                        List
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('split');
                          if (!isExpanded && typeof window !== 'undefined' && window.innerWidth >= 1024) {
                            setIsExpanded(true);
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1 ${
                          viewMode === 'split'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Split-Screen Comparison View"
                      >
                        <SplitIcon className="w-3.5 h-3.5" />
                        <span>Split Compare</span>
                      </button>
                    </div>

                    {/* Expand / Minimize Fullscreen Toggle */}
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-slate-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none flex items-center gap-1 text-xs font-mono font-bold bg-slate-200/60 border border-slate-300"
                      title={isExpanded ? 'Collapse to Sidebar' : 'Expand to Full Page Gallery'}
                      aria-label={isExpanded ? 'Collapse Gallery' : 'Expand Gallery'}
                    >
                      {isExpanded ? (
                        <>
                          <MinimizeIcon className="w-4 h-4 text-emerald-600" />
                          <span className="hidden sm:inline">Collapse</span>
                        </>
                      ) : (
                        <>
                          <MaximizeIcon className="w-4 h-4 text-emerald-600" />
                          <span className="hidden sm:inline">Full Page</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={onClose}
                      className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-200 transition-colors focus:outline-none"
                      aria-label="Close Gallery"
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Gallery Filter Tabs & Share Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300">
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        filterMode === 'all'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({items.length})
                    </button>
                    <button
                      onClick={() => setFilterMode('videos')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-1 ${
                        filterMode === 'videos'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🎬</span> Videos ({videoCount})
                    </button>
                  </div>

                  <button
                    onClick={() => setShareItem(null)} // null = share full gallery
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs py-1.5 px-3 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <ShareIcon className="w-3.5 h-3.5" />
                    <span>Share Gallery</span>
                  </button>
                </div>
              </div>

              {/* Main Content: Split / Grid / List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {filteredItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <span className="text-5xl mb-3">{filterMode === 'videos' ? '🎬' : '✨'}</span>
                    <p className="font-mono font-bold text-sm text-slate-700 mb-1">
                      {filterMode === 'videos' ? 'No Motion Videos Yet' : 'No Logos Created Yet'}
                    </p>
                    <p className="text-xs max-w-[280px] leading-relaxed font-sans">
                      {filterMode === 'videos'
                        ? 'Select any logo concept and click "Generate AI Veo MP4 Video" to populate your video gallery!'
                        : 'Create new logos or 25-variation batches to populate your Session Creations Gallery.'}
                    </p>
                  </div>
                ) : viewMode === 'split' ? (
                  /* SPLIT-SCREEN VIEW MODE */
                  items.length < 2 || !itemA || !itemB ? (
                    <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/80 rounded-2xl border border-slate-200">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-3xl mb-4 shadow-xs">
                        <SplitIcon className="w-8 h-8 text-emerald-700" />
                      </div>
                      <h3 className="font-mono font-bold text-base text-slate-800 mb-2">
                        Side-by-Side Logo Comparison
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed mb-5">
                        Split-Screen comparison requires at least 2 saved logo creations. Generate another logo concept or click "Create 25 Variations Pack" to compare designs and their metadata side-by-side!
                      </p>
                      <button
                        onClick={() => setViewMode('grid')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        Return to Grid View
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5 max-w-7xl mx-auto">
                      {/* Top Strip: Quick Selector Filmstrip & Background Controls */}
                      <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between flex-wrap gap-2.5 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                              <SplitIcon className="w-4 h-4 text-emerald-600" /> Select Variations to Compare
                            </span>
                            <span className="text-[11px] font-sans text-slate-500 hidden sm:inline">
                              Assign any design to Slot A or Slot B below
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSwapSlots}
                              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5 transition-colors shadow-2xs"
                              title="Swap Logo A and Logo B positions"
                            >
                              <SwapIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Swap A ⇄ B</span>
                            </button>

                            {/* Canvas Stage Background Selector */}
                            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-[10px] font-mono font-bold shadow-2xs">
                              <button
                                onClick={() => setSplitBgMode('checkered')}
                                className={`px-2 py-0.5 rounded transition-colors ${
                                  splitBgMode === 'checkered'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Transparent Grid Pattern"
                              >
                                Pattern
                              </button>
                              <button
                                onClick={() => setSplitBgMode('white')}
                                className={`px-2 py-0.5 rounded transition-colors ${
                                  splitBgMode === 'white'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="White Background"
                              >
                                White
                              </button>
                              <button
                                onClick={() => setSplitBgMode('dark')}
                                className={`px-2 py-0.5 rounded transition-colors ${
                                  splitBgMode === 'dark'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Dark Slate Background"
                              >
                                Dark
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Thumbnail Carousel Picker */}
                        <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
                          {filteredItems.map((item) => {
                            const isA = item.id === itemA.id;
                            const isB = item.id === itemB.id;
                            const itemStyleName =
                              LOGO_STYLES.find((s) => s.id === item.style)?.name || item.style;

                            return (
                              <div
                                key={item.id}
                                className={`relative flex-shrink-0 group rounded-xl border p-1 transition-all cursor-pointer ${
                                  isA
                                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/40 shadow-xs'
                                    : isB
                                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/40 shadow-xs'
                                    : 'border-slate-300 bg-white hover:border-slate-400'
                                }`}
                                title={`${itemStyleName}: ${item.prompt}`}
                              >
                                <div
                                  className="w-14 h-14 rounded-lg bg-white overflow-hidden flex items-center justify-center p-1"
                                  onClick={() => {
                                    if (!isA && !isB) {
                                      setSlotBId(item.id);
                                    }
                                  }}
                                >
                                  <img
                                    src={`data:${item.logo.mimeType};base64,${item.logo.base64}`}
                                    alt={item.prompt}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>

                                {/* Slot Badges */}
                                {isA && (
                                  <span className="absolute -top-1.5 -left-1.5 bg-emerald-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.2 rounded-full shadow-xs">
                                    Slot A
                                  </span>
                                )}
                                {isB && (
                                  <span className="absolute -top-1.5 -left-1.5 bg-indigo-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.2 rounded-full shadow-xs">
                                    Slot B
                                  </span>
                                )}

                                {/* Hover action overlay */}
                                <div className="absolute inset-0 bg-slate-900/80 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity p-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSlotAId(item.id);
                                    }}
                                    className="w-full text-[9px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white py-0.5 rounded shadow-2xs"
                                  >
                                    Set A
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSlotBId(item.id);
                                    }}
                                    className="w-full text-[9px] font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white py-0.5 rounded shadow-2xs"
                                  >
                                    Set B
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* High-level Diff & Contrast Analysis Card */}
                      {(() => {
                        const styleA =
                          LOGO_STYLES.find((s) => s.id === itemA.style)?.name || itemA.style;
                        const styleB =
                          LOGO_STYLES.find((s) => s.id === itemB.style)?.name || itemB.style;
                        const sameStyle = itemA.style === itemB.style;
                        const palA = itemA.logo.palettes?.[0];
                        const palB = itemB.logo.palettes?.[0];
                        const sameTheory =
                          palA?.theoryType &&
                          palB?.theoryType &&
                          palA.theoryType.toLowerCase() === palB.theoryType.toLowerCase();

                        return (
                          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800">Metadata Comparison:</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                  sameStyle
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {sameStyle
                                  ? `Style Match: ${styleA}`
                                  : `Style Diff: ${styleA} vs ${styleB}`}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                  sameTheory
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                }`}
                              >
                                {palA?.theoryType && palB?.theoryType
                                  ? sameTheory
                                    ? `Harmony Match: ${palA.theoryType}`
                                    : `Harmony Diff: ${palA.theoryType} vs ${palB.theoryType}`
                                  : 'Color Harmonies Compared'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                              <span>
                                Weight: {Math.round((itemA.logo.base64.length * 0.75) / 1024)} KB vs{' '}
                                {Math.round((itemB.logo.base64.length * 0.75) / 1024)} KB
                              </span>
                              <span>·</span>
                              <span>
                                Motion: {itemA.video ? '🎬 Veo Video' : 'Static'} vs{' '}
                                {itemB.video ? '🎬 Veo Video' : 'Static'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Dual-Column Split Screen Stage & Detailed Metadata */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                        {/* LEFT COLUMN: LOGO A */}
                        <div className="bg-white border-2 border-emerald-400/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
                          {/* Column Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg shadow-2xs">
                                Logo A
                              </span>
                              {itemA.id === activeId ? (
                                <span className="bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                  <CheckIcon className="w-3 h-3 text-emerald-600" /> Active in Studio
                                </span>
                              ) : (
                                <button
                                  onClick={() => onSelect(itemA)}
                                  className="text-[11px] font-mono font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 px-2 py-0.5 rounded-md transition-colors"
                                >
                                  Set as Active
                                </button>
                              )}
                            </div>

                            {/* Actions: Download HD PNG & SVG, Share */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  const styleName =
                                    LOGO_STYLES.find((s) => s.id === itemA.style)?.name || itemA.style;
                                  downloadHighResPng(itemA.logo.base64, itemA.logo.mimeType, 2048, {
                                    styleName,
                                    filename: `logo-go-slot-a-${itemA.style}-2k.png`,
                                  });
                                }}
                                className="p-1.5 text-slate-700 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 border border-slate-200 transition-colors"
                                title="Download 2K HD PNG"
                                aria-label="Download HD PNG"
                              >
                                <DownloadIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const styleName =
                                    LOGO_STYLES.find((s) => s.id === itemA.style)?.name || itemA.style;
                                  downloadScalableSvg(itemA.logo.base64, itemA.logo.mimeType, 'vector-embed', {
                                    styleName,
                                    filename: `logo-go-slot-a-${itemA.style}.svg`,
                                    rawSvgContent: itemA.logo.svgContent,
                                  });
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-amber-700 hover:text-amber-800 rounded-lg hover:bg-amber-50 border border-amber-200 transition-colors text-xs font-mono font-bold"
                                title="Export Logo A as SVG file for better scalability"
                                aria-label="Export Logo A as Scalable SVG"
                              >
                                <SvgIcon className="w-3.5 h-3.5 text-amber-600" />
                                <span>SVG</span>
                              </button>
                              <button
                                onClick={() => setShareItem(itemA)}
                                className="p-1.5 text-slate-700 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 border border-slate-200 transition-colors"
                                title="Share Logo A"
                                aria-label="Share design"
                              >
                                <ShareIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Switch Dropdown */}
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500 font-bold">Switch Selection:</span>
                            <select
                              value={itemA.id}
                              onChange={(e) => setSlotAId(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
                            >
                              {filteredItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  [{LOGO_STYLES.find((s) => s.id === item.style)?.name || item.style}] {item.prompt}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Visual Display Stage */}
                          <div
                            style={getSplitCanvasBg()}
                            className="w-full aspect-square rounded-2xl border border-slate-200 flex items-center justify-center p-6 relative overflow-hidden shadow-inner group"
                          >
                            <img
                              src={`data:${itemA.logo.mimeType};base64,${itemA.logo.base64}`}
                              alt={itemA.prompt}
                              className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Motion Video Play overlay */}
                            {itemA.video && (
                              <button
                                onClick={() => setPreviewVideoItem(itemA)}
                                className="absolute bottom-3 right-3 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center gap-1.5"
                                title="Play Motion Video"
                              >
                                <VideoIcon className="w-4 h-4 text-white" />
                                <span className="text-[10px] font-mono font-bold pr-1">Play Video</span>
                              </button>
                            )}

                            {itemA.logo.referenceImage && (
                              <div
                                className="absolute top-3 right-3 bg-slate-900/80 text-emerald-400 px-2 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1"
                                title="Generated using reference image"
                              >
                                <span>🖼️ Reference Image</span>
                              </div>
                            )}
                          </div>

                          {/* Detailed Metadata Breakdown for Logo A */}
                          <div className="space-y-3.5 pt-1">
                            {/* Concept & Prompt */}
                            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Prompt & Concept
                              </span>
                              <p className="text-xs font-sans font-medium text-slate-800 leading-relaxed">
                                {itemA.prompt}
                              </p>
                            </div>

                            {/* Style & Aesthetic Archetype */}
                            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                                  Design Style
                                </span>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                                  {LOGO_STYLES.find((s) => s.id === itemA.style)?.name || itemA.style}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-sans">
                                {LOGO_STYLES.find((s) => s.id === itemA.style)?.description ||
                                  'Custom aesthetic parameters'}
                              </p>
                            </div>

                            {/* Color Theory & Swatches */}
                            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                                  Color Theory Palette
                                </span>
                                {itemA.logo.palettes?.[0]?.theoryType && (
                                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                                    {itemA.logo.palettes[0].theoryType}
                                  </span>
                                )}
                              </div>

                              {itemA.logo.palettes?.[0] ? (
                                <>
                                  <p className="text-xs font-bold text-slate-800 mb-1">
                                    {itemA.logo.palettes[0].themeName}
                                  </p>
                                  <p className="text-[11px] text-slate-600 leading-snug mb-2.5">
                                    {itemA.logo.palettes[0].description}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {itemA.logo.palettes[0].colors.map((c, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => handleCopyHex(c.hex)}
                                        className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 hover:border-slate-400 transition-colors shadow-2xs group"
                                        title={`Click to copy ${c.hex} (${c.name})`}
                                      >
                                        <span
                                          className="w-3.5 h-3.5 rounded-md border border-slate-300"
                                          style={{ backgroundColor: c.hex }}
                                        />
                                        <span className="font-mono text-[10px] text-slate-700 font-bold">
                                          {copiedHex === c.hex ? 'Copied!' : c.hex}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-slate-500 italic">
                                  Default monochromatic vector formulation
                                </p>
                              )}
                            </div>

                            {/* Technical Specifications */}
                            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
                                Technical Specifications
                              </span>
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">EXPORT RESOLUTION</span>
                                  2048 × 2048 px
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">PAYLOAD SIZE</span>
                                  {Math.round((itemA.logo.base64.length * 0.75) / 1024)} KB
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">MIME FORMAT</span>
                                  {itemA.logo.mimeType}
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">MOTION STATUS</span>
                                  {itemA.video ? 'Veo MP4 Attached' : 'Static Vector'}
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 block text-[10px]">GENERATED AT</span>
                                  {new Date(itemA.timestamp).toLocaleString([], {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: LOGO B */}
                        <div className="bg-white border-2 border-indigo-400/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
                          {/* Column Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-indigo-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg shadow-2xs">
                                Logo B
                              </span>
                              {itemB.id === activeId ? (
                                <span className="bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                                  <CheckIcon className="w-3 h-3 text-indigo-600" /> Active in Studio
                                </span>
                              ) : (
                                <button
                                  onClick={() => onSelect(itemB)}
                                  className="text-[11px] font-mono font-bold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 px-2 py-0.5 rounded-md transition-colors"
                                >
                                  Set as Active
                                </button>
                              )}
                            </div>

                            {/* Actions: Download HD PNG & SVG, Share */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  const styleName =
                                    LOGO_STYLES.find((s) => s.id === itemB.style)?.name || itemB.style;
                                  downloadHighResPng(itemB.logo.base64, itemB.logo.mimeType, 2048, {
                                    styleName,
                                    filename: `logo-go-slot-b-${itemB.style}-2k.png`,
                                  });
                                }}
                                className="p-1.5 text-slate-700 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 border border-slate-200 transition-colors"
                                title="Download 2K HD PNG"
                                aria-label="Download HD PNG"
                              >
                                <DownloadIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const styleName =
                                    LOGO_STYLES.find((s) => s.id === itemB.style)?.name || itemB.style;
                                  downloadScalableSvg(itemB.logo.base64, itemB.logo.mimeType, 'vector-embed', {
                                    styleName,
                                    filename: `logo-go-slot-b-${itemB.style}.svg`,
                                    rawSvgContent: itemB.logo.svgContent,
                                  });
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-amber-700 hover:text-amber-800 rounded-lg hover:bg-amber-50 border border-amber-200 transition-colors text-xs font-mono font-bold"
                                title="Export Logo B as SVG file for better scalability"
                                aria-label="Export Logo B as Scalable SVG"
                              >
                                <SvgIcon className="w-3.5 h-3.5 text-amber-600" />
                                <span>SVG</span>
                              </button>
                              <button
                                onClick={() => setShareItem(itemB)}
                                className="p-1.5 text-slate-700 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 border border-slate-200 transition-colors"
                                title="Share Logo B"
                                aria-label="Share design"
                              >
                                <ShareIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Switch Dropdown */}
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500 font-bold">Switch Selection:</span>
                            <select
                              value={itemB.id}
                              onChange={(e) => setSlotBId(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate"
                            >
                              {filteredItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  [{LOGO_STYLES.find((s) => s.id === item.style)?.name || item.style}] {item.prompt}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Visual Display Stage */}
                          <div
                            style={getSplitCanvasBg()}
                            className="w-full aspect-square rounded-2xl border border-slate-200 flex items-center justify-center p-6 relative overflow-hidden shadow-inner group"
                          >
                            <img
                              src={`data:${itemB.logo.mimeType};base64,${itemB.logo.base64}`}
                              alt={itemB.prompt}
                              className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Motion Video Play overlay */}
                            {itemB.video && (
                              <button
                                onClick={() => setPreviewVideoItem(itemB)}
                                className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center gap-1.5"
                                title="Play Motion Video"
                              >
                                <VideoIcon className="w-4 h-4 text-white" />
                                <span className="text-[10px] font-mono font-bold pr-1">Play Video</span>
                              </button>
                            )}

                            {itemB.logo.referenceImage && (
                              <div
                                className="absolute top-3 right-3 bg-slate-900/80 text-emerald-400 px-2 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1"
                                title="Generated using reference image"
                              >
                                <span>🖼️ Reference Image</span>
                              </div>
                            )}
                          </div>

                          {/* Detailed Metadata Breakdown for Logo B */}
                          <div className="space-y-3.5 pt-1">
                            {/* Concept & Prompt */}
                            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Prompt & Concept
                              </span>
                              <p className="text-xs font-sans font-medium text-slate-800 leading-relaxed">
                                {itemB.prompt}
                              </p>
                            </div>

                            {/* Style & Aesthetic Archetype */}
                            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                                  Design Style
                                </span>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200">
                                  {LOGO_STYLES.find((s) => s.id === itemB.style)?.name || itemB.style}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-sans">
                                {LOGO_STYLES.find((s) => s.id === itemB.style)?.description ||
                                  'Custom aesthetic parameters'}
                              </p>
                            </div>

                            {/* Color Theory & Swatches */}
                            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                                  Color Theory Palette
                                </span>
                                {itemB.logo.palettes?.[0]?.theoryType && (
                                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                                    {itemB.logo.palettes[0].theoryType}
                                  </span>
                                )}
                              </div>

                              {itemB.logo.palettes?.[0] ? (
                                <>
                                  <p className="text-xs font-bold text-slate-800 mb-1">
                                    {itemB.logo.palettes[0].themeName}
                                  </p>
                                  <p className="text-[11px] text-slate-600 leading-snug mb-2.5">
                                    {itemB.logo.palettes[0].description}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {itemB.logo.palettes[0].colors.map((c, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => handleCopyHex(c.hex)}
                                        className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 hover:border-slate-400 transition-colors shadow-2xs group"
                                        title={`Click to copy ${c.hex} (${c.name})`}
                                      >
                                        <span
                                          className="w-3.5 h-3.5 rounded-md border border-slate-300"
                                          style={{ backgroundColor: c.hex }}
                                        />
                                        <span className="font-mono text-[10px] text-slate-700 font-bold">
                                          {copiedHex === c.hex ? 'Copied!' : c.hex}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-slate-500 italic">
                                  Default monochromatic vector formulation
                                </p>
                              )}
                            </div>

                            {/* Technical Specifications */}
                            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
                                Technical Specifications
                              </span>
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">EXPORT RESOLUTION</span>
                                  2048 × 2048 px
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">PAYLOAD SIZE</span>
                                  {Math.round((itemB.logo.base64.length * 0.75) / 1024)} KB
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">MIME FORMAT</span>
                                  {itemB.logo.mimeType}
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">MOTION STATUS</span>
                                  {itemB.video ? 'Veo MP4 Attached' : 'Static Vector'}
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 block text-[10px]">GENERATED AT</span>
                                  {new Date(itemB.timestamp).toLocaleString([], {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : viewMode === 'grid' ? (
                  /* GRID VIEW */
                  <div
                    className={
                      isExpanded
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5'
                        : 'grid grid-cols-2 gap-4'
                    }
                  >
                    {filteredItems.map((item) => {
                      const isSelected = item.id === activeId;
                      const styleName =
                        LOGO_STYLES.find((s) => s.id === item.style)?.name || item.style;
                      const paletteColors = item.logo.palettes?.[0]?.colors || [];

                      return (
                        <motion.div
                          key={item.id}
                          layoutId={`history-grid-item-${item.id}`}
                          className={`relative rounded-2xl border p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 group ${
                            isSelected
                              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-2xs'
                          }`}
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                        >
                          {/* Thumbnail */}
                          <div className="w-full aspect-square rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden relative mb-2.5 p-2">
                            <img
                              src={`data:${item.logo.mimeType};base64,${item.logo.base64}`}
                              alt={item.prompt}
                              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                                Active
                              </div>
                            )}

                            {/* Video Badge / Play Button */}
                            {item.video && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewVideoItem(item);
                                }}
                                className="absolute bottom-1.5 right-1.5 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-md transition-transform hover:scale-110 flex items-center justify-center"
                                title="Play Animated Video"
                              >
                                <VideoIcon className="w-4 h-4 text-white" />
                              </button>
                            )}

                            {item.logo.referenceImage && (
                              <div
                                className="absolute top-1.5 right-1.5 bg-slate-900/80 text-emerald-400 px-1.5 py-0.5 rounded text-xs"
                                title="Enhanced from reference image"
                              >
                                🖼️
                              </div>
                            )}
                          </div>

                          {/* Title & Style */}
                          <div className="min-w-0 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 truncate inline-block max-w-full">
                                  {styleName}
                                </span>
                                {item.video && (
                                  <span className="text-[10px] font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded-md">
                                    🎬 Video
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-sans font-medium text-slate-800 line-clamp-2 leading-snug">
                                {item.prompt}
                              </p>
                            </div>

                            {/* Color Swatches preview */}
                            {paletteColors.length > 0 && (
                              <div className="flex items-center gap-1 mt-2.5">
                                {paletteColors.slice(0, 5).map((col, idx) => (
                                  <span
                                    key={idx}
                                    className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs"
                                    style={{ backgroundColor: col.hex }}
                                    title={col.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Card Action Overlay Buttons */}
                          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Compare in Split Screen */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCompareWith(item);
                              }}
                              className="p-1.5 text-slate-700 hover:text-indigo-700 rounded-lg bg-white/95 hover:bg-indigo-50 border border-slate-200 shadow-xs transition-colors"
                              aria-label="Compare in Split Screen"
                              title="Compare in Split Screen"
                            >
                              <SplitIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadHighResPng(item.logo.base64, item.logo.mimeType, 2048, {
                                  styleName,
                                  filename: `logo-go-${item.style || 'custom'}-2k.png`,
                                });
                              }}
                              className="p-1.5 text-slate-700 hover:text-emerald-700 rounded-lg bg-white/95 hover:bg-emerald-50 border border-slate-200 shadow-xs transition-colors"
                              aria-label="Download HD PNG"
                              title="Download HD PNG"
                            >
                              <DownloadIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadScalableSvg(item.logo.base64, item.logo.mimeType, 'vector-embed', {
                                  styleName,
                                  filename: `logo-go-${item.style || 'custom'}.svg`,
                                  rawSvgContent: item.logo.svgContent,
                                });
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-amber-700 hover:text-amber-800 rounded-lg bg-white/95 hover:bg-amber-50 border border-amber-200 shadow-xs transition-colors text-[10px] font-mono font-bold"
                              aria-label="Export logo as SVG file for better scalability"
                              title="Export logo as SVG file for better scalability (Vector Format)"
                            >
                              <SvgIcon className="w-3.5 h-3.5 text-amber-600" />
                              <span>SVG</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareItem(item);
                              }}
                              className="p-1.5 text-slate-700 hover:text-emerald-700 rounded-lg bg-white/95 hover:bg-emerald-50 border border-slate-200 shadow-xs transition-colors"
                              aria-label="Share logo design"
                              title="Share design"
                            >
                              <ShareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg bg-white/95 hover:bg-rose-50 border border-slate-200 shadow-xs transition-colors"
                              aria-label="Delete logo creation"
                              title="Delete design"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  /* LIST VIEW */
                  <div
                    className={
                      isExpanded
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                        : 'space-y-3'
                    }
                  >
                    {filteredItems.map((item) => {
                      const isSelected = item.id === activeId;
                      const styleName =
                        LOGO_STYLES.find((s) => s.id === item.style)?.name || item.style;
                      const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <motion.div
                          key={item.id}
                          layoutId={`history-list-item-${item.id}`}
                          className={`relative rounded-2xl border p-3 flex gap-3.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 shadow-2xs'
                          }`}
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                        >
                          {/* Thumbnail */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden relative p-1.5">
                            <img
                              src={`data:${item.logo.mimeType};base64,${item.logo.base64}`}
                              alt={item.prompt}
                              className="max-w-full max-h-full object-contain"
                            />
                            {item.video && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewVideoItem(item);
                                }}
                                className="absolute bottom-1 right-1 bg-emerald-600 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform"
                                title="Play Video"
                              >
                                <VideoIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-grow min-w-0 pr-20 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <span className="text-xs font-mono text-slate-400">{dateStr}</span>
                                <div className="flex items-center gap-1.5">
                                  {item.video && (
                                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                      🎬 Video
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-[140px]">
                                    {styleName}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm font-sans font-medium text-slate-800 line-clamp-2 leading-snug">
                                {item.prompt}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute right-2.5 top-3 flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCompareWith(item);
                              }}
                              className="p-1.5 text-slate-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 border border-slate-200 transition-colors"
                              aria-label="Compare in Split Screen"
                              title="Compare in Split Screen"
                            >
                              <SplitIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadHighResPng(item.logo.base64, item.logo.mimeType, 2048, {
                                  styleName,
                                  filename: `logo-go-${item.style || 'custom'}-2k.png`,
                                });
                              }}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 border border-slate-200 transition-colors"
                              aria-label="Download HD PNG"
                              title="Download HD PNG"
                            >
                              <DownloadIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadScalableSvg(item.logo.base64, item.logo.mimeType, 'vector-embed', {
                                  styleName,
                                  filename: `logo-go-${item.style || 'custom'}.svg`,
                                  rawSvgContent: item.logo.svgContent,
                                });
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-amber-700 hover:text-amber-800 rounded-lg hover:bg-amber-50 border border-amber-200 transition-colors text-xs font-mono font-bold"
                              aria-label="Export logo as SVG file for better scalability"
                              title="Export logo as SVG file for better scalability (Vector Format)"
                            >
                              <SvgIcon className="w-3.5 h-3.5 text-amber-600" />
                              <span>SVG</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareItem(item);
                              }}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 border border-slate-200 transition-colors"
                              aria-label="Share logo design"
                              title="Share design"
                            >
                              <ShareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              aria-label="Delete logo creation"
                              title="Delete design"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              {items.length > 0 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-500">
                    {items.length} Saved Creations ({videoCount} Videos)
                  </span>
                  <button
                    onClick={onClearAll}
                    className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-mono font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    Clear Whole Gallery
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share Modal Trigger */}
      {shareItem !== undefined && (
        <ShareModal
          isOpen={shareItem !== undefined}
          onClose={() => setShareItem(undefined)}
          item={shareItem}
          galleryCount={items.length}
        />
      )}

      {/* Video Preview Player Modal */}
      {previewVideoItem && previewVideoItem.video && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs cursor-pointer"
            onClick={() => setPreviewVideoItem(null)}
          />
          <div className="relative bg-slate-900 text-white rounded-2xl border border-slate-700 p-5 z-10 max-w-lg w-full shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
              <span className="font-mono font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                <VideoIcon className="w-4 h-4" /> AI Motion Video Player
              </span>
              <button
                onClick={() => setPreviewVideoItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center mb-4">
              <video
                src={previewVideoItem.video.blobUrl || previewVideoItem.video.uri}
                autoPlay
                loop
                controls
                className="w-full h-full object-contain"
              />
            </div>

            <div className="w-full flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 truncate max-w-[240px]">
                {previewVideoItem.prompt}
              </span>
              <button
                onClick={() => {
                  onSelect(previewVideoItem);
                  setPreviewVideoItem(null);
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold"
              >
                Open in Motion Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
