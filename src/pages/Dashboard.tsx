import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppSidebar from '@/components/dashboard/AppSidebar';
import CampaignPulse from '@/components/dashboard/CampaignPulse';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import DigitalCorner from '@/components/dashboard/DigitalCorner';
import ProofGallery from '@/components/dashboard/ProofGallery';
import OnboardingStatus from '@/components/dashboard/OnboardingStatus';
import OnboardingSuccessModal from '@/components/dashboard/OnboardingSuccessModal';
import { Button } from '@/components/ui/button';
import { Plus, Wand2, Brain, Settings } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock campaign data
const campaignData = {
  startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 days ago
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18), // 18 days from now
  newspaperCount: 3,
  digitalCount: 2,
};

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
            <Link to="/new-campaign">
              <Button variant="gradient" size="default">
                <Plus className="w-4 h-4 ml-2" />
                קמפיין חדש
              </Button>
            </Link>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Campaign Pulse - Status Header */}
            <CampaignPulse 
              startDate={campaignData.startDate}
              endDate={campaignData.endDate}
              newspaperCount={campaignData.newspaperCount}
              digitalCount={campaignData.digitalCount}
            />

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Activity Timeline - Main Feed */}
              <div className="lg:col-span-2">
                <ActivityTimeline />
              </div>

              {/* Digital Corner - Small Widget */}
              <div className="space-y-6">
                <OnboardingStatus />
                <DigitalCorner />
                
                {/* Quick Actions */}
                <div className="bg-card rounded-xl border border-border p-5 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">כלים מתקדמים</h3>
                  <div className="space-y-2">
                    <Link to="/studio" className="w-full p-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-right flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wand2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">סטודיו יצירתי</p>
                        <p className="text-xs text-muted-foreground">ליצור מודעות עם AI</p>
                      </div>
                    </Link>
                    <Link to="/brain" className="w-full p-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-right flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">בית הספר</p>
                        <p className="text-xs text-muted-foreground">לימוד המערכת</p>
                      </div>
                    </Link>
                    <Link to="/admin-auth" className="w-full p-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-right flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Back Office</p>
                        <p className="text-xs text-muted-foreground">ניהול המערכת</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Proof Gallery */}
            <ProofGallery />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
