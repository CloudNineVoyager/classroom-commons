import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { elapsedSeconds, pauseClock, resumeClock, clockAtActivity, formatClock, lessonSnapshot } from '../app/lesson-clock.mjs';
import { checkSchedule } from '../app/engine.mjs';

const course = JSON.parse(await readFile(new URL('../examples/no-materials-en.course.json', import.meta.url), 'utf8'));
const { project, schedule } = course;

test('jumping to a teacher activity pauses exactly at its scheduled start', () => {
  const clock = clockAtActivity(schedule, 't3');
  assert.deepEqual(clock, { elapsed: 300, since: null });
  const view = lessonSnapshot(project, schedule, clock.elapsed);
  assert.equal(view.teacher.task.id, 't3');
  assert.equal(view.groups.find(item => item.group.id === 'g1').task.id, 't1');
});

test('jumping to an independent activity updates all simultaneous groups', () => {
  const clock = clockAtActivity(schedule, 't4');
  const view = lessonSnapshot(project, schedule, clock.elapsed);
  assert.equal(view.groups.find(item => item.group.id === 'g2').task.id, 't4');
  assert.equal(view.teacher.task.id, 't2');
});

test('a located activity stays paused until explicitly resumed', () => {
  const clock = clockAtActivity(schedule, 't3');
  assert.equal(elapsedSeconds(clock, 900000), 300);
  assert.equal(elapsedSeconds(resumeClock(clock, 900000), 901000), 301);
});

test('a clock can jump back to the beginning and rejects an unknown activity', () => {
  assert.deepEqual(clockAtActivity(schedule, 't0'), { elapsed: 0, since: null });
  assert.equal(clockAtActivity(schedule, 'missing'), null);
  assert.equal(clockAtActivity([], 't0'), null);
});

test('jumping never changes the saved course or its schedule', () => {
  const before = JSON.stringify(course);
  for (const slot of schedule) clockAtActivity(schedule, slot.taskId);
  assert.equal(JSON.stringify(course), before);
});

test('lesson clock measures timestamps instead of counting timer callbacks', () => {
  const clock = resumeClock({ elapsed: 0, since: null }, 1000);
  assert.equal(elapsedSeconds(clock, 301000), 300);
  assert.equal(elapsedSeconds(clock, 1000), 0);
});

test('pause freezes elapsed time and resume excludes the pause interval', () => {
  const paused = pauseClock({ elapsed: 12, since: 1000 }, 4000);
  assert.equal(elapsedSeconds(paused, 600000), 15);
  const resumed = resumeClock(paused, 600000);
  assert.equal(elapsedSeconds(resumed, 603000), 18);
  assert.equal(resumeClock(resumed, 602000), resumed);
});

test('elapsed time never goes backwards if a timestamp precedes the start', () => {
  assert.equal(elapsedSeconds({ elapsed: 5, since: 10000 }, 9000), 5);
});

test('a checked lesson shows the first teacher group and its next activity', () => {
  assert.deepEqual(checkSchedule(project, schedule), []);
  const view = lessonSnapshot(project, schedule, 0);
  assert.equal(view.teacher.task.id, 't0');
  assert.equal(view.teacher.nextTask.id, 't1');
  assert.equal(view.nextChange, 300);
  assert.equal(view.groups.find(item => item.group.id === 'g2').active, undefined);
});

test('at an exact boundary teacher and independent activities switch together', () => {
  const view = lessonSnapshot(project, schedule, 300);
  assert.equal(view.teacher.task.id, 't3');
  assert.equal(view.groups.find(item => item.group.id === 'g1').task.id, 't1');
  assert.equal(view.groups.find(item => item.group.id === 'g1').nextTask.id, 't2');
  assert.equal(view.nextChange, 300);
});

test('a delayed browser callback jumps directly to the correct lesson stage', () => {
  const view = lessonSnapshot(project, schedule, 901);
  assert.equal(view.teacher.task.id, 't5');
  assert.equal(view.remaining, 299);
  assert.equal(view.nextChange, 299);
});

test('the end clamps the clock and clears active and next activities', () => {
  const view = lessonSnapshot(project, schedule, 9999);
  assert.equal(view.seconds, 1200);
  assert.equal(view.remaining, 0);
  assert.equal(view.complete, true);
  assert.equal(view.teacher, undefined);
  assert.equal(view.nextChange, null);
  assert.ok(view.groups.every(item => item.complete && !item.active && !item.next));
});

test('gaps and groups with no activities do not invent teacher-led work', () => {
  const view = lessonSnapshot({ ...project, groups: [...project.groups, { id: 'empty' }] }, schedule, 1199);
  const empty = view.groups.find(item => item.group.id === 'empty');
  assert.equal(empty.complete, false);
  assert.equal(empty.task, undefined);
  assert.equal(lessonSnapshot(project, [], 0).teacher, undefined);
});

test('clock views never change the saved lesson or schedule order', () => {
  const input = JSON.stringify(course);
  lessonSnapshot(project, schedule, 600);
  assert.equal(JSON.stringify(course), input);
});

test('clock labels keep seconds padded and support Arabic numerals', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(61.9), '01:01');
  assert.equal(formatClock(14400), '240:00');
  assert.equal(formatClock(-2), '00:00');
  assert.match(formatClock(61, 'ar'), /^\p{N}{2}:\p{N}{2}$/u);
});
