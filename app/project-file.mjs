import { parseProject, checkSchedule } from './engine.mjs';

const fileText = value => typeof value === 'string' && value.length <= 2000;
const fileNumber = value => value === null || (typeof value === 'number' && Number.isFinite(value));
function fileList(value, max) { if (!Array.isArray(value) || value.length > max) throw new Error('invalidProject'); return value; }
function fileCheck(condition) { if (!condition) throw new Error('invalidProject'); }

// Preserve unfinished editor fields; detailed classroom checks still run before scheduling.
export function editableProject(raw) {
  fileCheck(raw && raw.version === 1 && fileText(raw.title) && fileNumber(raw.duration));
  const ids = list => {
    const values = list.map(item => item?.id);
    fileCheck(values.every(value => fileText(value) && value.length > 0) && new Set(values).size === values.length);
  };
  const groups = fileList(raw.groups, 6), resources = fileList(raw.resources, 30), tasks = fileList(raw.tasks, 24);
  fileCheck(groups.length > 0); [groups, resources, tasks].forEach(ids);
  const needs = value => fileList(value, 30).map(need => {
    fileCheck(need && fileText(need.resourceId) && resources.some(r => r.id === need.resourceId) && fileNumber(need.quantity));
    return { resourceId: need.resourceId, quantity: need.quantity };
  });
  return {
    version: 1, title: raw.title, duration: raw.duration,
    groups: groups.map(group => {
      fileCheck(fileText(group.name) && typeof group.canRead === 'boolean' && fileNumber(group.independentLimit));
      return { id: group.id, name: group.name, canRead: group.canRead, independentLimit: group.independentLimit };
    }),
    resources: resources.map(resource => {
      fileCheck(fileText(resource.name) && fileNumber(resource.quantity));
      return { id: resource.id, name: resource.name, quantity: resource.quantity };
    }),
    tasks: tasks.map(task => {
      fileCheck(fileText(task.title) && fileText(task.objective) && groups.some(g => g.id === task.groupId) && fileNumber(task.duration) && ['teacher', 'independent'].includes(task.mode) && typeof task.requiresReading === 'boolean');
      const after = fileList(task.after, 24); fileCheck(after.every(dep => fileText(dep) && tasks.some(t => t.id === dep)));
      let alternative = null;
      if (task.alternative != null) {
        const a = task.alternative;
        fileCheck(fileText(a.title) && fileText(a.rationale) && typeof a.requiresReading === 'boolean');
        alternative = { title: a.title, rationale: a.rationale, requiresReading: a.requiresReading, needs: needs(a.needs) };
      }
      return { id: task.id, groupId: task.groupId, title: task.title, objective: task.objective, duration: task.duration, mode: task.mode, requiresReading: task.requiresReading, after: [...after], needs: needs(task.needs), alternative,
        ...(task.adaptation?.teacherConfirmed === true && fileText(task.adaptation.rationale) ? { adaptation: { rationale: task.adaptation.rationale, teacherConfirmed: true } } : {}) };
    })
  };
}

export function readCourseFile(input) {
  if (new TextEncoder().encode(input).length > 1000000) throw new Error('tooLarge');
  const raw = JSON.parse(input.replace(/^\uFEFF/, ''));
  const wrapped = raw?.format === 'classroom-commons-course' && raw.fileVersion === 1;
  const project = wrapped ? editableProject(raw.project) : parseProject(input.replace(/^\uFEFF/, ''));
  const candidate = raw.schedule;
  const schedule = Array.isArray(candidate) && !checkSchedule(project, candidate).length ? candidate.map(s => ({ taskId: s.taskId, start: s.start, end: s.end })) : [];
  return { project, schedule, scheduleDiscarded: candidate !== undefined && (!Array.isArray(candidate) || (candidate.length > 0 && schedule.length === 0)) };
}

export function writeCourseFile(project, schedule = []) {
  const safeProject = editableProject(project);
  const checked = schedule.length && !checkSchedule(safeProject, schedule).length ? schedule.map(s => ({ taskId: s.taskId, start: s.start, end: s.end })) : [];
  const output = JSON.stringify({ format: 'classroom-commons-course', fileVersion: 1, project: safeProject, schedule: checked }, null, 2);
  if (new TextEncoder().encode(output).length > 1000000) throw new Error('tooLarge');
  return output;
}
