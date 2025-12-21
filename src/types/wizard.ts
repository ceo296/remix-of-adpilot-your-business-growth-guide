export type SectorType = 'litvish' | 'chassidish' | 'sefardi' | 'modern' | 'general';

export type CampaignGoal = 'sale' | 'branding' | 'launch' | 'event';

export type CreativeVibe = 'aggressive' | 'prestige' | 'heimish';

export type MediaType = 'newspaper' | 'digital' | 'outdoor' | 'radio';

export interface MediaOption {
  id: string;
  name: string;
  type: MediaType;
  sectors: SectorType[];
  reach: string;
  price: string;
  description: string;
}

export interface WizardData {
  // Step 1: Audience
  sectors: SectorType[];
  regions: string[];
  
  // Step 2: Creative Direction
  campaignGoal: CampaignGoal | null;
  creativeVibe: CreativeVibe | null;
  mainOffer: string;
  
  // Step 3: Media Selection
  selectedMedia: string[];
  
  // Step 4: Summary
  contactName: string;
  contactPhone: string;
}

export const initialWizardData: WizardData = {
  sectors: [],
  regions: [],
  campaignGoal: null,
  creativeVibe: null,
  mainOffer: '',
  selectedMedia: [],
  contactName: '',
  contactPhone: '',
};

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
