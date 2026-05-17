import type { DraftInput } from "@/types/draft";
import type { ReviewOutput } from "@/types/review";

export type GenerateInput = DraftInput & {
  photoBytes: Array<{ data: Uint8Array; mimeType: string }>;
};

export interface LLMProvider {
  readonly name: "gemini" | "claude";
  readonly model: string;
  generateReview(input: GenerateInput): Promise<ReviewOutput>;
  streamReview(input: GenerateInput): AsyncIterable<string>;
}
