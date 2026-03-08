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

  const contactLine = (icon: string, value: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
      <span style={{ fontSize: '13px', color: '#666' }}>{value}</span>
      <span style={{ fontSize: '12px', opacity: 0.5 }}>{icon}</span>
    </div>
  );

  const renderFront = () => {
    const style = template.replace('bc-', '');
    const styles: Record<string, React.CSSProperties> = {
      classic: { background: '#fff', color: '#222' },
      modern: { background: '#fff', color: '#222' },
      minimal: { background: '#fff', color: '#222' },
      premium: { background: secColor, color: '#fff' },
      bold: { background: color, color: '#fff' },
      elegant: { background: '#fff', color: '#222' },
    };
    const base = styles[style] || styles.classic;

    return (
      <div
        ref={frontRef}
        style={{
          width: '900px', height: '500px', direction: 'rtl', fontFamily: profile?.header_font || 'Heebo, sans-serif',
          position: 'relative', overflow: 'hidden', borderRadius: '12px', ...base,
        }}
      >
        {/* Top accent for modern/elegant */}
        {(style === 'modern' || style === 'elegant') && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: color }} />
        )}

        {/* Side panel for modern */}
        {style === 'modern' && (
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', background: color }} />
        )}

        <div style={{ position: 'relative', zIndex: 1, padding: '48px 56px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.1, color: style === 'modern' ? '#fff' : base.color }}>
                {cardData.businessName}
              </div>
              {cardData.personName && (
                <div style={{ fontSize: '18px', marginTop: '6px', color: style === 'modern' ? 'rgba(255,255,255,0.8)' : '#888' }}>
                  {cardData.personName}
                </div>
              )}
              <div style={{ fontSize: '14px', marginTop: '4px', color: style === 'premium' || style === 'bold' || style === 'modern' ? color : '#aaa' }}>
                {cardData.title}
              </div>
            </div>
            {logoUrl && (
              <img src={logoUrl} alt="logo" style={{ height: '64px', objectFit: 'contain', maxWidth: '140px', filter: (style === 'premium' || style === 'bold') ? 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))' }} />
            )}
          </div>

          {/* Contact info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            {activeContactFields.includes('phone') && cardData.phone && contactLine('📞', cardData.phone)}
            {activeContactFields.includes('email') && cardData.email && contactLine('✉', cardData.email)}
            {activeContactFields.includes('address') && cardData.address && contactLine('📍', cardData.address)}
            {activeContactFields.includes('whatsapp') && cardData.whatsapp && contactLine('💬', cardData.whatsapp)}
            {activeContactFields.includes('website') && cardData.website && contactLine('🌐', cardData.website)}
          </div>
        </div>

        {/* Bottom accent for premium */}
        {style === 'premium' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        )}
      </div>
    );
  };

  const renderBack = () => {
    const style = template.replace('bc-', '');
    return (
      <div
        ref={backRef}
        style={{
          width: '900px', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: profile?.header_font || 'Heebo, sans-serif', borderRadius: '12px', overflow: 'hidden',
          background: style === 'premium' ? secColor : style === 'bold' ? '#fff' : color,
          position: 'relative',
        }}
      >
        {style === 'premium' && (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${color}40 0%, transparent 70%)` }} />
        )}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" style={{ 
              height: '120px', objectFit: 'contain', maxWidth: '280px',
              filter: style === 'bold' ? 'none' : 'brightness(0) invert(1) drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
            }} />
          ) : (
            <div style={{ fontSize: '72px', fontWeight: 900, color: style === 'bold' ? color : '#fff' }}>
              {cardData.businessName.charAt(0)}
            </div>
          )}
          <div style={{ 
            width: '60px', height: '2px', margin: '16px auto',
            background: style === 'bold' ? color : 'rgba(255,255,255,0.4)',
          }} />
          <div style={{ 
            fontSize: '16px', letterSpacing: '4px',
            color: style === 'bold' ? '#666' : 'rgba(255,255,255,0.7)',
          }}>
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
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            ייצוא PNG
          </Button>
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
