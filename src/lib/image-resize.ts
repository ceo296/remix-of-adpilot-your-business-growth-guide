/**
 * Canvas-based image resize/crop utility.
 * Takes a source image URL and target dimensions, returns a data URL
 * with the image cropped (center-crop) and resized to fit.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export interface ResizeOptions {
  /** Target width in pixels */
  width: number;
  /** Target height in pixels */
  height: number;
  /** Fit mode: 'cover' center-crops, 'contain' fits with letterbox */
  mode?: 'cover' | 'contain';
  /** Background color for 'contain' mode letterboxing */
  backgroundColor?: string;
  /** Output quality 0-1 for JPEG */
  quality?: number;
}

export interface AdaptedCreative {
  specId: string;
  specName: string;
  dimensions: string;
  originalUrl: string;
  adaptedUrl: string;
  outletName: string;
}

/**
 * Resize/crop an image to target dimensions using Canvas.
 * Default mode is 'cover' (center-crop to fill).
 */
export async function resizeImage(
  sourceUrl: string,
  options: ResizeOptions
): Promise<string> {
  const { width, height, mode = 'cover', backgroundColor = '#ffffff', quality = 0.92 } = options;

  const img = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (mode === 'contain') {
    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Scale to fit
    const scale = Math.min(width / img.width, height / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  } else {
    // Cover: center-crop
    const scale = Math.max(width / img.width, height / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Parse a dimensions string like "12x17 ס"מ" or "1024x768 px" into pixel values.
 * For cm dimensions, converts using 300 DPI (print standard).
 */
export function parseDimensions(dimStr: string): { width: number; height: number } | null {
  if (!dimStr) return null;

  // Try patterns like "12x17", "12×17", "1024x768"
  const match = dimStr.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;

  let w = parseFloat(match[1]);
  let h = parseFloat(match[2]);

  // If dimensions mention cm/ס"מ, convert to pixels at 300 DPI
  const isCm = /ס"מ|cm/i.test(dimStr);
  if (isCm) {
    // 1 cm = ~118.11 px at 300 DPI
    const CM_TO_PX = 118.11;
    w = Math.round(w * CM_TO_PX);
    h = Math.round(h * CM_TO_PX);
  }

  // If dimensions are very small (likely inches), convert at 300 DPI
  if (w < 50 && h < 50 && !isCm) {
    const IN_TO_PX = 300;
    w = Math.round(w * IN_TO_PX);
    h = Math.round(h * IN_TO_PX);
  }

  return w > 0 && h > 0 ? { width: w, height: h } : null;
}
