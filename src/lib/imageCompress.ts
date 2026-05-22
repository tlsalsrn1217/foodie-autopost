// 브라우저에서 사진을 Canvas 로 리사이즈 + JPEG 재인코딩.
// 네이버 블로그 붙여넣기·Supabase 용량·전송량 부담을 한 번에 줄이는 용도.

export type CompressOptions = {
  maxDimension?: number; // 가로/세로 중 더 긴 쪽의 최대 픽셀
  quality?: number; // JPEG 품질 0~1
};

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1920,
  quality: 0.85,
};

/**
 * 입력 File 을 압축한 새 File 로 반환.
 * - 변환 실패하거나 압축 후 더 커지면 원본 그대로 반환 (안전 폴백)
 * - 출력은 image/jpeg, 파일명은 .jpg
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const { maxDimension, quality } = { ...DEFAULTS, ...options };

  // Canvas 가 못 다루는 경우 (대부분 HEIC on non-Safari) 원본 반환
  if (typeof document === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const longer = Math.max(bitmap.width, bitmap.height);
    const scale = longer > maxDimension ? maxDimension / longer : 1;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    if (!blob) return file;

    // 압축 결과가 더 크면 (이미 작은 파일·비현실적인 경우) 원본 유지
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    // HEIC/HEIF on non-Safari 등 디코드 실패 → 원본 그대로
    return file;
  }
}
