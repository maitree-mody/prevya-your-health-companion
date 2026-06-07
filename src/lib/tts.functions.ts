import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ text: z.string().min(1).max(2000) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");
    const voiceId = "EXAVITQu4vr4xnSDxMaL";
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: data.text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return { audio: `data:audio/mpeg;base64,${b64}` };
  });
