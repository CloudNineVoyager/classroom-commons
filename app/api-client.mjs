const LIMIT = 1_000_000;
const fail = (code, status) => Object.assign(new Error(code), status ? { status } : {});

function settings({ url, model, key, prompt }) {
  let endpoint;
  try { endpoint = new URL(url.trim()); } catch { throw fail('apiInvalidUrl'); }
  const local = ['127.0.0.1', 'localhost'].includes(endpoint.hostname);
  if (endpoint.href.length > 2000 || endpoint.username || endpoint.password || endpoint.search || endpoint.hash
      || !(endpoint.protocol === 'https:' || (local && endpoint.protocol === 'http:'))
      || !/\/chat\/completions\/?$/.test(endpoint.pathname)) throw fail('apiInvalidUrl');
  if (typeof model !== 'string' || !model.trim() || model.length > 200 || /[\r\n]/.test(model)) throw fail('apiMissingModel');
  if (typeof key !== 'string' || key.length > 4096 || /[\r\n]/.test(key) || /[^\x21-\x7e]/.test(key.trim())) throw fail('apiInvalidKey');
  if (typeof prompt !== 'string' || !prompt.trim()) throw fail('apiInvalidReply');
  if (new TextEncoder().encode(prompt).length > LIMIT) throw fail('apiTooLarge');
  return { url: endpoint.href, model: model.trim(), key: key.trim() };
}

async function readReply(response) {
  const length = Number(response.headers.get('content-length'));
  if (length > LIMIT) throw fail('apiTooLarge');
  if (!response.body) throw fail('apiInvalidReply');
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let bytes = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > LIMIT) { await reader.cancel(); throw fail('apiTooLarge'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  let data;
  try { data = JSON.parse(text); } catch { throw fail('apiInvalidReply'); }
  const choice = data?.choices?.[0];
  if (choice?.finish_reason === 'length') throw fail('apiInvalidReply');
  const content = choice?.message?.content;
  const reply = typeof content === 'string' ? content : Array.isArray(content)
    ? content.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n') : '';
  if (!reply.trim()) throw fail('apiInvalidReply');
  return reply;
}

// A single explicit request; no key storage, provider defaults, proxy or retries.
export async function requestApiDraft(options, { fetchImpl = fetch, timeoutMs = 60000 } = {}) {
  const config = settings(options);
  if (options.signal?.aborted) throw fail('apiCancelled');
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetchImpl(config.url, {
      method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}) },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: options.prompt }], stream: false }),
      signal: controller.signal
    });
    if (!response.ok) throw fail('apiHttp', response.status);
    const reply = await readReply(response);
    if (timedOut) throw fail('apiTimeout');
    if (options.signal?.aborted) throw fail('apiCancelled');
    return reply;
  } catch (error) {
    if (timedOut) throw fail('apiTimeout');
    if (options.signal?.aborted) throw fail('apiCancelled');
    if (error.message?.startsWith('api')) throw error;
    throw fail('apiNetwork');
  } finally {
    clearTimeout(timer); options.signal?.removeEventListener('abort', cancel); controller.abort();
  }
}
