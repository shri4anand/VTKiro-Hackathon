import type { VercelRequest, VercelResponse } from "@vercel/node";
import { validateSimplifyRequest } from "../backend/src/validation";
import { callLLM } from "../backend/src/llm";
import { scoreVariants } from "../backend/src/scorer";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = validateSimplifyRequest(req.body);
  if (!result.valid) {
    return res.status(400).json({ error: result.error, code: result.code });
  }

  const llmResult = await callLLM(result.text, result.language);

  if (!llmResult.success) {
    const statusCode = llmResult.code === "TIMEOUT" ? 504 : 502;
    return res
      .status(statusCode)
      .json({ error: llmResult.error, code: llmResult.code });
  }

  const variants = scoreVariants(llmResult.data);
  return res.json({ variants });
}
