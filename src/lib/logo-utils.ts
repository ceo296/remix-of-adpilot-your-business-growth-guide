/**
 * Logo utilities - handles PDF-to-PNG conversion and white-background removal.
 * Ensures logos are always stored as renderable, transparent images.
 */

import { isPdfUrl, pdfToImage } from './pdf-utils';

/**
 * Detects if an image has a white/near-white background by sampling corner pixels.
 * Returns true if 3+ corners are near-white (RGB > threshold).
 */
export function detectWhiteBackground(
  imageDataUrl: string,
  threshold = 245
): Promise<{ isWhite: boolean; confidence: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ isWhite: false, confidence: 0 });

      ctx.drawImage(img, 0, 0);
      const w = img.width;
      const h = img.height;

      // Sample 4 corners + midpoints of edges (8 points total)
      const samplePoints = [
        [2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3],
        [Math.floor(w / 2), 2], [Math.floor(w / 2), h - 3],
        [2, Math.floor(h / 2)], [w - 3, Math.floor(h / 2)],
      ];

      let whiteCount = 0;
      for (const [x, y] of samplePoints) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        // Check if pixel is near-white and fully opaque
        if (pixel[0] >= threshold && pixel[1] >= threshold && pixel[2] >= threshold && pixel[3] > 200) {
          whiteCount++;
        }
      }

      const confidence = whiteCount / samplePoints.length;
      resolve({ isWhite: confidence >= 0.5, confidence });
    };
    img.onerror = () => resolve({ isWhite: false, confidence: 0 });
    img.src = imageDataUrl;
  });
}

/**
 * Removes white/near-white background pixels from an image, making them transparent.
 * Only operates on pixels with RGB all above the threshold.
 */
export function removeWhiteBackground(
  imageDataUrl: string,
  threshold = 240
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r >= threshold && g >= threshold && b >= threshold) {
          // Smooth edge: proportional alpha reduction
          const maxChannel = Math.max(r, g, b);
          const distance = maxChannel - threshold;
          const range = 255 - threshold;
          const alphaReduction = range > 0 ? distance / range : 1;
          data[i + 3] = Math.round(data[i + 3] * (1 - alphaReduction));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for background removal'));
    img.src = imageDataUrl;
  });
}

/**
 * If dataUrl is a PDF, converts it to a PNG data URL.
 * Otherwise returns the original dataUrl unchanged.
 */
export async function ensureImageDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl) return dataUrl;

  const isPdf =
    dataUrl.startsWith('data:application/pdf') ||
    dataUrl.toLowerCase().endsWith('.pdf');

  if (!isPdf) return dataUrl;

  // Convert PDF first page to high-quality PNG
  const pngDataUrl = await pdfToImage(dataUrl, { scale: 4 });
  return pngDataUrl;
}

/**
 * Converts a File to a data URL, and if it's a PDF, auto-converts to PNG.
 * Also detects and removes white backgrounds automatically.
 * Returns { dataUrl, wasPdf, hadWhiteBackground }
 */
export async function fileToLogoDataUrl(file: File): Promise<{ dataUrl: string; wasPdf: boolean; hadWhiteBackground?: boolean }> {
  const wasPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let dataUrl = event.target?.result as string;
        if (wasPdf) {
          dataUrl = await pdfToImage(dataUrl, { scale: 4 });
        }

        // Auto-detect and remove white background
        let hadWhiteBackground = false;
        if (!wasPdf && file.type.startsWith('image/')) {
          try {
            const { isWhite } = await detectWhiteBackground(dataUrl);
            if (isWhite) {
              hadWhiteBackground = true;
              dataUrl = await removeWhiteBackground(dataUrl);
            }
          } catch (e) {
            console.warn('[Logo] White bg detection failed:', e);
          }
        }

        resolve({ dataUrl, wasPdf, hadWhiteBackground });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
