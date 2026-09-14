import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_CHARS = 120;

type TtsResult =
  | { ok: true; provider: "clova" | "xai"; mime: string; audio: string }
  | { ok: false; error: string };

async function synthesizeWithClova(text: string): Promise<TtsResult> {
  const clientId = process.env.NCP_CLOVA_VOICE_CLIENT_ID;
  const clientSecret = process.env.NCP_CLOVA_VOICE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false, error: "클로바 음성 합성 키가 설정되지 않았습니다." };
  }

  const body = new URLSearchParams({
    speaker: process.env.CLOVA_VOICE_SPEAKER || "nara",
    text,
    volume: "0",
    speed: "0",
    pitch: "0",
    format: "mp3",
  });
  const res = await fetch("https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY": clientSecret,
    },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return { ok: false, error: `클로바 음성 합성 오류 ${res.status}` };

  const buf = Buffer.from(await res.arrayBuffer());
  return {
    ok: true,
    provider: "clova",
    mime: res.headers.get("content-type") || "audio/mpeg",
    audio: buf.toString("base64"),
  };
}

async function synthesizeWithXai(text: string): Promise<TtsResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "xAI 음성 합성 키가 설정되지 않았습니다." };

  const res = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ text, voice_id: "eve", language: "ko" }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return { ok: false, error: `xAI 음성 합성 오류 ${res.status}` };

  const buf = Buffer.from(await res.arrayBuffer());
  return {
    ok: true,
    provider: "xai",
    mime: res.headers.get("content-type") || "audio/mpeg",
    audio: buf.toString("base64"),
  };
}

export const speakUtterance = createServerFn({ method: "POST" })
  .validator(z.object({ text: z.string().trim().min(1).max(MAX_CHARS) }))
  .handler(async ({ data }) => {
    const text = data.text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
    if (!text) return { ok: false as const, error: "입력한 문장이 없습니다." };

    try {
      const requested = process.env.VOICEEYE_TTS_PROVIDER?.toLowerCase();
      const provider =
        requested === "xai" || requested === "clova"
          ? requested
          : process.env.NCP_CLOVA_VOICE_CLIENT_ID && process.env.NCP_CLOVA_VOICE_CLIENT_SECRET
            ? "clova"
            : "xai";
      const result =
        provider === "clova" ? await synthesizeWithClova(text) : await synthesizeWithXai(text);
      if (!result.ok) {
        return {
          ok: false as const,
          error: `${result.error} 비공개 미리보기와 대본 재생은 사용할 수 있습니다.`,
        };
      }
      return {
        ok: true as const,
        text,
        provider: result.provider,
        mime: result.mime,
        audio: result.audio,
      };
    } catch {
      return {
        ok: false as const,
        error: "음성 합성 연결이 끊겼거나 응답 시간이 초과됐습니다. 다시 전송해 주세요.",
      };
    }
  });
