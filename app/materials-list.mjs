import { checkSchedule } from './engine.mjs';
import { languages, translate } from './i18n.mjs';
import { uiTranslate } from './ui-copy.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function materialRequirements(project, schedule) {
  if (checkSchedule(project, schedule).length) throw new Error('materialsNotReady');
  const tasks = new Map(project.tasks.map(task => [task.id, task]));
  return project.resources.flatMap(resource => {
    const uses = schedule.flatMap(slot => {
      const task = tasks.get(slot.taskId);
      const need = task.needs.find(need => need.resourceId === resource.id);
      return need ? [{ taskId: task.id, groupId: task.groupId, start: slot.start, end: slot.end, quantity: need.quantity }] : [];
    }).sort((a, b) => a.start - b.start || a.end - b.end);
    if (!uses.length) return [];
    const peak = Math.max(...uses.map(use => uses.reduce((sum, other) => sum + (other.start <= use.start && use.start < other.end ? other.quantity : 0), 0)));
    return [{ resourceId: resource.id, peak, available: resource.quantity, uses }];
  });
}

export function materialsListHTML(project, schedule, { lang = 'en', paper = 'A4' } = {}) {
  const rows = materialRequirements(project, schedule);
  lang = Object.hasOwn(languages, lang) ? lang : 'en';
  paper = paper === 'Letter' ? 'Letter' : 'A4';
  const t = key => translate(lang, key), u = key => uiTranslate(lang, key);
  const n = value => new Intl.NumberFormat(lang).format(value);
  const tasks = new Map(project.tasks.map(task => [task.id, task]));
  const groups = new Map(project.groups.map(group => [group.id, group]));
  const resources = new Map(project.resources.map(resource => [resource.id, resource]));
  const content = rows.map(row => `<li><h2><span class="tick" aria-hidden="true"></span>${escape(resources.get(row.resourceId).name)}</h2><p><strong>${escape(u('materialsPeak'))}: ${n(row.peak)}</strong> · ${escape(t('available'))}: ${n(row.available)}</p><ul>${row.uses.map(use => `<li><bdi>${n(use.start)}–${n(use.end)}</bdi> ${escape(t('min'))} · ${escape(groups.get(use.groupId).name)} · ${escape(tasks.get(use.taskId).title)} × ${n(use.quantity)}</li>`).join('')}</ul></li>`).join('');
  return `<!doctype html><html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${escape(project.title)} · ${escape(u('materialsList'))}</title><style>@page{size:${paper};margin:16mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#171717;font:16px/1.65 system-ui,"Microsoft YaHei",sans-serif;overflow-wrap:anywhere}main{max-width:800px;margin:40px auto;padding:0 24px}h1{font-size:30px;line-height:1.3;margin:12px 0}h2{font-size:20px;line-height:1.4;margin:0;display:flex;align-items:baseline;gap:10px}p{margin:8px 0;white-space:pre-wrap}.caption,footer{font-size:13px}ol{list-style:none;padding:0}ol>li{border-top:1px solid #999;padding:18px 0;break-inside:avoid}ul{padding-inline-start:24px}.tick{border:1px solid #333;width:16px;height:16px;flex:0 0 16px}footer{border-top:1px solid #999;padding-top:12px;margin-top:18px}@media print{main{margin:0;padding:0}h1,h2{break-after:avoid}}@media(max-width:480px){main{margin:24px auto;padding:0 16px}h1{font-size:26px}}</style></head><body><main><header><p class="caption">Classroom Commons</p><h1>${escape(u('materialsList'))}</h1><p>${escape(project.title)} · ${n(project.duration)} ${escape(t('min'))}</p><p>${escape(u('materialsTiming'))}</p><p>${escape(u('materialsReuse'))}</p></header>${rows.length ? `<ol>${content}</ol>` : `<p>${escape(u('materialsEmpty'))}</p>`}<footer>${escape(u('materialsReview'))}</footer></main></body></html>`;
}
