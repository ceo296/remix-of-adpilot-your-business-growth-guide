import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  MapPin,
  Trash2,
  Newspaper,
  Radio,
  Globe,
  MessageCircle,
  Mail,
  Users,
  ChevronDown,
  ChevronUp,
  CalendarDays,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Category mapping from FastTrackWizard media types to DB category names
const MEDIA_TYPE_TO_CATEGORIES: Record<string, string[]> = {
  newspapers: ['newspapers', 'magazines'],
  digital: ['digital'],
  radio: ['radio'],
  email: ['newsletters'],
  whatsapp: ['whatsapp'],
  signage: [], // future
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  newspapers: Newspaper,
  magazines: Newspaper,
  digital: Globe,
  radio: Radio,
  whatsapp: MessageCircle,
  newsletters: Mail,
  influencers: Users,
};

interface Outlet {
  id: string;
  name: string;
  name_he: string | null;
  city: string | null;
  stream: string | null;
  vibe_he: string | null;
  reach_info: string | null;
  brand_color: string | null;
  category_id: string;
  category_name: string;
  category_name_he: string;
}

interface Product {
  id: string;
  name: string;
  name_he: string | null;
  outlet_id: string;
  product_type: string;
  client_price: number;
  gender_target: string | null;
  target_audience: string | null;
  special_tag: string | null;
}

export interface CartItem {
  outletId: string;
  outletName: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  schedulingNote: string;
}

interface MediaSelfSelectionProps {
  selectedMediaTypes: string[];
  mediaScope?: 'national' | 'local' | 'both';
  onCartChange: (items: CartItem[]) => void;
  cart: CartItem[];
}

export const MediaSelfSelection = ({ selectedMediaTypes, mediaScope, onCartChange, cart }: MediaSelfSelectionProps) => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [outletProducts, setOutletProducts] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  // Load outlets and products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Get relevant category names
      const categoryNames = selectedMediaTypes.flatMap(t => MEDIA_TYPE_TO_CATEGORIES[t] || []);
      if (categoryNames.length === 0) {
        setLoading(false);
        return;
      }

      // Load categories to get IDs
      const { data: categories } = await supabase
        .from('media_categories')
        .select('id, name, name_he')
        .in('name', categoryNames);

      if (!categories || categories.length === 0) {
        setLoading(false);
        return;
      }

      const categoryIds = categories.map(c => c.id);
      const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

      // Load outlets
      const { data: outletsData } = await supabase
        .from('media_outlets')
        .select('*')
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .order('name_he');

      // Load all products for these outlets
      const outletIds = (outletsData || []).map(o => o.id);
      let productsData: any[] = [];
      if (outletIds.length > 0) {
        const { data } = await supabase
          .from('media_products')
          .select('*')
          .in('outlet_id', outletIds)
          .eq('is_active', true);
        productsData = data || [];
      }

      setOutlets((outletsData || []).map(o => ({
        ...o,
        category_name: categoryMap[o.category_id]?.name || '',
        category_name_he: categoryMap[o.category_id]?.name_he || '',
      })));
      setProducts(productsData);
      setLoading(false);
    };

    loadData();
  }, [selectedMediaTypes]);

  // Extract unique cities and streams for filters
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    outlets.forEach(o => { if (o.city) cities.add(o.city); });
    return Array.from(cities).sort();
  }, [outlets]);

  const availableStreams = useMemo(() => {
    const streams = new Set<string>();
    outlets.forEach(o => { if (o.stream) streams.add(o.stream); });
    return Array.from(streams).sort();
  }, [outlets]);

  // Filter outlets by search, city, stream
  const filteredOutlets = useMemo(() => {
    return outlets.filter(o => {
      if (filterCity !== 'all' && o.city !== filterCity) return false;
      if (filterStream !== 'all' && o.stream !== filterStream) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (
          !(o.name_he || o.name).toLowerCase().includes(q) &&
          !(o.city || '').toLowerCase().includes(q) &&
          !(o.vibe_he || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [outlets, searchQuery, filterCity, filterStream]);

  // Group outlets by category
  const groupedOutlets = useMemo(() => {
    const groups: Record<string, { label: string; outlets: Outlet[] }> = {};
    filteredOutlets.forEach(o => {
      if (!groups[o.category_name]) {
        groups[o.category_name] = { label: o.category_name_he, outlets: [] };
      }
      groups[o.category_name].outlets.push(o);
    });
    return groups;
  }, [filteredOutlets]);

  // Open outlet detail
  const handleOutletClick = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    const prods = products.filter(p => p.outlet_id === outlet.id);
    setOutletProducts(prods);
    // Pre-fill quantities from cart
    const qMap: Record<string, number> = {};
    prods.forEach(p => {
      const existing = cart.find(ci => ci.productId === p.id);
      qMap[p.id] = existing ? existing.quantity : 0;
    });
    setSelectedQuantities(qMap);
  };

  // Add to cart from dialog
  const handleAddToCart = () => {
    if (!selectedOutlet) return;
    const newCart = cart.filter(ci => ci.outletId !== selectedOutlet.id);

    Object.entries(selectedQuantities).forEach(([productId, qty]) => {
      if (qty > 0) {
        const product = outletProducts.find(p => p.id === productId);
        if (product) {
          newCart.push({
            outletId: selectedOutlet.id,
            outletName: selectedOutlet.name_he || selectedOutlet.name,
            productId: product.id,
            productName: product.name_he || product.name,
            unitPrice: product.client_price || 0,
            quantity: qty,
            schedulingNote: `${qty} סבבים`,
          });
        }
      }
    });

    onCartChange(newCart);
    setSelectedOutlet(null);
  };

  const removeFromCart = (productId: string) => {
    onCartChange(cart.filter(ci => ci.productId !== productId));
  };

  const totalPrice = cart.reduce((sum, ci) => sum + ci.unitPrice * ci.quantity, 0);

  const getSchedulingLabel = (categoryName: string) => {
    switch (categoryName) {
      case 'newspapers':
      case 'magazines':
        return 'סבבי פרסום (גיליונות)';
      case 'digital':
        return 'שבועות באוויר';
      case 'radio':
        return 'שבועות שידור';
      case 'whatsapp':
        return 'סבבי הפצה';
      case 'newsletters':
        return 'סבבי שליחה';
      default:
        return 'כמות';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">טוען ערוצי מדיה...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="חפש לפי שם, עיר או סוג..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 text-lg h-12"
        />
      </div>

      {/* City & Stream Filters */}
      {(availableCities.length > 1 || availableStreams.length > 1) && (
        <div className="flex flex-wrap gap-3">
          {availableCities.length > 1 && (
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="כל הערים" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הערים</SelectItem>
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {availableStreams.length > 1 && (
            <Select value={filterStream} onValueChange={setFilterStream}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="כל הזרמים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הזרמים</SelectItem>
                {availableStreams.map(stream => (
                  <SelectItem key={stream} value={stream}>{stream}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(filterCity !== 'all' || filterStream !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterCity('all'); setFilterStream('all'); }}
              className="text-muted-foreground"
            >
              נקה סינון
            </Button>
          )}
        </div>
      )}


      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(!showCart)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">{cart.length} פריטים נבחרו</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">₪{totalPrice.toLocaleString()}</span>
            {showCart ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
      )}

      {/* Cart Details */}
      {showCart && cart.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-semibold text-foreground">{item.outletName}</p>
                  <p className="text-sm text-muted-foreground">{item.productName} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">₪{(item.unitPrice * item.quantity).toLocaleString()}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border font-bold text-lg">
              <span>סה"כ</span>
              <span className="text-primary">₪{totalPrice.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outlet List grouped by category */}
      {Object.entries(groupedOutlets).map(([catName, group]) => {
        const Icon = CATEGORY_ICONS[catName] || Newspaper;
        return (
          <div key={catName} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">{group.label}</h3>
              <Badge variant="secondary" className="text-xs">{group.outlets.length}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.outlets.map((outlet) => {
                const outletInCart = cart.some(ci => ci.outletId === outlet.id);
                const outletTotal = cart
                  .filter(ci => ci.outletId === outlet.id)
                  .reduce((s, ci) => s + ci.unitPrice * ci.quantity, 0);

                return (
                  <Card
                    key={outlet.id}
                    onClick={() => handleOutletClick(outlet)}
                    className={cn(
                      'cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md border-2',
                      outletInCart
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground text-base">{outlet.name_he || outlet.name}</h4>
                          {outlet.vibe_he && (
                            <p className="text-xs text-muted-foreground mt-0.5">{outlet.vibe_he}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {outlet.city && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <MapPin className="w-3 h-3" />
                                {outlet.city}
                              </Badge>
                            )}
                            {outlet.stream && (
                              <Badge variant="outline" className="text-xs">{outlet.stream}</Badge>
                            )}
                          </div>
                        </div>
                        {outletInCart && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            ₪{outletTotal.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredOutlets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">לא נמצאו ערוצי מדיה</p>
          <p className="text-sm">נסה לשנות את החיפוש</p>
        </div>
      )}

      {/* Outlet Product Selection Dialog */}
      <Dialog open={!!selectedOutlet} onOpenChange={(open) => !open && setSelectedOutlet(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          {selectedOutlet && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedOutlet.name_he || selectedOutlet.name}
                </DialogTitle>
                {selectedOutlet.vibe_he && (
                  <p className="text-sm text-muted-foreground">{selectedOutlet.vibe_he}</p>
                )}
                {selectedOutlet.reach_info && (
                  <p className="text-xs text-muted-foreground">{selectedOutlet.reach_info}</p>
                )}
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <Label className="text-base font-semibold">
                  {getSchedulingLabel(selectedOutlet.category_name)}
                </Label>

                {outletProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">אין מוצרים זמינים</p>
                ) : (
                  <div className="space-y-3">
                    {outletProducts.map((product) => {
                      const qty = selectedQuantities[product.id] || 0;
                      return (
                        <div key={product.id} className="p-3 border border-border rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{product.name_he || product.name}</p>
                              {product.target_audience && (
                                <p className="text-xs text-muted-foreground">{product.target_audience}</p>
                              )}
                            </div>
                            <span className="text-sm font-bold text-primary">₪{(product.client_price || 0).toLocaleString()}</span>
                          </div>

                          {/* Quantity selector */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">כמות:</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedQuantities(prev => ({
                                  ...prev,
                                  [product.id]: Math.max(0, (prev[product.id] || 0) - 1)
                                }))}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-bold text-foreground">{qty}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedQuantities(prev => ({
                                  ...prev,
                                  [product.id]: (prev[product.id] || 0) + 1
                                }))}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {qty > 0 && (
                            <p className="text-xs text-primary font-semibold text-left">
                              סה"כ: ₪{((product.client_price || 0) * qty).toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dialog total & confirm */}
                {Object.values(selectedQuantities).some(q => q > 0) && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold">סה"כ עבור {selectedOutlet.name_he || selectedOutlet.name}:</span>
                      <span className="text-lg font-bold text-primary">
                        ₪{outletProducts.reduce((sum, p) => sum + (p.client_price || 0) * (selectedQuantities[p.id] || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <Button onClick={handleAddToCart} className="w-full" variant="default">
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  {cart.some(ci => ci.outletId === selectedOutlet.id) ? 'עדכן בחירה' : 'הוסף להזמנה'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaSelfSelection;
