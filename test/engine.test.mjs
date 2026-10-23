import test from 'node:test';
import assert from 'node:assert/strict';
import { demo } from '../app/demo.mjs';
import { validateProject, auditResources, adoptAlternative, solve, checkSchedule, replan, parseProject } from '../app/engine.mjs';
const ready = () => adoptAlternative(demo(), 'b2', true);

test('missing printed sheets prevent a plan, teacher-approved replacement fits', () => {
  const p = demo();
  assert.equal(auditResources(p).find(i => i.code === 'shortage').available, 0);
  assert.equal(solve(p).status, 'invalid');
  assert.throws(() => adoptAlternative(p, 'b2', false), /objectiveConfirmation/);
  const adapted = ready();
  assert.equal(adapted.tasks.find(t => t.id === 'b2').objective, p.tasks.find(t => t.id === 'b2').objective);
  const result = solve(adapted);
  assert.equal(result.status, 'feasible');
  assert.deepEqual(checkSchedule(adapted, result.schedule), []);
});
test('teacher and group collisions fail even when all task durations fit', () => {
  const p = ready(), result = solve(p);
  const broken = structuredClone(result.schedule);
  const a = broken.find(s => s.taskId === 'a1'), b = broken.find(s => s.taskId === 'b1');
  b.start = a.start; b.end = a.end;
  assert.ok(checkSchedule(p, broken).some(i => i.code === 'scheduleConflict'));
});
test('attention limits can require deliberately starting a teacher activity later', () => {
  const p = {
    version: 1, title: 'A short lesson', duration: 30,
    groups: [{ id: 'g', name: 'Group', canRead: true, independentLimit: 10 }], resources: [],
    tasks: [
      { id: 't', groupId: 'g', title: 'Model', objective: 'See the method', duration: 10, mode: 'teacher', requiresReading: false, after: [], needs: [], alternative: null },
      { id: 'i', groupId: 'g', title: 'Practise', objective: 'Try the method', duration: 10, mode: 'independent', requiresReading: false, after: ['t'], needs: [], alternative: null }
    ]
  };
  const result = solve(p);
  assert.equal(result.status, 'feasible');
  assert.deepEqual(checkSchedule(p, result.schedule), []);
  assert.equal(result.schedule.find(s => s.taskId === 't').start, 10);
});
test('malformed saved schedules fail validation without crashing recovery', () => {
  assert.equal(checkSchedule(ready(), [null, null, null, null, null, null])[0].code, 'invalidSchedule');
});
test('simultaneous capacity across groups is checked, not just individual requirements', () => {
  const p = ready(); p.resources.find(r => r.id === 'counters').quantity = 10;
  const s = [
    { taskId: 'a1', start: 0, end: 10 }, { taskId: 'a2', start: 10, end: 20 }, { taskId: 'a3', start: 20, end: 30 },
    { taskId: 'b1', start: 0, end: 10 }, { taskId: 'b2', start: 10, end: 20 }, { taskId: 'b3', start: 30, end: 40 }
  ];
  p.tasks.find(t => t.id === 'b1').mode = 'independent';
  assert.deepEqual(auditResources(p), []);
  assert.ok(checkSchedule(p, s).some(i => i.code === 'scheduleConflict'));
});
test('non-reading group cannot silently receive independent reading activity', () => {
  const p = ready(); p.tasks.find(t => t.id === 'a2').requiresReading = true;
  assert.equal(solve(p).status, 'invalid');
  assert.ok(auditResources(p).some(i => i.code === 'reading'));
});
test('independent duration and waiting/attention gaps are separately checked', () => {
  const p = ready(), s = solve(p).schedule;
  p.groups[0].independentLimit = 5;
  assert.ok(auditResources(p).some(i => i.code === 'independentTooLong'));
  p.groups[0].independentLimit = 10; p.duration = 60;
  assert.ok(checkSchedule(p, s).some(i => i.code === 'attentionGap'));
});
test('prerequisite violations and cycles cannot pass', () => {
  const p = ready(), s = solve(p).schedule;
  p.tasks.find(t => t.id === 'a1').after = ['a3'];
  assert.ok(validateProject(p).some(i => i.code === 'dependencyCycle'));
  p.tasks.find(t => t.id === 'a1').after = [];
  p.tasks.find(t => t.id === 'a1').after = ['b3'];
  assert.ok(checkSchedule(p, s).some(i => i.code === 'dependencyConflict'));
});
test('overload is provably infeasible; a capped search reports unknown', () => {
  const p = ready(); p.duration = 35;
  assert.equal(solve(p).status, 'infeasible');
  assert.equal(solve(ready(), { maxNodes: 0 }).status, 'unknown');
});
test('delay cannot silently drop activities or overwrite the input project', () => {
  const p = ready(), baseline = solve(p).schedule;
  const { project, result } = replan(p, baseline, 'a1', 5);
  assert.equal(p.tasks[0].duration, 10);
  assert.equal(project.tasks[0].duration, 15);
  assert.equal(project.tasks.length, p.tasks.length);
  assert.equal(result.status, 'infeasible');
});
test('a feasible delayed scenario preserves already-started activities', () => {
  const p = ready(); p.duration = 50; p.groups.forEach(g => g.independentLimit = 30);
  const baseline = solve(p).schedule;
  const selected = baseline.find(s => s.taskId === 'a1');
  const { project, result } = replan(p, baseline, 'a1', 3);
  assert.equal(result.status, 'feasible');
  assert.deepEqual(checkSchedule(project, result.schedule), []);
  for (const s of baseline.filter(s => s.start < selected.end)) assert.equal(result.schedule.find(n => n.taskId === s.taskId).start, s.start);
});
test('malformed imports, unknown resources and oversized projects fail safely', () => {
  for (const value of [null, {}, { ...demo(), tasks: [null] }, { ...demo(), groups: [null] }, { ...demo(), tasks: [{ ...demo().tasks[0], needs: {} }] }]) assert.ok(validateProject(value).length);
  const p = demo(); p.tasks[0].needs[0].resourceId = 'missing'; assert.throws(() => parseProject(JSON.stringify(p)), /invalidResource/);
  p.duration = 241; assert.ok(validateProject(p).length);
});
test('import strips settings/keys but preserves reviewed adaptation metadata', () => {
  const p = ready(); p.apiKey = 'never-keep-this'; p.config = { secret: 'secret' };
  const parsed = parseProject('```json\n' + JSON.stringify(p) + '\n```');
  assert.equal(parsed.apiKey, undefined); assert.equal(parsed.config, undefined);
  assert.equal(parsed.tasks.find(t => t.id === 'b2').adaptation.teacherConfirmed, true);
});
