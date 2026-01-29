import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  MousePointerClick,
  Calendar as CalendarIcon,
  Wand2,
  ArrowLeft,
  Edit3,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MediaSelector } from '@/components/studio/MediaSelector';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface MediaPackage {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  items: {
    id: string;
    name: string;
    price: number;
    reach?: string;
  }[];
  recommended?: boolean;
}

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
  selectedPackage: MediaPackage | null;
  onPackageSelect: (pkg: MediaPackage) => void;
  onManualMediaSelect?: (selection: any) => void;
  manualMediaSelection?: any;
}

// "general" first as the primary option (כלל הציבור החרדי)
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
  onManualMediaSelect,
  manualMediaSelection,
}: BudgetAudienceStepProps) => {
  const [packages, setPackages] = useState<MediaPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'packages' | 'manual' | null>(null);

  // Generate packages based on budget and audience selection
  useEffect(() => {
    if (budget > 0 && targetStream && targetGender) {
      generatePackages();
    }
  }, [budget, targetStream, targetGender, targetCity]);

  const generatePackages = async () => {
    setIsLoadingPackages(true);
    
    // Fetch media outlets that match the criteria
    const { data: outlets } = await supabase
      .from('media_outlets')
      .select(`
        id,
        name,
        name_he,
        reach_info,
        vibe_he,
        stream,
        media_products (
          id,
          name,
          name_he,
          client_price,
          gender_target,
          target_audience
        )
      `)
      .eq('is_active', true);

    if (!outlets || outlets.length === 0) {
      // Create mock packages if no real data
      const mockPackages: MediaPackage[] = [
        {
          id: 'economy',
          name: 'חבילה חסכונית',
          description: 'מיקסום חשיפה בתקציב מוגבל',
          totalPrice: Math.min(budget * 0.7, budget),
          items: [
            { id: '1', name: 'כיכר השבת - באנר', price: budget * 0.3, reach: '50K צפיות' },
            { id: '2', name: 'בחדרי חרדים - פוסט', price: budget * 0.4, reach: '30K צפיות' },
          ],
        },
        {
          id: 'standard',
          name: 'חבילה מאוזנת',
          description: 'איזון בין חשיפה לעלות',
          totalPrice: budget,
          recommended: true,
          items: [
            { id: '3', name: 'יתד נאמן - מודעה', price: budget * 0.5, reach: '80K קוראים' },
            { id: '4', name: 'כיכר השבת - באנר ראשי', price: budget * 0.3, reach: '100K צפיות' },
            { id: '5', name: 'רדיו קול חי - ספוט', price: budget * 0.2, reach: '40K מאזינים' },
          ],
        },
        {
          id: 'premium',
          name: 'חבילה פרימיום',
          description: 'חשיפה מקסימלית ומגוונת',
          totalPrice: budget * 1.2,
          items: [
            { id: '6', name: 'יתד נאמן - עמוד שלם', price: budget * 0.4, reach: '80K קוראים' },
            { id: '7', name: 'המודיע - חצי עמוד', price: budget * 0.3, reach: '60K קוראים' },
            { id: '8', name: 'כיכר השבת - באנר ראשי', price: budget * 0.25, reach: '100K צפיות' },
            { id: '9', name: 'רדיו קול חי - קמפיין', price: budget * 0.25, reach: '40K מאזינים' },
          ],
        },
      ];
      setPackages(mockPackages);
    } else {
      // Build packages from real data
      // For now, use mock data - in production, filter by stream/gender/city
      const mockPackages: MediaPackage[] = [
        {
          id: 'economy',
          name: 'חבילה חסכונית',
          description: 'מיקסום חשיפה בתקציב מוגבל',
          totalPrice: Math.min(budget * 0.7, budget),
          items: outlets.slice(0, 2).map((o, i) => ({
            id: o.id,
            name: o.name_he || o.name,
            price: budget * (0.3 + i * 0.1),
            reach: o.reach_info || undefined,
          })),
        },
        {
          id: 'standard',
          name: 'חבילה מאוזנת',
          description: 'איזון בין חשיפה לעלות',
          totalPrice: budget,
          recommended: true,
          items: outlets.slice(0, 3).map((o, i) => ({
            id: o.id,
            name: o.name_he || o.name,
            price: budget * (0.25 + i * 0.1),
            reach: o.reach_info || undefined,
          })),
        },
        {
          id: 'premium',
          name: 'חבילה פרימיום',
          description: 'חשיפה מקסימלית ומגוונת',
          totalPrice: budget * 1.2,
          items: outlets.slice(0, 4).map((o, i) => ({
            id: o.id,
            name: o.name_he || o.name,
            price: budget * (0.2 + i * 0.1),
            reach: o.reach_info || undefined,
          })),
        },
      ];
      setPackages(mockPackages);
    }
    
    setIsLoadingPackages(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      maximumFractionDigits: 0 
    }).format(price);
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

      {/* Media Selection - Prominent Mode Choice */}
      {showPackages && selectionMode === null && (
        <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-br from-primary/5 to-primary/10 pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 flex items-center justify-center">
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">איך נבחר מדיה?</CardTitle>
            <CardDescription className="text-base">
              בחר את הדרך המתאימה לך לבניית חבילת המדיה
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* AI Packages Option */}
              <button
                type="button"
                onClick={() => setSelectionMode('packages')}
                className="group p-6 rounded-2xl border-3 border-primary/30 hover:border-primary bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all hover:shadow-xl hover:scale-[1.02] text-right"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Wand2 className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-600" />
                      תבחרו לי אתם
                    </h3>
                    <p className="text-muted-foreground">
                      המערכת תבנה חבילות מותאמות אישית לפי התקציב וקהל היעד
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 text-violet-600 text-sm font-bold bg-violet-100 px-3 py-1.5 rounded-full">
                        ⚡ מהיר ומומלץ
                        <ArrowLeft className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Manual Selection Option */}
              <button
                type="button"
                onClick={() => setSelectionMode('manual')}
                className="group p-6 rounded-2xl border-2 border-muted hover:border-amber-500/50 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all hover:shadow-xl hover:scale-[1.02] text-right"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MousePointerClick className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-foreground">
                      אני אבחר בעצמי
                    </h3>
                    <p className="text-muted-foreground">
                      שליטה מלאה על כל ערוץ מדיה ופלטפורמה בנפרד
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 text-amber-600 text-sm font-medium bg-amber-100 px-3 py-1.5 rounded-full">
                        🎯 שליטה מלאה
                        <ArrowLeft className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packages View */}
      {showPackages && selectionMode === 'packages' && (
        <div className="space-y-6">
          {/* Mode Switch Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectionMode(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              <span>חזרה לבחירת שיטה</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionMode('manual')}
              className="gap-2"
            >
              <MousePointerClick className="w-4 h-4" />
              עבור לבחירה ידנית
            </Button>
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wand2 className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">חבילות מדיה מותאמות</CardTitle>
              </div>
              <CardDescription>
                מותאמות לתקציב {formatPrice(budget)} וקהל {STREAMS.find(s => s.id === targetStream)?.label} {GENDERS.find(g => g.id === targetGender)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPackages ? (
                <div className="text-center py-8 text-muted-foreground">טוען חבילות...</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className={`cursor-pointer transition-all hover:shadow-lg relative ${
                        selectedPackage?.id === pkg.id
                          ? 'ring-2 ring-primary shadow-lg border-primary'
                          : 'hover:border-primary/50'
                      } ${pkg.recommended ? 'border-primary/50' : ''}`}
                      onClick={() => onPackageSelect(pkg)}
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
                          {pkg.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.name}</span>
                              <span className="font-medium">{formatPrice(item.price)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t pt-3 flex justify-between items-center">
                          <span className="font-bold">סה"כ</span>
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
              )}

              {/* Edit Selected Package Option */}
              {selectedPackage && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedPackage.name}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(selectedPackage.totalPrice)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectionMode('manual')}
                        className="gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        ערוך והתאם
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generatePackages}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        חבילות אחרות
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual Selection View */}
      {showPackages && selectionMode === 'manual' && (
        <div className="space-y-6">
          {/* Mode Switch Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectionMode(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              <span>חזרה לבחירת שיטה</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionMode('packages')}
              className="gap-2"
            >
              <Wand2 className="w-4 h-4" />
              עבור לחבילות מוכנות
            </Button>
          </div>

          <Card className="border-2 border-amber-500/20">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MousePointerClick className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-xl">בחירה ידנית של מדיה</CardTitle>
              </div>
              <CardDescription>
                בחר בעצמך את ערוצי המדיה המדויקים לקמפיין שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MediaSelector 
                onSelect={(selection) => onManualMediaSelect?.(selection)}
                selectedMedia={manualMediaSelection}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};