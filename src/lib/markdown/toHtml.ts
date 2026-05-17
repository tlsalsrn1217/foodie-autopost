import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * markdown → HTML 변환 (클립보드 text/html 용)
 * 단순한 변환만 수행 — 사진은 미리 자리표시자로 치환한 상태로 넘겨야 함.
 */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

/**
 * 네이버 블로그 SmartEditor 친화적인 형태로 약간 정돈.
 * - 자리표시자 문구는 회색 강조
 */
export function naverFriendlyHtml(markdown: string): string {
  const html = markdownToHtml(markdown);
  return html.replace(
    /\[사진\s*(\d+)을\s*넣어주세요\]/g,
    '<p style="color:#888;font-style:italic;">[사진 $1을 넣어주세요]</p>',
  );
}
