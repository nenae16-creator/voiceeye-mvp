import { createServerFn } from "@tanstack/react-start";

const MAX_CHARS = 120;

export const speakUtterance = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => input)
  .handler(async ({ data }) => {
    const text = data.text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
    if (!text) return { ok: false as const, error: "입력한 문장이 없습니다." };

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "음성 합성을 쓸 수 없습니다." };
    }

    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: "eve",
        language: "ko",
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `음성 합성 오류 ${res.status}` };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ok: true as const,
      text,
      mime: res.headers.get("content-type") || "audio/mpeg",
      audio: buf.toString("base64"),
    };
  });
