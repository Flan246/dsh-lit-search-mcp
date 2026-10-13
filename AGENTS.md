# dsh-lit-search-mcp

MCP server (stdio) wrapping the `dsh-lit-search` core — literature search, citations and BibTeX for any MCP host.

## Environment Note: pnpm precheck is broken on this machine

Do not use `pnpm test` / `pnpm build`. Call the binaries directly:

- Test: `./node_modules/.bin/vitest run`
- Build: `./node_modules/.bin/tsdown`

`pnpm-workspace.yaml` exists solely to declare `onlyBuiltDependencies: [esbuild]`. Keep the file to only that key.

## Conventions

- This package is a thin shell: zero business logic. All work happens in the `dsh-lit-search` dependency (`dsh-lit-search/core` subpath export).
- Tool handlers return MCP `isError: true` results for failures; never throw raw exceptions out of a handler.
- Tests use vitest with the core injected as stubs; never hit real APIs.
- `dist/` is intentionally NOT gitignored — build and commit before publishing.
- Publish flow (token + proxy): see `D:\cursor_file\docs\superpowers\plans\2026-10-13-dsh-lit-search-mcp.md` Task 6.
