import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdkopWizardData, CreativeResult, MediaBudgetItem } from '@/types/adkop';
import { toast } from 'sonner';

interface AgentState {
  isGeneratingCreatives: boolean;
  isGeneratingMedia: boolean;
  creativeError: string | null;
  mediaError: string | null;
}

export const useAdkopAgents = () => {
  const [agentState, setAgentState] = useState<AgentState>({
    isGeneratingCreatives: false,
    isGeneratingMedia: false,
    creativeError: null,
    mediaError: null,
  });

  const generateCreatives = async (wizardData: AdkopWizardData): Promise<CreativeResult[]> => {
    setAgentState(s => ({ ...s, isGeneratingCreatives: true, creativeError: null }));

    try {
      const { mri, campaign, brand } = wizardData;

      const message = `צור 3 קונספטים קריאטיביים לקמפיין — כל אחד מסוג שונה:

1. **שכלית (rational)** — מודעה מבוססת עובדות, יתרונות מוצר, נתונים, הוכחה חברתית. טון רציני ומקצועי.
2. **רגשית/הומוריסטית (emotional)** — מודעה שנוגעת בלב, מעוררת חיוך או התרגשות. טון חם, אנושי, אולי הומוריסטי.
3. **מפתיעה/שנונה (creative)** — מודעה עם טוויסט, אנגל לא צפוי, קריאייטיבית ובלתי נשכחת. טון חד, מפתיע.

מוצר: ${mri.productFunction}
כאב: ${mri.painProblem}
רגש מטרה: ${mri.targetEmotion || 'לא נבחר'}
קהל יעד: ${mri.targetAudience.join(', ') || 'כללי'}
רמת שמרנות: ${mri.conservatismLevel}/10
מבנה קמפיין: ${campaign.campaignStructure || 'לא נבחר'}
תזמון: ${campaign.timing}
ערוצי מדיה: ${campaign.mediaChannels.join(', ') || 'לא נבחרו'}

חשוב: התיאור הויזואלי צריך להיות מפורט מספיק כדי לשמש כפרומפט לייצור תמונה (סגנון, צבעים, אובייקטים, קומפוזיציה, אווירה).

החזר JSON עם 3 אופציות בפורמט:
\`\`\`json
{
  "creative_options": [
    {
      "concept_type": "rational",
      "headline": "כותרת",
      "body_text": "גוף טקסט",
      "cta": "קריאה לפעולה",
      "visual_description": "תיאור ויזואלי מפורט לייצור תמונה"
    }
  ]
}
\`\`\``;

      const campaignContext = {
        goal: mri.productFunction,
        vibe: mri.targetEmotion,
        structure: campaign.campaignStructure,
        timing: campaign.timing,
        mediaTypes: campaign.mediaChannels,
      };

      const brandContext: Record<string, unknown> = {};
      if (brand.extractedColors.length > 0) {
        brandContext.primaryColor = brand.extractedColors[0];
        brandContext.secondaryColor = brand.extractedColors[1];
      }

      const { data, error } = await supabase.functions.invoke('creative-agent', {
        body: { message, campaignContext, brandContext },
      });

      if (error) throw error;

      // Parse creative options from AI response
      const creatives: CreativeResult[] = [];
      const systemCommand = data?.systemCommand;

      if (systemCommand?.creative_options) {
        const typeOrder = ['rational', 'emotional', 'creative'];
        systemCommand.creative_options.forEach((opt: any, i: number) => {
          creatives.push({
            id: String(i + 1),
            headline: opt.headline || '',
            bodyText: opt.body_text || '',
            cta: opt.cta || '',
            imageUrl: '',
            visualLogic: opt.visual_description || opt.concept_logic || '',
          });
        });
      }

      // Fallback: try to parse from response text if systemCommand didn't work
      if (creatives.length === 0 && data?.response) {
        const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            const options = parsed.creative_options || parsed.options || [];
            options.forEach((opt: any, i: number) => {
              creatives.push({
                id: String(i + 1),
                headline: opt.headline || '',
                bodyText: opt.body_text || '',
                cta: opt.cta || '',
                imageUrl: '',
                visualLogic: opt.visual_description || '',
              });
            });
          } catch { /* ignore parse errors */ }
        }
      }

      if (creatives.length === 0) {
        throw new Error('AI לא החזיר תוצרים קריאטיביים תקינים');
      }

      toast.success(`${creatives.length} קונספטים נוצרו בהצלחה!`);
      return creatives;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה ביצירת קריאייטיב';
      setAgentState(s => ({ ...s, creativeError: errorMsg }));
      toast.error(errorMsg);
      return [];
    } finally {
      setAgentState(s => ({ ...s, isGeneratingCreatives: false }));
    }
  };

  const generateMediaPlan = async (wizardData: AdkopWizardData): Promise<MediaBudgetItem[]> => {
    setAgentState(s => ({ ...s, isGeneratingMedia: true, mediaError: null }));

    try {
      const { mri, campaign } = wizardData;

      const message = `בנה תמהיל מדיה לקמפיין.
מוצר: ${mri.productFunction}
קהל יעד: ${mri.targetAudience.join(', ') || 'כללי'}
רמת שמרנות: ${mri.conservatismLevel}/10
מבנה: ${campaign.campaignStructure || 'לא נבחר'}
תזמון: ${campaign.timing}
ערוצי מדיה מבוקשים: ${campaign.mediaChannels.join(', ') || 'כל הערוצים'}

החזר JSON עם תמהיל מדיה:
\`\`\`json
{
  "media_plan": [
    {
      "outlet_name": "שם הערוץ",
      "price": 1000,
      "rationale": "הסבר"
    }
  ],
  "total_budget": 10000
}
\`\`\``;

      const { data, error } = await supabase.functions.invoke('media-agent', {
        body: {
          message,
          targetStream: mri.conservatismLevel >= 7 ? 'חסידי' : mri.conservatismLevel >= 5 ? 'ליטאי' : 'כללי',
          targetGender: mri.targetAudience.includes('women') ? 'נשים' : mri.targetAudience.includes('men') ? 'גברים' : 'מעורב',
          campaignGoal: mri.productFunction,
        },
      });

      if (error) throw error;

      const items: MediaBudgetItem[] = [];
      const systemCommand = data?.systemCommand;

      if (systemCommand?.media_plan) {
        systemCommand.media_plan.forEach((item: any) => {
          items.push({
            channel: item.outlet_name || item.media_name || '',
            reachReasoning: item.rationale || '',
            estimatedPrice: `₪${item.price?.toLocaleString() || '0'}`,
          });
        });
      }

      // Fallback parsing
      if (items.length === 0 && data?.response) {
        const jsonMatch = data.response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            const plan = parsed.media_plan || [];
            plan.forEach((item: any) => {
              items.push({
                channel: item.outlet_name || '',
                reachReasoning: item.rationale || '',
                estimatedPrice: `₪${item.price?.toLocaleString() || '0'}`,
              });
            });
          } catch { /* ignore */ }
        }
      }

      if (items.length === 0) {
        throw new Error('AI לא החזיר תמהיל מדיה תקין');
      }

      toast.success(`תמהיל מדיה עם ${items.length} ערוצים נוצר!`);
      return items;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה ביצירת תמהיל מדיה';
      setAgentState(s => ({ ...s, mediaError: errorMsg }));
      toast.error(errorMsg);
      return [];
    } finally {
      setAgentState(s => ({ ...s, isGeneratingMedia: false }));
    }
  };

  return {
    agentState,
    generateCreatives,
    generateMediaPlan,
  };
};
