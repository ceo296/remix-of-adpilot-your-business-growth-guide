/**
 * HTML/CSS-based text overlay system for professional Hebrew ad layouts.
 * Renders a hidden DOM element with CSS typography, then captures as image.
 */

import { toPng } from 'html-to-image';

export type TextLayoutStyle = 'classic-ad' | 'top-headline' | 'center-card' | 'minimal' | 'side-strip' | 'professional-ad' | 'magazine-blend';

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

// ─── Magazine Blend Layout (closest to professional reference) ───

function buildMagazineBlendHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
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
  const promoText = config.promoText ? cleanText(config.promoText) : '';
  const promoValue = config.promoValue ? cleanText(config.promoValue) : '';

  const scale = Math.min(width, height) / 1024;
  const headlineSize = Math.round(48 * scale);
  const subtitleSize = Math.round(22 * scale);
  const bodySize = Math.round(16 * scale);
  const ctaSize = Math.round(20 * scale);
  const nameSize = Math.round(16 * scale);
  const phoneSize = Math.round(22 * scale);
  const serviceSize = Math.round(13 * scale);

  // Decorative wave SVG path for organic bottom transition
  const waveHeight = Math.round(60 * scale);
  const bottomZoneHeight = Math.round(height * 0.28);
  const waveY = height - bottomZoneHeight - waveHeight;

  const waveSvg = `
    <svg style="position:absolute; left:0; top:${waveY}px; width:100%; height:${waveHeight + 4}px;" viewBox="0 0 ${width} ${waveHeight}" preserveAspectRatio="none">
      <path d="M0,${waveHeight} C${Math.round(width*0.25)},${Math.round(waveHeight*0.1)} ${Math.round(width*0.5)},${Math.round(waveHeight*0.8)} ${width},${Math.round(waveHeight*0.2)} L${width},${waveHeight} L0,${waveHeight} Z" 
            fill="${primary}" opacity="0.92"/>
    </svg>`;

  // Services pills
  const servicesHtml = services.length > 0 ? `
    <div style="display:flex; flex-wrap:wrap; gap:${Math.round(5*scale)}px; justify-content:center; margin-top:${Math.round(6*scale)}px;">
      ${services.map(s => `
        <span style="background:${hexToRgba('#fff',0.15)}; color:#fff; padding:${Math.round(2*scale)}px ${Math.round(10*scale)}px; 
              border-radius:${Math.round(14*scale)}px; font-size:${serviceSize}px; font-weight:600;
              border:1px solid ${hexToRgba('#fff',0.2)};">${s}</span>
      `).join('')}
    </div>` : '';

  // Promo badge (floating above the wave)
  const promoHtml = (promoText || promoValue) ? `
    <div style="position:absolute; left:50%; transform:translateX(-50%); top:${waveY - Math.round(30*scale)}px; z-index:5;
                display:flex; gap:${Math.round(8*scale)}px; align-items:center;">
      ${promoValue ? `<div style="background:${secondary}; color:${isLightColor(secondary)?'#1a1a1a':'#fff'}; 
           padding:${Math.round(8*scale)}px ${Math.round(20*scale)}px; border-radius:${Math.round(12*scale)}px; 
           font-size:${Math.round(28*scale)}px; font-weight:900; 
           box-shadow:0 4px 16px ${hexToRgba(secondary,0.5)};">${promoValue}</div>` : ''}
      ${promoText ? `<div style="background:${hexToRgba('#000',0.6)}; color:#fff; 
           padding:${Math.round(6*scale)}px ${Math.round(14*scale)}px; border-radius:${Math.round(10*scale)}px; 
           font-size:${Math.round(16*scale)}px; font-weight:700;">${promoText}</div>` : ''}
    </div>` : '';

  const logoHtml = config.logoUrl ? `
    <img src="${config.logoUrl}" crossorigin="anonymous" 
         style="max-height:${Math.round(45*scale)}px; max-width:${Math.round(100*scale)}px; object-fit:contain; 
                filter:drop-shadow(0 1px 4px rgba(0,0,0,0.3));" />` : '';

  return `
    <div style="position:relative; width:${width}px; height:${height}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
      <!-- Background Image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" />
      
      <!-- Top gradient overlay for headline readability -->
      <div style="position:absolute; top:0; left:0; right:0; height:${Math.round(height*0.28)}px;
                  background:linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.05) 85%, transparent 100%); pointer-events:none;"></div>

      <!-- Headline — always on top gradient background -->
      ${headline ? `
        <div style="position:absolute; top:${Math.round(20*scale)}px; left:${Math.round(24*scale)}px; right:${Math.round(24*scale)}px; text-align:center; z-index:3;">
          <div style="font-size:${headlineSize}px; font-weight:900; color:#fff; line-height:1.2; letter-spacing:-0.5px;
               text-shadow: 0 0 30px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.7), 0 0 60px rgba(0,0,0,0.5);">
            ${headline}
          </div>
          ${subtitle ? `<div style="font-size:${subtitleSize}px; font-weight:600; color:rgba(255,255,255,0.95); margin-top:${Math.round(6*scale)}px;
               text-shadow:0 2px 10px rgba(0,0,0,0.7);">${subtitle}</div>` : ''}
        </div>
      ` : ''}

      ${promoHtml}

      <!-- Decorative wave transition -->
      ${waveSvg}

      <!-- Bottom brand zone -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:${bottomZoneHeight}px; background:${hexToRgba(primary,0.92)}; z-index:2;">
        
        <!-- Body text + services inside the brand zone -->
        <div style="padding:${Math.round(16*scale)}px ${Math.round(24*scale)}px ${Math.round(8*scale)}px; text-align:center;">
          ${bodyText ? `<div style="font-size:${bodySize}px; font-weight:500; color:rgba(255,255,255,0.9); line-height:1.6;
               max-width:${Math.round(width*0.8)}px; margin:0 auto;">${bodyText}</div>` : ''}
          ${servicesHtml}
        </div>

        <!-- CTA Button -->
        ${ctaText ? `
          <div style="text-align:center; margin-top:${Math.round(6*scale)}px;">
            <span style="display:inline-block; background:linear-gradient(135deg, ${secondary}, ${darkenHex(secondary,0.15)}); 
                 color:${isLightColor(secondary)?'#1a1a1a':'#fff'}; padding:${Math.round(8*scale)}px ${Math.round(28*scale)}px; 
                 border-radius:${Math.round(24*scale)}px; font-size:${ctaSize}px; font-weight:800;
                 box-shadow:0 4px 14px ${hexToRgba(secondary,0.4)}, inset 0 1px 0 rgba(255,255,255,0.2);">
              ${ctaText}
            </span>
          </div>
        ` : ''}

        <!-- Contact strip at very bottom — logo always bottom-left -->
        <div style="position:absolute; bottom:0; left:0; right:0; padding:${Math.round(8*scale)}px ${Math.round(16*scale)}px;
                    display:flex; align-items:center; justify-content:space-between; gap:${Math.round(8*scale)}px;
                    border-top:1px solid ${hexToRgba('#fff',0.12)}; direction:ltr;">
          <div style="display:flex; align-items:center; gap:${Math.round(6*scale)}px;">
            ${logoHtml}
          </div>
          ${phone ? `<div style="font-size:${phoneSize}px; font-weight:900; color:${secondary}; direction:ltr; letter-spacing:0.5px;">${phone}</div>` : ''}
          <div style="display:flex; align-items:center; gap:${Math.round(6*scale)}px;">
            <div style="font-size:${nameSize}px; font-weight:800; color:${textOnPrimary};">${businessName}</div>
          </div>
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
