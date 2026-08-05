import React, { useState } from 'react';
import { LogoData, VideoData, MOTION_PRESETS } from '../types';
import { Loader } from './Loader';
import { VideoIcon } from './icons';
import { LogoDisplay } from './LogoDisplay';
import { VideoResult } from './VideoResult';

interface VideoGeneratorProps {
  logo: LogoData | null;
  video: VideoData | null;
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
  videoError?: string | null;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  logo,
  video,
  onGenerate,
  isLoading,
  videoError,
}) => {
  const [activePresetId, setActivePresetId] = useState<string>(MOTION_PRESETS[0].id);
  const [prompt, setPrompt] = useState<string>(MOTION_PRESETS[0].prompt);

  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId);
    const presetObj = MOTION_PRESETS.find((p) => p.id === presetId);
    if (presetObj) {
      setPrompt(presetObj.prompt);
    }
  };

  const isButtonDisabled = isLoading || !logo;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 font-mono text-slate-900">
        <span className="bg-emerald-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm font-mono shadow-xs">
          2
        </span>
        Motion & Animation Stage
      </h2>
      <p className="text-slate-600 text-xs sm:text-sm mb-4 font-sans leading-relaxed">
        Preview live interactive motion effects or render a high-definition AI MP4 video animation of your emblem.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        {/* Left Side: Logo Emblem Studio & Color Tuning */}
        <div className="flex flex-col">
          <LogoDisplay logo={logo} />
        </div>

        {/* Right Side: Interactive Motion Stage Canvas & Preset Suite */}
        <VideoResult
          logo={logo}
          video={video}
          isLoading={isLoading}
          videoError={videoError}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          prompt={prompt}
          onPromptChange={(newPrompt) => setPrompt(newPrompt)}
        />
      </div>

      <button
        onClick={() => onGenerate(prompt)}
        disabled={isButtonDisabled}
        aria-busy={isLoading}
        className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-mono font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-all duration-200 text-xs sm:text-sm shadow-md"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 mr-2" />
            Rendering AI HD Video...
          </>
        ) : (
          <>
            <VideoIcon className="w-4 h-4 mr-2 text-emerald-200" aria-hidden="true" />
            Generate AI Veo MP4 Video
          </>
        )}
      </button>
    </div>
  );
};
