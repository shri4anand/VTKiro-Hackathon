import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFeed } from "../backend/src/feed";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await getFeed();

  if (!result.success) {
    const statusCode = result.error.code === "TIMEOUT" ? 504 : 502;
    return res.status(statusCode).json(result.error);
  }

  return res.json(result.data);
}
