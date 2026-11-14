import { load } from 'cheerio';
import { matchesOccasion, synaxariumDayForYear, synaxariumIndex } from './church-calendar';

export async function searchSynaxarium(query: string, year: number) {
  try {
    const response = await fetch(synaxariumIndex, {
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const $ = load(await response.text());
    return $('table tr').toArray().flatMap((row) => {
      const dateCell = $(row).find('td').first();
      const path = dateCell.find('a').attr('href') ?? '';
      const reference = /^\/synaxarium\/ar\/(\d{1,2})_(\d{1,2})#\d+$/.exec(path);
      const title = dateCell.next('td').text().trim();
      if (!reference || !matchesOccasion({ title }, query)) return [];
      const date = synaxariumDayForYear(year, Number(reference[1]), Number(reference[2]));
      return [{ title, copticDate: dateCell.text().trim(), date, source: new URL(path, synaxariumIndex).href }];
    }).slice(0, 12);
  } catch {
    return [];
  }
}
