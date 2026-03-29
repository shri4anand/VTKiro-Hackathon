import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateSpeech } from "../../backend/src/tts";
import type { Language } from "../../backend/src/types";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, language } = req.body || {};

  if (!text || typeof text !== "string") {
    return res
      .status(400)
      .json({ error: "Text is required", code: "INVALID_INPUT" });
  }

  if (!language || typeof language !== "string") {
    return res
      .status(400)
      .json({ error: "Language is required", code: "INVALID_INPUT" });
  }

  const result = await generateSpeech({ text, language: language as Language });

  if (!result.success) {
    const statusCode = result.code === "TIMEOUT" ? 504 : 502;
    return res
      .status(statusCode)
      .json({ error: result.error, code: result.code });
  }

  return res.json({ audio: result.audio });
}
