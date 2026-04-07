import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Target,
  Eye,
  ShoppingCart,
  Rocket,
  Crown,
  Users,
  Megaphone,
  Heart,
  Shield,
  Zap,
} from 'lucide-react';

export interface MediaIntakeData {
  campaignGoal: 'sales' | 'awareness' | 'launch' | 'event' | '';
  brandTone: 'premium' | 'popular' | 'balanced' | '';
  channelPreference: 'traditional' | 'digital' | 'mixed' | '';
  additionalNotes: string;
}

export const initialMediaIntake: MediaIntakeData = {
  campaignGoal: '',
  brandTone: '',
  channelPreference: '',
  additionalNotes: '',
};

interface MediaIntakeFormProps {
  data: MediaIntakeData;
  onChange: (data: MediaIntakeData) => void;
  hideBrandTone?: boolean;
}

const GOALS = [
  { id: 'sales' as const, label: 'מכירות', desc: 'להניע רכישה ישירה — הקלקות, שיחות, הזמנות', icon: <ShoppingCart className="h-5 w-5" /> },
  { id: 'awareness' as const, label: 'חשיפה ומודעות', desc: 'שהשם יהיה מוכר — נוכחות ומיצוב', icon: <Eye className="h-5 w-5" /> },
  { id: 'launch' as const, label: 'השקה', desc: 'מוצר חדש, סניף חדש, מותג חדש', icon: <Rocket className="h-5 w-5" /> },
  { id: 'event' as const, label: 'אירוע', desc: 'כנס, הרצאה, שמחה, מבצע מוגבל בזמן', icon: <Megaphone className="h-5 w-5" /> },
];

const TONES = [
  { id: 'premium' as const, label: 'יוקרתי ומכובד', desc: 'מותג פרימיום — לא כל פלטפורמה מתאימה', icon: <Crown className="h-5 w-5" /> },
  { id: 'popular' as const, label: 'עממי ונגיש', desc: 'מגיע לכולם — הפצות, וואטסאפ, הכול בסדר', icon: <Heart className="h-5 w-5" /> },
  { id: 'balanced' as const, label: 'מאוזן', desc: 'מכובד אבל רוצה להגיע רחוק', icon: <Shield className="h-5 w-5" /> },
];

const CHANNEL_PREFS = [
  { id: 'traditional' as const, label: 'עיתונות ורדיו', desc: 'דגש על עיתונים, מגזינים ורדיו — קלאסי ומוכח', icon: <Target className="h-5 w-5" /> },
  { id: 'digital' as const, label: 'דיגיטל ווואטסאפ', desc: 'אתרים, WhatsApp, משפיענים — מהיר וממוקד', icon: <Zap className="h-5 w-5" /> },
  { id: 'mixed' as const, label: 'שילוב של הכול', desc: 'תנו לי פריסה רחבה — קצת מכל דבר', icon: <Users className="h-5 w-5" /> },
];

export const MediaIntakeForm = ({ data, onChange, hideBrandTone }: MediaIntakeFormProps) => {
  const update = (partial: Partial<MediaIntakeData>) => onChange({ ...data, ...partial });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Campaign Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            מה המטרה של הקמפיין?
          </CardTitle>
          <CardDescription>זה ישפיע על סוג המדיה שנמליץ עליה</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => update({ campaignGoal: goal.id })}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-right transition-all ${
                  data.campaignGoal === goal.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className={`mt-0.5 ${data.campaignGoal === goal.id ? 'text-primary' : 'text-muted-foreground'}`}>
                  {goal.icon}
                </span>
                <div>
                  <span className="font-semibold text-sm text-foreground block">{goal.label}</span>
                  <span className="text-xs text-muted-foreground">{goal.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Brand Tone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            מה האופי של המותג?
          </CardTitle>
          <CardDescription>האם יש פלטפורמות שפחות מתאימות לאופי שלכם?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {TONES.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => update({ brandTone: tone.id })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                  data.brandTone === tone.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className={data.brandTone === tone.id ? 'text-primary' : 'text-muted-foreground'}>
                  {tone.icon}
                </span>
                <span className="font-semibold text-sm text-foreground">{tone.label}</span>
                <span className="text-xs text-muted-foreground">{tone.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Channel Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            העדפת ערוצים
          </CardTitle>
          <CardDescription>לאן אתם נוטים? (נתאים את החבילות בהתאם)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {CHANNEL_PREFS.map((pref) => (
              <button
                key={pref.id}
                type="button"
                onClick={() => update({ channelPreference: pref.id })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                  data.channelPreference === pref.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className={data.channelPreference === pref.id ? 'text-primary' : 'text-muted-foreground'}>
                  {pref.icon}
                </span>
                <span className="font-semibold text-sm text-foreground">{pref.label}</span>
                <span className="text-xs text-muted-foreground">{pref.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">הערות נוספות (אופציונלי)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.additionalNotes}
            onChange={(e) => update({ additionalNotes: e.target.value })}
            placeholder="יש משהו שחשוב לנו לדעת? למשל: לא רוצים וואטסאפ, רק עיתונות ליטאית..."
            className="min-h-[80px] text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
};
