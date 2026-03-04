/**
 * Template Matcher — analyzes client's past_materials adAnalysis data
 * and recommends the best grid template from the database.
 */

interface AdAnalysis {
  logoPosition?: string;
  gridStructure?: string;
  colorPalette?: string[];
  typography?: string;
  layoutNotes?: string;
}

interface TemplateCandidate {
  id: string;
  name: string;
  html_template: string;
}

interface MatchResult {
  templateId: string;
  templateName: string;
  confidence: number; // 0-100
  reasons: string[];
}

/**
 * Score a template against a single adAnalysis object.
 */
function scoreTemplate(template: TemplateCandidate, analysis: AdAnalysis): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const html = template.html_template.toLowerCase();
  const grid = (analysis.gridStructure || '').toLowerCase();
  const logo = (analysis.logoPosition || '').toLowerCase();
  const notes = (analysis.layoutNotes || '').toLowerCase();

  // --- Grid structure matching ---
  
  // Headline position detection
  const headlineTop = grid.includes('header') || grid.includes('top') || grid.includes('upper');
  const headlineBottom = grid.includes('bottom') || grid.includes('lower') || grid.includes('footer');
  const headlineCenter = grid.includes('center') || grid.includes('middle') || grid.includes('band');

  // Match template name/structure hints
  const templateName = template.name.toLowerCase();

  if (headlineTop && (templateName.includes('עליונה') || html.includes('top-zone') || html.includes('top:'))) {
    score += 30;
    reasons.push('כותרת עליונה תואמת למיקום הכותרת ברפרנס');
  }
  if (headlineBottom && (templateName.includes('תחתונה') || html.includes('bottom-zone'))) {
    score += 30;
    reasons.push('כותרת תחתונה תואמת לגריד הרפרנס');
  }
  if (headlineCenter && (templateName.includes('מרכזי') || html.includes('center-band'))) {
    score += 30;
    reasons.push('פס מרכזי תואם לגריד הרפרנס');
  }

  // Full-bleed image detection
  if ((grid.includes('full-bleed') || grid.includes('full bleed') || notes.includes('photo background')) && 
      html.includes('object-fit:cover')) {
    score += 10;
    reasons.push('תמונה מלאה ברקע כמו ברפרנס');
  }

  // --- Logo position matching ---
  if (logo.includes('top-right') || logo.includes('top right')) {
    if (html.includes('top') && html.includes('right') && html.includes('logo')) {
      score += 15;
      reasons.push('מיקום לוגו ימין-עליון תואם');
    }
  }
  if (logo.includes('top-left') || logo.includes('top left')) {
    if (html.includes('top') && html.includes('left') && html.includes('logo')) {
      score += 15;
      reasons.push('מיקום לוגו שמאל-עליון תואם');
    }
  }
  if (logo.includes('bottom')) {
    if (html.includes('bottom') && html.includes('logo')) {
      score += 15;
      reasons.push('מיקום לוגו תחתון תואם');
    }
  }

  // --- Style matching ---
  if (notes.includes('gradient') && html.includes('gradient')) {
    score += 5;
    reasons.push('שימוש בגרדיאנטים תואם');
  }
  if (notes.includes('minimal') && templateName.includes('מינימליסט')) {
    score += 10;
    reasons.push('סגנון מינימליסטי תואם');
  }
  if ((notes.includes('luxury') || notes.includes('premium')) && templateName.includes('סינמטי')) {
    score += 10;
    reasons.push('סגנון פרימיום/יוקרה תואם');
  }
  if (notes.includes('overlay') && html.includes('backdrop-filter')) {
    score += 5;
    reasons.push('שכבות שקופות תואמות');
  }

  // --- Contact bar detection ---
  if (grid.includes('footer') || grid.includes('contact') || grid.includes('info bar')) {
    if (html.includes('contact-bar') || html.includes('footer-bar')) {
      score += 10;
      reasons.push('פס קשר תחתון תואם');
    }
  }

  return { score, reasons };
}

/**
 * Match multiple adAnalysis objects against available templates.
 * Returns the best matching template with confidence score.
 */
export function matchTemplateFromAnalysis(
  templates: TemplateCandidate[],
  analyses: AdAnalysis[]
): MatchResult | null {
  if (!templates.length || !analyses.length) return null;

  const templateScores = templates.map(template => {
    let totalScore = 0;
    const allReasons: string[] = [];

    for (const analysis of analyses) {
      const { score, reasons } = scoreTemplate(template, analysis);
      totalScore += score;
      allReasons.push(...reasons);
    }

    // Average across analyses
    const avgScore = Math.round(totalScore / analyses.length);
    // Dedupe reasons
    const uniqueReasons = [...new Set(allReasons)];

    return {
      templateId: template.id,
      templateName: template.name,
      confidence: Math.min(avgScore, 100),
      reasons: uniqueReasons,
    };
  });

  // Sort by confidence descending
  templateScores.sort((a, b) => b.confidence - a.confidence);

  const best = templateScores[0];
  // Only recommend if confidence > 20
  if (best.confidence < 20) return null;

  return best;
}

/**
 * Build a concise layout instruction string from adAnalysis for AI agents.
 */
export function buildLayoutInstructions(analyses: AdAnalysis[]): string {
  if (!analyses.length) return '';

  const instructions: string[] = [];
  instructions.push('=== הנחיות גריד מבוססות חומרי לקוח קיימים ===');

  for (let i = 0; i < analyses.length; i++) {
    const a = analyses[i];
    const parts: string[] = [];
    if (a.gridStructure) parts.push(`מבנה: ${a.gridStructure}`);
    if (a.logoPosition) parts.push(`לוגו: ${a.logoPosition}`);
    if (a.typography) parts.push(`טיפוגרפיה: ${a.typography}`);
    if (a.layoutNotes) parts.push(`סגנון: ${a.layoutNotes}`);
    if (parts.length) {
      instructions.push(`רפרנס ${i + 1}: ${parts.join(' | ')}`);
    }
  }

  instructions.push('');
  instructions.push('חובה: שמור על אותו סגנון גריד, מיקום לוגו, והיררכיית טקסט כמו ברפרנסים.');
  instructions.push('אל תשנה את המבנה אלא אם הלקוח ביקש במפורש גריד חדש.');

  return instructions.join('\n');
}
