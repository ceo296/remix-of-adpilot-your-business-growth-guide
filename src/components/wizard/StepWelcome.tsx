import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, User, Building2 } from 'lucide-react';

type HonorificType = 'mr' | 'mrs' | 'neutral';

interface StepWelcomeProps {
  onNext: (userName: string, brandName: string, logo: string | null, isAgency: boolean, honorific: HonorificType) => void;
}

const StepWelcome = ({ onNext }: StepWelcomeProps) => {
  const [userName, setUserName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [isAgency, setIsAgency] = useState<boolean | null>(null);
  const [honorific, setHonorific] = useState<HonorificType>('neutral');

  const handleContinue = () => {
    if (userName.trim() && brandName.trim() && isAgency !== null) {
      // Logo is now uploaded in Magic Link step, pass null here
      onNext(userName.trim(), brandName.trim(), null, isAgency, honorific);
    }
  };

  const isValid = userName.trim() && brandName.trim() && isAgency !== null;

  return (
    <>
      <div className="space-y-10">
        {/* Header - larger and more prominent */}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-rose-500/30 flex items-center justify-center">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            ברוכים הבאים ל-
            <span className="logo-black">AD</span>
            <span className="logo-red">KOP</span>
            . בואו נכיר.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
            לפני שמתחילים לעבוד, חשוב לנו לדעת עם מי יש לנו עסק.
          </p>
        </div>

        {/* Form - enhanced spacing and visibility */}
        <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-xl">
          <CardContent className="p-8 md:p-10 space-y-8">
            {/* User Name - enhanced input */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <label className="text-base font-semibold text-foreground">
                  איך לקרוא לך?
                </label>
              </div>
              <Input
                type="text"
                placeholder="שמך הפרטי"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-lg h-14 text-xl border-2 border-emerald-200 focus:border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-teal-50/50"
              />
            </div>

            {/* Honorific Preference */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-md shadow-pink-500/30 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <label className="text-base font-semibold text-foreground">
                  איך נפנה אליך?
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setHonorific('mr')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    honorific === 'mr'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md'
                      : 'border-border hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <span className={`font-bold text-lg ${honorific === 'mr' ? 'text-blue-700' : ''}`}>אדון</span>
                  <span className="text-sm text-muted-foreground">(פניה בלשון זכר)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHonorific('mrs')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    honorific === 'mrs'
                      ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-50 shadow-md'
                      : 'border-border hover:border-pink-300 hover:bg-pink-50/50'
                  }`}
                >
                  <span className={`font-bold text-lg ${honorific === 'mrs' ? 'text-pink-700' : ''}`}>גברת</span>
                  <span className="text-sm text-muted-foreground">(פניה בלשון נקבה)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHonorific('neutral')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    honorific === 'neutral'
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-md'
                      : 'border-border hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <span className={`font-bold text-lg ${honorific === 'neutral' ? 'text-purple-700' : ''}`}>ניטרלי</span>
                  <span className="text-sm text-muted-foreground">(פניה בלשון רבים)</span>
                </button>
              </div>
            </div>

            {/* Brand Name - enhanced input */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <label className="text-base font-semibold text-foreground">
                  שם העסק/ארגון?
                </label>
              </div>
              <Input
                type="text"
                placeholder="שם העסק"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="text-lg h-14 text-xl border-2 border-amber-200 focus:border-amber-400 bg-gradient-to-br from-amber-50/50 to-orange-50/50"
              />
            </div>

            {/* Account Type - redesigned with clearer explanation */}
            <div className="space-y-4">
              <label className="text-base font-semibold text-foreground block">
                מנהלים כמה עסקים?
              </label>
              <p className="text-sm text-muted-foreground -mt-2">
                זה יעזור לנו להתאים את הממשק — תמיד אפשר לשנות אחר כך
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsAgency(false)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    isAgency === false
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg scale-[1.02]'
                      : 'border-border hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                    isAgency === false 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/30' 
                      : 'bg-muted'
                  }`}>
                    <User className={`w-7 h-7 ${isAgency === false ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`font-bold text-lg ${isAgency === false ? 'text-blue-700' : ''}`}>עסק אחד</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAgency(true)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    isAgency === true
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg scale-[1.02]'
                      : 'border-border hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                    isAgency === true 
                      ? 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-md shadow-purple-500/30' 
                      : 'bg-muted'
                  }`}>
                    <Building2 className={`w-7 h-7 ${isAgency === true ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`font-bold text-lg ${isAgency === true ? 'text-purple-700' : ''}`}>סוכנויות פרסום | כמה עסקים</span>
                </button>
              </div>
            </div>

            {/* Continue Button - larger */}
            <Button
              onClick={handleContinue}
              disabled={!isValid}
              size="xl"
              variant="gradient"
              className="w-full h-16 text-xl font-bold"
            >
              <Sparkles className="w-6 h-6 ml-2" />
              המשך
            </Button>

            {!isValid && (
              <p className="text-center text-sm text-muted-foreground bg-gradient-to-br from-slate-50 to-gray-100 p-3 rounded-lg border border-slate-200">
                📝 יש למלא את כל השדות כדי להמשיך
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trust Note */}
        <p className="text-center text-base text-muted-foreground">
          🔒 הפרטים שלכם נשמרים בצורה מאובטחת ומשמשים רק להתאמה אישית של החוויה
        </p>
      </div>
    </>
  );
};

export default StepWelcome;