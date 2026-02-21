/**
 * Print-ready PDF export utility.
 * Converts generated ad images to high-quality PDF files for print.
 */

import jsPDF from 'jspdf';

export interface PrintExportOptions {
  /** Image data URL or URL */
  imageUrl: string;
  /** Output filename (without .pdf) */
  filename?: string;
  /** Paper format */
  format?: 'a4' | 'a3' | 'a5' | 'letter' | 'custom';
  /** Orientation */
  orientation?: 'portrait' | 'landscape';
  /** Custom dimensions in mm (only for format='custom') */
  customWidth?: number;
  customHeight?: number;
  /** Bleed in mm (extra space around edges for cutting) */
  bleed?: number;
  /** Whether to add crop marks */
  cropMarks?: boolean;
  /** Resolution quality */
  quality?: 'draft' | 'standard' | 'high';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Draw crop marks on the PDF for print trimming.
 */
function drawCropMarks(doc: jsPDF, x: number, y: number, w: number, h: number, markLen = 5) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);

  // Top-left
  doc.line(x - markLen, y, x - 1, y);
  doc.line(x, y - markLen, x, y - 1);

  // Top-right
  doc.line(x + w + 1, y, x + w + markLen, y);
  doc.line(x + w, y - markLen, x + w, y - 1);

  // Bottom-left
  doc.line(x - markLen, y + h, x - 1, y + h);
  doc.line(x, y + h + 1, x, y + h + markLen);

  // Bottom-right
  doc.line(x + w + 1, y + h, x + w + markLen, y + h);
  doc.line(x + w, y + h + 1, x + w, y + h + markLen);
}

/**
 * Export an image as a print-ready PDF.
 */
export async function exportToPrintPdf(options: PrintExportOptions): Promise<void> {
  const {
    imageUrl,
    filename = 'print-ready',
    format = 'a4',
    orientation = 'portrait',
    bleed = 3,
    cropMarks = true,
    quality = 'high',
  } = options;

  const img = await loadImage(imageUrl);

  // Determine page dimensions in mm
  let pageW: number, pageH: number;
  if (format === 'custom' && options.customWidth && options.customHeight) {
    pageW = options.customWidth;
    pageH = options.customHeight;
  } else {
    const sizes: Record<string, [number, number]> = {
      a3: [297, 420],
      a4: [210, 297],
      a5: [148, 210],
      letter: [216, 279],
    };
    [pageW, pageH] = sizes[format] || sizes.a4;
  }

  if (orientation === 'landscape') {
    [pageW, pageH] = [pageH, pageW];
  }

  // Total page size with bleed
  const totalW = pageW + bleed * 2;
  const totalH = pageH + bleed * 2;

  const doc = new jsPDF({
    orientation: orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: [totalW + (cropMarks ? 20 : 0), totalH + (cropMarks ? 20 : 0)],
  });

  const offsetX = cropMarks ? 10 : 0;
  const offsetY = cropMarks ? 10 : 0;

  // Draw image to fill the entire bleed area
  // Convert image to canvas for quality control
  const canvas = document.createElement('canvas');
  const qualityScale = quality === 'high' ? 3 : quality === 'standard' ? 2 : 1;
  canvas.width = Math.round((totalW / 25.4) * 300 * (qualityScale / 3));
  canvas.height = Math.round((totalH / 25.4) * 300 * (qualityScale / 3));
  const ctx = canvas.getContext('2d')!;

  // Draw image scaled to fill
  const imgRatio = img.width / img.height;
  const canvasRatio = canvas.width / canvas.height;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const imgData = canvas.toDataURL('image/jpeg', quality === 'high' ? 0.95 : quality === 'standard' ? 0.85 : 0.7);

  doc.addImage(imgData, 'JPEG', offsetX, offsetY, totalW, totalH);

  // Draw crop marks
  if (cropMarks) {
    drawCropMarks(doc, offsetX + bleed, offsetY + bleed, pageW, pageH);
  }

  doc.save(`${filename}.pdf`);
}

/**
 * Export multiple images as a multi-page print PDF.
 */
export async function exportMultiPagePdf(
  images: { url: string; label?: string }[],
  options: Omit<PrintExportOptions, 'imageUrl'> = {}
): Promise<void> {
  const {
    filename = 'campaign-print',
    format = 'a4',
    orientation = 'portrait',
    bleed = 3,
    cropMarks = true,
    quality = 'high',
  } = options;

  let pageW: number, pageH: number;
  const sizes: Record<string, [number, number]> = {
    a3: [297, 420],
    a4: [210, 297],
    a5: [148, 210],
    letter: [216, 279],
  };
  [pageW, pageH] = sizes[format] || sizes.a4;
  if (orientation === 'landscape') [pageW, pageH] = [pageH, pageW];

  const totalW = pageW + bleed * 2;
  const totalH = pageH + bleed * 2;
  const docW = totalW + (cropMarks ? 20 : 0);
  const docH = totalH + (cropMarks ? 20 : 0);

  const doc = new jsPDF({
    orientation: orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: [docW, docH],
  });

  const offsetX = cropMarks ? 10 : 0;
  const offsetY = cropMarks ? 10 : 0;

  for (let i = 0; i < images.length; i++) {
    if (i > 0) doc.addPage([docW, docH]);

    const img = await loadImage(images[i].url);
    const canvas = document.createElement('canvas');
    const qualityScale = quality === 'high' ? 3 : quality === 'standard' ? 2 : 1;
    canvas.width = Math.round((totalW / 25.4) * 300 * (qualityScale / 3));
    canvas.height = Math.round((totalH / 25.4) * 300 * (qualityScale / 3));
    const ctx = canvas.getContext('2d')!;

    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > canvasRatio) {
      sw = img.height * canvasRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / canvasRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', offsetX, offsetY, totalW, totalH);

    if (cropMarks) {
      drawCropMarks(doc, offsetX + bleed, offsetY + bleed, pageW, pageH);
    }
  }

  doc.save(`${filename}.pdf`);
}
