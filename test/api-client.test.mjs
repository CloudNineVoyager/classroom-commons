import test from 'node:test';
import assert from 'node:assert/strict';
import { requestApiDraft } from '../app/api-client.mjs';

const config = { url: 'https://example.test/v1/chat/completions', model: 'teacher-model', key: 'test-only-key', prompt: 'Anonymous lesson notes' };
const response = content => new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }));

test('optional API sends one explicit compatible request only to the entered endpoint', async () => {
  const calls = [];
  const reply = await requestApiDraft(config, { fetchImpl: async (url, init) => { calls.push({ url, init }); return response('lesson text'); } });
  assert.equal(reply, 'lesson text'); assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.equal(url, config.url); assert.equal(init.headers.Authorization, 'Bearer test-only-key');
  assert.deepEqual(JSON.parse(init.body), { model: config.model, messages: [{ role: 'user', content: config.prompt }], stream: false });
  assert.equal(init.credentials, 'omit'); assert.equal(init.redirect, 'error'); assert.equal(init.referrerPolicy, 'no-referrer');
  assert.equal(init.body.includes(config.key), false);
});

test('API validation blocks unsafe endpoints and invalid inputs before any request', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return response('unused'); };
  for (const url of ['http://example.test/v1/chat/completions', 'https://name:secret@example.test/v1/chat/completions', 'https://example.test/v1/chat/completions?key=secret', 'https://example.test/v1/chat/completions#secret', 'file:///v1/chat/completions', 'https://example.test/v1']) {
    await assert.rejects(requestApiDraft({ ...config, url }, { fetchImpl }), { message: 'apiInvalidUrl' });
  }
  await assert.rejects(requestApiDraft({ ...config, model: '' }, { fetchImpl }), { message: 'apiMissingModel' });
  for (const key of ['key\nInjected-header', '\r\nkey', 'key\n']) {
    await assert.rejects(requestApiDraft({ ...config, key }, { fetchImpl }), { message: 'apiInvalidKey' });
  }
  await assert.rejects(requestApiDraft({ ...config, prompt: '中'.repeat(400000) }, { fetchImpl }), { message: 'apiTooLarge' });
  assert.equal(calls, 0);
});

test('local compatible API can omit a key and text-part responses are accepted', async () => {
  const result = await requestApiDraft({ ...config, url: 'http://127.0.0.1:1234/v1/chat/completions', key: '' }, {
    fetchImpl: async (_, init) => { assert.equal(init.headers.Authorization, undefined); return response([{ type: 'text', text: '第一段' }, { type: 'text', text: 'second' }]); }
  });
  assert.equal(result, '第一段\nsecond');
});

test('API errors, invalid and truncated replies do not retry or expose provider error text', async () => {
  let calls = 0;
  await assert.rejects(requestApiDraft(config, { fetchImpl: async () => { calls++; return new Response('private provider details', { status: 429 }); } }), { message: 'apiHttp', status: 429 });
  assert.equal(calls, 1);
  for (const value of [new Response('{bad'), response(null), new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: 'partial' } }] }))]) {
    await assert.rejects(requestApiDraft(config, { fetchImpl: async () => value }), { message: 'apiInvalidReply' });
  }
  await assert.rejects(requestApiDraft(config, { fetchImpl: async () => { throw new TypeError('CORS or redirect blocked'); } }), { message: 'apiNetwork' });
});

test('API response limits apply to declared lengths and streamed bytes', async () => {
  for (const value of [new Response('small', { headers: { 'content-length': '1000001' } }), new Response('x'.repeat(1000001))]) {
    await assert.rejects(requestApiDraft(config, { fetchImpl: async () => value }), { message: 'apiTooLarge' });
  }
});

test('API cancellation and timeout stop the in-flight fetch without retrying', async () => {
  const waiting = async (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true }));
  const controller = new AbortController();
  const pending = requestApiDraft({ ...config, signal: controller.signal }, { fetchImpl: waiting });
  controller.abort();
  await assert.rejects(pending, { message: 'apiCancelled' });
  await assert.rejects(requestApiDraft(config, { fetchImpl: waiting, timeoutMs: 5 }), { message: 'apiTimeout' });
  await assert.rejects(requestApiDraft({ ...config, signal: controller.signal }), { message: 'apiCancelled' });
});

test('late response bodies cannot succeed after timeout or cancellation even if the transport ignores abort', async () => {
  for (const cancel of [false, true]) {
    let deliver;
    const body = new ReadableStream({ start(controller) { deliver = controller; } });
    const controller = new AbortController();
    const pending = requestApiDraft({ ...config, signal: controller.signal }, {
      fetchImpl: async () => new Response(body), timeoutMs: cancel ? 1000 : 1
    });
    if (cancel) {
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(body.locked, true, 'cancellation happens while the response reader is waiting');
      controller.abort();
    }
    else await new Promise(resolve => setTimeout(resolve, 10));
    deliver.enqueue(new TextEncoder().encode(JSON.stringify({ choices: [{ message: { content: 'late reply' } }] })));
    deliver.close();
    await assert.rejects(pending, { message: cancel ? 'apiCancelled' : 'apiTimeout' });
  }
});
