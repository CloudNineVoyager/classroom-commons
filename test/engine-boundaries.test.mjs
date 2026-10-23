import test from 'node:test';
import assert from 'node:assert/strict';
import { demo } from '../app/demo.mjs';
import { validateProject, solve, checkSchedule, replan, adoptAlternative, parseProject } from '../app/engine.mjs';
import { writeCourseFile, readCourseFile } from '../app/project-file.mjs';

test('maximum supported lesson round-trips Unicode IDs, RTL text and all groups without collisions', () => {
  const ids = ['组一', 'الفريق', 'groupe-é', 'Grupo niño', '__proto__', 'constructor'];
  const p = {
    version: 1, title: '数数 · العد · Contar · Compter', duration: 240,
    groups: ids.map(id => ({ id, name: id, canRead: false, independentLimit: 240 })),
    resources: Array.from({ length: 30 }, (_, i) => ({ id: `أقلام-${i}`, name: `铅笔 / lápices / أقلام ${i}`, quantity: i === 0 ? 1 : 0 })),
    tasks: ids.flatMap(groupId => Array.from({ length: 4 }, (_, i) => ({
      id: `${groupId}-${i}`, groupId, title: `认识数 · التعلّم ${i}`, objective: '用实物表示数量 · تمثيل الأعداد',
      duration: 10, mode: 'teacher', requiresReading: false,
      after: i ? [`${groupId}-${i - 1}`] : [], needs: [{ resourceId: 'أقلام-0', quantity: 1 }], alternative: null
    })))
  };
  assert.deepEqual(validateProject(p), []);
  const result = solve(p);
  assert.equal(result.status, 'feasible');
  assert.deepEqual(checkSchedule(p, result.schedule), []);
  assert.equal(result.schedule.length, 24);
  assert.equal(result.schedule.at(-1).end, 240);
  assert.deepEqual(parseProject(JSON.stringify(p)), p);
  const restored = readCourseFile(writeCourseFile(p, result.schedule));
  assert.deepEqual(restored.project, p);
  assert.deepEqual(restored.schedule, result.schedule);
});

test('invalid or excessive independent-work delays never mutate the checked lesson', () => {
  const p = adoptAlternative(demo(), 'b2', true);
  p.duration = 50; p.groups.forEach(group => { group.independentLimit = 30; });
  const schedule = solve(p).schedule, original = structuredClone({ p, schedule });
  const delayed = replan(p, schedule, 'a2', 60);
  assert.equal(delayed.result.status, 'invalid');
  assert.ok(delayed.result.issues.some(issue => issue.code === 'independentTooLong'));
  for (const extra of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => replan(p, schedule, 'a2', extra), /invalidSchedule/);
  assert.deepEqual({ p, schedule }, original);
  assert.deepEqual(checkSchedule(p, schedule), []);
});
