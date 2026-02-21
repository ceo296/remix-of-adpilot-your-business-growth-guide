export type TargetEmotion = 'security' | 'joy' | 'prestige' | 'belonging';

export type AudienceSegment = 'men' | 'women' | 'young_couples' | 'grandparents';

export type CampaignStructureType = 'single' | 'serial' | 'teaser';

export type MediaChannel = 'newspapers' | 'street_posters' | 'digital' | 'radio';

export interface StrategicMRIData {
  productFunction: string;
  painProblem: string;
  targetEmotion: TargetEmotion | null;
  targetAudience: AudienceSegment[];
  conservatismLevel: number;
}

export interface CampaignConfigData {
  campaignStructure: CampaignStructureType | null;
  timing: string;
  mediaChannels: MediaChannel[];
}

export interface BrandAssetsData {
  logoFile: File | null;
  logoPreview: string | null;
  previousAds: File[];
  extractedColors: string[];
}

export interface CreativeResult {
  id: string;
  headline: string;
  bodyText: string;
  cta: string;
  imageUrl: string;
  visualLogic: string;
}

export interface MediaBudgetItem {
  channel: string;
  productName: string;
  specName: string;
  dimensions: string;
  reachReasoning: string;
  estimatedPrice: string;
}

export interface AdkopWizardData {
  mri: StrategicMRIData;
  campaign: CampaignConfigData;
  brand: BrandAssetsData;
  creatives: CreativeResult[];
  mediaBudget: MediaBudgetItem[];
}

export const CONSERVATISM_LABELS: Record<number, string> = {
  1: 'דתי/מודרני כללי',
  2: 'דתי-לאומי',
  3: 'חרדי-מודרני',
  4: 'חרדי ממוצע',
  5: 'חרדי מיינסטרים',
  6: 'חרדי שמרן',
  7: 'ליטאי קלאסי',
  8: 'חסידי ממוצע',
  9: 'חסידי שמרן',
  10: 'חסידי קיצוני/מסורתי',
};

export const TARGET_EMOTIONS: { value: TargetEmotion; label: string; icon: string }[] = [
  { value: 'security', label: 'ביטחון', icon: '🛡️' },
  { value: 'joy', label: 'שמחה', icon: '✨' },
  { value: 'prestige', label: 'יוקרה', icon: '👑' },
  { value: 'belonging', label: 'שייכות', icon: '🤝' },
];

export const AUDIENCE_SEGMENTS: { value: AudienceSegment; label: string }[] = [
  { value: 'men', label: 'גברים' },
  { value: 'women', label: 'נשים' },
  { value: 'young_couples', label: 'זוגות צעירים' },
  { value: 'grandparents', label: 'סבים וסבתות' },
];

export const CAMPAIGN_STRUCTURES: { value: CampaignStructureType; label: string; description: string }[] = [
  { value: 'single', label: 'מודעה בודדת', description: 'מודעה אחת חזקה וממוקדת' },
  { value: 'serial', label: 'קמפיין סדרתי', description: 'סדרת מודעות עם מסר מתפתח' },
  { value: 'teaser', label: 'קמפיין טיזר', description: 'בניית ציפייה עם חשיפה הדרגתית' },
];

export const TIMING_OPTIONS = [
  'כל השנה',
  'ראש השנה',
  'יום כיפור',
  'סוכות',
  'חנוכה',
  'פורים',
  'פסח',
  'שבועות',
  'בין הזמנים',
  'חודש אלול',
  'ט״ו בשבט',
  'ל״ג בעומר',
];

export const MEDIA_CHANNELS: { value: MediaChannel; label: string; icon: string }[] = [
  { value: 'newspapers', label: 'עיתונות', icon: '📰' },
  { value: 'street_posters', label: 'שילוט רחוב', icon: '🪧' },
  { value: 'digital', label: 'וואטסאפ/דיגיטל', icon: '📱' },
  { value: 'radio', label: 'רדיו', icon: '📻' },
];

export const initialAdkopData: AdkopWizardData = {
  mri: {
    productFunction: '',
    painProblem: '',
    targetEmotion: null,
    targetAudience: [],
    conservatismLevel: 5,
  },
  campaign: {
    campaignStructure: null,
    timing: 'כל השנה',
    mediaChannels: [],
  },
  brand: {
    logoFile: null,
    logoPreview: null,
    previousAds: [],
    extractedColors: [],
  },
  creatives: [],
  mediaBudget: [],
};
