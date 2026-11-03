import test from 'node:test';
import assert from 'node:assert/strict';
import { demo } from '../app/demo.mjs';
import { adoptAlternative, solve } from '../app/engine.mjs';
import { groupSheetsHTML } from '../app/group-sheets.mjs';
import { uiTranslate } from '../app/ui-copy.mjs';

const course = () => {
  const project = adoptAlternative(demo(), 'b2', true);
  return { project, schedule: solve(project).schedule };
};
const sections = html => html.match(/<section class="group-sheet">[\s\S]*?<\/section>/g);

test('group sheets isolate groups and order activities by checked time without changing the course', () => {
  const { project, schedule } = course();
  schedule.reverse();
  const before = JSON.stringify({ project, schedule });
  const sheets = sections(groupSheetsHTML(project, schedule));
  assert.equal(sheets.length, project.groups.length);
  for (const [index, group] of project.groups.entries()) {
    const expected = schedule.filter(slot => project.tasks.find(task => task.id === slot.taskId).groupId === group.id).sort((a, b) => a.start - b.start);
    const headings = [...sheets[index].matchAll(/<h2>(.*?)<\/h2>/g)].map(match => match[1]);
    assert.deepEqual(headings, expected.map(slot => project.tasks.find(task => task.id === slot.taskId).title));
    assert.equal((sheets[index].match(/class="tick"/g) || []).length, expected.length);
    for (const slot of expected) assert.ok(sheets[index].includes(`<bdi>${slot.start}–${slot.end}</bdi>`));
  }
  assert.equal(JSON.stringify({ project, schedule }), before);
});

test('sheets retain objectives, materials, prerequisite groups and adopted explanations', () => {
  const { project, schedule } = course();
  const task = project.tasks.find(task => task.id === 'b2');
  const html = groupSheetsHTML(project, schedule);
  assert.ok(html.includes(task.objective));
  assert.ok(html.includes(task.adaptation.rationale));
  assert.ok(html.includes('Counters / stones × 10'));
  for (const id of task.after) {
    const prerequisite = project.tasks.find(task => task.id === id);
    assert.ok(html.includes(`${project.groups.find(group => group.id === prerequisite.groupId).name}: ${prerequisite.title}`));
  }
});

test('oral guidance appears only for groups recorded as unable to read', () => {
  const { project, schedule } = course();
  const sheets = sections(groupSheetsHTML(project, schedule));
  project.groups.forEach((group, index) => assert.equal(sheets[index].includes('class="reading-note"'), !group.canRead));
});

test('unplanned, stale, conflicting and resource-short lessons cannot produce sheets', () => {
  const { project, schedule } = course();
  assert.throws(() => groupSheetsHTML(project, []), /groupSheetsNotReady/);
  assert.throws(() => groupSheetsHTML(project, schedule.slice(1)), /groupSheetsNotReady/);
  const stale = structuredClone(project); stale.tasks[0].duration++;
  assert.throws(() => groupSheetsHTML(stale, schedule), /groupSheetsNotReady/);
  assert.throws(() => groupSheetsHTML(project, schedule.map(slot => ({ ...slot, start: 0 }))), /groupSheetsNotReady/);
  const shortage = structuredClone(project); shortage.resources[0].quantity = 0;
  assert.throws(() => groupSheetsHTML(shortage, schedule), /groupSheetsNotReady/);
});

test('all imported text is escaped and the exported document has no scripts or remote assets', () => {
  const { project, schedule } = course();
  const unsafe = '<img src=x onerror="alert(1)">&\'';
  project.title = unsafe;
  project.groups[0].name = unsafe;
  project.resources[0].name = unsafe;
  project.tasks[0].title = unsafe; project.tasks[0].objective = unsafe;
  project.tasks[0].adaptation = { rationale: unsafe, teacherConfirmed: true };
  const html = groupSheetsHTML(project, schedule);
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;'));
  assert.doesNotMatch(html, /<img|<script|<iframe|https?:|url\(/i);
  assert.ok(html.includes("default-src 'none'; style-src 'unsafe-inline'"));
});

test('four languages, RTL, safe paper choices and per-group print breaks are supported', () => {
  const { project, schedule } = course();
  for (const lang of ['en', 'zh', 'es', 'ar']) {
    const html = groupSheetsHTML(project, schedule, { lang, paper: 'Letter' });
    assert.ok(html.includes(`lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"`));
    assert.ok(html.includes(uiTranslate(lang, 'groupSheets')));
    assert.ok(html.includes('@page{size:Letter;'));
    assert.ok(html.includes('break-before:page'));
    assert.ok(html.includes('break-inside:avoid'));
  }
  const fallback = groupSheetsHTML(project, schedule, { lang: '" onload="bad', paper: 'bad;}' });
  assert.ok(fallback.includes('lang="en"'));
  assert.ok(fallback.includes('@page{size:A4;'));
});
