/**
 * Minimal RSS/Atom-ish parsing without extra dependencies.
 */

export interface RssItem {
  title: string
  link: string
  pubDate?: string
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim()
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = re.exec(block)
  return m ? stripCdata(m[1].trim()) : ''
}

export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1]
    const title = extractTag(block, 'title')
    const link =
      extractTag(block, 'link') ||
      extractTag(block, 'guid')
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'updated')
    if (title || link) {
      items.push({ title: title || '(untitled)', link: link || '', pubDate })
    }
  }
  return items
}

export function normalizeFeedForHash(items: RssItem[]): string {
  const lines = items.map(
    (i) => `${i.title}\t${i.link}\t${i.pubDate ?? ''}`
  )
  return lines.sort().join('\n')
}

export async function fetchText(url: string, timeoutMs = 25000): Promise<string> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AAH-RegulationWatch/1.0 (compliance; +https://example.invalid)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}
