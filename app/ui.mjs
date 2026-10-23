import { createElement as h, createContext, useContext, useRef, useState } from 'react';
import * as Modal from '@radix-ui/react-dialog';
import { Icon } from './icons.mjs';
import logo from './logo.svg';

const Context = createContext(null);
const useUI = () => useContext(Context);

export function Button({ children, icon, action, itemId, variant = 'secondary', className = '', ...props }) {
  const { onAction } = useUI();
  return h('button', { type: 'button', className: `button ${variant} ${className}`, ...(action ? { onClick: () => onAction(action, itemId), 'data-action': action } : {}), ...props }, icon && h(Icon, { name: icon }), children);
}
export function Card({ children, className = '', ...props }) {
  return h('section', { className: `card ${className}`, ...props }, children);
}
export function Field({ label, help, as = 'input', className = '', children, ...props }) {
  const { onField } = useUI();
  return h('label', { className: `field ${className}` }, h('span', { className: 'field-label' }, label),
    h(as, { ...props, value: props.value ?? '', onChange: props.onChange || onField }, children), help && h('small', { className: 'field-help' }, help));
}
function Check({ children, ...props }) {
  const { onField } = useUI();
  return h('label', { className: 'check' }, h('input', { type: 'checkbox', ...props, onChange: props.onChange || onField }), h('span', null, children));
}
function Badge({ children, tone = '', icon }) { return h('span', { className: `badge ${tone}` }, icon && h(Icon, { name: icon, size: 14 }), children); }
function SectionHeading({ title, count, children, help }) {
  return h('div', { className: 'section-heading' }, h('div', null, h('h2', null, title, count != null && h('span', { className: 'count' }, count)), help && h('p', { className: 'muted' }, help)), children);
}
function Issues({ issues }) {
  const { issueText } = useUI();
  return h('ul', { className: 'issues' }, issues.map((issue, i) => h('li', { key: `${issue.taskId || ''}-${issue.code}-${i}` }, issueText(issue))));
}
function Notice({ tone = 'info', children, title }) {
  return h('div', { className: `notice ${tone}`, role: tone === 'warning' ? 'status' : undefined }, h(Icon, { name: tone === 'warning' ? 'warning' : 'shield', size: 19 }), h('div', null, title && h('strong', null, title), children));
}
function PageHeading({ title, description, children }) {
  return h('div', { className: 'page-heading' }, h('div', null, h('h1', null, title), description && h('p', null, description)), children);
}
function AppHeader() {
  const { t, u, tab, lang, languages, onField, onNavigate } = useUI();
  const navLabel = key => lang === 'zh' ? t(key) : u({ overview: 'navClassroom', flow: 'navFlow', fit: 'navMaterials', ai: 'navAssistant' }[key]);
  return h('header', { className: 'app-header' }, h('button', { type: 'button', className: 'brand', onClick: () => onNavigate('home'), 'aria-label': u('home') }, h('img', { src: logo, alt: '' }), h('span', null, h('strong', null, u('brandName')), h('small', null, u('brandCaption')))),
    h('nav', { 'aria-label': u('workspace') }, ['home', 'overview', 'flow', 'fit', 'ai'].map(key => h('button', { type: 'button', className: `nav ${tab === key ? 'active' : ''}`, 'aria-current': tab === key ? 'page' : undefined, key, onClick: () => onNavigate(key) }, h('span', null, key === 'home' ? u('home') : navLabel(key))))),
    h('div', { className: 'header-tools' }, h('span', { className: 'header-free' }, h(Icon, { name: 'shield', size: 13 }), u('localWork')),
      h('label', { className: 'language-field' }, h('span', { className: 'sr-only' }, 'Language'), h('select', { id: 'language', value: lang, 'aria-label': 'Language', onChange: onField }, Object.entries(languages).map(([key, name]) => h('option', { key, value: key }, name))))));
}
function Topbar() {
  const { project, u, saveState, bridgeReady, hostLoading } = useUI();
  return h('header', { className: 'topbar' }, h('div', { className: 'top-course' }, h('span', { className: 'overline' }, u('course')), h('strong', null, project.title || u('untitled'))),
    h('div', { className: 'top-actions' }, h('span', { className: `save-state ${saveState}`, role: 'status' }, h(Icon, { name: saveState === 'saving' ? 'working' : saveState === 'saveError' ? 'warning' : 'save', size: 15 }), hostLoading ? u('loading') : u(saveState))),
    h('span', { className: 'connection-label sr-only' }, bridgeReady ? u('connected') : u('offline')));
}
function HomePortal() {
  const { project: p, t, u, n, onNavigate, problems, saveState, hostLoading } = useUI();
  const items = [
    { id: 'overview', title: t('overview'), help: u('homeClassroomHelp'), detail: `${n(p.groups.length)} ${t('groups')}` },
    { id: 'flow', title: t('flow'), help: u('homeFlowHelp'), detail: `${n(p.tasks.length)} ${t('tasks')}` },
    { id: 'fit', title: t('fit'), help: u('homeFitHelp'), detail: problems.length ? `${n(problems.length)} ${u('gaps')}` : u('complete') },
    { id: 'ai', title: t('ai'), help: u('homeAIHelp'), detail: u('portalAI') },
  ];
  return h('div', { className: 'home-portal' },
    h('div', { className: 'portal-hero' },
      h('div', { className: 'portal-intro' }, h('p', { className: 'portal-eyebrow' }, u('homeKicker')),
        h('h1', null, h('span', null, u('heroFirst')), h('span', null, u('heroSecond'))), h('p', null, u('heroDescription')),
        h('div', { className: 'portal-actions' }, h(Button, { variant: 'primary', icon: 'next', onClick: () => onNavigate('overview') }, u('homeStart')), h(Button, { action: 'open', icon: 'open', variant: 'ghost' }, u('homeOpen'))),
        h('p', { className: 'portal-reassurance' }, h(Icon, { name: 'shield', size: 14 }), t('noAI'))),
      h(Card, { className: 'lesson-preview' },
        h('div', { className: 'preview-topline' }, h('span', null, u('courseResume')), h('span', { className: 'preview-time' }, h(Icon, { name: 'clock', size: 14 }), `${p.duration == null ? '—' : n(p.duration)} ${t('min')}`)),
        h('h2', null, p.title || u('untitled')),
        h('div', { className: 'preview-groups' }, p.groups.slice(0, 3).map((group, i) => {
          const activities = p.tasks.filter(task => task.groupId === group.id);
          return h('div', { key: group.id, className: 'preview-group' }, h('span', { className: `preview-mark color-${i}` }, String.fromCharCode(65 + i)),
            h('div', { className: 'preview-group-copy' }, h('strong', null, group.name || u('untitled')), h('p', null, activities[0]?.title || u('noActivities'))),
            h('span', { className: 'preview-count' }, `${n(activities.length)} ${t('tasks')}`));
        })),
        h('div', { className: 'preview-footer' }, h('span', null, h(Icon, { name: 'book', size: 15 }), `${n(p.groups.length)} ${t('groups')} · ${n(p.tasks.length)} ${t('tasks')}`), h(Button, { onClick: () => onNavigate('overview'), icon: 'next', variant: 'ghost' }, u('homeEdit'))))),
    h('div', { className: 'portal-section-title' }, h('h2', null, u('homeTools')), h('span', null, u('homeToolsHint'))),
    h('div', { className: 'portal-modules' }, items.map((item, i) => h('button', { key: item.id, type: 'button', className: `module-entry module-${item.id}`, onClick: () => onNavigate(item.id) },
      h('span', { className: 'module-number', 'aria-hidden': true }, `0${i + 1}`), h('span', { className: 'module-text' }, h('strong', null, item.title), h('small', null, item.help)), h('span', { className: 'module-meta' }, item.detail), h(Icon, { name: 'next', className: 'module-arrow', size: 16 })))),
    h('div', { className: 'portal-bottom' }, h('span', { className: `save-state ${saveState}`, role: 'status' }, h(Icon, { name: 'save', size: 13 }), hostLoading ? u('loading') : u(saveState)),
      h('div', { className: 'portal-file-actions' }, h(Button, { action: 'new', variant: 'ghost', icon: 'new' }, u('homeNew')), h(Button, { action: 'sample', variant: 'ghost', icon: 'sample' }, t('sample')), h(Button, { action: 'export', variant: 'ghost', icon: 'export' }, t('export')))));
}
function Toolbar() {
  const { t, u, paper, onField } = useUI();
  return h('div', { className: 'toolbar', role: 'toolbar', 'aria-label': u('openMenu') },
    h(Button, { action: 'new', icon: 'new' }, u('newCourse')), h(Button, { action: 'open', icon: 'open' }, t('import')), h(Button, { action: 'export', icon: 'export' }, t('export')),
    h(Button, { action: 'sample', icon: 'sample', variant: 'ghost' }, t('sample')),
    h('span', { className: 'toolbar-spacer' }), h(Button, { action: 'portable', icon: 'portable' }, t('portable')),
    h('div', { className: 'print-tools', role: 'group', 'aria-label': t('print') },
      h('select', { id: 'paper', value: paper, 'aria-label': t('paper'), onChange: onField }, ['A4', 'Letter'].map(value => h('option', { value, key: value }, value))),
      h(Button, { action: 'print', icon: 'print' }, t('print'))));
}
function Progress() {
  const { project, schedule, problems, validation, u, onNavigate } = useUI();
  const whole = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const classroomReady = Boolean(project.title.trim()) && whole(project.duration, 5, 240)
    && project.groups.every(g => g.name.trim() && whole(g.independentLimit, 1, 240))
    && project.resources.every(r => r.name.trim() && whole(r.quantity, 0, 100000));
  const done = [classroomReady, project.tasks.length > 0 && !validation.length, project.tasks.length > 0 && !problems.length, schedule.length > 0];
  return h('ol', { className: 'progress', 'aria-label': u('steps') }, ['overview', 'flow', 'fit', 'flow'].map((tab, i) => h('li', { className: done[i] ? 'done' : '', key: i }, h('button', { type: 'button', onClick: () => onNavigate(tab) }, h('span', { className: 'step-number' }, done[i] ? h(Icon, { name: 'check', size: 15 }) : i + 1), h('span', null, h('b', null, u(`step${i + 1}`)), h('small', null, u(done[i] ? 'complete' : 'pending')))))));
}
function Overview() {
  const { project: p, t, u, n, onNavigate, validation } = useUI();
  const attrs = (kind, id, field) => ({ 'data-kind': kind, 'data-id': id, 'data-field': field });
  return h('div', null,
    h(PageHeading, { title: u('startHere'), description: u('overviewHelp') }), h(Progress),
    h('div', { className: 'overview-grid' }, h('div', { className: 'editor-column' },
      h(Card, null, h(SectionHeading, { title: t('lesson') }), h('div', { className: 'lesson-form' }, h(Field, { label: t('title'), id: 'lesson-title', value: p.title, maxLength: 200 }), h(Field, { label: `${t('duration')} · ${t('min')}`, id: 'duration', value: p.duration, type: 'number', min: 5, max: 240 }))),
      h(SectionHeading, { title: t('groups'), count: n(p.groups.length) }, h(Button, { action: 'add-group', icon: 'plus', disabled: p.groups.length >= 6 }, t('addGroup'))),
      h('div', { className: 'group-grid' }, p.groups.map((g, i) => h(Card, { key: g.id, className: 'group-card' },
        h('div', { className: 'card-head' }, h('span', { className: `group-mark color-${i % 4}` }, String.fromCharCode(65 + i)), h(Button, { action: 'remove-group', itemId: g.id, icon: 'remove', variant: 'icon-only', 'aria-label': `${t('remove')} · ${g.name}` })),
        h(Field, { label: t('groupName'), value: g.name, maxLength: 100, ...attrs('group', g.id, 'name') }),
        h(Field, { label: `${t('limit')} · ${t('min')}`, value: g.independentLimit, type: 'number', min: 1, max: 240, help: t('limitHelp'), ...attrs('group', g.id, 'independentLimit') }),
        h(Check, { checked: g.canRead, ...attrs('group', g.id, 'canRead') }, t('read'))))),
      h(SectionHeading, { title: t('inventory'), help: t('inventoryHelp') }, h(Button, { action: 'add-resource', icon: 'plus', disabled: p.resources.length >= 30 }, t('addResource'))),
      h(Card, { className: 'inventory' }, p.resources.length ? p.resources.map(r => h('div', { className: 'resource-row', key: r.id }, h(Field, { label: t('resourceName'), value: r.name, maxLength: 100, ...attrs('resource', r.id, 'name') }), h(Field, { label: t('quantity'), value: r.quantity, type: 'number', min: 0, max: 100000, ...attrs('resource', r.id, 'quantity') }), h(Button, { action: 'remove-resource', itemId: r.id, icon: 'remove', variant: 'icon-only', 'aria-label': `${t('remove')} · ${r.name}` }))) : h('p', { className: 'empty-copy' }, u('emptyResources'))),
      h('div', { className: 'bottom-cta' }, h('span', { className: 'muted' }, t('noAI')), h(Button, { icon: 'next', variant: 'primary', onClick: () => onNavigate('flow') }, `${u('next')} · ${t('tasks')}`))),
      h('aside', { className: 'context-column' }, h(Summary), validation.length > 0 && h(Notice, { tone: 'warning', title: u('attention') }, h(Issues, { issues: validation.slice(0, 5) })),
        h(Card, { className: 'support-card' }, h(Icon, { name: 'ai', size: 22 }), h('h3', null, u('optionalAI')), h('p', null, t('aiSub')), h(Button, { onClick: () => onNavigate('ai') }, t('ai'))))));
}
function Summary() {
  const { project: p, problems, t, u, n } = useUI();
  const items = [{ icon: 'groups', value: p.groups.length, label: t('groups') }, { icon: 'clock', value: p.duration ?? '—', label: t('min') }, { icon: 'tasks', value: p.tasks.length, label: t('tasks') }, { icon: 'warning', value: problems.length, label: u('gaps') }];
  return h(Card, { className: 'summary-card' }, h('h2', null, u('summary')), h('div', { className: 'summary-metrics' }, items.map(item => h('div', { key: item.label }, h(Icon, { name: item.icon, size: 17 }), h('strong', null, typeof item.value === 'number' ? n(item.value) : item.value), h('span', null, item.label)))), h('div', { className: 'summary-footer' }, h(Icon, { name: 'shield', size: 15 }), u('support')));
}
function Tasks() {
  const { project: p, t, n } = useUI();
  const attrs = (activity, field) => ({ 'data-kind': 'task', 'data-id': activity.id, 'data-field': field });
  return h('div', { className: 'task-grid' }, p.tasks.map((a, i) => h(Card, { key: a.id, className: 'task-card' },
    h('div', { className: 'task-top' }, h('span', { className: 'task-number' }, n(i + 1)), h(Field, { label: t('activity'), value: a.title, maxLength: 200, className: 'task-title', ...attrs(a, 'title') }), h(Button, { action: 'remove-task', itemId: a.id, icon: 'remove', variant: 'icon-only', 'aria-label': `${t('remove')} · ${a.title}` })),
    h('div', { className: 'task-controls' }, h(Field, { label: t('group'), as: 'select', value: a.groupId, ...attrs(a, 'groupId') }, p.groups.map(g => h('option', { value: g.id, key: g.id }, g.name))),
      h(Field, { label: t('mode'), as: 'select', value: a.mode, ...attrs(a, 'mode') }, ['teacher', 'independent'].map(mode => h('option', { value: mode, key: mode }, t(mode)))),
      h(Field, { label: t('minutes'), value: a.duration, type: 'number', min: 1, max: 240, ...attrs(a, 'duration') })),
    h('details', null, h('summary', null, t('details')),
      h(Field, { label: t('objective'), as: 'textarea', rows: 2, value: a.objective, maxLength: 2000, ...attrs(a, 'objective') }),
      h(Check, { checked: a.requiresReading, ...attrs(a, 'requiresReading') }, t('reading')),
      h('p', { className: 'mini-label' }, t('needs')), h('div', { className: 'needs-grid' }, p.resources.length ? p.resources.map(r => { const need = a.needs.find(x => x.resourceId === r.id); return h(Field, { key: r.id, label: r.name, value: need ? need.quantity : 0, type: 'number', min: 0, max: 100000, 'data-need': r.id, 'data-task': a.id }); }) : h('small', null, t('none'))),
      h('p', { className: 'mini-label' }, t('after')), h('div', { className: 'dependencies' }, p.tasks.filter(other => other.id !== a.id).map(other => h(Check, { key: other.id, 'data-after': other.id, 'data-task': a.id, checked: a.after.includes(other.id) }, other.title)))))));
}
function ActivityDetails({ activity, slot, project, open, onOpenChange, trigger }) {
  const { t, u, n } = useUI();
  const heading = useRef(null);
  if (!activity || !slot) return null;
  const group = project.groups.find(g => g.id === activity.groupId);
  const facts = [
    [u('scheduledTime'), h('span', null, h('bdi', { dir: 'ltr' }, `${n(slot.start)}–${n(slot.end)}`), ` ${t('min')}`)],
    [t('group'), group?.name || activity.groupId],
    [t('mode'), t(activity.mode)],
    [t('minutes'), `${n(activity.duration)} ${t('min')}`],
  ];
  return h(Modal.Root, { open, onOpenChange }, h(Modal.Portal, null,
    h(Modal.Overlay, { className: 'dialog-overlay' }),
    h(Modal.Content, {
      className: 'dialog-content activity-dialog',
      onOpenAutoFocus: event => { event.preventDefault(); heading.current?.focus({ preventScroll: true }); },
      onCloseAutoFocus: event => { event.preventDefault(); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); },
    }, h('span', { className: 'overline' }, u('activityDetails')),
    h(Modal.Title, { ref: heading, tabIndex: -1, className: 'dialog-title' }, activity.title),
    h(Modal.Description, { className: 'dialog-description' }, u('activityReadOnly')),
    h('dl', { className: 'activity-facts' }, facts.map(([label, value]) => h('div', { key: label }, h('dt', null, label), h('dd', null, value)))),
    h('section', { className: 'activity-detail-section' }, h('h3', null, t('objective')), h('p', null, activity.objective)),
    h('section', { className: 'activity-detail-section' }, h('h3', null, t('needs')),
      activity.needs.length ? h('ul', { className: 'activity-materials' }, activity.needs.map(need => h('li', { key: need.resourceId }, `${project.resources.find(r => r.id === need.resourceId)?.name || need.resourceId} × ${n(need.quantity)}`))) : h('p', null, t('none'))),
    h('section', { className: 'activity-detail-section' }, h('h3', null, t('after')),
      activity.after.length ? h('ul', null, activity.after.map(taskId => h('li', { key: taskId }, project.tasks.find(a => a.id === taskId)?.title || taskId))) : h('p', null, t('none'))),
    activity.adaptation && h('section', { className: 'activity-detail-section' }, h('h3', null, t('adapted')), h('p', null, activity.adaptation.rationale)),
    h('div', { className: 'activity-dialog-actions' }, h(Button, { onClick: () => onOpenChange(false) }, u('close'))),
    h(Modal.Close, { className: 'dialog-close', 'aria-label': u('close') }, h(Icon, { name: 'close' })))));
}
function Timeline() {
  const { project: p, schedule, t, u, n } = useUI();
  const [selectedId, setSelectedId] = useState(null), [detailsOpen, setDetailsOpen] = useState(false);
  const trigger = useRef(null);
  if (!schedule.length) return h('div', { className: 'empty-plan' }, h(Icon, { name: 'flow', size: 30 }), h('p', null, t('noTimeline')));
  const selectedActivity = p.tasks.find(a => a.id === selectedId), selectedSlot = schedule.find(s => s.taskId === selectedId);
  const showDetails = (event, taskId) => { trigger.current = event.currentTarget; setSelectedId(taskId); setDetailsOpen(true); };
  const labelFor = (slot, activity) => `${p.groups.find(g => g.id === activity.groupId)?.name} · ${activity.title} · ${t(activity.mode)} · ${n(slot.start)}–${n(slot.end)} ${t('min')}`;
  const ticks = Array.from({ length: Math.ceil(p.duration / 10) + 1 }, (_, i) => Math.min(i * 10, p.duration));
  return h('div', null,
    h('p', { className: 'timeline-instruction' }, u('timelineOpen')),
    h('div', { className: 'timeline-scroll', tabIndex: 0, 'aria-label': t('timeline') },
      h('div', { className: 'timeline-axis' }, h('span', null, t('group')), h('div', null, ticks.map(m => h('b', { key: m, style: { insetInlineStart: `${m / p.duration * 100}%` } }, n(m))))),
      p.groups.map((g, i) => h('div', { key: g.id, className: 'timeline-row' }, h('strong', null, g.name), h('div', { className: 'track' }, schedule.filter(s => p.tasks.find(a => a.id === s.taskId)?.groupId === g.id).map(s => {
        const a = p.tasks.find(a => a.id === s.taskId), label = labelFor(s, a);
        return h('button', { type: 'button', key: s.taskId, className: `block color-${i % 4} ${a.mode}`, title: label, 'aria-label': `${u('activityDetails')}: ${label}`, 'aria-haspopup': 'dialog', onClick: event => showDetails(event, s.taskId), style: { insetInlineStart: `${s.start / p.duration * 100}%`, width: `${(s.end - s.start) / p.duration * 100}%` } }, h('span', null, a.title), h('small', { dir: 'ltr' }, `${n(s.start)}–${n(s.end)}`));
      }))))),
    h('div', { className: 'legend' }, ['teacher', 'independent'].map(mode => h('span', { key: mode }, h('i', { className: mode }), t(mode)))),
    h('details', { className: 'timeline-list' }, h('summary', null, u('activityList')), h('div', { className: 'agenda' }, [...schedule].sort((a, b) => a.start - b.start || a.end - b.end).map(slot => {
      const activity = p.tasks.find(a => a.id === slot.taskId);
      return h('button', { key: slot.taskId, type: 'button', className: 'agenda-item', onClick: event => showDetails(event, slot.taskId), 'aria-label': `${u('activityDetails')}: ${labelFor(slot, activity)}`, 'aria-haspopup': 'dialog' },
        h('span', { className: 'agenda-time', dir: 'ltr' }, `${n(slot.start)}–${n(slot.end)}`), h('span', { className: 'agenda-copy' }, h('strong', null, activity.title), h('small', null, `${p.groups.find(g => g.id === activity.groupId)?.name} · ${t(activity.mode)}`)), h(Icon, { name: 'chevron', size: 18 }));
    }))),
    h(ActivityDetails, { activity: selectedActivity, slot: selectedSlot, project: p, open: detailsOpen, onOpenChange: setDetailsOpen, trigger: trigger.current }));
}
function Flow() {
  const { project: p, schedule, result, workerBusy, problems, t, u, n, onNavigate, delayTask, delayMinutes, onField } = useUI();
  return h('div', null, h(PageHeading, { title: t('timeline'), description: t('timelineHelp') }),
    h(Card, { className: 'plan-card' }, h('div', { className: 'plan-heading' }, h('div', null, h('h2', null, t('flow')), h(Badge, { tone: schedule.length ? 'success' : '', icon: schedule.length ? 'check' : 'clock' }, schedule.length ? t('feasible') : u('pending'))), h(Button, { action: 'solve', variant: 'primary', icon: workerBusy ? 'working' : 'flow', disabled: workerBusy }, workerBusy ? t('working') : t('plan'))),
      result && result.status !== 'feasible' && h(Notice, { tone: 'warning', title: result.retained ? u('planRetained') : t(result.status) }, result.retained && h('p', null, t(result.status)), h(Issues, { issues: result.issues || [] })), h(Timeline), h('p', { className: 'footnote muted' }, t('statusHelp'))),
    problems.length > 0 && h(Notice, { tone: 'warning', title: `${t('issues')} · ${n(problems.length)}` }, h(Issues, { issues: problems }), h(Button, { onClick: () => onNavigate('fit'), icon: 'next' }, t('fit'))),
    schedule.length > 0 && h(Card, { className: 'delay-card' }, h('div', null, h('h3', null, t('delay')), h('p', { className: 'muted' }, t('delayHelp'))), h('div', { className: 'delay-controls' }, h(Field, { label: t('activity'), as: 'select', id: 'delay-task', value: delayTask || schedule[0]?.taskId, onChange: onField }, schedule.map(s => h('option', { key: s.taskId, value: s.taskId }, `${n(s.start)} · ${p.tasks.find(a => a.id === s.taskId)?.title}`))), h(Field, { label: t('extra'), id: 'delay-minutes', type: 'number', min: 1, max: 60, value: delayMinutes }), h(Button, { action: 'delay', disabled: workerBusy, icon: 'sample' }, t('replan')))),
    h(SectionHeading, { title: t('tasks'), count: n(p.tasks.length) }, h(Button, { action: 'add-task', icon: 'plus', disabled: p.tasks.length >= 24 }, t('addTask'))),
    p.tasks.length ? h(Tasks) : h(Card, { className: 'empty-state' }, h(Icon, { name: 'tasks', size: 28 }), h('h3', null, u('noActivities')), h('p', null, u('emptyTasks')), h('div', { className: 'button-row' }, h(Button, { action: 'add-task', icon: 'plus', variant: 'primary' }, t('addTask')), h(Button, { onClick: () => onNavigate('ai'), icon: 'ai' }, t('ai')))));
}
function MaterialTags({ needs, project, compare = false }) {
  const { n, u } = useUI();
  return h('div', { className: 'resource-tags' }, needs.length ? needs.map((need, i) => {
    const resource = project.resources.find(r => r.id === need.resourceId);
    const available = resource?.quantity;
    return h('span', { className: `pill ${compare && typeof available === 'number' && need.quantity > available ? 'short' : ''}`, key: `${need.resourceId}-${i}` }, resource?.name || need.resourceId, ' · ', need.quantity == null ? '—' : n(need.quantity), compare && ` / ${available == null ? '—' : n(available)}`);
  }) : h('small', { className: 'muted' }, u('noNeeds')));
}
function Fit() {
  const { project: p, problems, t, u, n, onNavigate, confirmations, onConfirmAlternative } = useUI();
  const activities = [...p.tasks].sort((a, b) => Number(problems.some(issue => issue.taskId === b.id)) - Number(problems.some(issue => issue.taskId === a.id)));
  return h('div', null, h(PageHeading, { title: t('fitTitle'), description: t('fitSub') }), h(Notice, { tone: problems.length ? 'warning' : 'good', title: problems.length ? `${n(problems.length)} ${t('issues')}` : t('ready') }, problems.length > 0 && h(Issues, { issues: problems })),
    h('div', { className: 'fit-list' }, activities.map(a => {
      const issues = problems.filter(issue => issue.taskId === a.id);
      return h(Card, { className: `fit-card ${!a.alternative && !issues.length ? 'fit-card-simple' : ''}`, key: a.id }, h('div', { className: 'fit-original' }, h('span', { className: 'mini-label' }, t('original')), h('h3', null, a.title), h('p', null, h('b', null, `${t('objective')} · `), a.objective), h(MaterialTags, { needs: a.needs, project: p, compare: true }), issues.length ? h(Issues, { issues }) : h(Badge, { tone: 'success', icon: 'check' }, u('complete')), a.adaptation && h('p', { className: 'muted' }, `${t('adapted')} · ${a.adaptation.rationale}`)),
        (a.alternative || issues.length > 0) && h('div', { className: 'fit-alternative' }, a.alternative ? h('div', null, h('span', { className: 'mini-label' }, t('alternative')), h('h3', null, a.alternative.title), h('p', null, a.alternative.rationale), h(MaterialTags, { needs: a.alternative.needs, project: p }), h(Check, { checked: Boolean(confirmations[a.id]), onChange: event => onConfirmAlternative(a.id, event.target.checked) }, t('confirm')), h(Button, { action: 'adopt', itemId: a.id, variant: 'primary', icon: 'check' }, t('adopt'))) : h('div', null, h(Icon, { name: 'warning', size: 24 }), h('p', { className: 'muted' }, t('needsAlternative')), h(Button, { onClick: () => onNavigate('flow') }, t('tasks')))));
    })));
}
function DraftReview() {
  const { project: p, draft, t, u, n, draftProblems, draftConfirmed, onDraftConfirmed } = useUI();
  if (!draft) return null;
  const resourceIds = new Set([...p.resources.map(r => r.id), ...draft.resources.map(r => r.id)]);
  const differences = [...resourceIds].flatMap(id => {
    const before = p.resources.find(r => r.id === id), after = draft.resources.find(r => r.id === id);
    return before?.name === after?.name && before?.quantity === after?.quantity ? [] : [{ id, before, after }];
  });
  return h(Card, { className: 'draft-card', id: 'draft-review' }, h('div', { className: 'card-head' }, h('div', null, h(Badge, { icon: 'ai' }, t('reviewDraft')), h('h2', null, draft.title)), h('span', { className: 'draft-duration' }, `${n(draft.duration)} ${t('min')}`)), h('p', { className: 'muted' }, u('draftSafe')),
    h('h3', null, u('reviewGroups')), h('div', { className: 'draft-groups' }, draft.groups.map(g => h('div', { key: g.id }, h('strong', null, g.name), h('small', null, `${t('limit')} · ${n(g.independentLimit)} ${t('min')}`), h('small', null, u(g.canRead ? 'readsYes' : 'readsNo'))))),
    h('h3', null, u('resourceChanges')), differences.length ? h('div', { className: 'difference-list' }, differences.map(change => h('div', { key: change.id }, h('strong', null, change.after?.name || change.before?.name), h('span', null, `${u('before')}: ${change.before ? `${change.before.name} × ${n(change.before.quantity)}` : '—'} → ${u('after')}: ${change.after ? `${change.after.name} × ${n(change.after.quantity)}` : '—'}`)))) : h('p', { className: 'muted' }, u('noResourceChanges')),
    h('h3', null, u('reviewActivities')), h('div', { className: 'draft-activities' }, draft.tasks.map(a => h('article', { key: a.id }, h('div', { className: 'draft-task-meta' }, h('span', null, draft.groups.find(g => g.id === a.groupId)?.name), h('span', null, `${n(a.duration)} ${t('min')} · ${t(a.mode)}`)), h('strong', null, a.title), h('p', null, `${t('objective')}: ${a.objective}`), h(MaterialTags, { needs: a.needs, project: draft }), a.alternative && h('p', { className: 'draft-alternative' }, h('b', null, `${t('alternative')}: `), `${a.alternative.title} · ${a.alternative.rationale}`)))),
    draftProblems.length > 0 && h(Notice, { tone: 'warning', title: t('issues') }, h(Issues, { issues: draftProblems })),
    h('div', { className: 'review-actions' }, h(Check, { checked: draftConfirmed, onChange: event => onDraftConfirmed(event.target.checked) }, u('reviewCheck')), h(Button, { action: 'apply-draft', variant: 'primary', icon: 'check', disabled: !draftConfirmed }, t('apply'))));
}
function AI() {
  const { t, u, lang, languages, bridgeReady, busy, notes, rawDraft, pendingId, replyError, makePrompt, aiSaveState } = useUI();
  return h('div', null, h(PageHeading, { title: t('aiTitle'), description: t('aiSub') }), h(Notice, { tone: 'good', title: bridgeReady ? t('hostConnected') : t('manualMode') }, h('p', null, bridgeReady ? t('hostHelp') : t('manualHelp'))),
    h('div', { className: 'ai-layout' }, h('div', null, h(Card, { className: 'prompt-card' },
      h('div', { className: 'ai-step' }, h('span', { className: 'step-number' }, '1'), h('h2', null, t('chatStep1'))),
      h(Field, { label: t('notes'), as: 'textarea', id: 'notes', rows: 5, value: notes, placeholder: t('notesHint'), maxLength: 20000, help: u('notesLimit') }), h('p', { className: 'muted' }, `${t('outputLanguage')}: ${languages[lang]}`),
      h('div', { className: 'ai-step' }, h('span', { className: 'step-number' }, '2'), h('h2', null, t('chatStep2'))),
      h('div', { className: 'button-row' }, bridgeReady && h(Button, { action: 'draft', variant: 'primary', icon: 'ai', disabled: busy }, t('draft')), bridgeReady && h(Button, { action: 'refresh-reply', icon: 'sample' }, t('refreshReply')), h(Button, { action: 'copy-prompt', variant: bridgeReady ? 'secondary' : 'primary', icon: 'copy' }, t('copyPrompt')), h('a', { className: 'button secondary', href: 'https://www.doubao.com/chat/', target: '_blank', rel: 'noopener noreferrer' }, t('openDoubao'))), h('p', { className: 'muted' }, t('freeChatHelp')),
      pendingId && h(Notice, { tone: 'warning' }, t('returnToHost')),
      h('details', null, h('summary', null, t('copyText')), h('textarea', { id: 'copyable', rows: 7, readOnly: true, value: makePrompt(), 'aria-label': t('copyText') })),
      h('div', { className: 'ai-step' }, h('span', { className: 'step-number' }, '3'), h('h2', null, t('chatStep3'))),
      h(Field, { label: t('paste'), as: 'textarea', id: 'raw-draft', rows: 7, value: rawDraft, spellCheck: false, dir: 'auto', help: u('replyLimit') }),
      h('div', { className: 'button-row' }, h(Button, { action: 'parse-draft', icon: 'check' }, t('importDraft')), (notes || rawDraft) && h('small', { className: aiSaveState === 'failed' ? 'text-warning' : 'muted', role: 'status' }, u(aiSaveState === 'failed' ? 'aiUnsaved' : 'aiLocal'))),
      replyError && h(Notice, { tone: 'warning', title: t(replyError) }, h(Button, { action: 'copy-repair', icon: 'copy' }, t('copyRepair')))), h(DraftReview), h(AdvancedAPI)),
      h('aside', { className: 'context-column' }, h(Summary), h(Card, { className: 'support-card' }, h(Icon, { name: 'shield', size: 24 }), h('h3', null, u('draftSafe')), h('p', null, t('draftHelp')), h('small', null, u('notesLimit'))))));
}
function AdvancedAPI() {
  const { u, apiEnabled = false, apiUrl = '', apiModel = '', apiKey = '', apiBusy = false, apiError = '', onApiField } = useUI();
  return h('details', { className: 'advanced-options' },
    h('summary', null, h('span', { className: 'advanced-summary' }, h(Icon, { name: 'settings', size: 16 }), u('apiAdvanced'))),
    h('div', { className: 'advanced-content' },
      h(Check, { id: 'api-enabled', checked: apiEnabled, onChange: onApiField }, u('apiEnable')),
      apiEnabled && h('div', { className: 'api-fields' },
        h('p', { className: 'field-help' }, u('apiHelp')),
        h(Field, { label: u('apiUrl'), id: 'api-url', type: 'url', value: apiUrl, onChange: onApiField, disabled: apiBusy, dir: 'ltr', autoComplete: 'off', spellCheck: false, maxLength: 2000, placeholder: 'https://your-service.example/v1/chat/completions' }),
        h(Field, { label: u('apiModel'), id: 'api-model', value: apiModel, onChange: onApiField, disabled: apiBusy, dir: 'ltr', autoComplete: 'off', spellCheck: false, maxLength: 200 }),
        h(Field, { label: u('apiKey'), id: 'api-key', type: 'password', value: apiKey, onChange: onApiField, disabled: apiBusy, dir: 'ltr', autoComplete: 'off', maxLength: 4096 }),
        h('div', { className: 'button-row' }, h(Button, { action: 'api-draft', disabled: apiBusy, icon: apiBusy ? 'working' : 'ai' }, u(apiBusy ? 'apiSending' : 'apiDraft')), apiBusy && h(Button, { action: 'api-cancel' }, u('apiCancel'))),
        apiError && h('p', { className: 'api-error', role: 'alert' }, u(apiError)))));
}
export function Dialog() {
  const { dialog, u, project, closeDialog, confirmDialog } = useUI();
  const cancelRef = useRef(null), returnFocus = useRef(null);
  if (dialog) returnFocus.current = dialog.returnFocus;
  return h(Modal.Root, { open: Boolean(dialog), onOpenChange: open => { if (!open) closeDialog(); } }, h(Modal.Portal, null, h(Modal.Overlay, { className: 'dialog-overlay' }), h(Modal.Content, { className: 'dialog-content', onOpenAutoFocus: event => { event.preventDefault(); cancelRef.current?.focus(); }, onCloseAutoFocus: event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); } },
    h(Modal.Title, { className: 'dialog-title' }, u('confirmTitle')), h(Modal.Description, { className: 'dialog-description' }, u('confirmBody')),
    h('div', { className: 'replace-comparison' }, h('div', null, h('small', null, u('current')), h('strong', null, project.title || u('untitled'))), h(Icon, { name: 'next' }), h('div', null, h('small', null, u('incoming')), h('strong', null, dialog?.title || u('untitled')))),
    h('div', { className: 'dialog-actions' }, h(Button, { action: 'export', icon: 'export', variant: 'ghost' }, u('backup')), h('div', { className: 'button-row' }, h(Button, { onClick: closeDialog, ref: cancelRef }, u('cancel')), h(Button, { onClick: confirmDialog, variant: 'primary' }, u('replace')))),
    h(Modal.Close, { className: 'dialog-close', 'aria-label': u('close') }, h(Icon, { name: 'close' })))));
}
export function Workbench(props) {
  const { t, u, tab, hostLoading, onFile } = props;
  return h(Context.Provider, { value: props }, h('div', { className: `app-shell ${tab === 'home' ? 'is-home' : ''}` }, h('a', { className: 'skip-link', href: '#main-content', onClick: event => { event.preventDefault(); const main = document.querySelector('#main-content'); main.focus({ preventScroll: true }); main.scrollIntoView({ block: 'start' }); } }, u('workspace')), h(AppHeader), h('div', { className: 'workspace' }, tab !== 'home' && h(Topbar), h('main', { id: 'main-content', tabIndex: -1, className: tab === 'home' ? 'home-main' : '' }, h('fieldset', { disabled: hostLoading, className: 'workbench-fieldset', 'aria-busy': hostLoading }, tab !== 'home' && h(Toolbar), h(({ home: HomePortal, overview: Overview, flow: Flow, fit: Fit, ai: AI })[tab]))), h('footer', null, h('span', null, 'Classroom Commons · v0.6.0'), h('span', null, t('free')))), h('input', { id: 'file-input', type: 'file', accept: '.json,application/json', hidden: true, onChange: onFile }), h(Dialog)));
}
