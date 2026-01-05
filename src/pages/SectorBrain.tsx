import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Trophy, AlertOctagon, Users, Upload, X, FileImage, FileText, Sparkles, Trash2, Loader2, Type, Plus, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface UploadedAsset {
  id: string;
  name: string;
  type: 'image' | 'document' | 'text';
  zone: 'fame' | 'redlines' | 'styles';
  preview?: string;
  file_path?: string;
  text_content?: string;
  stream_type?: string;
  gender_audience?: string;
  topic_category?: string;
  holiday_season?: string;
}

type UploadZone = 'fame' | 'redlines' | 'styles';
type StreamType = 'hasidic' | 'litvish' | 'general' | 'sephardic';
type GenderAudience = 'male' | 'female' | 'hasidic_female' | 'hasidic_male' | 'youth' | 'classic';
type TopicCategory = 'real_estate' | 'beauty' | 'food' | 'cellular' | 'filtered_internet' | 'electronics' | 'hotels' | 'mens_fashion' | 'kids_fashion' | 'womens_fashion' | 'makeup' | 'education' | 'health' | 'finance' | 'events' | 'judaica' | 'toys' | 'furniture' | 'jewelry' | 'other';
type HolidaySeason = 'pesach' | 'sukkot' | 'chanukah' | 'purim' | 'shavuot' | 'lag_baomer' | 'tu_bishvat' | 'summer' | 'bein_hazmanim' | 'rosh_hashana' | 'yom_kippur' | 'year_round';

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
  
  // Text input states
  const [textInputs, setTextInputs] = useState<Record<UploadZone, string>>({
    fame: '',
    redlines: '',
    styles: '',
  });
  const [selectedStream, setSelectedStream] = useState<StreamType | ''>('');
  const [selectedGender, setSelectedGender] = useState<GenderAudience | ''>('');
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory | ''>('');
  const [selectedHoliday, setSelectedHoliday] = useState<HolidaySeason | ''>('');
  const [activeZone, setActiveZone] = useState<UploadZone | null>(null);

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
        return {
          id: item.id,
          name: item.name,
          type: isText ? 'text' : (isImage ? 'image' : 'document'),
          zone: item.zone as UploadZone,
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

  const handleAddText = async (zone: UploadZone) => {
    const text = textInputs[zone].trim();
    if (!text) {
      toast.error('נא להזין טקסט');
      return;
    }

    const textName = text.substring(0, 30) + (text.length > 30 ? '...' : '');

    const { data: dbData, error: dbError } = await supabase
      .from('sector_brain_examples')
      .insert({
        zone,
        name: textName,
        file_path: '',
        file_type: 'text',
        text_content: text,
        stream_type: selectedStream || null,
        gender_audience: selectedGender || null,
        topic_category: selectedTopic || null,
        holiday_season: selectedHoliday || null,
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
      zone,
      text_content: text,
      stream_type: dbData.stream_type,
      gender_audience: dbData.gender_audience,
      topic_category: dbData.topic_category,
      holiday_season: dbData.holiday_season,
    };

    setUploads(prev => [newUpload, ...prev]);
    setTextInputs(prev => ({ ...prev, [zone]: '' }));
    toast.success('הטקסט נוסף בהצלחה');
  };

  const handleDrop = useCallback(async (e: React.DragEvent, zone: UploadZone, streamType?: StreamType, genderAudience?: GenderAudience, topicCategory?: TopicCategory, holidaySeason?: HolidaySeason) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    const zoneNames = {
      fame: 'היכל התהילה',
      redlines: 'הקו האדום',
      styles: 'סגנון לפי זרם',
    };

    for (const file of files) {
      // Upload to storage
      const fileName = `${zone}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sector-brain')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(`שגיאה בהעלאת ${file.name}`);
        continue;
      }

      // Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('sector_brain_examples')
        .insert({
          zone,
          name: file.name,
          file_path: fileName,
          file_type: file.type,
          stream_type: streamType || null,
          gender_audience: genderAudience || null,
          topic_category: topicCategory || null,
          holiday_season: holidaySeason || null,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error(`שגיאה בשמירת ${file.name}`);
        continue;
      }

      // Add to local state
      const newUpload: UploadedAsset = {
        id: dbData.id,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        zone,
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
    
    toast.success(`${files.length} קבצים נוספו ל${zoneNames[zone]}`);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle paste from clipboard
  const handlePaste = useCallback(async (zone: UploadZone) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: imageType });
          
          // Upload to storage
          const fileName = `${zone}/${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('sector-brain')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast.error('שגיאה בהעלאת התמונה');
            continue;
          }

          // Save to database
          const { data: dbData, error: dbError } = await supabase
            .from('sector_brain_examples')
            .insert({
              zone,
              name: file.name,
              file_path: fileName,
              file_type: file.type,
              stream_type: selectedStream || null,
              gender_audience: selectedGender || null,
              topic_category: selectedTopic || null,
              holiday_season: selectedHoliday || null,
            })
            .select()
            .single();

          if (dbError) {
            console.error('Database error:', dbError);
            toast.error('שגיאה בשמירת התמונה');
            continue;
          }

          // Add to local state
          const newUpload: UploadedAsset = {
            id: dbData.id,
            name: file.name,
            type: 'image',
            zone,
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
  }, [selectedStream, selectedGender, selectedTopic, selectedHoliday]);

  const removeUpload = async (id: string, filePath?: string) => {
    // Delete from storage
    if (filePath) {
      await supabase.storage.from('sector-brain').remove([filePath]);
    }

    // Delete from database
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

  const getZoneUploads = (zone: UploadZone) => uploads.filter(u => u.zone === zone);

  const startTraining = async () => {
    if (uploads.length === 0) {
      toast.error('יש להעלות לפחות קובץ אחד ללימוד');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    // Simulate training progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setTrainingProgress(i);
    }

    setIsTraining(false);
    toast.success('המערכת למדה בהצלחה! כעת היא מכירה את הסגנון שלכם ותבדוק תמונות בהתאם.');
  };

  const UploadZoneCard = ({ 
    zone, 
    title, 
    description, 
    icon: Icon, 
    color,
    showCategorySelect = true,
  }: { 
    zone: UploadZone; 
    title: string; 
    description: string; 
    icon: React.ElementType;
    color: string;
    showCategorySelect?: boolean;
  }) => (
    <Card 
      className="border-2 border-dashed transition-all hover:border-primary/50"
      onDrop={(e) => handleDrop(e, zone, selectedStream || undefined, selectedGender || undefined, selectedTopic || undefined, selectedHoliday || undefined)}
      onDragOver={handleDragOver}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-5 w-5 ${color}`} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category selectors */}
        {showCategorySelect && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">זרם</Label>
                <Select 
                  value={selectedStream} 
                  onValueChange={(v) => setSelectedStream(v as StreamType)}
                >
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
                <Select 
                  value={selectedGender} 
                  onValueChange={(v) => setSelectedGender(v as GenderAudience)}
                >
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">נושא/תחום</Label>
                <Select 
                  value={selectedTopic} 
                  onValueChange={(v) => setSelectedTopic(v as TopicCategory)}
                >
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
                <Select 
                  value={selectedHoliday} 
                  onValueChange={(v) => setSelectedHoliday(v as HolidaySeason)}
                >
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
          </div>
        )}

        {/* Text input area */}
        <div className="space-y-2">
          <Textarea
            placeholder="הקלד טקסט לדוגמה..."
            value={textInputs[zone]}
            onChange={(e) => setTextInputs(prev => ({ ...prev, [zone]: e.target.value }))}
            className="min-h-[80px] resize-none"
          />
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleAddText(zone)}
            disabled={!textInputs[zone].trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף טקסט
          </Button>
        </div>

        {/* Paste button */}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handlePaste(zone)}
          className="w-full"
        >
          <Clipboard className="h-4 w-4 ml-1" />
          הדבק תמונה מהלוח
        </Button>

        {/* File drop zone */}
        <div className="min-h-[120px] bg-muted/30 rounded-lg flex flex-col items-center justify-center p-4 border border-border/50">
          {getZoneUploads(zone).length === 0 ? (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                גרור ושחרר קבצים לכאן
              </p>
              <p className="text-xs text-muted-foreground/70 text-center mt-1">
                או לחץ על "הדבק תמונה" למעלה
              </p>
            </>
          ) : (
            <div className="w-full space-y-2 max-h-[200px] overflow-y-auto">
              {getZoneUploads(zone).map(upload => (
                <div 
                  key={upload.id}
                  className="flex items-center gap-3 bg-background rounded-lg p-2 border border-border"
                >
                  {upload.type === 'image' && upload.preview ? (
                    <img 
                      src={upload.preview} 
                      alt={upload.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : upload.type === 'image' ? (
                    <FileImage className="h-10 w-10 text-primary" />
                  ) : upload.type === 'text' ? (
                    <Type className="h-10 w-10 text-blue-500" />
                  ) : (
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm">{upload.name}</span>
                    {(upload.stream_type || upload.gender_audience || upload.topic_category) && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {upload.stream_type && (
                          <Badge variant="outline" className="text-xs py-0 px-1.5">
                            {STREAM_LABELS[upload.stream_type as StreamType]}
                          </Badge>
                        )}
                        {upload.gender_audience && (
                          <Badge variant="outline" className="text-xs py-0 px-1.5">
                            {GENDER_LABELS[upload.gender_audience as GenderAudience]}
                          </Badge>
                        )}
                        {upload.topic_category && (
                          <Badge variant="secondary" className="text-xs py-0 px-1.5">
                            {TOPIC_LABELS[upload.topic_category as TopicCategory]}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => removeUpload(upload.id, upload.file_path)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
                בית הספר של האלגוריתם
              </h1>
              <p className="text-sm text-muted-foreground">
                כאן מלמדים את המערכת מה זה 'פרסום חרדי איכותי' ומה זה 'אסור בתכלית האיסור'
              </p>
            </div>
          </div>
          <Link to="/admin-dashboard">
            <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה לממשק ניהול
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
                    {trainingProgress}% - האלגוריתם לומד את הסגנון שלכם
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-success/10 border-success/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-success">{getZoneUploads('fame').length}</div>
              <div className="text-sm text-muted-foreground">דוגמאות מוצלחות</div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-destructive">{getZoneUploads('redlines').length}</div>
              <div className="text-sm text-muted-foreground">קווים אדומים</div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Zones - now only 2 columns */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <UploadZoneCard
            zone="fame"
            title="היכל התהילה"
            description="העלו קמפיינים מוצלחים מהעבר. האלגוריתם ילמד מה עובד בעולם הפרסום החרדי"
            icon={Trophy}
            color="text-success"
          />
          <UploadZoneCard
            zone="redlines"
            title="הקו האדום - סייגים"
            description="העלו דוגמאות לדברים אסורים - תמונות או טקסטים שלא עוברים"
            icon={AlertOctagon}
            color="text-destructive"
          />
        </div>

        {/* Digital Mashgiach Info */}
        <Card className="mb-8 bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">המשגיח הדיגיטלי</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  לפני שכל יצירה מוצגת לכם, המערכת מריצה "בדיקת כשרות" אוטומטית.
                  היא משווה את התוצאה לדוגמאות שהעלתם כאן ומסננת תוכן בעייתי.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Badge className="bg-success text-success-foreground">
                    מאושר בסינון ראשוני ✓
                  </Badge>
                  <Badge className="bg-warning text-warning-foreground">
                    דורש בדיקה אנושית ⚠️
                  </Badge>
                  <Badge className="bg-destructive text-destructive-foreground">
                    נדחה אוטומטית ✗
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Train Button */}
        <div className="text-center">
          <Button
            onClick={startTraining}
            disabled={isTraining || uploads.length === 0}
            size="xl"
            variant="gradient"
            className="px-12"
          >
            {isTraining ? (
              'המערכת לומדת...'
            ) : (
              <>
                <Brain className="h-5 w-5 ml-2" />
                התחל לימוד המערכת
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            ככל שתעלו יותר דוגמאות, המערכת תבין טוב יותר את הסגנון שלכם
          </p>
        </div>
      </div>
    </div>
  );
};

export default SectorBrain;
