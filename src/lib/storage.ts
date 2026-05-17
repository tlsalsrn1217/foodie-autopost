import "server-only";
import { supabaseAdmin } from "./supabase";

const BUCKET = "photos";

let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;
  const { data: list } = await supabaseAdmin.storage.listBuckets();
  const exists = list?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
  }
  bucketReady = true;
}

function extFromMime(mime: string, filename?: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heic",
  };
  if (map[mime]) return map[mime];
  const dot = filename?.lastIndexOf(".");
  if (filename && dot !== undefined && dot > -1) {
    return filename.slice(dot + 1).toLowerCase();
  }
  return "bin";
}

export type UploadResult = {
  storageKey: string;
  publicUrl: string;
  mimeType: string;
};

export async function uploadDraftPhoto(
  draftId: string,
  photoId: string,
  file: File,
): Promise<UploadResult> {
  await ensureBucket();

  const ext = extFromMime(file.type, file.name);
  const storageKey = `drafts/${draftId}/${photoId}.${ext}`;
  const arrayBuf = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storageKey, arrayBuf, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storageKey);

  return { storageKey, publicUrl, mimeType: file.type };
}

// 브라우저 → Supabase 직접 업로드를 위한 signed URL 발급.
// Vercel 서버리스 함수 4.5MB 본문 한도를 우회.
export type SignedUploadSlot = {
  order: number;
  storageKey: string;
  publicUrl: string;
  token: string;        // Supabase uploadToSignedUrl 용
  mimeType: string;
};

export async function createPhotoUploadSlots(
  draftId: string,
  files: Array<{ mimeType: string; filename?: string }>,
): Promise<SignedUploadSlot[]> {
  await ensureBucket();

  const slots: SignedUploadSlot[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = extFromMime(file.mimeType, file.filename);
    const order = i;
    const storageKey = `drafts/${draftId}/${String(order).padStart(2, "0")}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storageKey, { upsert: true });

    if (error || !data) {
      throw new Error(
        `signed upload URL 생성 실패 (${order}번 사진): ${error?.message ?? "unknown"}`,
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storageKey);

    slots.push({
      order,
      storageKey,
      publicUrl,
      token: data.token,
      mimeType: file.mimeType,
    });
  }

  return slots;
}
