import { useState, useCallback, useRef } from 'react';
import { Upload, FolderUp, Loader2, CheckCircle2, AlertCircle, X, FileImage, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { pdfToImages } from '@/lib/pdf-utils';

// Auto-map folder names to topic categories
const FOLDER_TO_TOPIC: Record<string, string> = {
  'אופנת ילדים': 'kids_fashion',
  'אופנת נשים': 'womens_fashion',
  'אופנת גברים': 'mens_fashion',
  'מודעות אופנת גברים': 'mens_fashion',
  'מודעות אופנה גברים': 'mens_fashion',
  'אטרקציות': 'events',
  'ארגונים ועמותות': 'other',
  'חומרי ניקיון וטיפוח': 'beauty',
  'כלי כסף': 'jewelry',
  'מודעות אופטיקה': 'health',
  'ריהוט': 'furniture',
  'ריהוט ועיצוב הבית': 'furniture',
  'צעצועים': 'toys',
  'מזון': 'food',
  'נדלן': 'real_estate',
  'נדל"ן': 'real_estate',
  'סלולר': 'cellular',
  'מוצרי חשמל': 'electronics',
  'חשמל': 'electronics',
  'מלונאות': 'hotels',
  'מלונות': 'hotels',
  'נופש': 'hotels',
  'חופשה': 'hotels',
  'מלון': 'hotels',
  'צימר': 'hotels',
  'איפור': 'makeup',
  'קוסמטיקה': 'makeup',
  'לימודים': 'education',
  'חינוך': 'education',
  'בריאות': 'health',
  'ביטוח': 'finance',
  'פיננסים': 'finance',
  'אירועים': 'events',
  'שמחות': 'events',
  'יודאיקה': 'judaica',
  'ספרי קודש': 'judaica',
  'תכשיטים': 'jewelry',
  'שעונים': 'jewelry',
  'פאות': 'wigs',
  'פאה': 'wigs',
  'שיער': 'wigs',
  'מיתוג': 'branding',
  'branding': 'branding',
};

const FOLDER_TO_MEDIA: Record<string, string> = {
  'באנרים מופלשים': 'ads',
  'באנרים סטטיים': 'ads',
  'באנרים': 'ads',
  'דאבלים': 'ads',
  'שילוט': 'signage',
  'דוגמאות לשילוט רחוב גדול': 'signage',
  'שילוט רחוב': 'signage',
  'רדיו': 'radio',
  'וידאו': 'video',
  'קדמ': 'promo',
};

const FOLDER_TO_HOLIDAY: Record<string, string> = {
  'מודעות בין המצרים': 'bein_hazmanim',
  'בין הזמנים': 'bein_hazmanim',
  'בין המצרים': 'bein_hazmanim',
  'פסח': 'pesach',
  'חנוכה': 'chanukah',
  'פורים': 'purim',
  'סוכות': 'sukkot',
  'שבועות': 'shavuot',
  'ראש השנה': 'rosh_hashana',
  'אלול': 'rosh_hashana',
};

const TOPIC_LABELS: Record<string, string> = {
  real_estate: 'נדל"ן',
  beauty: 'ביוטי',
  food: 'מזון',
  cellular: 'סלולר',
  filtered_internet: 'אינטרנט מסונן',
  electronics: 'מוצרי חשמל',
  hotels: 'מלונאות',
  mens_fashion: 'אופנה גברית',
  kids_fashion: 'אופנת ילדים',
  womens_fashion: 'אופנת נשים',
  makeup: 'איפור',
  education: 'חינוך',
  health: 'בריאות',
  finance: 'פיננסים',
  events: 'אירועים',
  judaica: 'יודאיקה',
  toys: 'צעצועים',
  furniture: 'ריהוט',
  jewelry: 'תכשיטים',
  wigs: 'פאות',
  other: 'אחר',
};

interface BulkFile {
  file: File;
  folderName: string;
  topic: string | null;
  mediaType: string;
  holiday: string | null;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'splitting';
  errorMsg?: string;
  // For PDF pages split into individual images
  pdfPageBlob?: Blob;
  pdfPageIndex?: number;
  pdfTotalPages?: number;
  originalPdfName?: string;
}

interface BulkUploadProps {
  onUploadComplete: () => void;
}

function detectCategory(folderName: string): { topic: string | null; mediaType: string; holiday: string | null } {
  const normalized = folderName.trim();
  let topic: string | null = null;
  let mediaType = 'ads';
  let holiday: string | null = null;

  for (const [key, value] of Object.entries(FOLDER_TO_TOPIC)) {
    if (normalized.includes(key) || key.includes(normalized)) { topic = value; break; }
  }
  for (const [key, value] of Object.entries(FOLDER_TO_MEDIA)) {
    if (normalized.includes(key) || key.includes(normalized)) { mediaType = value; break; }
  }
  for (const [key, value] of Object.entries(FOLDER_TO_HOLIDAY)) {
    if (normalized.includes(key) || key.includes(normalized)) { holiday = value; break; }
  }

  return { topic, mediaType, holiday };
}

// Concurrency limiter
async function processInBatches<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
  signal?: AbortSignal,
) {
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      if (signal?.aborted) return;
      const current = index++;
      if (current >= items.length) return;
      await fn(items[current]);
    }
  });
  await Promise.all(workers);
}

const CONCURRENT_UPLOADS = 5;

const BulkUpload = ({ onUploadComplete }: BulkUploadProps) => {
  const [isSplitting, setIsSplitting] = useState(false);
  const [files, setFiles] = useState<BulkFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const pauseRef = useRef(false);

  const processFiles = (fileList: FileList) => {
    const newFiles: BulkFile[] = [];
    for (const file of Array.from(fileList)) {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        || file.type === 'application/msword'
        || file.name.endsWith('.docx') || file.name.endsWith('.doc');
      if (!isImage && !isPdf && !isWord) continue;
      let folderName = '';
      const relativePath = (file as any).webkitRelativePath || '';
      if (relativePath) {
        const parts = relativePath.split('/');
        folderName = parts.length > 1 ? parts[parts.length - 2] : '';
      }
      const { topic, mediaType, holiday } = detectCategory(folderName);
      newFiles.push({ file, folderName, topic, mediaType, holiday, status: 'pending' });
    }
    setFiles(prev => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      const folderCount = new Set(newFiles.map(f => f.folderName)).size;
      toast.success(`${newFiles.length} קבצים נוספו מ-${folderCount} תיקיות`);
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setProgress(0);
    setCompleted(0);
    setErrorCount(0);
  };

  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    setIsUploading(false);
    setIsPaused(false);
    pauseRef.current = false;
    toast.info('ההעלאה בוטלה');
  };

  const startUpload = async () => {
    const pendingIndexes = files
      .map((f, i) => ({ ...f, idx: i }))
      .filter(f => f.status === 'pending' || f.status === 'error');

    if (pendingIndexes.length === 0) {
      toast.info('כל הקבצים כבר הועלו בהצלחה!');
      return;
    }

    setIsUploading(true);
    setIsPaused(false);
    pauseRef.current = false;
    setErrorCount(0);

    const controller = new AbortController();
    abortRef.current = controller;

    let doneCount = files.filter(f => f.status === 'done').length;
    let errCount = 0;
    const total = files.length;

    const uploadOne = async (item: { idx: number; file: File; folderName: string; topic: string | null; mediaType: string; holiday: string | null }) => {
      if (controller.signal.aborted) return;

      // Wait while paused
      while (pauseRef.current && !controller.signal.aborted) {
        await new Promise(r => setTimeout(r, 200));
      }
      if (controller.signal.aborted) return;

      const i = item.idx;
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

      try {
        const safeName = item.file.name.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '_').replace(/^[-_]+/, '') || 'file';
        const ext = item.file.name.split('.').pop() || 'png';
        const sanitizedName = safeName.includes('.') ? safeName : `${safeName}.${ext}`;
        const fileName = `bulk/${item.mediaType}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${sanitizedName}`;
        const originalName = item.file.name;

        const { error: uploadError } = await supabase.storage
          .from('sector-brain')
          .upload(fileName, item.file);
        if (uploadError) throw uploadError;

        const { data: dbData, error: dbError } = await supabase
          .from('sector_brain_examples')
          .insert({
            zone: 'fame',
            name: originalName,
            file_path: fileName,
            file_type: item.file.type || (item.file.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream'),
            media_type: item.mediaType,
            example_type: 'good',
            topic_category: item.topic,
            holiday_season: item.holiday,
          })
          .select('id')
          .single();
        if (dbError) throw dbError;

        // If it's a Word file, extract text in the background
        const isWord = item.file.name.endsWith('.docx') || item.file.name.endsWith('.doc');
        if (isWord && dbData?.id) {
          // Fire and forget - don't block the upload
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-docx`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({ file_path: fileName, record_id: dbData.id }),
            }).catch(err => console.warn('Text extraction failed:', err));
          }
        }

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f));
        doneCount++;
      } catch (err: any) {
        console.error('Upload error:', err);
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', errorMsg: err?.message || 'שגיאה' } : f));
        errCount++;
        setErrorCount(errCount);
      }

      setCompleted(doneCount);
      setProgress(Math.round(((doneCount + errCount) / total) * 100));
    };

    await processInBatches(pendingIndexes, CONCURRENT_UPLOADS, uploadOne, controller.signal);

    setIsUploading(false);
    abortRef.current = null;

    if (errCount > 0) {
      toast.warning(`הועלו ${doneCount} קבצים, ${errCount} נכשלו. לחץ "העלה" שוב לנסות מחדש.`);
    } else {
      toast.success(`כל ${doneCount} הקבצים הועלו בהצלחה! 🎉`);
    }
    onUploadComplete();
  };

  // Group files by folder
  const groupedByFolder = files.reduce<Record<string, { files: BulkFile[]; indices: number[] }>>((acc, f, i) => {
    const key = f.folderName || 'ללא תיקייה';
    if (!acc[key]) acc[key] = { files: [], indices: [] };
    acc[key].files.push(f);
    acc[key].indices.push(i);
    return acc;
  }, {});

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const errFiles = files.filter(f => f.status === 'error').length;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderUp className="h-5 w-5 text-primary" />
          העלאה מרובה — Bulk Upload
        </CardTitle>
        <CardDescription>
          גררו תיקיות שלמות או בחרו קבצים מרובים. שם התיקייה ישמש לסיווג אוטומטי. תומך בהעלאת מאות קבצים.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <Upload className="w-10 h-10 mx-auto text-primary mb-3" />
          <p className="font-medium text-foreground mb-1">גררו קבצים או תיקיות לכאן</p>
          <p className="text-sm text-muted-foreground mb-4">ניתן לבחור תיקיות אחת אחרי השנייה — הכל מצטבר ברשימה אוטומטית ✨</p>
          
          <div className="flex gap-3 justify-center">
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-2">
                <FolderUp className="w-4 h-4" />
                בחר תיקייה
              </Button>
              <input
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-2">
                <FileImage className="w-4 h-4" />
                בחר קבצים
              </Button>
              <input
                type="file"
                accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* File summary */}
        {files.length > 0 && (
          <div className="space-y-3">
            {/* Summary bar */}
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{files.length} קבצים</span>
                <span className="text-xs text-muted-foreground">מ-{Object.keys(groupedByFolder).length} תיקיות</span>
                {doneCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {doneCount} הצליחו
                  </Badge>
                )}
                {errFiles > 0 && (
                  <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errFiles} נכשלו
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isUploading && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
                    <X className="w-4 h-4 mr-1" /> נקה הכל
                  </Button>
                )}
                <div className="relative">
                  <Button variant="outline" size="sm" className="gap-2 border-primary text-primary">
                    <FolderUp className="w-4 h-4" />
                    הוסף תיקייה
                  </Button>
                  <input
                    type="file"
                    // @ts-ignore
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleFolderSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Folder list */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {Object.entries(groupedByFolder).map(([folder, { files: folderFiles }]) => {
                const firstFile = folderFiles[0];
                const folderDone = folderFiles.filter(f => f.status === 'done').length;
                const folderErr = folderFiles.filter(f => f.status === 'error').length;
                const folderUploading = folderFiles.filter(f => f.status === 'uploading').length;
                const folderProgress = folderFiles.length > 0 
                  ? Math.round(((folderDone + folderErr) / folderFiles.length) * 100) 
                  : 0;
                
                return (
                  <div key={folder} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{folder}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {folderFiles.length} קבצים
                        </Badge>
                        {firstFile.topic && (
                          <Badge variant="outline" className="text-xs text-primary">
                            {TOPIC_LABELS[firstFile.topic] || firstFile.topic}
                          </Badge>
                        )}
                        {firstFile.holiday && (
                          <Badge variant="outline" className="text-xs">
                            {firstFile.holiday}
                          </Badge>
                        )}
                        {folderDone === folderFiles.length && folderDone > 0 && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {folderErr > 0 && (
                          <span className="text-xs text-destructive">{folderErr} שגיאות</span>
                        )}
                        {folderUploading > 0 && (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        )}
                      </div>
                    </div>
                    {isUploading && folderProgress > 0 && folderProgress < 100 && (
                      <Progress value={folderProgress} className="h-1 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall progress */}
            {(isUploading || doneCount > 0) && (
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{doneCount + errFiles} / {files.length} ({progress}%)</span>
                  {isUploading && (
                    <span>{CONCURRENT_UPLOADS} העלאות מקבילות</span>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {isUploading ? (
                <>
                  <Button onClick={togglePause} variant="outline" className="gap-2 flex-1">
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'המשך' : 'השהה'}
                  </Button>
                  <Button onClick={cancelUpload} variant="destructive" className="gap-2 flex-1">
                    <X className="w-4 h-4" />
                    בטל
                  </Button>
                </>
              ) : (
                <Button
                  onClick={startUpload}
                  disabled={pendingCount === 0 && errFiles === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Upload className="w-4 h-4" />
                  {errFiles > 0 && pendingCount === 0
                    ? `נסה שוב ${errFiles} קבצים שנכשלו`
                    : `העלה ${pendingCount + errFiles} קבצים`}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkUpload;
