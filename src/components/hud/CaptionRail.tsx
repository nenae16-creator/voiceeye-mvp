import { displayOf, roleOf, type SpeakerId, type Turn } from "@/data/meeting";
import { cn } from "@/lib/cn";

type UserCap = { id: string; text: string; confirmed: boolean };

export function CaptionRail({
  clock,
  history,
  focusSpeaker,
  userCaps,
  labeled,
  partialOf,
  confirmedOf,
}: {
  clock: number;
  history: Turn[];
  focusSpeaker: SpeakerId | null;
  userCaps: UserCap[];
  labeled: boolean;
  partialOf: (turn: Turn, clock: number) => string;
  confirmedOf: (turn: Turn, clock: number) => boolean;
}) {
  const rows = [
    ...history.map((t) => ({
      key: t.id,
      speakerId: t.speakerId,
      text: partialOf(t, clock),
      confirmed: confirmedOf(t, clock),
      overlap: Boolean(t.overlap),
      low: Boolean(t.lowConfidence),
      live: clock < t.endMs,
    })),
    ...userCaps.map((c) => ({
      key: c.id,
      speakerId: "self" as const,
      text: c.text,
      confirmed: c.confirmed,
      overlap: false,
      low: false,
      live: false,
    })),
  ].slice(-6);

  const visible = rows;

  return (
    <section className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">노트북 회의 기록</h2>
        <p className="text-xs text-subtle">
          {labeled ? "주최자 라벨" : "익명 클러스터"} · 부분 후 확정
        </p>
      </div>
      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">회의가 시작되면 여기에 붙습니다.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => {
            const focused = focusSpeaker === row.speakerId;
            const dim = focusSpeaker !== null && !focused;
            return (
              <li
                key={row.key}
                data-spk={row.speakerId}
                className={cn(
                  "flex gap-2.5 rounded-md bg-elevated px-3 py-2.5 transition-opacity duration-150",
                  dim && "opacity-60",
                  focused && "ring-1 ring-accent/50",
                  row.low && "caption-low",
                )}
              >
                <span className="spk-dot mt-1.5 size-1.5 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-fg">
                      {displayOf(row.speakerId, labeled)}
                    </span>
                    <span className="text-xs text-subtle">{roleOf(row.speakerId, labeled)}</span>
                    {row.live && !row.confirmed ? (
                      <span className="text-xs uppercase tracking-wide text-muted">부분</span>
                    ) : (
                      <span className="text-xs uppercase tracking-wide text-pass">확정</span>
                    )}
                    {row.overlap ? (
                      <span className="text-xs font-medium text-warn">겹침</span>
                    ) : null}
                    {row.low ? (
                      <span className="text-xs font-medium text-warn">신뢰도 낮음</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-pretty">{row.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
