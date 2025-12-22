import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, Upload } from 'lucide-react';
import { BrandingStudio } from './BrandingStudio';

interface StepWelcomeProps {
  onNext: (userName: string, brandName: string, logo: string | null) => void;
}

const StepWelcome = ({ onNext }: StepWelcomeProps) => {
  const [userName, setUserName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [showBrandingStudio, setShowBrandingStudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    if (userName.trim() && brandName.trim()) {
      onNext(userName.trim(), brandName.trim(), logo);
    }
  };

  const isValid = userName.trim() && brandName.trim();

  return (
    <>
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

            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                ספר מותג / לוגו
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
              >
                {logo ? (
                  <div className="flex items-center gap-4 px-4">
                    <img 
                      src={logo} 
                      alt="Logo" 
                      className="h-16 w-16 object-contain rounded-lg"
                    />
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">הלוגו נטען בהצלחה</p>
                      <p className="text-xs text-muted-foreground">לחץ להחלפה</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">לחץ להעלאה</span>
                  </div>
                )}
              </div>

              {/* No branding link - opens Branding Studio */}
              <button
                type="button"
                onClick={() => setShowBrandingStudio(true)}
                className="text-sm text-primary hover:underline underline-offset-4 flex items-center gap-1 mx-auto"
              >
                אין לי מיתוג - תעזרו לי
                <span className="text-xs">←</span>
              </button>
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

      {/* Branding Studio Modal */}
      <BrandingStudio 
        isOpen={showBrandingStudio} 
        onClose={() => setShowBrandingStudio(false)} 
      />
    </>
  );
};

export default StepWelcome;
