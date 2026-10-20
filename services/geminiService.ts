
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { LogoData, ColorPalette, ReferenceImage, VideoData, LogoStyleId } from "../types";
import { generateProceduralVectorLogo, generateProceduralVectorVariations } from "../utils/proceduralLogoGenerator";

export const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Check window-injected key from Vite transform
    const winKey = (window as any).__GEMINI_API_KEY__;
    if (winKey && typeof winKey === 'string' && winKey.trim() && winKey !== 'AIzaSyALenekFs3FD13n3PhH7VWH5sC-dKba0WE') {
      return winKey.trim();
    }

    // 2. Check localStorage, cleaning up obsolete/depleted keys
    try {
      const stored = localStorage.getItem('GEMINI_API_KEY') || localStorage.getItem('GOOGLE_API_KEY') || localStorage.getItem('VITE_GEMINI_API_KEY');
      if (stored) {
        const clean = stored.trim();
        if (clean === 'AIzaSyALenekFs3FD13n3PhH7VWH5sC-dKba0WE') {
          localStorage.removeItem('GEMINI_API_KEY');
          localStorage.removeItem('GOOGLE_API_KEY');
          localStorage.removeItem('VITE_GEMINI_API_KEY');
        } else if (clean.length > 5) {
          return clean;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Check environment safely
  try {
    const envKey = typeof process !== 'undefined' && process.env
      ? (process.env.GEMINI_API_KEY || process.env.API_KEY || (process.env as any).GOOGLE_API_KEY || (process.env as any).VITE_GEMINI_API_KEY)
      : undefined;
    if (envKey && envKey.trim() && envKey !== 'undefined' && envKey.trim() !== 'AIzaSyALenekFs3FD13n3PhH7VWH5sC-dKba0WE') {
      return envKey.trim();
    }
  } catch {
    // ignore
  }

  // 4. Check Vite client environment variables
  try {
    const metaKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
    if (metaKey && typeof metaKey === 'string' && metaKey.trim() && metaKey.trim() !== 'AIzaSyALenekFs3FD13n3PhH7VWH5sC-dKba0WE') {
      return metaKey.trim();
    }
  } catch {
    // ignore
  }

  return '';
};

/**
 * Generates a list of prompt suggestions to enhance the user's initial idea.
 */
export const generatePromptSuggestions = async (prompt: string): Promise<string[]> => {
  if (!prompt.trim()) return [];
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Based on the user's logo prompt or brand details "${prompt}", suggest 4 short, distinct brand enhancements:
1. Tailored Color harmony (e.g., "Colors: Deep obsidian & champagne gold")
2. Distinct Brand Impression (e.g., "Impression: 'Sleek, futuristic & authoritative'")
3. Mission or Purpose (e.g., "Mission: 'Pioneering regenerative tech'")
4. Emblem Concept (e.g., "Symbol: Minimalist geometric nexus")
Return only a JSON array of 4 strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        },
        temperature: 0.75,
      }
    });

    const jsonText = response.text.trim();
    const suggestions = JSON.parse(jsonText);
    return Array.isArray(suggestions) ? suggestions.slice(0, 4) : [];
  } catch {
    // Curated high-impact fallback suggestions based on brand context
    const lower = prompt.toLowerCase();
    const fallbacks: string[] = [];
    if (!lower.includes("impression")) fallbacks.push(`Impression: "Prestigious, timeless & modern"`);
    if (!lower.includes("color")) fallbacks.push(`Colors: Obsidian black, brushed gold & ivory`);
    if (!lower.includes("mission")) fallbacks.push(`Mission: "Pioneering innovation & excellence"`);
    if (!lower.includes("symbol")) fallbacks.push(`Symbol: Geometric monogram badge`);
    return fallbacks.slice(0, 4);
  }
};


/**
 * Renders an SVG string onto an offscreen canvas and returns a high-resolution PNG base64 string.
 */
const svgToPngBase64 = (svgString: string, size = 1024): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      try {
        const base64 = btoa(unescape(encodeURIComponent(svgString)));
        return resolve(base64);
      } catch {
        return resolve('');
      }
    }
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          const base64 = btoa(unescape(encodeURIComponent(svgString)));
          return resolve(base64);
        }
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        resolve(base64);
      } catch {
        URL.revokeObjectURL(url);
        try {
          const base64 = btoa(unescape(encodeURIComponent(svgString)));
          resolve(base64);
        } catch {
          resolve('');
        }
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      try {
        const base64 = btoa(unescape(encodeURIComponent(svgString)));
        resolve(base64);
      } catch {
        resolve('');
      }
    };
    img.src = url;
  });
};

export const generateSvgVectorLogo = async (
  prompt: string,
  styleId?: string,
  referenceImage?: ReferenceImage | null,
  aiClient?: GoogleGenAI
): Promise<LogoData> => {
  const currentKey = getApiKey();
  const ai = aiClient || new GoogleGenAI({ apiKey: currentKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `You are an elite master vector logo designer. Create a sleek, modern, professional vector logo in SVG format for: "${prompt}".
Style requirement: ${styleId || 'modern vector'}.
${referenceImage ? 'Incorporate and elevate the visual concept from the user reference image.' : ''}
Output ONLY valid SVG markup starting with <svg and ending with </svg>.
The SVG must have viewBox="0 0 512 512", width="512", height="512", beautiful balanced geometric composition, modern aesthetic color accents, and transparent background. Do not include markdown code blocks, backticks, or explanatory text.`,
  });

  const text = (response.text || '').trim();
  const match = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) {
    throw new Error("Vector engine could not parse SVG markup.");
  }

  const svgMarkup = match[0];
  const pngBase64 = await svgToPngBase64(svgMarkup);

  return {
    base64: pngBase64,
    mimeType: 'image/png',
    style: styleId,
    referenceImage: referenceImage || null,
    svgContent: svgMarkup,
  };
};

/**
 * Generates a logo image based on a text prompt, optional style, and optional uploaded reference image to enhance.
 */
export const generateLogo = async (
  prompt: string, 
  styleId?: string, 
  referenceImage?: ReferenceImage | null
): Promise<LogoData> => {
  const currentKey = getApiKey();
  if (!currentKey) {
    console.warn("No Gemini API key detected; rendering with Procedural Vector Design Engine.");
    return await generateProceduralVectorLogo(prompt, styleId, referenceImage);
  }
  const ai = new GoogleGenAI({ apiKey: currentKey });

  let styleInstruction = "A modern, high-quality vector-style logo";
  if (styleId === 'minimalist') {
    styleInstruction = "CRITICAL MANDATE: You MUST generate ONLY an ultra-minimalist, sleek flat vector logo. Use clean geometric lines, high visual restraint, negative space, and minimal detail. Do NOT include gradients, heavy textures, or complex ornaments.";
  } else if (styleId === 'abstract') {
    styleInstruction = "CRITICAL MANDATE: You MUST generate ONLY an abstract, conceptual vector logo with metaphorical shapes, artistic curves, and symbolic geometry.";
  } else if (styleId === 'vintage') {
    styleInstruction = "CRITICAL MANDATE: You MUST generate ONLY a retro vintage emblem logo with classic framing, elegant heritage motifs, and authentic linework.";
  } else if (styleId === 'modern') {
    styleInstruction = "CRITICAL MANDATE: You MUST generate ONLY a sleek, modern vibrant vector logo with precise curves, clean gradients, and professional digital branding.";
  } else if (styleId === 'cyberpunk') {
    styleInstruction = "CRITICAL MANDATE: You MUST generate ONLY a futuristic cyberpunk vector logo with glowing neon highlights, high-tech HUD geometry, and cybernetic lines.";
  } else if (styleId === 'handdrawn') {
    styleInstruction = "CRITICAL MANDATE: You MUST generate ONLY a hand-drawn organic sketch vector logo with artisanal line textures and a handcrafted feel.";
  }

  const parts: any[] = [];

  if (referenceImage) {
    parts.push({
      inlineData: {
        data: referenceImage.base64,
        mimeType: referenceImage.mimeType,
      }
    });
  }

  let promptText = styleInstruction;
  if (referenceImage) {
    promptText += `. Enhance, vectorize, and elevate the provided uploaded reference drawing/logo image into a professional brand logo. Maintain the underlying composition, key iconic elements, and shape from the reference image while rendering it crisp, balanced, and production-ready.`;
    if (prompt && prompt.trim()) {
      promptText += ` Additional user requirements: "${prompt.trim()}".`;
    }
  } else {
    promptText += ` of "${prompt}".`;
  }
  promptText += ` The logo must be beautifully centered on a transparent or clean solid background, sharp, and highly suitable for branding.`;

  parts.push({ text: promptText });

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: parts,
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
    } catch (primaryErr: any) {
      console.warn("Primary image model (gemini-3.1-flash-lite-image) notice, trying fallback image model:", primaryErr);
      try {
        response = await ai.models.generateContent({
          model: 'gemini-nano-banana-2.1',
          contents: {
            parts: parts,
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
      } catch (secondaryErr: any) {
        console.warn("Image model notice, generating vector logo engine with gemini-3.8-flash:", secondaryErr);
        try {
          return await generateSvgVectorLogo(prompt, styleId, referenceImage, ai);
        } catch (svgErr) {
          console.error("Vector fallback error:", svgErr);
          throw secondaryErr;
        }
      }
    }

    const part = response?.candidates?.[0]?.content?.parts?.[0];

    if (part?.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
        style: styleId,
        referenceImage: referenceImage || null,
      };
    }

    // If no inlineData, attempt SVG vector fallback
    return await generateSvgVectorLogo(prompt, styleId, referenceImage, ai);
  } catch (error: any) {
    console.warn("Logo generation error, attempting procedural vector fallback:", error);
    try {
      return await generateProceduralVectorLogo(prompt, styleId, referenceImage);
    } catch (procErr) {
      console.error("Procedural vector logo generation error:", procErr);
      const errStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
      const msg = (error?.message || "").toLowerCase();
      const statusCode = error?.status || error?.code || error?.error?.code;

      if (statusCode === 403 || errStr.includes('403') || errStr.includes('PERMISSION_DENIED') || msg.includes('permission')) {
        throw new Error("API Permission Denied. Please ensure your Gemini API key has access to image generation models.");
      }
      if (
        statusCode === 402 || 
        statusCode === 429 || 
        errStr.includes('402') || 
        errStr.includes('429') || 
        errStr.includes('RESOURCE_EXHAUSTED') || 
        msg.includes('quota') || 
        msg.includes('prepayment') || 
        msg.includes('depleted') || 
        msg.includes('credit')
      ) {
        throw new Error("Your Google AI Studio prepayment credits are depleted. Please visit https://ai.studio/projects to manage billing and add credits.");
      }
      throw error;
    }
  }
};

import { renderLogoCanvasVideoBlob } from '../utils/videoRenderer';

export interface VideoResultData extends VideoData {
  isFallback?: boolean;
}

/**
 * Generates a video animating a given logo using Veo or Canvas Motion Stage fallback.
 */
export const generateVideo = async (prompt: string, logo: LogoData): Promise<VideoResultData> => {
  const currentKey = getApiKey();
  try {
    const aiForVideo = new GoogleGenAI({ apiKey: currentKey });
    
    let operation = await aiForVideo.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: `Animate this logo with this theme: ${prompt}. The animation should be a short, looping reveal.`,
      image: {
        imageBytes: logo.base64,
        mimeType: logo.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await aiForVideo.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed, but no download link was found.");
    }

    const fullUri = `${downloadLink}&key=${currentKey}`;
    const response = await fetch(fullUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch Veo video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    const blobUrl = URL.createObjectURL(videoBlob);

    return {
      uri: fullUri,
      blobUrl: blobUrl,
      size: videoBlob.size,
      isFallback: false,
    };
  } catch (error: any) {
    console.warn("Veo video API notice, rendering with AI Motion Stage Engine:", error);
    try {
      const fallbackResult = await renderLogoCanvasVideoBlob(logo, prompt);
      return {
        ...fallbackResult,
        isFallback: true
      };
    } catch (fallbackErr) {
      console.error("Fallback video rendering error:", fallbackErr);
      throw new Error("Unable to render motion video animation. Please try again.");
    }
  }
};

/**
 * Generates 25 logo concept variations strictly tailored to the selected style modifier.
 */
export const generate25LogoVariations = async (
  prompt: string,
  baseStyle: LogoStyleId,
  referenceImage?: ReferenceImage | null,
  onProgress?: (count: number) => void
): Promise<LogoData[]> => {
  const getStyleSpecificModifiers = (style: LogoStyleId): { style: LogoStyleId; tag: string }[] => {
    switch (style) {
      case 'minimalist':
        return [
          { style: 'minimalist', tag: 'Minimalist flat vector line icon' },
          { style: 'minimalist', tag: 'Minimalist geometric circle crest' },
          { style: 'minimalist', tag: 'Minimalist clean monoline stroke emblem' },
          { style: 'minimalist', tag: 'Minimalist bold negative space monogram' },
          { style: 'minimalist', tag: 'Minimalist continuous line art symbol' },
          { style: 'minimalist', tag: 'Minimalist geometric square frame' },
          { style: 'minimalist', tag: 'Minimalist subtle typography mark' },
          { style: 'minimalist', tag: 'Minimalist dual-line symmetrical icon' },
          { style: 'minimalist', tag: 'Minimalist dot matrix geometry' },
          { style: 'minimalist', tag: 'Minimalist single-stroke lettermark' },
          { style: 'minimalist', tag: 'Minimalist architectural line grid' },
          { style: 'minimalist', tag: 'Minimalist rounded pebble silhouette' },
          { style: 'minimalist', tag: 'Minimalist thin line crest' },
          { style: 'minimalist', tag: 'Minimalist sharp hairline emblem' },
          { style: 'minimalist', tag: 'Minimalist parallel line mark' },
          { style: 'minimalist', tag: 'Minimalist solid black & white contrast icon' },
          { style: 'minimalist', tag: 'Minimalist clean arc curve emblem' },
          { style: 'minimalist', tag: 'Minimalist minimal node icon' },
          { style: 'minimalist', tag: 'Minimalist interlocking oval mark' },
          { style: 'minimalist', tag: 'Minimalist framed initial emblem' },
          { style: 'minimalist', tag: 'Minimalist essential vector motif' },
          { style: 'minimalist', tag: 'Minimalist elegant line shield' },
          { style: 'minimalist', tag: 'Minimalist sharp polygon mark' },
          { style: 'minimalist', tag: 'Minimalist modern flat stamp' },
          { style: 'minimalist', tag: 'Minimalist pristine vector icon' },
        ];
      case 'abstract':
        return [
          { style: 'abstract', tag: 'Abstract overlapping color curves' },
          { style: 'abstract', tag: 'Abstract conceptual geometric prism shape' },
          { style: 'abstract', tag: 'Abstract dynamic fluid wave icon' },
          { style: 'abstract', tag: 'Abstract sacred geometry star icon' },
          { style: 'abstract', tag: 'Abstract mobius strip loop' },
          { style: 'abstract', tag: 'Abstract gradient vortex emblem' },
          { style: 'abstract', tag: 'Abstract interlocking ribbon mark' },
          { style: 'abstract', tag: 'Abstract crystalline facet shape' },
          { style: 'abstract', tag: 'Abstract floating geometric cluster' },
          { style: 'abstract', tag: 'Abstract optical illusion symbol' },
          { style: 'abstract', tag: 'Abstract radial wave burst' },
          { style: 'abstract', tag: 'Abstract algorithmic pattern mark' },
          { style: 'abstract', tag: 'Abstract morphing organic shape' },
          { style: 'abstract', tag: 'Abstract geometric intersection icon' },
          { style: 'abstract', tag: 'Abstract kinetic spiral emblem' },
          { style: 'abstract', tag: 'Abstract dimensional layered mark' },
          { style: 'abstract', tag: 'Abstract symmetrical mandala crest' },
          { style: 'abstract', tag: 'Abstract isometric block symbol' },
          { style: 'abstract', tag: 'Abstract fluid energy splash' },
          { style: 'abstract', tag: 'Abstract conceptual balance icon' },
          { style: 'abstract', tag: 'Abstract modern polygon crest' },
          { style: 'abstract', tag: 'Abstract interconnected web mark' },
          { style: 'abstract', tag: 'Abstract radiant light aura symbol' },
          { style: 'abstract', tag: 'Abstract continuous flow emblem' },
          { style: 'abstract', tag: 'Abstract sculpted geometry icon' },
        ];
      case 'vintage':
        return [
          { style: 'vintage', tag: 'Vintage classic retro stamp insignia' },
          { style: 'vintage', tag: 'Vintage nostalgic golden filigree shield' },
          { style: 'vintage', tag: 'Vintage typography badge with ribbon' },
          { style: 'vintage', tag: 'Vintage rustic timber woodcut emblem' },
          { style: 'vintage', tag: 'Vintage heritage artisan seal' },
          { style: 'vintage', tag: 'Vintage 1920s art deco monogram crest' },
          { style: 'vintage', tag: 'Vintage mid-century retro mascot badge' },
          { style: 'vintage', tag: 'Vintage victorian floral ornament emblem' },
          { style: 'vintage', tag: 'Vintage distressed leather patch icon' },
          { style: 'vintage', tag: 'Vintage classic nautical anchor crest' },
          { style: 'vintage', tag: 'Vintage heritage heraldic crest shield' },
          { style: 'vintage', tag: 'Vintage western hand-lettered mark' },
          { style: 'vintage', tag: 'Vintage copperplate engraving logo' },
          { style: 'vintage', tag: 'Vintage classic starburst banner emblem' },
          { style: 'vintage', tag: 'Vintage retro gas station style badge' },
          { style: 'vintage', tag: 'Vintage antique crest with laurel wreath' },
          { style: 'vintage', tag: 'Vintage classic tavern sign icon' },
          { style: 'vintage', tag: 'Vintage retro varsity lettermark badge' },
          { style: 'vintage', tag: 'Vintage golden wax seal stamp' },
          { style: 'vintage', tag: 'Vintage heritage crest with banners' },
          { style: 'vintage', tag: 'Vintage retro diner badge logo' },
          { style: 'vintage', tag: 'Vintage classic typography ring insignia' },
          { style: 'vintage', tag: 'Vintage handcrafted woodblock print emblem' },
          { style: 'vintage', tag: 'Vintage rustic cabin emblem' },
          { style: 'vintage', tag: 'Vintage authentic heritage trademark seal' },
        ];
      case 'cyberpunk':
        return [
          { style: 'cyberpunk', tag: 'Cyberpunk futuristic neon circuit icon' },
          { style: 'cyberpunk', tag: 'Cyberpunk high-tech glowing HUD crest' },
          { style: 'cyberpunk', tag: 'Cyberpunk cybernetic angular emblem' },
          { style: 'cyberpunk', tag: 'Cyberpunk holographic matrix icon' },
          { style: 'cyberpunk', tag: 'Cyberpunk dark synthwave grid logo' },
          { style: 'cyberpunk', tag: 'Cyberpunk laser glowing hexagon crest' },
          { style: 'cyberpunk', tag: 'Cyberpunk neon glitch typography emblem' },
          { style: 'cyberpunk', tag: 'Cyberpunk futuristic mecha shield mark' },
          { style: 'cyberpunk', tag: 'Cyberpunk cyber skull/core emblem' },
          { style: 'cyberpunk', tag: 'Cyberpunk electric plasma aura logo' },
          { style: 'cyberpunk', tag: 'Cyberpunk high-tech node network icon' },
          { style: 'cyberpunk', tag: 'Cyberpunk neon triangle portal emblem' },
          { style: 'cyberpunk', tag: 'Cyberpunk metallic chrome cyber insignia' },
          { style: 'cyberpunk', tag: 'Cyberpunk digital wireframe vector mark' },
          { style: 'cyberpunk', tag: 'Cyberpunk Tokyo night neon sign icon' },
          { style: 'cyberpunk', tag: 'Cyberpunk cybernetic wing emblem' },
          { style: 'cyberpunk', tag: 'Cyberpunk futuristic binary code crest' },
          { style: 'cyberpunk', tag: 'Cyberpunk electric pulse shield badge' },
          { style: 'cyberpunk', tag: 'Cyberpunk cyber samurai crest icon' },
          { style: 'cyberpunk', tag: 'Cyberpunk futuristic energy crystal logo' },
          { style: 'cyberpunk', tag: 'Cyberpunk glowing cyan & magenta emblem' },
          { style: 'cyberpunk', tag: 'Cyberpunk high-tech orbital radar icon' },
          { style: 'cyberpunk', tag: 'Cyberpunk futuristic laser beam mark' },
          { style: 'cyberpunk', tag: 'Cyberpunk cyber tech core badge' },
          { style: 'cyberpunk', tag: 'Cyberpunk neon energy surge emblem' },
        ];
      case 'handdrawn':
        return [
          { style: 'handdrawn', tag: 'Hand-drawn charming organic sketch logo' },
          { style: 'handdrawn', tag: 'Hand-drawn artisanal botanical linework' },
          { style: 'handdrawn', tag: 'Hand-drawn textured ink-brush emblem' },
          { style: 'handdrawn', tag: 'Hand-drawn playful doodle mascot logo' },
          { style: 'handdrawn', tag: 'Hand-drawn custom calligraphic lettermark' },
          { style: 'handdrawn', tag: 'Hand-drawn watercolor stroke emblem' },
          { style: 'handdrawn', tag: 'Hand-drawn rustic pencil sketch crest' },
          { style: 'handdrawn', tag: 'Hand-drawn stippled ink dot art logo' },
          { style: 'handdrawn', tag: 'Hand-drawn whimsical cartoon emblem' },
          { style: 'handdrawn', tag: 'Hand-drawn woodcut linocut print mark' },
          { style: 'handdrawn', tag: 'Hand-drawn organic foliage wreath badge' },
          { style: 'handdrawn', tag: 'Hand-drawn hand-lettered sign mark' },
          { style: 'handdrawn', tag: 'Hand-drawn sketchy animal mascot icon' },
          { style: 'handdrawn', tag: 'Hand-drawn rough charcoal line emblem' },
          { style: 'handdrawn', tag: 'Hand-drawn handcrafted ceramic stamp' },
          { style: 'handdrawn', tag: 'Hand-drawn organic wave sketch' },
          { style: 'handdrawn', tag: 'Hand-drawn vintage notebook ink sketch' },
          { style: 'handdrawn', tag: 'Hand-drawn bohemian sun & moon icon' },
          { style: 'handdrawn', tag: 'Hand-drawn custom brush script mark' },
          { style: 'handdrawn', tag: 'Hand-drawn organic coffee ring badge' },
          { style: 'handdrawn', tag: 'Hand-drawn hand-carved block print icon' },
          { style: 'handdrawn', tag: 'Hand-drawn cozy artisan emblem' },
          { style: 'handdrawn', tag: 'Hand-drawn loose ink splatter mark' },
          { style: 'handdrawn', tag: 'Hand-drawn sketched mountain peak icon' },
          { style: 'handdrawn', tag: 'Hand-drawn authentic signature emblem' },
        ];
      case 'modern':
      default:
        return [
          { style: 'modern', tag: 'Modern vibrant gradient vector badge' },
          { style: 'modern', tag: 'Modern 3D metallic glassmorphism emblem' },
          { style: 'modern', tag: 'Modern sleek tech hexagon logo' },
          { style: 'modern', tag: 'Modern origami folded paper icon' },
          { style: 'modern', tag: 'Modern luxury gold foil crest' },
          { style: 'modern', tag: 'Modern sleek overlapping geometric mark' },
          { style: 'modern', tag: 'Modern glossy emerald vector emblem' },
          { style: 'modern', tag: 'Modern dynamic speed line logo' },
          { style: 'modern', tag: 'Modern minimalist 3D cube icon' },
          { style: 'modern', tag: 'Modern clean app icon crest' },
          { style: 'modern', tag: 'Modern dual-tone gradient shield' },
          { style: 'modern', tag: 'Modern futuristic infinity loop mark' },
          { style: 'modern', tag: 'Modern sharp Tech polygon crest' },
          { style: 'modern', tag: 'Modern elegant frosted glass emblem' },
          { style: 'modern', tag: 'Modern smooth metallic sphere icon' },
          { style: 'modern', tag: 'Modern vibrant geometric wave badge' },
          { style: 'modern', tag: 'Modern sleek lettermark symbol' },
          { style: 'modern', tag: 'Modern contemporary architectural logo' },
          { style: 'modern', tag: 'Modern clean ribbon loop icon' },
          { style: 'modern', tag: 'Modern glossy tech shield emblem' },
          { style: 'modern', tag: 'Modern dynamic flame vector mark' },
          { style: 'modern', tag: 'Modern elegant diamond facet crest' },
          { style: 'modern', tag: 'Modern high-tech network core icon' },
          { style: 'modern', tag: 'Modern clean corporate insignia' },
          { style: 'modern', tag: 'Modern premium brand emblem' },
        ];
    }
  };

  const variationModifiers = getStyleSpecificModifiers(baseStyle);
  let completedCount = 0;

  // Run generation in batches of 5 for optimal response time
  const results: LogoData[] = [];
  const BATCH_SIZE = 5;
  let criticalError: Error | null = null;

  // Retrieve base color palettes once for this session to avoid 25 redundant network calls
  let basePalettes: ColorPalette[] = DEFAULT_PALETTES;
  try {
    basePalettes = await generateColorPalettes(prompt, baseStyle, referenceImage);
  } catch {
    basePalettes = DEFAULT_PALETTES;
  }

  // Check if API key is present; if not, immediately generate procedural variations
  const currentKey = getApiKey();
  if (!currentKey) {
    console.warn("No Gemini API key detected; generating 25 variations with Procedural Vector Design Engine.");
    return await generateProceduralVectorVariations(prompt, baseStyle, referenceImage, basePalettes, onProgress);
  }

  for (let i = 0; i < variationModifiers.length; i += BATCH_SIZE) {
    if (criticalError) break;
    const chunk = variationModifiers.slice(i, i + BATCH_SIZE);
    const chunkPromises = chunk.map(async (mod) => {
      try {
        const fullPrompt = `${prompt} (${mod.tag})`;
        const logo = await generateLogo(fullPrompt, mod.style, referenceImage);
        completedCount++;
        if (onProgress) onProgress(completedCount);
        return {
          ...logo,
          prompt_for_alt: fullPrompt,
          style: mod.style,
          palettes: basePalettes
        };
      } catch (err: any) {
        console.error(`Error generating variation ${mod.tag}:`, err);
        const errMsg = err?.message || String(err);
        if (!criticalError) {
          criticalError = err instanceof Error ? err : new Error(errMsg);
        }
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    chunkResults.forEach((res) => {
      if (res) results.push(res);
    });

    if (criticalError && results.length === 0) {
      break;
    }
  }

  if (results.length === 0) {
    console.warn("Neural generation returned 0 logos, falling back to 25 procedural vector variations.");
    const proceduralLogos = await generateProceduralVectorVariations(
      prompt,
      baseStyle,
      referenceImage,
      basePalettes,
      onProgress
    );
    if (proceduralLogos.length > 0) {
      return proceduralLogos;
    }
    if (criticalError) {
      throw criticalError;
    }
  }

  return results;
};

const DEFAULT_PALETTES: ColorPalette[] = [
  {
    themeName: "Forest Olive",
    theoryType: "Analogous",
    description: "An earthy, grounded palette of rich greens and warm sand that feels organic and reliable.",
    colors: [
      { hex: "#283618", name: "Dark Olive Green", role: "Dominant" },
      { hex: "#606c38", name: "Olive Green", role: "Supporting" },
      { hex: "#fefae0", name: "Cornsilk", role: "Light Neutral" },
      { hex: "#dda15e", name: "Earth Yellow", role: "Accent" },
      { hex: "#bc6c25", name: "Tiger's Eye", role: "Supporting" }
    ]
  },
  {
    themeName: "Nordic Frost",
    theoryType: "Monochromatic",
    description: "A clean, cool-toned palette that conveys modern precision, clarity, and calmness.",
    colors: [
      { hex: "#1e293b", name: "Slate Blue", role: "Dominant" },
      { hex: "#3b82f6", name: "Royal Blue", role: "Supporting" },
      { hex: "#93c5fd", name: "Ice Blue", role: "Accent" },
      { hex: "#f1f5f9", name: "Chalk White", role: "Light Neutral" },
      { hex: "#0f172a", name: "Midnight Navy", role: "Dark Neutral" }
    ]
  },
  {
    themeName: "Sunset Ember",
    theoryType: "Complementary",
    description: "High-contrast palette pairing deep twilight blue with vibrant sunset orange for premium energy.",
    colors: [
      { hex: "#0f172a", name: "Midnight Void", role: "Dominant" },
      { hex: "#ea580c", name: "Cadmium Orange", role: "Accent" },
      { hex: "#f59e0b", name: "Warm Amber", role: "Supporting" },
      { hex: "#fafafa", name: "Pure Alabaster", role: "Light Neutral" },
      { hex: "#334155", name: "Slate Grey", role: "Supporting" }
    ]
  }
];

/**
 * Generates 3 color palette variations for a brand description and selected style using color theory logic.
 */
export const generateColorPalettes = async (
  prompt: string, 
  styleId?: string, 
  referenceImage?: ReferenceImage | null
): Promise<ColorPalette[]> => {
  if (!prompt.trim() && !referenceImage) return DEFAULT_PALETTES;
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const contentsParts: any[] = [];
    if (referenceImage) {
      contentsParts.push({
        inlineData: {
          data: referenceImage.base64,
          mimeType: referenceImage.mimeType,
        }
      });
    }

    const textPrompt = `Generate exactly 3 professional color palette variations for a brand logo ${referenceImage ? 'based on the uploaded image and description: "' + (prompt || 'logo reference image') + '"' : 'based on this description: "' + prompt + '"'} (Style: ${styleId || 'default'}).
The palettes must be derived using rigorous color theory logic. 
Provide 3 distinct palettes (e.g. Monochromatic, Analogous, Complementary, Triadic, or Split-Complementary).
For each palette:
1. "themeName": Give it an elegant, professional name (e.g., "Golden Heritage", "Oceanic Breeze").
2. "theoryType": Specify the exact color theory method (e.g., "Complementary", "Analogous", "Triadic", "Monochromatic", "Split-Complementary").
3. "description": Write 1-2 sentences explaining why this color palette is highly effective for this brand concept based on color theory and psychology.
4. "colors": An array of exactly 5 colors. Each color has "hex" (a valid 6-character hex code starting with #), "name" (a descriptive name, e.g. "Sage Green", "Charcoal"), and "role" (e.g. "Dominant", "Supporting", "Accent", "Light Neutral", "Dark Neutral").`;

    contentsParts.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: contentsParts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              themeName: { type: Type.STRING },
              theoryType: { type: Type.STRING },
              description: { type: Type.STRING },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hex: { type: Type.STRING },
                    name: { type: Type.STRING },
                    role: { type: Type.STRING }
                  },
                  required: ["hex", "name", "role"]
                }
              }
            },
            required: ["themeName", "theoryType", "description", "colors"]
          }
        },
        temperature: 0.7
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.slice(0, 3) : DEFAULT_PALETTES;
  } catch {
    // Return standard fallback palettes based on color theory if API call fails or quota is depleted
    return DEFAULT_PALETTES;
  }
};