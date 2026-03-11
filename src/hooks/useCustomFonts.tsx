import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CustomFont {
  id: string;
  name: string;
  name_he: string | null;
  family: string;
  weight: string;
  style: string;
  file_url: string;
  file_format: string;
  source: string | null;
  is_active: boolean;
}

// Track which fonts have already been injected
const injectedFonts = new Set<string>();

function injectFontFace(font: CustomFont) {
  const key = `${font.family}-${font.weight}-${font.style}`;
  if (injectedFonts.has(key)) return;

  const formatMap: Record<string, string> = {
    woff2: 'woff2',
    woff: 'woff',
    ttf: 'truetype',
    otf: 'opentype',
  };

  const format = formatMap[font.file_format] || 'woff2';

  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: '${font.family}';
      src: url('${font.file_url}') format('${format}');
      font-weight: ${font.weight};
      font-style: ${font.style};
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
  injectedFonts.add(key);
}

export function useCustomFonts() {
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_fonts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const typedFonts = (data || []) as CustomFont[];
      setFonts(typedFonts);

      // Inject @font-face for each font
      typedFonts.forEach(injectFontFace);
    } catch (err) {
      console.error('Failed to load custom fonts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get all available font families (built-in + custom)
  const getAllFontFamilies = () => {
    const builtIn = [
      'Assistant', 'Heebo', 'Rubik', 'Alef',
      'David Libre', 'Frank Ruhl Libre', 'Secular One', 'Suez One',
    ];

    const customFamilies = [...new Set(fonts.map(f => f.family))];

    return [...builtIn, ...customFamilies];
  };

  return { fonts, isLoading, getAllFontFamilies, reload: loadFonts };
}
