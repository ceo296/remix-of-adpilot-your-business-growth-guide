import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, Download, RotateCcw, Eye, FileText, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CardData {
  businessName: string;
  title: string;
  personName: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  website: string;
}

const BusinessCardStudio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile } = useClientProfile();

  const template = searchParams.get('template') || 'bc-classic';
  const contactFieldsParam = searchParams.get('contactFields') || 'phone,email,address';
  const sidesParam = searchParams.get('sides') || '2';
  const cardSizeParam = searchParams.get('size') || '90x50';
  const activeContactFields = contactFieldsParam.split(',');
  const [isDoubleSided, setIsDoubleSided] = useState(sidesParam === '2');
  const [viewingSide, setViewingSide] = useState<'front' | 'back'>('front');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [isRevising, setIsRevising] = useState(false);

  const color = profile?.primary_color || '#E34870';
  const secColor = profile?.secondary_color || '#2A2F33';
  const logoUrl = profile?.logo_url || '';

  const [cardData, setCardData] = useState<CardData>({
    businessName: profile?.business_name || '',
    title: '',
    personName: '',
    phone: profile?.contact_phone || '',
    email: profile?.contact_email || '',
    address: profile?.contact_address || '',
    whatsapp: profile?.contact_whatsapp || '',
    website: profile?.website_url || '',
  });

  // Sync profile data when it loads asynchronously
  useEffect(() => {
    if (profile) {
      setCardData(prev => ({
        ...prev,
        businessName: prev.businessName || profile.business_name || '',
        phone: prev.phone || profile.contact_phone || '',
        email: prev.email || profile.contact_email || '',
        address: prev.address || profile.contact_address || '',
        whatsapp: prev.whatsapp || profile.contact_whatsapp || '',
        website: prev.website || profile.website_url || '',
      }));
    }
  }, [profile]);

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const updateField = (field: keyof CardData, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = useCallback(async () => {
    try {
      if (frontRef.current) {
        const frontPng = await toPng(frontRef.current, { pixelRatio: 4, width: 900, height: 500 });
        const linkF = document.createElement('a');
        linkF.download = `business-card-front-${Date.now()}.png`;
        linkF.href = frontPng;
        linkF.click();
      }
      if (isDoubleSided && backRef.current) {
        const backPng = await toPng(backRef.current, { pixelRatio: 4, width: 900, height: 500 });
        const linkB = document.createElement('a');
        linkB.download = `business-card-back-${Date.now()}.png`;
        linkB.href = backPng;
        linkB.click();
      }
      toast.success('הכרטיס יוצא בהצלחה!');
    } catch (err) {
      toast.error('שגיאה בייצוא');
    }
  }, [isDoubleSided]);

  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      const [cardW, cardH] = cardSizeParam === '85x55' ? [85, 55] : [90, 50];
      const bleed = 3;
      const cropLen = 5;
      const margin = 15;
      const totalW = cardW + bleed * 2;
      const totalH = cardH + bleed * 2;
      const pageW = totalW + margin * 2;
      const pageH = totalH + margin * 2;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pageW, pageH] });

      const drawCropMarks = (x: number, y: number, w: number, h: number) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.line(x, y - cropLen, x, y); doc.line(x - cropLen, y, x, y);
        doc.line(x + w, y - cropLen, x + w, y); doc.line(x + w, y, x + w + cropLen, y);
        doc.line(x, y + h, x, y + h + cropLen); doc.line(x - cropLen, y + h, x, y + h);
        doc.line(x + w, y + h, x + w, y + h + cropLen); doc.line(x + w, y + h, x + w + cropLen, y + h);
      };

      const addCardPage = async (ref: React.RefObject<HTMLDivElement | null>, label: string) => {
        if (!ref.current) return;
        const png = await toPng(ref.current, { pixelRatio: 6, width: 900, height: 500 });
        const x = margin;
        const y = margin;
        doc.setDrawColor(200);
        doc.setLineWidth(0.05);
        doc.rect(x, y, totalW, totalH);
        doc.addImage(png, 'PNG', x, y, totalW, totalH);
        const trimX = x + bleed;
        const trimY = y + bleed;
        drawCropMarks(trimX, trimY, cardW, cardH);
        doc.setFontSize(6);
        doc.setTextColor(150);
        doc.text(`${label} | ${cardW}×${cardH}mm | bleed ${bleed}mm`, pageW / 2, pageH - 3, { align: 'center' });
      };

      await addCardPage(frontRef, 'חזית');
      if (isDoubleSided && backRef.current) {
        doc.addPage([pageW, pageH], 'landscape');
        await addCardPage(backRef, 'גב');
      }

      doc.save(`business-card-print-${Date.now()}.pdf`);
      toast.success('PDF מוכן לדפוס יוצא בהצלחה!');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בייצוא PDF');
    } finally {
      setIsExporting(false);
    }
  }, [isDoubleSided, cardSizeParam]);

  const adjustColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };

  const hexToRgb = (hex: string) => {
    const num = parseInt(hex.replace('#', ''), 16);
    return { r: num >> 16, g: (num >> 8) & 0xFF, b: num & 0xFF };
  };

  const colorLight = adjustColor(color, 40);
  const colorDark = adjustColor(color, -30);
  const colorVeryDark = adjustColor(color, -60);
  const rgb = hexToRgb(color);

  const contactLine = (icon: string, value: string, textColor: string = '#444', iconBg: string = `${color}15`) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
      <span style={{ fontSize: '16px', width: '32px', height: '32px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '17px', color: textColor, fontWeight: 600, letterSpacing: '0.3px' }}>{value}</span>
    </div>
  );

  // SVG decorative patterns
  const dotPattern = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='${encodeURIComponent(color)}' opacity='0.08'/%3E%3C/svg%3E")`;
  const diagonalPattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0' stroke='${encodeURIComponent(color)}' stroke-width='0.5' opacity='0.06'/%3E%3C/svg%3E")`;

  const renderFront = () => {
    const style = template.replace('bc-', '');
    const isDark = style === 'premium' || style === 'bold';
    const font = profile?.header_font || 'Heebo, sans-serif';

    return (
      <div
        ref={frontRef}
        style={{
          width: '900px', height: '500px', direction: 'rtl', fontFamily: font,
          position: 'relative', overflow: 'hidden', borderRadius: '0px',
          background: isDark ? (style === 'premium' ? secColor : `linear-gradient(135deg, ${color} 0%, ${colorVeryDark} 100%)`) : '#fff',
        }}
      >
        {/* === CLASSIC / ELEGANT: Big colored header band === */}
        {(style === 'classic' || style === 'elegant') && (
          <>
            {/* Top color band - 45% of card */}
            <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: '45%', background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '20px 20px', opacity: 0.15 }} />
              {/* Decorative circle */}
              <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            </div>
            {/* Curved separator */}
            <svg style={{ position: 'absolute', top: '43%', left: 0, right: 0, width: '100%' }} viewBox="0 0 900 30" preserveAspectRatio="none">
              <path d={`M0 0 L900 0 L900 15 Q450 35 0 15 Z`} fill={colorDark} />
            </svg>
            {/* Bottom texture */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, height: '55%', backgroundImage: dotPattern, backgroundSize: '20px 20px' }} />
          </>
        )}

        {/* === MODERN: Side panel 42% with wave cutoff === */}
        {style === 'modern' && (
          <>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '42%', background: `linear-gradient(160deg, ${color} 0%, ${colorVeryDark} 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: diagonalPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '40px 40px', opacity: 0.15 }} />
              {/* Decorative rings */}
              <svg style={{ position: 'absolute', bottom: '20px', left: '20px', opacity: 0.12 }} width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="white" strokeWidth="2" fill="none" />
                <circle cx="60" cy="60" r="35" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="60" cy="60" r="20" stroke="white" strokeWidth="1" fill="none" />
              </svg>
            </div>
            {/* Wave separator */}
            <svg style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, height: '100%', width: '60px' }} viewBox="0 0 60 500" preserveAspectRatio="none">
              <path d={`M0 0 L20 0 Q60 125 20 250 Q-20 375 20 500 L0 500 Z`} fill={colorVeryDark} />
            </svg>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '42%', backgroundImage: dotPattern, backgroundSize: '20px 20px' }} />
          </>
        )}

        {/* === MINIMAL: Geometric accent === */}
        {style === 'minimal' && (
          <>
            {/* Bottom-left colored triangle area */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '250px', height: '250px', background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)`, clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '250px', height: '250px', backgroundImage: dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '20px 20px', opacity: 0.15, clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }} />
            {/* Top-right accent dot */}
            <div style={{ position: 'absolute', top: '30px', left: '30px', width: '10px', height: '10px', borderRadius: '50%', background: color }} />
            <div style={{ position: 'absolute', top: '30px', left: '50px', width: '6px', height: '6px', borderRadius: '50%', background: `${color}50` }} />
          </>
        )}

        {/* === PREMIUM: Dark luxury with gold-like accent === */}
        {style === 'premium' && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${secColor} 0%, ${adjustColor(secColor, -20)} 100%)` }} />
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 80% 20%, ${color}20 0%, transparent 50%)` }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: diagonalPattern.replace(encodeURIComponent(color), encodeURIComponent(color)), backgroundSize: '30px 30px', opacity: 0.4 }} />
            {/* Gold accent lines */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent 5%, ${color} 50%, transparent 95%)` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent 5%, ${color} 50%, transparent 95%)` }} />
            {/* Corner accent */}
            <svg style={{ position: 'absolute', top: '15px', right: '15px', opacity: 0.2 }} width="60" height="60" viewBox="0 0 60 60">
              <path d="M0 0 L60 0 L60 5 L5 5 L5 60 L0 60 Z" fill={color} />
            </svg>
            <svg style={{ position: 'absolute', bottom: '15px', left: '15px', opacity: 0.2 }} width="60" height="60" viewBox="0 0 60 60">
              <path d="M60 60 L0 60 L0 55 L55 55 L55 0 L60 0 Z" fill={color} />
            </svg>
          </>
        )}

        {/* === BOLD: Full color with dramatic geometric shapes === */}
        {style === 'bold' && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${color} 0%, ${colorVeryDark} 100%)` }} />
            <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', top: '30%', right: '15%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '24px 24px', opacity: 0.2 }} />
            {/* Accent stripe */}
            <div style={{ position: 'absolute', top: '20px', right: 0, width: '6px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '0 3px 3px 0' }} />
          </>
        )}

        {/* ========== CONTENT ========== */}
        <div style={{ position: 'relative', zIndex: 1, padding: '40px 50px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Top section — different layout per style */}
          {(style === 'classic' || style === 'elegant') ? (
            // Classic/Elegant: Name in the white header band area
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {logoUrl ? (
                <div style={{ width: '90px', height: '90px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <img src={logoUrl} alt="logo" style={{ maxHeight: '70px', maxWidth: '70px', objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }} />
                </div>
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '38px', fontWeight: 900, color: '#fff' }}>{cardData.businessName.charAt(0)}</span>
                </div>
              )}
              <div>
                {cardData.personName && (
                  <div style={{ fontSize: '22px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>
                    {cardData.personName}
                  </div>
                )}
                {cardData.title && (
                  <div style={{ display: 'inline-block', marginTop: '6px', padding: '4px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {cardData.title}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Other styles
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {/* Logo */}
              <div>
                {logoUrl ? (
                  <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: isDark ? 'rgba(255,255,255,0.1)' : `${color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : `0 4px 20px ${color}15` }}>
                    <img src={logoUrl} alt="logo" style={{ maxHeight: '76px', maxWidth: '76px', objectFit: 'contain', filter: isDark ? 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }} />
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: isDark ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px rgba(${rgb.r},${rgb.g},${rgb.b},0.3)` }}>
                    <span style={{ fontSize: '40px', fontWeight: 900, color: '#fff' }}>{cardData.businessName.charAt(0)}</span>
                  </div>
                )}
              </div>
              {/* Name & title */}
              <div style={{ textAlign: 'right' }}>
                {cardData.personName && (
                  <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1.1, color: isDark ? '#fff' : '#222' }}>
                    {cardData.personName}
                  </div>
                )}
                {cardData.title && (
                  <div style={{ display: 'inline-block', marginTop: '10px', padding: '5px 18px', borderRadius: '4px', fontSize: '15px', fontWeight: 700, background: isDark ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)` : `${color}15`, color: isDark ? '#fff' : color, border: isDark ? `1px solid rgba(${rgb.r},${rgb.g},${rgb.b},0.4)` : 'none' }}>
                    {cardData.title}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact info — BIGGER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeContactFields.includes('phone') && cardData.phone && contactLine('📞', cardData.phone, isDark ? 'rgba(255,255,255,0.9)' : '#444', isDark ? 'rgba(255,255,255,0.12)' : `${color}15`)}
            {activeContactFields.includes('email') && cardData.email && contactLine('✉', cardData.email, isDark ? 'rgba(255,255,255,0.9)' : '#444', isDark ? 'rgba(255,255,255,0.12)' : `${color}15`)}
            {activeContactFields.includes('address') && cardData.address && contactLine('📍', cardData.address, isDark ? 'rgba(255,255,255,0.9)' : '#444', isDark ? 'rgba(255,255,255,0.12)' : `${color}15`)}
            {activeContactFields.includes('whatsapp') && cardData.whatsapp && contactLine('💬', cardData.whatsapp, isDark ? 'rgba(255,255,255,0.9)' : '#444', isDark ? 'rgba(255,255,255,0.12)' : `${color}15`)}
            {activeContactFields.includes('website') && cardData.website && contactLine('🌐', cardData.website, isDark ? 'rgba(255,255,255,0.9)' : '#444', isDark ? 'rgba(255,255,255,0.12)' : `${color}15`)}
          </div>
        </div>
      </div>
    );
  };

  const renderBack = () => {
    const style = template.replace('bc-', '');
    const font = profile?.header_font || 'Heebo, sans-serif';

    const bgMain = (style === 'premium') ? secColor : color;
    const bgGrad = adjustColor(bgMain, -35);

    const backContactLine = (icon: string, value: string) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
        <span style={{ fontSize: '15px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{value}</span>
      </div>
    );

    return (
      <div
        ref={backRef}
        style={{
          width: '900px', height: '500px', direction: 'rtl', fontFamily: font,
          position: 'relative', overflow: 'hidden', borderRadius: '0px',
          background: `linear-gradient(150deg, ${bgMain} 0%, ${bgGrad} 100%)`,
        }}
      >
        {/* Radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)` }} />

        {/* Geometric shapes - MORE dramatic */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        {/* Pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '20px 20px', opacity: 0.1 }} />

        {/* Accent bars */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.15)' }} />

        {/* Corner accents */}
        <svg style={{ position: 'absolute', top: '12px', right: '12px', opacity: 0.15 }} width="50" height="50" viewBox="0 0 50 50">
          <path d="M0 0 L50 0 L50 4 L4 4 L4 50 L0 50 Z" fill="white" />
        </svg>
        <svg style={{ position: 'absolute', bottom: '12px', left: '12px', opacity: 0.15 }} width="50" height="50" viewBox="0 0 50 50">
          <path d="M50 50 L0 50 L0 46 L46 46 L46 0 L50 0 Z" fill="white" />
        </svg>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '44px 50px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Top: Logo + Business Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'flex-start' }}>
            {logoUrl ? (
              <div style={{ width: '90px', height: '90px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <img src={logoUrl} alt="logo" style={{ maxHeight: '66px', maxWidth: '66px', objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }} />
              </div>
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '40px', fontWeight: 900, color: '#fff' }}>{cardData.businessName.charAt(0)}</span>
              </div>
            )}
            <div>
              {cardData.personName && (
                <div style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>
                  {cardData.personName}{cardData.title ? ` • ${cardData.title}` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '60px', height: '2px', background: 'rgba(255,255,255,0.2)' }} />

          {/* Bottom: Contact details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeContactFields.includes('phone') && cardData.phone && backContactLine('📞', cardData.phone)}
            {activeContactFields.includes('email') && cardData.email && backContactLine('✉', cardData.email)}
            {activeContactFields.includes('address') && cardData.address && backContactLine('📍', cardData.address)}
            {activeContactFields.includes('whatsapp') && cardData.whatsapp && backContactLine('💬', cardData.whatsapp)}
            {activeContactFields.includes('website') && cardData.website && backContactLine('🌐', cardData.website)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6" dir="rtl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/internal-studio')}>
              <ArrowRight className="w-4 h-4 ml-1" />
              חזרה
            </Button>
            <h1 className="text-xl font-bold text-foreground">עיצוב כרטיס ביקור</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              PNG
            </Button>
            <Button onClick={handleExportPdf} disabled={isExporting} className="gap-2">
              <FileText className="w-4 h-4" />
              {isExporting ? 'מייצא...' : 'PDF לדפוס'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
          {/* Editor Panel */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">פרטי הכרטיס</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">שם איש קשר</Label>
                    <Input value={cardData.personName} onChange={e => updateField('personName', e.target.value)} placeholder="ישראל ישראלי (אופציונלי)" />
                  </div>
                  <div>
                    <Label className="text-xs">תפקיד</Label>
                    <Input value={cardData.title} onChange={e => updateField('title', e.target.value)} placeholder="מנכ״ל (אופציונלי)" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">פרטי קשר</h3>
                <div className="space-y-2">
                  {activeContactFields.includes('phone') && (
                    <div>
                      <Label className="text-xs">טלפון</Label>
                      <Input value={cardData.phone} onChange={e => updateField('phone', e.target.value)} dir="ltr" className="text-right" />
                    </div>
                  )}
                  {activeContactFields.includes('email') && (
                    <div>
                      <Label className="text-xs">אימייל</Label>
                      <Input value={cardData.email} onChange={e => updateField('email', e.target.value)} dir="ltr" className="text-right" />
                    </div>
                  )}
                  {activeContactFields.includes('address') && (
                    <div>
                      <Label className="text-xs">כתובת</Label>
                      <Input value={cardData.address} onChange={e => updateField('address', e.target.value)} />
                    </div>
                  )}
                  {activeContactFields.includes('whatsapp') && (
                    <div>
                      <Label className="text-xs">וואטסאפ</Label>
                      <Input value={cardData.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} dir="ltr" className="text-right" />
                    </div>
                  )}
                  {activeContactFields.includes('website') && (
                    <div>
                      <Label className="text-xs">אתר</Label>
                      <Input value={cardData.website} onChange={e => updateField('website', e.target.value)} dir="ltr" className="text-right" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold">דו-צדדי</Label>
                  <Switch checked={isDoubleSided} onCheckedChange={setIsDoubleSided} />
                </div>
              </CardContent>
            </Card>

            {/* AI Revision */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">בקש תיקון מה-AI</h3>
                <Textarea
                  value={revisionNote}
                  onChange={e => setRevisionNote(e.target.value)}
                  placeholder="למשל: שנה תפקיד, הצע תואר מקצועי יותר, הוסף tagline..."
                  rows={2}
                />
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={async () => {
                    if (!revisionNote.trim()) return;
                    setIsRevising(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('generate-internal-material', {
                        body: {
                          type: 'business-card',
                          profileData: {
                            businessName: profile?.business_name,
                            phone: profile?.contact_phone,
                            email: profile?.contact_email,
                            address: profile?.contact_address,
                            website: profile?.website_url,
                            xFactors: profile?.x_factors,
                            winningFeature: profile?.winning_feature,
                          },
                          extraContext: {
                            revisionNote: revisionNote.trim(),
                            currentTitle: cardData.title,
                            currentPersonName: cardData.personName,
                          },
                        },
                      });
                      if (error) throw error;
                      const result = data?.result;
                      if (result) {
                        setCardData(prev => ({
                          ...prev,
                          ...(result.title && { title: result.title }),
                          ...(result.personName && { personName: result.personName }),
                        }));
                        setRevisionNote('');
                        toast.success('הכרטיס עודכן!');
                      }
                    } catch (err: any) {
                      toast.error(err.message || 'שגיאה בתיקון');
                    } finally {
                      setIsRevising(false);
                    }
                  }}
                  disabled={isRevising || !revisionNote.trim()}
                >
                  {isRevising ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isRevising ? 'מתקן...' : 'בקש תיקון'}
                </Button>
              </CardContent>
            </Card>
            <Button 
              className="w-full gap-2" 
              variant="outline"
              disabled={isAiLoading}
              onClick={async () => {
                setIsAiLoading(true);
                try {
                  const { data, error } = await supabase.functions.invoke('generate-internal-material', {
                    body: {
                      type: 'business-card',
                      profileData: {
                        businessName: profile?.business_name,
                        phone: profile?.contact_phone,
                        email: profile?.contact_email,
                        address: profile?.contact_address,
                        website: profile?.website_url,
                        xFactors: profile?.x_factors,
                        targetAudience: profile?.target_audience,
                        winningFeature: profile?.winning_feature,
                      },
                    },
                  });
                  if (error) throw error;
                  const result = data?.result;
                  if (result) {
                    setCardData(prev => ({
                      ...prev,
                      title: result.title || prev.title,
                    }));
                    toast.success(`💡 AI הציע: "${result.tagline}"`, { duration: 6000 });
                  }
                } catch (err: any) {
                  toast.error(err.message || 'שגיאה ביצירת תוכן');
                } finally {
                  setIsAiLoading(false);
                }
              }}
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isAiLoading ? 'AI חושב...' : '✨ תוכן חכם עם AI'}
            </Button>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-4">
            {isDoubleSided && (
              <div className="flex gap-2 justify-center">
                <Button variant={viewingSide === 'front' ? 'default' : 'outline'} size="sm" onClick={() => setViewingSide('front')}>
                  <Eye className="w-4 h-4 ml-1" />
                  חזית
                </Button>
                <Button variant={viewingSide === 'back' ? 'default' : 'outline'} size="sm" onClick={() => setViewingSide('back')}>
                  <RotateCcw className="w-4 h-4 ml-1" />
                  גב
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center p-8 bg-muted/30 rounded-xl min-h-[400px]">
              <div className="transform scale-[0.65] origin-center" style={{ filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.2))' }}>
                {(!isDoubleSided || viewingSide === 'front') && renderFront()}
                {isDoubleSided && viewingSide === 'back' && renderBack()}
              </div>
            </div>

            {isDoubleSided && viewingSide !== 'front' && (
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                {renderFront()}
              </div>
            )}
            {isDoubleSided && viewingSide !== 'back' && (
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                {renderBack()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCardStudio;
