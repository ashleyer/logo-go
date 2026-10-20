import { LogoData, ColorPalette, ReferenceImage, LogoStyleId } from '../types';

/**
 * High-definition SVG-to-PNG renderer using browser Canvas.
 */
export const svgToPngBase64 = (svgString: string, size = 1024): Promise<string> => {
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

/**
 * Extracts brand name and monogram letters from prompt.
 */
export const extractBrandInfo = (prompt: string): { name: string; initials: string; tag: string } => {
  const clean = prompt
    .replace(/describe your business[^:]*:/gi, '')
    .replace(/mission statement[^:]*:/gi, '')
    .replace(/colors:[^,;]+/gi, '')
    .replace(/impression:[^,;]+/gi, '')
    .replace(/[^\w\s-]/g, ' ')
    .trim();

  const words = clean
    .split(/\s+/)
    .filter((w) => w.length > 0 && !['a', 'an', 'the', 'for', 'and', 'with', 'logo', 'emblem', 'icon', 'design', 'vector'].includes(w.toLowerCase()));

  let name = 'BRAND';
  let initials = 'B';
  let tag = 'EST. 2026';

  if (words.length === 1) {
    name = words[0].toUpperCase();
    initials = name.slice(0, 2);
  } else if (words.length >= 2) {
    name = `${words[0]} ${words[1]}`.toUpperCase();
    initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
    if (words.length >= 3) {
      tag = words.slice(2, 4).join(' ').toUpperCase();
    }
  }

  return { name: name.slice(0, 20), initials: initials.slice(0, 3), tag: tag.slice(0, 24) };
};

/**
 * Palette colors per style index.
 */
const STYLE_PALETTES: Record<string, [string, string, string, string]> = {
  minimalist: ['#0F172A', '#334155', '#10B981', '#F8FAFC'],
  abstract: ['#6366F1', '#EC4899', '#8B5CF6', '#F43F5E'],
  vintage: ['#78350F', '#D97706', '#B45309', '#FEF3C7'],
  modern: ['#059669', '#10B981', '#06B6D4', '#0F172A'],
  cyberpunk: ['#00F0FF', '#FF007F', '#7928CA', '#12131A'],
  handdrawn: ['#44403C', '#78716C', '#D97706', '#F5F5F4'],
};

/**
 * Generates an SVG string for a specific variation index and aesthetic style.
 */
export const buildProceduralSvgMarkup = (
  prompt: string,
  styleId: string = 'modern',
  variationIndex = 0
): { svg: string; title: string } => {
  const { name, initials, tag } = extractBrandInfo(prompt);
  const palette = STYLE_PALETTES[styleId] || STYLE_PALETTES.modern;
  const c1 = palette[0];
  const c2 = palette[1];
  const c3 = palette[2];
  const c4 = palette[3];

  const uid = `proc_${styleId}_${variationIndex}_${Math.random().toString(36).slice(2, 7)}`;

  let innerGeometry = '';
  let title = 'Geometric Monogram';

  const type = variationIndex % 10;

  switch (type) {
    case 0:
      // Elegant Hexagonal Crest Monogram
      title = 'Hexagonal Matrix Crest';
      innerGeometry = `
        <polygon points="256,60 410,149 410,327 256,416 102,327 102,149" fill="url(#grad1_${uid})" stroke="${c3}" stroke-width="6" stroke-linejoin="round" opacity="0.95" />
        <polygon points="256,88 384,162 384,314 256,388 128,314 128,162" fill="none" stroke="${c4}" stroke-dasharray="10 8" stroke-width="3" opacity="0.8" />
        <circle cx="256" cy="238" r="80" fill="url(#grad2_${uid})" />
        <text x="256" y="260" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle" letter-spacing="2">${initials}</text>
        <text x="256" y="468" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="24" fill="${c1}" text-anchor="middle" letter-spacing="6">${name}</text>
      `;
      break;

    case 1:
      // Minimalist Dual Orbit Ring
      title = 'Dual Orbit Kinetic Ring';
      innerGeometry = `
        <circle cx="256" cy="230" r="140" fill="none" stroke="url(#grad1_${uid})" stroke-width="18" stroke-linecap="round" stroke-dasharray="700 80" />
        <circle cx="256" cy="230" r="105" fill="none" stroke="${c3}" stroke-width="8" stroke-linecap="round" stroke-dasharray="450 60" transform="rotate(45 256 230)" />
        <circle cx="256" cy="230" r="70" fill="url(#grad2_${uid})" />
        <text x="256" y="250" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="54" fill="#ffffff" text-anchor="middle">${initials}</text>
        <text x="256" y="458" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" fill="${c1}" text-anchor="middle" letter-spacing="8">${name}</text>
        <text x="256" y="488" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="12" fill="${c2}" text-anchor="middle" letter-spacing="4">${tag}</text>
      `;
      break;

    case 2:
      // Dynamic Kinetic Wings / Shield
      title = 'Dynamic Vector Shield';
      innerGeometry = `
        <path d="M 256,70 C 350,110 400,160 400,280 C 400,380 256,430 256,430 C 256,430 112,380 112,280 C 112,160 162,110 256,70 Z" fill="url(#grad1_${uid})" stroke="${c3}" stroke-width="6" />
        <path d="M 256,105 C 330,140 370,180 370,270 C 370,350 256,395 256,395 C 256,395 142,350 142,270 C 142,180 182,140 256,105 Z" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.4" />
        <text x="256" y="265" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="70" fill="#ffffff" text-anchor="middle">${initials}</text>
        <text x="256" y="480" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" fill="${c1}" text-anchor="middle" letter-spacing="6">${name}</text>
      `;
      break;

    case 3:
      // Abstract Mobius Loop
      title = 'Abstract Infinite Möbius';
      innerGeometry = `
        <path d="M 170,230 C 170,160 230,140 256,190 C 282,240 342,220 342,290 C 342,360 282,380 256,330 C 230,280 170,300 170,230 Z" fill="none" stroke="url(#grad1_${uid})" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="256" cy="230" r="30" fill="${c3}" />
        <circle cx="170" cy="230" r="14" fill="${c2}" />
        <circle cx="342" cy="290" r="14" fill="${c1}" />
        <text x="256" y="450" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="26" fill="${c1}" text-anchor="middle" letter-spacing="8">${name}</text>
      `;
      break;

    case 4:
      // Modern Diamond Nexus
      title = 'Modern Diamond Nexus';
      innerGeometry = `
        <rect x="156" y="130" width="200" height="200" rx="28" transform="rotate(45 256 230)" fill="url(#grad1_${uid})" stroke="${c3}" stroke-width="8" />
        <rect x="186" y="160" width="140" height="140" rx="16" transform="rotate(45 256 230)" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.5" />
        <text x="256" y="252" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle">${initials}</text>
        <text x="256" y="468" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" fill="${c1}" text-anchor="middle" letter-spacing="7">${name}</text>
      `;
      break;

    case 5:
      // Starburst Radiant Crest
      title = 'Radiant Starburst Seal';
      innerGeometry = `
        <g transform="translate(256, 220)">
          ${Array.from({ length: 12 })
            .map(
              (_, i) =>
                `<line x1="0" y1="-140" x2="0" y2="-115" stroke="${c3}" stroke-width="6" stroke-linecap="round" transform="rotate(${i * 30})" />`
            )
            .join('')}
          <circle cx="0" cy="0" r="100" fill="url(#grad1_${uid})" stroke="${c2}" stroke-width="6" />
          <text x="0" y="22" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="60" fill="#ffffff" text-anchor="middle">${initials}</text>
        </g>
        <text x="256" y="450" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="24" fill="${c1}" text-anchor="middle" letter-spacing="6">${name}</text>
        <text x="256" y="480" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12" fill="${c3}" text-anchor="middle" letter-spacing="4">${tag}</text>
      `;
      break;

    case 6:
      // Cybernetic Matrix HUD
      title = 'Cybernetic HUD Core';
      innerGeometry = `
        <polygon points="256,70 390,147 390,303 256,380 122,303 122,147" fill="url(#grad2_${uid})" stroke="${c1}" stroke-width="5" />
        <circle cx="256" cy="225" r="75" fill="none" stroke="${c2}" stroke-width="4" stroke-dasharray="14 10" />
        <circle cx="256" cy="225" r="50" fill="${c1}" />
        <path d="M 256,120 L 256,70 M 256,330 L 256,380 M 150,225 L 122,225 M 362,225 L 390,225" stroke="${c2}" stroke-width="5" stroke-linecap="round" />
        <text x="256" y="242" font-family="monospace" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle">${initials}</text>
        <text x="256" y="460" font-family="monospace" font-weight="900" font-size="20" fill="${c2}" text-anchor="middle" letter-spacing="8">&lt;${name}&gt;</text>
      `;
      break;

    case 7:
      // Vintage Circular Stamp & Ribbon
      title = 'Vintage Artisan Stamp';
      innerGeometry = `
        <circle cx="256" cy="210" r="130" fill="none" stroke="${c1}" stroke-width="8" />
        <circle cx="256" cy="210" r="115" fill="url(#grad1_${uid})" stroke="${c2}" stroke-width="4" stroke-dasharray="8 6" />
        <path d="M 120,330 Q 256,300 392,330 L 370,375 Q 256,345 142,375 Z" fill="${c1}" stroke="${c3}" stroke-width="3" />
        <text x="256" y="235" font-family="Georgia, serif" font-weight="bold" font-size="70" fill="#ffffff" text-anchor="middle">${initials}</text>
        <text x="256" y="354" font-family="Georgia, serif" font-weight="bold" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="4">${name}</text>
        <text x="256" y="450" font-family="Georgia, serif" font-style="italic" font-size="14" fill="${c2}" text-anchor="middle">${tag}</text>
      `;
      break;

    case 8:
      // Minimalist Monoline Ribbon Wave
      title = 'Monoline Ribbon Flow';
      innerGeometry = `
        <path d="M 120,280 C 180,140 230,340 290,180 C 330,80 390,220 390,280" fill="none" stroke="url(#grad1_${uid})" stroke-width="26" stroke-linecap="round" />
        <circle cx="256" cy="220" r="70" fill="url(#grad2_${uid})" opacity="0.9" />
        <text x="256" y="242" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="#ffffff" text-anchor="middle">${initials}</text>
        <text x="256" y="460" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="24" fill="${c1}" text-anchor="middle" letter-spacing="8">${name}</text>
      `;
      break;

    case 9:
    default:
      // Origami Faceted Isometric Cube
      title = 'Isometric Faceted Prism';
      innerGeometry = `
        <polygon points="256,90 380,160 256,230 132,160" fill="url(#grad1_${uid})" />
        <polygon points="256,230 380,160 380,300 256,370" fill="${c2}" opacity="0.9" />
        <polygon points="256,230 132,160 132,300 256,370" fill="${c1}" opacity="0.95" />
        <circle cx="256" cy="230" r="45" fill="#ffffff" />
        <text x="256" y="246" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="40" fill="${c1}" text-anchor="middle">${initials}</text>
        <text x="256" y="462" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" fill="${c1}" text-anchor="middle" letter-spacing="6">${name}</text>
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="grad1_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
      <linearGradient id="grad2_${uid}" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      </linearGradient>
      <filter id="shadow_${uid}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.15" />
      </filter>
    </defs>
    <g filter="url(#shadow_${uid})">
      ${innerGeometry}
    </g>
  </svg>`.trim();

  return { svg, title };
};

/**
 * Creates a single procedural logo with rendered base64 PNG and vector SVG.
 */
export const generateProceduralVectorLogo = async (
  prompt: string,
  styleId: string = 'modern',
  referenceImage?: ReferenceImage | null,
  variationIndex = 0
): Promise<LogoData> => {
  const { svg, title } = buildProceduralSvgMarkup(prompt, styleId, variationIndex);
  const base64 = await svgToPngBase64(svg, 1024);

  return {
    base64,
    mimeType: 'image/png',
    prompt_for_alt: `${prompt} (${title})`,
    style: styleId,
    referenceImage: referenceImage || null,
    svgContent: svg,
    isProcedural: true,
  };
};

/**
 * Generates 25 guaranteed high-fidelity procedural vector logo variations.
 */
export const generateProceduralVectorVariations = async (
  prompt: string,
  baseStyle: LogoStyleId = 'modern',
  referenceImage?: ReferenceImage | null,
  palettes?: ColorPalette[],
  onProgress?: (count: number) => void
): Promise<LogoData[]> => {
  const results: LogoData[] = [];
  const total = 25;

  for (let i = 0; i < total; i++) {
    const { svg, title } = buildProceduralSvgMarkup(prompt, baseStyle, i);
    const base64 = await svgToPngBase64(svg, 1024);

    results.push({
      base64,
      mimeType: 'image/png',
      prompt_for_alt: `${prompt} (${title})`,
      style: baseStyle,
      palettes: palettes,
      referenceImage: referenceImage || null,
      svgContent: svg,
      isProcedural: true,
    });

    if (onProgress) {
      onProgress(i + 1);
    }
  }

  return results;
};
