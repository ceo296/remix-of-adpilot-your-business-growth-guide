import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Link as LinkIcon
} from 'lucide-react';

export interface ContactAssets {
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  contact_address: string;
  contact_youtube: string;
  social_facebook: string;
  social_instagram: string;
  social_tiktok: string;
  social_linkedin: string;
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <LinkIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          פרטי יצירת קשר
        </h2>
        <p className="text-muted-foreground">
          הזן את הפרטים שיופיעו בפרסומים שלך
        </p>
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-primary" />
            פרטי התקשרות
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {CONTACT_FIELDS.map(({ key, label, icon: Icon, placeholder, type, required }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="flex items-center gap-2 text-foreground">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                  {required && <span className="text-destructive text-xs">*</span>}
                </Label>
                <Input
                  id={key}
                  type={type}
                  value={data[key as keyof ContactAssets] || ''}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className={`text-left ${required && !data[key as keyof ContactAssets]?.trim() ? 'border-destructive/50' : ''}`}
                  dir="ltr"
                  required={required}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Instagram className="w-5 h-5 text-primary" />
            רשתות חברתיות ותוכן
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="flex items-center gap-2 text-foreground">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </Label>
                <Input
                  id={key}
                  type="text"
                  value={data[key as keyof ContactAssets] || ''}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="text-left"
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        💡 הפרטים יישמרו בפרופיל ותוכל לבחור מה להציג בכל קמפיין בנפרד
      </p>
    </div>
  );
};

export default StepContactAssets;
