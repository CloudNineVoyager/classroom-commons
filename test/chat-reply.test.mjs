import test from 'node:test';
import assert from 'node:assert/strict';
import { demo } from '../app/demo.mjs';
import { parseAssistantReply } from '../app/engine.mjs';

test('accepts a complete chat reply with explanation and fenced project', () => {
  const p = demo('zh');
  p.tasks[0].objective = '解释“{十}”与“{一}”，并说出引号 " 和反斜杠 \\';
  const reply = `已经为你准备好了：\n\n\`\`\`json\n${JSON.stringify(p)}\n\`\`\`\n\n请老师审阅后使用。`;
  assert.deepEqual(parseAssistantReply(reply), p);
});

test('does not guess between two complete lessons or accept a truncated answer', () => {
  const text = JSON.stringify(demo());
  assert.throws(() => parseAssistantReply(text + '\n也可以用这一版：\n' + text), /multipleProjects/);
  assert.throws(() => parseAssistantReply(text.slice(0, -20)), /replyFormat/);
  assert.throws(() => parseAssistantReply('请购买会员后再生成。'), /replyFormat/);
  assert.throws(() => parseAssistantReply('x'.repeat(1000001)), /tooLarge/);
});

test('accepts a validated lesson inside a chat wrapper or after an unmatched prose brace', () => {
  const p = demo('zh'), json = JSON.stringify(p);
  assert.deepEqual(parseAssistantReply(JSON.stringify({ message: '请老师先审阅', project: p })), p);
  assert.deepEqual(parseAssistantReply('课堂准备 {请检查材料\n```json\n' + json + '\n```'), p);
  assert.throws(() => parseAssistantReply(JSON.stringify({ first: p, second: p })), /multipleProjects/);
});

test('rejects excessive nesting without a parser crash', () => {
  assert.throws(() => parseAssistantReply('{'.repeat(129) + JSON.stringify(demo()) + '}'.repeat(129)), /replyFormat/);
});
