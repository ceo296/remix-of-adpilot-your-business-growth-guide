import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Trophy, AlertOctagon, Upload, X, FileImage, FileText, Trash2, Loader2, Plus, Clipboard, Newspaper, Radio, Monitor, RectangleHorizontal, Megaphone, Video, Check, ThumbsUp, ThumbsDown, Copy, Link2, BookOpen, Lightbulb, ChevronDown, ChevronUp, Sparkles, RefreshCw, Filter, BarChart3, Calendar, Tag, Eye, FolderOpen, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import BulkUpload from '@/components/admin/BulkUpload';

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
  is_general_guideline?: boolean;
}

type MediaType = 'ads' | 'text' | 'video' | 'signage' | 'promo' | 'radio';
type ExampleType = 'good' | 'bad';
type StreamType = 'hasidic' | 'litvish' | 'general' | 'sephardic';
type GenderAudience = 'male' | 'female' | 'hasidic_female' | 'hasidic_male' | 'youth' | 'classic';
type TopicCategory = 'real_estate' | 'beauty' | 'food' | 'cellular' | 'filtered_internet' | 'electronics' | 'hotels' | 'mens_fashion' | 'kids_fashion' | 'womens_fashion' | 'wigs' | 'makeup' | 'education' | 'health' | 'finance' | 'events' | 'judaica' | 'toys' | 'furniture' | 'jewelry' | 'other';
type HolidaySeason = 'pesach' | 'sukkot' | 'chanukah' | 'purim' | 'shavuot' | 'lag_baomer' | 'tu_bishvat' | 'summer' | 'bein_hazmanim' | 'rosh_hashana' | 'yom_kippur' | 'year_round';

const MEDIA_TYPES: { id: MediaType; label: string; icon: React.ElementType }[] = [
  { id: 'ads', label: 'מודעות', icon: Newspaper },
  { id: 'text', label: 'מלל', icon: FileText },
  { id: 'video', label: 'וידאו', icon: Video },
  { id: 'signage', label: 'שילוט', icon: RectangleHorizontal },
  { id: 'promo', label: 'קד"מ', icon: Megaphone },
  { id: 'radio', label: 'רדיו', icon: Radio },
];

const STREAM_LABELS: Record<StreamType, string> = {
  general: 'כלל הציבור החרדי',
  litvish: 'ליטאי',
  hasidic: 'חסידי',
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
  wigs: 'פאות',
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
  year_round: 'כל השנה',
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
};

type ViewTab = 'dashboard' | 'browse' | 'upload' | 'insights';

const SectorBrain = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [guidelines, setGuidelines] = useState<UploadedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');

  // Upload form state
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('ads');
  const [selectedExampleType, setSelectedExampleType] = useState<ExampleType>('good');
  const [selectedStream, setSelectedStream] = useState<StreamType | ''>('');
  const [selectedGender, setSelectedGender] = useState<GenderAudience | ''>('');
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory | ''>('');
  const [selectedHoliday, setSelectedHoliday] = useState<HolidaySeason | ''>('');
  const [textInput, setTextInput] = useState('');
  const [guidelineInput, setGuidelineInput] = useState('');

  // Browse filters
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterHoliday, setFilterHoliday] = useState<string>('all');
  const [filterMedia, setFilterMedia] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // AI Insights
  const [aiInsights, setAiInsights] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInsightType, setSelectedInsightType] = useState<string | null>(null);
  const [insightCategory, setInsightCategory] = useState<'general' | 'visual' | 'media' | 'stream' | 'holiday' | 'topic'>('general');
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; name: string } | null>(null);

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

  useEffect(() => {
    if (isAdmin) loadExamples();
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
      const guidelinesArr: UploadedAsset[] = [];
      const examplesArr: UploadedAsset[] = [];
      
      data.forEach(item => {
        const isText = item.file_type === 'text';
        const isImage = !isText && item.file_type?.startsWith('image/');
        let exampleType: ExampleType = (item.example_type as ExampleType) || 'good';
        if (!item.example_type) {
          exampleType = item.zone === 'redlines' ? 'bad' : 'good';
        }
        
        const asset: UploadedAsset = {
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
          is_general_guideline: item.is_general_guideline || false,
          preview: isImage ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sector-brain/${item.file_path}` : undefined,
        };
        
        if (item.is_general_guideline) {
          guidelinesArr.push(asset);
        } else {
          examplesArr.push(asset);
        }
      });
      
      setGuidelines(guidelinesArr);
      setUploads(examplesArr);
    }
    setIsLoading(false);
  };

  // === Stats Computations ===
  const stats = useMemo(() => {
    const byTopic: Record<string, number> = {};
    const byHoliday: Record<string, number> = {};
    const byMedia: Record<string, number> = {};
    let untaggedTopic = 0;
    let untaggedHoliday = 0;

    uploads.forEach(u => {
      if (u.topic_category) {
        byTopic[u.topic_category] = (byTopic[u.topic_category] || 0) + 1;
      } else {
        untaggedTopic++;
      }
      if (u.holiday_season && u.holiday_season !== 'year_round') {
        byHoliday[u.holiday_season] = (byHoliday[u.holiday_season] || 0) + 1;
      } else {
        untaggedHoliday++;
      }
      const mt = u.media_type || 'other';
      byMedia[mt] = (byMedia[mt] || 0) + 1;
    });

    return { byTopic, byHoliday, byMedia, untaggedTopic, untaggedHoliday, total: uploads.length, guidelines: guidelines.length };
  }, [uploads, guidelines]);

  // === Filtered browse ===
  const filteredUploads = useMemo(() => {
    return uploads.filter(u => {
      if (filterTopic !== 'all') {
        if (filterTopic === 'untagged') {
          if (u.topic_category) return false;
        } else if (u.topic_category !== filterTopic) return false;
      }
      if (filterHoliday !== 'all') {
        if (filterHoliday === 'year_round') {
          if (u.holiday_season && u.holiday_season !== 'year_round') return false;
        } else if (u.holiday_season !== filterHoliday) return false;
      }
      if (filterMedia !== 'all' && u.media_type !== filterMedia) return false;
      if (filterType !== 'all' && u.example_type !== filterType) return false;
      return true;
    });
  }, [uploads, filterTopic, filterHoliday, filterMedia, filterType]);

  // === Upload handlers ===
  const handleAddText = async () => {
    const text = textInput.trim();
    if (!text) { toast.error('נא להזין טקסט'); return; }
    const textName = text.substring(0, 30) + (text.length > 30 ? '...' : '');
    const { data: dbData, error: dbError } = await supabase
      .from('sector_brain_examples')
      .insert({
        zone: selectedExampleType === 'good' ? 'fame' : 'redlines',
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

    if (dbError) { console.error('Database error:', dbError); toast.error('שגיאה בשמירת הטקסט'); return; }

    setUploads(prev => [{
      id: dbData.id, name: textName, type: 'text', example_type: selectedExampleType,
      media_type: activeMediaType, text_content: text,
      stream_type: dbData.stream_type, gender_audience: dbData.gender_audience,
      topic_category: dbData.topic_category, holiday_season: dbData.holiday_season,
    }, ...prev]);
    setTextInput('');
    toast.success('הטקסט נוסף בהצלחה');
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const fileName = `${activeMediaType}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('sector-brain').upload(fileName, file);
      if (uploadError) { console.error('Upload error:', uploadError); toast.error(`שגיאה בהעלאת ${file.name}`); continue; }
      const { data: dbData, error: dbError } = await supabase
        .from('sector_brain_examples')
        .insert({
          zone: selectedExampleType === 'good' ? 'fame' : 'redlines',
          name: file.name, file_path: fileName, file_type: file.type,
          stream_type: selectedStream || null, gender_audience: selectedGender || null,
          topic_category: selectedTopic || null, holiday_season: selectedHoliday || null,
          media_type: activeMediaType, example_type: selectedExampleType,
        })
        .select().single();
      if (dbError) { console.error('Database error:', dbError); toast.error(`שגיאה בשמירת ${file.name}`); continue; }
      setUploads(prev => [{
        id: dbData.id, name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        example_type: selectedExampleType, media_type: activeMediaType, file_path: fileName,
        stream_type: dbData.stream_type, gender_audience: dbData.gender_audience,
        topic_category: dbData.topic_category, holiday_season: dbData.holiday_season,
        preview: file.type.startsWith('image/') ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sector-brain/${fileName}` : undefined,
      }, ...prev]);
    }
    toast.success(`${files.length} קבצים נוספו`);
  }, [activeMediaType, selectedExampleType, selectedStream, selectedGender, selectedTopic, selectedHoliday]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: imageType });
          const fileName = `${activeMediaType}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from('sector-brain').upload(fileName, file);
          if (uploadError) { toast.error('שגיאה בהעלאת התמונה'); continue; }
          const { data: dbData, error: dbError } = await supabase
            .from('sector_brain_examples')
            .insert({
              zone: selectedExampleType === 'good' ? 'fame' : 'redlines',
              name: file.name, file_path: fileName, file_type: file.type,
              stream_type: selectedStream || null, gender_audience: selectedGender || null,
              topic_category: selectedTopic || null, holiday_season: selectedHoliday || null,
              media_type: activeMediaType, example_type: selectedExampleType,
            })
            .select().single();
          if (dbError) { toast.error('שגיאה בשמירת התמונה'); continue; }
          setUploads(prev => [{
            id: dbData.id, name: file.name, type: 'image',
            example_type: selectedExampleType, media_type: activeMediaType, file_path: fileName,
            stream_type: dbData.stream_type, gender_audience: dbData.gender_audience,
            topic_category: dbData.topic_category, holiday_season: dbData.holiday_season,
            preview: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sector-brain/${fileName}`,
          }, ...prev]);
          toast.success('התמונה הודבקה בהצלחה!');
        }
      }
    } catch (error) { toast.error('לא ניתן להדביק. נסה להעתיק תמונה ללוח'); }
  }, [activeMediaType, selectedExampleType, selectedStream, selectedGender, selectedTopic, selectedHoliday]);

  const removeUpload = async (id: string, filePath?: string) => {
    if (filePath && filePath !== '' && filePath !== 'guideline' && filePath !== 'general-guideline') {
      await supabase.storage.from('sector-brain').remove([filePath]);
    }
    const { error } = await supabase.from('sector_brain_examples').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקת הקובץ'); return; }
    setUploads(prev => prev.filter(u => u.id !== id));
    setGuidelines(prev => prev.filter(g => g.id !== id));
    toast.success('נמחק בהצלחה');
  };

  const handleAddGuideline = async () => {
    const text = guidelineInput.trim();
    if (!text) { toast.error('נא להזין כלל אצבע'); return; }
    const textName = text.substring(0, 50) + (text.length > 50 ? '...' : '');
    const { data: dbData, error: dbError } = await supabase
      .from('sector_brain_examples')
      .insert({
        zone: 'fame', name: textName, file_path: 'general-guideline', file_type: 'text',
        text_content: text, is_general_guideline: true, media_type: null, example_type: 'good',
      })
      .select().single();
    if (dbError) { toast.error('שגיאה בשמירת הכלל'); return; }
    setGuidelines(prev => [{ id: dbData.id, name: textName, type: 'text', example_type: 'good', media_type: null, text_content: text, is_general_guideline: true }, ...prev]);
    setGuidelineInput('');
    toast.success('כלל האצבע נוסף בהצלחה');
  };

  // AI Analysis
  const analyzeContent = async (insightType: string) => {
    setSelectedInsightType(insightType);
    setIsAnalyzing(true);
    setAiInsights('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error('יש להתחבר מחדש למערכת'); setIsAnalyzing(false); return; }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-brain-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ insightType }),
      });
      if (!response.ok) {
        if (response.status === 429) toast.error('הגעת למגבלת הבקשות. נסה שוב בעוד כמה דקות.');
        else if (response.status === 402) toast.error('נגמרו הקרדיטים.');
        else toast.error('שגיאה בניתוח התוכן.');
        setIsAnalyzing(false);
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) { setIsAnalyzing(false); return; }
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullContent += content; setAiInsights(fullContent); }
          } catch { textBuffer = line + '\n' + textBuffer; break; }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('שגיאה בניתוח התוכן');
    } finally { setIsAnalyzing(false); }
  };

  // Save insight as active knowledge for agents
  const saveInsight = async () => {
    if (!aiInsights || !selectedInsightType) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('יש להתחבר מחדש'); return; }
      
      // Upsert - replace existing insight of same type
      const { error: deleteError } = await supabase.from('sector_brain_insights').delete().eq('insight_type', selectedInsightType);
      if (deleteError) console.warn('Delete old insight:', deleteError);
      
      const { error } = await supabase.from('sector_brain_insights').insert({
        insight_type: selectedInsightType,
        content: aiInsights,
        created_by: user.id,
        is_active: true,
      });
      if (error) throw error;
      toast.success('✅ התובנה נשמרה! הסוכנים ישתמשו בה ביצירת מודעות');
    } catch (error) {
      console.error('Save insight error:', error);
      toast.error('שגיאה בשמירת התובנה');
    }
  };

  // Auto-describe images
  const [isDescribing, setIsDescribing] = useState(false);
  const [describeProgress, setDescribeProgress] = useState<{ processed: number; remaining: number } | null>(null);

  const handleAutoDescribe = async () => {
    setIsDescribing(true);
    setDescribeProgress(null);
    try {
      const { data, error } = await supabase.functions.invoke('describe-brain-examples', {
        body: { batchSize: 15 },
      });
      if (error) throw error;
      setDescribeProgress({ processed: data.processed, remaining: data.remaining });
      toast.success(`תואר ${data.processed} דוגמאות בהצלחה${data.remaining > 0 ? ` • נשארו ${data.remaining}` : ' • הכל מתואר!'}`);
      if (data.processed > 0) loadExamples();
    } catch (error) {
      console.error('Describe error:', error);
      toast.error('שגיאה בתיאור אוטומטי');
    } finally { setIsDescribing(false); }
  };

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

  if (!isAdmin) return null;

  const topTopics = Object.entries(stats.byTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topHolidays = Object.entries(stats.byHoliday)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin-dashboard" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold font-assistant flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                אימון מערכת AI - המוח
              </h1>
              <p className="text-xs text-muted-foreground">
                {stats.total} דוגמאות • {stats.guidelines} כללי אצבע
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAutoDescribe} 
              disabled={isDescribing}
              title="תיאור אוטומטי של תמונות ללא תיאור באמצעות AI"
            >
              {isDescribing ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Sparkles className="h-4 w-4 ml-1" />}
              {isDescribing ? 'מתאר...' : 'תאר תמונות'}
              {describeProgress && describeProgress.remaining > 0 && (
                <span className="text-xs bg-primary/20 rounded-full px-1.5 mr-1">{describeProgress.remaining}</span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={loadExamples} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 ml-1", isLoading && "animate-spin")} />
              רענן
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-1">
            {[
              { id: 'dashboard' as ViewTab, label: 'סקירה כללית', icon: BarChart3 },
              { id: 'browse' as ViewTab, label: 'עיון וסינון', icon: FolderOpen },
              { id: 'upload' as ViewTab, label: 'העלאה ואימון', icon: Upload },
              { id: 'insights' as ViewTab, label: 'תובנות AI', icon: Sparkles },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors",
                    activeTab === tab.id
                      ? "bg-background text-primary border border-b-0 border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* === DASHBOARD TAB === */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-primary/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{stats.total}</div>
                      <div className="text-xs text-muted-foreground mt-1">סה"כ דוגמאות</div>
                    </CardContent>
                  </Card>
                  <Card className="border-success/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-success">{uploads.filter(u => u.example_type === 'good').length}</div>
                      <div className="text-xs text-muted-foreground mt-1">דוגמאות מוצלחות</div>
                    </CardContent>
                  </Card>
                  <Card className="border-destructive/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-destructive">{uploads.filter(u => u.example_type === 'bad').length}</div>
                      <div className="text-xs text-muted-foreground mt-1">קווים אדומים</div>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-amber-500">{stats.guidelines}</div>
                      <div className="text-xs text-muted-foreground mt-1">כללי אצבע</div>
                    </CardContent>
                  </Card>
                </div>

                {/* By Topic */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      לפי תחום עסקי
                    </CardTitle>
                    <CardDescription>מה המערכת יודעת על כל תחום</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topTopics.length > 0 ? (
                      <div className="space-y-2">
                        {topTopics.map(([key, count]) => {
                          const maxCount = topTopics[0][1];
                          return (
                            <div key={key} className="flex items-center gap-3">
                              <span className="text-sm w-32 text-right shrink-0">{TOPIC_LABELS[key as TopicCategory] || key}</span>
                              <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                                <div
                                  className="h-full bg-primary/70 rounded-full flex items-center justify-end px-2 transition-all"
                                  style={{ width: `${Math.max((count / maxCount) * 100, 15)}%` }}
                                >
                                  <span className="text-xs font-bold text-primary-foreground">{count}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost" size="sm" className="h-7 px-2"
                                onClick={() => { setFilterTopic(key); setActiveTab('browse'); }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                        {stats.untaggedTopic > 0 && (
                          <div className="flex items-center gap-3 opacity-60">
                            <span className="text-sm w-32 text-right shrink-0">ללא תיוג</span>
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <div
                                className="h-full bg-muted-foreground/30 rounded-full flex items-center justify-end px-2"
                                style={{ width: `${Math.max((stats.untaggedTopic / topTopics[0][1]) * 100, 15)}%` }}
                              >
                                <span className="text-xs font-bold">{stats.untaggedTopic}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2"
                              onClick={() => { setFilterTopic('untagged'); setActiveTab('browse'); }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">אין דוגמאות מתויגות לפי תחום</p>
                    )}
                  </CardContent>
                </Card>

                {/* By Holiday */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      לפי חג / עונה
                    </CardTitle>
                    <CardDescription>מה שייך לחג ספציפי ומה לכל השנה</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Year round first */}
                      <div
                        className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => { setFilterHoliday('year_round'); setActiveTab('browse'); }}
                      >
                        <div className="text-2xl font-bold text-primary">{stats.untaggedHoliday}</div>
                        <div className="text-xs text-muted-foreground">כל השנה / כללי</div>
                      </div>
                      {topHolidays.map(([key, count]) => (
                        <div
                          key={key}
                          className="p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => { setFilterHoliday(key); setActiveTab('browse'); }}
                        >
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground">{HOLIDAY_LABELS[key as HolidaySeason] || key}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* By Media */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-primary" />
                      לפי סוג מדיה
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {MEDIA_TYPES.map(m => {
                        const count = stats.byMedia[m.id] || 0;
                        const Icon = m.icon;
                        return (
                          <div
                            key={m.id}
                            className={cn(
                              "p-3 rounded-lg border text-center cursor-pointer hover:bg-muted/50 transition-colors",
                              count > 0 ? "border-primary/30" : "border-border opacity-50"
                            )}
                            onClick={() => { setFilterMedia(m.id); setActiveTab('browse'); }}
                          >
                            <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                            <div className="text-lg font-bold">{count}</div>
                            <div className="text-[10px] text-muted-foreground">{m.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Guidelines preview */}
                {guidelines.length > 0 && (
                  <Card className="border-amber-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        כללי אצבע ({guidelines.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {guidelines.slice(0, 5).map(g => (
                          <div key={g.id} className="flex items-start gap-2 p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded text-sm">
                            <Lightbulb className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <p className="flex-1 text-xs">{g.text_content}</p>
                          </div>
                        ))}
                        {guidelines.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">+{guidelines.length - 5} נוספים</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* === BROWSE TAB === */}
            {activeTab === 'browse' && (
              <div className="space-y-4">
                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">סינון דוגמאות</span>
                      {(filterTopic !== 'all' || filterHoliday !== 'all' || filterMedia !== 'all' || filterType !== 'all') && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setFilterTopic('all'); setFilterHoliday('all'); setFilterMedia('all'); setFilterType('all'); }}>
                          נקה הכל
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">תחום</Label>
                        <Select value={filterTopic} onValueChange={setFilterTopic}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">הכל</SelectItem>
                            <SelectItem value="untagged">ללא תיוג ({stats.untaggedTopic})</SelectItem>
                            {Object.entries(TOPIC_LABELS).map(([k, v]) => {
                              const cnt = stats.byTopic[k] || 0;
                              return cnt > 0 ? <SelectItem key={k} value={k}>{v} ({cnt})</SelectItem> : null;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">חג / עונה</Label>
                        <Select value={filterHoliday} onValueChange={setFilterHoliday}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">הכל</SelectItem>
                            <SelectItem value="year_round">כל השנה ({stats.untaggedHoliday})</SelectItem>
                            {Object.entries(HOLIDAY_LABELS).filter(([k]) => k !== 'year_round').map(([k, v]) => {
                              const cnt = stats.byHoliday[k] || 0;
                              return cnt > 0 ? <SelectItem key={k} value={k}>{v} ({cnt})</SelectItem> : null;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">סוג מדיה</Label>
                        <Select value={filterMedia} onValueChange={setFilterMedia}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">הכל</SelectItem>
                            {MEDIA_TYPES.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.label} ({stats.byMedia[m.id] || 0})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">סוג דוגמה</Label>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">הכל</SelectItem>
                            <SelectItem value="good">מוצלחות ✓</SelectItem>
                            <SelectItem value="bad">קווים אדומים ✗</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Results count */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    מציג <span className="font-bold text-foreground">{filteredUploads.length}</span> מתוך {uploads.length} דוגמאות
                  </p>
                </div>

                {/* Results grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredUploads.slice(0, 60).map(upload => (
                    <Card 
                      key={upload.id} 
                      className={cn(
                        "overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                        upload.example_type === 'bad' ? "border-destructive/30" : "border-success/30"
                      )}
                      onClick={() => {
                        if (upload.type === 'image' && upload.preview) {
                          setEnlargedImage({ url: upload.preview, name: upload.name });
                        } else if (upload.text_content) {
                          setEnlargedImage({ url: '', name: upload.text_content });
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {upload.type === 'image' && upload.preview ? (
                            <div className="relative group shrink-0">
                              <img src={upload.preview} alt="" className="w-16 h-16 rounded object-cover" />
                              <div className="absolute inset-0 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              {upload.example_type === 'good' ? (
                                <Badge variant="default" className="bg-success text-[10px] py-0">מוצלח</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] py-0">קו אדום</Badge>
                              )}
                              {upload.media_type && (
                                <Badge variant="outline" className="text-[10px] py-0">
                                  {MEDIA_TYPES.find(m => m.id === upload.media_type)?.label}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs truncate mb-1">{upload.name}</p>
                            <div className="flex flex-wrap gap-1">
                              {upload.topic_category && (
                                <Badge variant="secondary" className="text-[9px] py-0 px-1">
                                  {TOPIC_LABELS[upload.topic_category as TopicCategory]}
                                </Badge>
                              )}
                              {upload.holiday_season && upload.holiday_season !== 'year_round' && (
                                <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-400 text-amber-600">
                                  {HOLIDAY_LABELS[upload.holiday_season as HolidaySeason]}
                                </Badge>
                              )}
                              {upload.stream_type && (
                                <Badge variant="outline" className="text-[9px] py-0 px-1">
                                  {STREAM_LABELS[upload.stream_type as StreamType]}
                                </Badge>
                              )}
                            </div>
                            {upload.text_content && (
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{upload.text_content}</p>
                            )}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeUpload(upload.id, upload.file_path); }} className="text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredUploads.length > 60 && (
                  <p className="text-sm text-muted-foreground text-center">מוצגות 60 מתוך {filteredUploads.length} תוצאות</p>
                )}
                {filteredUploads.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>אין דוגמאות שתואמות את הסינון</p>
                  </div>
                )}
              </div>
            )}

            {/* === UPLOAD TAB === */}
            {activeTab === 'upload' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* Bulk Upload */}
                <Collapsible defaultOpen={false}>
                  <Card className="border-2 border-blue-500/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2"><Upload className="h-4 w-4 text-blue-500" /> העלאה מרוכזת</span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent><BulkUpload onUploadComplete={loadExamples} /></CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Single upload */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">הוספת דוגמה בודדת</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Example type */}
                    <div className="flex gap-2">
                      <Button
                        variant={selectedExampleType === 'good' ? 'default' : 'outline'} size="sm"
                        onClick={() => setSelectedExampleType('good')}
                        className={cn("flex-1", selectedExampleType === 'good' && "bg-success hover:bg-success/90")}
                      >
                        <Trophy className="h-4 w-4 ml-1" /> דוגמה מוצלחת
                      </Button>
                      <Button
                        variant={selectedExampleType === 'bad' ? 'default' : 'outline'} size="sm"
                        onClick={() => setSelectedExampleType('bad')}
                        className={cn("flex-1", selectedExampleType === 'bad' && "bg-destructive hover:bg-destructive/90")}
                      >
                        <AlertOctagon className="h-4 w-4 ml-1" /> קו אדום
                      </Button>
                    </div>

                    {/* Media type */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">סוג מדיה</Label>
                      <div className="flex flex-wrap gap-2">
                        {MEDIA_TYPES.map(m => {
                          const Icon = m.icon;
                          return (
                            <Button
                              key={m.id}
                              variant={activeMediaType === m.id ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setActiveMediaType(m.id)}
                              className="gap-1"
                            >
                              <Icon className="h-3.5 w-3.5" /> {m.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">תחום</Label>
                        <Select value={selectedTopic} onValueChange={(v) => setSelectedTopic(v as TopicCategory)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="בחר תחום" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(TOPIC_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">חג/עונה</Label>
                        <Select value={selectedHoliday} onValueChange={(v) => setSelectedHoliday(v as HolidaySeason)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="בחר חג" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(HOLIDAY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">זרם</Label>
                        <Select value={selectedStream} onValueChange={(v) => setSelectedStream(v as StreamType)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="בחר זרם" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STREAM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">קהל</Label>
                        <Select value={selectedGender} onValueChange={(v) => setSelectedGender(v as GenderAudience)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="בחר קהל" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(GENDER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                        <Button size="sm" onClick={handleAddText} disabled={!textInput.trim()} className="flex-1">
                          <Plus className="h-3 w-3 ml-1" /> הוסף טקסט
                        </Button>
                        <Button size="sm" variant="outline" onClick={handlePaste}>
                          <Clipboard className="h-3 w-3 ml-1" /> הדבק תמונה
                        </Button>
                      </div>
                    </div>

                    {/* Drop zone */}
                    <div
                      className="min-h-[100px] bg-muted/30 rounded-lg flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors"
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">גרור ושחרר קבצים כאן</p>
                      <p className="text-xs text-muted-foreground">תמונות, מסמכים ועוד</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Guidelines */}
                <Card className="border-amber-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      כללי אצבע כלליים ({guidelines.length})
                    </CardTitle>
                    <CardDescription>הנחיות שתקפות לכל סוגי המדיה</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="הזן כלל אצבע... לדוגמה: 'תמיד להשתמש בשפה מכבדת ועדינה'"
                        value={guidelineInput}
                        onChange={(e) => setGuidelineInput(e.target.value)}
                        className="flex-1 min-h-[60px]"
                      />
                    </div>
                    <Button onClick={handleAddGuideline} disabled={!guidelineInput.trim()} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                      <Plus className="h-4 w-4 ml-1" /> הוסף כלל
                    </Button>
                    {guidelines.length > 0 && (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pt-3 border-t">
                        {guidelines.map(g => (
                          <div key={g.id} className="flex items-start gap-2 p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-200/50">
                            <Lightbulb className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <p className="flex-1 text-xs">{g.text_content}</p>
                            <button onClick={() => removeUpload(g.id)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* === INSIGHTS TAB === */}
            {activeTab === 'insights' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                
                {/* Knowledge Coverage Map */}
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      מפת כיסוי ידע — מה המערכת יודעת
                    </CardTitle>
                    <CardDescription>ככל שיש יותר דוגמאות בקטגוריה, התוצרים יהיו טובים יותר</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Topics coverage */}
                    <div>
                      <p className="text-sm font-semibold mb-2 text-muted-foreground">📦 לפי תחום עסקי</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(TOPIC_LABELS).map(([key, label]) => {
                          const count = stats.byTopic[key] || 0;
                          const strength = count >= 20 ? 'strong' : count >= 5 ? 'medium' : count > 0 ? 'weak' : 'empty';
                          return (
                            <div key={key} className={cn(
                              "flex items-center justify-between p-2 rounded-lg text-sm border",
                              strength === 'strong' && "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
                              strength === 'medium' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
                              strength === 'weak' && "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400",
                              strength === 'empty' && "bg-muted/30 border-border text-muted-foreground opacity-60",
                            )}>
                              <span>{label}</span>
                              <Badge variant="outline" className={cn(
                                "text-xs",
                                strength === 'strong' && "border-green-500/50",
                                strength === 'medium' && "border-yellow-500/50",
                                strength === 'weak' && "border-orange-500/50",
                              )}>
                                {count}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                      {stats.untaggedTopic > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">⚠️ {stats.untaggedTopic} דוגמאות ללא תחום מוגדר</p>
                      )}
                    </div>

                    {/* Holiday coverage */}
                    <div>
                      <p className="text-sm font-semibold mb-2 text-muted-foreground">🗓️ לפי חג/עונה</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(HOLIDAY_LABELS).map(([key, label]) => {
                          const count = stats.byHoliday[key] || 0;
                          if (key === 'year_round') return null;
                          return (
                            <Badge key={key} variant={count > 0 ? "default" : "outline"} className={cn(
                              "text-xs",
                              count >= 10 && "bg-green-600",
                              count > 0 && count < 10 && "bg-yellow-600",
                              count === 0 && "opacity-50",
                            )}>
                              {label} ({count})
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        המלצות להעשרת המאגר
                      </p>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        {(() => {
                          const recommendations: string[] = [];
                          const weakTopics = Object.entries(TOPIC_LABELS).filter(([k]) => (stats.byTopic[k] || 0) < 5 && (stats.byTopic[k] || 0) > 0);
                          const emptyTopics = Object.entries(TOPIC_LABELS).filter(([k]) => !stats.byTopic[k]);
                          const weakHolidays = Object.entries(HOLIDAY_LABELS).filter(([k]) => k !== 'year_round' && (stats.byHoliday[k] || 0) < 5 && (stats.byHoliday[k] || 0) > 0);
                          
                          if (emptyTopics.length > 0) {
                            recommendations.push(`תחומים חסרים לגמרי: ${emptyTopics.slice(0, 5).map(([,v]) => v).join(', ')}. הוסף לפחות 5 דוגמאות לכל אחד.`);
                          }
                          if (weakTopics.length > 0) {
                            recommendations.push(`תחומים חלשים (פחות מ-5): ${weakTopics.map(([,v]) => v).join(', ')}. שפר עם דוגמאות נוספות.`);
                          }
                          if (weakHolidays.length > 0) {
                            recommendations.push(`חגים שצריכים חיזוק: ${weakHolidays.map(([,v]) => v).join(', ')}.`);
                          }
                          if (stats.untaggedTopic > 10) {
                            recommendations.push(`${stats.untaggedTopic} דוגמאות ללא תחום — תייג אותן כדי שה-AI ישתמש בהן בצורה ממוקדת.`);
                          }
                          if (guidelines.length < 3) {
                            recommendations.push('הוסף כללי אצבע (Guidelines) — הם משפיעים ישירות על איכות התוצרים.');
                          }
                          if (recommendations.length === 0) {
                            recommendations.push('✅ המאגר מכוסה היטב! המשך להוסיף דוגמאות עדכניות.');
                          }
                          return recommendations.map((r, i) => <li key={i}>• {r}</li>);
                        })()}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Deep Analysis */}
                <Card className="border-2 border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      ניתוח AI עמוק — מה המערכת למדה מהתמונות
                    </CardTitle>
                    <CardDescription>ה-AI רואה את התמונות ומנתח סגנון, צבעים, טיפוגרפיה וקומפוזיציה</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category buttons */}
                    <div className="flex flex-wrap gap-2 border-b pb-3">
                     {[
                        { id: 'general' as const, label: '🎯 כללי' },
                        { id: 'visual' as const, label: '🎨 ויזואלי' },
                        { id: 'topic' as const, label: '📦 לפי תחום' },
                        { id: 'holiday' as const, label: '🗓️ לפי חג' },
                        { id: 'media' as const, label: '📰 לפי מדיה' },
                        { id: 'stream' as const, label: '🕍 לפי זרם' },
                      ].map(cat => (
                        <Button
                          key={cat.id}
                          variant={insightCategory === cat.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setInsightCategory(cat.id)}
                          className={cn(insightCategory === cat.id && "bg-purple-600 hover:bg-purple-700")}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>

                    {/* Sub-options */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {(insightCategory === 'general' ? [{ id: 'general', label: '🎯 ניתוח כללי' }] :
                        insightCategory === 'visual' ? [{ id: 'visual_patterns', label: '🎨 דפוסים ויזואליים — אילו תמונות עובדות לאיזה תחום וקהל' }] :
                        insightCategory === 'topic' ? Object.entries(TOPIC_LABELS).filter(([k]) => (stats.byTopic[k] || 0) > 0).map(([k, v]) => ({ id: `topic_${k}`, label: `${v} (${stats.byTopic[k]})` })) :
                        insightCategory === 'holiday' ? Object.entries(HOLIDAY_LABELS).filter(([k]) => k === 'year_round' || (stats.byHoliday[k] || 0) > 0).map(([k, v]) => ({ id: `holiday_${k}`, label: v })) :
                        insightCategory === 'media' ? MEDIA_TYPES.filter(m => (stats.byMedia[m.id] || 0) > 0).map(m => ({ id: `media_${m.id}`, label: `${m.label} (${stats.byMedia[m.id]})` })) :
                        Object.entries(STREAM_LABELS).map(([k, v]) => ({ id: `stream_${k}`, label: v }))
                      ).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => analyzeContent(opt.id)}
                          disabled={isAnalyzing}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-sm text-center",
                            "hover:border-purple-400 hover:bg-purple-100/50 disabled:opacity-50",
                            selectedInsightType === opt.id ? "border-purple-500 bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100 font-medium" : "border-transparent bg-card text-foreground"
                          )}
                        >
                          {isAnalyzing && selectedInsightType === opt.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-purple-500" />
                          ) : null}
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Results */}
                    {(aiInsights || isAnalyzing) && (
                      <div className="p-4 bg-card rounded-lg border border-purple-200 dark:border-purple-800">
                        {isAnalyzing && !aiInsights && (
                          <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                            <p className="text-sm text-muted-foreground">מנתח את התמונות והדוגמאות...</p>
                          </div>
                        )}
                        {aiInsights && (
                          <>
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{aiInsights}</div>
                            <div className="mt-4 flex gap-2 border-t pt-3">
                              <Button onClick={saveInsight} className="bg-green-600 hover:bg-green-700 text-white">
                                <Sparkles className="h-4 w-4 ml-1" />
                                שמור כידע פעיל לסוכנים
                              </Button>
                              <p className="text-xs text-muted-foreground self-center">
                                לאחר השמירה, כל הסוכנים (אסטרטג, קופירייטר, ארט דירקטור) ישתמשו בתובנה הזו ביצירת מודעות
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {!aiInsights && !isAnalyzing && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        בחר קטגוריה ולחץ — ה-AI ינתח את התמונות שהעלת ויחזיר תובנות מפורטות
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enlarged Image Dialog */}
      <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          {enlargedImage?.url ? (
            <img 
              src={enlargedImage.url} 
              alt={enlargedImage.name} 
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          ) : enlargedImage?.name ? (
            <div className="p-6 text-right" dir="rtl">
              <p className="text-base whitespace-pre-wrap">{enlargedImage.name}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectorBrain;
