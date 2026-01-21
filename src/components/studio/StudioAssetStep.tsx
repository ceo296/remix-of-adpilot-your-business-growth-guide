import { Upload, Wand2, FileText, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type AssetChoice = 'full-campaign' | 'has-visual' | 'has-copy';

interface StudioAssetStepProps {
  value: AssetChoice | null;
  onChange: (choice: AssetChoice) => void;
}

const ASSET_OPTIONS: { id: AssetChoice; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    id: 'full-campaign',
    label: 'יש לי קמפיין מוכן',
    sublabel: 'יש לי גם ויז\'ואל וגם קופי - רק צריך להעלות',
    icon: <Package className="h-8 w-8" />,
  },
  {
    id: 'has-visual',
    label: 'יש לי ויז\'ואל, צריך אתכם בקופי',
    sublabel: 'יש לי תמונה/עיצוב, אתם תכתבו את הטקסט',
    icon: <Upload className="h-8 w-8" />,
  },
  {
    id: 'has-copy',
    label: 'יש לי רק קופי, צריך אתכם בויז\'ואל',
    sublabel: 'יש לי את הטקסט, אתם תיצרו את העיצוב',
    icon: <Wand2 className="h-8 w-8" />,
  },
];

export const StudioAssetStep = ({ value, onChange }: StudioAssetStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">מה יש לך מוכן?</h2>
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

      {value === 'full-campaign' && (
        <div className="text-center mt-6 p-4 bg-success/10 rounded-lg border border-success/20 animate-scale-in">
          <p className="text-success font-medium">
            מעולה! פשוט תעלה את החומרים ונדאג לכל השאר 📦
          </p>
        </div>
      )}

      {value === 'has-visual' && (
        <div className="text-center mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20 animate-scale-in">
          <p className="text-primary font-medium">
            יופי! תעלה את הויז'ואל ואנחנו נכתוב קופי שמוכר ✍️
          </p>
        </div>
      )}

      {value === 'has-copy' && (
        <div className="text-center mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20 animate-scale-in">
          <p className="text-accent-foreground font-medium">
            מצוין! תן לנו את הטקסט והרובוט כבר יצייר משהו גישמאק 🎨
          </p>
        </div>
      )}
    </div>
  );
};
