import type { LLMProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { ClaudeProvider } from "./claude";

export function getLLM(): LLMProvider {
  const choice = process.env.LLM_PROVIDER ?? "gemini";
  if (choice === "claude") return new ClaudeProvider();
  return new GeminiProvider();
}
