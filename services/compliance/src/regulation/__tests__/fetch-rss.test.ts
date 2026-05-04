import { normalizeFeedForHash, parseRssItems } from '../fetch-rss'

describe('parseRssItems', () => {
  it('parses basic RSS items', () => {
    const xml = `<?xml version="1.0"?>
    <rss><channel>
      <item>
        <title><![CDATA[Test Title]]></title>
        <link>https://example.com/a</link>
        <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
      </item>
      <item>
        <title>Second</title>
        <link>https://example.com/b</link>
      </item>
    </channel></rss>`
    const items = parseRssItems(xml)
    expect(items).toHaveLength(2)
    expect(items[0]?.title).toBe('Test Title')
    expect(items[0]?.link).toBe('https://example.com/a')
  })
})

describe('normalizeFeedForHash', () => {
  it('sorts lines for stable hashing', () => {
    const a = normalizeFeedForHash([
      { title: 'b', link: '2', pubDate: '' },
      { title: 'a', link: '1', pubDate: '' },
    ])
    const b = normalizeFeedForHash([
      { title: 'a', link: '1', pubDate: '' },
      { title: 'b', link: '2', pubDate: '' },
    ])
    expect(a).toBe(b)
  })
})
