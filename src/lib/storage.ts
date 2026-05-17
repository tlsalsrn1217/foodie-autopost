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
