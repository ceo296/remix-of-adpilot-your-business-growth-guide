
UPDATE ad_layout_templates SET html_template = '<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  .ad { position:relative; width:100%; height:100%; overflow:hidden; direction:rtl; font-family: {{brand_font_family}}, "Assistant", sans-serif; }
  .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
  .grad-top { position:absolute; top:0; width:100%; height:40%; background:linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 60%, transparent 100%); z-index:1; }
  .top-zone { position:absolute; top:0; right:0; left:0; padding:5% 7% 0; z-index:5; text-align:right; }
  .headline { color:#fff; font-weight:900; font-size:clamp(28px,6vw,58px); line-height:1.08; text-shadow:0 3px 12px rgba(0,0,0,0.7); margin-bottom:10px; }
  .sub-strip { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:700; font-size:clamp(14px,2.8vw,24px); padding:6px 18px; border-right:4px solid rgba(255,255,255,0.6); }
  .promo-badge { position:absolute; top:5%; left:5%; width:clamp(70px,15vw,110px); height:clamp(70px,15vw,110px); background:{{brand_primary_color}}; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:clamp(14px,3vw,22px); line-height:1.15; border:3px solid rgba(255,255,255,0.5); box-shadow:0 4px 20px rgba(0,0,0,0.4); transform:rotate(-8deg); z-index:8; }
  .contact-bar { position:absolute; bottom:0; width:100%; z-index:10; background:linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.75)); backdrop-filter:blur(6px); padding:22px 6% 20px; display:flex; justify-content:space-between; align-items:center; border-top:2.5px solid {{brand_primary_color}}; }
  .contact-right { display:flex; align-items:center; gap:14px; }
  .logo-in-bar img { height:clamp(35px,7vw,55px); filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8)); object-fit:contain; }
  .brand-info { display:flex; flex-direction:column; gap:2px; }
  .biz-name { color:#fff; font-weight:800; font-size:clamp(14px,2.5vw,20px); }
  .services-line { color:rgba(255,255,255,0.6); font-size:clamp(9px,1.5vw,12px); }
  .addr-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:3px; }
  .addr-item { color:rgba(255,255,255,0.65); font-size:clamp(8px,1.3vw,11px); font-style:italic; }
  .contact-left { display:flex; align-items:center; gap:14px; }
  .phone-block { display:flex; flex-direction:column; align-items:flex-start; }
  .phone-label { color:{{brand_primary_color}}; font-size:clamp(9px,1.4vw,13px); font-weight:700; }
  .phone-num { color:#fff; font-weight:900; font-size:clamp(22px,4.5vw,36px); letter-spacing:-0.5px; direction:ltr; text-align:left; }
  .cta-btn { display:inline-block; background:#fff; color:#111; font-weight:800; font-size:clamp(12px,2vw,17px); padding:8px 20px; box-shadow:0 3px 12px rgba(0,0,0,0.3); }
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
      {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
      <div class="brand-info">
        {{#if business_name}}<div class="biz-name">{{business_name}}</div>{{/if}}
        {{#if services}}<div class="services-line">{{#each services}}{{this}}{{#unless @last}} | {{/unless}}{{/each}}</div>{{/if}}
        {{#if address_list}}<div class="addr-row">{{#each address_list}}<span class="addr-item">{{this}}</span>{{/each}}</div>{{/if}}
      </div>
    </div>
    <div class="contact-left">
      {{#if kashrut_logo}}<div class="kashrut-in-bar"><img src="{{kashrut_logo}}" alt="kashrut"></div>{{/if}}
      <div class="phone-block">
        {{#if phone}}<div class="phone-label">לפרטים והזמנות:</div><div class="phone-num">{{phone}}</div>{{/if}}
      </div>
      {{#if ctaText}}<div class="cta-btn">{{ctaText}}</div>{{/if}}
    </div>
  </div>
</div>'
WHERE id = '7f5f11e9-5bbb-420a-a17c-878853cb0f2e';
