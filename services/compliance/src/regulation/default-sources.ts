import type { RegulationSourceType } from '@prisma/client'

export interface DefaultRegulationSourceDef {
  sourceType: RegulationSourceType
  name: string
  feedUrl: string
  pollCronMinutes: number
}

/**
 * Official feeds first — URLs are public news/RSS endpoints.
 * Institutions may override via DB row updates.
 */
export const DEFAULT_REGULATION_SOURCES: DefaultRegulationSourceDef[] = [
  {
    sourceType: 'NCAA',
    name: 'ncaa-news-rss',
    feedUrl: 'https://www.ncaa.org/news/rss',
    pollCronMinutes: 360,
  },
  {
    sourceType: 'FEDERAL',
    name: 'federal-register-ncaa',
    feedUrl:
      'https://www.federalregister.gov/api/v1/documents.rss?per_page=20&order=newest&conditions%5Bterm%5D=NCAA',
    pollCronMinutes: 720,
  },
  {
    sourceType: 'STATE_OK',
    name: 'ok-legislature-rss',
    feedUrl: 'https://www.oklegislature.gov/rss/news.aspx',
    pollCronMinutes: 720,
  },
  {
    sourceType: 'SUMMIT_LEAGUE',
    name: 'summit-league-news',
    feedUrl: 'https://thesummitleague.org/rss.aspx',
    pollCronMinutes: 360,
  },
]
