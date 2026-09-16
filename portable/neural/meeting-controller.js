export const AGENDA = ['행사 일정', '장비 점검', '안내·접수 준비', '빠진 준비물', '담당·마감 확인'];
export const BEATS = [
  { seat: 'kim', agenda: 0, text: '금요일 고용 상담 행사 준비물부터 확인할게요. 참석자는 스무 명이고, 오후 두 시에 시작합니다.' },
  { seat: 'park', agenda: 0, text: '접수는 한 시 반부터 받을게요. 참석자 명단이랑 이름표 스무 개는 제가 챙기겠습니다.' },
  { seat: 'jung', agenda: 1, text: '노트북하고 충전기, 자막 패널은 제가 가져갈게요. 연결 케이블도 필요하겠네요.' },
  { seat: 'lee', agenda: 1, text: '멀티탭도 챙겨 주세요. 지난번에는 콘센트가 멀어서 장비를 못 켰거든요.' },
  { seat: 'jung', agenda: 1, text: '네, 멀티탭이랑 여분 케이블까지 넣을게요. 목요일에 연결해서 소리하고 자막을 확인하겠습니다.' },
  { seat: 'lee', agenda: 2, text: '안내문 스무 장하고 큰 글씨 안내판은 제가 준비할게요. 접수대에 놓을 펜도 챙기겠습니다.' },
  { seat: 'kim', agenda: 3, text: '이제 빠진 준비물이 있는지 같이 봐 주세요. 추가할 게 있으면 손을 들고 말씀해 주세요.', waitForUser: true },
  { seat: 'park', agenda: 4, text: '저는 명단하고 이름표를 맡겠습니다. 목요일 오후 다섯 시까지 준비할게요.' },
  { seat: 'kim', agenda: 4, text: '장비는 준호 님, 안내문은 유진 님이 맡아 주세요. 목요일에 준비물을 다시 확인하고 마치겠습니다.' },
];

export function acknowledgeOpinion(opinion) {
  if (!opinion) return '네, 추가 의견은 없는 것으로 확인하고 담당을 정할게요.';
  if (/필요\s*없|제외|빼\s*주세요|챙기지/.test(opinion)) return '네, 준비물을 빼자는 의견도 기록했어요. 최종 목록을 확인할 때 같이 보겠습니다.';
  const items = ['종이컵','생수','손소독제','테이프','여분 케이블','보조 배터리','이름표','안내문','멀티탭'].filter(item => opinion.includes(item));
  if (/(?:^|[\s,.])물(?:하고|이|도|은|을|과|$|[\s,.])/.test(opinion)) items.unshift('물');
  return items.length ? `네, ${items.join('하고 ')}도 확인할 목록에 넣겠습니다. 누가 챙길지 같이 정해 주세요.` : '네, 말씀하신 의견도 기록했어요. 최종 준비 목록을 확인할 때 같이 보겠습니다.';
}

export function createMeetingController(io) {
  let token = 0;
  const state = { started: false, cursor: 0, busy: false, floor: false, floorGranted: false, waiting: false, draft: '', focused: false, listening: false, lastOpinion: '', ack: false };
  const update = () => io.update({ ...state });
  const blocked = () => state.busy || state.floor || state.waiting || state.focused || !!state.draft.trim() || state.listening;
  async function turn(beat, source) {
    const id = ++token;
    state.busy = true; update();
    try {
      io.status('발언 음성 준비 중');
      const audio = await io.synthesize(beat.text, beat.seat);
      if (id !== token) return false;
      // Show captions immediately while speech plays; run Whisper in parallel.
      io.caption(beat.seat, beat.text, '자막 표시');
      io.status('음성을 듣는 중');
      const recognition = source === '음성 인식'
        ? io.recognize(audio).then((result) => {
            if (id === token && String(result || '').trim()) io.caption(beat.seat, result, '음성 인식');
            return result;
          })
        : Promise.resolve(beat.text);
      await io.play(audio, () => io.speaker(beat.seat));
      if (id !== token) return false;
      io.speaker(null);
      let text = beat.text;
      if (source === '음성 인식') {
        io.status('들은 음성을 인식 중');
        text = await recognition;
        if (id !== token) return false;
        if (!String(text || '').trim()) throw new Error('자막을 인식하지 못했습니다. 발언을 다시 들을 수 있습니다.');
      }
      io.caption(beat.seat, text, source);
      io.record(beat.seat, text, source);
      io.status('다음 발언을 기다립니다');
      return true;
    } catch (error) { if (id === token) io.status(error.message, true); return false; }
    finally { if (id === token) { state.busy = false; io.speaker(null); update(); } }
  }
  const api = {
    state,
    async start() { if (state.started || state.busy) return; state.started = true; update(); return api.next(); },
    async next() {
      if (!state.started || blocked()) return false;
      if (state.ack) {
        // The acknowledgement repeats the actual opinion; it does not invent an agreed decision.
        const ack = { seat: 'kim', agenda: 3, text: acknowledgeOpinion(state.lastOpinion) };
        if (await turn(ack, '음성 인식')) state.ack = false;
        update(); return true;
      }
      const beat = BEATS[state.cursor];
      if (!beat) { io.status('회의를 마쳤습니다'); return false; }
      io.agenda(beat.agenda);
      if (await turn(beat, '음성 인식')) {
        state.cursor++;
        if (beat.waitForUser) { state.waiting = true; io.status('추가할 준비물을 말씀해 주세요'); }
      }
      update(); return true;
    },
    async requestFloor() {
      if (!state.started || state.listening) return false;
      if (state.floor && state.floorGranted) return true;
      ++token; io.stop(); state.busy = false; state.floor = true; update();
      state.floorGranted = await turn({ seat: 'self', text: '발언하겠습니다.' }, '발언 요청');
      update(); return state.floorGranted;
    },
    async send(text) {
      if (!text.trim() || state.busy || state.listening || !state.started) return false;
      if (!state.floorGranted && !await api.requestFloor()) return false;
      const ok = await turn({ seat: 'self', text }, '키보드 발언');
      if (ok) { state.draft = ''; state.lastOpinion = text; state.waiting = false; state.ack = true; io.opinion(text); }
      update(); return ok;
    },
    finishFloor() {
      if (state.busy || state.draft.trim() || state.listening) return false;
      if (state.waiting) { state.waiting = false; state.lastOpinion = ''; state.ack = true; }
      state.floor = false; state.floorGranted = false; state.focused = false; update(); return true;
    },
    draft(text) { state.draft = text; update(); },
    focus(value) { state.focused = value; update(); },
    stop() { ++token; io.stop(); state.busy = false; state.listening = false; io.speaker(null); io.status('재생을 멈췄습니다'); update(); },
    reset() { api.stop(); Object.assign(state, { started: false, cursor: 0, floor: false, floorGranted: false, waiting: false, draft: '', focused: false, lastOpinion: '', ack: false }); io.reset(); update(); },
  };
  update(); return api;
}
