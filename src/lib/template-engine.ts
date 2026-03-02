/**
 * Template engine for custom HTML ad layouts with placeholders and conditional logic.
 * Supports {{variable}}, {{#if variable}}...{{/if}}, {{#if variable}}...{{else}}...{{/if}},
 * {{#each items}}...{{/each}}, and {{#unless variable}}...{{/unless}}.
 */

export interface TemplateData {
  headline?: string;
  subheadline?: string;
  subtitle?: string;
  bodyText?: string;
  ctaText?: string;
  businessName?: string;
  business_name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  primaryColor?: string;
  brand_primary_color?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  brand_font_family?: string;
  logoUrl?: string;
  logo_url?: string;
  services?: string[];
  servicesList?: string[];
  address_list?: string[];
  promoText?: string;
  promo_text?: string;
  promoValue?: string;
  imageUrl?: string;
  image_url?: string;
  kashrut_logo?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

// Available placeholders for the template editor
export const AVAILABLE_PLACEHOLDERS = [
  { key: 'headline', label: 'כותרת', example: 'הנחת שתרצו לספר עליה' },
  { key: 'subheadline', label: 'כותרת משנה (סאב)', example: 'לרגל חופשת פסח' },
  { key: 'subtitle', label: 'כותרת משנה', example: 'לרגל חופשת פסח' },
  { key: 'bodyText', label: 'גוף טקסט', example: 'בחג הזה, העניקו להם מתנה...' },
  { key: 'ctaText', label: 'קריאה לפעולה', example: 'התקשרו עכשיו' },
  { key: 'business_name', label: 'שם העסק', example: 'אקטיב הד' },
  { key: 'businessName', label: 'שם העסק (legacy)', example: 'אקטיב הד' },
  { key: 'phone', label: 'טלפון', example: '033818980' },
  { key: 'whatsapp', label: 'וואטסאפ', example: '0501234567' },
  { key: 'email', label: 'אימייל', example: 'info@example.com' },
  { key: 'address', label: 'כתובת', example: 'בני ברק' },
  { key: 'address_list', label: 'רשימת כתובות/סניפים', example: 'בני ברק, ירושלים, חיפה' },
  { key: 'brand_primary_color', label: 'צבע ראשי מותג', example: '#E34870' },
  { key: 'primaryColor', label: 'צבע ראשי (legacy)', example: '#E34870' },
  { key: 'secondaryColor', label: 'צבע משני', example: '#2A2F33' },
  { key: 'brand_font_family', label: 'פונט מותג', example: 'Heebo' },
  { key: 'logo_url', label: 'לוגו (URL)', example: 'https://...' },
  { key: 'logoUrl', label: 'לוגו (legacy)', example: 'https://...' },
  { key: 'kashrut_logo', label: 'לוגו כשרות', example: 'https://...' },
  { key: 'services', label: 'רשימת שירותים', example: 'אבחון, טיפול, ייעוץ' },
  { key: 'promo_text', label: 'טקסט מבצע', example: '20%\nהנחה!' },
  { key: 'promoText', label: 'טקסט מבצע (legacy)', example: 'מבצע חג!' },
  { key: 'promoValue', label: 'ערך מבצע', example: '20% הנחה' },
  { key: 'image_url', label: 'תמונת רקע', example: 'data:image/...' },
  { key: 'imageUrl', label: 'תמונת רקע (legacy)', example: 'data:image/...' },
  { key: 'width', label: 'רוחב (px)', example: '800' },
  { key: 'height', label: 'גובה (px)', example: '1067' },
];

/**
 * Render a template string with data, supporting:
 * - {{variable}} — simple replacement
 * - {{#if variable}}...{{/if}} — conditional block
 * - {{#if variable}}...{{else}}...{{/if}} — conditional with else
 * - {{#unless variable}}...{{/unless}} — inverse conditional
 * - {{#each items}}{{this}}{{/each}} — loop over array
 */
export function renderTemplate(template: string, data: TemplateData): string {
  let result = template;

  // 1. Process {{#each items}}...{{/each}}
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, key, body) => {
      const arr = data[key];
      if (!Array.isArray(arr) || arr.length === 0) return '';
      return arr.map((item, index) => {
        let rendered = body;
        rendered = rendered.replace(/\{\{this\}\}/g, String(item));
        rendered = rendered.replace(/\{\{@index\}\}/g, String(index));
        rendered = rendered.replace(/\{\{@first\}\}/g, index === 0 ? 'true' : '');
        rendered = rendered.replace(/\{\{@last\}\}/g, index === arr.length - 1 ? 'true' : '');
        return rendered;
      }).join('');
    }
  );

  // 2. Process {{#unless variable}}...{{/unless}}
  result = result.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, key, body) => {
      const val = data[key];
      const isFalsy = !val || (Array.isArray(val) && val.length === 0);
      return isFalsy ? body : '';
    }
  );

  // 3. Process {{#if variable}}...{{else}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, ifBody, elseBody) => {
      const val = data[key];
      const isTruthy = val && !(Array.isArray(val) && val.length === 0);
      return isTruthy ? ifBody : elseBody;
    }
  );

  // 4. Process {{#if variable}}...{{/if}} (without else)
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, body) => {
      const val = data[key];
      const isTruthy = val && !(Array.isArray(val) && val.length === 0);
      return isTruthy ? body : '';
    }
  );

  // 5. Replace {{variable}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  });

  return result;
}

/**
 * Extract placeholder keys from a template string.
 */
export function extractPlaceholders(template: string): string[] {
  const keys = new Set<string>();
  
  // Simple variables
  const simple = template.matchAll(/\{\{(\w+)\}\}/g);
  for (const m of simple) {
    if (!['this', 'else'].includes(m[1]) && !m[1].startsWith('@')) {
      keys.add(m[1]);
    }
  }
  
  // Conditionals and loops
  const blocks = template.matchAll(/\{\{#(?:if|unless|each)\s+(\w+)\}\}/g);
  for (const m of blocks) keys.add(m[1]);
  
  return Array.from(keys);
}

/**
 * Validate a template — returns errors if any.
 */
export function validateTemplate(template: string): string[] {
  const errors: string[] = [];
  
  // Check for unclosed blocks
  const ifOpens = (template.match(/\{\{#if\s+\w+\}\}/g) || []).length;
  const ifCloses = (template.match(/\{\{\/if\}\}/g) || []).length;
  if (ifOpens !== ifCloses) errors.push(`בלוקי {{#if}} לא מאוזנים: ${ifOpens} פתוחים, ${ifCloses} סגורים`);
  
  const eachOpens = (template.match(/\{\{#each\s+\w+\}\}/g) || []).length;
  const eachCloses = (template.match(/\{\{\/each\}\}/g) || []).length;
  if (eachOpens !== eachCloses) errors.push(`בלוקי {{#each}} לא מאוזנים: ${eachOpens} פתוחים, ${eachCloses} סגורים`);
  
  const unlessOpens = (template.match(/\{\{#unless\s+\w+\}\}/g) || []).length;
  const unlessCloses = (template.match(/\{\{\/unless\}\}/g) || []).length;
  if (unlessOpens !== unlessCloses) errors.push(`בלוקי {{#unless}} לא מאוזנים: ${unlessOpens} פתוחים, ${unlessCloses} סגורים`);
  
  // Check for basic HTML structure
  if (!template.includes('<div')) errors.push('התבנית חייבת לכלול לפחות אלמנט <div> אחד');
  
  return errors;
}

// Default sample template
export const DEFAULT_TEMPLATE = `<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --primary: {{brand_primary_color}};
    --font: {{brand_font_family}};
  }
  .ad-grid { font-family: var(--font), sans-serif; }
  .brand-bg { background-color: var(--primary); }
  .brand-text { color: var(--primary); }
</style>
<div class="ad-grid relative w-full h-full overflow-hidden text-right" dir="rtl">
    <img src="{{image_url}}" class="absolute inset-0 w-full h-full object-cover" alt="Main Visual">
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
    <div class="absolute top-12 right-10 left-10 z-10">
        <h1 class="text-6xl font-black text-white leading-[1.1] drop-shadow-2xl">
            {{headline}}
        </h1>
        {{#if subheadline}}
        <div class="mt-4 brand-bg text-white inline-block px-4 py-1 text-xl font-bold italic shadow-lg">
            {{subheadline}}
        </div>
        {{/if}}
    </div>
    {{#if promo_text}}
    <div class="absolute top-10 left-10 w-28 h-28 brand-bg text-white rounded-full flex items-center justify-center text-center font-black text-2xl border-4 border-white shadow-2xl -rotate-12 transform scale-110">
        {{promo_text}}
    </div>
    {{/if}}
    <div class="absolute bottom-0 w-full p-8 flex justify-between items-end text-white z-20">
        <div class="flex flex-col gap-2 max-w-[50%]">
            {{#if phone}}
            <div class="text-3xl font-black tracking-tighter">
                {{phone}}
            </div>
            {{/if}}
            {{#if address_list}}
            <div class="grid grid-cols-2 gap-x-6 text-[10px] opacity-90 border-r-2 border-white/50 pr-4 mt-2 font-medium uppercase tracking-tight">
                {{#each address_list}}
                <div class="whitespace-nowrap italic">\u2022 {{this}}</div>
                {{/each}}
            </div>
            {{/if}}
        </div>
        <div class="flex flex-col items-end">
            {{#if kashrut_logo}}
            <img src="{{kashrut_logo}}" class="h-10 opacity-70 mb-4 brightness-0 invert" alt="Kashrut">
            {{/if}}
            {{#if logo_url}}
                <img src="{{logo_url}}" class="h-20 w-auto object-contain drop-shadow-md" alt="Brand Logo">
            {{else}}
                <span class="text-5xl font-black tracking-tighter uppercase italic">{{business_name}}</span>
            {{/if}}
        </div>
    </div>
</div>`;
