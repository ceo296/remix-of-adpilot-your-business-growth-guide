import { WizardData, MEDIA_CATALOG, MediaOption, MediaType } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Newspaper, Globe, Radio, MapPin, Check, Filter, Users } from 'lucide-react';
import { useState, useMemo } from 'react';

interface StepMediaCatalogProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const mediaTypeLabels: Record<MediaType, { label: string; icon: React.ReactNode }> = {
  newspaper: { label: 'עיתונות', icon: <Newspaper className="w-4 h-4" /> },
  digital: { label: 'דיגיטל', icon: <Globe className="w-4 h-4" /> },
  radio: { label: 'רדיו', icon: <Radio className="w-4 h-4" /> },
  outdoor: { label: 'חוצות', icon: <MapPin className="w-4 h-4" /> },
};

const StepMediaCatalog = ({ data, updateData, onNext, onPrev }: StepMediaCatalogProps) => {
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');

  // Filter media based on selected sectors
  const filteredMedia = useMemo(() => {
    let result = MEDIA_CATALOG;
    
    // Filter by selected sectors
    if (data.sectors.length > 0) {
      result = result.filter(media => 
        media.sectors.some(sector => data.sectors.includes(sector))
      );
    }
    
    // Filter by media type
    if (filterType !== 'all') {
      result = result.filter(media => media.type === filterType);
    }
    
    return result;
  }, [data.sectors, filterType]);

  const toggleMedia = (mediaId: string) => {
    const current = data.selectedMedia;
    const updated = current.includes(mediaId)
      ? current.filter((id) => id !== mediaId)
      : [...current, mediaId];
    updateData({ selectedMedia: updated });
  };

  const getMediaTypeColor = (type: MediaType) => {
    switch (type) {
      case 'newspaper': return 'bg-blue-500';
      case 'digital': return 'bg-purple-500';
      case 'radio': return 'bg-green-500';
      case 'outdoor': return 'bg-orange-500';
    }
  };

  const isValid = data.selectedMedia.length > 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Newspaper className="w-4 h-4" />
          שלב 3 מתוך 4
        </div>
        <h1 className="text-3xl font-bold text-foreground">איפה מפרסמים?</h1>
        <p className="text-lg text-muted-foreground">
          בחר את הערוצים שמתאימים לציבור שבחרת – הכל מסודר פה יפה
        </p>
      </div>

      {/* Smart Filter Notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Filter className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">סינון חכם פעיל 🎯</p>
          <p className="text-xs text-muted-foreground">
            מציג רק מדיה שמתאימה למגזרים שבחרת – חוסך לך זמן!
          </p>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`
            px-4 py-2 rounded-lg border transition-all duration-200
            ${filterType === 'all' 
              ? 'border-primary bg-primary text-primary-foreground' 
              : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }
          `}
        >
          הכל ({filteredMedia.length})
        </button>
        {(Object.keys(mediaTypeLabels) as MediaType[]).map((type) => {
          const count = filteredMedia.filter(m => m.type === type).length;
          const typeInfo = mediaTypeLabels[type];
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
                ${filterType === type 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                }
              `}
            >
              {typeInfo.icon}
              {typeInfo.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Media Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredMedia.map((media) => {
          const isSelected = data.selectedMedia.includes(media.id);
          const typeInfo = mediaTypeLabels[media.type];
          
          return (
            <button
              key={media.id}
              onClick={() => toggleMedia(media.id)}
              className={`
                group p-5 rounded-xl border-2 transition-all duration-300 text-right
                hover:shadow-lg hover:scale-[1.01]
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border bg-card hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs text-background ${getMediaTypeColor(media.type)}`}>
                    {typeInfo.label}
                  </span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-1">{media.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{media.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary font-medium">{media.price}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {media.reach}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredMedia.length === 0 && (
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">אוי, לא נמצאו ערוצי מדיה מתאימים לסינון הנוכחי</p>
        </div>
      )}

      {/* Selection Summary */}
      {data.selectedMedia.length > 0 && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4">
          <p className="text-sm text-foreground">
            <span className="font-bold text-success">שכוייח! </span>
            {data.selectedMedia.length} ערוצים נבחרו: {' '}
            {MEDIA_CATALOG.filter(m => data.selectedMedia.includes(m.id)).map(m => m.name).join(', ')}
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button 
          variant="gradient" 
          size="lg"
          onClick={onNext}
          disabled={!isValid}
        >
          הלאה לסיכום!
        </Button>
        <Button 
          variant="ghost" 
          size="lg"
          onClick={onPrev}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          רגע, חזרה
        </Button>
      </div>
    </div>
  );
};

export default StepMediaCatalog;
