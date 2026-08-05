import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HistoryItem, LOGO_STYLES } from '../types';
import { CloseIcon, TrashIcon, VideoIcon, ShareIcon, HistoryIcon, MaximizeIcon, MinimizeIcon } from './icons';
import { ShareModal } from './ShareModal';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterMode, setFilterMode] = useState<'all' | 'logos' | 'videos'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareItem, setShareItem] = useState<HistoryItem | null | undefined>(undefined); 
  // undefined = share modal closed, null = share full gallery, HistoryItem = share specific item
  const [previewVideoItem, setPreviewVideoItem] = useState<HistoryItem | null>(null);

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
                isExpanded
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
                    {/* View Mode Toggle */}
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
                    </div>

                    {/* Expand / Minimize Fullscreen Toggle */}
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-slate-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none flex items-center gap-1 text-xs font-mono font-bold bg-slate-200/60 border border-slate-300"
                      title={isExpanded ? "Collapse to Sidebar" : "Expand to Full Page Gallery"}
                      aria-label={isExpanded ? "Collapse Gallery" : "Expand Gallery"}
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

              {/* List / Grid Container */}
              <div className="flex-1 overflow-y-auto p-4">
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
                ) : viewMode === 'grid' ? (
                  /* GRID VIEW */
                  <div className={isExpanded ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5" : "grid grid-cols-2 gap-4"}>
                    {filteredItems.map((item) => {
                      const isSelected = item.id === activeId;
                      const styleName = LOGO_STYLES.find((s) => s.id === item.style)?.name || item.style;
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
                              <div className="absolute top-1.5 right-1.5 bg-slate-900/80 text-emerald-400 px-1.5 py-0.5 rounded text-xs" title="Enhanced from reference image">
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

                          {/* Card Action Overlay Buttons: Share & Delete */}
                          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className={isExpanded ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                    {filteredItems.map((item) => {
                      const isSelected = item.id === activeId;
                      const styleName = LOGO_STYLES.find((s) => s.id === item.style)?.name || item.style;
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
                          <div className="flex-grow min-w-0 pr-16 flex flex-col justify-between">
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

                          {/* Action Buttons: Share & Delete */}
                          <div className="absolute right-2.5 top-3 flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareItem(item);
                              }}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 border border-slate-200 transition-colors"
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
