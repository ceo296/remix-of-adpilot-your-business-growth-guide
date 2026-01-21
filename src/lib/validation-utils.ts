/**
 * Validates if text contains meaningful Hebrew/English content
 * Not just random characters or gibberish
 */
export const isValidHebrewOrEnglishText = (text: string): boolean => {
  const trimmed = text.trim();
  
  // Must have at least 3 characters
  if (trimmed.length < 3) return false;
  
  // Must have at least 2 "words" (spaces between content) or be one meaningful word
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  
  // Check if text contains actual Hebrew or English letters (not just random characters)
  const hebrewPattern = /[\u0590-\u05FF]/; // Hebrew characters
  const englishPattern = /[a-zA-Z]/; // English characters
  
  const hasHebrew = hebrewPattern.test(trimmed);
  const hasEnglish = englishPattern.test(trimmed);
  
  // Must contain either Hebrew or English characters
  if (!hasHebrew && !hasEnglish) return false;
  
  // If Hebrew, must have at least one word with 2+ Hebrew letters
  if (hasHebrew) {
    const hasValidHebrewWord = words.some(word => {
      const hebrewChars = word.match(/[\u0590-\u05FF]/g) || [];
      return hebrewChars.length >= 2;
    });
    if (hasValidHebrewWord) return true;
  }
  
  // If English, must have at least one word with 2+ English letters
  if (hasEnglish) {
    const hasValidEnglishWord = words.some(word => {
      const englishChars = word.match(/[a-zA-Z]/g) || [];
      return englishChars.length >= 2;
    });
    if (hasValidEnglishWord) return true;
  }
  
  return false;
};

/**
 * Validates if the advertising offer is meaningful enough to proceed
 * Requires at least 5 characters and valid Hebrew/English content
 */
export const isValidAdvertisingOffer = (text: string): boolean => {
  const trimmed = text.trim();
  
  // Must be at least 5 characters for a meaningful offer
  if (trimmed.length < 5) return false;
  
  return isValidHebrewOrEnglishText(trimmed);
};
