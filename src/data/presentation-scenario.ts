export const PRESENTATION_DURATION_MS = 80000;

export type ScenarioLine = {
  speaker: string;
  seat: "left" | "center" | "right" | "self" | "system";
  text: string;
};

export type ScenarioStep = {
  startMs: number;
  label: string;
  title: string;
  lines: ScenarioLine[];
  note: string;
  draft?: string;
  voiceText?: string;
  warning?: boolean;
};

export const presentationScenario: ScenarioStep[] = [
  {
    startMs: 0,
    label: "회의 시작",
    title: "상담 일정 조정 회의",
    lines: [
      {
        speaker: "김서연 · 진행",
        seat: "center",
        text: "오늘은 장애인 고용 상담에 사용할 보이스아이 시연을 진행하겠습니다.",
      },
    ],
    note: "참석자에게 자막과 음성 처리 방식을 먼저 알립니다.",
    voiceText: "오늘은 장애인 고용 상담에 사용할 보이스아이 시연을 진행하겠습니다.",
  },
  {
    startMs: 9000,
    label: "안건 확인",
    title: "다음 상담 일정",
    lines: [
      {
        speaker: "박민준 · 상담 담당",
        seat: "left",
        text: "신규 상담 일정은 다음 주 화요일 오전으로 잡겠습니다.",
      },
    ],
    note: "확정 자막과 발언 방향을 함께 보여 줍니다.",
    voiceText: "신규 상담 일정은 다음 주 화요일 오전으로 잡겠습니다.",
  },
  {
    startMs: 19000,
    label: "동시 발언",
    title: "두 사람이 겹쳐 말함",
    lines: [
      {
        speaker: "박민준 · 상담 담당",
        seat: "left",
        text: "장비 설치는 회의 전날 확인하겠습니다.",
      },
      {
        speaker: "정유진 · 운영 지원",
        seat: "right",
        text: "참여자 안내문은 오늘 먼저 보내겠습니다.",
      },
    ],
    note: "겹친 문장을 한 줄로 합치지 않고 따로 표시합니다.",
    warning: true,
  },
  {
    startMs: 29000,
    label: "확인 요청",
    title: "놓친 구간을 바로 확인",
    lines: [
      {
        speaker: "VoiceEye",
        seat: "system",
        text: "동시 발언이 있었습니다. 두 문장을 나누어 확인해 주세요.",
      },
    ],
    note: "모르는 문장을 추측해 채우지 않습니다.",
    warning: true,
  },
  {
    startMs: 39000,
    label: "의견 요청",
    title: "청각장애인 참석자에게 발언 기회 제공",
    lines: [
      {
        speaker: "김서연 · 진행",
        seat: "center",
        text: "이종현 님 의견도 듣겠습니다.",
      },
    ],
    note: "입력 중인 문장은 다른 참석자에게 보이지 않습니다.",
    draft: "잠시만 기다려 주세요. 제 의견을 입력하고 있습니다.",
    voiceText: "이종현 님 의견도 듣겠습니다.",
  },
  {
    startMs: 49000,
    label: "비공개 확인",
    title: "보내기 전에 문장을 다시 읽음",
    lines: [
      {
        speaker: "나 · 비공개 미리보기",
        seat: "self",
        text: "저는 화요일 오전이 좋습니다. 안내문은 쉬운 문장으로 보내 주세요.",
      },
    ],
    note: "이 단계에서는 패널과 스피커로 나가지 않습니다.",
    draft: "저는 화요일 오전이 좋습니다. 안내문은 쉬운 문장으로 보내 주세요.",
  },
  {
    startMs: 60000,
    label: "음성 발언",
    title: "확인한 문장만 스피커로 전달",
    lines: [
      {
        speaker: "나 · 스피커 발언",
        seat: "self",
        text: "저는 화요일 오전이 좋습니다. 안내문은 쉬운 문장으로 보내 주세요.",
      },
    ],
    note: "기기에 한국어 음성이 없으면 자막 시연은 그대로 진행됩니다.",
    voiceText: "저는 화요일 오전이 좋습니다. 안내문은 쉬운 문장으로 보내 주세요.",
  },
  {
    startMs: 70000,
    label: "결정 확인",
    title: "회의 결과를 함께 확인",
    lines: [
      {
        speaker: "김서연 · 진행",
        seat: "center",
        text: "화요일 오전으로 정하고, 안내문은 오늘 안에 보내겠습니다.",
      },
    ],
    note: "시연 종료 · 실제 회의 저장 기능은 본선 개발 범위입니다.",
    voiceText: "화요일 오전으로 정하고, 안내문은 오늘 안에 보내겠습니다.",
  },
];

export const presentationDisclosure = "시연용 대본 · 실제 마이크 성능 측정이 아님";

export function scenarioStepAt(elapsedMs: number) {
  let index = 0;
  for (let i = 0; i < presentationScenario.length; i += 1) {
    if (elapsedMs >= presentationScenario[i].startMs) index = i;
  }
  return { index, step: presentationScenario[index] };
}
