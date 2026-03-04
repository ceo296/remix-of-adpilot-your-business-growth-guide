
UPDATE ad_layout_templates SET html_template = '<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  .ad { position:relative; width:100%; height:100%; overflow:hidden; direction:rtl; font-family: {{brand_font_family}}, "Assistant", sans-serif; }
  .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
  .grad-bottom { position:absolute; bottom:0; width:100%; height:65%; background:linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 45%, transparent 100%); z-index:1; }
  .promo-badge { position:absolute; top:5%; left:5%; width:clamp(75px,16vw,115px); height:clamp(75px,16vw,115px); background:{{brand_primary_color}}; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:clamp(14px,3vw,22px); line-height:1.15; border:3px solid rgba(255,255,255,0.4); box-shadow:0 6px 25px rgba(0,0,0,0.5); transform:rotate(-10deg); z-index:8; }
  .bottom-zone { position:absolute; bottom:0; width:100%; padding:0 7% 5%; z-index:5; text-align:right; }
  .headline { color:#fff; font-weight:900; font-size:clamp(30px,6.5vw,60px); line-height:1.05; text-shadow:0 4px 18px rgba(0,0,0,0.8); margin-bottom:10px; }
  .sub-line { color:{{brand_primary_color}}; font-weight:700; font-size:clamp(14px,2.8vw,24px); margin-bottom:12px; text-shadow:0 2px 8px rgba(0,0,0,0.6); }
  .body-text { color:rgba(255,255,255,0.8); font-size:clamp(11px,2vw,16px); line-height:1.5; margin-bottom:14px; max-width:85%; }
  .contact-row { display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:2px solid {{brand_primary_color}}; background:linear-gradient(to top, rgba(0,0,0,0.5), transparent); padding:16px 0 0; }
  .contact-right { display:flex; align-items:center; gap:12px; }
  .logo-in-bar img { height:clamp(35px,7vw,55px); filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8)); object-fit:contain; }
  .brand-block { display:flex; flex-direction:column; gap:2px; }
  .biz-name { color:#fff; font-weight:800; font-size:clamp(13px,2.2vw,18px); }
  .services-text { color:rgba(255,255,255,0.55); font-size:clamp(9px,1.4vw,11px); }
  .addr-grid { display:flex; flex-wrap:wrap; gap:6px; margin-top:3px; }
  .addr-chip { color:rgba(255,255,255,0.6); font-size:clamp(8px,1.2vw,10px); font-style:italic; }
  .contact-left { display:flex; align-items:center; gap:12px; }
  .phone-block { display:flex; flex-direction:column; align-items:flex-start; }
  .phone-label { color:{{brand_primary_color}}; font-size:clamp(9px,1.3vw,12px); font-weight:600; }
  .phone-num { color:#fff; font-weight:900; font-size:clamp(22px,5vw,38px); letter-spacing:-0.5px; direction:ltr; text-align:left; }
  .cta-btn { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:800; font-size:clamp(12px,2vw,16px); padding:8px 22px; box-shadow:0 4px 15px rgba(0,0,0,0.3); }
  .kashrut-in-bar img { height:clamp(22px,4vw,32px); opacity:0.6; filter:brightness(0) invert(1); }
</style>
<div class="ad">
  <img src="{{image_url}}" class="bg-img" alt="bg">
  <div class="grad-bottom"></div>
  {{#if promo_text}}<div class="promo-badge">{{promo_text}}</div>{{/if}}
  <div class="bottom-zone">
    {{#if headline}}<h1 class="headline">{{headline}}</h1>{{/if}}
    {{#if subheadline}}<div class="sub-line">{{subheadline}}</div>{{/if}}
    {{#if bodyText}}<div class="body-text">{{bodyText}}</div>{{/if}}
    <div class="contact-row">
      <div class="contact-right">
        {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
        <div class="brand-block">
          {{#if business_name}}<div class="biz-name">{{business_name}}</div>{{/if}}
          {{#if services}}<div class="services-text">{{#each services}}{{this}}{{#unless @last}} · {{/unless}}{{/each}}</div>{{/if}}
          {{#if address_list}}<div class="addr-grid">{{#each address_list}}<span class="addr-chip">{{this}}</span>{{/each}}</div>{{/if}}
        </div>
      </div>
      <div class="contact-left">
        {{#if kashrut_logo}}<div class="kashrut-in-bar"><img src="{{kashrut_logo}}" alt="kashrut"></div>{{/if}}
        <div class="phone-block">
          {{#if phone}}<div class="phone-label">לפרטים:</div><div class="phone-num">{{phone}}</div>{{/if}}
        </div>
        {{#if ctaText}}<div class="cta-btn">{{ctaText}}</div>{{/if}}
      </div>
    </div>
  </div>
</div>'
WHERE id = 'b8c5ca6c-bdcb-4407-b117-5610b3c21b89';
