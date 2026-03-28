import { generateSpeech } from "../tts";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("TTS Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, HUME_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should generate speech successfully", async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        audio: "base64encodedaudiodata",
      },
    });

    const result = await generateSpeech({
      text: "Emergency alert",
      language: "en",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.audio).toBe("base64encodedaudiodata");
    }
  });

  it("should fail when API key is missing", async () => {
    delete process.env.HUME_API_KEY;

    const result = await generateSpeech({
      text: "Emergency alert",
      language: "en",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("TTS_UNAVAILABLE");
    }
  });

  it("should fail when text is too long", async () => {
    const longText = "a".repeat(5001);

    const result = await generateSpeech({
      text: longText,
      language: "en",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("INVALID_INPUT");
    }
  });
});
