export type SectorType = 'litvish' | 'chassidish' | 'sefardi' | 'modern' | 'general';

export type CampaignGoal = 'sale' | 'branding' | 'launch' | 'event';

export type CreativeVibe = 'aggressive' | 'prestige' | 'heimish';

export type MediaType = 'newspaper' | 'digital' | 'outdoor' | 'radio';

export type DesignDirection = 'consistent' | 'refresh';

export type CampaignStructure = 'single' | 'series';

export interface MediaOption {
  id: string;
  name: string;
  type: MediaType;
  sectors: SectorType[];
  reach: string;
  price: string;
  description: string;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
}

export interface BrandIdentity {
  name: string;
  logo: string | null;
  colors: BrandColors;
  headerFont: string;
  bodyFont: string;
}

export interface AdLayoutAnalysis {
  logoPosition: string; // e.g. "top-right", "top-left", "center-top"
  gridStructure: string; // e.g. "2-column split", "hero + text block"
  colorPalette: string[]; // hex colors extracted
  typography: string; // description of fonts/styles
  layoutNotes: string; // general observations
}

export interface UploadedMaterial {
  id: string;
  name: string;
  type: string;
  preview: string;
  adAnalysis?: AdLayoutAnalysis;
  isAnalyzing?: boolean;
}

export interface CampaignStrategy {
  designDirection: DesignDirection | null;
  startDate: Date | null;
  endDate: Date | null;
  structure: CampaignStructure | null;
}

// Strategic MRI Types
export type XFactorType = 'veteran' | 'product' | 'price' | 'service' | 'brand';

// TargetAudienceType removed - now using free text fields

export interface CompetitorPosition {
  id: string;
  name: string;
  x: number; // -100 (Cheap) to 100 (Premium)
  y: number; // -100 (Old School) to 100 (Modern)
}

export interface StrategicMRI {
  // Section 1: The 'Why You?' (X-Factor)
  xFactors: XFactorType[];
  primaryXFactor: XFactorType | null;
  otherXFactor: string; // Free text for 'Other' option
  
  // Section 2: Reality Check
  advantageType: 'hard' | 'soft' | null; // hard = product, soft = brand
  advantageSlider: number; // 0 (hard) to 100 (soft)
  winningFeature: string; // only if hard advantage
  
  // Section 3: The Arena
  competitors: string[];
  noCompetitors: boolean; // User confirmed they have no competitors
  myPosition: { x: number; y: number };
  competitorPositions: CompetitorPosition[];
  
  // Section 4: Target Audience (free text)
  endConsumer: string; // Who uses the product
  decisionMaker: string; // Who makes the purchase decision
}

// Contact Assets
export interface ContactAssets {
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  contact_address: string;
  website_url: string;
  contact_youtube: string;
  social_facebook: string;
  social_instagram: string;
  social_tiktok: string;
  social_linkedin: string;
}

// Website Insights (extracted from URL scan)
export interface WebsiteInsights {
  industry: string;
  seniority: string;
  coreOffering: string;
  audience: string;
  confirmed: boolean;
}

// Scraped branding info from Firecrawl
export interface ScrapedBranding {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  logo?: string;
}

export type HonorificType = 'mr' | 'mrs' | 'neutral';

export interface WizardData {
  // Step 0: Welcome
  userName: string;
  honorific: HonorificType;
  
  // Step 1: Magic Link
  websiteUrl: string;
  socialUrl: string; // Optional social media URL for data extraction
  isScanning: boolean;
  scrapedBranding?: ScrapedBranding; // Branding info from Firecrawl
  
  // Step 1.5: Website Insights Verification
  websiteInsights: WebsiteInsights;
  
  // Step 2: Strategic MRI
  strategicMRI: StrategicMRI;
  
  // Step 3: Brand Identity
  brand: BrandIdentity;
  
  // Step 4: Past Materials
  pastMaterials: UploadedMaterial[];
  businessPhotos: UploadedMaterial[]; // Product/business photos for use in ads
  
  // Contact Assets
  contactAssets: ContactAssets;
  
  // Step 5: Strategy & Scope
  strategy: CampaignStrategy;
  
  // Step 6: Confirmation
  confirmed: boolean;
}

export const initialContactAssets: ContactAssets = {
  contact_phone: '',
  contact_whatsapp: '',
  contact_email: '',
  contact_address: '',
  website_url: '',
  contact_youtube: '',
  social_facebook: '',
  social_instagram: '',
  social_tiktok: '',
  social_linkedin: '',
};

export const initialWizardData: WizardData = {
  userName: '',
  honorific: 'neutral',
  websiteUrl: '',
  socialUrl: '',
  isScanning: false,
  websiteInsights: {
    industry: '',
    seniority: '',
    coreOffering: '',
    audience: '',
    confirmed: false,
  },
  strategicMRI: {
    xFactors: [],
    primaryXFactor: null,
    otherXFactor: '',
    advantageType: null,
    advantageSlider: 50,
    winningFeature: '',
    competitors: [],
    noCompetitors: false,
    myPosition: { x: 0, y: 0 },
    competitorPositions: [],
    endConsumer: '',
    decisionMaker: '',
  },
  brand: {
    name: '',
    logo: null,
    colors: {
      primary: '',
      secondary: '',
      background: '#FFFFFF',
    },
    headerFont: 'Assistant',
    bodyFont: 'Heebo',
  },
  pastMaterials: [],
  businessPhotos: [],
  contactAssets: initialContactAssets,
  strategy: {
    designDirection: null,
    startDate: null,
    endDate: null,
    structure: null,
  },
  confirmed: false,
};

export const FONT_OPTIONS = [
  'Assistant',
  'Heebo',
  'Rubik',
  'Alef',
  'David Libre',
  'Frank Ruhl Libre',
  'Secular One',
  'Suez One',
];

export const REGIONS = [
  'ירושלים',
  'בני ברק',
  'מודיעין עילית',
  'ביתר עילית',
  'אשדוד',
  'בית שמש',
  'אלעד',
  'צפת',
  'פתח תקווה',
  'ארצי',
];

export const MEDIA_CATALOG: MediaOption[] = [
  {
    id: 'hamodia',
    name: 'המודיע',
    type: 'newspaper',
    sectors: ['litvish', 'chassidish'],
    reach: '80,000+',
    price: '₪₪₪',
    description: 'העיתון היומי המוביל במגזר החרדי',
  },
  {
    id: 'yated',
    name: 'יתד נאמן',
    type: 'newspaper',
    sectors: ['litvish'],
    reach: '60,000+',
    price: '₪₪₪',
    description: 'עיתון הדגל של הציבור הליטאי',
  },
  {
    id: 'mevaser',
    name: 'המבשר',
    type: 'newspaper',
    sectors: ['chassidish'],
    reach: '45,000+',
    price: '₪₪',
    description: 'עיתון חסידי מוביל',
  },
  {
    id: 'mishpacha',
    name: 'משפחה',
    type: 'newspaper',
    sectors: ['litvish', 'modern', 'chassidish'],
    reach: '100,000+',
    price: '₪₪₪₪',
    description: 'מגזין השבת הפופולרי ביותר',
  },
  {
    id: 'bakehila',
    name: 'בקהילה',
    type: 'newspaper',
    sectors: ['chassidish', 'sefardi'],
    reach: '50,000+',
    price: '₪₪',
    description: 'עיתון קהילתי עם חדירה גבוהה',
  },
  {
    id: 'behadrey',
    name: 'בחדרי חרדים',
    type: 'digital',
    sectors: ['litvish', 'chassidish', 'modern'],
    reach: '500,000+',
    price: '₪₪',
    description: 'אתר החדשות המוביל',
  },
  {
    id: 'kikar',
    name: 'כיכר השבת',
    type: 'digital',
    sectors: ['litvish', 'chassidish', 'sefardi'],
    reach: '400,000+',
    price: '₪₪',
    description: 'פורטל חדשות ותוכן',
  },
  {
    id: 'cola',
    name: 'קולה',
    type: 'digital',
    sectors: ['modern', 'litvish'],
    reach: '200,000+',
    price: '₪',
    description: 'פלטפורמה דיגיטלית צעירה',
  },
  {
    id: 'radio-kol-hai',
    name: 'רדיו קול חי',
    type: 'radio',
    sectors: ['litvish', 'chassidish', 'sefardi'],
    reach: '300,000+',
    price: '₪₪₪',
    description: 'תחנת הרדיו החרדית הגדולה',
  },
  {
    id: 'pashkevil',
    name: 'פשקווילים',
    type: 'outdoor',
    sectors: ['chassidish', 'litvish'],
    reach: 'משתנה',
    price: '₪',
    description: 'פרסום רחוב מסורתי',
  },
];
