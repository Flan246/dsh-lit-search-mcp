#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { searchPapers, citePaper, bibEntries, relatedPapers, formatPapers } from 'dsh-lit-search/core'
import { registerLitTools } from './tools.js'

const server = new McpServer({ name: 'dsh-lit-search-mcp', version: '0.1.0' })
registerLitTools(server, { searchPapers, citePaper, bibEntries, relatedPapers, formatPapers })
await server.connect(new StdioServerTransport())
