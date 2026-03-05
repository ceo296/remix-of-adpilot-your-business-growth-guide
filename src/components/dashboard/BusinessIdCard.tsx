import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Sparkles, Pencil, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClientProfile {
  business_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
}

const BusinessIdCard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('client_profiles')
        .select('business_name, primary_color, secondary_color, logo_url')
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

  // Check if logo is a PDF
  const isPdfLogo = profile.logo_url?.toLowerCase().endsWith('.pdf');

  return (
    <Card className="overflow-hidden">
      {/* Compact Header with Brand Colors */}
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
        
        {/* Edit button */}
        <Link to="/profile">
          <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0">
            <Pencil className="w-3 h-3" />
            עריכה
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default BusinessIdCard;
