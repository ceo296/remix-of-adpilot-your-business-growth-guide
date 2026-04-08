import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Target,
  Eye,
  ShoppingCart,
  Users,
  Zap,
  UserRound,
  UsersRound,
} from 'lucide-react';

export interface MediaIntakeData {
  campaignGoal: 'sales' | 'awareness' | 'launch' | 'event' | '';
  brandTone: 'premium' | 'popular' | 'balanced' | '';
  channelPreference: 'traditional' | 'digital' | 'mixed' | '';
  targetGender: 'men' | 'women' | 'general' | '';
  targetStream: 'haredi' | 'litai' | 'hasidi' | 'sfaradi' | 'all' | '';
  additionalNotes: string;
}

export const initialMediaIntake: MediaIntakeData = {
  campaignGoal: '',
  brandTone: '',
  channelPreference: '',
  targetGender: '',
  targetStream: '',
  additionalNotes: '',
};

interface MediaIntakeFormProps {
  data: MediaIntakeData;
  onChange: (data: MediaIntakeData) => void;
  hideBrandTone?: boolean;
}

const GOALS = [
  { id: 'sales' as const, label: 'מכירות', desc: 'להניע רכישה ישירה — הקלקות, שיחות, הזמנות', icon: <ShoppingCart className="h-6 w-6" />, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  { id: 'awareness' as const, label: 'חשיפה ומודעות', desc: 'שהשם יהיה מוכר — נוכחות ומיצוב', icon: <Eye className="h-6 w-6" />, color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.15)' },
];

const GENDERS = [
  { id: 'men' as const, label: 'גברים', icon: <UserRound className="h-5 w-5" /> },
  { id: 'women' as const, label: 'נשים', icon: <UserRound className="h-5 w-5" /> },
  { id: 'general' as const, label: 'כללי (גם וגם)', icon: <UsersRound className="h-5 w-5" /> },
];

const STREAMS = [
  { id: 'all' as const, label: 'כל הזרמים' },
  { id: 'litai' as const, label: 'ליטאי' },
  { id: 'hasidi' as const, label: 'חסידי' },
  { id: 'sfaradi' as const, label: 'ספרדי' },
];

const CHANNEL_PREFS = [
  { id: 'traditional' as const, label: 'עיתונות ורדיו', desc: 'דגש על עיתונים, מגזינים ורדיו — קלאסי ומוכח', icon: <Target className="h-5 w-5" /> },
  { id: 'mixed' as const, label: 'שילוב של הכול', desc: 'תנו לי פריסה רחבה — קצת מכל דבר', icon: <Users className="h-5 w-5" /> },
  { id: 'digital' as const, label: 'דיגיטל ווואטסאפ', desc: 'אתרים, WhatsApp, משפיענים — מהיר וממוקד', icon: <Zap className="h-5 w-5" /> },
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
          <div className="grid grid-cols-2 gap-4">
            {GOALS.map((goal) => {
              const isSelected = data.campaignGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => update({ campaignGoal: goal.id })}
                  className={`flex items-start gap-3 p-5 rounded-xl border-2 text-right transition-all ${
                    isSelected
                      ? `${goal.selectedClass} shadow-md`
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <span className={`mt-0.5 ${isSelected ? goal.iconColor : 'text-muted-foreground'}`}>
                    {goal.icon}
                  </span>
                  <div>
                    <span className="font-bold text-base text-foreground block">{goal.label}</span>
                    <span className="text-xs text-muted-foreground">{goal.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Target Gender */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" />
            קהל היעד
          </CardTitle>
          <CardDescription>למי הקמפיין מכוון?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {GENDERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => update({ targetGender: g.id })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                  data.targetGender === g.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className={data.targetGender === g.id ? 'text-primary' : 'text-muted-foreground'}>
                  {g.icon}
                </span>
                <span className="font-semibold text-sm text-foreground">{g.label}</span>
              </button>
            ))}
          </div>

          {/* Stream selection */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">זרם</p>
            <div className="flex flex-wrap gap-2">
              {STREAMS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => update({ targetStream: s.id })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    data.targetStream === s.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
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
