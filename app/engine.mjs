export const VERSION = 1;
const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const text = (s) => typeof s === 'string' && s.length > 0 && s.length <= 2000;

export function validateProject(p) {
  try { return validateShape(p); } catch { return [{ code: 'invalidProject', item: '' }]; }
}

function validateShape(p) {
  const errors = [];
  const fail = (code, item = '') => errors.push({ code, item });
  if (!p || p.version !== VERSION || !text(p.title) || !integer(p.duration, 5, 240)) return [{ code: 'invalidProject', item: '' }];
  if (!Array.isArray(p.groups) || !p.groups.length || p.groups.length > 6 || !Array.isArray(p.resources) || p.resources.length > 30 || !Array.isArray(p.tasks) || !p.tasks.length || p.tasks.length > 24) return [{ code: 'invalidProject', item: '' }];
  const groups = new Set(), resources = new Set(), tasks = new Set();
  for (const g of p.groups) {
    if (!text(g.id) || groups.has(g.id) || !text(g.name) || !integer(g.independentLimit, 1, 240) || typeof g.canRead !== 'boolean') fail('invalidGroup', g.name || '');
    groups.add(g.id);
  }
  for (const r of p.resources) {
    if (!text(r.id) || resources.has(r.id) || !text(r.name) || !integer(r.quantity, 0, 100000)) fail('invalidResource', r.name || '');
    resources.add(r.id);
  }
  for (const t of p.tasks) {
    if (!text(t.id) || tasks.has(t.id) || !text(t.title) || !text(t.objective) || !groups.has(t.groupId) || !integer(t.duration, 1, 240) || !['teacher', 'independent'].includes(t.mode) || typeof t.requiresReading !== 'boolean' || !Array.isArray(t.after) || !Array.isArray(t.needs)) fail('invalidTask', t.title || '');
    tasks.add(t.id);
    for (const n of Array.isArray(t.needs) ? t.needs : []) if (!resources.has(n.resourceId) || !integer(n.quantity, 1, 100000)) fail('invalidResource', t.title);
    if (new Set((t.needs || []).map(n => n.resourceId)).size !== (t.needs || []).length) fail('invalidResource', t.title);
    if (t.alternative != null) {
      const a = t.alternative;
      if (!text(a.title) || !text(a.rationale) || typeof a.requiresReading !== 'boolean' || !Array.isArray(a.needs)) fail('invalidTask', t.title);
      for (const n of Array.isArray(a.needs) ? a.needs : []) if (!resources.has(n.resourceId) || !integer(n.quantity, 1, 100000)) fail('invalidResource', t.title);
      if (Array.isArray(a.needs) && new Set(a.needs.map(n => n.resourceId)).size !== a.needs.length) fail('invalidResource', t.title);
    }
  }
  if (errors.length) return errors;
  for (const t of p.tasks) for (const dep of t.after) if (!tasks.has(dep) || dep === t.id) fail('invalidDependency', t.title);
  if (errors.length) return errors;
  const visited = new Set(), active = new Set(), byId = new Map(p.tasks.map(t => [t.id, t]));
  function visit(id) {
    if (active.has(id)) return false;
    if (visited.has(id)) return true;
    active.add(id);
    if (!byId.get(id).after.every(visit)) return false;
    active.delete(id); visited.add(id); return true;
  }
  if (!p.tasks.every(t => visit(t.id))) fail('dependencyCycle');
  for (const g of p.groups) if (!p.tasks.some(t => t.groupId === g.id)) fail('emptyGroup', g.name);
  return errors;
}

export function auditResources(p) {
  const errors = validateProject(p);
  if (errors.length) return errors;
  const issues = [];
  for (const t of p.tasks) {
    const g = p.groups.find(g => g.id === t.groupId);
    if (t.mode === 'independent' && t.requiresReading && !g.canRead) issues.push({ code: 'reading', item: t.title, taskId: t.id });
    if (t.mode === 'independent' && t.duration > g.independentLimit) issues.push({ code: 'independentTooLong', item: t.title, taskId: t.id });
    for (const n of t.needs) {
      const r = p.resources.find(r => r.id === n.resourceId);
      if (n.quantity > r.quantity) issues.push({ code: 'shortage', item: `${t.title} · ${r.name}`, taskId: t.id, required: n.quantity, available: r.quantity });
    }
  }
  return issues;
}

export function adoptAlternative(p, taskId, teacherConfirmed) {
  if (!teacherConfirmed) throw new Error('objectiveConfirmation');
  const copy = structuredClone(p), t = copy.tasks.find(t => t.id === taskId);
  if (!t?.alternative) throw new Error('invalidTask');
  const a = t.alternative;
  t.title = a.title; t.needs = a.needs; t.requiresReading = a.requiresReading;
  t.adaptation = { rationale: a.rationale, teacherConfirmed: true };
  t.alternative = null;
  const errors = validateProject(copy);
  if (errors.length) throw new Error(errors[0].code);
  return copy;
}

function compatible(p, placed, t, start) {
  if (start < 0 || start + t.duration > p.duration) return false;
  for (const other of placed) {
    if (start >= other.end || start + t.duration <= other.start) continue;
    const ot = p.tasks.find(t => t.id === other.taskId);
    if (ot.groupId === t.groupId || (t.mode === 'teacher' && ot.mode === 'teacher')) return false;
  }
  for (let m = start; m < start + t.duration; m++) {
    for (const n of t.needs) {
      const used = placed.filter(s => s.start <= m && s.end > m).reduce((sum, s) => sum + (p.tasks.find(t => t.id === s.taskId).needs.find(x => x.resourceId === n.resourceId)?.quantity || 0), 0);
      if (used + n.quantity > p.resources.find(r => r.id === n.resourceId).quantity) return false;
    }
  }
  return true;
}

export function checkSchedule(p, schedule) {
  const issues = auditResources(p);
  if (issues.length) return issues;
  if (!Array.isArray(schedule) || schedule.length !== p.tasks.length || schedule.some(s => !s || typeof s !== 'object') || new Set(schedule.map(s => s.taskId)).size !== p.tasks.length) return [{ code: 'invalidSchedule', item: '' }];
  const placed = [];
  for (const s of schedule) {
    const t = p.tasks.find(t => t.id === s.taskId);
    if (!t || !integer(s.start, 0, 240) || s.end !== s.start + t.duration || !compatible(p, placed, t, s.start)) issues.push({ code: 'scheduleConflict', item: t?.title || '' });
    if (t) placed.push(s);
  }
  if (issues.length) return issues;
  for (const s of schedule) {
    const t = p.tasks.find(t => t.id === s.taskId);
    if (t.after.some(id => schedule.find(s => s.taskId === id).end > s.start)) issues.push({ code: 'dependencyConflict', item: t.title });
  }
  for (const g of p.groups) {
    const teacher = schedule.filter(s => p.tasks.find(t => t.id === s.taskId).groupId === g.id && p.tasks.find(t => t.id === s.taskId).mode === 'teacher').sort((a, b) => a.start - b.start);
    let end = 0;
    for (const s of teacher) {
      if (s.start - end > g.independentLimit) issues.push({ code: 'attentionGap', item: g.name });
      end = s.end;
    }
    if (p.duration - end > g.independentLimit) issues.push({ code: 'attentionGap', item: g.name });
  }
  return issues;
}

export function solve(p, { fixed = [], notBefore = 0, maxNodes = 12000 } = {}) {
  const issues = auditResources(p);
  if (issues.length) return { status: 'invalid', issues, schedule: [] };
  const teacherTotal = p.tasks.filter(t => t.mode === 'teacher').reduce((n, t) => n + t.duration, 0);
  if (teacherTotal > p.duration) return { status: 'infeasible', issues: [{ code: 'teacherOverload', item: `${teacherTotal} / ${p.duration}` }], schedule: [] };
  for (const g of p.groups) if (p.tasks.filter(t => t.groupId === g.id).reduce((s, t) => s + t.duration, 0) > p.duration) return { status: 'infeasible', issues: [{ code: 'groupOverload', item: g.name }], schedule: [] };
  const placed = [];
  for (const s of fixed) {
    const t = p.tasks.find(t => t.id === s.taskId);
    if (!t || placed.some(x => x.taskId === s.taskId) || !integer(s.start, 0, 240) || s.end !== s.start + t.duration || !compatible(p, placed, t, s.start)) return { status: 'invalid', issues: [{ code: 'scheduleConflict', item: t?.title || '' }], schedule: [] };
    placed.push(s);
  }
  let nodes = 0, answer;
  function search() {
    if (++nodes > maxNodes) return false;
    // Once a group's teacher activities are all placed, later placements cannot
    // repair its attention gaps. Prune before trying independent activities.
    for (const g of p.groups) {
      const teacherTasks = p.tasks.filter(t => t.groupId === g.id && t.mode === 'teacher');
      if (!teacherTasks.every(t => placed.some(s => s.taskId === t.id))) continue;
      const contacts = placed.filter(s => teacherTasks.some(t => t.id === s.taskId)).sort((a, b) => a.start - b.start);
      let end = 0;
      for (const s of contacts) {
        if (s.start - end > g.independentLimit) return false;
        end = s.end;
      }
      if (p.duration - end > g.independentLimit) return false;
    }
    if (placed.length === p.tasks.length) {
      if (checkSchedule(p, placed).length) return false;
      answer = placed.map(s => ({ ...s })).sort((a, b) => a.start - b.start); return true;
    }
    const ready = p.tasks.filter(t => !placed.some(s => s.taskId === t.id) && t.after.every(id => placed.some(s => s.taskId === id)));
    const choices = [];
    for (const t of ready) {
      const earliest = Math.max(notBefore, ...t.after.map(id => placed.find(s => s.taskId === id).end));
      for (let start = earliest; start <= p.duration - t.duration; start++) {
        // A later start can be necessary to keep teacher contact within each
        // group's limit, even when an earlier placement fits the resources.
        if (compatible(p, placed, t, start)) choices.push({ t, start });
      }
    }
    choices.sort((a, b) => a.start - b.start || Number(b.t.mode === 'teacher') - Number(a.t.mode === 'teacher'));
    for (const { t, start } of choices) {
      placed.push({ taskId: t.id, start, end: start + t.duration });
      if (search()) return true;
      placed.pop();
      if (nodes > maxNodes) break;
    }
    return false;
  }
  search();
  return answer ? { status: 'feasible', schedule: answer, issues: [], nodes } : { status: 'unknown', schedule: [], issues: [{ code: 'noPlanFound', item: '' }], nodes };
}

export function replan(p, schedule, taskId, extra) {
  if (checkSchedule(p, schedule).length || !integer(extra, 1, 60)) throw new Error('invalidSchedule');
  const selected = schedule.find(s => s.taskId === taskId);
  if (!selected) throw new Error('invalidTask');
  const project = structuredClone(p);
  project.tasks.find(t => t.id === taskId).duration += extra;
  const fixed = schedule.filter(s => s.start < selected.end).map(s => s.taskId === taskId ? { ...s, end: s.end + extra } : { ...s });
  return { project, result: solve(project, { fixed, notBefore: selected.end }) };
}

export function parseProject(input) {
  const raw = input.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const p = JSON.parse(raw);
  const errors = validateProject(p);
  if (errors.length) throw new Error(errors[0].code);
  // Keep only the public project format; imported credentials/settings are discarded.
  return {
    version: VERSION, title: p.title, duration: p.duration,
    groups: p.groups.map(g => ({ id: g.id, name: g.name, independentLimit: g.independentLimit, canRead: g.canRead })),
    resources: p.resources.map(r => ({ id: r.id, name: r.name, quantity: r.quantity })),
    tasks: p.tasks.map(t => ({ id: t.id, groupId: t.groupId, title: t.title, objective: t.objective, duration: t.duration, mode: t.mode, requiresReading: t.requiresReading, after: [...t.after], needs: t.needs.map(n => ({ resourceId: n.resourceId, quantity: n.quantity })), alternative: t.alternative ? { title: t.alternative.title, rationale: t.alternative.rationale, requiresReading: t.alternative.requiresReading, needs: t.alternative.needs.map(n => ({ resourceId: n.resourceId, quantity: n.quantity })) } : null, ...(t.adaptation?.teacherConfirmed === true && text(t.adaptation.rationale) ? { adaptation: { rationale: t.adaptation.rationale, teacherConfirmed: true } } : {}) }))
  };
}

// Only saved teacher-reviewed courses may retain confirmation metadata. An AI
// draft is still a proposal, even when its response claims teacher approval.
export function parseAssistantProject(input) {
  const project = parseProject(input);
  for (const task of project.tasks) delete task.adaptation;
  return project;
}

// Chat tools may wrap a valid project in an explanation or a code block.
export function parseAssistantReply(input) {
  if (new TextEncoder().encode(input).length > 1000000) throw new Error('tooLarge');
  const projects = [];
  const starts = [];
  let quoted = false, escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (!starts.length) { if (c === '{') starts.push(i); continue; }
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{') {
      if (starts.length >= 128) throw new Error('replyFormat');
      starts.push(i);
    } else if (c === '}') {
      const raw = input.slice(starts.pop(), i + 1);
      // Inspect nested objects too: chat tools can wrap the lesson in a
      // "project" field, or put an unmatched brace in their explanation.
      if (!['"version"', '"groups"', '"resources"', '"tasks"'].every(key => raw.includes(key))) continue;
      try { projects.push(parseAssistantProject(raw)); } catch { /* Only complete, validated projects can be reviewed. */ }
    }
  }
  if (projects.length !== 1) throw new Error(projects.length > 1 ? 'multipleProjects' : 'replyFormat');
  return projects[0];
}
