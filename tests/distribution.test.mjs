import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('marketplace has a publisher name and a ready-to-run package', async () => {
  const marketplace = JSON.parse(await readFile('.agents/plugins/marketplace.json', 'utf8'));
  assert.equal(marketplace.name, 'thaddeusjiang');
  const config = JSON.parse(await readFile('plugins/openai/mcp.json', 'utf8'));
  assert.equal(config.mcpServers.wordecho.args[0], '${PLUGIN_ROOT}/dist/server.cjs');
  assert.ok((await readFile('plugins/openai/dist/server.cjs')).length > 0);
  assert.match(await readFile('plugins/openai/dist/LICENSE', 'utf8'), /Copyright \(c\) 2026 ThaddeusJiang/);
  const licenses = await readFile('plugins/openai/dist/THIRD_PARTY_LICENSES.txt', 'utf8');
  assert.match(licenses, /@modelcontextprotocol\/sdk/);
  assert.match(licenses, /zod/);
});
