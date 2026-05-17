import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { GenerateInput, LLMProvider } from "./types";
import type { ReviewOutput } from "@/types/review";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts/reviewPrompt";

const MODEL = "gemini-2.5-flash";

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : "음식 리뷰";
}

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini" as const;
  readonly model = MODEL;

  private getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY 가 .env.local 에 없어요");
    return new GoogleGenAI({ apiKey });
  }

  private buildContents(input: GenerateInput) {
    const parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [];

    for (const photo of input.photoBytes) {
      parts.push({
        inlineData: {
          mimeType: photo.mimeType || "image/jpeg",
          data: bytesToBase64(photo.data),
        },
      });
    }

    parts.push({ text: buildUserPrompt(input) });

    return [{ role: "user" as const, parts }];
  }

  async generateReview(input: GenerateInput): Promise<ReviewOutput> {
    let markdown = "";
    for await (const chunk of this.streamReview(input)) {
      markdown += chunk;
    }
    return {
      html: "",
      markdown,
      title: extractTitle(markdown),
    };
  }

  async *streamReview(input: GenerateInput): AsyncIterable<string> {
    const ai = this.getClient();
    const stream = await ai.models.generateContentStream({
      model: this.model,
      contents: this.buildContents(input),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.8,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  }
}
