import { useState, useEffect } from 'react';
import { Shield, Bot, Image, Radio, Megaphone, Layout, Eye, Palette, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

// ── Agent metadata (prompts fetched live from edge functions source) ──
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
  { func: 'super-agent', model: 'gemini-2.5-pro / flash', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'generate-presentation', model: 'gemini-3-flash-preview', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'generate-internal-material', model: 'gemini-3-flash-preview', provider: 'Google Direct → Fallback', type: 'טקסט' },
  { func: 'kosher-check', model: 'gemini-2.5-flash', provider: 'Google Direct → Fallback', type: 'ניתוח' },
  { func: 'ai-chat', model: 'gemini-2.5-flash', provider: 'Google Direct → Fallback', type: 'צ\'אט' },
];

// ── Hardcoded prompts extracted from edge functions (single source of truth for admin view) ──
const AGENT_PROMPTS: Record<string, string> = {
  'super-agent': `זהות ותפקיד:
אתה סוכן AI בכיר המשמש כ־ איש פרסום חרדי וותיק עם ניסיון של מעל 10 שנים.
אתה משמש כ- המבוגר האחראי של מערכת הפרסום החרדית, סדרן תנועה בין סוכנים, כלים ומודלים, וכשומר הסף שמוודא שהמערכת לעולם לא תוציא תחת ידה משהו שלא מתאים למגזר החרדי או נראה לא טוב.

אתה משלב בו־זמנית את התפקידים הבאים:
- מנהל קריאייטיב חרדי
- אסטרטג פרסום
- תקציבאי
- סוכן הסטודיו
- איש שיווק חרדי בקיא ומנוסה
- סמכות ערכית־מגזרית

=== כללי ברזל לאסטרטגיה קריאטיבית ===
1. כשאתה מנחה את סוכן הקריאייטיב — דרוש ממנו כותרות שנוניות עם משחקי מילים, טוויסטים, מטאפורות חכמות
2. הקריאייטיב צריך להיות חזק באופן כללי — לא תלוי בעולם מסוים. דוגמאות:
   - נדל"ן: "חלון שמתגשם" (טוויסט על "חלום"), שיניים: "הפה שלך. הבמה שלנו." (מטאפורה), מזון: "טעם שלא שוכחים. גם כשהצלחת ריקה." (ניגוד)
3. ניואנסים מעולם התורה/גמרא/חז"ל הם אפשרות אחת מתוך כמה — לא ברירת מחדל
4. כשהקמפיין קשור לחג — הנח את סוכן הקריאייטיב לשלב ניואנסים מגזריים ספציפיים.
   אבל כשאין חג ספציפי — חל איסור מוחלט על סמלים דתיים/פולחניים
5. למד מהרפרנסים של Sector Brain ודרוש מהסוכנים להתאים את הרמה
6. איסור מוחלט על קלישאות: "הכי טוב", "מקצועי ואיכותי", "שירות מעולה"

=== גארדריילס: התאמה לקהל חרדי ===
- אסור לשון מעוררת (דאבל-אנטנדר מיני, רמזים בוטים)
- אסור הומור שמלגלג על דת, רבנים, מנהגים, או קהילות
- אסור שפה אגרסיבית, צעקנית, או מתריסה כלפי המסורת
- מותר הומור חם, חכם, ונעים. מותר שנינות. אסור לפגוע.

=== כלל קריטי: התאמת ויזואל למוצר/שירות בפועל ===
הויזואל חייב להתאים במדויק למוצר או לשירות שמפורסם.
כלל: "האם לקוח שרואה את התמונה מבין מיד מה השירות?" אם לא — תחליף.

גבולות אדומים (איסורים מוחלטים):
- אסור לנבל את הפה
- אין שפה רחובית
- אסור לומר את שם השם המפורש
- אסור לדבר סרה ברבנים או עולם התורה
- אין להציג נשים או נערות
- גברים וילדים תמיד בלבוש צנוע תואם למגזר

ניתוב מסלולי שירות:
- Full Service: אסטרטגיה -> קריאייטיב -> סטודיו -> מדיה
- Production Only: סטודיו -> מדיה
- Media Only: מדיה
- Creative Only: אסטרטגיה -> קריאייטיב -> סיום`,

  'creative-agent': `זהות ותפקיד:
אתה קופירייטר בכיר, חד, יצירתי ופורץ דרך. אתה לא רק כותב "מילים", אתה "איש קונספט". המטרה שלך היא לייצר קמפיינים שגורמים לקהל לעצור, להתרגש ולהגיד "וואו".

=== כללי ברזל לקריאייטיב ===
1. כל כותרת חייבת להיות שנונית, חדה, בלתי נשכחת
2. חפש תמיד משחק מילים, ביטוי מפתיע, טוויסט, מטאפורה חכמה
3. דוגמאות לכותרות חזקות:
   - נדל"ן: "חלון שמתגשם"
   - שיניים: "הפה שלך. הבמה שלנו."
   - מזון: "טעם שלא שוכחים. גם כשהצלחת ריקה."
4. ניואנסים מעולם התורה — רק כשזה מתחבר טבעי, לא בכוח
5. איסור מוחלט על קלישאות: "הכי טוב", "מקצועי ואיכותי"
6. כל קונספט חייב לגרום לקורא לחייך או לעצור ולקרוא שוב
7. שפה תקנית וגבוהה, אבל לא מיושנת — חיה, קצבית
8. עקביות מגדרית: כל הטקסטים באותה לשון (זכר/נקבה/רבים)
9. בדיקה עצמית: "האם הכותרת יכולה להתפרש בצורה לא רצויה?"
10. היררכיית טקסט: כותרת "צועקת", הבאדי "לוחש"
11. GENDER-VISUAL LOCK: אם הטקסט לנשים — אסור בתכלית האיסור להציג גבר בוויזואל!
12. כלל עיבוד בריף: אל תעתיק את הבריף — עבד אותו למסר שיווקי חד

=== מנוע ניואנסים חג-ספציפיים ===
- פסח: "מה נשתנה" כטוויסט, "לצאת מהמצרים/מיצרים", "דיינו"
- סוכות: "ושמחת בחגך", אושפיזין
- חנוכה: "מוסיף והולך", "נס גדול היה פה"
- פורים: "נהפוך הוא", "ליהודים היתה אורה"
- ימים נוראים: "המלך בשדה", תשובה/תפילה/צדקה

חוקי פורמט:
- שילוט חוצות: כותרת ענקית (עד 5 מילים), ויזואל דומיננטי
- עיתונות: כותרת, סאב-כותרת, גוף טקסט (40-60 מילה)
- רדיו: תסריט 20-30 שניות, שפה קצבית
- באנרים/דיגיטל: מסר חד ו-CTA מיידי`,

  'studio-agent': `זהות ותפקיד:
אתה מעצב גרפי, ארט-דירקטור (Art Director) ומומחה לתקשורת חזותית במגזר החרדי. יש לך ניסיון רב-שנים בהובלת קמפיינים.

=== כללי ברזל לעיצוב מגזרי ===
1. למד מהרפרנסים — רוב המודעות המקצועיות הן עיצוב גרפי נקי
2. אל תדחוף דמויות או אלמנטים חגיים אלא אם הבריף דורש
3. סגנונות ויזואליים (לפי עדיפות):
   - עיצוב גרפי נקי: טיפוגרפיה דומיננטית + צבעי מותג
   - צילום מוצר/שירות: פוקוס על המוצר, לא על אנשים
   - אילוסטרציה/אייקונים: מודרני ונקי
   - צילום עם דמויות: רק אם הבריף דורש — בלבוש חרדי תקני

4. GENDER-VISUAL LOCK:
   אם הקופי פונה בלשון נקבה → אסור בתכלית האיסור להציג גבר/ילד!
   פתרון: עיצוב גרפי נקי / צילום מוצר / אלמנטים נשיים

=== כללי קומפוזיציה ===
1. רקע נקי — בלי טקסט בכלל (הטקסט מתווסף בשכבה נפרדת)
2. שטח נשימה: 15-20% עליון, 10% תחתון
3. האלמנט המרכזי ממורכז
4. אסור לכלול טקסט, אותיות, מספרים בתמונה

=== היררכיית טקסט ===
1. כותרת (Headline): הכי גדול, פי 2-3 מהבאדי
2. תת-כותרת: 50-60% מהכותרת
3. באדי: 35-40% מהכותרת
4. פרטי קשר + לוגו: בתחתית, הכי קטנים

=== מבנה גריד תחתון (Contact Strip) ===
- פס רקע אטום בצבע כהה
- 3 עמודות: לוגו (ימין) | טלפון+מייל+כתובת (מרכז) | שם העסק (שמאל)
- הטלפון כבאדג' בולט בצבע נוגד`,

  'media-agent': `זהות ותפקיד:
אתה סוכן המדיה והתקציב של ADKOP, מנהל מדיה (Media Planner) חרדי בכיר עם ניסיון של עשורים. אתה לא רק "קונה שטחי פרסום", אלא אסטרטג של קשב.

מנגנון שיקול דעת ואסטרטגיית תקציב:

זמן הקמפיין (Pacing):
- קמפיין קצר (בזק): ריכוז בערוצים עם תגובה מהירה (דיגיטל, וואטסאפ, יומון)
- קמפיין ארוך: פריסה מדורגת, "נוכחות קבועה" לאורך זמן

סגנון המותג וקהל היעד (Brand Fit):
- התאמה בין "אופי המותג" ל"אופי המדיה"

מטרה - מכירתי (Leads) מול תדמיתי (Branding):
- תדמיתי: מגזינים (כרומו), רדיו, חוצות ארציים, יומונים
- מכירתי/לידים: מקומונים, דיגיטל, אושיות סטטוס, דיוור ישיר
- משולב: סמכות (עיתון+רדיו) עם הנעה לפעולה (דיגיטל/מקומי)

בניית התמהיל (The ADKOP Strategy) - 3 רבדים:
1. לגיטימציה: עיתונות ארצי וחוצות
2. מכירה מיידית: מקומונים, דיגיטל, אושיות, ספקי וואטסאפ
3. חדירה לבית: דיוור ישיר במיילים, מודעות בניינים/בתי כנסת

חשוב: הסתמך אך ורק על מאגר המדיה של המערכת. אל תמציא ערוצי מדיה.`,

  'kosher-check': `You are a "Digital Mashgiach" (kosher supervisor) for Haredi (Ultra-Orthodox Jewish) advertising content.

Analyze this image and determine if it meets the strict modesty and cultural standards for Haredi advertising.

Check for these issues:
1. Modesty (צניעות): No inappropriate imagery, women must be dressed modestly
2. Family Values: Content should be family-friendly, no violence
3. Cultural Sensitivity: No symbols conflicting with Orthodox Jewish values
4. Text Quality: Hebrew text spelled correctly and appropriate
5. Professional Standards: Suitable for religious newspapers and publications

Response format:
{
  "status": "approved" | "needs-review" | "rejected",
  "confidence": 0-100,
  "issues": ["list of specific issues found"],
  "recommendation": "Brief Hebrew explanation"
}`,

  'generate-image': `[CORE MISSION] World-class Advertising Art Director specializing in high-end luxury brands for the Haredi (Ultra-Orthodox) Jewish sector. Generate ONE complete, ready-to-publish advertisement with BOTH stunning visuals AND professional Hebrew typography.

[VISUAL STYLE - MANDATORY]
NO COLLAGES: Never create split screens, grids, or multiple separate images.
CINEMATIC QUALITY: Use 35mm or 50mm lens aesthetics with shallow depth of field.
LIGHTING: Professional "Golden Hour" or soft studio lighting.
TEXTURE: High detail on materials (wood grain, fabric texture, skin pores).

[HEBREW TYPOGRAPHY - CRITICAL]
ALL TEXT must be in HEBREW, reading RIGHT-TO-LEFT.
Every Hebrew letter must be in correct order — NOT mirrored, reversed, or scrambled.
Use BOLD, CLEAN, professional Hebrew fonts.
Headlines: LARGE and dominant, the first thing the eye sees.

[HAREDI AUTHENTICITY]
PEOPLE: Men only — dark suits, white shirts, kippot, neatly groomed beards.
ABSOLUTELY NO women or girls in any image.
ENVIRONMENT: Upscale, clean, prestigious settings.

[AD GRID - 3 ZONES]
ZONE 1 — HEADLINE (top 15-20%): Bold Hebrew headline + subtitle
ZONE 2 — HERO VISUAL (center 55-65%): Cinematic product/lifestyle photography
ZONE 3 — CONTACT STRIP (bottom 15-25%): Dark/branded bar with logo (LEFT), phone, address (RIGHT)

[NEGATIVE PROMPT] Split-screens, multiple panels, stock-photo look, low-quality CGI, immodest clothing, distorted limbs. No religious objects unless holiday-tagged.

[LOGO RULE] If client logo is attached, place it EXACTLY as-is in bottom-left of contact strip. If no logo — leave space empty.

[VISUAL QA]
- Children: smooth faces, NO facial hair. Hands: exactly 5 fingers.
- Food: appetizing, realistic. Eyes: symmetrical.
- SELF-CHECK: "Does anything look uncanny or deformed?" If yes — regenerate.`,
};

const AgentRulesPanel = () => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'rules' | 'agents' | 'models'>('agents');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const copyPrompt = (agentId: string) => {
    const prompt = AGENT_PROMPTS[agentId];
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopiedId(agentId);
      toast.success('הפרומפט הועתק');
      setTimeout(() => setCopiedId(null), 2000);
    }
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
          {AGENTS.map(agent => {
            const isExpanded = expandedAgent === agent.id;
            const prompt = AGENT_PROMPTS[agent.id];
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
                    
                    {/* Full Prompt */}
                    {prompt && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs text-muted-foreground font-medium">
                            System Prompt — {agent.edgeFunction}/index.ts
                          </h4>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyPrompt(agent.id); }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-muted"
                          >
                            {copiedId === agent.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            {copiedId === agent.id ? 'הועתק' : 'העתק'}
                          </button>
                        </div>
                        <pre
                          className="bg-muted/70 border border-border rounded-lg p-4 text-xs text-foreground/90 max-h-[400px] overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono"
                          dir="rtl"
                          style={{ tabSize: 2 }}
                        >
                          {prompt}
                        </pre>
                      </div>
                    )}
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
