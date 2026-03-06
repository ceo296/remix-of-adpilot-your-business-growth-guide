UPDATE ad_layout_templates 
SET html_template = '<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  .ad { position:relative; width:100%; height:100%; overflow:hidden; direction:rtl; font-family: {{brand_font_family}}, "Assistant", sans-serif; }
  .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
  .grad-top { position:absolute; top:0; width:100%; height:45%; background:linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 55%, transparent 100%); z-index:1; }
  .top-zone { position:absolute; top:0; right:0; left:0; padding:6% 7% 0; z-index:5; text-align:right; }
  .headline { color:#fff; font-weight:900; font-size:clamp(36px,7.5vw,68px); line-height:1.05; text-shadow:0 4px 16px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9); margin-bottom:12px; letter-spacing:-0.5px; }
  .sub-strip { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:700; font-size:clamp(15px,3vw,26px); padding:8px 22px; border-right:4px solid rgba(255,255,255,0.6); }
  .promo-badge { position:absolute; top:5%; left:5%; width:clamp(80px,17vw,130px); height:clamp(80px,17vw,130px); background:{{brand_primary_color}}; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:clamp(13px,2.8vw,20px); line-height:1.15; border:3px solid rgba(255,255,255,0.5); box-shadow:0 4px 20px rgba(0,0,0,0.4); transform:rotate(-8deg); z-index:8; }
  .contact-bar { position:absolute; bottom:0; width:100%; z-index:10; background:linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.8)); backdrop-filter:blur(6px); padding:20px 5% 18px; display:flex; justify-content:space-between; align-items:center; border-top:2.5px solid {{brand_primary_color}}; }
  .contact-right { display:flex; align-items:center; gap:14px; }
  .phone-block { display:flex; flex-direction:column; align-items:flex-end; }
  .phone-label { color:{{brand_primary_color}}; font-size:clamp(10px,1.6vw,14px); font-weight:700; text-shadow:0 1px 4px rgba(0,0,0,0.8); }
  .phone-num { color:#fff; font-weight:900; font-size:clamp(26px,5.5vw,44px); letter-spacing:-0.5px; direction:ltr; text-align:left; text-shadow:0 2px 8px rgba(0,0,0,0.7); }
  .cta-btn { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:800; font-size:clamp(13px,2.2vw,18px); padding:11px 24px; border-radius:4px; box-shadow:0 3px 12px rgba(0,0,0,0.3); }
  .contact-left { display:flex; align-items:center; gap:14px; }
  .logo-in-bar img { height:clamp(45px,9vw,70px); filter:drop-shadow(0 3px 12px rgba(0,0,0,0.9)); object-fit:contain; }
  .brand-info { display:flex; flex-direction:column; gap:3px; }
  .biz-name { color:#fff; font-weight:800; font-size:clamp(15px,2.8vw,22px); text-shadow:0 1px 6px rgba(0,0,0,0.7); }
  .services-line { color:rgba(255,255,255,0.7); font-size:clamp(10px,1.6vw,13px); text-shadow:0 1px 4px rgba(0,0,0,0.6); }
  .kashrut-in-bar img { height:clamp(22px,4vw,35px); opacity:0.65; filter:brightness(0) invert(1); }
  .extra-row { position:absolute; bottom:80px; width:100%; z-index:10; padding:0 5%; display:flex; gap:8px; justify-content:flex-end; }
  .extra-chip { color:rgba(255,255,255,0.5); font-size:clamp(7px,1.1vw,9px); background:rgba(0,0,0,0.5); padding:2px 8px; border-radius:2px; }
</style>
<div class="ad">
  <img src="{{image_url}}" class="bg-img" alt="bg">
  <div class="grad-top"></div>
  {{#if promo_text}}<div class="promo-badge">{{promo_text}}</div>{{/if}}
  <div class="top-zone">
    {{#if headline}}<h1 class="headline">{{headline}}</h1>{{/if}}
    {{#if subheadline}}<div class="sub-strip">{{subheadline}}</div>{{/if}}
  </div>
  {{#if branches}}<div class="extra-row">{{#each branches}}<span class="extra-chip">📍 {{this}}</span>{{/each}}</div>{{/if}}
  {{#unless branches}}{{#if address_list}}<div class="extra-row">{{#each address_list}}<span class="extra-chip">📍 {{this}}</span>{{/each}}</div>{{/if}}{{/unless}}
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
        {{#if email}}<div class="services-line">✉ {{email}}</div>{{/if}}
        {{#if opening_hours}}<div class="services-line">🕐 {{opening_hours}}</div>{{/if}}
      </div>
      {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
    </div>
  </div>
</div>',
updated_at = now()
WHERE id = '7f5f11e9-5bbb-420a-a17c-878853cb0f2e'