import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, Upload, User, Building2, AlertCircle, FileText } from 'lucide-react';
import { BrandingStudio } from './BrandingStudio';

interface StepWelcomeProps {
  onNext: (userName: string, brandName: string, logo: string | null, isAgency: boolean) => void;
}

const StepWelcome = ({ onNext }: StepWelcomeProps) => {
  const [userName, setUserName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [isAgency, setIsAgency] = useState<boolean | null>(null);
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
    // Agencies don't need logo at this stage
    const logoRequired = isAgency === false;
    if (userName.trim() && brandName.trim() && isAgency !== null && (!logoRequired || logo)) {
      onNext(userName.trim(), brandName.trim(), logo, isAgency);
    }
  };

  // Agencies don't need logo at this stage
  const logoRequired = isAgency === false;
  const isValid = userName.trim() && brandName.trim() && isAgency !== null && (!logoRequired || logo);

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
            {/* Account Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                מי אתה?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsAgency(false)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    isAgency === false
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="font-medium">לקוח פרטי</span>
                  <span className="text-xs text-muted-foreground">עסק אחד, קמפיינים משלי</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAgency(true)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    isAgency === true
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                  <span className="font-medium">סוכנות שיווק</span>
                  <span className="text-xs text-muted-foreground">מנהל כמה לקוחות</span>
                </button>
              </div>
            </div>

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
                {isAgency ? 'שם הסוכנות?' : 'שם המותג/העסק?'}
              </label>
              <Input
                type="text"
                placeholder={isAgency ? 'שם הסוכנות' : 'שם העסק'}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="text-lg h-14"
              />
            </div>

            {/* Logo Upload - Only required for private clients, not for agencies */}
            {isAgency === false && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  ספר מותג / לוגו
                  <span className="text-destructive">*</span>
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors cursor-pointer group ${
                    logo 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-muted-foreground/30 hover:border-primary/50'
                  }`}
                >
                  {logo ? (
                    <div className="flex items-center gap-4 px-4">
                      {logo.startsWith('data:application/pdf') ? (
                        <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-8 h-8 text-primary" />
                        </div>
                      ) : (
                        <img 
                          src={logo} 
                          alt="Logo" 
                          className="h-16 w-16 object-contain rounded-lg"
                        />
                      )}
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {logo.startsWith('data:application/pdf') ? 'ספר מותג נטען' : 'הלוגו נטען בהצלחה'}
                        </p>
                        <p className="text-xs text-muted-foreground">לחץ להחלפה</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">לחץ להעלאה (תמונה או PDF)</span>
                    </div>
                  )}
                </div>

                {/* No logo warning */}
                {!logo && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>חובה להעלות לוגו כדי ליצור קמפיינים מותאמים</span>
                  </div>
                )}

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
            )}

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

            {!isValid && (
              <p className="text-center text-xs text-muted-foreground">
                {isAgency === false 
                  ? 'יש למלא את כל השדות ולהעלות לוגו כדי להמשיך'
                  : 'יש למלא את כל השדות כדי להמשיך'
                }
              </p>
            )}
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
