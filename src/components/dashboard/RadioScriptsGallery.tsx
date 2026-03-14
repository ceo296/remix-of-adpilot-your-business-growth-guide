import { useState, useEffect } from 'react';
import { Radio, Play, Pause, Calendar, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RadioScriptRecord {
  id: string;
  script_title: string;
  script_text: string;
  voice_direction: any;
  duration: string | null;
  status: string;
  created_at: string;
  audio_url: string | null;
}

export const RadioScriptsGallery = () => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<RadioScriptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchScripts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('radio_scripts' as any)
        .select('id, script_title, script_text, voice_direction, duration, status, created_at, audio_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setScripts(data as any as RadioScriptRecord[]);
      }
      setLoading(false);
    };
    fetchScripts();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('radio_scripts' as any).delete().eq('id', id);
    if (!error) {
      setScripts(prev => prev.filter(s => s.id !== id));
      toast.success('התסריט נמחק');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <div className="animate-pulse">טוען תסריטי רדיו...</div>
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">עדיין לא נוצרו תסריטי רדיו</p>
        <p className="text-xs mt-1">צור ספוט רדיו מהסטודיו היצירתי</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scripts.map((script) => (
        <Card key={script.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Radio className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{script.script_title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(script.created_at), 'd בMMM yyyy', { locale: he })}
                    {script.duration && (
                      <Badge variant="secondary" className="text-[10px]">{script.duration}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(script.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto" dir="rtl">
              {script.script_text}
            </div>

            {script.voice_direction && (
              <div className="flex flex-wrap gap-2 text-xs">
                {script.voice_direction.gender && (
                  <Badge variant="outline">{script.voice_direction.gender}</Badge>
                )}
                {script.voice_direction.style && (
                  <Badge variant="outline">{script.voice_direction.style}</Badge>
                )}
                {script.voice_direction.tone && (
                  <Badge variant="outline">{script.voice_direction.tone}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RadioScriptsGallery;
