import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdkopWizardData, CreativeResult, MediaBudgetItem } from '@/types/adkop';
import { toast } from 'sonner';

const fetchSectorBrainData = async (topicCategory?: string) => {
  try {
    // Fetch domain-relevant examples first (up to 50)
    let domainExamples: any[] = [];
    if (topicCategory) {
      const { data } = await supabase
        .from('sector_brain_examples')
        .select('name, zone, description, text_content, stream_type, gender_audience, topic_category, holiday_season, media_type, example_type, file_path')
        .eq('topic_category', topicCategory)
        .limit(50);
      domainExamples = data || [];
    }

    // Fetch general examples (no topic_category or different ones)
    const generalQuery = supabase
      .from('sector_brain_examples')
      .select('name, zone, description, text_content, stream_type, gender_audience, topic_category, holiday_season, media_type, example_type, file_path')
      .limit(50);
    
    if (topicCategory) {
      generalQuery.or(`topic_category.is.null,topic_category.neq.${topicCategory}`);
    }
    
    const { data: generalData, error } = await generalQuery;
    if (error) {
      console.error('Failed to fetch sector brain data:', error);
      return null;
    }

    const generalExamples = generalData || [];
    const allExamples = [...domainExamples, ...generalExamples];
    
    if (allExamples.length === 0) return null;

    // Group by zone
    const grouped: Record<string, typeof allExamples> = {};
    for (const item of allExamples) {
      const zone = item.zone || 'general';
      if (!grouped[zone]) grouped[zone] = [];
      grouped[zone].push(item);
    }

    return {
      total_examples: allExamples.length,
      domain_specific_count: domainExamples.length,
      domain_topic: topicCategory || null,
      zones: grouped,
      summary: Object.entries(grouped).map(([zone, items]) => 
        `${zone}: ${items.length} דוגמאות`
      ).join(', '),
    };
  } catch (err) {
    console.error('Sector brain fetch error:', err);
    return null;
  }
};

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

חשוב מאוד:
1. התיאור הויזואלי צריך להיות מפורט מספיק כדי לשמש כפרומפט לייצור תמונה (סגנון, צבעים, אובייקטים, קומפוזיציה, אווירה).
2. השתמש ברפרנסים מה-Sector Brain שצורפו. תעדיף במיוחד את הרפרנסים שמסומנים כרלוונטיים לתחום הזה (domain_specific), אבל השתמש גם ברפרנסים הכלליים כדי ללמוד סגנון וטון.
3. אם יש רפרנסים מסוג "red_lines" — אל תלך בכיוון שלהם, הם דוגמאות למה שאסור.

החזר JSON עם 3 אופציות בפורמט:
\`\`\`json
{
  "creative_options": [
    {
      "concept_type": "rational",
      "headline": "כותרת",
      "body_text": "גוף טקסט",
      "cta": "קריאה לפעולה",
      "visual_description": "תיאור ויזואלי מפורט לייצור תמונה",
      "reference_used": "שם הרפרנס שהשפיע על הקונספט (אם יש)"
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

      // Detect topic category from product description
      const productText = (mri.productFunction + ' ' + mri.painProblem).toLowerCase();
      const topicMap: Record<string, string[]> = {
        'real_estate': ['דירה', 'נדל"ן', 'דיור', 'בנייה', 'פרויקט', 'דירות'],
        'food': ['אוכל', 'מזון', 'מסעדה', 'קייטרינג', 'מאפה', 'בשר', 'עוף'],
        'beauty': ['יופי', 'קוסמטיקה', 'טיפוח', 'שיער', 'פאה'],
        'health': ['בריאות', 'רפואה', 'רופא', 'טיפול', 'תרופה'],
        'womens_fashion': ['אופנה', 'שמלה', 'בגד', 'ביגוד נשים'],
        'mens_fashion': ['חליפה', 'חולצה', 'כובע', 'ביגוד גברים'],
        'kids_fashion': ['ילדים', 'תינוק', 'בגדי ילדים'],
        'jewelry': ['תכשיט', 'טבעת', 'שרשרת', 'זהב'],
        'electronics': ['אלקטרוניקה', 'מחשב', 'טלפון'],
        'events': ['אירוע', 'חתונה', 'שמחה', 'אולם'],
      };
      let detectedTopic: string | undefined;
      for (const [topic, keywords] of Object.entries(topicMap)) {
        if (keywords.some(kw => productText.includes(kw))) {
          detectedTopic = topic;
          break;
        }
      }

      // Fetch sector brain references, prioritizing domain-relevant ones
      const sectorBrainData = await fetchSectorBrainData(detectedTopic);

      const { data, error } = await supabase.functions.invoke('creative-agent', {
        body: { message, campaignContext, brandContext, sectorBrainData, topicCategory: detectedTopic },
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
