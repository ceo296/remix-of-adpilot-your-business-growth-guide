import { useState, useEffect } from 'react';
import { WizardData } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, Pencil, Building2, Clock, Star, Users, Loader2 } from 'lucide-react';

interface StepWebsiteInsightsProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface InsightField {
  id: string;
  label: string;
  sublabel: string;
  value: string;
  icon: React.ReactNode;
}

const LOADING_MESSAGES = [
  'סורק מוצרים...',
  'קורא את האודות...',
  'מנתח שפה ומסרים...',
  'מזהה קהל יעד...',
  'מסכם תובנות...',
];

// Mock data based on URL - in production this would come from scraping
const getMockInsights = (url: string): InsightField[] => {
  // Generate some variation based on URL
  const urlLower = url.toLowerCase();
  
  let industry = 'ריהוט לבית ולמשרד';
  let seniority = 'פעילים משנת 1998 (25+ שנה)';
  let coreOffering = 'מערכות ישיבה בהתאמה אישית';
  let audience = 'משפחות חרדיות (סגנון מודרני)';

  if (urlLower.includes('food') || urlLower.includes('אוכל')) {
    industry = 'מזון ומאפים';
    coreOffering = 'מאפים מסורתיים איכותיים';
    audience = 'קהילות חרדיות - אירועים ושבתות';
  } else if (urlLower.includes('tech') || urlLower.includes('טכנולוגיה')) {
    industry = 'טכנולוגיה ומחשוב';
    coreOffering = 'פתרונות IT למגזר החרדי';
    audience = 'עסקים ומוסדות חינוך';
  } else if (urlLower.includes('fashion') || urlLower.includes('אופנה')) {
    industry = 'אופנה והלבשה';
    coreOffering = 'ביגוד צנוע ואיכותי';
    audience = 'נשים וגברים חרדים';
  }

  return [
    {
      id: 'industry',
      label: 'אתם עוסקים ב...',
      sublabel: 'תחום עיסוק',
      value: industry,
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      id: 'seniority',
      label: 'על המפה כבר...',
      sublabel: 'ותק וניסיון',
      value: seniority,
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: 'coreOffering',
      label: 'המומחיות שלכם היא...',
      sublabel: 'מוצר הדגל',
      value: coreOffering,
      icon: <Star className="h-5 w-5" />,
    },
    {
      id: 'audience',
      label: 'נראה שאתם מדברים ל...',
      sublabel: 'קהל יעד משוער',
      value: audience,
      icon: <Users className="h-5 w-5" />,
    },
  ];
};

const StepWebsiteInsights = ({ data, updateData, onNext, onPrev }: StepWebsiteInsightsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [insights, setInsights] = useState<InsightField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // Simulate loading with animated messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => {
          if (prev >= LOADING_MESSAGES.length - 1) {
            clearInterval(interval);
            // After all messages, show insights
            setTimeout(() => {
              const mockInsights = getMockInsights(data.websiteUrl);
              setInsights(mockInsights);
              // Initialize edit values
              const values: Record<string, string> = {};
              mockInsights.forEach(insight => {
                values[insight.id] = insight.value;
              });
              setEditValues(values);
              setIsLoading(false);
            }, 500);
            return prev;
          }
          return prev + 1;
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isLoading, data.websiteUrl]);

  const handleEditStart = (fieldId: string) => {
    setEditingField(fieldId);
  };

  const handleEditSave = (fieldId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === fieldId 
        ? { ...insight, value: editValues[fieldId] }
        : insight
    ));
    setEditingField(null);
  };

  const handleConfirm = () => {
    // Save insights to wizard data
    updateData({
      websiteInsights: {
        industry: editValues.industry || '',
        seniority: editValues.seniority || '',
        coreOffering: editValues.coreOffering || '',
        audience: editValues.audience || '',
        confirmed: true,
      },
    });
    onNext();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xl font-semibold text-foreground">
              לומדים את העסק שלכם...
            </p>
            <div className="flex flex-col items-center gap-2">
              {LOADING_MESSAGES.map((msg, idx) => (
                <p 
                  key={msg}
                  className={`text-sm transition-all duration-300 ${
                    idx === loadingMessageIndex 
                      ? 'text-primary font-medium' 
                      : idx < loadingMessageIndex 
                        ? 'text-success' 
                        : 'text-muted-foreground'
                  }`}
                >
                  {idx < loadingMessageIndex && '✓ '}
                  {idx === loadingMessageIndex && '⏳ '}
                  {msg}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
          <Check className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          זה מה שהבנו מהאתר. דייקנו?
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          אם משהו לא מדויק - אפשר לערוך
        </p>
      </div>

      {/* Insights Card */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id}
              className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                {insight.icon}
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {insight.sublabel}
                </Label>
                <p className="text-sm text-muted-foreground">{insight.label}</p>
                
                {editingField === insight.id ? (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={editValues[insight.id]}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        [insight.id]: e.target.value
                      }))}
                      className="flex-1"
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleEditSave(insight.id)}
                    >
                      שמור
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-foreground">
                      {insight.value}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStart(insight.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Micro-copy */}
      <p className="text-center text-sm text-muted-foreground">
        אין בעיה, לפעמים הרובוט צריך משקפיים. תתקנו אותו 🤓
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
        <Button
          onClick={handleConfirm}
          size="xl"
          variant="gradient"
          className="flex-1"
        >
          <Check className="w-5 h-5 ml-2" />
          בול! אפשר להתקדם
        </Button>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <button
          onClick={onPrev}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          רוצה להחליף לינק? חזרה אחורה
        </button>
      </div>
    </div>
  );
};

export default StepWebsiteInsights;
