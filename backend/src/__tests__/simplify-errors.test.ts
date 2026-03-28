import request from "supertest";
import express from "express";
import cors from "cors";
import { validateSimplifyRequest } from "../validation";
import { callLLM } from "../llm";
import { scoreVariants } from "../scorer";

// Mock the LLM module
jest.mock("../llm");
// Mock text-readability module
jest.mock("text-readability", () => ({
  fleschKincaidGrade: jest.fn((text: string) => {
    // Simple mock: return a score based on text length
    return Math.min(10, Math.max(1, text.length / 100));
  }),
}));

const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>;

// Create a test app with the same setup as the real app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

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

  return app;
};

describe("/api/simplify error paths", () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe("VALIDATION_ERROR - empty text", () => {
    it("should return 400 with VALIDATION_ERROR code when text is empty", async () => {
      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "", language: "en" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Text is required.",
        code: "VALIDATION_ERROR",
      });
    });

    it("should return 400 with VALIDATION_ERROR code when text is missing", async () => {
      const response = await request(app)
        .post("/api/simplify")
        .send({ language: "en" });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    it("should preserve empty text in error response structure", async () => {
      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "", language: "en" });

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("VALIDATION_ERROR - text exceeds 10000 chars", () => {
    it("should return 400 with VALIDATION_ERROR code when text exceeds 10000 chars", async () => {
      const longText = "a".repeat(10001);
      const response = await request(app)
        .post("/api/simplify")
        .send({ text: longText, language: "en" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Text exceeds 10,000 character limit.",
        code: "VALIDATION_ERROR",
      });
    });

    it("should accept text with exactly 10000 chars", async () => {
      const exactText = "a".repeat(10000);
      mockCallLLM.mockResolvedValue({
        success: true,
        data: { grade3: "test", grade6: "test", grade9: "test" },
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: exactText, language: "en" });

      expect(response.status).toBe(200);
      expect(mockCallLLM).toHaveBeenCalledWith(exactText, "en");
    });

    it("should reject text with 5001 chars", async () => {
      const tooLongText = "a".repeat(5001);
      const response = await request(app)
        .post("/api/simplify")
        .send({ text: tooLongText, language: "en" });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(mockCallLLM).not.toHaveBeenCalled();
    });

    it("should provide appropriate error message for oversized text", async () => {
      const longText = "a".repeat(5001);
      const response = await request(app)
        .post("/api/simplify")
        .send({ text: longText, language: "en" });

      expect(response.body.error).toContain("5,000");
    });
  });

  describe("LLM_UNAVAILABLE error", () => {
    it("should return 502 with LLM_UNAVAILABLE code when LLM service is down", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "LLM_UNAVAILABLE",
        error: "LLM service returned status 503",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Emergency alert", language: "en" });

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        error: "LLM service returned status 503",
        code: "LLM_UNAVAILABLE",
      });
    });

    it("should return 502 status code for LLM_UNAVAILABLE", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "LLM_UNAVAILABLE",
        error: "Connection refused",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Test alert", language: "en" });

      expect(response.status).toBe(502);
    });

    it("should include error message in response for LLM_UNAVAILABLE", async () => {
      const errorMsg = "Service temporarily unavailable";
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "LLM_UNAVAILABLE",
        error: errorMsg,
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert text", language: "en" });

      expect(response.body.error).toBe(errorMsg);
    });

    it("should have correct error response structure for LLM_UNAVAILABLE", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "LLM_UNAVAILABLE",
        error: "Service down",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert", language: "en" });

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(response.body.code).toBe("LLM_UNAVAILABLE");
    });
  });

  describe("TIMEOUT error", () => {
    it("should return 504 with TIMEOUT code when request exceeds 15 seconds", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "TIMEOUT",
        error: "Request timed out",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Emergency alert", language: "en" });

      expect(response.status).toBe(504);
      expect(response.body).toEqual({
        error: "Request timed out",
        code: "TIMEOUT",
      });
    });

    it("should return 504 status code for TIMEOUT", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "TIMEOUT",
        error: "Request timed out",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Test alert", language: "en" });

      expect(response.status).toBe(504);
    });

    it("should include timeout error message in response", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "TIMEOUT",
        error: "Request timed out after 15 seconds",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert text", language: "en" });

      expect(response.body.error).toContain("timed out");
    });

    it("should have correct error response structure for TIMEOUT", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "TIMEOUT",
        error: "Request timed out",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert", language: "en" });

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(response.body.code).toBe("TIMEOUT");
    });
  });

  describe("MALFORMED_RESPONSE error", () => {
    it("should return 502 with MALFORMED_RESPONSE code when LLM returns invalid JSON", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "MALFORMED_RESPONSE",
        error: "LLM response was not valid JSON",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Emergency alert", language: "en" });

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        error: "LLM response was not valid JSON",
        code: "MALFORMED_RESPONSE",
      });
    });

    it("should return 502 status code for MALFORMED_RESPONSE", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "MALFORMED_RESPONSE",
        error: "Invalid response structure",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Test alert", language: "en" });

      expect(response.status).toBe(502);
    });

    it("should include error message in response for MALFORMED_RESPONSE", async () => {
      const errorMsg = "LLM response missing required grade fields";
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "MALFORMED_RESPONSE",
        error: errorMsg,
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert text", language: "en" });

      expect(response.body.error).toBe(errorMsg);
    });

    it("should have correct error response structure for MALFORMED_RESPONSE", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "MALFORMED_RESPONSE",
        error: "Invalid JSON",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert", language: "en" });

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(response.body.code).toBe("MALFORMED_RESPONSE");
    });
  });

  describe("Input text preservation on error", () => {
    it("should preserve input text in state when LLM_UNAVAILABLE occurs", async () => {
      const inputText = "Critical emergency alert";
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "LLM_UNAVAILABLE",
        error: "Service down",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: inputText, language: "en" });

      // Verify the request was made with the correct text
      expect(mockCallLLM).toHaveBeenCalledWith(inputText, "en");
      expect(response.status).toBe(502);
    });

    it("should preserve input text in state when TIMEOUT occurs", async () => {
      const inputText = "Evacuation notice";
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "TIMEOUT",
        error: "Request timed out",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: inputText, language: "en" });

      expect(mockCallLLM).toHaveBeenCalledWith(inputText, "en");
      expect(response.status).toBe(504);
    });

    it("should preserve input text in state when MALFORMED_RESPONSE occurs", async () => {
      const inputText = "Weather alert";
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "MALFORMED_RESPONSE",
        error: "Invalid response",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: inputText, language: "en" });

      expect(mockCallLLM).toHaveBeenCalledWith(inputText, "en");
      expect(response.status).toBe(502);
    });

    it("should not call LLM when VALIDATION_ERROR occurs (empty text)", async () => {
      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "", language: "en" });

      expect(mockCallLLM).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
    });

    it("should not call LLM when VALIDATION_ERROR occurs (text too long)", async () => {
      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "a".repeat(5001), language: "en" });

      expect(mockCallLLM).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
    });
  });

  describe("Error response format compliance", () => {
    it("should always include error and code fields in error response", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "LLM_UNAVAILABLE",
        error: "Service error",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert", language: "en" });

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(Object.keys(response.body).length).toBe(2);
    });

    it("should not include variants field in error response", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "TIMEOUT",
        error: "Timeout",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert", language: "en" });

      expect(response.body).not.toHaveProperty("variants");
    });

    it("should have non-empty error message for all error codes", async () => {
      const errorCodes: Array<"LLM_UNAVAILABLE" | "TIMEOUT" | "MALFORMED_RESPONSE"> = [
        "LLM_UNAVAILABLE",
        "TIMEOUT",
        "MALFORMED_RESPONSE",
      ];

      for (const code of errorCodes) {
        mockCallLLM.mockResolvedValue({
          success: false,
          code,
          error: `Error for ${code}`,
        });

        const response = await request(app)
          .post("/api/simplify")
          .send({ text: "Alert", language: "en" });

        expect(response.body.error).toBeTruthy();
        expect(typeof response.body.error).toBe("string");
        expect(response.body.error.length).toBeGreaterThan(0);
      }
    });
  });

  describe("HTTP status code mapping", () => {
    it("should return 400 for VALIDATION_ERROR", async () => {
      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "", language: "en" });

      expect(response.status).toBe(400);
    });

    it("should return 502 for LLM_UNAVAILABLE", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "LLM_UNAVAILABLE",
        error: "Service down",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert", language: "en" });

      expect(response.status).toBe(502);
    });

    it("should return 504 for TIMEOUT", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "TIMEOUT",
        error: "Timeout",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert", language: "en" });

      expect(response.status).toBe(504);
    });

    it("should return 502 for MALFORMED_RESPONSE", async () => {
      mockCallLLM.mockResolvedValue({
        success: false,
        code: "MALFORMED_RESPONSE",
        error: "Invalid response",
      });

      const response = await request(app)
        .post("/api/simplify")
        .send({ text: "Alert", language: "en" });

      expect(response.status).toBe(502);
    });
  });
});
