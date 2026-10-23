# Project format, version 1

Return JSON only. The teacher reviews before applying it. All strings must be nonempty, at most 2000 characters. Limits: one teacher, 1–6 groups, 1–24 activities, 0–30 resources, 5–240 minutes. All numbers are whole numbers. IDs are unique within their collection.

```json
{
  "version": 1,
  "title": "Counting with local materials",
  "duration": 30,
  "groups": [{"id":"g1","name":"Group A","canRead":false,"independentLimit":10}],
  "resources": [{"id":"stones","name":"Counters (pieces)","quantity":20}],
  "tasks": [{
    "id":"a1","groupId":"g1","title":"Count together",
    "objective":"Represent quantities up to ten using objects",
    "duration":10,"mode":"teacher","requiresReading":false,
    "after":[],"needs":[{"resourceId":"stones","quantity":10}],
    "alternative":null
  }]
}
```

This illustrates shape, not a complete 30-minute lesson. Supply sufficient teacher contact and activities for the teacher's conditions.

- `canRead`: can independently read the instructions in the activity language. Use the teacher's answer, not an age stereotype.
- `independentLimit`: 1–240 minutes without teacher contact, including waiting and independent work. Teacher-defined.
- Resource `quantity`: 0–100000 simultaneously available units; include the unit in its name. This version does **not** track cumulative consumption. Do not imply that one piece of paper can be consumed repeatedly.
- Every group must have an activity. `groupId` must exist. Task `duration`: 1–240 minutes. `mode`: `teacher` or `independent`.
- `after`: IDs of prerequisite activities; no missing IDs, self-reference or cycles.
- `needs`: existing resource IDs, no duplicate IDs, positive whole quantities up to 100000.
- Independent reading activities require `canRead: true`. Total teacher time and each group's time must fit the lesson. Avoid long periods without teacher contact.
- `alternative` is `null` or `{ "title": "...", "rationale": "Explain how the stated objective is preserved", "requiresReading": false, "needs": [] }`. It retains the original group, objective, duration, support mode and prerequisites. To change these, propose an explicit draft revision.
- Do not mark alternatives as teacher-confirmed. They remain suggestions until reviewed in the UI.

The engine checks teacher and group overlaps, concurrent resource capacity, dependencies, reading requirements and the teacher-defined attention gap. A bounded search can return `unknown`; this is not proof of impossibility. No schedule check establishes pedagogical quality.
