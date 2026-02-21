/**
 * PDF Utilities - Convert PDF to images, extract text, and export print-ready PDFs.
 * Uses pdf.js for rendering and jsPDF for export.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Convert first page of a PDF to a PNG data URL.
 * Useful for converting PDF logos to images for AI models.
 */
export async function pdfToImage(
  pdfSource: string | ArrayBuffer,
  options: { scale?: number; page?: number } = {}
): Promise<string> {
  const { scale = 3, page = 1 } = options;

  let loadingTask;
  if (typeof pdfSource === 'string') {
    // Data URL or regular URL
    if (pdfSource.startsWith('data:application/pdf')) {
      const base64 = pdfSource.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      loadingTask = pdfjsLib.getDocument({ data: bytes });
    } else {
      loadingTask = pdfjsLib.getDocument(pdfSource);
    }
  } else {
    loadingTask = pdfjsLib.getDocument({ data: pdfSource });
  }

  const pdf = await loadingTask.promise;
  const pdfPage = await pdf.getPage(page);
  const viewport = pdfPage.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

/**
 * Extract text content from all pages of a PDF.
 */
export async function extractPdfText(
  pdfSource: string | ArrayBuffer
): Promise<{ pages: string[]; fullText: string; pageCount: number }> {
  let loadingTask;
  if (typeof pdfSource === 'string') {
    if (pdfSource.startsWith('data:application/pdf')) {
      const base64 = pdfSource.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      loadingTask = pdfjsLib.getDocument({ data: bytes });
    } else {
      loadingTask = pdfjsLib.getDocument(pdfSource);
    }
  } else {
    loadingTask = pdfjsLib.getDocument({ data: pdfSource });
  }

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(pageText);
  }

  return {
    pages,
    fullText: pages.join('\n\n'),
    pageCount: pdf.numPages,
  };
}

/**
 * Detect if a URL/data-url is a PDF.
 */
export function isPdfUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('data:application/pdf') || url.toLowerCase().endsWith('.pdf');
}

/**
 * Convert all pages of a PDF to images.
 */
export async function pdfToImages(
  pdfSource: string | ArrayBuffer,
  options: { scale?: number } = {}
): Promise<string[]> {
  const { scale = 2 } = options;

  let loadingTask;
  if (typeof pdfSource === 'string') {
    if (pdfSource.startsWith('data:application/pdf')) {
      const base64 = pdfSource.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      loadingTask = pdfjsLib.getDocument({ data: bytes });
    } else {
      loadingTask = pdfjsLib.getDocument(pdfSource);
    }
  } else {
    loadingTask = pdfjsLib.getDocument({ data: pdfSource });
  }

  const pdf = await loadingTask.promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/png'));
  }

  return images;
}
