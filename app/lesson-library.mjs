import { readCourseFile, writeCourseFile } from './project-file.mjs';

export const LIBRARY_KEY = 'cc-lesson-library';
export const LIBRARY_LIMIT = 20;
export const LIBRARY_BACKUP_LIMIT = 25000000;

export function readLibraryBackup(raw) {
  if (typeof raw !== 'string') throw new Error('libraryBackupInvalid');
  if (new TextEncoder().encode(raw).length > LIBRARY_BACKUP_LIMIT) throw new Error('libraryBackupTooLarge');
  try { return readLessonLibrary(raw.replace(/^\uFEFF/, '')); }
  catch { throw new Error('libraryBackupInvalid'); }
}

export function mergeLessonLibraries(existing, incoming, newId) {
  const current = readLessonLibrary(writeLessonLibrary(existing));
  const source = readLessonLibrary(writeLessonLibrary(incoming));
  const known = new Set(current.map(entry => entry.course));
  const additions = [];
  let skipped = 0;
  for (const entry of source) {
    if (known.has(entry.course)) { skipped++; continue; }
    known.add(entry.course); additions.push(entry);
  }
  if (current.length + additions.length > LIBRARY_LIMIT) throw new Error('libraryFull');
  const lessons = readLessonLibrary(writeLessonLibrary([...additions.map(entry => ({ ...entry, id: newId() })), ...current]));
  return { lessons, added: additions.length, skipped };
}

export function readLessonLibrary(raw) {
  if (raw === null) return [];
  try {
    const value = JSON.parse(raw);
    if (value?.format !== 'classroom-commons-library' || value.version !== 1 || !Array.isArray(value.lessons) || value.lessons.length > LIBRARY_LIMIT) throw new Error();
    const ids = new Set();
    return value.lessons.map(entry => {
      if (typeof entry?.id !== 'string' || !entry.id || entry.id.length > 100 || ids.has(entry.id) || typeof entry.course !== 'string') throw new Error();
      ids.add(entry.id);
      // The course reader strips unknown fields and discards unchecked schedules.
      const loaded = readCourseFile(entry.course);
      return { id: entry.id, course: writeCourseFile(loaded.project, loaded.schedule), needsRecheck: loaded.scheduleDiscarded || entry.needsRecheck === true };
    });
  } catch { throw new Error('libraryUnreadable'); }
}

export function writeLessonLibrary(lessons) {
  const safe = readLessonLibrary(JSON.stringify({ format: 'classroom-commons-library', version: 1, lessons }));
  return JSON.stringify({ format: 'classroom-commons-library', version: 1, lessons: safe });
}

export function addLibraryLesson(lessons, id, project, schedule) {
  if (lessons.length >= LIBRARY_LIMIT) throw new Error('libraryFull');
  return readLessonLibrary(JSON.stringify({ format: 'classroom-commons-library', version: 1, lessons: [{ id, course: writeCourseFile(project, schedule) }, ...lessons] }));
}
