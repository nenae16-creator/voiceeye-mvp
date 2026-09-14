import { displayOf, others, roleOf, speakerMap, type SpeakerId } from "@/data/meeting";
import { cn } from "@/lib/cn";

export function SeatField({
  speakingIds,
  focusSpeaker,
  onSeat,
  overlapping,
  labeled,
  lowIds,
}: {
  speakingIds: Set<SpeakerId>;
  focusSpeaker: SpeakerId | null;
  onSeat: (id: SpeakerId) => void;
  overlapping: boolean;
  labeled: boolean;
  lowIds: Set<SpeakerId>;
}) {
  return (
    <div className="panel-scene relative aspect-[4/3] w-full sm:aspect-video">
      <img
        src={`${import.meta.env.BASE_URL}hud/meeting-people.jpg`}
        alt="투명 패널 너머 회의 테이블에 앉은 다섯 명"
        className="panel-scene-image absolute inset-0 size-full object-cover object-center"
        crossOrigin="anonymous"
      />
      <div className="panel-vignette absolute inset-0" />

      {others.map((s) => {
        const speaking = speakingIds.has(s.id);
        const locked = focusSpeaker === s.id;
        const dimmed = focusSpeaker !== null && !locked && !speaking;
        const low = lowIds.has(s.id);
        return (
          <div
            key={s.id}
            data-spk={s.id}
            className={cn("seat-pin", locked && "is-priority")}
            style={{
              left: `${s.head.x}%`,
              top: `${s.head.y}%`,
              width: `${s.head.w}%`,
              height: `${s.head.h}%`,
            }}
          >
            <button
              type="button"
              className="seat-target"
              onClick={() => onSeat(s.id)}
              aria-pressed={locked}
              aria-label={`${displayOf(s.id, labeled)} ${roleOf(s.id, labeled)}${speaking ? ", 발언 중" : ""}${low ? ", 신뢰도 낮음" : ""}. 자막 우선 표시`}
            />
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
          </div>
        );
      })}

      {speakingIds.has("self") ? (
        <div
          data-spk="self"
          className="seat-pin seat-self pointer-events-none"
          style={{ left: `${speakerMap.self.head.x}%`, top: `${speakerMap.self.head.y}%` }}
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
