import { HonorificType } from '@/types/wizard';

/**
 * Get personalized greeting based on honorific preference
 */
export const getGreeting = (honorific: HonorificType, userName?: string): string => {
  const name = userName || '';
  switch (honorific) {
    case 'mr':
      return `שלום אדון ${name}`.trim();
    case 'mrs':
      return `שלום גברת ${name}`.trim();
    default:
      return name ? `שלום ${name}` : 'שלום';
  }
};

/**
 * Get "what would you like" question based on honorific
 */
export const getWhatWouldYouLike = (honorific: HonorificType): string => {
  switch (honorific) {
    case 'mr':
      return 'מה תרצה ליצור?';
    case 'mrs':
      return 'מה תרצי ליצור?';
    default:
      return 'מה תרצו ליצור?';
  }
};

/**
 * Get personalized "you" word based on honorific
 */
export const getYouWord = (honorific: HonorificType, verb?: 'choose'): string => {
  if (verb === 'choose') {
    switch (honorific) {
      case 'mr':
        return 'בחר';
      case 'mrs':
        return 'בחרי';
      default:
        return 'בחרו';
    }
  }
  switch (honorific) {
    case 'mr':
      return 'אתה';
    case 'mrs':
      return 'את';
    default:
      return 'אתם';
  }
};

/**
 * Get possessive "your" word based on honorific  
 */
export const getYourWord = (honorific: HonorificType): string => {
  switch (honorific) {
    case 'mr':
      return 'שלך';
    case 'mrs':
      return 'שלך';
    default:
      return 'שלכם';
  }
};

/**
 * Get personalized verb conjugation based on honorific
 * For common verbs used in the wizard
 */
export const getVerb = (verb: 'do' | 'choose' | 'continue' | 'tell' | 'upload' | 'confirm' | 'fill', honorific: HonorificType): string => {
  const verbs: Record<string, Record<HonorificType, string>> = {
    do: { mr: 'עשית', mrs: 'עשית', neutral: 'עשיתם' },
    choose: { mr: 'בחר', mrs: 'בחרי', neutral: 'בחרו' },
    continue: { mr: 'המשך', mrs: 'המשיכי', neutral: 'המשיכו' },
    tell: { mr: 'ספר', mrs: 'ספרי', neutral: 'ספרו' },
    upload: { mr: 'העלה', mrs: 'העלי', neutral: 'העלו' },
    confirm: { mr: 'אשר', mrs: 'אשרי', neutral: 'אשרו' },
    fill: { mr: 'מלא', mrs: 'מלאי', neutral: 'מלאו' },
  };
  
  return verbs[verb]?.[honorific] || verbs[verb]?.neutral || '';
};

/**
 * Get a friendly title prefix
 */
export const getTitlePrefix = (honorific: HonorificType): string => {
  switch (honorific) {
    case 'mr':
      return 'אדון';
    case 'mrs':
      return 'גברת';
    default:
      return '';
  }
};

/**
 * Get welcome greeting with honorific
 */
export const getWelcomeGreeting = (honorific: HonorificType): string => {
  switch (honorific) {
    case 'mr':
      return 'ברוך הבא!';
    case 'mrs':
      return 'ברוכה הבאה!';
    default:
      return 'ברוכים הבאים!';
  }
};
