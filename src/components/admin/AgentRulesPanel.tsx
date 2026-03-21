import { useState, useEffect } from 'react';
import { Shield, Bot, Image, Radio, Megaphone, Layout, Eye, Palette, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Copy, Check, Save, Pencil, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Iron Rules ──
const IRON_RULES = [
  { id: 'no-women', icon: Shield, title: 'איסור דמויות נשים', severity: 'critical' as const, description: 'איסור מוחלט על הצגת נשים או בנות בכל תמונה. שימוש בגברים וילדים בלבד בסיטואציות מכובדות.' },
  { id: 'children-no-beard', icon: Eye, title: 'ילדים ללא זקן', severity: 'critical' as const, description: 'ילדים חייבים להופיע עם פנים חלקות — ללא זקן או שיער פנים. ידיים עם 5 אצבעות בדיוק.' },
  { id: 'modest-clothing', icon: Shield, title: 'לבוש הולם', severity: 'critical' as const, description: 'חולצות רכוסות, חליפות כהות, כיסוי ראש (כיפה/כובע) בכל הדימויים.' },
  { id: 'no-religious-objects', icon: AlertTriangle, title: 'ללא תשמישי קדושה', severity: 'high' as const, description: 'אין להשתמש בסמלים דתיים אלא אם העסק מוכר אותם. הטאץ\' החרדי — בטיפוגרפיה ובצבעים בלבד.' },
  { id: 'hebrew-rtl', icon: Layout, title: 'עברית RTL מושלמת', severity: 'critical' as const, description: 'כל טקסט חייב להיות בעברית, מימין לשמאל. אותיות בסדר נכון — לא הפוכות או מעורבלות.' },
  { id: 'respectful-language', icon: Megaphone, title: 'שפה מכובדת — ללא ציווי', severity: 'high' as const, description: 'פנייה בלשון כבוד. ללא ציווי ישיר ("קנה עכשיו!"). להשתמש ב"הזמינו", "בואו להתרשם".' },
  { id: 'gender-address', icon: Shield, title: 'פנייה מגדרית מדויקת', severity: 'high' as const, description: 'זכר לגברים, נקבה לנשים. אם הקהל מעורב — שימוש ב"הזמינו" (רבים).' },
  { id: 'visual-relevance', icon: Eye, title: 'רלוונטיות ויזואלית', severity: 'high' as const, description: 'הוויז\'ואל חייב להתאים למוצר הספציפי בבריף. ללא אלמנטים לא רלוונטיים.' },
  { id: 'no-text-leakage', icon: XCircle, title: 'ללא זליגת טקסט טכני', severity: 'high' as const, description: 'מנגנון Visual Prompt Sanitization מסנן תוויות כמו "CONTACT DETAILS", "BOTTOM-LEFT" מהפרומפטים.' },
  { id: 'logo-integrity', icon: Palette, title: 'שלמות לוגו', severity: 'critical' as const, description: 'לוגו נשלח כרפרנס ויזואלי (image_url). לא להמציא לוגו — אם אין, להשאיר ריק. מיקום: שמאל-תחתון.' },
];

interface AgentInfo {
  id: string;
  name: string;
  icon: React.ElementType;
  model: string;
  provider: string;
  edgeFunction: string;
  role: string;
}

const AGENTS: AgentInfo[] = [
  { id: 'super-agent', name: 'סוכן-על (Guardian)', icon: Shield, model: 'gemini-2.5-pro', provider: 'Google Direct → Gateway Fallback', edgeFunction: 'super-agent', role: 'שומר הסף של המערכת. מחזיק בקונטקסט המלא של המגזר החרדי. כל פלט חייב לעבור אישורו.' },
  { id: 'creative-agent', name: 'סוכן יצירתי (Creative)', icon: Megaphone, model: 'gemini-2.5-pro', provider: 'Google Direct → Gateway Fallback', edgeFunction: 'creative-agent', role: 'קופירייטר בכיר — קונספטים, סלוגנים, קופי. מייצר 3 כיוונים יצירתיים.' },
  { id: 'studio-agent', name: 'סוכן סטודיו (Art Director)', icon: Image, model: 'gemini-2.5-pro + ננו בננה 2', provider: 'Google Direct + Gateway', edgeFunction: 'studio-agent', role: 'ארט-דירקטור. מתרגם קריאייטיב לתוצר ויזואלי מוגמר.' },
  { id: 'media-agent', name: 'סוכן מדיה (Media)', icon: Radio, model: 'gemini-2.5-pro', provider: 'Google Direct → Gateway Fallback', edgeFunction: 'media-agent', role: 'תכנון מדיה, תקציבים, המלצות חבילות ואסטרטגיית פרסום.' },
  { id: 'kosher-check', name: 'בדיקת כשרות (Kosher Check)', icon: CheckCircle2, model: 'gemini-2.5-flash', provider: 'Google Direct → Gateway Fallback', edgeFunction: 'kosher-check', role: 'בדיקה אוטומטית של כל תוצר ויזואלי לפני הצגה למשתמש.' },
  { id: 'generate-image', name: 'מחולל תמונות (All-in-One)', icon: Palette, model: 'gemini-3.1-flash-image-preview (ננו בננה 2)', provider: 'Lovable Gateway בלבד', edgeFunction: 'generate-image', role: 'מייצר מודעות שלמות בשכבה אחת: ויז\'ואל + טיפוגרפיה עברית + לוגו.' },
];

const MODEL_MAP = [
  { func: 'generate-image', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'generate-creative', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'generate-branding', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'generate-slide-image', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'studio-agent', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'creative-agent', model: 'gemini-2.5-pro', provider: 'Google Direct', type: 'טקסט' },
  { func: 'media-agent', model: 'gemini-2.5-pro', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'super-agent', model: 'gemini-2.5-pro', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'generate-presentation', model: 'gemini-3-flash-preview', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'generate-internal-material', model: 'gemini-3-flash-preview', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'kosher-check', model: 'gemini-2.5-flash', provider: 'Google Direct → Fallback', type: 'ניתוח' },
  { func: 'ai-chat', model: 'gemini-2.5-flash', provider: 'Google Direct → Fallback', type: 'צ\'אט' },
];

interface AgentPromptRow {
  id: string;
  agent_key: string;
  agent_name: string;
  system_prompt: string;
  updated_at: string;
}

const AgentRulesPanel = () => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'rules' | 'agents' | 'models'>('agents');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [prompts, setPrompts] = useState<Record<string, AgentPromptRow>>({});
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setLoadingPrompts(true);
    const { data, error } = await supabase
      .from('agent_prompts')
      .select('*');
    if (!error && data) {
      const map: Record<string, AgentPromptRow> = {};
      for (const row of data as AgentPromptRow[]) {
        map[row.agent_key] = row;
      }
      setPrompts(map);
    }
    setLoadingPrompts(false);
  };

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const copyPrompt = (agentId: string) => {
    const prompt = prompts[agentId]?.system_prompt;
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopiedId(agentId);
      toast.success('הפרומפט הועתק');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const startEditing = (agentId: string) => {
    setEditingAgent(agentId);
    setEditText(prompts[agentId]?.system_prompt || '');
  };

  const cancelEditing = () => {
    setEditingAgent(null);
    setEditText('');
  };

  const savePrompt = async (agentId: string) => {
    setSaving(true);
    const existing = prompts[agentId];
    if (existing) {
      const { error } = await supabase
        .from('agent_prompts')
        .update({ system_prompt: editText, updated_at: new Date().toISOString() })
        .eq('agent_key', agentId);
      if (error) {
        toast.error('שגיאה בשמירה: ' + error.message);
      } else {
        toast.success('הפרומפט נשמר בהצלחה!');
        setEditingAgent(null);
        fetchPrompts();
      }
    } else {
      // Insert new
      const agent = AGENTS.find(a => a.id === agentId);
      const { error } = await supabase
        .from('agent_prompts')
        .insert({ agent_key: agentId, agent_name: agent?.name || agentId, system_prompt: editText });
      if (error) {
        toast.error('שגיאה בשמירה: ' + error.message);
      } else {
        toast.success('הפרומפט נשמר בהצלחה!');
        setEditingAgent(null);
        fetchPrompts();
      }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          כללי ברזל וסוכנים
        </h2>
        <p className="text-muted-foreground mt-1">מפת כל ההוראות, הפרומפטים והמודלים של מערכת ADKOP</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'agents' as const, label: 'סוכנים ופרומפטים', count: AGENTS.length },
          { id: 'rules' as const, label: 'כללי ברזל', count: IRON_RULES.length },
          { id: 'models' as const, label: 'מפת מודלים', count: MODEL_MAP.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className="mr-2 opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Iron Rules */}
      {activeSection === 'rules' && (
        <div className="grid gap-3">
          {IRON_RULES.map(rule => (
            <div key={rule.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
              <div className={`p-2 rounded-lg ${rule.severity === 'critical' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                <rule.icon className={`h-5 w-5 ${rule.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground">{rule.title}</h3>
                  <Badge variant="outline" className={severityColors[rule.severity]}>
                    {rule.severity === 'critical' ? 'קריטי' : 'חשוב'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agents with full prompts */}
      {activeSection === 'agents' && (
        <div className="grid gap-4">
          {loadingPrompts && (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              טוען פרומפטים...
            </div>
          )}
          {!loadingPrompts && AGENTS.map(agent => {
            const isExpanded = expandedAgent === agent.id;
            const promptRow = prompts[agent.id];
            const promptText = promptRow?.system_prompt || '';
            const isEditing = editingAgent === agent.id;
            const lastUpdated = promptRow?.updated_at ? new Date(promptRow.updated_at).toLocaleString('he-IL') : null;

            return (
              <div key={agent.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <agent.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="font-semibold text-foreground">{agent.name}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{agent.model}</p>
                  </div>
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                    {agent.provider}
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-3">
                    <p className="text-muted-foreground text-sm">{agent.role}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs text-muted-foreground font-medium">
                            System Prompt — {agent.edgeFunction}/index.ts
                          </h4>
                          {lastUpdated && (
                            <span className="text-xs text-muted-foreground/60">עודכן: {lastUpdated}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEditing && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); startEditing(agent.id); }}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-muted"
                              >
                                <Pencil className="h-3 w-3" />
                                ערוך
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyPrompt(agent.id); }}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-muted"
                              >
                                {copiedId === agent.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                {copiedId === agent.id ? 'הועתק' : 'העתק'}
                              </button>
                            </>
                          )}
                          {isEditing && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => { e.stopPropagation(); savePrompt(agent.id); }}
                                disabled={saving}
                                className="h-7 text-xs gap-1"
                              >
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                שמור
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                className="h-7 text-xs gap-1"
                              >
                                <X className="h-3 w-3" />
                                בטל
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isEditing ? (
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[400px] font-mono text-xs leading-relaxed bg-muted/70 border-border"
                          dir="rtl"
                        />
                      ) : (
                        <pre
                          className="bg-muted/70 border border-border rounded-lg p-4 text-xs text-foreground/90 max-h-[400px] overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono"
                          dir="rtl"
                          style={{ tabSize: 2 }}
                        >
                          {promptText || '(לא נמצא פרומפט — לחץ "ערוך" כדי להוסיף)'}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Model Map */}
      {activeSection === 'models' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right p-3 text-muted-foreground font-medium">פונקציה</th>
                <th className="text-right p-3 text-muted-foreground font-medium">מודל</th>
                <th className="text-right p-3 text-muted-foreground font-medium">ספק</th>
                <th className="text-right p-3 text-muted-foreground font-medium">סוג</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_MAP.map((entry, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3 text-foreground font-mono text-xs">{entry.func}</td>
                  <td className="p-3 text-muted-foreground text-xs">{entry.model}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-xs ${
                      entry.provider === 'Gateway' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {entry.provider}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-xs ${
                      entry.type === 'תמונה'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {entry.type}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgentRulesPanel;
