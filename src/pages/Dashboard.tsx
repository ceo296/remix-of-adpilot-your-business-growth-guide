import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingSuccessModal from '@/components/dashboard/OnboardingSuccessModal';
import BusinessIdCard from '@/components/dashboard/BusinessIdCard';
import DashboardHub from '@/components/dashboard/DashboardHub';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useClientProfile();
  const [userName, setUserName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');

  // Redirect if not authenticated or onboarding not completed
  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!profile) {
      navigate('/onboarding', { replace: true });
      return;
    }

    if (!profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [authLoading, profileLoading, user, profile, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      // Fetch profile name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData?.full_name) {
        setUserName(profileData.full_name);
      }

      // Fetch brand name
      const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (clientProfile?.business_name) {
        setBrandName(clientProfile.business_name);
      }
    };

    fetchUserData();
  }, [user]);

  // Show loading while checking auth
  if (authLoading || profileLoading || !user || !profile?.onboarding_completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Onboarding Success Modal */}
      <OnboardingSuccessModal userName={userName} brandName={brandName} />
      
      {/* Top Navigation */}
      <TopNavbar />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Business ID Card - Compact */}
        <div className="mb-6 max-w-5xl mx-auto">
          <BusinessIdCard />
        </div>

        {/* Dashboard Hub - Main Navigation */}
        <div className="w-full max-w-5xl mx-auto">
          <DashboardHub />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
