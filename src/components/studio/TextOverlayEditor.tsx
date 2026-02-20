import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Type, Plus, Trash2, Download, X, Move, GripVertical } from 'lucide-react';

interface TextLayer {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  bold: boolean;
  textAlign: 'right' | 'center' | 'left';
}

interface TextOverlayEditorProps {
  imageUrl: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const FONT_OPTIONS = [
  { value: 'Rubik', label: 'רוביק' },
  { value: 'Heebo', label: 'חיבו' },
  { value: 'Assistant', label: 'אסיסטנט' },
  { value: 'Frank Ruhl Libre', label: 'פרנק רוהל' },
  { value: 'David Libre', label: 'דוד' },
  { value: 'Secular One', label: 'סקולר' },
  { value: 'Suez One', label: 'סואץ' },
  { value: 'Arial', label: 'אריאל' },
];

const COLOR_PRESETS = [
  '#FFFFFF', '#000000', '#1a237e', '#c8a951', 
  '#D4AF37', '#8B0000', '#004d00', '#FF6600',
  '#333333', '#F5F5DC',
];

export const TextOverlayEditor = ({ imageUrl, onSave, onClose }: TextOverlayEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Try without crossOrigin for data URLs
      const img2 = new Image();
      img2.onload = () => {
        imgRef.current = img2;
        setImageLoaded(true);
      };
      img2.src = imageUrl;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const addLayer = () => {
    const newLayer: TextLayer = {
      id: `layer-${Date.now()}`,
      text: 'הקלד כאן',
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: 'Rubik',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      bold: true,
      textAlign: 'center',
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<TextLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  // Handle dragging text layers on the preview
  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    setDraggingId(layerId);
    setSelectedLayerId(layerId);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateLayer(draggingId, { 
      x: Math.max(5, Math.min(95, x)), 
      y: Math.max(5, Math.min(95, y)) 
    });
  }, [draggingId]);

  const handleMouseUp = () => setDraggingId(null);

  // Export with canvas
  const handleExport = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    
    // Draw image
    ctx.drawImage(img, 0, 0);
    
    // Draw text layers
    for (const layer of layers) {
      const x = (layer.x / 100) * canvas.width;
      const y = (layer.y / 100) * canvas.height;
      const scaledFontSize = (layer.fontSize / 500) * canvas.width;
      
      ctx.font = `${layer.bold ? 'bold ' : ''}${scaledFontSize}px "${layer.fontFamily}", sans-serif`;
      ctx.textAlign = layer.textAlign;
      ctx.direction = 'rtl';
      
      // Background
      if (layer.backgroundColor !== 'transparent') {
        const metrics = ctx.measureText(layer.text);
        const padding = scaledFontSize * 0.3;
        ctx.fillStyle = layer.backgroundColor;
        const bgX = layer.textAlign === 'center' ? x - metrics.width / 2 - padding 
                   : layer.textAlign === 'right' ? x - metrics.width - padding 
                   : x - padding;
        ctx.fillRect(bgX, y - scaledFontSize, metrics.width + padding * 2, scaledFontSize * 1.4);
      }
      
      // Text shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = scaledFontSize * 0.1;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, x, y);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  }, [layers, onSave]);

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">עריכת טקסט על התמונה</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" dir="rtl">
        {/* Controls Panel */}
        <div className="w-72 border-l border-border p-4 overflow-y-auto space-y-4 bg-muted/30">
          <Button onClick={addLayer} className="w-full gap-2" variant="outline">
            <Plus className="h-4 w-4" />
            הוסף שכבת טקסט
          </Button>

          {/* Layer list */}
          {layers.map((layer, i) => (
            <div 
              key={layer.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedLayerId === layer.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedLayerId(layer.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-xs">שכבה {i + 1}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={layer.text}
                onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                className="text-right text-sm"
                dir="rtl"
                placeholder="הקלד טקסט..."
              />
            </div>
          ))}

          {/* Selected layer controls */}
          {selectedLayer && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">פונט</label>
                <Select 
                  value={selectedLayer.fontFamily} 
                  onValueChange={(v) => updateLayer(selectedLayer.id, { fontFamily: v })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  גודל: {selectedLayer.fontSize}px
                </label>
                <Slider
                  value={[selectedLayer.fontSize]}
                  onValueChange={([v]) => updateLayer(selectedLayer.id, { fontSize: v })}
                  min={12}
                  max={96}
                  step={2}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">צבע טקסט</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      className={`w-7 h-7 rounded-md border-2 transition-transform ${
                        selectedLayer.color === c ? 'border-primary scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateLayer(selectedLayer.id, { color: c })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">רקע טקסט</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    className={`w-7 h-7 rounded-md border-2 text-xs ${
                      selectedLayer.backgroundColor === 'transparent' ? 'border-primary' : 'border-border'
                    }`}
                    onClick={() => updateLayer(selectedLayer.id, { backgroundColor: 'transparent' })}
                  >
                    ✕
                  </button>
                  {COLOR_PRESETS.slice(0, 6).map(c => (
                    <button
                      key={c}
                      className={`w-7 h-7 rounded-md border-2 transition-transform ${
                        selectedLayer.backgroundColor === c ? 'border-primary scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateLayer(selectedLayer.id, { backgroundColor: c })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={selectedLayer.bold ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 font-bold"
                  onClick={() => updateLayer(selectedLayer.id, { bold: !selectedLayer.bold })}
                >
                  B
                </Button>
                {(['right', 'center', 'left'] as const).map(align => (
                  <Button
                    key={align}
                    variant={selectedLayer.textAlign === align ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateLayer(selectedLayer.id, { textAlign: align })}
                  >
                    {align === 'right' ? '⫸' : align === 'center' ? '≡' : '⫷'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {layers.length > 0 && (
            <Button onClick={handleExport} className="w-full gap-2 mt-4" variant="gradient">
              <Download className="h-4 w-4" />
              שמור תמונה עם טקסט
            </Button>
          )}
        </div>

        {/* Preview Area */}
        <div 
          className="flex-1 flex items-center justify-center p-4 bg-muted/10 overflow-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            ref={containerRef}
            className="relative inline-block max-w-full max-h-full select-none"
          >
            <img 
              src={imageUrl} 
              alt="עריכה" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              draggable={false}
            />
            
            {/* Text overlay layers */}
            {layers.map(layer => (
              <div
                key={layer.id}
                className={`absolute cursor-move select-none ${
                  selectedLayerId === layer.id ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: `"${layer.fontFamily}", sans-serif`,
                  fontSize: `${layer.fontSize}px`,
                  fontWeight: layer.bold ? 'bold' : 'normal',
                  color: layer.color,
                  backgroundColor: layer.backgroundColor !== 'transparent' ? layer.backgroundColor : undefined,
                  padding: layer.backgroundColor !== 'transparent' ? '4px 12px' : undefined,
                  textAlign: layer.textAlign,
                  direction: 'rtl',
                  textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleMouseDown(e, layer.id)}
                onClick={() => setSelectedLayerId(layer.id)}
              >
                {layer.text}
              </div>
            ))}

            {layers.length === 0 && imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-white/60 text-lg bg-black/30 px-4 py-2 rounded-lg">
                  לחץ "הוסף שכבת טקסט" כדי להתחיל
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
