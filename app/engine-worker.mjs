import { solve, replan } from './engine.mjs';
self.onmessage = ({ data }) => {
  try {
    self.postMessage(data.type === 'replan' ? replan(data.project, data.schedule, data.taskId, data.extra) : { project: data.project, result: solve(data.project) });
  } catch (error) { self.postMessage({ error: error.message }); }
};
