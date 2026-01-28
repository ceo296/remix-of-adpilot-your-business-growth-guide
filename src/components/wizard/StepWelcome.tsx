import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, Upload, User, Building2, FileText, X } from 'lucide-react';
import { BrandingStudio } from './BrandingStudio';

interface UploadedFile {
  name: string;
  type: string;
  dataUrl: string;
}

type HonorificType = 'mr' | 'mrs' | 'neutral';

interface StepWelcomeProps {
  onNext: (userName: string, brandName: string, logo: string | null, isAgency: boolean, honorific: HonorificType) => void;
}

const StepWelcome = ({ onNext }: StepWelcomeProps) => {
  const [userName, setUserName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAgency, setIsAgency] = useState<boolean | null>(null);
  const [honorific, setHonorific] = useState<HonorificType>('neutral');
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
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    const filesRequired = isAgency === false;
    if (userName.trim() && brandName.trim() && isAgency !== null && (!filesRequired || files.length > 0)) {
      const logoData = files.length > 0 ? files[0].dataUrl : null;
      onNext(userName.trim(), brandName.trim(), logoData, isAgency, honorific);
    }
  };

  const filesRequired = isAgency === false;
  const isValid = userName.trim() && brandName.trim() && isAgency !== null && (!filesRequired || files.length > 0);

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
            {/* Account Type - larger buttons with gradients */}
            <div className="space-y-4">
              <label className="text-base font-semibold text-foreground block">
                מי אתם?
              </label>
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
                  <span className={`font-bold text-lg ${isAgency === false ? 'text-blue-700' : ''}`}>לקוח פרטי</span>
                  <span className="text-sm text-muted-foreground">עסק אחד, קמפיינים משלי</span>
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
                  <span className={`font-bold text-lg ${isAgency === true ? 'text-purple-700' : ''}`}>סוכנות שיווק</span>
                  <span className="text-sm text-muted-foreground">מנהל כמה לקוחות</span>
                </button>
              </div>
            </div>

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
                  {isAgency ? 'שם הסוכנות?' : 'שם העסק/ארגון?'}
                </label>
              </div>
              <Input
                type="text"
                placeholder={isAgency ? 'שם הסוכנות' : 'שם העסק'}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="text-lg h-14 text-xl border-2 border-amber-200 focus:border-amber-400 bg-gradient-to-br from-amber-50/50 to-orange-50/50"
              />
            </div>

            {/* Logo/Brand Book Upload - Only required for private clients */}
            {isAgency === false && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/30 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <label className="text-base font-semibold text-foreground flex items-center gap-2">
                    העלה לוגו / ספר מותג
                    <span className="text-destructive text-lg">*</span>
                  </label>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                
                {/* Upload area - enhanced with gradient */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full min-h-[120px] rounded-2xl border-3 border-dashed flex items-center justify-center overflow-hidden transition-all cursor-pointer group border-indigo-300 hover:border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100"
                >
                  <div className="text-center p-6 group-hover:scale-105 transition-transform">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-base font-medium text-indigo-700">לחץ להעלאה</span>
                    <span className="text-sm text-indigo-500 block mt-1">(תמונות או PDF)</span>
                  </div>
                </div>

                {/* Uploaded files list */}
                {files.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300"
                      >
                        {file.type.startsWith('image/') ? (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="h-14 w-14 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30">
                            <FileText className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <span className="flex-1 text-base font-medium text-foreground truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length === 0 && (
                  <div className="flex items-center gap-3 text-blue-700 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">העלאת לוגו תעזור לנו להתאים את העיצובים בדיוק למותג ✨</span>
                  </div>
                )}

                {/* No branding button - enhanced */}
                <button
                  type="button"
                  onClick={() => setShowBrandingStudio(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-violet-300 hover:border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-violet-700">אין לי מיתוג - תעזרו לי</span>
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
              <p className="text-center text-sm text-muted-foreground bg-gradient-to-br from-slate-50 to-gray-100 p-3 rounded-lg border border-slate-200">
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