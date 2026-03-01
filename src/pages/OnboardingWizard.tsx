import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardData, WizardDataUpdate, initialWizardData, ContactAssets, HonorificType } from '@/types/wizard';
import { getGreeting, getTitlePrefix } from '@/lib/honorific-utils';
import WizardProgress from '@/components/wizard/WizardProgress';
import StepWelcome from '@/components/wizard/StepWelcome';
import StepFlowChoice from '@/components/wizard/StepFlowChoice';
import StepSelectClient from '@/components/wizard/StepSelectClient';
import StepMagicLink from '@/components/wizard/StepMagicLink';
import StepWebsiteInsights from '@/components/wizard/StepWebsiteInsights';
import StepStrategicMRI from '@/components/wizard/StepStrategicMRI';
import StepContactAssets from '@/components/wizard/StepContactAssets';
import StepPastMaterials from '@/components/wizard/StepPastMaterials';
import StepBrandPassport from '@/components/wizard/StepBrandPassport';
import { Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const TOTAL_STEPS_REGULAR = 8;
const TOTAL_STEPS_AGENCY = 9; // Extra step for client selection

const stepTitlesRegular = [
  'ברוכים הבאים',
  'בחירת מסלול',
  'הלינק הקסום',
  'מה למדנו עליכם',
  'פרטי יצירת קשר',
  'ה-MRI האסטרטגי',
  'חומרי עבר',
  'דרכון המותג',
];

const stepTitlesAgency = [
  'ברוכים הבאים',
  'בחירת לקוח',
  'בחירת מסלול',
  'הלינק הקסום',
  'מה למדנו עליכם',
  'פרטי יצירת קשר',
  'ה-MRI האסטרטגי',
  'חומרי עבר',
  'דרכון המותג',
];

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizardData);
  const [isSaving, setIsSaving] = useState(false);
  const [isAgency, setIsAgency] = useState(false);
  const [selectedAgencyClientId, setSelectedAgencyClientId] = useState<string | null>(null);

  const TOTAL_STEPS = isAgency ? TOTAL_STEPS_AGENCY : TOTAL_STEPS_REGULAR;
  const stepTitles = isAgency ? stepTitlesAgency : stepTitlesRegular;

   // Redirect to auth if not logged in (skip for admins), or to dashboard if already completed onboarding
   useEffect(() => {
     if (authLoading || adminLoading) return;
     if (isAdmin) return;
     
     if (!user) {
       navigate('/auth?redirect=/onboarding');
       return;
     }
     
      const checkOnboardingStatus = async () => {
        // Check if there are any incomplete profiles - if so, don't redirect
        const { data: profiles } = await supabase
          .from('client_profiles')
          .select('onboarding_completed, business_name, is_agency_profile')
          .eq('user_id', user.id)
          .eq('is_agency_profile', false);
        
        if (profiles && profiles.length > 0) {
          const hasIncomplete = profiles.some(p => !p.onboarding_completed);
          if (!hasIncomplete) {
            const firstName = profiles[0]?.business_name || '';
            toast.info(`שלום ${firstName}! כבר סיימת את ההיכרות – מעבירים אותך ליצירת קמפיין 🚀`);
            navigate('/dashboard');
          }
        }
      };
     
     checkOnboardingStatus();
   }, [user, authLoading, adminLoading, isAdmin, navigate]);

   // Load existing profile colors/brand from DB (works for both admins and regular users)
   useEffect(() => {
     if (!user || authLoading) return;
     
      const loadProfileBrand = async () => {
        // Load the most recent incomplete profile, or the latest one
        const { data: profiles } = await supabase
          .from('client_profiles')
          .select('id, business_name, primary_color, secondary_color, background_color, logo_url, header_font, body_font, onboarding_completed')
          .eq('user_id', user.id)
          .eq('is_agency_profile', false)
          .order('created_at', { ascending: false });
        
        // Prefer incomplete profile, otherwise use the latest
        const profile = profiles?.find(p => !p.onboarding_completed) || profiles?.[0] || null;
       
       if (profile && (profile.primary_color || profile.secondary_color)) {
         setWizardData((prev) => ({
           ...prev,
           brand: {
             ...prev.brand,
             name: profile.business_name || prev.brand.name,
             logo: profile.logo_url || prev.brand.logo,
             colors: {
               primary: profile.primary_color || prev.brand.colors.primary,
               secondary: profile.secondary_color || prev.brand.colors.secondary,
               background: profile.background_color || prev.brand.colors.background,
             },
             headerFont: profile.header_font || prev.brand.headerFont,
             bodyFont: profile.body_font || prev.brand.bodyFont,
           },
         }));
       }
     };
     
     loadProfileBrand();
   }, [user, authLoading]);

  const updateData = (newData: WizardDataUpdate) => {
    setWizardData((prev) => {
      const merged = { ...prev, ...newData } as WizardData;
      // Deep-merge brand to prevent stale closures from wiping colors/logo
      if (newData.brand) {
        merged.brand = {
          ...prev.brand,
          ...newData.brand,
          colors: {
            ...prev.brand.colors,
            ...(newData.brand?.colors || {}),
          },
        } as WizardData['brand'];
      }
      return merged;
    });
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (currentStep > 1) {
        toast.success('שכוייח! ממשיכים הלאה');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

   const uploadLogoToStorage = async (dataUrl: string, userId: string): Promise<string | null> => {
    try {
      // Auto-convert PDF logos to PNG so they render everywhere
      const { ensureImageDataUrl } = await import('@/lib/logo-utils');
      dataUrl = await ensureImageDataUrl(dataUrl);

      // Extract the file type and base64 data
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;

      const mimeType = match[1];
      const base64Data = match[2];
      const extension = mimeType.split('/')[1] || 'png';
      const fileName = `${userId}/logo-${Date.now()}.${extension}`;

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('brand-assets')
        .upload(fileName, blob, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error('Error uploading logo:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error processing logo upload:', error);
      return null;
    }
  };

  const uploadBusinessPhotos = async (photos: any[], userId: string): Promise<any[]> => {
    const uploadedPhotos: any[] = [];
    for (const photo of photos.slice(0, 10)) {
      try {
        if (!photo.preview) continue;
        const match = photo.preview.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) continue;
        const mimeType = match[1];
        const base64Data = match[2];
        const extension = mimeType.split('/')[1] || 'jpg';
        const fileName = `${userId}/business-photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${extension}`;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const { data, error } = await supabase.storage
          .from('brand-assets')
          .upload(fileName, blob, { contentType: mimeType, upsert: true });
        if (error) { console.error('Error uploading business photo:', error); continue; }
        const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(data.path);
        uploadedPhotos.push({ name: photo.name, url: urlData.publicUrl });
      } catch (err) {
        console.error('Error uploading business photo:', err);
      }
    }
    return uploadedPhotos;
  };

  const extractColorsFromLogo = async (imageDataUrl: string): Promise<{ primary: string; secondary: string; background: string } | null> => {
    try {

      const { data, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: { imageBase64: imageDataUrl }
      });

      if (error) {
        console.error('Error extracting colors:', error);
        // Check for payment/credits error
        if (error.message?.includes('402') || error.message?.includes('Payment')) {
          toast.info('חילוץ צבעים אוטומטי לא זמין כרגע - תוכל לבחור צבעים ידנית');
        }
        return null;
      }

      // Check for 402 in the response data
      if (data?.error && (data.error.includes('402') || data.error.includes('Payment'))) {
        toast.info('חילוץ צבעים אוטומטי לא זמין כרגע - תוכל לבחור צבעים ידנית');
        return null;
      }

      if (data?.colors) {
        return data.colors;
      }
      return null;
    } catch (error) {
      console.error('Error calling extract-logo-colors:', error);
      return null;
    }
  };

  const handleWelcomeComplete = async (userName: string, brandName: string, logo: string | null, isAgencyUser: boolean, honorific: HonorificType) => {
    setIsAgency(isAgencyUser);
    
    // Upload logo to storage if provided
    let logoUrl: string | null = null;
    let extractedColors: { primary: string; secondary: string; background: string } | null = null;
    
    if (logo && user) {
      // Extract colors from logo using AI (before uploading)
      toast.loading('מנתח צבעים מהלוגו...', { id: 'color-extract' });
      extractedColors = await extractColorsFromLogo(logo);
      toast.dismiss('color-extract');
      
      if (extractedColors) {
        toast.success('צבעים חולצו בהצלחה מהלוגו!');
      }
      
      // Upload logo to storage
      logoUrl = await uploadLogoToStorage(logo, user.id);
    }
    
    setWizardData((prev) => ({
      ...prev,
      userName,
      honorific,
      brand: {
        ...prev.brand,
        name: brandName,
        logo: logoUrl || logo,
        // Use extracted colors if available
        colors: extractedColors ? {
          primary: extractedColors.primary,
          secondary: extractedColors.secondary,
          background: extractedColors.background,
        } : prev.brand.colors,
      },
    }));
    
    // Personalized greeting - no אדון/גברת prefix, just the name
    const greeting = `שלום ${userName}!`;
    toast.success(`${greeting} נעים להכיר`);
    nextStep();
  };

  const handleSelectClient = (clientId: string, clientName: string, clientLogo: string | null, websiteUrl: string | null) => {
    setSelectedAgencyClientId(clientId);
    setWizardData((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        name: clientName,
        logo: clientLogo,
      },
      websiteUrl: websiteUrl || '',
    }));
    toast.success(`מעולה! מתחילים היכרות עם ${clientName}`);
    nextStep();
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error('נא להתחבר כדי לשמור את הנתונים');
      return;
    }

    setIsSaving(true);
    
    try {
      // Upload business photos to storage
      let businessPhotoUrls: any[] = [];
      if (wizardData.businessPhotos && wizardData.businessPhotos.length > 0) {
        toast.loading('מעלה תמונות עסק...', { id: 'upload-photos' });
        businessPhotoUrls = await uploadBusinessPhotos(wizardData.businessPhotos, user.id);
        toast.dismiss('upload-photos');
        if (businessPhotoUrls.length > 0) {
          toast.success(`${businessPhotoUrls.length} תמונות עסק הועלו בהצלחה`);
        }
      }

      // Upload past materials to storage  
      let pastMaterialsData: any[] = [];
      if (wizardData.pastMaterials && wizardData.pastMaterials.length > 0) {
        pastMaterialsData = wizardData.pastMaterials.map(m => ({
          name: m.name,
          type: m.type,
          adAnalysis: m.adAnalysis || null,
        }));
      }

      // Update profile with user name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: wizardData.userName,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // For agencies, update the selected client profile
      if (isAgency && selectedAgencyClientId) {
        const { error: clientError } = await supabase
          .from('client_profiles')
          .update({
            business_name: wizardData.brand.name,
            website_url: wizardData.websiteUrl || null,
            primary_color: wizardData.brand.colors.primary,
            secondary_color: wizardData.brand.colors.secondary,
            background_color: wizardData.brand.colors.background,
            header_font: wizardData.brand.headerFont,
            body_font: wizardData.brand.bodyFont,
            x_factors: wizardData.strategicMRI.xFactors,
            primary_x_factor: wizardData.strategicMRI.primaryXFactor,
            advantage_type: wizardData.strategicMRI.advantageType,
            advantage_slider: wizardData.strategicMRI.advantageSlider,
            winning_feature: wizardData.strategicMRI.winningFeature,
            competitors: wizardData.strategicMRI.competitors,
            my_position_x: wizardData.strategicMRI.myPosition.x,
            my_position_y: wizardData.strategicMRI.myPosition.y,
            competitor_positions: JSON.parse(JSON.stringify(wizardData.strategicMRI.competitorPositions)),
            end_consumer: wizardData.strategicMRI.endConsumer,
            decision_maker: wizardData.strategicMRI.decisionMaker,
            contact_phone: wizardData.contactAssets.contact_phone || null,
            contact_whatsapp: wizardData.contactAssets.contact_whatsapp || null,
            contact_email: wizardData.contactAssets.contact_email || null,
            contact_address: wizardData.contactAssets.contact_address || null,
            contact_youtube: wizardData.contactAssets.contact_youtube || null,
            social_facebook: wizardData.contactAssets.social_facebook || null,
            social_instagram: wizardData.contactAssets.social_instagram || null,
            social_tiktok: wizardData.contactAssets.social_tiktok || null,
            social_linkedin: wizardData.contactAssets.social_linkedin || null,
            business_photos: businessPhotoUrls,
            past_materials: pastMaterialsData,
            onboarding_completed: true,
          })
          .eq('id', selectedAgencyClientId);

        if (clientError) throw clientError;
        
        // Also ensure the agency profile exists
        const { data: agencyProfile } = await supabase
          .from('client_profiles')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_agency_profile', true)
          .maybeSingle();

        if (!agencyProfile) {
          // Create agency profile if doesn't exist
          await supabase.from('client_profiles').insert({
            user_id: user.id,
            business_name: wizardData.userName + ' Agency',
            is_agency_profile: true,
            onboarding_completed: true,
          });
        }
      } else {
        // Regular user flow - find the incomplete profile or the most recent one
        const { data: profiles } = await supabase
          .from('client_profiles')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_agency_profile', false)
          .order('created_at', { ascending: false });
        
        const existingProfile = profiles?.find(p => true) || null; // get first

        if (existingProfile) {
          // Update existing client profile
          const { error: clientError } = await supabase
            .from('client_profiles')
            .update({
              business_name: wizardData.brand.name,
              logo_url: wizardData.brand.logo || null,
              website_url: wizardData.websiteUrl || null,
              primary_color: wizardData.brand.colors.primary,
              secondary_color: wizardData.brand.colors.secondary,
              background_color: wizardData.brand.colors.background,
              header_font: wizardData.brand.headerFont,
              body_font: wizardData.brand.bodyFont,
              x_factors: wizardData.strategicMRI.xFactors,
              primary_x_factor: wizardData.strategicMRI.primaryXFactor,
              advantage_type: wizardData.strategicMRI.advantageType,
              advantage_slider: wizardData.strategicMRI.advantageSlider,
              winning_feature: wizardData.strategicMRI.winningFeature,
              competitors: wizardData.strategicMRI.competitors,
              my_position_x: wizardData.strategicMRI.myPosition.x,
              my_position_y: wizardData.strategicMRI.myPosition.y,
              competitor_positions: JSON.parse(JSON.stringify(wizardData.strategicMRI.competitorPositions)),
              end_consumer: wizardData.strategicMRI.endConsumer,
              decision_maker: wizardData.strategicMRI.decisionMaker,
              contact_phone: wizardData.contactAssets.contact_phone || null,
              contact_whatsapp: wizardData.contactAssets.contact_whatsapp || null,
              contact_email: wizardData.contactAssets.contact_email || null,
              contact_address: wizardData.contactAssets.contact_address || null,
              contact_youtube: wizardData.contactAssets.contact_youtube || null,
              social_facebook: wizardData.contactAssets.social_facebook || null,
              social_instagram: wizardData.contactAssets.social_instagram || null,
              social_tiktok: wizardData.contactAssets.social_tiktok || null,
              social_linkedin: wizardData.contactAssets.social_linkedin || null,
              is_agency_profile: false,
              business_photos: businessPhotoUrls,
              past_materials: pastMaterialsData,
              onboarding_completed: true,
              honorific_preference: wizardData.honorific,
            })
            .eq('id', existingProfile.id);

          if (clientError) throw clientError;
        } else {
          // Create new client profile
          const { error: clientError } = await supabase
            .from('client_profiles')
            .insert([{
              user_id: user.id,
              business_name: wizardData.brand.name,
              logo_url: wizardData.brand.logo || null,
              website_url: wizardData.websiteUrl || null,
              primary_color: wizardData.brand.colors.primary,
              secondary_color: wizardData.brand.colors.secondary,
              background_color: wizardData.brand.colors.background,
              header_font: wizardData.brand.headerFont,
              body_font: wizardData.brand.bodyFont,
              x_factors: wizardData.strategicMRI.xFactors,
              primary_x_factor: wizardData.strategicMRI.primaryXFactor,
              advantage_type: wizardData.strategicMRI.advantageType,
              advantage_slider: wizardData.strategicMRI.advantageSlider,
              winning_feature: wizardData.strategicMRI.winningFeature,
              competitors: wizardData.strategicMRI.competitors,
              my_position_x: wizardData.strategicMRI.myPosition.x,
              my_position_y: wizardData.strategicMRI.myPosition.y,
              competitor_positions: JSON.parse(JSON.stringify(wizardData.strategicMRI.competitorPositions)),
              end_consumer: wizardData.strategicMRI.endConsumer,
              decision_maker: wizardData.strategicMRI.decisionMaker,
              contact_phone: wizardData.contactAssets.contact_phone || null,
              contact_whatsapp: wizardData.contactAssets.contact_whatsapp || null,
              contact_email: wizardData.contactAssets.contact_email || null,
              contact_address: wizardData.contactAssets.contact_address || null,
              contact_youtube: wizardData.contactAssets.contact_youtube || null,
              social_facebook: wizardData.contactAssets.social_facebook || null,
              social_instagram: wizardData.contactAssets.social_instagram || null,
              social_tiktok: wizardData.contactAssets.social_tiktok || null,
              social_linkedin: wizardData.contactAssets.social_linkedin || null,
              is_agency_profile: false,
              business_photos: businessPhotoUrls,
              past_materials: pastMaterialsData,
              onboarding_completed: true,
              honorific_preference: wizardData.honorific,
            }]);

          if (clientError) throw clientError;
        }
      }

      toast.success('בשעה טובה! המותג והקמפיין מוכנים');
      navigate('/dashboard?welcome=true');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error('שגיאה בשמירת הנתונים, נסו שוב');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while checking auth
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Don't render if not authenticated (unless admin)
  if (!user && !isAdmin) {
    return null;
  }

  const handleContactAssetsChange = (data: Partial<ContactAssets>) => {
    setWizardData((prev) => ({
      ...prev,
      contactAssets: { ...prev.contactAssets, ...data },
    }));
  };

  const handleMediaOnlyChoice = () => {
    // Navigate to FastTrackWizard with media-only mode
    navigate('/new-campaign?mode=media-only');
  };

  const handleCampaignChoice = () => {
    // Continue with full campaign onboarding
    nextStep();
  };

  const renderStep = () => {
    // Agency flow has an extra step after welcome
    if (isAgency) {
      switch (currentStep) {
        case 1:
          return <StepWelcome onNext={handleWelcomeComplete} />;
        case 2:
          return <StepSelectClient onNext={handleSelectClient} onPrev={prevStep} />;
        case 3:
          return (
            <StepFlowChoice
              userName={wizardData.userName}
              brandName={wizardData.brand.name}
              honorific={wizardData.honorific}
              onChooseMedia={handleMediaOnlyChoice}
              onChooseCampaign={handleCampaignChoice}
              onPrev={prevStep}
            />
          );
        case 4:
          return <StepMagicLink data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
        case 5:
          return <StepWebsiteInsights data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
        case 6:
          const agencyContactValid = wizardData.contactAssets.contact_phone?.trim() && wizardData.contactAssets.contact_email?.trim();
          return (
            <div className="space-y-6">
              <StepContactAssets data={wizardData.contactAssets} onChange={handleContactAssetsChange} />
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>הקודם</Button>
                <Button onClick={nextStep} disabled={!agencyContactValid}>הבא</Button>
              </div>
            </div>
          );
        case 7:
          return <StepStrategicMRI data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
        case 8:
          return <StepPastMaterials data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
        case 9:
          return <StepBrandPassport data={wizardData} updateData={updateData} onComplete={handleComplete} onPrev={prevStep} />;
        default:
          return null;
      }
    }

    // Regular user flow
    switch (currentStep) {
      case 1:
        return <StepWelcome onNext={handleWelcomeComplete} />;
      case 2:
        return (
          <StepFlowChoice
            userName={wizardData.userName}
            brandName={wizardData.brand.name}
            honorific={wizardData.honorific}
            onChooseMedia={handleMediaOnlyChoice}
            onChooseCampaign={handleCampaignChoice}
            onPrev={prevStep}
          />
        );
      case 3:
        return <StepMagicLink data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <StepWebsiteInsights data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 5:
        const contactValid = wizardData.contactAssets.contact_phone?.trim() && wizardData.contactAssets.contact_email?.trim();
        return (
          <div className="space-y-6">
            <StepContactAssets data={wizardData.contactAssets} onChange={handleContactAssetsChange} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>הקודם</Button>
              <Button onClick={nextStep} disabled={!contactValid}>הבא</Button>
            </div>
          </div>
        );
      case 6:
        return <StepStrategicMRI data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 7:
        return <StepPastMaterials data={wizardData} updateData={updateData} onNext={nextStep} onPrev={prevStep} />;
      case 8:
        return <StepBrandPassport data={wizardData} updateData={updateData} onComplete={handleComplete} onPrev={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold">
                <span className="logo-black">AD</span>
                <span className="logo-red">KOP</span>
              </span>
              <span className="text-sm text-muted-foreground mr-2">| בס״ד</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {wizardData.userName && (
              <span className="text-sm font-medium text-foreground">
                {wizardData.honorific === 'neutral' 
                  ? `שלום, ${wizardData.userName}`
                  : `שלום ${getTitlePrefix(wizardData.honorific)} ${wizardData.userName}`
                }
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              שלב {currentStep} מתוך {TOTAL_STEPS}
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <WizardProgress 
        currentStep={currentStep} 
        totalSteps={TOTAL_STEPS} 
        stepTitles={stepTitles} 
      />

      {/* Step Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

export default OnboardingWizard;
