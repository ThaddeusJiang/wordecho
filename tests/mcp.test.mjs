import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('installed package exposes interactive tool and remote-only player', async () => {
  const transport = new StdioClientTransport({ command:process.execPath, args:[process.env.WORDECHO_SERVER || 'plugins/openai/dist/server.cjs'] });
  const client = new Client({ name:'wordecho-acceptance', version:'0.1.0' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const tool = tools.find(t => t.name === 'pronounce_words');
    assert.equal(tool._meta.ui.resourceUri, 'ui://wordecho/player-v0.1.1.html');
    const result = await client.callTool({ name:'pronounce_words', arguments:{ words:[{ word:'Cambridge', ipa:'/ˈkeɪm.brɪdʒ/', meaning:'剑桥' }, { word:'affiliate' }] } });
    assert.equal(result.structuredContent.words.length, 2);
    assert.match(result.structuredContent.words[0].audio.us, /^https:\/\/dict.youdao.com\/dictvoice\?/);
    const resource = await client.readResource({ uri:tool._meta.ui.resourceUri });
    assert.match(resource.contents[0].text, /WordEcho/);
    assert.deepEqual(resource.contents[0]._meta.ui.csp.resourceDomains, ['https://dict.youdao.com']);
    assert.doesNotMatch(resource.contents[0].text, /speechSynthesis/);
    const invalid = await client.callTool({ name:'pronounce_words', arguments:{ words:[{ word:'https://example.com' }] } });
    assert.equal(invalid.isError, true);
  } finally { await client.close(); }
});
