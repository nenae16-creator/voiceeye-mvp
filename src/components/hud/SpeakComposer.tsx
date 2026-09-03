import { useRef, useState } from "react";
import { Eye, Keyboard, Volume2 } from "lucide-react";
import { speakUtterance } from "@/lib/speak";

const PRESETS = [
  "동의합니다.",
  "다시 한 번 말씀해 주십시오.",
  "질문이 있습니다.",
  "잠시만 기다려 주십시오.",
];

export function SpeakComposer({
  speaking,
  preview,
  onPreview,
  onStart,
  onDone,
  onFail,
}: {
  speaking: boolean;
  preview: string | null;
  onPreview: (text: string | null) => void;
  onStart: () => void;
  onDone: (text: string) => void;
  onFail: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function showPreview(raw: string) {
    const line = raw.trim();
    if (!line) return;
    setError(null);
    onPreview(line);
  }

  async function send(raw: string) {
    const line = raw.trim();
    if (!line || busy) return;
    setError(null);
    setBusy(true);
    onStart();
    const result = await speakUtterance({ data: { text: line } });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      onFail();
      onDone(line);
      onPreview(null);
      return;
    }
    setText("");
    onPreview(null);
    const url = `data:${result.mime};base64,${result.audio}`;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => {
      setBusy(false);
      onDone(result.text);
    };
    audio.onerror = () => {
      setBusy(false);
      setError("스피커 재생에 실패했습니다.");
      onDone(result.text);
    };
    try {
      await audio.play();
    } catch {
      setBusy(false);
      setError("브라우저가 재생을 막았습니다. 다시 눌러 주십시오.");
      onDone(result.text);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <Keyboard className="size-4 text-muted" aria-hidden />
        <h2 className="text-sm font-semibold">내 발언 · 블루투스 키보드</h2>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        렌즈에 미리보기가 먼저 뜹니다. 확인한 뒤에만 탁상 스피커로 나갑니다.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setText(p)}
            className="min-h-11 rounded-md bg-elevated px-3 text-xs text-fg transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            {p}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (preview) void send(preview);
          else showPreview(text);
        }}
      >
        <label className="sr-only" htmlFor="speak-line">
          발언 문장
        </label>
        <input
          id="speak-line"
          value={preview ?? text}
          maxLength={120}
          onChange={(e) => {
            setText(e.target.value);
            if (preview) onPreview(e.target.value || null);
          }}
          placeholder="회의에서 할 말을 입력"
          className="min-h-11 flex-1 rounded-md border border-border bg-elevated px-3 text-sm text-fg outline-none ring-accent placeholder:text-subtle focus-visible:ring-2"
        />
        {preview ? (
          <button
            type="submit"
            disabled={busy || !preview.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-40"
          >
            <Volume2 className="size-3.5" aria-hidden />
            {speaking || busy ? "합성 중" : "스피커로 전송"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-elevated px-4 text-sm font-medium text-fg transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-40"
          >
            <Eye className="size-3.5" aria-hidden />
            미리보기
          </button>
        )}
      </form>
      {preview ? (
        <p className="mt-2 text-xs text-muted">
          아직 스피커로 나가지 않았습니다. 문장을 고친 뒤 전송하십시오.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-fail">{error}</p> : null}
    </section>
  );
}
