import { z } from "zod";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export const photoFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_PHOTO_BYTES, "사진은 8MB 이하만 가능해요")
  .refine(
    (f) => ACCEPTED_MIME.includes(f.type) || f.name.toLowerCase().endsWith(".heic"),
    "JPG, PNG, WebP, HEIC만 지원해요",
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
  keywords: z.array(z.string().min(1).max(20)).max(10).default([]),
  place: placeSchema.optional(),
});

export type DraftFormValues = z.infer<typeof draftFormSchema>;
