import { WizardData, CampaignGoal, CreativeVibe } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Palette, Target, Megaphone, Sparkles, Calendar, Tag, Crown, Heart, Zap } from 'lucide-react';

interface StepCreativeDirectionProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const campaignGoals: { id: CampaignGoal; label: string; icon: React.ReactNode }[] = [
  { id: 'sale', label: 'מכירת חיסול', icon: <Tag className="w-5 h-5" /> },
  { id: 'branding', label: 'מיתוג יוקרתי', icon: <Crown className="w-5 h-5" /> },
  { id: 'launch', label: 'השקה', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'event', label: 'רישום לאירוע', icon: <Calendar className="w-5 h-5" /> },
];

const StepCreativeDirection = ({ data, updateData, onNext, onPrev }: StepCreativeDirectionProps) => {
  const isValid = data.campaignGoal && data.creativeVibe && data.mainOffer.trim().length > 0;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Palette className="w-4 h-4" />
          שלב 2 מתוך 4
        </div>
        <h1 className="text-3xl font-bold text-foreground">ה-DNA של הקמפיין</h1>
        <p className="text-lg text-muted-foreground">
          הגדר את המטרה, הסגנון והמסר המרכזי
        </p>
      </div>

      {/* Campaign Goal */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          מה מטרת הקמפיין?
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {campaignGoals.map((goal) => {
            const isSelected = data.campaignGoal === goal.id;
            return (
              <button
                key={goal.id}
                onClick={() => updateData({ campaignGoal: goal.id })}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300
                  hover:shadow-md hover:scale-[1.02]
                  ${isSelected 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border bg-card hover:border-primary/50'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                  ${isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {goal.icon}
                </div>
                <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {goal.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Creative Vibe - Netflix Style Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          בחר את הסגנון (The Vibe)
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Aggressive/Sale Style */}
          <button
            onClick={() => updateData({ creativeVibe: 'aggressive' })}
            className={`
              group relative overflow-hidden rounded-2xl border-2 transition-all duration-500
              hover:shadow-xl hover:scale-[1.02]
              ${data.creativeVibe === 'aggressive' 
                ? 'border-destructive shadow-lg ring-2 ring-destructive/30' 
                : 'border-border hover:border-destructive/50'
              }
            `}
          >
            {/* Visual Background */}
            <div className="h-40 bg-gradient-to-br from-red-600 via-red-500 to-orange-500 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-black text-white/20 transform -rotate-12">50%</div>
              </div>
              <div className="absolute top-3 right-3 bg-yellow-400 text-red-800 font-black text-xs px-3 py-1 rounded-full transform rotate-3 shadow-lg">
                רק היום!
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-white/90 rounded-lg p-2 shadow-lg">
                  <div className="text-red-600 font-black text-lg text-center">מבצע טירוף!</div>
                </div>
              </div>
              {/* Icon */}
              <div className="absolute top-3 left-3">
                <Zap className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
              </div>
            </div>
            {/* Label */}
            <div className="p-4 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-destructive" />
                <h4 className="font-bold text-foreground">צועק ומכירתי</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                גדול, אדום, אגרסיבי. מושלם למכירות ומבצעים.
              </p>
            </div>
            {/* Selection Indicator */}
            {data.creativeVibe === 'aggressive' && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
          </button>

          {/* Prestige Style */}
          <button
            onClick={() => updateData({ creativeVibe: 'prestige' })}
            className={`
              group relative overflow-hidden rounded-2xl border-2 transition-all duration-500
              hover:shadow-xl hover:scale-[1.02]
              ${data.creativeVibe === 'prestige' 
                ? 'border-amber-500 shadow-lg ring-2 ring-amber-500/30' 
                : 'border-border hover:border-amber-500/50'
              }
            `}
          >
            {/* Visual Background */}
            <div className="h-40 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-2 border-amber-400/30 rounded-full" />
                <div className="absolute w-28 h-28 border border-amber-400/20 rounded-full" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Crown className="w-12 h-12 text-amber-400 drop-shadow-lg" />
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-amber-300 font-serif text-lg text-center tracking-wider">
                  איכות ללא פשרות
                </div>
              </div>
            </div>
            {/* Label */}
            <div className="p-4 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-foreground">יוקרתי ונקי</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                מינימליסטי, זהב ושחור. למותגי פרימיום.
              </p>
            </div>
            {/* Selection Indicator */}
            {data.creativeVibe === 'prestige' && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
          </button>

          {/* Heimish Style */}
          <button
            onClick={() => updateData({ creativeVibe: 'heimish' })}
            className={`
              group relative overflow-hidden rounded-2xl border-2 transition-all duration-500
              hover:shadow-xl hover:scale-[1.02]
              ${data.creativeVibe === 'heimish' 
                ? 'border-orange-400 shadow-lg ring-2 ring-orange-400/30' 
                : 'border-border hover:border-orange-400/50'
              }
            `}
          >
            {/* Visual Background */}
            <div className="h-40 bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 relative overflow-hidden">
              {/* Decorative Elements - Warm, homey feel */}
              <div className="absolute top-4 right-4 w-16 h-16 bg-orange-200/50 rounded-full blur-xl" />
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-amber-300/50 rounded-full blur-lg" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Heart className="w-12 h-12 text-orange-400 fill-orange-300" />
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-white/80 rounded-xl p-2 shadow-sm">
                  <div className="text-orange-700 font-medium text-center">
                    ביחד, כמו משפחה 🏠
                  </div>
                </div>
              </div>
            </div>
            {/* Label */}
            <div className="p-4 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-orange-400" />
                <h4 className="font-bold text-foreground">ביתי ומחבר</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                חם, רגשי, אותנטי. מחבר לקהילה.
              </p>
            </div>
            {/* Selection Indicator */}
            {data.creativeVibe === 'heimish' && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main Offer */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">מה ההצעה המרכזית שלך?</h3>
        <Textarea
          placeholder="לדוגמה: 50% הנחה על כל החליפות, השקת קולקציית החורף החדשה, כנס ענק למשפחות..."
          value={data.mainOffer}
          onChange={(e) => updateData({ mainOffer: e.target.value })}
          className="min-h-24 text-base"
        />
        <p className="text-sm text-muted-foreground">
          תאר בקצרה את ההטבה או המסר העיקרי של הקמפיין
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="gradient" 
          size="lg"
          onClick={onNext}
          disabled={!isValid}
        >
          המשך לבחירת מדיה
        </Button>
        <Button 
          variant="ghost" 
          size="lg"
          onClick={onPrev}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </div>
    </div>
  );
};

export default StepCreativeDirection;
