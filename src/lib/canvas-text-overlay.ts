/**
 * Programmatic Hebrew text overlay using Canvas.
 * Professional ad-quality layouts inspired by real Haredi sector advertisements.
 */

export type TextLayoutStyle = 'bottom-banner' | 'center-card' | 'minimal' | 'side-strip' | 'top-bar';

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

function darkenColor(hex: string, factor = 0.3): string {
  const c = hex.replace('#', '');
  const r = Math.round(parseInt(c.substring(0, 2), 16) * (1 - factor));
  const g = Math.round(parseInt(c.substring(2, 4), 16) * (1 - factor));
  const b = Math.round(parseInt(c.substring(4, 6), 16) * (1 - factor));
  return `rgb(${r},${g},${b})`;
}

// ═══════ Layout: Bottom Banner ═══════
// Professional brand-colored band at bottom with gradient fade into image
function layoutBottomBanner(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.05;
  const maxTextWidth = w * 0.88;
  const bandHeight = h * 0.25;
  const bandY = h - bandHeight;

  // Gradient fade from image into brand color band
  const fadeHeight = h * 0.08;
  const fadeGrad = ctx.createLinearGradient(0, bandY - fadeHeight, 0, bandY);
  fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  fadeGrad.addColorStop(1, colorWithAlpha(brandPrimary, 0.95));
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, bandY - fadeHeight, w, fadeHeight);

  // Solid brand-colored band
  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.95);
  ctx.fillRect(0, bandY, w, bandHeight);

  // Accent line at top of band using secondary color
  ctx.fillStyle = brandSecondary;
  ctx.fillRect(0, bandY, w, 4);

  const textOnBand = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
  const subTextOnBand = isLightColor(brandPrimary) ? '#333333' : '#e0e0e0';
  let bandContentY = bandY + bandHeight * 0.35;

  // Business name - larger, bolder
  if (config.businessName) {
    const fs = Math.round(w * 0.058);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnBand;
    ctx.textAlign = 'right';
    setShadow(ctx, 3, 0.2);
    ctx.fillText(config.businessName, w - padding, bandContentY);
    bandContentY += fs * 1.4;
    resetShadow(ctx);
  }

  // Phone
  if (config.phone) {
    const fs = Math.round(w * 0.036);
    ctx.font = `700 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = subTextOnBand;
    ctx.textAlign = 'right';
    ctx.fillText(config.phone, w - padding, bandContentY);
  }

  // Headline above the band in a branded pill
  if (config.headline) {
    const fs = Math.round(w * 0.042);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 80 ? config.headline.substring(0, 77) + '...' : config.headline;
    const lines = wrapText(ctx, shortHeadline, maxTextWidth * 0.85);
    const lineHeight = fs * 1.45;
    const totalH = lines.length * lineHeight;
    const blockPad = fs * 0.5;
    const blockBottom = bandY - fadeHeight - fs * 0.3;
    const blockTop = blockBottom - totalH - blockPad * 2;

    let maxLW = 0;
    for (const line of lines) { const lw = ctx.measureText(line).width; if (lw > maxLW) maxLW = lw; }

    // Pill background using secondary/dark brand color
    roundRect(ctx, w - padding - maxLW - blockPad * 2.5, blockTop, maxLW + blockPad * 3, totalH + blockPad * 2, 12);
    ctx.fillStyle = colorWithAlpha(brandSecondary, 0.85);
    ctx.fill();

    // Text in contrasting color
    const textOnPill = isLightColor(brandSecondary) ? darkenColor(brandPrimary) : '#FFFFFF';
    ctx.fillStyle = textOnPill;
    ctx.textAlign = 'right';
    setShadow(ctx, 2, 0.2);
    let textY = blockTop + blockPad + fs;
    for (const line of lines) {
      ctx.fillText(line, w - padding - blockPad, textY);
      textY += lineHeight;
    }
    resetShadow(ctx);
  }
}

// ═══════ Layout: Side Strip ═══════
// Vertical brand-colored strip on the right side (RTL native)
function layoutSideStrip(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const stripWidth = w * 0.32;
  const stripX = w - stripWidth;
  const padding = w * 0.04;

  // Gradient from image into strip
  const fadeWidth = w * 0.06;
  const fadeGrad = ctx.createLinearGradient(stripX - fadeWidth, 0, stripX, 0);
  fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  fadeGrad.addColorStop(1, colorWithAlpha(brandPrimary, 0.95));
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(stripX - fadeWidth, 0, fadeWidth, h);

  // Solid brand strip
  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.95);
  ctx.fillRect(stripX, 0, stripWidth, h);

  // Accent line on left edge
  ctx.fillStyle = brandSecondary;
  ctx.fillRect(stripX, 0, 4, h);

  const textColor = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
  const subColor = isLightColor(brandPrimary) ? '#444' : '#d0d0d0';
  const textX = stripX + stripWidth - padding;
  const maxTextW = stripWidth - padding * 2;

  let currentY = h * 0.2;

  // Business name
  if (config.businessName) {
    const fs = Math.round(w * 0.05);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.fillText(config.businessName, textX, currentY);
    currentY += fs * 1.8;

    // Decorative line
    ctx.fillStyle = brandSecondary;
    ctx.fillRect(textX - maxTextW, currentY - fs * 0.6, maxTextW, 3);
    currentY += fs * 0.5;
  }

  // Headline
  if (config.headline) {
    const fs = Math.round(w * 0.032);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 80 ? config.headline.substring(0, 77) + '...' : config.headline;
    const lines = wrapText(ctx, shortHeadline, maxTextW);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    for (const line of lines) {
      ctx.fillText(line, textX, currentY);
      currentY += fs * 1.5;
    }
  }

  // Phone at bottom of strip
  if (config.phone) {
    const fs = Math.round(w * 0.03);
    ctx.font = `700 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = subColor;
    ctx.textAlign = 'right';
    ctx.fillText(config.phone, textX, h - padding * 2);
  }
}

// ═══════ Layout: Top Bar ═══════
// Brand-colored bar at top with headline, business info at bottom
function layoutTopBar(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.05;
  const barHeight = h * 0.18;

  // Top bar with brand color
  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.95);
  ctx.fillRect(0, 0, w, barHeight);

  // Bottom accent line
  ctx.fillStyle = brandSecondary;
  ctx.fillRect(0, barHeight - 4, w, 4);

  // Gradient fade at bottom
  const fadeGrad = ctx.createLinearGradient(0, barHeight, 0, barHeight + h * 0.05);
  fadeGrad.addColorStop(0, colorWithAlpha(brandPrimary, 0.3));
  fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, barHeight, w, h * 0.05);

  const textOnBar = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';

  // Business name in top bar
  if (config.businessName) {
    const fs = Math.round(w * 0.055);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnBar;
    ctx.textAlign = 'right';
    ctx.fillText(config.businessName, w - padding, barHeight * 0.55);
  }

  // Headline in top bar below business name
  if (config.headline) {
    const fs = Math.round(w * 0.032);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = colorWithAlpha(textOnBar, 0.85);
    ctx.textAlign = 'right';
    const shortHeadline = config.headline.length > 60 ? config.headline.substring(0, 57) + '...' : config.headline;
    ctx.fillText(shortHeadline, w - padding, barHeight * 0.82);
  }

  // Phone at bottom right with subtle background
  if (config.phone) {
    const fs = Math.round(w * 0.034);
    ctx.font = `700 ${fs}px "Heebo", "Arial", sans-serif`;
    const phoneWidth = ctx.measureText(config.phone).width;
    const phoneY = h - padding;

    // Small brand-colored pill for phone
    roundRect(ctx, w - padding - phoneWidth - 20, phoneY - fs - 8, phoneWidth + 30, fs + 16, 8);
    ctx.fillStyle = colorWithAlpha(brandPrimary, 0.9);
    ctx.fill();

    ctx.fillStyle = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(config.phone, w - padding - 5, phoneY - 4);
  }
}

// ═══════ Layout: Center Card ═══════
// Centered card with brand colors
function layoutCenterCard(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const maxTextWidth = w * 0.7;

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

  // Card with brand primary color
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.92);
  ctx.fill();

  // Accent border with secondary
  ctx.strokeStyle = brandSecondary;
  ctx.lineWidth = 3;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.stroke();

  const textOnCard = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
  const subTextOnCard = isLightColor(brandPrimary) ? '#444444' : '#d0d0d0';
  let currentY = cardY + cardPadding;

  if (config.businessName) {
    currentY += businessFs;
    ctx.font = `900 ${businessFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnCard;
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillText(config.businessName, w / 2, currentY);
    currentY += businessFs * 0.6;
  }

  if (config.businessName && config.headline) {
    ctx.strokeStyle = colorWithAlpha(brandSecondary, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + cardPadding * 2, currentY);
    ctx.lineTo(cardX + cardWidth - cardPadding * 2, currentY);
    ctx.stroke();
    currentY += headlineFs * 0.5;
  }

  if (config.headline && headlineLines.length > 0) {
    ctx.font = `bold ${headlineFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnCard;
    ctx.textAlign = 'center';
    for (const line of headlineLines) {
      currentY += headlineFs;
      ctx.fillText(line, w / 2, currentY);
      currentY += headlineFs * 0.45;
    }
  }

  if (config.phone) {
    currentY += phoneFs * 0.5;
    ctx.font = `700 ${phoneFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = subTextOnCard;
    ctx.textAlign = 'center';
    ctx.fillText(config.phone, w / 2, currentY + phoneFs);
  }

  ctx.textAlign = 'right';
}

// ═══════ Layout: Minimal ═══════
// Text with brand-colored accents, subtle gradient
function layoutMinimal(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.06;
  const maxTextWidth = w * 0.85;

  // Subtle gradient at bottom
  const gradH = h * 0.35;
  const grad = ctx.createLinearGradient(0, h - gradH, 0, h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - gradH, w, gradH);

  let currentY = h - padding;

  if (config.phone) {
    const fs = Math.round(w * 0.028);
    ctx.font = `600 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = '#cccccc';
    ctx.textAlign = 'right';
    setShadow(ctx, 4, 0.7);
    ctx.fillText(config.phone, w - padding, currentY);
    currentY -= fs * 2;
    resetShadow(ctx);
  }

  if (config.businessName) {
    const fs = Math.round(w * 0.048);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    setShadow(ctx, 6, 0.8);
    ctx.fillText(config.businessName, w - padding, currentY);
    currentY -= fs * 1.5;
    resetShadow(ctx);
  }

  if (config.headline) {
    const fs = Math.round(w * 0.036);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 80 ? config.headline.substring(0, 77) + '...' : config.headline;
    const lines = wrapText(ctx, shortHeadline, maxTextWidth);
    
    ctx.fillStyle = brandPrimary;
    ctx.textAlign = 'right';
    setShadow(ctx, 5, 0.7);
    
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.fillText(lines[i], w - padding, currentY);
      currentY -= fs * 1.4;
    }
    resetShadow(ctx);
  }
}

/**
 * Applies Hebrew text overlay on top of an image using Canvas.
 * Supports multiple professional layout styles with brand colors.
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
  const brandSecondary = secondaryColor || darkenColor(brandPrimary, 0.3);

  const style = layoutStyle || 'bottom-banner';

  switch (style) {
    case 'center-card':
      layoutCenterCard(ctx, w, h, config, brandPrimary, brandSecondary);
      break;
    case 'minimal':
      layoutMinimal(ctx, w, h, config, brandPrimary, brandSecondary);
      break;
    case 'side-strip':
      layoutSideStrip(ctx, w, h, config, brandPrimary, brandSecondary);
      break;
    case 'top-bar':
      layoutTopBar(ctx, w, h, config, brandPrimary, brandSecondary);
      break;
    case 'bottom-banner':
    default:
      layoutBottomBanner(ctx, w, h, config, brandPrimary, brandSecondary);
      break;
  }

  return canvas.toDataURL('image/png');
}
