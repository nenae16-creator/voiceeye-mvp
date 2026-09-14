import { useCallback, useEffect, useRef, useState } from "react";
import { Cpu, Eye, Keyboard, LockKeyhole, Volume2, Square } from "lucide-react";
import { speakUtterance } from "@/lib/speak";

const PRESETS = [
  "동의합니다.",
  "다시 한 번 말씀해 주십시오.",
  "질문이 있습니다.",
  "잠시만 기다려 주십시오.",
];

const USE_CLOUD_TTS = import.meta.env.VITE_VOICEEYE_TTS_PROVIDER === "cloud";

function pickKoreanVoice(voices: SpeechSynthesisVoice[]) {
  const koreanVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ko"));
  return koreanVoices.find((voice) => voice.localService === true) ?? null;
}

export function SpeakComposer({
  speaking,
  preview,
  onPreview,
  onStart,
  onDone,
  onFail,
  onBusy,
}: {
  speaking: boolean;
  preview: string | null;
  onPreview: (text: string | null) => void;
  onStart: () => void;
  onDone: (text: string) => void;
  onFail: (error: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceVoice, setDeviceVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [cloudProvider, setCloudProvider] = useState<"clova" | "xai" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const operationRef = useRef<{ cancelled: boolean; cancel: () => void } | null>(null);

  const releasePlayback = useCallback(() => {
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      window.speechSynthesis?.cancel();
      utteranceRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onplaying = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current = null;
    }
  }, []);

  const stopSpeech = useCallback(() => {
    operationRef.current?.cancel();
    releasePlayback();
  }, [releasePlayback]);

  useEffect(() => {
    mountedRef.current = true;
    const synth = window.speechSynthesis;
    const refreshVoices = () => setDeviceVoice(pickKoreanVoice(synth?.getVoices() ?? []));
    refreshVoices();
    synth?.addEventListener("voiceschanged", refreshVoices);
    return () => {
      mountedRef.current = false;
      synth?.removeEventListener("voiceschanged", refreshVoices);
      stopSpeech();
    };
  }, [stopSpeech]);

  async function speakWithDevice(line: string) {
    if (!("speechSynthesis" in window)) {
      throw new Error("이 기기에는 음성 합성 기능이 없습니다.");
    }
    const synth = window.speechSynthesis;
    const voice = deviceVoice ?? pickKoreanVoice(synth.getVoices());
    if (!voice) {
      throw new Error(
        "사용 가능한 로컬 한국어 음성이 없습니다. 운영체제의 한국어 음성을 설치한 뒤 다시 시도해 주세요.",
      );
    }

    await new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(line);
      utteranceRef.current = utterance;
      utterance.voice = voice;
      utterance.lang = voice.lang || "ko-KR";
      utterance.rate = 0.96;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => {
        if (mountedRef.current) onStart();
      };
      utterance.onend = () => {
        utteranceRef.current = null;
        resolve();
      };
      utterance.onerror = (event) => {
        utteranceRef.current = null;
        reject(new Error(`기기 음성 재생에 실패했습니다. (${event.error})`));
      };
      synth.cancel();
      synth.speak(utterance);
    });
  }

  function showPreview(raw: string) {
    const line = raw.trim();
    if (!line) return;
    setError(null);
    onPreview(line);
  }

  async function send(raw: string) {
    const line = raw.trim();
    if (!line || sendingRef.current || line !== preview?.trim()) return;
    sendingRef.current = true;
    setError(null);
    if (USE_CLOUD_TTS) setCloudProvider(null);
    setBusy(true);
    onBusy(true);
    const operation = { cancelled: false, cancel: () => {} };
    const cancelled = new Promise<never>((_, reject) => {
      operation.cancel = () => {
        operation.cancelled = true;
        reject(new Error("발언을 중지했습니다. 일부 음성이 이미 재생됐을 수 있습니다."));
      };
    });
    operationRef.current = operation;
    try {
      const playback = async () => {
        if (!USE_CLOUD_TTS) {
          await speakWithDevice(line);
          return;
        }

        const result = await speakUtterance({ data: { text: line } });
        if (!mountedRef.current || operation.cancelled) return;
        if (!result.ok) throw new Error(result.error);
        setCloudProvider(result.provider);
        const audio = new Audio(`data:${result.mime};base64,${result.audio}`);
        audioRef.current = audio;
        await new Promise<void>((resolve, reject) => {
          audio.onplaying = () => {
            if (mountedRef.current) onStart();
          };
          audio.onended = () => resolve();
          audio.onerror = () =>
            reject(new Error("스피커 재생에 실패했습니다. 문장을 확인한 뒤 다시 전송해 주세요."));
          void audio
            .play()
            .catch(() =>
              reject(
                new Error("브라우저가 재생을 막았습니다. 문장을 확인한 뒤 다시 전송해 주세요."),
              ),
            );
        });
      };
      await Promise.race([playback(), cancelled]);
      if (!mountedRef.current || operation.cancelled) return;
      setText("");
      onPreview(null);
      onDone(line);
    } catch (err) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "음성 요청에 실패했습니다. 다시 전송해 주세요.";
      setError(message);
      onFail(message);
    } finally {
      sendingRef.current = false;
      releasePlayback();
      if (operationRef.current === operation) operationRef.current = null;
      if (mountedRef.current) {
        setBusy(false);
        onBusy(false);
      }
    }
  }

  const voiceNotice = !USE_CLOUD_TTS
    ? `기기 내 한국어 음성으로 재생합니다 · 사용료 0원${deviceVoice ? ` · ${deviceVoice.name}` : ""}`
    : cloudProvider === "clova"
      ? "CLOVA 음성 · 국내 처리 · 입력 문장이 음성 서비스로 전송됩니다."
      : cloudProvider === "xai"
        ? "xAI 음성 · 국외 전송 · 입력 문장이 해외 음성 서비스로 전송됩니다."
        : "클라우드 음성 · 요청 후 실제 제공자와 처리 경로를 표시합니다.";

  return (
    <section className="laptop-console" aria-label="노트북 비공개 발언 콘솔">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Keyboard className="size-4 text-panel" aria-hidden />
          <h2 className="text-sm font-semibold">내 발언 · 노트북 비공개 화면</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-bg/70 px-2 py-1 text-xs text-panel">
          <LockKeyhole className="size-3.5" aria-hidden />
          패널에 숨김
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        초안과 수정 내용은 이 화면에서만 보입니다. 확인하고 음성 재생이 시작될 때 공개 패널에
        표시합니다.
      </p>
      <p
        className="mt-1 flex items-center gap-1.5 text-xs leading-relaxed text-subtle"
        role="status"
        aria-live="polite"
      >
        <Cpu className="size-3.5 shrink-0 text-pass" aria-hidden />
        {voiceNotice}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={busy}
            onClick={() => {
              setText(p);
              onPreview(null);
              setError(null);
              inputRef.current?.focus();
            }}
            className="min-h-11 rounded-md border border-border bg-elevated px-3 text-xs text-fg transition-colors duration-150 hover:border-panel/60 active:bg-border disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>
      <form
        id="speak-form"
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (sendingRef.current) return;
          showPreview(text);
        }}
      >
        <label className="sr-only" htmlFor="speak-line">
          발언 문장
        </label>
        <input
          id="speak-line"
          ref={inputRef}
          value={preview ?? text}
          disabled={busy}
          maxLength={120}
          onChange={(e) => {
            setText(e.target.value);
            if (preview) onPreview(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.nativeEvent.isComposing || e.repeat)) e.preventDefault();
          }}
          placeholder="공개하기 전, 회의에서 할 말을 입력"
          className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-elevated px-3 text-sm text-fg outline-none ring-accent placeholder:text-subtle focus-visible:ring-2"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-elevated px-4 text-sm font-medium text-fg disabled:opacity-40"
        >
          <Eye className="size-3.5" aria-hidden />
          비공개 미리보기
        </button>
        {preview ? (
          <button
            type="button"
            onClick={() => void send(preview)}
            disabled={busy || !preview.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-150 ease-out active:scale-95 disabled:opacity-40"
          >
            <Volume2 className="size-3.5" aria-hidden />
            {speaking ? "재생 중" : busy ? "합성 중" : "스피커로 전송"}
          </button>
        ) : null}
      </form>
      {busy ? (
        <button
          type="button"
          onClick={stopSpeech}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-fail px-4 text-sm font-semibold text-fail"
        >
          <Square className="size-4" aria-hidden />
          발언 중지
        </button>
      ) : null}
      {preview && !busy ? (
        <p className="mt-2 text-xs text-muted" role="status">
          이 문장은 아직 패널과 스피커로 나가지 않았습니다. 확인한 뒤 전송하십시오.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-fail" role="alert">
          {error} 발언 완료로 기록하지 않았습니다.
        </p>
      ) : null}
    </section>
  );
}
