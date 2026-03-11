/**
 * Typography Strategy System — "The Typographer's Brain"
 * 
 * Centralized typography rules for campaigns, presentations, and brand materials.
 * Used by AI agents and UI components to ensure consistent, professional typography.
 */

// ============================================================
// 1. FONT PAIRING PRESETS
// ============================================================

export type TypographyStyle = 
  | 'sales-active'     // מכירתי/אקטיבי
  | 'tech-clean'       // טכנולוגי/נקי
  | 'traditional'      // מסורתי/אמין
  | 'luxury-legacy'    // יוקרה/Legacy (presentations)
  | 'elegant-classic'  // אלגנטי/שמרני (presentations)
  | 'modern-minimal';  // מודרני/מינימליסטי (presentations)

export interface FontPairing {
  id: TypographyStyle;
  nameHe: string;
  description: string;
  useCase: 'campaign' | 'presentation' | 'both';
  header: {
    family: string;
    weight: number;
    lineHeight: number;      // unitless ratio
    letterSpacing: string;   // CSS value
  };
  body: {
    family: string;
    weight: number;
    lineHeight: number;
    letterSpacing: string;
  };
  subtitle?: {
    family: string;
    weight: number;
  };
}

export const FONT_PAIRINGS: Record<TypographyStyle, FontPairing> = {
  'sales-active': {
    id: 'sales-active',
    nameHe: 'מכירתי / אקטיבי',
    description: 'כותרות חזקות ודומיננטיות. מתאים לקמפיינים שדורשים אקשן מיידי.',
    useCase: 'campaign',
    header: { family: 'Suez One', weight: 400, lineHeight: 1.1, letterSpacing: '-0.02em' },
    body: { family: 'Heebo', weight: 400, lineHeight: 1.6, letterSpacing: '0' },
    subtitle: { family: 'Rubik', weight: 700 },
  },
  'tech-clean': {
    id: 'tech-clean',
    nameHe: 'טכנולוגי / נקי',
    description: 'מדרג כולו בפונט אחד — ההבדל דרך משקל בלבד. מראה מודרני.',
    useCase: 'both',
    header: { family: 'Assistant', weight: 800, lineHeight: 1.15, letterSpacing: '-0.01em' },
    body: { family: 'Assistant', weight: 300, lineHeight: 1.7, letterSpacing: '0.01em' },
  },
  'traditional': {
    id: 'traditional',
    nameHe: 'מסורתי / אמין',
    description: 'משדר יציבות, ביטחון ואמינות. מתאים לעסקים ותיקים.',
    useCase: 'campaign',
    header: { family: 'Secular One', weight: 400, lineHeight: 1.15, letterSpacing: '0' },
    body: { family: 'Heebo', weight: 400, lineHeight: 1.6, letterSpacing: '0' },
  },
  'luxury-legacy': {
    id: 'luxury-legacy',
    nameHe: 'יוקרה / Legacy',
    description: 'כותרות ענק סריפיות עם טקסט רץ דק — ניגודיות של "מיליון דולר".',
    useCase: 'presentation',
    header: { family: 'Frank Ruhl Libre', weight: 700, lineHeight: 1.05, letterSpacing: '-0.03em' },
    body: { family: 'Assistant', weight: 300, lineHeight: 1.8, letterSpacing: '0.02em' },
  },
  'elegant-classic': {
    id: 'elegant-classic',
    nameHe: 'אלגנטי / שמרני',
    description: 'מראה מעודן ומכובד. מתאים לקהל שמרני.',
    useCase: 'presentation',
    header: { family: 'David Libre', weight: 700, lineHeight: 1.1, letterSpacing: '0' },
    body: { family: 'Heebo', weight: 400, lineHeight: 1.7, letterSpacing: '0' },
  },
  'modern-minimal': {
    id: 'modern-minimal',
    nameHe: 'מודרני / מינימליסטי',
    description: 'כותרות ברווחים גדולים. חלל לבן כעיקרון עיצוב.',
    useCase: 'presentation',
    header: { family: 'Alef', weight: 700, lineHeight: 1.2, letterSpacing: '0.15em' },
    body: { family: 'Heebo', weight: 300, lineHeight: 1.8, letterSpacing: '0.01em' },
  },
};

// ============================================================
// 2. FINISHING RULES (2026 Standard)
// ============================================================

export const TYPOGRAPHY_FINISHING_RULES = {
  // Contrast is King: never same weight for header and body
  contrastMinDelta: 300, // minimum weight difference (e.g., 900 vs 400)
  
  // Haredi Tone: avoid childish or broken fonts
  forbiddenStyles: ['cursive', 'comic', 'handwriting', 'graffiti'],
  
  // Hierarchy First: size determines importance, not color
  headerSizeMultiplier: 2.5,  // header ≥ 2.5× body size
  subtitleSizeMultiplier: 1.4, // subtitle ≥ 1.4× body size
};

// ============================================================
// 3. CSS PRESET GENERATOR
// ============================================================

export function getTypographyCSSVars(style: TypographyStyle): Record<string, string> {
  const pairing = FONT_PAIRINGS[style];
  if (!pairing) return {};

  return {
    '--typo-header-family': `'${pairing.header.family}', serif`,
    '--typo-header-weight': String(pairing.header.weight),
    '--typo-header-line-height': String(pairing.header.lineHeight),
    '--typo-header-letter-spacing': pairing.header.letterSpacing,
    '--typo-body-family': `'${pairing.body.family}', sans-serif`,
    '--typo-body-weight': String(pairing.body.weight),
    '--typo-body-line-height': String(pairing.body.lineHeight),
    '--typo-body-letter-spacing': pairing.body.letterSpacing,
  };
}

// ============================================================
// 4. AI PROMPT INJECTION
// ============================================================

/** Returns a typography instruction block for AI agents */
export function getTypographyPromptBlock(
  context: 'campaign' | 'presentation',
  brandHeaderFont?: string,
  brandBodyFont?: string,
): string {
  const relevantPairings = Object.values(FONT_PAIRINGS).filter(
    p => p.useCase === context || p.useCase === 'both'
  );

  const pairingDescriptions = relevantPairings.map(p => 
    `• ${p.nameHe}: כותרות ב-${p.header.family} (${p.header.weight}), טקסט ב-${p.body.family} (${p.body.weight}). ${p.description}`
  ).join('\n');

  const brandOverride = brandHeaderFont 
    ? `\n⚡ פונט המותג הנוכחי: כותרות="${brandHeaderFont}", גוף="${brandBodyFont || 'Heebo'}". השתמש בו כברירת מחדל אלא אם הלקוח ביקש סגנון ספציפי.`
    : '';

  return `
═══ אסטרטגיית טיפוגרפיה (Typography Strategy 2026) ═══

📋 זוגות פונטים מומלצים ל${context === 'campaign' ? 'קמפיינים' : 'מצגות'}:
${pairingDescriptions}
${brandOverride}

🔒 חוקי Finishing (בלתי ניתנים לעקיפה):
1. CONTRAST IS KING: לעולם אל תשתמש באותו משקל לכותרת ולטקסט. מינימום 300 הפרש (למשל: כותרת 900, טקסט 400).
2. HAREDI TONE: הטיפוגרפיה חייבת לשדר מכובדות. אסור פונטים "ילדותיים", "שבורים" או cursive.
3. HIERARCHY FIRST: גודל ומשקל הפונט קובעים חשיבות — לא צבע. כותרת ≥ פי 2.5 מגוף הטקסט.
4. LINE-HEIGHT: בכותרות — צפוף (1.05-1.15) ליצירת "גוש" מסר. בגוף — מרווח (1.6-1.8) לקריאות.
5. NEGATIVE SPACE: שטח לבן = יוקרה. הגדל כותרת מול טקסט קטן לניגודיות של "מיליון דולר".

${context === 'presentation' ? `
🎨 אסטרטגיה למצגות:
• יוקרה/Legacy: כותרות ענק ב-Frank Ruhl Libre + Assistant דק.
• אלגנטי: David Libre למראה מכובד.
• מינימליסטי: Alef עם Letter-Spacing גדול.
` : `
🎯 אסטרטגיה לקמפיינים:
• מכירתי: Suez One / Rubik Bold לכותרות עם Heebo לטקסט.
• טכנולוגי: Assistant בכל המדרג (Extra Bold → Light).
• מסורתי: Secular One לכותרות — משדר יציבות.
• Line-Height מצומצם בכותרות ליצירת "גוש" מסר עוצמתי.
`}`;
}

// ============================================================
// 5. STYLE MATCHER
// ============================================================

/** Auto-select best typography style based on campaign/presentation context */
export function matchTypographyStyle(params: {
  context: 'campaign' | 'presentation';
  vibe?: string;     // aggressive | prestige | heimish
  theme?: string;    // corporate | minimal | creative
  industry?: string; // for future refinement
}): TypographyStyle {
  const { context, vibe, theme } = params;

  if (context === 'presentation') {
    switch (theme) {
      case 'minimal': return 'modern-minimal';
      case 'creative': return 'luxury-legacy';
      case 'corporate': 
      default: return 'elegant-classic';
    }
  }

  // Campaign context
  switch (vibe) {
    case 'aggressive': return 'sales-active';
    case 'prestige': return 'luxury-legacy';
    case 'heimish': return 'traditional';
    default: return 'tech-clean';
  }
}

// ============================================================
// 6. PRIVACY RULE PROMPT (Asset Isolation)
// ============================================================

export const ASSET_ISOLATION_PROMPT = `
═══ חוק בל יעבור — בידוד נכסי לקוח (Customer Privacy & Isolation) ═══

1. נכסים שהועלו על ידי משתמש (פונטים, לוגו, צילומים אישיים) משויכים אך ורק ל-Unique ID של אותו לקוח.
2. חל איסור מוחלט להציע, להציג או להשתמש בפונט שהועלה על ידי לקוח X עבור מותג של לקוח Y.
3. במקרה שבו לקוח אחר מבקש סגנון דומה, יש להשתמש אך ורק בספריית הפונטים הציבורית (Google Fonts) או בפונטים שרכשה המערכת לכלל המשתמשים, או להציע ללקוח להעלות פונט בעצמו.
4. כל "חתימת איכות" או "DNA מותגי" שנגזר מפונט פרטי שמור תחת הרשאות המשתמש המקורי בלבד.
`;
