import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Copy, FileText, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  system_prompt: string;
  dynamic_variables: string[];
  style_preset: string | null;
  is_active: boolean;
}

const CATEGORIES = [
  { id: 'sale', label: 'מבצעים' },
  { id: 'branding', label: 'מיתוג' },
  { id: 'event', label: 'אירועים' },
  { id: 'holiday', label: 'חגים' },
  { id: 'general', label: 'כללי' },
];

const PromptTemplates = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    system_prompt: '',
    dynamic_variables: '',
    style_preset: '',
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.system_prompt) {
      toast.error('נא למלא שם ופרומפט');
      return;
    }

    const variables = formData.dynamic_variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v);

    const payload = {
      name: formData.name,
      category: formData.category,
      system_prompt: formData.system_prompt,
      dynamic_variables: variables,
      style_preset: formData.style_preset || null,
      is_active: formData.is_active,
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from('prompt_templates')
        .update(payload)
        .eq('id', editingTemplate.id);

      if (error) {
        toast.error('שגיאה בעדכון');
        return;
      }
      toast.success('עודכן בהצלחה');
    } else {
      const { error } = await supabase
        .from('prompt_templates')
        .insert(payload);

      if (error) {
        toast.error('שגיאה בהוספה');
        return;
      }
      toast.success('נוסף בהצלחה');
    }

    setIsDialogOpen(false);
    resetForm();
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('בטוח למחוק?')) return;

    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('שגיאה במחיקה');
      return;
    }

    toast.success('נמחק בהצלחה');
    loadTemplates();
  };

  const openEditDialog = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      system_prompt: template.system_prompt,
      dynamic_variables: template.dynamic_variables.join(', '),
      style_preset: template.style_preset || '',
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'general',
      system_prompt: '',
      dynamic_variables: '',
      style_preset: '',
      is_active: true,
    });
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success('הפרומפט הועתק');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">תבניות ננו-בננה</h1>
          <p className="text-[#888]">פרומפטים מוכנים ליצירת תמונות</p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 ml-2" />
          תבנית חדשה
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="bg-[#111113] border-[#222]">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {template.name}
                  </CardTitle>
                  <Badge className="bg-[#222] mt-2">
                    {CATEGORIES.find(c => c.id === template.category)?.label}
                  </Badge>
                </div>
                <Badge className={template.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {template.is_active ? 'פעיל' : 'לא פעיל'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0a0a0b] rounded-lg p-3 mb-3 font-mono text-xs text-[#888] max-h-24 overflow-hidden">
                {template.system_prompt.substring(0, 150)}...
              </div>

              {template.dynamic_variables.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-[#555] mb-1">משתנים דינמיים:</p>
                  <div className="flex gap-1 flex-wrap">
                    {template.dynamic_variables.map(v => (
                      <Badge key={v} variant="outline" className="border-primary/30 text-primary text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyPrompt(template.system_prompt)}
                  className="text-[#888] hover:text-white"
                >
                  <Copy className="h-4 w-4 ml-1" />
                  העתק
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(template)}
                  className="text-[#888] hover:text-white"
                >
                  <Pencil className="h-4 w-4 ml-1" />
                  ערוך
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(template.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && !isLoading && (
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-8 text-center text-[#888]">
            <Code className="h-12 w-12 mx-auto mb-4 text-[#333]" />
            <p>אין תבניות עדיין</p>
            <p className="text-sm">צור תבנית ראשונה לננו-בננה</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#111113] border-[#222] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'עריכת תבנית' : 'תבנית חדשה'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם התבנית</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="למשל: באנר מבצע - טקסט כבד"
                  className="bg-[#1a1a1d] border-[#333]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>קטגוריה</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-[#1a1a1d] border-[#333]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1d] border-[#333]">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="הפרומפט המלא לננו-בננה..."
                className="bg-[#1a1a1d] border-[#333] font-mono text-sm min-h-[200px]"
              />
              <p className="text-xs text-[#555]">
                השתמש ב-{`{{variable}}`} למשתנים דינמיים
              </p>
            </div>

            <div className="space-y-2">
              <Label>משתנים דינמיים (מופרדים בפסיקים)</Label>
              <Input
                value={formData.dynamic_variables}
                onChange={(e) => setFormData({ ...formData, dynamic_variables: e.target.value })}
                placeholder="Client_Offer, Phone_Number, Discount_Percent"
                className="bg-[#1a1a1d] border-[#333]"
              />
            </div>

            <div className="space-y-2">
              <Label>Style Preset (אופציונלי)</Label>
              <Input
                value={formData.style_preset}
                onChange={(e) => setFormData({ ...formData, style_preset: e.target.value })}
                placeholder="למשל: ultra-realistic, 3d-character"
                className="bg-[#1a1a1d] border-[#333]"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label>פעיל</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSubmit} className="bg-primary">
              {editingTemplate ? 'עדכון' : 'הוספה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptTemplates;
