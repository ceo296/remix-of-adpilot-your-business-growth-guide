import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, ChevronRight, X, Edit3, ImagePlus, Trash2,
  Copy, Plus, Download, Loader2, GripVertical, Maximize2, Minimize2,
  ArrowRight, ArrowLeft, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SlideData {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  stats?: { value: string; label: string }[];
  steps?: { number: string; title: string; desc: string }[];
  image_prompt?: string;
  imageUrl?: string;
  imageLoading?: boolean;
}

interface PresentationViewerProps {
  slides: SlideData[];
  activeSlide: number;
  onActiveSlideChange: (index: number) => void;
  onSlidesChange: (slides: SlideData[]) => void;
  onClose: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
  renderSlide: (slide: SlideData, scale: number, slideIndex: number) => React.ReactNode;
  brandColor?: string;
  industry?: string;
}

const SLIDE_TYPE_LABELS: Record<string, string> = {
  cover: 'שער', about: 'אודות', vision: 'חזון', services: 'שירותים',
  value_prop: 'הצעת ערך', stats: 'נתונים', process: 'תהליך',
  methodology: 'מתודולוגיה', testimonial: 'המלצה', social_proof: 'הוכחה חברתית',
  target_audience: 'קהל יעד', team: 'צוות', cta: 'קריאה לפעולה',
  contact: 'צור קשר', blank: 'ריקה',
};

export const PresentationViewer = ({
  slides, activeSlide, onActiveSlideChange, onSlidesChange,
  onClose, onExportPDF, isExporting, renderSlide, brandColor = '#E34870', industry = '',
}: PresentationViewerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorTimeout = useRef<ReturnType<typeof setTimeout>>();

  const currentSlide = slides[activeSlide];

  // Navigation
  const goNext = useCallback(() => {
    if (activeSlide < slides.length - 1) onActiveSlideChange(activeSlide + 1);
  }, [activeSlide, slides.length, onActiveSlideChange]);

  const goPrev = useCallback(() => {
    if (activeSlide > 0) onActiveSlideChange(activeSlide - 1);
  }, [activeSlide, onActiveSlideChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return; // Don't navigate while editing
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === 'ArrowLeft' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goPrev(); }
      if (e.key === 'e' || e.key === 'E') setIsEditing(prev => !prev);
      if (e.key === 't' || e.key === 'T') setShowThumbnails(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, isFullscreen, goNext, goPrev, onClose]);

  // Auto-hide cursor in fullscreen
  useEffect(() => {
    if (!isFullscreen) { setCursorHidden(false); return; }
    const handleMouseMove = () => {
      setCursorHidden(false);
      if (cursorTimeout.current) clearTimeout(cursorTimeout.current);
      cursorTimeout.current = setTimeout(() => setCursorHidden(true), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimeout.current) clearTimeout(cursorTimeout.current);
    };
  }, [isFullscreen]);

  // Slide updates
  const updateSlide = (updates: Partial<SlideData>) => {
    const newSlides = slides.map((s, i) => i === activeSlide ? { ...s, ...updates } : s);
    onSlidesChange(newSlides);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    onSlidesChange(newSlides);
    if (activeSlide >= newSlides.length) onActiveSlideChange(newSlides.length - 1);
    else if (activeSlide > index) onActiveSlideChange(activeSlide - 1);
  };

  const duplicateSlide = (index: number) => {
    const dup = { ...slides[index], id: Date.now().toString() };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, dup);
    onSlidesChange(newSlides);
  };

  const moveSlide = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    const newSlides = [...slides];
    const [moved] = newSlides.splice(from, 1);
    newSlides.splice(to, 0, moved);
    onSlidesChange(newSlides);
    onActiveSlideChange(to);
  };

  // Image replacement
  const replaceImage = async () => {
    if (!currentSlide.image_prompt) return;
    setIsReplacingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-slide-image', {
        body: { prompt: currentSlide.image_prompt, brandColor, industry },
      });
      if (!error && data?.imageUrl) {
        updateSlide({ imageUrl: data.imageUrl });
        toast.success('התמונה הוחלפה בהצלחה');
      } else {
        toast.error('שגיאה בייצור תמונה חדשה');
      }
    } catch {
      toast.error('שגיאה בייצור תמונה');
    } finally {
      setIsReplacingImage(false);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
      setIsEditing(false);
      setShowThumbnails(false);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col",
        cursorHidden && "cursor-none"
      )}
      dir="rtl"
    >
      {/* ── Top Bar ── */}
      {(!isFullscreen || !cursorHidden) && (
        <div className={cn(
          "h-12 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 transition-opacity duration-500 shrink-0",
          isFullscreen && "absolute top-0 left-0 right-0 z-50",
          isFullscreen && cursorHidden && "opacity-0"
        )}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4 ml-1" /> סגור
            </Button>
            <div className="h-5 w-px bg-white/20" />
            <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
              {activeSlide + 1} / {slides.length}
            </Badge>
            <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
              {SLIDE_TYPE_LABELS[currentSlide.type] || currentSlide.type}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => { setIsEditing(!isEditing); if (!isEditing) setShowThumbnails(true); }}
              className={cn("text-white/70 hover:text-white hover:bg-white/10 gap-1", isEditing && "bg-white/15 text-white")}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'סיום עריכה' : 'ערוך'}
            </Button>
            <Button
              variant="ghost" size="sm" onClick={toggleFullscreen}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost" size="sm" onClick={onExportPDF} disabled={isExporting}
              className="text-white/70 hover:text-white hover:bg-white/10 gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'מייצא...' : 'PDF'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Slide Canvas ── */}
        <div
          className="flex-1 flex items-center justify-center relative group"
          onClick={(e) => {
            if (!isEditing && !isFullscreen) {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              if (clickX < rect.width / 2) goNext();
              else goPrev();
            }
          }}
        >
          {/* Navigation arrows */}
          {!isEditing && (
            <>
              {activeSlide < slides.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {activeSlide > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}

          {/* The slide */}
          <div
            className="relative rounded-lg overflow-hidden shadow-2xl shadow-black/50"
            style={{
              width: isEditing ? 'min(65vw, 960px)' : 'min(90vw, 1280px)',
              aspectRatio: '16/9',
              transition: 'width 0.3s ease',
            }}
          >
            {renderSlide(currentSlide, isEditing ? 0.5 : 0.667, activeSlide)}

            {/* Image overlay actions */}
            {currentSlide.imageUrl && isEditing && (
              <div className="absolute top-3 left-3 z-20 flex gap-2">
                <Button
                  size="sm" variant="secondary"
                  onClick={replaceImage} disabled={isReplacingImage}
                  className="bg-black/60 hover:bg-black/80 text-white border-none backdrop-blur-sm text-xs gap-1"
                >
                  {isReplacingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                  {isReplacingImage ? 'מייצר...' : 'החלף תמונה'}
                </Button>
              </div>
            )}

            {/* Loading overlay for image */}
            {currentSlide.imageLoading && !currentSlide.imageUrl && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
                <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span className="text-white text-sm">מייצר תמונה...</span>
                </div>
              </div>
            )}
          </div>

          {/* Slide counter - bottom center */}
          <div className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-5 py-2 text-white/70 text-sm font-medium transition-opacity duration-300",
            !isEditing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          )}>
            {activeSlide + 1} / {slides.length}
          </div>

          {/* Keyboard hints */}
          {!isEditing && !isFullscreen && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
              <kbd className="bg-white/10 text-white/50 text-[10px] px-2 py-1 rounded">← → ניווט</kbd>
              <kbd className="bg-white/10 text-white/50 text-[10px] px-2 py-1 rounded">E עריכה</kbd>
              <kbd className="bg-white/10 text-white/50 text-[10px] px-2 py-1 rounded">T תמונות ממוזערות</kbd>
              <kbd className="bg-white/10 text-white/50 text-[10px] px-2 py-1 rounded">ESC יציאה</kbd>
            </div>
          )}
        </div>

        {/* ── Edit Panel (slides in from left) ── */}
        <div className={cn(
          "bg-[#111118] border-r border-white/10 overflow-y-auto transition-all duration-300 shrink-0",
          isEditing ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden"
        )}>
          {isEditing && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">עריכת שקופית</h3>
                <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
                  {SLIDE_TYPE_LABELS[currentSlide.type]}
                </Badge>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">כותרת</label>
                <Input
                  value={currentSlide.title}
                  onChange={e => updateSlide({ title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-sm"
                  dir="rtl"
                  onFocus={() => setEditField('title')}
                  onBlur={() => setEditField(null)}
                />
              </div>

              {/* Subtitle */}
              {(currentSlide.subtitle !== undefined || ['cover', 'stats', 'testimonial'].includes(currentSlide.type)) && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block">כותרת משנה</label>
                  <Input
                    value={currentSlide.subtitle || ''}
                    onChange={e => updateSlide({ subtitle: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-sm"
                    dir="rtl"
                  />
                </div>
              )}

              {/* Body */}
              {(currentSlide.body !== undefined || ['about', 'vision', 'contact', 'testimonial', 'cta'].includes(currentSlide.type)) && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block">תוכן</label>
                  <Textarea
                    value={currentSlide.body || ''}
                    onChange={e => updateSlide({ body: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-sm min-h-[100px]"
                    dir="rtl"
                  />
                </div>
              )}

              {/* Bullets */}
              {(currentSlide.bullets && currentSlide.bullets.length > 0) && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block">פריטים</label>
                  {currentSlide.bullets.map((b, i) => (
                    <div key={i} className="flex gap-1 mb-1">
                      <Input
                        value={b}
                        onChange={e => {
                          const newBullets = [...(currentSlide.bullets || [])];
                          newBullets[i] = e.target.value;
                          updateSlide({ bullets: newBullets });
                        }}
                        className="bg-white/5 border-white/10 text-white text-xs"
                        dir="rtl"
                      />
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 shrink-0 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => updateSlide({ bullets: currentSlide.bullets!.filter((_, j) => j !== i) })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline" size="sm"
                    className="w-full mt-1 text-xs border-white/10 text-white/60 hover:bg-white/5"
                    onClick={() => updateSlide({ bullets: [...(currentSlide.bullets || []), 'פריט חדש'] })}
                  >
                    <Plus className="w-3 h-3 ml-1" /> הוסף
                  </Button>
                </div>
              )}

              {/* Stats */}
              {currentSlide.stats && currentSlide.stats.length > 0 && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block">נתונים</label>
                  {currentSlide.stats.map((s, i) => (
                    <div key={i} className="flex gap-1 mb-1">
                      <Input
                        value={s.value}
                        onChange={e => {
                          const stats = [...(currentSlide.stats || [])];
                          stats[i] = { ...stats[i], value: e.target.value };
                          updateSlide({ stats });
                        }}
                        className="bg-white/5 border-white/10 text-white text-xs w-20"
                        dir="rtl" placeholder="ערך"
                      />
                      <Input
                        value={s.label}
                        onChange={e => {
                          const stats = [...(currentSlide.stats || [])];
                          stats[i] = { ...stats[i], label: e.target.value };
                          updateSlide({ stats });
                        }}
                        className="bg-white/5 border-white/10 text-white text-xs"
                        dir="rtl" placeholder="תווית"
                      />
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 shrink-0 text-white/40 hover:text-red-400"
                        onClick={() => updateSlide({ stats: currentSlide.stats!.filter((_, j) => j !== i) })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Steps */}
              {currentSlide.steps && currentSlide.steps.length > 0 && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block">שלבים</label>
                  {currentSlide.steps.map((s, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-2 mb-2 space-y-1">
                      <div className="flex gap-1">
                        <Input value={s.number} onChange={e => {
                          const steps = [...(currentSlide.steps || [])];
                          steps[i] = { ...steps[i], number: e.target.value };
                          updateSlide({ steps });
                        }} className="bg-white/5 border-white/10 text-white text-xs w-12" />
                        <Input value={s.title} onChange={e => {
                          const steps = [...(currentSlide.steps || [])];
                          steps[i] = { ...steps[i], title: e.target.value };
                          updateSlide({ steps });
                        }} className="bg-white/5 border-white/10 text-white text-xs" dir="rtl" />
                      </div>
                      <Input value={s.desc} onChange={e => {
                        const steps = [...(currentSlide.steps || [])];
                        steps[i] = { ...steps[i], desc: e.target.value };
                        updateSlide({ steps });
                      }} className="bg-white/5 border-white/10 text-white text-xs" dir="rtl" />
                    </div>
                  ))}
                </div>
              )}

              {/* Image prompt */}
              {currentSlide.image_prompt && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block">פרומפט תמונה</label>
                  <Textarea
                    value={currentSlide.image_prompt}
                    onChange={e => updateSlide({ image_prompt: e.target.value })}
                    className="bg-white/5 border-white/10 text-white/70 text-xs min-h-[60px] font-mono"
                    dir="ltr"
                  />
                  <Button
                    variant="outline" size="sm"
                    className="w-full mt-2 text-xs border-white/10 text-white/60 hover:bg-white/5 gap-1"
                    onClick={replaceImage} disabled={isReplacingImage}
                  >
                    {isReplacingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    {isReplacingImage ? 'מייצר...' : 'ייצר תמונה מחדש'}
                  </Button>
                </div>
              )}

              {/* Slide actions */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    className="flex-1 text-xs border-white/10 text-white/60 hover:bg-white/5 gap-1"
                    onClick={() => duplicateSlide(activeSlide)}
                  >
                    <Copy className="w-3 h-3" /> שכפל
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="flex-1 text-xs border-red-500/30 text-red-400/80 hover:bg-red-500/10 gap-1"
                    onClick={() => deleteSlide(activeSlide)}
                    disabled={slides.length <= 1}
                  >
                    <Trash2 className="w-3 h-3" /> מחק
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    className="flex-1 text-xs border-white/10 text-white/60 hover:bg-white/5"
                    onClick={() => moveSlide(activeSlide, activeSlide - 1)}
                    disabled={activeSlide === 0}
                  >
                    <ArrowRight className="w-3 h-3 ml-1" /> הזז קדימה
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="flex-1 text-xs border-white/10 text-white/60 hover:bg-white/5"
                    onClick={() => moveSlide(activeSlide, activeSlide + 1)}
                    disabled={activeSlide === slides.length - 1}
                  >
                    הזז אחורה <ArrowLeft className="w-3 h-3 mr-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Thumbnail Strip (bottom) ── */}
      {showThumbnails && !isFullscreen && (
        <div className="h-24 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center gap-2 px-4 overflow-x-auto shrink-0">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={cn(
                "relative cursor-pointer rounded-md overflow-hidden border-2 transition-all shrink-0 group/thumb",
                i === activeSlide
                  ? "border-primary shadow-lg shadow-primary/30 scale-105"
                  : "border-transparent hover:border-white/30 opacity-70 hover:opacity-100"
              )}
              style={{ width: 120, height: 67.5 }}
              onClick={() => onActiveSlideChange(i)}
            >
              <div className="w-full h-full relative overflow-hidden bg-[#1a1a2e]">
                {renderSlide(slide, 0.0625, i)}
              </div>
              {/* Slide number */}
              <div className="absolute bottom-0 left-0 bg-black/70 text-white/70 text-[9px] px-1.5 py-0.5 rounded-tr-md">
                {i + 1}
              </div>
              {/* Delete on hover */}
              {isEditing && slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSlide(i); }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
