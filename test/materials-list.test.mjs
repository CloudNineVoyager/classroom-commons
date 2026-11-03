import test from 'node:test';
import assert from 'node:assert/strict';
import { materialRequirements, materialsListHTML } from '../app/materials-list.mjs';
import { uiTranslate } from '../app/ui-copy.mjs';
const fixture = () => ({
  project: { version: 1, title: 'Packing', duration: 20,
    groups: ['a','b'].map(id => ({ id, name: id, canRead: true, independentLimit: 20 })),
    resources: [{ id: 'r', name: 'Stones', quantity: 20 }, { id: 'unused', name: 'Unused', quantity: 50 }],
    tasks: [['t1','a',6],['t2','b',4],['t3','a',8]].map(([id, groupId, quantity]) => ({ id, groupId, title: id, objective: 'Count', duration: 10, mode: 'independent', after: [], needs: [{ resourceId: 'r', quantity }], requiresReading: false, alternative: null })) },
  schedule: [{ taskId: 't1', start: 0, end: 10 }, { taskId: 't2', start: 0, end: 10 }, { taskId: 't3', start: 10, end: 20 }]
});
test('checklist adds concurrent demand but reuses materials at exact activity boundaries', () => {
  const { project, schedule } = fixture(), before = JSON.stringify({ project, schedule });
  const rows = materialRequirements(project, schedule.reverse());
  assert.equal(rows.length, 1); assert.equal(rows[0].peak, 10); assert.equal(rows[0].available, 20);
  assert.deepEqual(rows[0].uses.map(use => use.start), [0,0,10]);
  schedule.reverse(); assert.equal(JSON.stringify({ project, schedule }), before);
});
test('staggered overlap counts all active groups, not just equal start times', () => {
  const { project, schedule } = fixture();
  schedule[1].start = 5; schedule[1].end = 15;
  assert.equal(materialRequirements(project, schedule)[0].peak, 12);
});
test('unchecked, incomplete, stale and resource-short schedules cannot export', () => {
  const { project, schedule } = fixture();
  for (const bad of [[], schedule.slice(1), schedule.map(s => ({ ...s, start: 0 }))]) assert.throws(() => materialsListHTML(project, bad), /materialsNotReady/);
  project.resources[0].quantity = 1;
  assert.throws(() => materialsListHTML(project, schedule), /materialsNotReady/);
});
test('no-material lessons export an explicit empty message instead of unused inventory', () => {
  const { project, schedule } = fixture(); project.tasks.forEach(task => { task.needs = []; });
  assert.deepEqual(materialRequirements(project, schedule), []);
  const html = materialsListHTML(project, schedule);
  assert.ok(html.includes(uiTranslate('en','materialsEmpty'))); assert.ok(!html.includes('Stones'));
});
test('print export retains all uses, localizes four languages and constrains paper and language', () => {
  const { project, schedule } = fixture();
  for (const lang of ['en','zh','es','ar']) {
    const html = materialsListHTML(project, schedule, { lang, paper: 'Letter' });
    assert.ok(html.includes(`lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"`));
    assert.ok(html.includes(uiTranslate(lang,'materialsReuse'))); assert.ok(html.includes('@page{size:Letter;'));
    for (const task of project.tasks) assert.ok(html.includes(task.title));
    assert.equal((html.match(/class="tick"/g) || []).length, 1);
  }
  const html = materialsListHTML(project, schedule, { lang: 'bad', paper: 'bad;}' });
  assert.ok(html.includes('lang="en"')); assert.ok(html.includes('@page{size:A4;'));
});
test('all course text is escaped in a scriptless document with no remote dependencies', () => {
  const { project, schedule } = fixture(), unsafe = '<img src=x onerror="bad">&';
  project.title = unsafe; project.groups[0].name = unsafe; project.resources[0].name = unsafe; project.tasks[0].title = unsafe;
  const html = materialsListHTML(project, schedule);
  assert.equal((html.match(/&lt;img/g) || []).length, 6);
  assert.doesNotMatch(html, /<img|<script|https?:|url\(/i);
  assert.ok(html.includes("default-src 'none'; style-src 'unsafe-inline'"));
});
