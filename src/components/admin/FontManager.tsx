import { useState, useEffect } from 'react';
import { Upload, Trash2, Type, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FontRecord {
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
  created_at: string;
}

const WEIGHT_OPTIONS = [
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'SemiBold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' },
];

const FontManager = () => {
  const [fonts, setFonts] = useState<FontRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [fontName, setFontName] = useState('');
  const [fontNameHe, setFontNameHe] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [fontWeight, setFontWeight] = useState('400');
  const [fontSource, setFontSource] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_fonts')
        .select('*')
        .order('family', { ascending: true });

      if (error) throw error;
      setFonts((data || []) as FontRecord[]);
    } catch (err) {
      console.error('Error loading fonts:', err);
      toast.error('שגיאה בטעינת פונטים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.woff2', '.woff', '.ttf', '.otf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error('פורמט לא נתמך. יש להעלות WOFF2, WOFF, TTF או OTF');
      return;
    }

    setSelectedFile(file);

    // Auto-fill family name from file name
    if (!fontFamily) {
      const baseName = file.name.replace(/\.(woff2?|ttf|otf)$/i, '').replace(/[-_](regular|bold|light|medium|semibold|thin|black|heavy)/gi, '');
      setFontFamily(baseName);
    }
    if (!fontName) {
      setFontName(file.name.replace(/\.(woff2?|ttf|otf)$/i, ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fontName || !fontFamily) {
      toast.error('יש למלא שם פונט, משפחת פונט ולהעלות קובץ');
      return;
    }

    setIsUploading(true);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'woff2';
      const safeName = fontFamily.replace(/\s+/g, '-').toLowerCase();
      const filePath = `${safeName}/${safeName}-${fontWeight}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('custom-fonts')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('custom-fonts')
        .getPublicUrl(filePath);

      // Save to DB
      const { error: dbError } = await supabase
        .from('custom_fonts')
        .insert({
          name: fontName,
          name_he: fontNameHe || null,
          family: fontFamily,
          weight: fontWeight,
          style: 'normal',
          file_url: urlData.publicUrl,
          file_format: ext,
          source: fontSource || null,
          is_active: true,
        });

      if (dbError) throw dbError;

      toast.success(`הפונט "${fontName}" הועלה בהצלחה!`);
      resetForm();
      loadFonts();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('שגיאה בהעלאת הפונט: ' + (err.message || 'Unknown'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (font: FontRecord) => {
    if (!confirm(`למחוק את הפונט "${font.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('custom_fonts')
        .delete()
        .eq('id', font.id);

      if (error) throw error;

      toast.success('הפונט נמחק');
      loadFonts();
    } catch (err) {
      toast.error('שגיאה במחיקה');
    }
  };

  const toggleActive = async (font: FontRecord) => {
    try {
      const { error } = await supabase
        .from('custom_fonts')
        .update({ is_active: !font.is_active })
        .eq('id', font.id);

      if (error) throw error;
      loadFonts();
    } catch (err) {
      toast.error('שגיאה בעדכון');
    }
  };

  const resetForm = () => {
    setFontName('');
    setFontNameHe('');
    setFontFamily('');
    setFontWeight('400');
    setFontSource('');
    setSelectedFile(null);
    setShowAddForm(false);
  };

  // Group fonts by family
  const fontFamilies = fonts.reduce((acc, f) => {
    if (!acc[f.family]) acc[f.family] = [];
    acc[f.family].push(f);
    return acc;
  }, {} as Record<string, FontRecord[]>);

  if (isLoading) {
    return <div className="text-center text-[#888] py-8">טוען פונטים...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Type className="h-6 w-6" />
            ניהול פונטים
          </h2>
          <p className="text-[#888] mt-1">העלאת וניהול פונטים מותאמים אישית (WOFF2, TTF, OTF)</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
          <Plus className="h-4 w-4 ml-2" />
          {showAddForm ? 'ביטול' : 'העלאת פונט חדש'}
        </Button>
      </div>

      {/* Upload Form */}
      {showAddForm && (
        <Card className="bg-[#1a1a1d] border-[#333]">
          <CardHeader>
            <CardTitle className="text-lg">העלאת פונט חדש</CardTitle>
            <CardDescription>
              העלה קובץ פונט בפורמט WOFF2 (מומלץ), WOFF, TTF או OTF.
              ניתן לרכוש פונטים עבריים מ-FontBit, MasterFont, Alef Type ועוד.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File upload */}
            <div>
              <label className="block text-sm text-[#888] mb-1">קובץ פונט *</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-[#222] border border-[#444] rounded-lg cursor-pointer hover:bg-[#333] transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{selectedFile ? selectedFile.name : 'בחר קובץ...'}</span>
                  <input
                    type="file"
                    accept=".woff2,.woff,.ttf,.otf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <Badge variant="outline">{(selectedFile.size / 1024).toFixed(0)} KB</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#888] mb-1">שם הפונט (אנגלית) *</label>
                <Input
                  value={fontName}
                  onChange={e => setFontName(e.target.value)}
                  placeholder="e.g. FB UnicaSans Bold"
                  className="bg-[#222] border-[#444]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-1">שם בעברית</label>
                <Input
                  value={fontNameHe}
                  onChange={e => setFontNameHe(e.target.value)}
                  placeholder="למשל: יוניקה סאנס"
                  className="bg-[#222] border-[#444]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#888] mb-1">משפחת פונט (font-family) *</label>
                <Input
                  value={fontFamily}
                  onChange={e => setFontFamily(e.target.value)}
                  placeholder="e.g. FBUnicaSansHeb"
                  className="bg-[#222] border-[#444]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-1">משקל (weight)</label>
                <Select value={fontWeight} onValueChange={setFontWeight}>
                  <SelectTrigger className="bg-[#222] border-[#444]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_OPTIONS.map(w => (
                      <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-1">מקור / ספק</label>
                <Input
                  value={fontSource}
                  onChange={e => setFontSource(e.target.value)}
                  placeholder="למשל: FontBit"
                  className="bg-[#222] border-[#444]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !fontName || !fontFamily}>
                {isUploading ? 'מעלה...' : 'העלה פונט'}
              </Button>
              <Button variant="outline" onClick={resetForm}>ביטול</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Built-in fonts */}
      <Card className="bg-[#1a1a1d] border-[#333]">
        <CardHeader>
          <CardTitle className="text-lg">פונטים מובנים (Google Fonts)</CardTitle>
          <CardDescription>8 פונטים עבריים חינמיים — תמיד זמינים</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Assistant', 'Heebo', 'Rubik', 'Alef', 'David Libre', 'Frank Ruhl Libre', 'Secular One', 'Suez One'].map(f => (
              <div key={f} className="p-3 bg-[#222] rounded-lg text-center">
                <div className="text-lg mb-1" style={{ fontFamily: f }}>אבגד הוזח</div>
                <div className="text-xs text-[#888]">{f}</div>
                <Badge variant="outline" className="mt-1 text-[10px]">
                  <Check className="h-3 w-3 ml-1" />
                  מובנה
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom fonts */}
      {Object.keys(fontFamilies).length > 0 && (
        <Card className="bg-[#1a1a1d] border-[#333]">
          <CardHeader>
            <CardTitle className="text-lg">פונטים מותאמים ({fonts.length})</CardTitle>
            <CardDescription>פונטים שהועלו למערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(fontFamilies).map(([family, familyFonts]) => (
                <div key={family} className="p-4 bg-[#222] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-lg">{family}</span>
                      {familyFonts[0]?.source && (
                        <Badge variant="outline" className="mr-2 text-[10px]">{familyFonts[0].source}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {familyFonts.map(font => (
                      <div key={font.id} className="flex items-center justify-between p-2 bg-[#1a1a1d] rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant={font.is_active ? 'default' : 'secondary'} className="text-[10px]">
                            {font.is_active ? 'פעיל' : 'מושבת'}
                          </Badge>
                          <span>{font.name}</span>
                          {font.name_he && <span className="text-[#888]">({font.name_he})</span>}
                          <span className="text-[#666] text-sm">w{font.weight}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => toggleActive(font)}>
                            {font.is_active ? 'השבת' : 'הפעל'}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(font)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(fontFamilies).length === 0 && !showAddForm && (
        <div className="text-center py-12 text-[#666]">
          <Type className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>עדיין לא הועלו פונטים מותאמים</p>
          <p className="text-sm mt-1">לחץ על "העלאת פונט חדש" כדי להתחיל</p>
        </div>
      )}
    </div>
  );
};

export default FontManager;
