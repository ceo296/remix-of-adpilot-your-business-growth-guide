import { useState, useEffect } from 'react';
import { Sparkles, Palette, Wand2, CheckCircle2 } from 'lucide-react';

const LOADING_MESSAGES = [
  { text: 'מעצבים את הסקיצות שלך...', icon: Palette, emoji: '🎨' },
  { text: 'הקריאייטיב שלנו עובד על זה...', icon: Wand2, emoji: '✨' },
  { text: 'בודקים שהכל מושלם...', icon: CheckCircle2, emoji: '🔍' },
  { text: 'כמעט מוכן! עוד רגע...', icon: Sparkles, emoji: '🚀' },
  { text: 'מלטשים את הפרטים האחרונים...', icon: Palette, emoji: '💎' },
  { text: 'המודעות בדרך אליך!', icon: Sparkles, emoji: '📦' },
];

interface ClientLoadingTimerProps {
  isGenerating: boolean;
  sketchCount?: number;
  completedCount?: number;
}

export const ClientLoadingTimer = ({ isGenerating, sketchCount = 3, completedCount = 0 }: ClientLoadingTimerProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      setMessageIndex(0);
      return;
    }
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) return;
    const msgTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 5000);
    return () => clearInterval(msgTimer);
  }, [isGenerating]);

  if (!isGenerating) return null;

  const currentMessage = LOADING_MESSAGES[messageIndex];
  const IconComponent = currentMessage.icon;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const progress = sketchCount > 0 ? Math.min((completedCount / sketchCount) * 100, 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6" dir="rtl">
      {/* Animated illustration area */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" 
             style={{ width: 160, height: 160, top: -20, left: -20 }} />
        
        {/* Main circle */}
        <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center relative">
          {/* Spinning border */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120" style={{ animation: 'spin 3s linear infinite' }}>
            <circle cx="60" cy="60" r="56" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="80 270" strokeLinecap="round" opacity="0.6" />
          </svg>
          
          {/* Icon */}
          <div className="animate-fade-in" key={messageIndex}>
            <span className="text-5xl">{currentMessage.emoji}</span>
          </div>
        </div>

        {/* Floating dots */}
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute w-3 h-3 rounded-full bg-primary/40"
               style={{
                 top: `${20 + Math.sin(i * 2.1) * 50}%`,
                 left: `${80 + Math.cos(i * 2.1) * 40}%`,
                 animation: `bounce 2s ease-in-out ${i * 0.3}s infinite`,
               }} />
        ))}
      </div>

      {/* Message */}
      <div className="text-center space-y-3 mb-8">
        <div className="flex items-center justify-center gap-2 animate-fade-in" key={`msg-${messageIndex}`}>
          <IconComponent className="h-5 w-5 text-primary" />
          <p className="text-lg font-medium text-foreground">{currentMessage.text}</p>
        </div>
        
        {/* Timer */}
        <p className="text-sm text-muted-foreground font-mono">
          {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds} שניות`}
        </p>
      </div>

      {/* Progress bar */}
      {completedCount > 0 && (
        <div className="w-full max-w-xs space-y-2 animate-fade-in">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedCount} מתוך {sketchCount}</span>
            <span>סקיצות מוכנות</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                 style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Tip */}
      <p className="text-xs text-muted-foreground/60 mt-8 max-w-sm text-center">
        💡 המערכת מעצבת, בודקת ומלטשת — הסקיצות יהיו מוכנות בקרוב
      </p>
    </div>
  );
};
