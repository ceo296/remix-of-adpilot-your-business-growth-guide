/**
 * HTML/CSS-based text overlay system for professional Hebrew ad layouts.
 * V2 - Professional newspaper-quality layouts with minimal image coverage.
 * Renders a hidden DOM element with CSS typography, then captures as image.
 */

import { toPng } from 'html-to-image';

export type TextLayoutStyle = 'classic-ad' | 'top-headline' | 'center-card' | 'minimal' | 'side-strip' | 'professional-ad' | 'magazine-blend' | 'brand-top';

export interface BulletItem {
  icon?: '✓' | '₪' | '⭐' | '🔥' | '💎' | '🎯' | '📞' | '🏷️' | '⚡' | string;
  text: string;
  highlight?: boolean;
}

export interface TextOverlayConfig {
  headline?: string;
  subtitle?: string;
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
  logoPosition?: string;
  servicesList?: string[];
  promoText?: string;
  promoValue?: string;
  bulletItems?: BulletItem[];
}

// ─── Utility functions ───

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,4}/g, '')
    .replace(/_{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '')
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

function splitLongText(text: string, maxCharsPerLine: number = 40): string {
  if (!text || text.length <= maxCharsPerLine) return text;
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  const breakBeforeWords = new Set(['של', 'על', 'עם', 'את', 'אל', 'מן', 'כי', 'או', 'גם', 'כמו', 'אבל', 'אך', 'כדי', 'בו', 'לא', 'היא', 'הוא', 'אנו', 'שלכם', 'שלך', 'לפני', 'אחרי']);
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else if (currentLine && currentLine.length >= maxCharsPerLine * 0.5 && breakBeforeWords.has(word)) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines.join('<br/>');
}

function isRenderableImageUrl(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:application/pdf')) return false;
  if (url.startsWith('data:image/svg')) return false;
  return true;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darkenHex(hex: string, factor = 0.3): string {
  const c = hex.replace('#', '');
  const r = Math.round(parseInt(c.substring(0, 2), 16) * (1 - factor));
  const g = Math.round(parseInt(c.substring(2, 4), 16) * (1 - factor));
  const b = Math.round(parseInt(c.substring(4, 6), 16) * (1 - factor));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function lightenHex(hex: string, factor = 0.3): string {
  const c = hex.replace('#', '');
  const r = Math.min(255, Math.round(parseInt(c.substring(0, 2), 16) + (255 - parseInt(c.substring(0, 2), 16)) * factor));
  const g = Math.min(255, Math.round(parseInt(c.substring(2, 4), 16) + (255 - parseInt(c.substring(2, 4), 16)) * factor));
  const b = Math.min(255, Math.round(parseInt(c.substring(4, 6), 16) + (255 - parseInt(c.substring(4, 6), 16)) * factor));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ─── Shared Contact Strip (V4: Transparent, logo on left, no black bar) ───

function buildContactStripHTML(config: TextOverlayConfig, width: number, height: number, scale: number): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);

  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const address = config.address || '';
  const email = config.email || '';
  const whatsapp = config.whatsapp || '';
  const services = config.servicesList?.map(s => cleanText(s)).filter(Boolean) || [];

  const stripHeight = Math.round(height * 0.12);
  const topBorderHeight = Math.max(Math.round(2 * scale), 1);
  const phoneSize = Math.max(Math.round(28 * scale), 16);
  const nameSize = Math.max(Math.round(15 * scale), 10);
  const detailSize = Math.max(Math.round(11 * scale), 8);
  const serviceSize = Math.max(Math.round(11 * scale), 8);
  const logoHeight = Math.max(Math.round(48 * scale), 26);
  const logoWidth = Math.max(Math.round(110 * scale), 45);
  const padX = Math.round(16 * scale);
  const padY = Math.round(6 * scale);

  // Logo — clean, no background box, no square
  const logoHtml = isRenderableImageUrl(config.logoUrl) ? `
    <img src="${config.logoUrl}" crossorigin="anonymous"
         style="max-height:${logoHeight}px; max-width:${logoWidth}px; object-fit:contain;
                background:none; filter:drop-shadow(0 1px 4px rgba(0,0,0,0.6));" />` : '';

  // Services (pipe-separated)
  const servicesHtml = services.length > 0 ? `
    <div style="display:flex; align-items:center; gap:${Math.round(5 * scale)}px; direction:rtl; flex-wrap:nowrap; overflow:hidden;">
      ${services.slice(0, 5).map((s, i) => `
        ${i > 0 ? `<span style="color:rgba(255,255,255,0.5); font-size:${serviceSize}px;">|</span>` : ''}
        <span style="color:rgba(255,255,255,0.85); font-size:${serviceSize}px; font-weight:500; white-space:nowrap;">${s}</span>
      `).join('')}
    </div>` : '';

  // Contact details
  const contactParts: string[] = [];
  if (address) contactParts.push(address);
  if (email) contactParts.push(email);
  if (whatsapp && whatsapp !== phone) contactParts.push(`☎ ${whatsapp}`);
  const detailsHtml = contactParts.length > 0 ? `
    <div style="color:rgba(255,255,255,0.7); font-size:${detailSize}px; font-weight:400; direction:rtl; 
                white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
      ${contactParts.join(' · ')}
    </div>` : '';

  return `
    <!-- Contact strip V4: transparent, logo LEFT -->
    <div style="position:absolute; bottom:0; left:0; right:0; height:${stripHeight}px; z-index:4;">
      <!-- Thin accent line at top -->
      <div style="height:${topBorderHeight}px; background:${primary}; opacity:0.7;"></div>
      
      <!-- Semi-transparent strip — NOT solid black -->
      <div style="height:calc(100% - ${topBorderHeight}px); 
                  background:linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 100%);
                  backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);
                  display:flex; align-items:center; justify-content:space-between;
                  padding:${padY}px ${padX}px; direction:rtl;">
        
        <!-- Right section: Business name + services + phone -->
        <div style="display:flex; align-items:center; gap:${Math.round(14 * scale)}px; flex:1; min-width:0;">
          <!-- Business name + services -->
          <div style="display:flex; flex-direction:column; gap:${Math.round(2 * scale)}px; flex-shrink:0;">
            <div style="font-size:${nameSize}px; font-weight:800; color:#FFFFFF; white-space:nowrap;">${businessName}</div>
            ${servicesHtml}
          </div>
          
          <!-- Phone badge -->
          ${phone ? `
            <div style="background:${primary}; color:${isLightColor(primary) ? '#1a1a1a' : '#FFFFFF'};
                        padding:${Math.round(4 * scale)}px ${Math.round(16 * scale)}px; border-radius:${Math.round(6 * scale)}px;
                        font-size:${phoneSize}px; font-weight:900; letter-spacing:1px; white-space:nowrap;
                        direction:ltr;">
              ${phone}
            </div>` : ''}
          
          <!-- Contact details -->
          ${detailsHtml}
        </div>

        <!-- Left section: Logo only, clean, no box -->
        <div style="display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          ${logoHtml}
        </div>
      </div>
    </div>
  `;
}

// ─── Bullet/Badge Strip ───

function shouldShowBullets(bullets: BulletItem[] | undefined, layoutStyle: string): boolean {
  if (!bullets || bullets.length === 0) return false;
  const editorialLayouts = ['magazineBlend', 'sideStrip'];
  if (editorialLayouts.includes(layoutStyle)) {
    const promoCount = bullets.filter(b => 
      b.icon === '🔥' || b.icon === '🏷️' || b.icon === '₪' || /₪|%|\d{3,}/.test(b.text)
    ).length;
    return promoCount >= 2;
  }
  return bullets.length >= 2;
}

function buildBulletsStripHTML(config: TextOverlayConfig, width: number, height: number, scale: number, layoutStyle: string = 'classic'): string {
  const bullets = config.bulletItems;
  if (!shouldShowBullets(bullets, layoutStyle)) return '';

  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';
  const textOnSecondary = isLightColor(secondary) ? '#1a1a1a' : '#FFFFFF';

  const padX = Math.round(16 * scale);
  const fontSize = Math.max(Math.round(13 * scale), 10);
  const iconSize = Math.max(Math.round(14 * scale), 10);
  const gap = Math.round(6 * scale);
  const itemPadX = Math.round(10 * scale);
  const itemPadY = Math.round(5 * scale);
  const radius = Math.round(5 * scale);

  const stripHeight = Math.round(height * 0.11);

  const itemsHtml = bullets!.slice(0, 5).map(b => {
    const bg = b.highlight ? secondary : hexToRgba(primary, 0.9);
    const color = b.highlight ? textOnSecondary : textOnPrimary;
    const icon = b.icon || '✓';
    return `
      <div style="display:inline-flex; align-items:center; gap:${Math.round(3 * scale)}px;
                  background:${bg}; color:${color};
                  padding:${itemPadY}px ${itemPadX}px; border-radius:${radius}px;
                  font-size:${fontSize}px; font-weight:700; white-space:nowrap;
                  box-shadow:0 2px 6px rgba(0,0,0,0.3); direction:rtl;">
        <span style="font-size:${iconSize}px; line-height:1;">${icon}</span>
        <span>${cleanText(b.text)}</span>
      </div>`;
  }).join('');

  return `
    <div style="position:absolute; bottom:${stripHeight + Math.round(6 * scale)}px; left:0; right:0; z-index:3;
                display:flex; flex-wrap:wrap; justify-content:center; gap:${gap}px;
                padding:0 ${padX}px; direction:rtl;">
      ${itemsHtml}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// V2 LAYOUTS - Professional, minimal coverage, image-forward
// ═══════════════════════════════════════════════════════════════

// ─── Magazine Blend V2 ───
// Thin solid header bar + transparent body text with text-shadow

function buildMagazineBlendHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);

  const headline = splitLongText((config.headline ? cleanText(config.headline) : '').slice(0, 56), 28);
  const subtitle = splitLongText((config.subtitle ? cleanText(config.subtitle) : '').slice(0, 72), 36);
  const rawBody = config.bodyText ? cleanText(config.bodyText) : '';
  const truncatedBody = rawBody.length > 90 ? rawBody.slice(0, 87).replace(/\s+\S*$/, '') + '...' : rawBody;
  const bodyText = splitLongText(truncatedBody, 42);

  const scale = Math.min(width, height) / 1024;
  const headlineSize = Math.max(Math.round(46 * scale), 24);
  const subtitleSize = Math.max(Math.round(22 * scale), 14);
  const bodySize = Math.max(Math.round(18 * scale), 12);

  const stripHeight = Math.round(height * 0.11);
  // Thin header: just enough for text, not a huge colored block
  const hasSubtitle = !!subtitle;
  const headerHeight = Math.round(height * (hasSubtitle ? 0.18 : 0.14));

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      
      <!-- Full-bleed background image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />

      <!-- Thin header bar - solid, not gradient-bleed -->
      <div style="position:absolute; top:0; left:0; right:0; height:${headerHeight}px; z-index:1;
                  background:linear-gradient(180deg, ${primary} 0%, ${primary} 75%, ${hexToRgba(primary, 0)} 100%);"></div>

      <!-- Subtle bottom vignette for body text readability (dark, not brand-colored) -->
      <div style="position:absolute; left:0; right:0; bottom:${stripHeight}px; height:${Math.round(height * 0.22)}px; z-index:1;
                  background:linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 100%);
                  pointer-events:none;"></div>

      <!-- Main text -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:${stripHeight}px; display:flex; flex-direction:column; justify-content:space-between; 
                  padding:${Math.round(20 * scale)}px ${Math.round(24 * scale)}px ${Math.round(14 * scale)}px; z-index:2;">
        
        <!-- Top: Headline + Subtitle inside the solid header -->
        <div style="text-align:center;">
          ${headline ? `
            <div style="font-size:${headlineSize}px; font-weight:900; color:#fff; line-height:1.25; letter-spacing:-0.5px;
                        text-shadow:0 1px 4px rgba(0,0,0,0.2);">
              ${headline}
            </div>
          ` : ''}
          ${subtitle ? `
            <div style="font-size:${subtitleSize}px; font-weight:600; color:rgba(255,255,255,0.92);
                        line-height:1.35; margin-top:${Math.round(6 * scale)}px;">
              ${subtitle}
            </div>
          ` : ''}
        </div>

        <!-- Middle: image breathes -->
        <div style="flex:1;"></div>

        <!-- Bottom: Body text - compact pill, not huge colored block -->
        <div style="text-align:center;">
          ${bodyText ? `
            <div style="display:inline-block; background:${hexToRgba(primary, 0.85)};
                        border-radius:${Math.round(10 * scale)}px; padding:${Math.round(10 * scale)}px ${Math.round(18 * scale)}px;
                        max-width:${Math.round(width * 0.78)}px; margin:0 auto ${Math.round(6 * scale)}px;
                        box-shadow:0 4px 20px rgba(0,0,0,0.3);">
              <div style="font-size:${bodySize}px; font-weight:600; color:#fff;
                          line-height:1.5; word-break:break-word;
                          display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
                ${bodyText}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      ${buildBulletsStripHTML(config, width, height, scale, 'magazineBlend')}
      ${buildContactStripHTML(config, width, height, scale)}
    </div>
  `;
}

// ─── Brand Top V2 ───
// Solid header badge + clean image + body text pill at bottom

function buildBrandTopHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnSecondary = isLightColor(secondary) ? '#1a1a1a' : '#FFFFFF';

  const headline = splitLongText((config.headline ? cleanText(config.headline) : '').slice(0, 56), 28);
  const subtitle = splitLongText((config.subtitle ? cleanText(config.subtitle) : '').slice(0, 72), 36);
  const rawBody2 = config.bodyText ? cleanText(config.bodyText) : '';
  const truncatedBody2 = rawBody2.length > 90 ? rawBody2.slice(0, 87).replace(/\s+\S*$/, '') + '...' : rawBody2;
  const bodyText = splitLongText(truncatedBody2, 42);

  const scale = Math.min(width, height) / 1024;
  const headlineSize = Math.max(Math.round(48 * scale), 24);
  const subtitleSize = Math.max(Math.round(22 * scale), 14);
  const bodySize = Math.max(Math.round(18 * scale), 12);

  const stripHeight = Math.round(height * 0.11);
  const hasSubtitle2 = !!subtitle;
  const headerHeight = Math.round(height * (hasSubtitle2 ? 0.17 : 0.13));

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <!-- Background image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />

      <!-- Solid header bar -->
      <div style="position:absolute; top:0; left:0; right:0; height:${headerHeight}px; z-index:1;
                  background:linear-gradient(180deg, ${primary} 0%, ${primary} 70%, ${hexToRgba(primary, 0)} 100%);"></div>

      <!-- Dark vignette for bottom text -->
      <div style="position:absolute; left:0; right:0; bottom:${stripHeight}px; height:${Math.round(height * 0.20)}px; z-index:1;
                  background:linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
                  pointer-events:none;"></div>

      <!-- Text layout -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:${stripHeight}px; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(18 * scale)}px ${Math.round(22 * scale)}px ${Math.round(12 * scale)}px; z-index:2;">
        
        <!-- Top: Headline as badge -->
        <div style="text-align:center;">
          ${headline ? `
            <div style="display:inline-block; background:${hexToRgba(secondary, 0.9)}; padding:${Math.round(10 * scale)}px ${Math.round(24 * scale)}px;
                        border-radius:${Math.round(6 * scale)}px; box-shadow:0 4px 16px rgba(0,0,0,0.25);">
              <div style="font-size:${headlineSize}px; font-weight:900; color:${textOnSecondary}; line-height:1.25; letter-spacing:-0.5px;">
                ${headline}
              </div>
            </div>
          ` : ''}
          ${subtitle ? `
            <div style="font-size:${subtitleSize}px; font-weight:700; color:#fff;
                        text-shadow:0 2px 8px rgba(0,0,0,0.5); line-height:1.35; margin-top:${Math.round(8 * scale)}px;">
              ${subtitle}
            </div>
          ` : ''}
        </div>

        <div style="flex:1;"></div>

        <!-- Bottom: Body text pill -->
        ${bodyText ? `
          <div style="text-align:center; max-width:${Math.round(width * 0.78)}px; margin:0 auto ${Math.round(6 * scale)}px;">
            <div style="display:inline-block; background:${hexToRgba(primary, 0.85)};
                        border-radius:${Math.round(8 * scale)}px; padding:${Math.round(10 * scale)}px ${Math.round(16 * scale)}px;
                        box-shadow:0 4px 16px rgba(0,0,0,0.3);">
              <div style="font-size:${bodySize}px; font-weight:600; color:#fff;
                          line-height:1.5; word-break:break-word;">
                ${bodyText}
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      ${buildBulletsStripHTML(config, width, height, scale, 'brandTop')}
      ${buildContactStripHTML(config, width, height, scale)}
    </div>
  `;
}

// ─── Professional Ad V2 ───

function buildProfessionalAdHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);

  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 28);
  const subtitle = splitLongText(config.subtitle ? cleanText(config.subtitle) : '', 36);
  const bodyText = splitLongText(config.bodyText ? cleanText(config.bodyText) : '', 50);
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';

  const scale = Math.min(width, height) / 1024;
  const stripHeight = Math.round(height * 0.11);
  const headerHeight = Math.round(height * 0.15);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      <!-- Solid header bar -->
      <div style="position:absolute; top:0; left:0; right:0; height:${headerHeight}px; z-index:1;
                  background:linear-gradient(180deg, ${primary} 0%, ${primary} 70%, ${hexToRgba(primary, 0)} 100%);"></div>

      <!-- Dark bottom vignette -->
      <div style="position:absolute; left:0; right:0; bottom:${stripHeight}px; height:${Math.round(height * 0.22)}px; z-index:1;
                  background:linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 50%, transparent 100%);
                  pointer-events:none;"></div>

      <!-- Text -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:${stripHeight}px; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(16*scale)}px ${Math.round(20*scale)}px ${Math.round(12*scale)}px; z-index:2;">
        
        <div style="text-align:center;">
          ${headline ? `
             <div style="font-size:${Math.round(48*scale)}px; font-weight:900; color:#fff; line-height:1.2; 
                  text-shadow:0 1px 4px rgba(0,0,0,0.2); letter-spacing:-0.5px;">
              ${headline}
            </div>
            ${subtitle ? `<div style="font-size:${Math.round(20*scale)}px; font-weight:600; color:rgba(255,255,255,0.92);
                 margin-top:${Math.round(4*scale)}px;">${subtitle}</div>` : ''}
          ` : ''}
        </div>

        <div style="flex:1;"></div>

        <div style="text-align:center;">
          ${bodyText ? `
            <div style="display:inline-block; background:${hexToRgba(primary, 0.85)};
                        border-radius:${Math.round(8*scale)}px; padding:${Math.round(10*scale)}px ${Math.round(16*scale)}px;
                        max-width:${Math.round(width*0.78)}px; margin:0 auto ${Math.round(6*scale)}px;
                        box-shadow:0 4px 16px rgba(0,0,0,0.3);">
              <div style="font-size:${Math.round(17*scale)}px; font-weight:600; color:#fff;
                   line-height:1.5; word-break:break-word;">${bodyText}</div>
            </div>
          ` : ''}
          ${ctaText ? `
            <div style="margin-top:${Math.round(6*scale)}px;">
              <span style="background:${secondary}; 
                   color:${isLightColor(secondary)?'#1a1a1a':'#FFFFFF'}; padding:${Math.round(8*scale)}px ${Math.round(28*scale)}px; 
                   border-radius:${Math.round(24*scale)}px; font-size:${Math.round(18*scale)}px; font-weight:800; 
                   box-shadow:0 4px 14px ${hexToRgba(secondary,0.4)};">
                ${ctaText}
              </span>
            </div>
          ` : ''}
        </div>
      </div>

      ${buildBulletsStripHTML(config, width, height, scale, 'professional')}
      ${buildContactStripHTML(config, width, height, scale)}
    </div>
  `;
}

// ─── Classic Ad V2 ───

function buildClassicAdHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnSecondary = isLightColor(secondary) ? '#1a1a1a' : '#FFFFFF';

  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 28);
  const bodyText = splitLongText(config.bodyText ? cleanText(config.bodyText) : '', 50);
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';

  const scale = Math.min(width, height) / 1024;
  const stripHeight = Math.round(height * 0.11);
  const headerHeight = Math.round(height * 0.15);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      <!-- Solid header -->
      <div style="position:absolute; top:0; left:0; right:0; height:${headerHeight}px; z-index:1;
                  background:linear-gradient(180deg, ${primary} 0%, ${primary} 70%, ${hexToRgba(primary, 0)} 100%);"></div>

      <!-- Dark vignette bottom -->
      <div style="position:absolute; left:0; right:0; bottom:${stripHeight}px; height:${Math.round(height * 0.20)}px; z-index:1;
                  background:linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
                  pointer-events:none;"></div>

      <!-- Text -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:${stripHeight}px; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(18*scale)}px ${Math.round(22*scale)}px ${Math.round(10*scale)}px; z-index:2;">
        
        ${headline ? `
          <div style="text-align:center;">
             <div style="font-size:${Math.round(50*scale)}px; font-weight:900; color:#fff;
                  text-shadow:0 1px 4px rgba(0,0,0,0.2); line-height:1.2; letter-spacing:-0.5px;">
              ${headline}
            </div>
          </div>
        ` : '<div></div>'}

        <div style="flex:1;"></div>

        <div style="text-align:center;">
          ${bodyText ? `
            <div style="display:inline-block; background:${hexToRgba(primary, 0.85)};
                        border-radius:${Math.round(8*scale)}px; padding:${Math.round(10*scale)}px ${Math.round(16*scale)}px;
                        max-width:${Math.round(width*0.78)}px; margin:0 auto ${Math.round(8*scale)}px;
                        box-shadow:0 4px 16px rgba(0,0,0,0.3);">
              <div style="font-size:${Math.round(18*scale)}px; font-weight:600; color:#fff;
                   line-height:1.5; word-break:break-word;">
                ${bodyText}
              </div>
            </div>
          ` : ''}
          ${ctaText ? `
            <div style="margin-top:${Math.round(6*scale)}px;">
              <span style="background:${secondary};
                   color:${textOnSecondary}; padding:${Math.round(10*scale)}px ${Math.round(30*scale)}px;
                   border-radius:${Math.round(26*scale)}px; font-size:${Math.round(20*scale)}px; font-weight:800;
                   box-shadow:0 4px 16px ${hexToRgba(secondary,0.4)};">
                ${ctaText}
              </span>
            </div>
          ` : ''}
        </div>
      </div>

      ${buildBulletsStripHTML(config, width, height, scale, 'classic')}
      ${buildContactStripHTML(config, width, height, scale)}
    </div>
  `;
}

// ─── Side Strip V2 ───

function buildSideStripHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';

  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 24);
  const bodyText = splitLongText(config.bodyText ? cleanText(config.bodyText) : '', 40);
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';
  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const scale = Math.min(width, height) / 1024;
  const stripWidth = Math.round(width * 0.30);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      <!-- Side strip with solid color -->
      <div style="position:absolute; top:0; right:0; width:${stripWidth}px; height:100%; background:${hexToRgba(primary, 0.92)};"></div>
      <!-- Accent border -->
      <div style="position:absolute; top:0; right:${stripWidth}px; width:3px; height:100%; background:${secondary};"></div>
      <!-- Content -->
      <div style="position:absolute; top:0; right:0; width:${stripWidth}px; height:100%; 
                  display:flex; flex-direction:column; align-items:center; justify-content:center; 
                  padding:${Math.round(20*scale)}px ${Math.round(14*scale)}px; gap:${Math.round(14*scale)}px; text-align:center;">
        ${isRenderableImageUrl(config.logoUrl) ? `
          <div style="background:rgba(255,255,255,0.9); border-radius:${Math.round(6*scale)}px; padding:${Math.round(4*scale)}px;">
            <img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(50*scale)}px; max-width:${Math.round(stripWidth*0.65)}px; object-fit:contain;" />
          </div>` : ''}
        ${businessName ? `<div style="font-size:${Math.round(28*scale)}px; font-weight:900; color:${textOnPrimary};">${businessName}</div>` : ''}
        <div style="width:50%; height:2px; background:${secondary};"></div>
        ${headline ? `<div style="font-size:${Math.round(24*scale)}px; font-weight:900; color:${textOnPrimary}; line-height:1.25;">${headline}</div>` : ''}
        ${bodyText ? `<div style="font-size:${Math.round(14*scale)}px; font-weight:500; color:${isLightColor(primary) ? '#333' : 'rgba(255,255,255,0.85)'}; line-height:1.4;">${bodyText}</div>` : ''}
        ${ctaText ? `<div style="background:${secondary}; color:${isLightColor(secondary)?'#1a1a1a':'#fff'}; padding:${Math.round(8*scale)}px ${Math.round(20*scale)}px; border-radius:${Math.round(18*scale)}px; font-size:${Math.round(16*scale)}px; font-weight:800; margin-top:${Math.round(6*scale)}px;">${ctaText}</div>` : ''}
        ${phone ? `<div style="font-size:${Math.round(18*scale)}px; font-weight:900; color:${secondary}; direction:ltr; margin-top:${Math.round(8*scale)}px;">${phone}</div>` : ''}
      </div>
    </div>
  `;
}

// ─── Minimal Layout ───

function buildMinimalHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const secondary = config.secondaryColor || darkenHex(config.primaryColor || '#2BA5B5', 0.3);
  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 28);
  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const scale = Math.min(width, height) / 1024;

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      <!-- Bottom vignette -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:${Math.round(height * 0.30)}px;
                  background:linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, transparent 100%); z-index:1;"></div>
      <div style="position:absolute; bottom:${Math.round(20*scale)}px; left:50%; transform:translateX(-50%); text-align:center; z-index:2;">
        ${headline ? `<div style="font-size:${Math.round(34*scale)}px; font-weight:900; color:#fff; text-shadow:0 2px 8px rgba(0,0,0,0.6); margin-bottom:${Math.round(6*scale)}px;">${headline}</div>` : ''}
        ${businessName ? `<div style="font-size:${Math.round(16*scale)}px; font-weight:700; color:#fff; text-shadow:0 1px 6px rgba(0,0,0,0.5);">${businessName}</div>` : ''}
        ${phone ? `<div style="font-size:${Math.round(18*scale)}px; font-weight:900; color:${secondary}; direction:ltr; text-shadow:0 1px 6px rgba(0,0,0,0.4); margin-top:${Math.round(4*scale)}px;">${phone}</div>` : ''}
      </div>
      ${isRenderableImageUrl(config.logoUrl) ? `
        <div style="position:absolute; bottom:${Math.round(14*scale)}px; left:${Math.round(14*scale)}px; z-index:2;
                    background:rgba(255,255,255,0.9); border-radius:${Math.round(6*scale)}px; padding:${Math.round(3*scale)}px;">
          <img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(45*scale)}px; object-fit:contain;" />
        </div>
      ` : ''}
    </div>
  `;
}

// ─── Layout selector ───

function getLayoutHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const style = config.layoutStyle || 'magazine-blend';
  switch (style) {
    case 'magazine-blend':
      return buildMagazineBlendHTML(config, width, height, imageUrl);
    case 'brand-top':
      return buildBrandTopHTML(config, width, height, imageUrl);
    case 'professional-ad':
      return buildProfessionalAdHTML(config, width, height, imageUrl);
    case 'side-strip':
      return buildSideStripHTML(config, width, height, imageUrl);
    case 'minimal':
      return buildMinimalHTML(config, width, height, imageUrl);
    case 'top-headline':
    case 'center-card':
    case 'classic-ad':
    default:
      return buildClassicAdHTML(config, width, height, imageUrl);
  }
}

// ─── Image dimensions helper ───

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Main export ───

export async function applyHtmlTextOverlay(
  imageUrl: string,
  config: TextOverlayConfig
): Promise<string> {
  const { headline, bodyText, ctaText, businessName, phone } = config;
  if (!headline && !businessName && !phone && !bodyText) return imageUrl;

  const { width, height } = await getImageDimensions(imageUrl);
  const html = getLayoutHTML(config, width, height, imageUrl);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.overflow = 'hidden';
  container.style.zIndex = '-1';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));

    await new Promise(r => setTimeout(r, 100));

    const dataUrl = await toPng(container.firstElementChild as HTMLElement, {
      width,
      height,
      pixelRatio: 1,
      cacheBust: true,
    });

    return dataUrl;
  } finally {
    document.body.removeChild(container);
  }
}
