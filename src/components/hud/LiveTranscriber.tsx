import { useEffect, useRef, useState } from "react";
import { Cpu, Mic, MicOff, Radio, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

type TranscriptMode = "browser" | "device";

type RecognitionResult = {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
};

type RecognitionEvent = Event & {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};

type RecognitionErrorEvent = Event & { error: string; message?: string };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  processLocally?: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => Recognition;

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "마이크 권한이 필요합니다. 주소창의 마이크 권한을 허용해 주세요.",
  "audio-capture": "연결된 마이크를 찾지 못했습니다.",
  network: "브라우저 음성 인식 연결을 확인하지 못했습니다.",
  "language-not-supported":
    "이 브라우저에는 한국어 기기 내 음성팩이 없습니다. 브라우저 무료 모드로 바꿔 주세요.",
  "no-speech": "말소리가 들리지 않습니다. 마이크 가까이에서 다시 말해 주세요.",
};

export type LiveCaption = {
  id: string;
  text: string;
  confidence: number | null;
  createdAt: number;
};

export function LiveTranscriber({
  compact = false,
  disabled,
  onPartial,
  onFinal,
  onListeningChange,
}: {
  compact?: boolean;
  disabled: boolean;
  onPartial: (text: string) => void;
  onFinal: (caption: LiveCaption) => void;
  onListeningChange: (listening: boolean) => void;
}) {
  const [mode, setMode] = useState<TranscriptMode>("browser");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const finalResultIndexesRef = useRef(new Set<number>());

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      recognition?.abort();
    };
  }, []);

  function stop() {
    shouldListenRef.current = false;
    if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    onListeningChange(false);
    onPartial("");
  }

  useEffect(() => {
    if (!disabled) return;
    shouldListenRef.current = false;
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.abort();
    setListening(false);
    onListeningChange(false);
    onPartial("");
  }, [disabled, onListeningChange, onPartial]);

  function start() {
    if (disabled || listening) return;
    const speechWindow = window as SpeechWindow;
    const RecognitionApi = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!RecognitionApi) {
      setSupported(false);
      setError(
        "이 브라우저는 음성 인식을 지원하지 않습니다. 최신 Chrome 또는 Edge에서 열어 주세요.",
      );
      return;
    }

    const capabilityProbe = new RecognitionApi();
    if (mode === "device" && !("processLocally" in capabilityProbe)) {
      setError(
        "이 브라우저는 기기 내 음성 인식을 지원하지 않습니다. 브라우저 무료 모드로 바꿔 주세요.",
      );
      return;
    }

    setError(null);
    shouldListenRef.current = true;
    const recognition = capabilityProbe;
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    if (mode === "device" && "processLocally" in recognition) recognition.processLocally = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (recognitionRef.current !== recognition) return;
      finalResultIndexesRef.current.clear();
      setError(null);
      setListening(true);
      onListeningChange(true);
    };
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      let partial = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result?.[0];
        const text = alternative?.transcript.trim();
        if (!text) continue;
        if (result.isFinal) {
          if (finalResultIndexesRef.current.has(index)) continue;
          finalResultIndexesRef.current.add(index);
          onFinal({
            id: `live-${Date.now()}-${index}`,
            text,
            confidence:
              Number.isFinite(alternative.confidence) && alternative.confidence > 0
                ? alternative.confidence
                : null,
            createdAt: Date.now(),
          });
        } else {
          partial = `${partial} ${text}`.trim();
        }
      }
      onPartial(partial);
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      if (event.error === "aborted") return;
      setError(ERROR_MESSAGES[event.error] ?? `음성 인식 오류: ${event.error}`);
      if (
        ["not-allowed", "audio-capture", "language-not-supported", "no-speech"].includes(
          event.error,
        )
      ) {
        shouldListenRef.current = false;
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      setListening(false);
      onListeningChange(false);
      if (!shouldListenRef.current) return;
      restartTimerRef.current = window.setTimeout(() => {
        try {
          recognition.start();
        } catch {
          shouldListenRef.current = false;
          setError("마이크를 다시 시작하지 못했습니다. 버튼을 눌러 다시 시도해 주세요.");
        }
      }, 250);
    };

    try {
      recognition.start();
    } catch {
      shouldListenRef.current = false;
      setError("마이크를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  function changeMode(nextMode: TranscriptMode) {
    if (listening) stop();
    setMode(nextMode);
    setError(null);
  }

  const status = disabled
    ? "스피커 발언 중에는 합성 음성 되받음을 막기 위해 실시간 자막을 잠시 멈춥니다."
    : listening
      ? "말씀하세요. 자막을 만드는 중입니다."
      : "마이크를 켜면 바로 자막을 만듭니다.";

  if (compact)
    return disabled ? null : (
      <section className="meeting-mic-controls" aria-label="마이크 자막 제어">
        <button type="button" onClick={listening ? stop : start} disabled={supported === false}>
          {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
          {listening ? "마이크 끄기" : "마이크 켜기"}
        </button>
        <p role="status">{status}</p>
        <small>음성 처리 위치는 브라우저 정책을 따릅니다.</small>
        {error && (
          <p className="meeting-mic-error" role="alert">
            {error}
          </p>
        )}
      </section>
    );

  return (
    <section className="live-console" aria-labelledby="live-caption-title">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border",
            listening
              ? "border-fail/60 bg-fail/10 text-fail"
              : "border-panel/35 bg-panel/10 text-panel",
          )}
          aria-hidden
        >
          {listening ? <Radio className="size-5" /> : <Mic className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="live-caption-title" className="text-sm font-semibold">
              실시간 음성 → 텍스트
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-pass">
              <ShieldCheck className="size-3.5" aria-hidden />
              API 키·사용료 없음
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted" role="status" aria-atomic="true">
            {status}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <fieldset>
          <legend className="mb-1.5 text-xs text-subtle">인식 방식</legend>
          <div className="inline-flex rounded-lg border border-border bg-bg/55 p-1">
            <ModeButton
              active={mode === "browser"}
              onClick={() => changeMode("browser")}
              icon={Radio}
              label="브라우저 무료"
            />
            <ModeButton
              active={mode === "device"}
              onClick={() => changeMode("device")}
              icon={Cpu}
              label="기기 내 우선"
            />
          </div>
        </fieldset>

        <button
          type="button"
          onClick={listening ? stop : start}
          disabled={disabled || supported === false}
          className={cn(
            "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
            listening
              ? "border border-fail/60 bg-fail/10 text-fail hover:bg-fail/15"
              : "bg-accent text-accent-fg hover:bg-panel",
          )}
        >
          {listening ? (
            <MicOff className="size-4" aria-hidden />
          ) : (
            <Mic className="size-4" aria-hidden />
          )}
          {listening ? "마이크 끄기" : "실시간 자막 시작"}
        </button>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-subtle">
        {mode === "device"
          ? "지원되는 브라우저에서는 한국어 음성팩을 기기 안에서 처리합니다. 미지원 시 오류를 표시합니다."
          : "MVP 호환 모드입니다. 별도 API 과금은 없으며 음성 처리 위치는 브라우저 정책을 따릅니다."}
      </p>
      {error ? (
        <p
          className="mt-2 rounded-md border border-fail/35 bg-fail/10 px-3 py-2 text-xs text-fail"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Radio;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors duration-150",
        active ? "bg-elevated text-fg shadow-sm" : "text-muted hover:text-fg",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}
