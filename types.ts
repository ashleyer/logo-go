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
  svgContent?: string;
}

export interface VideoData {
  uri: string;
  // We will fetch the video as a blob URL for display
  blobUrl?: string; 
  size?: number;
  mimeType?: string;
  base64?: string;
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
  isCloudSaved?: boolean;
}

export interface ColorSuggestion {
  name: string;
  palette: string[];
  vibe: string;
  colorsPrompt: string;
}

export interface ImpressionSuggestion {
  id: string;
  label: string;
  icon: string;
  promptSnippet: string;
  description: string;
}

export const CURATED_IMPRESSIONS: ImpressionSuggestion[] = [
  {
    id: 'hightech',
    label: 'High-Tech & Futuristic',
    icon: '⚡',
    promptSnippet: 'Impression: "High-tech, innovative, futuristic & precise"',
    description: 'Crisp geometry, cutting-edge tech aura, digital elegance',
  },
  {
    id: 'timeless',
    label: 'Prestigious & Timeless',
    icon: '🏛️',
    promptSnippet: 'Impression: "Prestigious, heritage, timeless & authoritative"',
    description: 'Refined symmetry, enduring trust, bespoke craftsmanship',
  },
  {
    id: 'organic',
    label: 'Organic & Sustainable',
    icon: '🌿',
    promptSnippet: 'Impression: "Organic, eco-conscious, botanical & serene"',
    description: 'Gentle curves, nature-inspired vitality, earth balance',
  },
  {
    id: 'dynamic',
    label: 'Energetic & Athletic',
    icon: '🔥',
    promptSnippet: 'Impression: "Dynamic, aerodynamic, high-energy & bold"',
    description: 'Forward motion, sharp velocity, commanding presence',
  },
  {
    id: 'minimal',
    label: 'Minimalist & Modernist',
    icon: '✨',
    promptSnippet: 'Impression: "Ultra-minimalist, Swiss modernist, clean & iconic"',
    description: 'Golden ratio, maximum negative space, pure essentialism',
  },
  {
    id: 'luxury',
    label: 'Luxury & Haute Couture',
    icon: '💎',
    promptSnippet: 'Impression: "Luxury, opulent, high-fashion & sophisticated"',
    description: 'Exquisite monograms, golden proportions, sleek elegance',
  },
  {
    id: 'artisanal',
    label: 'Artisanal & Warm',
    icon: '☕',
    promptSnippet: 'Impression: "Warm, artisanal, handcrafted & approachable"',
    description: 'Friendly charm, handcrafted soul, neighborhood warmth',
  },
  {
    id: 'security',
    label: 'Secure & Shielded',
    icon: '🛡️',
    promptSnippet: 'Impression: "Fortified, trustworthy, dependable & secure"',
    description: 'Solid geometry, protective seal, unwavering stability',
  },
];

export const CURATED_COLOR_HARMONIES: ColorSuggestion[] = [
  {
    name: 'Obsidian & Champagne Gold',
    palette: ['#0F172A', '#D97706', '#FEF3C7'],
    vibe: 'Luxury & Prestigious',
    colorsPrompt: 'Colors: Deep obsidian black, champagne gold, and brushed ivory',
  },
  {
    name: 'Emerald & Brushed Brass',
    palette: ['#064E3B', '#10B981', '#F59E0B'],
    vibe: 'Heritage & Prosperity',
    colorsPrompt: 'Colors: Deep forest emerald green and antique brushed brass gold',
  },
  {
    name: 'Electric Neon & Deep Carbon',
    palette: ['#06B6D4', '#3B82F6', '#090D16'],
    vibe: 'Cyber & High-Tech',
    colorsPrompt: 'Colors: Electric cyan blue, vivid cobalt, and matte carbon black',
  },
  {
    name: 'Sage, Terracotta & Sand',
    palette: ['#047857', '#C2410C', '#FDE68A'],
    vibe: 'Organic & Sustainable',
    colorsPrompt: 'Colors: Earthy sage green, warm terracotta clay, and sunlit sand',
  },
  {
    name: 'Sunset Coral & Golden Amber',
    palette: ['#F43F5E', '#FB923C', '#FBBF24'],
    vibe: 'Vibrant & Creative',
    colorsPrompt: 'Colors: Radiant sunset coral, warm mango orange, and golden amber',
  },
  {
    name: 'Midnight Navy & Crisp Platinum',
    palette: ['#1E3A8A', '#38BDF8', '#F1F5F9'],
    vibe: 'Corporate & Trusted',
    colorsPrompt: 'Colors: Deep midnight navy, electric cerulean, and crisp platinum white',
  },
  {
    name: 'Crimson & Matte Charcoal',
    palette: ['#E11D48', '#BE123C', '#1E293B'],
    vibe: 'Bold & Dynamic',
    colorsPrompt: 'Colors: Vivid crimson red, deep ruby, and matte slate charcoal',
  },
  {
    name: 'Monochrome Silver & Pitch Black',
    palette: ['#000000', '#64748B', '#FFFFFF'],
    vibe: 'Minimalist & Timeless',
    colorsPrompt: 'Colors: Pitch black, titanium silver, and clean pure white',
  },
];