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
async function play(item, accent) {
  const token = ++generation;
  audio.pause();
  audio = new Audio(item.audio[accent]);
  audio.addEventListener('ended', () => { if (token === generation) setStatus('Finished. Select US or UK to replay.'); });
  audio.addEventListener('error', () => { if (token === generation) setStatus('Audio unavailable. Try the other pronunciation or retry.', 'error'); });
  setStatus(`Loading ${item.word}…`, 'loading');
  try { await audio.play(); if (token === generation) setStatus(`Playing ${item.word} · ${accent.toUpperCase()}`, 'playing'); }
  catch { if (token === generation) setStatus('Could not play audio. Please retry or choose the other pronunciation.', 'error'); }
}
function render(result) {
  if (!Array.isArray(result?.words)) return;
  generation++; audio.pause(); container.replaceChildren();
  for (const item of result.words) {
    if (!['uk', 'us'].every(accent => {
      try { const u = new URL(item.audio?.[accent]); return u.origin === 'https://dict.youdao.com' && u.pathname === '/dictvoice'; } catch { return false; }
    })) continue;
    const article = document.createElement('article');
    const title = document.createElement('h2');
    const word = document.createElement('span'); word.className = 'word'; word.textContent = item.word; title.append(word);
    const ipa = document.createElement('div'); ipa.className = 'ipa'; ipa.textContent = item.ipa || '';
    const meaning = document.createElement('div'); meaning.className = 'meaning'; meaning.textContent = item.meaning || '';
    for (const accent of ['us', 'uk']) {
      const button = document.createElement('button'); button.textContent = accent.toUpperCase(); button.className = 'audio-link'; button.type = 'button';
      button.setAttribute('aria-label', `Play ${item.word} ${accent === 'uk' ? 'British' : 'American'} pronunciation`);
      button.onclick = () => play(item, accent); title.append(button);
    }
    article.append(title, ipa, meaning); container.append(article);
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
  request('ui/initialize', { appInfo: { name: 'WordEcho', version: '0.1.1' }, appCapabilities: {}, protocolVersion: '2026-01-26' })
    .then(() => { window.parent.postMessage({ jsonrpc:'2.0', method:'ui/notifications/initialized' }, '*'); })
    .catch(error => { setStatus(error.message, 'error'); });
} else {
  const word = new URLSearchParams(location.search).get('word') || 'Cambridge';
  fetch(`/api/words?word=${encodeURIComponent(word)}`)
    .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error); render(result); })
    .catch(error => { setStatus(error.message, 'error'); });
}
