import { createFileRoute } from "@tanstack/react-router";
import { AudioLines, CircleAlert, ShieldCheck } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import bench from "@/data/asr-results.json";
import { gate, pct } from "@/lib/format-rate";

export const Route = createFileRoute("/bench")({ component: Bench });

type Item = (typeof bench.items)[number];

function Bench() {
  const clean = bench.summary.clean;
  const far = bench.summary.farfield;
  const overlap = bench.summary.overlap;
  const rows = groupByUtterance(bench.items);

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <AppNav />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-medium tracking-wide text-muted">
          보이스아이 · 실측 벤치 · {bench.measured_at.slice(0, 16).replace("T", " ")} KST
        </p>

        <p className="mt-3 text-sm text-warn">
          기존 합성음 왕복 실측 자료입니다. 현장 테이블 마이크 인식률·실시간 스트리밍 지연·DER는
          미측정입니다.
        </p>
        <a
          href={`${import.meta.env.BASE_URL}bench/asr-results.json`}
          download
          className="mt-3 inline-flex min-h-11 items-center rounded-md bg-elevated px-3 text-sm"
        >
          실측 JSON 원본 받기
        </a>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          한국어 회의체 인식률, 실제로 돌린 값
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          xAI grok-tts(ko)로 회의체 6문장을 합성하고 grok-stt에 다시 넣었다. 같은 벤더 왕복은
          천장이다. 원거리는 잔향+핑크노이즈, 겹침은 0.9초 믹스. 주지표는 CER와 숫자 정규화(ITN)
          CER이다. 어절 WER는 띄어쓰기에 과민하다.
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat
            title="근거리 청음"
            cer={clean.cer_micro}
            itn={clean.cer_itn_micro}
            wer={clean.wer_micro}
            note="6문장 · TTS 원본"
            gateCer={gate(clean.cer_micro, 0.08)}
          />
          <Stat
            title="원거리 합성"
            cer={far.cer_micro}
            itn={far.cer_itn_micro}
            wer={far.wer_micro}
            note="잔향 + HVAC 잡음"
            gateCer={gate(far.cer_micro, 0.08)}
          />
          <Stat
            title="겹침 발화"
            cer={overlap.cer_micro}
            itn={overlap.cer_itn_micro}
            wer={overlap.wer_micro}
            note="두 화자 0.9초 겹침"
            gateCer={gate(overlap.cer_micro, 0.08)}
          />
        </section>

        <section className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold">원본 벤치의 당시 기준 판정</h2>
          <p className="mt-1 text-sm text-muted">
            JSON에 기록된 2026·2028 기준입니다. 사업계획 v2의 2028–2030 성능 목표와 구분합니다.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <GateRow
              label="근거리 CER 8%"
              pass={clean.cer_micro <= 0.08}
              value={pct(clean.cer_micro)}
            />
            <GateRow
              label="근거리 ITN-CER (의미)"
              pass={clean.cer_itn_micro <= 0.08}
              value={pct(clean.cer_itn_micro)}
            />
            <GateRow
              label="원거리 CER 8%"
              pass={far.cer_micro <= 0.08}
              value={pct(far.cer_micro)}
            />
            <GateRow
              label="원거리 어절 WER 18%"
              pass={far.wer_micro <= 0.18}
              value={pct(far.wer_micro)}
            />
            <GateRow
              label="겹침 CER 8%"
              pass={overlap.cer_micro <= 0.08}
              value={pct(overlap.cer_micro)}
            />
            <GateRow
              label="2028 원거리 ITN-CER 3.5%"
              pass={far.cer_itn_micro <= 0.035}
              value={pct(far.cer_itn_micro)}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">문장별 원문 / 가설</h2>
          <p className="mt-1 text-sm text-muted">
            엔진 {bench.engine}. 키워드 부스트: {bench.keyterms.join(", ")}.
          </p>
          <ul className="mt-4 space-y-3">
            {rows.map((row) => (
              <UtteranceCard key={row.id} row={row} />
            ))}
          </ul>
        </section>

        <section className="mt-8 space-y-2 rounded-lg border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CircleAlert className="size-4 text-warn" aria-hidden />이 숫자가 의미하는 것
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            {bench.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            <li>
              현장 테이블 마이크·다화자·방언 성능은 이 자료만으로 알 수 없습니다. 겹침 구간은 이
              벤치의 당시 CER 기준을 통과하지 못했습니다.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function Stat({
  title,
  cer,
  itn,
  wer,
  note,
  gateCer,
}: {
  title: string;
  cer: number;
  itn: number;
  wer: number;
  note: string;
  gateCer: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{title}</p>
      <p className="mt-2 font-mono text-3xl tabular-nums tracking-tight">{pct(cer)}</p>
      <p className="mt-1 text-xs text-subtle">원문 CER · 마이크로 평균</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-subtle">ITN-CER</dt>
          <dd className="font-mono tabular-nums">{pct(itn)}</dd>
        </div>
        <div>
          <dt className="text-subtle">어절 WER</dt>
          <dd className="font-mono tabular-nums">{pct(wer)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">{note}</p>
      <p className={"mt-2 text-xs font-medium " + (gateCer === "pass" ? "text-pass" : "text-fail")}>
        2026 CER 게이트 {gateCer === "pass" ? "통과" : "실패"}
      </p>
    </article>
  );
}

function GateRow({ label, pass, value }: { label: string; pass: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-elevated px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm">
        {pass ? (
          <ShieldCheck className="size-4 text-pass" aria-hidden />
        ) : (
          <CircleAlert className="size-4 text-fail" aria-hidden />
        )}
        {label}
      </span>
      <span className={"font-mono text-sm tabular-nums " + (pass ? "text-pass" : "text-fail")}>
        {value}
      </span>
    </div>
  );
}

function groupByUtterance(items: Item[]) {
  const map = new Map<string, { id: string; label: string; ref: string; variants: Item[] }>();
  for (const it of items) {
    const cur = map.get(it.id) ?? {
      id: it.id,
      label: it.label,
      ref: it.ref,
      variants: [] as Item[],
    };
    cur.variants.push(it);
    map.set(it.id, cur);
  }
  return [...map.values()];
}

function UtteranceCard({
  row,
}: {
  row: { id: string; label: string; ref: string; variants: Item[] };
}) {
  const audio =
    row.id === "m02_caption"
      ? "/bench/m02_caption_clean.mp3"
      : row.id === "m04_budget"
        ? "/bench/m04_budget_clean.mp3"
        : null;

  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{row.label}</p>
        {audio ? (
          <span className="flex items-center gap-2 text-xs text-muted">
            <AudioLines className="size-3.5" aria-hidden />
            <audio controls className="h-8 max-w-48" src={audio} preload="none" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">원문 · {row.ref}</p>
      <div className="mt-3 space-y-2">
        {row.variants.map((v) => (
          <div key={v.condition} className="rounded-md bg-elevated px-3 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                {condLabel(v.condition)}
              </span>
              {"cer" in v ? (
                <span className="font-mono text-xs tabular-nums text-muted">
                  CER {pct(v.cer)} · ITN {pct(v.cer_itn)} · WER {pct(v.wer)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-relaxed">{v.hyp || "—"}</p>
          </div>
        ))}
      </div>
    </li>
  );
}

function condLabel(c: string) {
  if (c === "clean") return "근거리";
  if (c === "farfield") return "원거리";
  if (c === "overlap") return "겹침";
  return c;
}
