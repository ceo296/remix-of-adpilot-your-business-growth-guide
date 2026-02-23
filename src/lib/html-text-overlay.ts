/**
 * HTML/CSS-based text overlay system for professional Hebrew ad layouts.
 * Renders a hidden DOM element with CSS typography, then captures as image.
 * 
 * This replaces the Canvas-based approach for much better:
 * - Hebrew font rendering (kerning, ligatures, RTL)
 * - CSS gradients, shadows, and blur effects
 * - Pixel-perfect layout with flexbox/grid
 * - Web font support (Google Fonts loaded natively)
 */

import { toPng } from 'html-to-image';

export type TextLayoutStyle = 'classic-ad' | 'top-headline' | 'center-card' | 'minimal' | 'side-strip' | 'professional-ad';

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

/** Strip markdown and AI field labels */
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

/** Build the HTML for a professional ad layout */
function buildProfessionalAdHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const primary = config.primaryColor || '#2BA5B5';
  const secondary = config.secondaryColor || darkenHex(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? '#1a1a1a' : '#FFFFFF';
  const textOnSecondary = isLightColor(secondary) ? '#1a1a1a' : '#FFFFFF';

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
  const headlineSize = Math.round(44 * scale);
  const subtitleSize = Math.round(22 * scale);
  const bodySize = Math.round(17 * scale);
  const ctaSize = Math.round(20 * scale);
  const nameSize = Math.round(18 * scale);
  const promoSize = Math.round(26 * scale);
  const serviceSize = Math.round(14 * scale);

  // Services pills
  const servicesHtml = services.length > 0 ? `
    <div style="display: flex; flex-wrap: wrap; gap: ${Math.round(6 * scale)}px; justify-content: center; margin-top: ${Math.round(8 * scale)}px;">
      ${services.map(s => `
        <span style="background: ${hexToRgba(primary, 0.2)}; color: #fff; 
              padding: ${Math.round(3 * scale)}px ${Math.round(10 * scale)}px; border-radius: ${Math.round(16 * scale)}px; 
              font-size: ${serviceSize}px; font-weight: 600;
              border: 1px solid ${hexToRgba('#fff', 0.15)};">${s}</span>
      `).join('')}
    </div>
  ` : '';

  // Promo badge
  const promoHtml = (promoText || promoValue) ? `
    <div style="display: flex; gap: ${Math.round(10 * scale)}px; justify-content: center; margin-top: ${Math.round(10 * scale)}px;">
      ${promoValue ? `
        <div style="background: ${secondary}; color: ${textOnSecondary}; padding: ${Math.round(6 * scale)}px ${Math.round(16 * scale)}px; 
             border-radius: ${Math.round(10 * scale)}px; font-size: ${promoSize}px; font-weight: 900; 
             box-shadow: 0 4px 12px ${hexToRgba(secondary, 0.4)};">
          ${promoValue}
        </div>
      ` : ''}
      ${promoText ? `
        <div style="background: ${hexToRgba('#000', 0.5)}; color: #fff; padding: ${Math.round(6 * scale)}px ${Math.round(14 * scale)}px; 
             border-radius: ${Math.round(10 * scale)}px; font-size: ${Math.round(16 * scale)}px; font-weight: 700;">
          ${promoText}
        </div>
      ` : ''}
    </div>
  ` : '';

  // Logo HTML — placed near contact strip, not at top
  const logoHtml = config.logoUrl ? `
    <img src="${config.logoUrl}" crossorigin="anonymous" 
         style="max-height: ${Math.round(50 * scale)}px; max-width: ${Math.round(120 * scale)}px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));" />
  ` : '';

  return `
    <div style="position: relative; width: ${width}px; height: ${height}px; direction: rtl; font-family: 'Heebo', 'Arial', sans-serif; overflow: hidden;">
      <!-- Background Image -->
      <img src="${imageUrl}" crossorigin="anonymous" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
      
      <!-- Subtle top vignette for headline readability -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: ${Math.round(height * 0.25)}px;
                  background: linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 60%, transparent 100%); pointer-events: none;"></div>

      <!-- Headline — floating with text shadow, no background band -->
      ${headline ? `
        <div style="position: absolute; top: ${Math.round(20 * scale)}px; left: ${Math.round(20 * scale)}px; right: ${Math.round(20 * scale)}px; text-align: center;">
          <div style="font-size: ${headlineSize}px; font-weight: 900; color: #fff; 
               line-height: 1.25; text-shadow: 0 2px 16px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5); letter-spacing: -0.5px;">
            ${headline}
          </div>
          ${subtitle ? `<div style="font-size: ${subtitleSize}px; font-weight: 600; color: rgba(255,255,255,0.9);
               margin-top: ${Math.round(4 * scale)}px; text-shadow: 0 1px 8px rgba(0,0,0,0.6);">${subtitle}</div>` : ''}
        </div>
      ` : ''}

      <!-- Bottom gradient for text integration -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: ${Math.round(height * 0.45)}px;
                  background: linear-gradient(0deg, ${hexToRgba(primary, 0.92)} 0%, ${hexToRgba(primary, 0.7)} 30%, ${hexToRgba(primary, 0.3)} 60%, transparent 100%); pointer-events: none;"></div>

      <!-- Body text + services — positioned in the gradient zone -->
      ${bodyText || services.length > 0 ? `
        <div style="position: absolute; bottom: ${Math.round(height * 0.18)}px; left: 50%; transform: translateX(-50%);
                    width: ${Math.round(width * 0.85)}px; text-align: center;">
          ${bodyText ? `<div style="font-size: ${bodySize}px; font-weight: 500; color: rgba(255,255,255,0.95);
               text-shadow: 0 1px 6px rgba(0,0,0,0.4); line-height: 1.6;
               max-width: ${Math.round(width * 0.75)}px; margin: 0 auto;">${bodyText}</div>` : ''}
          ${servicesHtml}
        </div>
      ` : ''}

      ${promoHtml ? `
        <div style="position: absolute; left: 50%; transform: translateX(-50%); bottom: ${Math.round(height * 0.14)}px;">
          ${promoHtml}
        </div>
      ` : ''}

      <!-- CTA Button -->
      ${ctaText ? `
        <div style="position: absolute; left: 50%; transform: translateX(-50%); bottom: ${Math.round(height * 0.08)}px;">
          <div style="background: linear-gradient(135deg, ${secondary}, ${darkenHex(secondary, 0.15)}); 
               color: ${textOnSecondary}; padding: ${Math.round(10 * scale)}px ${Math.round(32 * scale)}px; 
               border-radius: ${Math.round(26 * scale)}px; font-size: ${ctaSize}px; font-weight: 800; 
               box-shadow: 0 4px 16px ${hexToRgba(secondary, 0.5)}, 0 0 0 2px rgba(255,255,255,0.15);
               text-align: center;">
            ${ctaText}
          </div>
        </div>
      ` : ''}

      <!-- Contact strip with logo -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0;
                  background: ${hexToRgba(primary, 0.95)};
                  padding: ${Math.round(8 * scale)}px ${Math.round(16 * scale)}px;
                  display: flex; align-items: center; justify-content: space-between; gap: ${Math.round(10 * scale)}px;">
        <!-- Logo + Business name (right in RTL) -->
        <div style="display: flex; align-items: center; gap: ${Math.round(8 * scale)}px;">
          ${logoHtml}
          <div style="font-size: ${nameSize}px; font-weight: 800; color: ${textOnPrimary};">${businessName}</div>
        </div>
        <!-- Phone -->
        ${phone ? `<div style="font-size: ${Math.round(20 * scale)}px; font-weight: 900; color: ${secondary}; 
             letter-spacing: 1px; direction: ltr;">${phone}</div>` : ''}
        <!-- Address -->
        <div style="font-size: ${Math.round(13 * scale)}px; color: ${hexToRgba(textOnPrimary === '#FFFFFF' ? '#fff' : '#000', 0.7)}; font-weight: 500;">
          ${address || whatsapp || ''}
        </div>
      </div>
    </div>
  `;
}

/** Build classic ad HTML - headline floating at top, CTA above contact strip */
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
    <div style="position: relative; width: ${width}px; height: ${height}px; direction: rtl; font-family: 'Heebo', 'Arial', sans-serif; overflow: hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
      
      <!-- Top gradient + headline -->
      ${headline ? `
        <div style="position: absolute; top: 0; left: 0; right: 0; 
                    padding: ${Math.round(30 * scale)}px ${Math.round(24 * scale)}px ${Math.round(50 * scale)}px;
                    background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 70%, transparent 100%);">
          <div style="font-size: ${Math.round(48 * scale)}px; font-weight: 900; color: #fff; text-align: center;
               text-shadow: 0 3px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5); line-height: 1.2; letter-spacing: -0.5px;">
            ${headline}
          </div>
        </div>
      ` : ''}

      <!-- Body text in lower-middle -->
      ${bodyText ? `
        <div style="position: absolute; bottom: ${Math.round(height * 0.18)}px; left: 50%; transform: translateX(-50%); width: ${Math.round(width * 0.8)}px; text-align: center;">
          <div style="font-size: ${Math.round(20 * scale)}px; font-weight: 600; color: #fff;
               text-shadow: 0 2px 10px rgba(0,0,0,0.7); line-height: 1.5;">
            ${bodyText}
          </div>
        </div>
      ` : ''}

      <!-- CTA -->
      ${ctaText ? `
        <div style="position: absolute; left: 50%; transform: translateX(-50%); bottom: ${Math.round(height * 0.10)}px;">
          <div style="background: linear-gradient(135deg, ${secondary}, ${darkenHex(secondary, 0.15)});
               color: ${textOnSecondary}; padding: ${Math.round(12 * scale)}px ${Math.round(36 * scale)}px;
               border-radius: ${Math.round(30 * scale)}px; font-size: ${Math.round(22 * scale)}px; font-weight: 800;
               box-shadow: 0 6px 20px ${hexToRgba(secondary, 0.5)}, 0 0 0 2px rgba(255,255,255,0.2);">
            ${ctaText}
          </div>
        </div>
      ` : ''}

      <!-- Contact strip -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0;">
        <div style="height: ${Math.round(16 * scale)}px; background: linear-gradient(0deg, ${hexToRgba(primary, 0.92)}, transparent);"></div>
        <div style="height: 2px; background: ${secondary};"></div>
        <div style="background: ${hexToRgba(primary, 0.92)}; padding: ${Math.round(10 * scale)}px ${Math.round(20 * scale)}px;
                    display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: ${Math.round(20 * scale)}px; font-weight: 800; color: ${textOnPrimary};">${businessName}</div>
          ${phone ? `<div style="font-size: ${Math.round(22 * scale)}px; font-weight: 900; color: ${secondary}; direction: ltr;">${phone}</div>` : ''}
          <div style="font-size: ${Math.round(14 * scale)}px; color: ${hexToRgba(textOnPrimary === '#FFFFFF' ? '#fff' : '#000', 0.7)};">${address || whatsapp || ''}</div>
        </div>
      </div>

      ${config.logoUrl ? `
        <div style="position: absolute; bottom: ${Math.round(height * 0.08)}px; right: ${Math.round(20 * scale)}px;">
          <img src="${config.logoUrl}" crossorigin="anonymous" style="max-height: ${Math.round(50 * scale)}px; max-width: ${Math.round(120 * scale)}px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));" />
        </div>
      ` : ''}
    </div>
  `;
}

/** Build side strip layout */
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
    <div style="position: relative; width: ${width}px; height: ${height}px; direction: rtl; font-family: 'Heebo', 'Arial', sans-serif; overflow: hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
      
      <!-- Side strip with fade -->
      <div style="position: absolute; top: 0; right: 0; width: ${stripWidth + Math.round(width * 0.08)}px; height: 100%;
                  background: linear-gradient(270deg, ${hexToRgba(primary, 0.9)} ${Math.round((stripWidth / (stripWidth + width * 0.08)) * 100)}%, transparent 100%);">
      </div>
      
      <!-- Accent line -->
      <div style="position: absolute; top: 0; right: ${stripWidth}px; width: 3px; height: 100%; background: ${secondary};"></div>
      
      <!-- Strip content -->
      <div style="position: absolute; top: 0; right: 0; width: ${stripWidth}px; height: 100%; 
                  display: flex; flex-direction: column; align-items: center; justify-content: center; 
                  padding: ${Math.round(24 * scale)}px; gap: ${Math.round(16 * scale)}px; text-align: center;">
        ${config.logoUrl ? `<img src="${config.logoUrl}" crossorigin="anonymous" style="max-height: ${Math.round(60 * scale)}px; max-width: ${Math.round(stripWidth * 0.7)}px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />` : ''}
        ${businessName ? `<div style="font-size: ${Math.round(32 * scale)}px; font-weight: 900; color: ${textOnPrimary};">${businessName}</div>` : ''}
        <div style="width: 60%; height: 3px; background: ${secondary};"></div>
        ${headline ? `<div style="font-size: ${Math.round(26 * scale)}px; font-weight: 900; color: ${textOnPrimary}; line-height: 1.3;">${headline}</div>` : ''}
        ${bodyText ? `<div style="font-size: ${Math.round(16 * scale)}px; font-weight: 500; color: ${subColor}; line-height: 1.5;">${bodyText}</div>` : ''}
        ${ctaText ? `<div style="background: ${secondary}; color: ${isLightColor(secondary) ? '#1a1a1a' : '#fff'}; padding: ${Math.round(10 * scale)}px ${Math.round(24 * scale)}px; border-radius: ${Math.round(20 * scale)}px; font-size: ${Math.round(18 * scale)}px; font-weight: 800; margin-top: ${Math.round(8 * scale)}px;">${ctaText}</div>` : ''}
        ${phone ? `<div style="font-size: ${Math.round(20 * scale)}px; font-weight: 900; color: ${secondary}; direction: ltr; margin-top: ${Math.round(12 * scale)}px;">${phone}</div>` : ''}
      </div>
    </div>
  `;
}

/** Build minimal layout */
function buildMinimalHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const secondary = config.secondaryColor || darkenHex(config.primaryColor || '#2BA5B5', 0.3);
  const headline = config.headline ? cleanText(config.headline) : '';
  const businessName = config.businessName ? cleanText(config.businessName) : '';
  const phone = config.phone || '';
  const scale = Math.min(width, height) / 1024;

  return `
    <div style="position: relative; width: ${width}px; height: ${height}px; direction: rtl; font-family: 'Heebo', 'Arial', sans-serif; overflow: hidden;">
      <img src="${imageUrl}" crossorigin="anonymous" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
      
      <!-- Minimal bottom text -->
      <div style="position: absolute; bottom: ${Math.round(24 * scale)}px; left: 50%; transform: translateX(-50%); text-align: center;">
        ${headline ? `<div style="font-size: ${Math.round(36 * scale)}px; font-weight: 900; color: #fff; text-shadow: 0 3px 12px rgba(0,0,0,0.8); margin-bottom: ${Math.round(8 * scale)}px;">${headline}</div>` : ''}
        ${businessName ? `<div style="font-size: ${Math.round(18 * scale)}px; font-weight: 700; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.7);">${businessName}</div>` : ''}
        ${phone ? `<div style="font-size: ${Math.round(20 * scale)}px; font-weight: 900; color: ${secondary}; direction: ltr; text-shadow: 0 2px 8px rgba(0,0,0,0.5); margin-top: ${Math.round(6 * scale)}px;">${phone}</div>` : ''}
      </div>

      ${config.logoUrl ? `
        <div style="position: absolute; top: ${Math.round(16 * scale)}px; right: ${Math.round(16 * scale)}px;">
          <img src="${config.logoUrl}" crossorigin="anonymous" style="max-height: ${Math.round(50 * scale)}px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));" />
        </div>
      ` : ''}
    </div>
  `;
}

/** Select layout builder based on style */
function getLayoutHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  const style = config.layoutStyle || 'classic-ad';
  switch (style) {
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

/** 
 * Load an image and return its natural dimensions.
 */
function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Applies HTML/CSS text overlay on top of an AI-generated image.
 * Creates a hidden DOM element, renders it, and captures as PNG.
 */
export async function applyHtmlTextOverlay(
  imageUrl: string,
  config: TextOverlayConfig
): Promise<string> {
  const { headline, bodyText, ctaText, businessName, phone } = config;
  if (!headline && !businessName && !phone && !bodyText) return imageUrl;

  // Get image dimensions
  const { width, height } = await getImageDimensions(imageUrl);

  // Build HTML
  const html = getLayoutHTML(config, width, height, imageUrl);

  // Create hidden container
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
    // Wait for images to load inside the container
    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Don't fail on broken images
      });
    }));

    // Small delay for rendering
    await new Promise(r => setTimeout(r, 100));

    // Capture as PNG
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
