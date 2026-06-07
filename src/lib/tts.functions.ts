import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  text: z.string().min(1).max(2000),
  voiceId: z.string().min(1).max(64).optional(),
});

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ElevenLabs is not connected");

    const voiceId = data.voiceId ?? "EXAVITQu4vr4xnSDxMaL"; // Sarah

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `TTS failed: ${res.status}`);
    }

    const buf = await res.arrayBuffer();
    const audioBase64 = Buffer.from(buf).toString("base64");
    return { audioBase64 };
  });
