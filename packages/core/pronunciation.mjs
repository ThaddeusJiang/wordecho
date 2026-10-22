function validate(text) {
  text = typeof text === 'string' ? text.trim() : '';
  if (!text || text.length > 120 || !/^[A-Za-z][A-Za-z0-9 '\u2019\u201c\u201d",.!?;:()\u2013\u2014-]*$/.test(text) || /:\/\/|[\r\n]/.test(text)) {
    throw new Error('Enter English text of up to 120 characters.');
  }
  return text;
}
function remoteSpeech(text) {
  const url = tl => `https://translate.google.com/translate_tts?${new URLSearchParams({ ie: 'UTF-8', q: text, tl, client: 'tw-ob' })}`;
  return { us: url('en-US'), uk: url('en-GB') };
}
export function pronunciation({ word, ipa = '', meaning = '', examples = [] }) {
  word = validate(word);
  const dictionary = /^[A-Za-z][A-Za-z'\u2019-]*$/.test(word);
  const url = type => `https://dict.youdao.com/dictvoice?${new URLSearchParams({ audio: word, type })}`;
  return {
    word, ipa, meaning,
    audio: dictionary ? { us: url('2'), uk: url('1') } : remoteSpeech(word),
    ...(dictionary ? { fallbackAudio: remoteSpeech(word) } : {}),
    source: dictionary ? 'Youdao' : 'Google TTS',
    examples: examples.map(({ text, meaning = '' }) => {
      text = validate(text);
      return { text, meaning, audio: remoteSpeech(text), source: 'Google TTS' };
    }),
  };
}
