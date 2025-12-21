import { useState } from 'react';
import AppSidebar from '@/components/dashboard/AppSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MetricsCards from '@/components/dashboard/MetricsCards';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-semibold text-foreground">לוח בקרה</h1>
            </div>
            <Button variant="gradient" size="default">
              <Plus className="w-4 h-4 ml-2" />
              הצעה חדשה
            </Button>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">שלום, מסעדת השף! 👋</h2>
                  <p className="opacity-90">המערכת עובדת בשבילך - הנה מה שקורה השבוע</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">מצב אוטומטי פעיל</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <MetricsCards />

            {/* Activity Feed */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ActivityFeed />
              
              {/* Quick Actions */}
              <div className="bg-card rounded-xl border border-border p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-lg font-semibold text-foreground mb-4">פעולות מהירות</h3>
                <div className="space-y-3">
                  <button className="w-full p-4 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-right flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">הוסף הצעה או רעיון חדש</p>
                      <p className="text-sm text-muted-foreground">צור קמפיין חדש בקלות</p>
                    </div>
                  </button>
                  <button className="w-full p-4 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-right flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">בקש אופטימיזציה</p>
                      <p className="text-sm text-muted-foreground">שפר ביצועים אוטומטית</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
