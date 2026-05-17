import type { GenerateInput, LLMProvider } from "./types";
import type { ReviewOutput } from "@/types/review";

export class ClaudeProvider implements LLMProvider {
  readonly name = "claude" as const;
  readonly model = "claude-sonnet-4-6";

  async generateReview(_input: GenerateInput): Promise<ReviewOutput> {
    throw new Error("Phase 4: implement Claude generateReview");
  }

  async *streamReview(_input: GenerateInput): AsyncIterable<string> {
    throw new Error("Phase 4: implement Claude streamReview");
  }
}
