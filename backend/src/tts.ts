import axios from "axios";
import { Language } from "./types";

interface TTSRequest {
  text: string;
  language: Language;
}

type TTSResult =
  | { success: true; audio: string } // base64 encoded audio
  | { success: false; code: "TTS_UNAVAILABLE" | "TIMEOUT" | "INVALID_INPUT"; error: string };

// Map our Language type to Hume AI language codes
const humeLanguageMap: Record<Language, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  zh: "zh",
  ar: "ar",
  pt: "pt",
};

export async function generateSpeech(request: TTSRequest): Promise<TTSResult> {
  console.log("[TTS] Starting speech generation request:", {
    textLength: request.text.length,
    language: request.language,
  });

  const apiKey = process.env.HUME_API_KEY;

  if (!apiKey) {
    console.error("[TTS] ERROR: Hume API key not configured");
    return {
      success: false,
      code: "TTS_UNAVAILABLE",
      error: "Hume API key not configured",
    };
  }

  console.log("[TTS] API key found, length:", apiKey.length);

  if (!request.text || request.text.length > 5000) {
    console.error("[TTS] ERROR: Invalid text length:", request.text?.length);
    return {
      success: false,
      code: "INVALID_INPUT",
      error: "Text must be between 1 and 5000 characters",
    };
  }

  try {
    const humeLanguage = humeLanguageMap[request.language] || "en";
    
    // Build request body - use version 2 with a voice for multilingual support
    const requestBody: any = {
      version: "2",
      format: {
        type: "mp3",
      },
      utterances: [
        {
          text: request.text,
          voice: {
            provider: "HUME_AI",
            name: "ITO", // Default multilingual voice from Hume's library
          },
        },
      ],
    };

    console.log("[TTS] Calling Hume API with:", {
      version: requestBody.version,
      format: requestBody.format,
      language: humeLanguage,
      voiceName: requestBody.utterances[0].voice.name,
      textPreview: request.text.substring(0, 50) + "...",
    });

    // Call Hume TTS REST API directly
    const response = await axios.post(
      "https://api.hume.ai/v0/tts",
      requestBody,
      {
        headers: {
          "X-Hume-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("[TTS] Hume API response received:", {
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      hasGenerations: !!response.data?.generations,
      generationsLength: response.data?.generations?.length,
    });

    // The response contains generations array with audio
    if (!response.data?.generations?.[0]?.audio) {
      console.error("[TTS] ERROR: No audio in response, data:", JSON.stringify(response.data, null, 2));
      return {
        success: false,
        code: "TTS_UNAVAILABLE",
        error: "No audio returned from TTS service",
      };
    }

    const audioData = response.data.generations[0].audio;
    console.log("[TTS] SUCCESS: Audio generated successfully, length:", audioData.length);
    return {
      success: true,
      audio: audioData,
    };
  } catch (err: any) {
    console.error("[TTS] ERROR: Exception caught:", {
      name: err.name,
      message: err.message,
      code: err.code,
      response: err.response?.data,
      status: err.response?.status,
      stack: err.stack,
    });

    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return {
        success: false,
        code: "TIMEOUT",
        error: "TTS request timed out",
      };
    }

    return {
      success: false,
      code: "TTS_UNAVAILABLE",
      error: err.response?.data?.message || err.message || String(err),
    };
  }
}
