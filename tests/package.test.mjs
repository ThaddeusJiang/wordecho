import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('portable MCP configuration declares its required schema', async () => {
  const config = JSON.parse(await readFile(new URL('../plugins/openai/mcp.json', import.meta.url), 'utf8'));
  assert.equal(config.$schema, 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json');
  assert.equal(config.mcpServers.wordecho.type, 'stdio');
});
