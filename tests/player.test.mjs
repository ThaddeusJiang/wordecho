import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const html = await readFile(new URL('../packages/player/page.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../packages/player/player.mjs', import.meta.url), 'utf8');

test('compact player has a quiet app description and no speed or search UI', () => {
  assert.match(html, /English pronunciation/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.doesNotMatch(html, /<form|<select|<input|<h1/);
});

test('spacing belongs to an inner container that survives host body padding resets', () => {
  assert.match(html, /<div class="player">[\s\S]*<header>[\s\S]*class="source"[\s\S]*<\/div>\s*<script>/);
  assert.match(html, /\.player\s*\{[^}]*padding:24px;/);
  assert.match(html, /@media[^}]*\{\s*\.player\s*\{\s*padding:20px;/);
});

test('word headings contain US then UK playback links, without Stop', async () => {
  const element = tag => ({ tag, children: [], textContent: '', className: '', dataset: {},
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    setAttribute() {},
  });
  const words = element('main');
  const status = element('div');
  const parent = { postMessage() {} };
  let onMessage;
  const sounds = [];
  class Audio {
    constructor(src) { this.src = src; sounds.push(this); this.handlers = {}; }
    pause() { this.paused = true; }
    addEventListener(name, callback) { this.handlers[name] = callback; }
    async play() { this.played = true; if (this.src?.includes('fail')) throw new Error('Source failed'); }
  }
  runInNewContext(script, {
    document: { querySelector: selector => ({ '#words': words, '#status': status })[selector], createElement: element },
    window: { parent, addEventListener(name, callback) { onMessage = callback; } },
    Audio, URL, setTimeout: () => 1, clearTimeout() {},
  });
  const item = { word: 'finance', ipa: '/ˈfaɪnæns/', meaning: '金融', audio: {
    us: 'https://dict.youdao.com/dictvoice?audio=finance&type=2',
    uk: 'https://dict.youdao.com/dictvoice?audio=finance&type=1',
  }, fallbackAudio: { us: 'https://translate.google.com/translate_tts?q=finance&tl=en-US', uk: 'https://translate.google.com/translate_tts?q=finance&tl=en-GB' }, examples: [{ text: 'Check the logs.', meaning: '检查日志。', audio: { us: 'https://translate.google.com/translate_tts?q=Check+the+logs.&tl=en-US', uk: 'https://translate.google.com/translate_tts?q=Check+the+logs.&tl=en-GB' } }] };
  onMessage({ source: parent, data: { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { structuredContent: { words: [item] } } } });
  const heading = words.children[0].children[0];
  assert.equal(words.children[0].children[1].textContent, item.ipa);
  assert.equal(words.children[0].children[2].textContent, item.meaning);
  const links = heading.children.filter(node => node.tag === 'button');
  assert.deepEqual(links.map(node => node.textContent), ['US', 'UK']);
  assert.ok(links.every(node => node.className === 'audio-link'));
  const descendants = node => [node, ...node.children.flatMap(descendants)];
  assert.ok(!descendants(words).some(node => node.textContent === 'Stop'));
  const example = words.children[0].children[3];
  assert.equal(example.className, 'example');
  assert.equal(example.children[0].textContent, 'Check the logs.');
  await example.children[1].onclick();
  assert.equal(sounds.at(-1).src, item.examples[0].audio.us);
  await links[0].onclick();
  assert.equal(sounds.at(-1).src, item.audio.us);
  const first = sounds.at(-1);
  await links[1].onclick();
  assert.equal(first.paused, true);
  assert.equal(sounds.at(-1).src, item.audio.uk);
  sounds.at(-1).handlers.error();
  assert.equal(status.dataset.state, 'error');
  await links[0].onclick();
  assert.equal(status.dataset.state, 'playing');
  assert.doesNotMatch(status.textContent, /unavailable/);
  item.audio.us = 'https://dict.youdao.com/dictvoice?audio=fail';
  await links[0].onclick();
  assert.equal(sounds.at(-1).src, item.fallbackAudio.us);
  assert.match(status.textContent, /Google TTS/);
  item.fallbackAudio.us = 'https://translate.google.com/translate_tts?q=fail';
  await links[0].onclick();
  assert.equal(status.dataset.state, 'error');
});
