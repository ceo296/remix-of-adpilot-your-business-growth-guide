/**
 * Programmatic Hebrew text overlay using Canvas.
 * Professional ad-quality layouts — text floats on image with shadows & gradients.
 * 
 * Design principles (from professional Haredi sector references):
 * 1. Image fills entire canvas — never covered by opaque bands
 * 2. Text floats with strong shadows for readability
 * 3. Bottom contact strip is thin and elegant (max 10% height)
 * 4. Composition is centered and grid-aligned
 * 5. Brand colors as accents, not full covers
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
  logoPosition?: string; // e.g. "top-right", "top-left", "bottom-left", "bottom-right", "center-top"
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 4): string[] {
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
  if (lines.length > maxLines) {
    let truncated = lines[maxLines - 1];
    while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return lines.slice(0, maxLines - 1).concat([truncated + '...']);
  }
  return lines;
}

/** Strip markdown, field labels, and clean text for professional display */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    // Remove markdown headers
    .replace(/#{1,6}\s*/g, '')
    // Remove bold/italic markers
    .replace(/\*{1,4}/g, '')
    .replace(/_{1,3}/g, '')
    // Remove markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove backticks
    .replace(/`/g, '')
    // Remove common Hebrew field labels that leak from AI responses
    .replace(/תת[- ]?כותרת:\s*/g, '')
    .replace(/טקסט:\s*/g, '')
    .replace(/כותרת:\s*/g, '')
    .replace(/גוף:\s*/g, '')
    .replace(/תוכן:\s*/g, '')
    .replace(/קופי:\s*/g, '')
    .replace(/body:\s*/gi, '')
    .replace(/subtitle:\s*/gi, '')
    .replace(/headline:\s*/gi, '')
    .replace(/cta:\s*/gi, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanHeadline(text: string): string {
  const cleaned = cleanText(text);
  if (cleaned.length > 40) return cleaned.substring(0, 37).trim() + '...';
  return cleaned;
}

function cleanBodyText(text: string): string {
  const cleaned = cleanText(text);
  if (cleaned.length > 100) return cleaned.substring(0, 97).trim() + '...';
  return cleaned;
}

function colorWithAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, `${alpha})`);
  if (color.startsWith('rgb(')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) return `rgba(${match[1]},${match[2]},${match[3]},${alpha})`;
  }
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

/** Draw logo positioned based on client's past ad analysis or default bottom-left */
async function drawLogo(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  logoUrl: string | undefined, barHeight: number, position?: string
) {
  if (!logoUrl) return;
  try {
    const logo = await loadImage(logoUrl);
    const maxLogoH = Math.max(barHeight * 1.8, h * 0.12);
    const maxLogoW = w * 0.18;
    const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height);
    const logoW = logo.width * scale;
    const logoH = logo.height * scale;
    const margin = w * 0.03;

    // Position logo based on client's past ad style
    let logoX = margin;
    let logoY = h - barHeight - logoH - h * 0.01;
    const pos = (position || 'bottom-left').toLowerCase();

    if (pos.includes('top') && pos.includes('right')) {
      logoX = w - logoW - margin;
      logoY = margin;
    } else if (pos.includes('top') && pos.includes('left')) {
      logoX = margin;
      logoY = margin;
    } else if (pos.includes('top')) {
      logoX = (w - logoW) / 2;
      logoY = margin;
    } else if (pos.includes('bottom') && pos.includes('right')) {
      logoX = w - logoW - margin;
      logoY = h - barHeight - logoH - h * 0.01;
    } else if (pos.includes('center')) {
      logoX = (w - logoW) / 2;
      logoY = (h - logoH) / 2;
    }
    // default: bottom-left (already set)

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    ctx.restore();
  } catch (e) {
    console.warn('Failed to draw logo:', e);
  }
}

function setShadow(ctx: CanvasRenderingContext2D, blur: number, alpha = 0.7) {
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
}

function darkenColor(hex: string, factor = 0.3): string {
  const c = hex.replace('#', '');
  const r = Math.round(parseInt(c.substring(0, 2), 16) * (1 - factor));
  const g = Math.round(parseInt(c.substring(2, 4), 16) * (1 - factor));
  const b = Math.round(parseInt(c.substring(4, 6), 16) * (1 - factor));
  return `rgb(${r},${g},${b})`;
}

/** Draw text with outline for readability on any background */
function drawTextWithOutline(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  fillColor: string, outlineWidth = 3
) {
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = outlineWidth;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

// ═══════ Layout: Classic Ad ═══════
// Headline floats at top with gradient, body centered, thin contact strip at bottom
async function layoutClassicAd(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.06;
  const maxTextWidth = w * 0.86;
  const centerX = w / 2;

  // === TOP: Subtle gradient for headline readability ===
  let headlineEndY = 0;
  if (config.headline) {
    const headlineFs = Math.round(w * 0.06);
    ctx.font = `900 ${headlineFs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = cleanHeadline(config.headline);
    const headlineLines = wrapText(ctx, shortHeadline, maxTextWidth, 2);
    const lineHeight = headlineFs * 1.3;
    const gradientH = headlineLines.length * lineHeight + headlineFs * 2.5;
    headlineEndY = gradientH;

    // Soft transparent gradient — NOT an opaque band
    const topGrad = ctx.createLinearGradient(0, 0, 0, gradientH);
    topGrad.addColorStop(0, colorWithAlpha('#000000', 0.55));
    topGrad.addColorStop(0.7, colorWithAlpha('#000000', 0.2));
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, gradientH);

    // Headline text — centered, with strong shadow
    ctx.textAlign = 'center';
    setShadow(ctx, 8, 0.8);
    let textY = headlineFs * 1.4;
    for (const line of headlineLines) {
      drawTextWithOutline(ctx, line, centerX, textY, '#FFFFFF', 4);
      textY += lineHeight;
    }
    resetShadow(ctx);
  }

  // === MIDDLE: Body text — short, clean, below headline zone ===
  if (config.bodyText) {
    const cleaned = cleanBodyText(config.bodyText);
    if (cleaned) {
      const bodyFs = Math.round(w * 0.026);
      ctx.font = `600 ${bodyFs}px "Heebo", "Arial", sans-serif`;
      const bodyLines = wrapText(ctx, cleaned, maxTextWidth * 0.8, 2);
      const bodyLineHeight = bodyFs * 1.5;

      // Position body text in the lower-middle zone (not overlapping headline or visual center)
      const bodyStartY = Math.max(headlineEndY + h * 0.02, h * 0.55);

      // Subtle readability gradient behind body text
      const bodyGradH = bodyLines.length * bodyLineHeight + bodyFs * 2;
      const bodyGrad = ctx.createLinearGradient(0, bodyStartY - bodyFs, 0, bodyStartY + bodyGradH);
      bodyGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bodyGrad.addColorStop(0.3, colorWithAlpha('#000000', 0.3));
      bodyGrad.addColorStop(0.7, colorWithAlpha('#000000', 0.3));
      bodyGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(0, bodyStartY - bodyFs, w, bodyGradH);

      ctx.textAlign = 'center';
      setShadow(ctx, 6, 0.8);
      let bodyY = bodyStartY + bodyFs * 0.6;
      for (const line of bodyLines) {
        bodyY += bodyLineHeight;
        drawTextWithOutline(ctx, line, centerX, bodyY, '#FFFFFF', 3);
      }
      resetShadow(ctx);
    }
  }

  // === CTA pill — positioned above contact strip ===
  if (config.ctaText) {
    const ctaFs = Math.round(w * 0.028);
    ctx.font = `bold ${ctaFs}px "Heebo", "Arial", sans-serif`;
    const ctaWidth = ctx.measureText(config.ctaText).width + ctaFs * 3;
    const ctaHeight = ctaFs * 2.4;
    const barH = Math.min(h * 0.1, 80);
    const ctaY = h - barH - ctaHeight - h * 0.03; // Above contact strip

    const ctaX = centerX - ctaWidth / 2;

    setShadow(ctx, 6, 0.4);
    roundRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
    ctx.fillStyle = brandSecondary;
    ctx.fill();
    resetShadow(ctx);

    ctx.strokeStyle = colorWithAlpha('#FFFFFF', 0.4);
    ctx.lineWidth = 1.5;
    roundRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
    ctx.stroke();

    ctx.fillStyle = isLightColor(brandSecondary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText, centerX, ctaY + ctaHeight * 0.65);
  }

  // === BOTTOM: Thin elegant contact strip + logo bottom-left ===
  drawContactStrip(ctx, w, h, config, brandPrimary, brandSecondary);
  const barH = Math.min(h * 0.1, 80);
  await drawLogo(ctx, w, h, config.logoUrl, barH, config.logoPosition);
}

// ═══════ Layout: Top Headline ═══════
async function layoutTopHeadline(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.06;
  const maxTextWidth = w * 0.86;
  const centerX = w / 2;

  // === Headline at top with soft gradient ===
  if (config.headline) {
    const headlineFs = Math.round(w * 0.055);
    ctx.font = `900 ${headlineFs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = cleanHeadline(config.headline);
    const headlineLines = wrapText(ctx, shortHeadline, maxTextWidth, 2);
    const lineHeight = headlineFs * 1.3;
    const gradH = headlineLines.length * lineHeight + headlineFs * 2;

    const topGrad = ctx.createLinearGradient(0, 0, 0, gradH);
    topGrad.addColorStop(0, colorWithAlpha('#000000', 0.6));
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, gradH);

    ctx.textAlign = 'center';
    setShadow(ctx, 8, 0.8);
    let textY = headlineFs * 1.3;
    for (const line of headlineLines) {
      drawTextWithOutline(ctx, line, centerX, textY, '#FFFFFF', 3);
      textY += lineHeight;
    }
    resetShadow(ctx);
  }

  // === Body text — clean, short, positioned in lower zone ===
  if (config.bodyText) {
    const cleaned = cleanBodyText(config.bodyText);
    if (cleaned) {
      const bodyFs = Math.round(w * 0.024);
      ctx.font = `600 ${bodyFs}px "Heebo", "Arial", sans-serif`;
      const bodyLines = wrapText(ctx, cleaned, maxTextWidth * 0.8, 2);
      const bodyLineH = bodyFs * 1.5;
      const bodyStartY = h * 0.55;

      ctx.textAlign = 'center';
      setShadow(ctx, 6, 0.8);
      let bodyY = bodyStartY + bodyFs * 0.5;
      for (const line of bodyLines) {
        bodyY += bodyLineH;
        drawTextWithOutline(ctx, line, centerX, bodyY, '#FFFFFF', 3);
      }
      resetShadow(ctx);
    }
  }

  // CTA — above contact strip
  if (config.ctaText) {
    const ctaFs = Math.round(w * 0.026);
    ctx.font = `bold ${ctaFs}px "Heebo", "Arial", sans-serif`;
    const ctaWidth = ctx.measureText(config.ctaText).width + ctaFs * 3;
    const ctaH = ctaFs * 2.4;
    const barH = Math.min(h * 0.1, 80);
    const ctaY = h - barH - ctaH - h * 0.03;

    setShadow(ctx, 5, 0.4);
    roundRect(ctx, centerX - ctaWidth / 2, ctaY, ctaWidth, ctaH, ctaH / 2);
    ctx.fillStyle = brandSecondary;
    ctx.fill();
    resetShadow(ctx);

    ctx.fillStyle = isLightColor(brandSecondary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText, centerX, ctaY + ctaH * 0.65);
  }

  drawContactStrip(ctx, w, h, config, brandPrimary, brandSecondary);
  const barH = Math.min(h * 0.1, 80);
  await drawLogo(ctx, w, h, config.logoUrl, barH, config.logoPosition);
}

// ═══════ Layout: Side Strip ═══════
async function layoutSideStrip(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const stripWidth = w * 0.32;
  const stripX = w - stripWidth;
  const padding = w * 0.04;

  // Gradient fade from image into strip
  const fadeWidth = w * 0.08;
  const fadeGrad = ctx.createLinearGradient(stripX - fadeWidth, 0, stripX, 0);
  fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  fadeGrad.addColorStop(1, colorWithAlpha(brandPrimary, 0.88));
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(stripX - fadeWidth, 0, fadeWidth, h);

  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.88);
  ctx.fillRect(stripX, 0, stripWidth, h);

  // Accent line
  ctx.fillStyle = brandSecondary;
  ctx.fillRect(stripX, 0, 3, h);

  const textColor = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
  const subColor = isLightColor(brandPrimary) ? '#444' : '#d0d0d0';
  const textCenterX = stripX + stripWidth / 2;
  const maxTextW = stripWidth - padding * 2;

  let currentY = h * 0.1;

  // Business name — centered in strip
  if (config.businessName) {
    const fs = Math.round(w * 0.04);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(config.businessName, textCenterX, currentY + fs);
    currentY += fs * 1.8;

    // Decorative line
    ctx.fillStyle = brandSecondary;
    ctx.fillRect(textCenterX - maxTextW * 0.4, currentY - fs * 0.3, maxTextW * 0.8, 3);
    currentY += fs * 0.6;
  }

  // Headline — centered in strip
  if (config.headline) {
    const fs = Math.round(w * 0.035);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = cleanHeadline(config.headline);
    const lines = wrapText(ctx, shortHeadline, maxTextW);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    for (const line of lines) {
      ctx.fillText(line, textCenterX, currentY + fs);
      currentY += fs * 1.4;
    }
    currentY += fs * 0.3;
  }

  // Body text — cleaned
  if (config.bodyText) {
    const cleaned = cleanBodyText(config.bodyText);
    if (cleaned) {
      const fs = Math.round(w * 0.022);
      ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
      const lines = wrapText(ctx, cleaned, maxTextW, 3);
      ctx.fillStyle = subColor;
      ctx.textAlign = 'center';
      for (const line of lines) {
        ctx.fillText(line, textCenterX, currentY + fs);
        currentY += fs * 1.5;
      }
      currentY += fs * 0.5;
    }
  }

  // CTA
  if (config.ctaText) {
    const fs = Math.round(w * 0.022);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    const ctaW = ctx.measureText(config.ctaText).width + fs * 2;
    const ctaH = fs * 2.2;

    roundRect(ctx, textCenterX - ctaW / 2, currentY, ctaW, ctaH, ctaH / 2);
    ctx.fillStyle = brandSecondary;
    ctx.fill();

    ctx.fillStyle = isLightColor(brandSecondary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText, textCenterX, currentY + ctaH * 0.65);
    currentY += ctaH + fs;
  }

  // Contact info at bottom of strip
  const bottomY = h - padding * 3;
  ctx.textAlign = 'center';
  if (config.phone) {
    const fs = Math.round(w * 0.026);
    ctx.font = `800 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = brandSecondary;
    ctx.fillText(config.phone, textCenterX, bottomY);
  }
  if (config.address) {
    const fs = Math.round(w * 0.016);
    ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = subColor;
    ctx.fillText(config.address, textCenterX, bottomY - w * 0.04);
  }
  await drawLogo(ctx, w, h, config.logoUrl, 0, config.logoPosition);
}

// ═══════ Layout: Center Card ═══════
async function layoutCenterCard(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const maxTextWidth = w * 0.65;
  const businessFs = Math.round(w * 0.045);
  const headlineFs = Math.round(w * 0.038);
  const bodyFs = Math.round(w * 0.024);
  const phoneFs = Math.round(w * 0.028);

  let totalHeight = 0;
  if (config.businessName) totalHeight += businessFs * 1.6;

  ctx.font = `bold ${headlineFs}px "Heebo", "Arial", sans-serif`;
  let headlineLines: string[] = [];
  if (config.headline) {
    const shortHeadline = cleanHeadline(config.headline);
    headlineLines = wrapText(ctx, shortHeadline, maxTextWidth);
    totalHeight += headlineLines.length * headlineFs * 1.4 + headlineFs * 0.5;
  }

  ctx.font = `500 ${bodyFs}px "Heebo", "Arial", sans-serif`;
  let bodyLines: string[] = [];
  if (config.bodyText) {
    const cleaned = cleanBodyText(config.bodyText);
    if (cleaned) {
      bodyLines = wrapText(ctx, cleaned, maxTextWidth, 2);
      totalHeight += bodyLines.length * bodyFs * 1.5 + bodyFs;
    }
  }

  if (config.ctaText) totalHeight += phoneFs * 2.5;
  if (config.phone) totalHeight += phoneFs * 2;

  const cardPadding = w * 0.05;
  const cardHeight = totalHeight + cardPadding * 2;
  const cardWidth = maxTextWidth + cardPadding * 2;
  const cardX = (w - cardWidth) / 2;
  const cardY = (h - cardHeight) / 2;

  // Frosted glass card — semi-transparent with blur feel
  setShadow(ctx, 20, 0.4);
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.82);
  ctx.fill();
  resetShadow(ctx);

  // Thin accent border
  ctx.strokeStyle = colorWithAlpha(brandSecondary, 0.6);
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 16);
  ctx.stroke();

  const textOnCard = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';
  const subOnCard = isLightColor(brandPrimary) ? '#333' : '#d0d0d0';
  const centerX = w / 2;
  let currentY = cardY + cardPadding;

  if (config.businessName) {
    currentY += businessFs;
    ctx.font = `900 ${businessFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnCard;
    ctx.textAlign = 'center';
    ctx.fillText(config.businessName, centerX, currentY);
    currentY += businessFs * 0.5;

    // Decorative divider
    ctx.strokeStyle = colorWithAlpha(brandSecondary, 0.5);
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
      ctx.fillText(line, centerX, currentY);
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
      ctx.fillText(line, centerX, currentY);
    }
  }

  if (config.ctaText) {
    currentY += phoneFs;
    const ctaFs = Math.round(w * 0.022);
    ctx.font = `bold ${ctaFs}px "Heebo", "Arial", sans-serif`;
    const ctaW = ctx.measureText(config.ctaText).width + ctaFs * 2;
    const ctaH = ctaFs * 2;
    roundRect(ctx, centerX - ctaW / 2, currentY, ctaW, ctaH, ctaH / 2);
    ctx.fillStyle = brandSecondary;
    ctx.fill();
    ctx.fillStyle = isLightColor(brandSecondary) ? '#1a1a1a' : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText, centerX, currentY + ctaH * 0.65);
    currentY += ctaH;
  }

  if (config.phone) {
    currentY += phoneFs * 0.5;
    ctx.font = `700 ${phoneFs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = brandSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(config.phone, centerX, currentY + phoneFs);
  }
  await drawLogo(ctx, w, h, config.logoUrl, 0, config.logoPosition);
}

// ═══════ Layout: Minimal ═══════
async function layoutMinimal(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const padding = w * 0.06;
  const maxTextWidth = w * 0.85;
  const centerX = w / 2;

  // Subtle gradient at bottom only
  const gradH = h * 0.45;
  const grad = ctx.createLinearGradient(0, h - gradH, 0, h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - gradH, w, gradH);

  let currentY = h - padding;

  // Phone at bottom
  if (config.phone) {
    const fs = Math.round(w * 0.028);
    ctx.font = `700 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = brandSecondary;
    ctx.textAlign = 'center';
    setShadow(ctx, 5, 0.7);
    ctx.fillText(config.phone, centerX, currentY);
    currentY -= fs * 1.8;
    resetShadow(ctx);
  }

  if (config.address) {
    const fs = Math.round(w * 0.02);
    ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = '#bbb';
    ctx.textAlign = 'center';
    ctx.fillText(config.address, centerX, currentY);
    currentY -= fs * 1.8;
  }

  // Business name
  if (config.businessName) {
    const fs = Math.round(w * 0.04);
    ctx.font = `900 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.textAlign = 'center';
    setShadow(ctx, 6, 0.8);
    drawTextWithOutline(ctx, config.businessName, centerX, currentY, '#FFFFFF', 3);
    currentY -= fs * 1.5;
    resetShadow(ctx);
  }

  // Body text — cleaned
  if (config.bodyText) {
    const cleaned = cleanBodyText(config.bodyText);
    if (cleaned) {
      const fs = Math.round(w * 0.024);
      ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
      const lines = wrapText(ctx, cleaned, maxTextWidth, 2);
      ctx.textAlign = 'center';
      setShadow(ctx, 4, 0.6);
      for (let i = lines.length - 1; i >= 0; i--) {
        ctx.fillStyle = '#eee';
        ctx.fillText(lines[i], centerX, currentY);
        currentY -= fs * 1.5;
      }
      currentY -= fs * 0.3;
      resetShadow(ctx);
    }
  }

  // Headline
  if (config.headline) {
    const fs = Math.round(w * 0.04);
    ctx.font = `bold ${fs}px "Heebo", "Arial", sans-serif`;
    const shortHeadline = cleanHeadline(config.headline);
    const lines = wrapText(ctx, shortHeadline, maxTextWidth);

    ctx.textAlign = 'center';
    setShadow(ctx, 6, 0.8);
    for (let i = lines.length - 1; i >= 0; i--) {
      drawTextWithOutline(ctx, lines[i], centerX, currentY, brandSecondary, 3);
      currentY -= fs * 1.4;
    }
    resetShadow(ctx);
  }
  await drawLogo(ctx, w, h, config.logoUrl, 0, config.logoPosition);
}

// ═══════ Shared: Thin Contact Strip at Bottom ═══════
function drawContactStrip(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  config: TextOverlayConfig, brandPrimary: string, brandSecondary: string
) {
  const hasContact = config.businessName || config.phone || config.address;
  if (!hasContact) return;

  const centerX = w / 2;
  // Thin strip — max 10% of image height
  const barHeight = Math.min(h * 0.1, 80);
  const barY = h - barHeight;

  // Soft gradient fade into strip
  const fadeH = h * 0.04;
  const fadeGrad = ctx.createLinearGradient(0, barY - fadeH, 0, barY);
  fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  fadeGrad.addColorStop(1, colorWithAlpha(brandPrimary, 0.9));
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, barY - fadeH, w, fadeH);

  // Solid thin bar
  ctx.fillStyle = colorWithAlpha(brandPrimary, 0.9);
  ctx.fillRect(0, barY, w, barHeight);

  // Thin accent line at top of bar
  ctx.fillStyle = brandSecondary;
  ctx.fillRect(0, barY, w, 2);

  const textOnBar = isLightColor(brandPrimary) ? '#1a1a1a' : '#FFFFFF';

  // Grid layout: business name left(RTL: right), phone center, address right(RTL: left)
  const barMidY = barY + barHeight * 0.6;

  // Business name — right side (RTL primary)
  if (config.businessName) {
    const fs = Math.round(Math.min(w * 0.032, barHeight * 0.5));
    ctx.font = `800 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = textOnBar;
    ctx.textAlign = 'right';
    ctx.fillText(config.businessName, w - w * 0.04, barMidY);
  }

  // Phone — center, prominent
  if (config.phone) {
    const fs = Math.round(Math.min(w * 0.03, barHeight * 0.45));
    ctx.font = `800 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = brandSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(config.phone, centerX, barMidY);
  }

  // Address — left side (RTL secondary)
  if (config.address) {
    const fs = Math.round(Math.min(w * 0.018, barHeight * 0.35));
    ctx.font = `500 ${fs}px "Heebo", "Arial", sans-serif`;
    ctx.fillStyle = isLightColor(brandPrimary) ? '#444' : '#ccc';
    ctx.textAlign = 'left';
    ctx.fillText(config.address, w * 0.04, barMidY);
  }
}

/**
 * Applies Hebrew text overlay on top of an image using Canvas.
 * Text floats on the image with shadows and gradients — never covers it with opaque bands.
 */
export async function applyTextOverlay(
  imageUrl: string,
  config: TextOverlayConfig
): Promise<string> {
  // Clean all text inputs at entry point to remove markdown/labels
  const cleanedConfig: TextOverlayConfig = {
    ...config,
    headline: config.headline ? cleanText(config.headline) : undefined,
    bodyText: config.bodyText ? cleanText(config.bodyText) : undefined,
    ctaText: config.ctaText ? cleanText(config.ctaText) : undefined,
    businessName: config.businessName ? cleanText(config.businessName) : undefined,
  };
  const { headline, bodyText, ctaText, businessName, phone, primaryColor, secondaryColor, layoutStyle } = cleanedConfig;

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
      await layoutCenterCard(ctx, w, h, cleanedConfig, brandPrimary, brandSecondary);
      break;
    case 'minimal':
      await layoutMinimal(ctx, w, h, cleanedConfig, brandPrimary, brandSecondary);
      break;
    case 'side-strip':
      await layoutSideStrip(ctx, w, h, cleanedConfig, brandPrimary, brandSecondary);
      break;
    case 'top-headline':
      await layoutTopHeadline(ctx, w, h, cleanedConfig, brandPrimary, brandSecondary);
      break;
    case 'classic-ad':
    default:
      await layoutClassicAd(ctx, w, h, cleanedConfig, brandPrimary, brandSecondary);
      break;
  }

  return canvas.toDataURL('image/png');
}
