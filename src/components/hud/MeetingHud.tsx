import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Pause,
  Play,
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
  partialText,
  speakerMap,
  startedTurns,
  type SpeakerId,
} from "@/data/meeting";
import { cn } from "@/lib/cn";
import { CaptionRail } from "./CaptionRail";
import { MiniMap } from "./MiniMap";
import { SeatField } from "./SeatField";
import { SpeakComposer } from "./SpeakComposer";

type UserCap = { id: string; text: string; confirmed: boolean };

export function MeetingHud() {
  const [playing, setPlaying] = useState(true);
  const [clock, setClock] = useState(0);
  const [gaze, setGaze] = useState<SpeakerId | null>(null);
  const [userCaps, setUserCaps] = useState<UserCap[]>([]);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [labeled, setLabeled] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setClock((c) => {
        const next = Math.min(SCRIPT_MS, c + dt);
        if (next >= SCRIPT_MS) {
          queueMicrotask(() => setPlaying(false));
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const live = useMemo(() => activeTurns(clock), [clock]);
  const history = useMemo(() => startedTurns(clock), [clock]);
  const speakingIds = useMemo(() => {
    const ids = new Set<SpeakerId>(live.map((t) => t.speakerId));
    if (userSpeaking) ids.add("self");
    return ids;
  }, [live, userSpeaking]);
  const lowIds = useMemo(() => {
    const ids = new Set<SpeakerId>();
    for (const t of live) if (t.lowConfidence) ids.add(t.speakerId);
    return ids;
  }, [live]);
  const overlapping = live.length > 1;
  const primary = live[0] ? speakerMap[live[0].speakerId] : null;
  const primaryName = primary ? displayOf(primary.id, labeled) : "대기";

  const onSeat = useCallback((id: SpeakerId) => {
    setGaze((g) => (g === id ? null : id));
  }, []);

  const jumpOverlap = () => {
    setClock(OVERLAP_MS);
    setPlaying(true);
  };

  const restart = () => {
    setClock(0);
    setUserCaps([]);
    setPreview(null);
    setPlaying(true);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted">
            시스루 글래스 · KC 주 플랫폼 · 익명 클러스터
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            누가 말하는지, 눈 앞에 붙입니다
          </h1>
          <p className="mt-1 text-xs text-subtle">
            기본은 생체정보 없음. 좌석을 눌러 시선을 고정합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Control
            onClick={() => setPlaying((p) => !p)}
            label={playing ? "일시정지" : "재생"}
            icon={playing ? Pause : Play}
          />
          <Control onClick={jumpOverlap} label="겹침 구간" icon={SkipForward} />
          <Control onClick={restart} label="처음부터" icon={RotateCcw} />
          <Control
            onClick={() => setLabeled((v) => !v)}
            label={labeled ? "익명으로" : "이름 붙이기"}
            icon={Tag}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DirectionChip
          angle={primary?.angle ?? 0}
          name={primaryName}
          overlapping={overlapping}
          speaking={speakingIds.size > 0}
        />
        <span className="rounded-md bg-surface px-2.5 py-2 text-xs text-muted">
          비저장
        </span>
        <span className="rounded-md bg-surface px-2.5 py-2 text-xs text-muted">
          {labeled ? "주최자 라벨" : "세션 클러스터"}
        </span>
      </div>

      <section className="fov relative overflow-hidden rounded-lg border border-border bg-surface">
        <SeatField
          speakingIds={speakingIds}
          gaze={gaze}
          onSeat={onSeat}
          overlapping={overlapping}
          labeled={labeled}
          lowIds={lowIds}
        />
        <MiniMap speakingIds={speakingIds} gaze={gaze} />

        {overlapping ? (
          <div className="pointer-events-none absolute left-3 top-3 sm:left-4 sm:top-4">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-elevated/90 px-2.5 py-1 text-xs font-medium text-warn ring-1 ring-warn/40">
              <AlertTriangle className="size-3.5" aria-hidden />
              겹침 · 점선은 오판을 숨기지 않음
            </span>
          </div>
        ) : null}

        {preview ? (
          <div className="absolute inset-x-4 bottom-8 rounded-md bg-bg/90 px-3 py-2.5 sm:inset-x-8">
            <p className="text-xs text-subtle">미리보기 · 아직 스피커로 나가지 않음</p>
            <p className="mt-1 text-sm leading-relaxed text-fg">{preview}</p>
          </div>
        ) : null}

        <div className="hud-progress" aria-hidden>
          <span style={{ width: `${Math.min(100, (clock / SCRIPT_MS) * 100)}%` }} />
        </div>
      </section>

      <CaptionRail
        clock={clock}
        history={history}
        gaze={gaze}
        userCaps={userCaps}
        labeled={labeled}
        partialOf={partialText}
        confirmedOf={isConfirmed}
      />

      <SpeakComposer
        speaking={userSpeaking}
        preview={preview}
        onPreview={setPreview}
        onStart={() => {
          setUserSpeaking(true);
          setPlaying(false);
        }}
        onDone={(text) => {
          setUserCaps((prev) => [
            ...prev,
            { id: `self-${Date.now()}`, text, confirmed: true },
          ]);
          setUserSpeaking(false);
        }}
        onFail={() => setUserSpeaking(false)}
      />
    </div>
  );
}

function Control({
  onClick,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  label: string;
  icon: typeof Play;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-md bg-elevated px-3 text-sm font-medium text-fg transition-transform duration-150 ease-out active:scale-[0.96]"
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
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md bg-surface px-3 py-2">
      <div className="relative h-6 w-28 shrink-0">
        <div className="absolute inset-x-3 top-1/2 h-px bg-border" />
        <span
          className={cn(
            "absolute left-1/2 top-1/2 size-2 rounded-full bg-accent transition-transform duration-200 ease-out",
            speaking ? "opacity-100" : "opacity-40",
          )}
          style={{
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-8px)`,
          }}
        />
      </div>
      <p className="text-xs tabular-nums text-fg">
        {overlapping
          ? "음원 방향 · 좌우 동시"
          : speaking
            ? `음원 방향 · ${name} · ${angleLabel(angle)}`
            : "음원 방향 · 대기"}
      </p>
    </div>
  );
}

function angleLabel(deg: number) {
  if (Math.abs(deg) < 12) return "정면";
  if (deg < 0) return `좌 ${Math.abs(deg)}°`;
  return `우 ${deg}°`;
}
