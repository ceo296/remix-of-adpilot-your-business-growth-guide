UPDATE ad_layout_templates 
SET html_template = REPLACE(html_template, 'border-top:2.5px solid {{brand_primary_color}};', ''),
    updated_at = now()
WHERE html_template LIKE '%border-top:2.5px solid {{brand_primary_color}}%';

UPDATE ad_layout_templates 
SET html_template = REPLACE(html_template, 'border-top:2px solid {{brand_primary_color}};', ''),
    updated_at = now()
WHERE html_template LIKE '%border-top:2px solid {{brand_primary_color}}%';