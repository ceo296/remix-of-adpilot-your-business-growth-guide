import { useState } from 'react';
import { Heart, DollarSign, Smile, Sparkles, Loader2, RefreshCw, Wand2, Newspaper, Radio, Monitor, RectangleHorizontal, Share2, Layers, Check, Image, Calendar, Target, Gift, Tag, Megaphone, Zap } from 'lucide-react';
import { AutopilotLoadingProgress } from './AutopilotLoadingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MediaType } from './StudioMediaTypeStep';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type HolidaySeason = 'pesach' | 'sukkot' | 'chanukah' | 'purim' | 'shavuot' | 'lag_baomer' | 'tu_bishvat' | 'summer' | 'bein_hazmanim' | 'rosh_hashana' | 'yom_kippur' | 'year_round' | '';

// Ordered with "year_round" first as the primary option
export const HOLIDAY_LABELS: Record<string, string> = {
  year_round: 'כל השנה',
  rosh_hashana: 'ראש השנה',
  yom_kippur: 'ימים נוראים',
  sukkot: 'סוכות',
  chanukah: 'חנוכה',
  tu_bishvat: 'ט"ו בשבט',
  purim: 'פורים',
  pesach: 'פסח',
  lag_baomer: 'ל"ג בעומר',
  shavuot: 'שבועות',
  summer: 'קיץ',
  bein_hazmanim: 'בין הזמנים',
};

export interface CreativeConcept {
  id: string;
  type: 'emotional' | 'hard-sale' | 'pain-point';
  headline: string;
  idea: string;
  copy: string;
  mediaType?: MediaType;
}

interface ClientInfo {
  business_name: string;
  target_audience: string | null;
}

export type CampaignGoal = 'awareness' | 'promotion' | 'launch' | 'seasonal' | 'other';

export interface AutopilotBrief {
  offer: string;
  goal: CampaignGoal | null;
}

interface StudioAutopilotProps {
  isGenerating: boolean;
  concepts: CreativeConcept[];
  selectedConcept: CreativeConcept | null;
  clientInfo: ClientInfo | null;
  selectedMediaTypes: MediaType[];
  onMediaTypesChange: (types: MediaType[]) => void;
  onGenerateConcepts: () => void;
  onSelectConcept: (concept: CreativeConcept) => void;
  onExecuteConcept: () => void;
  selectedHoliday?: HolidaySeason;
  onHolidayChange?: (holiday: HolidaySeason) => void;
  // New brief props
  brief?: AutopilotBrief;
  onBriefChange?: (brief: AutopilotBrief) => void;
}

const CONCEPT_ICONS = {
  'emotional': Heart,
  'hard-sale': DollarSign,
  'pain-point': Smile,
};

const CONCEPT_COLORS = {
  'emotional': 'border-pink-500/50 bg-pink-500/5',
  'hard-sale': 'border-amber-500/50 bg-amber-500/5',
  'pain-point': 'border-emerald-500/50 bg-emerald-500/5',
};

// Media options with vibrant color schemes
const MEDIA_OPTIONS: { 
  id: MediaType; 
  label: string; 
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
}[] = [
  { id: 'radio', label: 'רדיו', icon: Radio, gradient: 'from-violet-500 to-purple-600', shadowColor: 'shadow-purple-500/30' },
  { id: 'ad', label: 'מודעות', icon: Newspaper, gradient: 'from-blue-500 to-cyan-500', shadowColor: 'shadow-cyan-500/30' },
  { id: 'banner', label: 'באנרים', icon: Monitor, gradient: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-teal-500/30' },
  { id: 'billboard', label: 'שלטי חוצות', icon: RectangleHorizontal, gradient: 'from-orange-500 to-amber-500', shadowColor: 'shadow-amber-500/30' },
  { id: 'social', label: 'סושיאל', icon: Share2, gradient: 'from-pink-500 to-rose-500', shadowColor: 'shadow-rose-500/30' },
  { id: 'all', label: 'קמפיין 360°', icon: Layers, gradient: 'from-primary to-red-500', shadowColor: 'shadow-primary/30' },
];

// Truncate text helper
const truncateText = (text: string | undefined | null, maxLength: number = 120): string => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Simplified visual suggestion - just a few words
const getVisualSuggestion = (concept: CreativeConcept): string => {
  // Extract a short visual hint from the idea
  const idea = concept.idea || '';
  // Take first sentence or first 30 chars
  const firstSentence = idea.split('.')[0] || idea.split(',')[0] || idea;
  return firstSentence.length > 40 ? firstSentence.substring(0, 40) + '...' : firstSentence;
};

const GOAL_OPTIONS: { id: CampaignGoal; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'awareness', label: 'מודעות למותג', description: 'להציג את העסק', icon: Megaphone },
  { id: 'promotion', label: 'סייל / מבצע', description: 'לקדם הצעה', icon: Tag },
  { id: 'launch', label: 'השקה', description: 'מוצר/שירות חדש', icon: Zap },
  { id: 'seasonal', label: 'עונתי / חג', description: 'קמפיין עונתי', icon: Calendar },
];

export const StudioAutopilot = ({
  isGenerating,
  concepts,
  selectedConcept,
  clientInfo,
  selectedMediaTypes,
  onMediaTypesChange,
  onGenerateConcepts,
  onSelectConcept,
  onExecuteConcept,
  selectedHoliday = '',
  onHolidayChange,
  brief = { offer: '', goal: null },
  onBriefChange,
}: StudioAutopilotProps) => {
  const handleToggleMediaType = (id: MediaType) => {
    // If selecting 'all', clear others and select only 'all'
    if (id === 'all') {
      if (selectedMediaTypes.includes('all')) {
        onMediaTypesChange([]);
      } else {
        onMediaTypesChange(['all']);
      }
      return;
    }

    // If selecting individual type, remove 'all' if present
    let newValue = selectedMediaTypes.filter(v => v !== 'all');
    
    if (newValue.includes(id)) {
      newValue = newValue.filter(v => v !== id);
    } else {
      newValue = [...newValue, id];
    }
    
    onMediaTypesChange(newValue);
  };

  const isSelected = (id: MediaType) => selectedMediaTypes.includes(id);
  const primaryMediaType = selectedMediaTypes[0] || null;
  // Initial state - no concepts yet
  if (concepts.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">מצב אוטומטי</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          תשברו אתם את הראש במקומי. המערכת תיצור 3 כיווני קריאייטיב מבוססי האסטרטגיה שלכם.
        </p>
        
        {/* Campaign Brief Section - REQUIRED */}
        {onBriefChange && (
          <div className="w-full max-w-2xl mb-8 text-right">
            {/* Campaign Offer */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-sm mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/30 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-foreground">מה ההצעה הפרסומית? *</Label>
                  <p className="text-xs text-muted-foreground">בלי זה אי אפשר ליצור קמפיין מותאם</p>
                </div>
              </div>
              <Textarea
                value={brief.offer}
                onChange={(e) => onBriefChange({ ...brief, offer: e.target.value })}
                placeholder="תאר בקצרה את המסר המרכזי. לדוגמה: 30% הנחה על כל מערכות הישיבה, השקת טעמים חדשים..."
                className="min-h-[80px] text-base bg-white text-gray-900 border-primary/20 focus:border-primary placeholder:text-gray-400"
                dir="rtl"
              />
            </div>

            {/* Campaign Goal */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">מה המטרה של הקמפיין?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GOAL_OPTIONS.map((goal) => (
                  <Card
                    key={goal.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 border-2',
                      brief.goal === goal.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/30'
                    )}
                    onClick={() => onBriefChange({ ...brief, goal: goal.id })}
                  >
                    <CardContent className="p-3 text-center">
                      <div className={cn(
                        'w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-1',
                        brief.goal === goal.id ? 'bg-primary/20' : 'bg-muted'
                      )}>
                        <goal.icon className={cn(
                          'w-4 h-4',
                          brief.goal === goal.id ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <p className="font-medium text-xs">{goal.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Media Type Selection */}
        <div className="w-full max-w-2xl mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">איזה חומר פרסומי תרצו ליצור? (ניתן לבחור כמה)</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {MEDIA_OPTIONS.map((option) => (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all duration-300 border-2 relative group hover:scale-105',
                  isSelected(option.id)
                    ? `border-transparent bg-gradient-to-br ${option.gradient} shadow-lg ${option.shadowColor}`
                    : 'border-border hover:border-primary/50 bg-card'
                )}
                onClick={() => handleToggleMediaType(option.id)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                    isSelected(option.id) 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-br ${option.gradient} shadow-md ${option.shadowColor}`
                  )}>
                    <option.icon className={cn(
                      'w-6 h-6 transition-transform group-hover:scale-110',
                      isSelected(option.id) ? 'text-white' : 'text-white'
                    )} />
                  </div>
                  <span className={cn(
                    'text-sm font-semibold',
                    isSelected(option.id) ? 'text-white' : 'text-foreground'
                  )}>
                    {option.label}
                  </span>
                  {isSelected(option.id) && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Holiday/Season Selection - Enhanced Design */}
        {onHolidayChange && (
          <div className="w-full max-w-md mb-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label className="text-base font-semibold text-foreground">חג/עונה</Label>
                  <p className="text-xs text-muted-foreground">אופציונלי - להתאמת סגנון</p>
                </div>
              </div>
              <Select 
                value={selectedHoliday} 
                onValueChange={(v) => onHolidayChange(v as HolidaySeason)}
              >
                <SelectTrigger className="w-full h-12 bg-white text-gray-900 border-amber-200 hover:border-amber-400 transition-colors text-base">
                  <SelectValue placeholder="בחר חג או עונה רלוונטית לקמפיין" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border-amber-200">
                  {Object.entries(HOLIDAY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-base py-3 hover:bg-amber-50 cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-700/70 mt-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                בחירת חג תביא דוגמאות מותאמות לעונה ותשפיע על סגנון הקריאייטיב
              </p>
            </div>
          </div>
        )}
        
        {/* Personalized info card - Enhanced Design */}
        {clientInfo && selectedHoliday && selectedHoliday !== 'year_round' && (
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 rounded-2xl p-5 mb-6 max-w-md shadow-sm">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
              <Calendar className="h-3 w-3 ml-1" />
              {HOLIDAY_LABELS[selectedHoliday]}
            </Badge>
          </div>
        )}
        
        <Button
          size="lg"
          variant="gradient"
          onClick={onGenerateConcepts}
          disabled={selectedMediaTypes.length === 0 || !brief.offer.trim()}
          className="text-lg px-8"
        >
          <Wand2 className="h-5 w-5 ml-2" />
          תעצבו לי סקיצות על בסיס האסטרטגיה
        </Button>
        
        {selectedMediaTypes.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">יש לבחור סוג מדיה להמשך</p>
        )}
        {selectedMediaTypes.length > 0 && !brief.offer.trim() && (
          <p className="text-xs text-destructive mt-2">יש להזין הצעה פרסומית להמשך</p>
        )}
      </div>
    );
  }

  // Loading state with progress steps
  if (isGenerating && concepts.length === 0) {
    return <AutopilotLoadingProgress />;
  }

  // Get media type label
  const getMediaLabel = () => {
    if (selectedMediaTypes.length === 0) return 'קריאייטיב';
    if (selectedMediaTypes.includes('all')) return 'קמפיין 360°';
    if (selectedMediaTypes.length === 1) {
      const media = MEDIA_OPTIONS.find(m => m.id === selectedMediaTypes[0]);
      return media?.label || 'קריאייטיב';
    }
    return `${selectedMediaTypes.length} סוגי מדיה`;
  };

  // Concepts display
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3">
          {primaryMediaType === 'radio' ? '🎙️' : primaryMediaType === 'billboard' ? '🪧' : primaryMediaType === 'social' ? '📱' : '📰'} {getMediaLabel()}
        </Badge>
        <h2 className="text-2xl font-bold mb-2">בחרו את הזווית שמדברת אליכם</h2>
        <p className="text-muted-foreground">
          3 כיוונים שונים מבוססי האסטרטגיה שלכם
        </p>
      </div>

      <div className="grid gap-4">
        {concepts.map((concept) => {
          const Icon = CONCEPT_ICONS[concept.type];
          const colorClass = CONCEPT_COLORS[concept.type];
          const isConceptSelected = selectedConcept?.id === concept.id;

          // Get type label in Hebrew
          const typeLabel = concept.type === 'emotional' ? 'רגשי' : 
                           concept.type === 'hard-sale' ? 'מכירתי' : 'כאב ופתרון';

          return (
            <Card
              key={concept.id}
              onClick={() => onSelectConcept(concept)}
              className={cn(
                "cursor-pointer transition-all duration-200 border-2 overflow-hidden",
                colorClass,
                isConceptSelected && "ring-2 ring-primary ring-offset-2",
                "hover:shadow-lg"
              )}
            >
              {/* Simplified content - headline + subheadline + visual hint */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Badge + Main Headline */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        concept.type === 'emotional' && "bg-pink-500/20 text-pink-500",
                        concept.type === 'hard-sale' && "bg-amber-500/20 text-amber-500",
                        concept.type === 'pain-point' && "bg-emerald-500/20 text-emerald-500",
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    
                    {/* Main Headline */}
                    <h3 className="text-xl font-bold text-foreground mb-2" dir="rtl">
                      {concept.headline}
                    </h3>
                    
                    {/* Subheadline - short copy */}
                    <p className="text-sm text-muted-foreground mb-3" dir="rtl">
                      {truncateText(concept.copy, 60)}
                    </p>
                    
                    {/* Visual Suggestion - just a few words */}
                    <div className="flex items-center gap-2 text-xs">
                      <Image className="h-4 w-4 text-primary/60" />
                      <span className="text-primary/80 font-medium">הצעה לוויזואל:</span>
                      <span className="text-muted-foreground">{getVisualSuggestion(concept)}</span>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {isConceptSelected && (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Actions - single CTA to design immediately */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
        <Button variant="outline" onClick={onGenerateConcepts} disabled={isGenerating}>
          <RefreshCw className={cn("h-4 w-4 ml-2", isGenerating && "animate-spin")} />
          רעיונות חדשים
        </Button>
        
        <Button
          variant="gradient"
          size="lg"
          onClick={onExecuteConcept}
          disabled={!selectedConcept || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              מעצב...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 ml-2" />
              תראה לי את זה מעוצב
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
