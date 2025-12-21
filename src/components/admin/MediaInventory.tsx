import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MediaItem {
  id: string;
  name: string;
  type: string;
  sector_tags: string[];
  base_price: number;
  client_price: number;
  distribution_days: string[];
  reach: string | null;
  description: string | null;
  is_active: boolean;
}

const SECTORS = ['litvish', 'chassidish', 'sefardi', 'modern', 'general'];
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const TYPES = [
  { id: 'print', label: 'פרינט' },
  { id: 'digital', label: 'דיגיטל' },
  { id: 'radio', label: 'רדיו' },
  { id: 'outdoor', label: 'שילוט חוצות' },
];

const MediaInventory = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'print' as string,
    sector_tags: [] as string[],
    base_price: 0,
    client_price: 0,
    distribution_days: [] as string[],
    reach: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    const { data, error } = await supabase
      .from('media_inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading media:', error);
      toast.error('שגיאה בטעינת המדיה');
    } else {
      setMedia(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('נא להזין שם');
      return;
    }

    if (editingItem) {
      const { error } = await supabase
        .from('media_inventory')
        .update(formData)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('שגיאה בעדכון');
        return;
      }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase
        .from('media_inventory')
        .insert(formData);

      if (error) {
        toast.error('שגיאה בהוספה');
        return;
      }
      toast.success('נוסף בהצלחה');
    }

    setIsDialogOpen(false);
    resetForm();
    loadMedia();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('בטוח למחוק?')) return;

    const { error } = await supabase
      .from('media_inventory')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('שגיאה במחיקה');
      return;
    }

    toast.success('נמחק בהצלחה');
    loadMedia();
  };

  const openEditDialog = (item: MediaItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      sector_tags: item.sector_tags,
      base_price: item.base_price,
      client_price: item.client_price,
      distribution_days: item.distribution_days,
      reach: item.reach || '',
      description: item.description || '',
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      type: 'print',
      sector_tags: [],
      base_price: 0,
      client_price: 0,
      distribution_days: [],
      reach: '',
      description: '',
      is_active: true,
    });
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleSector = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      sector_tags: prev.sector_tags.includes(sector)
        ? prev.sector_tags.filter(s => s !== sector)
        : [...prev.sector_tags, sector]
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      distribution_days: prev.distribution_days.includes(day)
        ? prev.distribution_days.filter(d => d !== day)
        : [...prev.distribution_days, day]
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ניהול מדיה</h1>
          <p className="text-[#888]">ניהול קטלוג המדיה למשתמשים</p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 ml-2" />
          הוסף מדיה
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש..."
            className="pr-10 bg-[#1a1a1d] border-[#333] text-white"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 bg-[#1a1a1d] border-[#333] text-white">
            <SelectValue placeholder="סוג" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1d] border-[#333]">
            <SelectItem value="all">הכל</SelectItem>
            {TYPES.map(type => (
              <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-[#111113] border-[#222]">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="p-4 text-right text-[#888] font-medium">שם</th>
                <th className="p-4 text-right text-[#888] font-medium">סוג</th>
                <th className="p-4 text-right text-[#888] font-medium">סקטורים</th>
                <th className="p-4 text-right text-[#888] font-medium">מחיר בסיס</th>
                <th className="p-4 text-right text-[#888] font-medium">מחיר לקוח</th>
                <th className="p-4 text-right text-[#888] font-medium">סטטוס</th>
                <th className="p-4 text-right text-[#888] font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedia.map(item => (
                <tr key={item.id} className="border-b border-[#222] hover:bg-[#1a1a1d]">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="border-[#333]">
                      {TYPES.find(t => t.id === item.type)?.label}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {item.sector_tags.slice(0, 2).map(tag => (
                        <Badge key={tag} className="bg-[#222] text-xs">{tag}</Badge>
                      ))}
                      {item.sector_tags.length > 2 && (
                        <Badge className="bg-[#222] text-xs">+{item.sector_tags.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">₪{item.base_price}</td>
                  <td className="p-4">₪{item.client_price}</td>
                  <td className="p-4">
                    <Badge className={item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {item.is_active ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(item)}
                        className="text-[#888] hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMedia.length === 0 && (
            <div className="p-8 text-center text-[#888]">
              {isLoading ? 'טוען...' : 'אין תוצאות'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#111113] border-[#222] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'עריכת מדיה' : 'הוספת מדיה חדשה'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שם</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#1a1a1d] border-[#333]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>סוג</Label>
              <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="bg-[#1a1a1d] border-[#333]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1d] border-[#333]">
                  {TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>מחיר בסיס (₪)</Label>
              <Input
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                className="bg-[#1a1a1d] border-[#333]"
              />
            </div>

            <div className="space-y-2">
              <Label>מחיר לקוח (₪)</Label>
              <Input
                type="number"
                value={formData.client_price}
                onChange={(e) => setFormData({ ...formData, client_price: parseFloat(e.target.value) || 0 })}
                className="bg-[#1a1a1d] border-[#333]"
              />
            </div>

            <div className="space-y-2">
              <Label>חשיפה</Label>
              <Input
                value={formData.reach}
                onChange={(e) => setFormData({ ...formData, reach: e.target.value })}
                placeholder="למשל: 80,000+"
                className="bg-[#1a1a1d] border-[#333]"
              />
            </div>

            <div className="space-y-2 flex items-center gap-4">
              <Label>פעיל</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>סקטורים</Label>
              <div className="flex gap-2 flex-wrap">
                {SECTORS.map(sector => (
                  <Button
                    key={sector}
                    type="button"
                    size="sm"
                    variant={formData.sector_tags.includes(sector) ? 'default' : 'outline'}
                    onClick={() => toggleSector(sector)}
                    className={formData.sector_tags.includes(sector) ? '' : 'border-[#333] text-[#888]'}
                  >
                    {sector}
                  </Button>
                ))}
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>ימי הפצה</Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(day => (
                  <Button
                    key={day}
                    type="button"
                    size="sm"
                    variant={formData.distribution_days.includes(day) ? 'default' : 'outline'}
                    onClick={() => toggleDay(day)}
                    className={formData.distribution_days.includes(day) ? '' : 'border-[#333] text-[#888]'}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>תיאור</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#1a1a1d] border-[#333]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSubmit} className="bg-primary">
              {editingItem ? 'עדכון' : 'הוספה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaInventory;
