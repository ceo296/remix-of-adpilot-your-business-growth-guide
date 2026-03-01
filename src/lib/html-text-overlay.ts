/**
 * HTML/CSS-based text overlay system for professional Hebrew ad layouts.
 * Renders a hidden DOM element with CSS typography, then captures as image.
 */

import { toPng } from 'html-to-image';

export type TextLayoutStyle = 'classic-ad' | 'top-headline' | 'center-card' | 'minimal' | 'side-strip' | 'professional-ad' | 'magazine-blend' | 'brand-top';

export interface BulletItem {
  icon?: '✓' | '₪' | '⭐' | '🔥' | '💎' | '🎯' | '📞' | '🏷️' | '⚡' | string;
  text: string;
  highlight?: boolean; // use brand color background
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

// ─── Bullet/Badge Strip (services, prices, advantages) ───

// Determine if bullets should appear based on layout style and content relevance.
// Not every ad benefits from badges — only show when there's strong promo/pricing content.
function shouldShowBullets(bullets: BulletItem[] | undefined, layoutStyle: string): boolean {
  if (!bullets || bullets.length === 0) return false;

  // Layouts that are editorial/cinematic — only show bullets if there are strong promo items (prices/discounts)
  const editorialLayouts = ['magazineBlend', 'sideStrip'];
  if (editorialLayouts.includes(layoutStyle)) {
    const hasPromoContent = bullets.some(b => 
      b.icon === '🔥' || b.icon === '🏷️' || b.icon === '₪' || 
      /\d/.test(b.text) // contains numbers (prices, percentages)
    );
    // Need at least 2 strong promo items to justify showing in editorial layouts
    const promoCount = bullets.filter(b => 
      b.icon === '🔥' || b.icon === '🏷️' || b.icon === '₪' || /₪|%|\d{3,}/.test(b.text)
    ).length;
    return hasPromoContent && promoCount >= 2;
  }

  // Professional/BrandTop/Classic — show if there are at least 2 meaningful items
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
  const padY = Math.round(8 * scale);
  const fontSize = Math.max(Math.round(14 * scale), 10);
  const iconSize = Math.max(Math.round(16 * scale), 11);
  const gap = Math.round(8 * scale);
  const itemPadX = Math.round(12 * scale);
  const itemPadY = Math.round(6 * scale);
  const radius = Math.round(6 * scale);

  const itemsHtml = bullets.slice(0, 6).map(b => {
    const bg = b.highlight ? secondary : hexToRgba(primary, 0.85);
    const color = b.highlight ? textOnSecondary : textOnPrimary;
    const icon = b.icon || '✓';
    return `
      <div style="display:inline-flex; align-items:center; gap:${Math.round(4 * scale)}px;
                  background:${bg}; color:${color};
                  padding:${itemPadY}px ${itemPadX}px; border-radius:${radius}px;
                  font-size:${fontSize}px; font-weight:700; white-space:nowrap;
                  box-shadow:0 2px 8px rgba(0,0,0,0.25); direction:rtl;">
        <span style="font-size:${iconSize}px; line-height:1;">${icon}</span>
        <span>${cleanText(b.text)}</span>
      </div>`;
  }).join('');

  return `
    <!-- Bullets/Badges strip -->
    <div style="position:absolute; bottom:${Math.round(height * 0.14 + padY * 2)}px; left:0; right:0; z-index:3;
                display:flex; flex-wrap:wrap; justify-content:center; gap:${gap}px;
                padding:0 ${padX}px; direction:rtl;">
      ${itemsHtml}
    </div>
  `;
}

// ─── Shared Contact Strip (Professional Newspaper Grid) ───
// Matches the style of real Haredi newspaper ads:
// Solid opaque background, 3-column grid, pipe-separated services, prominent phone badge

function buildContactStripHTML(config: TextOverlayConfig, width: number, height: number, scale: number): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const stripBg = darkenHex(primary, 0.5);
  const stripText = '#FFFFFF';
  const stripSubText = 'rgba(255,255,255,0.75)';

  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const address = config.address || '';
  const email = config.email || '';
  const whatsapp = config.whatsapp || '';
  const services = config.servicesList?.map(s => cleanText(s)).filter(Boolean) || [];

  const stripHeight = Math.round(height * 0.14);
  const topBorderHeight = Math.max(Math.round(3 * scale), 2);
  const phoneSize = Math.max(Math.round(26 * scale), 16);
  const nameSize = Math.max(Math.round(16 * scale), 11);
  const detailSize = Math.max(Math.round(11 * scale), 8);
  const serviceSize = Math.max(Math.round(11 * scale), 8);
  const logoHeight = Math.max(Math.round(60 * scale), 32);
  const logoWidth = Math.max(Math.round(140 * scale), 60);
  const padX = Math.round(14 * scale);
  const padY = Math.round(6 * scale);

  const logoHtml = isRenderableImageUrl(config.logoUrl) ? `
    <img src="${config.logoUrl}" crossorigin="anonymous"
         style="max-height:${logoHeight}px; max-width:${logoWidth}px; object-fit:contain; filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3));" />` : '';

  // Services bar (pipe-separated)
  const servicesHtml = services.length > 0 ? `
    <div style="display:flex; align-items:center; justify-content:center; gap:${Math.round(5 * scale)}px; direction:rtl; flex-wrap:wrap;">
      ${services.slice(0, 6).map((s, i) => `
        ${i > 0 ? `<span style="color:${stripSubText}; font-size:${serviceSize}px; font-weight:400;">|</span>` : ''}
        <span style="color:${stripText}; font-size:${serviceSize}px; font-weight:600; white-space:nowrap;">${s}</span>
      `).join('')}
    </div>` : '';

  // Phone badge (prominent, with secondary color)
  const phoneBadgeHtml = phone ? `
    <div style="display:flex; align-items:center; gap:${Math.round(6 * scale)}px; direction:ltr;">
      <div style="background:${secondary}; color:${isLightColor(secondary) ? '#1a1a1a' : '#FFFFFF'};
                  padding:${Math.round(4 * scale)}px ${Math.round(14 * scale)}px; border-radius:${Math.round(4 * scale)}px;
                  font-size:${phoneSize}px; font-weight:900; letter-spacing:0.5px; white-space:nowrap;
                  box-shadow:0 2px 8px rgba(0,0,0,0.3);">
        ${phone}
      </div>
    </div>` : '';

  // Contact details line
  const contactDetails: string[] = [];
  if (address) contactDetails.push(address);
  if (whatsapp && whatsapp !== phone) contactDetails.push(`☎ ${whatsapp}`);
  if (email) contactDetails.push(email);
  const detailsHtml = contactDetails.length > 0 ? `
    <div style="color:${stripSubText}; font-size:${detailSize}px; font-weight:500; direction:rtl; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
      ${contactDetails.join(' | ')}
    </div>` : '';

  return `
    <!-- Solid contact strip — newspaper grid style -->
    <div style="position:absolute; bottom:0; left:0; right:0; height:${stripHeight}px; z-index:4;">
      <!-- Top accent border -->
      <div style="height:${topBorderHeight}px; background:${secondary};"></div>
      
      <!-- Main strip with solid brand-dark background -->
      <div style="height:calc(100% - ${topBorderHeight}px); background:${stripBg};
                  display:grid; grid-template-columns:auto 1fr auto; align-items:center;
                  padding:${padY}px ${padX}px; gap:${Math.round(10 * scale)}px; direction:rtl;">
        
        <!-- Right: Logo -->
        <div style="display:flex; align-items:center; justify-content:center;">
          ${logoHtml}
        </div>

        <!-- Center: Phone badge + contact details + services -->
        <div style="display:flex; flex-direction:column; align-items:center; gap:${Math.round(2 * scale)}px; overflow:hidden;">
          ${phoneBadgeHtml}
          ${detailsHtml}
          ${servicesHtml}
        </div>

        <!-- Left: Business name -->
        <div style="text-align:left; direction:rtl;">
          <div style="font-size:${nameSize}px; font-weight:800; color:${stripText}; white-space:nowrap;">${businessName}</div>
        </div>
      </div>
    </div>
  `;
}
// ─── Magazine Blend Layout ───

function buildMagazineBlendHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);

  const headline = splitLongText((config.headline ? cleanText(config.headline) : '').slice(0, 56), 28);
  const subtitle = splitLongText((config.subtitle ? cleanText(config.subtitle) : '').slice(0, 72), 36);
  const rawBody = config.bodyText ? cleanText(config.bodyText) : '';
  const truncatedBody = rawBody.length > 90 ? rawBody.slice(0, 87).replace(/\s+\S*$/, '') + '...' : rawBody;
  const bodyText = splitLongText(truncatedBody, 42);

  const scale = Math.min(width, height) / 1024;
  const headlineSize = Math.max(Math.round(54 * scale), 28);
  const subtitleSize = Math.max(Math.round(28 * scale), 18);
  const bodySize = Math.max(Math.round(22 * scale), 14);

  const stripHeight = Math.round(height * 0.14);
  const headerHeight = Math.round(height * 0.18);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      
      <!-- Full-bleed background image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />

      <!-- Top header band with brand color -->
      <div style="position:absolute; top:0; left:0; right:0; height:${headerHeight}px; z-index:1;
                  background:linear-gradient(180deg, ${hexToRgba(primary, 0.92)} 0%, ${hexToRgba(primary, 0.85)} 70%, transparent 100%);"></div>

      <!-- Bottom body gradient (brand-tinted, not black) -->
      <div style="position:absolute; left:0; right:0; bottom:${stripHeight}px; height:${Math.round(height * 0.30)}px; z-index:1;
                  background:linear-gradient(0deg, ${hexToRgba(primary, 0.85)} 0%, ${hexToRgba(primary, 0.55)} 50%, transparent 100%);
                  pointer-events:none;"></div>

      <!-- Main text content block -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:${stripHeight}px; display:flex; flex-direction:column; justify-content:space-between; 
                  padding:${Math.round(28 * scale)}px ${Math.round(24 * scale)}px ${Math.round(20 * scale)}px; z-index:2;">
        
        <!-- Top section: Headline + Subtitle on brand-colored header -->
        <div style="text-align:center;">
          ${headline ? `
            <div style="font-size:${headlineSize}px; font-weight:900; color:#fff; line-height:1.3; letter-spacing:-0.5px;
                        text-shadow:0 2px 8px rgba(0,0,0,0.3);">
              ${headline}
            </div>
          ` : ''}
          ${subtitle ? `
            <div style="font-size:${subtitleSize}px; font-weight:600; color:rgba(255,255,255,0.95);
                        text-shadow:0 1px 4px rgba(0,0,0,0.3); line-height:1.4; margin-top:${Math.round(8 * scale)}px;">
              ${subtitle}
            </div>
          ` : ''}
        </div>

        <!-- Middle: empty space lets the visual breathe -->
        <div style="flex:1;"></div>

        <!-- Bottom section: Body text with readable backdrop -->
        <div style="text-align:center;">
          ${bodyText ? `
            <div style="display:inline-block; background:${hexToRgba(primary, 0.75)}; backdrop-filter:blur(4px);
                        border-radius:${Math.round(8 * scale)}px; padding:${Math.round(12 * scale)}px ${Math.round(20 * scale)}px;
                        max-width:${Math.round(width * 0.85)}px; margin:0 auto ${Math.round(8 * scale)}px;">
              <div style="font-size:${bodySize}px; font-weight:600; color:#fff;
                          line-height:1.6; word-break:break-word;
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

// ─── Brand Top Layout ───

function buildBrandTopHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';

  const headline = splitLongText((config.headline ? cleanText(config.headline) : '').slice(0, 56), 28);
  const subtitle = splitLongText((config.subtitle ? cleanText(config.subtitle) : '').slice(0, 72), 36);
  const rawBody2 = config.bodyText ? cleanText(config.bodyText) : '';
  const truncatedBody2 = rawBody2.length > 90 ? rawBody2.slice(0, 87).replace(/\s+\S*$/, '') + '...' : rawBody2;
  const bodyText = splitLongText(truncatedBody2, 42);

  const scale = Math.min(width, height) / 1024;
  const headlineSize = Math.max(Math.round(52 * scale), 26);
  const subtitleSize = Math.max(Math.round(26 * scale), 16);
  const bodySize = Math.max(Math.round(20 * scale), 13);

  const stripHeight = Math.round(height * 0.14);
  const headerHeight = Math.round(height * 0.16);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <!-- Full background image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />

      <!-- Top header band with brand color -->
      <div style="position:absolute; top:0; left:0; right:0; height:${headerHeight}px; z-index:1;
                  background:linear-gradient(180deg, ${hexToRgba(primary, 0.9)} 0%, ${hexToRgba(primary, 0.8)} 65%, transparent 100%);"></div>

      <!-- Bottom body gradient -->
      <div style="position:absolute; left:0; right:0; bottom:${stripHeight}px; height:${Math.round(height * 0.28)}px; z-index:1;
                  background:linear-gradient(0deg, ${hexToRgba(primary, 0.8)} 0%, ${hexToRgba(primary, 0.4)} 50%, transparent 100%);
                  pointer-events:none;"></div>

      <!-- Main text block -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:${stripHeight}px; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(24 * scale)}px ${Math.round(20 * scale)}px ${Math.round(16 * scale)}px; z-index:2;">
        
        <!-- Top: Headline badge + Subtitle -->
        <div style="text-align:center;">
          ${headline ? `
            <div style="display:inline-block; background:${hexToRgba(secondary, 0.85)}; padding:${Math.round(12 * scale)}px ${Math.round(28 * scale)}px;
                        border-radius:${Math.round(6 * scale)}px; box-shadow:0 4px 16px rgba(0,0,0,0.25);">
              <div style="font-size:${headlineSize}px; font-weight:900; color:${textOnPrimary}; line-height:1.3; letter-spacing:-0.5px;">
                ${headline}
              </div>
            </div>
          ` : ''}
          ${subtitle ? `
            <div style="font-size:${subtitleSize}px; font-weight:700; color:#fff;
                        text-shadow:0 2px 8px rgba(0,0,0,0.4); line-height:1.4; margin-top:${Math.round(10 * scale)}px;">
              ${subtitle}
            </div>
          ` : ''}
        </div>

        <!-- Middle spacer -->
        <div style="flex:1;"></div>

        <!-- Bottom: Body text with backdrop -->
        ${bodyText ? `
          <div style="text-align:center; max-width:${Math.round(width * 0.82)}px; margin:0 auto ${Math.round(6 * scale)}px;">
            <div style="display:inline-block; background:${hexToRgba(primary, 0.7)}; backdrop-filter:blur(4px);
                        border-radius:${Math.round(6 * scale)}px; padding:${Math.round(10 * scale)}px ${Math.round(18 * scale)}px;">
              <div style="font-size:${bodySize}px; font-weight:600; color:#fff;
                          line-height:1.7; word-break:break-word;">
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

// ─── Professional Ad Layout ───

function buildProfessionalAdHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);

  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 28);
  const subtitle = splitLongText(config.subtitle ? cleanText(config.subtitle) : '', 36);
  const bodyText = splitLongText(config.bodyText ? cleanText(config.bodyText) : '', 50);
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';

  const scale = Math.min(width, height) / 1024;
  const stripHeight = Math.round(height * 0.14);
  const headerHeight = Math.round(height * 0.17);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      <!-- Top header band with brand color -->
      <div style="position:absolute; top:0; left:0; right:0; height:${headerHeight}px; z-index:1;
                  background:linear-gradient(180deg, ${hexToRgba(primary, 0.9)} 0%, ${hexToRgba(primary, 0.8)} 60%, transparent 100%);"></div>

      <!-- Bottom body gradient -->
      <div style="position:absolute; left:0; right:0; bottom:${stripHeight}px; height:${Math.round(height * 0.28)}px; z-index:1;
                  background:linear-gradient(0deg, ${hexToRgba(primary, 0.8)} 0%, ${hexToRgba(primary, 0.4)} 50%, transparent 100%);
                  pointer-events:none;"></div>

      <!-- Main text block -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:${stripHeight}px; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(20*scale)}px ${Math.round(20*scale)}px ${Math.round(12*scale)}px; z-index:2;">
        
        <!-- Top: Headline + Subtitle -->
        <div style="text-align:center;">
          ${headline ? `
             <div style="font-size:${Math.round(54*scale)}px; font-weight:900; color:#fff; line-height:1.2; 
                  text-shadow:0 2px 8px rgba(0,0,0,0.3); letter-spacing:-0.5px;">
              ${headline}
            </div>
            ${subtitle ? `<div style="font-size:${Math.round(22*scale)}px; font-weight:600; color:rgba(255,255,255,0.95);
                 margin-top:${Math.round(6*scale)}px; text-shadow:0 1px 4px rgba(0,0,0,0.3);">${subtitle}</div>` : ''}
          ` : ''}
        </div>

        <!-- Middle spacer -->
        <div style="flex:1;"></div>

        <!-- Bottom: Body + CTA with backdrop -->
        <div style="text-align:center;">
          ${bodyText ? `
            <div style="display:inline-block; background:${hexToRgba(primary, 0.7)}; backdrop-filter:blur(4px);
                        border-radius:${Math.round(6*scale)}px; padding:${Math.round(10*scale)}px ${Math.round(18*scale)}px;
                        max-width:${Math.round(width*0.85)}px; margin:0 auto ${Math.round(8*scale)}px;">
              <div style="font-size:${Math.round(18*scale)}px; font-weight:600; color:#fff;
                   line-height:1.7; word-break:break-word;">${bodyText}</div>
            </div>
          ` : ''}
          ${ctaText ? `
            <div style="margin-top:${Math.round(8*scale)}px;">
              <span style="background:linear-gradient(135deg, ${secondary}, ${darkenHex(secondary,0.15)}); 
                   color:${isLightColor(secondary)?'#1a1a1a':'#FFFFFF'}; padding:${Math.round(10*scale)}px ${Math.round(32*scale)}px; 
                   border-radius:${Math.round(26*scale)}px; font-size:${Math.round(20*scale)}px; font-weight:800; 
                   box-shadow:0 4px 16px ${hexToRgba(secondary,0.5)};">
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

// ─── Classic Ad Layout ───

function buildClassicAdHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnSecondary = isLightColor(secondary) ? '#1a1a1a' : '#FFFFFF';

  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 28);
  const bodyText = splitLongText(config.bodyText ? cleanText(config.bodyText) : '', 50);
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';

  const scale = Math.min(width, height) / 1024;
  const stripHeight = Math.round(height * 0.14);
  const headerHeight = Math.round(height * 0.18);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      <!-- Top header band with brand color -->
      <div style="position:absolute; top:0; left:0; right:0; height:${headerHeight}px; z-index:1;
                  background:linear-gradient(180deg, ${hexToRgba(primary, 0.92)} 0%, ${hexToRgba(primary, 0.85)} 65%, transparent 100%);"></div>

      <!-- Bottom body gradient -->
      <div style="position:absolute; left:0; right:0; bottom:${stripHeight}px; height:${Math.round(height * 0.28)}px; z-index:1;
                  background:linear-gradient(0deg, ${hexToRgba(primary, 0.82)} 0%, ${hexToRgba(primary, 0.45)} 50%, transparent 100%);
                  pointer-events:none;"></div>

      <!-- Main text block -->
      <div style="position:absolute; top:0; left:0; right:0; bottom:${stripHeight}px; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(28*scale)}px ${Math.round(24*scale)}px ${Math.round(12*scale)}px; z-index:2;">
        
        <!-- Top: Headline -->
        ${headline ? `
          <div style="text-align:center;">
             <div style="font-size:${Math.round(56*scale)}px; font-weight:900; color:#fff;
                  text-shadow:0 2px 8px rgba(0,0,0,0.3); line-height:1.2; letter-spacing:-0.5px;">
              ${headline}
            </div>
          </div>
        ` : '<div></div>'}

        <!-- Middle spacer -->
        <div style="flex:1;"></div>

        <!-- Bottom: Body + CTA with backdrop -->
        <div style="text-align:center;">
          ${bodyText ? `
            <div style="display:inline-block; background:${hexToRgba(primary, 0.7)}; backdrop-filter:blur(4px);
                        border-radius:${Math.round(6*scale)}px; padding:${Math.round(10*scale)}px ${Math.round(18*scale)}px;
                        max-width:${Math.round(width*0.85)}px; margin:0 auto ${Math.round(10*scale)}px;">
              <div style="font-size:${Math.round(20*scale)}px; font-weight:600; color:#fff;
                   line-height:1.6; word-break:break-word;">
                ${bodyText}
              </div>
            </div>
          ` : ''}
          ${ctaText ? `
            <div style="margin-top:${Math.round(8*scale)}px;">
              <span style="background:linear-gradient(135deg, ${secondary}, ${darkenHex(secondary,0.15)});
                   color:${textOnSecondary}; padding:${Math.round(12*scale)}px ${Math.round(36*scale)}px;
                   border-radius:${Math.round(30*scale)}px; font-size:${Math.round(22*scale)}px; font-weight:800;
                   box-shadow:0 6px 20px ${hexToRgba(secondary,0.5)};">
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

// ─── Side Strip Layout ───

function buildSideStripHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';
  const subColor = isLightColor(primary) ? '#444' : '#d0d0d0';

  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 24);
  const bodyText = splitLongText(config.bodyText ? cleanText(config.bodyText) : '', 40);
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';
  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const scale = Math.min(width, height) / 1024;
  const stripWidth = Math.round(width * 0.32);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      <div style="position:absolute; top:0; right:0; width:${stripWidth + Math.round(width*0.08)}px; height:100%;
                  background:linear-gradient(270deg, ${hexToRgba(primary,0.9)} ${Math.round((stripWidth/(stripWidth+width*0.08))*100)}%, transparent 100%);"></div>
      <div style="position:absolute; top:0; right:${stripWidth}px; width:3px; height:100%; background:${secondary};"></div>
      <div style="position:absolute; top:0; right:0; width:${stripWidth}px; height:100%; 
                  display:flex; flex-direction:column; align-items:center; justify-content:center; 
                  padding:${Math.round(24*scale)}px; gap:${Math.round(16*scale)}px; text-align:center;">
        ${isRenderableImageUrl(config.logoUrl) ? `<img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(60*scale)}px; max-width:${Math.round(stripWidth*0.7)}px; object-fit:contain; background:none; filter:drop-shadow(0 1px 4px rgba(0,0,0,0.5));" />` : ''}
        ${businessName ? `<div style="font-size:${Math.round(32*scale)}px; font-weight:900; color:${textOnPrimary};">${businessName}</div>` : ''}
        <div style="width:60%; height:3px; background:${secondary};"></div>
        ${headline ? `<div style="font-size:${Math.round(26*scale)}px; font-weight:900; color:${textOnPrimary}; line-height:1.3;">${headline}</div>` : ''}
        ${bodyText ? `<div style="font-size:${Math.round(16*scale)}px; font-weight:500; color:${subColor}; line-height:1.5;">${bodyText}</div>` : ''}
        ${ctaText ? `<div style="background:${secondary}; color:${isLightColor(secondary)?'#1a1a1a':'#fff'}; padding:${Math.round(10*scale)}px ${Math.round(24*scale)}px; border-radius:${Math.round(20*scale)}px; font-size:${Math.round(18*scale)}px; font-weight:800; margin-top:${Math.round(8*scale)}px;">${ctaText}</div>` : ''}
        ${phone ? `<div style="font-size:${Math.round(20*scale)}px; font-weight:900; color:${secondary}; direction:ltr; margin-top:${Math.round(12*scale)}px;">${phone}</div>` : ''}
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
      <div style="position:absolute; bottom:${Math.round(24*scale)}px; left:50%; transform:translateX(-50%); text-align:center;">
        ${headline ? `<div style="font-size:${Math.round(36*scale)}px; font-weight:900; color:#fff; text-shadow:0 3px 12px rgba(0,0,0,0.8); margin-bottom:${Math.round(8*scale)}px;">${headline}</div>` : ''}
        ${businessName ? `<div style="font-size:${Math.round(18*scale)}px; font-weight:700; color:#fff; text-shadow:0 2px 8px rgba(0,0,0,0.7);">${businessName}</div>` : ''}
        ${phone ? `<div style="font-size:${Math.round(20*scale)}px; font-weight:900; color:${secondary}; direction:ltr; text-shadow:0 2px 8px rgba(0,0,0,0.5); margin-top:${Math.round(6*scale)}px;">${phone}</div>` : ''}
      </div>
      ${isRenderableImageUrl(config.logoUrl) ? `
        <div style="position:absolute; bottom:${Math.round(16*scale)}px; left:${Math.round(16*scale)}px;">
          <img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(50*scale)}px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5)); mix-blend-mode:multiply;" />
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
