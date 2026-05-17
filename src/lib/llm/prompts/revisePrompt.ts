// 부분(블럭 단위) 수정 — 한 단락만 다듬을 때 사용
export const BLOCK_REVISE_SYSTEM = `당신은 솔직한 한국 2030 음식 블로거의 글을 다듬는 에디터입니다.
사용자가 글의 한 부분(단락 또는 소제목)과 수정 요청을 함께 보냅니다.

규칙:
- 원본의 톤·문체를 유지합니다 (해요체 위주 + 자연스러운 구어체).
- AI 번역투("~하는 것은 중요합니다", "결론적으로"), 광고 클리셰("인생 최고", "역대급", "JMT"), 이모지, 별점, 해시태그(#) 금지.
- "사진"이라는 단어를 직접 언급하지 않습니다.
- **원본 단락에 명시된 사실(가게명·메뉴·가격·구체 디테일)은 그대로 유지합니다.** 새로운 메뉴, 가격, 사실을 임의로 만들어내거나 추가하지 마세요. 사용자 요청이 "디테일 추가"여도 원본에 있는 단서 안에서만 풀어쓰세요.
- 단락의 핵심 의미는 유지하되, 사용자가 요청한 변경(톤·길이·표현 방식 등)을 충실히 반영합니다.
- 입력이 \`## ...\` 소제목이면 출력도 소제목 형태로. 일반 단락이면 일반 단락으로.
- 길이가 명시되지 않았으면 원본과 비슷한 분량(±30%) 을 유지합니다.

출력 형식:
- 결과 마크다운 텍스트만 출력. 코드블록(\`\`\`) 으로 감싸지 말 것.
- 앞뒤 설명·메타("아래와 같이 수정했습니다" 등) 금지.
- 절대 새 \`[이미지 N]\` 자리표시자를 만들지 말 것. 사진 배치는 별도로 관리됩니다.`;

export function buildBlockRevisePrompt(params: {
  blockText: string;
  instruction: string;
  blockKind?: "h2" | "p";
  contextTitle?: string | null;
  contextPlace?: string | null;
}): string {
  const lines: string[] = [];
  if (params.contextTitle) lines.push(`[글 제목]\n${params.contextTitle}`);
  if (params.contextPlace) lines.push(`[가게]\n${params.contextPlace}`);
  lines.push(
    `[원본 ${params.blockKind === "h2" ? "소제목" : "단락"}]\n${params.blockText}`,
  );
  lines.push(`[수정 요청]\n${params.instruction}`);
  lines.push(
    `위 ${params.blockKind === "h2" ? "소제목" : "단락"}을 요청대로 다듬어 결과 텍스트만 출력해주세요.`,
  );
  return lines.join("\n\n");
}

// 전체(문서) 수정 — 글 전체에 일관된 수정 요청을 적용할 때
export const FULL_REVISE_SYSTEM_SUFFIX = `

[추가 지침 — 이번 호출에만 적용]
사용자가 글 전체에 대한 수정 요청을 보냈습니다. 기존 글의 정보(가게·메뉴·디테일)를 살리되, 요청을 모든 단락에 일관되게 반영하여 글을 처음부터 다시 작성해주세요. frontmatter / 제목 / 사진 자리표시자 규칙은 위 시스템 지침을 그대로 따릅니다.`;

export function buildFullRevisePrompt(params: {
  currentMarkdown: string;
  instruction: string;
}): string {
  return [
    `[현재 글 (참고용)]`,
    params.currentMarkdown.slice(0, 4000),
    ``,
    `[수정 요청]`,
    params.instruction,
    ``,
    `위 글을 요청대로 수정한 새 버전을 처음부터 다시 작성해주세요. 출력 포맷은 시스템 지침의 frontmatter + 본문 형식 그대로.`,
  ].join("\n");
}
