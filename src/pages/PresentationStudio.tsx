import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Plus, Trash2, ChevronLeft, ChevronRight, Download,
  Eye, Copy, Sparkles, Wand2, Loader2, Palette, Building2, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──
export type PresentationTheme = 'minimal' | 'corporate' | 'creative';

interface SlideData {
  id: string;
  type: 'cover' | 'about' | 'vision' | 'services' | 'value_prop' | 'stats' | 'process' | 'methodology' | 'testimonial' | 'social_proof' | 'target_audience' | 'team' | 'cta' | 'contact' | 'blank';
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  stats?: { value: string; label: string }[];
  steps?: { number: string; title: string; desc: string }[];
}

const SLIDE_LABELS: Record<string, string> = {
  cover: 'שער', about: 'אודות', vision: 'חזון', services: 'שירותים', value_prop: 'הצעת ערך',
  stats: 'נתונים', process: 'תהליך', methodology: 'מתודולוגיה', testimonial: 'המלצה',
  social_proof: 'הוכחה חברתית', target_audience: 'קהל יעד', team: 'צוות',
  cta: 'קריאה לפעולה', contact: 'צור קשר', blank: 'ריקה',
};

// ── Color helpers ──
const adjustColor = (hex: string, amt: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xFF) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xFF) + amt));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
};

const hexToRgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

// ── Theme configs ──
const getThemeConfig = (theme: PresentationTheme, brandColor: string, secColor: string) => {
  const dark = adjustColor(brandColor, -40);
  const light = adjustColor(brandColor, 60);
  
  switch (theme) {
    case 'minimal':
      return {
        coverBg: '#fff',
        coverText: '#111',
        coverAccent: brandColor,
        slideBg: '#fff',
        slideText: '#222',
        slideSubtext: '#888',
        accentBg: `${brandColor}08`,
        cardBg: '#f8f9fa',
        cardBorder: '#eee',
        darkSlideBg: '#fafafa',
        darkSlideText: '#111',
        dots: 'none',
        diag: 'none',
      };
    case 'creative':
      return {
        coverBg: `linear-gradient(135deg, ${brandColor} 0%, #ff6b6b 30%, #ffd93d 60%, ${adjustColor(brandColor, 40)} 100%)`,
        coverText: '#fff',
        coverAccent: '#fff',
        slideBg: '#fff',
        slideText: '#111',
        slideSubtext: '#666',
        accentBg: `linear-gradient(135deg, ${hexToRgba(brandColor, 0.06)}, ${hexToRgba('#ff6b6b', 0.04)})`,
        cardBg: '#fff',
        cardBorder: `${brandColor}20`,
        darkSlideBg: `linear-gradient(160deg, #1a1a2e 0%, ${dark} 50%, ${brandColor}90 100%)`,
        darkSlideText: '#fff',
        dots: `url("data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='3' cy='3' r='2' fill='white' opacity='0.08'/%3E%3C/svg%3E")`,
        diag: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 60L60 0' stroke='white' stroke-width='0.5' opacity='0.06'/%3E%3C/svg%3E")`,
      };
    default: // corporate
      return {
        coverBg: `linear-gradient(135deg, ${brandColor} 0%, ${dark} 60%, #0d0d1a 100%)`,
        coverText: '#fff',
        coverAccent: 'rgba(255,255,255,0.3)',
        slideBg: '#fff',
        slideText: '#111',
        slideSubtext: '#555',
        accentBg: `${brandColor}06`,
        cardBg: '#fff',
        cardBorder: '#eee',
        darkSlideBg: `linear-gradient(160deg, #0d0d1a 0%, ${dark} 100%)`,
        darkSlideText: '#fff',
        dots: `url("data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='3' cy='3' r='1.5' fill='white' opacity='0.06'/%3E%3C/svg%3E")`,
        diag: 'none',
      };
  }
};

// ── Slide Renderer ──
const SlideRenderer = ({
  slide, brandColor = '#E34870', secColor = '#1a1a2e', businessName = 'שם העסק',
  logoUrl, phone, email, scale = 1, font = 'Heebo', theme = 'corporate' as PresentationTheme,
}: {
  slide: SlideData; brandColor?: string; secColor?: string; businessName?: string;
  logoUrl?: string; phone?: string; email?: string; scale?: number; font?: string;
  theme?: PresentationTheme;
}) => {
  const dark = adjustColor(brandColor, -40);
  const light = adjustColor(brandColor, 60);
  const tc = getThemeConfig(theme, brandColor, secColor);

  const base: React.CSSProperties = {
    width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top right',
    direction: 'rtl', fontFamily: `"${font}", "Assistant", sans-serif`,
    position: 'absolute', top: 0, right: 0, overflow: 'hidden',
  };

  switch (slide.type) {
    case 'cover':
      if (theme === 'minimal') {
        return (
          <div style={{ ...base, background: '#fff' }}>
            {/* Minimal: clean, elegant, lots of whitespace */}
            <div style={{ position: 'absolute', right: 0, top: 0, width: 8, height: '100%', background: brandColor }} />
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 200px' }}>
              {logoUrl && (
                <img src={logoUrl} alt="logo" style={{ height: 60, objectFit: 'contain', marginBottom: 60, alignSelf: 'flex-start' }} />
              )}
              <h1 style={{ fontSize: 96, fontWeight: 900, color: '#111', margin: 0, lineHeight: 1.05, letterSpacing: '-2px' }}>
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p style={{ fontSize: 32, color: '#999', marginTop: 24, fontWeight: 300 }}>{slide.subtitle}</p>
              )}
              <div style={{ width: 80, height: 4, background: brandColor, marginTop: 50, borderRadius: 2 }} />
              <p style={{ fontSize: 18, color: '#bbb', marginTop: 24, letterSpacing: 2 }}>{businessName}</p>
            </div>
          </div>
        );
      }
      if (theme === 'creative') {
        return (
          <div style={{ ...base, background: tc.coverBg as string }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />
            {/* Organic shapes */}
            <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', bottom: -150, right: -150, width: 500, height: 500, borderRadius: '40%', background: 'rgba(255,255,255,0.05)', transform: 'rotate(45deg)' }} />
            <div style={{ position: 'absolute', top: '20%', right: '10%', width: 200, height: 200, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)' }} />
            <svg style={{ position: 'absolute', bottom: 0, width: '100%', height: 200 }} viewBox="0 0 1920 200" preserveAspectRatio="none">
              <path d="M0,200 L0,120 Q480,40 960,100 Q1440,160 1920,60 L1920,200Z" fill="rgba(0,0,0,0.12)" />
            </svg>
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '100px 160px' }}>
              {logoUrl && (
                <div style={{ width: 120, height: 120, borderRadius: 30, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, marginBottom: 50, boxShadow: '0 12px 50px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <img src={logoUrl} alt="logo" style={{ maxHeight: 80, maxWidth: 80, objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                </div>
              )}
              <h1 style={{ fontSize: 108, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.05, textShadow: '0 6px 40px rgba(0,0,0,0.3)', letterSpacing: '-1px' }}>
                {slide.title}
              </h1>
              {slide.subtitle && <p style={{ fontSize: 36, color: 'rgba(255,255,255,0.85)', marginTop: 30, fontWeight: 400 }}>{slide.subtitle}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 50 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: i === 1 ? 40 : 12, height: 4, borderRadius: 2, background: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)' }} />)}
              </div>
            </div>
          </div>
        );
      }
      // corporate
      return (
        <div style={{ ...base, background: tc.coverBg as string }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', top: -150, left: -150, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${brandColor}30 0%, transparent 70%)` }} />
          <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)' }} />
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 200 }} viewBox="0 0 1920 200" preserveAspectRatio="none">
            <path d="M0 200 L0 80 Q480 0 960 80 Q1440 160 1920 80 L1920 200Z" fill="rgba(0,0,0,0.15)" />
          </svg>
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '100px 160px', textAlign: 'center' }}>
            {logoUrl && (
              <div style={{ width: 140, height: 140, borderRadius: 24, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, marginBottom: 50, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
                <img src={logoUrl} alt="logo" style={{ maxHeight: 100, maxWidth: 100, objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
              </div>
            )}
            <h1 style={{ fontSize: 108, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.05, textShadow: '0 4px 40px rgba(0,0,0,0.3)', letterSpacing: '-1px' }}>{slide.title}</h1>
            {slide.subtitle && <p style={{ fontSize: 38, color: 'rgba(255,255,255,0.75)', marginTop: 30, fontWeight: 400, maxWidth: 1200 }}>{slide.subtitle}</p>}
            <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2, marginTop: 40 }} />
          </div>
        </div>
      );

    case 'about':
      if (theme === 'minimal') {
        return (
          <div style={{ ...base, background: '#fff' }}>
            <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />
            <div style={{ padding: '140px 200px' }}>
              <div style={{ fontSize: 16, color: brandColor, fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>אודות</div>
              <h2 style={{ fontSize: 64, fontWeight: 900, color: '#111', marginBottom: 50, lineHeight: 1.1 }}>{slide.title}</h2>
              <p style={{ fontSize: 30, lineHeight: 2, color: '#666', maxWidth: 1200 }}>{slide.body}</p>
            </div>
            <div style={{ position: 'absolute', bottom: 50, left: 80, fontSize: 16, color: '#ddd' }}>{businessName}</div>
          </div>
        );
      }
      return (
        <div style={{ ...base, background: tc.slideBg }}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(180deg, ${brandColor} 0%, ${dark} 100%)` }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '20px 20px' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 80, height: 6, background: `linear-gradient(90deg, transparent, ${brandColor}40)` }} />
          {theme === 'creative' && <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: hexToRgba(brandColor, 0.04) }} />}
          <div style={{ padding: '120px 180px 120px 140px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 50 }}>
              <div style={{ width: 60, height: 6, background: brandColor, borderRadius: 3 }} />
              <span style={{ fontSize: 22, fontWeight: 600, color: brandColor, letterSpacing: 3 }}>אודות</span>
            </div>
            <h2 style={{ fontSize: 72, fontWeight: 900, color: tc.slideText, marginBottom: 40, lineHeight: 1.1 }}>{slide.title}</h2>
            <p style={{ fontSize: 34, lineHeight: 1.9, color: tc.slideSubtext, maxWidth: 1400 }}>{slide.body}</p>
          </div>
          <div style={{ position: 'absolute', bottom: 50, left: 80, fontSize: 18, color: '#ccc', fontWeight: 500 }}>{businessName}</div>
        </div>
      );

    case 'services':
      return (
        <div style={{ ...base, background: theme === 'minimal' ? '#fff' : '#fafafa' }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${brandColor}, ${dark})` }} />}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          {theme === 'creative' && (
            <>
              <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: hexToRgba(brandColor, 0.06) }} />
              <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '40%', background: hexToRgba(brandColor, 0.04), transform: 'rotate(30deg)' }} />
            </>
          )}
          <div style={{ padding: '90px 140px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div style={{ width: 50, height: 6, background: brandColor, borderRadius: 3 }} />
              <span style={{ fontSize: 20, fontWeight: 600, color: brandColor, letterSpacing: 2 }}>השירותים שלנו</span>
            </div>
            <h2 style={{ fontSize: 64, fontWeight: 900, color: '#111', marginBottom: 60 }}>{slide.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              {(slide.bullets || []).map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 24,
                  padding: theme === 'minimal' ? '28px 0' : '30px 36px',
                  borderRadius: theme === 'minimal' ? 0 : 20,
                  background: theme === 'minimal' ? 'transparent' : '#fff',
                  boxShadow: theme === 'minimal' ? 'none' : '0 2px 20px rgba(0,0,0,0.04)',
                  border: theme === 'minimal' ? 'none' : '1px solid #eee',
                  borderBottom: theme === 'minimal' ? '1px solid #eee' : undefined,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: theme === 'creative' ? 20 : 16,
                    background: theme === 'creative'
                      ? `linear-gradient(135deg, ${brandColor}, #ff6b6b)`
                      : `linear-gradient(135deg, ${brandColor}, ${dark})`,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 800, flexShrink: 0,
                    boxShadow: `0 4px 15px ${brandColor}30`,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <span style={{ fontSize: 28, color: '#333', fontWeight: 600 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 40, left: 60, fontSize: 18, color: '#ccc' }}>{businessName}</div>
        </div>
      );

    case 'value_prop':
      return (
        <div style={{
          ...base,
          background: theme === 'minimal' ? '#fff' : (tc.darkSlideBg as string),
        }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />}
          {theme === 'creative' && <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.diag, backgroundSize: '60px 60px' }} />}
          {theme === 'creative' && <div style={{ position: 'absolute', bottom: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: hexToRgba(brandColor, 0.15) }} />}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          <div style={{ position: 'relative', padding: '100px 150px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div style={{ width: 50, height: 4, background: theme === 'minimal' ? brandColor : light, borderRadius: 2 }} />
              <span style={{ fontSize: 20, fontWeight: 500, color: theme === 'minimal' ? brandColor : light, letterSpacing: 2 }}>למה אנחנו</span>
            </div>
            <h2 style={{
              fontSize: 68, fontWeight: 900,
              color: theme === 'minimal' ? '#111' : '#fff',
              marginBottom: 60, lineHeight: 1.1,
            }}>{slide.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
              {(slide.bullets || []).map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 20, padding: 32, borderRadius: 20,
                  background: theme === 'minimal' ? '#f8f9fa' : 'rgba(255,255,255,0.04)',
                  border: theme === 'minimal' ? '1px solid #eee' : '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', background: brandColor,
                    flexShrink: 0, marginTop: 10,
                    boxShadow: theme === 'minimal' ? 'none' : `0 0 15px ${brandColor}60`,
                  }} />
                  <span style={{
                    fontSize: 28, fontWeight: 500, lineHeight: 1.5,
                    color: theme === 'minimal' ? '#333' : 'rgba(255,255,255,0.85)',
                  }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'stats':
      return (
        <div style={{ ...base, background: '#fff' }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, left: 0, height: 350,
            background: theme === 'creative'
              ? `linear-gradient(135deg, ${brandColor} 0%, #ff6b6b 50%, #ffd93d 100%)`
              : `linear-gradient(135deg, ${brandColor} 0%, ${dark} 100%)`,
          }}>
            {theme !== 'minimal' && <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />}
          </div>
          {theme !== 'minimal' && (
            <svg style={{ position: 'absolute', top: 340, left: 0, width: '100%' }} viewBox="0 0 1920 60" preserveAspectRatio="none">
              <path d="M0 0 L1920 0 L1920 30 Q960 65 0 30Z" fill={theme === 'creative' ? '#ffd93d' : dark} />
            </svg>
          )}
          <div style={{ position: 'relative', padding: '80px 140px' }}>
            <h2 style={{ fontSize: 60, fontWeight: 900, color: theme === 'minimal' ? '#111' : '#fff', marginBottom: 10 }}>{slide.title}</h2>
            {slide.subtitle && <p style={{ fontSize: 26, color: theme === 'minimal' ? '#888' : 'rgba(255,255,255,0.7)', marginBottom: 60 }}>{slide.subtitle}</p>}
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 50, padding: '0 140px', marginTop: 40 }}>
            {(slide.stats || []).map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '50px 40px', borderRadius: 24,
                background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                flex: 1, maxWidth: 350, border: '1px solid #eee',
              }}>
                <div style={{
                  fontSize: 72, fontWeight: 900, lineHeight: 1, marginBottom: 12,
                  color: theme === 'creative' ? (i % 2 === 0 ? brandColor : '#ff6b6b') : brandColor,
                }}>{s.value}</div>
                <div style={{ fontSize: 22, color: '#888', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'process':
      return (
        <div style={{ ...base, background: theme === 'minimal' ? '#fff' : '#fafafa' }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: '100%', background: `linear-gradient(180deg, ${brandColor}, ${dark})` }} />}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          <div style={{ padding: '100px 150px 100px 120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div style={{ width: 50, height: 6, background: brandColor, borderRadius: 3 }} />
              <span style={{ fontSize: 20, fontWeight: 600, color: brandColor, letterSpacing: 2 }}>תהליך העבודה</span>
            </div>
            <h2 style={{ fontSize: 60, fontWeight: 900, color: '#111', marginBottom: 70 }}>{slide.title}</h2>
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
              {(slide.steps || []).map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  {i < (slide.steps?.length || 0) - 1 && (
                    <div style={{ position: 'absolute', top: 35, left: -20, width: 40, height: 3, background: `${brandColor}30` }} />
                  )}
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    background: theme === 'creative'
                      ? `linear-gradient(135deg, ${brandColor}, #ff6b6b)`
                      : `linear-gradient(135deg, ${brandColor}, ${dark})`,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 900, margin: '0 auto 24px',
                    boxShadow: `0 6px 25px ${brandColor}30`,
                  }}>
                    {s.number}
                  </div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: '#222', marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ fontSize: 20, color: '#777', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'testimonial':
      return (
        <div style={{
          ...base,
          background: theme === 'minimal' ? '#fff' : (tc.darkSlideBg as string),
        }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />}
          <div style={{
            position: 'absolute', top: 80, right: 120, fontSize: 300, fontWeight: 900, lineHeight: 1,
            color: theme === 'minimal' ? hexToRgba(brandColor, 0.06) : hexToRgba(brandColor, 0.12),
          }}>״</div>
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 180px', maxWidth: 1400 }}>
            <p style={{
              fontSize: 42, lineHeight: 1.7, fontWeight: 500, fontStyle: 'italic', marginBottom: 50,
              color: theme === 'minimal' ? '#333' : 'rgba(255,255,255,0.9)',
            }}>
              {slide.body}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 50, height: 4, background: brandColor, borderRadius: 2 }} />
              <span style={{ fontSize: 24, color: brandColor, fontWeight: 700 }}>{slide.subtitle}</span>
            </div>
          </div>
        </div>
      );

    case 'cta':
      return (
        <div style={{
          ...base,
          background: theme === 'creative'
            ? `linear-gradient(135deg, ${brandColor} 0%, #ff6b6b 40%, #ffd93d 100%)`
            : theme === 'minimal' ? '#fff'
            : `linear-gradient(135deg, ${brandColor} 0%, ${dark} 100%)`,
        }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />}
          {theme !== 'minimal' && (
            <>
              <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)' }} />
            </>
          )}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          <div style={{
            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '100px 200px',
          }}>
            <h2 style={{
              fontSize: 80, fontWeight: 900, lineHeight: 1.1, marginBottom: 30,
              color: theme === 'minimal' ? '#111' : '#fff',
              textShadow: theme === 'minimal' ? 'none' : '0 4px 30px rgba(0,0,0,0.2)',
            }}>{slide.title}</h2>
            {slide.body && <p style={{
              fontSize: 32, maxWidth: 1000, lineHeight: 1.6,
              color: theme === 'minimal' ? '#666' : 'rgba(255,255,255,0.8)',
            }}>{slide.body}</p>}
            <div style={{
              marginTop: 50, padding: '20px 60px', borderRadius: 16,
              background: theme === 'minimal' ? brandColor : 'rgba(255,255,255,0.15)',
              backdropFilter: theme === 'minimal' ? undefined : 'blur(8px)',
              border: theme === 'minimal' ? 'none' : '2px solid rgba(255,255,255,0.2)',
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>צרו קשר עוד היום</span>
            </div>
          </div>
        </div>
      );

    case 'contact':
      return (
        <div style={{
          ...base,
          background: theme === 'minimal' ? '#fff' : (tc.darkSlideBg as string),
        }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />}
          {theme !== 'minimal' && <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: hexToRgba(brandColor, 0.08) }} />}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          <div style={{
            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 100,
          }}>
            <h2 style={{
              fontSize: 80, fontWeight: 900, marginBottom: 20,
              color: theme === 'minimal' ? '#111' : '#fff',
            }}>{slide.title}</h2>
            {slide.body && <p style={{
              fontSize: 28, marginBottom: 60,
              color: theme === 'minimal' ? '#888' : 'rgba(255,255,255,0.6)',
            }}>{slide.body}</p>}
            <div style={{ display: 'flex', gap: 80, marginBottom: 60 }}>
              {phone && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    background: theme === 'minimal' ? hexToRgba(brandColor, 0.1) : hexToRgba(brandColor, 0.2),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 30,
                  }}>📞</div>
                  <div style={{ fontSize: 18, color: brandColor, marginBottom: 8, fontWeight: 600 }}>טלפון</div>
                  <div style={{
                    fontSize: 32, fontWeight: 700, direction: 'ltr',
                    color: theme === 'minimal' ? '#222' : '#fff',
                  }}>{phone}</div>
                </div>
              )}
              {email && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    background: theme === 'minimal' ? hexToRgba(brandColor, 0.1) : hexToRgba(brandColor, 0.2),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 30,
                  }}>✉️</div>
                  <div style={{ fontSize: 18, color: brandColor, marginBottom: 8, fontWeight: 600 }}>אימייל</div>
                  <div style={{
                    fontSize: 32, fontWeight: 700,
                    color: theme === 'minimal' ? '#222' : '#fff',
                  }}>{email}</div>
                </div>
              )}
            </div>
            {logoUrl && (
              <div style={{
                width: 100, height: 100, borderRadius: 20,
                background: theme === 'minimal' ? '#f5f5f5' : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
              }}>
                <img src={logoUrl} alt="logo" style={{
                  maxHeight: 68, maxWidth: 68, objectFit: 'contain',
                  filter: theme === 'minimal' ? 'none' : 'brightness(0) invert(1)',
                  opacity: theme === 'minimal' ? 1 : 0.5,
                }} />
              </div>
            )}
          </div>
        </div>
      );

    case 'vision':
      return (
        <div style={{ ...base, background: theme === 'minimal' ? '#fff' : (tc.darkSlideBg as string) }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          {theme === 'creative' && <div style={{ position: 'absolute', top: -150, left: -150, width: 500, height: 500, borderRadius: '50%', background: hexToRgba(brandColor, 0.1) }} />}
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
              <div style={{ width: 50, height: 6, background: theme === 'minimal' ? brandColor : light, borderRadius: 3 }} />
              <span style={{ fontSize: 20, fontWeight: 600, color: theme === 'minimal' ? brandColor : light, letterSpacing: 3 }}>חזון וערכים</span>
            </div>
            <h2 style={{ fontSize: 72, fontWeight: 900, color: theme === 'minimal' ? '#111' : '#fff', marginBottom: 40, lineHeight: 1.1 }}>{slide.title}</h2>
            {slide.body && <p style={{ fontSize: 32, lineHeight: 1.9, color: theme === 'minimal' ? '#666' : 'rgba(255,255,255,0.75)', maxWidth: 1300 }}>{slide.body}</p>}
            {slide.bullets && (
              <div style={{ display: 'flex', gap: 40, marginTop: 50 }}>
                {slide.bullets.map((b, i) => (
                  <div key={i} style={{ flex: 1, padding: '30px 28px', borderRadius: 20, background: theme === 'minimal' ? '#f8f9fa' : 'rgba(255,255,255,0.06)', border: theme === 'minimal' ? '1px solid #eee' : '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{['🎯', '💡', '🏆', '⭐'][i % 4]}</div>
                    <span style={{ fontSize: 24, fontWeight: 600, color: theme === 'minimal' ? '#333' : 'rgba(255,255,255,0.9)' }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 50, left: 80, fontSize: 18, color: theme === 'minimal' ? '#ddd' : 'rgba(255,255,255,0.3)' }}>{businessName}</div>
        </div>
      );

    case 'methodology':
      return (
        <div style={{ ...base, background: theme === 'minimal' ? '#fff' : '#fafafa' }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: '100%', background: `linear-gradient(180deg, ${brandColor}, ${dark})` }} />}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          <div style={{ padding: '100px 150px 100px 120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div style={{ width: 50, height: 6, background: brandColor, borderRadius: 3 }} />
              <span style={{ fontSize: 20, fontWeight: 600, color: brandColor, letterSpacing: 2 }}>איך אנחנו עובדים</span>
            </div>
            <h2 style={{ fontSize: 60, fontWeight: 900, color: '#111', marginBottom: 70 }}>{slide.title}</h2>
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
              {(slide.steps || []).map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  {i < (slide.steps?.length || 0) - 1 && (
                    <div style={{ position: 'absolute', top: 35, left: -20, width: 40, height: 3, background: `${brandColor}30` }} />
                  )}
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    background: theme === 'creative' ? `linear-gradient(135deg, ${brandColor}, #ff6b6b)` : `linear-gradient(135deg, ${brandColor}, ${dark})`,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 900, margin: '0 auto 24px',
                    boxShadow: `0 6px 25px ${brandColor}30`,
                  }}>{s.number}</div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: '#222', marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ fontSize: 20, color: '#777', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'social_proof':
      return (
        <div style={{ ...base, background: theme === 'minimal' ? '#fff' : '#fafafa' }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${brandColor}, ${dark})` }} />}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          {theme === 'creative' && <div style={{ position: 'absolute', bottom: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: hexToRgba(brandColor, 0.05) }} />}
          <div style={{ padding: '90px 140px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div style={{ width: 50, height: 6, background: brandColor, borderRadius: 3 }} />
              <span style={{ fontSize: 20, fontWeight: 600, color: brandColor, letterSpacing: 2 }}>למה דווקא אנחנו?</span>
            </div>
            <h2 style={{ fontSize: 64, fontWeight: 900, color: '#111', marginBottom: 60 }}>{slide.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: (slide.bullets?.length || 0) > 4 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 28 }}>
              {(slide.bullets || []).map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  padding: theme === 'minimal' ? '24px 0' : '28px 32px',
                  borderRadius: theme === 'minimal' ? 0 : 20,
                  background: theme === 'minimal' ? 'transparent' : '#fff',
                  boxShadow: theme === 'minimal' ? 'none' : '0 2px 20px rgba(0,0,0,0.04)',
                  border: theme === 'minimal' ? 'none' : '1px solid #eee',
                  borderBottom: theme === 'minimal' ? '1px solid #eee' : undefined,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: theme === 'creative' ? `linear-gradient(135deg, ${brandColor}, #ff6b6b)` : hexToRgba(brandColor, 0.1),
                    color: theme === 'creative' ? '#fff' : brandColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 800, flexShrink: 0,
                  }}>✓</div>
                  <span style={{ fontSize: 24, color: '#333', fontWeight: 600 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 40, left: 60, fontSize: 18, color: '#ccc' }}>{businessName}</div>
        </div>
      );

    case 'target_audience':
      return (
        <div style={{ ...base, background: theme === 'minimal' ? '#fff' : (tc.darkSlideBg as string) }}>
          {theme !== 'minimal' && <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px' }} />}
          {theme === 'minimal' && <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', background: brandColor }} />}
          {theme === 'creative' && (
            <>
              <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '40%', background: 'rgba(255,255,255,0.03)', transform: 'rotate(30deg)' }} />
            </>
          )}
          <div style={{ position: 'relative', padding: '100px 160px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
              <div style={{ width: 50, height: 6, background: theme === 'minimal' ? brandColor : light, borderRadius: 3 }} />
              <span style={{ fontSize: 20, fontWeight: 600, color: theme === 'minimal' ? brandColor : light, letterSpacing: 3 }}>למי השירות מתאים</span>
            </div>
            <h2 style={{ fontSize: 68, fontWeight: 900, color: theme === 'minimal' ? '#111' : '#fff', marginBottom: 50, lineHeight: 1.1 }}>{slide.title}</h2>
            {slide.body && <p style={{ fontSize: 28, lineHeight: 1.8, color: theme === 'minimal' ? '#888' : 'rgba(255,255,255,0.6)', marginBottom: 40, maxWidth: 1000 }}>{slide.body}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {(slide.bullets || []).map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 20, padding: 28, borderRadius: 20,
                  background: theme === 'minimal' ? '#f8f9fa' : 'rgba(255,255,255,0.06)',
                  border: theme === 'minimal' ? '1px solid #eee' : '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 16,
                    background: theme === 'creative' ? `linear-gradient(135deg, ${brandColor}, #ff6b6b)` : hexToRgba(brandColor, theme === 'minimal' ? 0.1 : 0.2),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                  }}>👤</div>
                  <span style={{ fontSize: 26, fontWeight: 600, color: theme === 'minimal' ? '#333' : 'rgba(255,255,255,0.9)' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 50, left: 80, fontSize: 18, color: theme === 'minimal' ? '#ddd' : 'rgba(255,255,255,0.3)' }}>{businessName}</div>
        </div>
      );

    default:
      return (
        <div style={{ ...base, background: '#fff' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 32 }}>
            שקופית ריקה
          </div>
        </div>
      );
  }
};

// ── Theme Selector ──
const THEMES: { id: PresentationTheme; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'minimal', label: 'מינימלי', desc: 'נקי, אלגנטי, הרבה חלל לבן', icon: <Palette className="w-6 h-6" /> },
  { id: 'corporate', label: 'תאגידי', desc: 'מקצועי, רציני, עם עומק', icon: <Building2 className="w-6 h-6" /> },
  { id: 'creative', label: 'יצירתי', desc: 'נועז, צבעוני, סוחף', icon: <Zap className="w-6 h-6" /> },
];

// ── Brief Screen ──
const BriefScreen = ({
  onGenerate, businessName, isLoading,
}: {
  onGenerate: (brief: string, count: number, theme: PresentationTheme) => void;
  businessName: string;
  isLoading: boolean;
}) => {
  const [brief, setBrief] = useState('');
  const [slideCount, setSlideCount] = useState(7);
  const [theme, setTheme] = useState<PresentationTheme>('corporate');

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
            {/* Theme selector */}
            <div>
              <label className="text-sm font-bold text-foreground mb-3 block">בחר סגנון עיצוב</label>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      theme === t.id
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border hover:border-primary/30 bg-card'
                    }`}
                  >
                    <div className={`mx-auto mb-2 w-10 h-10 rounded-lg flex items-center justify-center ${
                      theme === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {t.icon}
                    </div>
                    <div className="font-bold text-sm text-foreground">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">על מה המצגת? *</label>
              <Textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder={`לדוגמה: מצגת תדמית ל${businessName}. אנחנו מתמחים ב... היתרונות שלנו הם... קהל היעד שלנו...`}
                rows={5}
                className="text-base"
                dir="rtl"
              />
              <p className="text-xs text-muted-foreground mt-1">ככל שתתאר יותר, התוצאה תהיה מדויקת יותר</p>
            </div>

            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">מספר שקופיות</label>
              <div className="flex gap-2">
                {[5, 7, 10].map(n => (
                  <Button key={n} variant={slideCount === n ? 'default' : 'outline'} size="sm" onClick={() => setSlideCount(n)} className="flex-1">
                    {n} שקופיות
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-12 text-base gap-2"
              onClick={() => onGenerate(brief, slideCount, theme)}
              disabled={!brief.trim() || isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />יוצר את המצגת...</>
              ) : (
                <><Wand2 className="w-5 h-5" />צור מצגת</>
              )}
            </Button>
          </CardContent>
        </Card>
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
  const [currentTheme, setCurrentTheme] = useState<PresentationTheme>('corporate');

  const brandColor = profile?.primary_color || '#E34870';
  const secColor = profile?.secondary_color || '#1a1a2e';
  const businessName = profile?.business_name || 'שם העסק';
  const logoUrl = profile?.logo_url || undefined;
  const phone = profile?.contact_phone || '';
  const email = profile?.contact_email || '';
  const font = profile?.header_font || 'Heebo';

  const handleGenerate = async (brief: string, slideCount: number, theme: PresentationTheme) => {
    setIsGenerating(true);
    setCurrentTheme(theme);
    try {
      const profileData = profile ? {
        businessName: profile.business_name,
        phone: profile.contact_phone,
        email: profile.contact_email,
        address: profile.contact_address,
        website: profile.website_url,
        xFactors: profile.x_factors,
        targetAudience: profile.target_audience,
        winningFeature: profile.winning_feature,
        primaryXFactor: profile.primary_x_factor,
        qualitySignatures: profile.quality_signatures as string[] | undefined,
        successfulCampaigns: profile.successful_campaigns,
        facebook: profile.social_facebook,
        instagram: profile.social_instagram,
        linkedin: profile.social_linkedin,
        tiktok: profile.social_tiktok,
        youtube: profile.contact_youtube,
        openingHours: profile.opening_hours,
        branches: profile.branches,
      } : undefined;

      const { data, error } = await supabase.functions.invoke('generate-presentation', {
        body: { brief, businessName, industry: '', slideCount, theme, profileData },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const generatedSlides: SlideData[] = (data.slides || []).map((s: any, i: number) => ({
        ...s, id: `${Date.now()}-${i}`,
      }));

      setSlides(generatedSlides);
      setActiveSlide(0);
      toast.success(`נוצרו ${generatedSlides.length} שקופיות בסגנון ${THEMES.find(t => t.id === theme)?.label}!`);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה ביצירת המצגת. נסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

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
          <SlideRenderer slide={slides[i]} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={1} font={font} theme={currentTheme} />
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
          <SlideRenderer slide={slides[activeSlide]} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={Math.min(window.innerWidth / 1920, window.innerHeight / 1080)} font={font} theme={currentTheme} />
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
        {/* Sidebar */}
        <div className="w-48 bg-card border-l border-border overflow-y-auto p-3 space-y-2">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${i === activeSlide ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/30'}`}
              onClick={() => setActiveSlide(i)}
            >
              <div className="aspect-video relative overflow-hidden bg-muted">
                <SlideRenderer slide={slide} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={0.09} font={font} theme={currentTheme} />
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
                <ArrowRight className="w-4 h-4 ml-1" />חזרה
              </Button>
              <Badge variant="secondary" className="text-xs">{activeSlide + 1}/{slides.length}</Badge>
              <Badge variant="outline" className="text-xs">{THEMES.find(t => t.id === currentTheme)?.label}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSlides(null); setActiveSlide(0); }} className="gap-1">
                <Wand2 className="w-3.5 h-3.5" />בריף חדש
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsPresenting(true)}>
                <Eye className="w-4 h-4 ml-1" />הצג
              </Button>
              <Button size="sm" onClick={exportPDF} disabled={isExporting} className="bg-gradient-to-l from-primary to-primary/80 text-primary-foreground">
                <Download className="w-4 h-4 ml-1" />{isExporting ? 'מייצא...' : 'ייצא PDF'}
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 overflow-hidden">
            <div className="relative shadow-2xl rounded-lg overflow-hidden" style={{ width: 'min(100%, 960px)', aspectRatio: '16/9' }}>
              <SlideRenderer slide={currentSlide} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={0.5} font={font} theme={currentTheme} />
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

        {/* Right Panel */}
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

            {(currentSlide.type === 'about' || currentSlide.type === 'vision' || currentSlide.type === 'contact' || currentSlide.type === 'testimonial' || currentSlide.type === 'cta') && (
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
                  <Plus className="w-3 h-3 ml-1" />הוסף פריט
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
                  <Plus className="w-3 h-3 ml-1" />הוסף נתון
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
                  <Plus className="w-3 h-3 ml-1" />הוסף שלב
                </Button>
              </div>
            )}
          </div>

          {/* Theme switcher in editor */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <label className="text-xs font-bold text-foreground mb-2 block">סגנון עיצוב</label>
            <div className="flex gap-1">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setCurrentTheme(t.id)}
                  className={`flex-1 text-[10px] py-1.5 px-1 rounded font-medium transition-all ${
                    currentTheme === t.id ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {profile && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
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
