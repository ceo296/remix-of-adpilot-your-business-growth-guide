import { useState, useCallback } from 'react';
import { Radio, Mic, Play, Pause, Check, Loader2, Volume2, RefreshCw, Heart, Wrench, ArrowRight, Sparkles } from 'lucide-react';
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

type Phase = 
  | 'generating' 
  | 'script-select'      // Choose from 2-3 text options
  | 'text-fix'           // Fix text before voiceover
  | 'text-approved'      // Text approved, CTA to generate voiceover
  | 'tts-generating'     // Generating voiceover
  | 'voiceover-ready'    // Voiceover done, listen + fix options
  | 'voice-fix';         // Fix voiceover (change gender, tone, etc.)

type TextFixType = 'message' | 'length' | 'add-content' | null;
type VoiceFixType = 'gender' | 'tone' | 'regenerate' | null;

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [textFixType, setTextFixType] = useState<TextFixType>(null);
  const [fixInstruction, setFixInstruction] = useState('');
  const [voiceFixType, setVoiceFixType] = useState<VoiceFixType>(null);
  const [voiceFixInstruction, setVoiceFixInstruction] = useState('');
  const [isFixingText, setIsFixingText] = useState(false);

  const generateScripts = useCallback(async () => {
    setPhase('generating');
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-radio-script', {
        body: { brief, brandContext, targetGender, targetStream, contactPhone },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setData(result);
      setPhase('script-select');
      setHasGenerated(true);
    } catch (e) {
      console.error('Script generation failed:', e);
      toast.error('שגיאה ביצירת התסריטים');
      setPhase('generating');
    }
  }, [brief, brandContext, targetGender, targetStream, contactPhone]);

  // Auto-generate on first render
  if (!hasGenerated && phase === 'generating') {
    generateScripts();
  }

  const handleSelectScript = (scriptId: string) => {
    setSelectedScriptId(scriptId);
    const script = data?.scripts.find(s => s.id === scriptId);
    if (script) {
      setEditedScript(script.scriptWithNikud || script.script);
    }
  };

  const handleApproveText = () => {
    if (!selectedScriptId) {
      toast.error('בחר גרסה קודם');
      return;
    }
    setPhase('text-approved');
  };

  const handleSubmitTextFix = async () => {
    if (!fixInstruction.trim()) {
      toast.error('כתוב מה לתקן');
      return;
    }
    setIsFixingText(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-radio-script', {
        body: {
          brief,
          brandContext,
          targetGender,
          targetStream,
          contactPhone,
          fixInstruction: fixInstruction.trim(),
          fixType: textFixType,
          originalScript: editedScript,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setData(result);
      setSelectedScriptId(null);
      setTextFixType(null);
      setFixInstruction('');
      setPhase('script-select');
      toast.success('תסריטים חדשים מוכנים!');
    } catch (e) {
      console.error('Fix failed:', e);
      toast.error('שגיאה בתיקון');
    } finally {
      setIsFixingText(false);
    }
  };

  const handleGenerateVoiceover = async () => {
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

      // Save to database
      const script = data?.scripts.find(s => s.id === selectedScriptId);
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user && script) {
        await supabase.from('radio_scripts' as any).insert({
          user_id: userData.user.id,
          client_profile_id: clientProfileId || null,
          campaign_id: campaignId || null,
          script_title: script.title,
          script_text: editedScript,
          script_with_nikud: script.scriptWithNikud || null,
          voice_direction: data?.voiceDirection || null,
          duration: script.duration || null,
          voice_notes: script.voiceNotes || null,
          audio_url: null,
          status: 'completed',
        } as any);
      }

      setPhase('voiceover-ready');
    } catch (e) {
      console.error('TTS generation failed:', e);
      toast.error('שגיאה ביצירת הקריינות');
      setPhase('text-approved');
    } finally {
      setIsTtsLoading(false);
    }
  };

  const handleSubmitVoiceFix = async () => {
    if (!voiceFixInstruction.trim() && voiceFixType !== 'gender' && voiceFixType !== 'regenerate') {
      toast.error('כתוב מה לשנות');
      return;
    }

    // For gender swap or regenerate, modify voice direction and re-generate TTS
    const updatedDirection = { ...data?.voiceDirection };
    if (voiceFixType === 'gender') {
      updatedDirection.gender = updatedDirection.gender === 'גברי' ? 'נשי' : 'גברי';
    }
    if (voiceFixInstruction.trim()) {
      updatedDirection.notes = (updatedDirection.notes || '') + ' | תיקון: ' + voiceFixInstruction;
    }

    if (data) {
      setData({ ...data, voiceDirection: updatedDirection as VoiceDirection });
    }

    setVoiceFixType(null);
    setVoiceFixInstruction('');
    setPhase('tts-generating');
    setIsTtsLoading(true);

    try {
      const { data: ttsResult, error } = await supabase.functions.invoke('generate-radio-tts', {
        body: {
          script: editedScript,
          voiceDirection: updatedDirection,
        },
      });

      if (error) throw error;

      if (ttsResult?.audioAvailable && ttsResult?.audioBase64) {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const binaryStr = atob(ttsResult.audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: ttsResult.mimeType || 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        toast.success('קריינות חדשה מוכנה! 🎙️');
      }

      setPhase('voiceover-ready');
    } catch (e) {
      console.error('TTS fix failed:', e);
      toast.error('שגיאה ביצירת קריינות חדשה');
      setPhase('voiceover-ready');
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

  const phaseLabels: Record<Phase, string> = {
    'generating': 'יוצר תסריטים מותאמים לקמפיין שלך...',
    'script-select': 'בחר את הגרסה המועדפת',
    'text-fix': 'ספר לנו מה לשנות',
    'text-approved': 'הטקסט מוכן! בואו נהפוך אותו לקריינות',
    'tts-generating': 'מייצר קריינות...',
    'voiceover-ready': 'הקריינות מוכנה! 🎉',
    'voice-fix': 'מה לשנות בקריינות?',
  };

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
        <p className="text-muted-foreground">{phaseLabels[phase]}</p>
      </div>

      {/* Phase: Generating */}
      {phase === 'generating' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mb-4" />
          <p className="text-muted-foreground">הסוכן כותב תסריטים...</p>
        </div>
      )}

      {/* Phase: Script Selection — choose from options */}
      {phase === 'script-select' && data?.scripts && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Voice direction summary badge */}
          {data.voiceDirection && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <Mic className="h-3 w-3" />
                קריין {data.voiceDirection.gender} • {data.voiceDirection.style}
              </Badge>
            </div>
          )}

          {data.scripts.map((script) => {
            const isSelected = selectedScriptId === script.id;
            return (
              <Card
                key={script.id}
                className={cn(
                  'cursor-pointer transition-all border-2',
                  isSelected
                    ? 'border-violet-500 shadow-lg shadow-violet-500/10'
                    : 'border-border hover:border-violet-500/40 hover:shadow-md'
                )}
                onClick={() => handleSelectScript(script.id)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center animate-scale-in">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold">{script.title}</h3>
                        <p className="text-sm text-muted-foreground">{script.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{script.duration}</Badge>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {script.scriptWithNikud || script.script}
                  </div>

                  {script.voiceNotes && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Mic className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{script.voiceNotes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Bottom Actions */}
          <div className="flex flex-col gap-3 items-center max-w-md mx-auto pt-4">
            <Button
              onClick={handleApproveText}
              variant="gradient"
              size="lg"
              className="w-full gap-2"
              disabled={!selectedScriptId}
            >
              <Heart className="h-5 w-5" />
              אהבתי! בואו נמשיך
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() => {
                if (!selectedScriptId) {
                  toast.error('בחר גרסה קודם כדי לבקש תיקונים');
                  return;
                }
                setPhase('text-fix');
              }}
            >
              <Wrench className="h-4 w-4" />
              יש לי תיקונים
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Text Fix */}
      {phase === 'text-fix' && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-bold text-center">מה תרצה לשנות?</h3>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { type: 'message' as const, label: 'לשנות את המסר', desc: 'אני רוצה מסר אחר או הדגשה שונה' },
                  { type: 'length' as const, label: 'לשנות את האורך', desc: 'קצר יותר או ארוך יותר' },
                  { type: 'add-content' as const, label: 'להוסיף תוכן', desc: 'להוסיף מסר או מידע נוסף לתסריט' },
                ].map(opt => (
                  <button
                    key={opt.type}
                    className={cn(
                      'text-right p-4 rounded-xl border-2 transition-all',
                      textFixType === opt.type
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-border hover:border-violet-500/40'
                    )}
                    onClick={() => setTextFixType(opt.type)}
                  >
                    <p className="font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {textFixType && (
                <div className="space-y-3 animate-fade-in">
                  <Textarea
                    value={fixInstruction}
                    onChange={(e) => setFixInstruction(e.target.value)}
                    placeholder={
                      textFixType === 'message' ? 'מה המסר שאתה רוצה במקום?' :
                      textFixType === 'length' ? 'קצר יותר? ארוך יותר? כמה שניות?' :
                      'מה תרצה להוסיף לתסריט?'
                    }
                    className="min-h-[80px]"
                    dir="rtl"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTextFixType(null);
                        setFixInstruction('');
                        setPhase('script-select');
                      }}
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleSubmitTextFix}
                      variant="gradient"
                      className="flex-1 gap-2"
                      disabled={isFixingText || !fixInstruction.trim()}
                    >
                      {isFixingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isFixingText ? 'מעדכן...' : 'צור תסריטים מתוקנים'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phase: Text Approved — CTA to generate voiceover */}
      {phase === 'text-approved' && selectedScript && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="border-2 border-green-500/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-bold">{selectedScript.title}</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {editedScript}
              </div>
              {data?.voiceDirection && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Mic className="h-3.5 w-3.5" />
                  <span>קריין {data.voiceDirection.gender} • {data.voiceDirection.style} • טון {data.voiceDirection.tone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerateVoiceover}
            variant="gradient"
            size="xl"
            className="w-full gap-3"
          >
            <Volume2 className="h-6 w-6" />
            בואו נהפוך את זה לקריינות! 🎙️
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setPhase('script-select')}
          >
            ← חזרה לבחירת גרסה
          </Button>
        </div>
      )}

      {/* Phase: TTS Generating */}
      {phase === 'tts-generating' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mb-4" />
          <p className="text-muted-foreground">מייצר קריינות...</p>
          <p className="text-xs text-muted-foreground mt-2">זה יכול לקחת כמה שניות</p>
        </div>
      )}

      {/* Phase: Voiceover Ready */}
      {phase === 'voiceover-ready' && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Script text */}
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
            <Card className="overflow-hidden">
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
                    <p className="text-sm text-muted-foreground">
                      {data?.voiceDirection?.gender} • {data?.voiceDirection?.style}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 items-center max-w-md mx-auto">
            <div className="flex gap-3 w-full">
              {audioUrl && (
                <Button variant="outline" onClick={() => {
                  const a = document.createElement('a');
                  a.href = audioUrl;
                  a.download = `radio-${brandContext?.businessName || 'script'}.mp3`;
                  a.click();
                }} className="gap-2 flex-1">
                  <Volume2 className="h-4 w-4" />
                  הורד אודיו
                </Button>
              )}
              {onComplete && (
                <Button onClick={onComplete} variant="gradient" className="flex-1 gap-2">
                  <ArrowRight className="h-4 w-4" />
                  המשך לקמפיין
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setPhase('voice-fix')}
            >
              <Wrench className="h-4 w-4" />
              יש לי תיקונים לקריינות
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground gap-2"
              onClick={() => {
                setHasGenerated(false);
                setData(null);
                setPhase('generating');
                setAudioUrl(null);
                setSelectedScriptId(null);
              }}
            >
              <RefreshCw className="h-4 w-4" />
              התחל מחדש
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Voice Fix */}
      {phase === 'voice-fix' && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="text-lg font-bold text-center">מה לשנות בקריינות?</h3>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    type: 'gender' as const,
                    label: data?.voiceDirection?.gender === 'גברי' ? 'החלף לקריינית (נשי)' : 'החלף לקריין (גברי)',
                    desc: 'שנה את מגדר הקריין',
                  },
                  { type: 'tone' as const, label: 'שנה טון/סגנון', desc: 'טונציה שונה, קצב אחר, אנרגיה אחרת' },
                  { type: 'regenerate' as const, label: 'פשוט צור שוב', desc: 'אותן הגדרות, ביצוע חדש' },
                ].map(opt => (
                  <button
                    key={opt.type}
                    className={cn(
                      'text-right p-4 rounded-xl border-2 transition-all',
                      voiceFixType === opt.type
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-border hover:border-violet-500/40'
                    )}
                    onClick={() => setVoiceFixType(opt.type)}
                  >
                    <p className="font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {voiceFixType === 'tone' && (
                <Textarea
                  value={voiceFixInstruction}
                  onChange={(e) => setVoiceFixInstruction(e.target.value)}
                  placeholder="מה הטון שאתה רוצה? (למשל: יותר אנרגטי, יותר רגוע, יותר חם...)"
                  className="min-h-[80px] animate-fade-in"
                  dir="rtl"
                />
              )}

              {voiceFixType && (
                <div className="flex gap-3 animate-fade-in">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setVoiceFixType(null);
                      setVoiceFixInstruction('');
                      setPhase('voiceover-ready');
                    }}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={handleSubmitVoiceFix}
                    variant="gradient"
                    className="flex-1 gap-2"
                    disabled={voiceFixType === 'tone' && !voiceFixInstruction.trim()}
                  >
                    <Volume2 className="h-4 w-4" />
                    צור קריינות חדשה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RadioScriptStep;
