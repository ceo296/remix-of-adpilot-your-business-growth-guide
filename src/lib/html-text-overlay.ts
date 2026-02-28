/**
 * HTML/CSS-based text overlay system for professional Hebrew ad layouts.
 * Renders a hidden DOM element with CSS typography, then captures as image.
 */

import { toPng } from 'html-to-image';

export type TextLayoutStyle = 'classic-ad' | 'top-headline' | 'center-card' | 'minimal' | 'side-strip' | 'professional-ad' | 'magazine-blend' | 'brand-top';

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

/** Split long text into 2 lines if it exceeds maxChars per line */
function splitLongText(text: string, maxCharsPerLine: number = 40): string {
  if (!text || text.length <= maxCharsPerLine) return text;
  const mid = Math.floor(text.length / 2);
  let splitAt = -1;
  for (let i = 0; i <= 15; i++) {
    if (mid + i < text.length && text[mid + i] === ' ') { splitAt = mid + i; break; }
    if (mid - i >= 0 && text[mid - i] === ' ') { splitAt = mid - i; break; }
  }
  if (splitAt === -1) return text;
  return text.substring(0, splitAt) + '<br/>' + text.substring(splitAt + 1);
}

/** Check if a URL is a renderable image (not PDF/SVG data) */
function isRenderableImageUrl(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:application/pdf')) return false;
  if (url.startsWith('data:image/svg')) return false; // SVGs can be problematic in html-to-image
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

// ─── Magazine Blend Layout (matches Haredi newspaper ad reference grid) ───

function buildMagazineBlendHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);

  const headline = splitLongText((config.headline ? cleanText(config.headline) : '').slice(0, 56), 28);
  const subtitle = splitLongText((config.subtitle ? cleanText(config.subtitle) : '').slice(0, 72), 36);
  const bodyText = splitLongText((config.bodyText ? cleanText(config.bodyText) : '').slice(0, 200), 50);
  const businessName = (config.businessName ? cleanText(config.businessName) : '').slice(0, 34);
  const phone = config.phone || '';
  const email = config.email || '';
  const address = config.address || '';

  const scale = Math.min(width, height) / 1024;
  const headlineSize = Math.round(48 * scale);
  const subtitleSize = Math.round(24 * scale);
  const bodySize = Math.round(18 * scale);
  const phoneSize = Math.round(26 * scale);
  const nameSize = Math.round(16 * scale);

  const contactHeight = Math.round(height * 0.12);

  const logoHtml = isRenderableImageUrl(config.logoUrl) ? `
    <img src="${config.logoUrl}" crossorigin="anonymous"
         style="max-height:${Math.round(52 * scale)}px; max-width:${Math.round(130 * scale)}px; object-fit:contain; background:transparent; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5)); mix-blend-mode:multiply;" />` : '';

  // Services bar
  const servicesHtml = config.servicesList?.length ? `
    <div style="display:flex; align-items:center; justify-content:center; gap:${Math.round(14 * scale)}px; margin-top:${Math.round(10 * scale)}px;">
      ${config.servicesList.slice(0, 5).map(s => `
        <span style="color:rgba(255,255,255,0.95); font-size:${Math.round(14 * scale)}px; font-weight:700;
                     text-shadow:0 1px 4px rgba(0,0,0,0.5);">${cleanText(s)}</span>
      `).join(`<span style="color:rgba(255,255,255,0.4); font-size:${Math.round(12 * scale)}px;">|</span>`)}
    </div>` : '';

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      
      <!-- Full-bleed background image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />

      <!-- Full overlay gradient for text readability -->
      <div style="position:absolute; inset:0;
                  background:linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.1) 50%, ${hexToRgba(primary, 0.3)} 65%, ${hexToRgba(primary, 0.85)} 85%, ${hexToRgba(primary, 0.92)} 100%);
                  pointer-events:none; z-index:1;"></div>

      <!-- Main text content block — fills the ad vertically -->
      <div style="position:absolute; inset:0; bottom:${contactHeight}px; display:flex; flex-direction:column; justify-content:space-between; 
                  padding:${Math.round(28 * scale)}px ${Math.round(24 * scale)}px ${Math.round(20 * scale)}px; z-index:2;">
        
        <!-- Top section: Headline + Subtitle -->
        <div style="text-align:center;">
          ${headline ? `
            <div style="font-size:${headlineSize}px; font-weight:900; color:#fff; line-height:1.3; letter-spacing:-0.5px;
                        text-shadow:0 3px 16px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5);">
              ${headline}
            </div>
          ` : ''}
          ${subtitle ? `
            <div style="font-size:${subtitleSize}px; font-weight:600; color:rgba(255,255,255,0.95);
                        text-shadow:0 2px 10px rgba(0,0,0,0.6); line-height:1.4; margin-top:${Math.round(8 * scale)}px;">
              ${subtitle}
            </div>
          ` : ''}
        </div>

        <!-- Middle: empty space lets the visual breathe -->
        <div style="flex:1;"></div>

        <!-- Bottom section: Body text + services (above contact strip) -->
        <div style="text-align:center;">
          ${bodyText ? `
            <div style="font-size:${bodySize}px; font-weight:500; color:rgba(255,255,255,0.95);
                        text-shadow:0 1px 6px rgba(0,0,0,0.4); line-height:1.7; word-break:break-word;
                        max-width:${Math.round(width * 0.82)}px; margin:0 auto ${Math.round(8 * scale)}px;">
              ${bodyText}
            </div>
          ` : ''}
          ${servicesHtml}
        </div>
      </div>

      <!-- Contact strip — smooth gradient fade at bottom -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:${Math.round(contactHeight * 1.6)}px;
                  background:linear-gradient(180deg, transparent 0%, ${hexToRgba(primary, 0.6)} 35%, ${hexToRgba(primary, 0.92)} 70%, ${hexToRgba(primary, 0.95)} 100%);
                  display:grid; grid-template-columns:auto 1fr auto; align-items:end;
                  padding:0 ${Math.round(18 * scale)}px ${Math.round(10 * scale)}px; gap:${Math.round(12 * scale)}px; direction:ltr; z-index:3;">
        
        <!-- Logo — bottom left, no background -->
        <div style="display:flex; align-items:center; background:transparent;">${logoHtml}</div>

        <!-- Phone + details center -->
        <div style="text-align:center; direction:rtl;">
          ${phone ? `
            <div style="font-size:${phoneSize}px; font-weight:900; color:#fff; direction:ltr; letter-spacing:1px;
                        text-shadow:0 1px 4px rgba(0,0,0,0.3);">${phone}</div>
          ` : ''}
          ${address ? `<div style="font-size:${Math.round(11 * scale)}px; color:rgba(255,255,255,0.75); margin-top:${Math.round(1 * scale)}px;">${address}</div>` : ''}
          ${email ? `<div style="font-size:${Math.round(11 * scale)}px; color:rgba(255,255,255,0.75);">${email}</div>` : ''}
        </div>

        <!-- Business name — right side -->
        <div style="text-align:right; direction:rtl;">
          <div style="font-size:${nameSize}px; font-weight:800; color:#fff;">${businessName}</div>
        </div>
      </div>
    </div>
  `;
}

// ─── Brand Top Layout (headline overlaid on image with brand color accents) ───

function buildBrandTopHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';
  const darkText = '#1a2a3a';

  const headline = splitLongText((config.headline ? cleanText(config.headline) : '').slice(0, 56), 28);
  const subtitle = splitLongText((config.subtitle ? cleanText(config.subtitle) : '').slice(0, 72), 36);
  const bodyText = splitLongText((config.bodyText ? cleanText(config.bodyText) : '').slice(0, 160), 50);
  const businessName = (config.businessName ? cleanText(config.businessName) : '').slice(0, 34);
  const phone = config.phone || '';
  const email = config.email || '';
  const address = config.address || '';

  const scale = Math.min(width, height) / 1024;
  const headlineSize = Math.round(44 * scale);
  const subtitleSize = Math.round(22 * scale);
  const bodySize = Math.round(17 * scale);
  const phoneSize = Math.round(26 * scale);
  const nameSize = Math.round(14 * scale);

  const logoHtml = isRenderableImageUrl(config.logoUrl) ? `
    <img src="${config.logoUrl}" crossorigin="anonymous"
         style="max-height:${Math.round(48 * scale)}px; max-width:${Math.round(120 * scale)}px; object-fit:contain; background:transparent; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5)); mix-blend-mode:multiply;" />` : '';

  const contactStripHeight = Math.round(height * 0.12);
  // Text area in lower portion — semi-transparent brand background
  const textAreaHeight = Math.round(height * 0.32);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <!-- Full background image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />

      <!-- Full overlay gradient -->
      <div style="position:absolute; inset:0;
                  background:linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 35%, ${hexToRgba(primary, 0.25)} 60%, ${hexToRgba(primary, 0.88)} 85%, ${hexToRgba(primary, 0.95)} 100%);
                  pointer-events:none; z-index:1;"></div>

      <!-- Main text block — fills the ad -->
      <div style="position:absolute; inset:0; bottom:${contactStripHeight}px; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(24 * scale)}px ${Math.round(20 * scale)}px ${Math.round(16 * scale)}px; z-index:2;">
        
        <!-- Top: Headline badge + Subtitle -->
        <div style="text-align:center;">
          ${headline ? `
            <div style="display:inline-block; background:${hexToRgba(primary, 0.88)}; padding:${Math.round(12 * scale)}px ${Math.round(28 * scale)}px;
                        border-radius:${Math.round(6 * scale)}px;">
              <div style="font-size:${headlineSize}px; font-weight:900; color:${textOnPrimary}; line-height:1.3; letter-spacing:-0.5px;">
                ${headline}
              </div>
            </div>
          ` : ''}
          ${subtitle ? `
            <div style="font-size:${subtitleSize}px; font-weight:700; color:#fff;
                        text-shadow:0 2px 12px rgba(0,0,0,0.7); line-height:1.4; margin-top:${Math.round(10 * scale)}px;">
              ${subtitle}
            </div>
          ` : ''}
        </div>

        <!-- Middle spacer -->
        <div style="flex:1;"></div>

        <!-- Bottom: Body text -->
        ${bodyText ? `
          <div style="text-align:center; max-width:${Math.round(width * 0.82)}px; margin:0 auto ${Math.round(6 * scale)}px;">
            <div style="font-size:${bodySize}px; font-weight:500; color:rgba(255,255,255,0.95);
                        text-shadow:0 1px 6px rgba(0,0,0,0.4); line-height:1.7; word-break:break-word;">
              ${bodyText}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Contact strip — smooth gradient fade -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:${Math.round(height * 0.18)}px;
                  background:linear-gradient(180deg, transparent 0%, ${hexToRgba(primary, 0.6)} 30%, ${hexToRgba(primary, 0.92)} 65%, ${hexToRgba(primary, 0.95)} 100%);
                  display:grid; grid-template-columns:auto 1fr auto; align-items:end;
                  padding:0 ${Math.round(18 * scale)}px ${Math.round(10 * scale)}px; gap:${Math.round(12 * scale)}px; direction:ltr; z-index:3;">
        <div style="display:flex; align-items:center; background:transparent;">${logoHtml}</div>
        <div style="text-align:center; direction:rtl;">
          ${phone ? `<div style="font-size:${phoneSize}px; font-weight:900; color:${textOnPrimary}; direction:ltr; letter-spacing:1px;">${phone}</div>` : ''}
          ${address ? `<div style="font-size:${Math.round(11 * scale)}px; color:${hexToRgba(textOnPrimary === '#FFFFFF' ? '#fff' : '#000', 0.7)}; margin-top:${Math.round(2 * scale)}px;">${address}</div>` : ''}
        </div>
        <div style="text-align:right; direction:rtl;">
          <div style="font-size:${nameSize}px; font-weight:800; color:${textOnPrimary};">${businessName}</div>
        </div>
      </div>
    </div>
  `;
}

// ─── Professional Ad Layout ───

function buildProfessionalAdHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';

  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 28);
  const subtitle = splitLongText(config.subtitle ? cleanText(config.subtitle) : '', 36);
  const bodyText = splitLongText(config.bodyText ? cleanText(config.bodyText) : '', 50);
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';
  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const whatsapp = config.whatsapp || '';
  const address = config.address || '';
  const services = config.servicesList?.map(s => cleanText(s)).filter(Boolean) || [];

  const scale = Math.min(width, height) / 1024;

  const servicesHtml = services.length > 0 ? `
    <div style="display:flex; flex-wrap:wrap; gap:${Math.round(6*scale)}px; justify-content:center; margin-top:${Math.round(8*scale)}px;">
      ${services.map(s => `
        <span style="background:${hexToRgba(primary,0.2)}; color:#fff; padding:${Math.round(3*scale)}px ${Math.round(10*scale)}px; 
              border-radius:${Math.round(16*scale)}px; font-size:${Math.round(14*scale)}px; font-weight:600;
              border:1px solid ${hexToRgba('#fff',0.15)};">${s}</span>
      `).join('')}
    </div>` : '';

  const logoHtml = isRenderableImageUrl(config.logoUrl) ? `
    <img src="${config.logoUrl}" crossorigin="anonymous" 
         style="max-height:${Math.round(50*scale)}px; max-width:${Math.round(120*scale)}px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4)); mix-blend-mode:multiply;" />` : '';

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      <!-- Full gradient overlay -->
      <div style="position:absolute; inset:0;
                  background:linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 35%, ${hexToRgba(primary,0.2)} 55%, ${hexToRgba(primary,0.85)} 80%, ${hexToRgba(primary,0.95)} 100%);
                  pointer-events:none; z-index:1;"></div>

      <!-- Main text block — fills the ad -->
      <div style="position:absolute; inset:0; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(20*scale)}px ${Math.round(20*scale)}px 0; z-index:2;">
        
        <!-- Top: Headline + Subtitle -->
        <div style="text-align:center;">
          ${headline ? `
            <div style="font-size:${Math.round(46*scale)}px; font-weight:900; color:#fff; line-height:1.3; 
                 text-shadow:0 2px 16px rgba(0,0,0,0.8), 0 1px 6px rgba(0,0,0,0.6); letter-spacing:-0.5px;">
              ${headline}
            </div>
            ${subtitle ? `<div style="font-size:${Math.round(22*scale)}px; font-weight:600; color:rgba(255,255,255,0.95);
                 margin-top:${Math.round(6*scale)}px; text-shadow:0 2px 10px rgba(0,0,0,0.7);">${subtitle}</div>` : ''}
          ` : ''}
        </div>

        <!-- Middle spacer -->
        <div style="flex:1;"></div>

        <!-- Bottom: Body + Services + CTA -->
        <div style="text-align:center; padding-bottom:${Math.round(height*0.14)}px;">
          ${bodyText ? `<div style="font-size:${Math.round(18*scale)}px; font-weight:500; color:rgba(255,255,255,0.95);
               text-shadow:0 1px 6px rgba(0,0,0,0.4); line-height:1.7; word-break:break-word;
               max-width:${Math.round(width*0.8)}px; margin:0 auto ${Math.round(8*scale)}px;">${bodyText}</div>` : ''}
          ${servicesHtml}
          ${ctaText ? `
            <div style="margin-top:${Math.round(12*scale)}px;">
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

      <!-- Contact strip — smooth gradient fade -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:${Math.round(height*0.18)}px;
                  background:linear-gradient(180deg, transparent 0%, ${hexToRgba(primary,0.55)} 30%, ${hexToRgba(primary,0.9)} 65%, ${hexToRgba(primary,0.95)} 100%);
                  display:flex; align-items:end; justify-content:space-between; gap:${Math.round(10*scale)}px;
                  padding:0 ${Math.round(16*scale)}px ${Math.round(10*scale)}px; direction:ltr; z-index:3;">
        <div style="display:flex; align-items:center; gap:${Math.round(8*scale)}px; background:transparent;">
          ${logoHtml}
        </div>
        ${phone ? `<div style="font-size:${Math.round(20*scale)}px; font-weight:900; color:${secondary}; letter-spacing:1px; direction:ltr;">${phone}</div>` : ''}
        <div style="display:flex; align-items:center; gap:${Math.round(8*scale)}px;">
          <div style="font-size:${Math.round(18*scale)}px; font-weight:800; color:${textOnPrimary};">${businessName}</div>
        </div>
      </div>
    </div>
  `;
}

// ─── Classic Ad Layout ───

function buildClassicAdHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';
  const textOnSecondary = isLightColor(secondary) ? '#1a1a1a' : '#FFFFFF';

  const headline = splitLongText(config.headline ? cleanText(config.headline) : '', 28);
  const bodyText = splitLongText(config.bodyText ? cleanText(config.bodyText) : '', 50);
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';
  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const address = config.address || '';
  const whatsapp = config.whatsapp || '';
  const scale = Math.min(width, height) / 1024;

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      <!-- Full gradient overlay -->
      <div style="position:absolute; inset:0;
                  background:linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 35%, ${hexToRgba(primary,0.2)} 60%, ${hexToRgba(primary,0.88)} 85%, ${hexToRgba(primary,0.92)} 100%);
                  pointer-events:none; z-index:1;"></div>

      <!-- Main text block -->
      <div style="position:absolute; inset:0; display:flex; flex-direction:column; justify-content:space-between;
                  padding:${Math.round(28*scale)}px ${Math.round(24*scale)}px 0; z-index:2;">
        
        <!-- Top: Headline -->
        ${headline ? `
          <div style="text-align:center;">
            <div style="font-size:${Math.round(48*scale)}px; font-weight:900; color:#fff;
                 text-shadow:0 3px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5); line-height:1.3; letter-spacing:-0.5px;">
              ${headline}
            </div>
          </div>
        ` : '<div></div>'}

        <!-- Middle spacer -->
        <div style="flex:1;"></div>

        <!-- Bottom: Body + CTA -->
        <div style="text-align:center; padding-bottom:${Math.round(height*0.12)}px;">
          ${bodyText ? `
            <div style="font-size:${Math.round(20*scale)}px; font-weight:600; color:#fff;
                 text-shadow:0 2px 10px rgba(0,0,0,0.7); line-height:1.6; word-break:break-word;
                 max-width:${Math.round(width*0.8)}px; margin:0 auto ${Math.round(10*scale)}px;">
              ${bodyText}
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

      <!-- Contact strip — smooth gradient fade -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:${Math.round(height*0.18)}px; z-index:3;
                  background:linear-gradient(180deg, transparent 0%, ${hexToRgba(primary,0.55)} 30%, ${hexToRgba(primary,0.9)} 65%, ${hexToRgba(primary,0.95)} 100%);">
        <div style="position:absolute; bottom:0; left:0; right:0; padding:${Math.round(10*scale)}px ${Math.round(20*scale)}px;
                    display:flex; align-items:center; justify-content:space-between; direction:ltr;">
          ${isRenderableImageUrl(config.logoUrl) ? `
            <img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(42*scale)}px; max-width:${Math.round(100*scale)}px; object-fit:contain; background:transparent; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5)); mix-blend-mode:multiply;" />
          ` : '<div></div>'}
          ${phone ? `<div style="font-size:${Math.round(22*scale)}px; font-weight:900; color:${secondary}; direction:ltr;">${phone}</div>` : ''}
          <div style="font-size:${Math.round(20*scale)}px; font-weight:800; color:${textOnPrimary};">${businessName}</div>
        </div>
      </div>
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
        ${isRenderableImageUrl(config.logoUrl) ? `<img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(60*scale)}px; max-width:${Math.round(stripWidth*0.7)}px; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3)); mix-blend-mode:multiply;" />` : ''}
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
