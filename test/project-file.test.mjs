import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { demo } from '../app/demo.mjs';
import { solve, adoptAlternative, validateProject, checkSchedule, auditResources } from '../app/engine.mjs';
import { writeCourseFile, readCourseFile } from '../app/project-file.mjs';

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
