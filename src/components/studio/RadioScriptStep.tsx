import { useState } from 'react';
import { Radio, Mic, Play, Pause, Check, Pencil, Loader2, Volume2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface VoiceDirection {
  gender: string;
  style: string;
  tone: string;
  pace: string;
  notes: string;
}

interface RadioScript {
  id: string;
  title: string;
  description: string;
  script: string;
  scriptWithNikud: string;
  duration: string;
  voiceNotes: string;
}

interface RadioScriptData {
  voiceDirection: VoiceDirection;
  scripts: RadioScript[];
}

type Phase = 'generating' | 'voice-review' | 'script-select' | 'script-edit' | 'tts-generating' | 'complete';

interface RadioScriptStepProps {
  brief: {
    offer: string;
    adGoal?: string | null;
    goal?: string | null;
    emotionalTone?: string | null;
    priceOrBenefit?: string | null;
    timeLimitText?: string | null;
  };
  brandContext: {
    businessName: string;
    targetAudience?: string | null;
  } | null;
  targetGender?: string;
  targetStream?: string;
  contactPhone?: string;
  onComplete?: () => void;
  clientProfileId?: string;
  campaignId?: string;
}

export const RadioScriptStep = ({
  brief,
  brandContext,
  targetGender = '',
  targetStream = '',
  contactPhone = '',
  onComplete,
  clientProfileId,
  campaignId,
}: RadioScriptStepProps) => {
  const [phase, setPhase] = useState<Phase>('generating');
  const [data, setData] = useState<RadioScriptData | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [editedScript, setEditedScript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateScripts = async () => {
    setPhase('generating');
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-radio-script', {
        body: { brief, brandContext, targetGender, targetStream, contactPhone },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setData(result);
      setPhase('voice-review');
      setHasGenerated(true);
    } catch (e) {
      console.error('Script generation failed:', e);
      toast.error('שגיאה ביצירת התסריטים');
      setPhase('generating');
    }
  };

  // Auto-generate on first render
  if (!hasGenerated && phase === 'generating') {
    generateScripts();
  }

  const handleApproveVoice = () => {
    setPhase('script-select');
  };

  const handleSelectScript = (scriptId: string) => {
    setSelectedScriptId(scriptId);
    const script = data?.scripts.find(s => s.id === scriptId);
    if (script) {
      setEditedScript(script.scriptWithNikud || script.script);
    }
    setPhase('script-edit');
  };

  const handleApproveScript = async () => {
    setPhase('tts-generating');
    setIsTtsLoading(true);

    try {
      const { data: ttsResult, error } = await supabase.functions.invoke('generate-radio-tts', {
        body: {
          script: editedScript,
          voiceDirection: data?.voiceDirection,
        },
      });

      if (error) throw error;

      if (ttsResult?.audioAvailable && ttsResult?.audioBase64) {
        const binaryStr = atob(ttsResult.audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: ttsResult.mimeType || 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        toast.success('הקריינות מוכנה! 🎙️');
      } else {
        toast.info(ttsResult?.message || 'קריינות אינה זמינה כרגע');
      }

      setPhase('complete');
    } catch (e) {
      console.error('TTS generation failed:', e);
      toast.error('שגיאה ביצירת הקריינות');
      setPhase('script-edit');
    } finally {
      setIsTtsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setAudioElement(audio);
      setIsPlayingAudio(true);
    }
  };

  const selectedScript = data?.scripts.find(s => s.id === selectedScriptId);

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-violet-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          סטודיו רדיו
        </h2>
        <p className="text-muted-foreground">
          {phase === 'generating' && 'יוצר תסריטים מותאמים לקמפיין שלך...'}
          {phase === 'voice-review' && 'אשר את הנחיות הקריינות'}
          {phase === 'script-select' && 'בחר את הגרסה המועדפת'}
          {phase === 'script-edit' && 'ערוך ואשר את התסריט הסופי'}
          {phase === 'tts-generating' && 'מייצר קריינות...'}
          {phase === 'complete' && 'התסריט והקריינות מוכנים!'}
        </p>
      </div>

      {/* Phase: Generating */}
      {phase === 'generating' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mb-4" />
          <p className="text-muted-foreground">הסוכן כותב תסריטים...</p>
        </div>
      )}

      {/* Phase: Voice Direction Review */}
      {phase === 'voice-review' && data?.voiceDirection && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="border-2 border-violet-500/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Mic className="h-6 w-6 text-violet-500" />
                <h3 className="text-lg font-bold">הנחיות קריינות</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">מגדר קריין</span>
                  <p className="font-medium">{data.voiceDirection.gender}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">סגנון</span>
                  <p className="font-medium">{data.voiceDirection.style}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">טון</span>
                  <p className="font-medium">{data.voiceDirection.tone}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">קצב</span>
                  <p className="font-medium">{data.voiceDirection.pace}</p>
                </div>
              </div>

              {data.voiceDirection.notes && (
                <div className="pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">הערות</span>
                  <p className="text-sm mt-1">{data.voiceDirection.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleApproveVoice} className="w-full" variant="gradient" size="lg">
            <Check className="h-5 w-5 ml-2" />
            מאשר הנחיות קריינות - בואו נראה תסריטים
          </Button>
        </div>
      )}

      {/* Phase: Script Selection */}
      {phase === 'script-select' && data?.scripts && (
        <div className="max-w-2xl mx-auto space-y-4">
          {data.scripts.map((script) => (
            <Card
              key={script.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg border-2',
                'hover:border-violet-500/50'
              )}
              onClick={() => handleSelectScript(script.id)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{script.title}</h3>
                    <p className="text-sm text-muted-foreground">{script.description}</p>
                  </div>
                  <Badge variant="secondary">{script.duration}</Badge>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {script.script}
                </div>

                {script.voiceNotes && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Mic className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{script.voiceNotes}</span>
                  </div>
                )}

                <Button variant="outline" className="w-full gap-2">
                  <Check className="h-4 w-4" />
                  בחר גרסה זו
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Phase: Script Edit */}
      {phase === 'script-edit' && selectedScript && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{selectedScript.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-1.5"
                >
                  <Pencil className="h-4 w-4" />
                  {isEditing ? 'סיום עריכה' : 'ערוך תסריט'}
                </Button>
              </div>

              {isEditing ? (
                <Textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  className="min-h-[200px] text-sm leading-relaxed"
                  dir="rtl"
                />
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {editedScript}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedScriptId(null);
                    setPhase('script-select');
                  }}
                >
                  חזרה לבחירת גרסה
                </Button>
                <Button
                  onClick={handleApproveScript}
                  variant="gradient"
                  className="flex-1 gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  אשר והפק קריינות
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phase: TTS Generating */}
      {phase === 'tts-generating' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mb-4" />
          <p className="text-muted-foreground">מייצר קריינות עם Google AI...</p>
          <p className="text-xs text-muted-foreground mt-2">זה יכול לקחת כמה שניות</p>
        </div>
      )}

      {/* Phase: Complete */}
      {phase === 'complete' && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Final Script */}
          <Card className="border-2 border-green-500/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-bold">התסריט הסופי</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {editedScript}
              </div>
            </CardContent>
          </Card>

          {/* Audio Player */}
          {audioUrl && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={togglePlayback}
                    size="lg"
                    className={cn(
                      'rounded-full w-14 h-14 p-0',
                      isPlayingAudio
                        ? 'bg-violet-500 hover:bg-violet-600'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600'
                    )}
                  >
                    {isPlayingAudio ? (
                      <Pause className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="h-6 w-6 text-white mr-[-2px]" />
                    )}
                  </Button>
                  <div>
                    <p className="font-medium">הקריינות מוכנה</p>
                    <p className="text-sm text-muted-foreground">לחץ להאזנה</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => {
              setHasGenerated(false);
              setData(null);
              setPhase('generating');
              setAudioUrl(null);
              setSelectedScriptId(null);
            }} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              תסריטים חדשים
            </Button>
            {audioUrl && (
              <Button variant="outline" onClick={() => {
                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = `radio-script-${brandContext?.businessName || 'ad'}.mp3`;
                a.click();
              }} className="gap-2">
                <Volume2 className="h-4 w-4" />
                הורד אודיו
              </Button>
            )}
            {onComplete && (
              <Button onClick={onComplete} variant="gradient" className="flex-1">
                המשך לקמפיין
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RadioScriptStep;
