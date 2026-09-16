import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  PRESENTATION_DURATION_MS,
  presentationDisclosure,
  presentationScenario,
  scenarioStepAt,
  type ScenarioLine,
} from "@/data/presentation-scenario";

const TICK_MS = 80;

export function MeetingScenario() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const lastTickRef = useRef(0);
  const spokenStepRef = useRef(-1);
  const { index, step } = useMemo(() => scenarioStepAt(elapsed), [elapsed]);
  const progress = Math.min(100, (elapsed / PRESENTATION_DURATION_MS) * 100);

  useEffect(() => {
    if (!running) return;
    lastTickRef.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setElapsed((current) => {
        const next = Math.min(PRESENTATION_DURATION_MS, current + delta);
        if (next >= PRESENTATION_DURATION_MS) queueMicrotask(() => setRunning(false));
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || muted || spokenStepRef.current === index || !step.voiceText) return;
    spokenStepRef.current = index;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(step.voiceText);
    const voices = synth.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ko")) ?? null;
    utterance.lang = "ko-KR";
    utterance.rate = index === 6 ? 0.94 : 1.04;
    utterance.pitch = index % 2 === 0 ? 1 : 0.92;
    synth.speak(utterance);
    return () => synth.cancel();
  }, [index, muted, running, step.voiceText]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function start() {
    window.speechSynthesis?.cancel();
    spokenStepRef.current = -1;
    setElapsed(0);
    setStarted(true);
    setRunning(true);
  }

  function toggleRun() {
    if (!started || elapsed >= PRESENTATION_DURATION_MS) {
      start();
      return;
    }
    if (running) window.speechSynthesis?.cancel();
    if (!running) spokenStepRef.current = -1;
    setRunning((value) => !value);
  }

  function restart() {
    start();
  }

  return (
    <main className="scenario-page">
      <header className="scenario-header">
        <div>
          <p className="scenario-brand">VOICEEYE</p>
          <h1>회의가 보이면, 의견을 놓치지 않습니다</h1>
        </div>
        <div className="scenario-header-actions">
          <span className="scenario-disclosure">{presentationDisclosure}</span>
          <Link to="/lab" className="scenario-text-link">
            기능 점검 화면
          </Link>
        </div>
      </header>

      <section className="scenario-shell" aria-label="보이스아이 회의 시연">
        <div className="scenario-main">
          <div className="scenario-meta">
            <div>
              <span>회의 안건</span>
              <strong>신규 상담 일정과 안내 방식</strong>
            </div>
            <div>
              <span>현재 단계</span>
              <strong>{started ? `${index + 1} / ${presentationScenario.length}` : "준비"}</strong>
            </div>
          </div>

          <div className="scenario-room">
            <Seat name="박민준" role="상담 담당" side="left" active={step.lines.some((line) => line.seat === "left")} />
            <Seat name="김서연" role="진행" side="center" active={step.lines.some((line) => line.seat === "center")} />
            <Seat name="정유진" role="운영 지원" side="right" active={step.lines.some((line) => line.seat === "right")} />

            <div className="scenario-caption" aria-live="polite">
              {!started ? (
                <div className="scenario-start-copy">
                  <span>80초 회의 시연</span>
                  <h2>버튼을 누르면 회의가 자동으로 진행됩니다</h2>
                  <p>발언, 동시 발언 확인, 비공개 작성, 음성 전달까지 한 흐름으로 보여 줍니다.</p>
                </div>
              ) : (
                <>
                  <div className="scenario-caption-head">
                    <span>{step.label}</span>
                    {step.warning ? <em>확인 필요</em> : <em className="is-ok">진행 중</em>}
                  </div>
                  <h2>{step.title}</h2>
                  <div className="scenario-lines">
                    {step.lines.map((line) => (
                      <CaptionLine key={`${line.speaker}-${line.text}`} line={line} />
                    ))}
                  </div>
                  <p className="scenario-note">{step.note}</p>
                </>
              )}
            </div>

            <div className={`scenario-self ${step.lines.some((line) => line.seat === "self") ? "is-active" : ""}`}>
              <span>나</span>
              <small>키보드 발언</small>
            </div>
          </div>

          <div className={`scenario-compose ${step.draft ? "is-visible" : ""}`}>
            <div>
              <span>{index === 5 ? "비공개 미리보기" : "내 발언 작성"}</span>
              <p>{step.draft ?? "작성 중인 문장은 나만 볼 수 있습니다."}</p>
            </div>
            <strong>{index >= 6 ? "스피커 전달" : index === 5 ? "확인 완료" : "비공개"}</strong>
          </div>
        </div>

        <aside className="scenario-side">
          <div className="scenario-time">
            <span>진행 시간</span>
            <strong>{formatTime(elapsed)}</strong>
          </div>
          <ol className="scenario-steps">
            {presentationScenario.map((item, itemIndex) => (
              <li key={item.startMs} className={itemIndex === index && started ? "is-current" : itemIndex < index && started ? "is-done" : ""}>
                <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                <p>{item.label}</p>
              </li>
            ))}
          </ol>
          <div className="scenario-controls">
            <button type="button" className="scenario-primary" onClick={toggleRun}>
              {running ? <Pause aria-hidden /> : <Play aria-hidden />}
              {!started || elapsed >= PRESENTATION_DURATION_MS ? "회의 시연 시작" : running ? "잠시 멈춤" : "계속 진행"}
            </button>
            <button type="button" onClick={restart} aria-label="처음부터 다시 시작">
              <RotateCcw aria-hidden />
            </button>
            <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "음성 켜기" : "음성 끄기"}>
              {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
            </button>
          </div>
        </aside>
      </section>

      <div className="scenario-progress" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>
    </main>
  );
}

function CaptionLine({ line }: { line: ScenarioLine }) {
  return (
    <div className={`scenario-line seat-${line.seat}`}>
      <span>{line.speaker}</span>
      <p>{line.text}</p>
    </div>
  );
}

function Seat({ name, role, side, active }: { name: string; role: string; side: string; active: boolean }) {
  return (
    <div className={`scenario-seat seat-${side} ${active ? "is-active" : ""}`}>
      <span>{name.slice(0, 1)}</span>
      <div>
        <strong>{name}</strong>
        <small>{role}</small>
      </div>
    </div>
  );
}

function formatTime(elapsedMs: number) {
  const seconds = Math.min(80, Math.floor(elapsedMs / 1000));
  return `0:${String(seconds).padStart(2, "0")}`;
}
