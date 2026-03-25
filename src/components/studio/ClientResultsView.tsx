import { useState } from 'react';
import { Sparkles, ZoomIn, ChevronRight, Wrench, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComponentFeedbackPicker } from '@/components/studio/ComponentFeedbackPicker';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface GeneratedImage {
  id: string;
  url: string;
  status: 'approved' | 'needs-review' | 'rejected' | 'pending';
  analysis?: string;
  visualOnlyUrl?: string;
  model?: string;
  textMeta?: {
    headline: string;
    subtitle?: string;
    bodyText?: string;
    ctaText?: string;
    businessName: string;
    phone: string;
    servicesList?: string[];
    promoText?: string;
    promoValue?: string;
  };
}

interface ClientResultsViewProps {
  images: GeneratedImage[];
  onRequestFix: (imageId: string, feedback: string) => void;
  onApproveAndDownload: (imageIds: string[]) => void;
  onSendToMedia: (imageIds: string[]) => void;
  onStartOver: () => void;
  businessName?: string;
}

export const ClientResultsView = ({
  images,
  onRequestFix,
  onApproveAndDownload,
  onSendToMedia,
  onStartOver,
  businessName,
}: ClientResultsViewProps) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [feedbackImageId, setFeedbackImageId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [showFixMode, setShowFixMode] = useState(false);

  // Filter out rejected images — client doesn't see them
  const visibleImages = images.filter(img => img.status !== 'rejected');

  const handleApprove = (id: string) => {
    setApprovedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmitFeedback = () => {
    if (!feedbackImageId || !feedbackText.trim()) return;
    onRequestFix(feedbackImageId, feedbackText.trim());
    setFeedbackImageId(null);
    setFeedbackText('');
    toast.success('הבקשה נשלחה! נעדכן אותך כשהתיקון מוכן 🔧');
  };

  const handleApproveAll = () => {
    const ids = visibleImages.map(img => img.id);
    onSendToMedia(ids);
  };

  if (visibleImages.length === 0) return null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          הסקיצות מוכנות!
        </h2>
        <p className="text-muted-foreground text-sm">
          {businessName ? `${businessName} — ` : ''}בחרו את הסקיצות שאהבתם או בקשו תיקונים
        </p>
      </div>

      {/* Sketches Grid */}
      <div className={visibleImages.length === 1 
        ? 'flex justify-center' 
        : visibleImages.length === 2 
          ? 'grid grid-cols-2 gap-4 max-w-2xl mx-auto'
          : 'grid grid-cols-2 lg:grid-cols-3 gap-4'
      }>
        {visibleImages.map((image, idx) => {
          const isApproved = approvedIds.has(image.id);
          return (
            <Card key={image.id} className="overflow-hidden group relative transition-all duration-200 hover:shadow-md">
              {/* Image — click to zoom */}
              <div className="relative cursor-pointer" onClick={() => setZoomedImage(image.url)}>
                <img src={image.url} alt={`סקיצה ${idx + 1}`} className="w-full object-contain bg-muted/30" loading="lazy" />
                
                {/* Zoom overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                </div>

                {/* Sketch number badge */}
                <Badge className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur-sm text-xs">
                  סקיצה {idx + 1}
                </Badge>
              </div>

              {/* Action buttons */}
              <div className="p-3 flex justify-center">
                <Badge variant="secondary" className="text-xs">
                  סקיצה {idx + 1}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Action Bar — Two clear choices */}
      {!showFixMode ? (
        <div className="flex flex-col gap-3 items-center pt-6 max-w-md mx-auto">
          {/* Primary CTA */}
          <Button 
            onClick={handleApproveAll} 
            variant="gradient" 
            size="xl" 
            className="w-full gap-2.5 text-lg"
          >
            <Heart className="h-5 w-5" />
            אהבתי! בואו נמשיך
            <ChevronRight className="h-5 w-5 mr-auto" />
          </Button>

          {/* Secondary — fixes */}
          <Button 
            onClick={() => setShowFixMode(true)} 
            variant="outline" 
            size="lg" 
            className="w-full gap-2"
          >
            <Wrench className="h-4 w-4" />
            יש לי כמה תיקונים
          </Button>
        </div>
      ) : (
        <div className="pt-6 max-w-lg mx-auto space-y-4">
          <ComponentFeedbackPicker
            sketchLabel="הסקיצות"
            onSubmit={(feedbacks) => {
              const combinedFeedback = feedbacks.map(f => `[${f.component}] ${f.text}`).join('\n');
              // Apply fix to first visible image (or all)
              if (visibleImages.length > 0) {
                onRequestFix(visibleImages[0].id, combinedFeedback);
              }
              setShowFixMode(false);
              toast.success('הבקשה נשלחה! נעדכן אותך כשהתיקון מוכן 🔧');
            }}
            onCancel={() => setShowFixMode(false)}
          />
        </div>
      )}

      {/* Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          {zoomedImage && (
            <img src={zoomedImage} alt="תצוגה מוגדלת" className="w-full h-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
