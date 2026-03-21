import { useState } from 'react';
import { Shield, Bot, Image, Radio, Megaphone, Layout, Eye, Palette, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── All Iron Rules & Agent Instructions (single source of truth for admin visibility) ──

const IRON_RULES = [
  {
    id: 'no-women',
    icon: Shield,
    title: 'איסור דמויות נשים',
    severity: 'critical' as const,
    description: 'איסור מוחלט על הצגת נשים או בנות בכל תמונה. שימוש בגברים וילדים בלבד בסיטואציות מכובדות.',
  },
  {
    id: 'children-no-beard',
    icon: Eye,
    title: 'ילדים ללא זקן',
    severity: 'critical' as const,
    description: 'ילדים חייבים להופיע עם פנים חלקות — ללא זקן או שיער פנים. ידיים עם 5 אצבעות בדיוק.',
  },
  {
    id: 'modest-clothing',
    icon: Shield,
    title: 'לבוש הולם',
    severity: 'critical' as const,
    description: 'חולצות רכוסות, חליפות כהות, כיסוי ראש (כיפה/כובע) בכל הדימויים.',
  },
  {
    id: 'no-religious-objects',
    icon: AlertTriangle,
    title: 'ללא תשמישי קדושה',
    severity: 'high' as const,
    description: 'אין להשתמש בסמלים דתיים (מנורה, ספר תורה) אלא אם העסק מוכר אותם. הטאץ\' החרדי — בטיפוגרפיה ובצבעים בלבד.',
  },
  {
    id: 'hebrew-rtl',
    icon: Layout,
    title: 'עברית RTL מושלמת',
    severity: 'critical' as const,
    description: 'כל טקסט חייב להיות בעברית, מימין לשמאל. אותיות בסדר נכון — לא הפוכות או מעורבלות.',
  },
  {
    id: 'respectful-language',
    icon: Megaphone,
    title: 'שפה מכובדת — ללא ציווי',
    severity: 'high' as const,
    description: 'פנייה בלשון כבוד. ללא ציווי ישיר ("קנה עכשיו!"). להשתמש ב"הזמינו", "בואו להתרשם".',
  },
  {
    id: 'gender-address',
    icon: Shield,
    title: 'פנייה מגדרית מדויקת',
    severity: 'high' as const,
    description: 'זכר לגברים, נקבה לנשים. אם הקהל מעורב — שימוש ב"הזמינו" (רבים).',
  },
  {
    id: 'visual-relevance',
    icon: Eye,
    title: 'רלוונטיות ויזואלית',
    severity: 'high' as const,
    description: 'הוויז\'ואל חייב להתאים למוצר הספציפי בבריף. ללא אלמנטים לא רלוונטיים (כוסות יין למודעת אוכל יומיומית).',
  },
  {
    id: 'no-text-leakage',
    icon: XCircle,
    title: 'ללא זליגת טקסט טכני',
    severity: 'high' as const,
    description: 'מנגנון Visual Prompt Sanitization מסנן תוויות כמו "CONTACT DETAILS", "BOTTOM-LEFT" מהפרומפטים.',
  },
  {
    id: 'logo-integrity',
    icon: Palette,
    title: 'שלמות לוגו',
    severity: 'critical' as const,
    description: 'לוגו נשלח כרפרנס ויזואלי (image_url). לא להמציא לוגו — אם אין, להשאיר ריק. מיקום: שמאל-תחתון ב-Contact Strip.',
  },
];

const AGENTS = [
  {
    id: 'super-agent',
    name: 'סוכן-על (Guardian)',
    icon: Shield,
    model: 'gemini-2.5-pro / gemini-3-flash-preview',
    provider: 'Google Direct → Gateway Fallback',
    role: 'שומר הסף של המערכת. מחזיק בקונטקסט המלא של המגזר החרדי. כל פלט חייב לעבור אישורו.',
    rules: [
      'מאמת כל תוצר מסוכנים מתמחים',
      'דוחה תוצרים שמפרים כללי צניעות',
      'שולח חזרה לתיקון מדויק',
    ],
  },
  {
    id: 'creative-agent',
    name: 'סוכן יצירתי (Creative)',
    icon: Megaphone,
    model: 'gemini-2.5-pro',
    provider: 'Google Direct → Gateway Fallback',
    role: 'אסטרטגיה, סלוגנים, קופי. מייצר קונספטים יצירתיים עם 3 כיוונים שונים.',
    rules: [
      'קריאה מלאה של הבריף (Context Window מורחב)',
      'שלושה כיוונים ויזואליים: חיבור אנושי / אובייקטים / אווירה',
      'שפה מכובדת בלבד',
    ],
  },
  {
    id: 'studio-agent',
    name: 'סוכן סטודיו (All-in-One)',
    icon: Image,
    model: 'gemini-3.1-flash-image-preview (ננו בננה 2)',
    provider: 'Lovable Gateway בלבד — ללא Fallback',
    role: 'מייצר מודעות שלמות בשכבה אחת: ויז\'ואל + טיפוגרפיה עברית + לוגו.',
    rules: [
      'All-in-One: תמונה אחת = מודעה מוגמרת',
      'גריד 3 אזורים: Headline / Hero / Contact Strip',
      'לוגו נשלח כ-image_url reference',
      'תיקונים: שליחת התמונה המקורית + פידבק ← גנרציה מחדש',
      'ללא Fallback למודלים אחרים — כשלון = שגיאה ברורה',
    ],
  },
  {
    id: 'media-agent',
    name: 'סוכן מדיה (Media)',
    icon: Radio,
    model: 'gemini-2.5-pro',
    provider: 'Google Direct → Gateway Fallback',
    role: 'תכנון מדיה, תקציבים, המלצות חבילות ואסטרטגיית פרסום.',
    rules: [
      'שימוש במאגר ערוצי המדיה מ-DB',
      'התאמה לזרם (ליטאי/חסידי/ספרדי)',
      'חישוב תקציב ו-ROI',
    ],
  },
  {
    id: 'kosher-check',
    name: 'בדיקת כשרות (Kosher Check)',
    icon: CheckCircle2,
    model: 'gemini-2.5-flash',
    provider: 'Google Direct → Gateway Fallback',
    role: 'בדיקה אוטומטית של כל תוצר ויזואלי לפני הצגה למשתמש.',
    rules: [
      'סריקת דמויות: ללא נשים, לבוש הולם',
      'סריקת טקסט: עברית תקנית, ללא זליגות',
      'סטטוס: approved / needs_review / rejected',
    ],
  },
];

const MODEL_MAP = [
  { func: 'generate-image', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'generate-creative', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'generate-branding', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'generate-slide-image', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'studio-agent', model: 'gemini-3.1-flash-image-preview', provider: 'Gateway', type: 'תמונה' },
  { func: 'creative-agent', model: 'gemini-2.5-pro', provider: 'Google Direct', type: 'טקסט' },
  { func: 'media-agent', model: 'gemini-2.5-pro', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'super-agent', model: 'gemini-2.5-pro / flash', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'generate-presentation', model: 'gemini-3-flash-preview', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'generate-internal-material', model: 'gemini-3-flash-preview', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'kosher-check', model: 'gemini-2.5-flash', provider: 'Google Direct → Fallback', type: 'ניתוח' },
  { func: 'ai-chat', model: 'gemini-2.5-flash', provider: 'Google Direct → Fallback', type: 'צ\'אט' },
];

const AgentRulesPanel = () => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'rules' | 'agents' | 'models'>('rules');

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          כללי ברזל וסוכנים
        </h2>
        <p className="text-[#888] mt-1">מפת כל ההוראות, הכללים והמודלים של מערכת ADKOP</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'rules' as const, label: 'כללי ברזל', count: IRON_RULES.length },
          { id: 'agents' as const, label: 'סוכנים', count: AGENTS.length },
          { id: 'models' as const, label: 'מפת מודלים', count: MODEL_MAP.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-[#1a1a1d] text-[#888] hover:text-white'
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
            <div key={rule.id} className="bg-[#111113] border border-[#222] rounded-xl p-4 flex items-start gap-4">
              <div className={`p-2 rounded-lg ${rule.severity === 'critical' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                <rule.icon className={`h-5 w-5 ${rule.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">{rule.title}</h3>
                  <Badge variant="outline" className={severityColors[rule.severity]}>
                    {rule.severity === 'critical' ? 'קריטי' : 'חשוב'}
                  </Badge>
                </div>
                <p className="text-[#999] text-sm mt-1">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agents */}
      {activeSection === 'agents' && (
        <div className="grid gap-4">
          {AGENTS.map(agent => (
            <div key={agent.id} className="bg-[#111113] border border-[#222] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-[#1a1a1d] transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <agent.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-semibold text-white">{agent.name}</h3>
                  <p className="text-[#888] text-xs mt-0.5">{agent.model}</p>
                </div>
                <Badge variant="outline" className="bg-[#1a1a1d] text-[#888] border-[#333] text-xs">
                  {agent.provider}
                </Badge>
                {expandedAgent === agent.id ? <ChevronUp className="h-4 w-4 text-[#666]" /> : <ChevronDown className="h-4 w-4 text-[#666]" />}
              </button>

              {expandedAgent === agent.id && (
                <div className="border-t border-[#222] p-4 space-y-3">
                  <p className="text-[#ccc] text-sm">{agent.role}</p>
                  <div>
                    <h4 className="text-xs text-[#666] font-medium mb-2">הוראות פעולה:</h4>
                    <ul className="space-y-1.5">
                      {agent.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#999]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Model Map */}
      {activeSection === 'models' && (
        <div className="bg-[#111113] border border-[#222] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] bg-[#0d0d0e]">
                <th className="text-right p-3 text-[#888] font-medium">פונקציה</th>
                <th className="text-right p-3 text-[#888] font-medium">מודל</th>
                <th className="text-right p-3 text-[#888] font-medium">ספק</th>
                <th className="text-right p-3 text-[#888] font-medium">סוג</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_MAP.map((entry, i) => (
                <tr key={i} className="border-b border-[#222] last:border-0 hover:bg-[#1a1a1d]">
                  <td className="p-3 text-white font-mono text-xs">{entry.func}</td>
                  <td className="p-3 text-[#ccc] text-xs">{entry.model}</td>
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
                        : 'bg-[#1a1a1d] text-[#888] border-[#333]'
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
