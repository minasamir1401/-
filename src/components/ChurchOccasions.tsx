import Link from 'next/link';
import { churchHymns, copticDateLabel, formatOccasionDate, occasionHref, synaxariumSource, type ChurchOccasion } from '@/lib/church-calendar';

export function OccasionDates({ occasion }: { occasion: ChurchOccasion }) {
  if (!occasion.start) return null;
  return (
    <span>
      <time dateTime={occasion.start}>{formatOccasionDate(occasion.start)}</time>
      {occasion.end && occasion.end !== occasion.start && (
        <> – <time dateTime={occasion.end}>{formatOccasionDate(occasion.end)}</time></>
      )}
    </span>
  );
}

export function OccasionCard({ occasion }: { occasion: ChurchOccasion }) {
  const relatedHymn = churchHymns.find((hymn) => hymn.id === occasion.relatedHymn);
  return (
    <article id={occasion.id} className="card-manuscript p-4 md:p-5 space-y-2 scroll-mt-24">
      <div className="media-muted text-xs flex flex-wrap gap-x-3 gap-y-1">
        <span>{occasion.kind}</span>
        <OccasionDates occasion={occasion} />
        {occasion.synaxarium && occasion.start && <span>{copticDateLabel(occasion.start)}</span>}
      </div>
      <h3 className="font-bold text-lg">{occasion.title}</h3>
      {occasion.summary && <p className="media-muted text-sm leading-relaxed">{occasion.summary}</p>}
      {occasion.audio && (
        <div className="space-y-1">
          <audio controls preload="none" src={occasion.audio.src} aria-label={occasion.title} className="block w-full max-w-md" />
          <p className="media-muted text-xs">التسجيل من {occasion.audio.credit}</p>
        </div>
      )}
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {occasion.synaxarium && <li><a href="#synaxarium" className="underline underline-offset-4">سنكسار اليوم داخل الموقع</a></li>}
        {relatedHymn && (
          <li><a href={`#${relatedHymn.id}`} className="underline underline-offset-4">{relatedHymn.title}</a></li>
        )}
        {occasion.sources.map(({ label, href }) => (
          <li key={href}><a className="underline underline-offset-4" href={href} target="_blank" rel="noreferrer">{label}</a></li>
        ))}
      </ul>
    </article>
  );
}

export function AnnualOccasions({ events, year }: { events: ChurchOccasion[]; year: number }) {
  return (
    <details id="year-calendar" className="card-manuscript p-5 scroll-mt-24">
      <summary className="font-bold cursor-pointer">تقويم الأعياد والأصوام لسنة {year.toLocaleString('ar-EG', { useGrouping: false })}</summary>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {events.map((occasion) => (
          <li key={occasion.id}>
            <Link href={occasionHref(occasion)} className="media-action h-full w-full items-start flex-col gap-1">
              <span className="font-bold">{occasion.title}</span>
              <span className="text-xs media-muted"><OccasionDates occasion={occasion} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function SynaxariumSource({ date }: { date: string }) {
  return (
    <a href={synaxariumSource(date)} className="underline underline-offset-4 text-sm" target="_blank" rel="noreferrer">
      اقرأ سنكسار اليوم في المرجع القبطي
    </a>
  );
}
