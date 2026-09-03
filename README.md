# 보이스아이 (VoiceEye) MVP

청각장애인 회의접근성 — 시스루 글래스 HUD 데모.

- 시야 자막
- 누가 말하는지 얼굴에 표시 (익명 클러스터 기본)
- 키보드 입력 → 렌즈 미리보기 → 확인 후 스피커 TTS
- 사업계획 v2 · ASR 실측 벤치

## 팀원용 바로 열기

**사이트:** https://nenae16-creator.github.io/voiceeye-mvp/

| 페이지 | 주소 |
|---|---|
| 회의 HUD | https://nenae16-creator.github.io/voiceeye-mvp/ |
| 사업계획 v2 | https://nenae16-creator.github.io/voiceeye-mvp/plan |
| 인식률 벤치 | https://nenae16-creator.github.io/voiceeye-mvp/bench |

HUD에서 해볼 것: 재생 → 겹침 구간 → 얼굴 클릭(시선 고정) → 이름 붙이기 → 프리셋 미리보기.

키보드 TTS는 GitHub Pages에 서버 키가 없어 소리가 안 날 수 있습니다. HUD·자막·계획서는 그대로 동작합니다.

## 로컬

```bash
npm install
npm run dev
```

`XAI_API_KEY`가 있으면 TTS/STT가 살아납니다.
