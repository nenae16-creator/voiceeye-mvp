import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { aiStack, productStrategies, ttsEvaluation, ttsHistory } from "@/data/product-strategy";

export const Route = createFileRoute("/strategy")({ component: Strategy });

function Strategy() {
  return (
    <main className="min-h-dvh bg-bg text-fg">
      <AppNav />
      <article className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-14">
        <header className="relative overflow-hidden border-y border-border py-10 sm:py-14">
          <p className="font-mono text-xs tracking-[0.2em] text-panel">PRODUCT &amp; AI STRATEGY</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl">
            연결 장치는 세 가지,
            <br />
            회의 경험은 하나
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            노트북으로 현장을 검증하고, 스마트폰으로 이동성을 넓힌 뒤, 기관이 바로 켜서 쓰는
            일체형 제품으로 확장합니다.
          </p>
          <div className="absolute right-0 top-8 hidden h-36 w-36 rounded-full border border-panel/30 sm:block">
            <div className="absolute inset-5 rounded-full border border-panel/20" />
            <div className="absolute inset-0 animate-pulse rounded-full bg-panel/5 motion-reduce:animate-none" />
          </div>
        </header>

        <section className="py-12" aria-labelledby="products-title">
          <div className="flex items-end justify-between gap-6 border-b border-border pb-4">
            <div>
              <p className="font-mono text-xs text-panel">01 / PRODUCT LINE</p>
              <h2 id="products-title" className="mt-2 text-2xl font-semibold tracking-tight">
                세 가지 제품 전략
              </h2>
            </div>
            <p className="hidden text-sm text-muted sm:block">Link에서 검증한 기능을 Dock과 One에 이식</p>
          </div>
          <div className="grid gap-8 pt-8 lg:grid-cols-3">
            {productStrategies.map((item, index) => (
              <article key={item.id} className="group border-l border-border pl-5 transition-colors hover:border-panel">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs text-subtle">0{index + 1}</span>
                  <span className="text-xs font-medium text-panel">{item.stage}</span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-tight">{item.name}</h3>
                <p className="mt-1 text-sm text-muted">{item.label}</p>
                <p className="mt-5 min-h-12 text-sm leading-6 text-fg">{item.strength}</p>
                <dl className="mt-6 space-y-5 text-sm">
                  <div>
                    <dt className="font-mono text-[11px] tracking-wide text-subtle">주 고객</dt>
                    <dd className="mt-1 leading-6 text-muted">{item.buyer}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] tracking-wide text-subtle">구성</dt>
                    <dd className="mt-1 leading-6 text-muted">{item.hardware.join(" · ")}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] tracking-wide text-warn">검증 과제</dt>
                    <dd className="mt-1 leading-6 text-muted">{item.risk}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-12" aria-labelledby="ai-title">
          <p className="font-mono text-xs text-panel">02 / AI STACK</p>
          <div className="mt-2 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 id="ai-title" className="text-3xl font-semibold tracking-tight">
                클로바를 중심으로,
                <br />
                화자 판정은 로컬에서
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-muted">
                클로바 스트리밍은 실시간 화자분리를 제공하지 않습니다. 자막은 클로바가 만들고,
                발언자 방향은 카메라와 마이크 신호를 기기에서 결합합니다.
              </p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {aiStack.map((item) => (
                <div key={item.job} className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <p className="text-sm font-semibold text-panel">{item.job}</p>
                  <div>
                    <p className="font-medium">{item.primary}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{item.why}</p>
                    <p className="mt-2 text-xs leading-5 text-subtle">기준: {item.guardrail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border py-12" aria-labelledby="tts-title">
          <p className="font-mono text-xs text-panel">03 / TTS DECISION</p>
          <h2 id="tts-title" className="mt-2 text-3xl font-semibold tracking-tight">
            음성은 이름보다 청취 결과로 결정
          </h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="divide-y divide-border border-y border-border">
              {ttsHistory.map((item) => (
                <div key={item.name} className="py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="text-xs font-medium text-warn">{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
            <aside className="border border-panel/30 bg-surface p-6">
              <p className="font-mono text-xs tracking-wide text-panel">BLIND LISTENING TEST</p>
              <p className="mt-4 text-4xl font-semibold">{ttsEvaluation.samples}문장</p>
              <p className="mt-2 text-sm leading-6 text-muted">{ttsEvaluation.listeners}</p>
              <p className="mt-6 text-xs font-medium text-subtle">비교 후보</p>
              <p className="mt-2 text-sm leading-6 text-fg">{ttsEvaluation.candidates.join(" · ")}</p>
              <ul className="mt-6 space-y-2 text-sm text-muted">
                {ttsEvaluation.gates.map((gate) => (
                  <li key={gate} className="flex gap-3">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-panel" />
                    <span>{gate}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="border-t border-border py-10">
          <p className="max-w-4xl text-sm leading-6 text-muted">
            현재 결론: CLOVA Speech와 CLOVA Voice를 1순위로 실험합니다. 네트워크가 끊기면 브라우저
            기본 음성으로 짧게 안내하고, 폐쇄망 기관용 VoiceEye One은 외부 통신 게이트웨이 또는 별도
            상용 로컬 TTS가 확보될 때만 제안합니다.
          </p>
        </section>
      </article>
    </main>
  );
}
