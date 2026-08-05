export interface ColorInfo {
  hex: string;
  name: string;
  role: string;
}

export interface ColorPalette {
  themeName: string;
  theoryType: string;
  description: string;
  colors: ColorInfo[];
}

export interface ReferenceImage {
  base64: string;
  mimeType: string;
  fileName?: string;
  previewUrl?: string;
}

export interface LogoData {
  base64: string;
  mimeType: string;
  prompt_for_alt?: string;
  style?: string;
  palettes?: ColorPalette[];
  referenceImage?: ReferenceImage | null;
}

export interface VideoData {
  uri: string;
  // We will fetch the video as a blob URL for display
  blobUrl?: string; 
  size?: number;
}

export interface ApiError {
  message: string;
}

export const LOGO_STYLES = [
  { id: 'minimalist', name: 'Minimalist', description: 'Clean lines, simple geometry, ultra-modern' },
  { id: 'abstract', name: 'Abstract', description: 'Metaphorical shapes, conceptual, artistic' },
  { id: 'vintage', name: 'Vintage', description: 'Nostalgic retro framing, hand-drawn feel' },
  { id: 'modern', name: 'Modern Vector', description: 'Vibrant gradients, sharp curves, professional' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Futuristic lines, neon accenting, high-tech' },
  { id: 'handdrawn', name: 'Hand-Drawn', description: 'Organic sketching, textured, personal' }
] as const;

export type LogoStyleId = typeof LOGO_STYLES[number]['id'];

export interface MotionPreset {
  id: string;
  name: string;
  icon: string;
  cssClass: string;
  prompt: string;
}

export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'shine',
    name: 'Shine & Light Sweep',
    icon: '✨',
    cssClass: 'animate-shine-sweep',
    prompt: 'Magical reveal, shimmering particles and glass light sweep',
  },
  {
    id: 'pulse',
    name: 'Pulse & Radiance Glow',
    icon: '💓',
    cssClass: 'animate-pulse-glow',
    prompt: 'Kinetic pulse effect with radiating emerald energy aura',
  },
  {
    id: 'wave',
    name: 'Float & Liquid Wave',
    icon: '🌊',
    cssClass: 'animate-float-wave',
    prompt: 'Fluid liquid wave reveal with ambient floating motion',
  },
  {
    id: 'orbit',
    name: '3D Orbit Rotation',
    icon: '🪐',
    cssClass: 'animate-orbit-tilt',
    prompt: 'Dynamic 3D perspective spin with metallic reflection and orbital tilt',
  },
  {
    id: 'neon',
    name: 'Cyber Neon Surge',
    icon: '⚡',
    cssClass: 'animate-neon-surge',
    prompt: 'Futuristic cyberpunk neon sign flicker-on with electric surges',
  },
  {
    id: 'glitch',
    name: 'Digital Glitch Assembly',
    icon: '👾',
    cssClass: 'animate-glitch-flicker',
    prompt: 'Digital glitch and chromatic aberration assembly animation',
  },
  {
    id: 'zoom',
    name: 'Zoom & Spin Burst',
    icon: '🎯',
    cssClass: 'animate-zoom-spin',
    prompt: 'Dynamic zoom with elegant rotation and cosmic burst',
  },
  {
    id: 'holo',
    name: 'Holographic Projection',
    icon: '🔮',
    cssClass: 'animate-holo-beam',
    prompt: 'Holographic scanline projection with starfield illumination',
  },
];

export const ANIMATION_STYLES = MOTION_PRESETS.map((p) => p.prompt);

export type AnimationStyle = string;

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  style: LogoStyleId;
  logo: LogoData;
  video: VideoData | null;
}