# 보이스아이 (VoiceEye) MVP

> 2026-09-05 검토 정정: 아래 공개 사이트와 Git HEAD는 최신 로컬 작업 사본과 다릅니다.
> 최신 STT·TTS는 미커밋 로컬 변경이며, 공개 사이트를 최신 MVP로 검증하지 마세요.
> 이번 재검토에는 SHA-256 파일 목록을 포함한 소스 ZIP을 사용합니다.
> 기본 TTS는 `localService === true`인 한국어 음성만 허용합니다. 없으면 오류를 표시합니다.
> 발언 중지 시 완료 기록을 남기지 않으며, 이미 재생된 일부 음성까지 취소할 수는 없습니다.
> 실제 마이크 인식률·지연·한국어 TTS 자연스러움은 아직 실측 완료되지 않았습니다.
> `node --test scripts/speech-composer.test.mjs`는 음성 API를 대체한 콜백 테스트이며 실장치 시험이 아닙니다.

청각장애인 회의접근성 — 노트북 연동 투명 회의 패널 데모.

- 투명 패널에 확정 자막과 발언자 좌석·방향 표시
- 실시간 한국어 마이크 자막과 임시·확정 문장 기록
- 참석자가 같은 자막을 확인하고 오인식 표시
- 노트북 비공개 입력 → 확인 후 패널 공개 + 기기 내 한국어 TTS
- 사업계획 v2.1 · ASR 실측 벤치

## 팀원용 바로 열기

**사이트:** https://nenae16-creator.github.io/voiceeye/

| 페이지        | 주소                                                |
| ------------- | --------------------------------------------------- |
| 패널 데모     | https://nenae16-creator.github.io/voiceeye/         |
| 제품·AI 전략  | https://nenae16-creator.github.io/voiceeye/strategy |
| 사업계획 v2.1 | https://nenae16-creator.github.io/voiceeye/plan     |
| 인식률 벤치   | https://nenae16-creator.github.io/voiceeye/bench    |

데모에서 해볼 것: 실시간 자막 시작 → 마이크 권한 허용 → 말하기 → 비공개 미리보기 → 스피커로 전송.
`대본 시연`으로 전환하면 겹침·좌석 우선·오인식 표시 흐름도 확인할 수 있습니다.

기본 TTS는 API 키 없이 기기에 설치된 `ko-KR` 음성을 사용합니다. 현재 Windows 실증 PC에서는
`Microsoft Heami - Korean` 음성 재생을 확인했습니다. 한국어 음성이 없는 기기에서는 설치 안내를 표시합니다.

## 로컬

```bash
npm install
npm run dev
```

Node.js 22.18 이상을 사용합니다. Windows에서도 위 명령으로 실행됩니다.
`app-env.json`은 공개 빌드 플래그만 담고 Auth OFF를 유지합니다. DB는 사용하지 않습니다.

실시간 STT의 `브라우저 무료` 모드는 별도 API 키와 사용량 과금이 없지만, 음성 처리 위치는 브라우저
정책을 따릅니다. `기기 내 우선` 모드는 브라우저가 온디바이스 음성 인식을 지원할 때만 시작됩니다.
제품화 단계에서는 같은 UI에 faster-whisper를 연결해 완전 로컬 성능을 현장 비교합니다.

클라우드 TTS 비교가 필요할 때만 `VITE_VOICEEYE_TTS_PROVIDER=cloud`를 켜고 서버의
`VOICEEYE_TTS_PROVIDER=clova|xai` 및 해당 키를 설정합니다. 기본 상태에서는 클라우드를 호출하지 않습니다.
`/bench`는 저장된 실측 JSON을 보여 줍니다.

## P0 문서와 검증

예산 원본은 `src/data/plan-v2.ts`입니다. 숫자를 수정한 뒤 아래 명령으로 두 문서를
동기화하고 검산합니다. 인용 11건은 계속 미검증입니다.

```bash
npm run docs:sync
npm run check:plan
npm run typecheck
npm run build
npm run preview
```

- [사업계획서 v2.1](artifacts/보이스아이_사업계획서_v2.md)
- [v1-v2.1 수정내역](artifacts/v1-v2_수정내역.md)
- [투명 회의 패널 제품전략 v2.1](artifacts/제품전략_v2.1.md)
- [P0 검증 결과](artifacts/P0_검증결과.md)

`npm run preview`는 빌드 결과를 8081에서 확인합니다. `preview:restart`는 기존 Linux
환경 전용입니다. 위 GitHub Pages 주소의 배포 상태는 이번 로컬 변경에 포함되지 않습니다.

현재 얼굴 좌표는 단일 사용자 시점의 위치 표시 예시로 `meeting-people.jpg`에 맞게 P0에서 재보정했습니다.
`artifacts/CODEX_HANDOFF.md`의 이전 좌표보다 `src/data/meeting.ts`를 우선합니다.

투명 패널은 직접 투명 디스플레이와 광학 콤바이너를 모두 후보로 둡니다. 화면의 맞은편 확인면은
개념 시연이며 좌우반전·밝기·시야각·KC·패널 본체 85만 원 가정은 실물 비교와 복수 견적 전에는
확정 사양이 아닙니다. 스마트글래스는 이동형 후속 옵션입니다.
