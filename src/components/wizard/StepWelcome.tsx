import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, Upload, User, Building2, AlertCircle, FileText, X } from 'lucide-react';
import { BrandingStudio } from './BrandingStudio';

interface UploadedFile {
  name: string;
  type: string;
  dataUrl: string;
}

interface StepWelcomeProps {
  onNext: (userName: string, brandName: string, logo: string | null, isAgency: boolean) => void;
}

const StepWelcome = ({ onNext }: StepWelcomeProps) => {
  const [userName, setUserName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAgency, setIsAgency] = useState<boolean | null>(null);
  const [showBrandingStudio, setShowBrandingStudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      Array.from(selectedFiles).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFiles((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              dataUrl: event.target?.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
      // Clear input to allow re-uploading same file
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    // Agencies don't need files at this stage
    const filesRequired = isAgency === false;
    if (userName.trim() && brandName.trim() && isAgency !== null && (!filesRequired || files.length > 0)) {
      // Pass first file as logo for backward compatibility
      const logoData = files.length > 0 ? files[0].dataUrl : null;
      onNext(userName.trim(), brandName.trim(), logoData, isAgency);
    }
  };

  // Agencies don't need files at this stage
  const filesRequired = isAgency === false;
  const isValid = userName.trim() && brandName.trim() && isAgency !== null && (!filesRequired || files.length > 0);

  return (
    <>
      <div className="space-y-10">
        {/* Header - larger and more prominent */}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
            <Heart className="w-12 h-12 text-primary" />
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
            {/* Account Type - larger buttons */}
            <div className="space-y-4">
              <label className="text-base font-semibold text-foreground block">
                מי אתה?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsAgency(false)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    isAgency === false
                      ? 'border-primary bg-primary/10 text-primary shadow-lg scale-[1.02]'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isAgency === false ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <User className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-lg">לקוח פרטי</span>
                  <span className="text-sm text-muted-foreground">עסק אחד, קמפיינים משלי</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAgency(true)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    isAgency === true
                      ? 'border-primary bg-primary/10 text-primary shadow-lg scale-[1.02]'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isAgency === true ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Building2 className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-lg">סוכנות שיווק</span>
                  <span className="text-sm text-muted-foreground">מנהל כמה לקוחות</span>
                </button>
              </div>
            </div>

            {/* User Name - larger input */}
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground block">
                איך לקרוא לך?
              </label>
              <Input
                type="text"
                placeholder="שמך הפרטי"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-lg h-16 text-xl"
              />
            </div>

            {/* Brand Name - larger input */}
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground block">
                {isAgency ? 'שם הסוכנות?' : 'שם המותג/העסק?'}
              </label>
              <Input
                type="text"
                placeholder={isAgency ? 'שם הסוכנות' : 'שם העסק'}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="text-lg h-16 text-xl"
              />
            </div>

            {/* Logo/Brand Book Upload - Only required for private clients */}
            {isAgency === false && (
              <div className="space-y-4">
                <label className="text-base font-semibold text-foreground flex items-center gap-2">
                  העלה לוגו / ספר מותג
                  <span className="text-destructive text-lg">*</span>
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                
                {/* Upload area - larger and more prominent */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[120px] rounded-2xl border-3 border-dashed flex items-center justify-center overflow-hidden transition-all cursor-pointer group border-primary/40 hover:border-primary hover:bg-primary/5 bg-primary/5"
                >
                  <div className="text-center p-6 group-hover:scale-105 transition-transform">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-base font-medium text-foreground">לחץ להעלאה</span>
                    <span className="text-sm text-muted-foreground block mt-1">(תמונות או PDF)</span>
                  </div>
                </div>

                {/* Uploaded files list */}
                {files.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-xl bg-success/10 border-2 border-success/30"
                      >
                        {file.type.startsWith('image/') ? (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="h-14 w-14 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="h-14 w-14 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-7 h-7 text-primary" />
                          </div>
                        )}
                        <span className="flex-1 text-base font-medium text-foreground truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length === 0 && (
                  <div className="flex items-center gap-3 text-blue-700 bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <Upload className="w-6 h-6 flex-shrink-0" />
                    <span className="font-medium">העלאת לוגו תעזור לנו להתאים את העיצובים בדיוק למותג שלך ✨</span>
                  </div>
                )}

                {/* No branding button - more prominent */}
                <button
                  type="button"
                  onClick={() => setShowBrandingStudio(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-lg font-semibold text-primary">אין לי מיתוג - תעזרו לי</span>
                </button>
              </div>
            )}

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
              <p className="text-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {isAgency === false 
                  ? '📝 יש למלא את כל השדות ולהעלות לוגו כדי להמשיך'
                  : '📝 יש למלא את כל השדות כדי להמשיך'
                }
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trust Note */}
        <p className="text-center text-base text-muted-foreground">
          🔒 הפרטים שלכם נשמרים בצורה מאובטחת ומשמשים רק להתאמה אישית של החוויה
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
