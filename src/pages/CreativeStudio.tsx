import { useState, useEffect, useCallback } from 'react';

import confetti from 'canvas-confetti';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Wand2, Shield, ChevronLeft, ChevronRight, Sparkles, Loader2, ImageIcon, Type, RefreshCw, MessageSquare, CheckCircle2, X, PenTool, Pencil, Plus, FileDown, ZoomIn, Move, Radio, Newspaper, Monitor, Mail, Check, Send, Heading1, Heading2, LayoutGrid, Circle, ShieldCheck, Volume2, Play, Pause, Mic } from 'lucide-react';
import { isPdfUrl, pdfToImage } from '@/lib/pdf-utils';
import { matchTemplateFromAnalysis, buildLayoutInstructions } from '@/lib/template-matcher';
import { exportToPrintPdf, exportMultiPagePdf } from '@/lib/print-export';
import { AgentPipelineDebug, AgentStep, AgentStepStatus } from '@/components/studio/AgentPipelineDebug';
import { AIChatWidget } from '@/components/chat/AIChatWidget';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StudioAssetStep } from '@/components/studio/StudioAssetStep';
import { StudioTreatmentStep } from '@/components/studio/StudioTreatmentStep';
import { StudioStyleStep, StyleChoice } from '@/components/studio/StudioStyleStep';
import { StudioPromptStep, AspectRatio } from '@/components/studio/StudioPromptStep';
import { StudioModeToggle, StudioMode, CampaignScope } from '@/components/studio/StudioModeToggle';
import { StudioProductPicker, ProductScope } from '@/components/studio/StudioProductPicker';
import { StudioAutopilot, CreativeConcept, HolidaySeason, HOLIDAY_LABELS } from '@/components/studio/StudioAutopilot';
import { StudioQuoteStep, QuoteData, MediaItem } from '@/components/studio/StudioQuoteStep';
import { StudioBriefStep, CampaignBrief, CampaignStructure } from '@/components/studio/StudioBriefStep';
import { StudioMediaTypeStep, MediaType } from '@/components/studio/StudioMediaTypeStep';
import { StudioDesignApproachStep, DesignApproach, PastMaterialReference } from '@/components/studio/StudioDesignApproachStep';
import { StudioCopyStep, CopyChoice } from '@/components/studio/StudioCopyStep';
import { RadioScriptStep } from '@/components/studio/RadioScriptStep';
import { ComponentFeedbackPicker, AD_COMPONENTS, type AdComponent } from '@/components/studio/ComponentFeedbackPicker';
import { cn } from '@/lib/utils';
import { BudgetAudienceStep } from '@/components/campaign/BudgetAudienceStep';
import { TextOverlayEditor } from '@/components/studio/TextOverlayEditor';
import { InlineTextEditor, TextMeta } from '@/components/studio/InlineTextEditor';
import { PrintExportDialog, PrintSettings } from '@/components/studio/PrintExportDialog';
import { FormatAdaptation } from '@/components/studio/FormatAdaptation';
import { ImageEditor } from '@/components/studio/ImageEditor';
import { ClientLoadingTimer } from '@/components/studio/ClientLoadingTimer';
import { ClientResultsView } from '@/components/studio/ClientResultsView';
import CampaignHistoryStrip from '@/components/studio/CampaignHistoryStrip';
import { useIsAdmin } from '@/hooks/useIsAdmin';
// LayoutShowcase removed — master template only
import type { AdaptedCreative } from '@/lib/image-resize';

type AssetChoice = 'full-campaign' | 'has-visual' | 'has-copy';
type TreatmentChoice = 'as-is' | 'ai-magic';
type FeedbackMode = 'none' | 'another-round' | 'small-fixes';
type FeedbackType = 'copy' | 'visual' | null;

interface GeneratedImage {
  id: string;
  url: string;
  status: 'approved' | 'needs-review' | 'rejected' | 'pending';
  analysis?: string;
  visualOnlyUrl?: string;
  model?: string;
  seriesIndex?: number; // 0-based series number (for series campaigns)
  adIndex?: number; // 0-based ad number within a series
  textMeta?: {
    headline: string;
    subtitle?: string;
    bodyText?: string;
    ctaText?: string;
    businessName: string;
    phone: string;
    servicesList?: string[];
    promoText?: string;
    promoValue?: string;
  };
}

interface ClientProfile {
  id?: string;
  business_name: string;
  target_audience: string | null;
  end_consumer: string | null;
  decision_maker: string | null;
  primary_x_factor: string | null;
  winning_feature: string | null;
  advantage_type: string | null;
  x_factors: string[] | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  contact_address: string | null;
  contact_youtube: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  // Brand colors
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  header_font: string | null;
  body_font: string | null;
  logo_url: string | null;
  past_materials: any[] | null;
  past_materials_fonts: any[] | null;
  business_photos: any[] | null;
  default_template_id: string | null;
  // Full identity card fields
  services: string[] | null;
  competitors: string[] | null;
  audience_tone: string | null;
  brand_presence: string | null;
  personal_red_lines: string[] | null;
  successful_campaigns: string[] | null;
  quality_signatures: any[] | null;
  honorific_preference: string | null;
  website_url: string | null;
  branches: string | null;
  opening_hours: string | null;
}

interface CustomTemplate {
  id: string;
  name: string;
  html_template: string;
}

interface MediaPackage {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  items: {
    id: string;
    name: string;
    price: number;
    reach?: string;
  }[];
  recommended?: boolean;
}

// Dynamic step titles based on media type selection
// Dynamic step titles based on media type selection and asset choice
const getStepTitles = (mediaTypes: MediaType[], assetChoice: string | null) => {
  // Determine the display name based on selected media type
  let mediaLabel = 'קריאייטיב';
  if (mediaTypes.length === 1) {
    switch (mediaTypes[0]) {
      case 'banner': mediaLabel = 'באנר'; break;
      case 'ad': mediaLabel = 'מודעה'; break;
      case 'radio': mediaLabel = 'ספוט רדיו'; break;
      case 'email': mediaLabel = 'מייל'; break;
      case 'whatsapp': mediaLabel = 'וואטסאפ'; break;
      case 'article': mediaLabel = 'כתבה'; break;
      case 'all': mediaLabel = 'קמפיין 360°'; break;
    }
  } else if (mediaTypes.length > 1) {
    mediaLabel = 'קריאייטיבים';
  }

  // Dynamic step 3 title based on asset choice
  let uploadStepTitle = 'העלאת תמונה';
  if (assetChoice === 'full-campaign') {
    uploadStepTitle = 'העלאת קמפיין';
  } else if (assetChoice === 'has-visual') {
    uploadStepTitle = 'העלאת ויז\'ואל';
  }
  
  return [
    'בריף קמפיין',      // 0
    'סוג מדיה',         // 1
    'מה יש לך מוכן?',   // 2 - asset choice
    uploadStepTitle,    // 3 - upload
    'קופי',             // 4 - copy input (for has-copy flow)
    'סגנון עיצובי',     // 5 - style
    'תיאור ותוכן',      // 6 - prompt
    '',                 // 7 - design approach
    'סטודיו רדיו',      // 8 - radio script
  ];
};

// Success Screen Component with Confetti
const SuccessScreen = ({ onReset }: { onReset: () => void }) => {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#E31E24', '#ff4d4d', '#c41920']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#E31E24', '#ff4d4d', '#c41920']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 max-w-lg mx-auto text-center">
      <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-8 animate-scale-in">
        <CheckCircle2 className="h-12 w-12 text-success" />
      </div>
      <h2 className="text-3xl font-bold mb-4">ההזמנה נשלחה בהצלחה!</h2>
      <p className="text-lg text-muted-foreground mb-2">
        ההזמנה ופרטי המשתמש נשלחו למייל שלך
      </p>
      <p className="text-muted-foreground mb-8">
        אפשר לעקוב אחרי סטטוס הקמפיין בכל עת באזור האישי
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={onReset}>
          יצירת קמפיין חדש
        </Button>
        <Button asChild>
          <Link to="/dashboard">
            לאזור האישי
          </Link>
        </Button>
      </div>
    </div>
  );
};

// Topic category detection from campaign text
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'real_estate': ['דירה', 'נדל"ן', 'דיור', 'בנייה', 'פרויקט', 'דירות', 'שכירות', 'משכנתא'],
  'food': ['אוכל', 'מזון', 'מסעדה', 'קייטרינג', 'מאפה', 'בשר', 'עוף', 'בישול', 'מתכון', 'אלכוהול', 'יין', 'יינות', 'וויסקי', 'וודקה', 'ליקר', 'ליקרים', 'בירה', 'בירות', 'משקאות'],
  'beauty': ['יופי', 'קוסמטיקה', 'טיפוח', 'איפור'],
  'health': ['בריאות', 'רפואה', 'רופא', 'טיפול', 'תרופה', 'רפואי'],
  'education': ['חינוך', 'לימוד', 'ישיבה', 'סמינר', 'בית ספר', 'קורס', 'חוג'],
  'womens_fashion': ['אופנה נשים', 'שמלה', 'בגד נשים', 'ביגוד נשים'],
  'wigs': ['פאה', 'פאות', 'שיער', 'wig', 'פאה טבעית', 'תוספות שיער'],
  'mens_fashion': ['חליפה', 'חולצה', 'כובע', 'ביגוד גברים'],
  'kids_fashion': ['ילדים', 'תינוק', 'בגדי ילדים'],
  'jewelry': ['תכשיט', 'טבעת', 'שרשרת', 'זהב', 'יהלום'],
  'electronics': ['אלקטרוניקה', 'מחשב', 'טלפון', 'סלולר'],
  'events': ['אירוע', 'חתונה', 'שמחה', 'אולם', 'בר מצווה'],
  'furniture': ['רהיט', 'מטבח', 'ספה', 'ארון', 'ריהוט'],
  'hotels': ['מלון', 'צימר', 'נופש', 'חופשה', 'בין הזמנים'],
  'finance': ['ביטוח', 'פיננסי', 'הלוואה', 'השקעה', 'בנק'],
  'judaica': ['ספרי קודש', 'תשמישי קדושה', 'יודאיקה', 'מזוזה', 'תפילין'],
  'toys': ['צעצוע', 'משחק', 'בובה'],
  'branding': ['מיתוג', 'לוגו', 'זהות מותגית', 'שפה עיצובית', 'brand'],
};

function detectTopicCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return topic;
  }
  return null;
}

function sanitizeVisualPrompt(prompt: string, stripHolidayTerms: boolean = false): string {
  const base = (prompt || '')
    .replace(/\[(?:Visual\s*approach|Design\s*approach)[^\]]*\]/gi, '')
    .replace(/\b(CONTACT\s*DETAILS(?:\s*DARK)?|BOTTOM-LEFT|TOP-RIGHT|BRANCH\s*LOCATIONS?|PHONE\s*NUMBERS?|LOGO\s*ZONE)\b/gi, '')
    .replace(/\s{2,}/g, ' ');

  if (!stripHolidayTerms) return base.trim();

  return base
    .replace(/(פסח|חמץ|מצה|מצות|קערת\s*סדר|סדר\s*פסח|בדיקת\s*חמץ|ביעור\s*חמץ|הכשרת\s*כלים|לולב|אתרוג|שופר|חנוכיה|מנורה|סביבון|מגילה|משלוחי\s*מנות|hamantaschen|menorah|chanukiah|dreidel|seder|matzah|shofar)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const CreativeStudio = () => {
  const [searchParams] = useSearchParams();
  const { isAdmin } = useIsAdmin();
  
  // Client profile state
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  
  // Mode state - check URL param for direct access
  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState<StudioMode>(null);
  const [detectedIndustry, setDetectedIndustry] = useState<string | null>(null);
  
  // Detect industry from client profile or brief text for nudges
  useEffect(() => {
    const textToScan = [
      clientProfile?.business_name,
      clientProfile?.target_audience,
      clientProfile?.primary_x_factor,
      clientProfile?.winning_feature,
    ].filter(Boolean).join(' ');
    if (textToScan) {
      const detected = detectTopicCategory(textToScan);
      setDetectedIndustry(detected);
    }
  }, [clientProfile]);
  
  const handleProductPickerComplete = (selectedMediaTypes: MediaType[], scope: ProductScope) => {
    setMediaTypes(selectedMediaTypes);
    
    const isAll = selectedMediaTypes.includes('all');
    const isOnlyRadio = selectedMediaTypes.length === 1 && selectedMediaTypes[0] === 'radio';
    const isArticleOnly = selectedMediaTypes.length === 1 && selectedMediaTypes[0] === 'article';
    const isEmailOnly = selectedMediaTypes.length === 1 && selectedMediaTypes[0] === 'email';
    const isWhatsappOnly = selectedMediaTypes.length === 1 && selectedMediaTypes[0] === 'whatsapp';
    const isVisualMedia = selectedMediaTypes.some(t => ['ad', 'banner'].includes(t));
    
    if (scope === 'copy-only') {
      // Has visual, needs copy
      setMode('manual');
      setAssetChoice('has-visual');
    } else if (scope === 'visual-only') {
      // Has copy, needs visual
      setMode('manual');
      setAssetChoice('has-copy');
    } else if (isAll) {
      // 360° campaign → autopilot
      setMode('autopilot');
      setAssetChoice(null);
    } else if (isArticleOnly && scope === 'full') {
      // Article only → show sub-type selector (text-only vs designed)
      setMode('manual');
      setAssetChoice(null);
      setArticleSubType(null);
    } else if (isEmailOnly && scope === 'full') {
      // Email only → show sub-type selector (text-only vs with-design)
      setMode('manual');
      setAssetChoice(null);
      setEmailSubType(null);
    } else if (isWhatsappOnly && scope === 'full') {
      // WhatsApp only → show sub-type selector, then autopilot
      setMode('autopilot');
      setAssetChoice(null);
      setWhatsappSubType(null); // Will be selected in-flow
    } else if (isVisualMedia && scope === 'full') {
      // Ad/Banner full → autopilot
      setMode('autopilot');
      setAssetChoice(null);
    } else {
      // Radio, Article, or text-have-script → manual wizard (brief first)
      setMode('manual');
      setAssetChoice(null);
    }
  };
  
  const handleModeSelect = (selectedMode: StudioMode) => {
    setMode(selectedMode);
  };
  
  const handleScopeSelect = (scope: CampaignScope) => {
    // Handled via handleProductPickerComplete
  };
  
  // Track if we should skip to asset step (for upload mode)
  const [initializedFromUrl, setInitializedFromUrl] = useState(false);
  
  // Feedback state
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('none');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [pendingCorrections, setPendingCorrections] = useState<Array<{type: string; text: string}>>([]);
  const [selectedSketchIds, setSelectedSketchIds] = useState<string[]>([]);
  const [approvedSketchId, setApprovedSketchId] = useState<string | null>(null);
  const [showApproveSelection, setShowApproveSelection] = useState(false);
  
  // Autopilot state
  const [concepts, setConcepts] = useState<CreativeConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<CreativeConcept | null>(null);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief>({
    title: '',
    offer: '',
    goal: null,
    structure: null,
    contactSelection: {
      phone: false,
      whatsapp: false,
      email: false,
      address: false,
      youtube: false,
      facebook: false,
      instagram: false,
      logoOnly: false,
      customText: '',
      openingHours: false,
      selectedBranches: [],
    },
    colorSelection: {
      mode: 'continue-past',
      primaryColor: null,
      secondaryColor: null,
      backgroundColor: null,
    },
    adGoal: null,
    showPriceOrBenefit: null,
    priceOrBenefit: '',
    isTimeLimited: null,
    timeLimitText: '',
    emotionalTone: null,
    desiredAction: null,
    desiredActions: [],
  });
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [assetChoice, setAssetChoice] = useState<AssetChoice | null>(null);
  const [treatment, setTreatment] = useState<TreatmentChoice | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [style, setStyle] = useState<StyleChoice | null>(null);
  const [designApproach, setDesignApproach] = useState<DesignApproach | null>(null);
  const [designReference, setDesignReference] = useState<PastMaterialReference | null>(null);
  const [copyChoice, setCopyChoice] = useState<CopyChoice | null>(null);
  const [userCopyText, setUserCopyText] = useState('');
  const [visualPrompt, setVisualPrompt] = useState('');
  const [textPrompt, setTextPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('square');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showMediaSelection, setShowMediaSelection] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<GeneratedImage | null>(null);
  const [enlargedFeedbackOpen, setEnlargedFeedbackOpen] = useState(false);
  const [enlargedFeedbackSelections, setEnlargedFeedbackSelections] = useState<Set<AdComponent>>(new Set());
  const [enlargedFeedbackTexts, setEnlargedFeedbackTexts] = useState<Record<string, string>>({});
  const [overlayEditImage, setOverlayEditImage] = useState<{ id: string; url: string } | null>(null);
  const [fabricEditImage, setFabricEditImage] = useState<{ id: string; url: string } | null>(null);
  const [printDialogImage, setPrintDialogImage] = useState<GeneratedImage | null>(null);
  const [printDialogMode, setPrintDialogMode] = useState<'single' | 'all'>('single');
  const [showFormatAdaptation, setShowFormatAdaptation] = useState(false);
  const [adaptedCreatives, setAdaptedCreatives] = useState<AdaptedCreative[]>([]);
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>([]);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showAutopilotRadio, setShowAutopilotRadio] = useState(false);
  const [autopilotRadioScript, setAutopilotRadioScript] = useState<{ title: string; script: string; duration?: string; voiceNotes?: string } | null>(null);
  const [isGeneratingRadio, setIsGeneratingRadio] = useState(false);
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [radioAudioUrl, setRadioAudioUrl] = useState<string | null>(null);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);
  const [radioAudioRef] = useState<{ current: HTMLAudioElement | null }>({ current: null });
  const [showAutopilotArticle, setShowAutopilotArticle] = useState(false);
  const [autopilotArticle, setAutopilotArticle] = useState<{ headline: string; subheadline: string; body: string; pullQuote: string; callToAction: string; imageDirections?: { section: string; description: string }[] } | null>(null);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [showAutopilotBanner, setShowAutopilotBanner] = useState(false);
  const [autopilotBannerUrl, setAutopilotBannerUrl] = useState<string | null>(null);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [autopilotEmailContent, setAutopilotEmailContent] = useState<{ subject: string; body: string; cta: string; imageHeadline?: string; imageSubtext?: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [showAutopilotEmail, setShowAutopilotEmail] = useState(false);
  const [autopilotWhatsappContent, setAutopilotWhatsappContent] = useState<{ message: string; imageHeadline?: string; imageSubtext?: string } | null>(null);
  const [isGeneratingWhatsapp, setIsGeneratingWhatsapp] = useState(false);
  const [showAutopilotWhatsapp, setShowAutopilotWhatsapp] = useState(false);
  const [whatsappSubType, setWhatsappSubType] = useState<'status' | 'distribution' | null>(null);
  const [emailSubType, setEmailSubType] = useState<'text-only' | 'with-design' | null>(null);
  const [articleSubType, setArticleSubType] = useState<'text-only' | 'with-design' | null>(null);
  // Editing states for 360° platform results
  const [editingRadio, setEditingRadio] = useState(false);
  const [editingArticle, setEditingArticle] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);
  const [fixRequestPlatform, setFixRequestPlatform] = useState<'radio' | 'article' | 'email' | 'whatsapp' | null>(null);
  const [platformFixText, setPlatformFixText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  // Media selection state
  const [mediaBudget, setMediaBudget] = useState<number>(0);
  const [mediaStartDate, setMediaStartDate] = useState<Date | undefined>();
  const [mediaEndDate, setMediaEndDate] = useState<Date | undefined>();
  const [mediaTargetStream, setMediaTargetStream] = useState<string>('');
  const [mediaTargetGender, setMediaTargetGender] = useState<string>('');
  const [mediaTargetCity, setMediaTargetCity] = useState<string>('nationwide');
  const [selectedMediaPackage, setSelectedMediaPackage] = useState<MediaPackage | null>(null);
  
  // Holiday/Season selection for creative
  const [selectedHoliday, setSelectedHoliday] = useState<HolidaySeason>('year_round');
  
  // Text layout style — always 'custom' (Master Template only)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [activeCustomTemplate, setActiveCustomTemplate] = useState<CustomTemplate | null>(null);

  // Engine version selection
  const [engineVersion, setEngineVersion] = useState<'nano-banana-pro' | 'nano-banana'>('nano-banana-pro');

  // Draft campaign tracking
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);

  // Auto-save campaign as draft after generation completes
  const saveCampaignDraft = async (results: GeneratedImage[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clientProfile) return;

      const campaignPayload = {
        user_id: user.id,
        client_profile_id: clientProfile.id,
        name: campaignBrief.title || `קמפיין ${new Date().toLocaleDateString('he-IL')}`,
        status: 'draft',
        vibe: style,
        goal: campaignBrief.goal || visualPrompt,
        creatives: results.map(img => ({
          id: img.id,
          url: img.url,
          status: img.status,
        })) as unknown as import('@/integrations/supabase/types').Json,
      };

      if (draftCampaignId) {
        // Update existing draft
        await supabase.from('campaigns').update(campaignPayload).eq('id', draftCampaignId);
      } else {
        // Create new draft
        const { data, error } = await supabase.from('campaigns').insert(campaignPayload).select('id').single();
        if (!error && data) {
          setDraftCampaignId(data.id);
        }
      }
      toast.success('הקמפיין נשמר בתיק האישי שלך 📁');
    } catch (err) {
      console.error('Failed to save campaign draft:', err);
    }
  };

  // Auto-set aspect ratio based on media type
  useEffect(() => {
    if (mediaTypes.length === 1) {
      switch (mediaTypes[0]) {
        case 'ad': setAspectRatio('portrait'); break;
        case 'banner': setAspectRatio('landscape'); break;
        case 'email': setAspectRatio('portrait'); break;
        case 'whatsapp': setAspectRatio(whatsappSubType === 'status' ? 'portrait' : 'square'); break;
        default: break;
      }
    } else if (mediaTypes.includes('ad') && !mediaTypes.includes('banner')) {
      setAspectRatio('portrait');
    } else if (mediaTypes.includes('banner') && !mediaTypes.includes('ad')) {
      setAspectRatio('landscape');
    }
  }, [mediaTypes, whatsappSubType]);

  // Scroll to top when changing views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, showResults, showMediaSelection, showQuote, showSuccess]);

  // Handle URL mode parameter - skip to asset step for "upload" mode
  useEffect(() => {
    if (urlMode === 'upload' && !initializedFromUrl) {
      setInitializedFromUrl(true);
      // Skip directly to asset step (step 2)
      setCurrentStep(2);
    }
  }, [urlMode, initializedFromUrl]);

  // Load campaign brief from session storage (from FastTrackWizard)
  useEffect(() => {
    // Don't load from session if we're in upload mode
    if (urlMode === 'upload') return;
    
    const savedBrief = sessionStorage.getItem('campaignBrief');
    if (savedBrief) {
      try {
        const briefData = JSON.parse(savedBrief);
        
        // Load full guided brief if available (from FastTrackWizard)
        if (briefData.guidedBrief) {
          const gb = briefData.guidedBrief;
          setCampaignBrief(prev => ({
            ...prev,
            title: gb.title || briefData.campaignName || '',
            offer: gb.offer || briefData.campaignOffer || '',
            goal: gb.goal || briefData.goal || null,
            structure: gb.structure || null,
            adGoal: gb.adGoal || null,
            showPriceOrBenefit: gb.showPriceOrBenefit ?? null,
            priceOrBenefit: gb.priceOrBenefit || '',
            isTimeLimited: gb.isTimeLimited ?? null,
            timeLimitText: gb.timeLimitText || '',
            emotionalTone: gb.emotionalTone || null,
            desiredAction: gb.desiredActions?.[0] || gb.desiredAction || null,
            desiredActions: gb.desiredActions || (gb.desiredAction ? [gb.desiredAction] : []),
            contactSelection: gb.contactSelection || prev.contactSelection,
            colorSelection: gb.colorSelection || prev.colorSelection,
          }));
        } else {
          setCampaignBrief(prev => ({
            ...prev,
            title: briefData.campaignName || '',
            offer: briefData.campaignOffer || '',
            goal: briefData.goal || null,
          }));
        }
        // If brief is pre-filled, auto-enter autopilot mode (goal already selected)
        if (briefData.campaignOffer && briefData.goal) {
          setMode('autopilot');
        }
        // Clear the session storage after loading
        sessionStorage.removeItem('campaignBrief');
      } catch (e) {
        console.error('Failed to parse campaign brief from session storage:', e);
      }
    }
  }, [urlMode]);

  // Fetch client profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profiles } = await supabase
        .from('client_profiles')
        .select('id, business_name, target_audience, end_consumer, decision_maker, primary_x_factor, winning_feature, advantage_type, x_factors, contact_phone, contact_whatsapp, contact_email, contact_address, contact_youtube, social_facebook, social_instagram, primary_color, secondary_color, background_color, header_font, body_font, logo_url, past_materials, past_materials_fonts, business_photos, default_template_id, services, competitors, audience_tone, brand_presence, personal_red_lines, successful_campaigns, quality_signatures, honorific_preference, website_url, branches, opening_hours')
        .eq('user_id', user.id)
        .eq('is_agency_profile', false)
        .eq('onboarding_completed', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      const profile = profiles?.[0] || null;
      
      if (profile) {
        console.log('[Studio] Loaded client profile:', {
          business: profile.business_name,
          primaryColor: profile.primary_color,
          secondaryColor: profile.secondary_color,
          logoUrl: profile.logo_url ? 'YES' : 'NO',
        });
      } else {
        console.warn('[Studio] No completed client profile found for user');
      }

      if (profile) {
        setClientProfile({
          ...profile,
          past_materials: Array.isArray(profile.past_materials) ? profile.past_materials : [],
          past_materials_fonts: Array.isArray(profile.past_materials_fonts) ? profile.past_materials_fonts : [],
          business_photos: Array.isArray(profile.business_photos) ? profile.business_photos : [],
          quality_signatures: Array.isArray(profile.quality_signatures) ? profile.quality_signatures : [],
        } as ClientProfile);
      }
    };

    fetchProfile();
  }, []);

  // Fetch available custom templates + auto-select client's default
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('ad_layout_templates')
        .select('id, name, html_template')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setCustomTemplates(data as CustomTemplate[]);
        
        // Auto-select: client's default template first
        if (clientProfile?.default_template_id) {
          const defaultTpl = data.find(t => t.id === clientProfile.default_template_id);
          if (defaultTpl) {
            setActiveCustomTemplate(defaultTpl as CustomTemplate);
            return;
          }
        }
        
        // Smart match: analyze past_materials and pick the best template
        const pastAnalyses = (clientProfile?.past_materials as any[])
          ?.filter((m: any) => m.adAnalysis)
          ?.map((m: any) => m.adAnalysis) || [];
        
        if (pastAnalyses.length > 0) {
          const match = matchTemplateFromAnalysis(data as CustomTemplate[], pastAnalyses);
          if (match) {
            const matched = data.find(t => t.id === match.templateId);
            if (matched) {
              setActiveCustomTemplate(matched as CustomTemplate);
              console.log(`[Studio] 🎯 Auto-matched template "${match.templateName}" (${match.confidence}% confidence):`, match.reasons);
              return;
            }
          }
        }
        
        // Fallback: first available
        if (!activeCustomTemplate) {
          setActiveCustomTemplate(data[0] as CustomTemplate);
        }
      }
    };
    fetchTemplates();
  }, [clientProfile?.default_template_id]);

  // Template auto-refresh: subscribe to DB changes (realtime)
  useEffect(() => {
    const channel = supabase
      .channel('template-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ad_layout_templates',
      }, async () => {
        // Clear overlay cache
        const { clearTemplateCache } = await import('@/lib/html-text-overlay');
        clearTemplateCache();
        // Re-fetch templates
        const { data } = await supabase
          .from('ad_layout_templates')
          .select('id, name, html_template')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setCustomTemplates(data as CustomTemplate[]);
          if (activeCustomTemplate) {
            const updated = data.find(t => t.id === activeCustomTemplate.id);
            if (updated) setActiveCustomTemplate(updated as CustomTemplate);
          }
        }
        toast.info('תבנית עודכנה — שימוש בגרסה החדשה');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeCustomTemplate?.id]);

  const getSteps = () => {
    // Media type is now selected before entering the wizard, so step 1 (MediaType) is removed
    // Steps: 0=Brief, 3=Treatment/Upload, 4=Copy, 5=Style, 6=Prompt, 7=DesignApproach, 8=Radio
    const isOnlyRadio = mediaTypes.length === 1 && mediaTypes[0] === 'radio';
    const isArticleOnly = mediaTypes.length === 1 && mediaTypes[0] === 'article';
    const isEmailOnly = mediaTypes.length === 1 && mediaTypes[0] === 'email';
    const isWhatsappOnly = mediaTypes.length === 1 && mediaTypes[0] === 'whatsapp';
    
    if (isOnlyRadio) {
      return [0, 8]; // Brief, Radio Script
    }
    if (isArticleOnly) {
      return [0]; // Brief only (sub-type selector is inline)
    }
    if (isEmailOnly) {
      return [0]; // Brief only (sub-type selector is inline)
    }
    if (isWhatsappOnly) {
      return [0]; // Brief only (sub-type selector is inline), then autopilot generates
    }
    if (assetChoice === 'full-campaign') {
      return [0, 3]; // Brief, Upload
    }
    if (assetChoice === 'has-visual') {
      return [0, 3]; // Brief, Upload image
    }
    if (assetChoice === 'has-copy') {
      return [0, 4, 7, 5, 6]; // Brief, Copy, DesignApproach, Style, Prompt
    }
    // Default for autopilot (full) with visual media
    return [0]; // Brief only, then autopilot generates
  };

  // Check if this is the final step that should trigger generation/submission
  const isFinalStep = () => {
    const currentSteps = getSteps();
    const lastStep = currentSteps[currentSteps.length - 1];
    return currentStep === lastStep;
  };

  const steps = getSteps();
  const actualStepIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length;

  const canProceed = () => {
    switch (currentStep) {
      case 0: {
        // Validate guided brief: need adGoal, emotionalTone, desiredAction, core message (12+ words)
        const offer = campaignBrief.offer.trim();
        const words = offer.split(/\s+/).filter(w => w.length > 0);
        const hasValidOffer = words.length >= 12 && /[\u0590-\u05FFa-zA-Z]{2,}/.test(offer);
        
        const isTextOnlyFlow = mediaTypes.length > 0 && mediaTypes.every(t => ['radio'].includes(t));
        const isArticleFlow = mediaTypes.length === 1 && mediaTypes[0] === 'article';
        const isEmailFlow = mediaTypes.length === 1 && mediaTypes[0] === 'email';
        const isWhatsappFlow = mediaTypes.length === 1 && mediaTypes[0] === 'whatsapp';
        
        if (isWhatsappFlow) {
          return !!whatsappSubType && !!campaignBrief.adGoal && !!campaignBrief.emotionalTone && campaignBrief.desiredActions.length > 0 && hasValidOffer;
        }
        if (isEmailFlow) {
          return !!emailSubType && !!campaignBrief.adGoal && !!campaignBrief.emotionalTone && campaignBrief.desiredActions.length > 0 && hasValidOffer;
        }
        if (isArticleFlow) {
          return !!articleSubType && !!campaignBrief.adGoal && !!campaignBrief.emotionalTone && campaignBrief.desiredActions.length > 0 && hasValidOffer;
        }
        if (isTextOnlyFlow) {
          return !!campaignBrief.adGoal && !!campaignBrief.emotionalTone && campaignBrief.desiredActions.length > 0 && hasValidOffer;
        }
        
        // Visual media: full validation
        const cs = campaignBrief.contactSelection;
        const hasContactSelected = cs.phone || cs.whatsapp || cs.email || cs.address || cs.youtube || cs.facebook || cs.instagram || cs.logoOnly || cs.openingHours || (cs.selectedBranches || []).length > 0;
        return !!campaignBrief.adGoal && !!campaignBrief.emotionalTone && campaignBrief.desiredActions.length > 0 && hasValidOffer && campaignBrief.structure !== null && hasContactSelected;
      }
      case 1: return mediaTypes.length > 0;
      case 2: return assetChoice !== null;
      case 3: 
        // Upload step - requirements differ by flow type
        if (assetChoice === 'full-campaign') {
          // Full campaign needs both visual upload and copy text (or can be optional?)
          return uploadedImage !== null;
        }
        if (assetChoice === 'has-visual') {
          // Has visual - just needs image upload
          return uploadedImage !== null;
        }
        // Default (shouldn't reach for has-copy since it skips this step)
        return uploadedImage !== null && treatment !== null;
      case 4: 
        // Copy step - only for has-copy flow
        return copyChoice !== null && (copyChoice === 'generate-copy' || userCopyText.trim().length > 0);
      case 5: return style !== null;
      case 6: return visualPrompt.trim().length > 0;
      case 7: return designApproach !== null;
      case 8: return true; // Radio step manages its own flow
      default: return false;
    }
  };

  const explainBlockedNext = () => {
    if (currentStep === 0) {
      const missing: string[] = [];
      if (!campaignBrief.adGoal) missing.push('מטרת המודעה');
      if (!campaignBrief.emotionalTone) missing.push('טון רגשי');
      if (campaignBrief.desiredActions.length === 0) missing.push('פעולה רצויה');
      const offer = campaignBrief.offer.trim();
      const words = offer.split(/\s+/).filter(w => w.length > 0);
      if (!offer) {
        missing.push('הבשורה המרכזית');
      } else if (words.length < 12) {
        missing.push(`הבשורה המרכזית (צריך לפחות 12 מילים, כרגע ${words.length})`);
      }
      if (!campaignBrief.structure) missing.push('מבנה הקמפיין');
      return missing.length ? `כדי להמשיך צריך למלא: ${missing.join(' + ')}` : null;
    }

    if (currentStep === 1) return 'כדי להמשיך צריך לבחור סוג מדיה';
    if (currentStep === 2) return 'כדי להמשיך צריך לבחור סוג נכס';
    if (currentStep === 3) {
      if (assetChoice === 'full-campaign' || assetChoice === 'has-visual') {
        return 'כדי להמשיך צריך להעלות תמונה';
      }
      return 'כדי להמשיך צריך להעלות תמונה ולבחור עיבוד';
    }
    if (currentStep === 4) return copyChoice === 'has-copy' && !userCopyText.trim() ? 'כדי להמשיך צריך להזין את הטקסט למודעה' : 'כדי להמשיך צריך לבחור אם יש לך קופי או לא';
    if (currentStep === 5) return 'כדי להמשיך צריך לבחור סגנון';
    if (currentStep === 6) return 'כדי להמשיך צריך למלא תיאור/תוכן';
    if (currentStep === 7) return 'כדי להמשיך צריך לבחור גישה עיצובית';
    return null;
  };

  const handleNextAttempt = () => {
    if (canProceed()) {
      handleNext();
      return;
    }

    const msg = explainBlockedNext();
    toast.error(msg || 'חסרים פרטים כדי להמשיך');

    // Guide user to the relevant field
    if (currentStep === 0) {
      if (!campaignBrief.offer.trim()) {
        document.getElementById('campaign-offer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (!campaignBrief.structure) {
        document.getElementById('campaign-structure')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  };

  const handleNext = () => {
    // Normal progression using steps array
    if (actualStepIndex < totalSteps - 1) {
      setCurrentStep(steps[actualStepIndex + 1]);
    }
  };

  const handleBack = () => {
    // Normal back progression using steps array
    if (actualStepIndex > 0) {
      setCurrentStep(steps[actualStepIndex - 1]);
    } else {
      // On first step, go back to product picker
      setMode(null);
      setAssetChoice(null);
      setMediaTypes([]);
    }
  };

  // Determine which AI model to use based on selections
  const getEngineConfig = () => {
    if (assetChoice === 'has-copy') {
      // User has copy, needs visual - full generation
      return { engine: 'nano-banana', mode: 'generate' };
    }
    if (assetChoice === 'full-campaign' || treatment === 'as-is') {
      // Simple layout engine (Canva-like) for full campaigns
      return { engine: 'layout', mode: 'compose' };
    }
    // AI Magic - Inpainting for has-visual
    return { engine: 'flux-realism', mode: 'inpaint' };
  };

  const runKosherCheck = async (imageUrl: string): Promise<{ status: string; recommendation: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('kosher-check', {
        body: { imageUrl }
      });

      if (error) {
        console.error('Kosher check error:', error);
        return { status: 'needs-review', recommendation: 'לא ניתן לבצע בדיקה אוטומטית' };
      }

      return {
        status: data.status || 'needs-review',
        recommendation: data.recommendation || ''
      };
    } catch (error) {
      console.error('Kosher check failed:', error);
      return { status: 'needs-review', recommendation: 'שגיאה בבדיקת כשרות' };
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedImages([]);
    setShowResults(true);
    
    const config = getEngineConfig();
    toast.info('מייצר את העיצובים שלך... 🎨');

    try {
      const results: GeneratedImage[] = [];
      
      // Generate 4 variations
      const brandContext = buildBrandContext();
      const effectiveColors = brandContext?.colors || {
        primary: clientProfile?.primary_color || null,
        secondary: clientProfile?.secondary_color || null,
        background: clientProfile?.background_color || null,
      };
      const isHolidayNeutral = !selectedHoliday || selectedHoliday === 'year_round';
      const sanitizedVisualPrompt = sanitizeVisualPrompt(visualPrompt, isHolidayNeutral);

      // Resolve PDF logo to PNG if needed
      const resolvedLogo = await getResolvedLogoUrl();
      if (resolvedLogo && brandContext) {
        (brandContext as any).logoUrl = resolvedLogo;
      } else if (clientProfile?.logo_url && brandContext) {
        (brandContext as any).logoUrl = clientProfile.logo_url;
      }

      // Build campaign context — includes new guided brief fields for AI
      const campaignContext = {
        title: campaignBrief.title,
        offer: campaignBrief.offer,
        goal: campaignBrief.goal,
        structure: campaignBrief.structure,
        contactInfo: campaignBrief.contactSelection,
        campaignImageUrl: campaignBrief.campaignImage || null,
        // New guided brief data
        adGoal: campaignBrief.adGoal,
        emotionalTone: campaignBrief.emotionalTone,
        desiredAction: campaignBrief.desiredAction,
        desiredActions: (campaignBrief as any).desiredActions || (campaignBrief.desiredAction ? [campaignBrief.desiredAction] : []),
        priceOrBenefit: campaignBrief.showPriceOrBenefit ? campaignBrief.priceOrBenefit : null,
        isTimeLimited: campaignBrief.isTimeLimited,
        timeLimitText: campaignBrief.isTimeLimited ? campaignBrief.timeLimitText : null,
      };

      // Headline position variety: distribute across sketches
      const headlinePositions = ['top', 'bottom', 'top', 'center'];
      
      // Series mode: 2 series × 3 ads = 6 images
      // Normal mode: 4 variations
      const isSeries = campaignBrief.structure === 'series';
      const totalImages = isSeries ? 6 : 4;
      
      for (let i = 0; i < totalImages; i++) {
        const seriesIndex = isSeries ? Math.floor(i / 3) : undefined;
        const adIndex = isSeries ? (i % 3) : undefined;
        const label = isSeries 
          ? `סדרה ${seriesIndex! + 1} — מודעה ${adIndex! + 1}`
          : `סקיצה ${i + 1} מתוך ${totalImages}`;
        toast.info(`מייצר ${label}...`);
        
        const detectedTopic = detectTopicCategory(campaignBrief.offer + ' ' + campaignBrief.title);
        
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: {
            visualPrompt: sanitizedVisualPrompt || visualPrompt,
            textPrompt: textPrompt || null,
            style: style || 'ultra-realistic',
            engine: engineVersion,
            templateId: selectedTemplate?.id || null,
            templateHints: selectedTemplate?.promptHints || null,
            dimensions: selectedTemplate?.dimensions || null,
            brandContext,
            campaignContext: {
              ...campaignContext,
              ...(isSeries ? {
                seriesIndex,
                adIndex,
                seriesTotal: 2,
                adsPerSeries: 3,
                seriesInstruction: seriesIndex === 0
                  ? 'זוהי סדרה 1. צור קונספט אחיד ל-3 מודעות עם אותו סגנון ויזואלי, אותה שפה עיצובית, ואותה כותרת-על — אבל כל מודעה מדגישה זווית אחרת של המוצר/שירות.'
                  : 'זוהי סדרה 2. צור קונספט שונה לחלוטין מסדרה 1 — כיוון קריאטיבי חדש, סגנון ויזואלי שונה, שפה שונה. שמור על עקביות בתוך הסדרה.',
              } : {}),
            },
            mediaType: mediaTypes[0] || null,
            topicCategory: detectedTopic,
            holidaySeason: selectedHoliday || null,
            aspectRatio,
            designApproach: designApproach || (brandContext as any)?.designApproach || null,
            corrections: pendingCorrections.length > 0 ? pendingCorrections : undefined,
            variationIndex: i,
            headlinePosition: headlinePositions[i % headlinePositions.length],
          }
        });

        if (error) {
          console.error('Error generating image:', error);
          continue;
        }

        if (data?.imageUrl) {
          // All-in-One: the AI generates the complete ad with text, logo, and layout
          // No programmatic overlay needed — use the image directly
          const finalUrl = data.imageUrl;
          console.log(`[Studio] All-in-One sketch ${i} ready. Model: ${data.model}`);

          const newImage: GeneratedImage = {
            id: `${Date.now()}-${i}`,
            url: finalUrl,
            status: 'pending',
            visualOnlyUrl: data.visualOnlyUrl || data.imageUrl,
            textMeta: data.textMeta || undefined,
            model: data.model || undefined,
            seriesIndex,
            adIndex,
          };
          
          results.push(newImage);
          setGeneratedImages([...results]);

          // Run kosher check
          toast.info(`מריץ בדיקת כשרות לסקיצה ${i + 1}... 🔍`);
          const kosherResult = await runKosherCheck(data.imageUrl);
          
          newImage.status = kosherResult.status as GeneratedImage['status'];
          newImage.analysis = kosherResult.recommendation;
          setGeneratedImages([...results]);

          // Save to database
          await supabase.from('generated_images').insert({
            visual_prompt: visualPrompt,
            text_prompt: textPrompt,
            style,
            engine: config.engine,
            image_url: data.imageUrl,
            kosher_status: kosherResult.status,
            kosher_analysis: kosherResult.recommendation,
          });

          // Auto-retry if rejected OR needs-review with specific issues
          const hasSpecificIssues = kosherResult.recommendation && 
            kosherResult.recommendation.length > 20 && 
            kosherResult.status !== 'approved';
          
          if (kosherResult.status === 'rejected' || (kosherResult.status === 'needs-review' && hasSpecificIssues)) {
            const isRejected = kosherResult.status === 'rejected';
            let retrySuccess = false;
            const maxRetries = isRejected ? 2 : 1;
            for (let retry = 0; retry < maxRetries && !retrySuccess; retry++) {
              toast.info(isRejected 
                ? `סקיצה ${i + 1} נדחתה, מייצר חלופה (ניסיון ${retry + 1})... 🔄`
                : `מתקן סקיצה ${i + 1} לפי הערות הבדיקה... 🔧`
              );
              const corrections = isRejected
                ? [`הסקיצה הקודמת נדחתה: ${kosherResult.recommendation}. יש להימנע מהבעיה הזו.`]
                : [`נמצאו הערות בבדיקה שחייבות תיקון: ${kosherResult.recommendation}. תקן את הבעיות האלו בדיוק תוך שמירה על שאר העיצוב.`];
              const retryData = await supabase.functions.invoke('generate-image', {
                body: {
                  visualPrompt: sanitizedVisualPrompt || visualPrompt,
                  textPrompt: textPrompt || null,
                  style: style || 'ultra-realistic',
                  engine: engineVersion,
                  templateId: selectedTemplate?.id || null,
                  templateHints: selectedTemplate?.promptHints || null,
                  dimensions: selectedTemplate?.dimensions || null,
                  brandContext,
                  campaignContext,
                  topicCategory: detectTopicCategory(campaignBrief.offer + ' ' + campaignBrief.title),
                  holidaySeason: selectedHoliday || null,
                  aspectRatio,
                  designApproach: designApproach || null,
                  corrections,
                  variationIndex: i + 10 + retry,
                  headlinePosition: headlinePositions[i],
                }
              });
              if (retryData.error || !retryData.data?.imageUrl) continue;

              const retryFinalUrl = retryData.data.imageUrl;

              const retryKosher = await runKosherCheck(retryData.data.imageUrl);
              if (retryKosher.status !== 'rejected') {
                newImage.url = retryFinalUrl;
                newImage.status = retryKosher.status as GeneratedImage['status'];
                newImage.analysis = retryKosher.recommendation;
                newImage.visualOnlyUrl = retryData.data.visualOnlyUrl || retryData.data.imageUrl;
                newImage.textMeta = retryData.data.textMeta || undefined;
                setGeneratedImages([...results]);
                toast.success(`סקיצה ${i + 1} ${isRejected ? 'הוחלפה' : 'תוקנה'} בהצלחה! ✅`);
                retrySuccess = true;

                await supabase.from('generated_images').insert({
                  visual_prompt: visualPrompt,
                  text_prompt: textPrompt,
                  style,
                  engine: config.engine,
                  image_url: retryData.data.imageUrl,
                  kosher_status: retryKosher.status,
                  kosher_analysis: retryKosher.recommendation,
                });
              }
            }
          }
        }
      }

      if (results.length > 0) {
        const approved = results.filter(r => r.status === 'approved').length;
        const needsReview = results.filter(r => r.status === 'needs-review').length;
        const rejected = results.filter(r => r.status === 'rejected').length;
        
        if (approved > 0) toast.success(`${approved} סקיצות אושרו! בסייעתא דשמיא`);
        if (needsReview > 0) toast.warning(`${needsReview} סקיצות דורשות בדיקה אנושית`);
        if (rejected > 0) toast.error(`${rejected} סקיצות נדחו ע"י המשגיח הדיגיטלי`);
        
        // Auto-save campaign as draft
        await saveCampaignDraft(results);
      } else {
        toast.error('לא הצלחנו ליצור תמונות. נסה שוב.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה ביצירת התמונות');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: GeneratedImage['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">מאושר ✓</Badge>;
      case 'needs-review':
        return <Badge className="bg-warning text-warning-foreground">דורש בדיקה ⚠️</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-destructive-foreground">נדחה ✗</Badge>;
      case 'pending':
        return <Badge className="bg-muted text-muted-foreground animate-pulse">בודק... 🔍</Badge>;
      default:
        return null;
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setCampaignBrief({
      title: '',
      offer: '',
      goal: null,
      structure: null,
      contactSelection: {
        phone: false,
        whatsapp: false,
        email: false,
        address: false,
        youtube: false,
        facebook: false,
        instagram: false,
        logoOnly: false,
        customText: '',
        openingHours: false,
        selectedBranches: [],
      },
      colorSelection: {
        mode: 'continue-past',
        primaryColor: null,
        secondaryColor: null,
        backgroundColor: null,
      },
      adGoal: null,
      showPriceOrBenefit: null,
      priceOrBenefit: '',
      isTimeLimited: null,
      timeLimitText: '',
      emotionalTone: null,
      desiredAction: null,
      desiredActions: [],
    });
    setMediaTypes([]);
    setAssetChoice(null);
    setTreatment(null);
    setUploadedImage(null);
    setStyle(null);
    setVisualPrompt('');
    setTextPrompt('');
    setAspectRatio('square');
    // textLayoutStyle is always 'custom' — no reset needed
    setGeneratedImages([]);
    setDraftCampaignId(null);
    setShowResults(false);
    setShowQuote(false);
    setShowSuccess(false);
    setConcepts([]);
    setSelectedConcept(null);
    setFeedbackType(null);
    setShowFormatAdaptation(false);
    setAdaptedCreatives([]);
    setShowAutopilotRadio(false);
    setShowAutopilotArticle(false);
    setShowAutopilotBanner(false);
    setShowAutopilotEmail(false);
    setShowAutopilotWhatsapp(false);
    setWhatsappSubType(null);
    setEmailSubType(null);
    setArticleSubType(null);
    setAutopilotRadioScript(null);
    setRadioAudioUrl(null);
    setIsPlayingRadio(false);
    if (radioAudioRef.current) { radioAudioRef.current.pause(); radioAudioRef.current = null; }
    setAutopilotArticle(null);
    setAutopilotBannerUrl(null);
    setAutopilotEmailContent(null);
    setAutopilotWhatsappContent(null);
  };

  // Generate TTS voiceover from autopilot radio script
  const handleGenerateRadioTts = async () => {
    if (!autopilotRadioScript?.script) return;
    setIsGeneratingTts(true);
    setRadioAudioUrl(null);
    try {
      const voiceDirection = {
        gender: mediaTargetGender === 'women' ? 'נשי' : 'גברי',
        style: 'חם ומזמין',
        tone: 'אנרגטי',
        pace: 'בינוני',
      };
      const { data: ttsResult, error } = await supabase.functions.invoke('generate-radio-tts', {
        body: {
          script: autopilotRadioScript.script,
          voiceDirection,
          clientProfileId: clientProfile?.id,
          scriptTitle: autopilotRadioScript.title,
        },
      });
      if (error) throw error;
      if (ttsResult?.audioAvailable && ttsResult?.audioBase64) {
        const audioUrl = `data:${ttsResult.mimeType || 'audio/mp3'};base64,${ttsResult.audioBase64}`;
        setRadioAudioUrl(audioUrl);
        toast.success('הקריינות מוכנה! 🎙️');
      } else {
        toast.info(ttsResult?.message || 'קריינות אינה זמינה כרגע');
      }
    } catch (err: any) {
      console.error('TTS error:', err);
      toast.error(err.message || 'שגיאה ביצירת קריינות');
    } finally {
      setIsGeneratingTts(false);
    }
  };

  const toggleRadioPlayback = () => {
    if (!radioAudioUrl) return;
    if (!radioAudioRef.current) {
      radioAudioRef.current = new Audio(radioAudioUrl);
      radioAudioRef.current.onended = () => setIsPlayingRadio(false);
    }
    if (isPlayingRadio) {
      radioAudioRef.current.pause();
      setIsPlayingRadio(false);
    } else {
      radioAudioRef.current.play();
      setIsPlayingRadio(true);
    }
  };

  // Handle platform-specific fix requests in 360° mode
  const handlePlatformFix = async (platform: 'radio' | 'article' | 'email' | 'whatsapp') => {
    if (!platformFixText.trim()) return;
    setIsRegenerating(platform);
    setFixRequestPlatform(null);
    const fixInstruction = platformFixText.trim();
    setPlatformFixText('');
    const concept = selectedConcept;
    const offer = campaignBrief.offer || '';
    
    const profileData = clientProfile ? {
      businessName: clientProfile.business_name,
      phone: clientProfile.contact_phone,
      email: clientProfile.contact_email,
      address: clientProfile.contact_address,
      website: clientProfile.website_url,
      xFactors: clientProfile.x_factors,
      targetAudience: clientProfile.target_audience,
      winningFeature: clientProfile.winning_feature,
    } : {};

    try {
      if (platform === 'radio') {
        const { data, error } = await supabase.functions.invoke('generate-radio-script', {
          body: {
            brief: { offer, adGoal: campaignBrief.adGoal, goal: campaignBrief.goal },
            brandContext: clientProfile ? { businessName: clientProfile.business_name, targetAudience: clientProfile.target_audience } : null,
            fixInstruction,
            fixType: 'message',
            originalScript: autopilotRadioScript?.script || '',
          },
        });
        if (!error && data?.scripts?.length) {
          const bestScript = data.scripts[0];
          setAutopilotRadioScript({
            title: bestScript.title || 'ספוט רדיו',
            script: bestScript.scriptWithNikud || bestScript.script || '',
            duration: bestScript.duration,
            voiceNotes: bestScript.voiceNotes,
          });
          toast.success('התשדיר עודכן! 🎙️');
        } else { toast.error('שגיאה בעדכון התשדיר'); }
      } else {
        const typeMap: Record<string, string> = { article: 'article', email: 'email', whatsapp: 'whatsapp' };
        const topicKey = platform === 'article' ? 'articleTopic' : platform === 'email' ? 'emailTopic' : 'whatsappTopic';
        const { data, error } = await supabase.functions.invoke('generate-internal-material', {
          body: {
            type: typeMap[platform],
            profileData,
            extraContext: {
              [topicKey]: offer || concept?.idea || '',
              userPrompt: `תיקון מבוקש: ${fixInstruction}${concept ? `\nקונספט: ${concept.headline} — ${concept.copy}` : ''}`,
              ...(platform === 'article' ? { articleStyle: 'product', targetLength: 'medium' } : {}),
            },
          },
        });
        if (!error && data?.result) {
          if (platform === 'article') { setAutopilotArticle(data.result); toast.success('הכתבה עודכנה! 📰'); }
          else if (platform === 'email') { setAutopilotEmailContent(data.result); toast.success('המייל עודכן! 📧'); }
          else { setAutopilotWhatsappContent(data.result); toast.success('המסר עודכן! 💬'); }
        } else { toast.error('שגיאה בעדכון'); }
      }
    } catch { toast.error('שגיאה בעדכון'); }
    finally { setIsRegenerating(null); }
  };



  const getQuoteData = (): QuoteData => {
    const creativeMode: QuoteData['creativeMode'] = 
      mode === 'autopilot' ? 'autopilot' : 
      assetChoice === 'full-campaign' ? 'uploaded' : 'manual';
    
    const creativeCost = creativeMode === 'uploaded' ? 0 : 500;
    
    // Use selected package items if available, otherwise use defaults
    const mediaItems: MediaItem[] = selectedMediaPackage 
      ? selectedMediaPackage.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
        }))
      : [
          { id: '1', name: 'יתד נאמן - יום שלישי', price: 15000 },
          { id: '2', name: 'כיכר השבת - באנר ראשי', price: 500 },
        ];
    
    return {
      mediaItems,
      creativeMode,
      creativeCost,
    };
  };

  // Feedback handlers
  const handleSubmitFeedback = async (componentFeedbacks?: { component: AdComponent; text: string; fileUrl?: string }[]) => {
    // Support both legacy (single textarea) and new component-level feedback
    const corrections: { type: string; text: string; fileUrl?: string }[] = [];

    if (componentFeedbacks && componentFeedbacks.length > 0) {
      // New component-level feedback
      for (const fb of componentFeedbacks) {
        corrections.push({ type: fb.component, text: fb.text, ...(fb.fileUrl ? { fileUrl: fb.fileUrl } : {}) });
      }
    } else if (feedbackText.trim()) {
      // Legacy single textarea
      corrections.push({ type: feedbackType || 'general', text: feedbackText.trim() });
    } else {
      toast.error('נא להזין פירוט');
      return;
    }
    const targetSketchIds = selectedSketchIds.length > 0 ? [...selectedSketchIds] : [];
    const isTargetedFixFlow = feedbackMode === 'small-fixes' && targetSketchIds.length > 0;
    
    // Save corrections as pending creative rules
    try {
      const targetInfo = targetSketchIds.length > 0 
        ? `(סקיצות: ${targetSketchIds.join(', ')})` 
        : '(כל הסקיצות)';
      
      for (const corr of corrections) {
        const correctionContent = `[תיקון ${corr.type}] ${corr.text} ${targetInfo}`;
        await supabase.from('sector_brain_insights').insert({
          insight_type: 'creative_correction',
          content: correctionContent,
          is_active: false,
        });
      }
    } catch (e) {
      console.warn('Failed to save correction as insight:', e);
    }
    
    const partCount = corrections.length;
    toast.info(`מייצר סקיצות מתוקנות (${partCount} ${partCount === 1 ? 'תיקון' : 'תיקונים'})... 🎨`);
    
    // Reset feedback UI
    setFeedbackMode('none');
    setFeedbackText('');
    setFeedbackType(null);
    setSelectedSketchIds([]);

    if (isTargetedFixFlow) {
      const targetImages = generatedImages.filter(
        (img) => targetSketchIds.includes(img.id) && img.status !== 'rejected'
      );

      if (targetImages.length === 0) {
        toast.error('לא נמצאו סקיצות פעילות לתיקון');
        return;
      }

      setIsGenerating(true);

      try {
        const brandContext = buildBrandContext();
        const resolvedLogo = await getResolvedLogoUrl();
        if (resolvedLogo && brandContext) {
          (brandContext as any).logoUrl = resolvedLogo;
        } else if (clientProfile?.logo_url && brandContext) {
          (brandContext as any).logoUrl = clientProfile.logo_url;
        }

        const campaignContext = {
          title: campaignBrief.title,
          offer: campaignBrief.offer,
          goal: campaignBrief.goal,
          structure: campaignBrief.structure,
          contactInfo: campaignBrief.contactSelection,
          campaignImageUrl: campaignBrief.campaignImage || null,
          adGoal: campaignBrief.adGoal,
          emotionalTone: campaignBrief.emotionalTone,
          desiredAction: campaignBrief.desiredAction,
          desiredActions: (campaignBrief as any).desiredActions || (campaignBrief.desiredAction ? [campaignBrief.desiredAction] : []),
          priceOrBenefit: campaignBrief.showPriceOrBenefit ? campaignBrief.priceOrBenefit : null,
          isTimeLimited: campaignBrief.isTimeLimited,
          timeLimitText: campaignBrief.isTimeLimited ? campaignBrief.timeLimitText : null,
        };

        const detectedTopic = detectTopicCategory(campaignBrief.offer + ' ' + campaignBrief.title);
        const isHolidayNeutral = !selectedHoliday || selectedHoliday === 'year_round';
        const sanitizedVisualPrompt = sanitizeVisualPrompt(visualPrompt, isHolidayNeutral);

        toast.info(`מתקן ${targetImages.length} סקיצה${targetImages.length > 1 ? 'ות' : ''} ממוקדות... 🎯`);

        const patchResults = await Promise.all(
          targetImages.map(async (img) => {
            const { data, error } = await supabase.functions.invoke('generate-image', {
              body: {
                visualPrompt: sanitizedVisualPrompt || visualPrompt,
                textPrompt: textPrompt || null,
                style: style || 'ultra-realistic',
                engine: engineVersion,
                templateId: selectedTemplate?.id || null,
                templateHints: selectedTemplate?.promptHints || null,
                dimensions: selectedTemplate?.dimensions || null,
                brandContext,
                campaignContext,
                mediaType: mediaTypes[0] || null,
                topicCategory: detectedTopic,
                holidaySeason: selectedHoliday || null,
                aspectRatio,
                designApproach: designApproach || (brandContext as any)?.designApproach || null,
                corrections,
                _visualOnlyUrl: img.visualOnlyUrl || img.url,
              },
            });

            if (error || !data?.imageUrl) {
              return { id: img.id, ok: false as const };
            }

            const kosherResult = await runKosherCheck(data.imageUrl);
            return {
              id: img.id,
              ok: true as const,
              patch: {
                url: data.imageUrl,
                visualOnlyUrl: data.visualOnlyUrl || data.imageUrl,
                textMeta: data.textMeta || img.textMeta,
                status: kosherResult.status as GeneratedImage['status'],
                analysis: kosherResult.recommendation,
                model: data.model || img.model,
              },
            };
          })
        );

        const successful = patchResults.filter((r) => r.ok);
        const failedCount = patchResults.length - successful.length;

        if (successful.length > 0) {
          const patchMap = new Map(
            successful.map((r) => [r.id, (r as { id: string; patch: Partial<GeneratedImage> }).patch])
          );

          setGeneratedImages((prev) =>
            prev.map((img) => (patchMap.has(img.id) ? { ...img, ...(patchMap.get(img.id) as Partial<GeneratedImage>) } : img))
          );

          setEnlargedImage((prev) => {
            if (!prev) return prev;
            const patch = patchMap.get(prev.id);
            return patch ? { ...prev, ...(patch as Partial<GeneratedImage>) } : prev;
          });

          toast.success(`עודכנו ${successful.length} סקיצה${successful.length > 1 ? 'ות' : ''} במקום`);
        }

        if (failedCount > 0) {
          toast.error(`לא הצלחנו לתקן ${failedCount} סקיצה${failedCount > 1 ? 'ות' : ''} — נסה שוב`);
        }
      } finally {
        setIsGenerating(false);
      }

      return;
    }

    // Full rerender flow ("עוד סבב")
    setPendingCorrections(prev => [...prev, ...corrections]);
    await handleGenerate();
  };

  const handleProceedToMediaSelection = () => {
    setShowMediaSelection(true);
  };

  const handleProceedToQuote = () => {
    if (!selectedMediaPackage) {
      toast.error('נא לבחור חבילת מדיה');
      return;
    }
    setShowMediaSelection(false);
    setShowQuote(true);
  };

  const handleBackToResults = () => {
    setShowMediaSelection(false);
  };

  const handleApproveQuote = async () => {
    setIsSubmittingQuote(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('יש להתחבר כדי לשלוח הזמנה');
        setIsSubmittingQuote(false);
        return;
      }

      // Get or create client profile
      const { data: profile } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        toast.error('יש ליצור פרופיל עסקי לפני שליחת הזמנה');
        setIsSubmittingQuote(false);
        return;
      }

      const quoteData = getQuoteData();
      
      // Save/update campaign to database
      const campaignData = {
        user_id: user.id,
        client_profile_id: profile.id,
        name: campaignBrief.title || `קמפיין ${new Date().toLocaleDateString('he-IL')}`,
        status: 'pending_approval',
        vibe: style,
        goal: campaignBrief.goal || visualPrompt,
        start_date: mediaStartDate?.toISOString().split('T')[0] || null,
        end_date: mediaEndDate?.toISOString().split('T')[0] || null,
        budget: mediaBudget,
        target_stream: mediaTargetStream,
        target_gender: mediaTargetGender,
        target_city: mediaTargetCity,
        selected_media: quoteData.mediaItems as unknown as import('@/integrations/supabase/types').Json,
        creatives: generatedImages.map(img => ({
          id: img.id,
          url: img.url,
          status: img.status,
        })) as unknown as import('@/integrations/supabase/types').Json,
      };
      
      let error;
      if (draftCampaignId) {
        // Update existing draft campaign
        const result = await supabase.from('campaigns').update(campaignData).eq('id', draftCampaignId);
        error = result.error;
      } else {
        // Create new campaign
        const result = await supabase.from('campaigns').insert(campaignData);
        error = result.error;
      }

      if (error) {
        console.error('Error saving campaign:', error);
        toast.error('שגיאה בשמירת ההזמנה');
        setIsSubmittingQuote(false);
        return;
      }

      // Show format adaptation step if there are approved creatives
      const approvedUrls = generatedImages
        .filter(img => img.status === 'approved' || img.status === 'needs-review')
        .map(img => img.url);
      const specIds = quoteData.mediaItems.map(item => item.id);

      if (approvedUrls.length > 0 && specIds.length > 0) {
        setShowQuote(false);
        setShowFormatAdaptation(true);
      } else {
        setShowQuote(false);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה בשליחת ההזמנה');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleFormatAdaptationComplete = (adapted: AdaptedCreative[]) => {
    setAdaptedCreatives(adapted);
    setShowFormatAdaptation(false);
    setShowSuccess(true);
  };

  const handleConsultAgent = () => {
    toast.info('נציג יצור איתך קשר בהקדם!');
  };

  // Helper: build brand context for image generation
  const buildBrandContext = () => {
    const colorSelection = campaignBrief.colorSelection;
    let effectiveColors = {
      primary: clientProfile?.primary_color || null,
      secondary: clientProfile?.secondary_color || null,
      background: clientProfile?.background_color || null,
    };
    
    if (colorSelection.mode === 'swapped') {
      effectiveColors = {
        primary: colorSelection.primaryColor || clientProfile?.secondary_color || null,
        secondary: colorSelection.secondaryColor || clientProfile?.primary_color || null,
        background: colorSelection.backgroundColor || clientProfile?.background_color || null,
      };
    }

    // Extract ad layout analysis from past materials
    const pastMaterialsAnalysis = (clientProfile?.past_materials as any[])
      ?.filter((m: any) => m.adAnalysis)
      ?.map((m: any) => m.adAnalysis)
      ?.slice(0, 3) || [];

    return clientProfile ? {
      businessName: clientProfile.business_name,
      targetAudience: clientProfile.target_audience,
      primaryXFactor: clientProfile.primary_x_factor,
      winningFeature: clientProfile.winning_feature,
      xFactors: clientProfile.x_factors,
      colors: effectiveColors,
      fonts: {
        header: clientProfile.header_font,
        body: clientProfile.body_font,
        fromPastMaterials: clientProfile.past_materials_fonts || [],
      },
      colorMode: colorSelection.mode,
      logoUrl: clientProfile.logo_url,
      contactPhone: clientProfile.contact_phone,
      contactWhatsapp: clientProfile.contact_whatsapp,
      contactEmail: clientProfile.contact_email,
      contactAddress: clientProfile.contact_address,
      pastMaterialsAnalysis,
      // Business photos URLs for AI to reference
      businessPhotoUrls: (clientProfile.business_photos as any[])
        ?.filter((p: any) => p.url)
        ?.map((p: any) => p.url)
        ?.slice(0, 5) || [],
      // ── Full Brand Identity Card fields ──
      services: clientProfile.services || [],
      competitors: clientProfile.competitors || [],
      advantageType: clientProfile.advantage_type,
      audienceTone: clientProfile.audience_tone,
      brandPresence: clientProfile.brand_presence,
      endConsumer: clientProfile.end_consumer,
      decisionMaker: clientProfile.decision_maker,
      personalRedLines: clientProfile.personal_red_lines || [],
      successfulCampaigns: clientProfile.successful_campaigns || [],
      qualitySignatures: clientProfile.quality_signatures || [],
      honorificPreference: clientProfile.honorific_preference,
      websiteUrl: clientProfile.website_url,
      branches: (clientProfile as any).branches || null,
      openingHours: (clientProfile as any).opening_hours || null,
    } : null;
  };

  // Convert PDF logo to PNG before sending to AI
  const getResolvedLogoUrl = async (): Promise<string | null> => {
    const logoUrl = clientProfile?.logo_url;
    if (!logoUrl) return null;
    if (!isPdfUrl(logoUrl)) return logoUrl;
    try {
      console.log('Converting PDF logo to PNG...');
      toast.info('ממיר לוגו PDF לתמונה...');
      const pngUrl = await pdfToImage(logoUrl, { scale: 4 });
      console.log('PDF logo converted successfully');
      return pngUrl;
    } catch (err) {
      console.error('Failed to convert PDF logo:', err);
      toast.warning('לא ניתן להמיר את הלוגו מ-PDF — ממשיכים בלעדיו');
      return null;
    }
  };

  // Open print dialog for single image
  const handleExportPrint = (image: GeneratedImage) => {
    setPrintDialogImage(image);
    setPrintDialogMode('single');
  };

  // Open print dialog for all images
  const handleExportAllPrint = () => {
    const approved = generatedImages.filter(i => i.status !== 'rejected');
    if (approved.length === 0) return;
    setPrintDialogMode('all');
    setPrintDialogImage(approved[0]);
  };

  // Actually run the export with chosen settings
  const handlePrintExport = async (settings: PrintSettings) => {
    const exportImage = printDialogImage;
    setPrintDialogImage(null);
    try {
      toast.info('מכין קובץ לדפוס...');
      if (printDialogMode === 'single' && exportImage) {
        await exportToPrintPdf({
          imageUrl: exportImage.url,
          filename: `${clientProfile?.business_name || 'ad'}-print`,
          format: settings.format,
          orientation: settings.orientation,
          bleed: settings.bleed,
          cropMarks: settings.cropMarks,
          quality: settings.quality,
        });
      } else {
        const approved = generatedImages.filter(i => i.status !== 'rejected');
        await exportMultiPagePdf(
          approved.map(i => ({ url: i.url })),
          {
            filename: `${clientProfile?.business_name || 'campaign'}-all-prints`,
            format: settings.format,
            orientation: settings.orientation,
            bleed: settings.bleed,
            cropMarks: settings.cropMarks,
            quality: settings.quality,
          }
        );
      }
      toast.success('קובץ PDF לדפוס הורד בהצלחה! 🖨️');
    } catch (err) {
      console.error('Print export failed:', err);
      toast.error('שגיאה בייצוא לדפוס');
    }
  };

  // Helper: generate image for a single concept
  const generateImageForConcept = async (concept: CreativeConcept, index: number, brandContext: any, campaignContext: any, corrections?: string[]) => {
    // Determine visual approach from concept or fallback by index
    const approachByIndex = ['graphic-design', 'product-focus', 'lifestyle'];
    const visualApproach = (concept as any).visual_approach || approachByIndex[index % 3];
    
    const enhancedVisualPrompt = campaignBrief.offer 
      ? `[Visual approach: ${visualApproach}] ${concept.idea}. המסר המרכזי: ${campaignBrief.offer}`
      : `[Visual approach: ${visualApproach}] ${concept.idea}`;
    const cleanedConceptVisualPrompt = sanitizeVisualPrompt(enhancedVisualPrompt, !selectedHoliday || selectedHoliday === 'year_round');
    
    const enhancedTextPrompt = campaignBrief.offer && !concept.copy.includes(campaignBrief.offer)
      ? `${concept.copy} - ${campaignBrief.offer}`
      : concept.copy;

    const detectedTopic = detectTopicCategory(campaignBrief.offer + ' ' + campaignBrief.title);

    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        visualPrompt: cleanedConceptVisualPrompt || enhancedVisualPrompt,
        textPrompt: enhancedTextPrompt,
        style: 'modern',
        engine: engineVersion,
        brandContext,
        campaignContext,
        mediaType: campaignContext?.mediaFormat || (mediaTypes.includes('all') ? (concept.mediaType || 'ad') : (mediaTypes[0] || null)),
        topicCategory: detectedTopic,
        holidaySeason: selectedHoliday || null,
        aspectRatio: campaignContext?.mediaFormat === 'banner' ? 'landscape' : aspectRatio,
        visualApproach,
        designApproach: designApproach || null,
        corrections: corrections || undefined,
      }
    });

    if (error) {
      console.error(`Error generating image for concept ${index}:`, error);
      return null;
    }

    if (data?.imageUrl) {
      // All-in-One: the AI generates the complete ad with text, logo, and layout
      // No programmatic overlay needed — use the image directly
      const finalUrl = data.imageUrl;
      console.log(`[Studio] All-in-One concept ${index} ready. Model: ${data.model}`);

      await supabase.from('generated_images').insert({
        visual_prompt: enhancedVisualPrompt,
        text_prompt: enhancedTextPrompt,
        style: 'modern',
        engine: 'nano-banana',
        image_url: finalUrl,
        kosher_status: 'pending',
      });
      return finalUrl;
    }
    return null;
  };

  // Helper to update a pipeline step
  const updatePipelineStep = (stepId: string, updates: Partial<AgentStep>) => {
    setPipelineSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  // Helper to add a new step dynamically after a specific step
  const addPipelineStepAfter = (afterStepId: string, newStep: AgentStep) => {
    setPipelineSteps(prev => {
      const idx = prev.findIndex(s => s.id === afterStepId);
      if (idx === -1) return [...prev, newStep];
      // Don't add if already exists
      if (prev.some(s => s.id === newStep.id)) return prev;
      const copy = [...prev];
      copy.splice(idx + 1, 0, newStep);
      return copy;
    });
  };

  // Autopilot: generate concepts AND images in one flow (skip text-only step)
  const handleGenerateConcepts = async () => {
    setIsGeneratingConcepts(true);
    setConcepts([]);
    setSelectedConcept(null);
    setGeneratedImages([]);
    setShowPipeline(true);
    
    // Initialize pipeline steps
    const initialSteps: AgentStep[] = [
      { id: 'profile', agent: 'System', label: 'טעינת פרופיל מותג', icon: 'database', status: 'pending' },
      { id: 'brief-data', agent: 'System', label: '📋 נתוני בריף שהתקבלו', icon: 'lesson', status: 'pending' },
      { id: 'topic', agent: 'System', label: 'זיהוי נושא וקטגוריה', icon: 'brain', status: 'pending' },
      { id: 'strategy', agent: 'Super Agent', label: 'ניתוח אסטרטגי — קהל, כאבים, יתרונות', icon: 'send', status: 'pending' },
      { id: 'concepts', agent: 'Concept Agent', label: 'יצירת 3 קונספטים קריאטיביים', icon: 'sparkles', status: 'pending' },
      { id: 'sketch-1', agent: 'Image Agent', label: 'עיצוב סקיצה 1 — רגשי', icon: 'palette', status: 'pending' },
      { id: 'sketch-2', agent: 'Image Agent', label: 'עיצוב סקיצה 2 — מכירתי', icon: 'palette', status: 'pending' },
      { id: 'sketch-3', agent: 'Image Agent', label: 'עיצוב סקיצה 3 — כאב ופתרון', icon: 'palette', status: 'pending' },
      { id: 'kosher-1', agent: 'Kosher Filter', label: 'בדיקת כשרות סקיצה 1', icon: 'shield', status: 'pending' },
      { id: 'kosher-2', agent: 'Kosher Filter', label: 'בדיקת כשרות סקיצה 2', icon: 'shield', status: 'pending' },
      { id: 'kosher-3', agent: 'Kosher Filter', label: 'בדיקת כשרות סקיצה 3', icon: 'shield', status: 'pending' },
    ];
    setPipelineSteps(initialSteps);
    
    try {
      // Step 1: Profile
      updatePipelineStep('profile', { status: 'running', startedAt: Date.now() });
      const profile = clientProfile || {
        business_name: 'העסק שלי',
        target_audience: 'משפחות חרדיות',
        end_consumer: null as string | null,
        decision_maker: null as string | null,
        primary_x_factor: 'איכות ושירות',
        winning_feature: 'מקצועיות',
        advantage_type: 'שירות',
        x_factors: ['איכות', 'מחיר', 'שירות']
      };
      updatePipelineStep('profile', { 
        status: 'done', 
        completedAt: Date.now(),
        output: `עסק: ${profile.business_name}\nקהל: ${profile.target_audience || profile.end_consumer || 'לא הוגדר'}\nלוגו: ${(clientProfile as any)?.logo_url ? '✅ נמצא' : '❌ חסר'}`,
      });

      // Brief Data Summary step
      const goalLabels: Record<string, string> = { sell: '💰 מכירה', awareness: '📢 מודעות', new_product: '🚀 השקה', meetup: '🤝 כנס/מפגש' };
      const toneLabels: Record<string, string> = { luxury: '✨ יוקרה', urgency: '⏰ דחיפות', belonging: '🤝 שייכות', professional: '🏢 מקצועיות' };
      const actionLabels: Record<string, string> = { whatsapp_email: '📱 וואטסאפ/מייל', phone: '📞 טלפון', visit: '🏪 ביקור בחנות', website: '🌐 אתר', recall: '🧠 זכירת מותג' };
      
      // Build contact display selections
      const contactLabels: string[] = [];
      const cs = campaignBrief.contactSelection;
      if (cs.logoOnly) contactLabels.push('🏷️ לוגו');
      if (cs.phone) contactLabels.push('📞 טלפון');
      if (cs.whatsapp) contactLabels.push('📱 וואטסאפ');
      if (cs.email) contactLabels.push('📧 מייל');
      if (cs.address) contactLabels.push('📍 כתובת');
      if (cs.openingHours) contactLabels.push('🕐 שעות פתיחה');
      if (cs.youtube) contactLabels.push('🎬 יוטיוב');
      if (cs.facebook) contactLabels.push('📘 פייסבוק');
      if (cs.instagram) contactLabels.push('📸 אינסטגרם');
      if ((cs.selectedBranches || []).length > 0) contactLabels.push(`🏢 ${cs.selectedBranches.length} סניפים`);

      const briefLines = [
        `📌 בשורה מרכזית: "${campaignBrief.offer?.substring(0, 80) || 'לא הוגדר'}${(campaignBrief.offer?.length || 0) > 80 ? '...' : ''}"`,
        `🎯 מטרה: ${goalLabels[campaignBrief.adGoal || ''] || campaignBrief.adGoal || '❌ לא נבחר'}`,
        `🎭 טון רגשי: ${toneLabels[campaignBrief.emotionalTone || ''] || campaignBrief.emotionalTone || '❌ לא נבחר'}`,
        `👆 פעולה רצויה: ${campaignBrief.desiredActions.length > 0 ? campaignBrief.desiredActions.map(a => actionLabels[a] || a).join(', ') : '❌ לא נבחר'}`,
        campaignBrief.showPriceOrBenefit && campaignBrief.priceOrBenefit ? `💲 מחיר/הטבה: ${campaignBrief.priceOrBenefit}` : '💲 מחיר/הטבה: לא הוגדר',
        campaignBrief.isTimeLimited ? `⏳ מוגבל בזמן: ${campaignBrief.timeLimitText || 'כן'}` : '⏳ ללא הגבלת זמן',
        `📋 מה להציג: ${contactLabels.length > 0 ? contactLabels.join(', ') : '❌ לא נבחר'}`,
        `🎨 גישת עיצוב: ${designApproach || 'חופש יצירתי'}`,
        `📐 סוג מדיה: ${mediaTypes.join(', ') || 'לא נבחר'}`,
        `🏷️ כותרת קמפיין: ${campaignBrief.title || 'לא הוגדר'}`,
        clientProfile?.primary_color ? `🎨 צבע ראשי: ${clientProfile.primary_color}` : '',
        clientProfile?.header_font ? `🔤 פונט: ${clientProfile.header_font}` : '',
        selectedHoliday && selectedHoliday !== 'year_round' ? `🕎 חג/עונה: ${selectedHoliday}` : '',
      ].filter(Boolean).join('\n');

      updatePipelineStep('brief-data', { 
        status: 'done', 
        startedAt: Date.now(),
        completedAt: Date.now(),
        output: briefLines,
      });

      // Step 2: Topic Detection
      updatePipelineStep('topic', { status: 'running', startedAt: Date.now() });
      const searchText = campaignBrief.offer + ' ' + campaignBrief.title + ' ' + (clientProfile?.primary_x_factor || '');
      const detectedTopic = detectTopicCategory(searchText);
      updatePipelineStep('topic', { 
        status: 'done', 
        completedAt: Date.now(),
        input: `טקסט לניתוח: "${searchText.substring(0, 80)}"`,
        output: `קטגוריה שזוהתה: ${detectedTopic || 'כללי'}\nחג/עונה: ${selectedHoliday || 'כל השנה'}`,
      });

      // Step 3: Strategic Analysis via Super Agent
      updatePipelineStep('strategy', { 
        status: 'running', 
        startedAt: Date.now(),
        details: 'הסופר-אייג\'נט מנתח קהל יעד, כאבים ויתרונות...',
        input: `עסק: ${profile.business_name}\nהצעה: "${campaignBrief.offer}"\nקהל: ${profile.target_audience || profile.end_consumer || 'לא הוגדר'}\nיתרון: ${profile.primary_x_factor || 'לא הוגדר'}\nחג: ${selectedHoliday || 'כל השנה'}`,
      });

      let strategyOutput = '';
      try {
        const { data: strategyData, error: strategyError } = await supabase.functions.invoke('super-agent', {
          body: {
            message: `אני צריך ניתוח אסטרטגי קצר עבור קמפיין פרסום.
עסק: ${profile.business_name}
הצעה פרסומית: ${campaignBrief.offer}
${campaignBrief.title ? `שם הקמפיין: ${campaignBrief.title}` : ''}
קהל יעד: ${profile.target_audience || profile.end_consumer || 'משפחות חרדיות'}
יתרון מרכזי: ${profile.primary_x_factor || profile.winning_feature || 'לא הוגדר'}
${selectedHoliday && selectedHoliday !== 'year_round' ? `חג/עונה: ${selectedHoliday}` : ''}
${campaignBrief.adGoal ? `מטרת המודעה: ${campaignBrief.adGoal}` : ''}
${campaignBrief.emotionalTone ? `טון רגשי: ${campaignBrief.emotionalTone}` : ''}
${campaignBrief.desiredActions.length > 0 ? `פעולה רצויה מהלקוח: ${campaignBrief.desiredActions.join(', ')}` : ''}
${campaignBrief.showPriceOrBenefit && campaignBrief.priceOrBenefit ? `מחיר/הטבה: ${campaignBrief.priceOrBenefit}` : ''}
${campaignBrief.isTimeLimited && campaignBrief.timeLimitText ? `מוגבל בזמן: ${campaignBrief.timeLimitText}` : ''}
נוכחות מותג: ${(profile as any).brand_presence || 'לא הוגדר'}
תעודות איכות: ${(profile as any).quality_signatures ? JSON.stringify((profile as any).quality_signatures) : 'לא הוגדרו'}

תן לי בבקשה בקצרה:
1. מי קהל היעד המדויק
2. מה הכאב/בעיה שהמוצר פותר
3. מה ה-USP (נקודת המכירה הייחודית)
4. מה המסר המרכזי שצריך לעבור
5. איזה טון ורגש צריך הקמפיין לעורר`,
            clientProfile: profile,
            campaignContext: {
              title: campaignBrief.title,
              offer: campaignBrief.offer,
              goal: campaignBrief.goal,
              holiday_season: selectedHoliday || null,
              topic_category: detectedTopic,
              adGoal: campaignBrief.adGoal,
              emotionalTone: campaignBrief.emotionalTone,
              desiredAction: campaignBrief.desiredAction,
              priceOrBenefit: campaignBrief.showPriceOrBenefit ? campaignBrief.priceOrBenefit : null,
              isTimeLimited: campaignBrief.isTimeLimited,
              timeLimitText: campaignBrief.isTimeLimited ? campaignBrief.timeLimitText : null,
            },
            topicCategory: detectedTopic,
          }
        });

        if (strategyError) {
          console.error('Super Agent error:', strategyError);
          updatePipelineStep('strategy', { 
            status: 'done', 
            completedAt: Date.now(),
            output: 'ממשיך ללא ניתוח אסטרטגי (שגיאה בסוכן)',
          });
        } else {
          strategyOutput = strategyData?.response || '';
          // Extract key insights for pipeline display (truncated)
          const displayOutput = strategyOutput.length > 500 
            ? strategyOutput.substring(0, 500) + '...' 
            : strategyOutput;
          updatePipelineStep('strategy', { 
            status: 'done', 
            completedAt: Date.now(),
            output: displayOutput,
          });
        }
      } catch (e) {
        console.error('Strategy step failed:', e);
        updatePipelineStep('strategy', { 
          status: 'done', 
          completedAt: Date.now(),
          output: 'ממשיך ללא ניתוח אסטרטגי (timeout)',
        });
      }

      // Step 4: Generate Concepts
      updatePipelineStep('concepts', { 
        status: 'running', 
        startedAt: Date.now(),
        details: 'שולח בריף ל-AI לייצור 3 קונספטים...',
        input: `הצעה: "${campaignBrief.offer}"\nמטרה: ${campaignBrief.goal || 'לא הוגדרה'}\nמדיה: ${mediaTypes.join(', ')}\nחג: ${selectedHoliday || 'כל השנה'}\nנושא: ${detectedTopic || 'כללי'}${strategyOutput ? `\n\nניתוח אסטרטגי:\n${strategyOutput.substring(0, 300)}...` : ''}`,
      });

      // Strip large base64 data (like PDF logos) from profile to avoid oversized request bodies
      const lightProfile: any = { ...profile };
      if (lightProfile.logo_url && String(lightProfile.logo_url).length > 5000) {
        lightProfile.logo_url = null;
      }

      const { data, error } = await supabase.functions.invoke('generate-concepts', {
        body: { 
          profile: lightProfile, 
          mediaTypes,
          campaignBrief: {
            title: campaignBrief.title,
            offer: campaignBrief.offer,
            goal: campaignBrief.goal,
            adGoal: campaignBrief.adGoal,
            emotionalTone: campaignBrief.emotionalTone,
            desiredAction: campaignBrief.desiredAction,
            priceOrBenefit: campaignBrief.showPriceOrBenefit ? campaignBrief.priceOrBenefit : null,
            isTimeLimited: campaignBrief.isTimeLimited,
            timeLimitText: campaignBrief.isTimeLimited ? campaignBrief.timeLimitText : null,
          },
          holidaySeason: selectedHoliday || null,
          topicCategory: detectedTopic,
          strategicAnalysis: strategyOutput || undefined,
          designApproach: designApproach || null,
        }
      });

      if (error) {
        console.error('Error generating concepts:', error);
        updatePipelineStep('concepts', { status: 'error', completedAt: Date.now(), error: error.message || 'שגיאה ביצירת קונספטים' });
        toast.error('שגיאה ביצירת הקונספטים');
        setIsGeneratingConcepts(false);
        return;
      }

      if (!data?.concepts || data.concepts.length === 0) {
        updatePipelineStep('concepts', { status: 'error', completedAt: Date.now(), error: 'לא התקבלו קונספטים מה-AI' });
        toast.error('לא הצלחנו ליצור קונספטים. נסה שוב.');
        setIsGeneratingConcepts(false);
        return;
      }

      const generatedConcepts: CreativeConcept[] = data.concepts;
      setConcepts(generatedConcepts);
      setIsGeneratingConcepts(false);

      // Log concepts output
      const conceptsSummary = generatedConcepts.map((c, i) => 
        `${i+1}. [${c.type}] "${c.headline}"\n   קופי: ${c.copy?.substring(0, 60)}...\n   רעיון: ${c.idea?.substring(0, 60)}...`
      ).join('\n');
      updatePipelineStep('concepts', { 
        status: 'done', 
        completedAt: Date.now(),
        output: conceptsSummary,
      });

      // Update sketch labels with actual concept types
      generatedConcepts.forEach((c, i) => {
        const typeLabel = c.type === 'emotional' ? 'רגשי' : c.type === 'hard-sale' ? 'מכירתי' : 'כאב ופתרון';
        updatePipelineStep(`sketch-${i+1}`, { label: `עיצוב סקיצה ${i+1} — ${typeLabel}` });
      });

      // Determine if we need visuals in autopilot flow
      const isRadioOnlyAutopilot = mediaTypes.length === 1 && mediaTypes[0] === 'radio';
      const isArticleOnlyAutopilot = mediaTypes.length === 1 && mediaTypes[0] === 'article';
      const isEmailOnlyAutopilot = mediaTypes.length === 1 && mediaTypes[0] === 'email';
      const isWhatsappOnlyAutopilot = mediaTypes.length === 1 && mediaTypes[0] === 'whatsapp';
      const needsVisualsAutopilot = !isRadioOnlyAutopilot && !isArticleOnlyAutopilot && !isEmailOnlyAutopilot && !isWhatsappOnlyAutopilot;

      const brandContext = buildBrandContext();
      const resolvedLogo = await getResolvedLogoUrl();
      if (resolvedLogo && brandContext) {
        brandContext.logoUrl = resolvedLogo;
      }
      
      const campaignContext = {
        title: campaignBrief.title,
        offer: campaignBrief.offer,
        goal: campaignBrief.goal,
        structure: campaignBrief.structure,
        holidaySeason: selectedHoliday || null,
        campaignImageUrl: campaignBrief.campaignImage || null,
        adGoal: campaignBrief.adGoal,
        emotionalTone: campaignBrief.emotionalTone,
        desiredAction: campaignBrief.desiredAction,
        desiredActions: (campaignBrief as any).desiredActions || (campaignBrief.desiredAction ? [campaignBrief.desiredAction] : []),
        priceOrBenefit: campaignBrief.showPriceOrBenefit ? campaignBrief.priceOrBenefit : null,
        isTimeLimited: campaignBrief.isTimeLimited,
        timeLimitText: campaignBrief.isTimeLimited ? campaignBrief.timeLimitText : null,
      };

      const results: GeneratedImage[] = [];

      if (!needsVisualsAutopilot) {
        // Skip image generation for text-only media types
        toast.info('מייצר תוכן טקסטואלי... ✍️');
        setShowResults(true);
        // Skip all sketch pipeline steps
        for (let i = 0; i < generatedConcepts.length; i++) {
          updatePipelineStep(`sketch-${i+1}`, { status: 'skipped', details: 'לא נדרש ויזואל — כתבה/רדיו/מייל בלבד' });
          updatePipelineStep(`kosher-${i+1}`, { status: 'skipped', details: 'לא נדרש ויזואל' });
        }
      } else {
        // Generate images
        toast.info('הקונספטים מוכנים! מתחיל לעצב סקיצות... 🎨');
        setIsGenerating(true);
        setShowResults(true);
        setStyle('modern');
        setAssetChoice('has-copy');

      for (let i = 0; i < generatedConcepts.length; i++) {
        const concept = generatedConcepts[i];
        const sketchId = `sketch-${i+1}`;
        const kosherId = `kosher-${i+1}`;

        // Start sketch generation
        const enhancedVisualPrompt = campaignBrief.offer 
          ? `${concept.idea}. המסר המרכזי: ${campaignBrief.offer}`
          : concept.idea;
        
        updatePipelineStep(sketchId, { 
          status: 'running', 
          startedAt: Date.now(),
          details: 'שולח פרומפט ויזואלי למודל תמונות...',
          input: `פרומפט ויזואלי: "${enhancedVisualPrompt.substring(0, 100)}"\nסגנון: modern\nלוגו: ${brandContext?.logoUrl ? '✅ מצורף' : '❌ לא מצורף'}\nצבעים: ${brandContext?.colors?.primary || 'לא הוגדרו'}`,
        });

        const imageUrl = await generateImageForConcept(concept, i, brandContext, campaignContext);

        if (imageUrl) {
          updatePipelineStep(sketchId, { 
            status: 'done', 
            completedAt: Date.now(),
            output: `✅ תמונה נוצרה בהצלחה\nURL: ${imageUrl.substring(0, 50)}...`,
          });

          const newImage: GeneratedImage = {
            id: `${Date.now()}-${i}`,
            url: imageUrl,
            status: 'pending',
            model: 'gemini-3.1-flash-image-preview',
          };
          results.push(newImage);
          setGeneratedImages([...results]);

          // Kosher check
          updatePipelineStep(kosherId, { status: 'running', startedAt: Date.now(), details: 'מנתח תמונה לתאימות הלכתית...' });
          const kosherResult = await runKosherCheck(imageUrl);
          newImage.status = kosherResult.status as GeneratedImage['status'];
          newImage.analysis = kosherResult.recommendation;
          setGeneratedImages([...results]);
          
          updatePipelineStep(kosherId, { 
            status: 'done', 
            completedAt: Date.now(),
            output: `סטטוס: ${kosherResult.status === 'approved' ? '✅ מאושר' : kosherResult.status === 'rejected' ? '❌ נדחה' : '⚠️ דורש בדיקה'}\n${kosherResult.recommendation || ''}`,
          });

          await supabase.from('generated_images')
            .update({ kosher_status: kosherResult.status, kosher_analysis: kosherResult.recommendation })
            .eq('image_url', imageUrl);

          // Auto-retry if rejected OR needs-review with specific issues
          const hasSpecificIssues = kosherResult.recommendation && 
            kosherResult.recommendation.length > 20 && 
            kosherResult.status !== 'approved';
          
          if (kosherResult.status === 'rejected' || (kosherResult.status === 'needs-review' && hasSpecificIssues)) {
            const isRejected = kosherResult.status === 'rejected';
            // Mark kosher step
            updatePipelineStep(kosherId, { 
              status: isRejected ? 'rejected' as AgentStepStatus : 'done',
              completedAt: Date.now(),
              output: isRejected 
                ? `❌ נדחה: ${kosherResult.recommendation || 'לא עמד בדרישות'}`
                : `⚠️ נמצאו הערות לתיקון: ${kosherResult.recommendation}\n🔄 מייצר גרסה מתוקנת אוטומטית...`,
            });

            let retrySuccess = false;
            const maxRetries = isRejected ? 2 : 1; // needs-review gets 1 retry, rejected gets 2
            for (let retry = 0; retry < maxRetries && !retrySuccess; retry++) {
              const retryStepId = `retry-${i+1}-${retry+1}`;
              const retryKosherStepId = `retry-kosher-${i+1}-${retry+1}`;
              
              // Add dynamic retry step to pipeline
              addPipelineStepAfter(retry === 0 ? kosherId : `retry-kosher-${i+1}-${retry}`, {
                id: retryStepId,
                agent: 'Retry Generator',
                label: isRejected 
                  ? `🔄 ייצור חלופה לסקיצה ${i+1} (ניסיון ${retry + 1})`
                  : `🔧 תיקון סקיצה ${i+1} לפי הערות`,
                icon: 'retry',
                status: 'retrying' as AgentStepStatus,
                startedAt: Date.now(),
                details: `${isRejected ? 'הסקיצה נדחתה' : 'נמצאו הערות'} — מייצר גרסה מתוקנת: ${kosherResult.recommendation}`,
              });

              toast.info(isRejected 
                ? `סקיצה ${i + 1} נדחתה, מייצר חלופה (ניסיון ${retry + 1})... 🔄`
                : `מתקן סקיצה ${i + 1} לפי הערות הבדיקה... 🔧`
              );

              const corrections = isRejected
                ? [`הסקיצה הקודמת נדחתה: ${kosherResult.recommendation}. יש להימנע מהבעיה הזו.`]
                : [`נמצאו הערות בבדיקה שחייבות תיקון: ${kosherResult.recommendation}. תקן את הבעיות האלו בדיוק תוך שמירה על שאר העיצוב.`];

              const retryImageUrl = await generateImageForConcept(
                concept, i + 10 + retry, brandContext, campaignContext,
                corrections
              );

              if (retryImageUrl) {
                // Add retry kosher check step
                addPipelineStepAfter(retryStepId, {
                  id: retryKosherStepId,
                  agent: 'Kosher Filter',
                  label: `בדיקת כשרות ${isRejected ? 'חלופה' : 'תיקון'} ${i+1} (ניסיון ${retry + 1})`,
                  icon: 'shield',
                  status: 'running',
                  startedAt: Date.now(),
                });

                updatePipelineStep(retryStepId, { status: 'done', completedAt: Date.now(), output: `✅ סקיצה ${isRejected ? 'חלופית' : 'מתוקנת'} נוצרה` });

                const retryKosher = await runKosherCheck(retryImageUrl);
                if (retryKosher.status !== 'rejected') {
                  newImage.url = retryImageUrl;
                  newImage.status = retryKosher.status as GeneratedImage['status'];
                  newImage.analysis = retryKosher.recommendation;
                  setGeneratedImages([...results]);
                  
                  updatePipelineStep(retryKosherStepId, { 
                    status: 'done', 
                    completedAt: Date.now(),
                    output: `סטטוס: ${retryKosher.status === 'approved' ? '✅ מאושר' : '⚠️ דורש בדיקה'}\n${retryKosher.recommendation || ''}`,
                  });

                  // Add "lesson learned" step
                  const lessonStepId = `lesson-${i+1}`;
                  addPipelineStepAfter(retryKosherStepId, {
                    id: lessonStepId,
                    agent: 'System Learning',
                    label: `💡 לקח נלמד — סקיצה ${i+1}`,
                    icon: 'lesson',
                    status: 'done',
                    startedAt: Date.now(),
                    completedAt: Date.now(),
                    output: `🚫 הבעיה: ${kosherResult.recommendation}\n✅ הפתרון: המערכת תימנע מבעיה זו בייצורים הבאים.\n📝 התיקון הועבר כהנחיה לכל הסוכנים.`,
                  });

                  toast.success(`סקיצה ${i + 1} ${isRejected ? 'הוחלפה' : 'תוקנה'} בהצלחה! ✅`);
                  retrySuccess = true;

                  await supabase.from('generated_images')
                    .update({ kosher_status: retryKosher.status, kosher_analysis: retryKosher.recommendation })
                    .eq('image_url', retryImageUrl);
                } else {
                  updatePipelineStep(retryKosherStepId, { 
                    status: 'rejected' as AgentStepStatus, 
                    completedAt: Date.now(),
                    output: `❌ נדחה שוב: ${retryKosher.recommendation}`,
                  });
                }
              } else {
                updatePipelineStep(retryStepId, { status: 'error', completedAt: Date.now(), error: 'לא התקבלה תמונה מהמודל' });
              }
            }
            if (!retrySuccess && isRejected) {
              // Add failure lesson only for rejected (not needs-review)
              addPipelineStepAfter(`retry-${i+1}-2`, {
                id: `lesson-fail-${i+1}`,
                agent: 'System Learning',
                label: `⚠️ סקיצה ${i+1} — נדחתה סופית`,
                icon: 'lesson',
                status: 'error',
                startedAt: Date.now(),
                completedAt: Date.now(),
                output: `🚫 הבעיה שנמשכה: ${kosherResult.recommendation}\n❌ לא הצלחנו לתקן אחרי ${maxRetries} ניסיונות.\n📝 הבעיה נרשמה ותטופל ידנית.`,
              });
            }
          }
        } else {
          updatePipelineStep(sketchId, { status: 'error', completedAt: Date.now(), error: 'לא התקבלה תמונה מהמודל' });
          updatePipelineStep(kosherId, { status: 'skipped', completedAt: Date.now(), details: 'דילוג — אין תמונה' });
        }
      }

      // Skip remaining steps if fewer than 3 concepts
      for (let i = generatedConcepts.length; i < 3; i++) {
        updatePipelineStep(`sketch-${i+1}`, { status: 'skipped', details: 'לא נוצר קונספט' });
        updatePipelineStep(`kosher-${i+1}`, { status: 'skipped', details: 'לא נוצר קונספט' });
      }

      setIsGenerating(false);
      // Auto-save campaign as draft
      if (results.length > 0) {
        await saveCampaignDraft(results);
      }
      } // end of needsVisualsAutopilot else block

      const includes360 = mediaTypes.includes('all');
      const needsRadio = includes360 || mediaTypes.includes('radio');
      const needsArticle = includes360 || mediaTypes.includes('article');
      const needsEmail = includes360 || mediaTypes.includes('email');
      const needsWhatsapp = includes360 || mediaTypes.includes('whatsapp');
      const needsBanner = includes360 || mediaTypes.includes('banner');

      const profileData = {
        businessName: clientProfile?.business_name,
        phone: clientProfile?.contact_phone,
        email: clientProfile?.contact_email,
        address: clientProfile?.contact_address,
        website: clientProfile?.website_url || '',
        targetAudience: clientProfile?.target_audience,
        winningFeature: clientProfile?.winning_feature,
        openingHours: (clientProfile as any)?.opening_hours || '',
      };

      const anchorConcept = generatedConcepts[0];

      if (needsBanner && includes360 && anchorConcept) {
        setShowAutopilotBanner(true);
        setIsGeneratingBanner(true);
        const bannerCampaignContext = { ...campaignContext, mediaFormat: 'banner' };
        generateImageForConcept(anchorConcept, 99, brandContext, bannerCampaignContext)
          .then((bannerUrl) => {
            if (bannerUrl) setAutopilotBannerUrl(bannerUrl);
          })
          .finally(() => setIsGeneratingBanner(false));
      }

      if (needsRadio) {
        setShowAutopilotRadio(true);
        setIsGeneratingRadio(true);
        supabase.functions.invoke('generate-radio-script', {
          body: {
            brief: {
              offer: campaignBrief.offer,
              adGoal: campaignBrief.adGoal,
              goal: campaignBrief.goal,
              emotionalTone: campaignBrief.emotionalTone,
              priceOrBenefit: campaignBrief.priceOrBenefit,
              timeLimitText: campaignBrief.timeLimitText,
            },
            brandContext: {
              businessName: clientProfile?.business_name,
              targetAudience: clientProfile?.target_audience,
            },
            targetGender: mediaTargetGender,
            targetStream: mediaTargetStream,
            contactPhone: clientProfile?.contact_phone || '',
          },
        }).then(({ data, error }) => {
          if (error) {
            console.error('Radio script error:', error);
            toast.error('שגיאה ביצירת תשדיר רדיו');
          } else if (data?.scripts?.length) {
            const bestScript = data.scripts[0];
            setAutopilotRadioScript({
              title: bestScript.title || 'ספוט רדיו',
              script: bestScript.scriptWithNikud || bestScript.script || '',
              duration: bestScript.duration,
              voiceNotes: bestScript.voiceNotes,
            });
          } else if (data?.error) {
            console.error('Radio script API error:', data.error);
            toast.error(`שגיאה ביצירת תשדיר: ${data.error}`);
          } else {
            toast.error('לא התקבל תשדיר רדיו — נסה שוב');
          }
        }).finally(() => setIsGeneratingRadio(false));
      }

      if (needsArticle && anchorConcept) {
        setShowAutopilotArticle(true);
        setIsGeneratingArticle(true);
        supabase.functions.invoke('generate-internal-material', {
          body: {
            type: 'article',
            profileData,
            extraContext: {
              articleStyle: 'product',
              articleTopic: campaignBrief.offer || anchorConcept.idea || '',
              targetLength: 'medium',
              articleSubType: articleSubType || 'text-only',
              userPrompt: `הכתבה צריכה להתבסס על הקונספט: ${anchorConcept.headline} — ${anchorConcept.copy}`,
            },
          },
        }).then(({ data, error }) => {
          if (error || data?.error) { toast.error(typeof data?.error === 'string' ? data.error : 'שגיאה ביצירת כתבה'); return; }
          if (data?.result) setAutopilotArticle(data.result);
        }).catch(() => toast.error('שגיאה ביצירת כתבה')).finally(() => setIsGeneratingArticle(false));
      }

      if (needsEmail && anchorConcept) {
        setShowAutopilotEmail(true);
        setIsGeneratingEmail(true);
        supabase.functions.invoke('generate-internal-material', {
          body: {
            type: 'email',
            profileData,
            extraContext: {
              emailTopic: campaignBrief.offer || anchorConcept.idea || '',
              emailSubType: emailSubType || 'text-only',
              userPrompt: `המייל צריך להתבסס על הקונספט: ${anchorConcept.headline} — ${anchorConcept.copy}`,
            },
          },
        }).then(({ data, error }) => {
          if (error || data?.error) { toast.error(typeof data?.error === 'string' ? data.error : 'שגיאה ביצירת מייל'); return; }
          if (data?.result) setAutopilotEmailContent(data.result);
        }).catch(() => toast.error('שגיאה ביצירת מייל')).finally(() => setIsGeneratingEmail(false));
      }

      if (needsWhatsapp && anchorConcept) {
        setShowAutopilotWhatsapp(true);
        setIsGeneratingWhatsapp(true);
        supabase.functions.invoke('generate-internal-material', {
          body: {
            type: 'whatsapp',
            profileData,
            extraContext: {
              whatsappTopic: campaignBrief.offer || anchorConcept.idea || '',
              whatsappSubType: whatsappSubType || 'distribution',
              userPrompt: `המסר צריך להתבסס על הקונספט: ${anchorConcept.headline} — ${anchorConcept.copy}`,
            },
          },
        }).then(({ data, error }) => {
          if (error || data?.error) { toast.error(typeof data?.error === 'string' ? data.error : 'שגיאה ביצירת מסר וואטסאפ'); return; }
          if (data?.result) setAutopilotWhatsappContent(data.result);
        }).catch(() => toast.error('שגיאה ביצירת מסר וואטסאפ')).finally(() => setIsGeneratingWhatsapp(false));
      }

      if (needsVisualsAutopilot) {
        // Only show image result toasts when visuals were actually generated
        if (results.length > 0) {
          const approved = results.filter(r => r.status === 'approved').length;
          const needsReview = results.filter(r => r.status === 'needs-review').length;
          const rejected = results.filter(r => r.status === 'rejected').length;
          
          if (approved > 0) toast.success(`${approved} סקיצות אושרו! בסייעתא דשמיא`);
          if (needsReview > 0) toast.warning(`${needsReview} סקיצות דורשות בדיקה אנושית`);
          if (rejected > 0) toast.error(`${rejected} סקיצות נדחו ע"י המשגיח הדיגיטלי`);
        } else {
          toast.error('לא הצלחנו ליצור תמונות. נסה שוב.');
        }
      } else {
        // Text-only media — show success toast
        toast.success('התוכן נוצר בהצלחה! ✍️');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה ביצירת הסקיצות');
    } finally {
      setIsGeneratingConcepts(false);
      setIsGenerating(false);
    }
  };

  // Keep handleExecuteConcept for backward compatibility (e.g. "new ideas" flow)
   const handleExecuteConcept = async () => {
    if (!selectedConcept) return;
    
    setVisualPrompt(selectedConcept.idea);
    setTextPrompt(selectedConcept.copy);
    setStyle('modern');
    setAssetChoice('has-copy');
    setShowResults(true);

    const brandContext = buildBrandContext();
    const campaignContext = {
      title: campaignBrief.title,
      offer: campaignBrief.offer,
      goal: campaignBrief.goal,
      structure: campaignBrief.structure,
      holidaySeason: selectedHoliday || null,
      campaignImageUrl: campaignBrief.campaignImage || null,
      adGoal: campaignBrief.adGoal,
      emotionalTone: campaignBrief.emotionalTone,
      desiredAction: campaignBrief.desiredAction,
      desiredActions: (campaignBrief as any).desiredActions || (campaignBrief.desiredAction ? [campaignBrief.desiredAction] : []),
      priceOrBenefit: campaignBrief.showPriceOrBenefit ? campaignBrief.priceOrBenefit : null,
      isTimeLimited: campaignBrief.isTimeLimited,
      timeLimitText: campaignBrief.isTimeLimited ? campaignBrief.timeLimitText : null,
    };

    const profileData = {
      businessName: clientProfile?.business_name,
      phone: clientProfile?.contact_phone,
      email: clientProfile?.contact_email,
      address: clientProfile?.contact_address,
      website: clientProfile?.website_url || '',
      targetAudience: clientProfile?.target_audience,
      winningFeature: clientProfile?.winning_feature,
      openingHours: (clientProfile as any)?.opening_hours || '',
    };

    // Determine which outputs to generate based on selected media types
    const isRadioOnly = mediaTypes.length === 1 && mediaTypes[0] === 'radio';
    const isArticleOnly = mediaTypes.length === 1 && mediaTypes[0] === 'article';
    const isEmailOnly = mediaTypes.length === 1 && mediaTypes[0] === 'email';
    const isWhatsappOnly = mediaTypes.length === 1 && mediaTypes[0] === 'whatsapp';
    const includes360 = mediaTypes.includes('all');
    const needsVisuals = !isRadioOnly && !isArticleOnly && !isEmailOnly && !isWhatsappOnly;
    const needsRadio = isRadioOnly || includes360 || mediaTypes.includes('radio');
    const needsArticle = isArticleOnly || includes360 || mediaTypes.includes('article');
    const needsEmail = isEmailOnly || includes360 || mediaTypes.includes('email');
    const needsWhatsapp = isWhatsappOnly || includes360 || mediaTypes.includes('whatsapp');
    const needsBanner = includes360 || mediaTypes.includes('banner');

    try {
      // === VISUALS (ads/banners) ===
      if (needsVisuals) {
        setIsGenerating(true);
        setGeneratedImages([]);
        toast.info('מייצר את העיצובים על בסיס הקונספט שבחרת... 🎨');
        
        const results: GeneratedImage[] = [];
        const numSketches = includes360 ? 4 : mediaTypes.includes('banner') ? 2 : 4;
        
        for (let i = 0; i < numSketches; i++) {
          toast.info(`מייצר סקיצה ${i + 1} מתוך ${numSketches}...`);
          const imageUrl = await generateImageForConcept(selectedConcept, i, brandContext, campaignContext);
          if (imageUrl) {
            const newImage: GeneratedImage = { id: `${Date.now()}-${i}`, url: imageUrl, status: 'pending' };
            results.push(newImage);
            setGeneratedImages([...results]);

            toast.info(`מריץ בדיקת כשרות לסקיצה ${i + 1}... 🔍`);
            const kosherResult = await runKosherCheck(imageUrl);
            newImage.status = kosherResult.status as GeneratedImage['status'];
            newImage.analysis = kosherResult.recommendation;
            setGeneratedImages([...results]);

            await supabase.from('generated_images')
              .update({ kosher_status: kosherResult.status, kosher_analysis: kosherResult.recommendation })
              .eq('image_url', imageUrl);
          }
        }

        if (results.length > 0) {
          const approved = results.filter(r => r.status === 'approved').length;
          const needsReview = results.filter(r => r.status === 'needs-review').length;
          const rejected = results.filter(r => r.status === 'rejected').length;
          if (approved > 0) toast.success(`${approved} סקיצות אושרו! בסייעתא דשמיא`);
          if (needsReview > 0) toast.warning(`${needsReview} סקיצות דורשות בדיקה אנושית`);
          if (rejected > 0) toast.error(`${rejected} סקיצות נדחו ע"י המשגיח הדיגיטלי`);
          // Auto-save campaign as draft
          await saveCampaignDraft(results);
        } else {
          toast.error('לא הצלחנו ליצור תמונות. נסה שוב.');
        }
        setIsGenerating(false);
      }
      if (needsBanner && includes360) {
        setShowAutopilotBanner(true);
        setIsGeneratingBanner(true);
        toast.info('מייצר באנר דיגיטלי... 🖥️');
        const bannerCampaignContext = { ...campaignContext, mediaFormat: 'banner' };
        generateImageForConcept(selectedConcept, 99, brandContext, bannerCampaignContext)
          .then((bannerUrl) => {
            if (bannerUrl) { setAutopilotBannerUrl(bannerUrl); toast.success('באנר דיגיטלי נוצר! 🖥️'); }
          }).catch(() => {}).finally(() => setIsGeneratingBanner(false));
      }

      // === RADIO ===
      if (needsRadio) {
        setShowAutopilotRadio(true);
        setIsGeneratingRadio(true);
        toast.info('מייצר ספוט רדיו... 🎙️');
        supabase.functions.invoke('generate-radio-script', {
          body: {
            brief: {
              offer: campaignBrief.offer,
              adGoal: campaignBrief.adGoal,
              goal: campaignBrief.goal,
              emotionalTone: campaignBrief.emotionalTone,
              priceOrBenefit: campaignBrief.priceOrBenefit,
              timeLimitText: campaignBrief.timeLimitText,
            },
            brandContext: {
              businessName: clientProfile?.business_name,
              targetAudience: clientProfile?.target_audience,
            },
            targetGender: mediaTargetGender,
            targetStream: mediaTargetStream,
            contactPhone: clientProfile?.contact_phone || '',
          },
        }).then(({ data, error }) => {
          if (error) {
            console.error('Radio script error:', error);
            toast.error('שגיאה ביצירת תשדיר רדיו');
          } else if (data?.scripts?.length) {
            const bestScript = data.scripts[0];
            setAutopilotRadioScript({
              title: bestScript.title || 'ספוט רדיו',
              script: bestScript.scriptWithNikud || bestScript.script || '',
              duration: bestScript.duration,
              voiceNotes: bestScript.voiceNotes,
            });
            toast.success('תשדיר רדיו נוצר! 🎙️');
          } else if (data?.error) {
            console.error('Radio API error:', data.error);
            toast.error(`שגיאה ביצירת תשדיר: ${data.error}`);
          } else {
            toast.error('לא התקבל תשדיר רדיו — נסה שוב');
          }
        }).catch(() => {
          toast.error('שגיאה ביצירת תשדיר רדיו');
        }).finally(() => setIsGeneratingRadio(false));
      }

      // === ARTICLE ===
      if (needsArticle) {
        setShowAutopilotArticle(true);
        setIsGeneratingArticle(true);
        toast.info('כותב כתבה פרסומית... 📰');
        supabase.functions.invoke('generate-internal-material', {
          body: {
            type: 'article',
            profileData,
            extraContext: {
              articleStyle: 'product',
              articleTopic: campaignBrief.offer || selectedConcept?.idea || '',
              targetLength: 'medium',
              articleSubType: articleSubType || 'text-only',
              userPrompt: selectedConcept ? `הכתבה צריכה להתבסס על הקונספט: ${selectedConcept.headline} — ${selectedConcept.copy}` : '',
            },
          },
        }).then(({ data, error }) => {
          if (error || data?.error) { toast.error(typeof data?.error === 'string' ? data.error : 'שגיאה ביצירת כתבה'); return; }
          if (data?.result) { setAutopilotArticle(data.result); toast.success('כתבה פרסומית נוצרה! 📰'); }
        }).catch(() => toast.error('שגיאה ביצירת כתבה')).finally(() => setIsGeneratingArticle(false));
      }

      // === EMAIL ===
      if (needsEmail) {
        setShowAutopilotEmail(true);
        setIsGeneratingEmail(true);
        toast.info('כותב מייל שיווקי... 📧');
        supabase.functions.invoke('generate-internal-material', {
          body: {
            type: 'email',
            profileData,
            extraContext: {
              emailTopic: campaignBrief.offer || selectedConcept?.idea || '',
              emailSubType: emailSubType || 'text-only',
              userPrompt: selectedConcept ? `המייל צריך להתבסס על הקונספט: ${selectedConcept.headline} — ${selectedConcept.copy}` : '',
            },
          },
        }).then(({ data, error }) => {
          if (error || data?.error) { toast.error(typeof data?.error === 'string' ? data.error : 'שגיאה ביצירת מייל'); return; }
          if (data?.result) { setAutopilotEmailContent(data.result); toast.success('מייל שיווקי נוצר! 📧'); }
        }).catch(() => toast.error('שגיאה ביצירת מייל')).finally(() => setIsGeneratingEmail(false));
      }

      // === WHATSAPP ===
      if (needsWhatsapp) {
        setShowAutopilotWhatsapp(true);
        setIsGeneratingWhatsapp(true);
        toast.info('כותב מסר לוואטסאפ... 💬');
        supabase.functions.invoke('generate-internal-material', {
          body: {
            type: 'whatsapp',
            profileData,
            extraContext: {
              whatsappTopic: campaignBrief.offer || selectedConcept?.idea || '',
              whatsappSubType: whatsappSubType || 'distribution',
              userPrompt: selectedConcept ? `המסר צריך להתבסס על הקונספט: ${selectedConcept.headline} — ${selectedConcept.copy}` : '',
            },
          },
        }).then(({ data, error }) => {
          if (error || data?.error) { toast.error(typeof data?.error === 'string' ? data.error : 'שגיאה ביצירת מסר וואטסאפ'); return; }
          if (data?.result) { setAutopilotWhatsappContent(data.result); toast.success('מסר וואטסאפ נוצר! 💬'); }
        }).catch(() => toast.error('שגיאה ביצירת מסר וואטסאפ')).finally(() => setIsGeneratingWhatsapp(false));
      }

      // For non-visual-only types, ensure results view is shown
      if (!needsVisuals) {
        setShowResults(true);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה ביצירת התוצרים');
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            {/* WhatsApp Sub-type Selector */}
            {mediaTypes.length === 1 && mediaTypes[0] === 'whatsapp' && (
              <div className="mb-8 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg flex items-center justify-center mb-3">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">איזה סוג פרסום בוואטסאפ?</h2>
                  <p className="text-muted-foreground">בחר את הפורמט המתאים לך</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                  {/* Status */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.02]',
                      whatsappSubType === 'status'
                        ? 'border-green-500 bg-green-500/10 shadow-lg ring-2 ring-green-400/30'
                        : 'border-border hover:border-green-500/50'
                    )}
                    onClick={() => { setWhatsappSubType('status'); setAspectRatio('portrait'); }}
                  >
                    <div className="p-5 flex flex-col items-center text-center">
                      <div className="w-10 h-16 bg-muted rounded-lg mb-3 flex items-center justify-center border border-border">
                        <span className="text-xs text-muted-foreground">9:16</span>
                      </div>
                      <h4 className="text-lg font-bold text-foreground">סטטוס</h4>
                      <p className="text-xs text-muted-foreground mt-1">מודעה לגובה + משפט קצר נלווה</p>
                      {whatsappSubType === 'status' && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </Card>
                  {/* Distribution */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.02]',
                      whatsappSubType === 'distribution'
                        ? 'border-green-500 bg-green-500/10 shadow-lg ring-2 ring-green-400/30'
                        : 'border-border hover:border-green-500/50'
                    )}
                    onClick={() => { setWhatsappSubType('distribution'); setAspectRatio('square'); }}
                  >
                    <div className="p-5 flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-muted rounded-lg mb-3 flex items-center justify-center border border-border">
                        <span className="text-xs text-muted-foreground">1:1</span>
                      </div>
                      <h4 className="text-lg font-bold text-foreground">הפצות</h4>
                      <p className="text-xs text-muted-foreground mt-1">קוביה מרובעת + טקסט נלווה עם קישורים</p>
                      {whatsappSubType === 'distribution' && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Email Sub-type Selector */}
            {mediaTypes.length === 1 && mediaTypes[0] === 'email' && (
              <div className="mb-8 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center mb-3">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">איזה סוג מייל?</h2>
                  <p className="text-muted-foreground">בחר אם אתה רוצה רק מלל או גם עיצוב נלווה</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                  {/* Text Only */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.02]',
                      emailSubType === 'text-only'
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-400/30'
                        : 'border-border hover:border-blue-500/50'
                    )}
                    onClick={() => setEmailSubType('text-only')}
                  >
                    <div className="p-5 flex flex-col items-center text-center">
                      <Type className="w-10 h-10 text-muted-foreground mb-3" />
                      <h4 className="text-lg font-bold text-foreground">רק מלל</h4>
                      <p className="text-xs text-muted-foreground mt-1">כותרת, גוף המייל ו-CTA בלבד</p>
                      {emailSubType === 'text-only' && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </Card>
                  {/* With Design */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.02]',
                      emailSubType === 'with-design'
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-400/30'
                        : 'border-border hover:border-blue-500/50'
                    )}
                    onClick={() => setEmailSubType('with-design')}
                  >
                    <div className="p-5 flex flex-col items-center text-center">
                      <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
                      <h4 className="text-lg font-bold text-foreground">מלל + עיצוב נלווה</h4>
                      <p className="text-xs text-muted-foreground mt-1">טקסט שיווקי עם תמונה/באנר מעוצב</p>
                      {emailSubType === 'with-design' && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Article Sub-type Selector */}
            {mediaTypes.length === 1 && mediaTypes[0] === 'article' && (
              <div className="mb-8 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg flex items-center justify-center mb-3">
                    <Newspaper className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">איזה סוג כתבה?</h2>
                  <p className="text-muted-foreground">בחר אם אתה רוצה רק מלל או כתבה מעוצבת עם תמונות</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                  {/* Text Only */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.02]',
                      articleSubType === 'text-only'
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-2 ring-amber-400/30'
                        : 'border-border hover:border-amber-500/50'
                    )}
                    onClick={() => setArticleSubType('text-only')}
                  >
                    <div className="p-5 flex flex-col items-center text-center">
                      <Type className="w-10 h-10 text-muted-foreground mb-3" />
                      <h4 className="text-lg font-bold text-foreground">רק מלל</h4>
                      <p className="text-xs text-muted-foreground mt-1">כותרת, גוף כתבה, ציטוט ו-CTA בלבד</p>
                      {articleSubType === 'text-only' && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </Card>
                  {/* Designed Article */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group hover:scale-[1.02]',
                      articleSubType === 'with-design'
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-2 ring-amber-400/30'
                        : 'border-border hover:border-amber-500/50'
                    )}
                    onClick={() => setArticleSubType('with-design')}
                  >
                    <div className="p-5 flex flex-col items-center text-center">
                      <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
                      <h4 className="text-lg font-bold text-foreground">כתבה מעוצבת</h4>
                      <p className="text-xs text-muted-foreground mt-1">טקסט + הנחיות לתמונות ועיצוב עיתונאי</p>
                      {articleSubType === 'with-design' && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
            
            {/* Brief Step */}
            <StudioBriefStep 
              value={campaignBrief} 
              onChange={setCampaignBrief}
              businessName={clientProfile?.business_name}
              campaignScope={assetChoice}
              mediaTypes={mediaTypes}
              contactInfo={clientProfile ? {
                contact_phone: clientProfile.contact_phone,
                contact_whatsapp: clientProfile.contact_whatsapp,
                contact_email: clientProfile.contact_email,
                contact_address: clientProfile.contact_address,
                contact_youtube: clientProfile.contact_youtube,
                social_facebook: clientProfile.social_facebook,
                social_instagram: clientProfile.social_instagram,
                opening_hours: (clientProfile as any).opening_hours || null,
                branches: (clientProfile as any).branches || null,
                logo_url: clientProfile.logo_url || null,
              } : undefined}
              brandColors={clientProfile ? {
                primary_color: clientProfile.primary_color,
                secondary_color: clientProfile.secondary_color,
                background_color: clientProfile.background_color,
              } : undefined}
            />
          </>
        );
      // Steps 1 and 2 are now handled by StudioProductPicker before wizard
      case 3:
        return (
          <StudioTreatmentStep
            treatment={treatment}
            onTreatmentChange={setTreatment}
            uploadedImage={uploadedImage}
            onImageUpload={setUploadedImage}
            flowType={assetChoice === 'full-campaign' ? 'full-campaign' : assetChoice === 'has-visual' ? 'has-visual' : 'default'}
            copyText={userCopyText}
            onCopyTextChange={setUserCopyText}
          />
        );
      case 4:
        return (
          <StudioCopyStep
            value={copyChoice}
            onChange={setCopyChoice}
            copyText={userCopyText}
            onCopyTextChange={setUserCopyText}
          />
        );
      case 5:
        return <StudioStyleStep value={style} onChange={setStyle} />;
      case 7:
        return (
          <StudioDesignApproachStep
            value={designApproach}
            onChange={setDesignApproach}
            hasPastMaterials={!!clientProfile?.past_materials?.some((m: any) => m.adAnalysis)}
            pastMaterials={clientProfile?.past_materials || []}
            selectedReference={designReference}
            onSelectReference={setDesignReference}
          />
        );
      case 6:
        return (
          <StudioPromptStep
            visualPrompt={visualPrompt}
            onVisualPromptChange={setVisualPrompt}
            textPrompt={textPrompt}
            onTextPromptChange={setTextPrompt}
            style={style}
            hasProduct={assetChoice === 'has-visual' || assetChoice === 'full-campaign'}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            mediaType={mediaTypes[0] || null}
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
          />
        );
      case 8:
        return (
          <RadioScriptStep
            brief={{
              offer: campaignBrief.offer,
              adGoal: campaignBrief.adGoal,
              goal: campaignBrief.goal,
              emotionalTone: campaignBrief.emotionalTone,
              priceOrBenefit: campaignBrief.priceOrBenefit,
              timeLimitText: campaignBrief.timeLimitText,
            }}
            brandContext={clientProfile ? {
              businessName: clientProfile.business_name,
              targetAudience: clientProfile.target_audience,
            } : null}
            targetGender={mediaTargetGender}
            targetStream={mediaTargetStream}
            contactPhone={clientProfile?.contact_phone || ''}
            clientProfileId={clientProfile?.id}
            onComplete={() => {
              setShowResults(false);
              setShowMediaSelection(true);
            }}
          />
        );
      default:
        return null;
    }
  };

  const isTextOnlyFlow = mediaTypes.length > 0 && mediaTypes.every(t => ['radio', 'article', 'email', 'whatsapp'].includes(t));

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-assistant flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                סטודיו יצירתי
              </h1>
              <p className="text-sm text-muted-foreground">יוצרים מודעות בסייעתא דשמיא</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/brain">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 ml-2" />
                בית הספר
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {!showResults ? (
          <div className="max-w-3xl mx-auto">
            {/* Product Picker Screen - shown first before any wizard steps */}
            {mode === null ? (
              <div className="py-4 space-y-8">
                <StudioProductPicker onComplete={handleProductPickerComplete} detectedIndustry={detectedIndustry} />
                <CampaignHistoryStrip />
              </div>
            ) : mode === 'autopilot' ? (
              /* Autopilot Mode */
              <div>
                {/* Back to product picker */}
                <button
                  onClick={() => { setMode(null); setMediaTypes([]); setAssetChoice(null); }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>חזרה לבחירת מוצר</span>
                </button>
                {/* Engine Version Selector */}
                <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-muted/50 border border-border" dir="rtl">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">🍌 מנוע:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEngineVersion('nano-banana-pro')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        engineVersion === 'nano-banana-pro'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                      }`}
                    >
                      Nano Banana Pro
                    </button>
                    <button
                      onClick={() => setEngineVersion('nano-banana')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        engineVersion === 'nano-banana'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                      }`}
                    >
                      Nano Banana
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground mr-auto">
                    {engineVersion === 'nano-banana-pro' ? 'איכות מקסימלית, יותר איטי' : 'מהיר יותר, איכות טובה'}
                  </span>
                </div>
                
                <StudioAutopilot
                  isGenerating={isGeneratingConcepts || isGenerating}
                  concepts={concepts}
                  selectedConcept={selectedConcept}
                  clientInfo={clientProfile ? {
                    business_name: clientProfile.business_name,
                    target_audience: clientProfile.target_audience
                  } : null}
                  selectedMediaTypes={mediaTypes}
                  onMediaTypesChange={setMediaTypes}
                  onGenerateConcepts={handleGenerateConcepts}
                  onSelectConcept={setSelectedConcept}
                  onExecuteConcept={handleExecuteConcept}
                  selectedHoliday={selectedHoliday}
                  onHolidayChange={setSelectedHoliday}
                  brief={{
                    offer: campaignBrief.offer,
                    goal: campaignBrief.goal,
                  }}
                  onBriefChange={(newBrief) => {
                    setCampaignBrief(prev => ({
                      ...prev,
                      offer: newBrief.offer,
                      goal: newBrief.goal,
                    }));
                  }}
                />
              </div>
            ) : (
              /* Manual Mode */
              <div>
                {/* Removed separate "back to mode selection" button - now handled by main back button */}
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      שלב {actualStepIndex + 1} מתוך {totalSteps}
                    </span>
                    <span className="text-sm font-medium">{getStepTitles(mediaTypes, assetChoice)[currentStep]}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${((actualStepIndex + 1) / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                  {renderStep()}
                </div>

                {/* Navigation - hidden for radio step which manages its own flow */}
                {currentStep !== 8 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                  >
                    <ChevronRight className="h-4 w-4 ml-1" />
                    הקודם
                  </Button>

                  {isFinalStep() ? (
                    // Final step button - different action based on flow type
                    assetChoice === 'full-campaign' || assetChoice === 'has-visual' ? (
                      // Upload flows - submit directly
                      <Button
                        onClick={() => {
                          toast.success('החומרים הועלו בהצלחה! 📦');
                          setShowResults(true);
                        }}
                        disabled={!canProceed()}
                        variant="gradient"
                        className="min-w-[160px]"
                      >
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                        {assetChoice === 'full-campaign' ? 'שלח קמפיין' : 'שלח ויז\'ואל לעיבוד'}
                      </Button>
                    ) : mediaTypes.length === 1 && ['article', 'email', 'whatsapp'].includes(mediaTypes[0]) ? (
                      // Text-only media — generate the specific content type
                      <Button
                        onClick={() => {
                          // Route to the autopilot concept generation which handles all media types
                          handleGenerateConcepts();
                        }}
                        disabled={!canProceed() || isGeneratingConcepts || isGenerating}
                        variant="gradient"
                        className="min-w-[160px]"
                      >
                        {isGeneratingConcepts || isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            מייצר...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 ml-2" />
                            {mediaTypes[0] === 'article' ? 'צור כתבה' : mediaTypes[0] === 'email' ? 'צור מייל' : 'צור הודעת וואטסאפ'}
                          </>
                        )}
                      </Button>
                    ) : (
                      // Generation flows - generate visuals
                      <Button
                        onClick={handleGenerate}
                        disabled={!canProceed() || isGenerating}
                        variant="gradient"
                        className="min-w-[160px]"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            מייצר...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 ml-2" />
                            צור עיצובים
                          </>
                        )}
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={handleNextAttempt}
                    >
                      הבא
                      <ChevronLeft className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>
                )}
              </div>
            )}
          </div>
        ) : showSuccess ? (
          /* Success View */
          <SuccessScreen onReset={() => { setShowSuccess(false); resetWizard(); }} />
        ) : showFormatAdaptation ? (
          /* Format Adaptation View */
          <div className="py-6">
            <FormatAdaptation
              creativeUrls={generatedImages
                .filter(img => img.status === 'approved' || img.status === 'needs-review')
                .map(img => img.url)}
              mediaSpecIds={selectedMediaPackage?.items.map(item => item.id) || []}
              onComplete={handleFormatAdaptationComplete}
              onBack={() => { setShowFormatAdaptation(false); setShowQuote(true); }}
            />
          </div>
        ) : showQuote ? (
          /* Quote View */
          <div className="py-6">
            <div className="mb-6 flex items-center justify-between">
              <Button variant="ghost" onClick={() => { setShowQuote(false); setShowMediaSelection(true); }}>
                <ChevronRight className="h-4 w-4 ml-1" />
                חזרה לבחירת מדיה
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportAllPrint}
              >
                <FileDown className="h-4 w-4" />
                PDF לדפוס
              </Button>
            </div>
            <StudioQuoteStep
              quoteData={getQuoteData()}
              isSubmitting={isSubmittingQuote}
              onApprove={handleApproveQuote}
              onConsult={handleConsultAgent}
            />
          </div>
        ) : showMediaSelection ? (
          /* Media Selection View */
          <div className="max-w-4xl mx-auto py-6">
            <div className="mb-6">
              <Button variant="ghost" onClick={handleBackToResults} className="mb-4">
                <ChevronRight className="h-4 w-4 ml-1" />
                חזרה לסקיצות
              </Button>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">תאריכים, תקציב ומדיה</h2>
                <p className="text-muted-foreground">הגדר את לוח הזמנים, התקציב וקהל היעד</p>
              </div>
            </div>
            
            <BudgetAudienceStep
              budget={mediaBudget}
              onBudgetChange={setMediaBudget}
              startDate={mediaStartDate}
              onStartDateChange={setMediaStartDate}
              endDate={mediaEndDate}
              onEndDateChange={setMediaEndDate}
              targetStream={mediaTargetStream}
              onTargetStreamChange={setMediaTargetStream}
              targetGender={mediaTargetGender}
              onTargetGenderChange={setMediaTargetGender}
              targetCity={mediaTargetCity}
              onTargetCityChange={setMediaTargetCity}
              selectedPackage={selectedMediaPackage}
              onPackageSelect={setSelectedMediaPackage}
              selectedMediaTypes={mediaTypes}
            />

            {/* Continue to Quote Button */}
            <div className="flex justify-center pt-8 mt-8 border-t border-border">
              <Button 
                size="lg" 
                onClick={handleProceedToQuote} 
                disabled={!selectedMediaPackage}
                variant="gradient"
                className="h-14 px-8 text-lg gap-2"
              >
                מתקדמים להזמנת מדיה
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* CLIENT VIEW — clean, no pipeline, no kosher notes */}
            {!isAdmin ? (
              <>
                {!isTextOnlyFlow && generatedImages.length === 0 && isGenerating ? (
                  <ClientLoadingTimer 
                    isGenerating={isGenerating} 
                    sketchCount={3} 
                    completedCount={generatedImages.filter(img => img.status !== 'pending').length} 
                  />
                ) : !isTextOnlyFlow && generatedImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <ImageIcon className="h-16 w-16 mb-4 opacity-30" />
                    <p>לא נוצרו תמונות</p>
                  </div>
                ) : !isTextOnlyFlow ? (
                  <ClientResultsView
                    images={generatedImages}
                    businessName={clientProfile?.business_name}
                    onRequestFix={(imageId, feedback) => {
                      const img = generatedImages.find(i => i.id === imageId);
                      if (img) {
                        handleSubmitFeedback([{ component: 'headline' as AdComponent, text: feedback }]);
                      }
                    }}
                    onApproveAndDownload={(imageIds) => {
                      const imgs = generatedImages.filter(i => imageIds.includes(i.id));
                      imgs.forEach(img => {
                        const link = document.createElement('a');
                        link.href = img.url;
                        link.download = `sketch-${img.id}.png`;
                        link.click();
                      });
                      toast.success(`${imgs.length} סקיצות הורדו בהצלחה! 📥`);
                    }}
                    onSendToMedia={(imageIds) => {
                      setShowResults(false);
                      setShowMediaSelection(true);
                    }}
                    onStartOver={() => {
                      setShowResults(false);
                      setCurrentStep(0);
                    }}
                  />
                ) : null}
              </>
            ) : (
            /* ADMIN VIEW — full pipeline, debug, kosher notes */
            <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {isTextOnlyFlow ? 'התוצרים שלך' : 'הסקיצות שלך'}
              </h2>
              <div className="flex gap-2">
                {/* PDF export button hidden - available after approval in media flow */}
                <Button variant="outline" onClick={() => {
                  setShowResults(false);
                  setCurrentStep(0);
                }}>
                  התחל מחדש
                </Button>
              </div>
            </div>

            {/* Template auto-selected by system based on client style — no manual selector */}

            {/* Agent Pipeline Debug Panel */}
            <AgentPipelineDebug steps={pipelineSteps} isVisible={showPipeline} />

            {!isTextOnlyFlow && generatedImages.length === 0 && isGenerating ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>מייצר את העיצובים שלך...</p>
              </div>
            ) : !isTextOnlyFlow && generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-4 opacity-30" />
                <p>לא נוצרו תמונות</p>
              </div>
            ) : generatedImages.length > 0 ? (
              <>
                {/* Series mode: group by series */}
                {generatedImages.some(img => img.seriesIndex !== undefined) ? (
                  <div className="space-y-8">
                    {[0, 1].map(sIdx => {
                      const seriesImages = generatedImages.filter(img => img.seriesIndex === sIdx);
                      if (seriesImages.length === 0) return null;
                      return (
                        <div key={sIdx}>
                          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">סדרה {sIdx + 1}</Badge>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {seriesImages.map((image) => (
                              <Card key={image.id} className={`overflow-hidden group ${image.status === 'rejected' ? 'opacity-50' : ''}`}>
                                <div className={`relative bg-muted ${
                                  mediaTypes.includes('banner') ? 'aspect-[4/1]' : 'aspect-square'
                                }`}>
                                  <img src={image.url} alt={`סדרה ${sIdx + 1} מודעה ${(image.adIndex ?? 0) + 1}`} className="w-full h-full object-cover" />
                                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                    <Badge className="bg-primary text-primary-foreground text-xs">
                                      מודעה {(image.adIndex ?? 0) + 1}
                                    </Badge>
                                    {getStatusBadge(image.status)}
                                    {image.model && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background/80 backdrop-blur-sm border-border/50 font-mono">
                                        🍌 {image.model.includes('3.1-flash') ? 'Nano Banana 2' : image.model.includes('2.5-flash') ? 'Nano Banana' : image.model.split('/').pop()?.substring(0, 20)}
                                      </Badge>
                                    )}
                                  </div>
                                  {image.analysis && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-xs">{image.analysis}</div>
                                  )}
                                  {image.status !== 'rejected' && image.status !== 'pending' && (
                                    <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setEnlargedImage(image)}>
                                      <Button size="sm" variant="secondary" className="gap-1.5">
                                        <ZoomIn className="h-4 w-4" />
                                        הגדל וערוך טקסט
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Normal (non-series) grid */
                  <div className={
                    mediaTypes.includes('banner') 
                      ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' 
                      : generatedImages.length === 3
                      ? 'grid grid-cols-1 sm:grid-cols-3 gap-4'
                      : generatedImages.length === 4
                      ? 'grid grid-cols-2 lg:grid-cols-4 gap-4'
                      : 'grid grid-cols-2 lg:grid-cols-3 gap-4'
                  }>
                    {generatedImages.map((image) => (
                      <Card key={image.id} className={`overflow-hidden group ${image.status === 'rejected' ? 'opacity-50' : ''}`}>
                        <div className={`relative bg-muted ${
                          mediaTypes.includes('banner') 
                            ? 'aspect-[4/1]' 
                            : mediaTypes.includes('whatsapp')
                            ? 'aspect-square'
                            : 'aspect-square'
                        }`}>
                          <img src={image.url} alt={`Generated ${image.id}`} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                            {getStatusBadge(image.status)}
                            {image.model && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background/80 backdrop-blur-sm border-border/50 font-mono">
                                🍌 {image.model.includes('3.1-flash') ? 'Nano Banana 2' : image.model.includes('2.5-flash') ? 'Nano Banana' : image.model.split('/').pop()?.substring(0, 20)}
                              </Badge>
                            )}
                          </div>
                          {image.analysis && (
                            <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-xs">{image.analysis}</div>
                          )}
                          {image.status !== 'rejected' && image.status !== 'pending' && (
                            <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setEnlargedImage(image)}>
                              <Button size="sm" variant="secondary" className="gap-1.5">
                                <ZoomIn className="h-4 w-4" />
                                הגדל וערוך טקסט
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Radio Script Section */}
                {showAutopilotRadio && (
                  <div className="mt-10 pt-8 border-t-2 border-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                        <Radio className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">תשדיר רדיו</h3>
                        <p className="text-sm text-muted-foreground">{mediaTypes.includes('all') ? 'חלק מקמפיין 360° שלך' : 'ספוט רדיו מוכן לשידור'}</p>
                      </div>
                    </div>
                    {isGeneratingRadio || isRegenerating === 'radio' ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">{isRegenerating === 'radio' ? 'מעדכן תשדיר...' : 'כותב תשדיר רדיו...'}</span>
                      </div>
                    ) : autopilotRadioScript ? (
                      <Card className="border-primary/20">
                        <div className="p-6" dir="rtl">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <h4 className="text-lg font-bold text-foreground">{autopilotRadioScript.title}</h4>
                            {autopilotRadioScript.duration && (
                              <Badge variant="secondary">{autopilotRadioScript.duration}</Badge>
                            )}
                          </div>
                          {editingRadio ? (
                            <Textarea
                              value={autopilotRadioScript.script}
                              onChange={(e) => setAutopilotRadioScript({ ...autopilotRadioScript, script: e.target.value })}
                              className="min-h-[150px] text-sm mb-4"
                              dir="rtl"
                            />
                          ) : (
                            <div 
                              className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line mb-4 cursor-pointer rounded-lg p-3 -m-3 transition-all hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 group relative"
                              onClick={() => { if (fixRequestPlatform !== 'radio') setFixRequestPlatform('radio'); }}
                            >
                              {autopilotRadioScript.script}
                              <span className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary flex items-center gap-1">
                                <Pencil className="h-3 w-3" /> לחץ לתיקונים
                              </span>
                            </div>
                          )}
                          {autopilotRadioScript.voiceNotes && !editingRadio && (
                            <div className="text-xs text-muted-foreground mb-4">הנחיות קריינות: {autopilotRadioScript.voiceNotes}</div>
                          )}
                          
                          {/* Fix request form */}
                          {fixRequestPlatform === 'radio' && (
                            <Card className="p-4 mb-4 border-2 border-primary/30 bg-primary/5 animate-fade-in">
                              <p className="text-sm font-medium mb-2">מה לשנות בתשדיר?</p>
                              <Textarea
                                value={platformFixText}
                                onChange={(e) => setPlatformFixText(e.target.value)}
                                placeholder="למשל: הטון צריך להיות יותר מכירתי, תוסיף את המספר טלפון..."
                                className="min-h-[80px] text-sm mb-3"
                                dir="rtl"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handlePlatformFix('radio')} disabled={!platformFixText.trim()}>
                                  <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                                  עדכן
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setFixRequestPlatform(null); setPlatformFixText(''); }}>ביטול</Button>
                              </div>
                            </Card>
                          )}
                          
                          {/* Audio Player */}
                          {radioAudioUrl && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-3">
                              <Button
                                onClick={toggleRadioPlayback}
                                size="sm"
                                className="rounded-full w-9 h-9 p-0 bg-gradient-to-br from-violet-500 to-purple-600"
                              >
                                {isPlayingRadio ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white mr-[-1px]" />}
                              </Button>
                              <span className="text-sm text-foreground">הקריינות מוכנה</span>
                              <Button variant="ghost" size="sm" onClick={() => {
                                const a = document.createElement('a');
                                a.href = radioAudioUrl;
                                a.download = `radio-${clientProfile?.business_name || 'script'}.mp3`;
                                a.click();
                              }}>
                                <FileDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={handleGenerateRadioTts}
                              disabled={isGeneratingTts}
                              className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                            >
                              {isGeneratingTts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
                              {isGeneratingTts ? 'מייצר קריינות...' : radioAudioUrl ? 'צור קריינות מחדש' : 'צור קריינות 🎙️'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(autopilotRadioScript.script); toast.success('התשדיר הועתק!'); }}>
                              העתק תשדיר
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingRadio(!editingRadio)}>
                              <Pencil className="h-3.5 w-3.5 ml-1.5" />
                              {editingRadio ? 'סיום עריכה' : 'ערוך'}
                            </Button>
                            {!editingRadio && fixRequestPlatform !== 'radio' && (
                              <Button variant="outline" size="sm" onClick={() => setFixRequestPlatform('radio')}>
                                <MessageSquare className="h-3.5 w-3.5 ml-1.5" />
                                בקש תיקונים
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="text-center p-8 text-muted-foreground">
                        <p>לא הצלחנו ליצור תשדיר רדיו. נסה שוב.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Article Section for 360° campaigns */}
                {showAutopilotArticle && (
                  <div className="mt-10 pt-8 border-t-2 border-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
                        <Newspaper className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">כתבה פרסומית</h3>
                        <p className="text-sm text-muted-foreground">חלק מקמפיין 360° שלך</p>
                      </div>
                    </div>
                    {isGeneratingArticle || isRegenerating === 'article' ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">{isRegenerating === 'article' ? 'מעדכן כתבה...' : 'כותב כתבה פרסומית...'}</span>
                      </div>
                    ) : autopilotArticle ? (
                      <Card className="border-primary/20">
                        <div className="p-6" dir="rtl">
                          {editingArticle ? (
                            <div className="space-y-3">
                              <input
                                value={autopilotArticle.headline}
                                onChange={(e) => setAutopilotArticle({ ...autopilotArticle, headline: e.target.value })}
                                className="w-full text-xl font-bold bg-transparent border-b border-primary/30 pb-1 focus:outline-none focus:border-primary"
                                dir="rtl"
                              />
                              <input
                                value={autopilotArticle.subheadline}
                                onChange={(e) => setAutopilotArticle({ ...autopilotArticle, subheadline: e.target.value })}
                                className="w-full text-base text-muted-foreground bg-transparent border-b border-border pb-1 focus:outline-none focus:border-primary"
                                dir="rtl"
                              />
                              <Textarea
                                value={autopilotArticle.body}
                                onChange={(e) => setAutopilotArticle({ ...autopilotArticle, body: e.target.value })}
                                className="min-h-[200px] text-sm"
                                dir="rtl"
                              />
                              <input
                                value={autopilotArticle.pullQuote}
                                onChange={(e) => setAutopilotArticle({ ...autopilotArticle, pullQuote: e.target.value })}
                                className="w-full text-sm italic bg-transparent border-b border-border pb-1 focus:outline-none focus:border-primary"
                                placeholder="ציטוט"
                                dir="rtl"
                              />
                              <input
                                value={autopilotArticle.callToAction}
                                onChange={(e) => setAutopilotArticle({ ...autopilotArticle, callToAction: e.target.value })}
                                className="w-full text-sm bg-transparent border-b border-border pb-1 focus:outline-none focus:border-primary text-primary"
                                placeholder="הנעה לפעולה"
                                dir="rtl"
                              />
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer rounded-lg p-3 -m-3 transition-all hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 group relative"
                              onClick={() => { if (fixRequestPlatform !== 'article') setFixRequestPlatform('article'); }}
                            >
                              <span className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary flex items-center gap-1">
                                <Pencil className="h-3 w-3" /> לחץ לתיקונים
                              </span>
                              <h4 className="text-xl font-bold text-foreground mb-1">{autopilotArticle.headline}</h4>
                              <h5 className="text-base text-muted-foreground mb-4">{autopilotArticle.subheadline}</h5>
                              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line mb-4">
                                {autopilotArticle.body}
                              </div>
                              {autopilotArticle.pullQuote && (
                                <div className="border-r-4 border-primary pr-3 py-2 my-4 bg-primary/5 rounded-l-lg">
                                  <p className="text-sm font-medium italic">"{autopilotArticle.pullQuote}"</p>
                                </div>
                              )}
                              {autopilotArticle.callToAction && (
                                <p className="text-sm text-primary font-medium">{autopilotArticle.callToAction}</p>
                              )}
                            </div>
                          )}
                          
                          {/* Fix request form */}
                          {fixRequestPlatform === 'article' && (
                            <Card className="p-4 my-4 border-2 border-primary/30 bg-primary/5 animate-fade-in">
                              <p className="text-sm font-medium mb-2">מה לשנות בכתבה?</p>
                              <Textarea
                                value={platformFixText}
                                onChange={(e) => setPlatformFixText(e.target.value)}
                                placeholder="למשל: הכותרת לא מספיק חזקה, תשנה את הטון ליותר מקצועי..."
                                className="min-h-[80px] text-sm mb-3"
                                dir="rtl"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handlePlatformFix('article')} disabled={!platformFixText.trim()}>
                                  <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                                  עדכן
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setFixRequestPlatform(null); setPlatformFixText(''); }}>ביטול</Button>
                              </div>
                            </Card>
                          )}
                          
                          <div className="flex gap-2 flex-wrap mt-4">
                            <Button variant="outline" size="sm" onClick={() => {
                              const text = `${autopilotArticle.headline}\n${autopilotArticle.subheadline}\n\n${autopilotArticle.body}\n\n"${autopilotArticle.pullQuote}"\n\n${autopilotArticle.callToAction}`;
                              navigator.clipboard.writeText(text);
                              toast.success('הכתבה הועתקה!');
                            }}>
                              העתק כתבה
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingArticle(!editingArticle)}>
                              <Pencil className="h-3.5 w-3.5 ml-1.5" />
                              {editingArticle ? 'סיום עריכה' : 'ערוך'}
                            </Button>
                            {!editingArticle && fixRequestPlatform !== 'article' && (
                              <Button variant="outline" size="sm" onClick={() => setFixRequestPlatform('article')}>
                                <MessageSquare className="h-3.5 w-3.5 ml-1.5" />
                                בקש תיקונים
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                )}

                {/* Banner Section for 360° campaigns */}
                {showAutopilotBanner && (
                  <div className="mt-10 pt-8 border-t-2 border-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-teal-500/30 flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">באנר דיגיטלי</h3>
                        <p className="text-sm text-muted-foreground">חלק מקמפיין 360° שלך</p>
                      </div>
                    </div>
                    {isGeneratingBanner ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">מייצר באנר דיגיטלי...</span>
                      </div>
                    ) : autopilotBannerUrl ? (
                      <Card className="border-primary/20 overflow-hidden">
                        <img src={autopilotBannerUrl} alt="באנר דיגיטלי" className="w-full object-contain" />
                      </Card>
                    ) : null}
                  </div>
                )}

                {/* Email Section */}
                {showAutopilotEmail && (
                  <div className="mt-10 pt-8 border-t-2 border-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">מייל שיווקי</h3>
                        <p className="text-sm text-muted-foreground">{mediaTypes.includes('all') ? 'חלק מקמפיין 360° שלך' : 'דיוור אלקטרוני מעוצב'}</p>
                      </div>
                    </div>
                    {isGeneratingEmail || isRegenerating === 'email' ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">{isRegenerating === 'email' ? 'מעדכן מייל...' : 'כותב מייל שיווקי...'}</span>
                      </div>
                    ) : autopilotEmailContent ? (
                      <Card className="border-primary/20">
                        <div className="p-6" dir="rtl">
                          {editingEmail ? (
                            <div className="space-y-3">
                              <div>
                                <span className="text-xs text-muted-foreground">נושא:</span>
                                <input
                                  value={autopilotEmailContent.subject}
                                  onChange={(e) => setAutopilotEmailContent({ ...autopilotEmailContent, subject: e.target.value })}
                                  className="w-full text-xl font-bold bg-transparent border-b border-primary/30 pb-1 focus:outline-none focus:border-primary"
                                  dir="rtl"
                                />
                              </div>
                              <Textarea
                                value={autopilotEmailContent.body}
                                onChange={(e) => setAutopilotEmailContent({ ...autopilotEmailContent, body: e.target.value })}
                                className="min-h-[150px] text-sm"
                                dir="rtl"
                              />
                              <input
                                value={autopilotEmailContent.cta}
                                onChange={(e) => setAutopilotEmailContent({ ...autopilotEmailContent, cta: e.target.value })}
                                className="w-full text-sm bg-transparent border-b border-border pb-1 focus:outline-none focus:border-primary"
                                placeholder="כפתור הנעה לפעולה"
                                dir="rtl"
                              />
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer rounded-lg p-3 -m-3 transition-all hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 group relative"
                              onClick={() => { if (fixRequestPlatform !== 'email') setFixRequestPlatform('email'); }}
                            >
                              <span className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary flex items-center gap-1">
                                <Pencil className="h-3 w-3" /> לחץ לתיקונים
                              </span>
                              <div className="text-xs text-muted-foreground mb-1">נושא:</div>
                              <h4 className="text-xl font-bold text-foreground mb-4">{autopilotEmailContent.subject}</h4>
                              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line mb-4">
                                {autopilotEmailContent.body}
                              </div>
                              {autopilotEmailContent.cta && (
                                <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium text-sm">
                                  {autopilotEmailContent.cta}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Fix request form */}
                          {fixRequestPlatform === 'email' && (
                            <Card className="p-4 my-4 border-2 border-primary/30 bg-primary/5 animate-fade-in">
                              <p className="text-sm font-medium mb-2">מה לשנות במייל?</p>
                              <Textarea
                                value={platformFixText}
                                onChange={(e) => setPlatformFixText(e.target.value)}
                                placeholder="למשל: הנושא לא מושך, תקצר את הגוף, תשנה את הכפתור..."
                                className="min-h-[80px] text-sm mb-3"
                                dir="rtl"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handlePlatformFix('email')} disabled={!platformFixText.trim()}>
                                  <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                                  עדכן
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setFixRequestPlatform(null); setPlatformFixText(''); }}>ביטול</Button>
                              </div>
                            </Card>
                          )}
                          
                          <div className="flex gap-2 flex-wrap mt-4">
                            <Button variant="outline" size="sm" onClick={() => {
                              const text = `נושא: ${autopilotEmailContent.subject}\n\n${autopilotEmailContent.body}\n\n${autopilotEmailContent.cta}`;
                              navigator.clipboard.writeText(text);
                              toast.success('המייל הועתק!');
                            }}>
                              העתק מייל
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingEmail(!editingEmail)}>
                              <Pencil className="h-3.5 w-3.5 ml-1.5" />
                              {editingEmail ? 'סיום עריכה' : 'ערוך'}
                            </Button>
                            {!editingEmail && fixRequestPlatform !== 'email' && (
                              <Button variant="outline" size="sm" onClick={() => setFixRequestPlatform('email')}>
                                <MessageSquare className="h-3.5 w-3.5 ml-1.5" />
                                בקש תיקונים
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                )}

                {/* WhatsApp Section */}
                {showAutopilotWhatsapp && (
                  <div className="mt-10 pt-8 border-t-2 border-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">מסר וואטסאפ</h3>
                        <p className="text-sm text-muted-foreground">{mediaTypes.includes('all') ? 'חלק מקמפיין 360° שלך' : 'מסר קצר וקליט לשיתוף'}</p>
                      </div>
                    </div>
                    {isGeneratingWhatsapp || isRegenerating === 'whatsapp' ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">{isRegenerating === 'whatsapp' ? 'מעדכן מסר...' : 'כותב מסר וואטסאפ...'}</span>
                      </div>
                    ) : autopilotWhatsappContent ? (
                      <Card className="border-primary/20">
                        <div className="p-6" dir="rtl">
                          {/* Image headline info */}
                          {autopilotWhatsappContent.imageHeadline && (
                            <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">🎨 כותרת בקוביה העיצובית</p>
                              <p className="font-bold text-foreground">{autopilotWhatsappContent.imageHeadline}</p>
                              {autopilotWhatsappContent.imageSubtext && (
                                <p className="text-sm text-muted-foreground mt-1">{autopilotWhatsappContent.imageSubtext}</p>
                              )}
                            </div>
                          )}
                          
                          {/* Accompanying text */}
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">✍️ טקסט נלווה</p>
                          </div>
                          {editingWhatsapp ? (
                            <Textarea
                              value={autopilotWhatsappContent.message}
                              onChange={(e) => setAutopilotWhatsappContent({ ...autopilotWhatsappContent, message: e.target.value })}
                              className="min-h-[150px] text-sm"
                              dir="rtl"
                            />
                          ) : (
                            <div 
                              className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line cursor-pointer rounded-lg p-3 -m-3 transition-all hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 group relative"
                              onClick={() => { if (fixRequestPlatform !== 'whatsapp') setFixRequestPlatform('whatsapp'); }}
                            >
                              {autopilotWhatsappContent.message}
                              <span className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary flex items-center gap-1">
                                <Pencil className="h-3 w-3" /> לחץ לתיקונים
                              </span>
                            </div>
                          )}
                          
                          {/* Fix request form */}
                          {fixRequestPlatform === 'whatsapp' && (
                            <Card className="p-4 my-4 border-2 border-primary/30 bg-primary/5 animate-fade-in">
                              <p className="text-sm font-medium mb-2">מה לשנות במסר?</p>
                              <Textarea
                                value={platformFixText}
                                onChange={(e) => setPlatformFixText(e.target.value)}
                                placeholder="למשל: תוסיף אימוג'ים, תקצר, תשנה את הטון, תוסיף קישור לדף נחיתה..."
                                className="min-h-[80px] text-sm mb-3"
                                dir="rtl"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handlePlatformFix('whatsapp')} disabled={!platformFixText.trim()}>
                                  <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                                  עדכן
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setFixRequestPlatform(null); setPlatformFixText(''); }}>ביטול</Button>
                              </div>
                            </Card>
                          )}
                          
                          <div className="flex gap-2 flex-wrap mt-4">
                            <Button variant="outline" size="sm" onClick={() => {
                              navigator.clipboard.writeText(autopilotWhatsappContent.message);
                              toast.success('המסר הועתק!');
                            }}>
                              העתק מסר
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingWhatsapp(!editingWhatsapp)}>
                              <Pencil className="h-3.5 w-3.5 ml-1.5" />
                              {editingWhatsapp ? 'סיום עריכה' : 'ערוך'}
                            </Button>
                            {!editingWhatsapp && fixRequestPlatform !== 'whatsapp' && (
                              <Button variant="outline" size="sm" onClick={() => setFixRequestPlatform('whatsapp')}>
                                <MessageSquare className="h-3.5 w-3.5 ml-1.5" />
                                בקש תיקונים
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                )}

                {!isGenerating && generatedImages.length > 0 && (
                  <div className="mt-8 space-y-4">
                    {/* Feedback Buttons */}
                    {feedbackMode === 'none' && !showApproveSelection && (
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setFeedbackMode('another-round')}
                          className="gap-2 bg-card border-2 border-border hover:bg-muted"
                        >
                          <RefreshCw className="h-5 w-5" />
                          אשמח לעוד סבב סקיצות
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setFeedbackMode('small-fixes');
                            setSelectedSketchIds([]);
                          }}
                          className="gap-2 bg-card border-2 border-border hover:bg-muted"
                        >
                          <MessageSquare className="h-5 w-5" />
                          יש לי כמה תיקונים
                        </Button>
                      </div>
                    )}

                    {/* Sketch Selection for Fixes */}
                    {feedbackMode === 'small-fixes' && selectedSketchIds.length === 0 && !feedbackType && (
                      <Card className="p-5 max-w-2xl mx-auto animate-fade-in">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">על איזו סקיצה יש תיקונים?</h3>
                            <Button variant="ghost" size="sm" onClick={() => { setFeedbackMode('none'); setSelectedSketchIds([]); }}>ביטול</Button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {generatedImages.filter(img => img.status !== 'rejected').map((img, idx) => (
                              <button
                                key={img.id}
                                onClick={() => setSelectedSketchIds([img.id])}
                                className="relative rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all aspect-square group"
                              >
                                <img src={img.url} alt={`סקיצה ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                                  <span className="bg-background/80 px-3 py-1 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    סקיצה {idx + 1}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setSelectedSketchIds(generatedImages.filter(img => img.status !== 'rejected').map(img => img.id))}
                          >
                            על כולן
                          </Button>
                        </div>
                      </Card>
                    )}

                    {/* Component-Level Feedback Picker (after sketch selected) */}
                    {feedbackMode === 'small-fixes' && selectedSketchIds.length > 0 && (
                      <ComponentFeedbackPicker
                        sketchLabel={
                          selectedSketchIds.length === generatedImages.filter(img => img.status !== 'rejected').length
                            ? 'כל הסקיצות'
                            : `סקיצה ${generatedImages.findIndex(img => img.id === selectedSketchIds[0]) + 1}`
                        }
                        onSubmit={(feedbacks) => handleSubmitFeedback(feedbacks)}
                        onCancel={() => {
                          setFeedbackMode('none');
                          setFeedbackText('');
                          setFeedbackType(null);
                          setSelectedSketchIds([]);
                        }}
                        mediaType={mediaTypes.length === 1 ? mediaTypes[0] : undefined}
                      />
                    )}

                    {/* Another Round - general feedback textarea */}
                    {feedbackMode === 'another-round' && (
                      <Card className="p-5 max-w-2xl mx-auto animate-fade-in">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">מה היית רוצה לשנות בסבב הבא?</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFeedbackMode('none');
                                setFeedbackText('');
                              }}
                            >
                              ביטול
                            </Button>
                          </div>
                          <Textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="פרט מה לא התחבר, מה חשוב להדגיש יותר..."
                            className="min-h-[120px] text-right"
                            dir="rtl"
                          />
                          <Button onClick={() => handleSubmitFeedback()} className="w-full" disabled={!feedbackText.trim()}>
                            שלח
                          </Button>
                        </div>
                      </Card>
                    )}

                    {/* Approve Selection — pick which sketch to approve */}
                    {showApproveSelection && (
                      <Card className="p-5 max-w-2xl mx-auto animate-fade-in">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">איזו סקיצה מאושרת?</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowApproveSelection(false)}>ביטול</Button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {generatedImages.filter(img => img.status !== 'rejected').map((img, idx) => (
                              <button
                                key={img.id}
                                onClick={() => {
                                  setApprovedSketchId(img.id);
                                  setShowApproveSelection(false);
                                  setShowMediaSelection(true);
                                  toast.success(`סקיצה ${idx + 1} אושרה! ממשיכים למדיה 🎯`);
                                }}
                                className="relative rounded-lg overflow-hidden border-2 border-border hover:border-green-500 transition-all aspect-square group"
                              >
                                <img src={img.url} alt={`סקיצה ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-green-500/20 transition-colors flex items-center justify-center">
                                  <span className="bg-background/80 px-3 py-1.5 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    אשר סקיצה {idx + 1}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Fixed Approve Button */}
                    {!showApproveSelection && feedbackMode === 'none' && (
                      <div className="flex justify-center pt-4 border-t border-border mt-6">
                        <Button 
                          size="lg" 
                          onClick={() => {
                            const nonRejected = generatedImages.filter(img => img.status !== 'rejected');
                            if (nonRejected.length === 1) {
                              setApprovedSketchId(nonRejected[0].id);
                              setShowMediaSelection(true);
                            } else {
                              setShowApproveSelection(true);
                            }
                          }}
                          variant="gradient"
                          className="h-14 px-8 text-lg gap-2"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          הקו מאושר! ממשיכים למדיה
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Text-only flow — show radio/article/email/whatsapp sections */}
                {showAutopilotRadio && (
                  <div className="mt-4 pt-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 flex items-center justify-center">
                        <Radio className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">ספוט רדיו</h3>
                        <p className="text-sm text-muted-foreground">תשדיר רדיו מקצועי</p>
                      </div>
                    </div>
                    {isGeneratingRadio ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">כותב תשדיר רדיו...</span>
                      </div>
                    ) : autopilotRadioScript ? (
                      <Card className="border-primary/20">
                        <div className="p-6" dir="rtl">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <h4 className="text-lg font-bold text-foreground">{autopilotRadioScript.title}</h4>
                            {autopilotRadioScript.duration && (
                              <Badge variant="secondary">{autopilotRadioScript.duration}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line mb-4">
                            {autopilotRadioScript.script}
                          </div>
                          {autopilotRadioScript.voiceNotes && (
                            <div className="text-xs text-muted-foreground mb-4">הנחיות קריינות: {autopilotRadioScript.voiceNotes}</div>
                          )}
                          {radioAudioUrl && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-3">
                              <Button
                                onClick={toggleRadioPlayback}
                                size="sm"
                                className="rounded-full w-9 h-9 p-0 bg-gradient-to-br from-violet-500 to-purple-600"
                              >
                                {isPlayingRadio ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white mr-[-1px]" />}
                              </Button>
                              <span className="text-sm text-foreground">הקריינות מוכנה</span>
                            </div>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={handleGenerateRadioTts}
                              disabled={isGeneratingTts}
                              className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                            >
                              {isGeneratingTts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
                              {isGeneratingTts ? 'מייצר קריינות...' : radioAudioUrl ? 'צור קריינות מחדש' : 'צור קריינות 🎙️'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(autopilotRadioScript.script); toast.success('התשדיר הועתק!'); }}>
                              העתק תשדיר
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="text-center p-8 text-muted-foreground">
                        <p>לא הצלחנו ליצור תשדיר רדיו. נסה שוב.</p>
                      </div>
                    )}
                  </div>
                )}

                {showAutopilotArticle && (
                  <div className="mt-6 pt-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                        <Newspaper className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">כתבה פרסומית</h3>
                        <p className="text-sm text-muted-foreground">כתבת Advertorial מקצועית</p>
                      </div>
                    </div>
                    {isGeneratingArticle ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">כותב כתבה פרסומית...</span>
                      </div>
                    ) : autopilotArticle ? (
                      <Card className="border-primary/20">
                        <div className="p-6" dir="rtl">
                          <h4 className="text-xl font-bold text-foreground mb-2">{autopilotArticle.headline}</h4>
                          {autopilotArticle.subheadline && <p className="text-sm text-muted-foreground mb-4">{autopilotArticle.subheadline}</p>}
                          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line mb-4">{autopilotArticle.body}</div>
                          {autopilotArticle.pullQuote && (
                            <blockquote className="border-r-4 border-primary pr-4 my-4 text-lg font-medium italic text-foreground/80">{autopilotArticle.pullQuote}</blockquote>
                          )}
                          {autopilotArticle.callToAction && <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium text-sm">{autopilotArticle.callToAction}</div>}
                          <div className="mt-4">
                            <Button variant="outline" size="sm" onClick={() => {
                              const text = `${autopilotArticle.headline}\n${autopilotArticle.subheadline || ''}\n\n${autopilotArticle.body}\n\n${autopilotArticle.pullQuote || ''}\n\n${autopilotArticle.callToAction || ''}`;
                              navigator.clipboard.writeText(text); toast.success('הכתבה הועתקה!');
                            }}>העתק כתבה</Button>
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                )}

                {showAutopilotEmail && (
                  <div className="mt-6 pt-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">מייל שיווקי</h3>
                        <p className="text-sm text-muted-foreground">דיוור אלקטרוני מעוצב</p>
                      </div>
                    </div>
                    {isGeneratingEmail ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">כותב מייל שיווקי...</span>
                      </div>
                    ) : autopilotEmailContent ? (
                      <Card className="border-primary/20">
                        <div className="p-6" dir="rtl">
                          <div className="text-xs text-muted-foreground mb-1">נושא:</div>
                          <h4 className="text-xl font-bold text-foreground mb-4">{autopilotEmailContent.subject}</h4>
                          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line mb-4">{autopilotEmailContent.body}</div>
                          {autopilotEmailContent.cta && <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium text-sm">{autopilotEmailContent.cta}</div>}
                          <div className="mt-4">
                            <Button variant="outline" size="sm" onClick={() => {
                              const text = `נושא: ${autopilotEmailContent.subject}\n\n${autopilotEmailContent.body}\n\n${autopilotEmailContent.cta}`;
                              navigator.clipboard.writeText(text); toast.success('המייל הועתק!');
                            }}>העתק מייל</Button>
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                )}

                {showAutopilotWhatsapp && (
                  <div className="mt-6 pt-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">מסר וואטסאפ</h3>
                        <p className="text-sm text-muted-foreground">מסר קצר וקליט לשיתוף</p>
                      </div>
                    </div>
                    {isGeneratingWhatsapp ? (
                      <div className="flex items-center justify-center p-8 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">כותב מסר וואטסאפ...</span>
                      </div>
                    ) : autopilotWhatsappContent ? (
                      <Card className="border-primary/20">
                        <div className="p-6" dir="rtl">
                          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{autopilotWhatsappContent.message}</div>
                          <div className="mt-4">
                            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(autopilotWhatsappContent.message); toast.success('המסר הועתק!'); }}>
                              העתק מסר
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                )}

                <div className="mt-6 flex justify-center">
                  <Button variant="outline" onClick={() => { setShowResults(false); setCurrentStep(0); }}>
                    התחל מחדש
                  </Button>
                </div>
              </>
            )}

            {/* Kosher Check Info — only for visual flows */}
            {!isTextOnlyFlow && (
              <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                כל תמונה עוברת בדיקת כשרות אוטומטית
              </div>
            )}
            </>
            )}
          </div>
        )}
      </div>
      
      {/* AI Chat Widget */}
      <AIChatWidget 
        context={clientProfile ? {
          businessName: clientProfile.business_name,
          targetAudience: clientProfile.target_audience,
          xFactor: clientProfile.primary_x_factor,
          winningFeature: clientProfile.winning_feature,
        } : undefined}
      />
      
      {/* Enlarged Image Modal with Inline Text Editing + Side Feedback */}
      <Dialog open={!!enlargedImage} onOpenChange={() => { setEnlargedImage(null); setEnlargedFeedbackOpen(false); }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none">
          <button 
            onClick={() => { setEnlargedImage(null); setEnlargedFeedbackOpen(false); }}
            className="absolute top-3 left-3 z-20 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex h-[90vh]">
            {/* Image Area */}
            <div className="flex-1 flex items-center justify-center p-4 min-w-0">
              {enlargedImage && enlargedImage.visualOnlyUrl && enlargedImage.textMeta ? (
                <InlineTextEditor
                  imageUrl={enlargedImage.url}
                  visualOnlyUrl={enlargedImage.visualOnlyUrl}
                  textMeta={enlargedImage.textMeta}
                  onImageUpdate={(newUrl, newMeta) => {
                    setGeneratedImages(prev => prev.map(img =>
                      img.id === enlargedImage.id ? { ...img, url: newUrl, textMeta: newMeta } : img
                    ));
                    setEnlargedImage(prev => prev ? { ...prev, url: newUrl, textMeta: newMeta } : null);
                  }}
                  onOpenFullEditor={() => {
                    setOverlayEditImage({ id: enlargedImage.id, url: enlargedImage.url });
                    setEnlargedImage(null);
                    setEnlargedFeedbackOpen(false);
                  }}
                />
              ) : enlargedImage ? (
                <img 
                  src={enlargedImage.url} 
                  alt="תמונה מוגדלת" 
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              ) : null}
            </div>

            {/* Side Feedback Panel */}
            {enlargedImage && (
              <div className="w-80 shrink-0 bg-card border-r border-border overflow-y-auto" dir="rtl">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-base text-foreground">תיקונים על המודעה</h3>
                  <p className="text-xs text-muted-foreground mt-1">סמן מה לתקן ופרט</p>
                </div>
                <div className="p-4 space-y-3">
                  {AD_COMPONENTS.map((comp) => {
                    const isSelected = enlargedFeedbackSelections.has(comp.id);
                    return (
                      <div key={comp.id} className="space-y-2">
                        <button
                          onClick={() => {
                            setEnlargedFeedbackSelections(prev => {
                              const next = new Set(prev);
                              if (next.has(comp.id)) next.delete(comp.id);
                              else next.add(comp.id);
                              return next;
                            });
                          }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium text-right',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                          )}
                        >
                          <comp.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{comp.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                        {isSelected && (
                          <Textarea
                            value={enlargedFeedbackTexts[comp.id] || ''}
                            onChange={(e) => setEnlargedFeedbackTexts(prev => ({ ...prev, [comp.id]: e.target.value }))}
                            placeholder={comp.placeholder}
                            className="min-h-[70px] text-sm animate-fade-in"
                            dir="rtl"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {enlargedFeedbackSelections.size > 0 && (
                  <div className="p-4 border-t border-border">
                    <Button
                      onClick={() => {
                        const feedbacks: { component: AdComponent; text: string }[] = [];
                        for (const comp of enlargedFeedbackSelections) {
                          const text = enlargedFeedbackTexts[comp]?.trim();
                          if (text) feedbacks.push({ component: comp, text });
                        }
                        if (feedbacks.length === 0) {
                          toast.error('נא לכתוב פירוט לתיקון');
                          return;
                        }
                        // Set the sketch to fix and submit
                        setSelectedSketchIds([enlargedImage.id]);
                        setFeedbackMode('small-fixes');
                        handleSubmitFeedback(feedbacks);
                        setEnlargedImage(null);
                        setEnlargedFeedbackOpen(false);
                        setEnlargedFeedbackSelections(new Set());
                        setEnlargedFeedbackTexts({});
                      }}
                      variant="gradient"
                      className="w-full gap-2"
                    >
                      <Send className="h-4 w-4" />
                      שלח תיקונים ({enlargedFeedbackSelections.size})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Text Overlay Editor Modal */}
      <Dialog open={!!overlayEditImage} onOpenChange={() => setOverlayEditImage(null)}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          {overlayEditImage && (
            <TextOverlayEditor
              imageUrl={overlayEditImage.url}
              onSave={(dataUrl) => {
                // Update the image in the generated images list
                setGeneratedImages(prev => prev.map(img => 
                  img.id === overlayEditImage.id ? { ...img, url: dataUrl } : img
                ));
                setOverlayEditImage(null);
                toast.success('הטקסט נוסף לתמונה בהצלחה!');
              }}
              onClose={() => setOverlayEditImage(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Print Export Dialog */}
      <PrintExportDialog
        open={!!printDialogImage}
        onClose={() => setPrintDialogImage(null)}
        onExport={handlePrintExport}
        imageCount={printDialogMode === 'all' ? generatedImages.filter(i => i.status !== 'rejected').length : 1}
      />

      {/* Fabric Image Editor - Full drag & drop editing */}
      {fabricEditImage && (
        <ImageEditor
          imageUrl={fabricEditImage.url}
          onSave={(dataUrl) => {
            setGeneratedImages(prev => prev.map(img =>
              img.id === fabricEditImage.id ? { ...img, url: dataUrl } : img
            ));
            setFabricEditImage(null);
            toast.success('התמונה נשמרה בהצלחה!');
          }}
          onClose={() => setFabricEditImage(null)}
        />
      )}
    </div>
  );
};

export default CreativeStudio;
