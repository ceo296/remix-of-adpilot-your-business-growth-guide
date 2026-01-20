import { useState, useEffect } from 'react';
import { Brain, Save, Pencil, X, Check, Plus, Trash2, ChevronDown, ChevronUp, Image, FileText, Radio, RectangleHorizontal, Megaphone, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';

interface AIModelConfig {
  id: string;
  media_type: string;
  model_name: string;
  display_name: string;
  description: string | null;
  system_prompt: string;
  design_rules: string[] | null;
  text_rules: string[] | null;
  logo_instructions: string | null;
  color_usage_rules: string | null;
  typography_rules: string | null;
  layout_principles: string[] | null;
  dos: string[] | null;
  donts: string[] | null;
  example_prompts: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const MEDIA_ICONS: Record<string, React.ElementType> = {
  print_ads: Newspaper,
  banners: Image,
  signage: RectangleHorizontal,
  marketing_copy: FileText,
  promo: Megaphone,
  radio: Radio,
};

const MEDIA_LABELS: Record<string, string> = {
  print_ads: 'מודעות דפוס',
  banners: 'באנרים',
  signage: 'שילוט',
  marketing_copy: 'קופי',
  promo: 'קד"מ',
  radio: 'רדיו',
};

const AIModelConfigsAdmin = () => {
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIModelConfig>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('ai_model_configs')
      .select('*')
      .order('media_type');

    if (error) {
      console.error('Error loading configs:', error);
      toast.error('שגיאה בטעינת הגדרות');
    } else {
      setConfigs(data || []);
    }
    setIsLoading(false);
  };

  const startEdit = (config: AIModelConfig) => {
    setEditingId(config.id);
    setEditForm({ ...config });
    setExpandedSections({ [config.id]: true });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('ai_model_configs')
      .update({
        display_name: editForm.display_name,
        description: editForm.description,
        system_prompt: editForm.system_prompt,
        design_rules: editForm.design_rules,
        text_rules: editForm.text_rules,
        logo_instructions: editForm.logo_instructions,
        color_usage_rules: editForm.color_usage_rules,
        typography_rules: editForm.typography_rules,
        layout_principles: editForm.layout_principles,
        dos: editForm.dos,
        donts: editForm.donts,
        example_prompts: editForm.example_prompts,
        is_active: editForm.is_active,
      })
      .eq('id', editingId);

    if (error) {
      console.error('Error saving config:', error);
      toast.error('שגיאה בשמירה');
    } else {
      toast.success('ההגדרות נשמרו');
      setEditingId(null);
      setEditForm({});
      loadConfigs();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('ai_model_configs')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast.error('שגיאה בעדכון');
    } else {
      loadConfigs();
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const updateArrayField = (field: keyof AIModelConfig, index: number, value: string) => {
    const currentArray = (editForm[field] as string[]) || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    setEditForm(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: keyof AIModelConfig) => {
    const currentArray = (editForm[field] as string[]) || [];
    setEditForm(prev => ({ ...prev, [field]: [...currentArray, ''] }));
  };

  const removeArrayItem = (field: keyof AIModelConfig, index: number) => {
    const currentArray = (editForm[field] as string[]) || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    setEditForm(prev => ({ ...prev, [field]: newArray }));
  };

  const ArrayFieldEditor = ({ field, label, items }: { field: keyof AIModelConfig; label: string; items: string[] | null }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="space-y-2">
        {(items || []).map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => updateArrayField(field, index, e.target.value)}
              className="flex-1 bg-muted/50 border-border text-foreground"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeArrayItem(field, index)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => addArrayItem(field)}
          className="border-dashed"
        >
          <Plus className="h-4 w-4 ml-1" />
          הוסף
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          מודלים ייעודיים
        </h1>
        <p className="text-muted-foreground">הגדרת system prompts והנחיות לכל סוג מדיה</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {configs.map(config => {
          const Icon = MEDIA_ICONS[config.media_type] || Brain;
          return (
            <Card key={config.id} className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <Icon className={`h-6 w-6 mx-auto mb-1 ${config.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-xs font-medium truncate text-foreground">{MEDIA_LABELS[config.media_type] || config.media_type}</div>
                <Badge variant={config.is_active ? 'default' : 'secondary'} className="mt-1 text-xs">
                  {config.is_active ? 'פעיל' : 'מושבת'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config Cards */}
      <div className="space-y-4">
        {configs.map(config => {
          const Icon = MEDIA_ICONS[config.media_type] || Brain;
          const isEditing = editingId === config.id;
          const isExpanded = expandedSections[config.id];

          return (
            <Collapsible key={config.id} open={isExpanded} onOpenChange={() => toggleSection(config.id)}>
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg text-foreground">
                          {isEditing ? (
                            <Input
                              value={editForm.display_name || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                              className="bg-muted/50 border-border h-8 text-foreground"
                            />
                          ) : (
                            config.display_name
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          {config.model_name} | {config.media_type}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={() => toggleActive(config.id, config.is_active)}
                      />
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {isEditing ? (
                      <div className="space-y-6">
                        {/* Description */}
                        <div>
                          <Label className="text-foreground">תיאור</Label>
                          <Input
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="bg-muted/50 border-border text-foreground"
                          />
                        </div>

                        {/* System Prompt */}
                        <div>
                          <Label className="text-foreground">System Prompt</Label>
                          <Textarea
                            value={editForm.system_prompt || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, system_prompt: e.target.value }))}
                            className="bg-muted/50 border-border min-h-[150px] text-foreground"
                            dir="rtl"
                          />
                        </div>

                        {/* Logo Instructions */}
                        <div>
                          <Label className="text-foreground">הנחיות לוגו</Label>
                          <Textarea
                            value={editForm.logo_instructions || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, logo_instructions: e.target.value }))}
                            className="bg-muted/50 border-border text-foreground"
                            dir="rtl"
                          />
                        </div>

                        {/* Color Rules */}
                        <div>
                          <Label className="text-foreground">כללי שימוש בצבעים</Label>
                          <Textarea
                            value={editForm.color_usage_rules || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, color_usage_rules: e.target.value }))}
                            className="bg-muted/50 border-border text-foreground"
                            dir="rtl"
                          />
                        </div>

                        {/* Typography */}
                        <div>
                          <Label className="text-foreground">כללי טיפוגרפיה</Label>
                          <Textarea
                            value={editForm.typography_rules || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, typography_rules: e.target.value }))}
                            className="bg-muted/50 border-border text-foreground"
                            dir="rtl"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <ArrayFieldEditor field="design_rules" label="כללי עיצוב" items={editForm.design_rules} />
                          <ArrayFieldEditor field="text_rules" label="כללי טקסט" items={editForm.text_rules} />
                          <ArrayFieldEditor field="layout_principles" label="עקרונות פריסה" items={editForm.layout_principles} />
                          <ArrayFieldEditor field="example_prompts" label="דוגמאות פרומפט" items={editForm.example_prompts} />
                          <ArrayFieldEditor field="dos" label="לעשות ✓" items={editForm.dos} />
                          <ArrayFieldEditor field="donts" label="לא לעשות ✗" items={editForm.donts} />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4 ml-1" />
                            ביטול
                          </Button>
                          <Button onClick={saveEdit} className="bg-primary">
                            <Save className="h-4 w-4 ml-1" />
                            שמור
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{config.description}</p>

                        <Tabs defaultValue="prompt" className="w-full">
                          <TabsList className="bg-muted">
                            <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                            <TabsTrigger value="logo">לוגו</TabsTrigger>
                            <TabsTrigger value="rules">כללים</TabsTrigger>
                            <TabsTrigger value="dos">Do/Don't</TabsTrigger>
                          </TabsList>

                          <TabsContent value="prompt" className="mt-3">
                            <div className="bg-muted/50 rounded-lg p-4 text-sm max-h-[200px] overflow-y-auto text-foreground" dir="rtl">
                              {config.system_prompt}
                            </div>
                          </TabsContent>

                          <TabsContent value="logo" className="mt-3">
                            <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground" dir="rtl">
                              {config.logo_instructions || 'לא הוגדר'}
                            </div>
                          </TabsContent>

                          <TabsContent value="rules" className="mt-3">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2 text-foreground">כללי עיצוב</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                  {(config.design_rules || []).map((rule, i) => (
                                    <li key={i}>• {rule}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2 text-foreground">כללי טקסט</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                  {(config.text_rules || []).map((rule, i) => (
                                    <li key={i}>• {rule}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="dos" className="mt-3">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-green-950/30 rounded-lg p-4 border border-green-900/50">
                                <h4 className="font-medium mb-2 text-green-400">✓ לעשות</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                  {(config.dos || []).map((item, i) => (
                                    <li key={i}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-red-950/30 rounded-lg p-4 border border-red-900/50">
                                <h4 className="font-medium mb-2 text-red-400">✗ לא לעשות</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                  {(config.donts || []).map((item, i) => (
                                    <li key={i}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end">
                          <Button variant="outline" onClick={() => startEdit(config)}>
                            <Pencil className="h-4 w-4 ml-1" />
                            ערוך הגדרות
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default AIModelConfigsAdmin;
