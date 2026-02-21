/**
 * Programmatic Hebrew text overlay using Canvas.
 * Professional ad-quality layouts inspired by real Haredi sector advertisements.
 * 
 * Layout structure (based on reference ads):
 * - TOP: Bold headline (above or over the visual)
 * - MIDDLE: Body text / sub-headline explaining the offer
 * - VISUAL: The AI-generated image
 * - BOTTOM: Contact info bar (phone, address, logo, website)
 */

export type TextLayoutStyle = 'classic-ad' | 'top-headline' | 'center-card' | 'minimal' | 'side-strip';

export interface TextOverlayConfig {
  headline?: string;
  bodyText?: string;
  ctaText?: string;
  businessName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  layoutStyle?: TextLayoutStyle;
  logoUrl?: string;
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
  if (lines.length > 4) {
    let truncated = lines[3];
    while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return [lines[0], lines[1], lines[2], truncated + '...'];
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

function lightenColor(hex: string, factor = 0.85): string {
  const c = hex.replace('#', '');
  const r = Math.min(255, Math.round(parseInt(c.substring(0, 2), 16) + (255 - parseInt(c.substring(0, 2), 16)) * factor));
  const g = Math.min(255, Math.round(parseInt(c.substring(2, 4), 16) + (255 - parseInt(c.substring(2, 4), 16)) * factor));
  const b = Math.min(255, Math.round(parseInt(c.substring(4, 6), 16) + (255 - parseInt(c.substring(4, 6), 16)) * factor));
  return `rgb(${r},${g},${b})`;
}

// Build contact info string from available fields
function buildContactLine(config: TextOverlayConfig): string {
  const parts: string[] = [];
  if (config.phone) parts.push(config.phone);
  if (config.whatsapp && config.whatsapp !== config.phone) parts.push(`ווצאפ: ${config.whatsapp}`);
  if (config.email) parts.push(config.email);
  return parts.join('  |  ');
}

// ═══════ Layout: Classic Ad (like the dental clinic reference) ═══════
// Structure: Headline at top → body text → visual → contact bar at bottom
function layoutClassicAd(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.05;
  const maxTextWidth = w * 0.88;

  // === TOP SECTION: Headline band ===
  if (config.headline) {
    const headlineFs = Math.round(w * 0.065);
    ctx.font = `900 ${headlineFs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 60 ? config.headline.substring(0, 57) + '...' : config.headline;
    const headlineLines = wrapText(ctx, shortHeadline, maxTextWidth);
    const lineHeight = headlineFs * 1.3;
    const headlineBandHeight = headlineLines.length * lineHeight + headlineFs * 1.2;

    // Brand-colored headline band at top
    ctx.fillStyle = colorWithAlpha(brandPrimary, 0.95);
    ctx.fillRect(0, 0, w, headlineBandHeight);

    // Accent line at bottom of headline band
    ctx.fillStyle = brandSecondary;
    ctx.fillRect(0, headlineBandHeight - 4, w, 4);

    // Fade from band into image
    const fadeGrad = ctx.createLinearGradient(0, headlineBandHeight, 0, headlineBandHeight + h * 0.04);
    fadeGrad.addColorStop(0, colorWithAlpha(brandPrimary, 0.3));
    fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, headlineBandHeight, w, h * 0.04);

    // Headline text
    const textOnBand = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
    ctx.fillStyle = textOnBand;
    ctx.textAlign = 'right';
    setShadow(ctx, 3, 0.2);
    let textY = headlineFs * 0.8;
    for (const line of headlineLines) {
      textY += lineHeight;
      ctx.fillText(line, w - padding, textY);
    }
    resetShadow(ctx);
  }

  // === MIDDLE SECTION: Body text (if present) ===
  if (config.bodyText) {
    const bodyFs = Math.round(w * 0.032);
    ctx.font = `600 ${bodyFs}px "Heebo", "Arial", sans-serif`;
    const bodyLines = wrapText(ctx, config.bodyText, maxTextWidth);
    const bodyLineHeight = bodyFs * 1.5;
    const bodyTotalH = bodyLines.length * bodyLineHeight + bodyFs;

    // Calculate position - below headline or at ~30% height
    const headlineFs = Math.round(w * 0.065);
    const headlineLines = config.headline ? wrapText(ctx, config.headline.substring(0, 60), maxTextWidth) : [];
    const headlineBandH = config.headline ? headlineLines.length * (headlineFs * 1.3) + headlineFs * 1.2 : 0;
    const bodyStartY = headlineBandH + h * 0.02;

    // Semi-transparent background for body text
    const bodyBgGrad = ctx.createLinearGradient(0, bodyStartY, 0, bodyStartY + bodyTotalH);
    bodyBgGrad.addColorStop(0, colorWithAlpha('#000000', 0.5));
    bodyBgGrad.addColorStop(1, colorWithAlpha('#000000', 0.3));
    ctx.fillStyle = bodyBgGrad;
    ctx.fillRect(0, bodyStartY, w, bodyTotalH);

    // Body text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.font = `600 ${bodyFs}px "Heebo", "Arial", sans-serif`;
    let bodyY = bodyStartY + bodyFs * 0.8;
    for (const line of bodyLines) {
      bodyY += bodyLineHeight;
      ctx.fillText(line, w - padding, bodyY);
    }
  }

  // === CTA pill (if present) ===
  if (config.ctaText) {
    const ctaFs = Math.round(w * 0.028);
    ctx.font = `bold ${ctaFs}px "Heebo", "Arial", sans-serif`;
    const ctaWidth = ctx.measureText(config.ctaText).width + ctaFs * 2;
    const ctaHeight = ctaFs * 2.2;
    // Position CTA above the contact bar
    const ctaY = h * 0.72;
    const ctaX = w / 2 - ctaWidth / 2;

    roundRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
    ctx.fillStyle = brandSecondary;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    roundRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
    ctx.stroke();

    ctx.fillStyle = isLightColor(brandSecondary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText, w / 2, ctaY + ctaHeight * 0.65);
    ctx.textAlign = 'right';
  }

  // === BOTTOM SECTION: Contact info bar ===
  const contactLine = buildContactLine(config);
  const hasContact = contactLine || config.businessName || config.address;
  
  if (hasContact) {
    const barHeight = h * 0.15;
    const barY = h - barHeight;

    // Gradient fade into bar
    const fadeHeight = h * 0.05;
    const fadeGrad = ctx.createLinearGradient(0, barY - fadeHeight, 0, barY);
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fadeGrad.addColorStop(1, colorWithAlpha(brandPrimary, 0.95));
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, barY - fadeHeight, w, fadeHeight);

    // Solid contact bar
    ctx.fillStyle = colorWithAlpha(brandPrimary, 0.95);
    ctx.fillRect(0, barY, w, barHeight);

    // Accent line at top
    ctx.fillStyle = brandSecondary;
    ctx.fillRect(0, barY, w, 3);

    const textOnBar = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
    const subOnBar = isLightColor(brandPrimary) ? '#333' : '#d0d0d0';
    let contentY = barY + barHeight * 0.35;

    // Business name - prominent
    if (config.businessName) {
      const nameFs = Math.round(w * 0.042);
      ctx.font = `900 ${nameFs}px "Heebo", "Arial", sans-serif`;
      ctx.fillStyle = textOnBar;
      ctx.textAlign = 'right';
      ctx.fillText(config.businessName, w - padding, contentY);
      contentY += nameFs * 1.3;
    }

    // Phone (large, prominent)
    if (config.phone) {
      const phoneFs = Math.round(w * 0.038);
      ctx.font = `800 ${phoneFs}px "Heebo", "Arial", sans-serif`;
      ctx.fillStyle = brandSecondary;
      ctx.textAlign = 'right';
      setShadow(ctx, 2, 0.2);
      ctx.fillText(config.phone, w - padding, contentY);
      resetShadow(ctx);
      contentY += phoneFs * 1.2;
    }

    // Address / extra contact
    if (config.address) {
      const addrFs = Math.round(w * 0.022);
      ctx.font = `500 ${addrFs}px "Heebo", "Arial", sans-serif`;
      ctx.fillStyle = subOnBar;
      ctx.textAlign = 'right';
      ctx.fillText(config.address, w - padding, contentY);
    }
  }
}

// ═══════ Layout: Top Headline (headline floats above image) ═══════
function layoutTopHeadline(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.05;
  const maxTextWidth = w * 0.88;

  // === TOP: Headline over gradient ===
  if (config.headline) {
    const headlineFs = Math.round(w * 0.058);
    ctx.font = `900 ${headlineFs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 70 ? config.headline.substring(0, 67) + '...' : config.headline;
    const headlineLines = wrapText(ctx, shortHeadline, maxTextWidth);
    const lineHeight = headlineFs * 1.3;
    const topGradH = headlineLines.length * lineHeight + headlineFs * 2;

    // Top gradient for text readability
    const topGrad = ctx.createLinearGradient(0, 0, 0, topGradH);
    topGrad.addColorStop(0, colorWithAlpha('#000000', 0.7));
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, topGradH);

    // Headline text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    setShadow(ctx, 6, 0.6);
    let textY = headlineFs * 1.2;
    for (const line of headlineLines) {
      ctx.fillText(line, w - padding, textY);
      textY += lineHeight;
    }
    resetShadow(ctx);
  }

  // === MIDDLE: Body text with semi-transparent bg ===
  if (config.bodyText) {
    const bodyFs = Math.round(w * 0.03);
    ctx.font = `600 ${bodyFs}px "Heebo", "Arial", sans-serif`;
    const bodyLines = wrapText(ctx, config.bodyText, maxTextWidth);
    const bodyLineH = bodyFs * 1.5;

    // Position at ~35% from top
    const bodyStartY = h * 0.33;
    const bodyTotalH = bodyLines.length * bodyLineH + bodyFs;

    roundRect(ctx, padding * 0.5, bodyStartY, w - padding, bodyTotalH, 8);
    ctx.fillStyle = colorWithAlpha('#000000', 0.45);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    let bodyY = bodyStartY + bodyFs;
    for (const line of bodyLines) {
      bodyY += bodyLineH;
      ctx.fillText(line, w - padding, bodyY);
    }
  }

  // === CTA ===
  if (config.ctaText) {
    const ctaFs = Math.round(w * 0.026);
    ctx.font = `bold ${ctaFs}px "Heebo", "Arial", sans-serif`;
    const ctaWidth = ctx.measureText(config.ctaText).width + ctaFs * 2;
    const ctaH = ctaFs * 2.2;
    const ctaY = h * 0.68;

    roundRect(ctx, w - padding - ctaWidth, ctaY, ctaWidth, ctaH, ctaH / 2);
    ctx.fillStyle = brandSecondary;
    ctx.fill();

    ctx.fillStyle = isLightColor(brandSecondary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText, w - padding - ctaWidth / 2, ctaY + ctaH * 0.65);
    ctx.textAlign = 'right';
  }

  // === BOTTOM: Contact bar ===
  const hasContact = config.businessName || config.phone || config.address;
  if (hasContact) {
    const barH = h * 0.14;
    const barY = h - barH;

    // Gradient into bar
    const fadeGrad = ctx.createLinearGradient(0, barY - h * 0.04, 0, barY);
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fadeGrad.addColorStop(1, colorWithAlpha(brandPrimary, 0.92));
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, barY - h * 0.04, w, h * 0.04);

    ctx.fillStyle = colorWithAlpha(brandPrimary, 0.92);
    ctx.fillRect(0, barY, w, barH);

    ctx.fillStyle = brandSecondary;
    ctx.fillRect(0, barY, w, 3);

    const textOnBar = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
    let contentY = barY + barH * 0.4;

    if (config.businessName) {
      const fs = Math.round(w * 0.038);
      ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
      ctx.fillStyle = textOnBar;
      ctx.fillText(config.businessName, w - padding, contentY);
      contentY += fs * 1.3;
    }

    if (config.phone) {
      const fs = Math.round(w * 0.032);
      ctx.font = `800 ${fs}px "Heebo", "Arial", sans-serif`;
      ctx.fillStyle = brandSecondary;
      ctx.fillText(config.phone, w - padding, contentY);
      contentY += fs * 1.2;
    }

    if (config.address) {
      const fs = Math.round(w * 0.02);
      ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
      ctx.fillStyle = isLightColor(brandPrimary) ? '#444' : '#ccc';
      ctx.fillText(config.address, w - padding, contentY);
    }
  }
}

// ═══════ Layout: Side Strip ═══════
function layoutSideStrip(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const stripWidth = w * 0.35;
  const stripX = w - stripWidth;
  const padding = w * 0.04;

  // Gradient from image into strip
  const fadeWidth = w * 0.06;
  const fadeGrad = ctx.createLinearGradient(stripX - fadeWidth, 0, stripX, 0);
  fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  fadeGrad.addColorStop(1, colorWithAlpha(brandPrimary, 0.95));
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(stripX - fadeWidth, 0, fadeWidth, h);

  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.95);
  ctx.fillRect(stripX, 0, stripWidth, h);

  ctx.fillStyle = brandSecondary;
  ctx.fillRect(stripX, 0, 4, h);

  const textColor = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
  const subColor = isLightColor(brandPrimary) ? '#444' : '#d0d0d0';
  const textX = stripX + stripWidth - padding;
  const maxTextW = stripWidth - padding * 2;

  let currentY = h * 0.12;

  // Business name
  if (config.businessName) {
    const fs = Math.round(w * 0.045);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.fillText(config.businessName, textX, currentY);
    currentY += fs * 1.5;

    // Decorative line
    ctx.fillStyle = brandSecondary;
    ctx.fillRect(textX - maxTextW, currentY - fs * 0.4, maxTextW, 3);
    currentY += fs * 0.6;
  }

  // Headline
  if (config.headline) {
    const fs = Math.round(w * 0.038);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 50 ? config.headline.substring(0, 47) + '...' : config.headline;
    const lines = wrapText(ctx, shortHeadline, maxTextW);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    for (const line of lines) {
      ctx.fillText(line, textX, currentY);
      currentY += fs * 1.4;
    }
    currentY += fs * 0.3;
  }

  // Body text
  if (config.bodyText) {
    const fs = Math.round(w * 0.024);
    ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
    const lines = wrapText(ctx, config.bodyText, maxTextW);
    ctx.fillStyle = subColor;
    for (const line of lines) {
      ctx.fillText(line, textX, currentY);
      currentY += fs * 1.5;
    }
    currentY += fs * 0.5;
  }

  // CTA
  if (config.ctaText) {
    const fs = Math.round(w * 0.024);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    const ctaW = ctx.measureText(config.ctaText).width + fs * 1.5;
    const ctaH = fs * 2;
    const ctaX = textX - ctaW;

    roundRect(ctx, ctaX, currentY, ctaW, ctaH, ctaH / 2);
    ctx.fillStyle = brandSecondary;
    ctx.fill();

    ctx.fillStyle = isLightColor(brandSecondary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText, ctaX + ctaW / 2, currentY + ctaH * 0.65);
    ctx.textAlign = 'right';
    currentY += ctaH + fs;
  }

  // Contact info at bottom of strip
  const bottomY = h - padding * 2;
  if (config.phone) {
    const fs = Math.round(w * 0.028);
    ctx.font = `800 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = brandSecondary;
    ctx.fillText(config.phone, textX, bottomY);
  }
  if (config.address) {
    const fs = Math.round(w * 0.018);
    ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = subColor;
    ctx.fillText(config.address, textX, bottomY - w * 0.04);
  }
}

// ═══════ Layout: Center Card ═══════
function layoutCenterCard(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const maxTextWidth = w * 0.7;
  const businessFs = Math.round(w * 0.048);
  const headlineFs = Math.round(w * 0.04);
  const bodyFs = Math.round(w * 0.026);
  const phoneFs = Math.round(w * 0.03);

  let totalHeight = 0;
  if (config.businessName) totalHeight += businessFs * 1.6;
  
  ctx.font = `bold ${headlineFs}px "Heebo", "Arial", sans-serif`;
  let headlineLines: string[] = [];
  if (config.headline) {
    const shortHeadline = config.headline.length > 80 ? config.headline.substring(0, 77) + '...' : config.headline;
    headlineLines = wrapText(ctx, shortHeadline, maxTextWidth);
    totalHeight += headlineLines.length * headlineFs * 1.4 + headlineFs * 0.5;
  }

  ctx.font = `500 ${bodyFs}px "Heebo", "Arial", sans-serif`;
  let bodyLines: string[] = [];
  if (config.bodyText) {
    bodyLines = wrapText(ctx, config.bodyText, maxTextWidth);
    totalHeight += bodyLines.length * bodyFs * 1.5 + bodyFs;
  }

  if (config.ctaText) totalHeight += phoneFs * 2.5;
  if (config.phone) totalHeight += phoneFs * 2;

  const cardPadding = w * 0.05;
  const cardHeight = totalHeight + cardPadding * 2;
  const cardWidth = maxTextWidth + cardPadding * 2;
  const cardX = (w - cardWidth) / 2;
  const cardY = (h - cardHeight) / 2;

  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.92);
  ctx.fill();

  ctx.strokeStyle = brandSecondary;
  ctx.lineWidth = 3;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.stroke();

  const textOnCard = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
  const subOnCard = isLightColor(brandPrimary) ? '#444' : '#d0d0d0';
  let currentY = cardY + cardPadding;

  if (config.businessName) {
    currentY += businessFs;
    ctx.font = `900 ${businessFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnCard;
    ctx.textAlign = 'center';
    ctx.fillText(config.businessName, w / 2, currentY);
    currentY += businessFs * 0.5;

    ctx.strokeStyle = colorWithAlpha(brandSecondary, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + cardPadding * 2, currentY);
    ctx.lineTo(cardX + cardWidth - cardPadding * 2, currentY);
    ctx.stroke();
    currentY += headlineFs * 0.4;
  }

  if (config.headline && headlineLines.length > 0) {
    ctx.font = `bold ${headlineFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnCard;
    ctx.textAlign = 'center';
    for (const line of headlineLines) {
      currentY += headlineFs;
      ctx.fillText(line, w / 2, currentY);
      currentY += headlineFs * 0.4;
    }
  }

  if (config.bodyText && bodyLines.length > 0) {
    currentY += bodyFs * 0.3;
    ctx.font = `500 ${bodyFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = subOnCard;
    ctx.textAlign = 'center';
    for (const line of bodyLines) {
      currentY += bodyFs * 1.5;
      ctx.fillText(line, w / 2, currentY);
    }
  }

  if (config.ctaText) {
    currentY += phoneFs;
    const ctaFs = Math.round(w * 0.024);
    ctx.font = `bold ${ctaFs}px "Heebo", "Arial", sans-serif`;
    const ctaW = ctx.measureText(config.ctaText).width + ctaFs * 2;
    const ctaH = ctaFs * 2;
    roundRect(ctx, w / 2 - ctaW / 2, currentY, ctaW, ctaH, ctaH / 2);
    ctx.fillStyle = brandSecondary;
    ctx.fill();
    ctx.fillStyle = isLightColor(brandSecondary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText, w / 2, currentY + ctaH * 0.65);
    currentY += ctaH;
  }

  if (config.phone) {
    currentY += phoneFs * 0.5;
    ctx.font = `700 ${phoneFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = brandSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(config.phone, w / 2, currentY + phoneFs);
  }

  ctx.textAlign = 'right';
}

// ═══════ Layout: Minimal ═══════
function layoutMinimal(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.06;
  const maxTextWidth = w * 0.85;

  // Subtle gradient at bottom
  const gradH = h * 0.4;
  const grad = ctx.createLinearGradient(0, h - gradH, 0, h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.4, 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - gradH, w, gradH);

  let currentY = h - padding;

  // Contact info at very bottom
  if (config.phone) {
    const fs = Math.round(w * 0.028);
    ctx.font = `700 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = brandSecondary;
    ctx.textAlign = 'right';
    setShadow(ctx, 4, 0.6);
    ctx.fillText(config.phone, w - padding, currentY);
    currentY -= fs * 1.8;
    resetShadow(ctx);
  }

  if (config.address) {
    const fs = Math.round(w * 0.02);
    ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'right';
    ctx.fillText(config.address, w - padding, currentY);
    currentY -= fs * 1.8;
  }

  // Business name
  if (config.businessName) {
    const fs = Math.round(w * 0.045);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    setShadow(ctx, 6, 0.8);
    ctx.fillText(config.businessName, w - padding, currentY);
    currentY -= fs * 1.5;
    resetShadow(ctx);
  }

  // Body text
  if (config.bodyText) {
    const fs = Math.round(w * 0.025);
    ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
    const lines = wrapText(ctx, config.bodyText, maxTextWidth);
    ctx.fillStyle = '#ddd';
    ctx.textAlign = 'right';
    setShadow(ctx, 4, 0.6);
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.fillText(lines[i], w - padding, currentY);
      currentY -= fs * 1.5;
    }
    currentY -= fs * 0.3;
    resetShadow(ctx);
  }

  // Headline
  if (config.headline) {
    const fs = Math.round(w * 0.04);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = config.headline.length > 80 ? config.headline.substring(0, 77) + '...' : config.headline;
    const lines = wrapText(ctx, shortHeadline, maxTextWidth);
    
    ctx.fillStyle = brandSecondary;
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
  const { headline, bodyText, ctaText, businessName, phone, primaryColor, secondaryColor, backgroundColor, layoutStyle } = config;

  if (!headline && !businessName && !phone && !bodyText) return imageUrl;

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

  const style = layoutStyle || 'classic-ad';

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
    case 'top-headline':
      layoutTopHeadline(ctx, w, h, config, brandPrimary, brandSecondary);
      break;
    case 'classic-ad':
    default:
      layoutClassicAd(ctx, w, h, config, brandPrimary, brandSecondary);
      break;
  }

  return canvas.toDataURL('image/png');
}
