import { useEffect, useRef, useState } from "react";
import { Check, LockKeyhole, Square, Volume2 } from "lucide-react";

export function useKoreanVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const synth = window.speechSynthesis;
    const refresh = () =>
      setVoices(
        (synth?.getVoices() ?? []).filter(
          (voice) => voice.lang.toLowerCase().startsWith("ko") && voice.localService,
        ),
      );
    refresh();
    synth?.addEventListener("voiceschanged", refresh);
    return () => synth?.removeEventListener("voiceschanged", refresh);
  }, []);
  return voices;
}

export function MeetingChat({
  onBusy,
  onStarted,
  onCompleted,
}: {
  onBusy: (busy: boolean) => void;
  onStarted: (text: string) => void;
  onCompleted: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const voices = useKoreanVoices();
  const [voiceName, setVoiceName] = useState("");
  const operationRef = useRef<{ cancelled: boolean; utterance: SpeechSynthesisUtterance } | null>(
    null,
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const operation = operationRef.current;
      if (operation) {
        operation.cancelled = true;
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  function stop() {
    const operation = operationRef.current;
    if (!operation) return;
    operation.cancelled = true;
    operationRef.current = null;
    window.speechSynthesis?.cancel();
    setBusy(false);
    onBusy(false);
    setMessage("발언을 중지했습니다. 완료 기록에는 남기지 않았습니다.");
  }

  function play() {
    if (!preview || operationRef.current) return;
    const synth = window.speechSynthesis;
    const voice = voices.find((item) => item.name === voiceName) ?? voices[0];
    if (!synth || !voice || typeof SpeechSynthesisUtterance === "undefined") {
      setMessage(
        "기기 내 한국어 음성이 없습니다. Windows 언어 설정에서 한국어 음성을 설치해 주세요.",
      );
      return;
    }
    const text = preview;
    onBusy(true);
    setBusy(true);
    setMessage("");
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.96;
    const operation = { cancelled: false, utterance };
    operationRef.current = operation;
    const current = () =>
      mountedRef.current && operationRef.current === operation && !operation.cancelled;
    utterance.onstart = () => {
      if (current()) onStarted(text);
    };
    utterance.onend = () => {
      if (!current()) return;
      operationRef.current = null;
      setBusy(false);
      onBusy(false);
      onCompleted(text);
      setDraft("");
      setPreview(null);
      setMessage("발언을 회의 기록에 남겼습니다.");
    };
    utterance.onerror = () => {
      if (!current()) return;
      operationRef.current = null;
      setBusy(false);
      onBusy(false);
      setMessage("음성을 재생하지 못했습니다. 문장을 확인하고 다시 눌러 주세요.");
    };
    try {
      synth.speak(utterance);
    } catch {
      utterance.onerror?.(new Event("error") as SpeechSynthesisErrorEvent);
    }
  }

  return (
    <section className="meeting-chat" aria-labelledby="meeting-chat-title">
      <div className="meeting-section-title">
        <h2 id="meeting-chat-title">내 발언</h2>
        <span>
          <LockKeyhole aria-hidden /> 비공개 작성
        </span>
      </div>
      <p className="meeting-helper">문장을 쓰고 확인하면 스피커로 전달합니다.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy && draft.trim()) {
            setPreview(draft.trim());
            setMessage("");
          }
        }}
      >
        <label htmlFor="meeting-draft">회의에서 할 말</label>
        <textarea
          id="meeting-draft"
          rows={4}
          maxLength={300}
          value={draft}
          disabled={busy}
          onChange={(event) => {
            setDraft(event.target.value);
            setPreview(null);
            setMessage("");
          }}
          placeholder="예: 저는 화요일 오전이 좋습니다."
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.ctrlKey || event.metaKey) &&
              !event.nativeEvent.isComposing &&
              !event.repeat
            ) {
              event.preventDefault();
              if (!busy && draft.trim()) setPreview(draft.trim());
            }
          }}
        />
        <div className="meeting-draft-footer">
          <span>{draft.length} / 300</span>
          <span>작성 중에는 패널에 표시되지 않습니다.</span>
        </div>
        <div className="meeting-quick-replies">
          {["다시 한 번 말씀해 주세요.", "제 의견도 말씀드리겠습니다."].map((text) => (
            <button
              key={text}
              type="button"
              disabled={busy}
              onClick={() => {
                setDraft(text);
                setPreview(null);
                setMessage("");
              }}
            >
              {text}
            </button>
          ))}
        </div>
        {!preview && (
          <button className="meeting-main-button" type="submit" disabled={!draft.trim() || busy}>
            <Check aria-hidden /> 문장 확인
          </button>
        )}
      </form>
      {preview && (
        <div className="meeting-chat-preview">
          <span>이 문장을 말할까요?</span>
          <p>{preview}</p>
          {busy ? (
            <button className="meeting-stop-button" onClick={stop}>
              <Square aria-hidden /> 발언 중지
            </button>
          ) : (
            <button className="meeting-main-button" onClick={play}>
              <Volume2 aria-hidden /> 음성으로 말하기
            </button>
          )}
        </div>
      )}
      <details className="meeting-voice-setting">
        <summary>한국어 음성 설정</summary>
        <label htmlFor="meeting-voice">재생할 음성</label>
        <select
          id="meeting-voice"
          value={voiceName}
          onChange={(event) => setVoiceName(event.target.value)}
          disabled={busy}
        >
          <option value="">기본 한국어 음성</option>
          {voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name}
            </option>
          ))}
        </select>
        <p>기기에 설치된 한국어 음성만 사용합니다.</p>
      </details>
      {message && (
        <p className="meeting-chat-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
