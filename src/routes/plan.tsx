import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import {
  audit,
  budgetNotes,
  citations,
  fixes,
  hero,
  hardwareRisks,
  journey,
  kit,
  kpis,
  locks,
  pipes,
  platformStrategy,
  schedule,
  years,
} from "@/data/plan-v2";
import {
  cloudNotice,
  demoNotice,
  engineNotice,
  positioning,
  privacyNotice,
} from "@/data/product-policy";

export const Route = createFileRoute("/plan")({ component: Plan });

function Plan() {
  return (
    <main className="min-h-dvh bg-bg text-fg">
      <AppNav />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-medium tracking-wide text-muted">{hero.ministries}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{hero.title}</h1>
        <p className="mt-2 text-lg text-fg">{hero.subtitle}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {hero.line}. {hero.edition}.
        </p>

        <p className="mt-4 rounded-md bg-surface p-3 text-sm text-warn">
          심의 준비안 · 부록 11건 미검증 · 지원율·수요·패널 단가는 가정입니다. 재원 확약과 현장
          성능·광학 검증은 완료되지 않았습니다.
        </p>
        <p className="mt-3 text-sm text-muted">{positioning}</p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            k="총사업비"
            v={hero.total}
            n={`국비 ${hero.national} · 지방 ${hero.local} · 민간 ${hero.privateShare}`}
          />
          <Stat k="사업기간" v={hero.period} n={hero.pre} />
          <Stat k="3년 보급" v={hero.kits} n="재원 정합 상한" />
          <Stat k="실수요 모수" v={hero.demand} n="추정 · 실측 대체 필요" />
        </dl>

        <Section id="fix" no="00" title="초안에서 무엇을 고쳤는가">
          <p className="text-sm leading-relaxed text-muted">
            초안을 이미 읽은 검토자를 위한 절이다. 여섯 건이 그대로 두면 심의에서 막히는 등급이었다.
          </p>
          <ul className="mt-4 space-y-3">
            {fixes.map((f) => (
              <li key={f.title} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-medium text-fail">{f.grade}</p>
                <h3 className="mt-1 text-sm font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                <p className="mt-3 font-mono text-xs text-subtle">v1 {f.v1}</p>
                <p className="font-mono text-xs text-pass">v2 {f.v2}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="why" no="01" title="왜 필요한가">
          <p className="text-sm leading-relaxed text-muted">
            회의는 의사결정의 최소 단위다. 청각장애인은 같은 테이블에 앉아도 발언의
            주체·순서·뉘앙스를 동시에 확보하지 못하면 의사결정에서 구조적으로 배제된다. 단절은 세
            겹이다. 발언 내용을 실시간으로 읽지 못하면 안건 흐름이 끊기고, 텍스트만 있으면 누가
            말했는지 몰라 반박·동의·결정의 책임이 흐려지며, 수어·필담만으로는 비장애인 다수 회의에서
            발언권이 뒤로 밀린다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            수어통역·문자통역과 함께 사용할 수 있는 추가 발언 경로를 제공한다. 필요한 통역 지원은
            당사자의 선호에 따라 유지하며, 즉석 회의에서 이용 가능한 지원 범위를 넓히는 것을 목표로
            한다.
          </p>
          <h3 className="mt-5 text-sm font-semibold">수요 모수 — 43만 명이 아니다</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            미검증 가정인 등록 인구 43만 명, 65세 미만 비중 30%, 경제활동참가율 37%, 회의 관련 직무
            비중 25%를 곱하면 약 1.2만 명이다. 추가 참여층을 포함한 1.5~2만 명도 추정이며, 서로 다른
            통계 집단에 같은 비율을 적용할 수 있는지 확인되지 않았다. 보급 1,500세트의 타당성을
            입증하는 수치로 사용하지 않고 사전기획에서 실측으로 대체한다.
          </p>
          <h3 className="mt-5 text-sm font-semibold">기존 서비스와 비교할 기능</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            소보로·쉐어타이핑과 투명 자막 장치의 지원 범위는 미검증이다. 공식 자료를 확인해 공유
            자막, 다중 화자 위치 표시, 오류 확인, 키보드 TTS 발언을 비교한다. 투명 패널 자체를 신규
            발명이라고 주장하거나 기존 서비스에 특정 기능이 없다고 단정하지 않는다.
          </p>
        </Section>

        <Section id="kpi" no="02" title="성과지표">
          <p className="mb-2 text-sm text-warn">
            아래 수치는 연차별 목표이며 실측 결과가 아닙니다. DER·현장 지연은 아직 미측정입니다.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            측정조건 없는 수치는 제안서에 싣지 않는다. WER·DER는 4~8인 원탁, 화자–마이크 평균 1.5m,
            배경소음 45dBA, 중첩발화 10% 이상, 회의체 사전 적용 후 실제 회의록과 대조한다. 패널
            판독률은 거리·시야각·조도·배경 대비를 고정해 측정한다.
          </p>
          <Table head={["지표", "사전기획 27", "1차 28", "2차 29", "3차 30"]} rows={kpis} />
        </Section>

        <Section id="journey" no="03" title="회의 중 사용자 여정">
          <p className="mb-3 text-sm text-warn">제품 목표와 현재 데모를 구분합니다. {demoNotice}</p>
          <ul className="space-y-3 text-sm leading-relaxed text-muted">
            {journey.map(([title, body]) => (
              <li key={title}>
                <span className="font-medium text-fg">{title}.</span> {body}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">{privacyNotice}</p>
          <p className="mt-2 text-xs text-muted">{engineNotice}</p>
          <p className="mt-2 text-xs text-muted">{cloudNotice}</p>
        </Section>

        <Section id="platform" no="04" title="플랫폼 전략">
          <p className="text-sm leading-relaxed text-muted">{platformStrategy.primary}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{platformStrategy.architecture}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{platformStrategy.hardware}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {platformStrategy.portable} 품질은 WER·DER·판독률·지연·TTS MOS 같은 객관 지표로
            평가한다. 사업용 음성 처리는 국내 리전 또는 온프레미스로 한정하는 목표이며 현재 데모
            충족 여부와 구분한다.
          </p>
          <Table head={["위험", "왜 문제인가", "검증 게이트"]} rows={hardwareRisks} />
        </Section>

        <Section id="kit" no="05" title="보급 키트">
          <p className="text-sm leading-relaxed text-muted">
            기기가액과 운영·서비스비를 분리했다. 미검증 가정인 지원율 80% 적용 시 미지원분은
            227,600원, 90% 적용 시 113,800원이다. 부담 주체는 사용자·고용주·수요기관 중 협의로
            정하며 확정 지원제도로 안내하지 않는다. 패널 본체 85만 원은 복수 견적 전 편성 상한
            가정이고 노트북·교체·수리비는 포함하지 않는다.
          </p>
          <Table head={["구성", "단가(원)", "계정", "내구연한"]} rows={kit} />
        </Section>

        <Section id="budget" no="06" title="재원과 편성">
          <p className="text-sm leading-relaxed text-muted">
            총사업비 50.0억 원의 다부처 편성안이다. 부처별 기능에 따라 배분했으며, 재원 확보·사업
            적용 가능성·필요 심사 절차는 담당 기관 협의로 확정한다.
          </p>
          <Table head={["파이프", "금액", "사용처"]} rows={pipes} />
          <Table head={["연차", "국비", "지방비", "민간·수요", "계", "주요 내용"]} rows={years} />
          <Table head={["검산 항목", "계산·대조", "결과"]} rows={audit} />
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
            {budgetNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Section>

        <Section id="start" no="07" title="착수 일정">
          <p className="text-sm leading-relaxed text-muted">
            사업기간은 2028–2030년, 사전기획은 2026년 4분기–2027년으로 고정한다. 예산요구 일정과
            기존 사업 품목 진입 절차는 해당 부처 공고·협의로 확인한다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Phase 0 — 일반 노트북과 테이블 마이크만으로 전사·익명 화자분리·비공개 TTS 초안 흐름을
            검증한다. 이어 15인치급 광학 콤바이너와 직접 투명 패널을 비교해 판독률과 안전성을 확인한
            뒤 보급형 하드웨어를 고른다.
          </p>
          <Table head={["시기", "산출물"]} rows={schedule} />
        </Section>

        <Section id="sustain" no="08" title="지속재정">
          <p className="text-sm leading-relaxed text-muted">
            3차년도 기준 라이선스만 연 2.7억 원(1,500세트 × 18만)이 발생하며 사업 종료 후에도 매년
            소요된다. 방치하면 1,500세트가 작동을 멈춘다. 온디바이스 비중을 높여 세트당 연간
            운영비를 18만 원에서 9만 원 이하로 낮추는 것을 후속 R&D 목표로 검토한다. 기기가액과
            운영비는 분리하며, 운영비 선납 여부·기관 경상예산 이관·부담 주체는 별도로 확정한다. 등재
            자료 준비는 2차년도부터 착수한다.
          </p>
        </Section>

        <Section id="lock" no="09" title="되돌리면 안 되는 결정">
          <ol className="space-y-2 text-sm leading-relaxed text-muted">
            {locks.map((line, i) => (
              <li key={line}>
                <span className="font-medium text-fg">{i + 1}. </span>
                {line}
              </li>
            ))}
          </ol>
        </Section>

        <Section id="cite" no="10" title="제출 전 반드시 검증할 인용">
          <p className="text-sm leading-relaxed text-muted">
            본문에 사용한 다음 항목은 기억·추정에 근거한 것으로, 제출 전 1차 출처로 대체해야 한다.
            검증 없이 그대로 제출하거나 확정 사실처럼 인용하지 않는다.
          </p>
          <Table head={["항목", "본문 표기", "확인처"]} rows={citations} />
        </Section>

        <Section id="keep" no="11" title="초안에서 그대로 둔 것">
          <p className="text-sm leading-relaxed text-muted">
            화자 인식 실패 시 이름을 고정하지 않고 좌석 방향만 표시로 격하하는 설계, 신뢰도 낮은
            구간을 점선으로 드러내 오판을 숨기지 않는 원칙, 요약에서 원문 미연결 문장을 금지한 환각
            차단 규칙, 기본 비녹화와 LED를 통한 제3자 고지, 얼굴 박스 대신 화자색·이름표·좌석 방향을
            쓰는 선택, 장애인 전용 디자인 금지라는 낙인 회피 원칙, 그리고 수어통역을 보완한다는
            목적. 당사자의 통역 선택권과 회의 참여권을 지원하기 위한 원칙으로 제안서 전반에서
            유지한다.
          </p>
          <p className="mt-4 text-xs text-subtle">
            v2.1 플랫폼 전환일 2026년 9월 4일. 부록 11건은 검증 전이다. 대외 제출 전 1차 출처 확인이
            선행되어야 한다.
          </p>
        </Section>
      </article>
    </main>
  );
}

function Stat({ k, v, n }: { k: string; v: string; n: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight">{v}</dd>
      <p className="mt-1 text-xs text-subtle">{n}</p>
    </div>
  );
}

function Section({
  id,
  no,
  title,
  children,
}: {
  id: string;
  no: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-12">
      <p className="text-xs font-medium tracking-wide text-subtle">{no}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mt-4 rounded-lg border border-border">
      <div className="divide-y divide-border sm:hidden">
        {rows.map((row, i) => (
          <dl key={i} className="space-y-2 p-3 text-sm">
            {row.map((cell, j) => (
              <div key={j} className="grid grid-cols-3 gap-2">
                <dt className="text-xs text-muted">{head[j]}</dt>
                <dd className="col-span-2 min-w-0 wrap-anywhere">{cell || "—"}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="bg-elevated text-xs text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-fg">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
