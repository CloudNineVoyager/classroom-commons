import test from 'node:test';
import assert from 'node:assert/strict';
import { demo } from '../app/demo.mjs';
import { adoptAlternative, solve } from '../app/engine.mjs';
import { readCourseFile, writeCourseFile } from '../app/project-file.mjs';
import { LIBRARY_LIMIT, LIBRARY_BACKUP_LIMIT, readLessonLibrary, writeLessonLibrary, addLibraryLesson, readLibraryBackup, mergeLessonLibraries } from '../app/lesson-library.mjs';

const course = () => {
  const project = adoptAlternative(demo(), 'b2', true);
  return { project, schedule: solve(project).schedule };
};

test('whole-library backups transfer complete lessons and regenerate identities on import', () => {
  const { project, schedule } = course();
  const original = addLibraryLesson([], 'old-id', project, schedule);
  const backup = readLibraryBackup('\uFEFF' + writeLessonLibrary(original));
  const result = mergeLessonLibraries([], backup, () => 'new-id');
  assert.equal(result.added, 1); assert.equal(result.skipped, 0);
  assert.equal(result.lessons[0].id, 'new-id');
  assert.deepEqual(readCourseFile(result.lessons[0].course), readCourseFile(original[0].course));
  assert.equal(original[0].id, 'old-id');
});

test('a full twenty-lesson backup restores all checked schedules in original shelf order', () => {
  const { project, schedule } = course();
  let shelf = [];
  for (let i = 0; i < 20; i++) { project.title = `Lesson ${i}`; shelf = addLibraryLesson(shelf, `source-${i}`, project, schedule); }
  let serial = 0;
  const restored = mergeLessonLibraries([], readLibraryBackup(writeLessonLibrary(shelf)), () => `restored-${serial++}`);
  assert.equal(restored.added, 20);
  assert.equal(restored.skipped, 0);
  assert.deepEqual(restored.lessons.map(entry => entry.course), shelf.map(entry => entry.course));
  for (const entry of restored.lessons) assert.deepEqual(readCourseFile(entry.course).schedule, schedule);
});

test('merge skips identical content but keeps edited lessons even when source IDs collide', () => {
  const { project, schedule } = course();
  const current = addLibraryLesson([], 'collision', project, schedule);
  const duplicate = { ...current[0], id: 'duplicate' };
  project.title = 'Revised lesson';
  const incoming = addLibraryLesson([duplicate], 'collision', project, schedule);
  let id = 0;
  const merged = mergeLessonLibraries(current, incoming, () => `merged-${++id}`);
  assert.equal(merged.added, 1); assert.equal(merged.skipped, 1);
  assert.equal(merged.lessons.length, 2);
  assert.equal(merged.lessons[1].id, 'collision');
  assert.equal(readCourseFile(merged.lessons[0].course).project.title, 'Revised lesson');
  assert.equal(mergeLessonLibraries(merged.lessons, incoming, () => 'unused').added, 0);
});

test('imports are all-or-nothing at capacity and deduplicate within the backup itself', () => {
  const { project, schedule } = course();
  const source = addLibraryLesson([], 'one', project, schedule);
  const repeated = [...source, { ...source[0], id: 'two' }];
  assert.equal(mergeLessonLibraries([], repeated, () => 'new').lessons.length, 1);
  let full = [];
  for (let i = 0; i < LIBRARY_LIMIT; i++) { project.title = `Lesson ${i}`; full = addLibraryLesson(full, `old-${i}`, project, schedule); }
  const before = writeLessonLibrary(full);
  assert.throws(() => mergeLessonLibraries(full, source, () => 'extra'), /libraryFull/);
  assert.equal(writeLessonLibrary(full), before);
  assert.equal(mergeLessonLibraries(full, [full[0]], () => 'unused').added, 0);
});

test('backup validation rejects wrong files and large input before any library mutation', () => {
  const { project, schedule } = course();
  for (const raw of [null, '{}', writeCourseFile(project, schedule), '{broken']) assert.throws(() => readLibraryBackup(raw), /libraryBackupInvalid/);
  assert.throws(() => readLibraryBackup('x'.repeat(LIBRARY_BACKUP_LIMIT + 1)), /libraryBackupTooLarge/);
  assert.deepEqual(readLibraryBackup(writeLessonLibrary([])), []);
});

test('import keeps recheck markers and does not restore a damaged schedule as checked', () => {
  const { project, schedule } = course();
  const rawCourse = JSON.parse(writeCourseFile(project, schedule)); rawCourse.schedule[0].start = 240;
  const backup = readLibraryBackup(JSON.stringify({ format: 'classroom-commons-library', version: 1, lessons: [{ id: 'bad-plan', course: JSON.stringify(rawCourse) }] }));
  const result = mergeLessonLibraries([], backup, () => 'restored');
  assert.equal(result.lessons[0].needsRecheck, true);
  assert.deepEqual(readCourseFile(result.lessons[0].course).schedule, []);
});

test('multiple named lesson snapshots preserve checked courses across library reloads', () => {
  const { project, schedule } = course();
  const first = addLibraryLesson([], 'lesson-1', project, schedule);
  project.title = 'Next week';
  const both = addLibraryLesson(first, 'lesson-2', project, schedule);
  const reloaded = readLessonLibrary(writeLessonLibrary(both));
  assert.deepEqual(reloaded.map(entry => entry.id), ['lesson-2', 'lesson-1']);
  assert.equal(readCourseFile(reloaded[1].course).project.title, 'Making numbers together');
  assert.equal(readCourseFile(reloaded[0].course).project.title, 'Next week');
  for (const entry of reloaded) assert.deepEqual(readCourseFile(entry.course).schedule, schedule);
  project.tasks[0].needs[0].quantity = 123;
  assert.notEqual(readCourseFile(first[0].course).project.tasks[0].needs[0].quantity, 123);
});

test('unfinished lessons remain editable and saved JSON strips unrelated credentials', () => {
  const { project } = course();
  project.duration = null; project.tasks[0].objective = ''; project.tasks[0].duration = null;
  project.apiKey = 'private-secret'; project.notes = 'private-ai-notes';
  const raw = writeLessonLibrary(addLibraryLesson([], 'unfinished', project, []));
  assert.doesNotMatch(raw, /private-secret|private-ai-notes|apiKey/);
  const loaded = readCourseFile(readLessonLibrary(raw)[0].course);
  assert.equal(loaded.project.duration, null);
  assert.equal(loaded.project.tasks[0].objective, '');
  assert.deepEqual(loaded.schedule, []);
});

test('damaged schedules retain the lesson and a recheck marker through repeated saves', () => {
  const { project, schedule } = course();
  const wrapped = JSON.parse(writeCourseFile(project, schedule));
  wrapped.schedule[0].start = 240;
  const raw = JSON.stringify({ format: 'classroom-commons-library', version: 1, lessons: [{ id: 'lesson', course: JSON.stringify(wrapped) }] });
  const reloaded = readLessonLibrary(writeLessonLibrary(readLessonLibrary(raw)));
  assert.equal(reloaded[0].needsRecheck, true);
  assert.deepEqual(readCourseFile(reloaded[0].course).schedule, []);
  assert.equal(readCourseFile(reloaded[0].course).project.title, project.title);
});

test('missing library is empty but corrupt, oversized or duplicate entries fail as a whole', () => {
  assert.deepEqual(readLessonLibrary(null), []);
  const { project, schedule } = course();
  const entry = addLibraryLesson([], 'same', project, schedule)[0];
  for (const raw of ['', 'null', '{}', '{', JSON.stringify({ format: 'classroom-commons-library', version: 1, lessons: [entry, entry] }), JSON.stringify({ format: 'classroom-commons-library', version: 1, lessons: [{ id: 'x', course: 'x'.repeat(1000001) }] })]) {
    assert.throws(() => readLessonLibrary(raw), /libraryUnreadable/);
  }
});

test('saving at the twenty-lesson limit does not remove or mutate older copies', () => {
  const { project, schedule } = course();
  let entries = [];
  for (let i = 0; i < LIBRARY_LIMIT; i++) entries = addLibraryLesson(entries, `lesson-${i}`, project, schedule);
  const before = writeLessonLibrary(entries);
  assert.throws(() => addLibraryLesson(entries, 'extra', project, schedule), /libraryFull/);
  assert.equal(writeLessonLibrary(entries), before);
});

test('library IDs reject empty, duplicate and oversized values while Unicode course names survive', () => {
  const { project, schedule } = course(); project.title = '乡村课堂 / درس / Lección';
  const entries = addLibraryLesson([], '正常-id', project, schedule);
  assert.equal(readCourseFile(entries[0].course).project.title, project.title);
  for (const id of ['', '正常-id', 'x'.repeat(101)]) assert.throws(() => addLibraryLesson(entries, id, project, schedule), /libraryUnreadable/);
});
