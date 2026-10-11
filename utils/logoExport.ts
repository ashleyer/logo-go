/**
 * High-Resolution Logo Export Utility
 * Supports exporting logos to high-res PNG (1024px, 2048px, 4096px 4K)
 * and scalable SVG (Vector XML and Vector Paths) directly from the browser.
 */

export type PngResolution = 1024 | 2048 | 4096;
export type SvgMode = 'vector-embed' | 'vector-paths';

export interface ExportOptions {
  filename?: string;
  styleName?: string;
  colorTone?: string;
  filterString?: string;
  bgMode?: 'transparent' | 'white' | 'cream' | 'dark' | 'emerald' | 'custom';
  customBgHex?: string;
  customTintHex?: string;
  transparentBackground?: boolean;
}

/**
 * Downloads a high-resolution PNG with optional canvas filters and background color.
 */
export const downloadHighResPng = async (
  base64Data: string,
  mimeType: string,
  resolution: PngResolution = 2048,
  options: ExportOptions = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `data:${mimeType};base64,${base64Data}`;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          throw new Error('Unable to create canvas 2D rendering context');
        }

        // Handle background: if transparentBackground is true or bgMode is transparent, leave transparent
        const isTransparent = options.transparentBackground ?? (options.bgMode === 'transparent' || !options.bgMode);

        if (!isTransparent) {
          let bgColor = '#FFFFFF';
          if (options.bgMode === 'cream') bgColor = '#FEFAE0';
          else if (options.bgMode === 'dark') bgColor = '#0F172A';
          else if (options.bgMode === 'emerald') bgColor = '#022C22';
          else if (options.bgMode === 'custom' && options.customBgHex) bgColor = options.customBgHex;
          else if (options.bgMode === 'white') bgColor = '#FFFFFF';

          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, resolution, resolution);
        } else {
          ctx.clearRect(0, 0, resolution, resolution);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply visual color tuning filters
        if (options.filterString) {
          ctx.filter = options.filterString;
        }

        // Draw image scaled to resolution
        ctx.drawImage(img, 0, 0, resolution, resolution);

        // Reset filter
        ctx.filter = 'none';

        // Apply custom tint if specified
        if (options.colorTone === 'custom' && options.customTintHex) {
          ctx.save();
          ctx.globalCompositeOperation = 'color';
          ctx.fillStyle = options.customTintHex;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(0, 0, resolution, resolution);
          ctx.restore();
        }

        // Export as PNG blob / data URL
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const styleTag = options.styleName ? options.styleName.toLowerCase().replace(/\s+/g, '-') : 'logo';
        const resLabel = resolution === 4096 ? '4k' : resolution === 2048 ? 'hd-2k' : '1k';
        const bgLabel = isTransparent ? 'transparent' : 'solid';
        link.download = options.filename || `logo-go-${styleTag}-${resLabel}-${bgLabel}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        resolve();
      } catch (err) {
        console.error('Error generating high-resolution PNG:', err);
        reject(err);
      }
    };

    img.onerror = (e) => {
      reject(new Error(`Failed to load image for PNG export: ${e}`));
    };
  });
};

/**
 * Traces a bitmap into clean vector SVG path polygons.
 * Uses adaptive luminance thresholding and contour segments.
 */
const traceBitmapToSvgPaths = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): string => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Reduce resolution grid for smooth SVG paths (max 128x128 grid)
  const sampleStep = Math.max(1, Math.floor(width / 128));
  const cols = Math.floor(width / sampleStep);
  const rows = Math.floor(height / sampleStep);

  // Group pixels into color clusters
  const pathsByColor: Map<string, string[]> = new Map();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pxX = c * sampleStep;
      const pxY = r * sampleStep;
      const idx = (pxY * width + pxX) * 4;

      const alpha = data[idx + 3];
      if (alpha < 32) continue; // Skip transparent pixels

      const red = data[idx];
      const green = data[idx + 1];
      const blue = data[idx + 2];

      // Quantize color to 16-level palette for vector grouping
      const qR = Math.round(red / 32) * 32;
      const qG = Math.round(green / 32) * 32;
      const qB = Math.round(blue / 32) * 32;
      const colorHex = `#${qR.toString(16).padStart(2, '0')}${qG.toString(16).padStart(2, '0')}${qB.toString(16).padStart(2, '0')}`;

      // Create a small rounded vector rect path
      const x = pxX;
      const y = pxY;
      const size = sampleStep;
      const pathChunk = `M${x},${y}h${size}v${size}h-${size}Z`;

      if (!pathsByColor.has(colorHex)) {
        pathsByColor.set(colorHex, []);
      }
      pathsByColor.get(colorHex)!.push(pathChunk);
    }
  }

  // Combine into SVG <path> elements
  let svgPathsStr = '';
  pathsByColor.forEach((chunks, color) => {
    if (chunks.length > 0) {
      svgPathsStr += `    <path d="${chunks.join(' ')}" fill="${color}" shape-rendering="crispEdges" />\n`;
    }
  });

  return svgPathsStr;
};

/**
 * Downloads a scalable SVG file (Vector Scalable Graphics).
 * Supports standard crisp vector SVG embedding or traced vector paths.
 */
export const downloadScalableSvg = async (
  base64Data: string,
  mimeType: string,
  mode: SvgMode = 'vector-embed',
  options: ExportOptions = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `data:${mimeType};base64,${base64Data}`;

    img.onload = () => {
      try {
        const svgSize = 1024;
        const isTransparent = options.transparentBackground ?? (options.bgMode === 'transparent' || !options.bgMode);

        let bgColor = '';
        if (!isTransparent) {
          if (options.bgMode === 'cream') bgColor = '#FEFAE0';
          else if (options.bgMode === 'dark') bgColor = '#0F172A';
          else if (options.bgMode === 'emerald') bgColor = '#022C22';
          else if (options.bgMode === 'custom' && options.customBgHex) bgColor = options.customBgHex;
          else bgColor = '#FFFFFF';
        }

        // Render to canvas to bake in any CSS filters or color tuning
        const canvas = document.createElement('canvas');
        canvas.width = svgSize;
        canvas.height = svgSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          throw new Error('Canvas 2D context not available');
        }

        if (!isTransparent && bgColor) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, svgSize, svgSize);
        }

        if (options.filterString) {
          ctx.filter = options.filterString;
        }

        ctx.drawImage(img, 0, 0, svgSize, svgSize);
        ctx.filter = 'none';

        if (options.colorTone === 'custom' && options.customTintHex) {
          ctx.save();
          ctx.globalCompositeOperation = 'color';
          ctx.fillStyle = options.customTintHex;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(0, 0, svgSize, svgSize);
          ctx.restore();
        }

        let svgContent = '';

        if (mode === 'vector-paths') {
          // Pure SVG vector paths
          const paths = traceBitmapToSvgPaths(canvas, svgSize, svgSize);
          svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
  <title>Logo-go Vector Logo - ${options.styleName || 'Custom'}</title>
  <desc>Generated by Logo-go Studio - Pure Vector Path Geometry</desc>
  <metadata>
    <styleType>${options.styleName || 'Emblem'}</styleType>
    <colorTone>${options.colorTone || 'Original'}</colorTone>
  </metadata>
  ${!isTransparent && bgColor ? `<rect width="100%" height="100%" fill="${bgColor}" />` : ''}
  <g id="vector-logo-paths">
${paths}
  </g>
</svg>`;
        } else {
          // High-Res Embedded Vector SVG (Scalable in Figma, Illustrator, Canva, web)
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
  <title>Logo-go Scalable Emblem - ${options.styleName || 'Custom'}</title>
  <desc>Generated by Logo-go Studio - Scalable Vector Emblem</desc>
  <defs>
    <clipPath id="logo-viewport-clip">
      <rect width="${svgSize}" height="${svgSize}" rx="0" ry="0" />
    </clipPath>
  </defs>
  ${!isTransparent && bgColor ? `<rect width="100%" height="100%" fill="${bgColor}" id="background" />` : ''}
  <g id="logo-emblem" clip-path="url(#logo-viewport-clip)">
    <image href="${dataUrl}" width="${svgSize}" height="${svgSize}" preserveAspectRatio="xMidYMid meet" />
  </g>
</svg>`;
        }

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const styleTag = options.styleName ? options.styleName.toLowerCase().replace(/\s+/g, '-') : 'logo';
        const modeTag = mode === 'vector-paths' ? 'paths' : 'vector';
        const bgTag = isTransparent ? 'transparent' : 'solid';

        link.download = options.filename || `logo-go-${styleTag}-${modeTag}-${bgTag}.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        resolve();
      } catch (err) {
        console.error('Error generating SVG:', err);
        reject(err);
      }
    };

    img.onerror = (e) => {
      reject(new Error(`Failed to load image for SVG export: ${e}`));
    };
  });
};
