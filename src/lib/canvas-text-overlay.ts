/**
 * Programmatic Hebrew text overlay using Canvas.
 * Supports multiple layout styles for different ad formats.
 */

export type TextLayoutStyle = 'bottom-banner' | 'center-card' | 'minimal';

export interface TextOverlayConfig {
  headline?: string;
  businessName?: string;
  phone?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  layoutStyle?: TextLayoutStyle;
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
  if (lines.length > 3) {
    let truncated = lines[2];
    while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return [lines[0], lines[1], truncated + '...'];
  }
  return lines;
}

function colorWithAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, `${alpha})`);
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function resetShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function setShadow(ctx: CanvasRenderingContext2D, blur: number, alpha = 0.5) {
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
}

// ═══════ Layout: Bottom Banner ═══════
// Solid color band at bottom with business name + phone, headline above in pill
function layoutBottomBanner(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, bandBg: string
) {
  const padding = w * 0.05;
  const maxTextWidth = w * 0.88;
  const bandHeight = h * 0.22;
  const bandY = h - bandHeight;

  // Solid band
  ctx.fillStyle = colorWithAlpha(bandBg, 0.92);
  ctx.fillRect(0, bandY, w, bandHeight);
  ctx.fillStyle = brandPrimary;
  ctx.fillRect(0, bandY, w, 4);

  const textOnBand = isLightColor(bandBg) ? '#1a1a1a' : '#FFFFFF';
  const subTextOnBand = isLightColor(bandBg) ? '#333333' : '#e8e8e8';
  let bandContentY = bandY + bandHeight * 0.38;

  if (config.businessName) {
    const fs = Math.round(w * 0.052);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnBand;
    setShadow(ctx, 4, 0.3);
    ctx.fillText(config.businessName, w - padding, bandContentY);
    bandContentY += fs * 1.5;
    resetShadow(ctx);
  }

  if (config.phone) {
    const fs = Math.round(w * 0.034);
    ctx.font = `600 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = subTextOnBand;
    ctx.fillText(config.phone, w - padding, bandContentY);
  }

  if (config.headline) {
    const fs = Math.round(w * 0.042);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 80 ? config.headline.substring(0, 77) + '...' : config.headline;
    const lines = wrapText(ctx, shortHeadline, maxTextWidth * 0.9);
    const lineHeight = fs * 1.45;
    const totalH = lines.length * lineHeight;
    const blockPad = fs * 0.4;
    const blockBottom = bandY - fs * 0.4;
    const blockTop = blockBottom - totalH - blockPad * 2;

    let maxLW = 0;
    for (const line of lines) { const lw = ctx.measureText(line).width; if (lw > maxLW) maxLW = lw; }

    roundRect(ctx, w - padding - maxLW - blockPad * 2, blockTop, maxLW + blockPad * 3, totalH + blockPad * 2, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fill();

    ctx.fillStyle = brandPrimary;
    setShadow(ctx, 3);
    let textY = blockTop + blockPad + fs;
    for (const line of lines) {
      ctx.fillText(line, w - padding - blockPad, textY);
      textY += lineHeight;
    }
    resetShadow(ctx);
  }
}

// ═══════ Layout: Center Card ═══════
// Centered semi-transparent card with all text inside
function layoutCenterCard(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, bandBg: string
) {
  const padding = w * 0.08;
  const maxTextWidth = w * 0.7;

  // Calculate total content height
  let totalHeight = 0;
  const businessFs = Math.round(w * 0.055);
  const headlineFs = Math.round(w * 0.038);
  const phoneFs = Math.round(w * 0.03);

  if (config.businessName) totalHeight += businessFs * 1.6;
  
  ctx.font = `bold ${headlineFs}px "Heebo", "Arial", sans-serif`;
  let headlineLines: string[] = [];
  if (config.headline) {
    const shortHeadline = config.headline.length > 80 ? config.headline.substring(0, 77) + '...' : config.headline;
    headlineLines = wrapText(ctx, shortHeadline, maxTextWidth);
    totalHeight += headlineLines.length * headlineFs * 1.45 + headlineFs * 0.5;
  }

  if (config.phone) totalHeight += phoneFs * 2;

  const cardPadding = w * 0.05;
  const cardHeight = totalHeight + cardPadding * 2;
  const cardWidth = maxTextWidth + cardPadding * 2;
  const cardX = (w - cardWidth) / 2;
  const cardY = (h - cardHeight) / 2;

  // Draw card background
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.fillStyle = colorWithAlpha(bandBg, 0.88);
  ctx.fill();

  // Accent border
  ctx.strokeStyle = brandPrimary;
  ctx.lineWidth = 3;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.stroke();

  const textOnCard = isLightColor(bandBg) ? '#1a1a1a' : '#FFFFFF';
  const subTextOnCard = isLightColor(bandBg) ? '#444444' : '#d0d0d0';
  let currentY = cardY + cardPadding;

  // Business name
  if (config.businessName) {
    currentY += businessFs;
    ctx.font = `bold ${businessFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnCard;
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    setShadow(ctx, 3, 0.3);
    ctx.fillText(config.businessName, w / 2, currentY);
    currentY += businessFs * 0.6;
    resetShadow(ctx);
  }

  // Divider line
  if (config.businessName && config.headline) {
    ctx.strokeStyle = colorWithAlpha(brandPrimary, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + cardPadding * 2, currentY);
    ctx.lineTo(cardX + cardWidth - cardPadding * 2, currentY);
    ctx.stroke();
    currentY += headlineFs * 0.5;
  }

  // Headline
  if (config.headline && headlineLines.length > 0) {
    ctx.font = `bold ${headlineFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = brandPrimary;
    ctx.textAlign = 'center';
    setShadow(ctx, 2, 0.3);
    for (const line of headlineLines) {
      currentY += headlineFs;
      ctx.fillText(line, w / 2, currentY);
      currentY += headlineFs * 0.45;
    }
    resetShadow(ctx);
  }

  // Phone
  if (config.phone) {
    currentY += phoneFs * 0.5;
    ctx.font = `600 ${phoneFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = subTextOnCard;
    ctx.textAlign = 'center';
    ctx.fillText(config.phone, w / 2, currentY + phoneFs);
  }

  // Reset alignment for other potential drawing
  ctx.textAlign = 'right';
}

// ═══════ Layout: Minimal ═══════
// Just text with strong shadow, no background elements
function layoutMinimal(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string
) {
  const padding = w * 0.06;
  const maxTextWidth = w * 0.85;

  // Subtle gradient at bottom for readability
  const gradH = h * 0.3;
  const grad = ctx.createLinearGradient(0, h - gradH, 0, h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - gradH, w, gradH);

  let currentY = h - padding;

  // Phone at very bottom
  if (config.phone) {
    const fs = Math.round(w * 0.028);
    ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = '#cccccc';
    setShadow(ctx, 4, 0.7);
    ctx.fillText(config.phone, w - padding, currentY);
    currentY -= fs * 2;
    resetShadow(ctx);
  }

  // Business name
  if (config.businessName) {
    const fs = Math.round(w * 0.048);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    setShadow(ctx, 6, 0.8);
    ctx.fillText(config.businessName, w - padding, currentY);
    currentY -= fs * 1.5;
    resetShadow(ctx);
  }

  // Headline
  if (config.headline) {
    const fs = Math.round(w * 0.036);
    ctx.font = `600 ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 80 ? config.headline.substring(0, 77) + '...' : config.headline;
    const lines = wrapText(ctx, shortHeadline, maxTextWidth);
    
    ctx.fillStyle = brandPrimary;
    setShadow(ctx, 5, 0.7);
    
    // Draw lines bottom-up
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.fillText(lines[i], w - padding, currentY);
      currentY -= fs * 1.4;
    }
    resetShadow(ctx);
  }
}

/**
 * Applies Hebrew text overlay on top of an image using Canvas.
 * Supports multiple layout styles.
 */
export async function applyTextOverlay(
  imageUrl: string,
  config: TextOverlayConfig
): Promise<string> {
  const { headline, businessName, phone, primaryColor, secondaryColor, backgroundColor, layoutStyle } = config;

  if (!headline && !businessName && !phone) return imageUrl;

  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';

  const w = canvas.width;
  const h = canvas.height;

  const brandPrimary = primaryColor || '#2BA5B5';
  const bandBg = backgroundColor || brandPrimary;

  const style = layoutStyle || 'bottom-banner';

  switch (style) {
    case 'center-card':
      layoutCenterCard(ctx, w, h, config, brandPrimary, bandBg);
      break;
    case 'minimal':
      layoutMinimal(ctx, w, h, config, brandPrimary);
      break;
    case 'bottom-banner':
    default:
      layoutBottomBanner(ctx, w, h, config, brandPrimary, bandBg);
      break;
  }

  return canvas.toDataURL('image/png');
}
