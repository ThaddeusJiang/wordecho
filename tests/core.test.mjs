import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pronunciation } from '../packages/core/pronunciation.mjs';

test('returns remote UK and US audio for a word or phrase', () => {
  const result = pronunciation({ word: 'footprint', ipa: '/example/', meaning: '内存占用' });
  assert.equal(result.word, 'footprint');
  assert.equal(new URL(result.audio.us).searchParams.get('audio'), 'footprint');
  assert.equal(new URL(result.audio.uk).searchParams.get('type'), '1');
  assert.equal(new URL(result.audio.us).searchParams.get('type'), '2');
  assert.equal(result.meaning, '内存占用');
});

test('rejects URLs, code, empty input and overly long phrases', () => {
  for (const word of ['', 'https://example.com', '<script>', 'a'.repeat(121)]) {
    assert.throws(() => pronunciation({ word }));
  }
});

test('sentences and nested examples use remote US and UK TTS', () => {
  const result = pronunciation({ word: 'huddle', examples: [{ text: 'Start a huddle before deployment.', meaning: '部署前开个短会。' }] });
  assert.equal(result.examples[0].text, 'Start a huddle before deployment.');
  assert.equal(new URL(result.examples[0].audio.us).searchParams.get('tl'), 'en-US');
  assert.equal(new URL(result.examples[0].audio.uk).searchParams.get('tl'), 'en-GB');
  assert.equal(new URL(pronunciation({ word: 'Discuss the outage, then check the logs.' }).audio.us).hostname, 'translate.google.com');
  assert.throws(() => pronunciation({ word: 'huddle', examples: [{ text: 'https://example.com' }] }));
});
