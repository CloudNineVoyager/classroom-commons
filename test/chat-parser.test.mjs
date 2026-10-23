import test from 'node:test';
import assert from 'node:assert/strict';
import { demo } from '../app/demo.mjs';
import { adoptAlternative, parseProject, parseAssistantProject, parseAssistantReply } from '../app/engine.mjs';
import { writeCourseFile, readCourseFile } from '../app/project-file.mjs';

test('AI drafts cannot assert teacher confirmation through pasted or host responses', () => {
  const project = adoptAlternative(demo(), 'b2', true);
  const input = JSON.stringify(project);
  const pasted = parseAssistantReply(`Draft for review:\n${JSON.stringify({ project })}`);
  const host = parseAssistantProject(input);
  for (const candidate of [pasted, host]) {
    assert.equal(candidate.tasks.find(task => task.id === 'b2').adaptation, undefined);
    assert.equal(candidate.tasks.find(task => task.id === 'b2').title, project.tasks.find(task => task.id === 'b2').title);
    assert.equal(candidate.tasks.find(task => task.id === 'b2').objective, project.tasks.find(task => task.id === 'b2').objective);
  }
  assert.equal(project.tasks.find(task => task.id === 'b2').adaptation.teacherConfirmed, true);
});

test('teacher-confirmed metadata still survives legitimate project and course files', () => {
  const project = adoptAlternative(demo(), 'b2', true);
  const confirmed = project.tasks.find(task => task.id === 'b2').adaptation;
  assert.deepEqual(parseProject(JSON.stringify(project)).tasks.find(task => task.id === 'b2').adaptation, confirmed);
  assert.deepEqual(readCourseFile(writeCourseFile(project)).project.tasks.find(task => task.id === 'b2').adaptation, confirmed);
});
