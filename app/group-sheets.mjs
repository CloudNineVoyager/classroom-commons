import { checkSchedule } from './engine.mjs';
import { languages, translate } from './i18n.mjs';
import { uiTranslate } from './ui-copy.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function groupSheetsHTML(project, schedule, { lang = 'en', paper = 'A4' } = {}) {
  if (checkSchedule(project, schedule).length) throw new Error('groupSheetsNotReady');
  lang = Object.hasOwn(languages, lang) ? lang : 'en';
  paper = paper === 'Letter' ? 'Letter' : 'A4';
  const t = key => translate(lang, key), u = key => uiTranslate(lang, key);
  const n = value => new Intl.NumberFormat(lang).format(value);
  const tasks = new Map(project.tasks.map(task => [task.id, task]));
  const groups = new Map(project.groups.map(group => [group.id, group]));
  const resources = new Map(project.resources.map(resource => [resource.id, resource]));
  const sheets = project.groups.map(group => {
    const slots = schedule.filter(slot => tasks.get(slot.taskId).groupId === group.id).sort((a, b) => a.start - b.start);
    return `<section class="group-sheet"><header><p class="caption">Classroom Commons · ${escape(u('groupSheets'))}</p><p>${escape(project.title)} · ${n(project.duration)} ${escape(t('min'))}</p><h1>${escape(group.name)}</h1><p>${escape(u('groupSheetsTiming'))}</p>${!group.canRead ? `<p class="reading-note">${escape(u('groupSheetsOral'))}</p>` : ''}</header><ol>${slots.map(slot => {
      const task = tasks.get(slot.taskId);
      const materials = task.needs.map(need => `${resources.get(need.resourceId).name} × ${n(need.quantity)}`).join(' · ') || t('none');
      const after = task.after.map(id => `${groups.get(tasks.get(id).groupId).name}: ${tasks.get(id).title}`).join(' · ');
      return `<li><article><div class="activity-heading"><span class="tick" aria-hidden="true"></span><h2>${escape(task.title)}</h2></div><p class="time"><bdi>${n(slot.start)}–${n(slot.end)}</bdi> ${escape(t('min'))} · ${escape(t(task.mode))}</p><p><strong>${escape(t('objective'))}:</strong> ${escape(task.objective)}</p><p><strong>${escape(t('needs'))}:</strong> ${escape(materials)}</p>${after ? `<p><strong>${escape(t('after'))}:</strong> ${escape(after)}</p>` : ''}${task.adaptation ? `<p><strong>${escape(t('adapted'))}:</strong> ${escape(task.adaptation.rationale)}</p>` : ''}</article></li>`;
    }).join('')}</ol><footer>${escape(u('groupSheetsReview'))}</footer></section>`;
  }).join('');
  return `<!doctype html><html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${escape(project.title)} · ${escape(u('groupSheets'))}</title><style>@page{size:${paper};margin:16mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#171717;font:16px/1.65 system-ui,"Microsoft YaHei",sans-serif;overflow-wrap:anywhere}.group-sheet{max-width:800px;margin:40px auto;padding:0 24px}h1{font-size:30px;line-height:1.3;margin:12px 0}h2{font-size:20px;line-height:1.4;margin:0}p{margin:6px 0;white-space:pre-wrap}.caption,footer{font-size:13px}.reading-note{border-inline-start:3px solid #171717;padding-inline-start:12px}ol{padding-inline-start:24px}li{border-top:1px solid #999;padding:18px 0;break-inside:avoid}.activity-heading{display:flex;align-items:baseline;gap:10px}.tick{display:inline-block;border:1px solid #333;width:16px;height:16px;flex:0 0 16px}.time{font-variant-numeric:tabular-nums}footer{border-top:1px solid #999;padding-top:12px;margin-top:12px}@media print{.group-sheet{margin:0;padding:0;break-before:page}.group-sheet:first-child{break-before:auto}h1,h2{break-after:avoid}}@media(max-width:480px){.group-sheet{margin:24px auto;padding:0 16px}h1{font-size:26px}}</style></head><body>${sheets}</body></html>`;
}
