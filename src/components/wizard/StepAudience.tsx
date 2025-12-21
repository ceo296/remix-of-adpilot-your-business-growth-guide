import { WizardData, SectorType, REGIONS } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Check } from 'lucide-react';

interface StepAudienceProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const sectors: { id: SectorType; label: string; description: string }[] = [
  { id: 'litvish', label: 'ליטאי', description: 'ישיבות וקהילות ליטאיות' },
  { id: 'chassidish', label: 'חסידי', description: 'חצרות וקהילות חסידיות' },
  { id: 'sefardi', label: 'ספרדי-חרדי', description: 'קהילות ש"ס ועדות המזרח' },
  { id: 'modern', label: 'חרדי-מודרני', description: 'חרדים עובדים ואקדמאים' },
  { id: 'general', label: 'כללי', description: 'קהל רחב ומגוון' },
];

const StepAudience = ({ data, updateData, onNext }: StepAudienceProps) => {
  const toggleSector = (sector: SectorType) => {
    const current = data.sectors;
    const updated = current.includes(sector)
      ? current.filter((s) => s !== sector)
      : [...current, sector];
    updateData({ sectors: updated });
  };

  const toggleRegion = (region: string) => {
    const current = data.regions;
    const updated = current.includes(region)
      ? current.filter((r) => r !== region)
      : [...current, region];
    updateData({ regions: updated });
  };

  const isValid = data.sectors.length > 0 && data.regions.length > 0;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Users className="w-4 h-4" />
          שלב 1 מתוך 4
        </div>
        <h1 className="text-3xl font-bold text-foreground">למי מיועד הקמפיין?</h1>
        <p className="text-lg text-muted-foreground">
          בחר את המגזרים והאזורים שאליהם תרצה לפנות
        </p>
      </div>

      {/* Sector Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          מגזר
        </h3>
        <div className="flex flex-wrap gap-3">
          {sectors.map((sector) => {
            const isSelected = data.sectors.includes(sector.id);
            return (
              <button
                key={sector.id}
                onClick={() => toggleSector(sector.id)}
                className={`
                  group relative px-5 py-3 rounded-xl border-2 transition-all duration-300
                  hover:shadow-md hover:scale-[1.02]
                  ${isSelected 
                    ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="w-4 h-4" />}
                  <span className="font-medium">{sector.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Region Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          אזור גיאוגרפי
        </h3>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => {
            const isSelected = data.regions.includes(region);
            return (
              <button
                key={region}
                onClick={() => toggleRegion(region)}
                className={`
                  px-4 py-2 rounded-lg border transition-all duration-200
                  ${isSelected 
                    ? 'border-primary bg-primary/10 text-primary font-medium' 
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }
                `}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {(data.sectors.length > 0 || data.regions.length > 0) && (
        <div className="bg-muted/50 rounded-xl p-4 border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">בחירה נוכחית: </span>
            {data.sectors.length > 0 && (
              <span>
                {sectors.filter(s => data.sectors.includes(s.id)).map(s => s.label).join(', ')}
              </span>
            )}
            {data.sectors.length > 0 && data.regions.length > 0 && ' | '}
            {data.regions.length > 0 && (
              <span>{data.regions.join(', ')}</span>
            )}
          </p>
        </div>
      )}

      <div className="flex justify-start pt-4">
        <Button 
          variant="gradient" 
          size="lg"
          onClick={onNext}
          disabled={!isValid}
        >
          המשך לבחירת סגנון
        </Button>
      </div>
    </div>
  );
};

export default StepAudience;
