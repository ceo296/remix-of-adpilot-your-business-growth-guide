import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  MapPin, 
  Check, 
  Package,
  Sparkles,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  targetStream: string;
  onTargetStreamChange: (value: string) => void;
  targetGender: string;
  onTargetGenderChange: (value: string) => void;
  targetCity: string;
  onTargetCityChange: (value: string) => void;
  selectedPackage: MediaPackage | null;
  onPackageSelect: (pkg: MediaPackage) => void;
}

const STREAMS = [
  { id: 'general', label: 'כללי', emoji: '🕎' },
  { id: 'litvish', label: 'ליטאי', emoji: '📖' },
  { id: 'hasidic', label: 'חסידי', emoji: '🎩' },
  { id: 'sephardi', label: 'ספרדי', emoji: '🕌' },
];

const GENDERS = [
  { id: 'men', label: 'גברים', emoji: '🧔' },
  { id: 'women', label: 'נשים', emoji: '👒' },
  { id: 'family', label: 'משפחה', emoji: '👨‍👩‍👧‍👦' },
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
  targetStream,
  onTargetStreamChange,
  targetGender,
  onTargetGenderChange,
  targetCity,
  onTargetCityChange,
  selectedPackage,
  onPackageSelect,
}: BudgetAudienceStepProps) => {
  const [packages, setPackages] = useState<MediaPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

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
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    targetStream === stream.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl block mb-1">{stream.emoji}</span>
                  <span className="font-medium text-sm">{stream.label}</span>
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
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    targetGender === gender.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl block mb-1">{gender.emoji}</span>
                  <span className="font-medium text-sm">{gender.label}</span>
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

      {/* Media Packages */}
      {showPackages && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-1">חבילות מדיה מומלצות</h3>
            <p className="text-muted-foreground text-sm">
              מותאמות לתקציב {formatPrice(budget)} וקהל {STREAMS.find(s => s.id === targetStream)?.label} {GENDERS.find(g => g.id === targetGender)?.label}
            </p>
          </div>

          {isLoadingPackages ? (
            <div className="text-center py-8 text-muted-foreground">טוען חבילות...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`cursor-pointer transition-all hover:shadow-lg relative ${
                    selectedPackage?.id === pkg.id
                      ? 'ring-2 ring-primary shadow-lg'
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
        </div>
      )}
    </div>
  );
};