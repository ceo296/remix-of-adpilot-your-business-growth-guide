import { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, Download, RotateCcw, Eye, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

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
  const [isExporting, setIsExporting] = useState(false);

  const color = profile?.primary_color || '#E34870';
  const secColor = profile?.secondary_color || '#2A2F33';
  const logoUrl = profile?.logo_url || '';

  const [cardData, setCardData] = useState<CardData>({
    businessName: profile?.business_name || 'שם העסק',
    title: 'מנכ״ל',
    personName: '',
    phone: profile?.contact_phone || '054-000-0000',
    email: profile?.contact_email || 'info@example.com',
    address: profile?.contact_address || 'בני ברק',
    whatsapp: profile?.contact_whatsapp || '',
    website: profile?.website_url || '',
  });

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
      // Card dimensions in mm
      const [cardW, cardH] = cardSizeParam === '85x55' ? [85, 55] : [90, 50];
      const bleed = 3; // 3mm bleed on each side
      const cropLen = 5; // 5mm crop mark length
      const margin = 15; // margin from page edge
      const totalW = cardW + bleed * 2;
      const totalH = cardH + bleed * 2;

      // Page size: enough for card + bleed + crop marks + margin
      const pageW = totalW + margin * 2;
      const pageH = totalH + margin * 2;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pageW, pageH] });

      const drawCropMarks = (x: number, y: number, w: number, h: number) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        // Top-left
        doc.line(x, y - cropLen, x, y); doc.line(x - cropLen, y, x, y);
        // Top-right
        doc.line(x + w, y - cropLen, x + w, y); doc.line(x + w, y, x + w + cropLen, y);
        // Bottom-left
        doc.line(x, y + h, x, y + h + cropLen); doc.line(x - cropLen, y + h, x, y + h);
        // Bottom-right
        doc.line(x + w, y + h, x + w, y + h + cropLen); doc.line(x + w, y + h, x + w + cropLen, y + h);
      };

      const addCardPage = async (ref: React.RefObject<HTMLDivElement | null>, label: string) => {
        if (!ref.current) return;
        const png = await toPng(ref.current, { pixelRatio: 6, width: 900, height: 500 });
        
        const x = margin;
        const y = margin;

        // Draw bleed area indicator (light gray border)
        doc.setDrawColor(200);
        doc.setLineWidth(0.05);
        doc.rect(x, y, totalW, totalH);

        // Place image covering bleed area
        doc.addImage(png, 'PNG', x, y, totalW, totalH);

        // Crop marks at the trim line (inside bleed)
        const trimX = x + bleed;
        const trimY = y + bleed;
        drawCropMarks(trimX, trimY, cardW, cardH);

        // Label
        doc.setFontSize(6);
        doc.setTextColor(150);
        doc.text(`${label} | ${cardW}×${cardH}mm | bleed ${bleed}mm`, pageW / 2, pageH - 3, { align: 'center' });
      };

      // Front page
      await addCardPage(frontRef, 'חזית');

      // Back page
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

  // Helper to lighten/darken a hex color
  const adjustColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };

  const colorLight = adjustColor(color, 40);
  const colorDark = adjustColor(color, -30);

  const contactLine = (icon: string, value: string, textColor: string = '#555') => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start' }}>
      <span style={{ fontSize: '14px', width: '20px', height: '20px', borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: '13px', color: textColor, fontWeight: 500 }}>{value}</span>
    </div>
  );

  // SVG decorative patterns
  const dotPattern = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='${encodeURIComponent(color)}' opacity='0.08'/%3E%3C/svg%3E")`;
  const diagonalPattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0' stroke='${encodeURIComponent(color)}' stroke-width='0.5' opacity='0.06'/%3E%3C/svg%3E")`;

  const renderFront = () => {
    const style = template.replace('bc-', '');

    return (
      <div
        ref={frontRef}
        style={{
          width: '900px', height: '500px', direction: 'rtl', fontFamily: profile?.header_font || 'Heebo, sans-serif',
          position: 'relative', overflow: 'hidden', borderRadius: '0px', background: '#fff',
        }}
      >
        {/* Decorative accent shape — top-left colored area */}
        {(style === 'classic' || style === 'elegant') && (
          <>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '6px', background: color }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '3px', background: `${color}40` }} />
            {/* Subtle dot texture */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern, backgroundSize: '20px 20px' }} />
          </>
        )}

        {style === 'modern' && (
          <>
            {/* Bold side panel with gradient */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '38%', background: `linear-gradient(160deg, ${color} 0%, ${colorDark} 100%)` }}>
              {/* Diagonal pattern overlay */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: diagonalPattern, backgroundSize: '40px 40px' }} />
              {/* Decorative chevrons */}
              <svg style={{ position: 'absolute', bottom: '30px', left: '30px', opacity: 0.15 }} width="80" height="80" viewBox="0 0 80 80">
                <path d="M10 20L30 40L10 60" stroke="white" strokeWidth="4" fill="none" />
                <path d="M30 20L50 40L30 60" stroke="white" strokeWidth="4" fill="none" />
              </svg>
            </div>
            {/* Right side dot texture */}
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '38%', backgroundImage: dotPattern, backgroundSize: '20px 20px' }} />
          </>
        )}

        {style === 'minimal' && (
          <>
            <div style={{ position: 'absolute', top: '50%', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', border: `2px solid ${color}15`, transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '-30px', width: '140px', height: '140px', borderRadius: '50%', border: `1px solid ${color}10`, transform: 'translateY(-50%)' }} />
          </>
        )}

        {style === 'premium' && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: secColor }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${color}15 0%, transparent 50%, ${color}10 100%)` }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: diagonalPattern, backgroundSize: '40px 40px', opacity: 0.5 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, transparent 10%, ${color} 50%, transparent 90%)` }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, transparent 10%, ${color}60 50%, transparent 90%)` }} />
          </>
        )}

        {style === 'bold' && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)` }} />
            {/* Large geometric shape */}
            <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '24px 24px', opacity: 0.3 }} />
          </>
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '48px 56px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* Logo */}
            <div>
              {logoUrl ? (
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: (style === 'premium' || style === 'bold') ? 'rgba(255,255,255,0.1)' : `${color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                  <img src={logoUrl} alt="logo" style={{ maxHeight: '64px', maxWidth: '64px', objectFit: 'contain', filter: (style === 'premium' || style === 'bold') ? 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 1px 4px rgba(0,0,0,0.08))' }} />
                </div>
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: (style === 'premium' || style === 'bold') ? 'rgba(255,255,255,0.1)' : color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: (style === 'premium' || style === 'bold') ? '#fff' : '#fff' }}>{cardData.businessName.charAt(0)}</span>
                </div>
              )}
            </div>
            {/* Name & title */}
            <div style={{ textAlign: 'right' }}>
              {cardData.personName && (
                <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.1, color: (style === 'premium' || style === 'bold') ? '#fff' : '#222' }}>
                  {cardData.personName}
                </div>
              )}
              <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.1, marginTop: cardData.personName ? '4px' : 0, color: (style === 'premium' || style === 'bold') ? '#fff' : '#222' }}>
                {cardData.businessName}
              </div>
              <div style={{ display: 'inline-block', marginTop: '8px', padding: '3px 14px', borderRadius: '3px', fontSize: '13px', fontWeight: 600, background: (style === 'premium' || style === 'bold') ? `${color}` : `${color}15`, color: (style === 'premium' || style === 'bold') ? '#fff' : color }}>
                {cardData.title}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '60px', height: '2px', background: (style === 'premium' || style === 'bold') ? 'rgba(255,255,255,0.2)' : `${color}30`, margin: '0 auto', position: 'absolute', top: '50%', right: '56px' }} />

          {/* Contact info — bottom left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeContactFields.includes('phone') && cardData.phone && contactLine('📞', cardData.phone, (style === 'premium' || style === 'bold') ? 'rgba(255,255,255,0.85)' : '#555')}
            {activeContactFields.includes('email') && cardData.email && contactLine('✉', cardData.email, (style === 'premium' || style === 'bold') ? 'rgba(255,255,255,0.85)' : '#555')}
            {activeContactFields.includes('address') && cardData.address && contactLine('📍', cardData.address, (style === 'premium' || style === 'bold') ? 'rgba(255,255,255,0.85)' : '#555')}
            {activeContactFields.includes('whatsapp') && cardData.whatsapp && contactLine('💬', cardData.whatsapp, (style === 'premium' || style === 'bold') ? 'rgba(255,255,255,0.85)' : '#555')}
            {activeContactFields.includes('website') && cardData.website && contactLine('🌐', cardData.website, (style === 'premium' || style === 'bold') ? 'rgba(255,255,255,0.85)' : '#555')}
          </div>
        </div>
      </div>
    );
  };

  const renderBack = () => {
    const style = template.replace('bc-', '');
    const isDark = style === 'premium';
    const isBold = style === 'bold';
    const bgColor = isDark ? secColor : isBold ? '#fff' : color;
    const fgColor = isBold ? color : '#fff';

    return (
      <div
        ref={backRef}
        style={{
          width: '900px', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: profile?.header_font || 'Heebo, sans-serif', borderRadius: '0px', overflow: 'hidden',
          background: isBold ? '#fff' : `linear-gradient(160deg, ${bgColor} 0%, ${adjustColor(bgColor, -20)} 100%)`,
          position: 'relative',
        }}
      >
        {/* Decorative elements */}
        {isDark && (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 70%, ${color}25 0%, transparent 60%)` }} />
        )}

        {/* Geometric circles */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', border: `2px solid ${isBold ? `${color}15` : 'rgba(255,255,255,0.08)'}` }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: isBold ? `${color}06` : 'rgba(255,255,255,0.04)' }} />

        {/* Pattern overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: isBold ? dotPattern : dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '20px 20px', opacity: isBold ? 1 : 0.15 }} />

        {/* Accent lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isBold ? color : 'rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: isBold ? color : 'rgba(255,255,255,0.15)' }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {logoUrl ? (
            <div style={{ width: '120px', height: '120px', margin: '0 auto', borderRadius: '16px', background: isBold ? `${color}08` : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <img src={logoUrl} alt="logo" style={{ 
                maxHeight: '88px', maxWidth: '88px', objectFit: 'contain',
                filter: isBold ? 'none' : 'brightness(0) invert(1) drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
              }} />
            </div>
          ) : (
            <div style={{ width: '100px', height: '100px', margin: '0 auto', borderRadius: '16px', background: isBold ? `${color}10` : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, color: fgColor }}>{cardData.businessName.charAt(0)}</span>
            </div>
          )}
          <div style={{ width: '40px', height: '2px', margin: '16px auto', background: isBold ? color : 'rgba(255,255,255,0.3)' }} />
          <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '3px', color: isBold ? '#333' : 'rgba(255,255,255,0.85)' }}>
            {cardData.businessName}
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
                    <Label className="text-xs">שם העסק</Label>
                    <Input value={cardData.businessName} onChange={e => updateField('businessName', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">שם איש קשר</Label>
                    <Input value={cardData.personName} onChange={e => updateField('personName', e.target.value)} placeholder="ישראל ישראלי" />
                  </div>
                  <div>
                    <Label className="text-xs">תפקיד</Label>
                    <Input value={cardData.title} onChange={e => updateField('title', e.target.value)} />
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

            {/* Sides toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold">דו-צדדי</Label>
                  <Switch checked={isDoubleSided} onCheckedChange={setIsDoubleSided} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Side toggle tabs */}
            {isDoubleSided && (
              <div className="flex gap-2 justify-center">
                <Button
                  variant={viewingSide === 'front' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewingSide('front')}
                >
                  <Eye className="w-4 h-4 ml-1" />
                  חזית
                </Button>
                <Button
                  variant={viewingSide === 'back' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewingSide('back')}
                >
                  <RotateCcw className="w-4 h-4 ml-1" />
                  גב
                </Button>
              </div>
            )}

            {/* Card Preview */}
            <div className="flex items-center justify-center p-8 bg-muted/30 rounded-xl min-h-[400px]">
              <div className="transform scale-[0.65] origin-center" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.15))' }}>
                {(!isDoubleSided || viewingSide === 'front') && renderFront()}
                {isDoubleSided && viewingSide === 'back' && renderBack()}
              </div>
            </div>

            {/* Render both for export (hidden) */}
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
