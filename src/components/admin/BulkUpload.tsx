import { useState, useCallback } from 'react';
import { Upload, FolderUp, Loader2, CheckCircle2, AlertCircle, X, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

// Auto-map folder names to media types
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

// Auto-map folder names to holiday/season
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
  status: 'pending' | 'uploading' | 'done' | 'error';
}

interface BulkUploadProps {
  onUploadComplete: () => void;
}

function detectCategory(folderName: string): { topic: string | null; mediaType: string; holiday: string | null } {
  const normalized = folderName.trim();
  
  let topic: string | null = null;
  let mediaType = 'ads';
  let holiday: string | null = null;

  // Check topic
  for (const [key, value] of Object.entries(FOLDER_TO_TOPIC)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      topic = value;
      break;
    }
  }

  // Check media type
  for (const [key, value] of Object.entries(FOLDER_TO_MEDIA)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      mediaType = value;
      break;
    }
  }

  // Check holiday
  for (const [key, value] of Object.entries(FOLDER_TO_HOLIDAY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      holiday = value;
      break;
    }
  }

  return { topic, mediaType, holiday };
}

const BulkUpload = ({ onUploadComplete }: BulkUploadProps) => {
  const [files, setFiles] = useState<BulkFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);

  const processFiles = (fileList: FileList) => {
    const newFiles: BulkFile[] = [];
    
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) continue;

      // Extract folder name from webkitRelativePath or use filename
      let folderName = '';
      const relativePath = (file as any).webkitRelativePath || '';
      if (relativePath) {
        const parts = relativePath.split('/');
        // Use the immediate parent folder
        folderName = parts.length > 1 ? parts[parts.length - 2] : '';
      }

      const { topic, mediaType, holiday } = detectCategory(folderName);

      newFiles.push({
        file,
        folderName,
        topic,
        mediaType,
        holiday,
        status: 'pending',
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} קבצים נוספו מ-${new Set(newFiles.map(f => f.folderName)).size} תיקיות`);
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = ''; // Reset to allow re-selecting same folder
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
  };

  const startUpload = async () => {
    const pendingFiles = files.map((f, i) => ({ ...f, originalIndex: i })).filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) {
      toast.info('כל הקבצים כבר הועלו בהצלחה!');
      return;
    }
    setIsUploading(true);
    setCompleted(0);
    setProgress(0);

    let done = 0;
    const total = pendingFiles.length;

    for (const pf of pendingFiles) {
      const i = pf.originalIndex;
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

      try {
        const safeName = pf.file.name.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '_').replace(/^[-_]+/, '') || 'file';
        const ext = pf.file.name.split('.').pop() || 'png';
        const sanitizedName = safeName.includes('.') ? safeName : `${safeName}.${ext}`;
        const fileName = `bulk/${pf.mediaType}/${Date.now()}-${sanitizedName}`;
        const originalName = pf.file.name;
        const { error: uploadError } = await supabase.storage
          .from('sector-brain')
          .upload(fileName, pf.file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('sector_brain_examples')
          .insert({
            zone: 'fame',
            name: originalName,
            file_path: fileName,
            file_type: pf.file.type,
            media_type: pf.mediaType,
            example_type: 'good',
            topic_category: pf.topic,
            holiday_season: pf.holiday,
          });

        if (dbError) throw dbError;

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f));
      } catch (err) {
        console.error('Upload error:', err);
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
      }

      done++;
      setCompleted(done);
      setProgress(Math.round((done / total) * 100));
    }

    setIsUploading(false);
    toast.success(`${done} קבצים הועלו בהצלחה!`);
    onUploadComplete();
  };

  // Group files by folder
  const groupedByFolder = files.reduce<Record<string, BulkFile[]>>((acc, f) => {
    const key = f.folderName || 'ללא תיקייה';
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderUp className="h-5 w-5 text-primary" />
          העלאה מרובה — Bulk Upload
        </CardTitle>
        <CardDescription>
          גררו תיקיות שלמות או בחרו קבצים מרובים. שם התיקייה ישמש לסיווג אוטומטי.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone + buttons */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <Upload className="w-10 h-10 mx-auto text-primary mb-3" />
          <p className="font-medium text-foreground mb-1">גררו קבצים או תיקיות לכאן</p>
          <p className="text-sm text-muted-foreground mb-4">ניתן לבחור תיקייה אחת בכל פעם — התיקיות מצטברות ברשימה</p>
          
          <div className="flex gap-3 justify-center">
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-2">
                <FolderUp className="w-4 h-4" />
                בחר תיקייה
              </Button>
              <input
                type="file"
                // @ts-ignore - webkitdirectory is non-standard
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
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* File summary by folder */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{files.length} קבצים מוכנים</span>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" /> נקה הכל
              </Button>
              <span className="text-sm font-medium">{files.length} קבצים מ-{Object.keys(groupedByFolder).length} תיקיות</span>
              <div className="relative">
                <Button variant="outline" size="sm" className="gap-2 border-primary text-primary">
                  <FolderUp className="w-4 h-4" />
                  הוסף תיקייה נוספת
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

            <div className="max-h-64 overflow-y-auto space-y-2">
              {Object.entries(groupedByFolder).map(([folder, folderFiles]) => {
                const firstFile = folderFiles[0];
                const doneCount = folderFiles.filter(f => f.status === 'done').length;
                const errorCount = folderFiles.filter(f => f.status === 'error').length;
                
                return (
                  <div key={folder} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{folder}</span>
                      <div className="flex items-center gap-2">
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
                        {doneCount === folderFiles.length && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {errorCount > 0 && (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {completed} / {files.length} — {progress}%
                </p>
              </div>
            )}

            {/* Upload button */}
            <Button
              onClick={startUpload}
              disabled={isUploading || files.length === 0}
              className="w-full gap-2"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  העלה {files.length} קבצים
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkUpload;
