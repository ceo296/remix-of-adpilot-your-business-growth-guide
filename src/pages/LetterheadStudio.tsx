import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Download, FileText, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import TopNavbar from '@/components/dashboard/TopNavbar';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LetterData {
  businessName: string;
  subtitle: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  letterContent: string;
  date: string;
  recipientName: string;
  recipientTitle: string;
  senderName: string;
  senderTitle: string;
}

const LetterheadStudio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile } = useClientProfile();

  const template = searchParams.get('template') || 'lh-classic';
  const contactFieldsParam = searchParams.get('contactFields') || 'phone,email,address';
  const activeContactFields = contactFieldsParam.split(',');
  const [isExporting, setIsExporting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [letterType, setLetterType] = useState('general');

  const color = profile?.primary_color || '#E34870';
  const secColor = profile?.secondary_color || '#2A2F33';
  const logoUrl = profile?.logo_url || '';
  const font = profile?.header_font || 'Heebo, sans-serif';

  const [letterData, setLetterData] = useState<LetterData>({
    businessName: profile?.business_name || '',
    subtitle: '',
    phone: profile?.contact_phone || '',
    email: profile?.contact_email || '',
    address: profile?.contact_address || '',
    website: profile?.website_url || '',
    letterContent: '',
    date: new Date().toLocaleDateString('he-IL'),
    recipientName: '',
    recipientTitle: '',
    senderName: '',
    senderTitle: '',
  });

  const pageRef = useRef<HTMLDivElement>(null);

  const updateField = (field: keyof LetterData, value: string) => {
    setLetterData(prev => ({ ...prev, [field]: value }));
  };

  const adjustColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };

  const colorDark = adjustColor(color, -30);
  const colorVeryDark = adjustColor(color, -60);

  const handleExportPng = useCallback(async () => {
    if (!pageRef.current) return;
    try {
      const png = await toPng(pageRef.current, { pixelRatio: 4, width: 794, height: 1123 });
      const link = document.createElement('a');
      link.download = `letterhead-${Date.now()}.png`;
      link.href = png;
      link.click();
      toast.success('נייר מכתבים יוצא בהצלחה!');
    } catch (err) {
      toast.error('שגיאה בייצוא');
    }
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!pageRef.current) return;
    setIsExporting(true);
    try {
      const png = await toPng(pageRef.current, { pixelRatio: 4, width: 794, height: 1123 });
      const bleed = 3;
      const cropLen = 5;
      const margin = 12;
      const pageW = 210;
      const pageH = 297;
      const totalW = pageW + bleed * 2;
      const totalH = pageH + bleed * 2;
      const docW = totalW + margin * 2;
      const docH = totalH + margin * 2;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [docW, docH] });

      // Crop marks
      const trimX = margin + bleed;
      const trimY = margin + bleed;
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      // Top-left
      doc.line(trimX, trimY - cropLen, trimX, trimY);
      doc.line(trimX - cropLen, trimY, trimX, trimY);
      // Top-right
      doc.line(trimX + pageW, trimY - cropLen, trimX + pageW, trimY);
      doc.line(trimX + pageW, trimY, trimX + pageW + cropLen, trimY);
      // Bottom-left
      doc.line(trimX, trimY + pageH, trimX, trimY + pageH + cropLen);
      doc.line(trimX - cropLen, trimY + pageH, trimX, trimY + pageH);
      // Bottom-right
      doc.line(trimX + pageW, trimY + pageH, trimX + pageW, trimY + pageH + cropLen);
      doc.line(trimX + pageW, trimY + pageH, trimX + pageW + cropLen, trimY + pageH);

      doc.addImage(png, 'PNG', margin, margin, totalW, totalH);

      doc.setFontSize(6);
      doc.setTextColor(150);
      doc.text(`נייר מכתבים | A4 210×297mm | bleed ${bleed}mm`, docW / 2, docH - 3, { align: 'center' });

      doc.save(`letterhead-print-${Date.now()}.pdf`);
      toast.success('PDF מוכן לדפוס יוצא בהצלחה!');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בייצוא PDF');
    } finally {
      setIsExporting(false);
    }
  }, []);

  // SVG patterns
  const dotPattern = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='${encodeURIComponent(color)}' opacity='0.06'/%3E%3C/svg%3E")`;

  const renderLetterhead = () => {
    const style = template.replace('lh-', '');

    const contactItems: string[] = [];
    if (activeContactFields.includes('phone') && letterData.phone) contactItems.push(`📞 ${letterData.phone}`);
    if (activeContactFields.includes('email') && letterData.email) contactItems.push(`✉ ${letterData.email}`);
    if (activeContactFields.includes('address') && letterData.address) contactItems.push(`📍 ${letterData.address}`);
    if (activeContactFields.includes('website') && letterData.website) contactItems.push(`🌐 ${letterData.website}`);

    return (
      <div
        ref={pageRef}
        style={{
          width: '794px', height: '1123px', direction: 'rtl', fontFamily: font,
          position: 'relative', overflow: 'hidden', background: '#fff',
        }}
      >
        {/* ===== HEADER ===== */}
        {style === 'classic' && (
          <>
            {/* Top color band */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '140px', background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '20px 20px', opacity: 0.15 }} />
              {/* Decorative circle */}
              <div style={{ position: 'absolute', top: '-30px', left: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            </div>
            {/* Wave separator */}
            <svg style={{ position: 'absolute', top: '132px', left: 0, width: '100%' }} viewBox="0 0 794 20" preserveAspectRatio="none">
              <path d={`M0 0 L794 0 L794 10 Q397 25 0 10 Z`} fill={colorDark} />
            </svg>
            {/* Header content */}
            <div style={{ position: 'absolute', top: '28px', right: '50px', left: '50px', display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
              {logoUrl ? (
                <div style={{ width: '80px', height: '80px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', flexShrink: 0 }}>
                  <img src={logoUrl} alt="logo" style={{ maxHeight: '60px', maxWidth: '60px', objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }} />
                </div>
              ) : (
                <div style={{ width: '70px', height: '70px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '34px', fontWeight: 900, color: '#fff' }}>{letterData.businessName.charAt(0)}</span>
                </div>
              )}
              <div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{letterData.businessName}</div>
                {letterData.subtitle && (
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{letterData.subtitle}</div>
                )}
              </div>
            </div>
            {/* Contact bar below header */}
            <div style={{ position: 'absolute', top: '158px', right: '50px', left: '50px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {contactItems.map((item, i) => (
                <span key={i} style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>{item}</span>
              ))}
            </div>
          </>
        )}

        {style === 'modern' && (
          <>
            {/* Right side strip */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: `linear-gradient(180deg, ${color} 0%, ${colorVeryDark} 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '15px 15px', opacity: 0.15 }} />
            </div>
            {/* Top bar accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: '60px', height: '4px', background: color }} />
            {/* Header content */}
            <div style={{ position: 'absolute', top: '35px', right: '90px', left: '50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {logoUrl ? (
                  <div style={{ width: '65px', height: '65px', borderRadius: '12px', background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', flexShrink: 0 }}>
                    <img src={logoUrl} alt="logo" style={{ maxHeight: '50px', maxWidth: '50px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ width: '55px', height: '55px', borderRadius: '12px', background: `linear-gradient(135deg, ${color}, ${colorDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>{letterData.businessName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#222' }}>{letterData.businessName}</div>
                  {letterData.subtitle && <div style={{ fontSize: '12px', fontWeight: 500, color: '#888' }}>{letterData.subtitle}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {contactItems.map((item, i) => (
                  <span key={i} style={{ fontSize: '10px', color: '#777', fontWeight: 500 }}>{item}</span>
                ))}
              </div>
            </div>
            {/* Divider */}
            <div style={{ position: 'absolute', top: '120px', right: '90px', left: '50px', height: '2px', background: `linear-gradient(90deg, ${color}, ${color}20)` }} />
          </>
        )}

        {style === 'minimal' && (
          <>
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: `linear-gradient(90deg, ${color}, ${colorDark})` }} />
            {/* Simple header */}
            <div style={{ position: 'absolute', top: '30px', right: '60px', left: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" style={{ height: '45px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '45px', height: '45px', borderRadius: '8px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>{letterData.businessName.charAt(0)}</span>
                  </div>
                )}
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#222' }}>{letterData.businessName}</div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {contactItems.slice(0, 3).map((item, i) => (
                  <span key={i} style={{ fontSize: '10px', color: '#888' }}>{item}</span>
                ))}
              </div>
            </div>
            {/* Thin divider */}
            <div style={{ position: 'absolute', top: '90px', right: '60px', left: '60px', height: '1px', background: `${color}30` }} />
          </>
        )}

        {/* ===== LETTER BODY ===== */}
        <div style={{
          position: 'absolute',
          top: style === 'classic' ? '195px' : style === 'modern' ? '145px' : '110px',
          right: style === 'modern' ? '90px' : '60px',
          left: style === 'modern' ? '50px' : '60px',
          bottom: '100px',
        }}>
          {/* Date */}
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '24px', textAlign: 'left' }}>
            {letterData.date}
          </div>

          {/* Recipient */}
          {letterData.recipientName && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#333' }}>{letterData.recipientName}</div>
              {letterData.recipientTitle && <div style={{ fontSize: '13px', color: '#666' }}>{letterData.recipientTitle}</div>}
            </div>
          )}

          {/* Letter content */}
          <div style={{ fontSize: '15px', color: '#333', lineHeight: 2, whiteSpace: 'pre-wrap', minHeight: '300px' }}>
            {letterData.letterContent}
          </div>

          {/* Sender */}
          {letterData.senderName && (
            <div style={{ marginTop: '40px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#333' }}>{letterData.senderName}</div>
              {letterData.senderTitle && <div style={{ fontSize: '13px', color: '#666' }}>{letterData.senderTitle}</div>}
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        {style === 'classic' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern.replace(encodeURIComponent(color), 'white'), backgroundSize: '15px 15px', opacity: 0.1 }} />
            {contactItems.map((item, i) => (
              <span key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 500, position: 'relative', zIndex: 1 }}>{item}</span>
            ))}
          </div>
        )}
        {style === 'modern' && (
          <>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: '60px', height: '3px', background: `linear-gradient(90deg, ${color}40, ${color})` }} />
            <div style={{ position: 'absolute', bottom: '12px', right: '90px', left: '50px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
              {contactItems.map((item, i) => (
                <span key={i} style={{ fontSize: '10px', color: '#999' }}>{item}</span>
              ))}
            </div>
          </>
        )}
        {style === 'minimal' && (
          <>
            <div style={{ position: 'absolute', bottom: '30px', right: '60px', left: '60px', height: '1px', background: `${color}20` }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '60px', left: '60px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
              {contactItems.map((item, i) => (
                <span key={i} style={{ fontSize: '10px', color: '#aaa' }}>{item}</span>
              ))}
            </div>
          </>
        )}

        {/* Page texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: dotPattern, backgroundSize: '30px 30px', pointerEvents: 'none' }} />
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
            <h1 className="text-xl font-bold text-foreground">עיצוב נייר מכתבים</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPng} className="gap-2">
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
                <h3 className="text-sm font-bold text-foreground">פרטי העסק</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">שם העסק</Label>
                    <Input value={letterData.businessName} onChange={e => updateField('businessName', e.target.value)} placeholder="שם העסק" />
                  </div>
                  <div>
                    <Label className="text-xs">כותרת משנה</Label>
                    <Input value={letterData.subtitle} onChange={e => updateField('subtitle', e.target.value)} placeholder="שירותים מקצועיים (אופציונלי)" />
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
                      <Input value={letterData.phone} onChange={e => updateField('phone', e.target.value)} dir="ltr" className="text-right" />
                    </div>
                  )}
                  {activeContactFields.includes('email') && (
                    <div>
                      <Label className="text-xs">אימייל</Label>
                      <Input value={letterData.email} onChange={e => updateField('email', e.target.value)} dir="ltr" className="text-right" />
                    </div>
                  )}
                  {activeContactFields.includes('address') && (
                    <div>
                      <Label className="text-xs">כתובת</Label>
                      <Input value={letterData.address} onChange={e => updateField('address', e.target.value)} />
                    </div>
                  )}
                  {activeContactFields.includes('website') && (
                    <div>
                      <Label className="text-xs">אתר</Label>
                      <Input value={letterData.website} onChange={e => updateField('website', e.target.value)} dir="ltr" className="text-right" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">תוכן המכתב</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">תאריך</Label>
                    <Input value={letterData.date} onChange={e => updateField('date', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">שם הנמען</Label>
                    <Input value={letterData.recipientName} onChange={e => updateField('recipientName', e.target.value)} placeholder="שם מלא" />
                  </div>
                  <div>
                    <Label className="text-xs">תפקיד הנמען</Label>
                    <Input value={letterData.recipientTitle} onChange={e => updateField('recipientTitle', e.target.value)} placeholder="תפקיד" />
                  </div>
                  <div>
                    <Label className="text-xs">סוג מכתב</Label>
                    <Select value={letterType} onValueChange={setLetterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">מכתב כללי</SelectItem>
                        <SelectItem value="price-quote">הצעת מחיר</SelectItem>
                        <SelectItem value="formal-letter">מכתב רשמי</SelectItem>
                        <SelectItem value="thank-you">מכתב תודה</SelectItem>
                        <SelectItem value="invitation">הזמנה לאירוע</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">תוכן</Label>
                    <Textarea
                      value={letterData.letterContent}
                      onChange={e => updateField('letterContent', e.target.value)}
                      rows={6}
                      className="text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">שם השולח</Label>
                    <Input value={letterData.senderName} onChange={e => updateField('senderName', e.target.value)} placeholder="שם מלא" />
                  </div>
                  <div>
                    <Label className="text-xs">תפקיד השולח</Label>
                    <Input value={letterData.senderTitle} onChange={e => updateField('senderTitle', e.target.value)} placeholder="תפקיד" />
                  </div>
                </div>
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
                      type: 'letterhead',
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
                      extraContext: {
                        letterType,
                        recipientName: letterData.recipientName,
                        letterTopic: letterData.letterContent?.slice(0, 100),
                      },
                    },
                  });
                  if (error) throw error;
                  const result = data?.result;
                  if (result) {
                    setLetterData(prev => ({
                      ...prev,
                      ...(result.subtitle && { subtitle: result.subtitle }),
                      ...(result.recipientName && { recipientName: result.recipientName }),
                      ...(result.recipientTitle && { recipientTitle: result.recipientTitle }),
                      ...(result.letterContent && { letterContent: result.letterContent }),
                      ...(result.senderName && { senderName: result.senderName }),
                      ...(result.senderTitle && { senderTitle: result.senderTitle }),
                    }));
                    toast.success('✨ המכתב נוצר בהצלחה!');
                  }
                } catch (err: any) {
                  toast.error(err.message || 'שגיאה ביצירת מכתב');
                } finally {
                  setIsAiLoading(false);
                }
              }}
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isAiLoading ? 'AI כותב...' : '✨ כתוב מכתב עם AI'}
            </Button>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-center p-6 bg-muted/30 rounded-xl">
              <div className="transform scale-[0.55] origin-top" style={{ filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.15))' }}>
                {renderLetterhead()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterheadStudio;
