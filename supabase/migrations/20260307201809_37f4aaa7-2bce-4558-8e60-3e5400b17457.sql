UPDATE public.ad_layout_templates
SET html_template = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(html_template, 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.55)'),
      'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.55)'
    ),
    'height:55px', 'height:80px'
  ),
  'blur(4px)', 'blur(8px)'
),
updated_at = now()
WHERE is_active = true;