import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoryItem, LOGO_STYLES } from '../types';
import { CloseIcon, CopyIcon, CheckIcon, ShareIcon, DownloadIcon, VideoIcon, SvgIcon, FolderZipIcon } from './icons';
import { downloadScalableSvg } from '../utils/logoExport';
import { downloadBatchZip } from '../utils/batchExport';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: HistoryItem | null; // null means sharing full gallery
  galleryCount?: number;
  items?: HistoryItem[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  item,
  galleryCount = 0,
  items = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  if (!isOpen) return null;

  const isSingleItem = !!item;
  const countToDisplay = isSingleItem ? 1 : items.length || galleryCount;
  
  const title = isSingleItem
    ? `Logo Design: "${item.prompt}"`
    : `Logo-go Studio Session Gallery (${countToDisplay} Designs)`;

  const shareUrl = isSingleItem
    ? `${window.location.origin}${window.location.pathname}#creation?id=${item.id}`
    : `${window.location.origin}${window.location.pathname}#gallery?count=${countToDisplay}`;

  const shareText = isSingleItem
    ? `Check out this AI logo design created with Logo-go Studio! Prompt: "${item.prompt}" (${item.style} style)${item.video ? ' with HD Motion Video' : ''}.`
    : `Check out my collection of ${countToDisplay} AI logo designs & motion videos created on Logo-go Studio!`;

  const fullShareMessage = `${shareText}\n${shareUrl}`;

  const showDownloadNotice = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 3000);
  };

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(fullShareMessage);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleDownloadLogo = (logoItem: HistoryItem) => {
    const link = document.createElement('a');
    const ext = logoItem.logo.mimeType?.includes('svg') ? 'svg' : 'png';
    const sanitizePrompt = logoItem.prompt.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_');
    link.href = `data:${logoItem.logo.mimeType};base64,${logoItem.logo.base64}`;
    link.download = `logo_${sanitizePrompt}_${logoItem.id}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showDownloadNotice('Downloaded Logo Image!');
  };

  const handleDownloadSvg = async (logoItem: HistoryItem) => {
    try {
      const styleName = LOGO_STYLES.find((s) => s.id === logoItem.style)?.name || logoItem.style;
      await downloadScalableSvg(logoItem.logo.base64, logoItem.logo.mimeType, 'vector-embed', {
        styleName,
        rawSvgContent: logoItem.logo.svgContent,
      });
      showDownloadNotice('Exported Scalable Vector SVG!');
    } catch (err) {
      console.error('Failed to export SVG:', err);
    }
  };

  const handleDownloadVideo = (logoItem: HistoryItem) => {
    if (!logoItem.video) return;
    const link = document.createElement('a');
    const sanitizePrompt = logoItem.prompt.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_');
    link.href = `data:${logoItem.video.mimeType || 'video/mp4'};base64,${logoItem.video.base64}`;
    link.download = `video_${sanitizePrompt}_${logoItem.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showDownloadNotice('Downloaded Veo HD Video MP4!');
  };

  const handleDownloadJson = (logoItem: HistoryItem) => {
    const sanitizePrompt = logoItem.prompt.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_');
    const blob = new Blob([JSON.stringify(logoItem, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `design_specs_${sanitizePrompt}_${logoItem.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showDownloadNotice('Downloaded Specs JSON!');
  };

  const handleDownloadAllGalleryJson = () => {
    const targetItems = items.length > 0 ? items : (item ? [item] : []);
    if (targetItems.length === 0) return;
    const blob = new Blob([JSON.stringify(targetItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logogo_studio_session_gallery_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showDownloadNotice(`Downloaded Session Gallery (${targetItems.length} items) JSON!`);
  };

  const handleDownloadAllLogos = () => {
    const targetItems = items.length > 0 ? items : (item ? [item] : []);
    if (targetItems.length === 0) return;
    targetItems.forEach((i, idx) => {
      setTimeout(() => {
        handleDownloadLogo(i);
      }, idx * 250);
    });
    showDownloadNotice(`Started download sequence for ${targetItems.length} logos!`);
  };

  const handleDownloadZip = async () => {
    const targetItems = items.length > 0 ? items : (item ? [item] : []);
    if (targetItems.length === 0 || isZipping) return;
    setIsZipping(true);
    setZipProgress(0);
    try {
      await downloadBatchZip(targetItems, undefined, (percent) => setZipProgress(percent));
      showDownloadNotice(`Exported ZIP bundle with ${targetItems.length} logos (SVG + PNG)!`);
    } catch (err) {
      console.error('Batch zip download failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const sharePlatforms = [
    {
      id: 'sms',
      name: 'Text Message',
      icon: '💬',
      bg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      onClick: () => {
        window.open(`sms:?body=${encodeURIComponent(fullShareMessage)}`, '_blank');
      },
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '🟢',
      bg: 'bg-green-600 hover:bg-green-700 text-white',
      onClick: () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareMessage)}`, '_blank');
      },
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: '✉️',
      bg: 'bg-rose-600 hover:bg-rose-700 text-white',
      onClick: () => {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
          isSingleItem ? 'Check out my AI Logo Design!' : 'Check out my AI Logo Gallery!'
        )}&body=${encodeURIComponent(fullShareMessage)}`;
        window.open(gmailUrl, '_blank');
      },
    },
    {
      id: 'x',
      name: 'X / Twitter',
      icon: '🪶',
      bg: 'bg-slate-900 hover:bg-black text-white',
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(
            shareUrl
          )}`,
          '_blank'
        );
      },
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '🔵',
      bg: 'bg-blue-600 hover:bg-blue-700 text-white',
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      },
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      bg: 'bg-sky-700 hover:bg-sky-800 text-white',
      onClick: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
      },
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      bg: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white',
      onClick: () => {
        handleCopyLink();
        window.open('https://www.instagram.com/', '_blank');
      },
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      bg: 'bg-slate-950 hover:bg-slate-900 text-white border border-slate-800',
      onClick: () => {
        handleCopyLink();
        window.open('https://www.tiktok.com/upload', '_blank');
      },
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 z-10 text-slate-900 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShareIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="font-mono font-bold text-lg text-slate-900">
                {isSingleItem ? 'Share & Download Creation' : 'Share & Download Session Gallery'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto pt-3 space-y-4 pr-1">
            {/* Notification banner */}
            {downloadSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold p-2.5 rounded-xl flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4 text-emerald-600" />
                <span>{downloadSuccessMessage}</span>
              </motion.div>
            )}

            {/* Preview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              {isSingleItem && item ? (
                <>
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                    <img
                      src={`data:${item.logo.mimeType};base64,${item.logo.base64}`}
                      alt={item.prompt}
                      className="max-w-full max-h-full object-contain"
                    />
                    {item.video && (
                      <span className="absolute bottom-0.5 right-0.5 bg-emerald-600 text-white text-[8px] font-mono px-1 rounded-full font-bold">
                        MP4
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {item.style}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2 mt-1">
                      {item.prompt}
                    </p>
                    {item.video && (
                      <p className="text-[10px] text-emerald-700 font-mono font-bold mt-0.5 flex items-center gap-1">
                        <span>🎬</span> High-Definition Motion Video attached
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold font-mono shadow-xs flex-shrink-0">
                    {countToDisplay}
                  </div>
                  <div>
                    <p className="font-mono font-bold text-xs text-slate-900">
                      Session Creations Gallery
                    </p>
                    <p className="text-xs text-slate-500 font-sans">
                      Includes {countToDisplay} vector logo variations & AI motion videos.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* DOWNLOAD ASSETS SECTION */}
            <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-3">
              <div className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <DownloadIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct Asset Downloads</span>
              </div>

              {isSingleItem && item ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadSvg(item)}
                    className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    title="Export as a scalable vector SVG file for high-quality usage"
                  >
                    <SvgIcon className="w-3.5 h-3.5 text-white" />
                    <span>Export SVG (Vector)</span>
                  </button>

                  <button
                    onClick={() => handleDownloadLogo(item)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    title="Download high-resolution image"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>

                  {item.video ? (
                    <button
                      onClick={() => handleDownloadVideo(item)}
                      className="bg-slate-900 hover:bg-black text-white py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <VideoIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download Video (MP4)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownloadJson(item)}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <DownloadIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download Specs (JSON)</span>
                    </button>
                  )}

                  {item.video && (
                    <button
                      onClick={() => handleDownloadJson(item)}
                      className="sm:col-span-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <DownloadIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download Specs & Metadata (JSON)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="sm:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
                  >
                    <FolderZipIcon className="w-4 h-4 text-emerald-200" />
                    <span>
                      {isZipping
                        ? `Generating ZIP Archive (${zipProgress}%)...`
                        : `Batch Download ZIP Bundle (${(items.length || galleryCount)} Logos with SVGs)`}
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadAllLogos}
                    className="bg-slate-900 hover:bg-black text-white py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <DownloadIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Batch Download PNGs</span>
                  </button>

                  <button
                    onClick={handleDownloadAllGalleryJson}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <DownloadIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Backup Specs (JSON)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Copy Link Box */}
            <div>
              <label htmlFor="direct-share-link-input" className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Direct Share Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="direct-share-link-input"
                  type="text"
                  readOnly
                  aria-label="Direct share link"
                  value={shareUrl}
                  className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Platform Share Buttons */}
            <div>
              <div className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-2">
                Share to Platform or App
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sharePlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={platform.onClick}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-mono font-semibold transition-transform active:scale-95 shadow-2xs gap-1 ${platform.bg}`}
                  >
                    <span className="text-lg">{platform.icon}</span>
                    <span className="truncate max-w-full">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

