import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { createServer as createHttpServer } from 'node:http';
import { pronunciation } from '../../../packages/core/pronunciation.mjs';
import html from 'wordecho:html';

const uri = 'ui://wordecho/player-v0.1.1.html';
const metadata = { ui: { prefersBorder: true, csp: { resourceDomains: ['https://dict.youdao.com'], connectDomains: [] } }, 'openai/widgetCSP': { resource_domains: ['https://dict.youdao.com'], connect_domains: [] } };
export function createServer() {
  const server = new McpServer({ name: 'WordEcho', version: '0.1.1' });
  server.registerResource('wordecho-player', uri, { mimeType: 'text/html;profile=mcp-app', _meta: metadata }, async () => ({ contents: [{ uri, mimeType: 'text/html;profile=mcp-app', text: html, _meta: metadata }] }));
  server.registerTool('pronounce_words', {
    title: 'Listen to English words',
    description: 'Show compact WordEcho cards with inline US then UK remote pronunciation links. Pass optional IPA and contextual meaning when known; the tool does not verify them. Does not play automatically.',
    inputSchema: { words: z.array(z.object({ word: z.string().min(1).max(120), ipa: z.string().max(200).optional(), meaning: z.string().max(500).optional() })).min(1).max(20) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    _meta: { ui: { resourceUri: uri }, 'openai/outputTemplate': uri, 'openai/widgetAccessible': true }
  }, async ({ words }) => {
    try {
      const result = { words: words.map(pronunciation) };
      return { structuredContent: result, content: [{ type: 'text', text: result.words.map(w => `${w.word} ${w.ipa} ${w.meaning}\nUK: ${w.audio.uk}\nUS: ${w.audio.us}`).join('\n\n') }] };
    } catch (error) { return { isError: true, content: [{ type:'text', text:error.message }] }; }
  });
  return server;
}

async function main() {
  if (!process.argv.includes('--http')) return createServer().connect(new StdioServerTransport());
  const host = process.env.WORDECHO_HOST || '127.0.0.1';
  const port = Number(process.env.WORDECHO_PORT || 43187);
  const http = createHttpServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(html); }
    if (req.method === 'GET' && url.pathname === '/health') { res.writeHead(200, { 'Content-Type':'application/json' }); return res.end(JSON.stringify({ name:'WordEcho', version:'0.1.1' })); }
    if (req.method === 'GET' && url.pathname === '/api/words') {
      try { const result = pronunciation({ word:url.searchParams.get('word') }); res.writeHead(200, { 'Content-Type':'application/json' }); return res.end(JSON.stringify({ words:[result] })); }
      catch (error) { res.writeHead(400, { 'Content-Type':'application/json' }); return res.end(JSON.stringify({ error:error.message })); }
    }
    if (url.pathname === '/mcp') {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator:undefined });
      res.on('close', () => { transport.close(); server.close(); });
      try { await server.connect(transport); await transport.handleRequest(req, res); }
      catch (error) { console.error(error); if (!res.headersSent) res.writeHead(500); res.end(); }
      return;
    }
    res.writeHead(404); res.end('Not found');
  });
  http.listen(port, host, () => console.error(`WordEcho listening on http://${host}:${port}`));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
