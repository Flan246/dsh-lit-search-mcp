# dsh-lit-search-mcp

[![M8ven Score](https://m8ven.ai/badge/mcp/flan246-dsh-lit-search-mcp-wqqo48?v=dd5f6dae6851aff6869899d2ed311e73&variant=verified)](https://m8ven.ai/mcp/flan246-dsh-lit-search-mcp-wqqo48?s=readme)

MCP server for academic literature search, citation formatting (GB/T 7714 / APA) and BibTeX generation — Crossref + OpenAlex + Semantic Scholar, merged and deduplicated, **no API key needed**.

Thin MCP wrapper over [dsh-lit-search](https://www.npmjs.com/package/dsh-lit-search) (also available as a DeepSeek Harness plugin, a CLI, and a SKILL.md).

## Tools

| Tool | What it does |
|---|---|
| `lit_search` | Keyword search merged across Crossref / OpenAlex / Semantic Scholar, deduplicated by DOI, with citation counts. Options: `limit`, `year_from`, `year_to`, `sort` (citations/date/relevance). |
| `lit_cite` | Format a citation for a DOI: `gbt7714` (default, Chinese standard), `gbt7714-numeric`, `apa`, `bibtex`. |
| `lit_bib` | Batch BibTeX entries for a list of DOIs (reports which DOIs failed). |
| `lit_related` | Related works for a DOI via OpenAlex. |

## Install

Claude Code:

```bash
claude mcp add lit-search -- npx -y dsh-lit-search-mcp
```

Any MCP host (Cursor, ChatGPT, ...):

```json
{ "mcpServers": { "lit-search": { "command": "npx", "args": ["-y", "dsh-lit-search-mcp"] } } }
```

Requires Node.js ≥ 20. Listed on the official MCP Registry as `io.github.Flan246/dsh-lit-search`.

## License

MIT
