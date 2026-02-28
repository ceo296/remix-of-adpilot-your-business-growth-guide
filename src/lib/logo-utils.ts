/**
 * Logo utilities - handles PDF-to-PNG conversion for logo uploads.
 * Ensures logos are always stored as renderable images.
 */

import { isPdfUrl, pdfToImage } from './pdf-utils';

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
 * Returns { dataUrl, wasPdf }
 */
export async function fileToLogoDataUrl(file: File): Promise<{ dataUrl: string; wasPdf: boolean }> {
  const wasPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let dataUrl = event.target?.result as string;
        if (wasPdf) {
          dataUrl = await pdfToImage(dataUrl, { scale: 4 });
        }
        resolve({ dataUrl, wasPdf });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
