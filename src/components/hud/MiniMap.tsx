import { others, type SpeakerId, speakerMap } from "@/data/meeting";
import { cn } from "@/lib/cn";

export function MiniMap({
  speakingIds,
  focusSpeaker,
}: {
  speakingIds: Set<SpeakerId>;
  focusSpeaker: SpeakerId | null;
}) {
  return (
    <div
      aria-hidden="true"
      className="mini-map pointer-events-none absolute top-3 right-3 rounded-md bg-bg/80 p-2 sm:top-4 sm:right-4"
    >
      <p className="mb-1 text-center text-xs text-subtle">좌석</p>
      <div className="mini-map-field relative">
        {others.map((s) => (
          <span
            key={s.id}
            data-spk={s.id}
            className={cn(
              "absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-elevated ring-1 ring-border",
              speakingIds.has(s.id) && "spk-dot ring-0",
              focusSpeaker === s.id && "outline outline-offset-1 outline-accent",
            )}
            style={{ left: `${s.head.x}%`, top: `${s.head.y}%` }}
            title={s.anon}
          />
        ))}
        <span
          className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-accent"
          style={{
            left: `${speakerMap.self.head.x}%`,
            top: `${speakerMap.self.head.y}%`,
          }}
        />
      </div>
    </div>
  );
}
