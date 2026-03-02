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
  return renderTemplate(config.customTemplateHtml, templateData);
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

  // ─── DEBUG: Log template data being sent ───
  const debugTemplateData = {
    headline: config.headline ? cleanText(config.headline).substring(0, 50) : '(empty)',
    subtitle: config.subtitle ? cleanText(config.subtitle).substring(0, 50) : '(empty)',
    bodyText: config.bodyText ? cleanText(config.bodyText).substring(0, 50) : '(empty)',
    ctaText: config.ctaText || '(empty)',
    businessName: config.businessName || '(empty)',
    phone: config.phone || '(empty)',
    logoUrl: config.logoUrl ? config.logoUrl.substring(0, 60) + '...' : '(empty)',
    primaryColor: config.primaryColor || '(empty)',
    imageUrl_prefix: imageUrl.substring(0, 80),
    templateSource: config.customTemplateHtml ? 'config/DB' : 'DEFAULT_TEMPLATE',
    templateLength: config.customTemplateHtml?.length || 0,
  };
  console.log('[Overlay] 📋 Template Input Data:', JSON.stringify(debugTemplateData, null, 2));

  const html = getLayoutHTML(config, width, height, imageUrl);

  // ─── DEBUG: Check rendered HTML for key elements ───
  const htmlDebug = {
    totalLength: html.length,
    hasImgTag: html.includes('<img'),
    hasImageSrc: html.includes('src="data:image') || html.includes('src="http'),
    hasHeadline: config.headline ? html.includes(cleanText(config.headline).substring(0, 20)) : 'N/A',
    hasBusinessName: config.businessName ? html.includes(config.businessName) : 'N/A',
    hasPhone: config.phone ? html.includes(config.phone.trim()) : 'N/A',
    first500chars: html.substring(0, 500),
  };
  console.log('[Overlay] 🔍 Rendered HTML Debug:', JSON.stringify(htmlDebug, null, 2));

  if (html.length < 50) {
    console.error('[Overlay] ❌ HTML is suspiciously short! Returning original image.', html);
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

  // ─── DEBUG: Check actual DOM rendering ───
  const firstChild = container.firstElementChild as HTMLElement;
  if (firstChild) {
    const rect = firstChild.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(firstChild);
    console.log('[Overlay] 📐 DOM Debug:', JSON.stringify({
      containerSize: `${width}x${height}`,
      firstChildTag: firstChild.tagName,
      firstChildSize: `${rect.width}x${rect.height}`,
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      overflow: computedStyle.overflow,
      bgColor: computedStyle.backgroundColor,
      childCount: firstChild.children.length,
      imgCount: firstChild.querySelectorAll('img').length,
    }));
    
    // Check if images loaded correctly
    const imgs = firstChild.querySelectorAll('img');
    imgs.forEach((img, i) => {
      console.log(`[Overlay] 🖼️ Image ${i}:`, {
        src: img.src.substring(0, 80) + '...',
        complete: img.complete,
        naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
        displaySize: `${img.width}x${img.height}`,
      });
    });
  }

  try {
    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));

    // Check images after waiting
    const allImgs = container.querySelectorAll('img');
    allImgs.forEach((img, i) => {
      console.log(`[Overlay] 🖼️ After-wait Image ${i}: complete=${img.complete}, natural=${img.naturalWidth}x${img.naturalHeight}`);
    });

    await new Promise(r => setTimeout(r, 300));

    const dataUrl = await toPng(container.firstElementChild as HTMLElement, {
      width,
      height,
      pixelRatio: 1,
      cacheBust: true,
      skipFonts: true,
    });

    console.log('[Overlay] ✅ toPng success, dataUrl length:', dataUrl.length);
    // Log a snippet to check if it's actually an image or just a black rectangle
    console.log('[Overlay] dataUrl prefix:', dataUrl.substring(0, 100));
    return dataUrl;
  } finally {
    document.body.removeChild(container);
  }
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
