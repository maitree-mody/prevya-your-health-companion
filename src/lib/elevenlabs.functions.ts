import { createServerFn } from "@tanstack/react-start";

const PREVYA_AGENT_ID = "agent_5901kth9g167f7grv0ndphzkz8ss";

export const getPrevyaConversationToken = createServerFn({ method: "POST" }).handler(
  async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ElevenLabs is not connected to this project. Link the ElevenLabs connector in Lovable.",
      );
    }

    const url = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(
      PREVYA_AGENT_ID,
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[Prevya] ElevenLabs token request failed", response.status, body);
      throw new Error(
        `ElevenLabs token request failed (${response.status}). ${body || "No details"}`,
      );
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      throw new Error("ElevenLabs token response missing 'token' field");
    }

    return { token: data.token, agentId: PREVYA_AGENT_ID };
  },
);
