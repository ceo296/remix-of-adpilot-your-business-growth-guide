import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PresentationViewer } from '@/components/studio/PresentationViewer';
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
  image_prompt?: string;
  imageUrl?: string;
  imageLoading?: boolean;
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

// Check if a color is "light" (would need dark text on top)
const isLightColor = (hex: string): boolean => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

// ── Logo Footer ── (shown on every slide)
const LogoFooter = ({ logoUrl, businessName, brandColor, phone, theme }: {
  logoUrl?: string; businessName: string; brandColor: string; phone?: string; theme: PresentationTheme;
}) => {
  const isDark = theme === 'corporate';
  const isCreative = theme === 'creative';
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
      background: isDark
        ? 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)'
        : isCreative
          ? `linear-gradient(0deg, ${hexToRgba(brandColor, 0.06)} 0%, transparent 100%)`
          : `linear-gradient(0deg, ${hexToRgba(brandColor, 0.08)} 0%, transparent 100%)`,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '0 60px 16px', zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {logoUrl && (
          <img src={logoUrl} alt="logo" style={{
            height: 40, objectFit: 'contain',
            filter: isDark ? 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.5))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
          }} />
        )}
        <span style={{
          fontSize: 16, fontWeight: 700, letterSpacing: 1,
          color: isDark ? 'rgba(255,255,255,0.7)' : '#888',
        }}>{businessName}</span>
      </div>
    </div>
  );
};

// ── Photo background helper ── (Million Dollar quality)
const PhotoBg = ({ url, opacity = 1, position = 'right', width = '50%' }: {
  url: string; opacity?: number; position?: 'right' | 'left' | 'full'; width?: string;
}) => {
  if (position === 'full') {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center',
        opacity,
      }} />
    );
  }
  // Side placement: image fills one side, elegant gradient fade to content area
  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0,
      [position === 'right' ? 'right' : 'left']: 0,
      width,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center',
        opacity,
      }} />
      {/* Smooth gradient fade towards text side */}
      <div style={{
        position: 'absolute', inset: 0,
        background: position === 'right'
          ? 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 20%, rgba(255,255,255,0) 50%)'
          : 'linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 20%, rgba(255,255,255,0) 50%)',
      }} />
    </div>
  );
};

// Dark photo background: cinematic overlay with vignette
const DarkPhotoBg = ({ url, opacity = 0.25 }: { url: string; opacity?: number }) => (
  <>
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center',
    }} />
    {/* Dark cinematic overlay */}
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(160deg, rgba(0,0,0,${1 - opacity}) 0%, rgba(0,0,0,${Math.min(1, 1 - opacity + 0.15)}) 50%, rgba(0,0,0,${Math.min(1, 1 - opacity + 0.25)}) 100%)`,
    }} />
    {/* Subtle vignette for cinematic depth */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
    }} />
  </>
);

// ── Theme configs ──
const getThemeConfig = (theme: PresentationTheme, brandColor: string, secColor: string) => {
  const dark = adjustColor(brandColor, -40);
  const light = adjustColor(brandColor, 60);
  const veryLight = adjustColor(brandColor, 100);

  switch (theme) {
    case 'minimal':
      return {
        coverBg: '#fff', coverText: '#111', coverAccent: brandColor,
        slideBg: '#fff', slideText: '#222', slideSubtext: '#666',
        accentBg: `${brandColor}08`, cardBg: '#f8f9fa', cardBorder: '#eee',
        darkSlideBg: '#fafafa', darkSlideText: '#111',
        dots: 'none', diag: 'none',
        mode: 'light' as const,
      };
    case 'creative':
      return {
        coverBg: `linear-gradient(135deg, ${brandColor} 0%, #ff6b6b 30%, #ffd93d 60%, ${adjustColor(brandColor, 40)} 100%)`,
        coverText: '#fff', coverAccent: '#fff',
        slideBg: `linear-gradient(160deg, #fefefe 0%, ${veryLight}22 40%, ${hexToRgba(brandColor, 0.06)} 100%)`,
        slideText: '#111', slideSubtext: '#444',
        accentBg: `linear-gradient(135deg, ${hexToRgba(brandColor, 0.08)}, ${hexToRgba('#ff6b6b', 0.05)})`,
        cardBg: '#fff', cardBorder: `${brandColor}25`,
        darkSlideBg: `linear-gradient(160deg, #1a1a2e 0%, ${dark} 50%, ${brandColor}90 100%)`,
        darkSlideText: '#fff',
        dots: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='5' cy='5' r='3' fill='${encodeURIComponent(brandColor)}' opacity='0.07'/%3E%3C/svg%3E")`,
        diag: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 60L60 0' stroke='${encodeURIComponent(brandColor)}' stroke-width='0.8' opacity='0.06'/%3E%3C/svg%3E")`,
        mode: 'light' as const,
      };
    default: // corporate
      return {
        coverBg: `linear-gradient(135deg, ${brandColor} 0%, ${dark} 60%, #0d0d1a 100%)`,
        coverText: '#fff', coverAccent: 'rgba(255,255,255,0.3)',
        slideBg: '#fff', slideText: '#111', slideSubtext: '#555',
        accentBg: `${brandColor}06`, cardBg: '#fff', cardBorder: '#eee',
        darkSlideBg: `linear-gradient(160deg, #0d0d1a 0%, ${dark} 100%)`,
        darkSlideText: '#fff',
        dots: `url("data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='3' cy='3' r='1.5' fill='white' opacity='0.06'/%3E%3C/svg%3E")`,
        diag: 'none',
        mode: 'dark' as const,
      };
  }
};

// ── Pick a photo for a given slide index ──
const getPhotoForSlide = (photos: string[], slideIndex: number): string | undefined => {
  if (!photos || photos.length === 0) return undefined;
  return photos[slideIndex % photos.length];
};

// ── Slide Renderer ──
const SlideRenderer = ({
  slide, brandColor = '#E34870', secColor = '#1a1a2e', businessName = 'שם העסק',
  logoUrl, phone, email, scale = 1, font = 'Heebo', theme = 'corporate' as PresentationTheme,
  businessPhotos = [], slideIndex = 0, address,
}: {
  slide: SlideData; brandColor?: string; secColor?: string; businessName?: string;
  logoUrl?: string; phone?: string; email?: string; scale?: number; font?: string;
  theme?: PresentationTheme; businessPhotos?: string[]; slideIndex?: number; address?: string;
}) => {
  const dark = adjustColor(brandColor, -40);
  const light = adjustColor(brandColor, 60);
  const veryLight = adjustColor(brandColor, 100);
  const tc = getThemeConfig(theme, brandColor, secColor);
  const photo = slide.imageUrl || getPhotoForSlide(businessPhotos, slideIndex);
  const brandIsLight = isLightColor(brandColor);

  // Theme mode helpers
  const isDark = theme === 'corporate';
  const isCreative = theme === 'creative';
  const isMinimal = theme === 'minimal';

  // Typography strategy: pick body font and weights based on theme
  const typoConfig = (() => {
    if (isMinimal) return { headerFamily: 'Alef', headerWeight: 700, bodyFamily: 'Heebo', bodyWeight: 300, headerLineHeight: 1.2, headerLetterSpacing: '0.15em', bodyLineHeight: 1.8 };
    if (isCreative) return { headerFamily: 'Frank Ruhl Libre', headerWeight: 700, bodyFamily: 'Assistant', bodyWeight: 300, headerLineHeight: 1.05, headerLetterSpacing: '-0.03em', bodyLineHeight: 1.8 };
    // corporate / default: elegant-classic
    return { headerFamily: 'David Libre', headerWeight: 700, bodyFamily: 'Heebo', bodyWeight: 400, headerLineHeight: 1.1, headerLetterSpacing: '0', bodyLineHeight: 1.7 };
  })();

  // If brand has a custom font, it overrides the header
  const headerFont = font || typoConfig.headerFamily;
  const bodyFont = typoConfig.bodyFamily;

  const base: React.CSSProperties = {
    width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top right',
    direction: 'rtl', fontFamily: `"${bodyFont}", "Assistant", sans-serif`,
    position: 'absolute', top: 0, right: 0, overflow: 'hidden',
  };

  const footer = <LogoFooter logoUrl={logoUrl} businessName={businessName} brandColor={brandColor} phone={phone} theme={slide.type === 'cover' ? (isMinimal ? 'minimal' : 'corporate') : theme} />;

  // Typography helpers
  const titleStyle = (fontSize: number, extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: `"${headerFont}", "${typoConfig.headerFamily}", serif`,
    fontWeight: typoConfig.headerWeight,
    lineHeight: typoConfig.headerLineHeight,
    letterSpacing: typoConfig.headerLetterSpacing,
    fontSize,
    ...extra,
  });

  const bodyStyle = (fontSize: number, extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: `"${bodyFont}", "Assistant", sans-serif`,
    fontWeight: typoConfig.bodyWeight,
    lineHeight: typoConfig.bodyLineHeight,
    fontSize,
    ...extra,
  });

  // Ensure readable text: always dark text on light bg, white text on dark bg
  const safeText = (bg: 'dark' | 'light') => bg === 'dark' ? '#ffffff' : '#111111';
  const safeSubtext = (bg: 'dark' | 'light') => bg === 'dark' ? 'rgba(255,255,255,0.8)' : '#555555';
  const safeMuted = (bg: 'dark' | 'light') => bg === 'dark' ? 'rgba(255,255,255,0.55)' : '#999999';
  const textShadow = (bg: 'dark' | 'light') => bg === 'dark' ? '0 2px 20px rgba(0,0,0,0.5)' : 'none';

  // Helper: get slide background and text mode per theme — Million Dollar quality
  const getSlideBg = (slideType: string): { background: string; mode: 'dark' | 'light'; decorBg: React.ReactNode } => {
    if (isMinimal) {
      return {
        background: slideType === 'stats' ? '#f7f7f8' : '#ffffff',
        mode: 'light',
        decorBg: (
          <>
            {/* Subtle brand accent line on right edge */}
            <div style={{ position: 'absolute', right: 0, top: 0, width: 5, height: '100%', background: `linear-gradient(180deg, ${brandColor}, ${adjustColor(brandColor, -30)})` }} />
            {/* Very subtle geometric accent */}
            <div style={{ position: 'absolute', bottom: 60, left: 80, width: 120, height: 120, border: `1px solid ${hexToRgba(brandColor, 0.06)}`, borderRadius: '50%' }} />
          </>
        ),
      };
    }
    if (isCreative) {
      const creativeBgs: Record<string, string> = {
        cover: tc.coverBg as string,
        about: `linear-gradient(160deg, #fefefe 0%, ${hexToRgba(brandColor, 0.05)} 50%, ${hexToRgba(brandColor, 0.1)} 100%)`,
        services: `linear-gradient(135deg, #fefefe 0%, ${hexToRgba(brandColor, 0.04)} 40%, ${hexToRgba('#ff6b6b', 0.06)} 100%)`,
        vision: `linear-gradient(160deg, #fefefe 0%, ${hexToRgba(brandColor, 0.07)} 60%, ${hexToRgba(brandColor, 0.12)} 100%)`,
        value_prop: `linear-gradient(160deg, #fefefe 0%, ${hexToRgba(brandColor, 0.05)} 100%)`,
        stats: `linear-gradient(135deg, ${brandColor} 0%, ${adjustColor(brandColor, -30)} 50%, ${dark} 100%)`,
        process: `linear-gradient(160deg, #fefefe 0%, ${hexToRgba(brandColor, 0.06)} 100%)`,
        methodology: `linear-gradient(160deg, #fefefe 0%, ${hexToRgba(brandColor, 0.06)} 100%)`,
        social_proof: `linear-gradient(160deg, #fefefe 0%, ${hexToRgba(brandColor, 0.05)} 50%, ${hexToRgba('#ffd93d', 0.06)} 100%)`,
        target_audience: `linear-gradient(135deg, #fefefe 0%, ${hexToRgba(brandColor, 0.07)} 100%)`,
        cta: `linear-gradient(135deg, ${brandColor} 0%, ${adjustColor(brandColor, -40)} 60%, ${dark} 100%)`,
        contact: `linear-gradient(160deg, #fefefe 0%, ${hexToRgba(brandColor, 0.08)} 100%)`,
        testimonial: `linear-gradient(160deg, #fefefe 0%, ${hexToRgba(brandColor, 0.04)} 100%)`,
      };
      const isCreativeDark = ['cover', 'stats', 'cta'].includes(slideType);
      return {
        background: creativeBgs[slideType] || '#fefefe',
        mode: isCreativeDark ? 'dark' : 'light',
        decorBg: (
          <>
            {/* Elegant geometric decorations — subtle, not distracting */}
            {!isCreativeDark && (
              <>
                <div style={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, border: `1px solid ${hexToRgba(brandColor, 0.08)}`, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, border: `1px solid ${hexToRgba(brandColor, 0.06)}`, borderRadius: '50%' }} />
              </>
            )}
            {isCreativeDark && (
              <>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
              </>
            )}
          </>
        ),
      };
    }
    // Corporate: premium dark with depth
    const corpBgs: Record<string, string> = {
      cover: tc.coverBg as string,
      about: `linear-gradient(160deg, #0a0a1a 0%, ${dark} 40%, ${adjustColor(brandColor, -50)} 100%)`,
      services: `linear-gradient(135deg, #0a0a1a 0%, ${dark} 50%, ${adjustColor(brandColor, -40)}cc 100%)`,
      vision: `linear-gradient(160deg, #0d0d1a 0%, ${dark} 60%, ${adjustColor(brandColor, -40)} 100%)`,
      value_prop: `linear-gradient(160deg, #0d0d1a 0%, ${dark} 100%)`,
      stats: `linear-gradient(135deg, ${dark} 0%, ${brandColor} 50%, ${adjustColor(brandColor, 30)} 100%)`,
      process: `linear-gradient(160deg, #0a0a1a 0%, ${dark} 70%, ${adjustColor(brandColor, -40)}88 100%)`,
      methodology: `linear-gradient(160deg, #0a0a1a 0%, ${dark} 70%, ${adjustColor(brandColor, -40)}88 100%)`,
      social_proof: `linear-gradient(150deg, #0a0a1a 0%, ${dark} 60%, ${adjustColor(brandColor, -30)}aa 100%)`,
      target_audience: `linear-gradient(160deg, #0d0d1a 0%, ${dark} 100%)`,
      cta: `linear-gradient(135deg, ${brandColor} 0%, ${dark} 70%, #0a0a1a 100%)`,
      contact: `linear-gradient(160deg, #0d0d1a 0%, ${dark} 100%)`,
      testimonial: `linear-gradient(160deg, #0d0d1a 0%, ${dark} 60%, ${adjustColor(brandColor, -40)}66 100%)`,
    };
    return {
      background: corpBgs[slideType] || `linear-gradient(160deg, #0d0d1a 0%, ${dark} 100%)`,
      mode: 'dark',
      decorBg: (
        <>
          {/* Subtle dot pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: tc.dots, backgroundSize: '30px 30px', opacity: 0.5 }} />
          {/* Elegant geometric rings instead of ugly filled circles */}
          <div style={{ position: 'absolute', bottom: -100, left: -60, width: 350, height: 350, border: '1px solid rgba(255,255,255,0.04)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -20, width: 250, height: 250, border: '1px solid rgba(255,255,255,0.03)', borderRadius: '50%' }} />
          {/* Subtle radial glow from brand color */}
          {slideType === 'cover' && <div style={{ position: 'absolute', top: '20%', right: '10%', width: 500, height: 500, background: `radial-gradient(circle, ${hexToRgba(brandColor, 0.08)} 0%, transparent 70%)` }} />}
        </>
      ),
    };
  };

  // Card style helper
  const getCardStyle = (mode: 'dark' | 'light'): React.CSSProperties => {
    if (isCreative && mode === 'light') {
      return {
        background: '#fff', borderRadius: 24,
        boxShadow: `0 4px 30px ${hexToRgba(brandColor, 0.1)}`,
        border: `2px solid ${hexToRgba(brandColor, 0.15)}`,
      };
    }
    if (isMinimal) {
      return {
        background: '#fff', borderRadius: 20,
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        border: '1px solid #eee',
      };
    }
    // Corporate dark
    return {
      background: 'rgba(255,255,255,0.08)', borderRadius: 20,
      boxShadow: '0 4px 30px rgba(0,0,0,0.15)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(8px)',
    };
  };

  // Accent element style
  const accentLine = (mode: 'dark' | 'light') => ({
    width: 50, height: 6, borderRadius: 3,
    background: isCreative && mode === 'light'
      ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)`
      : isMinimal ? brandColor
      : '#fff',
  });

  const labelColor = (mode: 'dark' | 'light') =>
    isCreative && mode === 'light' ? brandColor
    : isMinimal ? brandColor
    : 'rgba(255,255,255,0.85)';

  // Number badge style for services/process
  const getNumberBadge = (mode: 'dark' | 'light'): React.CSSProperties => {
    if (isCreative && mode === 'light') {
      return {
        background: `linear-gradient(135deg, ${brandColor}, #ff6b6b)`,
        color: '#fff', boxShadow: `0 6px 20px ${hexToRgba(brandColor, 0.3)}`,
      };
    }
    if (isMinimal) {
      return {
        background: `linear-gradient(135deg, ${brandColor}, ${dark})`,
        color: '#fff', boxShadow: `0 4px 15px ${brandColor}30`,
      };
    }
    return {
      background: 'rgba(255,255,255,0.15)', color: '#fff',
      boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
      border: '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(6px)',
    };
  };

  switch (slide.type) {
    case 'cover': {
      const { background, mode, decorBg } = getSlideBg('cover');
      const bg = mode;
      return (
        <div style={{ ...base, background }}>
          {/* Cover: photo is always full-bleed behind dark overlay for cinematic effect */}
          {photo && <DarkPhotoBg url={photo} opacity={0.35} />}
          {decorBg}
          {isDark && (
            <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 200, zIndex: 1 }} viewBox="0 0 1920 200" preserveAspectRatio="none">
              <path d="M0 200 L0 100 Q480 20 960 80 Q1440 140 1920 60 L1920 200Z" fill="rgba(0,0,0,0.2)" />
            </svg>
          )}
          <div style={{
            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', zIndex: 2,
            padding: isMinimal ? '120px 200px' : '100px 160px',
            alignItems: isMinimal ? 'flex-start' : 'center',
            textAlign: isMinimal ? 'right' : 'center',
          }}>
            {logoUrl && !isMinimal && (
              <div style={{
                width: 130, height: 130, borderRadius: 28,
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20, marginBottom: 50,
                boxShadow: '0 8px 40px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <img src={logoUrl} alt="logo" style={{
                  maxHeight: 90, maxWidth: 90, objectFit: 'contain',
                  filter: 'brightness(0) invert(1) drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                }} />
              </div>
            )}
            {logoUrl && isMinimal && (
              <img src={logoUrl} alt="logo" style={{ height: 60, objectFit: 'contain', marginBottom: 60, alignSelf: 'flex-start' }} />
            )}
            <h1 style={titleStyle(isMinimal ? 96 : 110, {
              color: photo ? '#ffffff' : safeText(bg), margin: 0,
              textShadow: photo ? '0 4px 30px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.3)' : textShadow(bg),
            })}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p style={{
                fontSize: isMinimal ? 32 : 36,
                color: photo ? 'rgba(255,255,255,0.85)' : safeSubtext(bg),
                marginTop: 24, fontWeight: 400,
                textShadow: photo ? '0 2px 15px rgba(0,0,0,0.4)' : textShadow(bg), maxWidth: 1200,
              }}>{slide.subtitle}</p>
            )}
            <div style={{ width: 80, height: 4, background: photo ? 'rgba(255,255,255,0.4)' : (bg === 'dark' ? 'rgba(255,255,255,0.3)' : brandColor), marginTop: 50, borderRadius: 2 }} />
          </div>
          {footer}
        </div>
      );
    }

    case 'about': {
      const { background, mode, decorBg } = getSlideBg('about');
      const hasPhoto = !!photo;
      // When photo exists: always full-bleed with dark overlay for guaranteed readability
      const effectiveMode = hasPhoto ? 'dark' : mode;
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.3} />}
          {decorBg}
          <div style={{ padding: '120px 180px 120px 140px', position: 'relative', zIndex: 2 }}>
            <h2 style={titleStyle(68, { color: safeText(effectiveMode), marginBottom: 40, textShadow: textShadow(effectiveMode) })}>{slide.title}</h2>
            <div style={{ width: 60, height: 5, background: hasPhoto ? 'rgba(255,255,255,0.4)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.3)'), borderRadius: 3, marginBottom: 40 }} />
            <p style={bodyStyle(30, { color: safeSubtext(effectiveMode), maxWidth: 1200, textShadow: textShadow(effectiveMode) })}>{slide.body}</p>
          </div>
          {footer}
        </div>
      );
    }

    case 'services': {
      const { background, mode, decorBg } = getSlideBg('services');
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      const items = slide.bullets || [];
      const useWideLayout = items.length <= 3;
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.18} />}
          {decorBg}
          <div style={{ padding: '90px 140px', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
            <h2 style={titleStyle(72, { color: safeText(effectiveMode), marginBottom: 16, textShadow: textShadow(effectiveMode) })}>{slide.title}</h2>
            <div style={{ width: 80, height: 5, background: hasPhoto ? 'rgba(255,255,255,0.4)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.3)'), borderRadius: 3, marginBottom: 50 }} />
            {slide.subtitle && <p style={{ fontSize: 26, color: safeMuted(effectiveMode), marginBottom: 40, maxWidth: 900, textShadow: textShadow(effectiveMode) }}>{slide.subtitle}</p>}
            <div style={{
              display: 'grid',
              gridTemplateColumns: useWideLayout ? `repeat(${items.length}, 1fr)` : '1fr 1fr',
              gap: useWideLayout ? 50 : 28,
              flex: 1, alignContent: 'start',
            }}>
              {items.map((b, i) => (
                <div key={i} style={{
                  padding: useWideLayout ? '44px 36px' : '30px 36px',
                  ...getCardStyle(hasPhoto ? 'dark' : effectiveMode),
                  display: 'flex', flexDirection: useWideLayout ? 'column' : 'row',
                  alignItems: useWideLayout ? 'center' : 'center',
                  gap: useWideLayout ? 20 : 24,
                  textAlign: useWideLayout ? 'center' : 'right',
                }}>
                  <div style={{
                    width: useWideLayout ? 64 : 56, height: useWideLayout ? 64 : 56, borderRadius: useWideLayout ? 20 : 16, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: useWideLayout ? 28 : 24, fontWeight: 800,
                    ...getNumberBadge(hasPhoto ? 'dark' : effectiveMode),
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <span style={{ fontSize: useWideLayout ? 28 : 26, color: safeSubtext(effectiveMode), fontWeight: 600, lineHeight: 1.5, wordBreak: 'keep-all', textShadow: textShadow(effectiveMode) }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          {footer}
        </div>
      );
    }

    case 'value_prop': {
      const { background, mode, decorBg } = getSlideBg('value_prop');
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      const items = slide.bullets || [];
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.2} />}
          {decorBg}
          <div style={{ position: 'relative', padding: '100px 150px', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
            <h2 style={titleStyle(72, {
              color: safeText(effectiveMode), marginBottom: 16, textShadow: textShadow(effectiveMode),
            })}>{slide.title}</h2>
            <div style={{ width: 80, height: 5, background: hasPhoto ? 'rgba(255,255,255,0.4)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.3)'), borderRadius: 3, marginBottom: 50 }} />
            {slide.body && <p style={{ fontSize: 28, lineHeight: 1.8, color: safeSubtext(effectiveMode), marginBottom: 40, maxWidth: 1100, textShadow: textShadow(effectiveMode) }}>{slide.body}</p>}
            <div style={{ display: 'flex', gap: 40, flex: 1, alignItems: 'flex-start' }}>
              {items.map((b, i) => (
                <div key={i} style={{
                  flex: 1, padding: '36px 28px', textAlign: 'center',
                  ...getCardStyle(hasPhoto ? 'dark' : effectiveMode),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: hasPhoto ? 'rgba(255,255,255,0.15)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(135deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.15)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 900, color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}>{String(i + 1).padStart(2, '0')}</div>
                  <span style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.5, color: safeSubtext(effectiveMode), wordBreak: 'keep-all', textShadow: textShadow(effectiveMode) }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          {footer}
        </div>
      );
    }

    case 'stats': {
      const { background, mode, decorBg } = getSlideBg('stats');
      const bg = mode;
      return (
        <div style={{ ...base, background }}>
          {photo && <DarkPhotoBg url={photo} opacity={0.2} />}
          {decorBg}
          <div style={{ position: 'relative', padding: '100px 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={titleStyle(60, { color: '#fff', marginBottom: 10, textShadow: '0 2px 20px rgba(0,0,0,0.4)' })}>{slide.title}</h2>
            {slide.subtitle && <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.8)', marginBottom: 60, textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}>{slide.subtitle}</p>}
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 50, padding: '0 140px', marginTop: -20 }}>
            {(slide.stats || []).map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '50px 30px', borderRadius: 24,
                background: isCreative ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
                flex: 1, maxWidth: 400, overflow: 'hidden',
                border: isCreative ? '2px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.15)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  fontSize: 64, fontWeight: 900, lineHeight: 1, marginBottom: 16,
                  color: '#fff', textShadow: '0 2px 15px rgba(0,0,0,0.3)',
                  wordBreak: 'keep-all', whiteSpace: 'nowrap',
                }}>{s.value}</div>
                <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.75)', fontWeight: 500, wordBreak: 'keep-all' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {footer}
        </div>
      );
    }

    case 'process':
    case 'methodology': {
      const { background, mode, decorBg } = getSlideBg(slide.type);
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.18} />}
          {decorBg}
          <div style={{ padding: '100px 150px 100px 120px', position: 'relative', zIndex: 2 }}>
            <h2 style={titleStyle(60, { color: safeText(effectiveMode), marginBottom: 20, textShadow: textShadow(effectiveMode) })}>{slide.title}</h2>
            <div style={{ width: 60, height: 5, background: hasPhoto ? 'rgba(255,255,255,0.4)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.3)'), borderRadius: 3, marginBottom: 60 }} />
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
              {(slide.steps || []).map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  {i < (slide.steps?.length || 0) - 1 && (
                    <div style={{
                      position: 'absolute', top: 35, left: -20, width: 40, height: 3,
                      background: 'rgba(255,255,255,0.2)',
                    }} />
                  )}
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 900, margin: '0 auto 24px',
                    ...getNumberBadge(hasPhoto ? 'dark' : effectiveMode),
                  }}>
                    {s.number}
                  </div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: safeText(effectiveMode), marginBottom: 12, textShadow: textShadow(effectiveMode) }}>{s.title}</h3>
                  <p style={{ fontSize: 20, color: safeSubtext(effectiveMode), lineHeight: 1.6, maxWidth: 300, margin: '0 auto', textShadow: textShadow(effectiveMode) }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {footer}
        </div>
      );
    }

    case 'testimonial': {
      const { background, mode, decorBg } = getSlideBg('testimonial');
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.2} />}
          {decorBg}
          <div style={{
            position: 'absolute', top: 80, right: 120, fontSize: 300, fontWeight: 900, lineHeight: 1, zIndex: 1,
            color: hasPhoto ? 'rgba(255,255,255,0.08)' : (isCreative ? hexToRgba(brandColor, 0.12) : isMinimal ? hexToRgba(brandColor, 0.06) : hexToRgba(brandColor, 0.15)),
          }}>״</div>
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 180px', maxWidth: 1400, zIndex: 2 }}>
            <p style={{
              fontSize: 42, lineHeight: 1.7, fontWeight: 500, fontStyle: 'italic', marginBottom: 50,
              color: safeText(effectiveMode), textShadow: textShadow(effectiveMode),
            }}>
              {slide.body}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 50, height: 4, background: hasPhoto ? 'rgba(255,255,255,0.5)' : (isCreative ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)` : brandColor), borderRadius: 2 }} />
              <span style={{ fontSize: 24, color: hasPhoto ? 'rgba(255,255,255,0.8)' : brandColor, fontWeight: 700, textShadow: textShadow(effectiveMode) }}>{slide.subtitle}</span>
            </div>
          </div>
          {footer}
        </div>
      );
    }

    case 'cta': {
      const { background, mode, decorBg } = getSlideBg('cta');
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.3} />}
          {decorBg}
          <div style={{
            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '100px 200px', zIndex: 2,
          }}>
            <h2 style={{
              fontSize: 80, fontWeight: 900, lineHeight: 1.1, marginBottom: 30,
              color: safeText(effectiveMode), textShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}>{slide.title}</h2>
            {slide.body && <p style={{
              fontSize: 32, maxWidth: 1000, lineHeight: 1.6,
              color: safeSubtext(effectiveMode), textShadow: textShadow(effectiveMode),
            }}>{slide.body}</p>}
            <div style={{
              marginTop: 50, padding: '20px 60px', borderRadius: 16,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>צרו קשר עוד היום</span>
            </div>
            {phone && (
              <div style={{
                marginTop: 30, fontSize: 38, fontWeight: 700, direction: 'ltr',
                color: safeText(effectiveMode), textShadow: '0 2px 15px rgba(0,0,0,0.4)', letterSpacing: 2,
              }}>{phone}</div>
            )}
          </div>
          {footer}
        </div>
      );
    }

    case 'contact': {
      const { background, mode, decorBg } = getSlideBg('contact');
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.22} />}
          {decorBg}
          <div style={{
            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 100, zIndex: 2,
          }}>
            {logoUrl && (
              <div style={{
                width: 120, height: 120, borderRadius: 24,
                background: hasPhoto ? 'rgba(255,255,255,0.1)' : (isCreative ? hexToRgba(brandColor, 0.08) : isMinimal ? '#f5f5f5' : 'rgba(255,255,255,0.1)'),
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, marginBottom: 40,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <img src={logoUrl} alt="logo" style={{
                  maxHeight: 80, maxWidth: 80, objectFit: 'contain',
                  filter: (hasPhoto || isDark) ? 'brightness(0) invert(1)' : 'none',
                }} />
              </div>
            )}
            <h2 style={{
              fontSize: 80, fontWeight: 900, marginBottom: 20,
              color: safeText(effectiveMode), textShadow: textShadow(effectiveMode),
            }}>{slide.title}</h2>
            {slide.body && <p style={{
              fontSize: 28, marginBottom: 50,
              color: safeSubtext(effectiveMode), textShadow: textShadow(effectiveMode),
            }}>{slide.body}</p>}
            <div style={{ display: 'flex', gap: 80, marginBottom: 40 }}>
              {phone && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    background: hasPhoto ? 'rgba(255,255,255,0.12)' : hexToRgba(brandColor, isMinimal ? 0.1 : 0.25),
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 30,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>📞</div>
                  <div style={{ fontSize: 18, color: hasPhoto ? 'rgba(255,255,255,0.7)' : brandColor, marginBottom: 8, fontWeight: 600 }}>טלפון</div>
                  <div style={{ fontSize: 32, fontWeight: 700, direction: 'ltr', color: safeText(effectiveMode), textShadow: textShadow(effectiveMode) }}>{phone}</div>
                </div>
              )}
              {email && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    background: hasPhoto ? 'rgba(255,255,255,0.12)' : hexToRgba(brandColor, isMinimal ? 0.1 : 0.25),
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 30,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>✉️</div>
                  <div style={{ fontSize: 18, color: hasPhoto ? 'rgba(255,255,255,0.7)' : brandColor, marginBottom: 8, fontWeight: 600 }}>אימייל</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: safeText(effectiveMode), textShadow: textShadow(effectiveMode) }}>{email}</div>
                </div>
              )}
              {address && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    background: hasPhoto ? 'rgba(255,255,255,0.12)' : hexToRgba(brandColor, isMinimal ? 0.1 : 0.25),
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 30,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>📍</div>
                  <div style={{ fontSize: 18, color: hasPhoto ? 'rgba(255,255,255,0.7)' : brandColor, marginBottom: 8, fontWeight: 600 }}>כתובת</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: safeText(effectiveMode), textShadow: textShadow(effectiveMode) }}>{address}</div>
                </div>
              )}
            </div>
          </div>
          {footer}
        </div>
      );
    }

    case 'vision': {
      const { background, mode, decorBg } = getSlideBg('vision');
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.22} />}
          {decorBg}
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 180px', zIndex: 2 }}>
            <h2 style={titleStyle(72, { color: safeText(effectiveMode), marginBottom: 20, textShadow: textShadow(effectiveMode) })}>{slide.title}</h2>
            <div style={{ width: 60, height: 5, background: hasPhoto ? 'rgba(255,255,255,0.4)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.3)'), borderRadius: 3, marginBottom: 30 }} />
            {slide.body && <p style={{ fontSize: 32, lineHeight: 1.9, color: safeSubtext(effectiveMode), maxWidth: 1300, textShadow: textShadow(effectiveMode) }}>{slide.body}</p>}
            {slide.bullets && (
              <div style={{ display: 'flex', gap: 40, marginTop: 50 }}>
                {slide.bullets.map((b, i) => (
                  <div key={i} style={{
                    flex: 1, padding: '30px 28px', textAlign: 'center',
                    ...getCardStyle(hasPhoto ? 'dark' : effectiveMode),
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{['🎯', '💡', '🏆', '⭐'][i % 4]}</div>
                    <span style={{ fontSize: 24, fontWeight: 600, color: safeSubtext(effectiveMode), textShadow: textShadow(effectiveMode) }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {footer}
        </div>
      );
    }

    case 'social_proof': {
      const { background, mode, decorBg } = getSlideBg('social_proof');
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      const items = slide.bullets || [];
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.18} />}
          {decorBg}
          <div style={{ padding: '90px 140px', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
            <h2 style={titleStyle(72, { color: safeText(effectiveMode), marginBottom: 16, textShadow: textShadow(effectiveMode) })}>{slide.title}</h2>
            <div style={{ width: 80, height: 5, background: hasPhoto ? 'rgba(255,255,255,0.4)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.3)'), borderRadius: 3, marginBottom: 50 }} />
            <div style={{ display: 'flex', gap: 32, flex: 1, alignItems: 'stretch' }}>
              {items.map((b, i) => (
                <div key={i} style={{
                  flex: 1, padding: '36px 28px',
                  ...getCardStyle(hasPhoto ? 'dark' : effectiveMode),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', gap: 20,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: hasPhoto ? 'rgba(255,255,255,0.15)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(135deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.2)'),
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, fontWeight: 900, flexShrink: 0,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}>✓</div>
                  <span style={{ fontSize: 24, color: safeSubtext(effectiveMode), fontWeight: 600, lineHeight: 1.5, textShadow: textShadow(effectiveMode) }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          {footer}
        </div>
      );
    }

    case 'target_audience': {
      const { background, mode, decorBg } = getSlideBg('target_audience');
      const hasPhoto = !!photo;
      const effectiveMode = hasPhoto ? 'dark' : mode;
      const items = slide.bullets || [];
      return (
        <div style={{ ...base, background: hasPhoto ? '#0a0a1a' : background }}>
          {hasPhoto && <DarkPhotoBg url={photo!} opacity={0.22} />}
          {decorBg}
          <div style={{ position: 'relative', padding: '100px 160px', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
            <h2 style={titleStyle(72, { color: safeText(effectiveMode), marginBottom: 16, textShadow: textShadow(effectiveMode) })}>{slide.title}</h2>
            <div style={{ width: 80, height: 5, background: hasPhoto ? 'rgba(255,255,255,0.4)' : (isCreative && effectiveMode === 'light' ? `linear-gradient(90deg, ${brandColor}, #ff6b6b)` : isMinimal ? brandColor : 'rgba(255,255,255,0.3)'), borderRadius: 3, marginBottom: 40 }} />
            {slide.body && <p style={{ fontSize: 28, lineHeight: 1.8, color: safeSubtext(effectiveMode), marginBottom: 40, maxWidth: 1000, textShadow: textShadow(effectiveMode) }}>{slide.body}</p>}
            <div style={{ display: 'flex', gap: 36, flex: 1, alignItems: 'stretch' }}>
              {items.map((b, i) => (
                <div key={i} style={{
                  flex: 1, padding: '40px 28px',
                  ...getCardStyle(hasPhoto ? 'dark' : effectiveMode),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 18,
                    background: hasPhoto ? 'rgba(255,255,255,0.12)' : (isCreative ? `linear-gradient(135deg, ${hexToRgba(brandColor, 0.15)}, ${hexToRgba('#ffd93d', 0.1)})` : hexToRgba(brandColor, isMinimal ? 0.1 : 0.25)),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
                    border: hasPhoto ? '1px solid rgba(255,255,255,0.1)' : (isCreative ? `1px solid ${hexToRgba(brandColor, 0.2)}` : undefined),
                  }}>👤</div>
                  <span style={{ fontSize: 26, fontWeight: 600, color: safeSubtext(effectiveMode), lineHeight: 1.5, textShadow: textShadow(effectiveMode) }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          {footer}
        </div>
      );
    }

    default: {
      return (
        <div style={{ ...base, background: '#fff' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 32 }}>
            שקופית ריקה
          </div>
          {footer}
        </div>
      );
    }
  }

  // Note: imageLoading shimmer is handled outside SlideRenderer
};

// ── Theme Selector ──
const THEMES: { id: PresentationTheme; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'minimal', label: 'מינימלי', desc: 'נקי, אלגנטי, הרבה חלל לבן', icon: <Palette className="w-6 h-6" /> },
  { id: 'corporate', label: 'תאגידי', desc: 'מקצועי, רציני, עם עומק', icon: <Building2 className="w-6 h-6" /> },
  { id: 'creative', label: 'יצירתי', desc: 'נועז, צבעוני, סוחף', icon: <Zap className="w-6 h-6" /> },
];

// ── Build brief from profile ──
const buildBriefFromProfile = (profile: any): string => {
  const parts: string[] = [];
  
  if (profile.business_name) parts.push(`שם העסק: ${profile.business_name}.`);
  
  if (profile.services?.length > 0) {
    parts.push(`השירותים העיקריים שלנו: ${profile.services.join(', ')}.`);
  }
  if (profile.x_factors?.length > 0) {
    parts.push(`היתרונות שלנו: ${profile.x_factors.join(', ')}.`);
  }
  if (profile.primary_x_factor) {
    parts.push(`היתרון המרכזי: ${profile.primary_x_factor}.`);
  }
  if (profile.winning_feature) {
    parts.push(`מה מייחד אותנו: ${profile.winning_feature}.`);
  }
  if (profile.target_audience) {
    parts.push(`קהל היעד שלנו: ${profile.target_audience}.`);
  }
  if (profile.quality_signatures && Array.isArray(profile.quality_signatures) && profile.quality_signatures.length > 0) {
    const sigs = profile.quality_signatures.map((s: any) => typeof s === 'string' ? s : s?.type || '').filter(Boolean);
    if (sigs.length > 0) parts.push(`הישגים ונכסי אמון: ${sigs.join(', ')}.`);
  }
  if (profile.successful_campaigns?.length > 0) {
    parts.push(`קמפיינים מוצלחים: ${profile.successful_campaigns.join(', ')}.`);
  }
  if (profile.competitors?.length > 0) {
    parts.push(`מתחרים: ${profile.competitors.join(', ')}.`);
  }
  if (profile.brand_presence) {
    parts.push(`נוכחות מותג: ${profile.brand_presence}.`);
  }
  if (profile.contact_phone || profile.contact_email || profile.website_url) {
    const contact: string[] = [];
    if (profile.contact_phone) contact.push(`טלפון: ${profile.contact_phone}`);
    if (profile.contact_email) contact.push(`אימייל: ${profile.contact_email}`);
    if (profile.website_url) contact.push(`אתר: ${profile.website_url}`);
    parts.push(`פרטי קשר: ${contact.join(', ')}.`);
  }
  
  if (parts.length === 0) return '';
  return `מצגת תדמית מקצועית לעסק.\n${parts.join('\n')}`;
};

// ── Brief Screen ──
const BriefScreen = ({
  onGenerate, businessName, isLoading, profile, generationProgress,
}: {
  onGenerate: (brief: string, count: number, theme: PresentationTheme) => void;
  businessName: string;
  isLoading: boolean;
  profile: any;
  generationProgress?: { phase: string; current: number; total: number } | null;
}) => {
  const profileBrief = profile ? buildBriefFromProfile(profile) : '';
  const hasProfileData = profileBrief.length > 30;
  
  const [brief, setBrief] = useState(hasProfileData ? '' : '');
  const [slideCount, setSlideCount] = useState(7);
  const [theme, setTheme] = useState<PresentationTheme>('corporate');

  // Always use profile data when available, user just adds notes
  const effectiveBrief = hasProfileData
    ? (profileBrief + (brief ? `\n\nדגשים נוספים: ${brief}` : ''))
    : brief;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-foreground">יצירת מצגת עם AI</h1>
          <p className="text-muted-foreground text-lg">
            {hasProfileData
              ? 'המערכת כבר מכירה את העסק שלך — בחר סגנון ולחץ צור!'
              : 'ספר לנו על העסק שלך ואנחנו ניצור מצגת מקצועית תוך שניות'}
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-6 space-y-5">
            {/* Theme selector - visual cards */}
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

            {/* Profile data notice */}
            {hasProfileData && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">המצגת תיבנה מתיק הלקוח שלך</p>
                  <p className="text-xs text-muted-foreground mt-0.5">שירותים, יתרונות, קהל יעד ופרטי קשר — הכל כבר במערכת ✓</p>
                </div>
              </div>
            )}

            {/* Brief input */}
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">
                {hasProfileData ? 'רוצה להוסיף דגש? (אופציונלי)' : 'על מה המצגת? *'}
              </label>
              <Textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder={hasProfileData
                  ? 'למשל: "תדגיש את השירות החדש שלנו" או "המצגת היא לפגישה עם משקיעים"...'
                  : `ספר בכמה מילים מה העסק שלך עושה, מה היתרונות ולמי המצגת מיועדת...`
                }
                rows={hasProfileData ? 2 : 4}
                className="text-base"
                dir="rtl"
              />
            </div>

            {/* Slide count */}
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
              className="w-full h-14 text-lg gap-2 font-bold"
              onClick={() => onGenerate(effectiveBrief, slideCount, theme)}
              disabled={(!hasProfileData && !brief.trim()) || isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />
                  {generationProgress?.phase === 'images' 
                    ? `מייצר תמונות... ${generationProgress.current}/${generationProgress.total}`
                    : 'בונה את השקפים...'
                  }
                </>
              ) : (
                <><Wand2 className="w-5 h-5" />צור מצגת ✨</>
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
  const [imagesGenerating, setImagesGenerating] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<{ phase: string; current: number; total: number } | null>(null);

  const brandColor = profile?.primary_color || '#E34870';
  const secColor = profile?.secondary_color || '#1a1a2e';
  const businessName = profile?.business_name || 'שם העסק';
  const logoUrl = profile?.logo_url || undefined;
  const phone = profile?.contact_phone || '';
  const email = profile?.contact_email || '';
  const address = profile?.contact_address || '';
  const font = profile?.header_font || 'Heebo';

  // Extract business photos URLs
  const businessPhotos: string[] = (() => {
    if (!profile?.business_photos) return [];
    const photos = profile.business_photos as any;
    if (Array.isArray(photos)) {
      return photos.map((p: any) => typeof p === 'string' ? p : p?.url || p?.image_url || '').filter(Boolean);
    }
    return [];
  })();

  // Generate AI image for a single slide
  const generateSlideImage = useCallback(async (slideIndex: number, imagePrompt: string, slidesRef: SlideData[]) => {
    try {
      setImagesGenerating(prev => prev + 1);
      const { data, error } = await supabase.functions.invoke('generate-slide-image', {
        body: { prompt: imagePrompt, brandColor, industry: profile?.services?.join(', ') || '' },
      });
      if (error || data?.error) {
        console.warn(`Image generation failed for slide ${slideIndex}:`, error || data?.error);
        return;
      }
      if (data?.imageUrl) {
        setSlides(prev => prev?.map((s, i) => i === slideIndex ? { ...s, imageUrl: data.imageUrl, imageLoading: false } : s) || null);
      }
    } catch (err) {
      console.warn(`Image gen error slide ${slideIndex}:`, err);
    } finally {
      setImagesGenerating(prev => prev - 1);
    }
  }, [brandColor]);

  const handleGenerate = async (brief: string, slideCount: number, theme: PresentationTheme) => {
    setIsGenerating(true);
    setCurrentTheme(theme);
    try {
      const profileData = profile ? {
        businessName: profile.business_name,
        phone: profile.contact_phone, email: profile.contact_email,
        address: profile.contact_address, website: profile.website_url,
        xFactors: profile.x_factors, targetAudience: profile.target_audience,
        winningFeature: profile.winning_feature, primaryXFactor: profile.primary_x_factor,
        qualitySignatures: profile.quality_signatures as string[] | undefined,
        successfulCampaigns: profile.successful_campaigns,
        facebook: profile.social_facebook, instagram: profile.social_instagram,
        linkedin: profile.social_linkedin, tiktok: profile.social_tiktok,
        youtube: profile.contact_youtube, openingHours: profile.opening_hours,
        branches: profile.branches, services: profile.services, industry: '',
      } : undefined;

      setGenerationProgress({ phase: 'text', current: 0, total: 1 });

      const { data, error } = await supabase.functions.invoke('generate-presentation', {
        body: { brief, businessName, industry: '', slideCount, theme, profileData },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const generatedSlides: SlideData[] = (data.slides || []).map((s: any, i: number) => ({
        ...s, id: `${Date.now()}-${i}`, imageLoading: !!s.image_prompt,
      }));

      // Generate ALL images before showing slides to user
      const slidesWithPrompts = generatedSlides
        .map((slide, i) => ({ index: i, prompt: slide.image_prompt }))
        .filter(s => s.prompt);
      
      const totalImages = slidesWithPrompts.length;
      let completedImages = 0;
      setGenerationProgress({ phase: 'images', current: 0, total: totalImages });

      const batchSize = 2;
      for (let b = 0; b < slidesWithPrompts.length; b += batchSize) {
        const batch = slidesWithPrompts.slice(b, b + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (s) => {
            try {
              const { data: imgData, error: imgError } = await supabase.functions.invoke('generate-slide-image', {
                body: { prompt: s.prompt, brandColor, industry: profile?.services?.join(', ') || '' },
              });
              if (!imgError && imgData?.imageUrl) {
                generatedSlides[s.index] = { ...generatedSlides[s.index], imageUrl: imgData.imageUrl, imageLoading: false };
              } else {
                generatedSlides[s.index] = { ...generatedSlides[s.index], imageLoading: false };
              }
            } catch {
              generatedSlides[s.index] = { ...generatedSlides[s.index], imageLoading: false };
            } finally {
              completedImages++;
              setGenerationProgress({ phase: 'images', current: completedImages, total: totalImages });
            }
          })
        );
      }

      // Now show everything at once
      setSlides([...generatedSlides]);
      setActiveSlide(0);
      setGenerationProgress(null);
      toast.success(`המצגת מוכנה! ${generatedSlides.length} שקופיות נוצרו בהצלחה`);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה ביצירת המצגת. נסה שוב.');
      setGenerationProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Global keyboard navigation for presentation mode
  useEffect(() => {
    if (!isPresenting) return;
    const handlePresentationKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPresenting(false);
      if (e.key === 'ArrowLeft' || e.key === ' ') setActiveSlide(prev => Math.min(prev + 1, (slides?.length || 1) - 1));
      if (e.key === 'ArrowRight') setActiveSlide(prev => Math.max(prev - 1, 0));
    };
    window.addEventListener('keydown', handlePresentationKeyDown);
    return () => window.removeEventListener('keydown', handlePresentationKeyDown);
  }, [isPresenting, slides?.length]);

  if (!slides) {
    return (
      <>
        <TopNavbar />
        <BriefScreen onGenerate={handleGenerate} businessName={businessName} isLoading={isGenerating} profile={profile} generationProgress={generationProgress} />
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
          <SlideRenderer slide={slides[i]} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={1} font={font} theme={currentTheme} businessPhotos={businessPhotos} slideIndex={i} address={address} />
        );
        await new Promise(r => setTimeout(r, 800));
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
      >
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
          <SlideRenderer slide={slides[activeSlide]} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={Math.min(window.innerWidth / 1920, window.innerHeight / 1080)} font={font} theme={currentTheme} businessPhotos={businessPhotos} slideIndex={activeSlide} address={address} />
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
                <SlideRenderer slide={slide} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={0.09} font={font} theme={currentTheme} businessPhotos={businessPhotos} slideIndex={i} address={address} />
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
              {businessPhotos.length > 0 && (
                <Badge variant="outline" className="text-xs">📷 {businessPhotos.length} תמונות</Badge>
              )}
              {imagesGenerating > 0 && (
                <Badge variant="secondary" className="text-xs gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  מייצר {imagesGenerating} תמונות...
                </Badge>
              )}
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

          <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 overflow-hidden relative group">
            {/* Floating nav arrows */}
            {activeSlide > 0 && (
              <button
                onClick={() => setActiveSlide(prev => prev - 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            {activeSlide < slides.length - 1 && (
              <button
                onClick={() => setActiveSlide(prev => prev + 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative shadow-2xl rounded-lg overflow-hidden" style={{ width: 'min(100%, 960px)', aspectRatio: '16/9' }}>
              <SlideRenderer slide={currentSlide} brandColor={brandColor} secColor={secColor} businessName={businessName} logoUrl={logoUrl} phone={phone} email={email} scale={0.5} font={font} theme={currentTheme} businessPhotos={businessPhotos} slideIndex={activeSlide} address={address} />
              {currentSlide.imageLoading && !currentSlide.imageUrl && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span className="text-white text-sm font-medium">מייצר תמונה...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom slide counter */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/80 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {activeSlide + 1} / {slides.length}
            </div>
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

            {(currentSlide.type === 'services' || currentSlide.type === 'value_prop' || currentSlide.type === 'social_proof' || currentSlide.type === 'target_audience' || currentSlide.type === 'vision') && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">פריטים</label>
                {(currentSlide.bullets || []).map((b, i) => (
                  <div key={i} className="flex gap-1 mb-1">
                    <Input value={b} onChange={e => {
                      const newBullets = [...(currentSlide.bullets || [])];
                      newBullets[i] = e.target.value;
                      updateSlide(activeSlide, { bullets: newBullets });
                    }} className="text-xs" dir="rtl" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                      const newBullets = (currentSlide.bullets || []).filter((_, j) => j !== i);
                      updateSlide(activeSlide, { bullets: newBullets });
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-1 text-xs" onClick={() => {
                  updateSlide(activeSlide, { bullets: [...(currentSlide.bullets || []), 'פריט חדש'] });
                }}><Plus className="w-3 h-3 ml-1" />הוסף</Button>
              </div>
            )}

            {currentSlide.type === 'stats' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">נתונים</label>
                {(currentSlide.stats || []).map((s, i) => (
                  <div key={i} className="flex gap-1 mb-1">
                    <Input value={s.value} onChange={e => {
                      const stats = [...(currentSlide.stats || [])];
                      stats[i] = { ...stats[i], value: e.target.value };
                      updateSlide(activeSlide, { stats });
                    }} className="text-xs w-20" placeholder="ערך" dir="rtl" />
                    <Input value={s.label} onChange={e => {
                      const stats = [...(currentSlide.stats || [])];
                      stats[i] = { ...stats[i], label: e.target.value };
                      updateSlide(activeSlide, { stats });
                    }} className="text-xs" placeholder="תווית" dir="rtl" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                      updateSlide(activeSlide, { stats: (currentSlide.stats || []).filter((_, j) => j !== i) });
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-1 text-xs" onClick={() => {
                  updateSlide(activeSlide, { stats: [...(currentSlide.stats || []), { value: '0', label: 'חדש' }] });
                }}><Plus className="w-3 h-3 ml-1" />הוסף</Button>
              </div>
            )}

            {(currentSlide.type === 'process' || currentSlide.type === 'methodology') && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">שלבים</label>
                {(currentSlide.steps || []).map((s, i) => (
                  <div key={i} className="border border-border rounded p-2 mb-2 space-y-1">
                    <div className="flex gap-1">
                      <Input value={s.number} onChange={e => {
                        const steps = [...(currentSlide.steps || [])];
                        steps[i] = { ...steps[i], number: e.target.value };
                        updateSlide(activeSlide, { steps });
                      }} className="text-xs w-12" dir="ltr" />
                      <Input value={s.title} onChange={e => {
                        const steps = [...(currentSlide.steps || [])];
                        steps[i] = { ...steps[i], title: e.target.value };
                        updateSlide(activeSlide, { steps });
                      }} className="text-xs" dir="rtl" />
                    </div>
                    <Input value={s.desc} onChange={e => {
                      const steps = [...(currentSlide.steps || [])];
                      steps[i] = { ...steps[i], desc: e.target.value };
                      updateSlide(activeSlide, { steps });
                    }} className="text-xs" placeholder="תיאור" dir="rtl" />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                  const n = String((currentSlide.steps?.length || 0) + 1).padStart(2, '0');
                  updateSlide(activeSlide, { steps: [...(currentSlide.steps || []), { number: n, title: 'שלב', desc: 'תיאור' }] });
                }}><Plus className="w-3 h-3 ml-1" />הוסף שלב</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationStudio;

