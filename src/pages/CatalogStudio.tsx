import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Plus, Trash2, ChevronLeft, ChevronRight, Download,
  Package, Image as ImageIcon, Sparkles, Loader2
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

const DEFAULT_PAGES: CatalogPage[] = [
  { id: '1', type: 'cover', title: 'קטלוג מוצרים', subtitle: 'קולקציית 2025' },
  { id: '2', type: 'products', title: 'הקולקציה שלנו', products: [
    { id: 'p1', name: 'פריט פרימיום', description: 'עיצוב אלגנטי ומקורי בעבודת יד', price: '₪299', badge: 'חדש' },
    { id: 'p2', name: 'פריט קלאסי', description: 'איכות גבוהה עם גימור מושלם', price: '₪449' },
    { id: 'p3', name: 'פריט יוקרה', description: 'קולקציה מוגבלת למעצבים', price: '₪699', badge: 'מבצע' },
    { id: 'p4', name: 'פריט סטנדרט', description: 'הבחירה המושלמת לכל יום', price: '₪199' },
    { id: 'p5', name: 'פריט מיוחד', description: 'מהדורה מוגבלת בעיצוב ייחודי', price: '₪549', badge: 'חם' },
    { id: 'p6', name: 'פריט בסיסי', description: 'איכות מעולה במחיר נגיש', price: '₪149' },
  ]},
  { id: '3', type: 'text', title: 'הסיפור שלנו', body: 'אנחנו מאמינים שכל מוצר מספר סיפור. מאז 2010 אנחנו יוצרים חוויות ייחודיות שמשלבות עיצוב, איכות וחדשנות. הצוות שלנו עובד עם החומרים הטובים ביותר כדי להביא לכם מוצרים שמעוררים השראה ומשנים את חוויית היומיום.' },
  { id: '4', type: 'contact', title: 'בואו נדבר' },
];

const CatalogStudio = () => {
  const navigate = useNavigate();
  const { profile } = useClientProfile();
  const [pages, setPages] = useState<CatalogPage[]>(DEFAULT_PAGES);
  const [activePage, setActivePage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const brandColor = profile?.primary_color || '#E34870';
  const secondaryColor = profile?.secondary_color || '#1a1a2e';
  const businessName = profile?.business_name || 'שם העסק';
  const logoUrl = profile?.logo_url || undefined;
  const phone = profile?.contact_phone || '050-1234567';
  const email = profile?.contact_email || 'info@business.co.il';
  const address = profile?.contact_address || 'רחוב הרצל 1, תל אביב';

  const currentPage = pages[activePage];

  const updatePage = useCallback((index: number, updates: Partial<CatalogPage>) => {
    setPages(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
  }, []);

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
    setPages(prev => prev.filter((_, i) => i !== index));
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

        await new Promise(r => setTimeout(r, 600));
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/internal-studio')}>
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה
              </Button>
              <Badge variant="secondary" className="text-xs">עמוד {activePage + 1}/{pages.length}</Badge>
            </div>
            <Button size="sm" onClick={exportPDF} disabled={isExporting} className="bg-gradient-to-l from-primary to-primary/80 text-primary-foreground">
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
