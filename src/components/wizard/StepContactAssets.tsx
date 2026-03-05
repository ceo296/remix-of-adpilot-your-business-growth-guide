import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Youtube, 
  Facebook, 
  Instagram,
  Linkedin,
  Music2,
  Link as LinkIcon,
  Globe,
  Clock,
  Building2
} from 'lucide-react';

export interface ContactAssets {
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  contact_address: string;
  website_url: string;
  contact_youtube: string;
  social_facebook: string;
  social_instagram: string;
  social_tiktok: string;
  social_linkedin: string;
  opening_hours: string;
  branches: string;
}

interface StepContactAssetsProps {
  data: ContactAssets;
  onChange: (data: Partial<ContactAssets>) => void;
}

const CONTACT_FIELDS = [
  { key: 'contact_phone', label: 'טלפון', icon: Phone, placeholder: '03-1234567', type: 'tel', required: true },
  { key: 'contact_whatsapp', label: 'וואטסאפ', icon: MessageCircle, placeholder: '050-1234567', type: 'tel', required: false },
  { key: 'contact_email', label: 'מייל', icon: Mail, placeholder: 'info@business.com', type: 'email', required: true },
  { key: 'contact_address', label: 'כתובת', icon: MapPin, placeholder: 'רחוב הדוגמה 10, בני ברק', type: 'text', required: false },
  { key: 'website_url', label: 'אתר / דף נחיתה', icon: Globe, placeholder: 'www.example.co.il', type: 'url', required: false },
] as const;

const SOCIAL_FIELDS = [
  { key: 'contact_youtube', label: 'יוטיוב', icon: Youtube, placeholder: 'youtube.com/@channel' },
  { key: 'social_facebook', label: 'פייסבוק', icon: Facebook, placeholder: 'facebook.com/page' },
  { key: 'social_instagram', label: 'אינסטגרם', icon: Instagram, placeholder: '@username' },
  { key: 'social_tiktok', label: 'טיקטוק', icon: Music2, placeholder: '@username' },
  { key: 'social_linkedin', label: 'לינקדאין', icon: Linkedin, placeholder: 'linkedin.com/company/...' },
] as const;

export const StepContactAssets = ({ data, onChange }: StepContactAssetsProps) => {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header - larger and more prominent */}
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
          <LinkIcon className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          פרטי יצירת קשר
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          בעת יצירת הקמפיין תוכלו לבחור אילו פרטים יופיעו בפרסום
        </p>
      </div>

      {/* Contact Info - larger fields */}
      <Card className="border-2 border-primary/20 shadow-lg max-w-2xl mx-auto">
        <CardContent className="p-8 space-y-6">
          <h3 className="font-bold text-xl text-foreground flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            פרטי התקשרות
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {CONTACT_FIELDS.map(({ key, label, icon: Icon, placeholder, type, required }) => (
              <div key={key} className="space-y-3">
                <Label htmlFor={key} className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Icon className="w-5 h-5 text-primary" />
                  {label}
                  {required && <span className="text-destructive text-lg">*</span>}
                </Label>
                <Input
                  id={key}
                  type={type}
                  value={data[key as keyof ContactAssets] || ''}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className={`text-lg h-14 text-left ${required && !data[key as keyof ContactAssets]?.trim() ? 'border-destructive/50 bg-destructive/5' : ''}`}
                  dir="ltr"
                  required={required}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Media - larger fields */}
      <Card className="border-2 border-border shadow-lg max-w-2xl mx-auto">
        <CardContent className="p-8 space-y-6">
          <h3 className="font-bold text-xl text-foreground flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Instagram className="w-6 h-6 text-foreground" />
            </div>
            רשתות חברתיות ותוכן
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-3">
                <Label htmlFor={key} className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  {label}
                </Label>
                <Input
                  id={key}
                  type="text"
                  value={data[key as keyof ContactAssets] || ''}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="text-lg h-14 text-left"
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Details - Hours & Branches */}
      <Card className="border-2 border-border shadow-lg max-w-2xl mx-auto">
        <CardContent className="p-8 space-y-6">
          <h3 className="font-bold text-xl text-foreground flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            סניפים ושעות פעילות
          </h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="opening_hours" className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Clock className="w-5 h-5 text-primary" />
                שעות פתיחה
              </Label>
              <Input
                id="opening_hours"
                type="text"
                value={data.opening_hours || ''}
                onChange={(e) => onChange({ opening_hours: e.target.value })}
                placeholder="א׳-ה׳ 9:00-18:00, ו׳ 9:00-13:00"
                className="text-lg h-14"
                dir="rtl"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="branches" className="flex items-center gap-2 text-base font-semibold text-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                סניפים (כל סניף בשורה נפרדת)
              </Label>
              <Textarea
                id="branches"
                value={data.branches || ''}
                onChange={(e) => onChange({ branches: e.target.value })}
                placeholder={"בני ברק - רחוב רבי עקיבא 42\nירושלים - רחוב יפו 120\nאשדוד - שד׳ הנשיאים 8"}
                className="text-lg min-h-[120px]"
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-base text-muted-foreground text-center bg-muted/50 p-4 rounded-xl max-w-2xl mx-auto">
        💡 הפרטים יישמרו בפרופיל ותוכלו לבחור מה להציג בכל קמפיין בנפרד
      </p>
    </div>
  );
};

export default StepContactAssets;
