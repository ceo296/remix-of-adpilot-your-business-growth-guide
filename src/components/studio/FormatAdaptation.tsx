import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Download, ChevronLeft, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resizeImage, parseDimensions, type AdaptedCreative } from '@/lib/image-resize';

interface FormatAdaptationProps {
  /** Approved creative image URLs */
  creativeUrls: string[];
  /** Media spec IDs from the selected package */
  mediaSpecIds: string[];
  /** Called when adaptation is complete */
  onComplete: (adapted: AdaptedCreative[]) => void;
  /** Called to go back */
  onBack: () => void;
}

export const FormatAdaptation = ({
  creativeUrls,
  mediaSpecIds,
  onComplete,
  onBack,
}: FormatAdaptationProps) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [adapted, setAdapted] = useState<AdaptedCreative[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    adaptCreatives();
  }, []);

  const adaptCreatives = async () => {
    setIsProcessing(true);

    try {
      // Fetch specs with their dimensions + parent product/outlet names
      const { data: specs } = await supabase
        .from('product_specs')
        .select(`
          id,
          name,
          name_he,
          dimensions,
          product_id,
          media_products!inner (
            name,
            name_he,
            outlet_id,
            media_outlets!inner (
              name,
              name_he
            )
          )
        `)
        .in('id', mediaSpecIds)
        .eq('is_active', true);

      if (!specs || specs.length === 0) {
        // Fallback: try treating IDs as product IDs
        const { data: products } = await supabase
          .from('media_products')
          .select(`
            id,
            name,
            name_he,
            outlet_id,
            media_outlets!inner (
              name,
              name_he
            ),
            product_specs (
              id,
              name,
              name_he,
              dimensions
            )
          `)
          .in('id', mediaSpecIds)
          .eq('is_active', true);

        if (products && products.length > 0) {
          // Use first spec from each product
          const results: AdaptedCreative[] = [];
          const specsToProcess = products.flatMap(p => {
            const productSpecs = (p as any).product_specs || [];
            const specWithDims = productSpecs.find((s: any) => s.dimensions);
            if (!specWithDims) return [];
            return [{
              specId: specWithDims.id,
              specName: specWithDims.name_he || specWithDims.name,
              dimensions: specWithDims.dimensions,
              outletName: `${(p as any).media_outlets?.name_he || (p as any).media_outlets?.name} - ${p.name_he || p.name}`,
            }];
          });

          setTotal(specsToProcess.length * creativeUrls.length);
          let count = 0;

          for (const spec of specsToProcess) {
            const dims = parseDimensions(spec.dimensions);
            if (!dims) continue;

            for (const url of creativeUrls) {
              const adaptedUrl = await resizeImage(url, {
                width: dims.width,
                height: dims.height,
                mode: 'cover',
              });
              results.push({
                specId: spec.specId,
                specName: spec.specName,
                dimensions: spec.dimensions,
                originalUrl: url,
                adaptedUrl,
                outletName: spec.outletName,
              });
              count++;
              setProgress(count);
              setAdapted([...results]);
            }
          }

          setAdapted(results);
          setIsProcessing(false);
          return;
        }

        setIsProcessing(false);
        return;
      }

      // Process specs with dimensions
      const specsWithDims = specs.filter(s => s.dimensions);
      setTotal(specsWithDims.length * creativeUrls.length);
      let count = 0;
      const results: AdaptedCreative[] = [];

      for (const spec of specsWithDims) {
        const dims = parseDimensions(spec.dimensions!);
        if (!dims) continue;

        const product = (spec as any).media_products;
        const outlet = product?.media_outlets;
        const outletName = `${outlet?.name_he || outlet?.name || ''} - ${product?.name_he || product?.name || ''}`;

        for (const url of creativeUrls) {
          const adaptedUrl = await resizeImage(url, {
            width: dims.width,
            height: dims.height,
            mode: 'cover',
          });
          results.push({
            specId: spec.id,
            specName: spec.name_he || spec.name,
            dimensions: spec.dimensions!,
            originalUrl: url,
            adaptedUrl,
            outletName,
          });
          count++;
          setProgress(count);
          setAdapted([...results]);
        }
      }

      setAdapted(results);
    } catch (error) {
      console.error('Error adapting creatives:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6" dir="rtl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <ImageIcon className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">התאמת קריאייטיב לפורמטים</h2>
        <p className="text-muted-foreground">
          {isProcessing
            ? `מתאים את העיצובים לגדלי המדיה שנרכשו... (${progress}/${total})`
            : adapted.length > 0
              ? `${adapted.length} גרסאות מותאמות מוכנות`
              : 'לא נמצאו מידות לערוצי המדיה שנבחרו'
          }
        </p>
      </div>

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          {total > 0 && (
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {!isProcessing && adapted.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adapted.map((item, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="relative bg-muted">
                <img
                  src={item.adaptedUrl}
                  alt={`${item.outletName} - ${item.specName}`}
                  className="w-full h-48 object-contain bg-muted"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="font-medium text-sm">{item.outletName}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{item.specName}</Badge>
                  <Badge variant="outline" className="text-xs">{item.dimensions}</Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 mt-2"
                  onClick={() => handleDownload(
                    item.adaptedUrl,
                    `${item.outletName}-${item.specName}.jpg`
                  )}
                >
                  <Download className="h-4 w-4" />
                  הורד
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isProcessing && (
        <div className="flex justify-center gap-4 pt-6 border-t border-border">
          <Button variant="outline" onClick={onBack}>
            חזרה
          </Button>
          <Button
            size="lg"
            variant="gradient"
            className="gap-2 h-14 px-8 text-lg"
            onClick={() => onComplete(adapted)}
          >
            <CheckCircle2 className="h-5 w-5" />
            אשר ושלח לביצוע
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};
