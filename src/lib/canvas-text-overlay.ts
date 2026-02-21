/**
 * Programmatic Hebrew text overlay using Canvas.
 * Replaces AI-based text rendering to guarantee perfect Hebrew every time.
 * Designed for professional print-quality ad layouts.
 */

export interface TextOverlayConfig {
  headline?: string;
  businessName?: string;
  phone?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
}

/**
 * Loads an image from a URL/data URL and returns it as an HTMLImageElement.
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

/**
 * Wraps text into multiple lines that fit within maxWidth
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  // Limit to 3 lines max
  if (lines.length > 3) {
    let truncated = lines[2];
    while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return [lines[0], lines[1], truncated + '...'];
  }
  return lines;
}

/**
 * Parses a color string and returns rgba with given alpha.
 * Handles hex, rgb, hsl formats.
 */
function colorWithAlpha(color: string, alpha: number): string {
  // If already rgba, replace alpha
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  }
  // Hex color
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // Fallback
  return color;
}

/**
 * Determines if a hex color is "light" (should use dark text on it).
 */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

/**
 * Applies Hebrew text overlay on top of an image using Canvas.
 * Uses brand colors for a professional ad layout.
 * Returns a data URL of the composited image.
 */
export async function applyTextOverlay(
  imageUrl: string,
  config: TextOverlayConfig
): Promise<string> {
  const { headline, businessName, phone, primaryColor, secondaryColor, backgroundColor } = config;

  // If no text to apply, return original
  if (!headline && !businessName && !phone) return imageUrl;

  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // RTL direction
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';

  const w = canvas.width;
  const h = canvas.height;
  const padding = w * 0.05;
  const maxTextWidth = w * 0.88;

  // Use brand colors
  const brandPrimary = primaryColor || '#2BA5B5'; // Default to teal if no brand color
  const brandSecondary = secondaryColor || '#333333';
  const bandBg = backgroundColor || brandPrimary;

  // === Bottom band with brand primary color ===
  const bandHeight = h * 0.22;
  const bandY = h - bandHeight;

  // Solid brand-colored band at the bottom
  ctx.fillStyle = colorWithAlpha(bandBg, 0.92);
  ctx.fillRect(0, bandY, w, bandHeight);

  // Thin accent line at top of band
  ctx.fillStyle = brandPrimary;
  ctx.fillRect(0, bandY, w, 4);

  // === Business Name - inside the colored band, large and bold ===
  let bandContentY = bandY + bandHeight * 0.38;

  if (businessName) {
    const fontSize = Math.round(w * 0.052);
    ctx.font = `bold ${fontSize}px "Heebo", "Arial", sans-serif`;
    
    // White text on dark band, or dark text on light band
    const textOnBand = isLightColor(bandBg) ? '#1a1a1a' : '#FFFFFF';
    ctx.fillStyle = textOnBand;
    
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(businessName, w - padding, bandContentY);
    bandContentY += fontSize * 1.5;
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // === Phone - inside band, below business name ===
  if (phone) {
    const fontSize = Math.round(w * 0.034);
    ctx.font = `600 ${fontSize}px "Heebo", "Arial", sans-serif`;
    const textOnBand = isLightColor(bandBg) ? '#333333' : '#e8e8e8';
    ctx.fillStyle = textOnBand;
    
    ctx.fillText(phone, w - padding, bandContentY);
  }

  // === Headline - ABOVE the band, on top of the image with brand color background pill ===
  if (headline) {
    const fontSize = Math.round(w * 0.042);
    ctx.font = `bold ${fontSize}px "Heebo", "Arial", sans-serif`;
    
    const lines = wrapText(ctx, headline.length > 80 ? headline.substring(0, 77) + '...' : headline, maxTextWidth * 0.9);
    const lineHeight = fontSize * 1.45;
    const totalTextHeight = lines.length * lineHeight;
    const blockPadding = fontSize * 0.4;
    
    // Position headline block just above the band
    const blockBottom = bandY - fontSize * 0.4;
    const blockTop = blockBottom - totalTextHeight - blockPadding * 2;
    
    // Semi-transparent background behind headline for readability
    const bgRoundRect = (x: number, y: number, rw: number, rh: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + rw - radius, y);
      ctx.quadraticCurveTo(x + rw, y, x + rw, y + radius);
      ctx.lineTo(x + rw, y + rh - radius);
      ctx.quadraticCurveTo(x + rw, y + rh, x + rw - radius, y + rh);
      ctx.lineTo(x + radius, y + rh);
      ctx.quadraticCurveTo(x, y + rh, x, y + rh - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };
    
    // Measure widest line for background
    let maxLineWidth = 0;
    for (const line of lines) {
      const lw = ctx.measureText(line).width;
      if (lw > maxLineWidth) maxLineWidth = lw;
    }
    
    // Draw background pill behind headline
    const bgX = w - padding - maxLineWidth - blockPadding * 2;
    bgRoundRect(bgX, blockTop, maxLineWidth + blockPadding * 3, totalTextHeight + blockPadding * 2, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fill();
    
    // Draw headline text in brand primary color
    ctx.fillStyle = brandPrimary;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    let textY = blockTop + blockPadding + fontSize;
    for (const line of lines) {
      ctx.fillText(line, w - padding - blockPadding, textY);
      textY += lineHeight;
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  return canvas.toDataURL('image/png');
}
