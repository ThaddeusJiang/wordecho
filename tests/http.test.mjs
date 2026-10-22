import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

test('HTTP adapter supports MCP initialization, card lookup and UI resources', async () => {
  const client = new Client({ name:'wordecho-http-acceptance', version:'0.1.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:43187/mcp')));
    const result = await client.callTool({ name:'pronounce_words', arguments:{ words:[{ word:'ledger' }] } });
    assert.equal(result.structuredContent.words[0].word, 'ledger');
    assert.equal((await client.readResource({ uri:'ui://wordecho/player-v0.1.2.html' })).contents[0].mimeType, 'text/html;profile=mcp-app');
    const invalid = await fetch('http://127.0.0.1:43187/api/words?word=https://example.com');
    assert.equal(invalid.status, 400);
    assert.match((await invalid.json()).error, /English text/);
  } finally { await client.close(); }
});
