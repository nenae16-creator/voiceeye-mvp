export type SpeakerId = "kim" | "park" | "lee" | "choi" | "jung" | "self";

export type HeadBox = { x: number; y: number; w: number; h: number };

export type Speaker = {
  id: SpeakerId;
  anon: string;
  name: string;
  role: string;
  initial: string;
  angle: number;
  head: HeadBox;
};

export type Turn = {
  id: string;
  speakerId: SpeakerId;
  startMs: number;
  endMs: number;
  text: string;
  overlap?: boolean;
  lowConfidence?: boolean;
};

export const speakers: Speaker[] = [
  {
    id: "kim",
    anon: "화자 1",
    name: "김서연",
    role: "복지부 과장",
    initial: "1",
    angle: 0,
    head: { x: 54.2, y: 42.7, w: 6.4, h: 14.0 },
  },
  {
    id: "park",
    anon: "화자 2",
    name: "박민준",
    role: "연구관",
    initial: "2",
    angle: -34,
    head: { x: 32.8, y: 42.0, w: 6.6, h: 14.8 },
  },
  {
    id: "lee",
    anon: "화자 3",
    name: "이하늘",
    role: "주무관",
    initial: "3",
    angle: 30,
    head: { x: 76.3, y: 44.5, w: 7.1, h: 16.1 },
  },
  {
    id: "choi",
    anon: "화자 4",
    name: "최도윤",
    role: "보조공학사",
    initial: "4",
    angle: -56,
    head: { x: 13.0, y: 43.0, w: 12.0, h: 21.0 },
  },
  {
    id: "jung",
    anon: "화자 5",
    name: "정유진",
    role: "통역지원",
    initial: "5",
    angle: 54,
    head: { x: 90.5, y: 47.5, w: 11.4, h: 22.0 },
  },
  {
    id: "self",
    anon: "나",
    name: "나",
    role: "패널 사용자",
    initial: "나",
    angle: 180,
    head: { x: 50, y: 94, w: 8, h: 8 },
  },
];

export const speakerMap = Object.fromEntries(speakers.map((s) => [s.id, s])) as Record<
  SpeakerId,
  Speaker
>;

export const others = speakers.filter((s) => s.id !== "self");

export function displayOf(id: SpeakerId, labeled: boolean) {
  const s = speakerMap[id];
  return labeled ? s.name : s.anon;
}

export function roleOf(id: SpeakerId, labeled: boolean) {
  return labeled ? speakerMap[id].role : "세션 클러스터";
}

export const turns: Turn[] = [
  {
    id: "t1",
    speakerId: "kim",
    startMs: 700,
    endMs: 7200,
    text: "오늘 보조기기 시범 운영 안건입니다. 보이스아이 파일럿, 화자 2부터 보고해 주십시오.",
  },
  {
    id: "t2",
    speakerId: "choi",
    startMs: 7600,
    endMs: 13800,
    text: "근거리 문자오류 4.7퍼센트, 원거리 7.1입니다. 숫자 정규화하면 의미 손실은 더 낮습니다.",
  },
  {
    id: "t3",
    speakerId: "park",
    startMs: 14200,
    endMs: 20800,
    text: "겹침 구간은 55퍼센트로 게이트 실패입니다. 화자 분리 없이 납품하면 안 됩니다.",
  },
  {
    id: "t4a",
    speakerId: "lee",
    startMs: 21400,
    endMs: 27800,
    text: "공공회의 음성은 노트북 안에서 우선 처리해야 합니다. 국외이전은 설계에서 뺍니다.",
    overlap: true,
    lowConfidence: true,
  },
  {
    id: "t4b",
    speakerId: "jung",
    startMs: 21800,
    endMs: 27600,
    text: "자막만으로는 부족합니다. 누가 말하는지 패널 안 좌석 방향으로 보여야 합니다.",
    overlap: true,
    lowConfidence: true,
  },
  {
    id: "t5",
    speakerId: "kim",
    startMs: 28600,
    endMs: 34800,
    text: "좌석을 선택하면 그 화자 자막을 우선합니다. 사용자분, 미리보기 후 발언해 주십시오.",
  },
  {
    id: "t6",
    speakerId: "jung",
    startMs: 35200,
    endMs: 39800,
    text: "초안은 노트북에만 보이고, 확인한 뒤에만 패널과 스피커로 나갑니다. 기본은 비저장입니다.",
  },
];

export const SCRIPT_MS = 41000;
export const OVERLAP_MS = 21400;

export function activeTurns(clockMs: number): Turn[] {
  return turns.filter((t) => clockMs >= t.startMs && clockMs < t.endMs);
}

export function startedTurns(clockMs: number): Turn[] {
  return turns.filter((t) => clockMs >= t.startMs);
}

export function partialText(turn: Turn, clockMs: number): string {
  const span = Math.max(1, turn.endMs - turn.startMs);
  const p = Math.min(1, Math.max(0, (clockMs - turn.startMs) / span));
  const n = Math.max(1, Math.ceil(turn.text.length * p));
  return turn.text.slice(0, n);
}

export function isConfirmed(turn: Turn, clockMs: number): boolean {
  const span = Math.max(1, turn.endMs - turn.startMs);
  return clockMs >= turn.startMs + span * 0.88;
}
