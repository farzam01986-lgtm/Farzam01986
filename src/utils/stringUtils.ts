export function stripFeelings(text: string): string {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/\*[^*]+\*/g, '');
  cleaned = cleaned.replace(/\([^)]+\)/g, '');
  cleaned = cleaned.replace(/[（(][^）)]+[）)]/g, '');
  cleaned = cleaned.replace(/\[(?!(STICKER|DRAW):)[^\]]+\]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned || text;
}
