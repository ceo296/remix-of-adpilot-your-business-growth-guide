import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MediaType } from '@/components/studio/StudioMediaTypeStep';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DollarSign, 
  Users, 
  MapPin, 
  Check, 
  Package,
  Sparkles,
  Star,
  Calendar as CalendarIcon,
  Bell,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface GeneralPackageItem {
  category: string;
  label: string;
  gender: string;
  count: number;
}

interface GeneralPackage {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  items: GeneralPackageItem[];
  recommended?: boolean;
}

type MediaScope = 'national' | 'local' | 'both';

interface BudgetAudienceStepProps {
  budget: number;
  onBudgetChange: (value: number) => void;
  startDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  endDate?: Date;
  onEndDateChange?: (date: Date | undefined) => void;
  targetStream: string;
  onTargetStreamChange: (value: string) => void;
  targetGender: string;
  onTargetGenderChange: (value: string) => void;
  targetCity: string;
  onTargetCityChange: (value: string) => void;
  selectedPackage: any;
  onPackageSelect: (pkg: any) => void;
  onManualMediaSelect?: (selection: any) => void;
  manualMediaSelection?: any;
  selectedMediaTypes?: MediaType[];
  mediaScope?: MediaScope;
}

const STREAMS = [
  { id: 'general', label: 'כלל הציבור החרדי', color: 'from-violet-500 to-purple-600', primary: true },
  { id: 'litvish', label: 'ליטאי', color: 'from-blue-500 to-indigo-600' },
  { id: 'hasidic', label: 'חסידי', color: 'from-amber-500 to-orange-600' },
  { id: 'sephardi', label: 'ספרדי', color: 'from-emerald-500 to-teal-600' },
];

const GENDERS = [
  { id: 'men', label: 'גברים', color: 'from-sky-500 to-blue-600' },
  { id: 'women', label: 'נשים', color: 'from-rose-400 to-pink-600' },
  { id: 'family', label: 'משפחה', color: 'from-teal-500 to-cyan-600' },
];

const CITIES = [
  { id: 'nationwide', label: 'ארצי', primary: true },
  { id: 'bnei-brak', label: 'בני ברק' },
  { id: 'jerusalem', label: 'ירושלים' },
  { id: 'ashdod', label: 'אשדוד' },
  { id: 'bet-shemesh', label: 'בית שמש' },
  { id: 'modiin-illit', label: 'מודיעין עילית' },
  { id: 'elad', label: 'אלעד' },
];

// General media category descriptions (no specific outlet names)
const CATEGORY_LABELS: Record<string, string> = {
  national_press: 'עיתונות ארצית',
  local_press: 'עיתונות מקומית',
  magazines: 'מגזינים',
  women_magazines: 'מגזינים לנשים',
  digital: 'דיגיטל ואתרים',
  whatsapp: 'חבילות ווטסאפ',
  email: 'ניוזלטרים ומיילים',
  radio: 'רדיו',
  outdoor: 'שילוט חוצות',
  influencers: 'משפיענים',
};

export const BudgetAudienceStep = ({
  budget,
  onBudgetChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  targetStream,
  onTargetStreamChange,
  targetGender,
  onTargetGenderChange,
  targetCity,
  onTargetCityChange,
  selectedPackage,
  onPackageSelect,
}: BudgetAudienceStepProps) => {
  const [packages, setPackages] = useState<GeneralPackage[]>([]);
  const [packageConfirmed, setPackageConfirmed] = useState(false);

  // Generate general packages based on budget
  useEffect(() => {
    if (budget > 0 && targetStream && targetGender) {
      generateGeneralPackages();
      setPackageConfirmed(false);
    }
  }, [budget, targetStream, targetGender, targetCity]);

  const generateGeneralPackages = () => {
    const isWomen = targetGender === 'women';
    const isFamily = targetGender === 'family';

    // Build category distribution based on budget tiers
    const buildItems = (totalBudget: number): GeneralPackageItem[] => {
      const items: GeneralPackageItem[] = [];

      // National press - always if budget allows
      if (totalBudget >= 3000) {
        items.push({
          category: 'national_press',
          label: 'עיתונות ארצית',
          gender: isWomen ? 'נשים' : isFamily ? 'משפחה' : 'גברים',
          count: totalBudget >= 10000 ? 2 : 1,
        });
      }

      // Local press
      if (totalBudget >= 2000 && targetCity !== 'nationwide') {
        items.push({
          category: 'local_press',
          label: 'עיתונות מקומית',
          gender: isFamily ? 'משפחה' : isWomen ? 'נשים' : 'גברים',
          count: 1,
        });
      }

      // WhatsApp bundles
      if (totalBudget >= 1500) {
        items.push({
          category: 'whatsapp',
          label: 'חבילות ווטסאפ',
          gender: isWomen ? 'נשים' : isFamily ? 'משפחה' : 'גברים',
          count: totalBudget >= 8000 ? 2 : 1,
        });
      }

      // Digital
      if (totalBudget >= 2500) {
        items.push({
          category: 'digital',
          label: 'דיגיטל ואתרים',
          gender: isFamily ? 'כללי' : isWomen ? 'נשים' : 'גברים',
          count: totalBudget >= 12000 ? 2 : 1,
        });
      }

      // Newsletters / Email
      if (totalBudget >= 4000) {
        items.push({
          category: 'email',
          label: 'ניוזלטרים',
          gender: isWomen ? 'נשים' : 'גברים',
          count: 1,
        });
      }

      // Women magazines
      if (isWomen && totalBudget >= 5000) {
        items.push({
          category: 'women_magazines',
          label: 'מגזינים לנשים',
          gender: 'נשים',
          count: 1,
        });
      }

      // Magazines for family/men
      if (!isWomen && totalBudget >= 6000) {
        items.push({
          category: 'magazines',
          label: 'מגזינים',
          gender: isFamily ? 'משפחה' : 'גברים',
          count: 1,
        });
      }

      // Influencers for higher budgets
      if (totalBudget >= 10000) {
        items.push({
          category: 'influencers',
          label: 'משפיענים',
          gender: isWomen ? 'נשים' : 'גברים',
          count: 1,
        });
      }

      return items;
    };

    const economyBudget = Math.round(budget * 0.75);
    const standardBudget = budget;
    const premiumBudget = Math.round(budget * 1.3);

    const builtPackages: GeneralPackage[] = [];

    const economyItems = buildItems(economyBudget);
    if (economyItems.length > 0) {
      builtPackages.push({
        id: 'economy',
        name: 'חבילה חסכונית',
        description: `${economyItems.length} אפיקי מדיה בתקציב מצומצם`,
        totalPrice: economyBudget,
        items: economyItems,
      });
    }

    const standardItems = buildItems(standardBudget);
    if (standardItems.length > 0) {
      builtPackages.push({
        id: 'standard',
        name: 'חבילה מאוזנת',
        description: `${standardItems.length} אפיקי מדיה באיזון מושלם`,
        totalPrice: standardBudget,
        recommended: true,
        items: standardItems,
      });
    }

    const premiumItems = buildItems(premiumBudget);
    if (premiumItems.length > 0) {
      builtPackages.push({
        id: 'premium',
        name: 'חבילה פרימיום',
        description: `${premiumItems.length} אפיקי מדיה לחשיפה מקסימלית`,
        totalPrice: premiumBudget,
        items: premiumItems,
      });
    }

    setPackages(builtPackages);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      maximumFractionDigits: 0 
    }).format(price);
  };

  const handleSelectPackage = (pkg: GeneralPackage) => {
    onPackageSelect(pkg);
    setPackageConfirmed(false);
  };

  const handleConfirmPackage = () => {
    setPackageConfirmed(true);
  };

  const showPackages = budget > 0 && targetStream && targetGender;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Campaign Dates */}
      {onStartDateChange && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              תאריכי הקמפיין
            </CardTitle>
            <CardDescription>מתי הקמפיין יופעל?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">תאריך התחלה</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-12 text-base">
                      <CalendarIcon className="w-4 h-4 ml-2 text-muted-foreground" />
                      {startDate ? format(startDate, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={onStartDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">תאריך סיום</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-12 text-base">
                      <CalendarIcon className="w-4 h-4 ml-2 text-muted-foreground" />
                      {endDate ? format(endDate, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={onEndDateChange}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            תקציב הקמפיין
          </CardTitle>
          <CardDescription>הזן את התקציב המקסימלי שלך בש"ח</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={budget || ''}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
              placeholder="לדוגמה: 15000"
              className="text-lg h-12 max-w-xs"
              min={0}
            />
            <span className="text-muted-foreground">₪</span>
          </div>
        </CardContent>
      </Card>

      {/* Target Audience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            קהל היעד
          </CardTitle>
          <CardDescription>בחר את הקהל שאליו מכוון הקמפיין</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stream Selection */}
          <div>
            <Label className="font-medium mb-3 block">זרם</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STREAMS.map((stream) => (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => onTargetStreamChange(stream.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden ${
                    targetStream === stream.id
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stream.color} opacity-${targetStream === stream.id ? '20' : '10'} transition-opacity`} />
                  <span className="font-medium text-sm relative z-10">{stream.label}</span>
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${stream.color} mx-auto mt-2`} />
                </button>
              ))}
            </div>
          </div>

          {/* Gender Selection */}
          <div>
            <Label className="font-medium mb-3 block">מגדר</Label>
            <div className="grid grid-cols-3 gap-3">
              {GENDERS.map((gender) => (
                <button
                  key={gender.id}
                  type="button"
                  onClick={() => onTargetGenderChange(gender.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden ${
                    targetGender === gender.id
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gender.color} opacity-${targetGender === gender.id ? '20' : '10'} transition-opacity`} />
                  <span className="font-medium text-sm relative z-10">{gender.label}</span>
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${gender.color} mx-auto mt-2`} />
                </button>
              ))}
            </div>
          </div>

          {/* City Selection */}
          <div>
            <Label className="font-medium mb-3 block flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              עיר
            </Label>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onTargetCityChange(city.id)}
                  className={`px-4 py-2 rounded-full border transition-all text-sm ${
                    targetCity === city.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'primary' in city && city.primary
                        ? 'border-primary bg-primary/10 hover:bg-primary/20 font-medium'
                        : 'border-border hover:border-primary/50'
                  }`}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Suggestions */}
      {showPackages && !packageConfirmed && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">חבילות מדיה מותאמות</CardTitle>
            </div>
            <CardDescription>
              על בסיס תקציב {formatPrice(budget)} | {STREAMS.find(s => s.id === targetStream)?.label} | {GENDERS.find(g => g.id === targetGender)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`cursor-pointer transition-all hover:shadow-lg relative ${
                    selectedPackage?.id === pkg.id
                      ? 'ring-2 ring-primary shadow-lg border-primary'
                      : 'hover:border-primary/50'
                  } ${pkg.recommended ? 'border-primary/50' : ''}`}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 ml-1" />
                        מומלץ
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {pkg.name}
                    </CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {pkg.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-medium">{item.label}</span>
                            <Badge variant="outline" className="text-xs">{item.gender}</Badge>
                          </div>
                          {item.count > 1 && (
                            <span className="text-xs text-muted-foreground">×{item.count}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-bold text-sm">עד</span>
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(pkg.totalPrice)}
                      </span>
                    </div>

                    {selectedPackage?.id === pkg.id && (
                      <div className="flex items-center justify-center gap-2 text-primary pt-2">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">נבחר</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Confirm Button */}
            {selectedPackage && (
              <div className="mt-6 text-center">
                <Button onClick={handleConfirmPackage} size="lg" className="gap-2">
                  <Check className="w-5 h-5" />
                  החבילה הזאת נשמעת לי
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Message */}
      {packageConfirmed && selectedPackage && (
        <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Bell className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">מעולה! 🎉</h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              בחרת את <strong className="text-foreground">{selectedPackage.name}</strong> בתקציב של עד {formatPrice(selectedPackage.totalPrice)}.
            </p>
            <div className="bg-card border border-border rounded-xl p-4 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-right text-muted-foreground">
                  תקבל הודעה באזור האישי שלך בהקדם עם <strong className="text-foreground">חבילה סופית מפורטת</strong> הכוללת שמות מדיה ספציפיים, גדלים ומחירים מדויקים.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => { setPackageConfirmed(false); }}
              className="mt-2"
            >
              <ChevronDown className="w-4 h-4 ml-1 rotate-90" />
              חזרה לבחירת חבילה
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
