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
import { groupSheetsHTML } from '../app/group-sheets.mjs';
import * as lessonLibrary from '../app/lesson-library.mjs';

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

async function openApp(course, { host = false, request = null, libraryRaw = null } = {}) {
  const storage = new Map([['cc-course', JSON.stringify(course)]]);
  if (libraryRaw !== null) storage.set(lessonLibrary.LIBRARY_KEY, libraryRaw);
  const messages = [], downloads = [], timers = new Map(), blobs = new Map(), workers = [], apiCalls = [];
  let view, reply = null, timerId = 0, holdRequest = false, releaseRequest;
  let apiTransport = async () => JSON.stringify(course.project), failLibraryWrites = false;
  const toast = { textContent: '', classList: { add() { messages.push(toast.textContent); }, remove() {} } };
  class BrowserURL extends URL {
    static createObjectURL(blob) { const url = `blob:test-${blobs.size}`; blobs.set(url, blob); return url; }
    static revokeObjectURL() {}
  }
  const context = vm.createContext({
    ...engine, ...courseFiles, ...examples, ...translations, ...lessonLibrary, uiTranslate, groupSheetsHTML,
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
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { if (failLibraryWrites && key === lessonLibrary.LIBRARY_KEY) throw new Error('QuotaExceededError'); storage.set(key, value); } },
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
    storage, messages, apiCalls, downloads,
    libraryState: () => structuredClone({ lessons: view.library, error: view.libraryError }),
    failLibraryWrites: value => { failLibraryWrites = value; },
    closeDialog: () => view.closeDialog(),
    dialogState: () => view.dialog ? { kind: view.dialog.kind, title: view.dialog.title } : null,
    importLibrary: async (text, size = new TextEncoder().encode(text).length) => { await view.onLibraryFile({ target: { value: 'backup.json', files: [{ size, text: async () => text }] } }); await settle(); },
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

test('whole shelf backup includes saved copies rather than unsaved current edits', async () => {
  const app = await openApp(checkedCourse());
  await app.action('library-save');
  app.field({ id: 'lesson-title', value: 'Unsaved current changes', dataset: {} });
  const before = app.state();
  await app.action('library-backup');
  const backup = lessonLibrary.readLibraryBackup(await app.downloads[0].blob.text());
  assert.notEqual(courseFiles.readCourseFile(backup[0].course).project.title, before.project.title);
  assert.deepEqual(app.state(), before);
  assert.equal(app.apiCalls.length, 0);
});

test('backup import previews and cancels before merging while preserving the current course and clock', async () => {
  const course = checkedCourse(), app = await openApp(course);
  const incoming = lessonLibrary.addLibraryLesson([], 'backup-id', course.project, course.schedule);
  const raw = lessonLibrary.writeLessonLibrary(incoming), before = app.state();
  await app.importLibrary(raw);
  assert.equal(app.dialogState().kind, 'library-restore');
  assert.equal(app.libraryState().lessons.length, 0);
  app.closeDialog();
  assert.equal(app.storage.has(lessonLibrary.LIBRARY_KEY), false);
  await app.importLibrary(raw); app.confirmDialog();
  assert.equal(app.libraryState().lessons.length, 1);
  assert.notEqual(app.libraryState().lessons[0].id, 'backup-id');
  assert.deepEqual(app.state(), before);
  assert.deepEqual(app.libraryState().lessons[0].schedule, before.schedule);
  await app.importLibrary(raw);
  assert.equal(app.dialogState(), null);
  assert.equal(app.libraryState().lessons.length, 1);
  assert.ok(app.messages.includes(uiTranslate('en', 'libraryNoNew')));
});

test('an earlier slow file read cannot replace the preview for a newer import', async () => {
  const course = checkedCourse(), app = await openApp(course);
  let finishOld;
  const old = app.importLibrary(new Promise(resolve => { finishOld = resolve; }), 10);
  const raw = lessonLibrary.writeLessonLibrary(lessonLibrary.addLibraryLesson([], 'newer-file', course.project, []));
  await app.importLibrary(raw);
  const preview = app.dialogState();
  finishOld('{invalid'); await old;
  assert.deepEqual(app.dialogState(), preview);
  assert.equal(app.libraryState().error, '');
  app.confirmDialog();
  assert.equal(app.libraryState().lessons.length, 1);
});

test('wrong, oversized and quota-failed imports preserve the saved shelf', async () => {
  const course = checkedCourse(), app = await openApp(course);
  await app.action('library-save');
  const before = app.storage.get(lessonLibrary.LIBRARY_KEY);
  await app.importLibrary(JSON.stringify(course));
  assert.equal(app.libraryState().error, 'libraryBackupInvalid');
  await app.importLibrary('{}', lessonLibrary.LIBRARY_BACKUP_LIMIT + 1);
  assert.equal(app.libraryState().error, 'libraryBackupTooLarge');
  course.project.title = 'Another lesson';
  const raw = lessonLibrary.writeLessonLibrary(lessonLibrary.addLibraryLesson([], 'new', course.project, []));
  await app.importLibrary(raw); app.failLibraryWrites(true); app.confirmDialog();
  assert.equal(app.libraryState().error, 'librarySaveFailed');
  assert.equal(app.storage.get(lessonLibrary.LIBRARY_KEY), before);
  assert.equal(app.libraryState().lessons.length, 1);
});

test('import confirmation rechecks available capacity when another window changed the shelf', async () => {
  const course = checkedCourse(), app = await openApp(course);
  const raw = lessonLibrary.writeLessonLibrary(lessonLibrary.addLibraryLesson([], 'incoming', course.project, []));
  await app.importLibrary(raw);
  let full = [];
  for (let i = 0; i < 20; i++) { course.project.title = `Other window ${i}`; full = lessonLibrary.addLibraryLesson(full, `other-${i}`, course.project, []); }
  const before = lessonLibrary.writeLessonLibrary(full);
  app.storage.set(lessonLibrary.LIBRARY_KEY, before); app.confirmDialog();
  assert.equal(app.libraryState().error, 'libraryFull');
  assert.equal(app.storage.get(lessonLibrary.LIBRARY_KEY), before);
});

test('saving and exporting shelf copies preserves the current lesson and clock across reloads', async () => {
  const app = await openApp(checkedCourse());
  const before = app.state();
  await app.action('library-save');
  assert.deepEqual(app.state(), before);
  const entry = app.libraryState().lessons[0];
  assert.deepEqual(entry.schedule, before.schedule);
  app.field({ id: 'lesson-title', value: 'Tomorrow', dataset: {} });
  await app.action('library-export', entry.id);
  assert.equal(app.downloads[0].filename, `Classroom-${before.project.title}.json`);
  assert.deepEqual(courseFiles.readCourseFile(await app.downloads[0].blob.text()).project, before.project);
  const reloaded = await openApp(checkedCourse(), { libraryRaw: app.storage.get(lessonLibrary.LIBRARY_KEY) });
  assert.deepEqual(reloaded.libraryState().lessons[0].project, before.project);
  assert.equal(app.apiCalls.length, 0);
});

test('opening a shelf lesson requires confirmation and restores the course with its checked schedule', async () => {
  const app = await openApp(checkedCourse());
  await app.action('library-save');
  const saved = app.libraryState().lessons[0];
  app.field({ id: 'lesson-title', value: 'Different current lesson', dataset: {} });
  await app.action('library-open', saved.id);
  assert.equal(app.state().project.title, 'Different current lesson');
  app.closeDialog();
  assert.equal(app.state().project.title, 'Different current lesson');
  await app.action('library-open', saved.id);
  const revision = app.state().clockRevision;
  app.confirmDialog();
  assert.deepEqual(app.state().project, saved.project);
  assert.deepEqual(app.state().schedule, saved.schedule);
  assert.equal(app.state().clockRevision, revision + 1);
});

test('removing a shelf copy supports cancel and backup without deleting the current lesson', async () => {
  const app = await openApp(checkedCourse());
  await app.action('library-save');
  const entry = app.libraryState().lessons[0], before = app.state();
  await app.action('library-remove', entry.id); app.closeDialog();
  assert.equal(app.libraryState().lessons.length, 1);
  await app.action('library-remove', entry.id);
  await app.action('library-export', entry.id);
  assert.deepEqual(courseFiles.readCourseFile(await app.downloads[0].blob.text()).project, before.project);
  app.confirmDialog();
  assert.equal(app.libraryState().lessons.length, 0);
  assert.deepEqual(app.state(), before);
  assert.equal(lessonLibrary.readLessonLibrary(app.storage.get(lessonLibrary.LIBRARY_KEY)).length, 0);
});

test('corrupt shelf storage and failed writes cannot overwrite copies or claim a successful save', async () => {
  const corrupt = await openApp(checkedCourse(), { libraryRaw: '{damaged' });
  await corrupt.action('library-save');
  assert.equal(corrupt.storage.get(lessonLibrary.LIBRARY_KEY), '{damaged');
  assert.equal(corrupt.libraryState().error, 'libraryUnreadable');
  const app = await openApp(checkedCourse());
  await app.action('library-save');
  const raw = app.storage.get(lessonLibrary.LIBRARY_KEY);
  app.failLibraryWrites(true);
  await app.action('library-save');
  assert.equal(app.storage.get(lessonLibrary.LIBRARY_KEY), raw);
  assert.equal(app.libraryState().lessons.length, 1);
  assert.equal(app.libraryState().error, 'librarySaveFailed');
  assert.equal(app.messages.at(-1), uiTranslate('en', 'librarySaveFailed'));
  await app.action('library-remove', app.libraryState().lessons[0].id); app.confirmDialog();
  assert.equal(app.storage.get(lessonLibrary.LIBRARY_KEY), raw);
  assert.equal(app.libraryState().lessons.length, 1);
});

test('saving a copy retains another window’s newer entries and excludes AI notes and API secrets', async () => {
  const app = await openApp(checkedCourse());
  const external = lessonLibrary.addLibraryLesson([], 'other-window', checkedCourse().project, checkedCourse().schedule);
  app.storage.set(lessonLibrary.LIBRARY_KEY, lessonLibrary.writeLessonLibrary(external));
  app.field({ id: 'notes', value: 'private-notes', dataset: {} });
  app.apiField({ id: 'api-key', value: 'private-key' });
  await app.action('library-save');
  assert.equal(app.libraryState().lessons.length, 2);
  assert.equal(app.libraryState().lessons[1].id, 'other-window');
  assert.doesNotMatch(app.storage.get(lessonLibrary.LIBRARY_KEY), /private-notes|private-key/);
});

test('a library copy with a damaged schedule opens its activities and requests replanning', async () => {
  const course = checkedCourse();
  course.schedule[0].start = 240;
  const raw = JSON.stringify({ format: 'classroom-commons-library', version: 1, lessons: [{ id: 'damaged-plan', course: JSON.stringify(course) }] });
  const app = await openApp(checkedCourse(), { libraryRaw: raw });
  await app.action('library-open', 'damaged-plan'); app.confirmDialog();
  assert.deepEqual(app.state().project, course.project);
  assert.deepEqual(app.state().schedule, []);
  assert.ok(app.messages.includes(translations.translate('en', 'scheduleDiscarded')));
});

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

test('group sheet export uses current language and paper without altering the lesson or clock', async () => {
  const app = await openApp(checkedCourse());
  app.field({ id: 'language', value: 'ar', dataset: {} });
  app.field({ id: 'paper', value: 'Letter', dataset: {} });
  const before = app.state(), saved = app.storage.get('cc-course');
  await app.action('group-sheets');
  const download = app.downloads.at(-1);
  assert.ok(download.filename.endsWith('-groups.html'));
  assert.equal(download.blob.type, 'text/html;charset=utf-8');
  const html = await download.blob.text();
  assert.ok(html.includes('lang="ar" dir="rtl"'));
  assert.ok(html.includes('@page{size:Letter;'));
  assert.deepEqual(app.state(), before);
  assert.equal(app.storage.get('cc-course'), saved);
  assert.equal(app.apiCalls.length, 0);
});

test('editing a lesson blocks group sheet export until it is checked again', async () => {
  const app = await openApp(checkedCourse());
  app.field({ id: 'lesson-title', value: 'Changed lesson', dataset: {} });
  await app.action('group-sheets');
  assert.equal(app.downloads.length, 0);
  assert.ok(app.messages.includes(uiTranslate('en', 'groupSheetsNotReady')));
  await app.action('solve'); app.finishSolver();
  await app.action('group-sheets');
  assert.equal(app.downloads.length, 1);
  assert.ok((await app.downloads[0].blob.text()).includes('Changed lesson'));
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
