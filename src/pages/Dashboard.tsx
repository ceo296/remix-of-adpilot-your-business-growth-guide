import { useState, useEffect } from 'react';
import OnboardingSuccessModal from '@/components/dashboard/OnboardingSuccessModal';
import BusinessIdCard from '@/components/dashboard/BusinessIdCard';
import DashboardHub from '@/components/dashboard/DashboardHub';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      // Fetch profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.full_name) {
        setUserName(profile.full_name);
      }

      // Fetch brand name
      const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('business_name')
        .eq('user_id', user.id)
        .single();
      
      if (clientProfile?.business_name) {
        setBrandName(clientProfile.business_name);
      }
    };

    fetchUserData();
  }, [user]);

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
