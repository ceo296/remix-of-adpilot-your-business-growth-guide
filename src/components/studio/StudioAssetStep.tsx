import { Upload, Wand2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type AssetChoice = 'has-product' | 'no-product';

interface StudioAssetStepProps {
  value: AssetChoice | null;
  onChange: (choice: AssetChoice) => void;
}

const ASSET_OPTIONS: { id: AssetChoice; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    id: 'has-product',
    label: 'יש לי תמונת מוצר מוכנה',
    sublabel: 'אעלה תמונה קיימת של המוצר שלי',
    icon: <Upload className="h-8 w-8" />,
  },
  {
    id: 'no-product',
    label: 'אין לי תמונה / זה שירות',
    sublabel: 'אל דאגה, אנחנו ניצור את התמונה מאפס',
    icon: <Wand2 className="h-8 w-8" />,
  },
];

export const StudioAssetStep = ({ value, onChange }: StudioAssetStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">ויז'ואל - עם מה אנחנו עובדים?</h2>
        <p className="text-muted-foreground">בחר את נקודת ההתחלה שלך</p>
      </div>

      <div className="grid gap-4 max-w-xl mx-auto">
        {ASSET_OPTIONS.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              value === option.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onChange(option.id)}
          >
            <CardContent className="p-6 flex items-center gap-5">
              <div className={`p-4 rounded-xl ${
                value === option.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {option.icon}
              </div>
              <div className="flex-1 text-right">
                <div className="font-semibold text-lg">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.sublabel}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {value === 'no-product' && (
        <div className="text-center mt-6 p-4 bg-success/10 rounded-lg border border-success/20 animate-scale-in">
          <p className="text-success font-medium">
            קטן עלינו. הרובוט כבר יצייר משהו גישמאק 🎨
          </p>
        </div>
      )}
    </div>
  );
};
