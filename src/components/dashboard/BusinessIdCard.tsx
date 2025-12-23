import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Palette, 
  Target, 
  Users, 
  Award, 
  Heart, 
  Package, 
  Trophy, 
  Tag, 
  Sparkles,
  Plus,
  Upload,
  Radio,
  ArrowLeft,
  Pencil
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClientProfile {
  business_name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  header_font: string;
  body_font: string;
  x_factors: string[];
  primary_x_factor: string | null;
  advantage_type: string | null;
  advantage_slider: number | null;
  winning_feature: string | null;
  my_position_x: number | null;
  my_position_y: number | null;
  end_consumer: string | null;
  decision_maker: string | null;
  logo_url: string | null;
}

const X_FACTOR_LABELS: Record<string, string> = {
  veteran: 'הוותק והניסיון',
  product: 'עליונות מוצרית',
  price: 'המחיר',
  service: 'השירות והיחס',
  brand: 'הבטחה פרסומית',
};

const BusinessIdCard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 h-64 bg-muted/20" />
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">עדיין לא יצרת פרופיל עסקי</h3>
          <p className="text-muted-foreground mb-4">התחל את תהליך ההיכרות כדי ליצור את תעודת הזהות של העסק</p>
          <Link to="/onboarding">
            <Button variant="gradient">
              <Sparkles className="w-4 h-4 ml-2" />
              בוא נתחיל
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const pricePosition = profile.my_position_x !== null 
    ? profile.my_position_x < -30 ? 'זול / משתלם' 
    : profile.my_position_x > 30 ? 'פרימיום / יוקרה' 
    : 'מחיר ביניים'
    : null;

  const stylePosition = profile.my_position_y !== null
    ? profile.my_position_y < -30 ? 'קלאסי ומסורתי' 
    : profile.my_position_y > 30 ? 'מודרני וחדשני' 
    : 'מאוזן'
    : null;

  return (
    <Card className="overflow-hidden">
      {/* Header with Brand Colors */}
      <div 
        className="h-24 relative"
        style={{ 
          background: `linear-gradient(135deg, ${profile.primary_color} 0%, ${profile.secondary_color || profile.primary_color} 100%)`
        }}
      >
        {/* Logo placeholder */}
        <div className="absolute -bottom-8 right-6 w-16 h-16 rounded-xl bg-card border-4 border-card shadow-lg flex items-center justify-center">
          {profile.logo_url ? (
            <img src={profile.logo_url} alt={profile.business_name} className="w-full h-full object-contain rounded-lg" />
          ) : (
            <Building2 className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        
        {/* Edit button */}
        <Link to="/profile" className="absolute top-3 left-3">
          <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0">
            <Pencil className="w-3 h-3" />
            עריכה
          </Button>
        </Link>
      </div>

      <CardContent className="pt-12 pb-6 px-6">
        {/* Business Name */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">{profile.business_name}</h2>
          <p className="text-sm text-muted-foreground mt-1">תעודת זהות עסקית</p>
        </div>

        {/* Strategic Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Advantage Type */}
          {profile.advantage_type && (
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                {profile.advantage_type === 'hard' ? (
                  <Package className="w-4 h-4 text-primary" />
                ) : (
                  <Heart className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">סוג יתרון</p>
              <p className="font-medium text-sm">
                {profile.advantage_type === 'hard' ? 'פיזי' : 'רגשי'}
              </p>
            </div>
          )}

          {/* Primary X-Factor */}
          {profile.primary_x_factor && (
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">מבדל עיקרי</p>
              <p className="font-medium text-sm">
                {X_FACTOR_LABELS[profile.primary_x_factor] || profile.primary_x_factor}
              </p>
            </div>
          )}

          {/* Price Position */}
          {pricePosition && (
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">מיצוב מחיר</p>
              <p className="font-medium text-sm">{pricePosition}</p>
            </div>
          )}

          {/* Style Position */}
          {stylePosition && (
            <div className="p-3 rounded-lg bg-secondary/50 text-center">
              <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">סגנון</p>
              <p className="font-medium text-sm">{stylePosition}</p>
            </div>
          )}
        </div>

        {/* Color Palette Preview */}
        <div className="flex gap-2 mb-6">
          <div 
            className="w-8 h-8 rounded-lg border border-border" 
            style={{ backgroundColor: profile.primary_color }}
            title="צבע ראשי"
          />
          <div 
            className="w-8 h-8 rounded-lg border border-border" 
            style={{ backgroundColor: profile.secondary_color }}
            title="צבע משני"
          />
          <div 
            className="w-8 h-8 rounded-lg border border-border" 
            style={{ backgroundColor: profile.background_color }}
            title="צבע רקע"
          />
          <div className="flex-1" />
          <Badge variant="outline" className="text-xs">
            {profile.header_font}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            מה תרצה לעשות?
          </h4>
          
          <div className="grid md:grid-cols-3 gap-3">
            <Link to="/studio" className="block">
              <Button variant="gradient" className="w-full h-auto py-4 flex-col gap-2">
                <Plus className="w-5 h-5" />
                <span className="font-semibold">קמפיין חדש</span>
                <span className="text-xs opacity-80">יצירה עם AI</span>
              </Button>
            </Link>
            
            <Link to="/upload-campaign" className="block">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-primary/5">
                <Upload className="w-5 h-5" />
                <span className="font-semibold">העלאת קמפיין</span>
                <span className="text-xs text-muted-foreground">חומרים קיימים</span>
              </Button>
            </Link>
            
            <Link to="/media" className="block">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-primary/5">
                <Radio className="w-5 h-5" />
                <span className="font-semibold">אזור המדיה</span>
                <span className="text-xs text-muted-foreground">בחירת ערוצים</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessIdCard;
