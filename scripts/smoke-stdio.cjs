#!/usr/bin/env node
// 最小 MCP stdio 握手：initialize → notifications/initialized → tools/list。
// 用法: node scripts/smoke-stdio.cjs [mcp.js 路径]  （默认 ./dist/mcp.js）
const { spawn } = require('node:child_process')
const path = require('node:path')

const target = process.argv[2] ?? path.join(__dirname, '..', 'dist', 'mcp.js')
const child = spawn(process.execPath, [target], { stdio: ['pipe', 'pipe', 'inherit'] })

let buf = ''
const results = []
child.stdout.on('data', (d) => {
  buf += d.toString()
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim()
    buf = buf.slice(i + 1)
    if (line) results.push(JSON.parse(line))
  }
})

const send = (msg) => child.stdin.write(JSON.stringify(msg) + '\n')

send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '0.0.0' } } })

setTimeout(() => {
  send({ jsonrpc: '2.0', method: 'notifications/initialized' })
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
}, 500)

setTimeout(() => {
  child.kill()
  const init = results.find((r) => r.id === 1)
  const list = results.find((r) => r.id === 2)
  const names = list?.result?.tools?.map((t) => t.name) ?? []
  const ok = init?.result?.serverInfo?.name === 'dsh-lit-search-mcp'
    && ['lit_search', 'lit_cite', 'lit_bib', 'lit_related'].every((n) => names.includes(n))
  console.log(ok ? `SMOKE OK: ${names.join(',')}` : `SMOKE FAIL: ${JSON.stringify(results)}`)
  process.exit(ok ? 0 : 1)
}, 3000)
