export type ProductStrategy = {
  id: "link" | "dock" | "one";
  name: string;
  label: string;
  stage: string;
  buyer: string;
  hardware: string[];
  strength: string;
  risk: string;
};

export const productStrategies: ProductStrategy[] = [
  {
    id: "link",
    name: "VoiceEye Link",
    label: "노트북 연결형",
    stage: "1단계 · 12주 MVP",
    buyer: "기업 회의실, 복지관, 공공기관 실증",
    hardware: ["USB 투명 패널", "정면 카메라", "마이크 배열", "키보드·스피커"],
    strength: "기존 노트북의 연산 성능을 써서 가장 빨리 검증한다.",
    risk: "노트북이 없거나 보안 프로그램이 설치를 막으면 사용할 수 없다.",
  },
  {
    id: "dock",
    name: "VoiceEye Dock",
    label: "스마트폰 도킹형",
    stage: "2단계 · 휴대형",
    buyer: "외부 미팅이 잦은 개인, 소규모 조직",
    hardware: ["USB-C 허브", "투명 패널", "소형 마이크", "블루투스 키보드·스피커"],
    strength: "스마트폰을 연산 장치로 사용해 이동성과 보급성을 높인다.",
    risk: "DP Alt Mode, 전원, 발열, 브라우저 권한을 기종별로 검증해야 한다.",
  },
  {
    id: "one",
    name: "VoiceEye One",
    label: "내장 연산형",
    stage: "3단계 · 기관용",
    buyer: "상설 회의실, 민원 창구, 교육장",
    hardware: ["내장 미니 PC", "투명 패널", "카메라", "마이크 배열·스피커"],
    strength: "전원만 연결하면 같은 품질과 설정으로 반복 운영할 수 있다.",
    risk: "기기 원가, 냉각, KC, 유지보수와 폐쇄망 연결 방식을 함께 설계해야 한다.",
  },
];
export const aiStack = [
  {
    job: "실시간 한국어 자막",
    primary: "CLOVA Speech Streaming",
    why: "한국어 스트리밍 인식과 국내 클라우드 운영 적합성을 먼저 검증",
    guardrail: "회의실 소음·겹침 발화 CER를 자체 데이터로 다시 측정",
  },
  {
    job: "실시간 발언자 위치",
    primary: "로컬 DOA + VAD + 사람 추적 융합",
    why: "CLOVA 스트리밍은 화자분리를 지원하지 않으므로 별도 융합이 필요",
    guardrail: "얼굴 이름을 공개하지 않고 좌석·방향만 표시",
  },
  {
    job: "키보드 발화 TTS",
    primary: "CLOVA Voice Premium 우선 평가",
    why: "한국어 음성 선택 폭과 속도·음높이·감정 조절을 실제 문장으로 비교",
    guardrail: "자연스러움 MOS 4.2/5와 고유명사·숫자 발음 통과 후 확정",
  },
  {
    job: "회의 후 누락 점검",
    primary: "CLOVA Speech 장문 인식 + 화자분리",
    why: "실시간 자막과 녹음 타임라인을 대조해 미인식·저신뢰 구간을 표시",
    guardrail: "명시적 동의, 보관 기간, 삭제 책임자를 회의 시작 전에 표시",
  },
] as const;

export const ttsHistory = [
  {
    name: "브라우저 Web Speech API",
    status: "로컬보이스맵에서 실제 사용",
    detail: "speechSynthesis와 기기 내 ko-KR 음성을 사용했다. 음성 이름을 고정하지 않아 기기별 품질 차이가 난다.",
  },
  {
    name: "xAI Grok TTS · eve",
    status: "VoiceEye에 연결, 음질 미검증",
    detail: "현재 서버 코드에 연결돼 있으나 XAI_API_KEY가 없어 실제 한국어 음성과 지연 시간을 검증하지 못했다.",
  },
  {
    name: "OmniVoice",
    status: "검토 후 상용 주엔진 보류",
    detail: "로컬 실행 후보지만 공개 사전학습 모델은 CC-BY-NC다. 상용 제품에는 별도 라이선스나 재학습이 필요하다.",
  },
] as const;

export const ttsEvaluation = {
  samples: 20,
  listeners: "청각장애 당사자와 비장애인 회의 참여자",
  candidates: ["CLOVA Voice 3종", "xAI eve", "기기 기본 한국어 음성"],
  gates: [
    "자연스러움 MOS 4.2/5 이상",
    "이름·숫자·영문 약어 발음 오류 2% 이하",
    "첫 음성 재생 1.0초 이내 목표",
    "문장 취소 후 새 발화 전환 0.5초 이내 목표",
  ],
};
