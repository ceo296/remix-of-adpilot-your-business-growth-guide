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

            {/* Logo/Brand Book Upload - Only required for private clients */}
            {isAgency === false && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  העלה לוגו / ספר מותג
                  <span className="text-destructive">*</span>
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                
                {/* Upload area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[80px] rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors cursor-pointer group border-muted-foreground/30 hover:border-primary/50"
                >
                  <div className="text-center p-4 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">לחץ להעלאה (תמונות או PDF)</span>
                  </div>
                </div>

                {/* Uploaded files list */}
                {files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/20"
                      >
                        {file.type.startsWith('image/') ? (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="h-10 w-10 object-contain rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <span className="flex-1 text-sm text-foreground truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-1 hover:bg-destructive/10 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length === 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>חובה להעלות לוגו או ספר מותג כדי ליצור קמפיינים מותאמים</span>
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
