export function demo(lang = 'en') {
  const zh = lang === 'zh';
  return {
    version: 1, title: zh ? '一起认识数的组成' : 'Making numbers together', duration: 40,
    groups: [
      { id: 'g1', name: zh ? '初学组' : 'First steps', canRead: false, independentLimit: 15 },
      { id: 'g2', name: zh ? '进阶组' : 'Next steps', canRead: true, independentLimit: 20 }
    ],
    resources: [
      { id: 'counters', name: zh ? '计数石子' : 'Counters / stones', quantity: 20 },
      { id: 'board', name: zh ? '黑板区' : 'Board space', quantity: 1 },
      { id: 'paper', name: zh ? '练习纸（张）' : 'Printed sheets', quantity: 0 }
    ],
    tasks: [
      { id: 'a1', groupId: 'g1', title: zh ? '示范把 5 分成两堆' : 'Model splitting 5 into two sets', objective: zh ? '用实物表示数的分解' : 'Represent number bonds with objects', duration: 10, mode: 'teacher', after: [], needs: [{ resourceId: 'counters', quantity: 10 }], requiresReading: false, alternative: null },
      { id: 'a2', groupId: 'g1', title: zh ? '按示范用石子组成 5' : 'Build sets of 5 with stones', objective: zh ? '独立摆出两种分法' : 'Build two different number bonds', duration: 10, mode: 'independent', after: ['a1'], needs: [{ resourceId: 'counters', quantity: 10 }], requiresReading: false, alternative: null },
      { id: 'a3', groupId: 'g1', title: zh ? '检查分法并口头反馈' : 'Check combinations together', objective: zh ? '解释两堆合起来仍是 5' : 'Explain why the total remains 5', duration: 10, mode: 'teacher', after: ['a2'], needs: [], requiresReading: false, alternative: null },
      { id: 'b1', groupId: 'g2', title: zh ? '示范两位数分解' : 'Model tens and ones', objective: zh ? '理解两位数由十和一组成' : 'Represent tens and ones', duration: 10, mode: 'teacher', after: [], needs: [{ resourceId: 'board', quantity: 1 }], requiresReading: false, alternative: null },
      { id: 'b2', groupId: 'g2', title: zh ? '完成打印练习纸' : 'Complete printed practice', objective: zh ? '表示并核对两位数的分解' : 'Represent and check two-digit numbers', duration: 10, mode: 'independent', after: ['b1'], needs: [{ resourceId: 'paper', quantity: 12 }], requiresReading: true, alternative: { title: zh ? '看黑板题目，两人用石子摆数并互查' : 'Read board prompts; build and peer-check with stones', rationale: zh ? '保留“表示并核对”的目标，用实物与同伴口头核对代替纸上作答。请老师确认任务适合本组。' : 'Keep representation and checking through objects and peer explanation instead of written answers. Teacher must confirm suitability.', requiresReading: true, needs: [{ resourceId: 'counters', quantity: 10 }, { resourceId: 'board', quantity: 1 }] } },
      { id: 'b3', groupId: 'g2', title: zh ? '比较两种表示方法' : 'Compare representations', objective: zh ? '解释十和一之间的关系' : 'Explain the relationship between tens and ones', duration: 10, mode: 'teacher', after: ['b2'], needs: [], requiresReading: false, alternative: null }
    ]
  };
}
