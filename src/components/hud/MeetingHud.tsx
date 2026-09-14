import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Laptop,
  MessageSquareWarning,
  Mic2,
  MonitorUp,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SkipForward,
  Tag,
} from "lucide-react";
import {
  OVERLAP_MS,
  SCRIPT_MS,
  activeTurns,
  displayOf,
  isConfirmed,
  others,
  partialText,
  roleOf,
  speakerMap,
  startedTurns,
  type SpeakerId,
  type Turn,
} from "@/data/meeting";
import { cn } from "@/lib/cn";
import { CaptionRail } from "./CaptionRail";
import { MiniMap } from "./MiniMap";
import { SeatField } from "./SeatField";
import { SpeakComposer } from "./SpeakComposer";
import { LiveTranscriber, type LiveCaption } from "./LiveTranscriber";
import { engineNotice, positioning, privacyNotice } from "@/data/product-policy";

type UserCap = { id: string; text: string; confirmed: boolean };
type ExperienceMode = "live" | "demo";
type PanelRow = {
  key: string;
  speakerId: SpeakerId;
  speaker: string;
  role: string;
  text: string;
  confirmed: boolean;
  low: boolean;
};

export function MeetingHud() {
  const [mode, setMode] = useState<ExperienceMode>("live");
  const [playing, setPlaying] = useState(false);
  const [clock, setClock] = useState(0);
  const [focusSpeaker, setFocusSpeaker] = useState<SpeakerId | null>(null);
  const [userCaps, setUserCaps] = useState<UserCap[]>([]);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [labeled, setLabeled] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [speechBusy, setSpeechBusy] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<string | null>(null);
  const [livePartial, setLivePartial] = useState("");
  const [liveCaptions, setLiveCaptions] = useState<LiveCaption[]>([]);
  const [sttListening, setSttListening] = useState(false);

  useEffect(() => {
    if (mode !== "demo" || !playing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setClock((current) => {
        const next = Math.min(SCRIPT_MS, current + dt);
        if (next >= SCRIPT_MS) {
          window.clearInterval(timer);
          queueMicrotask(() => setPlaying(false));
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [mode, playing]);

  const scriptedLive = useMemo(() => (mode === "demo" ? activeTurns(clock) : []), [clock, mode]);
  const history = useMemo(() => (mode === "demo" ? startedTurns(clock) : []), [clock, mode]);
  const speakingIds = useMemo(() => {
    const ids = new Set<SpeakerId>(scriptedLive.map((turn) => turn.speakerId));
    if (mode === "live" && livePartial) ids.add("kim");
    if (userSpeaking) ids.add("self");
    return ids;
  }, [livePartial, mode, scriptedLive, userSpeaking]);
  const lowIds = useMemo(() => {
    const ids = new Set<SpeakerId>();
    for (const turn of scriptedLive) if (turn.lowConfidence) ids.add(turn.speakerId);
    return ids;
  }, [scriptedLive]);
  const overlapping = mode === "demo" && scriptedLive.length > 1;
  const primary =
    mode === "live"
      ? speakerMap.kim
      : scriptedLive[0]
        ? speakerMap[scriptedLive[0].speakerId]
        : null;
  const primaryName =
    mode === "live"
      ? sttListening
        ? "정면 마이크"
        : "대기"
      : primary
        ? displayOf(primary.id, labeled)
        : "대기";
  const latestTurn = scriptedLive.at(-1) ?? history.at(-1) ?? null;
  const latestConfirmed = [...history].reverse().find((turn) => isConfirmed(turn, clock)) ?? null;
  const latestUserCap = userCaps.at(-1) ?? null;
  const panelCaptions = getPanelCaptions({
    userSpeaking,
    preview,
    latestUserCap: !playing ? latestUserCap : null,
    liveMode: mode === "live",
    livePartial,
    liveCaptions,
    liveTurns: scriptedLive,
    latestTurn,
    clock,
    labeled,
  });
  const reviewTarget = panelCaptions.at(-1) ?? null;
  const reviewActive = Boolean(reviewTarget && reviewRequest === reviewTarget.key);

  const onSeat = useCallback((id: SpeakerId) => {
    setFocusSpeaker((current) => (current === id ? null : id));
  }, []);

  const jumpOverlap = () => {
    setClock(OVERLAP_MS);
    setReviewRequest(null);
    setPlaying(true);
  };

  const restart = () => {
    setClock(0);
    setUserCaps([]);
    setPreview(null);
    setReviewRequest(null);
    setPlaying(true);
  };

  const showPreview = (line: string | null) => {
    setPreview(line);
  };

  const toggleReview = () => {
    if (!reviewTarget) return;
    setReviewRequest((current) => (current === reviewTarget.key ? null : reviewTarget.key));
    if (!reviewActive) setPlaying(false);
  };

  const announcement =
    mode === "live"
      ? (liveCaptions.at(-1)?.text ?? "")
      : latestConfirmed
        ? `${displayOf(latestConfirmed.speakerId, labeled)} 확정 자막. ${latestConfirmed.text}`
        : "";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>

      <section className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-panel">VOICEEYE / CLEAR DESK 01</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-balance sm:text-5xl">
            자막을 사람 사이에 놓습니다
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            노트북 위 투명 패널에 확정 자막과 발언자 위치를 띄웁니다. 얼굴과 몸짓을 보면서, 참석자도
            같은 문장을 확인하고 오인식을 표시합니다.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-subtle">
            {mode === "live"
              ? "실시간 음성→텍스트와 기기 내 텍스트→음성을 직접 시험하는 MVP입니다."
              : "저장된 회의 대본으로 겹침과 오인식 확인 흐름을 재생합니다."}{" "}
            {positioning}
          </p>
        </div>
        <SystemPath />
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-border bg-bg/55 p-1"
            aria-label="실행 모드"
          >
            <ModeControl
              active={mode === "live"}
              onClick={() => {
                setMode("live");
                setPlaying(false);
              }}
              label="실시간 회의"
              icon={Radio}
            />
            <ModeControl
              active={mode === "demo"}
              onClick={() => {
                setMode("demo");
                setClock(0);
                setPlaying(true);
              }}
              label="대본 시연"
              icon={Play}
            />
          </div>
          <DirectionChip
            angle={primary?.angle ?? 0}
            name={primaryName}
            overlapping={overlapping}
            speaking={speakingIds.size > 0}
          />
          <StatusChip label="기본 비저장" />
          <StatusChip label={labeled ? "주최자 라벨" : "익명 클러스터"} />
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "demo" ? (
            <>
              <Control
                onClick={() => setPlaying((value) => !value)}
                label={playing ? "일시정지" : "재생"}
                icon={playing ? Pause : Play}
                disabled={speechBusy}
              />
              <Control
                onClick={jumpOverlap}
                label="겹침 보기"
                icon={SkipForward}
                disabled={speechBusy}
              />
              <Control onClick={restart} label="처음부터" icon={RotateCcw} disabled={speechBusy} />
            </>
          ) : null}
          <Control
            onClick={() => setLabeled((value) => !value)}
            label={labeled ? "익명으로" : "이름 붙이기"}
            icon={Tag}
          />
        </div>
      </div>

      <p className="text-xs text-muted">{privacyNotice}</p>

      {mode === "live" ? (
        <LiveTranscriber
          disabled={speechBusy}
          onPartial={setLivePartial}
          onFinal={(caption) => {
            setLiveCaptions((current) => [...current, caption].slice(-20));
            setLivePartial("");
          }}
          onListeningChange={setSttListening}
        />
      ) : null}

      <section aria-label="투명 공유 자막 패널" className="device-rig">
        <div className="clear-panel-frame">
          <span className="panel-fastener panel-fastener-left" aria-hidden />
          <span className="panel-fastener panel-fastener-right" aria-hidden />
          <div className="panel-status" aria-hidden>
            <span>VOICEEYE · SHARED CAPTION</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-pass shadow-[0_0_10px_var(--color-pass)]" />
              {mode === "live" ? "실시간 자막면" : "참석자 확인면 개념 시연"}
            </span>
          </div>

          <SeatField
            speakingIds={speakingIds}
            focusSpeaker={focusSpeaker}
            onSeat={onSeat}
            overlapping={overlapping}
            labeled={labeled}
            lowIds={lowIds}
          />
          <MiniMap speakingIds={speakingIds} focusSpeaker={focusSpeaker} />

          {overlapping ? (
            <div className="overlap-notice pointer-events-none absolute top-11 left-3 z-10 sm:left-5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-elevated/95 px-2.5 py-1 text-xs font-medium text-warn ring-1 ring-warn/50">
                <AlertTriangle className="size-3.5" aria-hidden />
                동시 발언 · 위치 확인 필요
              </span>
            </div>
          ) : null}

          <PanelCaption captions={panelCaptions} flaggedKey={reviewRequest} />

          {mode === "demo" ? (
            <div className="hud-progress" aria-hidden>
              <span style={{ width: `${Math.min(100, (clock / SCRIPT_MS) * 100)}%` }} />
            </div>
          ) : null}
        </div>
        <div className="panel-neck" aria-hidden />
        <div className="panel-foot" aria-hidden />

        <div className="priority-strip" aria-label="화자 자막 우선 선택">
          <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-panel">
            CAPTION PRIORITY
          </p>
          <div className="flex flex-wrap gap-2">
            {others.map((speaker) => (
              <button
                key={speaker.id}
                type="button"
                aria-pressed={focusSpeaker === speaker.id}
                onClick={() => onSeat(speaker.id)}
                className={cn(
                  "min-h-11 rounded-lg border px-3 text-xs font-medium transition-colors duration-150",
                  focusSpeaker === speaker.id
                    ? "border-panel bg-panel text-bg"
                    : "border-border bg-elevated text-fg hover:border-panel/60",
                )}
              >
                {displayOf(speaker.id, labeled)} 우선
              </button>
            ))}
          </div>
        </div>

        <div className="panel-actions">
          <div className="min-w-0">
            <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-panel">
              ATTENDEE CHECK
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              참석자가 현재 문장을 확인합니다. 틀리면 표시하고 발화를 멈춰 다시 확인합니다.
            </p>
          </div>
          <button
            type="button"
            disabled={!reviewTarget || reviewTarget.speakerId === "self"}
            aria-pressed={reviewActive}
            onClick={toggleReview}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
              reviewActive
                ? "border-warn bg-warn text-bg"
                : "border-border bg-elevated text-fg hover:border-warn/70",
            )}
          >
            {reviewActive ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <MessageSquareWarning className="size-4" aria-hidden />
            )}
            {reviewActive ? "확인 요청됨" : "오인식 표시"}
          </button>
        </div>
      </section>

      <SpeakComposer
        speaking={userSpeaking}
        preview={preview}
        onPreview={showPreview}
        onBusy={(busy) => {
          setSpeechBusy(busy);
          if (busy && mode === "demo") {
            setPlaying(false);
          }
        }}
        onStart={() => {
          setUserSpeaking(true);
          if (mode === "demo") setPlaying(false);
        }}
        onDone={(text) => {
          setUserCaps((current) => [
            ...current,
            { id: `self-${Date.now()}`, text, confirmed: true },
          ]);
          setUserSpeaking(false);
        }}
        onFail={(message) => {
          setUserSpeaking(false);
          void message;
        }}
      />

      {mode === "demo" ? (
        <CaptionRail
          clock={clock}
          history={history}
          focusSpeaker={focusSpeaker}
          userCaps={userCaps}
          labeled={labeled}
          partialOf={partialText}
          confirmedOf={isConfirmed}
        />
      ) : (
        <LiveCaptionRail captions={liveCaptions} partial={livePartial} userCaps={userCaps} />
      )}
      <ProductFocus />
      <p className="text-xs text-muted">{engineNotice}</p>
    </div>
  );
}

function getPanelCaptions({
  userSpeaking,
  preview,
  latestUserCap,
  liveMode,
  livePartial,
  liveCaptions,
  liveTurns,
  latestTurn,
  clock,
  labeled,
}: {
  userSpeaking: boolean;
  preview: string | null;
  latestUserCap: UserCap | null;
  liveMode: boolean;
  livePartial: string;
  liveCaptions: LiveCaption[];
  liveTurns: Turn[];
  latestTurn: Turn | null;
  clock: number;
  labeled: boolean;
}) {
  if (userSpeaking && preview) {
    return [
      {
        key: "self-live",
        speakerId: "self" as const,
        speaker: "나 · 스피커 출력 중",
        role: "확인 후 공개",
        text: preview,
        confirmed: true,
        low: false,
      },
    ];
  }
  if (liveMode && livePartial) {
    return [
      {
        key: "live-partial",
        speakerId: "kim" as const,
        speaker: "마이크 입력",
        role: "실시간 음성 인식",
        text: livePartial,
        confirmed: false,
        low: false,
      },
    ];
  }
  const latestLiveCaption = liveCaptions.at(-1);
  if (liveMode && latestLiveCaption) {
    return [
      {
        key: latestLiveCaption.id,
        speakerId: "kim" as const,
        speaker: "마이크 입력",
        role: "실시간 음성 인식",
        text: latestLiveCaption.text,
        confirmed: true,
        low: latestLiveCaption.confidence !== null && latestLiveCaption.confidence < 0.62,
      },
    ];
  }
  if (latestUserCap) {
    return [
      {
        key: latestUserCap.id,
        speakerId: "self" as const,
        speaker: "나",
        role: "스피커 출력 완료",
        text: latestUserCap.text,
        confirmed: true,
        low: false,
      },
    ];
  }
  const visibleTurns = liveTurns.length > 0 ? liveTurns : latestTurn ? [latestTurn] : [];
  return visibleTurns.map((turn): PanelRow => ({
    key: turn.id,
    speakerId: turn.speakerId,
    speaker: displayOf(turn.speakerId, labeled),
    role: roleOf(turn.speakerId, labeled),
    text: partialText(turn, clock),
    confirmed: isConfirmed(turn, clock),
    low: Boolean(turn.lowConfidence),
  }));
}

function LiveCaptionRail({
  captions,
  partial,
  userCaps,
}: {
  captions: LiveCaption[];
  partial: string;
  userCaps: UserCap[];
}) {
  const rows = [
    ...captions.map((caption) => ({
      key: caption.id,
      speaker: "마이크 입력",
      text: caption.text,
      status: "확정",
      low: caption.confidence !== null && caption.confidence < 0.62,
    })),
    ...userCaps.map((caption) => ({
      key: caption.id,
      speaker: "나 · 스피커",
      text: caption.text,
      status: "재생 완료",
      low: false,
    })),
    ...(partial
      ? [{ key: "partial", speaker: "마이크 입력", text: partial, status: "인식 중", low: false }]
      : []),
  ].slice(-8);

  return (
    <section
      className="rounded-lg border border-border bg-surface p-3 sm:p-4"
      aria-labelledby="live-log-title"
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="live-log-title" className="text-sm font-semibold">
          실시간 회의 기록
        </h2>
        <p className="text-xs text-subtle">메모리에만 유지 · 최대 20문장</p>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          마이크를 켜면 확정된 문장이 여기에 쌓입니다.
        </p>
      ) : (
        <ul className="space-y-2" aria-live="polite">
          {rows.map((row) => (
            <li
              key={row.key}
              className={cn(
                "flex gap-2.5 rounded-md bg-elevated px-3 py-2.5",
                row.low && "caption-low",
              )}
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-panel" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-fg">{row.speaker}</span>
                  <span className={row.status === "인식 중" ? "text-muted" : "text-pass"}>
                    {row.status}
                  </span>
                  {row.low ? <span className="font-medium text-warn">다시 확인</span> : null}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-pretty">{row.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PanelCaption({
  captions,
  flaggedKey,
}: {
  captions: PanelRow[];
  flaggedKey: string | null;
}) {
  const needsReview = captions.some((caption) => caption.low || caption.key === flaggedKey);
  return (
    <div className={cn("panel-caption", needsReview && "is-review")}>
      {captions.length > 0 ? (
        <div className="space-y-2">
          {captions.map((caption) => (
            <div key={caption.key} className="panel-caption-row">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  data-spk={caption.speakerId}
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <span className="spk-dot size-2 rounded-full" aria-hidden />
                  {caption.speaker}
                </span>
                <span className="text-xs text-panel-muted">{caption.role}</span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    caption.confirmed ? "text-pass" : "text-panel-muted",
                  )}
                >
                  {caption.confirmed ? "확정" : "인식 중"}
                </span>
                {caption.key === flaggedKey ? (
                  <span className="text-xs font-semibold text-warn">오인식 확인 요청</span>
                ) : null}
              </div>
              <p className="mt-1 text-[clamp(1rem,2.25vw,1.65rem)] font-medium leading-[1.38] tracking-[-0.02em] text-white text-pretty">
                {caption.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-panel-muted">
          <span className="size-1.5 rounded-full bg-panel" aria-hidden />
          회의 자막을 기다리는 중
        </div>
      )}
    </div>
  );
}

function SystemPath() {
  return (
    <div
      className="system-path"
      aria-label="테이블 마이크에서 노트북을 거쳐 투명 패널로 이어지는 구성"
    >
      <PathNode icon={Mic2} label="테이블 마이크" />
      <span className="h-px w-5 bg-border" aria-hidden />
      <PathNode icon={Laptop} label="노트북 처리" />
      <span className="h-px w-5 bg-border" aria-hidden />
      <PathNode icon={MonitorUp} label="투명 공유면" />
    </div>
  );
}

function ProductFocus() {
  return (
    <section className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
      <div>
        <p className="font-mono text-xs tracking-[0.14em] text-panel">PRODUCT FOCUS</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-balance">
          패널 자체보다, 같은 방향의 두 사람을 구분하는 회의 경험
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          투명 양면 자막과 360° 음원 방향 표시는 이미 상용화되어 있습니다. 다음 개발 초점은 카메라의
          세션 한정 얼굴 추적과 음원 방향을 결합해, 같은 방향·동시 발화에서도 사람 단위로 자막을
          연결하고 참석자가 오류를 바로 표시하게 만드는 것입니다.
        </p>
      </div>
      <div className="grid gap-2 text-sm">
        <FocusMetric label="기준 제품" value="투명 자막 · 360° 방향" />
        <FocusMetric label="보이스아이 목표" value="동일 방향 복수 화자 분리" />
        <FocusMetric label="현재 상태" value="마이크·기기 TTS MVP · 화자 융합 실증 전" />
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs">
          <a
            className="text-panel underline-offset-4 hover:underline"
            href="https://www.j-display.com/en/product_tech/raelclear.html"
            target="_blank"
            rel="noreferrer"
          >
            JDI 투명 패널 근거
          </a>
          <a
            className="text-panel underline-offset-4 hover:underline"
            href="https://vuevo.net/service/"
            target="_blank"
            rel="noreferrer"
          >
            VUEVO 방향 자막 근거
          </a>
        </div>
      </div>
    </section>
  );
}

function FocusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
      <span className="text-xs text-subtle">{label}</span>
      <span className="text-right text-xs font-medium text-fg">{value}</span>
    </div>
  );
}

function PathNode({ icon: Icon, label }: { icon: typeof Mic2; label: string }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap text-xs text-muted">
      <span className="grid size-8 place-items-center rounded-md border border-border bg-elevated">
        <Icon className="size-4 text-panel" aria-hidden />
      </span>
      {label}
    </span>
  );
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-border bg-bg/60 px-2.5 py-2 text-xs text-muted">
      {label}
    </span>
  );
}

function ModeControl({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: typeof Play;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors duration-150",
        active ? "bg-elevated text-fg shadow-sm" : "text-muted hover:text-fg",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}

function Control({
  onClick,
  label,
  icon: Icon,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  icon: typeof Play;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-md bg-elevated px-3 text-sm font-medium text-fg transition-colors duration-150 hover:bg-border active:bg-border disabled:opacity-40"
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}

function DirectionChip({
  angle,
  name,
  overlapping,
  speaking,
}: {
  angle: number;
  name: string;
  overlapping: boolean;
  speaking: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-bg/60 px-3 py-2">
      <div className="relative h-6 w-20 shrink-0" aria-hidden>
        <div className="absolute inset-x-2 top-1/2 h-px bg-border" />
        <span
          className={cn(
            "absolute top-1/2 left-1/2 size-2 rounded-full bg-panel transition-transform duration-200 ease-out",
            speaking ? "opacity-100" : "opacity-40",
          )}
          style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-8px)` }}
        />
      </div>
      <p className="whitespace-nowrap text-xs tabular-nums text-fg">
        {overlapping
          ? "음원 위치 · 좌우 동시"
          : speaking
            ? `${name} · ${angleLabel(angle)}`
            : "음원 위치 · 대기"}
      </p>
    </div>
  );
}

function angleLabel(deg: number) {
  if (Math.abs(deg) < 12) return "정면";
  if (deg < 0) return `좌 ${Math.abs(deg)}°`;
  return `우 ${deg}°`;
}
