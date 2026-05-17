"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * 브라우저용 Supabase 클라이언트 (anon key).
 * signed upload URL 로 사진을 직접 Supabase Storage 에 업로드하는 용도.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았어요",
    );
  }
  _client = createClient(url, anon);
  return _client;
}
