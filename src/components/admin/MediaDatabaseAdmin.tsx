import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight, 
  Building2, Newspaper, Package, Ruler, MapPin, DollarSign, Upload, X, Image,
  Radio, Globe, MessageSquare, Megaphone, FileSpreadsheet, type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import OutletRow from './OutletRow';

// Types
interface Category {
  id: string;
  name: string;
  name_he: string;
  sort_order: number;
}

interface Outlet {
  id: string;
  category_id: string;
  name: string;
  name_he: string | null;
  sector: string | null;
  city: string | null;
  is_active: boolean;
  vibe: string | null;
  vibe_he: string | null;
  warning_text: string | null;
  reach_info: string | null;
  logo_url: string | null;
  brand_color: string | null;
}

interface Product {
  id: string;
  outlet_id: string;
  name: string;
  name_he: string | null;
  product_type: string;
  requires_text: boolean;
  requires_image: boolean;
  base_price: number;
  client_price: number;
  is_active: boolean;
  target_audience: string | null;
  special_tag: string | null;
}

interface Spec {
  id: string;
  product_id: string;
  name: string;
  name_he: string | null;
  dimensions: string | null;
  base_price: number;
  client_price: number;
  is_active: boolean;
}

interface City {
  id: string;
  name: string;
  name_he: string;
  is_active: boolean;
}

const SECTORS = [
  { id: 'litvish', label: 'ליטאי' },
  { id: 'chassidish', label: 'חסידי' },
  { id: 'sefardi', label: 'ספרדי' },
  { id: 'general', label: 'כללי' },
];

const MediaDatabaseAdmin = () => {
  const [activeTab, setActiveTab] = useState('outlets');
  const [categories, setCategories] = useState<Category[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedOutlets, setExpandedOutlets] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [outletDialog, setOutletDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [specDialog, setSpecDialog] = useState(false);
  const [cityDialog, setCityDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSpec, setEditingSpec] = useState<Spec | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form states
  const [outletForm, setOutletForm] = useState({
    name: '', name_he: '', sector: 'general', city: '', is_active: true,
    vibe: '', vibe_he: '', warning_text: '', reach_info: '', brand_color: '#E31E24', logo_url: ''
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [productForm, setProductForm] = useState({
    name: '', name_he: '', product_type: '', requires_text: false, 
    requires_image: true, base_price: 0, client_price: 0, is_active: true,
    target_audience: 'general', special_tag: ''
  });
  const [specForm, setSpecForm] = useState({
    name: '', name_he: '', dimensions: '', base_price: 0, client_price: 0, is_active: true
  });
  const [cityForm, setCityForm] = useState({ name: '', name_he: '', is_active: true });
  const [categoryForm, setCategoryForm] = useState({ name: '', name_he: '', sort_order: 0 });

  // Media sizes data with editable state - organized by category
  const SIZE_CATEGORIES = [
    { id: 'print', label: 'עיתונות מודפסת', icon: 'Newspaper' },
    { id: 'digital', label: 'דיגיטל', icon: 'Globe' },
    { id: 'outdoor', label: 'פרסום חוצות', icon: 'Megaphone' },
    { id: 'local', label: 'עיתונות מקומית', icon: 'MapPin' },
    { id: 'social', label: 'סושיאל מדיה', icon: 'Share2' },
  ];

  const [mediaSizes, setMediaSizes] = useState([
    // עיתונות מודפסת - יתד נאמן יומי
    { id: 1, category: 'print', outlet: 'יתד נאמן', name: '1 טור', size: 'רוחב 3.5 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2001, category: 'print', outlet: 'יתד נאמן', name: '2 טורים', size: 'רוחב 7.3 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2002, category: 'print', outlet: 'יתד נאמן', name: '3 טורים', size: 'רוחב 11 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2003, category: 'print', outlet: 'יתד נאמן', name: '4 טורים', size: 'רוחב 14.7 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2004, category: 'print', outlet: 'יתד נאמן', name: '5 טורים', size: 'רוחב 18.5 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2005, category: 'print', outlet: 'יתד נאמן', name: '6 טורים', size: 'רוחב 22.6 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2006, category: 'print', outlet: 'יתד נאמן', name: '7 טורים', size: 'רוחב 26 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2007, category: 'print', outlet: 'יתד נאמן', name: 'רבע עמוד', size: '12.7×16.5 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2008, category: 'print', outlet: 'יתד נאמן', name: '1/2 עמוד רוחב', size: '12.7×35 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2009, category: 'print', outlet: 'יתד נאמן', name: '1/2 עמוד גובה', size: '26×16.5 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2010, category: 'print', outlet: 'יתד נאמן', name: 'עמוד', size: '26×35 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2011, category: 'print', outlet: 'יתד נאמן', name: 'דאבל', size: '54×35 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2012, category: 'print', outlet: 'יתד נאמן', name: 'סטריפ', size: '18.5×25 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    { id: 2013, category: 'print', outlet: 'יתד נאמן', name: 'פרופורציה', size: '26×7.5 ס"מ', notes: 'עיתון יומי', pubDay: '' },
    // עיתונות מודפסת - יתד השבוע
    { id: 2020, category: 'print', outlet: 'יתד השבוע', name: 'עמוד', size: '24×32 ס"מ', notes: 'מוסף שבועי', pubDay: 'שישי' },
    { id: 2021, category: 'print', outlet: 'יתד השבוע', name: 'דאבל', size: '50.4×32 ס"מ', notes: 'מוסף שבועי', pubDay: 'שישי' },
    { id: 2022, category: 'print', outlet: 'יתד השבוע', name: '1/2 רוחב', size: '23×14.5 ס"מ', notes: 'מוסף שבועי', pubDay: 'שישי' },
    { id: 2023, category: 'print', outlet: 'יתד השבוע', name: '1/2 גובה', size: '11.5×30 ס"מ', notes: 'מוסף שבועי', pubDay: 'שישי' },
    { id: 2024, category: 'print', outlet: 'יתד השבוע', name: '1/4 עמוד', size: '11.5×14.5 ס"מ', notes: 'מוסף שבועי', pubDay: 'שישי' },
    { id: 2025, category: 'print', outlet: 'יתד השבוע', name: 'פרופורציה', size: '15×21 ס"מ', notes: 'מוסף שבועי', pubDay: 'שישי' },
    
    // עיתונות מודפסת - המבשר
    { id: 2, category: 'print', outlet: 'המבשר', name: 'סטריפ', size: 'גובה 7.5 × רוחב 232.167 מ"מ', notes: '', pubDay: '' },
    
    // עיתונות מודפסת - המודיע
    { id: 3, category: 'print', outlet: 'המודיע', name: 'אנגלית ישראל ואירופה', size: 'רוחב 25 × גובה 32 ס"מ', notes: '', pubDay: '' },
    { id: 4, category: 'print', outlet: 'המודיע', name: 'אנגלית ארצות הברית', size: 'רוחב 24 × גובה 27.5 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מודפסת - משפחה מגזין ובתוך המשפחה
    { id: 5, category: 'print', outlet: 'משפחה - מגזין', name: 'עמוד', size: '28.7×19.5 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    { id: 3001, category: 'print', outlet: 'משפחה - מגזין', name: 'חצי עמוד גובה', size: '28.7×9.5 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    { id: 3002, category: 'print', outlet: 'משפחה - מגזין', name: 'חצי עמוד רוחב', size: '14.1×19.5 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    { id: 3003, category: 'print', outlet: 'משפחה - מגזין', name: 'רבע עמוד', size: '14.1×9.5 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    { id: 3004, category: 'print', outlet: 'משפחה - מגזין', name: 'שמינית עמוד', size: '6.8×9.5 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    { id: 3005, category: 'print', outlet: 'משפחה - מגזין', name: 'חצי שמינית', size: '6.8×4.6 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    { id: 3006, category: 'print', outlet: 'משפחה - מגזין', name: 'סטריפ', size: '6.25×19.5 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    { id: 3007, category: 'print', outlet: 'משפחה - מגזין', name: 'שליש עמוד', size: '28.7×5.6 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    { id: 3008, category: 'print', outlet: 'משפחה - מגזין', name: 'דאבל', size: '28.7×40 ס"מ', notes: 'מודעה גולשת 1 ס"מ מכל צד', pubDay: 'שלישי' },
    // עיתונות מודפסת - משפחה חדשות
    { id: 3010, category: 'print', outlet: 'משפחה - חדשות', name: 'עמוד', size: '34×25 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3011, category: 'print', outlet: 'משפחה - חדשות', name: 'חצי עמוד לגובה', size: '34×12.5 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3012, category: 'print', outlet: 'משפחה - חדשות', name: 'חצי עמוד לרוחב', size: '12×25 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3013, category: 'print', outlet: 'משפחה - חדשות', name: 'רבע עמוד', size: '16.8×12.5 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3014, category: 'print', outlet: 'משפחה - חדשות', name: 'שמינית עמוד', size: '8.2×12.5 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3015, category: 'print', outlet: 'משפחה - חדשות', name: 'חצי שמינית', size: '8.2×5.8 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3016, category: 'print', outlet: 'משפחה - חדשות', name: 'רבע שמינית', size: '4.1×5.8 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3017, category: 'print', outlet: 'משפחה - חדשות', name: 'אוזן (בשער)', size: '4.7×11.4 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3018, category: 'print', outlet: 'משפחה - חדשות', name: 'שליש', size: '34×6.3 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3019, category: 'print', outlet: 'משפחה - חדשות', name: 'סטריפ בשער', size: '5×26 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3020, category: 'print', outlet: 'משפחה - חדשות', name: 'סטריפ רגיל בעיתון', size: '5×25 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3021, category: 'print', outlet: 'משפחה - חדשות', name: 'סטריפ קיט ונופש', size: '8.2×25 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3022, category: 'print', outlet: 'משפחה - חדשות', name: 'פורפורציה', size: '28.5×19.5 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    { id: 3023, category: 'print', outlet: 'משפחה - חדשות', name: 'דאבל', size: '34×52 ס"מ', notes: 'ללא גלישה', pubDay: 'רביעי' },
    // עיתונות מודפסת - משפחה טעימות
    { id: 3030, category: 'print', outlet: 'משפחה - טעימות', name: 'עמוד', size: '28.7×21 ס"מ', notes: 'מודעה גולשת 5 מ"מ מכל צד', pubDay: 'חמישי' },
    { id: 3031, category: 'print', outlet: 'משפחה - טעימות', name: 'חצי עמוד גובה', size: '28.7×10.3 ס"מ', notes: 'מודעה גולשת 5 מ"מ מכל צד', pubDay: 'חמישי' },
    { id: 3032, category: 'print', outlet: 'משפחה - טעימות', name: 'חצי עמוד רוחב', size: '14×21 ס"מ', notes: 'מודעה גולשת 5 מ"מ מכל צד', pubDay: 'חמישי' },
    { id: 3033, category: 'print', outlet: 'משפחה - טעימות', name: 'רבע עמוד', size: '14×10.2 ס"מ', notes: 'מודעה גולשת 5 מ"מ מכל צד', pubDay: 'חמישי' },
    { id: 3034, category: 'print', outlet: 'משפחה - טעימות', name: 'סטריפ', size: '6.2×21 ס"מ', notes: 'מודעה גולשת 5 מ"מ מכל צד', pubDay: 'חמישי' },
    { id: 3035, category: 'print', outlet: 'משפחה - טעימות', name: 'שליש', size: '28.7×6.7 ס"מ', notes: 'מודעה גולשת 5 מ"מ מכל צד', pubDay: 'חמישי' },
    { id: 3036, category: 'print', outlet: 'משפחה - טעימות', name: 'דאבל', size: '28.7×44 ס"מ', notes: 'גולש 5 מ"מ מכל צד', pubDay: 'חמישי' },
    
    // עיתונות מודפסת - קטיפה
    { id: 6, category: 'print', outlet: 'קטיפה', name: 'עמוד', size: '307×215 מ"מ', notes: '', pubDay: '' },
    
    // עיתונות מודפסת - הציבור החרדי
    { id: 7, category: 'print', outlet: 'הציבור החרדי', name: 'עמוד A4', size: 'עמוד A4, חצי עמוד חצי מ-A4', notes: '', pubDay: 'חמישי' },
    
    // עיתונות מודפסת - מגזין הבית
    { id: 8, category: 'print', outlet: 'מגזין הבית', name: 'עמוד', size: 'רוחב 17.5 × גובה 25 ס"מ', notes: '', pubDay: '' },
    
    // דיגיטל - כיכר השבת
    { id: 20, category: 'digital', outlet: 'כיכר השבת', name: '970×300', size: '970×300 px', notes: '', pubDay: '' },
    { id: 21, category: 'digital', outlet: 'כיכר השבת', name: '970×200', size: '970×200 px', notes: '', pubDay: '' },
    { id: 22, category: 'digital', outlet: 'כיכר השבת', name: '970×100', size: '970×100 px', notes: '', pubDay: '' },
    { id: 23, category: 'digital', outlet: 'כיכר השבת', name: '970×600', size: '970×600 px', notes: '', pubDay: '' },
    { id: 24, category: 'digital', outlet: 'כיכר השבת', name: 'סקייסקרייפר', size: '160×970 px', notes: '', pubDay: '' },
    { id: 25, category: 'digital', outlet: 'כיכר השבת', name: 'מלבן בינוני', size: '300×250 px', notes: 'משותף לבחדרי חרדים', pubDay: '' },
    { id: 26, category: 'digital', outlet: 'כיכר השבת', name: 'חצי עמוד', size: '300×600 px', notes: '', pubDay: '' },
    { id: 27, category: 'digital', outlet: 'כיכר השבת', name: 'מובייל גדול', size: '320×480 px', notes: '', pubDay: '' },
    { id: 28, category: 'digital', outlet: 'כיכר השבת', name: 'מובייל בינוני', size: '320×100 px', notes: '', pubDay: '' },
    { id: 29, category: 'digital', outlet: 'כיכר השבת', name: 'מובייל קטן', size: '320×50 px', notes: 'משותף לבחדרי חרדים', pubDay: '' },
    { id: 60, category: 'digital', outlet: 'כיכר השבת', name: 'באנר תחתון', size: '970×60 px', notes: '', pubDay: '' },
    
    // דיגיטל - בחדרי חרדים
    { id: 100, category: 'digital', outlet: 'בחדרי חרדים', name: 'פלזמה', size: '1200×200 px', notes: 'עמוד הבית, 72 DPI', pubDay: '' },
    { id: 101, category: 'digital', outlet: 'בחדרי חרדים', name: 'באנר צף', size: '1200×60 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 102, category: 'digital', outlet: 'בחדרי חרדים', name: 'אוזן ימין/שמאל', size: '160×600 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 103, category: 'digital', outlet: 'בחדרי חרדים', name: 'אוזן צרה', size: '120×500 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 104, category: 'digital', outlet: 'בחדרי חרדים', name: 'אוזן רחבה', size: '300×600 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 105, category: 'digital', outlet: 'בחדרי חרדים', name: 'סנטרל', size: '895×80 px', notes: 'עמוד הבית', pubDay: '' },
    { id: 106, category: 'digital', outlet: 'בחדרי חרדים', name: 'פוטר', size: '1200×200 px', notes: 'כל עמודי האתר', pubDay: '' },
    { id: 107, category: 'digital', outlet: 'בחדרי חרדים', name: 'מגדל קטן', size: '290×350 px', notes: 'עמוד הבית ועמודי כתבות', pubDay: '' },
    { id: 108, category: 'digital', outlet: 'בחדרי חרדים', name: 'מגדל כתבה', size: '290×346 px', notes: 'עמוד הבית ועמודי כתבות', pubDay: '' },
    { id: 109, category: 'digital', outlet: 'בחדרי חרדים', name: 'מגדלון', size: '290×300 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 110, category: 'digital', outlet: 'בחדרי חרדים', name: 'מגדל גדול', size: '290×500 px', notes: 'עמוד הבית ועמודי כתבות', pubDay: '' },
    { id: 111, category: 'digital', outlet: 'בחדרי חרדים', name: 'באנר סוף כתבה', size: '800×60 px', notes: 'כתבה', pubDay: '' },
    { id: 112, category: 'digital', outlet: 'בחדרי חרדים', name: 'VTR', size: '1200×300 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 113, category: 'digital', outlet: 'בחדרי חרדים', name: 'סופר VTR', size: '1200×500 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 114, category: 'digital', outlet: 'בחדרי חרדים', name: 'מתפרץ', size: '800×600 px', notes: 'עמוד הבית', pubDay: '' },
    { id: 115, category: 'digital', outlet: 'בחדרי חרדים', name: 'סטריפ מובייל', size: '320×70 px', notes: 'האתר הסלולארי', pubDay: '' },
    { id: 116, category: 'digital', outlet: 'בחדרי חרדים', name: 'מעברון מובייל', size: '360×520 / 360×400 px', notes: 'קובץ תמונה בלבד', pubDay: '' },
    { id: 117, category: 'digital', outlet: 'בחדרי חרדים', name: 'פלזמה מובייל', size: '360×125 px', notes: 'האתר הסלולארי', pubDay: '' },
    { id: 118, category: 'digital', outlet: 'בחדרי חרדים', name: 'אינריד דסקטופ', size: '800×200 px', notes: 'דסקטופ', pubDay: '' },
    { id: 119, category: 'digital', outlet: 'בחדרי חרדים', name: 'אינריד מובייל', size: '320×320 px', notes: 'מובייל', pubDay: '' },
    { id: 120, category: 'digital', outlet: 'בחדרי חרדים', name: 'באנר חסות עליון', size: '372×60 px', notes: 'דסקטופ', pubDay: '' },
    { id: 121, category: 'digital', outlet: 'בחדרי חרדים', name: 'טייק אובר', size: '1260×1000 px', notes: 'דסקטופ', pubDay: '' },
    { id: 122, category: 'digital', outlet: 'בחדרי חרדים', name: 'טייק אובר דינאמי', size: '1800×980 px', notes: 'דסקטופ', pubDay: '' },
    { id: 123, category: 'digital', outlet: 'בחדרי חרדים', name: 'קוביה קבועה', size: '290×165 px', notes: 'דסקטופ', pubDay: '' },
    { id: 124, category: 'digital', outlet: 'בחדרי חרדים', name: 'קוביה קבועה ג\'וביק', size: '290×346 px', notes: 'דסקטופ', pubDay: '' },
    { id: 125, category: 'digital', outlet: 'בחדרי חרדים', name: 'מיקום רמי לוי', size: '895×240 px', notes: 'דסקטופ', pubDay: '' },
    
    // דיגיטל - כל רגע
    { id: 130, category: 'digital', outlet: 'כל רגע', name: 'באנר צף', size: '1140×60 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 131, category: 'digital', outlet: 'כל רגע', name: 'אוזן ימין/שמאל', size: '160×600 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 132, category: 'digital', outlet: 'כל רגע', name: 'אינריד דסקטופ', size: '725×200 px', notes: 'דסקטופ', pubDay: '' },
    { id: 133, category: 'digital', outlet: 'כל רגע', name: 'מעברון מובייל', size: '360×520 px', notes: 'מובייל', pubDay: '' },
    { id: 134, category: 'digital', outlet: 'כל רגע', name: 'סטריפ מובייל', size: '320×70 px', notes: 'האתר הסלולארי', pubDay: '' },
    { id: 135, category: 'digital', outlet: 'כל רגע', name: 'אינריד מובייל', size: '320×320 px', notes: 'מובייל', pubDay: '' },
    { id: 136, category: 'digital', outlet: 'כל רגע', name: 'קוביה קבועה', size: '360×180 px', notes: 'דסקטופ', pubDay: '' },
    
    // דיגיטל - כל כבוד
    { id: 140, category: 'digital', outlet: 'כל כבוד', name: 'אוזן', size: '160×600 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 141, category: 'digital', outlet: 'כל כבוד', name: 'אינריד דסקטופ', size: '690×200 px', notes: 'דסקטופ', pubDay: '' },
    { id: 142, category: 'digital', outlet: 'כל כבוד', name: 'אוזן רחבה', size: '300×600 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 143, category: 'digital', outlet: 'כל כבוד', name: 'באנר צף', size: '1200×60 px', notes: 'ברחבי האתר', pubDay: '' },
    { id: 144, category: 'digital', outlet: 'כל כבוד', name: 'פלזמה', size: '1200×200 px', notes: 'עמוד הבית', pubDay: '' },
    { id: 145, category: 'digital', outlet: 'כל כבוד', name: 'פלזמה מובייל', size: '360×125 px', notes: 'האתר הסלולארי', pubDay: '' },
    { id: 146, category: 'digital', outlet: 'כל כבוד', name: 'מעברון מובייל', size: '360×520 px', notes: 'מובייל', pubDay: '' },
    { id: 147, category: 'digital', outlet: 'כל כבוד', name: 'סטריפ מובייל', size: '320×70 px', notes: 'האתר הסלולארי', pubDay: '' },
    { id: 148, category: 'digital', outlet: 'כל כבוד', name: 'אינריד מובייל', size: '320×320 px', notes: 'מובייל', pubDay: '' },
    
    // דיגיטל - גוגל סטנדרטי
    { id: 200, category: 'digital', outlet: 'גוגל', name: 'Skyscraper', size: '120×600 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 201, category: 'digital', outlet: 'גוגל', name: 'Square', size: '250×250 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 202, category: 'digital', outlet: 'גוגל', name: 'Wide Skyscraper', size: '160×600 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 203, category: 'digital', outlet: 'גוגל', name: 'Medium Rectangle', size: '300×250 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 204, category: 'digital', outlet: 'גוגל', name: 'Half Page', size: '300×600 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 205, category: 'digital', outlet: 'גוגל', name: 'Small Square', size: '200×200 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 206, category: 'digital', outlet: 'גוגל', name: 'Large Rectangle', size: '336×280 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 207, category: 'digital', outlet: 'גוגל', name: 'Banner', size: '468×60 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 208, category: 'digital', outlet: 'גוגל', name: 'Leaderboard', size: '728×90 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 209, category: 'digital', outlet: 'גוגל', name: 'Large Leaderboard', size: '970×70 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 210, category: 'digital', outlet: 'גוגל', name: 'Mobile Banner', size: '320×100 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 211, category: 'digital', outlet: 'גוגל', name: 'Mobile Leaderboard', size: '320×50 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 212, category: 'digital', outlet: 'גוגל', name: 'Billboard', size: '970×250 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    { id: 213, category: 'digital', outlet: 'גוגל', name: 'Top Banner', size: '970×90 px', notes: 'עד 150KB, PNG/GIF, עם לוגו', pubDay: '' },
    
    // דיגיטל - גוגל רספונסיבי
    { id: 220, category: 'digital', outlet: 'גוגל רספונסיבי', name: 'תמונה לרוחב', size: '1200×628 px', notes: 'עד 5MB, פרופורציה 1.91:1', pubDay: '' },
    { id: 221, category: 'digital', outlet: 'גוגל רספונסיבי', name: 'תמונת ריבוע', size: '1200×1200 px', notes: 'עד 5MB, פרופורציה 1:1', pubDay: '' },
    { id: 222, category: 'digital', outlet: 'גוגל רספונסיבי', name: 'תמונה לאורך', size: '900×1600 px', notes: 'עד 5MB, פרופורציה 9:16', pubDay: '' },
    { id: 223, category: 'digital', outlet: 'גוגל רספונסיבי', name: 'לוגו ריבועי', size: '1200×1200 px', notes: 'לוגו ריבועי', pubDay: '' },
    { id: 224, category: 'digital', outlet: 'גוגל רספונסיבי', name: 'לוגו אופקי', size: '1200×300 px', notes: 'לוגו אופקי', pubDay: '' },
    
    // דיגיטל - הדיברות
    { id: 230, category: 'digital', outlet: 'הדיברות', name: '460×340', size: '460×340 px', notes: '', pubDay: '' },
    { id: 231, category: 'digital', outlet: 'הדיברות', name: '100×720', size: '100×720 px', notes: '', pubDay: '' },
    { id: 232, category: 'digital', outlet: 'הדיברות', name: '460×720', size: '460×720 px', notes: '', pubDay: '' },
    { id: 233, category: 'digital', outlet: 'הדיברות', name: '920×720', size: '920×720 px', notes: '', pubDay: '' },
    { id: 234, category: 'digital', outlet: 'הדיברות', name: '150×800', size: '150×800 px', notes: '', pubDay: '' },
    
    // דיגיטל - המחדש
    { id: 240, category: 'digital', outlet: 'המחדש', name: 'באנר 250×300', size: '250×300 px', notes: 'GIF/JPEG עדיף, HTML אפשרי', pubDay: '' },
    { id: 241, category: 'digital', outlet: 'המחדש', name: 'באנר 100×320', size: '100×320 px', notes: 'GIF/JPEG עדיף, HTML אפשרי', pubDay: '' },
    { id: 242, category: 'digital', outlet: 'המחדש', name: 'באנר 50×320', size: '50×320 px', notes: 'GIF/JPEG עדיף, HTML אפשרי', pubDay: '' },
    { id: 243, category: 'digital', outlet: 'המחדש', name: 'באנר 90×728', size: '90×728 px', notes: 'GIF/JPEG עדיף, HTML אפשרי', pubDay: '' },
    { id: 244, category: 'digital', outlet: 'המחדש', name: 'באנר 100×1140', size: '100×1140 px', notes: 'GIF/JPEG עדיף, HTML אפשרי', pubDay: '' },
    { id: 245, category: 'digital', outlet: 'המחדש', name: 'באנר 60×1140', size: '60×1140 px', notes: 'GIF/JPEG עדיף, HTML אפשרי', pubDay: '' },
    { id: 246, category: 'digital', outlet: 'המחדש', name: 'באנר 600×160', size: '600×160 px', notes: 'GIF/JPEG עדיף, HTML אפשרי', pubDay: '' },
    { id: 247, category: 'digital', outlet: 'המחדש', name: 'באנר 200×800', size: '200×800 px', notes: 'GIF/JPEG עדיף, HTML אפשרי', pubDay: '' },
    
    // דיגיטל - הדרן
    { id: 250, category: 'digital', outlet: 'הדרן', name: 'באנר', size: '50×320 px', notes: 'JPEG/GIF עד חצי מגה', pubDay: '' },
    { id: 251, category: 'digital', outlet: 'הדרן', name: 'מעברון', size: '450×320 px', notes: 'JPEG/GIF עד חצי מגה', pubDay: '' },
    { id: 252, category: 'digital', outlet: 'הדרן', name: 'פוש', size: '350×700 px', notes: 'כותרת 8 מילים, טקסט מורחב עד 40 מילים כולל לינק', pubDay: '' },
    { id: 253, category: 'digital', outlet: 'הדרן', name: 'מדמה תוכן', size: '350×700 px', notes: 'JPEG/GIF עד חצי מגה, כותרת+כותרת משנה 8 מילים כל אחת', pubDay: '' },
    { id: 254, category: 'digital', outlet: 'הדרן', name: 'קובץ וידאו', size: '16:9', notes: 'עד 10 מ"ב', pubDay: '' },
    
    // פרסום חוצות - לוחות קיר
    { id: 30, category: 'outdoor', outlet: 'לוחות קיר', name: 'לוח קיר', size: '15×15 ס"מ', notes: '', pubDay: '' },
    { id: 31, category: 'outdoor', outlet: 'לוחות קיר', name: 'לוח קיר שער', size: 'גובה 22 × רוחב 15.8 ס"מ', notes: '', pubDay: '' },
    { id: 32, category: 'outdoor', outlet: 'לוחות קיר', name: 'בלוברי', size: 'גובה 26.5 × רוחב 8 ס"מ', notes: '', pubDay: '' },
    { id: 33, category: 'outdoor', outlet: 'שילוט חנויות', name: 'מטר על מטר', size: '100×100 ס"מ', notes: 'להוסיף גלישה וחיתוך', pubDay: '' },
    
    // עיתונות מקומית - קוראים אלעד
    { id: 40, category: 'local', outlet: 'קוראים אלעד', name: 'עמוד', size: 'A4', notes: '', pubDay: '' },
    
    // עיתונות מקומית - קהילות רמות
    { id: 41, category: 'local', outlet: 'קהילות רמות', name: 'עמוד', size: '14.5X21.5 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מקומית - מקור מוסמך
    { id: 42, category: 'local', outlet: 'מקור מוסמך', name: 'עמוד', size: '220X145 מ"מ', notes: '', pubDay: 'מוצ"ש - ראשון' },
    
    // עיתונות מקומית - חזק
    { id: 43, category: 'local', outlet: 'חזק', name: 'עמוד', size: '274X189 מ"מ', notes: '', pubDay: 'מוצ"ש - ראשון' },
    
    // עיתונות מקומית - בקהילה
    { id: 44, category: 'local', outlet: 'בקהילה', name: 'עמוד', size: '', notes: '', pubDay: 'חמישי' },
    
    // עיתונות מקומית - הדרך
    { id: 45, category: 'local', outlet: 'הדרך', name: 'עמוד', size: 'רוחב 19.5 ס"מ × גובה 29 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מקומית - ידיעון קולינו
    { id: 46, category: 'local', outlet: 'ידיעון קולינו נתניה', name: 'עמוד', size: 'גובה 22 × רוחב 14.5 ס"מ', notes: 'להתקשר כדי לשריין מקום', pubDay: 'נסגר ברביעי' },
    
    // עיתונות מקומית - כח הפרסום
    { id: 47, category: 'local', outlet: 'כח הפרסום', name: 'עמוד', size: 'גובה 27 × רוחב 17 ס"מ', notes: 'בגלישה צריך להשאיר ס"מ וחצי רווח', pubDay: 'מוצ"ש - ראשון' },
    
    // עיתונות מקומית - לעניין בני ברק
    { id: 48, category: 'local', outlet: 'לעניין בני ברק', name: 'עמוד', size: '26.5X16.5 ס"מ', notes: '', pubDay: '' },
    { id: 49, category: 'local', outlet: 'לעניין בני ברק', name: 'חצי לגובה', size: '', notes: '', pubDay: 'רביעי' },
    
    // עיתונות מקומית - מרכז העניינים
    { id: 50, category: 'local', outlet: 'מרכז העניינים', name: 'רבע עמוד', size: 'רוחב 12.6 × גובה 16.3 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מקומית - השבועון
    { id: 51, category: 'local', outlet: 'השבועון פ"ת / אלעד', name: 'עמוד', size: '14.5×21.6 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מקומית - גבעת זאב
    { id: 52, category: 'local', outlet: 'גבעת זאב', name: 'עמוד', size: '22×15.5 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מקומית - לעניין שער
    { id: 53, category: 'local', outlet: 'לעניין', name: 'שער', size: '20×13.5 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מקומית - העיתון של השכונה
    { id: 54, category: 'local', outlet: 'העיתון של השכונה', name: 'עמוד', size: 'גובה 26.5 × רוחב 16.7 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מקומית - רב מכר
    { id: 55, category: 'local', outlet: 'רב מכר מודיעין עילית', name: 'עמוד', size: '14.5×22 ס"מ', notes: '', pubDay: '' },
    
    // עיתונות מקומית - מידע ירושלים
    { id: 56, category: 'local', outlet: 'מידע ירושלים', name: 'עמוד', size: 'גובה 27.4 ס"מ (+5מ"מ גלישה) × רוחב 18 ס"מ (+5מ"מ גלישה)', notes: '', pubDay: '' },
    
    // עיתונות מקומית - בעניינים בית שמש
    { id: 57, category: 'local', outlet: 'בעניינים בית שמש', name: 'עמוד', size: 'גובה 226 × רוחב 153 מ"מ', notes: 'מודעה גולשת להוסיף 1 ס"מ מכל צד', pubDay: '' },
    
    // סושיאל מדיה - וואצאפ
    { id: 300, category: 'social', outlet: 'וואצאפ', name: 'קוביה', size: '1080×1080 px', notes: '', pubDay: '' },
    { id: 301, category: 'social', outlet: 'וואצאפ', name: 'סטטוס', size: '1080×1920 px', notes: '', pubDay: '' },
    { id: 302, category: 'social', outlet: 'וואצאפ', name: 'סטורי', size: '1080×1920 px', notes: '', pubDay: '' },
  ]);
  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
  const [sizeSearchQuery, setSizeSearchQuery] = useState('');
  const [selectedSizeCategory, setSelectedSizeCategory] = useState<string>('all');

  const updateMediaSize = (id: number, field: string, value: string) => {
    setMediaSizes(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addNewMediaSize = (category: string = 'print', outlet: string = '') => {
    const newId = Math.max(...mediaSizes.map(s => s.id)) + 1;
    setMediaSizes(prev => [...prev, { id: newId, category, outlet, name: '', size: '', notes: '', pubDay: '' }]);
    setEditingSizeId(newId);
  };

  const deleteMediaSize = (id: number) => {
    if (!confirm('בטוח למחוק?')) return;
    setMediaSizes(prev => prev.filter(item => item.id !== id));
    toast.success('נמחק');
  };

  const filteredMediaSizes = mediaSizes.filter(item => {
    const matchesSearch = !sizeSearchQuery || 
      item.name.toLowerCase().includes(sizeSearchQuery.toLowerCase()) || 
      item.size.toLowerCase().includes(sizeSearchQuery.toLowerCase());
    const matchesCategory = selectedSizeCategory === 'all' || item.category === selectedSizeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    
    const [catRes, outRes, prodRes, specRes, cityRes] = await Promise.all([
      supabase.from('media_categories').select('*').order('sort_order'),
      supabase.from('media_outlets').select('*'),
      supabase.from('media_products').select('*'),
      supabase.from('product_specs').select('*'),
      supabase.from('media_cities').select('*'),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (outRes.data) setOutlets(outRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (specRes.data) setSpecs(specRes.data);
    if (cityRes.data) setCities(cityRes.data);
    
    setIsLoading(false);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleOutlet = (id: string) => {
    setExpandedOutlets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleProduct = (id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Outlet CRUD
  const openAddOutlet = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingOutlet(null);
    setOutletForm({ 
      name: '', name_he: '', sector: 'general', city: '', is_active: true,
      vibe: '', vibe_he: '', warning_text: '', reach_info: '', brand_color: '#E31E24', logo_url: ''
    });
    setOutletDialog(true);
  };

  const openEditOutlet = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setSelectedCategoryId(outlet.category_id);
    setOutletForm({
      name: outlet.name,
      name_he: outlet.name_he || '',
      sector: outlet.sector || 'general',
      city: outlet.city || '',
      is_active: outlet.is_active,
      vibe: outlet.vibe || '',
      vibe_he: outlet.vibe_he || '',
      warning_text: outlet.warning_text || '',
      reach_info: outlet.reach_info || '',
      brand_color: outlet.brand_color || '#E31E24',
      logo_url: outlet.logo_url || ''
    });
    setOutletDialog(true);
  };

  const saveOutlet = async () => {
    if (!outletForm.name) { toast.error('נא להזין שם'); return; }

    const data = {
      ...outletForm,
      category_id: selectedCategoryId,
      city: outletForm.city || null,
      logo_url: outletForm.logo_url || null
    };

    if (editingOutlet) {
      const { error } = await supabase.from('media_outlets').update(data).eq('id', editingOutlet.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('media_outlets').insert(data);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setOutletDialog(false);
    loadAllData();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('נא להעלות קובץ תמונה בלבד');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('גודל הקובץ לא יעלה על 2MB');
      return;
    }

    setIsUploadingLogo(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('media-logos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('media-logos')
        .getPublicUrl(fileName);

      setOutletForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('הלוגו הועלה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת הלוגו');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setOutletForm(prev => ({ ...prev, logo_url: '' }));
  };

  const deleteOutlet = async (id: string) => {
    if (!confirm('בטוח למחוק? כל המוצרים והמפרטים יימחקו גם.')) return;
    const { error } = await supabase.from('media_outlets').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  // Product CRUD
  const openAddProduct = (outletId: string) => {
    setSelectedOutletId(outletId);
    setEditingProduct(null);
    setProductForm({
      name: '', name_he: '', product_type: '', requires_text: false,
      requires_image: true, base_price: 0, client_price: 0, is_active: true,
      target_audience: 'general', special_tag: ''
    });
    setProductDialog(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setSelectedOutletId(product.outlet_id);
    setProductForm({
      name: product.name,
      name_he: product.name_he || '',
      product_type: product.product_type,
      requires_text: product.requires_text,
      requires_image: product.requires_image,
      base_price: product.base_price,
      client_price: product.client_price,
      is_active: product.is_active,
      target_audience: product.target_audience || 'general',
      special_tag: product.special_tag || ''
    });
    setProductDialog(true);
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.product_type) {
      toast.error('נא להזין שם וסוג מוצר');
      return;
    }

    const data = { ...productForm, outlet_id: selectedOutletId };

    if (editingProduct) {
      const { error } = await supabase.from('media_products').update(data).eq('id', editingProduct.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('media_products').insert(data);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setProductDialog(false);
    loadAllData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('בטוח למחוק? כל המפרטים יימחקו גם.')) return;
    const { error } = await supabase.from('media_products').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  // Spec CRUD
  const openAddSpec = (productId: string) => {
    setSelectedProductId(productId);
    setEditingSpec(null);
    setSpecForm({ name: '', name_he: '', dimensions: '', base_price: 0, client_price: 0, is_active: true });
    setSpecDialog(true);
  };

  const openEditSpec = (spec: Spec) => {
    setEditingSpec(spec);
    setSelectedProductId(spec.product_id);
    setSpecForm({
      name: spec.name,
      name_he: spec.name_he || '',
      dimensions: spec.dimensions || '',
      base_price: spec.base_price,
      client_price: spec.client_price,
      is_active: spec.is_active
    });
    setSpecDialog(true);
  };

  const saveSpec = async () => {
    if (!specForm.name) { toast.error('נא להזין שם'); return; }

    const data = { ...specForm, product_id: selectedProductId };

    if (editingSpec) {
      const { error } = await supabase.from('product_specs').update(data).eq('id', editingSpec.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('product_specs').insert(data);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setSpecDialog(false);
    loadAllData();
  };

  const deleteSpec = async (id: string) => {
    if (!confirm('בטוח למחוק?')) return;
    const { error } = await supabase.from('product_specs').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  // City CRUD
  const openAddCity = () => {
    setEditingCity(null);
    setCityForm({ name: '', name_he: '', is_active: true });
    setCityDialog(true);
  };

  const openEditCity = (city: City) => {
    setEditingCity(city);
    setCityForm({ name: city.name, name_he: city.name_he, is_active: city.is_active });
    setCityDialog(true);
  };

  const saveCity = async () => {
    if (!cityForm.name || !cityForm.name_he) { toast.error('נא להזין שם'); return; }

    if (editingCity) {
      const { error } = await supabase.from('media_cities').update(cityForm).eq('id', editingCity.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('media_cities').insert(cityForm);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setCityDialog(false);
    loadAllData();
  };

  const deleteCity = async (id: string) => {
    if (!confirm('בטוח למחוק?')) return;
    const { error } = await supabase.from('media_cities').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  // Category CRUD
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', name_he: '', sort_order: categories.length });
    setCategoryDialog(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, name_he: category.name_he, sort_order: category.sort_order });
    setCategoryDialog(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name || !categoryForm.name_he) { toast.error('נא להזין שם'); return; }

    if (editingCategory) {
      const { error } = await supabase.from('media_categories').update(categoryForm).eq('id', editingCategory.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase.from('media_categories').insert(categoryForm);
      if (error) { toast.error('שגיאה בהוספה'); return; }
      toast.success('נוסף בהצלחה');
    }
    setCategoryDialog(false);
    loadAllData();
  };

  const deleteCategory = async (id: string) => {
    const categoryOutlets = outlets.filter(o => o.category_id === id);
    if (categoryOutlets.length > 0) {
      toast.error('לא ניתן למחוק קטגוריה עם ערוצים. מחק קודם את הערוצים.');
      return;
    }
    if (!confirm('בטוח למחוק?')) return;
    const { error } = await supabase.from('media_categories').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); return; }
    toast.success('נמחק');
    loadAllData();
  };

  const getSectorLabel = (sector: string | null) => {
    return SECTORS.find(s => s.id === sector)?.label || sector || '';
  };

  // Get category icon based on name
  const getCategoryIcon = (categoryName: string): LucideIcon => {
    const name = categoryName.toLowerCase();
    if (name.includes('עיתונות') || name.includes('print') || name.includes('newspaper')) return Newspaper;
    if (name.includes('רדיו') || name.includes('radio')) return Radio;
    if (name.includes('דיגיטל') || name.includes('digital') || name.includes('אתר')) return Globe;
    if (name.includes('ישיר') || name.includes('direct') || name.includes('whatsapp') || name.includes('email')) return MessageSquare;
    if (name.includes('רחוב') || name.includes('street') || name.includes('פרסום') || name.includes('outdoor')) return Megaphone;
    return Building2;
  };

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const catOutlets = outlets.filter(o => o.category_id === cat.id);
    return cat.name_he.includes(q) || catOutlets.some(o => 
      o.name.toLowerCase().includes(q) || o.name_he?.includes(q)
    );
  });

  if (isLoading) {
    return <div className="text-center p-8 text-muted-foreground">טוען...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">מאגר מדיה</h1>
          <p className="text-muted-foreground">ניהול היררכי: קטגוריה ← ערוץ ← מוצר ← מפרט</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={async () => {
            // Sizes tab → export sizes only
            if (activeTab === 'sizes') {
              const categoryLabels: Record<string, string> = Object.fromEntries(
                SIZE_CATEGORIES.map(c => [c.id, c.label])
              );
              const headers = ['קטגוריה', 'ערוץ מדיה', 'שם הגודל', 'ממדים', 'יום פרסום', 'הערות'];
              const rows = mediaSizes
                .slice()
                .sort((a, b) =>
                  (categoryLabels[a.category] || a.category).localeCompare(categoryLabels[b.category] || b.category) ||
                  a.outlet.localeCompare(b.outlet) ||
                  a.name.localeCompare(b.name)
                )
                .map(s => [
                  categoryLabels[s.category] || s.category,
                  s.outlet,
                  s.name,
                  s.size,
                  s.pubDay || '',
                  s.notes || '',
                ]);
              const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
              ws['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 30 }, { wch: 12 }, { wch: 30 }];
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'גדלים');
              XLSX.writeFile(wb, 'adkop-media-sizes.xlsx');
              toast.success(`יוצאו ${rows.length} גדלים בהצלחה`);
              return;
            }

            // Default: export full media catalog
            const [cats, outlets, products, specs] = await Promise.all([
              supabase.from('media_categories').select('*').order('sort_order'),
              supabase.from('media_outlets').select('*').eq('is_active', true),
              supabase.from('media_products').select('*').eq('is_active', true),
              supabase.from('product_specs').select('*').eq('is_active', true),
            ]);
            const catMap = Object.fromEntries((cats.data || []).map(c => [c.id, c.name_he]));
            const outletMap = Object.fromEntries((outlets.data || []).map(o => [o.id, o]));
            const headers = ['קטגוריה','ערוץ','זרם','סקטור','עיר','אווירה','חשיפה','אזהרה','מוצר','סוג מוצר','מגדר','קהל יעד','מחיר בסיס מוצר','מחיר לקוח מוצר','תג מיוחד','מפרט','ממדים','מחיר בסיס מפרט','מחיר לקוח מפרט'];
            const rows: any[][] = [];
            for (const mp of (products.data || [])) {
              const outlet = outletMap[mp.outlet_id];
              if (!outlet) continue;
              const cat = catMap[outlet.category_id] || '';
              const matchingSpecs = (specs.data || []).filter((s: any) => s.product_id === mp.id);
              if (matchingSpecs.length === 0) {
                rows.push([cat, outlet.name_he || outlet.name, outlet.stream || '', outlet.sector || '', outlet.city || '', outlet.vibe_he || '', outlet.reach_info || '', outlet.warning_text || '', mp.name_he || mp.name, mp.product_type, mp.gender_target || '', mp.target_audience || '', mp.base_price || 0, mp.client_price || 0, mp.special_tag || '', '', '', 0, 0]);
              } else {
                for (const s of matchingSpecs) {
                  rows.push([cat, outlet.name_he || outlet.name, outlet.stream || '', outlet.sector || '', outlet.city || '', outlet.vibe_he || '', outlet.reach_info || '', outlet.warning_text || '', mp.name_he || mp.name, mp.product_type, mp.gender_target || '', mp.target_audience || '', mp.base_price || 0, mp.client_price || 0, mp.special_tag || '', s.name_he || s.name, s.dimensions || '', s.base_price || 0, s.client_price || 0]);
                }
              }
            }
            rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])));
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            ws['!cols'] = headers.map(() => ({ wch: 18 }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'קטלוג מדיה');
            XLSX.writeFile(wb, 'adkop-media-catalog.xlsx');
            toast.success(`יוצאו ${rows.length} שורות בהצלחה`);
          }}>
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            {activeTab === 'sizes' ? 'ייצוא גדלים' : 'ייצוא Excel'}
          </Button>
          <Button onClick={openAddCategory}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף קטגוריה
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="outlets">ערוצי מדיה</TabsTrigger>
          <TabsTrigger value="cities">ערים</TabsTrigger>
          <TabsTrigger value="sizes">גדלים</TabsTrigger>
        </TabsList>

        <TabsContent value="outlets">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש ערוץ או מוצר..."
              className="pr-10"
            />
          </div>

          {/* Hierarchical Tree */}
          <div className="space-y-4">
            {filteredCategories.map(category => {
              const categoryOutlets = outlets.filter(o => o.category_id === category.id);
              const isExpanded = expandedCategories.has(category.id);
              
              return (
                <Card key={category.id} className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {(() => {
                              const CategoryIcon = getCategoryIcon(category.name_he || category.name);
                              return <CategoryIcon className="h-5 w-5 text-primary" />;
                            })()}
                            <CardTitle className="text-base">{category.name_he}</CardTitle>
                            <Badge variant="secondary">{categoryOutlets.length} ערוצים</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); openAddOutlet(category.id); }}
                            >
                              <Plus className="h-4 w-4 ml-1" />
                              הוסף ערוץ
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); openEditCategory(category); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteCategory(category.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        {categoryOutlets.length === 0 ? (
                          <div className="text-muted-foreground text-sm pr-8">אין ערוצים בקטגוריה זו</div>
                        ) : (
                          <div className="space-y-2 pr-6">
                            {/* For local_print and street categories, group by city */}
                            {(category.name === 'local_print' || category.name === 'street') ? (
                              <>
                                {/* Group outlets by city */}
                                {(() => {
                                  const outletsWithCity = categoryOutlets.filter(o => o.city);
                                  const outletsWithoutCity = categoryOutlets.filter(o => !o.city);
                                  const citiesWithOutlets = [...new Set(outletsWithCity.map(o => o.city))];
                                  
                                  return (
                                    <>
                                      {citiesWithOutlets.map(cityName => {
                                        const cityOutlets = outletsWithCity.filter(o => o.city === cityName);
                                        const cityData = cities.find(c => c.name === cityName || c.name_he === cityName);
                                        const cityHebrewName = cityData?.name_he || cityName || 'לא ידוע';
                                        
                                        return (
                                          <div key={cityName} className="border rounded-lg overflow-hidden">
                                            <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b">
                                              <MapPin className="h-4 w-4 text-primary" />
                                              <span className="font-medium">{cityHebrewName}</span>
                                              <Badge variant="secondary" className="text-xs">{cityOutlets.length} ערוצים</Badge>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="mr-auto h-7"
                                                onClick={() => {
                                                  setOutletForm({
                                                    name: '', name_he: '', sector: 'general', city: cityName || '', is_active: true,
                                                    vibe: '', vibe_he: '', warning_text: '', reach_info: '', brand_color: '#E31E24', logo_url: ''
                                                  });
                                                  setSelectedCategoryId(category.id);
                                                  setEditingOutlet(null);
                                                  setOutletDialog(true);
                                                }}
                                              >
                                                <Plus className="h-3 w-3 ml-1" />
                                                הוסף ערוץ
                                              </Button>
                                            </div>
                                            <div className="p-2 space-y-2">
                                              {cityOutlets.map(outlet => {
                                                const outletProducts = products.filter(p => p.outlet_id === outlet.id);
                                                const isOutletExpanded = expandedOutlets.has(outlet.id);
                                                
                                                return (
                                                  <OutletRow 
                                                    key={outlet.id}
                                                    outlet={outlet}
                                                    outletProducts={outletProducts}
                                                    isOutletExpanded={isOutletExpanded}
                                                    toggleOutlet={toggleOutlet}
                                                    openAddProduct={openAddProduct}
                                                    openEditOutlet={openEditOutlet}
                                                    deleteOutlet={deleteOutlet}
                                                    getSectorLabel={getSectorLabel}
                                                    cities={cities}
                                                    specs={specs}
                                                    expandedProducts={expandedProducts}
                                                    toggleProduct={toggleProduct}
                                                    openAddSpec={openAddSpec}
                                                    openEditProduct={openEditProduct}
                                                    deleteProduct={deleteProduct}
                                                    openEditSpec={openEditSpec}
                                                    deleteSpec={deleteSpec}
                                                    showCity={false}
                                                  />
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      
                                      {/* Cities without outlets */}
                                      {cities.filter(c => c.is_active && !citiesWithOutlets.includes(c.name)).map(city => (
                                        <div key={city.id} className="border rounded-lg overflow-hidden border-dashed opacity-60">
                                          <div className="bg-muted/30 px-3 py-2 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-muted-foreground">{city.name_he}</span>
                                            <Badge variant="outline" className="text-xs">אין ערוצים</Badge>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="mr-auto h-7"
                                              onClick={() => {
                                                setOutletForm({
                                                  name: '', name_he: '', sector: 'general', city: city.name, is_active: true,
                                                  vibe: '', vibe_he: '', warning_text: '', reach_info: '', brand_color: '#E31E24', logo_url: ''
                                                });
                                                setSelectedCategoryId(category.id);
                                                setEditingOutlet(null);
                                                setOutletDialog(true);
                                              }}
                                            >
                                              <Plus className="h-3 w-3 ml-1" />
                                              הוסף ערוץ
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {/* Outlets without city */}
                                      {outletsWithoutCity.length > 0 && (
                                        <div className="border rounded-lg overflow-hidden">
                                          <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-muted-foreground">ללא עיר</span>
                                            <Badge variant="secondary" className="text-xs">{outletsWithoutCity.length} ערוצים</Badge>
                                          </div>
                                          <div className="p-2 space-y-2">
                                            {outletsWithoutCity.map(outlet => {
                                              const outletProducts = products.filter(p => p.outlet_id === outlet.id);
                                              const isOutletExpanded = expandedOutlets.has(outlet.id);
                                              
                                              return (
                                                <OutletRow 
                                                  key={outlet.id}
                                                  outlet={outlet}
                                                  outletProducts={outletProducts}
                                                  isOutletExpanded={isOutletExpanded}
                                                  toggleOutlet={toggleOutlet}
                                                  openAddProduct={openAddProduct}
                                                  openEditOutlet={openEditOutlet}
                                                  deleteOutlet={deleteOutlet}
                                                  getSectorLabel={getSectorLabel}
                                                  cities={cities}
                                                  specs={specs}
                                                  expandedProducts={expandedProducts}
                                                  toggleProduct={toggleProduct}
                                                  openAddSpec={openAddSpec}
                                                  openEditProduct={openEditProduct}
                                                  deleteProduct={deleteProduct}
                                                  openEditSpec={openEditSpec}
                                                  deleteSpec={deleteSpec}
                                                  showCity={true}
                                                />
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              /* Regular display for other categories */
                              categoryOutlets.map(outlet => {
                                const outletProducts = products.filter(p => p.outlet_id === outlet.id);
                                const isOutletExpanded = expandedOutlets.has(outlet.id);
                              
                                return (
                                  <OutletRow 
                                    key={outlet.id}
                                    outlet={outlet}
                                    outletProducts={outletProducts}
                                    isOutletExpanded={isOutletExpanded}
                                    toggleOutlet={toggleOutlet}
                                    openAddProduct={openAddProduct}
                                    openEditOutlet={openEditOutlet}
                                    deleteOutlet={deleteOutlet}
                                    getSectorLabel={getSectorLabel}
                                    cities={cities}
                                    specs={specs}
                                    expandedProducts={expandedProducts}
                                    toggleProduct={toggleProduct}
                                    openAddSpec={openAddSpec}
                                    openEditProduct={openEditProduct}
                                    deleteProduct={deleteProduct}
                                    openEditSpec={openEditSpec}
                                    deleteSpec={deleteSpec}
                                    showCity={true}
                                  />
                                );
                              })
                            )}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="cities">
          <div className="flex justify-end mb-4">
            <Button onClick={openAddCity}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף עיר
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-right font-medium">שם (אנגלית)</th>
                    <th className="p-4 text-right font-medium">שם (עברית)</th>
                    <th className="p-4 text-right font-medium">סטטוס</th>
                    <th className="p-4 text-right font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map(city => (
                    <tr key={city.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">{city.name}</td>
                      <td className="p-4 font-medium">{city.name_he}</td>
                      <td className="p-4">
                        <Badge className={city.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {city.is_active ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditCity(city)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCity(city.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cities.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">אין ערים</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sizes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  מדריך גדלים לפי ערוץ מדיה
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">מסודר לפי קטגוריות ואתרים/עיתונים</p>
              </div>
              <Button onClick={() => addNewMediaSize(selectedSizeCategory === 'all' ? 'print' : selectedSizeCategory, '')} size="sm">
                <Plus className="h-4 w-4 ml-2" />
                הוסף גודל
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* Category Filter & Search */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={sizeSearchQuery}
                    onChange={(e) => setSizeSearchQuery(e.target.value)}
                    placeholder="חיפוש לפי שם, אתר או גודל..."
                    className="pr-10"
                  />
                </div>
                <Select value={selectedSizeCategory} onValueChange={setSelectedSizeCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="כל הקטגוריות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הקטגוריות</SelectItem>
                    {SIZE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Summary Cards */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {SIZE_CATEGORIES.map(cat => {
                  const catSizes = mediaSizes.filter(s => s.category === cat.id);
                  const uniqueOutlets = [...new Set(catSizes.map(s => s.outlet))].length;
                  const isActive = selectedSizeCategory === cat.id;
                  return (
                    <Card 
                      key={cat.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                      onClick={() => setSelectedSizeCategory(isActive ? 'all' : cat.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-primary">{catSizes.length}</div>
                        <div className="text-xs text-muted-foreground">{cat.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{uniqueOutlets} ערוצים</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Grouped by Category and Outlet */}
              <div className="space-y-6">
                {SIZE_CATEGORIES
                  .filter(cat => selectedSizeCategory === 'all' || selectedSizeCategory === cat.id)
                  .map(cat => {
                    const categorySizes = mediaSizes.filter(s => s.category === cat.id);
                    const filteredCategorySizes = categorySizes.filter(item => {
                      if (!sizeSearchQuery) return true;
                      const query = sizeSearchQuery.toLowerCase();
                      return item.name.toLowerCase().includes(query) || 
                             item.outlet.toLowerCase().includes(query) || 
                             item.size.toLowerCase().includes(query);
                    });
                    
                    if (filteredCategorySizes.length === 0) return null;
                    
                    // Group by outlet
                    const outletGroups = filteredCategorySizes.reduce((acc, item) => {
                      const outlet = item.outlet || 'ללא ערוץ';
                      if (!acc[outlet]) acc[outlet] = [];
                      acc[outlet].push(item);
                      return acc;
                    }, {} as Record<string, typeof filteredCategorySizes>);
                    
                    return (
                      <div key={cat.id} className="border rounded-lg overflow-hidden">
                        <div className={`p-3 font-semibold flex items-center justify-between ${
                          cat.id === 'print' ? 'bg-blue-50 text-blue-800' :
                          cat.id === 'digital' ? 'bg-purple-50 text-purple-800' :
                          cat.id === 'outdoor' ? 'bg-orange-50 text-orange-800' :
                          'bg-green-50 text-green-800'
                        }`}>
                          <span>{cat.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Object.keys(outletGroups).length} ערוצים | {filteredCategorySizes.length} גדלים
                          </Badge>
                        </div>
                        
                        {Object.entries(outletGroups).map(([outletName, items]) => (
                          <Collapsible key={outletName} defaultOpen={true}>
                            <CollapsibleTrigger className="w-full p-2 px-4 bg-muted/30 hover:bg-muted/50 flex items-center justify-between border-t">
                              <div className="flex items-center gap-2">
                                <ChevronDown className="h-4 w-4" />
                                <span className="font-medium">{outletName}</span>
                                <Badge variant="outline" className="text-[10px]">{items.length} גדלים</Badge>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addNewMediaSize(cat.id, outletName);
                                }}
                              >
                                <Plus className="h-3 w-3 ml-1" />
                                הוסף
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b bg-muted/20">
                                    <th className="p-2 text-right font-medium text-xs w-[180px]">שם הגודל</th>
                                    <th className="p-2 text-right font-medium text-xs">מידות</th>
                                    <th className="p-2 text-right font-medium text-xs">הערות</th>
                                    <th className="p-2 text-right font-medium text-xs w-[100px]">יום פרסום</th>
                                    <th className="p-2 text-center font-medium text-xs w-[120px]">פעולות</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item) => {
                                    const isEditing = editingSizeId === item.id;
                                    return (
                                      <tr 
                                        key={item.id} 
                                        className={`border-b hover:bg-muted/30 transition-colors ${isEditing ? 'bg-primary/5' : ''}`}
                                        onClick={() => !isEditing && setEditingSizeId(item.id)}
                                      >
                                        <td className="p-2">
                                          {isEditing ? (
                                            <div className="space-y-1">
                                              <Input
                                                value={item.outlet}
                                                onChange={(e) => updateMediaSize(item.id, 'outlet', e.target.value)}
                                                className="h-7 text-xs"
                                                placeholder="שם הערוץ/אתר"
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              <Input
                                                value={item.name}
                                                onChange={(e) => updateMediaSize(item.id, 'name', e.target.value)}
                                                className="h-7 text-xs"
                                                placeholder="שם הגודל"
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            </div>
                                          ) : (
                                            <span className="text-sm font-medium">{item.name || <span className="text-muted-foreground italic">ללא שם</span>}</span>
                                          )}
                                        </td>
                                        <td className="p-2">
                                          {isEditing ? (
                                            <Input
                                              value={item.size}
                                              onChange={(e) => updateMediaSize(item.id, 'size', e.target.value)}
                                              className="h-7 text-xs font-mono"
                                              placeholder="לדוגמה: 14.5×21.5 ס״מ"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            item.size ? (
                                              <Badge variant="secondary" className="font-mono text-xs">
                                                {item.size}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground text-xs">לא זמין</span>
                                            )
                                          )}
                                        </td>
                                        <td className="p-2">
                                          {isEditing ? (
                                            <Input
                                              value={item.notes}
                                              onChange={(e) => updateMediaSize(item.id, 'notes', e.target.value)}
                                              className="h-7 text-xs"
                                              placeholder="הערות..."
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            <span className="text-xs text-muted-foreground">{item.notes || '-'}</span>
                                          )}
                                        </td>
                                        <td className="p-2">
                                          {isEditing ? (
                                            <Input
                                              value={item.pubDay}
                                              onChange={(e) => updateMediaSize(item.id, 'pubDay', e.target.value)}
                                              className="h-7 text-xs"
                                              placeholder="יום..."
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            <span className="text-xs">{item.pubDay || '-'}</span>
                                          )}
                                        </td>
                                        <td className="p-2">
                                          <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            {isEditing ? (
                                              <Button
                                                size="sm"
                                                variant="default"
                                                className="h-6 text-xs"
                                                onClick={() => {
                                                  setEditingSizeId(null);
                                                  toast.success('נשמר');
                                                }}
                                              >
                                                סיום
                                              </Button>
                                            ) : (
                                              <>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-6 w-6"
                                                  onClick={() => setEditingSizeId(item.id)}
                                                >
                                                  <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-6 w-6 text-destructive"
                                                  onClick={() => deleteMediaSize(item.id)}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    );
                  })}
              </div>
              
              {filteredMediaSizes.length === 0 && (
                <div className="p-8 text-center text-muted-foreground border rounded-lg">אין גדלים להצגה</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Outlet Dialog */}
      <Dialog open={outletDialog} onOpenChange={setOutletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOutlet ? 'עריכת ערוץ' : 'הוספת ערוץ חדש'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={outletForm.name} onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })} />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={outletForm.name_he} onChange={(e) => setOutletForm({ ...outletForm, name_he: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>זרם</Label>
                <Select value={outletForm.sector} onValueChange={(v) => setOutletForm({ ...outletForm, sector: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>עיר (אופציונלי)</Label>
                <Select value={outletForm.city || 'none'} onValueChange={(v) => setOutletForm({ ...outletForm, city: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="בחר עיר" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא</SelectItem>
                    {cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name_he}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Vibe/Restriction Fields */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-semibold mb-2 block">אופי הערוץ והגבלות</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Vibe (אנגלית)</Label>
                  <Input 
                    value={outletForm.vibe} 
                    onChange={(e) => setOutletForm({ ...outletForm, vibe: e.target.value })} 
                    placeholder="strict_kosher, high_end_open, etc."
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vibe (עברית)</Label>
                  <Input 
                    value={outletForm.vibe_he} 
                    onChange={(e) => setOutletForm({ ...outletForm, vibe_he: e.target.value })}
                    placeholder="שמרני מאוד, מגזיני ופתוח, וכו'"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">מידע על חשיפה</Label>
                <Input 
                  value={outletForm.reach_info} 
                  onChange={(e) => setOutletForm({ ...outletForm, reach_info: e.target.value })}
                  placeholder="העיתון הליטאי המרכזי, 150K עותקים, וכו'"
                />
              </div>
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">אזהרה (יוצג למשתמש)</Label>
                <Textarea 
                  value={outletForm.warning_text} 
                  onChange={(e) => setOutletForm({ ...outletForm, warning_text: e.target.value })}
                  placeholder="מחייב בדיקת צניעות קפדנית..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
            {/* Logo Upload */}
            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-semibold mb-2 block">לוגו ערוץ</Label>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              {outletForm.logo_url ? (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={outletForm.logo_url} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-contain rounded border bg-white"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    החלף לוגו
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="w-full h-20 border-dashed"
                >
                  {isUploadingLogo ? (
                    <span>מעלה...</span>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Image className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">לחץ להעלאת לוגו</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
            {/* Brand Color */}
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">צבע מותג</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="color" 
                    value={outletForm.brand_color}
                    onChange={(e) => setOutletForm({ ...outletForm, brand_color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input 
                    value={outletForm.brand_color}
                    onChange={(e) => setOutletForm({ ...outletForm, brand_color: e.target.value })}
                    className="w-28"
                    placeholder="#E31E24"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={outletForm.is_active} onCheckedChange={(c) => setOutletForm({ ...outletForm, is_active: c })} />
                <Label>פעיל</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOutletDialog(false)}>ביטול</Button>
            <Button onClick={saveOutlet}>{editingOutlet ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={productForm.name_he} onChange={(e) => setProductForm({ ...productForm, name_he: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>סוג מוצר</Label>
              <Input 
                value={productForm.product_type} 
                onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value })} 
                placeholder="print_magazine, digital_banner, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>מחיר בסיס (₪)</Label>
                <Input type="number" value={productForm.base_price} 
                  onChange={(e) => setProductForm({ ...productForm, base_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>מחיר לקוח (₪)</Label>
                <Input type="number" value={productForm.client_price}
                  onChange={(e) => setProductForm({ ...productForm, client_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            {/* Target Audience & Special Tag */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>קהל יעד</Label>
                <Select value={productForm.target_audience} onValueChange={(v) => setProductForm({ ...productForm, target_audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">כללי</SelectItem>
                    <SelectItem value="women">נשים</SelectItem>
                    <SelectItem value="men">גברים</SelectItem>
                    <SelectItem value="youth">נוער</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>תג מיוחד</Label>
                <Select value={productForm.special_tag || 'none'} onValueChange={(v) => setProductForm({ ...productForm, special_tag: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="ללא" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא</SelectItem>
                    <SelectItem value="high_reach">הפצה רוויה</SelectItem>
                    <SelectItem value="best_seller">רב מכר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={productForm.requires_image} onCheckedChange={(c) => setProductForm({ ...productForm, requires_image: c })} />
                <Label>דורש תמונה</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={productForm.requires_text} onCheckedChange={(c) => setProductForm({ ...productForm, requires_text: c })} />
                <Label>דורש טקסט</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={productForm.is_active} onCheckedChange={(c) => setProductForm({ ...productForm, is_active: c })} />
                <Label>פעיל</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProductDialog(false)}>ביטול</Button>
            <Button onClick={saveProduct}>{editingProduct ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spec Dialog */}
      <Dialog open={specDialog} onOpenChange={setSpecDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSpec ? 'עריכת מפרט' : 'הוספת מפרט חדש'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={specForm.name} onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })} />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={specForm.name_he} onChange={(e) => setSpecForm({ ...specForm, name_he: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>מידות</Label>
              <Input value={specForm.dimensions} onChange={(e) => setSpecForm({ ...specForm, dimensions: e.target.value })} 
                placeholder="A4, 300x250px, 30s, etc." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>מחיר בסיס (₪)</Label>
                <Input type="number" value={specForm.base_price}
                  onChange={(e) => setSpecForm({ ...specForm, base_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>מחיר לקוח (₪)</Label>
                <Input type="number" value={specForm.client_price}
                  onChange={(e) => setSpecForm({ ...specForm, client_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={specForm.is_active} onCheckedChange={(c) => setSpecForm({ ...specForm, is_active: c })} />
              <Label>פעיל</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSpecDialog(false)}>ביטול</Button>
            <Button onClick={saveSpec}>{editingSpec ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* City Dialog */}
      <Dialog open={cityDialog} onOpenChange={setCityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCity ? 'עריכת עיר' : 'הוספת עיר חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={cityForm.name_he} onChange={(e) => setCityForm({ ...cityForm, name_he: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={cityForm.is_active} onCheckedChange={(c) => setCityForm({ ...cityForm, is_active: c })} />
              <Label>פעיל</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCityDialog(false)}>ביטול</Button>
            <Button onClick={saveCity}>{editingCity ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם (אנגלית)</Label>
                <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                  placeholder="National Press" />
              </div>
              <div>
                <Label>שם (עברית)</Label>
                <Input value={categoryForm.name_he} onChange={(e) => setCategoryForm({ ...categoryForm, name_he: e.target.value })}
                  placeholder="עיתונות ארצית" />
              </div>
            </div>
            <div>
              <Label>סדר מיון</Label>
              <Input type="number" value={categoryForm.sort_order} 
                onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCategoryDialog(false)}>ביטול</Button>
            <Button onClick={saveCategory}>{editingCategory ? 'עדכון' : 'הוספה'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaDatabaseAdmin;
