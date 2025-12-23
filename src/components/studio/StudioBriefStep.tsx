import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Layers, 
  Target, 
  Lightbulb, 
  Tag, 
  Gift, 
  Megaphone, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CampaignStructure = 'single' | 'series';
export type CampaignGoal = 'awareness' | 'promotion' | 'launch' | 'seasonal' | 'other';

export interface CampaignBrief {
  title: string;
  offer: string;
  goal: CampaignGoal | null;
  structure: CampaignStructure | null;
}

interface StudioBriefStepProps {
  value: CampaignBrief;
  onChange: (brief: CampaignBrief) => void;
  businessName?: string;
}

const GOAL_OPTIONS: { id: CampaignGoal; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'awareness', label: 'מודעות למותג', description: 'להציג את העסק ולהגביר נוכחות', icon: Megaphone },
  { id: 'promotion', label: 'מבצע / הנחה', description: 'לקדם הצעה מיוחדת או מחיר', icon: Tag },
  { id: 'launch', label: 'השקה', description: 'להשיק מוצר, שירות או סניף חדש', icon: Sparkles },
  { id: 'seasonal', label: 'עונתי / חג', description: 'קמפיין לרגל אירוע או עונה', icon: Calendar },
];

export const StudioBriefStep = ({ value, onChange, businessName }: StudioBriefStepProps) => {
  const updateBrief = (updates: Partial<CampaignBrief>) => {
    onChange({ ...value, ...updates });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          בוא נגדיר את הקמפיין
        </h2>
        <p className="text-muted-foreground">
          {businessName ? `עבור ${businessName} - ` : ''}ספר לנו מה רוצים לפרסם
        </p>
      </div>

      {/* Campaign Title */}
      <div className="space-y-3">
        <Label htmlFor="campaign-title" className="text-foreground font-medium flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          שם הקמפיין (לשימוש פנימי)
        </Label>
        <Input
          id="campaign-title"
          value={value.title}
          onChange={(e) => updateBrief({ title: e.target.value })}
          placeholder="לדוגמה: מבצע חנוכה 2024, השקת קולקציית חורף..."
          className="text-lg"
        />
      </div>

      {/* Campaign Offer / Message */}
      <div className="space-y-3">
        <Label htmlFor="campaign-offer" className="text-foreground font-medium flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          מה ההצעה המכירתית? *
        </Label>
        <Textarea
          id="campaign-offer"
          value={value.offer}
          onChange={(e) => updateBrief({ offer: e.target.value })}
          placeholder="תאר בקצרה את המסר המרכזי של הקמפיין. לדוגמה: 30% הנחה על כל מערכות הישיבה, השקת טעמים חדשים לסדרת המאפים..."
          className="min-h-[100px] text-base"
        />
        <p className="text-xs text-muted-foreground">
          זה יעזור לנו לכוון את הקריאייטיב והמסרים
        </p>
      </div>

      {/* Campaign Goal */}
      <div className="space-y-4">
        <Label className="text-foreground font-medium">מה המטרה של הקמפיין?</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GOAL_OPTIONS.map((goal) => (
            <Card
              key={goal.id}
              className={cn(
                'cursor-pointer transition-all duration-200 border-2',
                value.goal === goal.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30'
              )}
              onClick={() => updateBrief({ goal: goal.id })}
            >
              <CardContent className="p-4 text-center">
                <div className={cn(
                  'w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2',
                  value.goal === goal.id ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <goal.icon className={cn(
                    'w-5 h-5',
                    value.goal === goal.id ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <p className="font-medium text-sm">{goal.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Campaign Structure */}
      <div className="space-y-4">
        <Label className="text-foreground font-medium">מבנה הקמפיין *</Label>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Single Ad */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 border-2',
              value.structure === 'single'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => updateBrief({ structure: 'single' })}
          >
            <CardContent className="p-6 flex items-start gap-4">
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                value.structure === 'single' ? 'bg-primary/20' : 'bg-muted'
              )}>
                <Zap className={cn(
                  'w-7 h-7',
                  value.structure === 'single' ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">פרסום נקודתי</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  קריאייטיב אחד ממוקד שמתפרסם בכל ערוצי המדיה שנבחרו.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">מהיר</Badge>
                  <Badge variant="secondary" className="text-xs">חסכוני</Badge>
                </div>
              </div>
              {value.structure === 'single' && (
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Series */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 border-2',
              value.structure === 'series'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => updateBrief({ structure: 'series' })}
          >
            <CardContent className="p-6 flex items-start gap-4">
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                value.structure === 'series' ? 'bg-primary/20' : 'bg-muted'
              )}>
                <Layers className={cn(
                  'w-7 h-7',
                  value.structure === 'series' ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">סדרה</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  מספר קריאייטיבים בסגנון אחיד שיוצאים לאורך זמן.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">עומק</Badge>
                  <Badge variant="secondary" className="text-xs">מגוון</Badge>
                </div>
              </div>
              {value.structure === 'series' && (
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Tip */}
      {value.structure && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
          <p className="text-sm text-foreground">
            {value.structure === 'single' 
              ? '💡 פרסום נקודתי מתאים כשרוצים להעביר מסר ברור ומהיר, כמו מבצע קצר או הודעה חשובה.'
              : '💡 סדרה מתאימה כשרוצים לבנות נרטיב לאורך זמן, כמו השקה מדורגת או סיפור מותג.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StudioBriefStep;
