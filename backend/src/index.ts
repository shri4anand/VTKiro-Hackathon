import "dotenv/config";
import express from "express";
import cors from "cors";
import { validateSimplifyRequest } from "./validation";
import { callLLM } from "./llm";
import { scoreVariants } from "./scorer";
import { getFeed } from "./feed";
import { generateSpeech } from "./tts";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/api/feed", async (_req, res) => {
  const result = await getFeed();

  if (!result.success) {
    const statusCode = result.error.code === "TIMEOUT" ? 504 : 502;
    res.status(statusCode).json(result.error);
    return;
  }

  res.json(result.data);
});

app.post("/api/simplify", async (req, res) => {
  const result = validateSimplifyRequest(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.error, code: result.code });
    return;
  }

  const llmResult = await callLLM(result.text, result.language);

  if (!llmResult.success) {
    const statusCode = llmResult.code === "TIMEOUT" ? 504 : 502;
    res.status(statusCode).json({ error: llmResult.error, code: llmResult.code });
    return;
  }

  const variants = scoreVariants(llmResult.data);
  res.json({ variants });
});

app.post("/api/tts", async (req, res) => {
  console.log("[TTS Endpoint] Received request:", {
    hasText: !!req.body.text,
    textLength: req.body.text?.length,
    language: req.body.language,
  });

  const { text, language } = req.body;

  if (!text || typeof text !== "string") {
    console.error("[TTS Endpoint] ERROR: Invalid text");
    res.status(400).json({ error: "Text is required", code: "INVALID_INPUT" });
    return;
  }

  if (!language || typeof language !== "string") {
    console.error("[TTS Endpoint] ERROR: Invalid language");
    res.status(400).json({ error: "Language is required", code: "INVALID_INPUT" });
    return;
  }

  const result = await generateSpeech({ text, language });

  if (!result.success) {
    console.error("[TTS Endpoint] ERROR: TTS generation failed:", result);
    const statusCode = result.code === "TIMEOUT" ? 504 : 502;
    res.status(statusCode).json({ error: result.error, code: result.code });
    return;
  }

  console.log("[TTS Endpoint] SUCCESS: Returning audio, length:", result.audio.length);
  // Return base64 audio
  res.json({ audio: result.audio });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tts/debug", (_req, res) => {
  const hasHumeKey = !!process.env.HUME_API_KEY;
  const keyLength = process.env.HUME_API_KEY?.length || 0;
  
  res.json({
    humeApiKeyConfigured: hasHumeKey,
    humeApiKeyLength: keyLength,
    humeApiKeyPrefix: process.env.HUME_API_KEY?.substring(0, 10) || "not set",
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

export default app;
