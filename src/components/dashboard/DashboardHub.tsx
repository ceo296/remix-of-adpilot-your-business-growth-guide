import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Upload, 
  Layers, 
  Activity, 
  ArrowLeft,
  Sparkles,
  FileUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CampaignHistory from './CampaignHistory';
import CampaignPulse from './CampaignPulse';

type HubView = 'main' | 'new-campaign' | 'history' | 'status';

interface DashboardHubProps {
  activeCampaign?: {
    startDate: Date;
    endDate: Date;
    newspaperCount: number;
    digitalCount: number;
  };
}

const DashboardHub = ({ activeCampaign }: DashboardHubProps) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<HubView>('main');

  const handleNewCampaign = (type: 'create' | 'upload') => {
    if (type === 'create') {
      navigate('/studio');
    } else {
      // TODO: Navigate to upload flow
      navigate('/studio?mode=upload');
    }
  };

  const renderMainView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">מה תרצה לעשות?</h2>
        <p className="text-muted-foreground">בחר אפשרות להמשך</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* New Campaign Card */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 group border-2"
          onClick={() => setCurrentView('new-campaign')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">קמפיין חדש</h3>
            <p className="text-sm text-muted-foreground">
              צור קמפיין חדש או העלה חומרים קיימים
            </p>
          </CardContent>
        </Card>

        {/* Campaign History Card */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 group border-2"
          onClick={() => setCurrentView('history')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">היסטוריית קמפיינים</h3>
            <p className="text-sm text-muted-foreground">
              צפה בקמפיינים קודמים
            </p>
          </CardContent>
        </Card>

        {/* Campaign Status Card */}
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-300 hover:shadow-lg group border-2",
            activeCampaign ? "hover:border-primary/50" : "opacity-60 cursor-not-allowed"
          )}
          onClick={() => activeCampaign && setCurrentView('status')}
        >
          <CardContent className="p-8 text-center">
            <div className={cn(
              "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
              activeCampaign ? "bg-success" : "bg-muted"
            )}>
              <Activity className={cn(
                "w-8 h-8",
                activeCampaign ? "text-success-foreground" : "text-muted-foreground"
              )} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">סטטוס קמפיין</h3>
            <p className="text-sm text-muted-foreground">
              {activeCampaign ? "עקוב אחרי הקמפיין הפעיל" : "אין קמפיין פעיל כרגע"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderNewCampaignView = () => (
    <div className="space-y-6 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentView('main')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 ml-2" />
        חזרה
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">קמפיין חדש</h2>
        <p className="text-muted-foreground">איך תרצה להתחיל?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Create with AI */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-primary bg-primary/5 hover:bg-primary/10"
          onClick={() => handleNewCampaign('create')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">קמפיין חדש</h3>
            <p className="text-muted-foreground mb-4">
              יצירה עם AI
            </p>
            <p className="text-sm text-muted-foreground">
              נבנה יחד את המסר הפרסומי, נבחר סגנון ונייצר קריאייטיבים
            </p>
          </CardContent>
        </Card>

        {/* Upload Existing */}
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 hover:border-primary/50"
          onClick={() => handleNewCampaign('upload')}
        >
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileUp className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">העלאת קמפיין</h3>
            <p className="text-muted-foreground mb-4">
              חומרים קיימים
            </p>
            <p className="text-sm text-muted-foreground">
              יש לי קריאייטיבים מוכנים ואני רוצה להפיץ אותם
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-6 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentView('main')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 ml-2" />
        חזרה
      </Button>

      <CampaignHistory />
    </div>
  );

  const renderStatusView = () => (
    <div className="space-y-6 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentView('main')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 ml-2" />
        חזרה
      </Button>

      {activeCampaign && (
        <CampaignPulse 
          startDate={activeCampaign.startDate}
          endDate={activeCampaign.endDate}
          newspaperCount={activeCampaign.newspaperCount}
          digitalCount={activeCampaign.digitalCount}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-[400px] flex flex-col justify-center">
      {currentView === 'main' && renderMainView()}
      {currentView === 'new-campaign' && renderNewCampaignView()}
      {currentView === 'history' && renderHistoryView()}
      {currentView === 'status' && renderStatusView()}
    </div>
  );
};

export default DashboardHub;
