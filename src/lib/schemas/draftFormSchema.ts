import { z } from "zod";

const MAX_PHOTO_BYTES = 20 * 1024 * 1024; // 20MB — 최신 휴대폰 원본 사진 대응

// 폭넓게 허용 — 표준 이미지 포맷이면 통과
const ACCEPTED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/gif",
  "image/bmp",
];
const ACCEPTED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".gif", ".bmp"];

function hasAcceptedExt(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXT.some((ext) => lower.endsWith(ext));
}

export const photoFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_PHOTO_BYTES, "사진은 20MB 이하만 올릴 수 있어요")
  .refine(
    (f) =>
      ACCEPTED_MIME.includes(f.type) ||
      // 일부 브라우저는 type 을 비워서 보냄 — 확장자로 폴백
      hasAcceptedExt(f.name),
    "지원하지 않는 형식이에요 (JPG·PNG·WebP·HEIC·AVIF 등)",
  );

export const placeSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  roadAddress: z.string().optional(),
  category: z.string().optional(),
  url: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
});

export const draftFormSchema = z.object({
  photos: z
    .array(photoFileSchema)
    .min(1, "사진을 한 장 이상 올려주세요")
    .max(10, "사진은 최대 10장까지"),
  mood: z
    .string()
    .max(500, "메모는 500자 이하로 부탁드려요")
    .optional()
    .or(z.literal("")),
  keywords: z.array(z.string().min(1).max(20)).max(10),
  place: placeSchema.optional(),
});

export type DraftFormValues = z.infer<typeof draftFormSchema>;
