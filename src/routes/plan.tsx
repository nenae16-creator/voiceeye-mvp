import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import {
  audit,
  citations,
  fixes,
  hero,
  kit,
  kpis,
  locks,
  pipes,
  schedule,
  years,
} from "@/data/plan-v2";

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

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat k="총사업비" v={hero.total} n={`국비 ${hero.national} · 지방 ${hero.local} · 민간 ${hero.privateShare}`} />
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
            회의는 의사결정의 최소 단위다. 청각장애인은 같은 테이블에 앉아도 발언의 주체·순서·뉘앙스를
            동시에 확보하지 못하면 의사결정에서 구조적으로 배제된다. 단절은 세 겹이다. 발언 내용을
            실시간으로 읽지 못하면 안건 흐름이 끊기고, 텍스트만 있으면 누가 말했는지 몰라 반박·동의·결정의
            책임이 흐려지며, 수어·필담만으로는 비장애인 다수 회의에서 발언권이 뒤로 밀린다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            기존 수어통역·문자통역은 사전 신청이 필요해 즉석 소회의·현장 점검·갑작스러운 안건 변경에
            대응하지 못한다. 이 사업이 겨냥하는 것은 통역의 대체가 아니라 통역이 도달하지 못하는 시간대의
            보완이다.
          </p>
          <h3 className="mt-5 text-sm font-semibold">수요 모수 — 43만 명이 아니다</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            등록 청각장애인 약 43만은 심의에서 곧바로 반박당한다. 노인성 난청 중심의 고령 편중이 커서
            직장·공공회의 참여층은 훨씬 작다. 65세 미만 30%, 경제활동참가율 37%, 회의가 일상인 사무·전문·공공
            직무 25%를 곱하면 약 1.2만 명이고, 위원회 당사자 위원·대학원생·노조 참여자를 더해 약 1.5~2만 명으로
            본다. 3년 누적 1,500대는 모수의 8~10%로, 보급 목표가 과다하지 않음을 스스로 증명한다. 가정 세
            개에 의존하므로 사전기획에서 실측으로 대체해야 한다.
          </p>
          <h3 className="mt-5 text-sm font-semibold">기존 서비스와 겹치지 않는 이유</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            소보로, 쉐어타이핑 등 실시간 문자통역이 이미 대학·공공에 보급되어 있다. 겹치지 않는 지점은 셋이다.
            자막의 위치 — 화면을 내려다보지 않고 화자의 표정과 자막을 동시에 본다. 화자의 공간 정보 — 이름표가
            아니라 시야 안 좌석 위치로 표시한다. 당사자의 발언 출력 — 어떤 문자통역도 발언 경로를 제공하지 않는다.
          </p>
        </Section>

        <Section id="kpi" no="02" title="성과지표">
          <p className="text-sm leading-relaxed text-muted">
            측정조건 없는 수치는 제안서에 싣지 않는다. WER·DER는 4~8인 원탁, 화자–마이크 평균 1.5m,
            배경소음 45dBA, 중첩발화 10% 이상, 회의체 사전 적용 후, 실제 회의록 대조.
          </p>
          <Table
            head={["지표", "사전기획 27", "1차 28", "2차 29", "3차 30"]}
            rows={kpis}
          />
        </Section>

        <Section id="journey" no="03" title="회의 중 사용자 여정">
          <ul className="space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-medium text-fg">듣기.</span> 테이블 마이크 어레이와 글래스 마이크가
              음성을 수집하고, 헤드포즈가 향한 방향의 화자를 1순위로 전사한다. 렌즈 하단에 2~3줄 자막이
              흐르며 화자가 바뀌면 자막 왼쪽에 색 막대와 라벨이 붙고, 시야 가장자리 좌석 미니맵의 해당
              자리가 점등한다.
            </li>
            <li>
              <span className="font-medium text-fg">보기.</span> 기본 모드는 신원 정보를 쓰지 않는다.
              음향 특징만으로 회의 단위 익명 클러스터를 만들고 주최자가 좌석 배치도에 이름을 붙인다.
              동시 발언이나 잡음으로 신뢰도가 낮으면 점선 테두리로 표시해 오판을 숨기지 않는다.
            </li>
            <li>
              <span className="font-medium text-fg">말하기.</span> 접이식 키보드에 문장을 친다. 본인
              발언 텍스트는 렌즈에 먼저 미리보기되어 전송 전에 수정할 수 있고, 확인 후에만 탁상 스피커로
              출력된다.
            </li>
            <li>
              <span className="font-medium text-fg">남기기.</span> 기본값은 비저장이다. 동의한 회의에
              한해 화자 구분 로그와 3단 요약(결정 / 할 일 / 미합의)을 생성하며, 요약의 각 문장은 원문
              구간과 링크되어야 한다. 원문에 대응하지 않는 문장은 요약에 넣지 않는다.
            </li>
          </ul>
        </Section>

        <Section id="platform" no="04" title="플랫폼 전략">
          <p className="text-sm leading-relaxed text-muted">
            주 플랫폼은 국내에서 KC 인증을 마치고 정식 유통되며, 표준 영상 출력을 통해 화면 전 영역을
            우리가 직접 그릴 수 있는 시스루 디스플레이 글래스다. 허브는 사용자의 안드로이드 스마트폰이다.
            자막 레이아웃·화자칩·미니맵·신뢰도 표시를 전부 통제하며 제조사 정책 변경에 종속되지 않는다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            옵션 플랫폼으로 Meta Ray-Ban Display 계열을 둔다. 편입 조건은 국내 정식 출시(KC·유통·A/S)와
            서드파티 인렌즈 렌더링 API 개방 둘 모두의 충족이다. 자막 렌더러는 장치 비의존 추상화 계층 위에
            구현하고, 서로 다른 글래스 2종 이상에서 동일 코드로 동작함을 1차년도 산출물로 검증한다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            품질 목표의 특정 제품명 기준은 삭제했다. WER, 개체명 정확도, 환각률 1% 미만, TTS MOS, 지시
            이행률로 치환한다. 국외이전은 금지한다. 처리를 국내 리전 또는 온프레미스로 한정한다.
          </p>
        </Section>

        <Section id="kit" no="05" title="보급 키트">
          <p className="text-sm leading-relaxed text-muted">
            기기가액과 운영·서비스비를 분리했다. 기기가액 기준 80% 지원 시 일반 등록장애인 본인부담은
            227,600원, 기초·차상위는 90% 지원으로 113,800원이다.
          </p>
          <Table head={["구성", "단가(원)", "계정", "내구연한"]} rows={kit} />
        </Section>

        <Section id="budget" no="06" title="재원과 편성">
          <p className="text-sm leading-relaxed text-muted">
            총사업비 50.0억 원은 예비타당성조사 대상 기준에 크게 못 미친다. “예타를 피하는 규모”라는
            문장은 삭제했다. 이 사업은 새 전달체계가 아니라 기존 보조기기·정보격차 해소 사업의 품목을
            현대화하는 것이며, 각 부처 고유 임무에 맞춰 기능을 배분한 결과가 다부처 구조다.
          </p>
          <Table head={["파이프", "금액", "사용처"]} rows={pipes} />
          <Table
            head={["연차", "국비", "지방비", "민간·수요", "계", "주요 내용"]}
            rows={years}
          />
          <Table head={["검산 항목", "v1", "v2"]} rows={audit} />
        </Section>

        <Section id="start" no="07" title="착수 일정">
          <p className="text-sm leading-relaxed text-muted">
            2026년 9월 현재 2027년도 정부예산안은 이미 국회 심의 단계이므로, 신규 재정사업으로 반영
            가능한 최초 연도는 2028년도다. 정보통신보조기기 보급과 보조기기 교부는 기존 계속사업이므로
            품목 심의만으로 진입이 가능하다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Phase 0 — 키보드 TTS 발언은 안경 없이 스마트폰만으로 성립한다. 2027년 예비실증에 무료 앱으로
            먼저 배포하면, 하드웨어 전제조건이 어떻게 판정되든 실사용 데이터와 초기 성과를 확보할 수 있다.
          </p>
          <Table head={["시기", "산출물"]} rows={schedule} />
        </Section>

        <Section id="sustain" no="08" title="지속재정">
          <p className="text-sm leading-relaxed text-muted">
            3차년도 기준 라이선스만 연 2.7억 원(1,500대 × 18만)이 발생하며 사업 종료 후에도 매년 소요된다.
            방치하면 1,500대가 작동을 멈춘다. 온디바이스 비중을 높여 대당 연간 운영비를 18만 원에서 9만 원
            이하로 낮추는 것을 R&D 성과지표에 포함한다. 기기가액에 선납으로 편입하고, 회의실 허브는 기관
            정보화 경상예산으로 이관한다. 등재 자료 준비는 2차년도부터 착수한다.
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
            화자 인식 실패 시 이름을 고정하지 않고 방향만 표시로 격하하는 설계, 신뢰도 낮은 구간을 점선으로
            드러내 오판을 숨기지 않는 원칙, 요약에서 원문 미연결 문장을 금지한 환각 차단 규칙, 기본 비녹화와
            LED를 통한 제3자 고지, 얼굴 박스 대신 색 막대와 미니맵을 쓰는 선택, 장애인 전용 디자인 금지라는
            낙인 회피 원칙, 그리고 수어통역의 대체가 아니라 보완이라는 포지셔닝. 마지막 항목은 농아인협회 쪽
            반발을 미리 막는 문장이므로 제안서 전반에서 일관되게 유지해야 한다.
          </p>
          <p className="mt-4 text-xs text-subtle">
            작성 기준일 2026년 9월 2일. 부록 11건은 검증 전이다. 대외 제출 전 1차 출처 확인이 선행되어야 한다.
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
    <div className="mt-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
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
