import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wand2, Shield, ChevronLeft, ChevronRight, Sparkles, Loader2, ImageIcon, ZoomIn, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StudioAssetStep } from '@/components/studio/StudioAssetStep';
import { StudioTreatmentStep } from '@/components/studio/StudioTreatmentStep';
import { StudioStyleStep, StyleChoice } from '@/components/studio/StudioStyleStep';
import { StudioPromptStep } from '@/components/studio/StudioPromptStep';
import { StudioModeToggle, StudioMode } from '@/components/studio/StudioModeToggle';
import { StudioAutopilot, CreativeConcept } from '@/components/studio/StudioAutopilot';

type AssetChoice = 'has-product' | 'no-product';
type TreatmentChoice = 'as-is' | 'ai-magic';

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
}

const STEP_TITLES = [
  'בחירת נכס',
  'עיבוד תמונה',
  'סגנון עיצובי',
  'תיאור ותוכן',
];

const CreativeStudio = () => {
  // Client profile state
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  
  // Mode state
  const [mode, setMode] = useState<StudioMode>('manual');
  
  // Autopilot state
  const [concepts, setConcepts] = useState<CreativeConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<CreativeConcept | null>(null);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [assetChoice, setAssetChoice] = useState<AssetChoice | null>(null);
  const [treatment, setTreatment] = useState<TreatmentChoice | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [style, setStyle] = useState<StyleChoice | null>(null);
  const [visualPrompt, setVisualPrompt] = useState('');
  const [textPrompt, setTextPrompt] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Fetch client profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('business_name, target_audience, primary_x_factor, winning_feature, advantage_type, x_factors')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setClientProfile(profile);
      }
    };

    fetchProfile();
  }, []);

  // Calculate actual steps based on asset choice
  const getSteps = () => {
    if (assetChoice === 'no-product') {
      // Skip treatment step for no-product flow
      return [0, 2, 3]; // Asset, Style, Prompt
    }
    return [0, 1, 2, 3]; // All steps
  };

  const steps = getSteps();
  const actualStepIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return assetChoice !== null;
      case 1: return uploadedImage !== null && treatment !== null;
      case 2: return style !== null;
      case 3: return visualPrompt.trim().length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && assetChoice === 'no-product') {
      setCurrentStep(2); // Skip to style
    } else if (actualStepIndex < totalSteps - 1) {
      setCurrentStep(steps[actualStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStep === 2 && assetChoice === 'no-product') {
      setCurrentStep(0); // Go back to asset
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
      for (let i = 0; i < 4; i++) {
        toast.info(`מייצר סקיצה ${i + 1} מתוך 4...`);
        
        const { data, error } = await supabase.functions.invoke('generate-creative', {
          body: {
            prompt: `${visualPrompt}. טקסט: ${textPrompt || 'ללא טקסט'}`,
            style: style || 'default',
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
    setAssetChoice(null);
    setTreatment(null);
    setUploadedImage(null);
    setStyle(null);
    setVisualPrompt('');
    setTextPrompt('');
    setGeneratedImages([]);
    setShowResults(false);
    setConcepts([]);
    setSelectedConcept(null);
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
        body: { profile }
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
      
      for (let i = 0; i < 4; i++) {
        toast.info(`מייצר סקיצה ${i + 1} מתוך 4...`);
        
        const { data, error } = await supabase.functions.invoke('generate-creative', {
          body: {
            prompt: `${selectedConcept.idea}. טקסט: ${selectedConcept.copy}`,
            style: 'modern',
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
            visual_prompt: selectedConcept.idea,
            text_prompt: selectedConcept.copy,
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
        return <StudioAssetStep value={assetChoice} onChange={setAssetChoice} />;
      case 1:
        return (
          <StudioTreatmentStep
            treatment={treatment}
            onTreatmentChange={setTreatment}
            uploadedImage={uploadedImage}
            onImageUpload={setUploadedImage}
          />
        );
      case 2:
        return <StudioStyleStep value={style} onChange={setStyle} />;
      case 3:
        return (
          <StudioPromptStep
            visualPrompt={visualPrompt}
            onVisualPromptChange={setVisualPrompt}
            textPrompt={textPrompt}
            onTextPromptChange={setTextPrompt}
            style={style}
            hasProduct={assetChoice === 'has-product'}
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
            {/* Mode Toggle */}
            <div className="mb-8">
              <StudioModeToggle value={mode} onChange={setMode} />
            </div>

            {mode === 'autopilot' ? (
              /* Autopilot Mode */
              <StudioAutopilot
                isGenerating={isGeneratingConcepts || isGenerating}
                concepts={concepts}
                selectedConcept={selectedConcept}
                clientInfo={clientProfile ? {
                  business_name: clientProfile.business_name,
                  target_audience: clientProfile.target_audience
                } : null}
                onGenerateConcepts={handleGenerateConcepts}
                onSelectConcept={setSelectedConcept}
                onExecuteConcept={handleExecuteConcept}
              />
            ) : (
              /* Manual Mode */
              <>
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      שלב {actualStepIndex + 1} מתוך {totalSteps}
                    </span>
                    <span className="text-sm font-medium">{STEP_TITLES[currentStep]}</span>
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

                  {currentStep === 3 ? (
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
                      onClick={handleNext}
                      disabled={!canProceed()}
                    >
                      הבא
                      <ChevronLeft className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                הסקיצות שלך
              </h2>
              <Button variant="outline" onClick={resetWizard}>
                התחל מחדש
              </Button>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {generatedImages.map((image) => (
                  <Card key={image.id} className={`overflow-hidden group ${image.status === 'rejected' ? 'opacity-50' : ''}`}>
                    <div className="relative aspect-square bg-muted">
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
                        <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary">
                            <Wand2 className="h-4 w-4 ml-1" />
                            עריכה
                          </Button>
                          <Button size="sm" variant="secondary">
                            <ZoomIn className="h-4 w-4 ml-1" />
                            הגדלה
                          </Button>
                          <Button size="sm" variant="secondary">
                            <Type className="h-4 w-4 ml-1" />
                            טקסט
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Kosher Check Info */}
            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              כל תמונה עוברת בדיקת כשרות אוטומטית
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeStudio;
