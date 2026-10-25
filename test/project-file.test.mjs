import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { demo } from '../app/demo.mjs';
import { solve, adoptAlternative, validateProject, checkSchedule, auditResources } from '../app/engine.mjs';
import { writeCourseFile, readCourseFile, duplicateActivity } from '../app/project-file.mjs';

test('duplicate activity inserts an independent copy directly after the original', () => {
  const project = demo('zh'), before = JSON.stringify(project);
  const source = project.tasks[1];
  const copy = duplicateActivity(project, source.id, 'copied-activity');
  assert.equal(JSON.stringify(project), before);
  assert.deepEqual(copy.tasks[2], { ...source, id: 'copied-activity' });
  copy.tasks[2].title = 'Changed copy';
  copy.tasks[2].after.push(project.tasks[0].id);
  assert.notEqual(copy.tasks[1].title, copy.tasks[2].title);
  assert.deepEqual(copy.tasks[1].after, source.after);
});

test('copied materials and alternative activities do not share mutable data', () => {
  const project = demo(), source = project.tasks.find(task => task.id === 'b2');
  const copy = duplicateActivity(project, source.id, 'new-b2');
  const task = copy.tasks.find(task => task.id === 'new-b2');
  task.needs[0].quantity = 99;
  task.alternative.title = 'Another approach';
  assert.deepEqual(copy.tasks.find(task => task.id === 'b2'), source);
  assert.deepEqual(project.tasks.find(task => task.id === 'b2'), source);
});

test('duplicate activity rejects unknown or reused identities and the activity limit', () => {
  const project = demo();
  assert.throws(() => duplicateActivity(project, 'missing', 'new'), /invalidProject/);
  assert.throws(() => duplicateActivity(project, project.tasks[0].id, project.tasks[1].id), /invalidProject/);
  assert.throws(() => duplicateActivity(project, project.tasks[0].id, ''), /invalidProject/);
  const full = structuredClone(project);
  full.tasks = Array.from({ length: 24 }, (_, i) => ({ ...structuredClone(project.tasks[0]), id: `task-${i}`, after: [] }));
  assert.throws(() => duplicateActivity(full, 'task-0', 'overflow'), /invalidProject/);
});

test('copied unfinished activities and dependencies survive a saved-course round trip', () => {
  const project = demo(); project.tasks[1].objective = ''; project.tasks[1].duration = null;
  const copy = duplicateActivity(project, project.tasks[1].id, 'unfinished-copy');
  const restored = readCourseFile(writeCourseFile(copy));
  assert.deepEqual(restored.project, copy);
  assert.equal(restored.project.tasks[2].duration, null);
});

test('saved course preserves the checked schedule and reviewed alternatives', () => {
  const p = adoptAlternative(demo('zh'), 'b2', true), result = solve(p);
  assert.equal(result.status, 'feasible');
  const restored = readCourseFile(writeCourseFile(p, result.schedule));
  assert.deepEqual(restored.project, p);
  assert.deepEqual(restored.schedule, result.schedule);
  assert.equal(restored.scheduleDiscarded, false);
});
test('unfinished group and cleared fields survive save and reopen without being approved', () => {
  const p = demo('zh');
  p.title = ''; p.duration = 0; p.tasks[0].objective = '';
  p.groups.push({ id: 'unfinished', name: '', canRead: false, independentLimit: 0 });
  const restored = readCourseFile(writeCourseFile(p));
  assert.deepEqual(restored.project, p);
  assert.ok(validateProject(restored.project).length > 0);
  assert.deepEqual(restored.schedule, []);
});
test('old project files still open; a damaged schedule is never presented as checked', () => {
  const p = adoptAlternative(demo(), 'b2', true);
  assert.deepEqual(readCourseFile(JSON.stringify(p)).project, p);
  const file = JSON.parse(writeCourseFile(p)); file.schedule = [null];
  const restored = readCourseFile('\uFEFF' + JSON.stringify(file));
  assert.deepEqual(restored.project, p); assert.deepEqual(restored.schedule, []);
  assert.equal(restored.scheduleDiscarded, true);
});

test('damaged schedule types keep the course and request a new checked plan', () => {
  const p = adoptAlternative(demo(), 'b2', true), file = JSON.parse(writeCourseFile(p));
  for (const schedule of [null, {}, 'damaged', false, 42]) {
    const restored = readCourseFile(JSON.stringify({ ...file, schedule }));
    assert.deepEqual(restored.project, p);
    assert.deepEqual(restored.schedule, []);
    assert.equal(restored.scheduleDiscarded, true);
  }
  assert.equal(readCourseFile(JSON.stringify(p)).scheduleDiscarded, false);
  assert.equal(readCourseFile(writeCourseFile(p)).scheduleDiscarded, false);
});
test('editor files strip unknown settings and reject unsafe or broken structures', () => {
  const p = { ...demo(), apiKey: 'not-a-real-key' };
  assert.equal(readCourseFile(writeCourseFile(p)).project.apiKey, undefined);
  const file = JSON.parse(writeCourseFile(p));
  file.project.tasks[0].needs = [null];
  assert.throws(() => readCourseFile(JSON.stringify(file)), /invalidProject/);
  assert.throws(() => readCourseFile('x'.repeat(1000001)), /tooLarge/);
});

test('every shipped complete example passes the same classroom checks as the workbench', async () => {
  const folder = new URL('../examples/', import.meta.url);
  const names = (await readdir(folder)).filter(name => name.endsWith('.course.json'));
  assert.ok(names.length >= 3);
  for (const name of names) {
    const course = readCourseFile(await readFile(new URL(name, folder), 'utf8'));
    assert.deepEqual(auditResources(course.project), [], name);
    assert.deepEqual(checkSchedule(course.project, course.schedule), [], name);
    assert.equal(course.schedule.length, course.project.tasks.length, name);
  }
});
