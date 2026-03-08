import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Plus, Trash2, ChevronLeft, ChevronRight, Download,
  Eye, Copy, Sparkles, Wand2, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──
interface SlideData {
  id: string;
  type: 'cover' | 'about' | 'services' | 'value_prop' | 'stats' | 'process' | 'testimonial' | 'team' | 'cta' | 'contact' | 'blank';
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  stats?: { value: string; label: string }[];
  steps?: { number: string; title: string; desc: string }[];
}

const SLIDE_LABELS: Record<string, string> = {
  cover: 'שער', about: 'אודות', services: 'שירותים', value_prop: 'הצעת ערך',
  stats: 'נתונים', process: 'תהליך', testimonial: 'המלצה', team: 'צוות',
  cta: 'קריאה לפעולה', contact: 'צור קשר', blank: 'ריקה',
};

// ── Slide Renderer ──
const SlideRenderer = ({
  slide, brandColor = '#E34870', secColor = '#1a1a2e', businessName = 'שם העסק',
  logoUrl, phone, email, scale = 1, font = 'Heebo',
}: {
  slide: SlideData; brandColor?: string; secColor?: string; businessName?: string;
  logoUrl?: string; phone?: string; email?: string; scale?: number; font?: string;
}) => {
  const adjustColor = (hex: string, amt: number) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xFF) + amt));
    const b = Math.min(255, Math.max(0, (n & 0xFF) + amt));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };

  const dark = adjustColor(brandColor, -40);
  const light = adjustColor(brandColor, 60);

  const base: React.CSSProperties = {
    width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top right',
    direction: 'rtl', fontFamily: `"${font}", "Assistant", sans-serif`,
    position: 'absolute', top: 0, right: 0, overflow: 'hidden',
  };

  // Shared decorative dot pattern
  const dots = `url("data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='3' cy='3' r='1.5' fill='white' opacity='0.06'/%3E%3C/svg%3E")`;

  switch (slide.type) {
    case 'cover':
      return (
        <div style={{ ...base, background: `linear-gradient(135deg, ${brandColor} 0%, ${dark} 60%, #0d0d1a 100%)` }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: dots, backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', top: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${brandColor}30 0%, transparent 70%)` }} />
          <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', border: `2px solid rgba(255,255,255,0.05)` }} />
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '200px' }} viewBox="0 0 1920 200" preserveAspectRatio="none">
            <path d="M0 200 L0 80 Q480 0 960 80 Q1440 160 1920 80 L1920 200Z" fill="rgba(0,0,0,0.15)" />
          </svg>
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '100px 160px', textAlign: 'center' }}>
            {logoUrl && (
              <div style={{ width: '140px', height: '140px', borderRadius: '24px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', marginBottom: '50px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
                <img src={logoUrl} alt="logo" style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
              </div>
            )}
            <h1 style={{ fontSize: '108px', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.05, textShadow: '0 4px 40px rgba(0,0,0,0.3)', letterSpacing: '-1px' }}>{slide.title}</h1>
            {slide.subtitle && <p style={{ fontSize: '38px', color: 'rgba(255,255,255,0.75)', marginTop: '30px', fontWeight: 400, maxWidth: '1200px' }}>{slide.subtitle}</p>}
            <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', marginTop: '40px' }} />
          </div>
        </div>
      );

    case 'about':
      return (
        <div style={{ ...base, background: '#fff' }}>
          {/* Right accent strip */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: `linear-gradient(180deg, ${brandColor} 0%, ${dark} 100%)` }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dots, backgroundSize: '20px 20px' }} />
          </div>
          {/* Bottom accent */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: '80px', height: '6px', background: `linear-gradient(90deg, transparent, ${brandColor}40)` }} />
          <div style={{ padding: '120px 180px 120px 140px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' }}>
              <div style={{ width: '60px', height: '6px', background: brandColor, borderRadius: '3px' }} />
              <span style={{ fontSize: '22px', fontWeight: 600, color: brandColor, textTransform: 'uppercase', letterSpacing: '3px' }}>אודות</span>
            </div>
            <h2 style={{ fontSize: '72px', fontWeight: 900, color: '#111', marginBottom: '40px', lineHeight: 1.1 }}>{slide.title}</h2>
            <p style={{ fontSize: '34px', lineHeight: 1.9, color: '#555', maxWidth: '1400px' }}>{slide.body}</p>
          </div>
          <div style={{ position: 'absolute', bottom: '50px', left: '80px', fontSize: '18px', color: '#ccc', fontWeight: 500 }}>{businessName}</div>
        </div>
      );

    case 'services':
      return (
        <div style={{ ...base, background: '#fafafa' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: `linear-gradient(90deg, ${brandColor}, ${dark})` }} />
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: `${brandColor}08` }} />
          <div style={{ padding: '90px 140px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ width: '50px', height: '6px', background: brandColor, borderRadius: '3px' }} />
              <span style={{ fontSize: '20px', fontWeight: 600, color: brandColor, letterSpacing: '2px' }}>השירותים שלנו</span>
            </div>
            <h2 style={{ fontSize: '64px', fontWeight: 900, color: '#111', marginBottom: '60px' }}>{slide.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
              {(slide.bullets || []).map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '30px 36px', borderRadius: '20px', background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid #eee', transition: 'all 0.2s' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${brandColor}, ${dark})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, flexShrink: 0, boxShadow: `0 4px 15px ${brandColor}30` }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <span style={{ fontSize: '28px', color: '#333', fontWeight: 600 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '40px', left: '60px', fontSize: '18px', color: '#ccc' }}>{businessName}</div>
        </div>
      );

    case 'value_prop':
      return (
        <div style={{ ...base, background: `linear-gradient(160deg, #0d0d1a 0%, ${dark} 100%)` }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: dots, backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', bottom: '-120px', right: '-120px', width: '400px', height: '400px', borderRadius: '50%', background: `${brandColor}15` }} />
          <div style={{ position: 'relative', padding: '100px 150px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ width: '50px', height: '4px', background: brandColor, borderRadius: '2px' }} />
              <span style={{ fontSize: '20px', fontWeight: 500, color: `${brandColor}`, letterSpacing: '2px' }}>למה אנחנו</span>
            </div>
            <h2 style={{ fontSize: '68px', fontWeight: 900, color: '#fff', marginBottom: '60px', lineHeight: 1.1 }}>{slide.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {(slide.bullets || []).map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', padding: '32px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: brandColor, flexShrink: 0, marginTop: '10px', boxShadow: `0 0 15px ${brandColor}60` }} />
                  <span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'stats':
      return (
        <div style={{ ...base, background: '#fff' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: '350px', background: `linear-gradient(135deg, ${brandColor} 0%, ${dark} 100%)` }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dots, backgroundSize: '30px 30px' }} />
          </div>
          <svg style={{ position: 'absolute', top: '340px', left: 0, width: '100%' }} viewBox="0 0 1920 60" preserveAspectRatio="none">
            <path d="M0 0 L1920 0 L1920 30 Q960 65 0 30Z" fill={dark} />
          </svg>
          <div style={{ position: 'relative', padding: '80px 140px' }}>
            <h2 style={{ fontSize: '60px', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>{slide.title}</h2>
            {slide.subtitle && <p style={{ fontSize: '26px', color: 'rgba(255,255,255,0.7)', marginBottom: '60px' }}>{slide.subtitle}</p>}
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: '50px', padding: '0 140px', marginTop: '40px' }}>
            {(slide.stats || []).map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '50px 40px', borderRadius: '24px', background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', flex: 1, maxWidth: '350px', border: '1px solid #eee' }}>
                <div style={{ fontSize: '72px', fontWeight: 900, color: brandColor, lineHeight: 1, marginBottom: '12px' }}>{s.value}</div>
                <div style={{ fontSize: '22px', color: '#888', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'process':
      return (
        <div style={{ ...base, background: '#fafafa' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '6px', height: '100%', background: `linear-gradient(180deg, ${brandColor}, ${dark})` }} />
          <div style={{ padding: '100px 150px 100px 120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ width: '50px', height: '6px', background: brandColor, borderRadius: '3px' }} />
              <span style={{ fontSize: '20px', fontWeight: 600, color: brandColor, letterSpacing: '2px' }}>תהליך העבודה</span>
            </div>
            <h2 style={{ fontSize: '60px', fontWeight: 900, color: '#111', marginBottom: '70px' }}>{slide.title}</h2>
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
              {(slide.steps || []).map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  {i < (slide.steps?.length || 0) - 1 && (
                    <div style={{ position: 'absolute', top: '35px', left: '-20px', width: '40px', height: '3px', background: `${brandColor}30` }} />
                  )}
                  <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: `linear-gradient(135deg, ${brandColor}, ${dark})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, margin: '0 auto 24px', boxShadow: `0 6px 25px ${brandColor}30` }}>
                    {s.number}
                  </div>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#222', marginBottom: '12px' }}>{s.title}</h3>
                  <p style={{ fontSize: '20px', color: '#777', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'testimonial':
      return (
        <div style={{ ...base, background: `linear-gradient(160deg, #0d0d1a 0%, ${dark}80 100%)` }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: dots, backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', top: '80px', right: '120px', fontSize: '300px', fontWeight: 900, color: `${brandColor}15`, lineHeight: 1 }}>״</div>
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 180px', maxWidth: '1400px' }}>
            <p style={{ fontSize: '42px', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontStyle: 'italic', marginBottom: '50px' }}>
              {slide.body}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '50px', height: '4px', background: brandColor, borderRadius: '2px' }} />
              <span style={{ fontSize: '24px', color: brandColor, fontWeight: 700 }}>{slide.subtitle}</span>
            </div>
          </div>
        </div>
      );

    case 'cta':
      return (
        <div style={{ ...base, background: `linear-gradient(135deg, ${brandColor} 0%, ${dark} 100%)` }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: dots, backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '100px 200px' }}>
            <h2 style={{ fontSize: '80px', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '30px', textShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>{slide.title}</h2>
            {slide.body && <p style={{ fontSize: '32px', color: 'rgba(255,255,255,0.8)', maxWidth: '1000px', lineHeight: 1.6 }}>{slide.body}</p>}
            <div style={{ marginTop: '50px', padding: '20px 60px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.2)' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>צרו קשר עוד היום</span>
            </div>
          </div>
        </div>
      );

    case 'contact':
      return (
        <div style={{ ...base, background: `linear-gradient(135deg, #0d0d1a 0%, ${dark} 100%)` }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: dots, backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '400px', height: '400px', borderRadius: '50%', background: `${brandColor}10` }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '100px' }}>
            <h2 style={{ fontSize: '80px', fontWeight: 900, color: '#fff', marginBottom: '20px' }}>{slide.title}</h2>
            {slide.body && <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.6)', marginBottom: '60px' }}>{slide.body}</p>}
            <div style={{ display: 'flex', gap: '80px', marginBottom: '60px' }}>
              {phone && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: `${brandColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '30px' }}>📞</div>
                  <div style={{ fontSize: '18px', color: brandColor, marginBottom: '8px', fontWeight: 600 }}>טלפון</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', direction: 'ltr' }}>{phone}</div>
                </div>
              )}
              {email && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: `${brandColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '30px' }}>✉</div>
                  <div style={{ fontSize: '18px', color: brandColor, marginBottom: '8px', fontWeight: 600 }}>אימייל</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{email}</div>
                </div>
              )}
            </div>
            {logoUrl && (
              <div style={{ width: '100px', height: '100px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <img src={logoUrl} alt="logo" style={{ maxHeight: '68px', maxWidth: '68px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.5 }} />
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div style={{ ...base, background: '#fff' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '32px' }}>
            שקופית ריקה
          </div>
        </div>
      );
  }
};

// ── Brief Screen ──
const BriefScreen = ({ onGenerate, businessName, isLoading }: { onGenerate: (brief: string, count: number) => void; businessName: string; isLoading: boolean }) => {
  const [brief, setBrief] = useState('');
  const [slideCount, setSlideCount] = useState(7);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-foreground">יצירת מצגת עם AI</h1>
          <p className="text-muted-foreground text-lg">ספר לנו על העסק שלך ואנחנו ניצור מצגת מקצועית תוך שניות</p>
        </div>

        <Card className="border-2">
          <CardContent className="p-6 space-y-5">
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">על מה המצגת? *</label>
              <Textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder={`לדוגמה: מצגת תדמית ל${businessName}. אנחנו מתמחים ב... היתרונות שלנו הם... קהל היעד שלנו...`}
                rows={6}
                className="text-base"
                dir="rtl"
              />
              <p className="text-xs text-muted-foreground mt-1">ככל שתתאר יותר, התוצאה תהיה מדויקת יותר</p>
            </div>

            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">מספר שקופיות</label>
              <div className="flex gap-2">
                {[5, 7, 10].map(n => (
                  <Button
                    key={n}
                    variant={slideCount === n ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSlideCount(n)}
                    className="flex-1"
                  >
                    {n} שקופיות
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-12 text-base gap-2"
              onClick={() => onGenerate(brief, slideCount)}
              disabled={!brief.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  יוצר את המצגת...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  צור מצגת
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          המצגת תיווצר אוטומטית עם מיתוג העסק שלך. תוכל לערוך הכל אחר כך.
        </p>
      </div>
    </div>
  );
};

// ── Main Component ──
const PresentationStudio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useClientProfile();
  const [slides, setSlides] = useState<SlideData[] | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const brandColor = profile?.primary_color || '#E34870';
  const secColor = profile?.secondary_color || '#1a1a2e';
  const businessName = profile?.business_name || 'שם העסק';
  const logoUrl = profile?.logo_url || undefined;
  const phone = profile?.contact_phone || '';
  const email = profile?.contact_email || '';
  const font = profile?.header_font || 'Heebo';

  const handleGenerate = async (brief: string, slideCount: number) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-presentation', {
        body: { brief, businessName, industry: '', slideCount },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const generatedSlides: SlideData[] = (data.slides || []).map((s: any, i: number) => ({
        ...s,
        id: `${Date.now()}-${i}`,
      }));

      setSlides(generatedSlides);
      setActiveSlide(0);
      toast.success(`נוצרו ${generatedSlides.length} שקופיות!`);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה ביצירת המצגת. נסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

  // If no slides yet, show brief screen
  if (!slides) {
    return (
      <>
        <TopNavbar />
        <BriefScreen onGenerate={handleGenerate} businessName={businessName} isLoading={isGenerating} />
      </>
    );
  }

  const currentSlide = slides[activeSlide];

  const updateSlide = (index: number, updates: Partial<SlideData>) => {
    setSlides(prev => prev!.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const addSlide = (type: SlideData['type']) => {
    const newSlide: SlideData = {
      id: Date.now().toString(), type,
      title: SLIDE_LABELS[type] || 'שקופית חדשה',
      bullets: type === 'services' || type === 'value_prop' ? ['פריט חדש'] : undefined,
      stats: type === 'stats' ? [{ value: '100+', label: 'לקוחות' }] : undefined,
      steps: type === 'process' ? [{ number: '01', title: 'שלב', desc: 'תיאור' }] : undefined,
    };
    const newSlides = [...slides];
    newSlides.splice(activeSlide + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlide(activeSlide + 1);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev!.filter((_, i) => i !== index));
    setActiveSlide(Math.min(activeSlide, slides.length - 2));
  };

  const duplicateSlide = (index: number) => {
    const dup = { ...slides[index], id: Date.now().toString() };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, dup);
    setSlides(newSlides);
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });
      for (let i = 0; i < slides.length; i++) {
        if (i > 0) pdf.addPage([1920, 1080], 'landscape');
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1920px;height:1080px;overflow:hidden;';
        document.body.appendChild(container);
        const { default: htmlToImage } = await import('html-to-image');
        const root = document.createElement('div');
        root.style.cssText = 'width:1920px;height:1080px;position:relative;overflow:hidden;';
        container.appendChild(root);
        const { createRoot } = await import('react-dom/client');
        const reactRoot = createRoot(root);
        reactRoot.render(
          <SlideRenderer slide={slides[i]} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={1} font={font} />
        );
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
          <SlideRenderer slide={slides[activeSlide]} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={Math.min(window.innerWidth / 1920, window.innerHeight / 1080)} font={font} />
        </div>
        <button className="absolute top-4 left-4 text-white/50 hover:text-white text-sm z-50" onClick={(e) => { e.stopPropagation(); setIsPresenting(false); }}>
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
        {/* Sidebar - thumbnails */}
        <div className="w-48 bg-card border-l border-border overflow-y-auto p-3 space-y-2">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${i === activeSlide ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/30'}`}
              onClick={() => setActiveSlide(i)}
            >
              <div className="aspect-video relative overflow-hidden bg-muted">
                <SlideRenderer slide={slide} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={0.09} font={font} />
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
          <div className="border-2 border-dashed border-border rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground text-center mb-1">הוסף שקופית</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(SLIDE_LABELS).filter(([k]) => k !== 'blank').map(([type, label]) => (
                <button key={type} onClick={() => addSlide(type as SlideData['type'])} className="text-[9px] py-1 px-1 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-center">
                  {label}
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
              <Badge variant="secondary" className="text-xs">{activeSlide + 1}/{slides.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSlides(null); setActiveSlide(0); }} className="gap-1">
                <Wand2 className="w-3.5 h-3.5" />
                בריף חדש
              </Button>
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

          <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 overflow-hidden">
            <div className="relative shadow-2xl rounded-lg overflow-hidden" style={{ width: 'min(100%, 960px)', aspectRatio: '16/9' }}>
              <SlideRenderer slide={currentSlide} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={0.5} font={font} />
            </div>
          </div>

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
          <Badge variant="outline">{SLIDE_LABELS[currentSlide.type]}</Badge>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">כותרת</label>
              <Input value={currentSlide.title} onChange={e => updateSlide(activeSlide, { title: e.target.value })} className="text-sm" dir="rtl" />
            </div>

            {(currentSlide.type === 'cover' || currentSlide.type === 'stats' || currentSlide.type === 'testimonial') && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">כותרת משנה</label>
                <Input value={currentSlide.subtitle || ''} onChange={e => updateSlide(activeSlide, { subtitle: e.target.value })} className="text-sm" dir="rtl" />
              </div>
            )}

            {(currentSlide.type === 'about' || currentSlide.type === 'content' || currentSlide.type === 'contact' || currentSlide.type === 'testimonial' || currentSlide.type === 'cta') && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">תוכן</label>
                <Textarea value={currentSlide.body || ''} onChange={e => updateSlide(activeSlide, { body: e.target.value })} className="text-sm min-h-[120px]" dir="rtl" />
              </div>
            )}

            {(currentSlide.type === 'services' || currentSlide.type === 'value_prop') && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">פריטים</label>
                {(currentSlide.bullets || []).map((b, i) => (
                  <div key={i} className="flex gap-1 mb-1">
                    <Input value={b} onChange={e => { const nb = [...(currentSlide.bullets || [])]; nb[i] = e.target.value; updateSlide(activeSlide, { bullets: nb }); }} className="text-sm" dir="rtl" />
                    <Button variant="ghost" size="sm" onClick={() => updateSlide(activeSlide, { bullets: (currentSlide.bullets || []).filter((_, j) => j !== i) })}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => updateSlide(activeSlide, { bullets: [...(currentSlide.bullets || []), 'פריט חדש'] })}>
                  <Plus className="w-3 h-3 ml-1" />
                  הוסף פריט
                </Button>
              </div>
            )}

            {currentSlide.type === 'stats' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">נתונים</label>
                {(currentSlide.stats || []).map((s, i) => (
                  <div key={i} className="flex gap-1 mb-1">
                    <Input value={s.value} onChange={e => { const ns = [...(currentSlide.stats || [])]; ns[i] = { ...ns[i], value: e.target.value }; updateSlide(activeSlide, { stats: ns }); }} className="text-sm w-20" dir="ltr" placeholder="ערך" />
                    <Input value={s.label} onChange={e => { const ns = [...(currentSlide.stats || [])]; ns[i] = { ...ns[i], label: e.target.value }; updateSlide(activeSlide, { stats: ns }); }} className="text-sm flex-1" dir="rtl" placeholder="תיאור" />
                    <Button variant="ghost" size="sm" onClick={() => updateSlide(activeSlide, { stats: (currentSlide.stats || []).filter((_, j) => j !== i) })}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => updateSlide(activeSlide, { stats: [...(currentSlide.stats || []), { value: '0', label: 'תיאור' }] })}>
                  <Plus className="w-3 h-3 ml-1" />
                  הוסף נתון
                </Button>
              </div>
            )}

            {currentSlide.type === 'process' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">שלבים</label>
                {(currentSlide.steps || []).map((s, i) => (
                  <div key={i} className="space-y-1 mb-2 p-2 rounded bg-muted/50">
                    <Input value={s.title} onChange={e => { const ns = [...(currentSlide.steps || [])]; ns[i] = { ...ns[i], title: e.target.value }; updateSlide(activeSlide, { steps: ns }); }} className="text-sm" dir="rtl" placeholder="כותרת שלב" />
                    <Input value={s.desc} onChange={e => { const ns = [...(currentSlide.steps || [])]; ns[i] = { ...ns[i], desc: e.target.value }; updateSlide(activeSlide, { steps: ns }); }} className="text-sm" dir="rtl" placeholder="תיאור" />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => updateSlide(activeSlide, { steps: [...(currentSlide.steps || []), { number: String((currentSlide.steps?.length || 0) + 1).padStart(2, '0'), title: 'שלב חדש', desc: 'תיאור' }] })}>
                  <Plus className="w-3 h-3 ml-1" />
                  הוסף שלב
                </Button>
              </div>
            )}
          </div>

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
