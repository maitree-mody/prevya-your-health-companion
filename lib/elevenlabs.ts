import { ElevenLabsClient } from "elevenlabs";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export const agentId = process.env.ELEVENLABS_AGENT_ID!;

export default elevenlabs;
