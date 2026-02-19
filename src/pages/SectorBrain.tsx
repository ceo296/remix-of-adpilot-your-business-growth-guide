import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Trophy, AlertOctagon, Upload, X, FileImage, FileText, Trash2, Loader2, Plus, Clipboard, Newspaper, Radio, Monitor, RectangleHorizontal, Megaphone, Video, Check, ThumbsUp, ThumbsDown, Copy, Link2, BookOpen, Lightbulb, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

// "general" first as the primary option
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
  const [linkInput, setLinkInput] = useState('');
  
  // General guidelines
  const [guidelines, setGuidelines] = useState<UploadedAsset[]>([]);
  const [guidelineInput, setGuidelineInput] = useState('');
  const [generalGuidelineInput, setGeneralGuidelineInput] = useState('');
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [generalGuidelinesOpen, setGeneralGuidelinesOpen] = useState(false);
  const [expandedGuidelineId, setExpandedGuidelineId] = useState<string | null>(null);

  // API link builder (optional query params)
  const [apiQuery, setApiQuery] = useState('');
  const [customApiLink, setCustomApiLink] = useState('');
  
  // General links management
  interface GeneralLink {
    id: string;
    url: string;
    media_type: string | null;
    created_at: string;
  }
  const [generalLinks, setGeneralLinks] = useState<GeneralLink[]>([]);
  const [newLinkInput, setNewLinkInput] = useState('');
  
  // AI Insights
  const [aiInsights, setAiInsights] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [selectedInsightType, setSelectedInsightType] = useState<string | null>(null);
  const [insightCategory, setInsightCategory] = useState<'general' | 'media' | 'stream' | 'holiday' | 'topic'>('general');

  // Insight categories structure
  const INSIGHT_CATEGORIES = [
    { id: 'general' as const, label: 'כללי', icon: Brain },
    { id: 'media' as const, label: 'לפי מדיה', icon: Newspaper },
    { id: 'stream' as const, label: 'לפי זרם', icon: Sparkles },
    { id: 'holiday' as const, label: 'לפי חג', icon: Sparkles },
    { id: 'topic' as const, label: 'לפי תחום', icon: Sparkles },
  ];

  const INSIGHT_TYPES_BY_CATEGORY = {
    general: [
      { id: 'general', label: 'תובנות כלליות', icon: Brain, description: 'ניתוח כללי על פרסום במגזר החרדי' },
    ],
    media: MEDIA_TYPES.map(m => ({ id: `media_${m.id}`, label: m.label, icon: m.icon, description: m.description })),
    stream: Object.entries(STREAM_LABELS).map(([id, label]) => ({ 
      id: `stream_${id}`, label, icon: Sparkles, description: `תובנות לפרסום לקהל ${label}` 
    })),
    holiday: Object.entries(HOLIDAY_LABELS).map(([id, label]) => ({ 
      id: `holiday_${id}`, label, icon: Sparkles, description: `תובנות לפרסום ב${label}` 
    })),
    topic: Object.entries(TOPIC_LABELS).map(([id, label]) => ({ 
      id: `topic_${id}`, label, icon: Sparkles, description: `תובנות לתחום ${label}` 
    })),
  };

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

  // Load existing examples and links from database (only after admin check)
  useEffect(() => {
    if (isAdmin) {
      loadExamples();
      loadGeneralLinks();
    }
  }, [isAdmin]);

  const loadGeneralLinks = async () => {
    const { data, error } = await supabase
      .from('sector_brain_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading links:', error);
    } else if (data) {
      setGeneralLinks(data);
    }
  };

  const handleAddGeneralLink = async () => {
    const url = newLinkInput.trim();
    if (!url) {
      toast.error('נא להזין קישור');
      return;
    }

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('קישור חייב להתחיל ב-http:// או https://');
      return;
    }

    const { data, error } = await supabase
      .from('sector_brain_links')
      .insert({ url, media_type: null })
      .select()
      .single();

    if (error) {
      console.error('Error adding link:', error);
      toast.error('שגיאה בשמירת הקישור');
      return;
    }

    setGeneralLinks(prev => [data, ...prev]);
    setNewLinkInput('');
    toast.success('הקישור נשמר בהצלחה');
  };

  const handleDeleteGeneralLink = async (id: string) => {
    const { error } = await supabase
      .from('sector_brain_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting link:', error);
      toast.error('שגיאה במחיקת הקישור');
      return;
    }

    setGeneralLinks(prev => prev.filter(l => l.id !== id));
    toast.success('הקישור נמחק');
  };

  const analyzeContent = async (insightType: string) => {
    setSelectedInsightType(insightType);
    setIsAnalyzing(true);
    setAiInsights('');
    setInsightsOpen(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-brain-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ insightType }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('הגעת למגבלת הבקשות. נסה שוב בעוד כמה דקות.');
          setIsAnalyzing(false);
          return;
        }
        if (response.status === 402) {
          toast.error('נגמרו הקרדיטים. יש להוסיף קרדיטים בהגדרות.');
          setIsAnalyzing(false);
          return;
        }
        throw new Error('Failed to analyze');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

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
            if (content) {
              fullContent += content;
              setAiInsights(fullContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('שגיאה בניתוח התוכן');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        
        // Migrate old zone-based data to new structure
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

  const handleAddGuideline = async (mediaType: MediaType) => {
    const text = guidelineInput.trim();
    if (!text) {
      toast.error('נא להזין כלל אצבע');
      return;
    }

    const textName = text.substring(0, 50) + (text.length > 50 ? '...' : '');

    const { data: dbData, error: dbError } = await supabase
      .from('sector_brain_examples')
      .insert({
        zone: 'fame',
        name: textName,
        file_path: 'guideline',
        file_type: 'text',
        text_content: text,
        is_general_guideline: true,
        media_type: mediaType,
        example_type: 'good',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      toast.error('שגיאה בשמירת הכלל');
      return;
    }

    const newGuideline: UploadedAsset = {
      id: dbData.id,
      name: textName,
      type: 'text',
      example_type: 'good',
      media_type: mediaType,
      text_content: text,
      is_general_guideline: true,
    };

    setGuidelines(prev => [newGuideline, ...prev]);
    setGuidelineInput('');
    toast.success('כלל האצבע נוסף בהצלחה');
  };

  const getGuidelinesForMedia = (mediaType: MediaType) => {
    return guidelines.filter(g => g.media_type === mediaType);
  };

  const removeGuideline = async (id: string) => {
    const { error } = await supabase
      .from('sector_brain_examples')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      toast.error('שגיאה במחיקת הכלל');
      return;
    }

    setGuidelines(prev => prev.filter(g => g.id !== id));
    toast.success('הכלל נמחק');
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

  const handleAddLink = async () => {
    const link = linkInput.trim();
    if (!link) {
      toast.error('נא להזין קישור');
      return;
    }

    // Simple URL validation
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      toast.error('נא להזין קישור תקין (מתחיל ב-http:// או https://)');
      return;
    }

    const linkName = link.length > 50 ? link.substring(0, 50) + '...' : link;

    const { data: dbData, error: dbError } = await supabase
      .from('sector_brain_examples')
      .insert({
        zone: selectedExampleType === 'good' ? 'fame' : 'redlines',
        name: linkName,
        file_path: link,
        file_type: 'link',
        text_content: link,
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
      toast.error('שגיאה בשמירת הקישור');
      return;
    }

    const newUpload: UploadedAsset = {
      id: dbData.id,
      name: linkName,
      type: 'text',
      example_type: selectedExampleType,
      media_type: activeMediaType,
      text_content: link,
      file_path: link,
      stream_type: dbData.stream_type,
      gender_audience: dbData.gender_audience,
      topic_category: dbData.topic_category,
      holiday_season: dbData.holiday_season,
    };

    setUploads(prev => [newUpload, ...prev]);
    setLinkInput('');
    toast.success('הקישור נוסף בהצלחה');
  };

  const handleAddGeneralGuideline = async () => {
    const text = generalGuidelineInput.trim();
    if (!text) {
      toast.error('נא להזין כלל אצבע');
      return;
    }

    const textName = text.substring(0, 50) + (text.length > 50 ? '...' : '');

    const { data: dbData, error: dbError } = await supabase
      .from('sector_brain_examples')
      .insert({
        zone: 'fame',
        name: textName,
        file_path: 'general-guideline',
        file_type: 'text',
        text_content: text,
        is_general_guideline: true,
        media_type: null,
        example_type: 'good',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      toast.error('שגיאה בשמירת הכלל');
      return;
    }

    const newGuideline: UploadedAsset = {
      id: dbData.id,
      name: textName,
      type: 'text',
      example_type: 'good',
      media_type: null,
      text_content: text,
      is_general_guideline: true,
    };

    setGuidelines(prev => [newGuideline, ...prev]);
    setGeneralGuidelineInput('');
    toast.success('כלל האצבע נוסף בהצלחה');
  };

  const getGeneralGuidelines = () => {
    return guidelines.filter(g => g.media_type === null);
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
  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sector-brain-api`;
  const apiFullUrl = `${apiBaseUrl}${apiQuery || ''}`;

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
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  קישור API
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px]" align="end">
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  <div>
                    <h4 className="font-medium text-sm mb-1">קישורים כלליים ללמידה</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      הוסף קישורים שילמדו את כל סוגי המדיה
                    </p>
                  </div>
                  
                  {/* Add new link */}
                  <div className="flex gap-2">
                    <Input
                      value={newLinkInput}
                      onChange={(e) => setNewLinkInput(e.target.value)}
                      placeholder="הדבק קישור חדש כאן..."
                      className="text-xs font-mono flex-1"
                      dir="ltr"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddGeneralLink();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleAddGeneralLink}
                      disabled={!newLinkInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Existing links */}
                  {generalLinks.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-xs text-muted-foreground font-medium">קישורים קיימים ({generalLinks.length}):</p>
                      {generalLinks.map((link) => (
                        <div key={link.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group">
                          <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span 
                            className="text-xs font-mono flex-1 truncate cursor-pointer hover:text-primary"
                            onClick={() => window.open(link.url, '_blank')}
                            title={link.url}
                          >
                            {link.url}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              navigator.clipboard.writeText(link.url);
                              toast.success('הקישור הועתק!');
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteGeneralLink(link.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {generalLinks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      אין קישורים כלליים עדיין
                    </p>
                  )}

                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      קישור API של המערכת:
                    </p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={apiBaseUrl}
                        className="text-xs font-mono bg-muted/50"
                        dir="ltr"
                        onFocus={(e) => e.currentTarget.select()}
                        onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(apiBaseUrl);
                          toast.success('קישור API הועתק!');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Link to="/admin-dashboard">
              <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                <ArrowRight className="h-4 w-4 ml-2" />
                חזרה
              </Button>
            </Link>
          </div>
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

        {/* Bulk Upload */}
        <div className="mb-8">
          <BulkUpload onUploadComplete={loadExamples} />
        </div>

        {/* AI Insights Section */}
        <Card className="mb-8 border-2 border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              תובנות AI
            </CardTitle>
            <CardDescription>
              בחר סוג ניתוח כדי לקבל תובנות ממוקדות
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 border-b pb-3">
              {INSIGHT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={insightCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInsightCategory(cat.id)}
                    className={cn(
                      insightCategory === cat.id && "bg-purple-600 hover:bg-purple-700"
                    )}
                  >
                    <Icon className="h-4 w-4 ml-1" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>

            {/* Insight Type Selector based on category */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {INSIGHT_TYPES_BY_CATEGORY[insightCategory].map((type) => {
                const Icon = type.icon;
                const isSelected = selectedInsightType === type.id;
                const isCurrentlyAnalyzing = isAnalyzing && selectedInsightType === type.id;
                
                return (
                  <button
                    key={type.id}
                    onClick={() => analyzeContent(type.id)}
                    disabled={isAnalyzing}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      "hover:border-purple-400 hover:bg-purple-100/50 disabled:opacity-50 disabled:cursor-not-allowed",
                      isSelected 
                        ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30" 
                        : "border-transparent bg-white dark:bg-background"
                    )}
                  >
                    {isCurrentlyAnalyzing ? (
                      <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    ) : (
                      <Icon className={cn(
                        "h-5 w-5",
                        isSelected ? "text-purple-600" : "text-muted-foreground"
                      )} />
                    )}
                    <span className={cn(
                      "text-xs font-medium text-center",
                      isSelected ? "text-purple-700 dark:text-purple-300" : "text-muted-foreground"
                    )}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Insights Display */}
            {(aiInsights || isAnalyzing) && (
              <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-purple-100/50">
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Brain className="h-4 w-4" />
                      {isAnalyzing ? 'מקבל תובנות...' : `תובנות: ${selectedInsightType || ''}`}
                    </span>
                    {insightsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 bg-white dark:bg-background rounded-lg border border-purple-200 dark:border-purple-800">
                    {isAnalyzing && !aiInsights && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                      </div>
                    )}
                    {aiInsights && (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {aiInsights}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {!aiInsights && !isAnalyzing && (
              <p className="text-sm text-muted-foreground text-center py-2">
                בחר קטגוריה ולחץ על אחת האפשרויות לקבלת תובנות ממוקדות
              </p>
            )}
          </CardContent>
        </Card>

        {/* General Guidelines Section */}
        <Card className="mb-8 border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              כללי אצבע כלליים למגזר
            </CardTitle>
            <CardDescription>
              הנחיות כלליות שתקפות לכל סוגי המדיה - המערכת תיישם אותן בכל יצירה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="הזן כלל אצבע כללי... לדוגמה: 'תמיד להשתמש בשפה מכבדת ועדינה', 'לא להשתמש בתמונות של נשים'"
                value={generalGuidelineInput}
                onChange={(e) => setGeneralGuidelineInput(e.target.value)}
                className="flex-1 min-h-[80px] bg-white dark:bg-background"
              />
            </div>
            <Button 
              onClick={handleAddGeneralGuideline}
              disabled={!generalGuidelineInput.trim()}
              className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus className="h-4 w-4" />
              הוסף כלל אצבע כללי
            </Button>

            {getGeneralGuidelines().length > 0 && (
              <Collapsible open={generalGuidelinesOpen} onOpenChange={setGeneralGuidelinesOpen} className="pt-4 border-t">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-amber-100/50">
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      כללים קיימים ({getGeneralGuidelines().length})
                    </span>
                    {generalGuidelinesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {getGeneralGuidelines().map((guideline) => (
                    <div 
                      key={guideline.id}
                      className="flex items-start gap-2 p-2 bg-white dark:bg-background rounded border"
                    >
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="flex-1 text-sm">{guideline.text_content}</p>
                      <button 
                        onClick={() => removeGuideline(guideline.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>

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

                  {/* Link input */}
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      הוסף קישור
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/..."
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        className="flex-1"
                        dir="ltr"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleAddLink}
                        disabled={!linkInput.trim()}
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        הוסף
                      </Button>
                    </div>
                  </div>

                  {/* Guidelines input for this media type */}
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <Label className="text-xs text-amber-600 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      כלל אצבע ל{media.label}
                    </Label>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={`הזן כלל אצבע ל${media.label}... לדוגמה: 'תמיד להשתמש בשפה מכבדת', 'להימנע מתמונות מסוימות'`}
                        value={guidelineInput}
                        onChange={(e) => setGuidelineInput(e.target.value)}
                        className="min-h-[60px] resize-none flex-1"
                      />
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddGuideline(media.id)}
                      disabled={!guidelineInput.trim()}
                      className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-50"
                    >
                      <Lightbulb className="h-4 w-4 ml-1" />
                      הוסף כלל אצבע
                    </Button>

                    {/* Existing guidelines for this media type */}
                    {getGuidelinesForMedia(media.id).length > 0 && (
                      <Collapsible open={guidelinesOpen} onOpenChange={setGuidelinesOpen} className="pt-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs hover:bg-amber-50/50">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <BookOpen className="h-3 w-3" />
                              כללים קיימים ({getGuidelinesForMedia(media.id).length})
                            </span>
                            {guidelinesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 pt-1">
                          {getGuidelinesForMedia(media.id).map((guideline) => (
                            <div 
                              key={guideline.id}
                              className="flex items-start gap-2 p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-200/50 text-sm"
                            >
                              <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                              <p className="flex-1 text-xs">{guideline.text_content}</p>
                              <button 
                                onClick={() => removeGuideline(guideline.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
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
