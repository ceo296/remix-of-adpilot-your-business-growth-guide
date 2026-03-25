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
  ChevronDown,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

type MediaScope = 'national' | 'local' | 'both';

interface RealMediaItem {
  id: string;
  outletName: string;
  outletId: string;
  categoryName: string;
  categoryEn: string;
  productName: string;
  productId: string;
  productType: string;
  price: number;
  genderTarget: string;
  city: string | null;
  stream: string | null;
  vibeHe: string | null;
}

interface PackageItem {
  id: string;
  outletName: string;
  categoryName: string;
  productName: string;
  price: number;
  count: number;
}

interface MediaPackage {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  items: PackageItem[];
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
  selectedPackage: any;
  onPackageSelect: (pkg: any) => void;
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

// Map media type selections to DB category names
const MEDIA_TYPE_TO_DB_CATEGORY: Record<string, string[]> = {
  ad: ['newspapers', 'magazines'],
  banner: ['digital', 'whatsapp'],
  social: ['digital', 'whatsapp'],
  radio: ['radio'],
  email: ['newsletters'],
  whatsapp: ['whatsapp'],
  newspapers: ['newspapers', 'magazines'],
  digital: ['digital'],
  all: [],
};

// Category priority weights for budget allocation
const CATEGORY_PRIORITY: Record<string, number> = {
  newspapers: 1.5,
  magazines: 1.2,
  whatsapp: 1.0,
  digital: 1.25,
  newsletters: 0.8,
  influencers: 1.4,
  radio: 1.0,
};

const filterMediaByAudience = (
  items: RealMediaItem[],
  targetGender: string,
  targetCity: string,
): RealMediaItem[] => {
  let filtered = [...items];

  // Gender filtering
  if (targetGender === 'men') {
    filtered = filtered.filter(item =>
      item.genderTarget !== 'נשים' && !item.outletName.includes('לנשים')
    );
  } else if (targetGender === 'women') {
    // Keep women-targeted + general
    filtered = filtered.filter(item =>
      item.genderTarget !== 'גברים'
    );
  }

  // City filtering — if specific city, prefer local + national
  if (targetCity && targetCity !== 'nationwide') {
    const cityMap: Record<string, string> = {
      'jerusalem': 'ירושלים',
      'bnei-brak': 'בני ברק',
      'ashdod': 'אשדוד',
      'bet-shemesh': 'בית שמש',
      'modiin-illit': 'מודיעין עילית',
      'elad': 'אלעד',
    };
    const hebrewCity = cityMap[targetCity] || '';
    // Prioritize city-specific outlets, but also include national (no city)
    filtered = filtered.filter(item =>
      !item.city || item.city === hebrewCity || item.city === ''
    );
  }

  return filtered;
};

const buildPackageFromMedia = (
  tierId: string,
  tierBudget: number,
  mediaItems: RealMediaItem[],
  allowedCategories: string[] | null,
): PackageItem[] => {
  if (!mediaItems.length || tierBudget <= 0) return [];

  // Filter by allowed categories if specified
  let pool = allowedCategories?.length
    ? mediaItems.filter(item => allowedCategories.some(cat =>
        item.categoryEn.toLowerCase().includes(cat.toLowerCase())
      ))
    : [...mediaItems];

  if (!pool.length) pool = [...mediaItems];

  // Group by category
  const byCategory = new Map<string, RealMediaItem[]>();
  pool.forEach(item => {
    const key = item.categoryName;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(item);
  });

  const categories = Array.from(byCategory.keys());
  const prioritySum = categories.reduce((sum, cat) => {
    const catEn = byCategory.get(cat)![0].categoryEn;
    return sum + (CATEGORY_PRIORITY[catEn] || 1);
  }, 0);

  const items: PackageItem[] = [];
  let remainingBudget = tierBudget;

  for (const cat of categories) {
    const catItems = byCategory.get(cat)!;
    const catEn = catItems[0].categoryEn;
    const weight = CATEGORY_PRIORITY[catEn] || 1;
    const catBudget = (tierBudget * weight) / Math.max(prioritySum, 1);

    // Pick items that fit the category budget
    // Sort by price ascending to fit more items
    const sorted = [...catItems].sort((a, b) => a.price - b.price);

    let spent = 0;
    const pickedOutlets = new Set<string>();

    for (const item of sorted) {
      if (pickedOutlets.has(item.outletId)) continue;
      if (spent + item.price > catBudget * 1.3 && items.length > 0) break;
      if (remainingBudget - item.price < 0 && items.length > 0) break;

      // Determine count based on tier
      const count = tierId === 'premium' ? 3 : tierId === 'standard' ? 2 : 2;

      items.push({
        id: `${tierId}-${item.outletId}-${item.productId}`,
        outletName: item.outletName,
        categoryName: item.categoryName,
        productName: item.productName,
        price: item.price,
        count,
      });

      spent += item.price;
      remainingBudget -= item.price;
      pickedOutlets.add(item.outletId);
    }
  }

  return items;
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
  selectedMediaTypes = [],
  mediaScope,
}: BudgetAudienceStepProps) => {
  const [packages, setPackages] = useState<MediaPackage[]>([]);
  const [packageConfirmed, setPackageConfirmed] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [allMediaItems, setAllMediaItems] = useState<RealMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Fetch real media data from database
  useEffect(() => {
    const fetchMedia = async () => {
      setLoadingMedia(true);
      try {
        const [outletsRes, productsRes, categoriesRes] = await Promise.all([
          supabase.from('media_outlets').select('*').eq('is_active', true),
          supabase.from('media_products').select('*').eq('is_active', true),
          supabase.from('media_categories').select('*').order('sort_order'),
        ]);

        const outlets = outletsRes.data || [];
        const products = productsRes.data || [];
        const categories = categoriesRes.data || [];

        const catMap = new Map(categories.map(c => [c.id, c]));

        const items: RealMediaItem[] = [];
        for (const product of products) {
          const outlet = outlets.find(o => o.id === product.outlet_id);
          if (!outlet) continue;
          const category = catMap.get(outlet.category_id);
          if (!category) continue;

          items.push({
            id: `${outlet.id}-${product.id}`,
            outletName: outlet.name_he || outlet.name,
            outletId: outlet.id,
            categoryName: category.name_he,
            categoryEn: category.name,
            productName: product.name_he || product.name,
            productId: product.id,
            productType: product.product_type,
            price: product.client_price || 0,
            genderTarget: product.gender_target || 'כללי',
            city: outlet.city,
            stream: outlet.stream,
            vibeHe: outlet.vibe_he,
          });
        }

        setAllMediaItems(items);
      } catch (err) {
        console.error('Failed to fetch media data:', err);
      } finally {
        setLoadingMedia(false);
      }
    };

    fetchMedia();
  }, []);

  // Generate packages when params change
  useEffect(() => {
    if (budget > 0 && targetStream && targetGender && allMediaItems.length > 0) {
      generatePackages();
      setPackageConfirmed(false);
    } else {
      setPackages([]);
      setValidationError(null);
    }
  }, [budget, targetStream, targetGender, targetCity, mediaScope, selectedMediaTypes, allMediaItems]);

  const generatePackages = () => {
    // Filter by audience
    const filtered = filterMediaByAudience(allMediaItems, targetGender, targetCity);

    if (!filtered.length) {
      setPackages([]);
      setValidationError('לא נמצאו ערוצי מדיה תואמים לבחירות שלך. עדכן סוג מדיה/קהל יעד.');
      return;
    }

    setValidationError(null);

    // Determine allowed DB categories from selected media types
    let allowedCategories: string[] | null = null;
    if (selectedMediaTypes.length > 0 && !selectedMediaTypes.includes('all')) {
      const cats = new Set<string>();
      selectedMediaTypes.forEach(type => {
        const mapped = MEDIA_TYPE_TO_DB_CATEGORY[type] || [];
        mapped.forEach(c => cats.add(c));
      });
      allowedCategories = Array.from(cats);
    }

    const lowerBudget = Math.round(budget * 0.85);
    const exactBudget = budget;
    const higherBudget = Math.round(budget * 1.15);

    const economyItems = buildPackageFromMedia('economy', lowerBudget, filtered, allowedCategories);
    const standardItems = buildPackageFromMedia('standard', exactBudget, filtered, allowedCategories);
    const premiumItems = buildPackageFromMedia('premium', higherBudget, filtered, allowedCategories);

    const builtPackages: MediaPackage[] = [
      {
        id: 'economy',
        name: 'חבילה חסכונית',
        description: 'טווח תקציב נמוך יותר לתחילת קמפיין מדויקת',
        totalPrice: economyItems.reduce((sum, item) => sum + item.price, 0),
        items: economyItems,
      },
      {
        id: 'standard',
        name: 'חבילה מדויקת',
        description: 'מותאמת בדיוק לתקציב שהוגדר',
        totalPrice: standardItems.reduce((sum, item) => sum + item.price, 0),
        items: standardItems,
        recommended: true,
      },
      {
        id: 'premium',
        name: 'חבילה מורחבת',
        description: 'מעט רחבה יותר לחשיפה חזקה יותר',
        totalPrice: premiumItems.reduce((sum, item) => sum + item.price, 0),
        items: premiumItems,
      },
    ].filter((pkg) => pkg.items.length > 0);

    setPackages(builtPackages);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);

  const handleSelectPackage = (pkg: MediaPackage) => {
    onPackageSelect(pkg);
    setPackageConfirmed(false);
  };

  const showPackages = budget > 0 && targetStream && targetGender;

  return (
    <div className="space-y-8 animate-fade-in">
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
                    <Calendar mode="single" selected={startDate} onSelect={onStartDateChange} initialFocus />
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
                      disabled={(date) => (startDate ? date < startDate : false)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            קהל היעד
          </CardTitle>
          <CardDescription>בחר את הקהל שאליו מכוון הקמפיין</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-medium mb-3 block">זרם</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STREAMS.map((stream) => (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => onTargetStreamChange(stream.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden ${
                    targetStream === stream.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stream.color} opacity-${targetStream === stream.id ? '20' : '10'} transition-opacity`} />
                  <span className="font-medium text-sm relative z-10">{stream.label}</span>
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${stream.color} mx-auto mt-2`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-medium mb-3 block">מגדר</Label>
            <div className="grid grid-cols-3 gap-3">
              {GENDERS.map((gender) => (
                <button
                  key={gender.id}
                  type="button"
                  onClick={() => onTargetGenderChange(gender.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden ${
                    targetGender === gender.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gender.color} opacity-${targetGender === gender.id ? '20' : '10'} transition-opacity`} />
                  <span className="font-medium text-sm relative z-10">{gender.label}</span>
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${gender.color} mx-auto mt-2`} />
                </button>
              ))}
            </div>
          </div>

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

      {validationError && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <p className="text-sm text-foreground">{validationError}</p>
          </CardContent>
        </Card>
      )}

      {loadingMedia && showPackages && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">טוען מאגר מדיה...</p>
          </CardContent>
        </Card>
      )}

      {showPackages && !validationError && !packageConfirmed && !loadingMedia && packages.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">חבילות מדיה מותאמות</CardTitle>
            </div>
            <CardDescription>
              על בסיס תקציב {formatPrice(budget)} | {STREAMS.find((s) => s.id === targetStream)?.label} |{' '}
              {GENDERS.find((g) => g.id === targetGender)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all hover:shadow-lg relative ${
                    selectedPackage?.id === pkg.id ? 'ring-2 ring-primary shadow-lg border-primary' : 'hover:border-primary/50'
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
                      {pkg.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-medium">{item.outletName}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {item.categoryName}
                            </Badge>
                          </div>
                          <div className="text-left">
                            {item.count > 1 && <div className="text-[10px] text-muted-foreground">×{item.count}</div>}
                            <div className="font-medium text-primary">{formatPrice(item.price)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-bold text-sm">סה"כ משוער</span>
                      <span className="text-xl font-bold text-primary">{formatPrice(pkg.totalPrice)}</span>
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

            {selectedPackage && (
              <div className="mt-6 text-center">
                <Button onClick={() => setPackageConfirmed(true)} size="lg" className="gap-2">
                  <Check className="w-5 h-5" />
                  החבילה הזאת נשמעת לי
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {packageConfirmed && selectedPackage && (
        <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Bell className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">מעולה! 🎉</h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              בחרת את <strong className="text-foreground">{selectedPackage.name}</strong> בתקציב של עד{' '}
              {formatPrice(selectedPackage.totalPrice)}.
            </p>
            <div className="bg-card border border-border rounded-xl p-4 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-right text-muted-foreground">
                  תקבל הודעה באזור האישי שלך בהקדם עם <strong className="text-foreground">חבילה סופית מפורטת</strong>{' '}
                  הכוללת גדלים ומחירים מדויקים.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setPackageConfirmed(false)} className="mt-2">
              <ChevronDown className="w-4 h-4 ml-1 rotate-90" />
              חזרה לבחירת חבילה
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
