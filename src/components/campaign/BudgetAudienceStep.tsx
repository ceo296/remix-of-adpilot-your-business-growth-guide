import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
  Sparkles,
  Star,
  Calendar as CalendarIcon,
  Bell,
  ChevronDown,
  AlertTriangle,
  Loader2,
  Newspaper,
  Radio,
  Globe,
  MessageCircle,
  Mail,
  UserCheck,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { MediaIntakeForm, initialMediaIntake, type MediaIntakeData } from './MediaIntakeForm';

type MediaScope = 'national' | 'local' | 'both';

interface CategoryData {
  id: string;
  name: string;
  nameHe: string;
  totalAvailableProducts: number;
  avgPrice: number;
  minPrice: number;
}

interface CategoryAllocation {
  categoryId: string;
  categoryName: string;
  categoryNameHe: string;
  amount: number;
  percentage: number;
  icon: React.ReactNode;
}

interface MediaPackage {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  allocations: CategoryAllocation[];
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
  clientProfileId?: string;
  campaignName?: string;
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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  newspapers: <Newspaper className="h-4 w-4" />,
  magazines: <BookOpen className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  digital: <Globe className="h-4 w-4" />,
  newsletters: <Mail className="h-4 w-4" />,
  influencers: <UserCheck className="h-4 w-4" />,
  radio: <Radio className="h-4 w-4" />,
};

// 3 different allocation strategies
const ALLOCATION_PROFILES: Record<string, Record<string, number>> = {
  focused: {
    newspapers: 0.45,
    magazines: 0.20,
    whatsapp: 0.15,
    digital: 0.05,
    newsletters: 0.05,
    influencers: 0.05,
    radio: 0.05,
  },
  balanced: {
    newspapers: 0.25,
    magazines: 0.15,
    whatsapp: 0.15,
    digital: 0.15,
    newsletters: 0.10,
    influencers: 0.10,
    radio: 0.10,
  },
  digital_heavy: {
    newspapers: 0.15,
    magazines: 0.10,
    whatsapp: 0.25,
    digital: 0.20,
    newsletters: 0.10,
    influencers: 0.15,
    radio: 0.05,
  },
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
  clientProfileId,
  campaignName,
}: BudgetAudienceStepProps) => {
  const [packages, setPackages] = useState<MediaPackage[]>([]);
  const [packageConfirmed, setPackageConfirmed] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<CategoryData[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);

  // Fetch categories and product stats from database
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingMedia(true);
      try {
        const [categoriesRes, productsRes, outletsRes] = await Promise.all([
          supabase.from('media_categories').select('*').order('sort_order'),
          supabase.from('media_products').select('id, outlet_id, client_price, gender_target, product_type').eq('is_active', true),
          supabase.from('media_outlets').select('id, category_id, city, stream, name').eq('is_active', true),
        ]);

        const categories = categoriesRes.data || [];
        const products = productsRes.data || [];
        const outlets = outletsRes.data || [];

        // Build category stats
        const catData: CategoryData[] = categories.map(cat => {
          const catOutletIds = new Set(
            outlets.filter(o => o.category_id === cat.id).map(o => o.id)
          );
          const catProducts = products.filter(p => catOutletIds.has(p.outlet_id));
          const prices = catProducts.map(p => p.client_price || 0).filter(p => p > 0);

          return {
            id: cat.id,
            name: cat.name,
            nameHe: cat.name_he,
            totalAvailableProducts: catProducts.length,
            avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
            minPrice: prices.length ? Math.min(...prices) : 0,
          };
        }).filter(c => c.totalAvailableProducts > 0);

        setAvailableCategories(catData);
      } catch (err) {
        console.error('Failed to fetch media categories:', err);
      } finally {
        setLoadingMedia(false);
      }
    };

    fetchCategories();
  }, []);

  // Generate packages when params change
  useEffect(() => {
    if (budget > 0 && targetStream && targetGender && availableCategories.length > 0) {
      generatePackages();
      setPackageConfirmed(false);
    } else {
      setPackages([]);
      setValidationError(null);
    }
  }, [budget, targetStream, targetGender, targetCity, mediaScope, selectedMediaTypes, availableCategories]);

  const generatePackages = () => {
    if (!availableCategories.length) {
      setPackages([]);
      setValidationError('לא נמצאו קטגוריות מדיה זמינות.');
      return;
    }

    setValidationError(null);

    const availableCatNames = new Set(availableCategories.map(c => c.name));

    // Build 3 packages with different allocation profiles
    const packageDefs = [
      {
        id: 'focused',
        name: 'חבילה ממוקדת',
        description: 'דגש על עיתונות ומגזינים — חשיפה מסורתית חזקה',
        budgetMultiplier: 0.92,
        profile: ALLOCATION_PROFILES.focused,
      },
      {
        id: 'balanced',
        name: 'חבילה מאוזנת',
        description: 'פריסה רחבה על פני כל הפלטפורמות',
        budgetMultiplier: 1.0,
        profile: ALLOCATION_PROFILES.balanced,
        recommended: true,
      },
      {
        id: 'digital_heavy',
        name: 'חבילה דיגיטלית',
        description: 'דגש על WhatsApp, אתרים ומשפיענים',
        budgetMultiplier: 1.08,
        profile: ALLOCATION_PROFILES.digital_heavy,
      },
    ];

    const builtPackages: MediaPackage[] = packageDefs.map(def => {
      const pkgBudget = Math.round(budget * def.budgetMultiplier);

      // Only allocate to categories that actually exist in DB
      const rawAllocations: { catName: string; weight: number }[] = [];
      let totalWeight = 0;

      for (const [catName, weight] of Object.entries(def.profile)) {
        if (availableCatNames.has(catName)) {
          rawAllocations.push({ catName, weight });
          totalWeight += weight;
        }
      }

      // Normalize weights and create allocations
      const allocations: CategoryAllocation[] = rawAllocations
        .map(({ catName, weight }) => {
          const cat = availableCategories.find(c => c.name === catName)!;
          const normalizedPct = weight / totalWeight;
          const amount = Math.round(pkgBudget * normalizedPct);

          // Skip categories with very small allocations (less than min price)
          if (amount < cat.minPrice * 0.5) return null;

          return {
            categoryId: cat.id,
            categoryName: cat.name,
            categoryNameHe: cat.nameHe,
            amount,
            percentage: Math.round(normalizedPct * 100),
            icon: CATEGORY_ICONS[cat.name] || <Globe className="h-4 w-4" />,
          };
        })
        .filter(Boolean) as CategoryAllocation[];

      // Recalculate total from actual allocations
      const totalPrice = allocations.reduce((sum, a) => sum + a.amount, 0);

      return {
        id: def.id,
        name: def.name,
        description: def.description,
        totalPrice,
        allocations,
        recommended: def.recommended,
      };
    });

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

  const handleConfirmAndSave = async () => {
    if (!selectedPackage) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('יש להתחבר כדי לשמור את הבחירה');
        return;
      }

      // Serialize allocations without React icons for DB storage
      const allocationsForDb = selectedPackage.allocations.map((a: CategoryAllocation) => ({
        categoryId: a.categoryId,
        categoryName: a.categoryName,
        categoryNameHe: a.categoryNameHe,
        amount: a.amount,
        percentage: a.percentage,
      }));

      const campaignData = {
        user_id: user.id,
        client_profile_id: clientProfileId || user.id,
        name: campaignName || `קמפיין ${new Date().toLocaleDateString('he-IL')}`,
        budget,
        target_stream: targetStream,
        target_gender: targetGender,
        target_city: targetCity,
        start_date: startDate?.toISOString().split('T')[0] || null,
        end_date: endDate?.toISOString().split('T')[0] || null,
        status: 'pending_review',
        selected_media: {
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          totalPrice: selectedPackage.totalPrice,
          allocations: allocationsForDb,
        },
      };

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select('id')
        .single();

      if (error) throw error;

      setSavedCampaignId(campaign.id);
      setPackageConfirmed(true);
      toast.success('הבחירה נשמרה! הצוות שלנו יטפל בזה בהקדם');

      // Notify admin via edge function
      try {
        await supabase.functions.invoke('notify-admin-package', {
          body: {
            campaignId: campaign.id,
            userId: user.id,
            packageName: selectedPackage.name,
            totalPrice: selectedPackage.totalPrice,
            allocations: allocationsForDb,
            targetStream,
            targetGender,
            targetCity,
            budget,
          },
        });
      } catch (notifyErr) {
        console.warn('Admin notification failed (non-blocking):', notifyErr);
      }
    } catch (err) {
      console.error('Failed to save package selection:', err);
      toast.error('שגיאה בשמירת הבחירה. נסה שוב.');
    } finally {
      setIsSaving(false);
    }
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
              <CardTitle className="text-xl">חלוקת תקציב לפי ערוצים</CardTitle>
            </div>
            <CardDescription>
              איך תרצה לפרוס את {formatPrice(budget)}? בחר את הסגנון שמתאים לך
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
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription className="text-xs">{pkg.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {pkg.allocations.map((alloc) => (
                        <div key={alloc.categoryId} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{alloc.icon}</span>
                              <span className="text-foreground font-medium">{alloc.categoryNameHe}</span>
                            </div>
                            <span className="font-semibold text-primary">{formatPrice(alloc.amount)}</span>
                          </div>
                          {/* Budget bar */}
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/60"
                              style={{ width: `${alloc.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-bold text-sm">סה"כ</span>
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

            {selectedPackage && !savedCampaignId && (
              <div className="mt-6 text-center">
                <Button onClick={handleConfirmAndSave} size="lg" className="gap-2" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      זה הכיוון שלי, קדימה!
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {packageConfirmed && selectedPackage && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">מעולה! קיבלנו את הכיוון 🎯</h3>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              בחרת את <strong className="text-foreground">{selectedPackage.name}</strong> בתקציב של כ-{formatPrice(selectedPackage.totalPrice)}.
            </p>

            <div className="bg-card border border-border rounded-xl p-5 max-w-lg mx-auto text-right space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">מה קורה עכשיו?</strong>
                  </p>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    <li>הצוות שלנו יבדוק זמינות ומחירים סופיים מול ערוצי המדיה</li>
                    <li>תקבל באזור האישי <strong className="text-foreground">חבילה פרטנית מפורטת</strong> עם שמות מדיה, גדלים, מחירים ותאריכי פרסום</li>
                    <li>תאשר את החבילה הסופית ונצא לדרך! 🚀</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={() => setPackageConfirmed(false)} className="mt-2">
              <ChevronDown className="w-4 h-4 ml-1 rotate-90" />
              חזרה לבחירת כיוון
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
