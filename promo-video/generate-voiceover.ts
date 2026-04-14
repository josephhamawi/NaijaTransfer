import { writeFileSync, mkdirSync, existsSync } from "fs";

/**
 * Generate voiceover audio using ElevenLabs TTS API.
 *
 * Usage: node --env-file=.env generate-voiceover.ts
 *
 * Requires ELEVENLABS_API_KEY in .env file.
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env file");
  process.exit(1);
}

// Use a natural-sounding voice — "Adam" is a warm, clear male voice
// You can browse voices at https://elevenlabs.io/voice-library
const VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam

const scenes = [
  {
    id: "vo-hook",
    text: "Tired of WhatsApp destroying your files? Email caps you at just 25 megabytes.",
  },
  {
    id: "vo-problem",
    text: "Photos lose quality. Videos get crushed. Large files? Forget it. And Nigerian internet makes it worse.",
  },
  {
    id: "vo-comparison",
    text: "WhatsApp, Email, WeTransfer — they all fall short. NaijaTransfer is the clear winner.",
  },
  {
    id: "vo-reveal",
    text: "Introducing NaijaTransfer.",
  },
  {
    id: "vo-showcase",
    text: "Upload up to 4 gigabytes completely free. No account needed. Resumable uploads built for Nigerian internet.",
  },
  {
    id: "vo-security",
    text: "Password protection. WhatsApp sharing. Auto expiry. And your files stay in original quality. Always.",
  },
  {
    id: "vo-nigeria",
    text: "Built in Nigeria, for Nigeria. All prices in Naira. Free forever. Pro from just two thousand Naira a month.",
  },
  {
    id: "vo-cta",
    text: "Visit naijatransfer dot com. Send files for free. No account. No wahala.",
  },
];

const OUTPUT_DIR = "public/audio";

async function generateVoiceover(id: string, text: string) {
  console.log(`Generating: ${id}...`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error for ${id}: ${response.status} - ${error}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const path = `${OUTPUT_DIR}/${id}.mp3`;
  writeFileSync(path, audioBuffer);
  console.log(`  Saved: ${path} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate sequentially to avoid rate limits and ensure no voice overlap
  for (const scene of scenes) {
    await generateVoiceover(scene.id, scene.text);
  }

  console.log("\nAll voiceovers generated! Now generate background music and SFX:");
  console.log("  - public/audio/bg-music.mp3 (ambient background, ~30s loop)");
  console.log("  - public/audio/sfx-whoosh.mp3 (short whoosh for logo reveal)");
  console.log("\nThen run: npm run render");
}

main().catch(console.error);
