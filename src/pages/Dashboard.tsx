import AppSidebar from '@/components/dashboard/AppSidebar';
import CampaignPulse from '@/components/dashboard/CampaignPulse';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import DigitalCorner from '@/components/dashboard/DigitalCorner';
import ProofGallery from '@/components/dashboard/ProofGallery';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

// Mock campaign data
const campaignData = {
  startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 days ago
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18), // 18 days from now
  newspaperCount: 3,
  digitalCount: 2,
};

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-semibold text-foreground">לוח הוכחות | בס״ד</h1>
            </div>
            <Button variant="gradient" size="default">
              <Plus className="w-4 h-4 ml-2" />
              קמפיין חדש
            </Button>
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
                <DigitalCorner />
                
                {/* Quick Actions */}
                <div className="bg-card rounded-xl border border-border p-5 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">פעולות מהירות</h3>
                  <div className="space-y-2">
                    <button className="w-full p-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-right flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">הוסף קמפיין חדש</p>
                        <p className="text-xs text-muted-foreground">יוצאים לדרך</p>
                      </div>
                    </button>
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
