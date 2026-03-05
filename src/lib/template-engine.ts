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
  opening_hours?: string;
  branches?: string[];
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
  { key: 'opening_hours', label: 'שעות פתיחה', example: 'א׳-ה׳ 9:00-18:00' },
  { key: 'branches', label: 'סניפים', example: 'בני ברק, ירושלים' },
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
        const isFirst = index === 0;
        const isLast = index === arr.length - 1;
        rendered = rendered.replace(/\{\{@first\}\}/g, isFirst ? 'true' : '');
        rendered = rendered.replace(/\{\{@last\}\}/g, isLast ? 'true' : '');
        // Process {{#unless @last}}...{{/unless}} inside each
        rendered = rendered.replace(
          /\{\{#unless @last\}\}([\s\S]*?)\{\{\/unless\}\}/g,
          (_, unlessBody) => isLast ? '' : unlessBody
        );
        // Process {{#if @last}}...{{/if}} inside each
        rendered = rendered.replace(
          /\{\{#if @last\}\}([\s\S]*?)\{\{\/if\}\}/g,
          (_, ifBody) => isLast ? ifBody : ''
        );
        // Process {{#if @first}}...{{/if}} inside each
        rendered = rendered.replace(
          /\{\{#if @first\}\}([\s\S]*?)\{\{\/if\}\}/g,
          (_, ifBody) => isFirst ? ifBody : ''
        );
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
export const DEFAULT_TEMPLATE = `<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  .ad { position:relative; width:100%; height:100%; overflow:hidden; direction:rtl; font-family: {{brand_font_family}}, "Assistant", sans-serif; }
  .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
  .grad-top { position:absolute; top:0; width:100%; height:45%; background:linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 55%, transparent 100%); z-index:1; }
  .top-zone { position:absolute; top:0; right:0; left:0; padding:6% 7% 0; z-index:5; text-align:right; }
  .headline { color:#fff; font-weight:900; font-size:clamp(36px,7.5vw,68px); line-height:1.05; text-shadow:0 4px 16px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9); margin-bottom:12px; letter-spacing:-0.5px; }
  .sub-strip { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:700; font-size:clamp(15px,3vw,26px); padding:8px 22px; border-right:4px solid rgba(255,255,255,0.6); }
  .promo-badge { position:absolute; top:5%; left:5%; width:clamp(70px,15vw,110px); height:clamp(70px,15vw,110px); background:{{brand_primary_color}}; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:clamp(14px,3vw,22px); line-height:1.15; border:3px solid rgba(255,255,255,0.5); box-shadow:0 4px 20px rgba(0,0,0,0.4); transform:rotate(-8deg); z-index:8; }
  .contact-bar { position:absolute; bottom:0; width:100%; z-index:10; background:linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.8)); backdrop-filter:blur(6px); padding:18px 5% 16px; display:flex; justify-content:space-between; align-items:center; border-top:2.5px solid {{brand_primary_color}}; }
  .contact-right { display:flex; align-items:center; gap:14px; }
  .phone-block { display:flex; flex-direction:column; align-items:flex-end; }
  .phone-label { color:{{brand_primary_color}}; font-size:clamp(9px,1.4vw,13px); font-weight:700; }
  .phone-num { color:#fff; font-weight:900; font-size:clamp(24px,5vw,40px); letter-spacing:-0.5px; direction:ltr; text-align:left; }
  .cta-btn { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:800; font-size:clamp(12px,2vw,17px); padding:10px 22px; border-radius:4px; box-shadow:0 3px 12px rgba(0,0,0,0.3); }
  .contact-left { display:flex; align-items:center; gap:12px; }
  .logo-in-bar img { height:clamp(35px,7vw,55px); filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8)); object-fit:contain; mix-blend-mode:multiply; background:transparent; }
  .brand-info { display:flex; flex-direction:column; gap:2px; }
  .biz-name { color:#fff; font-weight:800; font-size:clamp(14px,2.5vw,20px); }
  .services-line { color:rgba(255,255,255,0.6); font-size:clamp(9px,1.5vw,12px); }
  .addr-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:3px; }
  .addr-item { color:rgba(255,255,255,0.65); font-size:clamp(8px,1.3vw,11px); font-style:italic; }
  .kashrut-in-bar img { height:clamp(22px,4vw,35px); opacity:0.65; filter:brightness(0) invert(1); }
</style>
<div class="ad">
  <img src="{{image_url}}" class="bg-img" alt="bg">
  <div class="grad-top"></div>
  {{#if promo_text}}<div class="promo-badge">{{promo_text}}</div>{{/if}}
  <div class="top-zone">
    {{#if headline}}<h1 class="headline">{{headline}}</h1>{{/if}}
    {{#if subheadline}}<div class="sub-strip">{{subheadline}}</div>{{/if}}
  </div>
  <div class="contact-bar">
    <div class="contact-right">
      <div class="phone-block">
        {{#if phone}}<div class="phone-label">לפרטים והזמנות:</div><div class="phone-num">{{phone}}</div>{{/if}}
      </div>
      {{#if ctaText}}<div class="cta-btn">{{ctaText}}</div>{{/if}}
    </div>
    <div class="contact-left">
      {{#if kashrut_logo}}<div class="kashrut-in-bar"><img src="{{kashrut_logo}}" alt="kashrut"></div>{{/if}}
      <div class="brand-info">
        {{#if business_name}}<div class="biz-name">{{business_name}}</div>{{/if}}
        {{#if services}}<div class="services-line">{{#each services}}{{this}}{{#unless @last}} | {{/unless}}{{/each}}</div>{{/if}}
        {{#if address_list}}<div class="addr-row">{{#each address_list}}<span class="addr-item">{{this}}</span>{{/each}}</div>{{/if}}
      </div>
      {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
    </div>
  </div>
</div>`;
