import { displayOf, others, roleOf, type SpeakerId } from "@/data/meeting";
import { cn } from "@/lib/cn";

export function SeatField({
  speakingIds,
  gaze,
  onSeat,
  overlapping,
  labeled,
  lowIds,
}: {
  speakingIds: Set<SpeakerId>;
  gaze: SpeakerId | null;
  onSeat: (id: SpeakerId) => void;
  overlapping: boolean;
  labeled: boolean;
  lowIds: Set<SpeakerId>;
}) {
  return (
    <div className="relative aspect-video w-full">
      <img
        src={`${import.meta.env.BASE_URL}hud/meeting-people.jpg`}
        alt="회의 테이블에 앉은 다섯 명, 착용자 시점"
        className="absolute inset-0 size-full object-cover object-center"
        crossOrigin="anonymous"
      />
      <div className="fov-vignette absolute inset-0" />

      {others.map((s) => {
        const speaking = speakingIds.has(s.id);
        const locked = gaze === s.id;
        const dimmed = gaze !== null && !locked && !speaking;
        const low = lowIds.has(s.id);
        return (
          <button
            key={s.id}
            type="button"
            data-spk={s.id}
            onClick={() => onSeat(s.id)}
            aria-pressed={locked}
            aria-label={`${displayOf(s.id, labeled)} ${roleOf(s.id, labeled)}${speaking ? ", 발언 중" : ""}${low ? ", 신뢰도 낮음" : ""}`}
            className={cn("seat-pin", locked && "is-gaze")}
            style={{
              left: `${s.head.x}%`,
              top: `${s.head.y}%`,
              width: `${s.head.w}%`,
              height: `${s.head.h}%`,
            }}
          >
            <span
              className={cn(
                "spk-halo is-idle",
                speaking && "is-live",
                overlapping && speaking && "is-overlap",
                low && speaking && "is-low",
              )}
            />
            <span className={cn("spk-tag", dimmed && "opacity-50")}>
              <span className="spk-tag-bar" aria-hidden />
              <span>
                <span className="block text-xs font-medium text-fg">
                  {displayOf(s.id, labeled)}
                </span>
                {labeled ? (
                  <span className="hidden text-xs text-subtle sm:block">{s.role}</span>
                ) : null}
                {speaking ? <Wave /> : null}
              </span>
            </span>
          </button>
        );
      })}

      {speakingIds.has("self") ? (
        <div
          data-spk="self"
          className="seat-pin seat-self pointer-events-none"
          style={{ left: "50%", top: "94%" }}
        >
          <span className="spk-tag">
            <span className="text-xs font-medium text-fg">나 · 발언</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Wave() {
  return (
    <span className="spk-wave" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}
