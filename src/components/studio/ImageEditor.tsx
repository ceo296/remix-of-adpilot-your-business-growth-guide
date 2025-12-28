import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, FabricImage, Rect, Circle, IText, FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  MousePointer2, 
  Type, 
  Square, 
  Circle as CircleIcon, 
  Pencil, 
  Download, 
  Undo2, 
  Redo2,
  Trash2,
  Palette,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Tool = 'select' | 'text' | 'rectangle' | 'circle' | 'draw';

interface ImageEditorProps {
  imageUrl: string;
  onSave?: (dataUrl: string) => void;
  onClose?: () => void;
}

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#E31E24', '#1E88E5', '#43A047', 
  '#FDD835', '#FB8C00', '#8E24AA', '#D4AF37', '#607D8B'
];

export function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [activeColor, setActiveColor] = useState('#E31E24');
  const [brushSize, setBrushSize] = useState(3);
  const [fontSize, setFontSize] = useState(32);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#1a1a2e',
      selection: true,
    });

    // Initialize drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = brushSize;
    }

    setFabricCanvas(canvas);

    // Load background image
    setIsLoading(true);
    FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
      .then((img) => {
        // Scale image to fit canvas
        const scale = Math.min(
          (container.clientWidth - 40) / img.width!,
          (container.clientHeight - 40) / img.height!
        );
        
        img.scale(scale);
        img.set({
          left: (container.clientWidth - img.width! * scale) / 2,
          top: (container.clientHeight - img.height! * scale) / 2,
          selectable: false,
          evented: false,
        });
        
        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
        setIsLoading(false);
        
        // Save initial state
        saveToHistory(canvas);
      })
      .catch((err) => {
        console.error('Error loading image:', err);
        toast.error('שגיאה בטעינת התמונה');
        setIsLoading(false);
      });

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  // Update brush settings
  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = activeTool === 'draw';
    
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  const saveToHistory = useCallback((canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, json];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);
    
    if (!fabricCanvas) return;

    if (tool === 'text') {
      const text = new IText('טקסט כאן', {
        left: fabricCanvas.width! / 2 - 50,
        top: fabricCanvas.height! / 2 - 20,
        fill: activeColor,
        fontSize: fontSize,
        fontFamily: 'David Libre, serif',
        direction: 'rtl',
        textAlign: 'right',
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      text.enterEditing();
      saveToHistory(fabricCanvas);
    } else if (tool === 'rectangle') {
      const rect = new Rect({
        left: fabricCanvas.width! / 2 - 50,
        top: fabricCanvas.height! / 2 - 50,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      saveToHistory(fabricCanvas);
      setActiveTool('select');
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: fabricCanvas.width! / 2 - 50,
        top: fabricCanvas.height! / 2 - 50,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        radius: 50,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      saveToHistory(fabricCanvas);
      setActiveTool('select');
    }
  };

  const handleUndo = () => {
    if (!fabricCanvas || historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleDelete = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        // Don't delete the background image
        if (obj.selectable !== false) {
          fabricCanvas.remove(obj);
        }
      });
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      saveToHistory(fabricCanvas);
    }
  };

  const handleExport = () => {
    if (!fabricCanvas) return;
    
    // Get the data URL
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    if (onSave) {
      onSave(dataUrl);
      toast.success('התמונה נשמרה!');
    } else {
      // Download directly
      const link = document.createElement('a');
      link.download = `edited-image-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('התמונה הורדה!');
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    const newZoom = direction === 'in' ? zoom * 1.1 : zoom / 1.1;
    fabricCanvas.setZoom(Math.min(Math.max(newZoom, 0.5), 3));
    fabricCanvas.renderAll();
  };

  const handleReset = () => {
    if (!fabricCanvas || history.length === 0) return;
    fabricCanvas.loadFromJSON(JSON.parse(history[0])).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(0);
    });
  };

  const ToolButton = ({ tool, icon: Icon, label }: { tool: Tool; icon: any; label: string }) => (
    <Button
      variant={activeTool === tool ? 'default' : 'outline'}
      size="sm"
      onClick={() => handleToolClick(tool)}
      className="flex-col h-auto py-2 gap-1"
      title={label}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </Button>
  );

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            עורך תמונות
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="h-4 w-4 ml-2" />
            איפוס
          </Button>
          <Button variant="gradient" onClick={handleExport} size="sm">
            <Download className="h-4 w-4 ml-2" />
            שמור ויצא
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-20 border-l bg-card p-2 flex flex-col gap-2">
          <ToolButton tool="select" icon={MousePointer2} label="בחירה" />
          <ToolButton tool="text" icon={Type} label="טקסט" />
          <ToolButton tool="rectangle" icon={Square} label="מלבן" />
          <ToolButton tool="circle" icon={CircleIcon} label="עיגול" />
          <ToolButton tool="draw" icon={Pencil} label="ציור" />
          
          <div className="border-t my-2" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="flex-col h-auto py-2 gap-1"
          >
            <Undo2 className="h-4 w-4" />
            <span className="text-xs">בטל</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="flex-col h-auto py-2 gap-1"
          >
            <Redo2 className="h-4 w-4" />
            <span className="text-xs">שחזר</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="flex-col h-auto py-2 gap-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-xs">מחק</span>
          </Button>
          
          <div className="border-t my-2" />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleZoom('in')}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleZoom('out')}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas Area */}
        <div 
          ref={containerRef} 
          className="flex-1 bg-muted/50 relative"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          <canvas ref={canvasRef} className="block" />
        </div>

        {/* Right Panel - Properties */}
        <div className="w-64 border-r bg-card p-4 space-y-6 overflow-y-auto">
          {/* Colors */}
          <div>
            <Label className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              צבע
            </Label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 transition-all",
                    activeColor === color ? "border-primary ring-2 ring-primary/30" : "border-muted"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              className="w-full h-10"
            />
          </div>

          {/* Brush Size */}
          {activeTool === 'draw' && (
            <div>
              <Label className="mb-3 block">עובי מכחול: {brushSize}px</Label>
              <Slider
                value={[brushSize]}
                onValueChange={([value]) => setBrushSize(value)}
                min={1}
                max={20}
                step={1}
              />
            </div>
          )}

          {/* Font Size for Text */}
          {activeTool === 'text' && (
            <div>
              <Label className="mb-3 block">גודל טקסט: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={([value]) => setFontSize(value)}
                min={12}
                max={72}
                step={2}
              />
            </div>
          )}

          {/* Tips */}
          <Card className="bg-muted/50 p-4">
            <h4 className="font-medium mb-2 text-sm">טיפים:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• לחץ פעמיים על טקסט לעריכה</li>
              <li>• גרור פינות לשינוי גודל</li>
              <li>• Delete למחיקת אובייקט</li>
              <li>• גרור אובייקטים למיקום</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
