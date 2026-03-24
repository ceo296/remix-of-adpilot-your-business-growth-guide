import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Sparkles, PenLine, Mic, Clock, Volume2, Play, User, UserRound, Upload, Square, MicOff, LayoutTemplate } from 'lucide-react';
import { StyleChoice } from './StudioStyleStep';
import { MediaType } from './StudioMediaTypeStep';
import { AdTemplates, AdTemplate } from './AdTemplates';
import { cn } from '@/lib/utils';

// AspectRatio is kept for API compatibility but not user-selectable
export type AspectRatio = 'square' | 'portrait' | 'landscape';
export type PromptMode = 'surprise' | 'idea' | null;
export type VoiceType = 'male-young' | 'male-mature' | 'female-young' | 'female-mature' | null;

interface StudioPromptStepProps {
  visualPrompt: string;
  onVisualPromptChange: (value: string) => void;
  textPrompt: string;
  onTextPromptChange: (value: string) => void;
  style: StyleChoice | null;
  hasProduct: boolean;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (value: AspectRatio) => void;
  promptMode?: PromptMode;
  onPromptModeChange?: (mode: PromptMode) => void;
  mediaType?: MediaType | null;
  selectedTemplate?: AdTemplate | null;
  onTemplateChange?: (template: AdTemplate | null) => void;
}

const PROMPT_SUGGESTIONS: Record<StyleChoice, string[]> = {
  naki: [
    'רקע לבן נקי, תאורה סטודיו מקצועית',
    'מינימליסטי, הרבה רווח לבן',
    'מראה מודרני וטכנולוגי',
  ],
  boet: [
    'רקע שחור דרמטי עם אדום',
    'תאורה חזקה עם צללים',
    'מודעת מכירה אגרסיבית',
  ],
  classic: [
    'רקע עם טקסטורת זהב יוקרתית',
    'אווירה חגיגית ומכובדת',
    'מראה עשיר עם פרטים מוזהבים',
  ],
  modern: [
    'תאורה רכה ופסטלית',
    'אווירה חמה ומזמינה',
    'צבעים רכים ונעימים',
  ],
};

const RADIO_DURATIONS = [
  { id: '15', label: '15 שניות', description: 'קצר ותכליתי' },
  { id: '30', label: '30 שניות', description: 'סטנדרטי' },
  { id: '45', label: '45 שניות', description: 'מפורט' },
  { id: '60', label: 'דקה', description: 'מלא' },
];

const VOICE_OPTIONS: {
  id: VoiceType;
  label: string;
  description: string;
  gender: 'male' | 'female';
  sampleText: string;
}[] = [
  { 
    id: 'male-young', 
    label: 'גברי צעיר', 
    description: 'קול אנרגטי ודינמי',
    gender: 'male',
    sampleText: 'שלום! אני הקול שלכם לספוט הבא'
  },
  { 
    id: 'male-mature', 
    label: 'גברי בוגר', 
    description: 'קול סמכותי ומכובד',
    gender: 'male',
    sampleText: 'שלום! אני הקול שלכם לספוט הבא'
  },
  { 
    id: 'female-young', 
    label: 'נשי צעיר', 
    description: 'קול רענן ומזמין',
    gender: 'female',
    sampleText: 'שלום! אני הקול שלכם לספוט הבא'
  },
  { 
    id: 'female-mature', 
    label: 'נשי בוגר', 
    description: 'קול חם ומקצועי',
    gender: 'female',
    sampleText: 'שלום! אני הקול שלכם לספוט הבא'
  },
];

export const StudioPromptStep = ({
  visualPrompt,
  onVisualPromptChange,
  textPrompt,
  onTextPromptChange,
  style,
  hasProduct,
  promptMode: externalPromptMode,
  onPromptModeChange,
  mediaType,
  selectedTemplate,
  onTemplateChange,
}: StudioPromptStepProps) => {
  const [internalPromptMode, setInternalPromptMode] = useState<PromptMode>(null);
  const [radioDuration, setRadioDuration] = useState<string>('30');
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>(null);
  const [playingVoice, setPlayingVoice] = useState<VoiceType>(null);
  const [voiceMode, setVoiceMode] = useState<'select' | 'record' | 'upload'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Use external state if provided, otherwise use internal
  const promptMode = externalPromptMode !== undefined ? externalPromptMode : internalPromptMode;
  const setPromptMode = onPromptModeChange || setInternalPromptMode;

  const suggestions = style ? PROMPT_SUGGESTIONS[style] : [];

  const handleSurpriseMe = () => {
    setPromptMode('surprise');
    // Auto-generate a prompt based on style
    const stylePrompts: Record<StyleChoice, string> = {
      naki: 'עיצוב נקי ומודרני, תאורת סטודיו מקצועית, רקע לבן מינימליסטי',
      boet: 'עיצוב דרמטי ובולט, ניגודיות גבוהה, אנרגיה חזקה ומכירתית',
      classic: 'עיצוב יוקרתי ומכובד, טקסטורות עשירות, תחושה פרימיום',
      modern: 'עיצוב עדכני וחם, תאורה רכה, אווירה נעימה ומזמינה',
    };
    if (style) {
      onVisualPromptChange(stylePrompts[style]);
    }
  };

  // Radio-specific UI
  if (mediaType === 'radio') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
            <Mic className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            בוא ניצור את הספוט שלך
          </h2>
          <p className="text-muted-foreground text-lg">
            מה המסר שתרצה להעביר בשידור?
          </p>
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          {/* Duration Selection */}
          <div>
            <Label className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              אורך הספוט
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {RADIO_DURATIONS.map((duration) => (
                <button
                  key={duration.id}
                  onClick={() => setRadioDuration(duration.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center",
                    radioDuration === duration.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="block font-bold text-foreground">{duration.label}</span>
                  <span className="text-xs text-muted-foreground">{duration.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Script/Message */}
          <div>
            <Label className="font-medium mb-2 block">המסר המרכזי / תסריט</Label>
            <Textarea
              value={textPrompt}
              onChange={(e) => onTextPromptChange(e.target.value)}
              placeholder="למשל: מבצע ענק לחג! 50% הנחה על כל המוצרים. רק השבוע ברשת חנויות כהן. בואו והתרשמו! כהן - הבחירה הנכונה."
              className="min-h-[150px] resize-none text-base"
            />
            <p className="text-xs text-muted-foreground mt-2">
              כתוב את הטקסט המלא שתרצה לשמוע בספוט
            </p>
          </div>

          {/* Voice Mode Selection */}
          <div>
            <Label className="font-medium mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              מקור הקריינות
            </Label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setVoiceMode('select')}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all text-center",
                  voiceMode === 'select'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <User className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <span className="block text-sm font-medium">קריין מוכן</span>
              </button>
              <button
                onClick={() => setVoiceMode('record')}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all text-center",
                  voiceMode === 'record'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Mic className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <span className="block text-sm font-medium">הקלטה עצמית</span>
              </button>
              <button
                onClick={() => setVoiceMode('upload')}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all text-center",
                  voiceMode === 'upload'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <span className="block text-sm font-medium">העלאת תשדיר</span>
              </button>
            </div>

            {/* Voice Selection Grid */}
            {voiceMode === 'select' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {VOICE_OPTIONS.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => {
                        setSelectedVoice(voice.id);
                        onVisualPromptChange(voice.label);
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-right relative",
                        selectedVoice === voice.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          voice.gender === 'male' ? "bg-blue-100" : "bg-pink-100"
                        )}>
                          {voice.gender === 'male' 
                            ? <User className="w-5 h-5 text-blue-600" />
                            : <UserRound className="w-5 h-5 text-pink-600" />
                          }
                        </div>
                        <div className="flex-1">
                          <span className="block font-bold text-foreground">{voice.label}</span>
                          <span className="text-xs text-muted-foreground">{voice.description}</span>
                        </div>
                      </div>
                      
                      {/* Play Sample Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingVoice(voice.id);
                          setTimeout(() => setPlayingVoice(null), 2000);
                        }}
                        className={cn(
                          "absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          playingVoice === voice.id 
                            ? "bg-primary text-primary-foreground animate-pulse" 
                            : "bg-muted hover:bg-primary/20"
                        )}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  לחץ על ▶ לשמיעת דוגמה
                </p>
              </div>
            )}

            {/* Recording Interface */}
            {voiceMode === 'record' && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  {!recordedAudio ? (
                    <>
                      <button
                        onClick={() => {
                          if (isRecording) {
                            setIsRecording(false);
                            setRecordedAudio('recorded-audio-placeholder');
                          } else {
                            setIsRecording(true);
                          }
                        }}
                        className={cn(
                          "w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all mb-4",
                          isRecording 
                            ? "bg-destructive text-destructive-foreground animate-pulse" 
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {isRecording ? (
                          <Square className="w-8 h-8" />
                        ) : (
                          <Mic className="w-8 h-8" />
                        )}
                      </button>
                      <p className="font-medium text-foreground">
                        {isRecording ? 'מקליט... לחץ לעצירה' : 'לחץ להתחלת הקלטה'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        הקלט את הספוט בקולך שלך
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                        <Mic className="w-8 h-8 text-success" />
                      </div>
                      <p className="font-medium text-foreground mb-2">ההקלטה נשמרה!</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {/* Play recorded audio */}}
                          className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" /> השמע
                        </button>
                        <button
                          onClick={() => setRecordedAudio(null)}
                          className="px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm"
                        >
                          הקלט מחדש
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upload Interface */}
            {voiceMode === 'upload' && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  {!uploadedFile ? (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadedFile(file);
                        }}
                      />
                      <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">לחץ להעלאת קובץ אודיו</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        MP3, WAV, M4A עד 10MB
                      </p>
                    </label>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                        <Volume2 className="w-8 h-8 text-success" />
                      </div>
                      <p className="font-medium text-foreground mb-1">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {/* Play uploaded audio */}}
                          className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" /> השמע
                        </button>
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm"
                        >
                          הסר קובץ
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tips Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-primary">
                <Lightbulb className="h-4 w-4" />
                טיפים לספוט מוצלח:
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• התחל בהוק מושך תשומת לב</li>
                <li>• הצג את ההצעה/מבצע בבירור</li>
                <li>• סיים בקריאה לפעולה ופרטי התקשרות</li>
                <li>• שמור על קצב זורם וטבעי</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show mode selection first if no mode is chosen
  if (!promptMode) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            איך תרצה ליצור את התמונה?
          </h2>
          <p className="text-muted-foreground text-lg">
            בחר את הדרך שמתאימה לך
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Surprise Me */}
          <button
            onClick={handleSurpriseMe}
            className="group relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300 bg-border hover:bg-gradient-to-r hover:from-primary hover:via-primary/80 hover:to-primary/60 hover:shadow-lg"
          >
            <Card className="h-full rounded-[14px] bg-card group-hover:bg-card/95 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">תפתיעו אותי!</h3>
                <p className="text-muted-foreground text-sm">
                  נייצר עבורך קריאייטיב מושלם על בסיס הסגנון שבחרת
                </p>
              </CardContent>
            </Card>
          </button>

          {/* I Have an Idea */}
          <button
            onClick={() => setPromptMode('idea')}
            className="group relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300 bg-border hover:bg-gradient-to-r hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 hover:shadow-lg"
          >
            <Card className="h-full rounded-[14px] bg-card group-hover:bg-card/95 transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PenLine className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">יש לי רעיון</h3>
                <p className="text-muted-foreground text-sm">
                  אתאר בעצמי מה אני רוצה לראות בתמונה
                </p>
              </CardContent>
            </Card>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {promptMode === 'surprise' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">יצרנו עבורך תיאור</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600">
              <PenLine className="w-4 h-4" />
              <span className="text-sm font-medium">תאר את הרעיון שלך</span>
            </div>
          )}
          <button 
            onClick={() => setPromptMode(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            שנה בחירה
          </button>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {hasProduct ? 'תאר את האווירה הרצויה' : 'תאר את התמונה שתיווצר'}
        </h2>
        <p className="text-muted-foreground">
          {hasProduct 
            ? 'איזה רקע ואווירה ליצור סביב המוצר?' 
            : 'מה רואים בתמונה?'}
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">

        {/* Template Selection Button */}
        {onTemplateChange && (
          <div>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between",
                selectedTemplate 
                  ? "border-primary bg-primary/5" 
                  : "border-dashed border-muted-foreground/30 hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutTemplate className="w-5 h-5 text-primary" />
                <div className="text-right">
                  <span className="font-medium">
                    {selectedTemplate ? selectedTemplate.name : 'בחר תבנית מוכנה'}
                  </span>
                   {selectedTemplate && (
                    <span className="text-xs text-muted-foreground block">
                      {selectedTemplate.description}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-primary">
                {showTemplates ? 'סגור' : 'בחר'}
              </span>
            </button>
            
            {showTemplates && (
              <Card className="mt-3 p-4">
                <AdTemplates
                  selectedTemplate={selectedTemplate || null}
                  onSelect={(template) => {
                    onTemplateChange(template);
                    setShowTemplates(false);
                  }}
                  mediaType={mediaType || undefined}
                />
              </Card>
            )}
          </div>
        )}

        {/* Visual Prompt */}
        <div>
          <Label className="font-medium mb-2 block">תיאור התמונה / הרקע</Label>
          <Textarea
            value={visualPrompt}
            onChange={(e) => onVisualPromptChange(e.target.value)}
            placeholder={hasProduct 
              ? 'למשל: רקע עם טקסטורת עץ חמה, תאורה רכה מהצד...'
              : 'למשל: משפחה חרדית שמחה סביב שולחן שבת, אור חם, אווירה חגיגית...'
            }
            className="min-h-[120px] resize-none text-base"
          />
        </div>

        {/* Style Suggestions */}
        {suggestions.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-warning" />
                רעיונות לסגנון שבחרת:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onVisualPromptChange(visualPrompt ? `${visualPrompt}, ${suggestion}` : suggestion)}
                    className="text-xs px-3 py-1.5 bg-background rounded-full border hover:border-primary transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Text Prompt */}
        <div>
          <Label className="font-medium mb-2 block">מה הטקסט שיהיה כתוב בתמונה?</Label>
          <Input
            value={textPrompt}
            onChange={(e) => onTextPromptChange(e.target.value)}
            placeholder="למשל: שבת שלום, מבצע ענק, חג שמח..."
            className="text-lg h-12"
          />
          <p className="text-xs text-muted-foreground mt-2">
            הטקסט יירנדר בעברית מושלמת 🇮🇱
          </p>
        </div>
      </div>
    </div>
  );
};
