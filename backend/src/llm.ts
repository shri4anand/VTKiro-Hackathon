import axios, { AxiosError } from "axios";
import { Language } from "./types";

interface LLMRawResponse {
  grade3: string;
  grade6: string;
  grade9: string;
}

type LLMResult =
  | { success: true; data: LLMRawResponse }
  | { success: false; code: "LLM_UNAVAILABLE" | "TIMEOUT" | "MALFORMED_RESPONSE"; error: string };

const PROMPT_TEMPLATE = `You are an emergency communications assistant. Rewrite the following alert text at three reading levels.
Preserve ALL critical safety information: locations, times, and required actions.
Output language: {language}.

Return a JSON object with exactly this structure:
{
  "grade3": "<rewrite at Grade 3 level>",
  "grade6": "<rewrite at Grade 6 level>",
  "grade9": "<rewrite at Grade 9 level>"
}

Alert text:
{alert_input}`;

export async function callLLM(text: string, language: Language): Promise<LLMResult> {
  const prompt = PROMPT_TEMPLATE
    .replace("{language}", language)
    .replace("{alert_input}", text);

  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const apiKey = process.env.LLM_API_KEY;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const content: string = response.data?.choices?.[0]?.message?.content ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { success: false, code: "MALFORMED_RESPONSE", error: "LLM response was not valid JSON" };
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).grade3 !== "string" ||
      typeof (parsed as Record<string, unknown>).grade6 !== "string" ||
      typeof (parsed as Record<string, unknown>).grade9 !== "string"
    ) {
      return { success: false, code: "MALFORMED_RESPONSE", error: "LLM response missing required grade fields" };
    }

    const { grade3, grade6, grade9 } = parsed as LLMRawResponse;
    return { success: true, data: { grade3, grade6, grade9 } };

  } catch (err) {
    clearTimeout(timeoutId);

    if (controller.signal.aborted) {
      return { success: false, code: "TIMEOUT", error: "Request timed out" };
    }

    const axiosErr = err as AxiosError;
    if (axiosErr.isAxiosError) {
      // Network/connection error (no response received)
      if (!axiosErr.response) {
        return { success: false, code: "LLM_UNAVAILABLE", error: axiosErr.message };
      }
      // HTTP error from the API (e.g. 401, 429, 500)
      return {
        success: false,
        code: "LLM_UNAVAILABLE",
        error: `LLM service returned status ${axiosErr.response.status}`,
      };
    }

    return { success: false, code: "LLM_UNAVAILABLE", error: String(err) };
  }
}
