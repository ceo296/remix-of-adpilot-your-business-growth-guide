import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Sparkles, Pencil, FileText, Check, X, Palette, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BrandColor {
  hex: string;
  name: string;
  number: string;
}

interface ClientProfile {
  id: string;
  business_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  primary_color_name: string | null;
  secondary_color_name: string | null;
  brand_colors: BrandColor[];
}

const BusinessIdCard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [editingColors, setEditingColors] = useState(false);
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, business_name, primary_color, secondary_color, logo_url, primary_color_name, secondary_color_name, brand_colors')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const rawColors = (data as any).brand_colors;
        const colors: BrandColor[] = Array.isArray(rawColors) && rawColors.length > 0
          ? rawColors
          : [
              { hex: data.primary_color || '#000000', name: (data as any).primary_color_name || '', number: '' },
              ...(data.secondary_color ? [{ hex: data.secondary_color, name: (data as any).secondary_color_name || '', number: '' }] : []),
            ];
        setProfile({ ...data, brand_colors: colors } as ClientProfile);
        setBrandColors(colors);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const saveColors = async () => {
    if (!profile) return;
    setSaving(true);
    const validColors = brandColors.filter(c => c.hex.trim());
    const { error } = await supabase
      .from('client_profiles')
      .update({
        brand_colors: validColors,
        primary_color_name: validColors[0]?.name || null,
        secondary_color_name: validColors[1]?.name || null,
      } as any)
      .eq('id', profile.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, brand_colors: validColors } : null);
      setEditingColors(false);
      toast.success('צבעי המותג עודכנו בהצלחה');
    } else {
      toast.error('שגיאה בשמירת הצבעים');
    }
    setSaving(false);
  };

  const addColor = () => {
    setBrandColors(prev => [...prev, { hex: '#888888', name: '', number: '' }]);
  };

  const removeColor = (index: number) => {
    setBrandColors(prev => prev.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, field: keyof BrandColor, value: string) => {
    setBrandColors(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4 h-20 bg-muted/20" />
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="p-6 text-center">
          <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">עדיין לא יצרת פרופיל עסקי</h3>
          <Link to="/onboarding">
            <Button variant="gradient" size="sm">
              <Sparkles className="w-4 h-4 ml-2" />
              בוא נתחיל
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isPdfLogo = profile.logo_url?.toLowerCase().endsWith('.pdf');
  const displayColors = profile.brand_colors.length > 0 ? profile.brand_colors : [
    { hex: profile.primary_color, name: '', number: '' },
  ];

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div 
        className="h-20 relative flex items-center px-6"
        style={{ 
          background: `linear-gradient(135deg, ${profile.primary_color} 0%, ${profile.secondary_color || profile.primary_color} 100%)`
        }}
      >
        <div className="w-16 h-16 rounded-xl bg-white shadow-lg flex items-center justify-center ml-4 p-1.5 shrink-0">
          {profile.logo_url && !isPdfLogo && !logoError ? (
            <img src={profile.logo_url} alt={profile.business_name} className="w-full h-full object-contain rounded-lg" onError={() => setLogoError(true)} />
          ) : isPdfLogo ? (
            <FileText className="w-8 h-8 text-primary" />
          ) : (
            <Building2 className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{profile.business_name}</h2>
          <p className="text-sm text-white/70">תעודת זהות עסקית</p>
        </div>

        {/* Color swatches */}
        <button
          onClick={() => setEditingColors(!editingColors)}
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1.5 transition-colors ml-2"
          title="ערוך צבעי מותג"
        >
          {displayColors.map((c, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <div className="w-5 h-5 rounded-full border-2 border-white/60 shadow-sm" style={{ backgroundColor: c.hex }} />
              {(c.name || c.number) && (
                <span className="text-[10px] text-white/90 font-medium max-w-[60px] truncate">
                  {c.name}{c.number ? ` #${c.number}` : ''}
                </span>
              )}
            </div>
          ))}
          <Palette className="w-3.5 h-3.5 text-white/70 mr-1" />
        </button>
        
        <Link to="/profile">
          <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0 mr-2">
            <Pencil className="w-3 h-3" />
            עריכה
          </Button>
        </Link>
      </div>

      {/* Color Editor Panel */}
      {editingColors && (
        <div className="bg-card border-t border-border px-6 py-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">צבעי המותג</h4>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addColor}>
              <Plus className="w-3 h-3" />
              הוסף צבע
            </Button>
          </div>

          <div className="space-y-3" dir="rtl">
            {brandColors.map((color, i) => (
              <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2.5">
                {/* Color picker */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-lg border border-border shadow-sm overflow-hidden" style={{ backgroundColor: color.hex }}>
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(i, 'hex', e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Hex display */}
                <div className="space-y-0.5 shrink-0">
                  <label className="text-[10px] text-muted-foreground">קוד צבע</label>
                  <Input
                    value={color.hex}
                    onChange={(e) => updateColor(i, 'hex', e.target.value)}
                    className="h-7 text-xs w-24 font-mono text-center"
                    dir="ltr"
                    maxLength={7}
                  />
                </div>

                {/* Color name */}
                <div className="space-y-0.5 flex-1">
                  <label className="text-[10px] text-muted-foreground">שם הצבע</label>
                  <Input
                    value={color.name}
                    onChange={(e) => updateColor(i, 'name', e.target.value)}
                    placeholder='לדוגמה: "כחול רויאל"'
                    className="h-7 text-xs"
                    dir="rtl"
                    maxLength={30}
                  />
                </div>

                {/* Color number (like Tambour) */}
                <div className="space-y-0.5 shrink-0">
                  <label className="text-[10px] text-muted-foreground">מספר צבע</label>
                  <Input
                    value={color.number}
                    onChange={(e) => updateColor(i, 'number', e.target.value)}
                    placeholder="T-450"
                    className="h-7 text-xs w-20 font-mono text-center"
                    dir="ltr"
                    maxLength={15}
                  />
                </div>

                {/* Remove */}
                {brandColors.length > 1 && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeColor(i)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 justify-start">
            <Button size="sm" className="h-8 gap-1" onClick={saveColors} disabled={saving}>
              <Check className="w-3.5 h-3.5" />
              {saving ? 'שומר...' : 'שמור'}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => {
              setEditingColors(false);
              setBrandColors(profile.brand_colors);
            }}>
              <X className="w-3.5 h-3.5" />
              ביטול
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BusinessIdCard;
