import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart } from 'lucide-react';

interface StepWelcomeProps {
  onNext: (userName: string, brandName: string) => void;
}

const StepWelcome = ({ onNext }: StepWelcomeProps) => {
  const [userName, setUserName] = useState('');
  const [brandName, setBrandName] = useState('');

  const handleContinue = () => {
    if (userName.trim() && brandName.trim()) {
      onNext(userName.trim(), brandName.trim());
    }
  };

  const isValid = userName.trim() && brandName.trim();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          ברוכים הבאים ל-
          <span className="logo-black">AD</span>
          <span className="logo-red">KOP</span>
          . בואו נכיר.
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          לפני שמתחילים לעבוד, חשוב לנו לדעת עם מי יש לנו עסק.
        </p>
      </div>

      {/* Form */}
      <Card className="max-w-xl mx-auto border-2 border-primary/20">
        <CardContent className="p-8 space-y-6">
          {/* User Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              איך לקרוא לך?
            </label>
            <Input
              type="text"
              placeholder="שמך הפרטי"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="text-lg h-14"
            />
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              שם המותג/העסק?
            </label>
            <Input
              type="text"
              placeholder="שם העסק"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="text-lg h-14"
            />
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!isValid}
            size="xl"
            variant="gradient"
            className="w-full"
          >
            <Sparkles className="w-5 h-5 ml-2" />
            המשך
          </Button>
        </CardContent>
      </Card>

      {/* Trust Note */}
      <p className="text-center text-sm text-muted-foreground">
        הפרטים שלכם נשמרים בצורה מאובטחת ומשמשים רק להתאמה אישית של החוויה
      </p>
    </div>
  );
};

export default StepWelcome;
