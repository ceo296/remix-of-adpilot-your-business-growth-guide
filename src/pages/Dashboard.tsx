import { useState, useEffect } from 'react';
import AppSidebar from '@/components/dashboard/AppSidebar';
import OnboardingSuccessModal from '@/components/dashboard/OnboardingSuccessModal';
import BusinessIdCard from '@/components/dashboard/BusinessIdCard';
import DashboardHub from '@/components/dashboard/DashboardHub';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock active campaign data (in production, fetch from DB)
const activeCampaignData = {
  startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 days ago
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18), // 18 days from now
  newspaperCount: 3,
  digitalCount: 2,
};

const Dashboard = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [hasActiveCampaign, setHasActiveCampaign] = useState(false);

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

      // Check for active campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);
      
      setHasActiveCampaign(campaigns && campaigns.length > 0);
    };

    fetchUserData();
  }, [user]);

  return (
    <SidebarProvider>
      {/* Onboarding Success Modal */}
      <OnboardingSuccessModal userName={userName} brandName={brandName} />
      
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-semibold text-foreground">לוח הוכחות | בס״ד</h1>
            </div>
          </header>

          {/* Main Content - No Scroll, Hub Layout */}
          <main className="flex-1 p-6 flex flex-col overflow-hidden">
            {/* Business ID Card - Compact */}
            <div className="mb-6">
              <BusinessIdCard />
            </div>

            {/* Dashboard Hub - Main Navigation */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-5xl">
                <DashboardHub 
                  activeCampaign={hasActiveCampaign ? activeCampaignData : undefined}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
