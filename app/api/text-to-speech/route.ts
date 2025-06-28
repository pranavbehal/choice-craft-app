/**
 * Text-to-Speech API Route Handler
 *
 * Integrates with ElevenLabs API to generate character voices.
 * Maps character names to specific voice IDs and handles audio stream generation.
 *
 * @route POST /api/text-to-speech
 */

import { NextResponse } from "next/server";

/** ElevenLabs API authentication key */
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

/** Map of character names to their corresponding ElevenLabs voice IDs */
const VOICE_IDS = {
  "Professor Blue": "sjwRAsCdMJodJszgJ6Ks", // Scholarly, mature voice
  "Captain Nova": "pqHfZKP75CvOlQylNhV4", // Confident, authoritative voice
  "Fairy Lumi": "XfNU2rGpBa01ckF309OY", // Gentle, mystical voice
  "Sergeant Nexus": "sjwRAsCdMJodJszgJ6Ks", // Direct, professional voice
};

/**
 * POST request handler for text-to-speech conversion
 * @param {Request} req - Request object containing text and character information
 * @returns {Response} Audio stream or error response
 */
export async function POST(req: Request) {
  try {
    const { text, character } = await req.json();
    const voiceId = VOICE_IDS[character as keyof typeof VOICE_IDS];

    if (!voiceId) {
      return NextResponse.json({ error: "Invalid character" }, { status: 400 });
    }

    // Generate speech using ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_64&optimize_streaming_latency=4`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY!,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.5, // Balance between stable and variable speech
            similarity_boost: 0.75, // Higher similarity to original voice,
            speed: 1.1,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    // Forward the audio stream with correct headers
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
