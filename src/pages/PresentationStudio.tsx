import { useState, useRef, useCallback } from 'react';
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
  Presentation,
  Type,
  Image as ImageIcon,
  Sparkles,
  GripVertical,
  Copy,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// ── Types ──
interface SlideData {
  id: string;
  type: 'cover' | 'about' | 'services' | 'content' | 'gallery' | 'contact' | 'blank';
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  imageUrl?: string;
}

const SLIDE_TYPES: { type: SlideData['type']; label: string; desc: string }[] = [
  { type: 'cover', label: 'שער', desc: 'כותרת ראשית + לוגו' },
  { type: 'about', label: 'אודות', desc: 'סיפור העסק' },
  { type: 'services', label: 'שירותים', desc: 'רשימת שירותים עם נקודות' },
  { type: 'content', label: 'תוכן חופשי', desc: 'כותרת + טקסט' },
  { type: 'gallery', label: 'גלריה', desc: 'תמונה מרכזית + כיתוב' },
  { type: 'contact', label: 'צור קשר', desc: 'פרטי התקשרות' },
];

const DEFAULT_SLIDES: SlideData[] = [
  { id: '1', type: 'cover', title: 'שם העסק', subtitle: 'תיאור קצר של העסק' },
  { id: '2', type: 'about', title: 'אודות', body: 'כאן תוכלו לספר על העסק שלכם, הרקע, החזון והערכים.' },
  { id: '3', type: 'services', title: 'השירותים שלנו', bullets: ['שירות ראשון', 'שירות שני', 'שירות שלישי', 'שירות רביעי'] },
  { id: '4', type: 'content', title: 'למה דווקא אנחנו?', body: 'הוסיפו כאן את היתרונות שלכם.' },
  { id: '5', type: 'contact', title: 'צור קשר', body: 'נשמח לשמוע מכם!' },
];

// ── Slide Renderer ──
const SlideRenderer = ({
  slide,
  brandColor = '#E34870',
  businessName = 'שם העסק',
  logoUrl,
  phone,
  email,
  scale = 1,
}: {
  slide: SlideData;
  brandColor?: string;
  businessName?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  scale?: number;
}) => {
  const baseStyle: React.CSSProperties = {
    width: 1920,
    height: 1080,
    transform: `scale(${scale})`,
    transformOrigin: 'top right',
    direction: 'rtl',
    fontFamily: '"Assistant", "Heebo", sans-serif',
    position: 'absolute',
    top: 0,
    right: 0,
  };

  switch (slide.type) {
    case 'cover':
      return (
        <div style={{ ...baseStyle, background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 50%, #1a1a2e 100%)` }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 120, textAlign: 'center' }}>
            {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 120, marginBottom: 60, objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))' }} />}
            <h1 style={{ fontSize: 96, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1, textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>{slide.title}</h1>
            {slide.subtitle && <p style={{ fontSize: 36, color: 'rgba(255,255,255,0.85)', marginTop: 30 }}>{slide.subtitle}</p>}
          </div>
        </div>
      );

    case 'about':
      return (
        <div style={{ ...baseStyle, background: '#fff' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: '100%', backgroundColor: brandColor }} />
          <div style={{ padding: '100px 140px 100px 100px' }}>
            <h2 style={{ fontSize: 64, fontWeight: 800, color: brandColor, marginBottom: 40 }}>{slide.title}</h2>
            <p style={{ fontSize: 32, lineHeight: 1.8, color: '#444', maxWidth: 1400 }}>{slide.body}</p>
          </div>
          <div style={{ position: 'absolute', bottom: 40, left: 60, fontSize: 18, color: '#ccc' }}>{businessName}</div>
        </div>
      );

    case 'services':
      return (
        <div style={{ ...baseStyle, background: '#fff' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: 8, backgroundColor: brandColor }} />
          <div style={{ padding: '80px 140px' }}>
            <h2 style={{ fontSize: 64, fontWeight: 800, color: '#222', marginBottom: 60 }}>{slide.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
              {(slide.bullets || []).map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 30px', borderRadius: 16, background: i % 2 === 0 ? `${brandColor}10` : '#f8f9fa' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: brandColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 28, color: '#333' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 40, left: 60, fontSize: 18, color: '#ccc' }}>{businessName}</div>
        </div>
      );

    case 'content':
      return (
        <div style={{ ...baseStyle, background: '#fafafa' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: '100%', backgroundColor: brandColor }} />
          <div style={{ padding: '100px 140px 100px 100px' }}>
            <h2 style={{ fontSize: 56, fontWeight: 800, color: '#222', marginBottom: 40 }}>{slide.title}</h2>
            <p style={{ fontSize: 30, lineHeight: 1.8, color: '#555' }}>{slide.body}</p>
          </div>
          <div style={{ position: 'absolute', bottom: 40, left: 60, fontSize: 18, color: '#ccc' }}>{businessName}</div>
        </div>
      );

    case 'gallery':
      return (
        <div style={{ ...baseStyle, background: '#111' }}>
          {slide.imageUrl ? (
            <img src={slide.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #222, ${brandColor}30)` }} />
          )}
          <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '60px 100px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
            <h2 style={{ fontSize: 48, fontWeight: 800, color: '#fff' }}>{slide.title}</h2>
            {slide.subtitle && <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>{slide.subtitle}</p>}
          </div>
        </div>
      );

    case 'contact':
      return (
        <div style={{ ...baseStyle, background: `linear-gradient(135deg, #1a1a2e 0%, ${brandColor}40 100%)` }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 100 }}>
            <h2 style={{ fontSize: 72, fontWeight: 900, color: '#fff', marginBottom: 40 }}>{slide.title}</h2>
            {slide.body && <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.7)', marginBottom: 60 }}>{slide.body}</p>}
            <div style={{ display: 'flex', gap: 60 }}>
              {phone && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, color: brandColor, marginBottom: 8 }}>טלפון</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', direction: 'ltr' }}>{phone}</div>
                </div>
              )}
              {email && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, color: brandColor, marginBottom: 8 }}>אימייל</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>{email}</div>
                </div>
              )}
            </div>
            {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 80, marginTop: 80, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.5 }} />}
          </div>
        </div>
      );

    default:
      return (
        <div style={{ ...baseStyle, background: '#fff' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 32 }}>
            שקופית ריקה
          </div>
        </div>
      );
  }
};

// ── Main Component ──
const PresentationStudio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useClientProfile();
  const [slides, setSlides] = useState<SlideData[]>(() => {
    const defaults = [...DEFAULT_SLIDES];
    if (profile) {
      defaults[0] = { ...defaults[0], title: profile.business_name || 'שם העסק' };
    }
    return defaults;
  });
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  const brandColor = profile?.primary_color || '#E34870';
  const businessName = profile?.business_name || 'שם העסק';
  const logoUrl = profile?.logo_url || undefined;
  const phone = profile?.contact_phone || '';
  const email = profile?.contact_email || '';

  const currentSlide = slides[activeSlide];

  const updateSlide = useCallback((index: number, updates: Partial<SlideData>) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  }, []);

  const addSlide = (type: SlideData['type']) => {
    const newSlide: SlideData = {
      id: Date.now().toString(),
      type,
      title: SLIDE_TYPES.find(t => t.type === type)?.label || 'שקופית חדשה',
      bullets: type === 'services' ? ['שירות חדש'] : undefined,
    };
    const newSlides = [...slides];
    newSlides.splice(activeSlide + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlide(activeSlide + 1);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== index));
    setActiveSlide(Math.min(activeSlide, slides.length - 2));
  };

  const duplicateSlide = (index: number) => {
    const dup = { ...slides[index], id: Date.now().toString() };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, dup);
    setSlides(newSlides);
  };

  // Export to PDF
  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });

      for (let i = 0; i < slides.length; i++) {
        if (i > 0) pdf.addPage([1920, 1080], 'landscape');

        // Render slide to offscreen div
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1920px;height:1080px;overflow:hidden;';
        document.body.appendChild(container);

        const { default: htmlToImage } = await import('html-to-image');
        const root = document.createElement('div');
        root.style.cssText = 'width:1920px;height:1080px;position:relative;overflow:hidden;';
        container.appendChild(root);

        // Use ReactDOM to render slide
        const { createRoot } = await import('react-dom/client');
        const reactRoot = createRoot(root);
        reactRoot.render(
          <SlideRenderer
            slide={slides[i]}
            brandColor={brandColor}
            businessName={businessName}
            logoUrl={logoUrl}
            phone={phone}
            email={email}
            scale={1}
          />
        );

        // Wait for render
        await new Promise(r => setTimeout(r, 500));

        const dataUrl = await htmlToImage.toPng(root, { width: 1920, height: 1080, quality: 0.95 });
        pdf.addImage(dataUrl, 'PNG', 0, 0, 1920, 1080);

        reactRoot.unmount();
        document.body.removeChild(container);
      }

      pdf.save(`${businessName}-presentation.pdf`);
      toast.success('המצגת יוצאה בהצלחה!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('שגיאה בייצוא המצגת');
    }
    setIsExporting(false);
  };

  // Calculate scale for preview
  const getScale = (containerWidth: number) => Math.min(containerWidth / 1920, 1);

  if (isPresenting) {
    return (
      <div
        className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-none"
        onClick={() => setActiveSlide(prev => Math.min(prev + 1, slides.length - 1))}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsPresenting(false);
          if (e.key === 'ArrowLeft' || e.key === ' ') setActiveSlide(prev => Math.min(prev + 1, slides.length - 1));
          if (e.key === 'ArrowRight') setActiveSlide(prev => Math.max(prev - 1, 0));
        }}
        tabIndex={0}
        autoFocus
      >
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
          <SlideRenderer
            slide={slides[activeSlide]}
            brandColor={brandColor}
            businessName={businessName}
            logoUrl={logoUrl}
            phone={phone}
            email={email}
            scale={Math.min(window.innerWidth / 1920, window.innerHeight / 1080)}
          />
        </div>
        <button
          className="absolute top-4 left-4 text-white/50 hover:text-white text-sm z-50"
          onClick={(e) => { e.stopPropagation(); setIsPresenting(false); }}
        >
          ESC לצאת
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-sm">
          {activeSlide + 1} / {slides.length}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Slide thumbnails */}
        <div className="w-48 bg-card border-l border-border overflow-y-auto p-3 space-y-2">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                i === activeSlide ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/30'
              }`}
              onClick={() => setActiveSlide(i)}
            >
              <div className="aspect-video relative overflow-hidden bg-muted">
                <SlideRenderer
                  slide={slide}
                  brandColor={brandColor}
                  businessName={businessName}
                  logoUrl={logoUrl}
                  phone={phone}
                  email={email}
                  scale={0.09}
                />
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 flex items-center justify-between">
                <span>{i + 1}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }}><Copy className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }}><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}

          {/* Add slide */}
          <div className="border-2 border-dashed border-border rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground text-center mb-1">הוסף שקופית</p>
            <div className="grid grid-cols-2 gap-1">
              {SLIDE_TYPES.map(st => (
                <button
                  key={st.type}
                  onClick={() => addSlide(st.type)}
                  className="text-[9px] py-1 px-1 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-center"
                >
                  {st.label}
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
              <Badge variant="secondary" className="text-xs">{activeSlide + 1}/{slides.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsPresenting(true)}>
                <Eye className="w-4 h-4 ml-1" />
                הצג
              </Button>
              <Button variant="gradient" size="sm" onClick={exportPDF} disabled={isExporting}>
                <Download className="w-4 h-4 ml-1" />
                {isExporting ? 'מייצא...' : 'ייצא PDF'}
              </Button>
            </div>
          </div>

          {/* Slide Preview */}
          <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 overflow-hidden" ref={slideContainerRef}>
            <div
              className="relative shadow-2xl rounded-lg overflow-hidden"
              style={{
                width: 'min(100%, 960px)',
                aspectRatio: '16/9',
              }}
            >
              <SlideRenderer
                slide={currentSlide}
                brandColor={brandColor}
                businessName={businessName}
                logoUrl={logoUrl}
                phone={phone}
                email={email}
                scale={0.5}
              />
            </div>
          </div>

          {/* Nav arrows */}
          <div className="flex items-center justify-center gap-4 py-2 bg-card border-t border-border">
            <Button variant="ghost" size="sm" disabled={activeSlide === 0} onClick={() => setActiveSlide(prev => prev - 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{activeSlide + 1} / {slides.length}</span>
            <Button variant="ghost" size="sm" disabled={activeSlide === slides.length - 1} onClick={() => setActiveSlide(prev => prev + 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Panel - Edit */}
        <div className="w-72 bg-card border-r border-border overflow-y-auto p-4 space-y-4" dir="rtl">
          <h3 className="font-bold text-foreground text-sm">עריכת שקופית</h3>
          <Badge variant="outline">{SLIDE_TYPES.find(t => t.type === currentSlide.type)?.label}</Badge>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">כותרת</label>
              <Input
                value={currentSlide.title}
                onChange={e => updateSlide(activeSlide, { title: e.target.value })}
                className="text-sm"
                dir="rtl"
              />
            </div>

            {(currentSlide.type === 'cover' || currentSlide.type === 'gallery') && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">כותרת משנה</label>
                <Input
                  value={currentSlide.subtitle || ''}
                  onChange={e => updateSlide(activeSlide, { subtitle: e.target.value })}
                  className="text-sm"
                  dir="rtl"
                />
              </div>
            )}

            {(currentSlide.type === 'about' || currentSlide.type === 'content' || currentSlide.type === 'contact') && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">תוכן</label>
                <Textarea
                  value={currentSlide.body || ''}
                  onChange={e => updateSlide(activeSlide, { body: e.target.value })}
                  className="text-sm min-h-[120px]"
                  dir="rtl"
                />
              </div>
            )}

            {currentSlide.type === 'services' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">שירותים</label>
                {(currentSlide.bullets || []).map((b, i) => (
                  <div key={i} className="flex gap-1 mb-1">
                    <Input
                      value={b}
                      onChange={e => {
                        const newBullets = [...(currentSlide.bullets || [])];
                        newBullets[i] = e.target.value;
                        updateSlide(activeSlide, { bullets: newBullets });
                      }}
                      className="text-sm"
                      dir="rtl"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newBullets = (currentSlide.bullets || []).filter((_, j) => j !== i);
                        updateSlide(activeSlide, { bullets: newBullets });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1"
                  onClick={() => updateSlide(activeSlide, { bullets: [...(currentSlide.bullets || []), 'שירות חדש'] })}
                >
                  <Plus className="w-3 h-3 ml-1" />
                  הוסף שירות
                </Button>
              </div>
            )}
          </div>

          {/* Brand info */}
          {profile && (
            <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                {profile.logo_url && <img src={profile.logo_url} alt="" className="w-8 h-8 rounded object-contain bg-white p-0.5" />}
                <div>
                  <p className="text-xs font-medium text-foreground">{profile.business_name}</p>
                  <p className="text-[10px] text-muted-foreground">המיתוג מוטמע אוטומטית</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresentationStudio;
