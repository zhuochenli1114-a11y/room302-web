const networkFetch = window.fetch.bind(window);
const sizes = Object.values(gameFiles).flatMap(file => file.parts);
const totalBytes = sizes.reduce((sum, part) => sum + part.size, 0);
const received = new Map();
const pending = new Map();
const cache = window.caches
  ? caches.open('room302-content-v1').catch(() => null)
  : Promise.resolve(null);
let lastUpdate = 0;
function notifyGame(type, fields = {}) {
  parent.postMessage({ type: 'room302-' + type, ...fields }, location.origin);
}
function progress(sha, bytes) {
  received.set(sha, bytes);
  const loaded = [...received.values()].reduce((sum, value) => sum + value, 0);
  if (Date.now() - lastUpdate < 200 && loaded !== totalBytes) return;
  lastUpdate = Date.now();
  notifyGame('progress', { loaded, total: totalBytes });
}
async function fetchPart(url, part) {
  const controller = new AbortController();
  let timer;
  function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(), 25000);
  }
  try {
    resetTimer();
    const response = await networkFetch(url, {signal: controller.signal});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const reader = response.body.getReader();
    const buffer = new Uint8Array(part.size);
    let offset = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer.set(value, offset);
      offset += value.byteLength;
      progress(part.sha, offset);
      resetTimer();
    }
    if (offset !== part.size) throw new Error('Incomplete download');
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer));
    const hex = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
    if (hex !== part.sha) throw new Error('Incomplete download');
    return new Blob([buffer]);
  } finally {
    clearTimeout(timer);
  }
}
async function loadPart(part) {
  const url = new URL('parts/' + part.sha, location.href).href;
  const storage = await cache;
  const saved = await storage?.match(url).catch(() => null);
  if (saved) {
    const blob = await saved.blob();
    if (blob.size === part.size) {
      progress(part.sha, blob.size);
      return blob;
    }
  }
  for (let attempt = 0; ; attempt++) {
    try {
      const blob = await fetchPart(url, part);
      if (storage) await storage.put(url, new Response(blob)).catch(() => {});
      return blob;
    } catch (error) {
      progress(part.sha, 0);
      if (attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 800));
    }
  }
}
async function assemble(file) {
  const blobs = [];
  let next = 0;
  async function worker() {
    while (next < file.parts.length) {
      const i = next++;
      blobs[i] = await loadPart(file.parts[i]);
    }
  }
  await Promise.all(Array.from({length: 3}, worker));
  return new Blob(blobs);
}
window.fetch = async (input, options) => {
  const url = new URL(input instanceof Request ? input.url : input, location.href);
  const match = url.pathname.match(/\/index\.(pck|wasm)$/);
  if (url.origin !== location.origin || !match) return networkFetch(input, options);
  const ext = match[1];
  if (!pending.has(ext)) {
    pending.set(ext, assemble(gameFiles[ext]).catch(error => {
      notifyGame('failed', {reason: 'network'});
      throw error;
    }));
  }
  const blob = await pending.get(ext);
  return new Response(blob.stream().pipeThrough(new DecompressionStream('gzip')), {
    headers: {'Content-Type': ext === 'wasm' ? 'application/wasm' : 'application/octet-stream'}
  });
};
notifyGame('progress', {loaded: 0, total: totalBytes});
