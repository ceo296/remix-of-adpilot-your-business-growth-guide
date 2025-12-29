import { useState, useEffect } from 'react';
import { 
  Newspaper, Package, Ruler, MapPin, Check, Upload, FileText, 
  Image as ImageIcon, Info, AlertTriangle, Star, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  name_he: string;
}

interface Outlet {
  id: string;
  category_id: string;
  name: string;
  name_he: string | null;
  sector: string | null;
  city: string | null;
  vibe: string | null;
  vibe_he: string | null;
  warning_text: string | null;
  reach_info: string | null;
  logo_url: string | null;
  brand_color: string | null;
}

interface Product {
  id: string;
  outlet_id: string;
  name: string;
  name_he: string | null;
  product_type: string;
  requires_text: boolean;
  requires_image: boolean;
  client_price: number;
  target_audience: string | null;
  special_tag: string | null;
}

interface Spec {
  id: string;
  product_id: string;
  name: string;
  name_he: string | null;
  dimensions: string | null;
  client_price: number;
}

interface City {
  id: string;
  name: string;
  name_he: string;
}

interface SelectedMedia {
  category: Category;
  outlet: Outlet;
  product: Product;
  spec: Spec;
  requiresText: boolean;
  requiresImage: boolean;
  textContent?: string;
  imageFile?: File;
}

interface MediaSelectorProps {
  onSelect: (selection: SelectedMedia) => void;
  selectedMedia?: SelectedMedia | null;
}

const SECTORS = [
  { id: 'litvish', label: 'ליטאי' },
  { id: 'chassidish', label: 'חסידי' },
  { id: 'sefardi', label: 'ספרדי' },
  { id: 'general', label: 'כללי' },
];

const SPECIAL_TAGS = {
  high_reach: { label: 'הפצה רוויה', icon: Star, color: 'bg-yellow-500/20 text-yellow-400' },
  best_seller: { label: 'רב מכר', icon: Star, color: 'bg-green-500/20 text-green-400' },
};

const AUDIENCE_LABELS: Record<string, string> = {
  women: 'נשים',
  men: 'גברים',
  general: 'כללי',
  youth: 'נוער',
};

export const MediaSelector = ({ onSelect, selectedMedia }: MediaSelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(null);
  
  // Content state
  const [textContent, setTextContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [catRes, outRes, prodRes, specRes, cityRes] = await Promise.all([
      supabase.from('media_categories').select('*').order('sort_order'),
      supabase.from('media_outlets').select('*').eq('is_active', true),
      supabase.from('media_products').select('*').eq('is_active', true),
      supabase.from('product_specs').select('*').eq('is_active', true),
      supabase.from('media_cities').select('*').eq('is_active', true),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (outRes.data) setOutlets(outRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (specRes.data) setSpecs(specRes.data);
    if (cityRes.data) setCities(cityRes.data);
    setIsLoading(false);
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setSelectedOutlet(null);
    setSelectedProduct(null);
    setSelectedSpec(null);
  };

  const handleSelectOutlet = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setSelectedProduct(null);
    setSelectedSpec(null);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSpec(null);
  };

  const handleSelectSpec = (spec: Spec) => {
    setSelectedSpec(spec);
    
    if (selectedCategory && selectedOutlet && selectedProduct) {
      onSelect({
        category: selectedCategory,
        outlet: selectedOutlet,
        product: selectedProduct,
        spec: spec,
        requiresText: selectedProduct.requires_text,
        requiresImage: selectedProduct.requires_image,
        textContent: textContent || undefined,
        imageFile: imageFile || undefined,
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      if (selectedCategory && selectedOutlet && selectedProduct && selectedSpec) {
        onSelect({
          category: selectedCategory,
          outlet: selectedOutlet,
          product: selectedProduct,
          spec: selectedSpec,
          requiresText: selectedProduct.requires_text,
          requiresImage: selectedProduct.requires_image,
          textContent,
          imageFile: file,
        });
      }
    }
  };

  const handleTextChange = (text: string) => {
    setTextContent(text);
    if (selectedCategory && selectedOutlet && selectedProduct && selectedSpec) {
      onSelect({
        category: selectedCategory,
        outlet: selectedOutlet,
        product: selectedProduct,
        spec: selectedSpec,
        requiresText: selectedProduct.requires_text,
        requiresImage: selectedProduct.requires_image,
        textContent: text,
        imageFile: imageFile || undefined,
      });
    }
  };

  const getSectorLabel = (sector: string | null) => {
    return SECTORS.find(s => s.id === sector)?.label || sector || '';
  };

  const requiresCitySelection = selectedCategory?.name === 'local_print' || selectedCategory?.name === 'street';
  
  const filteredOutlets = outlets.filter(o => {
    if (!selectedCategory) return false;
    const matchesCategory = o.category_id === selectedCategory.id;
    const matchesCity = !requiresCitySelection || selectedCity === 'all' || o.city === selectedCity || !o.city;
    return matchesCategory && matchesCity;
  });

  const filteredProducts = products.filter(p => selectedOutlet && p.outlet_id === selectedOutlet.id);
  const filteredSpecs = specs.filter(s => selectedProduct && s.product_id === selectedProduct.id);

  if (isLoading) {
    return <div className="text-center p-8 text-muted-foreground">טוען מאגר מדיה...</div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Step 1: Category Selection */}
        <div>
          <Label className="text-lg font-semibold mb-3 block">1. בחר קטגוריה</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory?.id === category.id ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleSelectCategory(category)}
              >
                <Newspaper className="h-5 w-5" />
                <span>{category.name_he}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* City Selection (for local media) */}
        {requiresCitySelection && (
          <div>
            <Label className="text-lg font-semibold mb-3 block">בחר עיר</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="בחר עיר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הערים</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city.id} value={city.name}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {city.name_he}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Step 2: Outlet Selection with Tooltips */}
        {selectedCategory && (
          <div>
            <Label className="text-lg font-semibold mb-3 block">2. בחר ערוץ/כלי מדיה</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredOutlets.map(outlet => {
                // Get initials for the outlet icon
                const initials = (outlet.name_he || outlet.name)
                  .split(' ')
                  .slice(0, 2)
                  .map(word => word[0])
                  .join('');
                
                return (
                  <Card 
                    key={outlet.id}
                    className={`cursor-pointer transition-all ${
                      selectedOutlet?.id === outlet.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectOutlet(outlet)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Brand Icon/Avatar */}
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                          style={{ backgroundColor: outlet.brand_color || '#E31E24' }}
                        >
                          {outlet.logo_url ? (
                            <img src={outlet.logo_url} alt={outlet.name} className="w-8 h-8 object-contain" />
                          ) : (
                            initials
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{outlet.name_he || outlet.name}</span>
                            {/* Info Tooltip */}
                            {(outlet.vibe_he || outlet.reach_info) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                                    <Info className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1">
                                    {outlet.vibe_he && (
                                      <div className="font-medium">{outlet.vibe_he}</div>
                                    )}
                                    {outlet.reach_info && (
                                      <div className="text-sm text-muted-foreground">{outlet.reach_info}</div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {outlet.sector && (
                              <Badge variant="outline" className="text-xs">{getSectorLabel(outlet.sector)}</Badge>
                            )}
                            {outlet.vibe === 'strict_kosher' && (
                              <Badge className="text-xs bg-orange-500/20 text-orange-400">קפדן</Badge>
                            )}
                            {outlet.vibe === 'high_end_open' && (
                              <Badge className="text-xs bg-blue-500/20 text-blue-400">מגזיני</Badge>
                            )}
                          </div>
                        </div>
                        
                        {selectedOutlet?.id === outlet.id && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Warning for strict outlets */}
            {selectedOutlet?.warning_text && (
              <Alert className="mt-4 border-orange-500/50 bg-orange-500/10">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-400">
                  {selectedOutlet.warning_text}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 3: Product Selection */}
        {selectedOutlet && (
          <div>
            <Label className="text-lg font-semibold mb-3 block">3. בחר מוצר</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProducts.map(product => {
                const specialTag = product.special_tag ? SPECIAL_TAGS[product.special_tag as keyof typeof SPECIAL_TAGS] : null;
                
                return (
                  <Card 
                    key={product.id}
                    className={`cursor-pointer transition-all ${
                      selectedProduct?.id === product.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectProduct(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium">{product.name_he || product.name}</span>
                        </div>
                        {selectedProduct?.id === product.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {product.target_audience && product.target_audience !== 'general' && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 ml-1" />
                            {AUDIENCE_LABELS[product.target_audience] || product.target_audience}
                          </Badge>
                        )}
                        {specialTag && (
                          <Badge className={`text-xs ${specialTag.color}`}>
                            <specialTag.icon className="h-3 w-3 ml-1" />
                            {specialTag.label}
                          </Badge>
                        )}
                        {product.requires_image && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="h-3 w-3 ml-1" />
                            תמונה
                          </Badge>
                        )}
                        {product.requires_text && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 ml-1" />
                            טקסט
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Spec Selection */}
        {selectedProduct && filteredSpecs.length > 0 && (
          <div>
            <Label className="text-lg font-semibold mb-3 block">4. בחר מידות/פורמט</Label>
            <div className="flex flex-wrap gap-3">
              {filteredSpecs.map(spec => (
                <Button
                  key={spec.id}
                  variant={selectedSpec?.id === spec.id ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                  onClick={() => handleSelectSpec(spec)}
                >
                  <Ruler className="h-4 w-4" />
                  <span>{spec.name_he || spec.name}</span>
                  {spec.dimensions && (
                    <span className="text-xs opacity-70">({spec.dimensions})</span>
                  )}
                  {spec.client_price > 0 && (
                    <Badge variant="secondary">₪{spec.client_price}</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Content Input (based on product requirements) */}
        {selectedProduct && selectedSpec && (
          <div className="border-t pt-6 space-y-4">
            <Label className="text-lg font-semibold mb-3 block">5. העלאת תוכן</Label>
            
            {selectedProduct.requires_image && (
              <div>
                <Label className="mb-2 block">
                  העלאת תמונה
                  {selectedSpec.dimensions && <span className="text-muted-foreground"> ({selectedSpec.dimensions})</span>}
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {imageFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{imageFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setImageFile(null)}>
                        שנה
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">לחץ להעלאת קובץ</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )}
            
            {selectedProduct.requires_text && (
              <div>
                <Label className="mb-2 block">טקסט לפרסום</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="הזן את הטקסט לפרסום..."
                  className="min-h-[120px]"
                />
              </div>
            )}
          </div>
        )}

        {/* Selection Summary */}
        {selectedSpec && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-primary">בחירה נוכחית:</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCategory?.name_he} ← {selectedOutlet?.name_he || selectedOutlet?.name} ← {selectedProduct?.name_he || selectedProduct?.name} ← {selectedSpec?.name_he || selectedSpec?.name}
                  </div>
                </div>
                {selectedSpec.client_price > 0 && (
                  <Badge className="text-lg px-3 py-1">₪{selectedSpec.client_price}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default MediaSelector;
