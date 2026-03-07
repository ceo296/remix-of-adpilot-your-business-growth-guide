
-- Deactivate all templates except the primary one
UPDATE ad_layout_templates 
SET is_active = false, updated_at = now()
WHERE is_global = true AND id != '7f5f11e9-5bbb-420a-a17c-878853cb0f2e';

-- Fix the primary template: replace % padding with fixed px, increase headline font, fix logo
UPDATE ad_layout_templates 
SET html_template = '<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  .ad { position:relative; width:100%; height:100%; overflow:hidden; direction:rtl; font-family: {{brand_font_family}}, "Assistant", sans-serif; word-break:keep-all; overflow-wrap:break-word; }
  .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
  .grad-top { position:absolute; top:0; width:100%; height:45%; background:linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 55%, transparent 100%); z-index:1; }
  .top-zone { position:absolute; top:0; right:0; left:0; padding:40px 48px 0; z-index:5; text-align:right; max-width:75%; margin-right:0; margin-left:auto; }
  .headline { color:#fff; font-weight:900; font-size:80px; line-height:0.9; text-shadow:0 4px 24px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.95); margin-bottom:16px; letter-spacing:-2px; word-break:keep-all; overflow-wrap:normal; }
  .sub-strip { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:700; font-size:22px; padding:8px 22px; border-right:4px solid rgba(255,255,255,0.6); margin-top:8px; text-shadow:0 2px 8px rgba(0,0,0,0.5); word-break:keep-all; overflow-wrap:normal; white-space:normal; }
  .promo-badge { position:absolute; top:40px; left:40px; width:110px; height:110px; background:{{brand_primary_color}}; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:18px; line-height:1.15; border:3px solid rgba(255,255,255,0.5); box-shadow:0 4px 20px rgba(0,0,0,0.4); transform:rotate(-8deg); z-index:8; }
  .contact-bar { position:absolute; bottom:0; width:100%; z-index:10; background:rgba(0,0,0,0.82); backdrop-filter:blur(4px); padding:16px 40px 14px; display:flex; justify-content:space-between; align-items:center; }
  .contact-right { display:flex; align-items:center; gap:14px; }
  .phone-block { display:flex; flex-direction:column; align-items:flex-end; }
  .phone-label { color:{{brand_primary_color}}; font-size:11px; font-weight:700; }
  .phone-num { color:#fff; font-weight:900; font-size:32px; letter-spacing:-0.5px; direction:ltr; text-align:left; }
  .cta-btn { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:800; font-size:14px; padding:10px 22px; border-radius:4px; box-shadow:0 3px 12px rgba(0,0,0,0.3); }
  .contact-left { display:flex; align-items:center; gap:12px; }
  .logo-in-bar { display:block; width:100px; height:100px; flex-shrink:0; }
  .logo-in-bar img { width:100px; height:100px; filter:drop-shadow(0 4px 16px rgba(255,255,255,0.3)) drop-shadow(0 2px 6px rgba(0,0,0,0.9)); object-fit:contain; display:block; }
  .brand-info { display:flex; flex-direction:column; gap:2px; }
  .biz-name { color:#fff; font-weight:800; font-size:16px; }
  .services-line { color:rgba(255,255,255,0.7); font-size:11px; }
  .addr-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:3px; }
  .addr-item { color:rgba(255,255,255,0.7); font-size:10px; font-style:italic; }
  .addr-sep { color:rgba(255,255,255,0.35); font-size:10px; margin:0 2px; }
  .kashrut-in-bar img { height:30px; opacity:0.65; filter:brightness(0) invert(1); }
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
      {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
      <div class="brand-info">
        {{#if business_name}}<div class="biz-name">{{business_name}}</div>{{/if}}
        {{#if services}}<div class="services-line">{{#each services}}{{this}}{{#unless @last}} | {{/unless}}{{/each}}</div>{{/if}}
        {{#if email}}<div class="services-line">✉ {{email}}</div>{{/if}}
        {{#if opening_hours}}<div class="services-line">🕐 {{opening_hours}}</div>{{/if}}
        {{#if branches}}<div class="addr-row">{{#each branches}}<span class="addr-item">📍 {{this}}</span>{{#unless @last}}<span class="addr-sep">|</span>{{/unless}}{{/each}}</div>{{/if}}
        {{#unless branches}}{{#if address_list}}<div class="addr-row">{{#each address_list}}<span class="addr-item">📍 {{this}}</span>{{/each}}</div>{{/if}}{{/unless}}
      </div>
    </div>
  </div>
</div>',
updated_at = now()
WHERE id = '7f5f11e9-5bbb-420a-a17c-878853cb0f2e';
