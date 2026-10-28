const arabicScript = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/gu;

export function photoEnglishText(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const englishPart = text.split(/\s+(?:\/|\|)\s+/)[0];
  const cleaned = englishPart.replace(arabicScript, '').replace(/\s+/g, ' ').trim();
  return cleaned || text.replace(arabicScript, '').replace(/\s+/g, ' ').trim();
}
