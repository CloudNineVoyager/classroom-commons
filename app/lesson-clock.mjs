export function elapsedSeconds(clock, now) {
  return clock.elapsed + (clock.since == null ? 0 : Math.max(0, now - clock.since) / 1000);
}

export function pauseClock(clock, now) {
  return { elapsed: elapsedSeconds(clock, now), since: null };
}

export function resumeClock(clock, now) {
  return clock.since == null ? { elapsed: clock.elapsed, since: now } : clock;
}

export function clockAtActivity(schedule, taskId) {
  const slot = schedule.find(item => item.taskId === taskId);
  return slot ? { elapsed: slot.start * 60, since: null } : null;
}

export function formatClock(seconds, lang = 'en') {
  const whole = Math.max(0, Math.floor(seconds));
  const digits = new Intl.NumberFormat(lang, { minimumIntegerDigits: 2, useGrouping: false });
  return `${digits.format(Math.floor(whole / 60))}:${digits.format(whole % 60)}`;
}

export function lessonSnapshot(project, schedule, elapsed) {
  const duration = project.duration * 60;
  const seconds = Math.min(Math.max(0, elapsed), duration);
  const slots = [...schedule].sort((a, b) => a.start - b.start || a.end - b.end);
  const groups = project.groups.map(group => {
    const own = slots.filter(slot => project.tasks.find(task => task.id === slot.taskId)?.groupId === group.id);
    const active = own.find(slot => slot.start * 60 <= seconds && seconds < slot.end * 60);
    const next = own.find(slot => slot.start * 60 > seconds);
    return {
      group, active, next,
      task: project.tasks.find(task => task.id === active?.taskId),
      nextTask: project.tasks.find(task => task.id === next?.taskId),
      complete: own.length > 0 && own.every(slot => slot.end * 60 <= seconds),
    };
  });
  const changes = slots.flatMap(slot => [slot.start * 60, slot.end * 60]).filter(time => time > seconds);
  return {
    seconds, remaining: duration - seconds, complete: seconds >= duration,
    groups, teacher: groups.find(item => item.task?.mode === 'teacher'),
    nextChange: changes.length ? Math.min(...changes) - seconds : null,
  };
}
