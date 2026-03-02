import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Wand2, Shield, ChevronLeft, ChevronRight, Sparkles, Loader2, ImageIcon, Type, RefreshCw, MessageSquare, CheckCircle2, X, PenTool, Pencil, Plus, FileDown, ZoomIn, Move } from 'lucide-react';
import { isPdfUrl, pdfToImage } from '@/lib/pdf-utils';
import { exportToPrintPdf, exportMultiPagePdf } from '@/lib/print-export';
import { AgentPipelineDebug, AgentStep } from '@/components/studio/AgentPipelineDebug';
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
import { StudioModeToggle, StudioMode } from '@/components/studio/StudioModeToggle';
import { StudioAutopilot, CreativeConcept, HolidaySeason, HOLIDAY_LABELS } from '@/components/studio/StudioAutopilot';
import { StudioQuoteStep, QuoteData, MediaItem } from '@/components/studio/StudioQuoteStep';
import { StudioBriefStep, CampaignBrief, CampaignStructure } from '@/components/studio/StudioBriefStep';
import { StudioMediaTypeStep, MediaType } from '@/components/studio/StudioMediaTypeStep';
import { StudioCopyStep, CopyChoice } from '@/components/studio/StudioCopyStep';
import { BudgetAudienceStep } from '@/components/campaign/BudgetAudienceStep';
import { TextOverlayEditor } from '@/components/studio/TextOverlayEditor';
import { InlineTextEditor, TextMeta } from '@/components/studio/InlineTextEditor';
import { PrintExportDialog, PrintSettings } from '@/components/studio/PrintExportDialog';
import { FormatAdaptation } from '@/components/studio/FormatAdaptation';
import { ImageEditor } from '@/components/studio/ImageEditor';
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
  business_photos: any[] | null;
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
      case 'billboard': mediaLabel = 'שלט חוצות'; break;
      case 'social': mediaLabel = 'פוסט'; break;
      case 'radio': mediaLabel = 'ספוט רדיו'; break;
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
  'food': ['אוכל', 'מזון', 'מסעדה', 'קייטרינג', 'מאפה', 'בשר', 'עוף', 'בישול', 'מתכון'],
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
};

function detectTopicCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return topic;
  }
  return null;
}

const CreativeStudio = () => {
  const [searchParams] = useSearchParams();
  
  // Client profile state
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  
  // Mode state - check URL param for direct access
  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState<StudioMode>(urlMode === 'upload' ? 'manual' : null);
  
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
      customText: '',
    },
    colorSelection: {
      mode: 'brand',
      primaryColor: null,
      secondaryColor: null,
      backgroundColor: null,
    },
  });
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [assetChoice, setAssetChoice] = useState<AssetChoice | null>(null);
  const [treatment, setTreatment] = useState<TreatmentChoice | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [style, setStyle] = useState<StyleChoice | null>(null);
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
  const [overlayEditImage, setOverlayEditImage] = useState<{ id: string; url: string } | null>(null);
  const [fabricEditImage, setFabricEditImage] = useState<{ id: string; url: string } | null>(null);
  const [printDialogImage, setPrintDialogImage] = useState<GeneratedImage | null>(null);
  const [printDialogMode, setPrintDialogMode] = useState<'single' | 'all'>('single');
  const [showFormatAdaptation, setShowFormatAdaptation] = useState(false);
  const [adaptedCreatives, setAdaptedCreatives] = useState<AdaptedCreative[]>([]);
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>([]);
  const [showPipeline, setShowPipeline] = useState(false);

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
  
  // Text layout style
  const [textLayoutStyle, setTextLayoutStyle] = useState<'classic-ad' | 'top-headline' | 'center-card' | 'minimal' | 'side-strip' | 'professional-ad' | 'magazine-blend' | 'brand-top'>('magazine-blend');

  // Engine version selection
  const [engineVersion, setEngineVersion] = useState<'nano-banana-pro' | 'nano-banana'>('nano-banana-pro');

  // Auto-set aspect ratio based on media type
  useEffect(() => {
    if (mediaTypes.length === 1) {
      switch (mediaTypes[0]) {
        case 'ad': setAspectRatio('portrait'); break;
        case 'banner': setAspectRatio('landscape'); break;
        case 'billboard': setAspectRatio('landscape'); break;
        case 'social': setAspectRatio('square'); break;
        default: break;
      }
    } else if (mediaTypes.includes('ad') && !mediaTypes.includes('banner')) {
      setAspectRatio('portrait');
    } else if (mediaTypes.includes('banner') && !mediaTypes.includes('ad')) {
      setAspectRatio('landscape');
    }
  }, [mediaTypes]);

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
        setCampaignBrief(prev => ({
          ...prev,
          title: briefData.campaignName || '',
          offer: briefData.campaignOffer || '',
          goal: briefData.goal || null,
        }));
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

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('business_name, target_audience, end_consumer, decision_maker, primary_x_factor, winning_feature, advantage_type, x_factors, contact_phone, contact_whatsapp, contact_email, contact_address, contact_youtube, social_facebook, social_instagram, primary_color, secondary_color, background_color, header_font, body_font, logo_url, past_materials, business_photos')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setClientProfile({
          ...profile,
          past_materials: Array.isArray(profile.past_materials) ? profile.past_materials : [],
          business_photos: Array.isArray(profile.business_photos) ? profile.business_photos : [],
        });
      }
    };

    fetchProfile();
  }, []);

  // Calculate actual steps based on asset choice and media type
  const getSteps = () => {
    // Steps: 0=Brief, 1=MediaType, 2=Asset, 3=Treatment/Upload, 4=Copy, 5=Style, 6=Prompt
    // If only radio is selected, skip visual steps
    const isOnlyRadio = mediaTypes.length === 1 && mediaTypes[0] === 'radio';
    if (isOnlyRadio) {
      // Radio doesn't need visual steps - just script
      return [0, 1, 6]; // Brief, MediaType, Prompt (for script)
    }
    if (assetChoice === 'full-campaign') {
      // User has everything (visual + copy) - just upload and submit
      return [0, 1, 2, 3]; // Brief, MediaType, Asset, Upload (submits on upload)
    }
    if (assetChoice === 'has-visual') {
      // User has visual, needs copy - upload visual, we generate copy
      // NO style/prompt needed - user already has the design!
      return [0, 1, 2, 3]; // Brief, MediaType, Asset, Upload (AI generates copy for existing visual)
    }
    if (assetChoice === 'has-copy') {
      // User has copy, needs visual - input copy, then style for visual generation
      return [0, 1, 2, 4, 5, 6]; // Brief, MediaType, Asset, Copy, Style, Prompt (for visual generation)
    }
    // Default flow - shouldn't reach here normally
    return [0, 1, 2];
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
        // Validate offer has meaningful content (not just random characters)
        const offer = campaignBrief.offer.trim();
        const hasValidOffer = offer.length >= 5 && /[\u0590-\u05FFa-zA-Z]{2,}/.test(offer);
        return hasValidOffer && campaignBrief.structure !== null;
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
      default: return false;
    }
  };

  const explainBlockedNext = () => {
    if (currentStep === 0) {
      const missing: string[] = [];
      const offer = campaignBrief.offer.trim();
      const hasValidOffer = offer.length >= 5 && /[\u0590-\u05FFa-zA-Z]{2,}/.test(offer);
      if (!offer) {
        missing.push('מה ההצעה הפרסומית');
      } else if (!hasValidOffer) {
        missing.push('יש להזין הצעה פרסומית תקינה (לפחות 5 תווים עם מילים בעברית או אנגלית)');
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
    const isOnlyRadio = mediaTypes.length === 1 && mediaTypes[0] === 'radio';
    
    // Special navigation for radio - skip to prompt
    if (currentStep === 1 && isOnlyRadio) {
      setCurrentStep(6);
      return;
    }
    
    // For has-copy: skip upload (step 3) and go to copy input (step 4)
    if (currentStep === 2 && assetChoice === 'has-copy') {
      setCurrentStep(4);
      return;
    }
    
    // Normal progression
    if (actualStepIndex < totalSteps - 1) {
      setCurrentStep(steps[actualStepIndex + 1]);
    }
  };

  const handleBack = () => {
    const isOnlyRadio = mediaTypes.length === 1 && mediaTypes[0] === 'radio';
    
    // Special back navigation for radio
    if (currentStep === 6 && isOnlyRadio) {
      setCurrentStep(1);
      return;
    }
    
    // For has-copy: from copy step go back to asset selection
    if (currentStep === 4 && assetChoice === 'has-copy') {
      setCurrentStep(2);
      return;
    }
    
    // Normal back progression
    if (actualStepIndex > 0) {
      setCurrentStep(steps[actualStepIndex - 1]);
    } else {
      // On first step, go back to mode selection
      setMode(null);
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
      // Build brand context for AI - use campaign color selection if set
      const colorSelection = campaignBrief.colorSelection;
      const effectiveColors = {
        primary: colorSelection.mode === 'swapped' 
          ? colorSelection.primaryColor || clientProfile?.secondary_color 
          : clientProfile?.primary_color,
        secondary: colorSelection.mode === 'swapped' 
          ? colorSelection.secondaryColor || clientProfile?.primary_color 
          : clientProfile?.secondary_color,
        background: colorSelection.backgroundColor || clientProfile?.background_color,
      };

      // Extract ad layout analysis from past materials
      const pastMaterialsAnalysis = (clientProfile?.past_materials as any[])
        ?.filter((m: any) => m.adAnalysis)
        ?.map((m: any) => m.adAnalysis)
        ?.slice(0, 3) || [];

      const brandContext = clientProfile ? {
        businessName: clientProfile.business_name,
        targetAudience: clientProfile.target_audience,
        primaryXFactor: clientProfile.primary_x_factor,
        winningFeature: clientProfile.winning_feature,
        xFactors: clientProfile.x_factors,
        colors: effectiveColors,
        fonts: {
          header: clientProfile.header_font,
          body: clientProfile.body_font,
        },
        colorMode: colorSelection.mode,
        pastMaterialsAnalysis,
      } : null;

      // Resolve PDF logo to PNG if needed
      const resolvedLogo = await getResolvedLogoUrl();
      if (resolvedLogo && brandContext) {
        (brandContext as any).logoUrl = resolvedLogo;
      } else if (clientProfile?.logo_url && brandContext) {
        (brandContext as any).logoUrl = clientProfile.logo_url;
      }

      // Build campaign context
      const campaignContext = {
        title: campaignBrief.title,
        offer: campaignBrief.offer,
        goal: campaignBrief.goal,
        structure: campaignBrief.structure,
        contactInfo: campaignBrief.contactSelection,
        campaignImageUrl: campaignBrief.campaignImage || null,
      };

      for (let i = 0; i < 4; i++) {
        toast.info(`מייצר סקיצה ${i + 1} מתוך 4...`);
        
        const detectedTopic = detectTopicCategory(campaignBrief.offer + ' ' + campaignBrief.title);
        
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: {
            visualPrompt,
            textPrompt: textPrompt || null,
            style: style || 'ultra-realistic',
            engine: engineVersion,
            templateId: selectedTemplate?.id || null,
            templateHints: selectedTemplate?.promptHints || null,
            dimensions: selectedTemplate?.dimensions || null,
            brandContext,
            campaignContext,
            topicCategory: detectedTopic,
            holidaySeason: selectedHoliday || null,
            aspectRatio,
            corrections: pendingCorrections.length > 0 ? pendingCorrections : undefined,
          }
        });

        if (error) {
          console.error('Error generating image:', error);
          continue;
        }

        if (data?.imageUrl) {
          // Apply Hebrew text programmatically using Canvas
          let finalUrl = data.imageUrl;
          const textMeta = data.textMeta;
          
          if (textMeta && (textMeta.headline || textMeta.businessName || textMeta.phone)) {
            try {
              const { applyHtmlTextOverlay } = await import('@/lib/html-text-overlay');
              finalUrl = await applyHtmlTextOverlay(data.imageUrl, {
                headline: textMeta.headline,
                subtitle: textMeta.subtitle,
                bodyText: textMeta.bodyText,
                ctaText: textMeta.ctaText,
                businessName: textMeta.businessName,
                phone: textMeta.phone,
                email: textMeta.email || clientProfile?.contact_email || undefined,
                whatsapp: clientProfile?.contact_whatsapp || undefined,
                address: textMeta.address || clientProfile?.contact_address || undefined,
                primaryColor: brandContext?.colors?.primary || clientProfile?.primary_color || undefined,
                secondaryColor: brandContext?.colors?.secondary || clientProfile?.secondary_color || undefined,
                backgroundColor: brandContext?.colors?.background || clientProfile?.background_color || undefined,
                layoutStyle: textLayoutStyle,
                logoUrl: (brandContext as any)?.logoUrl || clientProfile?.logo_url || undefined,
                logoPosition: (clientProfile?.past_materials as any[])?.find((m: any) => m.adAnalysis?.logoPosition)?.adAnalysis?.logoPosition || undefined,
                servicesList: textMeta.servicesList,
                promoText: textMeta.promoText,
                promoValue: textMeta.promoValue,
                bulletItems: textMeta.bulletItems,
              });
              console.log(`[HTML] Hebrew text applied for sketch ${i}`);
            } catch (canvasError) {
              console.error('[Canvas] Failed to apply text overlay:', canvasError);
            }
          }

          const newImage: GeneratedImage = {
            id: `${Date.now()}-${i}`,
            url: finalUrl,
            status: 'pending',
            visualOnlyUrl: data.visualOnlyUrl || data.imageUrl,
            textMeta: data.textMeta || undefined,
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
        }
      }

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
        customText: '',
      },
      colorSelection: {
        mode: 'brand',
        primaryColor: null,
        secondaryColor: null,
        backgroundColor: null,
      },
    });
    setMediaTypes([]);
    setAssetChoice(null);
    setTreatment(null);
    setUploadedImage(null);
    setStyle(null);
    setVisualPrompt('');
    setTextPrompt('');
    setAspectRatio('square');
    setTextLayoutStyle('magazine-blend');
    setGeneratedImages([]);
    setShowResults(false);
    setShowQuote(false);
    setShowSuccess(false);
    setConcepts([]);
    setSelectedConcept(null);
    setFeedbackType(null);
    setShowFormatAdaptation(false);
    setAdaptedCreatives([]);
  };

  // Quote handling functions
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
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error('נא להזין פירוט');
      return;
    }
    
    // Store correction as separate context — do NOT pollute the visual/text prompts
    const newCorrection = {
      type: feedbackType || 'general',
      text: feedbackText.trim(),
    };
    setPendingCorrections(prev => [...prev, newCorrection]);
    
    // Save correction as a pending creative rule (insight) for admin approval
    // This ensures recurring corrections become permanent rules for ALL future creatives
    try {
      const correctionText = feedbackText.trim();
      const targetInfo = selectedSketchIds.length > 0 
        ? `(סקיצות: ${selectedSketchIds.join(', ')})` 
        : '(כל הסקיצות)';
      const correctionContent = `[תיקון קריאייטיב] ${correctionText} ${targetInfo}`;
      
      await supabase.from('sector_brain_insights').insert({
        insight_type: 'creative_correction',
        content: correctionContent,
        is_active: false, // Pending admin approval
      });
    } catch (e) {
      console.warn('Failed to save correction as insight:', e);
    }
    
    toast.info('מייצר סקיצות מתוקנות... 🎨');
    
    // Reset feedback UI
    setFeedbackMode('none');
    setFeedbackText('');
    setFeedbackType(null);
    setSelectedSketchIds([]);
    
    // Regenerate — corrections will be passed as separate field to the edge function
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
      
      // Save campaign to database
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
      
      const { error } = await supabase.from('campaigns').insert(campaignData);

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
  const generateImageForConcept = async (concept: CreativeConcept, index: number, brandContext: any, campaignContext: any) => {
    // Determine visual approach from concept or fallback by index
    const approachByIndex = ['graphic-design', 'product-focus', 'lifestyle'];
    const visualApproach = (concept as any).visual_approach || approachByIndex[index % 3];
    
    const enhancedVisualPrompt = campaignBrief.offer 
      ? `[Visual approach: ${visualApproach}] ${concept.idea}. המסר המרכזי: ${campaignBrief.offer}`
      : `[Visual approach: ${visualApproach}] ${concept.idea}`;
    
    const enhancedTextPrompt = campaignBrief.offer && !concept.copy.includes(campaignBrief.offer)
      ? `${concept.copy} - ${campaignBrief.offer}`
      : concept.copy;

    const detectedTopic = detectTopicCategory(campaignBrief.offer + ' ' + campaignBrief.title);

    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        visualPrompt: enhancedVisualPrompt,
        textPrompt: enhancedTextPrompt,
        style: 'modern',
        engine: engineVersion,
        brandContext,
        campaignContext,
        topicCategory: detectedTopic,
        holidaySeason: selectedHoliday || null,
        aspectRatio,
        visualApproach,
      }
    });

    if (error) {
      console.error(`Error generating image for concept ${index}:`, error);
      return null;
    }

    if (data?.imageUrl) {
      // Apply Hebrew text programmatically using Canvas (perfect rendering every time)
      let finalUrl = data.imageUrl;
      const textMeta = data.textMeta;
      
      if (textMeta && (textMeta.headline || textMeta.businessName || textMeta.phone)) {
        try {
          const { applyHtmlTextOverlay } = await import('@/lib/html-text-overlay');
          // Vary layout style per concept for visual diversity
          const layoutStyles = ['magazine-blend', 'brand-top', 'professional-ad'] as const;
          const conceptLayout = textLayoutStyle || layoutStyles[index % 3];
          finalUrl = await applyHtmlTextOverlay(data.imageUrl, {
            headline: concept.headline || textMeta.headline,
            subtitle: textMeta.subtitle,
            bodyText: concept.copy || textMeta.bodyText,
            ctaText: textMeta.ctaText,
            businessName: textMeta.businessName,
            phone: textMeta.phone,
            email: textMeta.email || clientProfile?.contact_email || undefined,
            whatsapp: clientProfile?.contact_whatsapp || undefined,
            address: textMeta.address || clientProfile?.contact_address || undefined,
            primaryColor: brandContext?.colors?.primary || clientProfile?.primary_color || undefined,
            secondaryColor: brandContext?.colors?.secondary || clientProfile?.secondary_color || undefined,
            backgroundColor: brandContext?.colors?.background || clientProfile?.background_color || undefined,
            layoutStyle: conceptLayout as any,
            logoUrl: brandContext?.logoUrl || clientProfile?.logo_url || undefined,
            logoPosition: (clientProfile?.past_materials as any[])?.find((m: any) => m.adAnalysis?.logoPosition)?.adAnalysis?.logoPosition || undefined,
                servicesList: textMeta.servicesList,
                promoText: textMeta.promoText,
                promoValue: textMeta.promoValue,
                bulletItems: textMeta.bulletItems,
          });
          console.log(`[Canvas] Hebrew text applied with layout "${conceptLayout}" for concept ${index}`, {
            primaryColor: brandContext?.colors?.primary || clientProfile?.primary_color,
            secondaryColor: brandContext?.colors?.secondary || clientProfile?.secondary_color,
            logoUrl: brandContext?.logoUrl ? 'from-context' : clientProfile?.logo_url ? 'from-profile' : 'none',
            phone: textMeta.phone,
            businessName: textMeta.businessName,
          });
        } catch (canvasError) {
          console.error('[Canvas] Failed to apply text overlay, using visual-only:', canvasError);
          // Fall back to visual-only image
        }
      }

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
          },
          holidaySeason: selectedHoliday || null,
          topicCategory: detectedTopic,
          strategicAnalysis: strategyOutput || undefined,
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

      // Generate images
      toast.info('הקונספטים מוכנים! מתחיל לעצב סקיצות... 🎨');
      setIsGenerating(true);
      setShowResults(true);
      setStyle('modern');
      setAssetChoice('has-copy');

      const brandContext = buildBrandContext();
      
      // Resolve PDF logo to PNG if needed
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
      };

      const results: GeneratedImage[] = [];

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
    setIsGenerating(true);
    setGeneratedImages([]);
    setShowResults(true);
    
    toast.info('מייצר את העיצובים על בסיס הקונספט שבחרת... 🎨');

    try {
      const results: GeneratedImage[] = [];
      const brandContext = buildBrandContext();
      const campaignContext = {
        title: campaignBrief.title,
        offer: campaignBrief.offer,
        goal: campaignBrief.goal,
        structure: campaignBrief.structure,
        holidaySeason: selectedHoliday || null,
      };
      
      for (let i = 0; i < 4; i++) {
        toast.info(`מייצר סקיצה ${i + 1} מתוך 4...`);

        const imageUrl = await generateImageForConcept(selectedConcept, i, brandContext, campaignContext);

        if (imageUrl) {
          const newImage: GeneratedImage = {
            id: `${Date.now()}-${i}`,
            url: imageUrl,
            status: 'pending',
          };
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StudioBriefStep 
            value={campaignBrief} 
            onChange={setCampaignBrief}
            businessName={clientProfile?.business_name}
            contactInfo={clientProfile ? {
              contact_phone: clientProfile.contact_phone,
              contact_whatsapp: clientProfile.contact_whatsapp,
              contact_email: clientProfile.contact_email,
              contact_address: clientProfile.contact_address,
              contact_youtube: clientProfile.contact_youtube,
              social_facebook: clientProfile.social_facebook,
              social_instagram: clientProfile.social_instagram,
            } : undefined}
            brandColors={clientProfile ? {
              primary_color: clientProfile.primary_color,
              secondary_color: clientProfile.secondary_color,
              background_color: clientProfile.background_color,
            } : undefined}
          />
        );
      case 1:
        return <StudioMediaTypeStep value={mediaTypes} onChange={setMediaTypes} />;
      case 2:
        return <StudioAssetStep value={assetChoice} onChange={setAssetChoice} />;
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
      default:
        return null;
    }
  };

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
            {/* Mode Selection Screen - shown first before any wizard steps */}
            {mode === null ? (
              <div className="py-8">
                <StudioModeToggle value={mode} onChange={setMode} />
              </div>
            ) : mode === 'autopilot' ? (
              /* Autopilot Mode */
              <div>
                {/* Back to mode selection */}
                <button
                  onClick={() => setMode(null)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>חזרה לבחירת מסלול</span>
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

                {/* Navigation */}
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                הסקיצות שלך
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

            {/* Text Layout Style Picker */}
            <div className="flex items-center gap-2 flex-wrap" dir="rtl">
              <span className="text-sm text-muted-foreground">סגנון טקסט:</span>
              {([
                { id: 'magazine-blend' as const, label: 'מגזין', icon: '📋' },
                { id: 'brand-top' as const, label: 'כותרת על הוויזואל', icon: '🎨' },
                { id: 'classic-ad' as const, label: 'מודעה קלאסית', icon: '📰' },
                { id: 'professional-ad' as const, label: 'מודעה מקצועית', icon: '🎯' },
                { id: 'side-strip' as const, label: 'פס צד', icon: '▐' },
                { id: 'minimal' as const, label: 'מינימליסטי', icon: '▁' },
              ]).map(ls => (
                <Button
                  key={ls.id}
                  size="sm"
                  variant={textLayoutStyle === ls.id ? 'default' : 'outline'}
                  className="gap-1 text-xs"
                  onClick={async () => {
                    setTextLayoutStyle(ls.id);
                    // Re-apply overlay to all images with new style
                    const { applyHtmlTextOverlay } = await import('@/lib/html-text-overlay');
                    const updated = await Promise.all(generatedImages.map(async (img) => {
                      if (img.visualOnlyUrl && img.textMeta) {
                        try {
                          const newUrl = await applyHtmlTextOverlay(img.visualOnlyUrl, {
                            headline: img.textMeta.headline,
                            subtitle: img.textMeta.subtitle,
                            bodyText: img.textMeta.bodyText,
                            ctaText: img.textMeta.ctaText,
                            businessName: img.textMeta.businessName,
                            phone: img.textMeta.phone,
                            email: (img.textMeta as any).email || clientProfile?.contact_email || undefined,
                            whatsapp: clientProfile?.contact_whatsapp || undefined,
                            address: (img.textMeta as any).address || clientProfile?.contact_address || undefined,
                            primaryColor: clientProfile?.primary_color || undefined,
                            secondaryColor: clientProfile?.secondary_color || undefined,
                            backgroundColor: clientProfile?.background_color || undefined,
                            layoutStyle: ls.id,
                            logoUrl: (buildBrandContext() as any)?.logoUrl || clientProfile?.logo_url || undefined,
                            logoPosition: (clientProfile?.past_materials as any[])?.find((m: any) => m.adAnalysis?.logoPosition)?.adAnalysis?.logoPosition || undefined,
                            servicesList: img.textMeta.servicesList,
                            promoText: img.textMeta.promoText,
                            promoValue: img.textMeta.promoValue,
                            bulletItems: (img.textMeta as any).bulletItems,
                          });
                          return { ...img, url: newUrl };
                        } catch { return img; }
                      }
                      return img;
                    }));
                    setGeneratedImages(updated);
                    toast.success(`סגנון שונה ל${ls.label}`);
                  }}
                >
                  <span>{ls.icon}</span>
                  {ls.label}
                </Button>
              ))}
            </div>

            {/* Agent Pipeline Debug Panel */}
            <AgentPipelineDebug steps={pipelineSteps} isVisible={showPipeline} />

            {generatedImages.length === 0 && isGenerating ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>מייצר את העיצובים שלך...</p>
              </div>
            ) : generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-4 opacity-30" />
                <p>לא נוצרו תמונות</p>
              </div>
            ) : (
              <>
                {/* Dynamic grid based on media type */}
                <div className={
                  mediaTypes.includes('banner') 
                    ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' 
                    : mediaTypes.includes('billboard')
                    ? 'grid grid-cols-1 gap-4'
                    : generatedImages.length === 3
                    ? 'grid grid-cols-1 sm:grid-cols-3 gap-4'
                    : generatedImages.length === 4
                    ? 'grid grid-cols-2 lg:grid-cols-4 gap-4'
                    : 'grid grid-cols-2 lg:grid-cols-3 gap-4'
                }>
                  {generatedImages.map((image) => (
                    <Card key={image.id} className={`overflow-hidden group ${image.status === 'rejected' ? 'opacity-50' : ''}`}>
                      {/* Dynamic aspect ratio based on media type */}
                      <div className={`relative bg-muted ${
                        mediaTypes.includes('banner') 
                          ? 'aspect-[4/1]' 
                          : mediaTypes.includes('billboard')
                          ? 'aspect-[16/9]'
                          : mediaTypes.includes('social')
                          ? 'aspect-square'
                          : 'aspect-square'
                      }`}>
                        <img
                          src={image.url}
                          alt={`Generated ${image.id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(image.status)}
                        </div>
                        {image.analysis && (
                          <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-xs">
                            {image.analysis}
                          </div>
                        )}
                        {image.status !== 'rejected' && image.status !== 'pending' && (
                          <div 
                            className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            onClick={() => setEnlargedImage(image)}
                          >
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-1.5"
                            >
                              <ZoomIn className="h-4 w-4" />
                              הגדל וערוך טקסט
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Feedback Section */}
                {!isGenerating && generatedImages.some(img => img.status === 'approved' || img.status === 'needs-review') && (
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

                    {/* Feedback Type Selection - Copy vs Visual (after sketch selected) */}
                    {feedbackMode === 'small-fixes' && selectedSketchIds.length > 0 && !feedbackType && (
                      <Card className="p-5 max-w-2xl mx-auto animate-fade-in">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">איפה נדרש התיקון?</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFeedbackMode('none');
                                setFeedbackText('');
                                setSelectedSketchIds([]);
                              }}
                            >
                              ביטול
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedSketchIds.length === generatedImages.filter(img => img.status !== 'rejected').length
                              ? '📌 תיקון על כל הסקיצות'
                              : `📌 תיקון על סקיצה ${generatedImages.findIndex(img => img.id === selectedSketchIds[0]) + 1}`}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => setFeedbackType('copy')}
                              className="flex flex-col h-auto py-6 gap-2 border-2 hover:border-primary hover:bg-primary/5"
                            >
                              <Type className="h-8 w-8 text-primary" />
                              <span className="font-bold">הקופי / המלל</span>
                              <span className="text-xs text-muted-foreground">כותרות, טקסטים, ניסוחים</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => setFeedbackType('visual')}
                              className="flex flex-col h-auto py-6 gap-2 border-2 hover:border-primary hover:bg-primary/5"
                            >
                              <ImageIcon className="h-8 w-8 text-primary" />
                              <span className="font-bold">הוויזואל / העיצוב</span>
                              <span className="text-xs text-muted-foreground">תמונות, צבעים, פריסה</span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Feedback Text Area - appears after selecting type or for another-round */}
                    {(feedbackMode === 'another-round' || (feedbackMode === 'small-fixes' && feedbackType)) && (
                      <Card className="p-5 max-w-2xl mx-auto animate-fade-in">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">
                              {feedbackMode === 'another-round' 
                                ? 'מה היית רוצה לשנות בסבב הבא?' 
                                : feedbackType === 'copy' 
                                  ? 'מה לתקן בקופי/מלל?' 
                                  : 'מה לתקן בוויזואל/עיצוב?'}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFeedbackMode('none');
                                setFeedbackText('');
                                setFeedbackType(null);
                                setSelectedSketchIds([]);
                              }}
                            >
                              ביטול
                            </Button>
                          </div>
                          {feedbackType && (
                            <Badge variant="secondary" className="mb-2">
                              {feedbackType === 'copy' ? '📝 תיקון קופי' : '🎨 תיקון וויזואל'}
                            </Badge>
                          )}
                          <Textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder={
                              feedbackMode === 'another-round'
                                ? 'פרט מה לא התחבר, מה חשוב להדגיש יותר...'
                                : feedbackType === 'copy'
                                  ? 'פרט את התיקונים בטקסט - כותרות, ניסוחים, מסרים...'
                                  : 'פרט את התיקונים בעיצוב - צבעים, תמונות, פריסה...'
                            }
                            className="min-h-[120px] text-right"
                            dir="rtl"
                          />
                          <Button onClick={handleSubmitFeedback} className="w-full">
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
            )}

            {/* Kosher Check Info */}
            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              כל תמונה עוברת בדיקת כשרות אוטומטית
            </div>
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
      
      {/* Enlarged Image Modal with Inline Text Editing */}
      <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] p-0 overflow-hidden">
          <button 
            onClick={() => setEnlargedImage(null)}
            className="absolute top-2 left-2 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
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
              }}
            />
          ) : enlargedImage ? (
            <div className="p-4">
              <img 
                src={enlargedImage.url} 
                alt="תמונה מוגדלת" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          ) : null}
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
