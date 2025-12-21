import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight, 
  Building2, Newspaper, Package, Ruler, MapPin, DollarSign, Upload, X, Image,
  Radio, Globe, MessageSquare, Megaphone, type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Types
interface Category {
  id: string;
  name: string;
  name_he: string;
  sort_order: number;
}

interface Outlet {
  id: string;
  category_id: string;
  name: string;
  name_he: string | null;
  sector: string | null;
  city: string | null;
  is_active: boolean;
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
  base_price: number;
  client_price: number;
  is_active: boolean;
  target_audience: string | null;
  special_tag: string | null;
}

interface Spec {
  id: string;
  product_id: string;
  name: string;
  name_he: string | null;
  dimensions: string | null;
  base_price: number;
  client_price: number;
  is_active: boolean;
}

interface City {
  id: string;
  name: string;
  name_he: string;
  is_active: boolean;
}

const SECTORS = [
  { id: 'litvish', label: 'ליטאי' },
  { id: 'chassidish', label: 'חסידי' },
  { id: 'sefardi', label: 'ספרדי' },
  { id: 'general', label: 'כללי' },
];

const MediaDatabaseAdmin = () => {
  const [activeTab, setActiveTab] = useState('outlets');
  const [categories, setCategories] = useState<Category[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedOutlets, setExpandedOutlets] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [outletDialog, setOutletDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [specDialog, setSpecDialog] = useState(false);
  const [cityDialog, setCityDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSpec, setEditingSpec] = useState<Spec | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form states
  const [outletForm, setOutletForm] = useState({
    name: '', name_he: '', sector: 'general', city: '', is_active: true,
    vibe: '', vibe_he: '', warning_text: '', reach_info: '', brand_color: '#E31E24', logo_url: ''
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [productForm, setProductForm] = useState({
    name: '', name_he: '', product_type: '', requires_text: false, 
    requires_image: true, base_price: 0, client_price: 0, is_active: true,
    target_audience: 'general', special_tag: ''
  });
  const [specForm, setSpecForm] = useState({
    name: '', name_he: '', dimensions: '', base_price: 0, client_price: 0, is_active: true
  });
  const [cityForm, setCityForm] = useState({ name: '', name_he: '', is_active: true });
  const [categoryForm, setCategoryForm] = useState({ name: '', name_he: '', sort_order: 0 });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    
    const [catRes, outRes, prodRes, specRes, cityRes] = await Promise.all([
      supabase.from('media_categories').select('*').order('sort_order'),
      supabase.from('media_outlets').select('*'),
      supabase.from('media_products').select('*'),
      supabase.from('product_specs').select('*'),
      supabase.from('media_cities').select('*'),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (outRes.data) setOutlets(outRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (specRes.data) setSpecs(specRes.data);
    if (cityRes.data) setCities(cityRes.data);
    
    setIsLoading(false);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleOutlet = (id: string) => {
    setExpandedOutlets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleProduct = (id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Outlet CRUD
  const openAddOutlet = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingOutlet(null);
    setOutletForm({ 
      name: '', name_he: '', sector: 'general', city: '', is_active: true,
      vibe: '', vibe_he: '', warning_text: '', reach_info: '', brand_color: '#E31E24', logo_url: ''
    });
    setOutletDialog(true);
  };

  const openEditOutlet = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setSelectedCategoryId(outlet.category_id);
    setOutletForm({
      name: outlet.name,
      name_he: outlet.name_he || '',
      sector: outlet.sector || 'general',
      city: outlet.city || '',
      is_active: outlet.is_active,
      vibe: outlet.vibe || '',
      vibe_he: outlet.vibe_he || '',
      warning_text: outlet.warning_text || '',
      reach_info: outlet.reach_info || '',
      brand_color: outlet.brand_color || '#E31E24',
      logo_url: outlet.logo_url || ''
    });
    setOutletDialog(true);
  };

  const saveOutlet = async () => {
    if (!outletForm.name) { toast.error('נא להזין שם'); return; }

    const data = {
      ...outletForm,
      category_id: selectedCategoryId,
      city: outletForm.city || null,
      logo_url: outletForm.logo_url || null
    };

    if (editingOutlet) {
      const { error } = await supabase.from('media_outlets').update(data).eq('id', editingOutlet.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('media_outlets').insert(data);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setOutletDialog(false);
    loadAllData();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('נא להעלות קובץ תמונה בלבד');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('גודל הקובץ לא יעלה על 2MB');
      return;
    }

    setIsUploadingLogo(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('media-logos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('media-logos')
        .getPublicUrl(fileName);

      setOutletForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('הלוגו הועלה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת הלוגו');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setOutletForm(prev => ({ ...prev, logo_url: '' }));
  };

  const deleteOutlet = async (id: string) => {
    if (!confirm('בטוח למחוק? כל המוצרים והמפרטים יימחקו גם.')) return;
    const { error } = await supabase.from('media_outlets').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  // Product CRUD
  const openAddProduct = (outletId: string) => {
    setSelectedOutletId(outletId);
    setEditingProduct(null);
    setProductForm({
      name: '', name_he: '', product_type: '', requires_text: false,
      requires_image: true, base_price: 0, client_price: 0, is_active: true,
      target_audience: 'general', special_tag: ''
    });
    setProductDialog(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setSelectedOutletId(product.outlet_id);
    setProductForm({
      name: product.name,
      name_he: product.name_he || '',
      product_type: product.product_type,
      requires_text: product.requires_text,
      requires_image: product.requires_image,
      base_price: product.base_price,
      client_price: product.client_price,
      is_active: product.is_active,
      target_audience: product.target_audience || 'general',
      special_tag: product.special_tag || ''
    });
    setProductDialog(true);
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.product_type) {
      toast.error('נא להזין שם וסוג מוצר');
      return;
    }

    const data = { ...productForm, outlet_id: selectedOutletId };

    if (editingProduct) {
      const { error } = await supabase.from('media_products').update(data).eq('id', editingProduct.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('media_products').insert(data);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setProductDialog(false);
    loadAllData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('בטוח למחוק? כל המפרטים יימחקו גם.')) return;
    const { error } = await supabase.from('media_products').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  // Spec CRUD
  const openAddSpec = (productId: string) => {
    setSelectedProductId(productId);
    setEditingSpec(null);
    setSpecForm({ name: '', name_he: '', dimensions: '', base_price: 0, client_price: 0, is_active: true });
    setSpecDialog(true);
  };

  const openEditSpec = (spec: Spec) => {
    setEditingSpec(spec);
    setSelectedProductId(spec.product_id);
    setSpecForm({
      name: spec.name,
      name_he: spec.name_he || '',
      dimensions: spec.dimensions || '',
      base_price: spec.base_price,
      client_price: spec.client_price,
      is_active: spec.is_active
    });
    setSpecDialog(true);
  };

  const saveSpec = async () => {
    if (!specForm.name) { toast.error('נא להזין שם'); return; }

    const data = { ...specForm, product_id: selectedProductId };

    if (editingSpec) {
      const { error } = await supabase.from('product_specs').update(data).eq('id', editingSpec.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('product_specs').insert(data);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setSpecDialog(false);
    loadAllData();
  };

  const deleteSpec = async (id: string) => {
    if (!confirm('בטוח למחוק?')) return;
    const { error } = await supabase.from('product_specs').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  // City CRUD
  const openAddCity = () => {
    setEditingCity(null);
    setCityForm({ name: '', name_he: '', is_active: true });
    setCityDialog(true);
  };

  const openEditCity = (city: City) => {
    setEditingCity(city);
    setCityForm({ name: city.name, name_he: city.name_he, is_active: city.is_active });
    setCityDialog(true);
  };

  const saveCity = async () => {
    if (!cityForm.name || !cityForm.name_he) { toast.error('נא להזין שם'); return; }

    if (editingCity) {
      const { error } = await supabase.from('media_cities').update(cityForm).eq('id', editingCity.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('media_cities').insert(cityForm);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setCityDialog(false);
    loadAllData();
  };

  const deleteCity = async (id: string) => {
    if (!confirm('בטוח למחוק?')) return;
    const { error } = await supabase.from('media_cities').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  // Category CRUD
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', name_he: '', sort_order: categories.length });
    setCategoryDialog(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, name_he: category.name_he, sort_order: category.sort_order });
    setCategoryDialog(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name || !categoryForm.name_he) { toast.error('נא להזין שם'); return; }

    if (editingCategory) {
      const { error } = await supabase.from('media_categories').update(categoryForm).eq('id', editingCategory.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('media_categories').insert(categoryForm);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setCategoryDialog(false);
    loadAllData();
  };

  const deleteCategory = async (id: string) => {
    const categoryOutlets = outlets.filter(o => o.category_id === id);
    if (categoryOutlets.length > 0) {
      toast.error('לא ניתן למחוק קטגוריה עם ערוצים. מחק קודם את הערוצים.');
      return;
    }
    if (!confirm('בטוח למחוק?')) return;
    const { error } = await supabase.from('media_categories').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  const getSectorLabel = (sector: string | null) => {
    return SECTORS.find(s => s.id === sector)?.label || sector || '';
  };

  // Get category icon based on name
  const getCategoryIcon = (categoryName: string): LucideIcon => {
    const name = categoryName.toLowerCase();
    if (name.includes('עיתונות') || name.includes('print') || name.includes('newspaper')) return Newspaper;
    if (name.includes('רדיו') || name.includes('radio')) return Radio;
    if (name.includes('דיגיטל') || name.includes('digital') || name.includes('אתר')) return Globe;
    if (name.includes('ישיר') || name.includes('direct') || name.includes('whatsapp') || name.includes('email')) return MessageSquare;
    if (name.includes('רחוב') || name.includes('street') || name.includes('פרסום') || name.includes('outdoor')) return Megaphone;
    return Building2;
  };

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const catOutlets = outlets.filter(o => o.category_id === cat.id);
    return cat.name_he.includes(q) || catOutlets.some(o => 
      o.name.toLowerCase().includes(q) || o.name_he?.includes(q)
    );
  });

  if (isLoading) {
    return <div className="text-center p-8 text-muted-foreground">טוען...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">מאגר מדיה</h1>
          <p className="text-muted-foreground">ניהול היררכי: קטגוריה ← ערוץ ← מוצר ← מפרט</p>
        </div>
        <Button onClick={openAddCategory}>
          <Plus className="h-4 w-4 ml-2" />
          הוסף קטגוריה
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="outlets">ערוצי מדיה</TabsTrigger>
          <TabsTrigger value="cities">ערים</TabsTrigger>
        </TabsList>

        <TabsContent value="outlets">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש ערוץ או מוצר..."
              className="pr-10"
            />
          </div>

          {/* Hierarchical Tree */}
          <div className="space-y-4">
            {filteredCategories.map(category => {
              const categoryOutlets = outlets.filter(o => o.category_id === category.id);
              const isExpanded = expandedCategories.has(category.id);
              
              return (
                <Card key={category.id} className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {(() => {
                              const CategoryIcon = getCategoryIcon(category.name_he || category.name);
                              return <CategoryIcon className="h-5 w-5 text-primary" />;
                            })()}
                            <CardTitle className="text-base">{category.name_he}</CardTitle>
                            <Badge variant="secondary">{categoryOutlets.length} ערוצים</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); openAddOutlet(category.id); }}
                            >
                              <Plus className="h-4 w-4 ml-1" />
                              הוסף ערוץ
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); openEditCategory(category); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteCategory(category.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        {categoryOutlets.length === 0 ? (
                          <div className="text-muted-foreground text-sm pr-8">אין ערוצים בקטגוריה זו</div>
                        ) : (
                          <div className="space-y-2 pr-6">
                            {categoryOutlets.map(outlet => {
                              const outletProducts = products.filter(p => p.outlet_id === outlet.id);
                              const isOutletExpanded = expandedOutlets.has(outlet.id);
                              
                              return (
                                <Collapsible 
                                  key={outlet.id} 
                                  open={isOutletExpanded} 
                                  onOpenChange={() => toggleOutlet(outlet.id)}
                                >
                                  <div className="border rounded-lg">
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                          {isOutletExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                          {/* Brand Icon / Logo */}
                                          {outlet.logo_url ? (
                                            <img 
                                              src={outlet.logo_url} 
                                              alt={outlet.name}
                                              className="w-8 h-8 rounded object-contain bg-white flex-shrink-0"
                                            />
                                          ) : (
                                            <div 
                                              className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                              style={{ backgroundColor: outlet.brand_color || '#E31E24' }}
                                            >
                                              {(outlet.name_he || outlet.name).split(' ').slice(0, 2).map(w => w[0]).join('')}
                                            </div>
                                          )}
                                          <span className="font-medium">{outlet.name_he || outlet.name}</span>
                                          {outlet.sector && (
                                            <Badge variant="outline" className="text-xs">{getSectorLabel(outlet.sector)}</Badge>
                                          )}
                                          {outlet.city && (
                                            <Badge variant="outline" className="text-xs">
                                              <MapPin className="h-3 w-3 ml-1" />
                                              {cities.find(c => c.name === outlet.city)?.name_he || outlet.city}
                                            </Badge>
                                          )}
                                          <Badge variant="secondary" className="text-xs">{outletProducts.length} מוצרים</Badge>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button size="icon" variant="ghost" className="h-7 w-7"
                                            onClick={(e) => { e.stopPropagation(); openAddProduct(outlet.id); }}>
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-7 w-7"
                                            onClick={(e) => { e.stopPropagation(); openEditOutlet(outlet); }}>
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                                            onClick={(e) => { e.stopPropagation(); deleteOutlet(outlet.id); }}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CollapsibleTrigger>
                                    
                                    <CollapsibleContent>
                                      <div className="border-t p-3 pr-10 space-y-2 bg-muted/20">
                                        {outletProducts.length === 0 ? (
                                          <div className="text-muted-foreground text-sm">אין מוצרים</div>
                                        ) : outletProducts.map(product => {
                                          const productSpecs = specs.filter(s => s.product_id === product.id);
                                          const isProductExpanded = expandedProducts.has(product.id);
                                          
                                          return (
                                            <Collapsible 
                                              key={product.id}
                                              open={isProductExpanded}
                                              onOpenChange={() => toggleProduct(product.id)}
                                            >
                                              <div className="border rounded bg-card">
                                                <CollapsibleTrigger asChild>
                                                  <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/30 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                      {isProductExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                      <Package className="h-4 w-4 text-green-400" />
                                                      <span className="text-sm">{product.name_he || product.name}</span>
                                                      {product.requires_text && <Badge className="text-xs bg-purple-500/20 text-purple-300">טקסט</Badge>}
                                                      {product.requires_image && <Badge className="text-xs bg-orange-500/20 text-orange-300">תמונה</Badge>}
                                                      <Badge variant="secondary" className="text-xs">{productSpecs.length} מפרטים</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs text-muted-foreground">₪{product.client_price}</span>
                                                      <Button size="icon" variant="ghost" className="h-6 w-6"
                                                        onClick={(e) => { e.stopPropagation(); openAddSpec(product.id); }}>
                                                        <Plus className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="icon" variant="ghost" className="h-6 w-6"
                                                        onClick={(e) => { e.stopPropagation(); openEditProduct(product); }}>
                                                        <Pencil className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                                                        onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}>
                                                        <Trash2 className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </CollapsibleTrigger>
                                                
                                                <CollapsibleContent>
                                                  <div className="border-t p-2 pr-8 bg-muted/10">
                                                    {productSpecs.length === 0 ? (
                                                      <div className="text-muted-foreground text-xs">אין מפרטים</div>
                                                    ) : (
                                                      <div className="flex flex-wrap gap-2">
                                                        {productSpecs.map(spec => (
                                                          <div key={spec.id} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                                                            <Ruler className="h-3 w-3 text-yellow-400" />
                                                            <span className="text-xs">{spec.name_he || spec.name}</span>
                                                            {spec.dimensions && (
                                                              <span className="text-xs text-muted-foreground">({spec.dimensions})</span>
                                                            )}
                                                            <span className="text-xs text-primary">₪{spec.client_price}</span>
                                                            <Button size="icon" variant="ghost" className="h-5 w-5"
                                                              onClick={() => openEditSpec(spec)}>
                                                              <Pencil className="h-2 w-2" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive"
                                                              onClick={() => deleteSpec(spec.id)}>
                                                              <Trash2 className="h-2 w-2" />
                                                            </Button>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                </CollapsibleContent>
                                              </div>
                                            </Collapsible>
                                          );
                                        })}
                                      </div>
                                    </CollapsibleContent>
                                  </div>
                                </Collapsible>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="cities">
          <div className="flex justify-end mb-4">
            <Button onClick={openAddCity}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף עיר
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-right font-medium">שם (אנגלית)</th>
                    <th className="p-4 text-right font-medium">שם (עברית)</th>
                    <th className="p-4 text-right font-medium">סטטוס</th>
                    <th className="p-4 text-right font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map(city => (
                    <tr key={city.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">{city.name}</td>
                      <td className="p-4 font-medium">{city.name_he}</td>
                      <td className="p-4">
                        <Badge className={city.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {city.is_active ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditCity(city)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCity(city.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cities.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">אין ערים</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Outlet Dialog */}
      <Dialog open={outletDialog} onOpenChange={setOutletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOutlet ? 'עריכת ערוץ' : 'הוספת ערוץ חדש'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={outletForm.name} onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })} />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={outletForm.name_he} onChange={(e) => setOutletForm({ ...outletForm, name_he: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>זרם</Label>
                <Select value={outletForm.sector} onValueChange={(v) => setOutletForm({ ...outletForm, sector: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>עיר (אופציונלי)</Label>
                <Select value={outletForm.city} onValueChange={(v) => setOutletForm({ ...outletForm, city: v })}>
                  <SelectTrigger><SelectValue placeholder="בחר עיר" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ללא</SelectItem>
                    {cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name_he}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Vibe/Restriction Fields */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-semibold mb-2 block">אופי הערוץ והגבלות</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Vibe (אנגלית)</Label>
                  <Input 
                    value={outletForm.vibe} 
                    onChange={(e) => setOutletForm({ ...outletForm, vibe: e.target.value })} 
                    placeholder="strict_kosher, high_end_open, etc."
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vibe (עברית)</Label>
                  <Input 
                    value={outletForm.vibe_he} 
                    onChange={(e) => setOutletForm({ ...outletForm, vibe_he: e.target.value })}
                    placeholder="שמרני מאוד, מגזיני ופתוח, וכו'"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">מידע על חשיפה</Label>
                <Input 
                  value={outletForm.reach_info} 
                  onChange={(e) => setOutletForm({ ...outletForm, reach_info: e.target.value })}
                  placeholder="העיתון הליטאי המרכזי, 150K עותקים, וכו'"
                />
              </div>
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">אזהרה (יוצג למשתמש)</Label>
                <Textarea 
                  value={outletForm.warning_text} 
                  onChange={(e) => setOutletForm({ ...outletForm, warning_text: e.target.value })}
                  placeholder="מחייב בדיקת צניעות קפדנית..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
            {/* Logo Upload */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-semibold mb-2 block">לוגו ערוץ</Label>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              {outletForm.logo_url ? (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={outletForm.logo_url} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-contain rounded border bg-white"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    החלף לוגו
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="w-full h-20 border-dashed"
                >
                  {isUploadingLogo ? (
                    <span>מעלה...</span>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Image className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">לחץ להעלאת לוגו</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
            {/* Brand Color */}
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">צבע מותג</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="color" 
                    value={outletForm.brand_color}
                    onChange={(e) => setOutletForm({ ...outletForm, brand_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input 
                    value={outletForm.brand_color}
                    onChange={(e) => setOutletForm({ ...outletForm, brand_color: e.target.value })}
                    className="w-28"
                    placeholder="#E31E24"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={outletForm.is_active} onCheckedChange={(c) => setOutletForm({ ...outletForm, is_active: c })} />
                <Label>פעיל</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOutletDialog(false)}>ביטול</Button>
            <Button onClick={saveOutlet}>{editingOutlet ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={productForm.name_he} onChange={(e) => setProductForm({ ...productForm, name_he: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>סוג מוצר</Label>
              <Input 
                value={productForm.product_type} 
                onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value })} 
                placeholder="print_magazine, digital_banner, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>מחיר בסיס (₪)</Label>
                <Input type="number" value={productForm.base_price} 
                  onChange={(e) => setProductForm({ ...productForm, base_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>מחיר לקוח (₪)</Label>
                <Input type="number" value={productForm.client_price}
                  onChange={(e) => setProductForm({ ...productForm, client_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            {/* Target Audience & Special Tag */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>קהל יעד</Label>
                <Select value={productForm.target_audience} onValueChange={(v) => setProductForm({ ...productForm, target_audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">כללי</SelectItem>
                    <SelectItem value="women">נשים</SelectItem>
                    <SelectItem value="men">גברים</SelectItem>
                    <SelectItem value="youth">נוער</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>תג מיוחד</Label>
                <Select value={productForm.special_tag} onValueChange={(v) => setProductForm({ ...productForm, special_tag: v })}>
                  <SelectTrigger><SelectValue placeholder="ללא" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ללא</SelectItem>
                    <SelectItem value="high_reach">הפצה רוויה</SelectItem>
                    <SelectItem value="best_seller">רב מכר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={productForm.requires_image} onCheckedChange={(c) => setProductForm({ ...productForm, requires_image: c })} />
                <Label>דורש תמונה</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={productForm.requires_text} onCheckedChange={(c) => setProductForm({ ...productForm, requires_text: c })} />
                <Label>דורש טקסט</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={productForm.is_active} onCheckedChange={(c) => setProductForm({ ...productForm, is_active: c })} />
                <Label>פעיל</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProductDialog(false)}>ביטול</Button>
            <Button onClick={saveProduct}>{editingProduct ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spec Dialog */}
      <Dialog open={specDialog} onOpenChange={setSpecDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSpec ? 'עריכת מפרט' : 'הוספת מפרט חדש'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={specForm.name} onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })} />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={specForm.name_he} onChange={(e) => setSpecForm({ ...specForm, name_he: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>מידות</Label>
              <Input value={specForm.dimensions} onChange={(e) => setSpecForm({ ...specForm, dimensions: e.target.value })} 
                placeholder="A4, 300x250px, 30s, etc." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>מחיר בסיס (₪)</Label>
                <Input type="number" value={specForm.base_price}
                  onChange={(e) => setSpecForm({ ...specForm, base_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>מחיר לקוח (₪)</Label>
                <Input type="number" value={specForm.client_price}
                  onChange={(e) => setSpecForm({ ...specForm, client_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={specForm.is_active} onCheckedChange={(c) => setSpecForm({ ...specForm, is_active: c })} />
              <Label>פעיל</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSpecDialog(false)}>ביטול</Button>
            <Button onClick={saveSpec}>{editingSpec ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* City Dialog */}
      <Dialog open={cityDialog} onOpenChange={setCityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCity ? 'עריכת עיר' : 'הוספת עיר חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={cityForm.name_he} onChange={(e) => setCityForm({ ...cityForm, name_he: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={cityForm.is_active} onCheckedChange={(c) => setCityForm({ ...cityForm, is_active: c })} />
              <Label>פעיל</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCityDialog(false)}>ביטול</Button>
            <Button onClick={saveCity}>{editingCity ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                  placeholder="National Press" />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={categoryForm.name_he} onChange={(e) => setCategoryForm({ ...categoryForm, name_he: e.target.value })}
                  placeholder="עיתונות ארצית" />
              </div>
            </div>
            <div>
              <Label>סדר מיון</Label>
              <Input type="number" value={categoryForm.sort_order} 
                onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCategoryDialog(false)}>ביטול</Button>
            <Button onClick={saveCategory}>{editingCategory ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaDatabaseAdmin;
