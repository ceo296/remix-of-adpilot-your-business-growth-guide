
-- Update existing templates with fixed contact bar (phone right, logo left, no white bg)

-- Update "כותרת עליונה - קלאסי"
UPDATE ad_layout_templates SET html_template = '<style>
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
      </div>
      {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
    </div>
  </div>
</div>', updated_at = now()
WHERE id = '7f5f11e9-5bbb-420a-a17c-878853cb0f2e';

-- Update "כותרת תחתונה - סינמטי"
UPDATE ad_layout_templates SET html_template = '<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  .ad { position:relative; width:100%; height:100%; overflow:hidden; direction:rtl; font-family: {{brand_font_family}}, "Assistant", sans-serif; }
  .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
  .grad-bottom { position:absolute; bottom:0; width:100%; height:55%; background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, transparent 100%); z-index:1; }
  .bottom-zone { position:absolute; bottom:90px; right:0; left:0; padding:0 7%; z-index:5; text-align:right; }
  .headline { color:#fff; font-weight:900; font-size:clamp(34px,7vw,64px); line-height:1.05; text-shadow:0 4px 16px rgba(0,0,0,0.8); margin-bottom:10px; }
  .sub-strip { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:700; font-size:clamp(14px,2.8vw,24px); padding:6px 20px; border-right:4px solid rgba(255,255,255,0.5); }
  .promo-badge { position:absolute; top:5%; left:5%; width:clamp(70px,15vw,110px); height:clamp(70px,15vw,110px); background:{{brand_primary_color}}; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:clamp(14px,3vw,22px); line-height:1.15; border:3px solid rgba(255,255,255,0.5); box-shadow:0 4px 20px rgba(0,0,0,0.4); transform:rotate(-8deg); z-index:8; }
  .contact-bar { position:absolute; bottom:0; width:100%; z-index:10; background:rgba(0,0,0,0.9); backdrop-filter:blur(6px); padding:16px 5% 14px; display:flex; justify-content:space-between; align-items:center; border-top:2.5px solid {{brand_primary_color}}; }
  .contact-right { display:flex; align-items:center; gap:14px; }
  .phone-block { display:flex; flex-direction:column; align-items:flex-end; }
  .phone-label { color:{{brand_primary_color}}; font-size:clamp(9px,1.4vw,12px); font-weight:700; }
  .phone-num { color:#fff; font-weight:900; font-size:clamp(22px,4.5vw,36px); direction:ltr; text-align:left; }
  .cta-btn { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:800; font-size:clamp(11px,1.8vw,16px); padding:8px 18px; border-radius:4px; }
  .contact-left { display:flex; align-items:center; gap:12px; }
  .logo-in-bar img { height:clamp(30px,6vw,48px); filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8)); object-fit:contain; mix-blend-mode:multiply; background:transparent; }
  .biz-name { color:#fff; font-weight:800; font-size:clamp(13px,2.2vw,18px); }
  .kashrut-in-bar img { height:clamp(20px,3.5vw,30px); opacity:0.6; filter:brightness(0) invert(1); }
</style>
<div class="ad">
  <img src="{{image_url}}" class="bg-img" alt="bg">
  <div class="grad-bottom"></div>
  {{#if promo_text}}<div class="promo-badge">{{promo_text}}</div>{{/if}}
  <div class="bottom-zone">
    {{#if headline}}<h1 class="headline">{{headline}}</h1>{{/if}}
    {{#if subheadline}}<div class="sub-strip">{{subheadline}}</div>{{/if}}
  </div>
  <div class="contact-bar">
    <div class="contact-right">
      <div class="phone-block">
        {{#if phone}}<div class="phone-label">לפרטים:</div><div class="phone-num">{{phone}}</div>{{/if}}
      </div>
      {{#if ctaText}}<div class="cta-btn">{{ctaText}}</div>{{/if}}
    </div>
    <div class="contact-left">
      {{#if kashrut_logo}}<div class="kashrut-in-bar"><img src="{{kashrut_logo}}" alt="kashrut"></div>{{/if}}
      {{#if business_name}}<div class="biz-name">{{business_name}}</div>{{/if}}
      {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
    </div>
  </div>
</div>', updated_at = now()
WHERE id = 'b8c5ca6c-bdcb-4407-b117-5610b3c21b89';

-- Insert new template: "סטריפ צד - מודרני" (Side Strip)
INSERT INTO ad_layout_templates (name, description, html_template, is_global, is_active, media_type, placeholders)
VALUES ('סטריפ צד - מודרני', 'כותרת בצד ימין עם סטריפ צבעוני', '<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  .ad { position:relative; width:100%; height:100%; overflow:hidden; direction:rtl; font-family: {{brand_font_family}}, "Assistant", sans-serif; }
  .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
  .side-strip { position:absolute; top:0; right:0; width:38%; height:100%; background:linear-gradient(to left, {{brand_primary_color}}ee, {{brand_primary_color}}88 70%, transparent 100%); z-index:2; }
  .text-zone { position:absolute; top:8%; right:4%; width:34%; z-index:5; text-align:right; display:flex; flex-direction:column; gap:12px; }
  .headline { color:#fff; font-weight:900; font-size:clamp(30px,6.5vw,56px); line-height:1.08; text-shadow:0 2px 10px rgba(0,0,0,0.5); }
  .sub-text { color:rgba(255,255,255,0.9); font-weight:600; font-size:clamp(13px,2.5vw,22px); line-height:1.3; }
  .promo-badge { position:absolute; top:5%; left:5%; width:clamp(70px,14vw,100px); height:clamp(70px,14vw,100px); background:#fff; color:{{brand_primary_color}}; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:clamp(13px,2.8vw,20px); line-height:1.15; box-shadow:0 4px 20px rgba(0,0,0,0.3); z-index:8; }
  .contact-bar { position:absolute; bottom:0; width:100%; z-index:10; background:rgba(0,0,0,0.92); backdrop-filter:blur(6px); padding:16px 5% 14px; display:flex; justify-content:space-between; align-items:center; border-top:2.5px solid {{brand_primary_color}}; }
  .contact-right { display:flex; align-items:center; gap:14px; }
  .phone-num { color:#fff; font-weight:900; font-size:clamp(22px,4.5vw,36px); direction:ltr; text-align:left; }
  .cta-btn { display:inline-block; background:{{brand_primary_color}}; color:#fff; font-weight:800; font-size:clamp(11px,1.8vw,16px); padding:8px 18px; border-radius:4px; }
  .contact-left { display:flex; align-items:center; gap:10px; }
  .logo-in-bar img { height:clamp(30px,6vw,48px); filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8)); object-fit:contain; mix-blend-mode:multiply; background:transparent; }
  .biz-name { color:#fff; font-weight:800; font-size:clamp(13px,2.2vw,18px); }
  .kashrut-in-bar img { height:clamp(20px,3.5vw,30px); opacity:0.6; filter:brightness(0) invert(1); }
</style>
<div class="ad">
  <img src="{{image_url}}" class="bg-img" alt="bg">
  <div class="side-strip"></div>
  {{#if promo_text}}<div class="promo-badge">{{promo_text}}</div>{{/if}}
  <div class="text-zone">
    {{#if headline}}<h1 class="headline">{{headline}}</h1>{{/if}}
    {{#if subheadline}}<div class="sub-text">{{subheadline}}</div>{{/if}}
    {{#if bodyText}}<div class="sub-text" style="font-size:clamp(11px,2vw,16px); opacity:0.85;">{{bodyText}}</div>{{/if}}
  </div>
  <div class="contact-bar">
    <div class="contact-right">
      {{#if phone}}<div class="phone-num">{{phone}}</div>{{/if}}
      {{#if ctaText}}<div class="cta-btn">{{ctaText}}</div>{{/if}}
    </div>
    <div class="contact-left">
      {{#if kashrut_logo}}<div class="kashrut-in-bar"><img src="{{kashrut_logo}}" alt="kashrut"></div>{{/if}}
      {{#if business_name}}<div class="biz-name">{{business_name}}</div>{{/if}}
      {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
    </div>
  </div>
</div>', true, true, 'print', '["headline","subheadline","bodyText","ctaText","phone","business_name","logo_url","brand_primary_color","brand_font_family","image_url","promo_text","kashrut_logo"]'::jsonb);

-- Insert new template: "טקסט בלבד - טיפוגרפי" (Typography-focused)
INSERT INTO ad_layout_templates (name, description, html_template, is_global, is_active, media_type, placeholders)
VALUES ('טיפוגרפי - ללא תמונה', 'עיצוב גרפי מבוסס טיפוגרפיה על רקע צבע המותג', '<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  .ad { position:relative; width:100%; height:100%; overflow:hidden; direction:rtl; font-family: {{brand_font_family}}, "Assistant", sans-serif; background:linear-gradient(135deg, {{brand_primary_color}} 0%, {{secondaryColor}} 100%); }
  .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; opacity:0.15; mix-blend-mode:overlay; }
  .content { position:relative; z-index:5; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:8% 10%; text-align:center; }
  .headline { color:#fff; font-weight:900; font-size:clamp(38px,8vw,72px); line-height:1.05; text-shadow:0 4px 20px rgba(0,0,0,0.3); margin-bottom:16px; }
  .sub-text { color:rgba(255,255,255,0.9); font-weight:600; font-size:clamp(16px,3.2vw,28px); max-width:80%; margin:0 auto 12px; }
  .body-text { color:rgba(255,255,255,0.75); font-size:clamp(12px,2.2vw,20px); max-width:70%; margin:0 auto; line-height:1.5; }
  .promo-badge { position:absolute; top:5%; left:5%; width:clamp(70px,14vw,100px); height:clamp(70px,14vw,100px); background:#fff; color:{{brand_primary_color}}; border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:900; font-size:clamp(13px,2.8vw,20px); line-height:1.15; box-shadow:0 4px 20px rgba(0,0,0,0.2); z-index:8; }
  .contact-bar { position:absolute; bottom:0; width:100%; z-index:10; background:rgba(0,0,0,0.4); backdrop-filter:blur(8px); padding:16px 5% 14px; display:flex; justify-content:space-between; align-items:center; border-top:2px solid rgba(255,255,255,0.2); }
  .contact-right { display:flex; align-items:center; gap:14px; }
  .phone-num { color:#fff; font-weight:900; font-size:clamp(22px,4.5vw,36px); direction:ltr; text-align:left; }
  .cta-btn { display:inline-block; background:#fff; color:{{brand_primary_color}}; font-weight:800; font-size:clamp(11px,1.8vw,16px); padding:8px 18px; border-radius:4px; }
  .contact-left { display:flex; align-items:center; gap:10px; }
  .logo-in-bar img { height:clamp(30px,6vw,48px); filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5)); object-fit:contain; background:transparent; }
  .biz-name { color:#fff; font-weight:800; font-size:clamp(13px,2.2vw,18px); }
</style>
<div class="ad">
  {{#if image_url}}<img src="{{image_url}}" class="bg-img" alt="bg">{{/if}}
  {{#if promo_text}}<div class="promo-badge">{{promo_text}}</div>{{/if}}
  <div class="content">
    {{#if headline}}<h1 class="headline">{{headline}}</h1>{{/if}}
    {{#if subheadline}}<div class="sub-text">{{subheadline}}</div>{{/if}}
    {{#if bodyText}}<div class="body-text">{{bodyText}}</div>{{/if}}
  </div>
  <div class="contact-bar">
    <div class="contact-right">
      {{#if phone}}<div class="phone-num">{{phone}}</div>{{/if}}
      {{#if ctaText}}<div class="cta-btn">{{ctaText}}</div>{{/if}}
    </div>
    <div class="contact-left">
      {{#if business_name}}<div class="biz-name">{{business_name}}</div>{{/if}}
      {{#if logo_url}}<div class="logo-in-bar"><img src="{{logo_url}}" alt="logo"></div>{{/if}}
    </div>
  </div>
</div>', true, true, 'print', '["headline","subheadline","bodyText","ctaText","phone","business_name","logo_url","brand_primary_color","secondaryColor","brand_font_family","image_url","promo_text"]'::jsonb);
