export function stripTashkeel(input: string): string {
  return input.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

export function normalizeArabic(input: string): string {
  return stripTashkeel(input)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function safeDecodeSlug(raw: string): string {
  let curr = raw;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(curr);
      if (next === curr) break;
      curr = next;
    } catch {
      break;
    }
  }
  return curr;
}
