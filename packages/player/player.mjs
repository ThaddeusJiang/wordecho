const container = document.querySelector('#words');
const status = document.querySelector('#status');
let audio = new Audio();
let generation = 0;
let requestId = 1;
const pending = new Map();
function setStatus(message, state = 'idle') {
  status.textContent = message;
  status.dataset.state = state;
}
function request(method, params) {
  const id = requestId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('Host did not respond.')); }, 10000);
    pending.set(id, { resolve, reject, timer });
    window.parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*');
  });
}
function allowed(url) {
  try {
    const u = new URL(url);
    return (u.origin === 'https://dict.youdao.com' && u.pathname === '/dictvoice') ||
      (u.origin === 'https://translate.google.com' && u.pathname === '/translate_tts');
  } catch { return false; }
}
async function play(item, accent) {
  const token = ++generation;
  audio.pause();
  const label = item.word || item.text;
  const sources = [item.audio?.[accent], item.fallbackAudio?.[accent]].filter(allowed);
  for (let index = 0; index < sources.length; index++) {
    if (token !== generation) return;
    audio = new Audio(sources[index]);
    const current = audio;
    setStatus(`Loading ${label}…`, 'loading');
    current.addEventListener('ended', () => { if (token === generation) setStatus('Finished. Select US or UK to replay.'); });
    let timer;
    try {
      await Promise.race([
        current.play(),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Audio request timed out.')), 15000);
          current.addEventListener('error', () => reject(new Error('Audio source failed.')));
        }),
      ]);
      if (token === generation) {
        setStatus(`Playing ${label} · ${accent.toUpperCase()}${index ? ' · Google TTS' : ''}`, 'playing');
        current.addEventListener('error', () => { if (token === generation) setStatus('Audio stopped. Select US or UK to retry.', 'error'); });
      }
      return;
    } catch (error) {
      current.pause();
      if (token !== generation) return;
      if (error.name === 'NotAllowedError') {
        setStatus('The host blocked audio playback. Select US or UK again to allow playback.', 'error');
        return;
      }
      if (index === sources.length - 1) setStatus('Audio could not load. Check your connection, then select US or UK to retry.', 'error');
    } finally { clearTimeout(timer); }
  }
}
function buttons(item, target) {
  for (const accent of ['us', 'uk']) {
    const button = document.createElement('button'); button.textContent = accent.toUpperCase(); button.className = 'audio-link'; button.type = 'button';
    button.setAttribute('aria-label', `Play ${item.word || item.text} ${accent === 'uk' ? 'British' : 'American'} pronunciation`);
    button.onclick = () => play(item, accent); target.append(button);
  }
}
function render(result) {
  if (!Array.isArray(result?.words)) return;
  generation++; audio.pause(); container.replaceChildren();
  for (const item of result.words) {
    if (!['us', 'uk'].every(accent => allowed(item.audio?.[accent]))) continue;
    const article = document.createElement('article');
    const title = document.createElement('h2');
    const word = document.createElement('span'); word.className = 'word'; word.textContent = item.word; title.append(word);
    const ipa = document.createElement('div'); ipa.className = 'ipa'; ipa.textContent = item.ipa || '';
    const meaning = document.createElement('div'); meaning.className = 'meaning'; meaning.textContent = item.meaning || '';
    buttons(item, title);
    article.append(title, ipa, meaning);
    for (const example of (item.examples || []).slice(0, 3)) {
      if (!['us', 'uk'].every(accent => allowed(example.audio?.[accent]))) continue;
      const row = document.createElement('div'); row.className = 'example';
      const text = document.createElement('span'); text.textContent = example.text; row.append(text);
      buttons(example, row);
      const translation = document.createElement('div'); translation.className = 'example-meaning'; translation.textContent = example.meaning || '';
      row.append(translation); article.append(row);
    }
    container.append(article);
  }
  setStatus('Select US or UK to listen.');
}
window.addEventListener('message', event => {
  if (event.source !== window.parent) return;
  const msg = event.data;
  if (msg?.jsonrpc !== '2.0') return;
  if (pending.has(msg.id)) {
    const entry = pending.get(msg.id); clearTimeout(entry.timer); pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  }
  if (msg.method === 'ui/notifications/tool-result') render(msg.params?.structuredContent);
});
if (window.parent !== window) {
  request('ui/initialize', { appInfo: { name: 'WordEcho', version: '0.1.2' }, appCapabilities: {}, protocolVersion: '2026-01-26' })
    .then(() => { window.parent.postMessage({ jsonrpc:'2.0', method:'ui/notifications/initialized' }, '*'); })
    .catch(error => { setStatus(error.message, 'error'); });
} else {
  const word = new URLSearchParams(location.search).get('word') || 'Cambridge';
  fetch(`/api/words?word=${encodeURIComponent(word)}`)
    .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error); render(result); })
    .catch(error => { setStatus(error.message, 'error'); });
}
