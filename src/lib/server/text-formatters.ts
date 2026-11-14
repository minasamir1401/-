import * as cheerio from 'cheerio';

const PROSE_TAGS = new Set([
  'p',
  'blockquote',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'br',
  'hr',
  'sup',
  'sub',
]);

export function escapeBookText(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

export function readableChapter(html: string): string {
  const $ = cheerio.load(html);
  const article = $('#bodytext').first();
  const body = article.length ? article : $('body');
  body
    .find(
      'script, style, iframe, nav, form, .bs-demo-showcase, [id^="rcorners"], [id^="prayerMessage"], .visible-xs-block, .hidden-xs, .adsbygoogle, table.table-responsive',
    )
    .remove();
  const title = body.find('h1').last();
  const blocks =
    title.length && article.length
      ? body
          .children()
          .slice(body.children().index(title.parentsUntil(body).last().get(0) || title.get(0)!) + 1)
      : body.children();
  const output: string[] = [];

  for (const element of blocks) {
    const block = $(element);
    if (block.is('b') && block.find('p').length) {
      for (const paragraph of block.find('p')) {
        const text = normalizeWhitespace($(paragraph).text());
        if (/[\u0600-\u06ff]/.test(text) && !/St-Takla\.org Image|صورة في موقع الأنبا تكلا/.test(text)) {
          output.push(`<p>${escapeBookText(text)}</p>`);
        }
      }
      continue;
    }
    const text = normalizeWhitespace(block.text());
    if (
      !/[\u0600-\u06ff]/.test(text) ||
      /St-Takla\.org\s+Image|مكتبة الكتب المسيحية \||St-Takla\.org\s*>/i.test(text)
    ) {
      continue;
    }
    if (element.type !== 'tag') continue;
    if (['b', 'center'].includes(element.name) && block.find('a').length > 1) continue;
    if (element.name === 'span' && text.startsWith('_____')) {
      output.push(`<p>${escapeBookText(text.replace(/^_+\s*/, ''))}</p>`);
      continue;
    }
    const tag = /^h[2-6]$/.test(element.name) ? 'h3' : 'p';
    output.push(`<${tag}>${escapeBookText(text)}</${tag}>`);
  }

  return output.join('\n');
}

export function formatBibleCommentary(html: string): string {
  const $ = cheerio.load(html);
  const original = $('#bodytext').first();
  const article = original.length ? original : $('body');

  article
    .find(
      [
        'script',
        'style',
        'noscript',
        'iframe',
        'img',
        'svg',
        'video',
        'audio',
        'object',
        'embed',
        'nav',
        'header',
        'footer',
        'form',
        'button',
        'table',
        '[hidden]',
        '[aria-hidden="true"]',
        '[id^="rcorners"]',
        '[id^="prayerMessage"]',
        '#toggleText',
        '#hidethis',
        '#prev',
        '#next',
        '.visible-xs-block',
        '.bs-demo-showcase',
        '.adsbygoogle',
      ].join(','),
    )
    .remove();

  // Strip the source masthead while preserving exposition headings inside the commentary body.
  const sourceTitle = original.length ? article.find('h1').first() : null;
  const titleBlock = sourceTitle?.parentsUntil(article).last();
  const masthead = titleBlock?.length ? titleBlock : sourceTitle;
  if (masthead?.parent().is(article)) {
    masthead.prevAll().remove();
    masthead.remove();
  }

  article.find('p, div, font, span').each((_, element) => {
    const node = $(element);
    const text = node.text().trim();
    if (
      /^(?:[←→]\s*)?(?:اذهب مباشرة|انتقل مباشرة).*تفسير الآية/.test(text) ||
      /^(?:St-Takla\.org\s*Image|صورة في موقع الأنبا تكلا|اضغط هنا لإظهار الفهرس)/i.test(text)
    ) {
      if (!node.find('p,h1,h2,h3,ul,ol').length) node.remove();
    }
  });

  function render(node: (typeof article)[number] | ReturnType<typeof article.contents>[number]): string {
    if (node.type === 'text') return escapeBookText(node.data);
    if (node.type !== 'tag') return '';
    const content = node.children.map(render).join('');
    if (/^h[1-6]$/.test(node.name)) return content.trim() ? `<h4>${content}</h4>` : '';
    if (node.name === 'br' || node.name === 'hr') return `<${node.name}>`;
    if (PROSE_TAGS.has(node.name)) return content.trim() ? `<${node.name}>${content}</${node.name}>` : '';
    return content;
  }

  return article
    .contents()
    .map((_, node) => render(node))
    .get()
    .join('')
    .trim();
}
