import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { ArrowRight, Wand2, Shield, ChevronLeft, ChevronRight, Sparkles, Loader2, ImageIcon, Type, RefreshCw, MessageSquare, CheckCircle2, X } from 'lucide-react';
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
import { BudgetAudienceStep } from '@/components/campaign/BudgetAudienceStep';

type AssetChoice = 'has-product' | 'no-product' | 'text-only';
type TreatmentChoice = 'as-is' | 'ai-magic';
type FeedbackMode = 'none' | 'another-round' | 'small-fixes';

interface GeneratedImage {
  id: string;
  url: string;
  status: 'approved' | 'needs-review' | 'rejected' | 'pending';
  analysis?: string;
}

interface ClientProfile {
  business_name: string;
  target_audience: string | null;
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
const getStepTitles = (mediaTypes: MediaType[]) => {
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
  
  return [
    'בריף קמפיין',
    'סוג מדיה',
    'בחירת נכס',
    'עיבוד תמונה',
    'סגנון עיצובי',
    'תיאור ותוכן',
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

const CreativeStudio = () => {
  // Client profile state
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  
  // Mode state
  const [mode, setMode] = useState<StudioMode>(null);
  
  // Feedback state
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('none');
  const [feedbackText, setFeedbackText] = useState('');
  
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
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);

  // Media selection state
  const [mediaBudget, setMediaBudget] = useState<number>(0);
  const [mediaTargetStream, setMediaTargetStream] = useState<string>('');
  const [mediaTargetGender, setMediaTargetGender] = useState<string>('');
  const [mediaTargetCity, setMediaTargetCity] = useState<string>('nationwide');
  const [selectedMediaPackage, setSelectedMediaPackage] = useState<MediaPackage | null>(null);
  
  // Holiday/Season selection for creative
  const [selectedHoliday, setSelectedHoliday] = useState<HolidaySeason>('');

  // Scroll to top when changing views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, showResults, showMediaSelection, showQuote, showSuccess]);

  // Fetch client profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('business_name, target_audience, primary_x_factor, winning_feature, advantage_type, x_factors, contact_phone, contact_whatsapp, contact_email, contact_address, contact_youtube, social_facebook, social_instagram, primary_color, secondary_color, background_color, header_font, body_font')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setClientProfile(profile);
      }
    };

    fetchProfile();
  }, []);

  // Calculate actual steps based on asset choice and media type
  const getSteps = () => {
    // Steps: 0=Brief, 1=MediaType, 2=Asset, 3=Treatment, 4=Style, 5=Prompt
    // If only radio is selected, skip visual steps
    const isOnlyRadio = mediaTypes.length === 1 && mediaTypes[0] === 'radio';
    if (isOnlyRadio) {
      // Radio doesn't need visual steps
      return [0, 1, 5]; // Brief, MediaType, Prompt (for script)
    }
    if (assetChoice === 'no-product' || assetChoice === 'text-only') {
      // Skip treatment step for no-product and text-only flows
      return [0, 1, 2, 4, 5]; // Brief, MediaType, Asset, Style, Prompt
    }
    return [0, 1, 2, 3, 4, 5]; // All steps
  };

  const steps = getSteps();
  const actualStepIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return campaignBrief.offer.trim().length > 0 && campaignBrief.structure !== null;
      case 1: return mediaTypes.length > 0;
      case 2: return assetChoice !== null;
      case 3: return uploadedImage !== null && treatment !== null;
      case 4: return style !== null;
      case 5: return visualPrompt.trim().length > 0;
      default: return false;
    }
  };

  const explainBlockedNext = () => {
    if (currentStep === 0) {
      const missing: string[] = [];
      if (!campaignBrief.offer.trim()) missing.push('מה ההצעה הפרסומית');
      if (!campaignBrief.structure) missing.push('מבנה הקמפיין');
      return missing.length ? `כדי להמשיך צריך למלא: ${missing.join(' + ')}` : null;
    }

    if (currentStep === 1) return 'כדי להמשיך צריך לבחור סוג מדיה';
    if (currentStep === 2) return 'כדי להמשיך צריך לבחור סוג נכס';
    if (currentStep === 3) return 'כדי להמשיך צריך להעלות תמונה ולבחור עיבוד';
    if (currentStep === 4) return 'כדי להמשיך צריך לבחור סגנון';
    if (currentStep === 5) return 'כדי להמשיך צריך למלא תיאור/תוכן';
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
    if (currentStep === 1 && isOnlyRadio) {
      setCurrentStep(5); // Skip to prompt for radio
    } else if (currentStep === 2 && (assetChoice === 'no-product' || assetChoice === 'text-only')) {
      setCurrentStep(4); // Skip treatment to style
    } else if (actualStepIndex < totalSteps - 1) {
      setCurrentStep(steps[actualStepIndex + 1]);
    }
  };

  const handleBack = () => {
    const isOnlyRadio = mediaTypes.length === 1 && mediaTypes[0] === 'radio';
    if (currentStep === 5 && isOnlyRadio) {
      setCurrentStep(1); // Go back to media type for radio
    } else if (currentStep === 4 && (assetChoice === 'no-product' || assetChoice === 'text-only')) {
      setCurrentStep(2); // Go back to asset
    } else if (actualStepIndex > 0) {
      setCurrentStep(steps[actualStepIndex - 1]);
    }
  };

  // Determine which AI model to use based on selections
  const getEngineConfig = () => {
    if (assetChoice === 'no-product') {
      // Full generation with Hebrew text
      return { engine: 'nano-banana', mode: 'generate' };
    }
    if (treatment === 'as-is') {
      // Simple layout engine (Canva-like)
      return { engine: 'layout', mode: 'compose' };
    }
    // AI Magic - Inpainting
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
        colorMode: colorSelection.mode, // 'brand', 'swapped', or 'continue-past'
      } : null;

      // Build campaign context
      const campaignContext = {
        title: campaignBrief.title,
        offer: campaignBrief.offer,
        goal: campaignBrief.goal,
        structure: campaignBrief.structure,
        contactInfo: campaignBrief.contactSelection,
      };

      for (let i = 0; i < 4; i++) {
        toast.info(`מייצר סקיצה ${i + 1} מתוך 4...`);
        
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: {
            visualPrompt,
            textPrompt: textPrompt || null,
            style: style || 'ultra-realistic',
            engine: config.engine === 'nano-banana' ? 'nano-banana' : 'flux-realism',
            templateId: selectedTemplate?.id || null,
            templateHints: selectedTemplate?.promptHints || null,
            dimensions: selectedTemplate?.dimensions || null,
            brandContext,
            campaignContext,
          }
        });

        if (error) {
          console.error('Error generating image:', error);
          continue;
        }

        if (data?.imageUrl) {
          const newImage: GeneratedImage = {
            id: `${Date.now()}-${i}`,
            url: data.imageUrl,
            status: 'pending',
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
    setGeneratedImages([]);
    setShowResults(false);
    setShowQuote(false);
    setShowSuccess(false);
    setConcepts([]);
    setSelectedConcept(null);
  };

  // Quote handling functions
  const getQuoteData = (): QuoteData => {
    const creativeMode: QuoteData['creativeMode'] = 
      mode === 'autopilot' ? 'autopilot' : 
      assetChoice === 'has-product' && treatment === 'as-is' ? 'uploaded' : 'manual';
    
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
  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      toast.error('נא להזין פירוט');
      return;
    }
    
    if (feedbackMode === 'another-round') {
      toast.success('בקשתך לסבב נוסף התקבלה! נחזור אליך בהקדם.');
    } else if (feedbackMode === 'small-fixes') {
      toast.success('התיקונים התקבלו! נעדכן אותך כשהעיצובים המעודכנים מוכנים.');
    }
    
    setFeedbackMode('none');
    setFeedbackText('');
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
        name: `קמפיין ${new Date().toLocaleDateString('he-IL')}`,
        status: 'pending_approval',
        vibe: style,
        goal: visualPrompt,
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

      setShowQuote(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה בשליחת ההזמנה');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleConsultAgent = () => {
    toast.info('נציג יצור איתך קשר בהקדם!');
    // In production, this could open a chat widget or send a notification
  };

  // Autopilot functions
  const handleGenerateConcepts = async () => {
    setIsGeneratingConcepts(true);
    setConcepts([]);
    setSelectedConcept(null);
    
    try {
      // Use client profile or fallback defaults
      const profile = clientProfile || {
        business_name: 'העסק שלי',
        target_audience: 'משפחות חרדיות',
        primary_x_factor: 'איכות ושירות',
        winning_feature: 'מקצועיות',
        advantage_type: 'שירות',
        x_factors: ['איכות', 'מחיר', 'שירות']
      };

      const { data, error } = await supabase.functions.invoke('generate-concepts', {
        body: { 
          profile, 
          mediaTypes,
          campaignBrief: {
            title: campaignBrief.title,
            offer: campaignBrief.offer,
            goal: campaignBrief.goal,
          },
          holidaySeason: selectedHoliday || null,
        }
      });

      if (error) {
        console.error('Error generating concepts:', error);
        toast.error('שגיאה ביצירת הקונספטים');
        setIsGeneratingConcepts(false);
        return;
      }

      if (data?.concepts && data.concepts.length > 0) {
        setConcepts(data.concepts);
        toast.success('3 כיווני קריאייטיב מוכנים!');
      } else {
        toast.error('לא הצלחנו ליצור קונספטים. נסה שוב.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה ביצירת הקונספטים');
    } finally {
      setIsGeneratingConcepts(false);
    }
  };

  const handleExecuteConcept = async () => {
    if (!selectedConcept) return;
    
    // Set the prompts from the selected concept
    setVisualPrompt(selectedConcept.idea);
    setTextPrompt(selectedConcept.copy);
    setStyle('modern'); // Default style for autopilot
    setAssetChoice('no-product'); // Autopilot generates from scratch
    
    // Generate the images
    setIsGenerating(true);
    setGeneratedImages([]);
    setShowResults(true);
    
    const config = { engine: 'nano-banana', mode: 'generate' };
    toast.info('מייצר את העיצובים על בסיס הקונספט שבחרת... 🎨');

    try {
      const results: GeneratedImage[] = [];
      
      // Build brand context for autopilot
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
      } : null;

      const campaignContext = {
        title: campaignBrief.title,
        offer: campaignBrief.offer,
        goal: campaignBrief.goal,
        structure: campaignBrief.structure,
        holidaySeason: selectedHoliday || null,
      };
      
      for (let i = 0; i < 4; i++) {
        toast.info(`מייצר סקיצה ${i + 1} מתוך 4...`);
        
        // Combine concept with campaign offer for stronger emphasis
        const enhancedVisualPrompt = campaignBrief.offer 
          ? `${selectedConcept.idea}. המסר המרכזי: ${campaignBrief.offer}`
          : selectedConcept.idea;
        
        const enhancedTextPrompt = campaignBrief.offer && !selectedConcept.copy.includes(campaignBrief.offer)
          ? `${selectedConcept.copy} - ${campaignBrief.offer}`
          : selectedConcept.copy;

        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: {
            visualPrompt: enhancedVisualPrompt,
            textPrompt: enhancedTextPrompt,
            style: 'modern',
            engine: 'nano-banana',
            brandContext,
            campaignContext,
          }
        });

        if (error) {
          console.error('Error generating image:', error);
          continue;
        }

        if (data?.imageUrl) {
          const newImage: GeneratedImage = {
            id: `${Date.now()}-${i}`,
            url: data.imageUrl,
            status: 'pending',
          };
          
          results.push(newImage);
          setGeneratedImages([...results]);

          toast.info(`מריץ בדיקת כשרות לסקיצה ${i + 1}... 🔍`);
          const kosherResult = await runKosherCheck(data.imageUrl);
          
          newImage.status = kosherResult.status as GeneratedImage['status'];
          newImage.analysis = kosherResult.recommendation;
          setGeneratedImages([...results]);

          await supabase.from('generated_images').insert({
            visual_prompt: enhancedVisualPrompt,
            text_prompt: enhancedTextPrompt,
            style: 'modern',
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
          />
        );
      case 4:
        return <StudioStyleStep value={style} onChange={setStyle} />;
      case 5:
        return (
          <StudioPromptStep
            visualPrompt={visualPrompt}
            onVisualPromptChange={setVisualPrompt}
            textPrompt={textPrompt}
            onTextPromptChange={setTextPrompt}
            style={style}
            hasProduct={assetChoice === 'has-product'}
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
                />
              </div>
            ) : (
              /* Manual Mode */
              <div>
                {/* Back to mode selection */}
                <button
                  onClick={() => setMode(null)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>חזרה לבחירת מסלול</span>
                </button>
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      שלב {actualStepIndex + 1} מתוך {totalSteps}
                    </span>
                    <span className="text-sm font-medium">{getStepTitles(mediaTypes)[currentStep]}</span>
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
                    disabled={actualStepIndex === 0}
                  >
                    <ChevronRight className="h-4 w-4 ml-1" />
                    הקודם
                  </Button>

                  {currentStep === 4 ? (
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
        ) : showQuote ? (
          /* Quote View */
          <div className="py-6">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => { setShowQuote(false); setShowMediaSelection(true); }} className="mb-4">
                <ChevronRight className="h-4 w-4 ml-1" />
                חזרה לבחירת מדיה
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
                <h2 className="text-2xl font-bold mb-2">בחירת מדיה ותקציב</h2>
                <p className="text-muted-foreground">הגדר את קהל היעד והתקציב, ונתאים לך חבילות מדיה מושלמות</p>
              </div>
            </div>
            
            <BudgetAudienceStep
              budget={mediaBudget}
              onBudgetChange={setMediaBudget}
              targetStream={mediaTargetStream}
              onTargetStreamChange={setMediaTargetStream}
              targetGender={mediaTargetGender}
              onTargetGenderChange={setMediaTargetGender}
              targetCity={mediaTargetCity}
              onTargetCityChange={setMediaTargetCity}
              selectedPackage={selectedMediaPackage}
              onPackageSelect={setSelectedMediaPackage}
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
                <Button variant="outline" onClick={() => {
                  setShowResults(false);
                  setCurrentStep(0);
                }}>
                  התחל מחדש
                </Button>
              </div>
            </div>

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
                    : 'grid grid-cols-2 lg:grid-cols-4 gap-4'
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
                            onClick={() => setEnlargedImageUrl(image.url)}
                          >
                            <span className="text-white text-sm font-medium">לחץ להגדלה</span>
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
                    {feedbackMode === 'none' && (
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
                          onClick={() => setFeedbackMode('small-fixes')}
                          className="gap-2 bg-card border-2 border-border hover:bg-muted"
                        >
                          <MessageSquare className="h-5 w-5" />
                          אהבתי! יש לי כמה תיקונים
                        </Button>
                      </div>
                    )}

                    {/* Feedback Text Area */}
                    {feedbackMode !== 'none' && (
                      <Card className="p-5 max-w-2xl mx-auto animate-fade-in">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">
                              {feedbackMode === 'another-round' 
                                ? 'מה היית רוצה לשנות בסבב הבא?' 
                                : 'אילו תיקונים נדרשים?'}
                            </h3>
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
                            placeholder={
                              feedbackMode === 'another-round'
                                ? 'פרט מה לא התחבר, מה חשוב להדגיש יותר - ברמת המלל או העיצוב...'
                                : 'פרט את התיקונים הנדרשים...'
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

                    {/* Fixed Approve Button */}
                    <div className="flex justify-center pt-4 border-t border-border mt-6">
                      <Button 
                        size="lg" 
                        onClick={handleProceedToMediaSelection} 
                        variant="gradient"
                        className="h-14 px-8 text-lg gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        הקו מאושר! ממשיכים למדיה
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    </div>
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
      
      {/* Enlarged Image Modal */}
      <Dialog open={!!enlargedImageUrl} onOpenChange={() => setEnlargedImageUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          <button 
            onClick={() => setEnlargedImageUrl(null)}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {enlargedImageUrl && (
            <img 
              src={enlargedImageUrl} 
              alt="תמונה מוגדלת" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreativeStudio;
