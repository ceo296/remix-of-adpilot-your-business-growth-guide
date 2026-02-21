/**
 * Programmatic Hebrew text overlay using Canvas.
 * Replaces AI-based text rendering to guarantee perfect Hebrew every time.
 */

export interface TextOverlayConfig {
  headline?: string;
  businessName?: string;
  phone?: string;
  primaryColor?: string;
  secondaryColor?: string;
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
 * Truncates headline to fit within maxWidth, adding "..." if needed
 */
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
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
    const lastLine = truncateText(ctx, lines[2], maxWidth);
    return [lines[0], lines[1], lastLine];
  }
  return lines;
}

/**
 * Applies Hebrew text overlay on top of an image using Canvas.
 * Returns a data URL of the composited image.
 */
export async function applyTextOverlay(
  imageUrl: string,
  config: TextOverlayConfig
): Promise<string> {
  const { headline, businessName, phone, primaryColor, secondaryColor } = config;

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
  const padding = w * 0.06;
  const maxTextWidth = w * 0.85;

  // Semi-transparent dark band at bottom for text readability
  const bandHeight = h * 0.35;
  const gradient = ctx.createLinearGradient(0, h - bandHeight, 0, h);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.3, 'rgba(0,0,0,0.6)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, h - bandHeight, w, bandHeight);

  // Accent color bar
  const accentColor = primaryColor || '#f9b17a';
  ctx.fillStyle = accentColor;
  ctx.fillRect(w - padding, h - bandHeight * 0.8, 4, bandHeight * 0.6);

  let currentY = h - bandHeight * 0.7;

  // Business name (large, bold)
  if (businessName) {
    const fontSize = Math.round(w * 0.055);
    ctx.font = `bold ${fontSize}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = accentColor;
    
    // Shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(businessName, w - padding - 12, currentY);
    currentY += fontSize * 1.4;
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Headline (medium, white, multi-line)
  if (headline) {
    const fontSize = Math.round(w * 0.038);
    ctx.font = `600 ${fontSize}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Truncate to max ~60 chars for headline display
    const shortHeadline = headline.length > 80 ? headline.substring(0, 77) + '...' : headline;
    const lines = wrapText(ctx, shortHeadline, maxTextWidth);
    
    for (const line of lines) {
      ctx.fillText(line, w - padding - 12, currentY);
      currentY += fontSize * 1.35;
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Phone (small, at bottom)
  if (phone) {
    const fontSize = Math.round(w * 0.032);
    ctx.font = `500 ${fontSize}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = secondaryColor || '#e0e0e0';
    
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;
    
    // Phone at bottom right
    ctx.fillText(phone, w - padding - 12, h - padding);
    
    ctx.shadowBlur = 0;
  }

  return canvas.toDataURL('image/png');
}
