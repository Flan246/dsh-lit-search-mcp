import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type {
  searchPapers, citePaper, bibEntries, relatedPapers, formatPapers,
  Paper, Result,
} from 'dsh-lit-search/core'

export interface LitCore {
  searchPapers: typeof searchPapers
  citePaper: typeof citePaper
  bibEntries: typeof bibEntries
  relatedPapers: typeof relatedPapers
  formatPapers: typeof formatPapers
}

const SEARCH_SORTS = ['citations', 'date', 'relevance'] as const
const CITE_STYLES = ['gbt7714', 'gbt7714-numeric', 'apa', 'bibtex'] as const

type ToolResult = { isError?: true; content: { type: 'text'; text: string }[] }

function okText(text: string): ToolResult {
  return { content: [{ type: 'text', text }] }
}

function errText(code: string, message: string): ToolResult {
  return { isError: true, content: [{ type: 'text', text: `error[${code}]: ${message}` }] }
}

function asContent<T>(r: Result<T>, render: (d: T) => string): ToolResult {
  return r.ok ? okText(render(r.data)) : errText(r.error.code, r.error.message)
}

export function registerLitTools(server: McpServer, core: LitCore): void {
  server.registerTool(
    'lit_search',
    {
      description: 'Search academic papers on Crossref, OpenAlex and Semantic Scholar by keyword. Returns merged, deduplicated results with DOI and citation counts.',
      inputSchema: {
        query: z.string().describe('Search keywords'),
        limit: z.number().optional().describe('Max results (default 10)'),
        year_from: z.number().optional().describe('Earliest publication year'),
        year_to: z.number().optional().describe('Latest publication year'),
        sort: z.enum(SEARCH_SORTS).optional().describe('citations (default) | date | relevance'),
      },
    },
    async (args): Promise<ToolResult> => {
      if (args.sort !== undefined && !SEARCH_SORTS.includes(args.sort)) {
        return errText('BAD_ARGS', `unknown sort: ${args.sort}（citations | date | relevance）`)
      }
      return asContent(
        await core.searchPapers(args.query, {
          limit: args.limit,
          yearFrom: args.year_from,
          yearTo: args.year_to,
          sort: args.sort,
        }),
        core.formatPapers,
      )
    },
  )

  server.registerTool(
    'lit_cite',
    {
      description: 'Format a citation for a DOI. Styles: gbt7714 (Chinese standard), gbt7714-numeric (numbered), apa, bibtex.',
      inputSchema: {
        doi: z.string().describe('Paper DOI'),
        style: z.enum(CITE_STYLES).optional().describe('gbt7714 | gbt7714-numeric | apa | bibtex (default gbt7714)'),
      },
    },
    async (args): Promise<ToolResult> => {
      if (args.style !== undefined && !CITE_STYLES.includes(args.style)) {
        return errText('BAD_ARGS', `unknown style: ${args.style}（gbt7714 | gbt7714-numeric | apa | bibtex）`)
      }
      return asContent(await core.citePaper(args.doi, args.style ?? 'gbt7714'), String)
    },
  )

  server.registerTool(
    'lit_bib',
    {
      description: 'Generate BibTeX entries for a list of DOIs. Returns combined .bib content and the list of DOIs that failed.',
      inputSchema: {
        dois: z.array(z.string()).describe('Array of DOI strings'),
      },
    },
    async (args): Promise<ToolResult> =>
      asContent(await core.bibEntries(args.dois), (d) =>
        d.entries + (d.missing.length ? `\n-- missing: ${d.missing.join(', ')}` : '')),
  )

  server.registerTool(
    'lit_related',
    {
      description: 'Find related papers for a DOI via OpenAlex related_works.',
      inputSchema: {
        doi: z.string().describe('Paper DOI'),
        limit: z.number().optional().describe('Max results (default 10)'),
      },
    },
    async (args): Promise<ToolResult> =>
      asContent(await core.relatedPapers(args.doi, { limit: args.limit }), core.formatPapers),
  )
}
