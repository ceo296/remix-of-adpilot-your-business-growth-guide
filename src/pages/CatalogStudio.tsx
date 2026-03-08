import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Plus, Trash2, ChevronLeft, ChevronRight, Download,
  Package, Sparkles, Loader2, Wand2, ImageIcon
} from 'lucide-react';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { CatalogPageRenderer } from '@/components/catalog/CatalogPageRenderer';
import type { CatalogPage, CatalogProduct } from '@/types/catalog';
import { supabase } from '@/integrations/supabase/client';

const PAGE_TYPES: { type: CatalogPage['type']; label: string }[] = [
  { type: 'cover', label: 'שער' },
  { type: 'toc', label: 'תוכן עניינים' },
  { type: 'products', label: 'גריד מוצרים' },
  { type: 'full-image', label: 'תמונה מלאה' },
  { type: 'text', label: 'טקסט חופשי' },
  { type: 'contact', label: 'צור קשר' },
];

// ── Simple Wizard Entry Screen ──
interface ProductEntry {
  id: string;
  name: string;
  price: string;
}

const CatalogWizard = ({
  onGenerate, businessName, isLoading,
}: {
  onGenerate: (products: ProductEntry[], catalogTitle: string) => void;
  businessName: string;
  isLoading: boolean;
}) => {
  const [catalogTitle, setCatalogTitle] = useState(`קטלוג ${businessName}`);
  const [products, setProducts] = useState<ProductEntry[]>([
    { id: '1', name: '', price: '' },
    { id: '2', name: '', price: '' },
    { id: '3', name: '', price: '' },
  ]);

  const addRow = () => {
    setProducts(prev => [...prev, { id: Date.now().toString(), name: '', price: '' }]);
  };

  const updateRow = (id: string, field: 'name' | 'price', value: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeRow = (id: string) => {
    if (products.length <= 1) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const filledProducts = products.filter(p => p.name.trim());

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-foreground">יצירת קטלוג מוצרים</h1>
          <p className="text-muted-foreground text-lg">
            כתוב שמות מוצרים ומחירים — AI ייצור את התמונות ויבנה קטלוג מקצועי
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-6 space-y-5">
            {/* Catalog title */}
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">שם הקטלוג</label>
              <Input
                value={catalogTitle}
                onChange={e => setCatalogTitle(e.target.value)}
                placeholder="למשל: קטלוג אביב 2025"
                className="text-base" dir="rtl"
              />
            </div>

            {/* Product list */}
            <div>
              <label className="text-sm font-bold text-foreground mb-3 block">
                מוצרים ({filledProducts.length} הוזנו)
              </label>
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {products.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0">{idx + 1}</span>
                    <Input
                      value={p.name}
                      onChange={e => updateRow(p.id, 'name', e.target.value)}
                      placeholder="שם המוצר"
                      className="text-sm flex-1" dir="rtl"
                    />
                    <Input
                      value={p.price}
                      onChange={e => updateRow(p.id, 'price', e.target.value)}
                      placeholder="מחיר"
                      className="text-sm w-24" dir="rtl"
                    />
                    <Button
                      variant="ghost" size="sm"
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => removeRow(p.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addRow} className="mt-2 w-full gap-1">
                <Plus className="w-3.5 h-3.5" />
                הוסף מוצר
              </Button>
            </div>

            {/* Info notice */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
              <ImageIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">AI ייצור תמונה לכל מוצר</p>
                <p className="text-xs text-muted-foreground mt-0.5">המערכת תייצר תמונת מוצר מקצועית לכל פריט שהזנת — אין צורך לצלם!</p>
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg gap-2 font-bold"
              onClick={() => onGenerate(filledProducts, catalogTitle)}
              disabled={filledProducts.length === 0 || isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />יוצר קטלוג ותמונות...</>
              ) : (
                <><Wand2 className="w-5 h-5" />צור קטלוג ✨</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ── Main Component ──
const CatalogStudio = () => {
  const navigate = useNavigate();
  const { profile } = useClientProfile();
  const [pages, setPages] = useState<CatalogPage[] | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagesGenerating, setImagesGenerating] = useState(0);

  const brandColor = profile?.primary_color || '#E34870';
  const secondaryColor = profile?.secondary_color || '#1a1a2e';
  const businessName = profile?.business_name || 'שם העסק';
  const logoUrl = profile?.logo_url || undefined;
  const phone = profile?.contact_phone || '';
  const email = profile?.contact_email || '';
  const address = profile?.contact_address || '';

  // Generate product image via AI
  const generateProductImage = useCallback(async (
    pageIndex: number, productId: string, productName: string
  ) => {
    try {
      setImagesGenerating(prev => prev + 1);
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: {
          productName,
          businessType: profile?.x_factors?.[0] || profile?.primary_x_factor || businessName,
          brandColor,
        },
      });
      if (error || data?.error) {
        console.warn(`Product image failed for "${productName}":`, error || data?.error);
        return;
      }
      if (data?.imageUrl) {
        setPages(prev => {
          if (!prev) return prev;
          return prev.map((page, pi) => {
            if (pi !== pageIndex || page.type !== 'products') return page;
            return {
              ...page,
              products: page.products?.map(p =>
                p.id === productId ? { ...p, imageUrl: data.imageUrl } : p
              ),
            };
          });
        });
      }
    } catch (err) {
      console.warn(`Product image gen error:`, err);
    } finally {
      setImagesGenerating(prev => prev - 1);
    }
  }, [brandColor, businessName, profile]);

  const handleGenerate = async (products: ProductEntry[], catalogTitle: string) => {
    setIsGenerating(true);
    try {
      // Build catalog pages from products
      const productsPerPage = 6;
      const productPages: CatalogPage[] = [];

      for (let i = 0; i < products.length; i += productsPerPage) {
        const chunk = products.slice(i, i + productsPerPage);
        productPages.push({
          id: `products-${i}`,
          type: 'products',
          title: i === 0 ? 'המוצרים שלנו' : `המוצרים שלנו (המשך)`,
          products: chunk.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price ? `₪${p.price.replace(/[₪\s]/g, '')}` : undefined,
            description: '',
          })),
        });
      }

      // Also try to generate descriptions via AI
      try {
        const { data: aiData } = await supabase.functions.invoke('generate-internal-material', {
          body: {
            type: 'catalog',
            profileData: {
              businessName,
              phone, email, address,
              website: profile?.website_url,
              xFactors: profile?.x_factors,
              targetAudience: profile?.target_audience,
              winningFeature: profile?.winning_feature,
            },
            extraContext: {
              productNames: products.map(p => p.name),
              productCount: products.length,
            },
          },
        });
        // Merge AI descriptions if available
        if (aiData?.result?.products) {
          const aiProducts = aiData.result.products;
          productPages.forEach(page => {
            page.products?.forEach(product => {
              const aiMatch = aiProducts.find((ap: any) =>
                ap.name?.includes(product.name) || product.name?.includes(ap.name)
              );
              if (aiMatch?.description) {
                product.description = aiMatch.description;
              }
              if (aiMatch?.badge) {
                product.badge = aiMatch.badge;
              }
            });
          });
        }
      } catch (aiErr) {
        console.warn('AI descriptions failed, using basic catalog:', aiErr);
      }

      const allPages: CatalogPage[] = [
        { id: 'cover', type: 'cover', title: catalogTitle, subtitle: `${businessName}` },
        ...productPages,
        { id: 'contact', type: 'contact', title: 'בואו נדבר' },
      ];

      setPages(allPages);
      setActivePage(0);
      toast.success(`הקטלוג נוצר עם ${products.length} מוצרים! מייצר תמונות...`);

      // Generate images for all products (staggered, 2 at a time)
      const allProducts: { pageIndex: number; productId: string; name: string }[] = [];
      allPages.forEach((page, pageIdx) => {
        if (page.type === 'products') {
          page.products?.forEach(p => {
            allProducts.push({ pageIndex: pageIdx, productId: p.id, name: p.name });
          });
        }
      });

      const batchSize = 2;
      for (let b = 0; b < allProducts.length; b += batchSize) {
        const batch = allProducts.slice(b, b + batchSize);
        await Promise.allSettled(
          batch.map(item => generateProductImage(item.pageIndex, item.productId, item.name))
        );
      }

      toast.success('כל התמונות נוצרו! ✨');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה ביצירת הקטלוג. נסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Wizard screen ──
  if (!pages) {
    return (
      <>
        <TopNavbar />
        <CatalogWizard onGenerate={handleGenerate} businessName={businessName} isLoading={isGenerating} />
      </>
    );
  }

  const currentPage = pages[activePage];

  const updatePage = (index: number, updates: Partial<CatalogPage>) => {
    setPages(prev => prev!.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const addPage = (type: CatalogPage['type']) => {
    const newPage: CatalogPage = {
      id: Date.now().toString(),
      type,
      title: PAGE_TYPES.find(t => t.type === type)?.label || 'עמוד חדש',
      products: type === 'products' ? [{ id: Date.now().toString(), name: 'מוצר חדש', price: '₪0' }] : undefined,
    };
    const np = [...pages];
    np.splice(activePage + 1, 0, newPage);
    setPages(np);
    setActivePage(activePage + 1);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev!.filter((_, i) => i !== index));
    setActivePage(Math.min(activePage, pages.length - 2));
  };

  const addProduct = () => {
    if (currentPage.type !== 'products') return;
    const newProducts = [...(currentPage.products || []), { id: Date.now().toString(), name: 'מוצר חדש', price: '₪0' }];
    updatePage(activePage, { products: newProducts });
  };

  const updateProduct = (productId: string, updates: Partial<CatalogProduct>) => {
    const newProducts = (currentPage.products || []).map(p => p.id === productId ? { ...p, ...updates } : p);
    updatePage(activePage, { products: newProducts });
  };

  const removeProduct = (productId: string) => {
    const newProducts = (currentPage.products || []).filter(p => p.id !== productId);
    updatePage(activePage, { products: newProducts });
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const W = 794;
      const H = 1123;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [W, H] });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage([W, H], 'portrait');
        const container = document.createElement('div');
        container.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;overflow:hidden;`;
        document.body.appendChild(container);

        const { default: htmlToImage } = await import('html-to-image');
        const root = document.createElement('div');
        root.style.cssText = `width:${W}px;height:${H}px;position:relative;overflow:hidden;`;
        container.appendChild(root);

        const { createRoot } = await import('react-dom/client');
        const reactRoot = createRoot(root);
        reactRoot.render(
          <CatalogPageRenderer
            page={pages[i]}
            brandColor={brandColor}
            secondaryColor={secondaryColor}
            businessName={businessName}
            logoUrl={logoUrl}
            phone={phone}
            email={email}
            address={address}
            scale={1}
          />
        );

        await new Promise(r => setTimeout(r, 800));
        const dataUrl = await htmlToImage.toPng(root, { width: W, height: H, quality: 0.95 });
        pdf.addImage(dataUrl, 'PNG', 0, 0, W, H);
        reactRoot.unmount();
        document.body.removeChild(container);
      }

      pdf.save(`${businessName}-catalog.pdf`);
      toast.success('הקטלוג יוצא בהצלחה!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('שגיאה בייצוא הקטלוג');
    }
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Page thumbnails */}
        <div className="w-44 bg-card border-l border-border overflow-y-auto p-3 space-y-2">
          {pages.map((page, i) => (
            <div
              key={page.id}
              className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                i === activePage ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/30'
              }`}
              onClick={() => setActivePage(i)}
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <CatalogPageRenderer
                  page={page}
                  brandColor={brandColor}
                  secondaryColor={secondaryColor}
                  businessName={businessName}
                  logoUrl={logoUrl}
                  phone={phone}
                  email={email}
                  address={address}
                  scale={0.17}
                />
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 flex items-center justify-between">
                <span>{i + 1}</span>
                <button
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); deletePage(i); }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          <div className="border-2 border-dashed border-border rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground text-center mb-1">הוסף עמוד</p>
            <div className="grid grid-cols-2 gap-1">
              {PAGE_TYPES.map(pt => (
                <button
                  key={pt.type}
                  onClick={() => addPage(pt.type)}
                  className="text-[9px] py-1 px-1 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-center"
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPages(null)}>
                <ArrowRight className="w-4 h-4 ml-1" />
                קטלוג חדש
              </Button>
              <Badge variant="secondary" className="text-xs">עמוד {activePage + 1}/{pages.length}</Badge>
              {imagesGenerating > 0 && (
                <Badge variant="outline" className="text-xs gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  מייצר {imagesGenerating} תמונות...
                </Badge>
              )}
            </div>
            <Button size="sm" onClick={exportPDF} disabled={isExporting || imagesGenerating > 0} className="bg-gradient-to-l from-primary to-primary/80 text-primary-foreground">
              <Download className="w-4 h-4 ml-1" />
              {isExporting ? 'מייצא...' : 'ייצא PDF'}
            </Button>
          </div>

          <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 overflow-hidden">
            <div
              className="relative shadow-2xl rounded-lg overflow-hidden bg-white"
              style={{ width: 'min(55%, 420px)', aspectRatio: '794/1123' }}
            >
              <CatalogPageRenderer
                page={currentPage}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                businessName={businessName}
                logoUrl={logoUrl}
                phone={phone}
                email={email}
                address={address}
                scale={0.53}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-2 bg-card border-t border-border">
            <Button variant="ghost" size="sm" disabled={activePage === 0} onClick={() => setActivePage(p => p - 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{activePage + 1} / {pages.length}</span>
            <Button variant="ghost" size="sm" disabled={activePage === pages.length - 1} onClick={() => setActivePage(p => p + 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Panel - Edit */}
        <div className="w-72 bg-card border-r border-border overflow-y-auto p-4 space-y-4" dir="rtl">
          <h3 className="font-bold text-foreground text-sm">עריכת עמוד</h3>
          <Badge variant="outline">{PAGE_TYPES.find(t => t.type === currentPage.type)?.label}</Badge>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">כותרת</label>
              <Input
                value={currentPage.title}
                onChange={e => updatePage(activePage, { title: e.target.value })}
                className="text-sm" dir="rtl"
              />
            </div>

            {currentPage.type === 'cover' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">כותרת משנה</label>
                <Input
                  value={currentPage.subtitle || ''}
                  onChange={e => updatePage(activePage, { subtitle: e.target.value })}
                  className="text-sm" dir="rtl"
                />
              </div>
            )}

            {currentPage.type === 'text' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">תוכן</label>
                <Textarea
                  value={currentPage.body || ''}
                  onChange={e => updatePage(activePage, { body: e.target.value })}
                  className="text-sm min-h-[120px]" dir="rtl"
                />
              </div>
            )}

            {currentPage.type === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">מוצרים</label>
                  <Button variant="outline" size="sm" onClick={addProduct}>
                    <Plus className="w-3 h-3 ml-1" />
                    הוסף
                  </Button>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {(currentPage.products || []).map(product => (
                    <Card key={product.id} className="p-2">
                      <div className="space-y-1.5">
                        {/* Product image thumbnail */}
                        {product.imageUrl && (
                          <div className="h-16 rounded-md overflow-hidden bg-muted">
                            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex gap-1">
                          <Input
                            value={product.name}
                            onChange={e => updateProduct(product.id, { name: e.target.value })}
                            placeholder="שם מוצר" className="text-xs h-7" dir="rtl"
                          />
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeProduct(product.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Input
                          value={product.description || ''}
                          onChange={e => updateProduct(product.id, { description: e.target.value })}
                          placeholder="תיאור" className="text-xs h-7" dir="rtl"
                        />
                        <div className="flex gap-1">
                          <Input
                            value={product.price || ''}
                            onChange={e => updateProduct(product.id, { price: e.target.value })}
                            placeholder="מחיר" className="text-xs h-7 w-20" dir="rtl"
                          />
                          <Input
                            value={product.badge || ''}
                            onChange={e => updateProduct(product.id, { badge: e.target.value })}
                            placeholder="תגית (מבצע)" className="text-xs h-7" dir="rtl"
                          />
                        </div>
                        {/* Regenerate image button */}
                        <Button
                          variant="ghost" size="sm"
                          className="w-full h-6 text-[10px] gap-1"
                          onClick={() => generateProductImage(activePage, product.id, product.name)}
                        >
                          <Sparkles className="w-3 h-3" />
                          {product.imageUrl ? 'חדש תמונה' : 'צור תמונה'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogStudio;
