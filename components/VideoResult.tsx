import React, { useState } from 'react';
import { LogoData, VideoData, MOTION_PRESETS } from '../types';
import { Loader } from './Loader';
import { DownloadIcon, VideoIcon, SparklesIcon } from './icons';

interface VideoResultProps {
  logo: LogoData | null;
  video: VideoData | null;
  isLoading: boolean;
  videoError?: string | null;
  activePresetId: string;
  onSelectPreset: (id: string) => void;
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
}

export const VideoResult: React.FC<VideoResultProps> = ({
  logo,
  video,
  isLoading,
  videoError,
  activePresetId,
  onSelectPreset,
  prompt,
  onPromptChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [stageBg, setStageBg] = useState<'light' | 'dark' | 'emerald' | 'grid'>('light');

  const activePreset = MOTION_PRESETS.find((p) => p.id === activePresetId) || MOTION_PRESETS[0];

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMotionClass = () => {
    if (!isPlaying) return '';
    return activePreset.cssClass;
  };

  const getBgClass = () => {
    switch (stageBg) {
      case 'light':
        return 'bg-slate-100 border-slate-200';
      case 'dark':
        return 'bg-slate-900 border-slate-800 text-white';
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 border-emerald-800 text-white';
      case 'grid':
        return 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 border-slate-200';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 min-h-[38px] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-800">
            Motion Stage & Animation
          </h3>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200">
            Realtime
          </span>
        </div>

        {video?.blobUrl && (
          <a
            href={video.blobUrl}
            download="logo-go-animation.mp4"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all duration-200 shadow-xs"
            aria-label="Download Video"
          >
            <DownloadIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download MP4</span>
          </a>
        )}
      </div>

      {/* Motion Stage Canvas Box */}
      <div
        className={`aspect-square border-2 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group transition-colors duration-300 ${getBgClass()}`}
      >
        {isLoading && (
          <div
            role="status"
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20 text-white"
          >
            <Loader className="w-8 h-8 mb-3 text-emerald-400" />
            <p className="font-mono font-bold text-sm text-white">Rendering HD Motion Video...</p>
            <p className="text-xs text-slate-300 mt-1">Generating high-definition motion video frames.</p>
          </div>
        )}

        {/* Video Mode or Live CSS Motion Canvas Mode */}
        {video?.blobUrl ? (
          <div className="w-full h-full relative flex items-center justify-center">
            <video
              src={video.blobUrl}
              title="Your AI animated logo video"
              className="max-w-full max-h-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-lg flex justify-between items-center text-[10px] font-mono text-slate-300 border border-slate-700/50">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> HD MP4 Video
              </span>
              <span>~{formatSize(video.size)}</span>
            </div>
          </div>
        ) : logo ? (
          <div className="w-full h-full relative flex flex-col items-center justify-center p-6">
            {/* Logo container with active CSS preset animation */}
            <div
              className={`relative flex items-center justify-center max-w-[80%] max-h-[80%] transition-all duration-500 ${getMotionClass()}`}
            >
              <img
                src={`data:${logo.mimeType};base64,${logo.base64}`}
                alt="Animated emblem"
                className="max-w-full max-h-full object-contain drop-shadow-md select-none"
              />

              {/* Shine Sweep Overlay */}
              {isPlaying && activePresetId === 'shine' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shine-sweep"></div>
                </div>
              )}
            </div>

            {/* Motion preset indicators */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold uppercase tracking-wider">
                  {activePreset.icon} {activePreset.name} Motion
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 text-slate-800 dark:text-slate-200 font-bold transition-colors"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400 p-6 flex flex-col items-center">
            <VideoIcon className="w-12 h-12 mb-3 text-slate-300 stroke-1" aria-hidden="true" />
            <p className="font-mono text-xs font-bold text-slate-600 mb-1">Interactive Motion Stage</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Create a logo first to test live motion presets & generate video animations.
            </p>
          </div>
        )}
      </div>

      {/* Video Note / Banner */}
      {videoError && (
        <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-sans flex items-start gap-2">
          <span className="text-amber-600 text-sm">⚠️</span>
          <div className="min-w-0">
            <p className="font-mono font-bold text-amber-950">AI Video Render Note:</p>
            <p className="text-[11px] text-amber-800/90 leading-tight mt-0.5">{videoError}</p>
          </div>
        </div>
      )}

      {/* Unified AI Animation Preset & Motion Control Suite */}
      {logo && (
        <div className="mt-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <SparklesIcon className="w-3.5 h-3.5 text-emerald-600" />
              AI Animation Presets & Live Controls
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono">Backdrop:</span>
              {(['light', 'dark', 'emerald', 'grid'] as const).map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setStageBg(bg)}
                  className={`w-4 h-4 rounded-full border ${
                    stageBg === bg ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-70'
                  } ${
                    bg === 'light'
                      ? 'bg-slate-200 border-slate-300'
                      : bg === 'dark'
                      ? 'bg-slate-900 border-slate-800'
                      : bg === 'emerald'
                      ? 'bg-emerald-800 border-emerald-900'
                      : 'bg-slate-300 border-slate-400'
                  }`}
                  title={`Stage Background: ${bg}`}
                />
              ))}
            </div>
          </div>

          {/* Unified Dropdown Selector */}
          <div>
            <label htmlFor="animation-preset-select" className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Select Preset (Syncs Stage & AI Prompt):
            </label>
            <select
              id="animation-preset-select"
              value={activePresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono text-xs font-bold"
            >
              {MOTION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.icon} {preset.name} — {preset.prompt}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Preset Buttons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
            {MOTION_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset.id);
                    setIsPlaying(true);
                  }}
                  className={`py-1.5 px-2 rounded-xl border text-[10px] font-mono font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected && isPlaying
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-sm">{preset.icon}</span>
                  <span className="truncate w-full text-center">{preset.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Video Prompt Input */}
          <div>
            <label htmlFor="custom-video-prompt" className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Custom Video AI Prompt (Optional Edit):
            </label>
            <textarea
              id="custom-video-prompt"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-sans text-slate-800 resize-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Custom AI video prompt..."
            />
          </div>
        </div>
      )}
    </div>
  );
};
