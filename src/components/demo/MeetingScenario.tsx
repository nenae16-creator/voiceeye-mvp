import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Mic, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import roomImage from "../../assets/meeting-people.jpg";
import { PRESENTATION_DURATION_MS } from "../../data/presentation-scenario";
import {
  appendRecords,
  completedDemoRecords,
  demoFrame,
  meetingSeats,
  meetingTime,
  recordText,
  type MeetingRecord,
} from "../../lib/meeting-demo";
import { LiveTranscriber, type LiveCaption } from "../hud/LiveTranscriber";
import { MeetingChat } from "./MeetingChat";

type PanelCaption = {
  speaker: string;
  text: string;
  final: boolean;
  source: "microphone" | "keyboard";
};

export function MeetingScenario({ portable = false }: { portable?: boolean }) {
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [session, setSession] = useState(0);
  const [muted, setMuted] = useState(false);
  const [audioWarning, setAudioWarning] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [panelOverride, setPanelOverride] = useState<PanelCaption | null>(null);
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const lastTickRef = useRef(0);
  const runningRef = useRef(false);
  const selectedSeatRef = useRef<string | null>(null);
  const sampleAudioRef = useRef(new Set<HTMLAudioElement>());
  const recordListRef = useRef<HTMLDivElement>(null);
  const frame = useMemo(() => demoFrame(elapsed, started), [elapsed, started]);
  selectedSeatRef.current = selectedSeat;
  runningRef.current = running;

  const pause = useCallback(() => {
    runningRef.current = false;
    sampleAudioRef.current.forEach((audio) => audio.pause());
    sampleAudioRef.current.clear();
    window.speechSynthesis?.cancel();
    setRunning(false);
  }, []);

  useEffect(() => {
    if (!running) return;
    lastTickRef.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setElapsed((value) => Math.min(PRESENTATION_DURATION_MS, value + delta));
    }, 80);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (elapsed >= PRESENTATION_DURATION_MS) setRunning(false);
    if (!started) return;
    const incoming = completedDemoRecords(elapsed);
    if (incoming.length) setRecords((current) => appendRecords(current, incoming));
  }, [elapsed, started]);

  useEffect(() => {
    if (!running || muted || mode !== "demo" || frame.privateStep) return;
    let active = true;
    const created: HTMLAudioElement[] = [];
    const timers = frame.lines
      .filter((line) => line.audioSrc && frame.relative < line.endsAt)
      .map((line) =>
        window.setTimeout(
          () => {
            if (!runningRef.current) return;
            const audio = new Audio(line.audioSrc);
            audio.currentTime = Math.max(0, frame.relative - line.startsAt) / 1000;
            created.push(audio);
            sampleAudioRef.current.add(audio);
            audio.onended = () => sampleAudioRef.current.delete(audio);
            audio.onerror = () => {
              sampleAudioRef.current.delete(audio);
              if (active) setAudioWarning(true);
            };
            void audio.play().catch(() => {
              if (active) setAudioWarning(true);
            });
          },
          Math.max(0, line.startsAt - frame.relative),
        ),
      );
    return () => {
      active = false;
      timers.forEach((timer) => window.clearTimeout(timer));
      created.forEach((audio) => {
        audio.pause();
        sampleAudioRef.current.delete(audio);
      });
    };
    // Resume the sample from the matching position in the scenario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.index, running, muted, mode, session]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => {
    const element = recordListRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [records.length]);

  function start() {
    pause();
    setPanelOverride(null);
    setAudioWarning(false);
    setMode("demo");
    setElapsed(0);
    setStarted(true);
    setRunning(true);
    setSession((value) => value + 1);
    setRecords((current) => current.filter((item) => item.source !== "demo"));
  }

  function toggleRun() {
    setPanelOverride(null);
    if (!started || elapsed >= PRESENTATION_DURATION_MS) start();
    else if (running) pause();
    else setRunning(true);
  }

  const onBusy = useCallback(
    (busy: boolean) => {
      if (busy) pause();
      setChatBusy(busy);
    },
    [pause],
  );
  const onStarted = useCallback(
    (text: string) => setPanelOverride({ speaker: "나", text, final: false, source: "keyboard" }),
    [],
  );
  const onCompleted = useCallback((text: string) => {
    setPanelOverride({ speaker: "나", text, final: true, source: "keyboard" });
    setRecords((current) =>
      appendRecords(current, [
        {
          id: `keyboard-${Date.now()}`,
          time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
          speaker: "나",
          text,
          source: "keyboard",
        },
      ]),
    );
  }, []);
  const onPartial = useCallback((text: string) => {
    if (text)
      setPanelOverride({
        speaker: selectedSeatRef.current ? `화자 ${selectedSeatRef.current}` : "화자 미확정",
        text,
        final: false,
        source: "microphone",
      });
  }, []);
  const onFinal = useCallback((caption: LiveCaption) => {
    const speaker = selectedSeatRef.current ? `화자 ${selectedSeatRef.current}` : "화자 미확정";
    setPanelOverride({ speaker, text: caption.text, final: true, source: "microphone" });
    setRecords((current) =>
      appendRecords(current, [
        {
          id: caption.id,
          time: new Date(caption.createdAt).toLocaleTimeString("en-GB", { hour12: false }),
          speaker,
          text: caption.text,
          source: "microphone",
        },
      ]),
    );
  }, []);

  function saveRecords() {
    const url = URL.createObjectURL(
      new Blob([recordText(records)], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "VoiceEye_회의기록.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const demoLines = frame.lines.filter((line) => line.visible);
  const activeSeats = panelOverride
    ? mode === "live" && listening && panelOverride.source === "microphone" && selectedSeat
      ? [selectedSeat]
      : []
    : started && running && mode === "demo"
      ? frame.lines.filter((line) => line.talking).map((line) => line.seatId)
      : [];
  const panelTalking = panelOverride
    ? chatBusy || (listening && !panelOverride.final)
    : running && frame.lines.some((line) => line.talking);

  return (
    <main className="meeting-page">
      <header className="meeting-header">
        <div className="meeting-brand">
          <strong>VoiceEye</strong>
          <span>상담 일정 조정 회의</span>
        </div>
        <div className="meeting-mode-tabs" aria-label="자막 입력 방식">
          <button
            aria-pressed={mode === "demo"}
            disabled={chatBusy}
            onClick={() => {
              pause();
              setMode("demo");
              setPanelOverride(null);
            }}
          >
            회의 시연
          </button>
          <button
            aria-pressed={mode === "live"}
            disabled={chatBusy}
            onClick={() => {
              pause();
              setMode("live");
              setPanelOverride(null);
            }}
          >
            마이크 자막
          </button>
        </div>
      </header>
      <div className="meeting-workspace">
        <section className="meeting-panel-column" aria-label="회의실과 자막 패널">
          <div className="meeting-stage">
            <img
              className="meeting-room-photo"
              src={roomImage}
              alt="회의실 탁자에 앉아 대화하는 다섯 명의 참석자 예시"
            />
            <div className="meeting-stage-top">
              <span className="meeting-scene-badge">회의실 예시 이미지</span>
              <span className="meeting-source-badge">
                {mode === "demo" ? "합성 음성·대본 자막 시연" : "실제 마이크 · 좌석 수동 지정"}
              </span>
            </div>
            {meetingSeats.map((seat) => (
              <button
                key={seat.id}
                type="button"
                className={`meeting-person ${activeSeats.includes(seat.id) ? "is-speaking" : ""} ${mode === "live" && selectedSeat === seat.id ? "is-selected" : ""}`}
                style={{
                  left: `${seat.x}%`,
                  top: `${seat.y}%`,
                  width: `${seat.w}%`,
                  height: `${seat.h}%`,
                }}
                disabled={mode === "demo"}
                aria-label={`${seat.name} 좌석 선택`}
                aria-pressed={selectedSeat === seat.id}
                onClick={() => setSelectedSeat(seat.id)}
              >
                <span>
                  {seat.name}
                  {activeSeats.includes(seat.id) && (
                    <b>{mode === "live" ? "선택 좌석" : "말하는 중"}</b>
                  )}
                </span>
              </button>
            ))}
            <div className="meeting-glass-panel" aria-live="polite" aria-atomic="true">
              <div className="meeting-panel-status">
                <span>
                  <i className={panelTalking ? "is-on" : ""} />
                  {panelOverride
                    ? panelOverride.source === "keyboard"
                      ? chatBusy
                        ? "입력 문장을 음성으로 전달 중"
                        : "내 발언"
                      : panelOverride.final
                        ? "자막 확정"
                        : "음성 → 글자 변환 중"
                    : !started || mode === "live"
                      ? mode === "live"
                        ? "마이크를 켜고 말씀하세요"
                        : "회의 시연 준비"
                      : frame.privateStep
                        ? "참석자가 의견을 입력하고 있습니다"
                        : panelTalking
                          ? "대본 음성 → 자막 표시 중"
                          : frame.step.warning
                            ? "확인할 구간"
                            : "자막 확정"}
                </span>
                <div className={`meeting-wave ${panelTalking ? "is-active" : ""}`} aria-hidden>
                  {Array.from({ length: 12 }, (_, index) => (
                    <i key={index} style={{ animationDelay: `${index * 75}ms` }} />
                  ))}
                </div>
              </div>
              {panelOverride ? (
                <div className="meeting-caption-line">
                  <strong>{panelOverride.speaker}</strong>
                  <p>
                    {panelOverride.text}
                    <em>{!panelOverride.final && "▌"}</em>
                  </p>
                </div>
              ) : mode === "live" ? (
                <p className="meeting-panel-empty">마이크로 들어온 말이 이곳에 표시됩니다.</p>
              ) : !started ? (
                <div className="meeting-panel-empty">
                  <strong>누가 말하는지, 어떤 말인지 함께 봅니다.</strong>
                  <p>회의를 시작하면 발언 위치와 자막이 나타납니다.</p>
                </div>
              ) : frame.privateStep ? (
                <p className="meeting-panel-empty">작성 중인 문장은 상대방에게 보이지 않습니다.</p>
              ) : demoLines.length ? (
                demoLines.map((line) => (
                  <div className="meeting-caption-line" key={line.id}>
                    <strong>{line.speaker}</strong>
                    <p>
                      {line.text}
                      <em>{!line.final && "▌"}</em>
                    </p>
                  </div>
                ))
              ) : (
                <p className="meeting-panel-empty">말소리를 듣고 있습니다…</p>
              )}
            </div>
          </div>
          <div className="meeting-playback-bar">
            <div>
              <span className="meeting-playback-label">
                {mode === "demo"
                  ? started
                    ? frame.step.label
                    : "80초 회의 시나리오"
                  : listening
                    ? "마이크 연결 중"
                    : "마이크 자막"}
              </span>
              <span className="meeting-time">
                {meetingTime(elapsed)} / 01:20{audioWarning && " · 음성 재생을 확인해 주세요"}
              </span>
            </div>
            <div className="meeting-playback-buttons">
              {mode === "demo" && (
                <>
                  <button className="meeting-play-button" disabled={chatBusy} onClick={toggleRun}>
                    {running ? <Pause aria-hidden /> : <Play aria-hidden />}
                    {!started || elapsed >= PRESENTATION_DURATION_MS
                      ? "회의 시연 시작"
                      : running
                        ? "잠시 멈춤"
                        : "계속 진행"}
                  </button>
                  <button
                    className="meeting-icon-button"
                    disabled={chatBusy}
                    onClick={start}
                    aria-label="처음부터 다시 시연"
                  >
                    <RotateCcw aria-hidden />
                  </button>
                  <button
                    className="meeting-icon-button"
                    disabled={chatBusy}
                    onClick={() => {
                      sampleAudioRef.current.forEach((audio) => audio.pause());
                      setMuted((value) => !value);
                    }}
                    aria-label={muted ? "시연 음성 켜기" : "시연 음성 끄기"}
                  >
                    {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
                  </button>
                </>
              )}
            </div>
          </div>
          <section className="meeting-records" aria-labelledby="meeting-records-title">
            <div className="meeting-section-title">
              <h2 id="meeting-records-title">
                회의 기록 <span>{records.length}</span>
              </h2>
              <button disabled={!records.length} onClick={saveRecords}>
                <Download aria-hidden /> 텍스트 저장
              </button>
            </div>
            <div ref={recordListRef} className="meeting-record-list" aria-live="polite">
              {!records.length ? (
                <p className="meeting-record-empty">
                  확정된 자막과 음성으로 전달한 문장이 이곳에 쌓입니다.
                </p>
              ) : (
                records.map((record) => (
                  <article key={record.id} className="meeting-record">
                    <time>{record.time}</time>
                    <div>
                      <header>
                        <strong>{record.speaker}</strong>
                        <span>
                          {record.source === "demo"
                            ? "대본 시연"
                            : record.source === "keyboard"
                              ? "키보드 발언"
                              : "마이크 자막"}
                        </span>
                      </header>
                      <p>{record.text}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
        <aside className="meeting-sidebar">
          <MeetingChat onBusy={onBusy} onStarted={onStarted} onCompleted={onCompleted} />
          <section className="meeting-input-info">
            <h2>
              <Mic aria-hidden /> 마이크로 직접 말하기
            </h2>
            {mode === "demo" ? (
              <>
                <p>직접 음성을 자막으로 바꾸려면 마이크 자막으로 전환하세요.</p>
                <button
                  onClick={() => {
                    pause();
                    setMode("live");
                    setPanelOverride(null);
                  }}
                  disabled={chatBusy}
                >
                  마이크 자막으로 전환
                </button>
              </>
            ) : (
              <>
                <p>발언자의 좌석을 직접 선택합니다. 자동 화자 판정은 연결하지 않았습니다.</p>
                <div className="meeting-seat-picker">
                  <button aria-pressed={!selectedSeat} onClick={() => setSelectedSeat(null)}>
                    미확정
                  </button>
                  {meetingSeats.map((seat) => (
                    <button
                      key={seat.id}
                      aria-pressed={selectedSeat === seat.id}
                      onClick={() => setSelectedSeat(seat.id)}
                    >
                      {seat.id}
                    </button>
                  ))}
                </div>
              </>
            )}
            <LiveTranscriber
              compact
              disabled={mode !== "live" || chatBusy}
              onPartial={onPartial}
              onFinal={onFinal}
              onListeningChange={setListening}
            />
          </section>
          <p className="meeting-scope-note">
            시연 화면의 발언 위치는 대본에 지정된 좌석입니다. 실제 마이크 인식률과 자동 화자 판정
            성능을 보여 주는 시연은 아닙니다.
          </p>
          {!portable && (
            <a className="meeting-lab-link" href={`${import.meta.env.BASE_URL}lab`}>
              전체 기능 점검 화면
            </a>
          )}
        </aside>
      </div>
    </main>
  );
}
