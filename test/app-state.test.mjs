import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import * as engine from '../app/engine.mjs';
import * as courseFiles from '../app/project-file.mjs';
import * as examples from '../app/demo.mjs';
import * as translations from '../app/i18n.mjs';
import { uiTranslate } from '../app/ui-copy.mjs';

// Run the real controller and domain modules. Only React rendering, browser
// services and the asynchronous Worker/bridge transport are replaced.
const appUrl = new URL('../app/app.mjs', import.meta.url);
const source = (await readFile(appUrl, 'utf8'))
  .replace(/^import .*;\r?$/gm, '')
  .replaceAll('import.meta.url', JSON.stringify(appUrl.href));
const settle = () => new Promise(resolve => setImmediate(resolve));
const checkedCourse = () => {
  const project = engine.adoptAlternative(examples.demo(), 'b2', true);
  return JSON.parse(courseFiles.writeCourseFile(project, engine.solve(project).schedule));
};

async function openApp(course, { host = false, request = null } = {}) {
  const storage = new Map([['cc-course', JSON.stringify(course)]]);
  const messages = [], downloads = [], timers = new Map(), blobs = new Map(), workers = [], apiCalls = [];
  let view, reply = null, timerId = 0, holdRequest = false, releaseRequest;
  let apiTransport = async () => JSON.stringify(course.project);
  const toast = { textContent: '', classList: { add() { messages.push(toast.textContent); }, remove() {} } };
  class BrowserURL extends URL {
    static createObjectURL(blob) { const url = `blob:test-${blobs.size}`; blobs.set(url, blob); return url; }
    static revokeObjectURL() {}
  }
  const context = vm.createContext({
    ...engine, ...courseFiles, ...examples, ...translations, uiTranslate,
    requestApiDraft: async config => { apiCalls.push(config); return apiTransport(config); },
    createElement: (type, props) => ({ type, props }),
    createRoot: () => ({ render(element) { view = element.props; } }),
    flushSync: callback => callback(), Workbench() {},
    document: {
      documentElement: {}, activeElement: {},
      querySelector: selector => selector === '#toast' ? toast : {},
      createElement: () => ({ click() { downloads.push({ filename: this.download, blob: blobs.get(this.href) }); } })
    },
    location: { hash: host ? '#test-token' : '', protocol: host ? 'http:' : 'file:' },
    navigator: { language: 'en' },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    crypto: webcrypto, TextEncoder, structuredClone, Blob, URL: BrowserURL, Intl, AbortController,
    window: { CLASSROOM_WORKER_SOURCE: 'self.onmessage = () => {};' },
    Worker: class {
      constructor() { workers.push(this); }
      postMessage(message) { this.message = structuredClone(message); }
      terminate() { this.terminated = true; }
    },
    setTimeout: (callback, milliseconds) => { timers.set(++timerId, { callback, milliseconds }); return timerId; },
    clearTimeout: id => timers.delete(id), setInterval: () => 0,
    fetch: async route => {
      if (route === '/request' && holdRequest) { holdRequest = false; await new Promise(resolve => { releaseRequest = resolve; }); }
      return { ok: true, json: async () => structuredClone(route === '/state'
        ? { workspace: 'test-workspace', project: course.project, course, request }
        : route === '/reply' ? reply : { ok: true }) };
    }
  });
  new vm.Script(source, { filename: appUrl.pathname }).runInContext(context);
  await settle();
  return {
    storage, messages, apiCalls,
    state: () => structuredClone({ project: view.project, schedule: view.schedule, clockRevision: view.clockRevision, pendingId: view.pendingId, draft: view.draft, saveState: view.saveState, apiEnabled: view.apiEnabled, apiBusy: view.apiBusy, apiError: view.apiError }),
    navigate: value => view.onNavigate(value),
    action: async (...args) => { await view.onAction(...args); await settle(); },
    field: target => view.onField({ target }),
    apiField: target => view.onApiField({ target }),
    confirmDialog: () => view.confirmDialog(),
    setApiTransport: transport => { apiTransport = transport; },
    setReply: value => { reply = value; },
    holdNextRequest: () => { holdRequest = true; },
    releaseRequest: () => releaseRequest?.(),
    finishSolver() {
      const message = workers.at(-1).message;
      const data = message.type === 'replan'
        ? engine.replan(message.project, message.schedule, message.taskId, message.extra)
        : { project: message.project, result: engine.solve(message.project) };
      assert.equal(data.result.status, 'feasible');
      workers.at(-1).onmessage({ data });
    },
    finishUnknown() {
      workers.at(-1).onmessage({ data: { project: course.project, result: { status: 'unknown', schedule: [], issues: [{ code: 'noPlanFound', item: '' }] } } });
    },
    timeoutSolver() {
      const timer = [...timers.values()].find(timer => timer.milliseconds === 8000);
      assert.ok(timer, 'the real controller installed its solver timeout'); timer.callback();
    },
    async exportCourse() { await view.onAction('export'); return downloads.at(-1).blob.text(); }
  };
}

test('teaching clock resets for a newly accepted plan or edit, but not navigation or retained plans', async () => {
  const app = await openApp(checkedCourse());
  const originalRevision = app.state().clockRevision;
  app.navigate('flow'); app.navigate('home'); app.navigate('flow');
  assert.equal(app.state().clockRevision, originalRevision);
  await app.action('solve'); app.finishUnknown();
  assert.equal(app.state().clockRevision, originalRevision);
  await app.action('solve'); app.finishSolver();
  assert.equal(app.state().clockRevision, originalRevision + 1);
  await app.action('solve'); app.finishSolver();
  assert.equal(app.state().clockRevision, originalRevision + 2);
  app.field({ id: 'lesson-title', value: 'A changed lesson', dataset: {} });
  assert.equal(app.state().clockRevision, originalRevision + 3);
  assert.deepEqual(app.state().schedule, []);
});

test('duplicating an activity clears stale schedules and saves the independent copy', async () => {
  const course = checkedCourse(), app = await openApp(course);
  const before = app.state();
  await app.action('duplicate-task', course.project.tasks[0].id);
  const after = app.state();
  assert.equal(after.project.tasks.length, before.project.tasks.length + 1);
  assert.notEqual(after.project.tasks[0].id, after.project.tasks[1].id);
  assert.deepEqual(after.project.tasks[1], { ...after.project.tasks[0], id: after.project.tasks[1].id });
  assert.deepEqual(after.schedule, []);
  assert.equal(after.clockRevision, before.clockRevision + 1);
  const restored = courseFiles.readCourseFile(await app.exportCourse());
  assert.deepEqual(restored.project, after.project);
  assert.deepEqual(restored.schedule, []);
  assert.ok(app.messages.includes(uiTranslate('en', 'activityCopied')));
});

test('failed ordinary replanning preserves the checked schedule and exported course', async () => {
  for (const failure of ['worker', 'timeout']) {
    const course = checkedCourse(), app = await openApp(course);
    const before = await app.exportCourse();
    await app.action('solve');
    if (failure === 'worker') app.finishUnknown(); else app.timeoutSolver();
    assert.deepEqual(app.state().project, course.project, failure);
    assert.deepEqual(app.state().schedule, course.schedule, failure);
    assert.equal(await app.exportCourse(), before, failure);
    assert.deepEqual(courseFiles.readCourseFile(app.storage.get('cc-course')).schedule, course.schedule, failure);
  }
});

test('automatic local restore tells the teacher when a damaged schedule is discarded', async () => {
  const course = checkedCourse(), app = await openApp({ ...course, schedule: { damaged: true } });
  assert.deepEqual(app.state().project, course.project);
  assert.deepEqual(app.state().schedule, []);
  assert.ok(app.messages.includes(translations.translate('en', 'scheduleDiscarded')));
});

test('automatic host restore tells the teacher when schedule constraints fail', async () => {
  const course = checkedCourse();
  // Entries remain structurally valid for the bridge, but overlap in class.
  const damaged = { ...course, schedule: course.schedule.map(entry => ({ ...entry, start: 0, end: 10 })) };
  const app = await openApp(damaged, { host: true });
  assert.deepEqual(app.state().project, course.project);
  assert.deepEqual(app.state().schedule, []);
  assert.ok(app.messages.includes(translations.translate('en', 'scheduleDiscarded')));
});

test('editing classroom conditions invalidates the pending request and ignores its old reply', async () => {
  const course = checkedCourse(), app = await openApp(course, { host: true });
  app.field({ id: 'notes', value: 'Prepare a counting lesson', type: 'textarea', dataset: {} });
  await app.action('draft');
  const pendingId = app.state().pendingId;
  assert.ok(pendingId, 'the actual request flow created a pending request');
  app.setReply({ requestId: pendingId, project: course.project });
  app.field({ id: 'lesson-title', value: 'A revised lesson', type: 'text', dataset: {} });
  assert.equal(app.state().pendingId, '');
  assert.equal(JSON.parse(app.storage.get('cc-ai:test-workspace')).pendingId, '');
  await app.action('refresh-reply');
  assert.equal(app.state().project.title, 'A revised lesson');
  assert.equal(app.state().draft, null);
});

test('a successful delay invalidates requests made for the previous activity durations', async () => {
  const course = checkedCourse(); course.project.duration = 50;
  course.project.groups.forEach(group => { group.independentLimit = 30; });
  course.schedule = engine.solve(course.project).schedule;
  const app = await openApp(course, { host: true });
  app.field({ id: 'notes', value: 'Prepare this lesson', type: 'textarea', dataset: {} });
  await app.action('draft');
  app.setReply({ requestId: app.state().pendingId, project: course.project });
  await app.action('delay'); app.finishSolver();
  assert.equal(app.state().project.tasks.find(task => task.id === 'a1').duration, 15);
  assert.deepEqual(engine.checkSchedule(app.state().project, app.state().schedule), []);
  assert.equal(app.state().pendingId, '');
  await app.action('refresh-reply');
  assert.equal(app.state().draft, null);
});

test('a replacement request cannot accept the previous reply while the new request is saving', async () => {
  const course = checkedCourse(), app = await openApp(course, { host: true });
  app.field({ id: 'notes', value: 'First request', type: 'textarea', dataset: {} });
  await app.action('draft');
  const previousId = app.state().pendingId;
  app.setReply({ requestId: previousId, project: course.project });
  app.holdNextRequest();
  const nextRequest = app.action('draft'); await settle();
  await app.action('refresh-reply');
  const whileSaving = app.state();
  app.releaseRequest(); await nextRequest;
  assert.equal(whileSaving.pendingId, '');
  assert.equal(whileSaving.draft, null);
  assert.notEqual(app.state().pendingId, previousId);
});

test('host restart restores an equivalent request despite normal project key ordering changes', async () => {
  const project = engine.parseAssistantProject(JSON.stringify(checkedCourse().project));
  const course = JSON.parse(courseFiles.writeCourseFile(project, engine.solve(project).schedule));
  assert.notEqual(JSON.stringify(project), JSON.stringify(course.project));
  const request = { id: 'saved-request', notes: 'Continue this lesson', project };
  const app = await openApp(course, { host: true, request });
  assert.equal(app.state().pendingId, request.id);
});

const configureApi = app => {
  app.field({ id: 'notes', value: 'Prepare a lesson using these conditions', type: 'textarea', dataset: {} });
  app.apiField({ id: 'api-url', value: 'https://school.example.test/v1/chat/completions' });
  app.apiField({ id: 'api-model', value: 'private-model-code' });
  app.apiField({ id: 'api-key', value: 'DO-NOT-STORE-THIS-PRIVATE-KEY' });
};

test('API drafting is optional, explicitly requested, reviewed and never persists its credentials', async () => {
  const course = checkedCourse(), app = await openApp(course);
  assert.equal(app.state().apiEnabled, false);
  configureApi(app);
  await app.action('api-draft');
  assert.equal(app.apiCalls.length, 0);
  app.apiField({ id: 'api-enabled', checked: true });
  assert.equal(app.apiCalls.length, 0);
  await app.action('api-draft');
  assert.equal(app.apiCalls.length, 1);
  assert.equal(app.apiCalls[0].model, 'private-model-code');
  assert.equal(app.apiCalls[0].key, 'DO-NOT-STORE-THIS-PRIVATE-KEY');
  assert.ok(app.state().draft);
  assert.equal(app.state().draft.tasks.find(task => task.id === 'b2').adaptation, undefined);
  assert.deepEqual(app.state().project, course.project);
  assert.deepEqual(app.state().schedule, course.schedule);
  const exported = await app.exportCourse();
  for (const secret of ['DO-NOT-STORE-THIS-PRIVATE-KEY', 'private-model-code', 'https://school.example.test/']) {
    assert.equal(app.apiCalls[0].prompt.includes(secret), false);
    assert.equal(exported.includes(secret), false);
    assert.equal([...app.storage.values()].some(value => value.includes(secret)), false);
  }
});

test('cancel, disable, course edits, replacement and manual paste ignore a late API reply', async () => {
  for (const cancel of ['cancel', 'disable', 'edit', 'replace', 'paste']) {
    const course = checkedCourse(), app = await openApp(course);
    configureApi(app); app.apiField({ id: 'api-enabled', checked: true });
    let deliver;
    // The transport deliberately ignores abort to prove stale replies cannot apply.
    app.setApiTransport(() => new Promise(resolve => { deliver = resolve; }));
    const request = app.action('api-draft'); await settle();
    assert.equal(app.state().apiBusy, true, cancel);
    if (cancel === 'cancel') await app.action('api-cancel');
    if (cancel === 'disable') app.apiField({ id: 'api-enabled', checked: false });
    if (cancel === 'edit') app.field({ id: 'lesson-title', value: 'Changed conditions', type: 'text', dataset: {} });
    if (cancel === 'replace') { await app.action('new'); app.confirmDialog(); }
    if (cancel === 'paste') app.field({ id: 'raw-draft', value: JSON.stringify(course.project), type: 'textarea', dataset: {} });
    const current = app.state().project;
    assert.equal(app.apiCalls[0].signal.aborted, true, cancel);
    deliver(JSON.stringify(course.project)); await request;
    assert.equal(app.state().apiBusy, false, cancel);
    assert.equal(app.state().draft, null, cancel);
    assert.deepEqual(app.state().project, current, cancel);
  }
});

test('API errors and malformed responses preserve the course and allow manual drafting', async () => {
  for (const failure of ['network', 'format']) {
    const course = checkedCourse(), app = await openApp(course);
    configureApi(app); app.apiField({ id: 'api-enabled', checked: true });
    app.setApiTransport(async () => {
      if (failure === 'network') throw Object.assign(new Error('Do not display provider body'), { code: 'apiNetwork' });
      return 'This is not a complete classroom project.';
    });
    await app.action('api-draft');
    assert.equal(app.state().apiBusy, false);
    assert.equal(app.state().apiError, failure === 'network' ? 'apiNetwork' : 'apiInvalidReply');
    assert.deepEqual(app.state().project, course.project);
    assert.deepEqual(app.state().schedule, course.schedule);
    app.field({ id: 'raw-draft', value: JSON.stringify(course.project), type: 'textarea', dataset: {} });
    await app.action('parse-draft');
    assert.ok(app.state().draft);
    assert.deepEqual(app.state().project, course.project);
  }
});
