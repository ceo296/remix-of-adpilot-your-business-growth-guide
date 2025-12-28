import { 
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, 
  Package, Ruler, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface OutletRowProps {
  outlet: Outlet;
  outletProducts: Product[];
  isOutletExpanded: boolean;
  toggleOutlet: (id: string) => void;
  openAddProduct: (outletId: string) => void;
  openEditOutlet: (outlet: Outlet) => void;
  deleteOutlet: (id: string) => void;
  getSectorLabel: (sector: string | null) => string;
  cities: City[];
  specs: Spec[];
  expandedProducts: Set<string>;
  toggleProduct: (id: string) => void;
  openAddSpec: (productId: string) => void;
  openEditProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  openEditSpec: (spec: Spec) => void;
  deleteSpec: (id: string) => void;
  showCity?: boolean;
}

const OutletRow = ({
  outlet,
  outletProducts,
  isOutletExpanded,
  toggleOutlet,
  openAddProduct,
  openEditOutlet,
  deleteOutlet,
  getSectorLabel,
  cities,
  specs,
  expandedProducts,
  toggleProduct,
  openAddSpec,
  openEditProduct,
  deleteProduct,
  openEditSpec,
  deleteSpec,
  showCity = true
}: OutletRowProps) => {
  return (
    <Collapsible 
      open={isOutletExpanded} 
      onOpenChange={() => toggleOutlet(outlet.id)}
    >
      <div className="border rounded-lg">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              {isOutletExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
              {showCity && outlet.city && (
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
};

export default OutletRow;
