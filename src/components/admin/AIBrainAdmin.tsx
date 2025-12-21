import { useState, useEffect } from 'react';
import { Brain, Upload, Trash2, Trophy, AlertOctagon, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TrainingExample {
  id: string;
  zone: string;
  name: string;
  file_path: string;
  created_at: string;
}

const AIBrainAdmin = () => {
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [styleWeights, setStyleWeights] = useState({
    minimalism: 50,
    traditional: 50,
    colorful: 50,
  });

  useEffect(() => {
    loadExamples();
  }, []);

  const loadExamples = async () => {
    const { data, error } = await supabase
      .from('sector_brain_examples')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading examples:', error);
    } else {
      setExamples(data || []);
    }
    setIsLoading(false);
  };

  const handleUpload = async (zone: 'fame' | 'redlines', files: FileList) => {
    for (const file of Array.from(files)) {
      const fileName = `${zone}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sector-brain')
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`שגיאה בהעלאת ${file.name}`);
        continue;
      }

      const { error: dbError } = await supabase
        .from('sector_brain_examples')
        .insert({
          zone,
          name: file.name,
          file_path: fileName,
          file_type: file.type,
        });

      if (dbError) {
        toast.error(`שגיאה בשמירת ${file.name}`);
      }
    }

    toast.success('הקבצים הועלו בהצלחה');
    loadExamples();
  };

  const handleDelete = async (id: string, filePath: string) => {
    await supabase.storage.from('sector-brain').remove([filePath]);
    await supabase.from('sector_brain_examples').delete().eq('id', id);
    toast.success('נמחק');
    loadExamples();
  };

  const fameExamples = examples.filter(e => e.zone === 'fame');
  const redlineExamples = examples.filter(e => e.zone === 'redlines');

  const UploadZone = ({ 
    zone, 
    title, 
    description, 
    icon: Icon, 
    examples,
    color 
  }: { 
    zone: 'fame' | 'redlines';
    title: string;
    description: string;
    icon: React.ElementType;
    examples: TrainingExample[];
    color: string;
  }) => (
    <Card className="bg-[#111113] border-[#222]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          {title}
          <Badge className="bg-[#222] mr-2">{examples.length}</Badge>
        </CardTitle>
        <CardDescription className="text-[#888]">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="block">
            <div className="border-2 border-dashed border-[#333] rounded-lg p-6 text-center cursor-pointer hover:border-[#555] transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-[#555]" />
              <p className="text-[#888]">גרור קבצים או לחץ להעלאה</p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(zone, e.target.files)}
              />
            </div>
          </label>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {examples.map(example => (
            <div
              key={example.id}
              className="flex items-center gap-3 p-3 bg-[#1a1a1d] rounded-lg"
            >
              <div className="flex-1 truncate text-sm">{example.name}</div>
              <div className="text-xs text-[#555]">
                {new Date(example.created_at).toLocaleDateString('he-IL')}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(example.id, example.file_path)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {examples.length === 0 && (
            <p className="text-[#555] text-center py-4">אין קבצים</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">אימון המערכת</h1>
        <p className="text-[#888]">העלאת דוגמאות ללימוד המשגיח הדיגיטלי</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{fameExamples.length}</div>
            <div className="text-sm text-[#888]">דוגמאות מוצלחות</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{redlineExamples.length}</div>
            <div className="text-sm text-[#888]">קווים אדומים</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{examples.length}</div>
            <div className="text-sm text-[#888]">סה"כ דוגמאות</div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Zones */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <UploadZone
          zone="fame"
          title="The Kosher Dataset"
          description="העלו מודעות מוצלחות ללימוד הסגנון"
          icon={Trophy}
          examples={fameExamples}
          color="text-green-400"
        />
        <UploadZone
          zone="redlines"
          title="The Blacklist"
          description="העלו דוגמאות לתוכן אסור"
          icon={AlertOctagon}
          examples={redlineExamples}
          color="text-red-400"
        />
      </div>

      {/* Style Weights */}
      <Card className="bg-[#111113] border-[#222]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            Style Weights
          </CardTitle>
          <CardDescription className="text-[#888]">
            התאמת הסגנון הברירת מחדל ליצירות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-[#888]">מינימליסטי</span>
              <span className="text-sm font-mono">{styleWeights.minimalism}%</span>
              <span className="text-sm text-[#888]">עמוס</span>
            </div>
            <Slider
              value={[styleWeights.minimalism]}
              onValueChange={([v]) => setStyleWeights({ ...styleWeights, minimalism: v })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-[#888]">מודרני</span>
              <span className="text-sm font-mono">{styleWeights.traditional}%</span>
              <span className="text-sm text-[#888]">מסורתי</span>
            </div>
            <Slider
              value={[styleWeights.traditional]}
              onValueChange={([v]) => setStyleWeights({ ...styleWeights, traditional: v })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-[#888]">מונוכרומטי</span>
              <span className="text-sm font-mono">{styleWeights.colorful}%</span>
              <span className="text-sm text-[#888]">צבעוני</span>
            </div>
            <Slider
              value={[styleWeights.colorful]}
              onValueChange={([v]) => setStyleWeights({ ...styleWeights, colorful: v })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <Button className="w-full bg-primary">
            <Brain className="h-4 w-4 ml-2" />
            שמור הגדרות
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIBrainAdmin;
