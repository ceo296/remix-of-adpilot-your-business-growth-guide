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

export interface UploadedMaterial {
  id: string;
  name: string;
  type: string;
  preview: string;
}

export interface CampaignStrategy {
  designDirection: DesignDirection | null;
  startDate: Date | null;
  endDate: Date | null;
  structure: CampaignStructure | null;
}

export interface WizardData {
  // Step 1: Magic Link
  websiteUrl: string;
  isScanning: boolean;
  
  // Step 2: Brand Identity
  brand: BrandIdentity;
  
  // Step 3: Past Materials
  pastMaterials: UploadedMaterial[];
  
  // Step 4: Strategy & Scope
  strategy: CampaignStrategy;
  
  // Step 5: Confirmation
  confirmed: boolean;
}

export const initialWizardData: WizardData = {
  websiteUrl: '',
  isScanning: false,
  brand: {
    name: '',
    logo: null,
    colors: {
      primary: '#E31E24',
      secondary: '#000000',
      background: '#FFFFFF',
    },
    headerFont: 'Assistant',
    bodyFont: 'Heebo',
  },
  pastMaterials: [],
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
