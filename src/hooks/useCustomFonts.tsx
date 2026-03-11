import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  is_private: boolean;
  owner_user_id: string | null;
  owner_client_profile_id: string | null;
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
      // RLS already filters: public fonts + user's own private fonts
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

  // Upload a private font for the current user
  const uploadPrivateFont = async (file: File, fontFamily: string, clientProfileId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('יש להתחבר כדי להעלות פונט');
      return null;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'woff2';
    const validExtensions = ['woff2', 'woff', 'ttf', 'otf'];
    if (!validExtensions.includes(ext)) {
      toast.error('פורמט לא נתמך. יש להעלות WOFF2, WOFF, TTF או OTF');
      return null;
    }

    const safeName = fontFamily.replace(/\s+/g, '-').toLowerCase();
    const filePath = `private/${user.id}/${safeName}-400.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('custom-fonts')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Font upload error:', uploadError);
      toast.error('שגיאה בהעלאת הפונט');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('custom-fonts')
      .getPublicUrl(filePath);

    const fontName = file.name.replace(/\.(woff2?|ttf|otf)$/i, '');

    const { data: insertedFont, error: dbError } = await supabase
      .from('custom_fonts')
      .insert({
        name: fontName,
        family: fontFamily,
        weight: '400',
        style: 'normal',
        file_url: urlData.publicUrl,
        file_format: ext,
        is_active: true,
        is_private: true,
        owner_user_id: user.id,
        owner_client_profile_id: clientProfileId || null,
      } as any)
      .select()
      .single();

    if (dbError) {
      console.error('Font DB error:', dbError);
      toast.error('שגיאה בשמירת הפונט');
      return null;
    }

    const font = insertedFont as unknown as CustomFont;
    injectFontFace(font);
    await loadFonts();

    return font;
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

  return { fonts, isLoading, getAllFontFamilies, reload: loadFonts, uploadPrivateFont };
}
