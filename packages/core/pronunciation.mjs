export function pronunciation({ word, ipa = '', meaning = '' }) {
  word = typeof word === 'string' ? word.trim() : '';
  if (!word || word.length > 120 || !/^[A-Za-z][A-Za-z '\u2019-]*$/.test(word)) {
    throw new Error('Enter an English word or short phrase (up to 120 characters).');
  }
  const url = (type) => `https://dict.youdao.com/dictvoice?${new URLSearchParams({ audio: word, type })}`;
  return { word, ipa, meaning, audio: { uk: url('1'), us: url('2') }, source: 'Youdao' };
}
