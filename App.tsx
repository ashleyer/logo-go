
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LogoGenerator } from './components/LogoGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { HistorySidebar } from './components/HistorySidebar';
import { ShareModal } from './components/ShareModal';
import { generateLogo, generateVideo, generatePromptSuggestions, generateColorPalettes, generate25LogoVariations } from './services/geminiService';
import { LogoData, VideoData, ApiError, LogoStyleId, HistoryItem, ReferenceImage } from './types';
import { ShareIcon, HistoryIcon } from './components/icons';
import { useDebounce } from './hooks/useDebounce';
import { getHistoryFromDB, saveHistoryToDB, deleteHistoryItemFromDB, clearAllHistoryFromDB } from './utils/db';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [variations, setVariations] = useState<LogoData[]>([]);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<LogoStyleId>('minimalist');
  
  // History / Session Creations Gallery states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // Load history from IndexedDB on mount
  useEffect(() => {
    getHistoryFromDB()
      .then(items => {
        setHistory(items);
        // Pre-fill variations container if history exists
        if (items.length > 0) {
          const initialVariations = items.slice(0, 25).map(item => item.logo);
          setVariations(initialVariations);
          if (!logo) setLogo(items[0].logo);
        }
      })
      .catch(err => {
        console.error("Failed to load logo history from IndexedDB:", err);
      });
  }, []);

  // Save history helper (unlimited history)
  const saveHistory = useCallback(async (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    await saveHistoryToDB(newHistory);
  }, []);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
    deleteHistoryItemFromDB(id);
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  }, [history, activeHistoryId, saveHistory]);

  const handleClearHistory = useCallback(() => {
    saveHistory([]);
    setVariations([]);
    clearAllHistoryFromDB();
    setActiveHistoryId(null);
  }, [saveHistory]);

  const handleSelectHistoryItem = useCallback((item: HistoryItem) => {
    setPrompt(item.prompt);
    setSelectedStyle(item.style);
    setLogo(item.logo);
    setVideo(item.video);
    setActiveHistoryId(item.id);
    if (item.logo.referenceImage) {
      setReferenceImage(item.logo.referenceImage);
    } else {
      setReferenceImage(null);
    }
  }, []);
  
  const debouncedPrompt = useDebounce(prompt, 1500);

  useEffect(() => {
    if (debouncedPrompt.trim().length > 3) {
      setIsLoadingSuggestions(true);
      generatePromptSuggestions(debouncedPrompt)
        .then(setSuggestions)
        .catch(err => {
          console.error("Failed to fetch suggestions:", err);
          setSuggestions([]);
        })
        .finally(() => setIsLoadingSuggestions(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedPrompt]);

  const handleGenerateLogo = useCallback(async () => {
    if (!prompt.trim() && !referenceImage) return;
    setIsLoadingLogo(true);
    setError(null);
    setVideoError(null);
    setLogo(null);
    setVideo(null);
    setActiveHistoryId(null);

    try {
      const displayPrompt = prompt.trim() || (referenceImage ? "Uploaded image reference" : "Logo concept");
      const [newLogo, palettes] = await Promise.all([
        generateLogo(prompt, selectedStyle, referenceImage),
        generateColorPalettes(prompt, selectedStyle, referenceImage)
      ]);
      const logoData = { ...newLogo, prompt_for_alt: displayPrompt, palettes };
      setLogo(logoData);
      setVariations(prev => [logoData, ...prev.slice(0, 24)]);

      const newItemId = Date.now().toString();
      const newItem: HistoryItem = {
        id: newItemId,
        timestamp: Date.now(),
        prompt: displayPrompt,
        style: selectedStyle,
        logo: logoData,
        video: null
      };

      setActiveHistoryId(newItemId);
      saveHistory([newItem, ...history]);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An unknown error occurred while creating the logo.";
      setError({ message });
    } finally {
      setIsLoadingLogo(false);
    }
  }, [prompt, selectedStyle, referenceImage, history, saveHistory]);

  const handleGenerate25Variations = useCallback(async () => {
    if (!prompt.trim() && !referenceImage) return;
    setIsLoadingLogo(true);
    setError(null);
    setVideoError(null);
    setLogo(null);
    setVideo(null);
    setActiveHistoryId(null);

    try {
      const displayPrompt = prompt.trim() || (referenceImage ? "Uploaded image reference" : "Logo concept");
      const generatedVariations = await generate25LogoVariations(
        prompt, 
        selectedStyle, 
        referenceImage
      );

      if (generatedVariations.length === 0) {
        throw new Error("Failed to generate logo variations. Please try again.");
      }

      setVariations(generatedVariations);
      const firstLogo = generatedVariations[0];
      setLogo(firstLogo);

      const now = Date.now();
      const newItems: HistoryItem[] = generatedVariations.map((logoData, idx) => ({
        id: `${now}-${idx}`,
        timestamp: now + idx,
        prompt: displayPrompt,
        style: (logoData.style as LogoStyleId) || selectedStyle,
        logo: logoData,
        video: null
      }));

      setActiveHistoryId(newItems[0].id);
      saveHistory([...newItems, ...history]);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An unknown error occurred while generating variations.";
      setError({ message });
    } finally {
      setIsLoadingLogo(false);
    }
  }, [prompt, selectedStyle, referenceImage, history, saveHistory]);

  const handleGenerateVideo = useCallback(async (animationPrompt: string) => {
    if (!logo) return;
    setIsLoadingVideo(true);
    setError(null);
    setVideoError(null);
    setVideo(null);

    try {
      const videoResult = await generateVideo(animationPrompt, logo);
      setVideo(videoResult);

      if (videoResult.isFallback) {
        setVideoError("Rendered HD Motion Video via Motion Stage Engine.");
      }

      // Save video animation as a NEW separate gallery item, preserving regular logo in history
      const newVideoId = `vid-${Date.now()}`;
      const basePromptStr = prompt.trim() || logo.prompt_for_alt || "Logo Concept";
      const newVideoItem: HistoryItem = {
        id: newVideoId,
        timestamp: Date.now(),
        prompt: `${basePromptStr} (Motion Video)`,
        style: selectedStyle,
        logo: logo,
        video: videoResult,
      };

      const updated = [newVideoItem, ...history];
      setActiveHistoryId(newVideoId);
      saveHistory(updated);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Video generation call failed.";
      setVideoError(message);
    } finally {
      setIsLoadingVideo(false);
    }
  }, [logo, activeHistoryId, history, saveHistory, prompt, selectedStyle]);

  const canGenerate = prompt.trim().length > 0 || referenceImage !== null;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 p-4 sm:p-6 md:p-8 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-7xl mx-auto w-full flex-grow pb-16">
        <Header />

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl mb-6 max-w-4xl mx-auto shadow-xs" role="alert">
            <div className="flex items-start">
              <span className="text-rose-500 mr-3 text-lg">⚠️</span>
              <div>
                <p className="font-mono font-bold text-sm">System Alert</p>
                <p className="text-xs text-rose-800 font-sans mt-0.5">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start mb-8">
          <LogoGenerator 
            prompt={prompt}
            setPrompt={setPrompt}
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
            referenceImage={referenceImage}
            setReferenceImage={setReferenceImage}
            onGenerate={handleGenerateLogo}
            onGenerateBatch={handleGenerate25Variations}
            isLoading={isLoadingLogo}
            suggestions={suggestions}
            isLoadingSuggestions={isLoadingSuggestions}
            historyCount={history.length}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
          <VideoGenerator
            logo={logo}
            video={video}
            onGenerate={handleGenerateVideo}
            isLoading={isLoadingVideo}
            videoError={videoError}
          />
        </main>

        {/* Floating / Bottom Action Bar for Session Creations Gallery */}
        <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2">
          <div className="bg-slate-900 text-white font-mono font-bold text-xs sm:text-sm p-1.5 pl-4 pr-2 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 hover:text-emerald-300 transition-colors"
            >
              <HistoryIcon className="w-4 h-4 text-emerald-400" />
              <span>Session Gallery</span>
              <span className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            </button>
            <div className="h-4 w-px bg-slate-700 my-auto" />
            
            {/* Share Icon next to the green share button inside the black bar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              className="text-slate-300 hover:text-emerald-400 p-1.5 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
              title="Share Gallery Direct Link & Socials"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-mono shadow-xs font-bold"
              title="Share Session Creations Gallery"
            >
              <ShareIcon className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          items={history}
          activeId={activeHistoryId}
          onSelect={handleSelectHistoryItem}
          onDelete={handleDeleteHistoryItem}
          onClearAll={handleClearHistory}
        />

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          galleryCount={history.length}
          items={history}
        />
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-slate-500 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>built with 💚 in Boston by</span>
          <a 
            href="https://github.com/ashleyer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-800 font-bold underline hover:text-emerald-700 transition-colors"
          >
            Ashley Romano
          </a>
          <span>, 2026</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Powered by Gemini 3.6 Flash & Veo Video Engine
        </div>
      </footer>
    </div>
  );
}
