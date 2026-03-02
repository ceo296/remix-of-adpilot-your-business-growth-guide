/**
 * Template engine for custom HTML ad layouts with placeholders and conditional logic.
 * Supports {{variable}}, {{#if variable}}...{{/if}}, {{#if variable}}...{{else}}...{{/if}},
 * {{#each items}}...{{/each}}, and {{#unless variable}}...{{/unless}}.
 */

export interface TemplateData {
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
  logoUrl?: string;
  services?: string[];
  servicesList?: string[];
  promoText?: string;
  promoValue?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

// Available placeholders for the template editor
export const AVAILABLE_PLACEHOLDERS = [
  { key: 'headline', label: 'כותרת', example: 'הנחת שתרצו לספר עליה' },
  { key: 'subtitle', label: 'כותרת משנה', example: 'לרגל חופשת פסח' },
  { key: 'bodyText', label: 'גוף טקסט', example: 'בחג הזה, העניקו להם מתנה...' },
  { key: 'ctaText', label: 'קריאה לפעולה', example: 'התקשרו עכשיו' },
  { key: 'businessName', label: 'שם העסק', example: 'אקטיב הד' },
  { key: 'phone', label: 'טלפון', example: '033818980' },
  { key: 'whatsapp', label: 'וואטסאפ', example: '0501234567' },
  { key: 'email', label: 'אימייל', example: 'info@example.com' },
  { key: 'address', label: 'כתובת', example: 'בני ברק' },
  { key: 'primaryColor', label: 'צבע ראשי', example: '#E34870' },
  { key: 'secondaryColor', label: 'צבע משני', example: '#2A2F33' },
  { key: 'logoUrl', label: 'לוגו (URL)', example: 'https://...' },
  { key: 'services', label: 'רשימת שירותים', example: 'אבחון, טיפול, ייעוץ' },
  { key: 'promoText', label: 'טקסט מבצע', example: 'מבצע חג!' },
  { key: 'promoValue', label: 'ערך מבצע', example: '20% הנחה' },
  { key: 'imageUrl', label: 'תמונת רקע', example: 'data:image/...' },
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
export const DEFAULT_TEMPLATE = `<div style="position:relative; width:{{width}}px; height:{{height}}px; direction:rtl; font-family:'Heebo','Arial',sans-serif; overflow:hidden;">
  <!-- תמונת רקע -->
  <img src="{{imageUrl}}" crossorigin="anonymous" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
  
  <!-- כותרת -->
  {{#if headline}}
  <div style="position:absolute; top:0; left:0; right:0; padding:24px; z-index:2;
              background:linear-gradient(180deg, {{primaryColor}} 0%, transparent 100%);">
    <h1 style="font-size:42px; font-weight:900; color:#fff; text-align:center; text-shadow:0 2px 8px rgba(0,0,0,0.3); margin:0;">
      {{headline}}
    </h1>
    {{#if subtitle}}
    <p style="font-size:20px; font-weight:600; color:rgba(255,255,255,0.9); text-align:center; margin:8px 0 0;">
      {{subtitle}}
    </p>
    {{/if}}
  </div>
  {{/if}}
  
  <!-- גוף טקסט -->
  {{#if bodyText}}
  <div style="position:absolute; bottom:14%; left:50%; transform:translateX(-50%); z-index:2;
              background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); border-radius:12px; padding:16px 24px; max-width:80%;">
    <p style="font-size:18px; font-weight:600; color:#fff; text-align:center; margin:0; line-height:1.6;">
      {{bodyText}}
    </p>
  </div>
  {{/if}}
  
  <!-- CTA -->
  {{#if ctaText}}
  <div style="position:absolute; bottom:20%; left:50%; transform:translateX(-50%); z-index:3;">
    <div style="background:{{primaryColor}}; color:#fff; padding:10px 32px; border-radius:8px;
                font-size:20px; font-weight:800; text-align:center; box-shadow:0 4px 16px rgba(0,0,0,0.3);">
      {{ctaText}}
    </div>
  </div>
  {{/if}}
  
  <!-- פס פרטים תחתון -->
  <div style="position:absolute; bottom:0; left:0; right:0; z-index:4;
              background:linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0.6));
              backdrop-filter:blur(4px); padding:10px 16px; display:flex; align-items:center; justify-content:space-between; direction:rtl;">
    <div style="display:flex; align-items:center; gap:12px;">
      <span style="font-size:15px; font-weight:800; color:#fff;">{{businessName}}</span>
      {{#if services}}
      <div style="display:flex; gap:6px; align-items:center;">
        {{#each services}}
        <span style="color:rgba(255,255,255,0.7); font-size:11px;">{{this}}</span>
        {{/each}}
      </div>
      {{/if}}
    </div>
    <div style="display:flex; align-items:center; gap:12px;">
      {{#if phone}}
      <div style="background:{{primaryColor}}; color:#fff; padding:4px 14px; border-radius:6px;
                  font-size:22px; font-weight:900; direction:ltr;">{{phone}}</div>
      {{/if}}
      {{#if logoUrl}}
      <img src="{{logoUrl}}" crossorigin="anonymous" style="max-height:40px; object-fit:contain; filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));" />
      {{/if}}
    </div>
  </div>
</div>`;
