import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowRight, Send, Loader2, Brain, User, Lightbulb,
  Target, CheckCircle2, Sparkles, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { supabase } from '@/integrations/supabase/client';
import TopNavbar from '@/components/dashboard/TopNavbar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conclusion {
  field: string;
  label: string;
  value: string | string[];
  explanation: string;
  selected: boolean;
}

interface ConclusionsData {
  conclusions: Omit<Conclusion, 'selected'>[];
  brand_message?: string;
  campaign_angles?: string[];
}

const StrategyAdvisor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { user } = useAuth();
  const { profile, refetch } = useClientProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'guided' | 'chat'>('guided');
  const [conclusions, setConclusions] = useState<Conclusion[]>([]);
  const [brandMessage, setBrandMessage] = useState('');
  const [campaignAngles, setCampaignAngles] = useState<string[]>([]);
  const [showConclusions, setShowConclusions] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Start guided flow automatically
  useEffect(() => {
    if (messages.length === 0 && profile) {
      sendMessage('שלום, אני רוצה עזרה בגיבוש המסר האסטרטגי שלי', true);
    }
  }, [profile]);

  const extractConclusions = (text: string): ConclusionsData | null => {
    const match = text.match(/```json:conclusions\s*([\s\S]*?)```/);
    if (!match) return null;
    try {
      return JSON.parse(match[1].trim());
    } catch {
      return null;
    }
  };

  const cleanTextFromConclusions = (text: string): string => {
    return text.replace(/```json:conclusions[\s\S]*?```/g, '').trim();
  };

  const sendMessage = async (messageText?: string, isAuto = false) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    if (!isAuto) {
      setMessages(prev => [...prev, userMessage]);
    }
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: cleanTextFromConclusions(assistantContent) } : m
          );
        }
        return [...prev, { role: 'assistant', content: cleanTextFromConclusions(assistantContent) }];
      });
    };

    try {
      const allMessages = isAuto
        ? [userMessage]
        : [...messages, userMessage];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategy-advisor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            profile: profile ? {
              business_name: profile.business_name,
              target_audience: profile.target_audience,
              x_factors: profile.x_factors,
              primary_x_factor: profile.primary_x_factor,
              winning_feature: profile.winning_feature,
              advantage_type: profile.advantage_type,
              competitors: profile.competitors,
              services: profile.services,
              audience_tone: profile.audience_tone,
              brand_presence: profile.brand_presence,
              personal_red_lines: profile.personal_red_lines,
            } : null,
            mode,
          }),
        }
      );

      if (!response.ok) {
        let errorMsg = 'שגיאה בתקשורת';
        try { const err = await response.json(); errorMsg = err.error || errorMsg; } catch {}
        throw new Error(errorMsg);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '');
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {}
        }
      }

      // Check for conclusions in the full response
      const conclusionsData = extractConclusions(assistantContent);
      if (conclusionsData) {
        setConclusions(conclusionsData.conclusions.map(c => ({ ...c, selected: true })));
        setBrandMessage(conclusionsData.brand_message || '');
        setCampaignAngles(conclusionsData.campaign_angles || []);
        setShowConclusions(true);
        setMode('chat'); // Switch to free chat after conclusions
      }
    } catch (error) {
      console.error('Strategy advisor error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: error instanceof Error ? error.message : 'שגיאה בתקשורת' }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleApplyConclusions = async () => {
    if (!profile || !user) return;
    const selected = conclusions.filter(c => c.selected);
    if (selected.length === 0) {
      toast.error('בחר לפחות מסקנה אחת ליישום');
      return;
    }

    setIsApplying(true);
    try {
      const updates: Record<string, any> = {};
      for (const c of selected) {
        updates[c.field] = c.value;
      }

      const { error } = await supabase
        .from('client_profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;
      await refetch();
      toast.success(`${selected.length} מסקנות יושמו בהצלחה בתעודת הזהות!`);
      setShowConclusions(false);
      
      // If coming from onboarding, navigate back
      if (returnTo === 'onboarding') {
        setTimeout(() => navigate('/onboarding'), 1500);
      } else if (returnTo === 'profile') {
        setTimeout(() => navigate('/studio#/profile'), 1500);
      }
    } catch (error) {
      console.error('Apply error:', error);
      toast.error('שגיאה ביישום המסקנות');
    } finally {
      setIsApplying(false);
    }
  };

  const toggleConclusion = (index: number) => {
    setConclusions(prev => prev.map((c, i) => i === index ? { ...c, selected: !c.selected } : c));
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(returnTo === 'onboarding' ? '/onboarding' : returnTo === 'profile' ? '/studio#/profile' : '/internal-studio')} className="mb-2">
            <ArrowRight className="w-4 h-4 ml-2" />
            {returnTo === 'onboarding' ? 'חזרה לתהליך ההיכרות' : returnTo === 'profile' ? 'חזרה לפרופיל' : 'חזרה לחומרים פנימיים'}
          </Button>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center shadow-lg mb-3">
              <Brain className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">יועץ אסטרטגי</h1>
            <p className="text-sm text-muted-foreground">
              גבש את המסר המרכזי שלך עם יועץ AI מנוסה
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              {/* Mode indicator */}
              <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
                <Badge variant={mode === 'guided' ? 'default' : 'secondary'} className="text-xs">
                  {mode === 'guided' ? (
                    <><Target className="w-3 h-3 ml-1" />שאלות מובנות</>
                  ) : (
                    <><MessageSquare className="w-3 h-3 ml-1" />שיחה חופשית</>
                  )}
                </Badge>
                {mode === 'guided' && (
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setMode('chat')}>
                    עבור לשיחה חופשית →
                  </Button>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-2",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-amber-100 dark:bg-amber-900/30"
                      )}>
                        {msg.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Brain className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className={cn(
                        "rounded-lg p-3 max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <span className="animate-pulse text-sm">מנתח...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="כתוב תשובה או שאלה..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                    dir="rtl"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Conclusions Panel */}
          <div className="lg:col-span-1">
            {showConclusions && conclusions.length > 0 ? (
              <Card>
                <CardContent className="p-4 space-y-4" dir="rtl">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-foreground">מסקנות אסטרטגיות</h3>
                  </div>

                  {brandMessage && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">💡 מסר מרכזי מומלץ</p>
                      <p className="text-sm font-semibold text-foreground">{brandMessage}</p>
                    </div>
                  )}

                  {campaignAngles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">🎯 זוויות לקמפיין:</p>
                      {campaignAngles.map((angle, i) => (
                        <p key={i} className="text-xs text-foreground bg-muted/50 rounded p-2">• {angle}</p>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">בחר מסקנות ליישום בתעודת הזהות:</p>
                    <div className="space-y-2">
                      {conclusions.map((c, i) => (
                        <div
                          key={i}
                          className={cn(
                            "p-2 rounded-lg border cursor-pointer transition-all",
                            c.selected ? "border-primary bg-primary/5" : "border-border"
                          )}
                          onClick={() => toggleConclusion(i)}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox checked={c.selected} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground">{c.label}</p>
                              <p className="text-xs text-primary font-medium truncate">
                                {Array.isArray(c.value) ? c.value.join(', ') : c.value}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{c.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleApplyConclusions}
                    disabled={isApplying || conclusions.filter(c => c.selected).length === 0}
                    className="w-full"
                    size="sm"
                  >
                    {isApplying ? (
                      <><Loader2 className="w-4 h-4 ml-2 animate-spin" />מיישם...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 ml-2" />יישם {conclusions.filter(c => c.selected).length} מסקנות בזהות</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center" dir="rtl">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <h3 className="font-semibold text-foreground mb-1">מסקנות יופיעו כאן</h3>
                  <p className="text-xs text-muted-foreground">
                    ענה על שאלות היועץ כדי לקבל תובנות אסטרטגיות שתוכל ליישם ישירות בתעודת הזהות שלך
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAdvisor;
