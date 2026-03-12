import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Sparkles, Pencil, FileText, Check, X, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ClientProfile {
  id: string;
  business_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  primary_color_name: string | null;
  secondary_color_name: string | null;
}

const BusinessIdCard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [editingColors, setEditingColors] = useState(false);
  const [primaryName, setPrimaryName] = useState('');
  const [secondaryName, setSecondaryName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, business_name, primary_color, secondary_color, logo_url, primary_color_name, secondary_color_name')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setProfile(data as ClientProfile);
        setPrimaryName((data as any).primary_color_name || '');
        setSecondaryName((data as any).secondary_color_name || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const saveColorNames = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('client_profiles')
      .update({
        primary_color_name: primaryName.trim() || null,
        secondary_color_name: secondaryName.trim() || null,
      } as any)
      .eq('id', profile.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, primary_color_name: primaryName.trim() || null, secondary_color_name: secondaryName.trim() || null } : null);
      setEditingColors(false);
      toast.success('שמות הצבעים עודכנו בהצלחה');
    } else {
      toast.error('שגיאה בשמירת שמות הצבעים');
    }
    setSaving(false);
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

  return (
    <Card className="overflow-hidden">
      {/* Header with Brand Colors */}
      <div 
        className="h-20 relative flex items-center px-6"
        style={{ 
          background: `linear-gradient(135deg, ${profile.primary_color} 0%, ${profile.secondary_color || profile.primary_color} 100%)`
        }}
      >
        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-white shadow-lg flex items-center justify-center ml-4 p-1.5 shrink-0">
          {profile.logo_url && !isPdfLogo && !logoError ? (
            <img 
              src={profile.logo_url} 
              alt={profile.business_name} 
              className="w-full h-full object-contain rounded-lg" 
              onError={() => setLogoError(true)}
            />
          ) : isPdfLogo ? (
            <FileText className="w-8 h-8 text-primary" />
          ) : (
            <Building2 className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Business Name */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{profile.business_name}</h2>
          <p className="text-sm text-white/70">תעודת זהות עסקית</p>
        </div>

        {/* Color swatches with names */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setEditingColors(!editingColors)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1.5 transition-colors"
            title="ערוך שמות צבעים"
          >
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full border-2 border-white/60 shadow-sm" style={{ backgroundColor: profile.primary_color }} />
              {profile.primary_color_name && (
                <span className="text-[11px] text-white/90 font-medium">{profile.primary_color_name}</span>
              )}
            </div>
            {profile.secondary_color && (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full border-2 border-white/60 shadow-sm" style={{ backgroundColor: profile.secondary_color }} />
                {profile.secondary_color_name && (
                  <span className="text-[11px] text-white/90 font-medium">{profile.secondary_color_name}</span>
                )}
              </div>
            )}
            <Palette className="w-3.5 h-3.5 text-white/70" />
          </button>
        </div>
        
        {/* Edit button */}
        <Link to="/profile">
          <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0">
            <Pencil className="w-3 h-3" />
            עריכה
          </Button>
        </Link>
      </div>

      {/* Color Names Editor Panel */}
      {editingColors && (
        <div className="bg-card border-t border-border px-6 py-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">שמות צבעי המותג</h4>
          </div>
          <div className="flex flex-wrap items-end gap-4" dir="rtl">
            {/* Primary Color */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-border shadow-sm" style={{ backgroundColor: profile.primary_color }} />
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">צבע ראשי ({profile.primary_color})</label>
                <Input
                  value={primaryName}
                  onChange={(e) => setPrimaryName(e.target.value)}
                  placeholder='לדוגמה: "כחול רויאל"'
                  className="h-8 text-sm w-44"
                  dir="rtl"
                  maxLength={30}
                />
              </div>
            </div>

            {/* Secondary Color */}
            {profile.secondary_color && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg border border-border shadow-sm" style={{ backgroundColor: profile.secondary_color }} />
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">צבע משני ({profile.secondary_color})</label>
                  <Input
                    value={secondaryName}
                    onChange={(e) => setSecondaryName(e.target.value)}
                    placeholder='לדוגמה: "זהב חם"'
                    className="h-8 text-sm w-44"
                    dir="rtl"
                    maxLength={30}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" className="h-8 gap-1" onClick={saveColorNames} disabled={saving}>
                <Check className="w-3.5 h-3.5" />
                {saving ? 'שומר...' : 'שמור'}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => {
                setEditingColors(false);
                setPrimaryName(profile.primary_color_name || '');
                setSecondaryName(profile.secondary_color_name || '');
              }}>
                <X className="w-3.5 h-3.5" />
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BusinessIdCard;
