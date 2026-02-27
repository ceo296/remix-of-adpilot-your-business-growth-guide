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
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';
  const darkText = '#1a2a3a';

  const headline = (config.headline ? cleanText(config.headline) : '').slice(0, 56);
  const subtitle = (config.subtitle ? cleanText(config.subtitle) : '').slice(0, 72);
  const bodyText = (config.bodyText ? cleanText(config.bodyText) : '').slice(0, 120);
  const businessName = (config.businessName ? cleanText(config.businessName) : '').slice(0, 34);
  const phone = config.phone || '';
  const email = config.email || '';
  const address = config.address || '';

  const scale = Math.min(width, height) / 1024;
  const headlineSize = Math.round(46 * scale);
  const subtitleSize = Math.round(26 * scale);
  const bodySize = Math.round(18 * scale);
  const phoneSize = Math.round(28 * scale);
  const nameSize = Math.round(14 * scale);
  const labelSize = Math.round(13 * scale);

  // Photo occupies ~52% top, text area below
  const photoHeight = Math.round(height * 0.52);
  const textAreaHeight = height - photoHeight;

  const logoHtml = config.logoUrl ? `
    <img src="${config.logoUrl}" crossorigin="anonymous"
         style="max-height:${Math.round(52 * scale)}px; max-width:${Math.round(130 * scale)}px; object-fit:contain;" />` : '';

  // Services/social proof bar
  const servicesHtml = config.servicesList?.length ? `
    <div style="background:${primary}; padding:${Math.round(7 * scale)}px ${Math.round(16 * scale)}px;
                display:flex; align-items:center; justify-content:center; gap:${Math.round(16 * scale)}px;">
      ${config.servicesList.slice(0, 4).map(s => `
        <span style="color:#fff; font-size:${Math.round(14 * scale)}px; font-weight:700;">${cleanText(s)}</span>
      `).join(`<span style="color:rgba(255,255,255,0.5); font-size:${Math.round(12 * scale)}px;">|</span>`)}
    </div>` : '';

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden; background:#fff;">
      
      <!-- Photo area — top portion -->
      <div style="position:relative; width:100%; height:${photoHeight}px; overflow:hidden;">
        <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
        <!-- Soft bottom fade to white -->
        <div style="position:absolute; bottom:0; left:0; right:0; height:${Math.round(photoHeight * 0.18)}px;
                    background:linear-gradient(0deg, #fff 0%, transparent 100%); pointer-events:none;"></div>
      </div>

      <!-- Text area — below photo -->
      <div style="position:absolute; top:${photoHeight}px; left:0; right:0; bottom:0;
                  display:flex; flex-direction:column; background:#fff;">
        
        <!-- Headline block -->
        ${headline ? `
          <div style="padding:${Math.round(14 * scale)}px ${Math.round(24 * scale)}px ${Math.round(8 * scale)}px; text-align:center;">
            <div style="font-size:${headlineSize}px; font-weight:900; color:${primary}; line-height:1.2; letter-spacing:-0.5px;">
              ${headline}
            </div>
          </div>
        ` : ''}

        <!-- Subtitle in brand color -->
        ${subtitle ? `
          <div style="padding:${Math.round(2 * scale)}px ${Math.round(28 * scale)}px ${Math.round(6 * scale)}px; text-align:center;">
            <div style="font-size:${subtitleSize}px; font-weight:700; color:${primary}; line-height:1.35;">
              ${subtitle}
            </div>
          </div>
        ` : ''}

        <!-- Body text -->
        ${bodyText ? `
          <div style="padding:${Math.round(4 * scale)}px ${Math.round(32 * scale)}px ${Math.round(8 * scale)}px; text-align:center;">
            <div style="font-size:${bodySize}px; font-weight:500; color:#444; line-height:1.55;">
              ${bodyText}
            </div>
          </div>
        ` : ''}

        <!-- Services / social proof accent bar -->
        ${servicesHtml}

        <!-- Spacer to push contact to bottom -->
        <div style="flex:1;"></div>

        <!-- Contact strip — brand colored background -->
        <div style="background:${hexToRgba(primary, 0.08)}; border-top:2px solid ${primary};
                    padding:${Math.round(10 * scale)}px ${Math.round(18 * scale)}px;
                    display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:${Math.round(12 * scale)}px; direction:ltr;">
          
          <!-- Logo — bottom left -->
          <div style="display:flex; align-items:center;">${logoHtml}</div>

          <!-- Phone prominent center -->
          <div style="text-align:center; direction:rtl;">
            ${phone ? `
              <div style="font-size:${labelSize}px; color:${primary}; font-weight:600;">חייגו עוד היום:</div>
              <div style="font-size:${phoneSize}px; font-weight:900; color:${darkText}; direction:ltr; letter-spacing:1px;">${phone}</div>
            ` : ''}
            ${address ? `<div style="font-size:${Math.round(11 * scale)}px; color:#666; margin-top:${Math.round(2 * scale)}px;">${address}</div>` : ''}
            ${email ? `<div style="font-size:${Math.round(11 * scale)}px; color:#666;">${email}</div>` : ''}
          </div>

          <!-- Business name — right side -->
          <div style="text-align:right; direction:rtl;">
            <div style="font-size:${nameSize}px; font-weight:800; color:${primary};">${businessName}</div>
          </div>
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

  const headline = (config.headline ? cleanText(config.headline) : '').slice(0, 56);
  const subtitle = (config.subtitle ? cleanText(config.subtitle) : '').slice(0, 72);
  const bodyText = (config.bodyText ? cleanText(config.bodyText) : '').slice(0, 120);
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

  const logoHtml = config.logoUrl ? `
    <img src="${config.logoUrl}" crossorigin="anonymous"
         style="max-height:${Math.round(48 * scale)}px; max-width:${Math.round(120 * scale)}px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3));" />` : '';

  // Contact strip at bottom — brand colored
  const contactStripHeight = Math.round(height * 0.12);
  // Text area in lower portion — semi-transparent brand background
  const textAreaHeight = Math.round(height * 0.32);

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <!-- Full background image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />

      <!-- Headline overlaid on image — top area with brand color -->
      ${headline ? `
        <div style="position:absolute; top:${Math.round(24 * scale)}px; left:${Math.round(20 * scale)}px; right:${Math.round(20 * scale)}px; text-align:center; z-index:2;">
          <div style="display:inline-block; background:${hexToRgba(primary, 0.88)}; padding:${Math.round(12 * scale)}px ${Math.round(28 * scale)}px;
                      border-radius:${Math.round(6 * scale)}px;">
            <div style="font-size:${headlineSize}px; font-weight:900; color:${textOnPrimary}; line-height:1.25; letter-spacing:-0.5px;">
              ${headline}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Subtitle — below headline, also on image -->
      ${subtitle ? `
        <div style="position:absolute; top:${Math.round(90 * scale)}px; left:${Math.round(24 * scale)}px; right:${Math.round(24 * scale)}px; text-align:center; z-index:2;">
          <div style="font-size:${subtitleSize}px; font-weight:700; color:#fff;
                      text-shadow:0 2px 12px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5); line-height:1.35;">
            ${subtitle}
          </div>
        </div>
      ` : ''}

      <!-- Bottom gradient for text area -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:${textAreaHeight + contactStripHeight}px;
                  background:linear-gradient(0deg, ${hexToRgba(primary, 0.92)} 0%, ${hexToRgba(primary, 0.7)} 40%, ${hexToRgba(primary, 0.2)} 75%, transparent 100%);
                  pointer-events:none; z-index:1;"></div>

      <!-- Body text in lower portion -->
      ${bodyText ? `
        <div style="position:absolute; bottom:${contactStripHeight + Math.round(16 * scale)}px; left:${Math.round(24 * scale)}px; right:${Math.round(24 * scale)}px;
                    text-align:center; z-index:2;">
          <div style="font-size:${bodySize}px; font-weight:500; color:rgba(255,255,255,0.95);
                      text-shadow:0 1px 6px rgba(0,0,0,0.4); line-height:1.55;">
            ${bodyText}
          </div>
        </div>
      ` : ''}

      <!-- Contact strip at bottom -->
      <div style="position:absolute; bottom:0; left:0; right:0; background:${hexToRgba(primary, 0.95)};
                  padding:${Math.round(10 * scale)}px ${Math.round(18 * scale)}px;
                  display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:${Math.round(12 * scale)}px; direction:ltr; z-index:3;">
        <div style="display:flex; align-items:center;">${logoHtml}</div>
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

  const headline = config.headline ? cleanText(config.headline) : '';
  const subtitle = config.subtitle ? cleanText(config.subtitle) : '';
  const bodyText = config.bodyText ? cleanText(config.bodyText) : '';
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

  const logoHtml = config.logoUrl ? `
    <img src="${config.logoUrl}" crossorigin="anonymous" 
         style="max-height:${Math.round(50*scale)}px; max-width:${Math.round(120*scale)}px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4));" />` : '';

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      <!-- Stronger top gradient for headline readability -->
      <div style="position:absolute; top:0; left:0; right:0; height:${Math.round(height*0.28)}px;
                  background:linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.05) 85%, transparent 100%); pointer-events:none;"></div>

      ${headline ? `
        <div style="position:absolute; top:${Math.round(20*scale)}px; left:${Math.round(20*scale)}px; right:${Math.round(20*scale)}px; text-align:center;">
          <div style="font-size:${Math.round(44*scale)}px; font-weight:900; color:#fff; line-height:1.25; 
               text-shadow:0 2px 16px rgba(0,0,0,0.8), 0 1px 6px rgba(0,0,0,0.6); letter-spacing:-0.5px;">
            ${headline}
          </div>
          ${subtitle ? `<div style="font-size:${Math.round(22*scale)}px; font-weight:600; color:rgba(255,255,255,0.95);
               margin-top:${Math.round(4*scale)}px; text-shadow:0 2px 10px rgba(0,0,0,0.7);">${subtitle}</div>` : ''}
        </div>
      ` : ''}

      <div style="position:absolute; bottom:0; left:0; right:0; height:${Math.round(height*0.45)}px;
                  background:linear-gradient(0deg, ${hexToRgba(primary,0.92)} 0%, ${hexToRgba(primary,0.7)} 30%, ${hexToRgba(primary,0.3)} 60%, transparent 100%); pointer-events:none;"></div>

      ${bodyText || services.length > 0 ? `
        <div style="position:absolute; bottom:${Math.round(height*0.18)}px; left:50%; transform:translateX(-50%);
                    width:${Math.round(width*0.85)}px; text-align:center;">
          ${bodyText ? `<div style="font-size:${Math.round(17*scale)}px; font-weight:500; color:rgba(255,255,255,0.95);
               text-shadow:0 1px 6px rgba(0,0,0,0.4); line-height:1.6;
               max-width:${Math.round(width*0.75)}px; margin:0 auto;">${bodyText}</div>` : ''}
          ${servicesHtml}
        </div>
      ` : ''}

      ${ctaText ? `
        <div style="position:absolute; left:50%; transform:translateX(-50%); bottom:${Math.round(height*0.08)}px;">
          <div style="background:linear-gradient(135deg, ${secondary}, ${darkenHex(secondary,0.15)}); 
               color:${isLightColor(secondary)?'#1a1a1a':'#FFFFFF'}; padding:${Math.round(10*scale)}px ${Math.round(32*scale)}px; 
               border-radius:${Math.round(26*scale)}px; font-size:${Math.round(20*scale)}px; font-weight:800; 
               box-shadow:0 4px 16px ${hexToRgba(secondary,0.5)}, 0 0 0 2px rgba(255,255,255,0.15);">
            ${ctaText}
          </div>
        </div>
      ` : ''}

      <!-- Contact strip — logo always bottom-left -->
      <div style="position:absolute; bottom:0; left:0; right:0; background:${hexToRgba(primary,0.95)};
                  padding:${Math.round(8*scale)}px ${Math.round(16*scale)}px;
                  display:flex; align-items:center; justify-content:space-between; gap:${Math.round(10*scale)}px; direction:ltr;">
        <div style="display:flex; align-items:center; gap:${Math.round(8*scale)}px;">
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

  const headline = config.headline ? cleanText(config.headline) : '';
  const bodyText = config.bodyText ? cleanText(config.bodyText) : '';
  const ctaText = config.ctaText ? cleanText(config.ctaText) : '';
  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const address = config.address || '';
  const whatsapp = config.whatsapp || '';
  const scale = Math.min(width, height) / 1024;

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      ${headline ? `
        <div style="position:absolute; top:0; left:0; right:0; 
                    padding:${Math.round(30*scale)}px ${Math.round(24*scale)}px ${Math.round(50*scale)}px;
                    background:linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 70%, transparent 100%);">
          <div style="font-size:${Math.round(48*scale)}px; font-weight:900; color:#fff; text-align:center;
               text-shadow:0 3px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5); line-height:1.2; letter-spacing:-0.5px;">
            ${headline}
          </div>
        </div>
      ` : ''}

      ${bodyText ? `
        <div style="position:absolute; bottom:${Math.round(height*0.18)}px; left:50%; transform:translateX(-50%); width:${Math.round(width*0.8)}px; text-align:center;">
          <div style="font-size:${Math.round(20*scale)}px; font-weight:600; color:#fff;
               text-shadow:0 2px 10px rgba(0,0,0,0.7); line-height:1.5;">
            ${bodyText}
          </div>
        </div>
      ` : ''}

      ${ctaText ? `
        <div style="position:absolute; left:50%; transform:translateX(-50%); bottom:${Math.round(height*0.10)}px;">
          <div style="background:linear-gradient(135deg, ${secondary}, ${darkenHex(secondary,0.15)});
               color:${textOnSecondary}; padding:${Math.round(12*scale)}px ${Math.round(36*scale)}px;
               border-radius:${Math.round(30*scale)}px; font-size:${Math.round(22*scale)}px; font-weight:800;
               box-shadow:0 6px 20px ${hexToRgba(secondary,0.5)}, 0 0 0 2px rgba(255,255,255,0.2);">
            ${ctaText}
          </div>
        </div>
      ` : ''}

      <div style="position:absolute; bottom:0; left:0; right:0;">
        <div style="height:2px; background:${secondary};"></div>
        <div style="background:${hexToRgba(primary,0.92)}; padding:${Math.round(10*scale)}px ${Math.round(20*scale)}px;
                    display:flex; align-items:center; justify-content:space-between;">
        <div style="font-size:${Math.round(20*scale)}px; font-weight:800; color:${textOnPrimary};">${businessName}</div>
          ${phone ? `<div style="font-size:${Math.round(22*scale)}px; font-weight:900; color:${secondary}; direction:ltr;">${phone}</div>` : ''}
          <div style="font-size:${Math.round(14*scale)}px; color:${hexToRgba(textOnPrimary==='#FFFFFF'?'#fff':'#000',0.7)};">${address || whatsapp || ''}</div>
        </div>
      </div>

      ${config.logoUrl ? `
        <div style="position:absolute; bottom:${Math.round(height*0.08)}px; left:${Math.round(20*scale)}px;">
          <img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(50*scale)}px; max-width:${Math.round(120*scale)}px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4));" />
        </div>
      ` : ''}
    </div>
  `;
}

// ─── Side Strip Layout ───

function buildSideStripHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';
  const subColor = isLightColor(primary) ? '#444' : '#d0d0d0';

  const headline = config.headline ? cleanText(config.headline) : '';
  const bodyText = config.bodyText ? cleanText(config.bodyText) : '';
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
        ${config.logoUrl ? `<img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(60*scale)}px; max-width:${Math.round(stripWidth*0.7)}px; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />` : ''}
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
  const headline = config.headline ? cleanText(config.headline) : '';
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
      ${config.logoUrl ? `
        <div style="position:absolute; bottom:${Math.round(16*scale)}px; left:${Math.round(16*scale)}px;">
          <img src="${config.logoUrl}" crossorigin="anonymous" style="max-height:${Math.round(50*scale)}px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));" />
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
