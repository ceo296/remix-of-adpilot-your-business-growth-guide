import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Target, Layers, ChevronLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  goal: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  vibe: string | null;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'טיוטה', variant: 'secondary' },
  active: { label: 'פעיל', variant: 'default' },
  completed: { label: 'הושלם', variant: 'outline' },
  paused: { label: 'מושהה', variant: 'destructive' },
};

const GOAL_LABELS: Record<string, string> = {
  awareness: 'מודעות',
  promotion: 'מבצע',
  launch: 'השקה',
  seasonal: 'עונתי',
  other: 'אחר',
};

const CampaignHistory = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, goal, status, start_date, end_date, created_at, vibe')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setCampaigns(data);
      }
      setLoading(false);
    };

    fetchCampaigns();
  }, [user]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            היסטוריית קמפיינים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">עדיין לא יצרת קמפיינים</p>
            <Link to="/studio">
              <Button variant="gradient" size="sm">
                <Sparkles className="w-4 h-4 ml-2" />
                צור קמפיין ראשון
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          היסטוריית קמפיינים
        </CardTitle>
        <Link to="/campaigns">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            הצג הכל
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const status = STATUS_LABELS[campaign.status || 'draft'] || STATUS_LABELS.draft;
            const goalLabel = campaign.goal ? GOAL_LABELS[campaign.goal] || campaign.goal : null;
            
            return (
              <Link 
                key={campaign.id} 
                to={`/studio?campaign=${campaign.id}`}
                className="block p-4 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">{campaign.name}</h4>
                      <Badge variant={status.variant} className="shrink-0">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {goalLabel && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {goalLabel}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(campaign.created_at), 'd בMMM yyyy', { locale: he })}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignHistory;
