import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pronunciation } from '../packages/core/pronunciation.mjs';

test('returns remote UK and US audio for a word or phrase', () => {
  const result = pronunciation({ word: 'physical footprint', ipa: '/example/', meaning: '内存占用' });
  assert.equal(result.word, 'physical footprint');
  assert.equal(new URL(result.audio.us).searchParams.get('audio'), 'physical footprint');
  assert.equal(new URL(result.audio.uk).searchParams.get('type'), '1');
  assert.equal(new URL(result.audio.us).searchParams.get('type'), '2');
  assert.equal(result.meaning, '内存占用');
});

test('rejects URLs, code, empty input and overly long phrases', () => {
  for (const word of ['', 'https://example.com', '<script>', 'a'.repeat(121)]) {
    assert.throws(() => pronunciation({ word }));
  }
});
