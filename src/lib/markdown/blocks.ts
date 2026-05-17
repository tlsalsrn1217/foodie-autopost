// Markdown <-> Block 모델
// 사진 드래그 재배치, 문단별 편집 등의 기반.

export type Block =
  | { id: string; kind: "h1"; text: string }
  | { id: string; kind: "h2"; text: string }
  | { id: string; kind: "p"; text: string }
  | { id: string; kind: "photo"; photoNumber: number };

const PHOTO_ONLY_RE = /^\s*\[(?:이미지\s*|PHOTO_)(\d+)\]\s*$/;
const INLINE_PHOTO_RE = /\[(?:이미지\s*|PHOTO_)(\d+)\]/g;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `b-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

/**
 * Markdown body (frontmatter, leading H1 모두 제거된 본문) 를 블럭 리스트로 파싱.
 * - `[이미지 N]` 단독 줄 → photo 블럭
 * - 줄에 인라인으로 섞인 `[이미지 N]` → 해당 위치를 photo 블럭으로 쪼개고 좌우 텍스트는 별도 p 블럭
 * - 빈 줄로 분리된 문단 단위
 */
export function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  const normalized = body.replace(/\r\n/g, "\n").trim();
  if (!normalized) return blocks;

  // 빈 줄(또는 2개 이상의 newline) 로 split — 단락 단위
  const paragraphs = normalized.split(/\n{2,}/);

  for (const raw of paragraphs) {
    const para = raw.trim();
    if (!para) continue;

    // 단독 사진 줄
    const photoOnly = para.match(PHOTO_ONLY_RE);
    if (photoOnly) {
      blocks.push({
        id: makeId(),
        kind: "photo",
        photoNumber: Number(photoOnly[1]),
      });
      continue;
    }

    // 단락 안에 [이미지 N]이 인라인으로 섞여 있으면 분리
    if (INLINE_PHOTO_RE.test(para)) {
      INLINE_PHOTO_RE.lastIndex = 0;
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = INLINE_PHOTO_RE.exec(para)) !== null) {
        const before = para.slice(lastIndex, m.index).trim();
        if (before) blocks.push(classifyTextBlock(before));
        blocks.push({ id: makeId(), kind: "photo", photoNumber: Number(m[1]) });
        lastIndex = m.index + m[0].length;
      }
      const after = para.slice(lastIndex).trim();
      if (after) blocks.push(classifyTextBlock(after));
      continue;
    }

    blocks.push(classifyTextBlock(para));
  }

  return blocks;
}

function classifyTextBlock(para: string): Block {
  if (/^#\s+/.test(para)) {
    return { id: makeId(), kind: "h1", text: para.replace(/^#\s+/, "").trim() };
  }
  if (/^##\s+/.test(para)) {
    return { id: makeId(), kind: "h2", text: para.replace(/^##\s+/, "").trim() };
  }
  return { id: makeId(), kind: "p", text: para };
}

/**
 * 블럭 리스트를 다시 markdown 본문으로 직렬화.
 * 사진 블럭은 항상 `[이미지 N]` 형태로 (구버전 PHOTO_N 은 통일).
 */
export function serializeBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.kind) {
        case "h1":
          return `# ${b.text}`;
        case "h2":
          return `## ${b.text}`;
        case "photo":
          return `[이미지 ${b.photoNumber}]`;
        case "p":
          return b.text;
      }
    })
    .join("\n\n");
}

/** body 내의 사진 마커들이 1..N 의 연속 번호인지 확인 */
export function usedPhotoNumbers(blocks: Block[]): number[] {
  const set = new Set<number>();
  for (const b of blocks) if (b.kind === "photo") set.add(b.photoNumber);
  return [...set].sort((a, b) => a - b);
}
