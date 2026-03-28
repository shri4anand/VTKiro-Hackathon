import "dotenv/config";
import express from "express";
import cors from "cors";
import { validateSimplifyRequest } from "./validation";
import { callLLM } from "./llm";
import { scoreVariants } from "./scorer";
import { getFeed } from "./feed";

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

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

export default app;
