/**
 * HTML/CSS-based text overlay system for professional Hebrew ad layouts.
 * V3 - Master Template only. All legacy layout styles removed.
 * Renders via the template engine (renderTemplate) with custom HTML templates from DB.
 */

import { toPng } from 'html-to-image';
import { renderTemplate, DEFAULT_TEMPLATE, type TemplateData } from './template-engine';
import { supabase } from '@/integrations/supabase/client';

// Only 'custom' is supported — all legacy styles removed
export type TextLayoutStyle = 'custom';

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
  customTemplateId?: string;
  customTemplateHtml?: string;
  headerFont?: string;
  kashrutLogo?: string;
}

// ─── Text utilities (kept — used by template data prep) ───

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

// ─── Layout builder (custom template ONLY) ───

/**
 * Strip the background image and heavy gradients from a template,
 * keeping only the text/grid overlay elements on a transparent background.
 */
function makeOverlayTransparent(html: string): string {
  // Remove the bg-img element entirely — the base image is already underneath
  let result = html.replace(/<img[^>]*class="bg-img"[^>]*>/gi, '');
  
  // Remove the gradient overlay that darkens the top (grad-top) — 
  // it obscures the AI visual. The headline text-shadow provides enough contrast.
  result = result.replace(/<div[^>]*class="grad-top"[^>]*><\/div>/gi, '');
  
  // Remove the logo from overlay — the AI visual already contains the logo.
  // This prevents duplicate logos in the final composite.
  result = result.replace(/<div[^>]*class="logo-in-bar"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Make the .ad container background transparent
  result = result.replace(
    /\.ad\s*\{([^}]*)\}/,
    (match, body) => `.ad {${body}; background: transparent !important; }`
  );
  
  return result;
}

function getLayoutHTML(config: TextOverlayConfig, width: number, height: number, imageUrl: string): string {
  if (!config.customTemplateHtml) {
    throw new Error('אין תבנית HTML מותאמת. יש להגדיר תבנית מאסטר ב-Back Office לפני יצירת מודעות.');
  }

  const cleanedServices = config.servicesList?.map(s => cleanText(s)).filter(Boolean) || [];
  const templateData: TemplateData = {
    headline: config.headline ? cleanText(config.headline) : '',
    subheadline: config.subtitle ? cleanText(config.subtitle) : '',
    subtitle: config.subtitle ? cleanText(config.subtitle) : '',
    bodyText: config.bodyText ? cleanText(config.bodyText) : '',
    ctaText: config.ctaText ? cleanText(config.ctaText) : '',
    businessName: config.businessName ? cleanText(config.businessName) : '',
    business_name: config.businessName ? cleanText(config.businessName) : '',
    phone: config.phone || '',
    whatsapp: config.whatsapp || '',
    email: config.email || '',
    address: config.address || '',
    address_list: config.address ? config.address.split(/[,،;]\s*/).filter(Boolean) : [],
    primaryColor: config.primaryColor || '#2BA5B5',
    brand_primary_color: config.primaryColor || '#2BA5B5',
    secondaryColor: config.secondaryColor || '#2A2F33',
    backgroundColor: config.backgroundColor || '#FFFFFF',
    brand_font_family: config.headerFont || 'Assistant',
    logoUrl: config.logoUrl || '',
    logo_url: config.logoUrl || '',
    kashrut_logo: config.kashrutLogo || '',
    services: cleanedServices,
    servicesList: cleanedServices,
    promoText: config.promoText || '',
    promo_text: config.promoText || '',
    promoValue: config.promoValue || '',
    imageUrl,
    image_url: imageUrl,
    width,
    height,
  };
  
  // Render the full template, then strip the bg image to create a transparent overlay
  const fullHtml = renderTemplate(config.customTemplateHtml, templateData);
  return makeOverlayTransparent(fullHtml);
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

  // Resolve template: config → DB global → hardcoded DEFAULT_TEMPLATE
  if (!config.customTemplateHtml) {
    console.log('[Overlay] No template in config, fetching global from DB...');
    const { data } = await supabase
      .from('ad_layout_templates')
      .select('html_template')
      .eq('is_active', true)
      .eq('is_global', true)
      .limit(1)
      .single();
    if (data?.html_template) {
      config = { ...config, customTemplateHtml: data.html_template };
      console.log('[Overlay] Using global DB template');
    } else {
      console.warn('[Overlay] No global template in DB — using hardcoded DEFAULT_TEMPLATE');
      config = { ...config, customTemplateHtml: DEFAULT_TEMPLATE };
    }
  }

  const { width, height } = await getImageDimensions(imageUrl);

  console.log('[Overlay] 📋 Rendering transparent overlay, size:', width, 'x', height);

  const html = getLayoutHTML(config, width, height, imageUrl);

  if (html.length < 50) {
    console.error('[Overlay] ❌ HTML is suspiciously short! Returning original image.');
    return imageUrl;
  }

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
    // Wait for any remaining images (logo, kashrut) to load
    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));

    await new Promise(r => setTimeout(r, 200));

    // Find the content element (skip <style> tags)
    let renderTarget: HTMLElement = container;
    const children = Array.from(container.children) as HTMLElement[];
    const contentEl = children.find(el => {
      const tag = el.tagName.toLowerCase();
      return tag !== 'link' && tag !== 'style' && tag !== 'script';
    });
    if (contentEl) renderTarget = contentEl;

    // Render the overlay as a transparent PNG
    const overlayDataUrl = await toPng(renderTarget, {
      width,
      height,
      pixelRatio: 1,
      cacheBust: true,
      skipFonts: true,
      backgroundColor: 'transparent',
    });

    console.log('[Overlay] ✅ Overlay PNG generated, compositing on base image...');

    // Composite: base image + transparent overlay
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Draw the base AI image first
    const baseImg = await loadImage(imageUrl);
    ctx.drawImage(baseImg, 0, 0, width, height);

    // Draw the transparent overlay on top
    const overlayImg = await loadImage(overlayDataUrl);
    ctx.drawImage(overlayImg, 0, 0, width, height);

    const finalDataUrl = canvas.toDataURL('image/png');
    console.log('[Overlay] ✅ Final composited image ready, length:', finalDataUrl.length);
    return finalDataUrl;
  } finally {
    document.body.removeChild(container);
  }
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

// ─── Apply with custom template from DB ───

let templateCache: Record<string, { html: string; fetchedAt: number }> = {};
const CACHE_TTL_MS = 60_000; // 1 minute

export async function applyCustomTemplate(
  imageUrl: string,
  templateId: string,
  config: Omit<TextOverlayConfig, 'layoutStyle' | 'customTemplateHtml' | 'customTemplateId'>
): Promise<string> {
  const cached = templateCache[templateId];
  const now = Date.now();

  if (!cached || (now - cached.fetchedAt) > CACHE_TTL_MS) {
    const { data, error } = await supabase
      .from('ad_layout_templates')
      .select('html_template')
      .eq('id', templateId)
      .single();
    if (error || !data) throw new Error('תבנית לא נמצאה');
    templateCache[templateId] = { html: (data as any).html_template, fetchedAt: now };
  }

  return applyHtmlTextOverlay(imageUrl, {
    ...config,
    layoutStyle: 'custom',
    customTemplateHtml: templateCache[templateId].html,
  });
}

export function clearTemplateCache() {
  templateCache = {};
}
