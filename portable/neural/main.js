import { createMeetingController, AGENDA, BEATS } from './meeting-controller.js';
import { writeWavFile } from './vendor/supertonic-helper.js';

const $ = id => document.getElementById(id);
const PEOPLE = {
  kim: { name: '김서연', role: '진행', voice: 'F1' },
  park: { name: '박민준', role: '접수', voice: 'M1' },
  jung: { name: '이준호', role: '장비', voice: 'M2' },
  lee: { name: '정유진', role: '안내', voice: 'F2' },
  self: { name: '나', role: '키보드 발언', voice: 'F1' },
};
const worker = new Worker(new URL('./speech-worker.js', import.meta.url), { type: 'module' });
let seq = 0, ready = false, context, playing, settlePlayback, engineDescription = '';
const pending = new Map();
function rpc(action, args = {}) {
  return new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); worker.postMessage({ id, action, ...args }); });
}
worker.onmessage = ({ data }) => {
  if (data.progress) { $('engineStatus').textContent = data.progress; return; }
  const request = pending.get(data.id);
  if (!request) return;
  pending.delete(data.id);
  data.error ? request.reject(new Error(data.error)) : request.resolve(data.result);
};
worker.onerror = error => {
  for (const request of pending.values()) request.reject(new Error(error.message || '음성 처리 오류'));
  pending.clear(); $('engineStatus').textContent = '음성 모델을 열지 못했습니다. 시연시작 파일로 다시 열어 주세요.';
};
const cache = new Map();
async function synthesize(text, seat) {
  const key = `${seat}:${text}`;
  if (!cache.has(key)) {
    const task = rpc('synthesize', { text, voice: PEOPLE[seat].voice });
    cache.set(key, task); task.catch(() => cache.delete(key));
  }
  return cache.get(key);
}
function audioContext() { return context ||= new AudioContext(); }
function stop() {
  if (playing) { playing.onended = null; try { playing.stop(); } catch {} playing = null; }
  if (settlePlayback) { settlePlayback.reject(new Error('재생을 멈췄습니다')); settlePlayback = null; }
}
async function play(audio, onstart) {
  const ctx = audioContext(); await ctx.resume();
  return new Promise((resolve, reject) => {
    const buffer = ctx.createBuffer(1, audio.pcm.length, audio.sampleRate); buffer.copyToChannel(audio.pcm, 0);
    const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination);
    playing = source; settlePlayback = { reject };
    source.onended = () => { if (playing !== source) return; playing = null; settlePlayback = null; resolve(); };
    source.start(); onstart(); status('참석자가 말하는 중');
    const sample = $('voiceSample');
    if (sample) { if (sample.href.startsWith('blob:')) URL.revokeObjectURL(sample.href); sample.href = URL.createObjectURL(new Blob([writeWavFile(audio.pcm, audio.sampleRate)], { type: 'audio/wav' })); sample.hidden = false; }
  });
}
async function recognize(audio) {
  const resampler = new OfflineAudioContext(1, Math.ceil(audio.pcm.length * 16000 / audio.sampleRate), 16000);
  const buffer = resampler.createBuffer(1, audio.pcm.length, audio.sampleRate); buffer.copyToChannel(audio.pcm, 0);
  const source = resampler.createBufferSource(); source.buffer = buffer; source.connect(resampler.destination); source.start();
  const output = await resampler.startRendering();
  return (await rpc('recognize', { pcm: output.getChannelData(0) })).text;
}
function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function caption(seat, text, source) {
  const person = PEOPLE[seat], body = $('capBody'); body.replaceChildren();
  body.append(el('div', `${person.name} · ${person.role}`, 'cap-speaker'), el('p', text || '음성이 끝나면 인식한 자막이 표시됩니다.', 'cap-text'));
  $('capStatus').textContent = source; $('capStatus').className = 'status';
}
function record(seat, text, source) {
  const person = PEOPLE[seat], row = el('div', undefined, 'entry'), photo = el('img');
  photo.src = `assets/avatar-${seat === 'self' ? 'self.svg' : seat + '.png'}`; photo.alt = '';
  const body = el('div'); body.append(el('div', `${person.name} · ${source}`, 'who'), el('p', text, 'txt'));
  row.append(photo, body, el('time', new Date().toLocaleTimeString('ko-KR', { hour12: false })));
  $('transcript').append(row); $('transcript').scrollTop = $('transcript').scrollHeight;
}
function status(text, error = false) { $('turnMsg').textContent = text; $('modeLabel').textContent = text; $('turnBar').classList.toggle('frozen', error); if (ready && engineDescription) $('engineStatus').textContent = engineDescription; }
function speaker(seat) { document.querySelectorAll('[data-seat]').forEach(node => node.classList.toggle('on', node.dataset.seat === seat)); }
const meeting = createMeetingController({
  synthesize, play, recognize, caption, record, status, speaker, stop,
  agenda(index) { $('stageLabel').textContent = AGENDA[index]; document.querySelectorAll('#steps li').forEach((node, i) => node.classList.toggle('on', i === index)); },
  opinion(text) { const row = el('li', text); $('opinions').append(row); },
  reset() { $('transcript').replaceChildren(); $('opinions').replaceChildren(); $('chatInput').value = ''; $('stageLabel').textContent = '대기'; $('capBody').replaceChildren(el('p', '회의 시작을 누른 뒤, 한 명씩 발언을 진행하세요.', 'cap-empty')); },
  update(s) {
    $('startBtn').disabled = !ready || s.started;
    $('nextBtn').disabled = !ready || !s.started || s.busy || s.floor || s.waiting || s.focused || !!s.draft.trim() || s.listening;
    $('myTurnBtn').disabled = !ready || !s.started || s.floor || s.listening;
    $('finishFloor').disabled = !s.started || s.busy || !!s.draft.trim() || s.listening;
    $('sendBtn').disabled = !ready || !s.started || s.busy || !s.draft.trim() || s.listening;
    $('finishFloor').textContent = s.waiting && !s.floor ? '추가 의견 없음' : '발언 마치기';
    $('chatInput').disabled = !ready || !s.started;
    $('turnBar').classList.add('show');
    $('chatForm').classList.toggle('my-turn', s.floor);
    $('nextBtn').textContent = s.cursor >= BEATS.length && !s.ack ? '회의 종료' : '다음 발언';
  },
});
$('steps').replaceChildren(...AGENDA.map(text => el('li', text)));
for (const [id, person] of Object.entries(PEOPLE)) {
  const node = el('div', undefined, 'person'); node.dataset.seat = id;
  const img = el('img'); img.src = `assets/avatar-${id === 'self' ? 'self.svg' : id + '.png'}`; img.alt = '';
  const body = el('div'); body.append(el('b', person.name), el('small', person.role)); node.append(img, body); $('people').append(node);
}
$('startBtn').onclick = () => { audioContext().resume(); meeting.start(); };
$('nextBtn').onclick = () => meeting.next();
$('myTurnBtn').onclick = async () => { await meeting.requestFloor(); $('chatInput').focus(); };
$('finishFloor').onclick = () => { if (meeting.finishFloor()) { $('chatInput').blur(); status('다음 발언을 눌러 회의를 이어가세요'); } };
$('restartBtn').onclick = () => meeting.reset();
$('muteBtn').textContent = '재생 중지'; $('muteBtn').onclick = () => meeting.stop();
$('clearLog').onclick = () => $('transcript').replaceChildren();
$('chatInput').oninput = event => meeting.draft(event.target.value);
$('chatInput').onfocus = () => meeting.focus(true);
$('chatInput').onblur = () => meeting.focus(false);
$('chatForm').onsubmit = async event => {
  event.preventDefault(); const text = $('chatInput').value;
  if (await meeting.send(text)) { $('chatInput').value = ''; status('발언 마치기를 누르면 회의를 이어갈 수 있습니다'); }
};
$('chatInput').onkeydown = event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !event.repeat) { event.preventDefault(); $('chatForm').requestSubmit(); } };
$('micBtn').hidden = true;
$('micHint').textContent = '참석자 음성은 합성한 시나리오입니다. 자막은 재생된 음성을 Whisper가 실제 인식한 결과이며, 발언자는 시나리오 좌석으로 표시합니다. 카메라로 판정하지 않습니다.';
rpc('init').then(info => {
  ready = true; engineDescription = `${info.engine} / ${info.stt}`; $('engineStatus').textContent = engineDescription;
  meeting.draft(''); status('회의를 시작해 주세요');
}).catch(error => { $('engineStatus').textContent = `음성 준비 실패: ${error.message}`; status('시연시작 파일로 열었는지 확인해 주세요', true); });
