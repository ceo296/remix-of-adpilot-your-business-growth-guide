import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Eye, Code, Copy, FileCode2, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { renderTemplate, extractPlaceholders, validateTemplate, AVAILABLE_PLACEHOLDERS, DEFAULT_TEMPLATE, type TemplateData } from '@/lib/template-engine';
import { toPng } from 'html-to-image';

interface AdLayoutTemplate {
  id: string;
  name: string;
  description: string | null;
  html_template: string;
  placeholders: any;
  is_global: boolean;
  client_profile_id: string | null;
  is_active: boolean;
  media_type: string | null;
  created_at: string;
}

const SAMPLE_LOGO_SVG = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" rx="4" fill="#E34870"/><text x="60" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="sans-serif">LOGO</text></svg>')}`;

const SAMPLE_DATA: TemplateData = {
  headline: 'הנחת שתרצו לספר עליה לכולם',
  subheadline: 'לרגל חופשת פסח והכנה לתקופת הלימודים',
  subtitle: 'לרגל חופשת פסח והכנה לתקופת הלימודים',
  bodyText: 'בחג הזה, העניקו להם מתנה של קשב וריכוז, ותקבלו נחת לכל החיים.',
  ctaText: 'התקשרו עכשיו',
  businessName: 'אקטיב הד',
  business_name: 'אקטיב הד',
  phone: '033818980',
  email: 'cx@havimoti.co.il',
  address: 'בני ברק',
  address_list: ['בני ברק', 'ירושלים', 'פתח תקווה', 'אשדוד'],
  primaryColor: '#E34870',
  brand_primary_color: '#E34870',
  secondaryColor: '#2A2F33',
  brand_font_family: 'Assistant',
  logoUrl: SAMPLE_LOGO_SVG,
  logo_url: SAMPLE_LOGO_SVG,
  services: ['אבחון', 'טיפול', 'ייעוץ', 'הדרכה'],
  servicesList: ['אבחון', 'טיפול', 'ייעוץ', 'הדרכה'],
  promoText: 'מבצע חג!',
  promo_text: '20%\nהנחה!',
  promoValue: '20% הנחה',
  width: 400,
  height: 533,
};

function createSampleBgUrl(w: number, h: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#f5e6d3');
  grad.addColorStop(0.5, '#d4b896');
  grad.addColorStop(1, '#c9a87c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#8B7355';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.4, w * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  return canvas.toDataURL('image/jpeg', 0.8);
}

export default function TemplateEditor() {
  const [templates, setTemplates] = useState<AdLayoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formHtml, setFormHtml] = useState('');
  const [formIsGlobal, setFormIsGlobal] = useState(true);
  const [formMediaType, setFormMediaType] = useState('print');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ad_layout_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast.error('שגיאה בטעינת תבניות'); console.error(error); }
    else setTemplates((data as any[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormDesc('');
    setFormHtml('');
    setFormIsGlobal(true);
    setFormMediaType('print');
    setFormIsActive(true);
    setErrors([]);
    setShowPreview(false);
  };

  const startEdit = (t: AdLayoutTemplate) => {
    setEditingId(t.id);
    setFormName(t.name);
    setFormDesc(t.description || '');
    setFormHtml(t.html_template);
    setFormIsGlobal(t.is_global);
    setFormMediaType(t.media_type || 'print');
    setFormIsActive(t.is_active);
    setErrors([]);
  };

  const startNew = () => {
    resetForm();
    setEditingId('new');
    setFormHtml(DEFAULT_TEMPLATE);
    setFormName('תבנית חדשה');
  };

  const handlePreview = useCallback(() => {
    const sampleBg = createSampleBgUrl(400, 533);
    const data: TemplateData = { ...SAMPLE_DATA, imageUrl: sampleBg, image_url: sampleBg };
    const rendered = renderTemplate(formHtml, data);
    setPreviewHtml(rendered);
    setShowPreview(true);
  }, [formHtml]);

  const handleValidate = useCallback(() => {
    const errs = validateTemplate(formHtml);
    setErrors(errs);
    if (errs.length === 0) toast.success('התבנית תקינה!');
    else toast.error(`נמצאו ${errs.length} שגיאות`);
  }, [formHtml]);

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('נא למלא שם תבנית'); return; }
    const errs = validateTemplate(formHtml);
    if (errs.length > 0) { setErrors(errs); toast.error('תקן שגיאות לפני שמירה'); return; }

    setSaving(true);
    const placeholders = extractPlaceholders(formHtml);
    const payload = {
      name: formName.trim(),
      description: formDesc.trim() || null,
      html_template: formHtml,
      placeholders,
      is_global: formIsGlobal,
      is_active: formIsActive,
      media_type: formMediaType,
    };

    try {
      if (editingId === 'new') {
        const { error } = await supabase.from('ad_layout_templates').insert(payload as any);
        if (error) throw error;
        toast.success('תבנית נוצרה בהצלחה!');
      } else {
        const { error } = await supabase.from('ad_layout_templates').update(payload as any).eq('id', editingId!);
        if (error) throw error;
        toast.success('תבנית עודכנה!');
      }
      resetForm();
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק תבנית זו?')) return;
    const { error } = await supabase.from('ad_layout_templates').delete().eq('id', id);
    if (error) toast.error('שגיאה במחיקה');
    else { toast.success('נמחק'); fetchTemplates(); if (editingId === id) resetForm(); }
  };

  const insertPlaceholder = (key: string) => {
    setFormHtml(prev => prev + `{{${key}}}`);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Editor view
  if (editingId) {
    return (
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{editingId === 'new' ? 'תבנית חדשה' : 'עריכת תבנית'}</h2>
          <Button variant="ghost" onClick={resetForm}><X className="h-4 w-4 ml-1" /> חזרה</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Editor */}
          <div className="space-y-3">
            <Input placeholder="שם התבנית" value={formName} onChange={e => setFormName(e.target.value)}
                   className="bg-[#1a1a1d] border-[#333] text-white" />
            <Input placeholder="תיאור (אופציונלי)" value={formDesc} onChange={e => setFormDesc(e.target.value)}
                   className="bg-[#1a1a1d] border-[#333] text-white" />
            
            <div className="flex gap-2 items-center">
              <Select value={formMediaType} onValueChange={setFormMediaType}>
                <SelectTrigger className="w-32 bg-[#1a1a1d] border-[#333] text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="print">דפוס</SelectItem>
                  <SelectItem value="banner">באנר</SelectItem>
                  <SelectItem value="social">סושיאל</SelectItem>
                  <SelectItem value="all">הכל</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={formIsGlobal} onCheckedChange={setFormIsGlobal} />
                <span className="text-sm text-[#aaa]">גלובלית</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                <span className="text-sm text-[#aaa]">פעילה</span>
              </div>
            </div>

            {/* Placeholders helper */}
            <div>
              <button onClick={() => setShowPlaceholders(!showPlaceholders)}
                      className="flex items-center gap-1 text-sm text-primary hover:underline">
                <Code className="h-3 w-3" /> Placeholders זמינים
                {showPlaceholders ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showPlaceholders && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {AVAILABLE_PLACEHOLDERS.map(p => (
                    <button key={p.key} onClick={() => insertPlaceholder(p.key)}
                            className="text-xs bg-[#222] text-[#ccc] px-2 py-1 rounded hover:bg-primary/20 hover:text-primary transition-colors"
                            title={`${p.label}: ${p.example}`}>
                      {`{{${p.key}}}`}
                    </button>
                  ))}
                  <button onClick={() => setFormHtml(prev => prev + '{{#if headline}}...{{/if}}')}
                          className="text-xs bg-[#333] text-yellow-400 px-2 py-1 rounded hover:bg-yellow-400/10">
                    #if...#/if
                  </button>
                  <button onClick={() => setFormHtml(prev => prev + '{{#each services}}{{this}}{{/each}}')}
                          className="text-xs bg-[#333] text-green-400 px-2 py-1 rounded hover:bg-green-400/10">
                    #each...#/each
                  </button>
                </div>
              )}
            </div>

            {/* HTML Editor */}
            <Textarea
              value={formHtml}
              onChange={e => setFormHtml(e.target.value)}
              className="bg-[#0d0d0f] border-[#333] text-[#e0e0e0] font-mono text-xs min-h-[400px] leading-relaxed"
              dir="ltr"
              placeholder="הדבק כאן את קוד ה-HTML של התבנית..."
            />

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 space-y-1">
                {errors.map((e, i) => <p key={i} className="text-sm text-red-400">⚠️ {e}</p>)}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handlePreview} variant="outline" className="border-[#333] text-white hover:bg-[#222]">
                <Eye className="h-4 w-4 ml-1" /> תצוגה מקדימה
              </Button>
              <Button onClick={handleValidate} variant="outline" className="border-[#333] text-white hover:bg-[#222]">
                <FileCode2 className="h-4 w-4 ml-1" /> בדיקת תקינות
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
                שמירה
              </Button>
            </div>

            {/* Detected placeholders */}
            <div className="text-xs text-[#888]">
              משתנים שזוהו: {extractPlaceholders(formHtml).map(k => (
                <Badge key={k} variant="outline" className="text-[10px] mr-1 border-[#444]">{k}</Badge>
              ))}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#aaa]">תצוגה מקדימה</h3>
            <div className="bg-[#111] border border-[#333] rounded-lg min-h-[400px] flex items-center justify-center overflow-hidden">
              {showPreview ? (
                <iframe
                  ref={previewRef as any}
                  srcDoc={previewHtml}
                  className="w-full border-0 shadow-2xl"
                  style={{ height: 600, maxWidth: 450 }}
                  sandbox="allow-scripts allow-same-origin"
                  title="תצוגה מקדימה"
                />
              ) : (
                <p className="text-[#555] text-sm">לחץ "תצוגה מקדימה" כדי לראות את התבנית</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">תבניות מודעה (Master Templates)</h2>
          <p className="text-sm text-[#888]">הגדר תבניות HTML עם Placeholders — המערכת תמלא אותן אוטומטית מהקופי של ה-AI</p>
        </div>
        <Button onClick={startNew} className="bg-primary">
          <Plus className="h-4 w-4 ml-1" /> תבנית חדשה
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="bg-[#111] border-[#333] p-10 text-center">
          <FileCode2 className="h-12 w-12 mx-auto text-[#555] mb-3" />
          <p className="text-[#888]">אין תבניות עדיין. לחץ "תבנית חדשה" כדי ליצור את הראשונה.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <Card key={t.id} className="bg-[#111] border-[#333] p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => startEdit(t)}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">{t.name}</h3>
                <div className="flex gap-1">
                  {t.is_global && <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-400">גלובלית</Badge>}
                  {!t.is_active && <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-400">לא פעילה</Badge>}
                  <Badge variant="outline" className="text-[10px] border-[#444]">{t.media_type || 'print'}</Badge>
                </div>
              </div>
              {t.description && <p className="text-xs text-[#888]">{t.description}</p>}
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-[#555]">
                  {(t.placeholders as string[])?.length || 0} משתנים
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 h-7 px-2"
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
