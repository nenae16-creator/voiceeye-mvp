import test from 'node:test';
import assert from 'node:assert/strict';
import { createMeetingController, acknowledgeOpinion } from '../portable/neural/meeting-controller.js';
function harness(overrides = {}) {
  const events = [];
  const controller = createMeetingController({ update() {}, status() {}, speaker() {}, agenda() {}, opinion() {}, reset() {}, stop() {},
    async synthesize(text) { events.push(['synthesize', text]); return { pcm: [0.1] }; },
    async play() { events.push(['audio']); },
    async recognize() { events.push(['recognize']); return '실제로 들은 결과'; },
    caption(_, text) { if (text) events.push(['caption', text]); },
    record(_, text) { events.push(['record', text]); }, ...overrides });
  return { controller, events };
}
test('audio is completed before recognition and public captions use recognition output', async () => {
  const { controller, events } = harness(); await controller.start();
  assert.deepEqual(events.map(event => event[0]), ['synthesize', 'audio', 'recognize', 'caption', 'record']);
  assert.equal(events.at(-1)[1], '실제로 들은 결과');
});
test('next waits for explicit action; drafting and floor request block other participants', async () => {
  const { controller, events } = harness(); await controller.start();
  assert.equal(controller.state.cursor, 1);
  controller.draft('물도 필요해요'); assert.equal(await controller.next(), false);
  controller.draft(''); await controller.requestFloor(); assert.equal(await controller.next(), false);
  assert.equal(events.filter(event => event[0] === 'synthesize').at(-1)[1], '발언하겠습니다.');
});
test('typed speech keeps the exact input and does not go through recognition', async () => {
  const { controller, events } = harness(); await controller.start(); await controller.requestFloor();
  const text = '물하고 종이컵도 필요합니다.\n제가 챙길게요.';
  controller.draft(text); assert.equal(await controller.send(text), true);
  assert.equal(events.at(-1)[1], text); assert.equal(controller.state.floor, true);
  assert.equal(events.filter(event => event[0] === 'recognize').length, 1);
  assert.equal(await controller.next(), false); assert.equal(controller.finishFloor(), true);
});
test('next is blocked throughout voice generation and playback', async () => {
  let release; const { controller } = harness({ play: () => new Promise(resolve => { release = resolve; }) });
  const run = controller.start(); await Promise.resolve(); await Promise.resolve();
  assert.equal(await controller.next(), false); release(); await run;
});
test('late recognition from a stopped turn cannot add captions or advance the scenario', async () => {
  let release; const { controller, events } = harness({ recognize: () => new Promise(resolve => { release = resolve; }) });
  const run = controller.start(); for (let i = 0; i < 5; i++) await Promise.resolve();
  controller.stop(); release('늦게 도착한 자막'); await run;
  assert.equal(events.filter(event => event[0] === 'record').length, 0); assert.equal(controller.state.cursor, 0);
});
test('failed playback never records a successful typed utterance or clears draft', async () => {
  const { controller, events } = harness(); await controller.start(); await controller.requestFloor();
  controller.draft('여분 케이블'); controller.stop();
  const failing = harness({ play: async () => { throw new Error('speaker failed'); } }).controller;
  failing.state.started = true; failing.state.floor = true; failing.draft('여분 케이블');
  assert.equal(await failing.send('여분 케이블'), false); assert.equal(failing.state.draft, '여분 케이블');
});
test('meeting acknowledgements reflect supplied items without interpreting 준비물 as water', () => {
  assert.match(acknowledgeOpinion('물하고 종이컵도 필요합니다.'), /물하고 종이컵/);
  assert.doesNotMatch(acknowledgeOpinion('준비물 확인했습니다.'), /물도/);
  assert.match(acknowledgeOpinion('종이컵은 필요 없어요'), /빼자는 의견/);
});
