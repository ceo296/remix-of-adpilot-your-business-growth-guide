import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Package,
  Grid3X3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// ── Types ──
interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  badge?: string;
}

interface CatalogPage {
  id: string;
  type: 'cover' | 'toc' | 'products' | 'full-image' | 'text' | 'contact';
  title: string;
  subtitle?: string;
  body?: string;
  products?: CatalogProduct[];
}

const PAGE_TYPES: { type: CatalogPage['type']; label: string }[] = [
  { type: 'cover', label: 'שער' },
  { type: 'toc', label: 'תוכן עניינים' },
  { type: 'products', label: 'גריד מוצרים' },
  { type: 'full-image', label: 'תמונה מלאה' },
  { type: 'text', label: 'טקסט חופשי' },
  { type: 'contact', label: 'צור קשר' },
];

const DEFAULT_PAGES: CatalogPage[] = [
  { id: '1', type: 'cover', title: 'קטלוג מוצרים', subtitle: '2025' },
  { id: '2', type: 'products', title: 'המוצרים שלנו', products: [
    { id: 'p1', name: 'מוצר ראשון', description: 'תיאור קצר של המוצר', price: '₪99' },
    { id: 'p2', name: 'מוצר שני', description: 'תיאור קצר של המוצר', price: '₪149' },
    { id: 'p3', name: 'מוצר שלישי', description: 'תיאור קצר של המוצר', price: '₪199' },
    { id: 'p4', name: 'מוצר רביעי', description: 'תיאור קצר של המוצר', price: '₪249' },
    { id: 'p5', name: 'מוצר חמישי', description: 'תיאור קצר של המוצר', price: '₪299' },
    { id: 'p6', name: 'מוצר שישי', description: 'תיאור קצר של המוצר', price: '₪349' },
  ]},
  { id: '3', type: 'text', title: 'אודותינו', body: 'כאן תוכלו לספר על העסק, הערכים והחזון שלכם.' },
  { id: '4', type: 'contact', title: 'צור קשר' },
];

// ── Page Renderer (A4 portrait: 794x1123 at 96dpi) ──
const CatalogPageRenderer = ({
  page,
  brandColor = '#E34870',
  businessName = 'שם העסק',
  logoUrl,
  phone,
  email,
  address,
  scale = 1,
}: {
  page: CatalogPage;
  brandColor?: string;
  businessName?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  scale?: number;
}) => {
  const W = 794;
  const H = 1123;
  const baseStyle: React.CSSProperties = {
    width: W,
    height: H,
    transform: `scale(${scale})`,
    transformOrigin: 'top right',
    direction: 'rtl',
    fontFamily: '"Assistant", "Heebo", sans-serif',
    position: 'absolute',
    top: 0,
    right: 0,
    background: '#fff',
  };

  switch (page.type) {
    case 'cover':
      return (
        <div style={{ ...baseStyle, background: `linear-gradient(160deg, ${brandColor} 0%, #1a1a2e 100%)`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 80%, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 60, textAlign: 'center' }}>
            {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 80, marginBottom: 40, objectFit: 'contain', filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.3))' }} />}
            <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2 }}>{page.title}</h1>
            {page.subtitle && <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', marginTop: 16 }}>{page.subtitle}</p>}
            <div style={{ width: 60, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 30 }} />
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 20 }}>{businessName}</p>
          </div>
        </div>
      );

    case 'products':
      return (
        <div style={baseStyle}>
          {/* Header strip */}
          <div style={{ height: 4, backgroundColor: brandColor }} />
          <div style={{ padding: '30px 40px 20px' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#222', marginBottom: 8 }}>{page.title}</h2>
            <div style={{ width: 40, height: 3, backgroundColor: brandColor, marginBottom: 24 }} />
          </div>
          {/* Product grid */}
          <div style={{ padding: '0 40px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {(page.products || []).map(product => (
              <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: 120, backgroundColor: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package style={{ width: 32, height: 32, color: '#ddd' }} />
                  )}
                  {product.badge && (
                    <div style={{ position: 'absolute', top: 6, right: 6, backgroundColor: brandColor, color: '#fff', fontSize: 9, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      {product.badge}
                    </div>
                  )}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{product.name}</div>
                  {product.description && <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{product.description}</div>}
                  {product.price && <div style={{ fontSize: 16, fontWeight: 800, color: brandColor, marginTop: 6 }}>{product.price}</div>}
                </div>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: 10, color: '#ccc' }}>{businessName}</div>
        </div>
      );

    case 'text':
      return (
        <div style={baseStyle}>
          <div style={{ height: 4, backgroundColor: brandColor }} />
          <div style={{ padding: '50px 50px' }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#222', marginBottom: 20 }}>{page.title}</h2>
            <div style={{ width: 40, height: 3, backgroundColor: brandColor, marginBottom: 30 }} />
            <p style={{ fontSize: 16, lineHeight: 2, color: '#555' }}>{page.body}</p>
          </div>
          <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: 10, color: '#ccc' }}>{businessName}</div>
        </div>
      );

    case 'contact':
      return (
        <div style={{ ...baseStyle, background: `linear-gradient(160deg, #1a1a2e, ${brandColor}50)` }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 50, textAlign: 'center' }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 30 }}>{page.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {phone && <div style={{ fontSize: 20, color: '#fff', direction: 'ltr' }}>📞 {phone}</div>}
              {email && <div style={{ fontSize: 20, color: '#fff' }}>✉️ {email}</div>}
              {address && <div style={{ fontSize: 20, color: '#fff' }}>📍 {address}</div>}
            </div>
            {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 60, marginTop: 50, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.4 }} />}
          </div>
        </div>
      );

    case 'full-image':
      return (
        <div style={{ ...baseStyle, background: '#111' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon style={{ width: 60, height: 60, color: '#333' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '30px 40px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{page.title}</h2>
          </div>
        </div>
      );

    case 'toc':
      return (
        <div style={baseStyle}>
          <div style={{ height: 4, backgroundColor: brandColor }} />
          <div style={{ padding: '50px 50px' }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#222', marginBottom: 30 }}>תוכן עניינים</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['מוצרים', 'אודותינו', 'צור קשר'].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dotted #ddd', paddingBottom: 8 }}>
                  <span style={{ fontSize: 16, color: '#444' }}>{item}</span>
                  <span style={{ fontSize: 14, color: '#999' }}>{i + 2}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>עמוד ריק</div>;
  }
};

// ── Main Component ──
const CatalogStudio = () => {
  const navigate = useNavigate();
  const { profile } = useClientProfile();
  const [pages, setPages] = useState<CatalogPage[]>(DEFAULT_PAGES);
  const [activePage, setActivePage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const brandColor = profile?.primary_color || '#E34870';
  const businessName = profile?.business_name || 'שם העסק';
  const logoUrl = profile?.logo_url || undefined;
  const phone = profile?.contact_phone || '';
  const email = profile?.contact_email || '';
  const address = profile?.contact_address || '';

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

  // Export to PDF
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
            businessName={businessName}
            logoUrl={logoUrl}
            phone={phone}
            email={email}
            address={address}
            scale={1}
          />
        );

        await new Promise(r => setTimeout(r, 500));
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
          {/* Toolbar */}
          <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/internal-studio')}>
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה
              </Button>
              <Badge variant="secondary" className="text-xs">עמוד {activePage + 1}/{pages.length}</Badge>
            </div>
            <Button variant="gradient" size="sm" onClick={exportPDF} disabled={isExporting}>
              <Download className="w-4 h-4 ml-1" />
              {isExporting ? 'מייצא...' : 'ייצא PDF'}
            </Button>
          </div>

          {/* Page Preview */}
          <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 overflow-hidden">
            <div
              className="relative shadow-2xl rounded-lg overflow-hidden bg-white"
              style={{ width: 'min(50%, 397px)', aspectRatio: '794/1123' }}
            >
              <CatalogPageRenderer
                page={currentPage}
                brandColor={brandColor}
                businessName={businessName}
                logoUrl={logoUrl}
                phone={phone}
                email={email}
                address={address}
                scale={0.5}
              />
            </div>
          </div>

          {/* Nav */}
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
                className="text-sm"
                dir="rtl"
              />
            </div>

            {currentPage.type === 'cover' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">כותרת משנה</label>
                <Input
                  value={currentPage.subtitle || ''}
                  onChange={e => updatePage(activePage, { subtitle: e.target.value })}
                  className="text-sm"
                  dir="rtl"
                />
              </div>
            )}

            {currentPage.type === 'text' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">תוכן</label>
                <Textarea
                  value={currentPage.body || ''}
                  onChange={e => updatePage(activePage, { body: e.target.value })}
                  className="text-sm min-h-[120px]"
                  dir="rtl"
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
                            placeholder="שם מוצר"
                            className="text-xs h-7"
                            dir="rtl"
                          />
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeProduct(product.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Input
                          value={product.description || ''}
                          onChange={e => updateProduct(product.id, { description: e.target.value })}
                          placeholder="תיאור"
                          className="text-xs h-7"
                          dir="rtl"
                        />
                        <div className="flex gap-1">
                          <Input
                            value={product.price || ''}
                            onChange={e => updateProduct(product.id, { price: e.target.value })}
                            placeholder="מחיר"
                            className="text-xs h-7 w-20"
                            dir="rtl"
                          />
                          <Input
                            value={product.badge || ''}
                            onChange={e => updateProduct(product.id, { badge: e.target.value })}
                            placeholder="תגית (מבצע)"
                            className="text-xs h-7"
                            dir="rtl"
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
