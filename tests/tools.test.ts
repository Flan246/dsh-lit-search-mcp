import { describe, it, expect } from 'vitest'
import { registerLitTools } from '../src/tools.js'
import type { Paper } from 'dsh-lit-search/core'

// 假 server：捕获注册内容，handler 直接可调
type Handler = (args: any) => Promise<any>
function fakeServer() {
  const tools = new Map<string, { meta: any; handler: Handler }>()
  return {
    tools,
    registerTool(name: string, meta: any, handler: Handler) {
      tools.set(name, { meta, handler })
    },
  } as any
}

const paper: Paper = {
  doi: '10.1234/x', title: 'A Paper', authors: ['Ann', 'Bob'],
  year: 2024, venue: 'J', citationCount: 7, source: 'openalex', url: null,
}

function stubCore(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    searchPapers: async () => ({ ok: true as const, data: [paper] }),
    citePaper: async () => ({ ok: true as const, data: '张三. 标题[J]. 期刊, 2024.' }),
    bibEntries: async () => ({ ok: true as const, data: { entries: '@article{a}', missing: [] } }),
    relatedPapers: async () => ({ ok: true as const, data: [paper] }),
    formatPapers: (ps: Paper[]) => ps.map((p) => p.title).join('\n'),
    ...overrides,
  } as any
}

describe('registerLitTools', () => {
  it('registers exactly the four lit_* tools', () => {
    const s = fakeServer()
    registerLitTools(s, stubCore())
    expect([...s.tools.keys()].sort()).toEqual(['lit_bib', 'lit_cite', 'lit_related', 'lit_search'])
  })

  it('declares read-only, non-destructive, idempotent, open-world behavior for every tool', () => {
    const s = fakeServer()
    registerLitTools(s, stubCore())
    for (const { meta } of s.tools.values()) {
      expect(meta.annotations).toEqual({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      })
    }
  })

  it('lit_search maps snake_case args to core opts and renders papers', async () => {
    const s = fakeServer()
    let seen: any
    const core = stubCore()
    core.searchPapers = async (_q: string, opts: any) => { seen = opts; return { ok: true as const, data: [paper] } }
    registerLitTools(s, core)
    const r = await s.tools.get('lit_search')!.handler({ query: 'q', limit: 5, year_from: 2020, year_to: 2025, sort: 'date' })
    expect(seen).toEqual({ limit: 5, yearFrom: 2020, yearTo: 2025, sort: 'date' })
    expect(r.isError).toBeUndefined()
    expect(r.content[0].text).toContain('A Paper')
  })

  it('lit_cite defaults style to gbt7714', async () => {
    const s = fakeServer()
    let style: any
    const core = stubCore()
    core.citePaper = async (_d: string, st: any) => { style = st; return { ok: true as const, data: 'x' } }
    registerLitTools(s, core)
    const r = await s.tools.get('lit_cite')!.handler({ doi: '10.1/a' })
    expect(style).toBe('gbt7714')
    expect(r.content[0].text).toBe('x')
  })

  it('lit_bib appends missing DOIs to output', async () => {
    const s = fakeServer()
    const core = stubCore()
    core.bibEntries = async () => ({ ok: true as const, data: { entries: '@article{a}', missing: ['10.1/bad'] } })
    registerLitTools(s, core)
    const r = await s.tools.get('lit_bib')!.handler({ dois: ['10.1/a', '10.1/bad'] })
    expect(r.content[0].text).toContain('@article{a}')
    expect(r.content[0].text).toContain('10.1/bad')
  })

  it('core failure becomes isError with code and message, never throws', async () => {
    const s = fakeServer()
    const core = stubCore()
    core.searchPapers = async () => ({ ok: false as const, error: { code: 'HTTP_500', message: 'boom' } })
    registerLitTools(s, core)
    const r = await s.tools.get('lit_search')!.handler({ query: 'q' })
    expect(r.isError).toBe(true)
    expect(r.content[0].text).toContain('HTTP_500')
    expect(r.content[0].text).toContain('boom')
  })

  it('invalid sort becomes isError without calling core', async () => {
    const s = fakeServer()
    let called = false
    const core = stubCore()
    core.searchPapers = async () => { called = true; return { ok: true as const, data: [] } }
    registerLitTools(s, core)
    const r = await s.tools.get('lit_search')!.handler({ query: 'q', sort: 'nope' })
    expect(called).toBe(false)
    expect(r.isError).toBe(true)
    expect(r.content[0].text).toContain('unknown sort')
  })
})
