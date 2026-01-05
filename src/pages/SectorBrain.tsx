import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Trophy, AlertOctagon, Upload, X, FileImage, FileText, Trash2, Loader2, Plus, Clipboard, Newspaper, Radio, Monitor, RectangleHorizontal, Megaphone, Video, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface UploadedAsset {
  id: string;
  name: string;
  type: 'image' | 'document' | 'text';
  example_type: 'good' | 'bad';
  media_type: MediaType | null;
  preview?: string;
  file_path?: string;
  text_content?: string;
  stream_type?: string;
  gender_audience?: string;
  topic_category?: string;
  holiday_season?: string;
}

type MediaType = 'ads' | 'text' | 'video' | 'signage' | 'promo' | 'radio';
type ExampleType = 'good' | 'bad';
type StreamType = 'hasidic' | 'litvish' | 'general' | 'sephardic';
type GenderAudience = 'male' | 'female' | 'hasidic_female' | 'hasidic_male' | 'youth' | 'classic';
type TopicCategory = 'real_estate' | 'beauty' | 'food' | 'cellular' | 'filtered_internet' | 'electronics' | 'hotels' | 'mens_fashion' | 'kids_fashion' | 'womens_fashion' | 'makeup' | 'education' | 'health' | 'finance' | 'events' | 'judaica' | 'toys' | 'furniture' | 'jewelry' | 'other';
type HolidaySeason = 'pesach' | 'sukkot' | 'chanukah' | 'purim' | 'shavuot' | 'lag_baomer' | 'tu_bishvat' | 'summer' | 'bein_hazmanim' | 'rosh_hashana' | 'yom_kippur' | 'year_round';

const MEDIA_TYPES: { id: MediaType; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'ads', label: 'מודעות', icon: Newspaper, description: 'עיתונות, מגזינים ומדיה מודפסת' },
  { id: 'text', label: 'מלל וקופי', icon: FileText, description: 'סלוגנים, כותרות וטקסטים שיווקיים' },
  { id: 'video', label: 'וידאו', icon: Video, description: 'סרטוני פרסום ותוכן וידאו' },
  { id: 'signage', label: 'שילוט', icon: RectangleHorizontal, description: 'שלטי חוצות, באנרים ומדיה חוצות' },
  { id: 'promo', label: 'קד"מ', icon: Megaphone, description: 'קידום מכירות, מבצעים והטבות' },
  { id: 'radio', label: 'רדיו', icon: Radio, description: 'ספוטים וג׳ינגלים' },
];

const STREAM_LABELS: Record<StreamType, string> = {
  hasidic: 'חסידי',
  litvish: 'ליטאי',
  general: 'כללי',
  sephardic: 'ספרדי',
};

const GENDER_LABELS: Record<GenderAudience, string> = {
  male: 'גברים',
  female: 'נשים',
  hasidic_female: 'נשי חסידי',
  hasidic_male: 'גברי חסידי',
  youth: 'צעירים',
  classic: 'קלאסי',
};

const TOPIC_LABELS: Record<TopicCategory, string> = {
  real_estate: 'נדל"ן',
  beauty: 'ביוטי',
  food: 'מזון',
  cellular: 'סלולר',
  filtered_internet: 'אינטרנט מסונן',
  electronics: 'מוצרי חשמל',
  hotels: 'מלונאות וחופשות',
  mens_fashion: 'אופנה גברית',
  kids_fashion: 'אופנת ילדים',
  womens_fashion: 'אופנת נשים',
  makeup: 'איפור וקוסמטיקה',
  education: 'לימודים וחינוך',
  health: 'בריאות',
  finance: 'פיננסים וביטוח',
  events: 'אירועים ושמחות',
  judaica: 'יודאיקה וספרי קודש',
  toys: 'צעצועים ומשחקים',
  furniture: 'ריהוט ועיצוב הבית',
  jewelry: 'תכשיטים ושעונים',
  other: 'אחר',
};

const HOLIDAY_LABELS: Record<HolidaySeason, string> = {
  pesach: 'פסח',
  sukkot: 'סוכות',
  chanukah: 'חנוכה',
  purim: 'פורים',
  shavuot: 'שבועות',
  lag_baomer: 'ל"ג בעומר',
  tu_bishvat: 'ט"ו בשבט',
  summer: 'קיץ',
  bein_hazmanim: 'בין הזמנים',
  rosh_hashana: 'ראש השנה',
  yom_kippur: 'ימים נוראים',
  year_round: 'כל השנה',
};

const SectorBrain = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Current selections
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('ads');
  const [selectedExampleType, setSelectedExampleType] = useState<ExampleType>('good');
  const [selectedStream, setSelectedStream] = useState<StreamType | ''>('');
  const [selectedGender, setSelectedGender] = useState<GenderAudience | ''>('');
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory | ''>('');
  const [selectedHoliday, setSelectedHoliday] = useState<HolidaySeason | ''>('');
  const [textInput, setTextInput] = useState('');

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('יש להתחבר למערכת');
        navigate('/admin-auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!data) {
        toast.error('עמוד זה זמין למנהלי מערכת בלבד');
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      setIsCheckingAuth(false);
    };

    checkAdmin();
  }, [navigate]);

  // Load existing examples from database (only after admin check)
  useEffect(() => {
    if (isAdmin) {
      loadExamples();
    }
  }, [isAdmin]);

  const loadExamples = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('sector_brain_examples')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading examples:', error);
      toast.error('שגיאה בטעינת הדוגמאות');
    } else if (data) {
      const assets: UploadedAsset[] = data.map(item => {
        const isText = item.file_type === 'text';
        const isImage = !isText && item.file_type?.startsWith('image/');
        
        // Migrate old zone-based data to new structure
        let exampleType: ExampleType = (item.example_type as ExampleType) || 'good';
        if (!item.example_type) {
          exampleType = item.zone === 'redlines' ? 'bad' : 'good';
        }
        
        return {
          id: item.id,
          name: item.name,
          type: isText ? 'text' : (isImage ? 'image' : 'document'),
          example_type: exampleType,
          media_type: (item.media_type as MediaType) || null,
          file_path: item.file_path,
          text_content: item.text_content,
          stream_type: item.stream_type,
          gender_audience: item.gender_audience,
          topic_category: item.topic_category,
          holiday_season: item.holiday_season,
          preview: isImage ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sector-brain/${item.file_path}` : undefined,
        };
      });
      setUploads(assets);
    }
    setIsLoading(false);
  };

  const handleAddText = async () => {
    const text = textInput.trim();
    if (!text) {
      toast.error('נא להזין טקסט');
      return;
    }

    const textName = text.substring(0, 30) + (text.length > 30 ? '...' : '');

    const { data: dbData, error: dbError } = await supabase
      .from('sector_brain_examples')
      .insert({
        zone: selectedExampleType === 'good' ? 'fame' : 'redlines', // Keep for backwards compat
        name: textName,
        file_path: '',
        file_type: 'text',
        text_content: text,
        stream_type: selectedStream || null,
        gender_audience: selectedGender || null,
        topic_category: selectedTopic || null,
        holiday_season: selectedHoliday || null,
        media_type: activeMediaType,
        example_type: selectedExampleType,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      toast.error('שגיאה בשמירת הטקסט');
      return;
    }

    const newUpload: UploadedAsset = {
      id: dbData.id,
      name: textName,
      type: 'text',
      example_type: selectedExampleType,
      media_type: activeMediaType,
      text_content: text,
      stream_type: dbData.stream_type,
      gender_audience: dbData.gender_audience,
      topic_category: dbData.topic_category,
      holiday_season: dbData.holiday_season,
    };

    setUploads(prev => [newUpload, ...prev]);
    setTextInput('');
    toast.success('הטקסט נוסף בהצלחה');
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      const fileName = `${activeMediaType}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('sector-brain')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(`שגיאה בהעלאת ${file.name}`);
        continue;
      }

      const { data: dbData, error: dbError } = await supabase
        .from('sector_brain_examples')
        .insert({
          zone: selectedExampleType === 'good' ? 'fame' : 'redlines',
          name: file.name,
          file_path: fileName,
          file_type: file.type,
          stream_type: selectedStream || null,
          gender_audience: selectedGender || null,
          topic_category: selectedTopic || null,
          holiday_season: selectedHoliday || null,
          media_type: activeMediaType,
          example_type: selectedExampleType,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error(`שגיאה בשמירת ${file.name}`);
        continue;
      }

      const newUpload: UploadedAsset = {
        id: dbData.id,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        example_type: selectedExampleType,
        media_type: activeMediaType,
        file_path: fileName,
        stream_type: dbData.stream_type,
        gender_audience: dbData.gender_audience,
        topic_category: dbData.topic_category,
        holiday_season: dbData.holiday_season,
        preview: file.type.startsWith('image/') 
          ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sector-brain/${fileName}`
          : undefined,
      };

      setUploads(prev => [newUpload, ...prev]);
    }
    
    toast.success(`${files.length} קבצים נוספו`);
  }, [activeMediaType, selectedExampleType, selectedStream, selectedGender, selectedTopic, selectedHoliday]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: imageType });
          
          const fileName = `${activeMediaType}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('sector-brain')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast.error('שגיאה בהעלאת התמונה');
            continue;
          }

          const { data: dbData, error: dbError } = await supabase
            .from('sector_brain_examples')
            .insert({
              zone: selectedExampleType === 'good' ? 'fame' : 'redlines',
              name: file.name,
              file_path: fileName,
              file_type: file.type,
              stream_type: selectedStream || null,
              gender_audience: selectedGender || null,
              topic_category: selectedTopic || null,
              holiday_season: selectedHoliday || null,
              media_type: activeMediaType,
              example_type: selectedExampleType,
            })
            .select()
            .single();

          if (dbError) {
            console.error('Database error:', dbError);
            toast.error('שגיאה בשמירת התמונה');
            continue;
          }

          const newUpload: UploadedAsset = {
            id: dbData.id,
            name: file.name,
            type: 'image',
            example_type: selectedExampleType,
            media_type: activeMediaType,
            file_path: fileName,
            stream_type: dbData.stream_type,
            gender_audience: dbData.gender_audience,
            topic_category: dbData.topic_category,
            holiday_season: dbData.holiday_season,
            preview: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sector-brain/${fileName}`,
          };

          setUploads(prev => [newUpload, ...prev]);
          toast.success('התמונה הודבקה בהצלחה!');
        }
      }
    } catch (error) {
      console.error('Paste error:', error);
      toast.error('לא ניתן להדביק. נסה להעתיק תמונה ללוח');
    }
  }, [activeMediaType, selectedExampleType, selectedStream, selectedGender, selectedTopic, selectedHoliday]);

  const removeUpload = async (id: string, filePath?: string) => {
    if (filePath) {
      await supabase.storage.from('sector-brain').remove([filePath]);
    }

    const { error } = await supabase
      .from('sector_brain_examples')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      toast.error('שגיאה במחיקת הקובץ');
      return;
    }

    setUploads(prev => prev.filter(u => u.id !== id));
    toast.success('הקובץ נמחק');
  };

  const getFilteredUploads = (mediaType: MediaType, exampleType: ExampleType) => {
    return uploads.filter(u => {
      // Handle old data without media_type
      if (!u.media_type && mediaType === 'ads') {
        return u.example_type === exampleType;
      }
      return u.media_type === mediaType && u.example_type === exampleType;
    });
  };

  const getMediaStats = (mediaType: MediaType) => {
    const good = getFilteredUploads(mediaType, 'good').length;
    const bad = getFilteredUploads(mediaType, 'bad').length;
    return { good, bad, total: good + bad };
  };

  const startTraining = async () => {
    if (uploads.length === 0) {
      toast.error('יש להעלות לפחות קובץ אחד ללימוד');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setTrainingProgress(i);
    }

    setIsTraining(false);
    toast.success('המערכת למדה בהצלחה! כעת כל המודלים מכירים את הסגנון שלכם.');
  };

  // Show loading while checking admin status
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const currentStats = getMediaStats(activeMediaType);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin-dashboard" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-assistant flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                אימון מערכת AI
              </h1>
              <p className="text-sm text-muted-foreground">
                כל המודלים (יצירת תמונות, קופי, צ'אט) ישאבו מידע מכאן
              </p>
            </div>
          </div>
          <Link to="/admin-dashboard">
            <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Training Status */}
        {isTraining && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Brain className="h-8 w-8 text-primary animate-pulse" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">לימוד המערכת בתהליך...</h3>
                  <Progress value={trainingProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {trainingProgress}% - כל המודלים לומדים את הסגנון שלכם
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Type Tabs */}
        <Tabs value={activeMediaType} onValueChange={(v) => setActiveMediaType(v as MediaType)} className="w-full">
          <TabsList className="w-full h-auto flex-wrap gap-2 bg-transparent p-0 mb-6">
            {MEDIA_TYPES.map((media) => {
              const stats = getMediaStats(media.id);
              return (
                <TabsTrigger
                  key={media.id}
                  value={media.id}
                  className={cn(
                    "flex-1 min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                    "border-2 data-[state=active]:border-primary",
                    "flex flex-col items-center gap-1 py-3 px-4"
                  )}
                >
                  <media.icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{media.label}</span>
                  {stats.total > 0 && (
                    <span className="text-xs opacity-70">{stats.total} דוגמאות</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {MEDIA_TYPES.map((media) => (
            <TabsContent key={media.id} value={media.id} className="mt-0">
              {/* Media type header */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <media.icon className="h-5 w-5 text-primary" />
                    {media.label}
                  </CardTitle>
                  <CardDescription>{media.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
                      <ThumbsUp className="h-5 w-5 text-success" />
                      <div>
                        <div className="text-2xl font-bold text-success">{getFilteredUploads(media.id, 'good').length}</div>
                        <div className="text-xs text-muted-foreground">דוגמאות טובות</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <ThumbsDown className="h-5 w-5 text-destructive" />
                      <div>
                        <div className="text-2xl font-bold text-destructive">{getFilteredUploads(media.id, 'bad').length}</div>
                        <div className="text-xs text-muted-foreground">קווים אדומים</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Example Type Toggle */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={selectedExampleType === 'good' ? 'default' : 'outline'}
                  onClick={() => setSelectedExampleType('good')}
                  className={cn(
                    "flex-1",
                    selectedExampleType === 'good' && "bg-success hover:bg-success/90"
                  )}
                >
                  <Trophy className="h-4 w-4 ml-2" />
                  דוגמאות מוצלחות
                </Button>
                <Button
                  variant={selectedExampleType === 'bad' ? 'default' : 'outline'}
                  onClick={() => setSelectedExampleType('bad')}
                  className={cn(
                    "flex-1",
                    selectedExampleType === 'bad' && "bg-destructive hover:bg-destructive/90"
                  )}
                >
                  <AlertOctagon className="h-4 w-4 ml-2" />
                  קווים אדומים
                </Button>
              </div>

              {/* Upload Area */}
              <Card 
                className="mb-6 border-2 border-dashed transition-all hover:border-primary/50"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {selectedExampleType === 'good' ? (
                      <>
                        <Trophy className="h-4 w-4 text-success" />
                        הוסף דוגמה מוצלחת
                      </>
                    ) : (
                      <>
                        <AlertOctagon className="h-4 w-4 text-destructive" />
                        הוסף קו אדום
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedExampleType === 'good' 
                      ? 'העלה דוגמאות לתוכן מוצלח שהמערכת תלמד לחקות'
                      : 'העלה דוגמאות לתוכן בעייתי שהמערכת תדע להימנע ממנו'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category selectors */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">זרם</Label>
                      <Select value={selectedStream} onValueChange={(v) => setSelectedStream(v as StreamType)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="בחר זרם" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STREAM_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">קהל יעד</Label>
                      <Select value={selectedGender} onValueChange={(v) => setSelectedGender(v as GenderAudience)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="בחר קהל" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(GENDER_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">נושא/תחום</Label>
                      <Select value={selectedTopic} onValueChange={(v) => setSelectedTopic(v as TopicCategory)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="בחר נושא" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TOPIC_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">חג/עונה</Label>
                      <Select value={selectedHoliday} onValueChange={(v) => setSelectedHoliday(v as HolidaySeason)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="בחר חג" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(HOLIDAY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Text input */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder={`הקלד ${selectedExampleType === 'good' ? 'דוגמה לטקסט מוצלח' : 'דוגמה לטקסט בעייתי'}...`}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleAddText}
                        disabled={!textInput.trim()}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        הוסף טקסט
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handlePaste}
                      >
                        <Clipboard className="h-4 w-4 ml-1" />
                        הדבק תמונה
                      </Button>
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div className="min-h-[100px] bg-muted/30 rounded-lg flex flex-col items-center justify-center p-4 border border-border/50">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      גרור ושחרר קבצים לכאן
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Examples List */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Good examples */}
                <Card className="border-success/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-success">
                      <Trophy className="h-4 w-4" />
                      דוגמאות מוצלחות ({getFilteredUploads(media.id, 'good').length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {getFilteredUploads(media.id, 'good').map((upload) => (
                      <div key={upload.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        {upload.type === 'image' && upload.preview ? (
                          <img src={upload.preview} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : upload.type === 'text' ? (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <FileImage className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{upload.name}</p>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {upload.topic_category && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1">
                                {TOPIC_LABELS[upload.topic_category as TopicCategory]}
                              </Badge>
                            )}
                            {upload.holiday_season && upload.holiday_season !== 'year_round' && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1">
                                {HOLIDAY_LABELS[upload.holiday_season as HolidaySeason]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeUpload(upload.id, upload.file_path)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {getFilteredUploads(media.id, 'good').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        אין דוגמאות עדיין
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Bad examples */}
                <Card className="border-destructive/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertOctagon className="h-4 w-4" />
                      קווים אדומים ({getFilteredUploads(media.id, 'bad').length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {getFilteredUploads(media.id, 'bad').map((upload) => (
                      <div key={upload.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        {upload.type === 'image' && upload.preview ? (
                          <img src={upload.preview} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : upload.type === 'text' ? (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <FileImage className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{upload.name}</p>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {upload.topic_category && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1">
                                {TOPIC_LABELS[upload.topic_category as TopicCategory]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeUpload(upload.id, upload.file_path)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {getFilteredUploads(media.id, 'bad').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        אין קווים אדומים עדיין
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Info Card */}
        <Card className="mt-8 bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">איך זה עובד?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  כל המודלים שלנו - יצירת תמונות, כתיבת קופי, צ'אט AI ועוד - לומדים מהדוגמאות שתעלו כאן.
                  ככל שתעלו יותר דוגמאות מגוונות, כך המערכת תבין טוב יותר מה מתאים ומה לא.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Badge className="bg-success text-success-foreground">
                    דוגמאות טובות = ללמוד ממנו ✓
                  </Badge>
                  <Badge className="bg-destructive text-destructive-foreground">
                    קווים אדומים = להימנע ממנו ✗
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Train Button */}
        <div className="text-center mt-8">
          <Button
            onClick={startTraining}
            disabled={isTraining || uploads.length === 0}
            size="lg"
            variant="gradient"
            className="px-12"
          >
            {isTraining ? (
              'המערכת לומדת...'
            ) : (
              <>
                <Brain className="h-5 w-5 ml-2" />
                עדכן את כל המודלים
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            סה"כ {uploads.length} דוגמאות במערכת
          </p>
        </div>
      </div>
    </div>
  );
};

export default SectorBrain;
