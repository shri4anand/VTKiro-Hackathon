import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const hasHumeKey = !!process.env.HUME_API_KEY;
  const keyLength = process.env.HUME_API_KEY?.length || 0;

  return res.json({
    humeApiKeyConfigured: hasHumeKey,
    humeApiKeyLength: keyLength,
    humeApiKeyPrefix: process.env.HUME_API_KEY?.substring(0, 10) || "not set",
  });
}
