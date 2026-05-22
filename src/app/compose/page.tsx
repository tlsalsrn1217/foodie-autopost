"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  draftFormSchema,
  type DraftFormValues,
} from "@/lib/schemas/draftFormSchema";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { compressImage } from "@/lib/imageCompress";
import { PhotoDropzone } from "@/components/compose/PhotoDropzone";
import { MoodInput } from "@/components/compose/MoodInput";
import { KeywordChips } from "@/components/compose/KeywordChips";
import { PlacePicker } from "@/components/compose/PlacePicker";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

type Stage =
  | { kind: "idle" }
  | { kind: "creating" } // /api/draft 호출 중
  | { kind: "compressing"; done: number; total: number } // 클라이언트 압축
  | { kind: "signing" } // /api/draft/[id]/upload-urls 호출 중
  | { kind: "uploading"; done: number; total: number } // 사진 직접 업로드 진행
  | { kind: "committing" } // /api/draft/[id]/photos 기록 중
  | { kind: "error"; message: string };

export default function ComposePage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "idle" });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DraftFormValues>({
    resolver: zodResolver(draftFormSchema),
    defaultValues: {
      photos: [],
      mood: "",
      keywords: [],
      place: undefined,
    },
  });

  async function uploadOnePhoto(slot: {
    storageKey: string;
    token: string;
    mimeType: string;
  }, file: File) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.storage
      .from("photos")
      .uploadToSignedUrl(slot.storageKey, slot.token, file, {
        contentType: file.type || slot.mimeType,
        upsert: true,
      });
    if (error) throw new Error(`사진 업로드 실패: ${error.message}`);
  }

  const onSubmit = async (values: DraftFormValues) => {
    try {
      // 1) Draft 메타데이터 먼저 생성 (사진은 별도로 직접 업로드 후 첨부)
      setStage({ kind: "creating" });
      const createRes = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: values.mood ?? "",
          keywords: values.keywords,
          place: values.place,
        }),
      });
      if (!createRes.ok) throw new Error(`Draft 생성 실패 (${createRes.status})`);
      const { draftId } = (await createRes.json()) as { draftId: string };

      // 2) 클라이언트 사진 압축 — Naver 블로그 붙여넣기 호환 + 용량/대역폭 절약
      setStage({ kind: "compressing", done: 0, total: values.photos.length });
      const compressed: File[] = [];
      for (let i = 0; i < values.photos.length; i++) {
        const c = await compressImage(values.photos[i]);
        compressed.push(c);
        setStage({
          kind: "compressing",
          done: i + 1,
          total: values.photos.length,
        });
      }

      // 3) signed upload URL 발급 (서버 → Supabase)
      setStage({ kind: "signing" });
      const signRes = await fetch(`/api/draft/${draftId}/upload-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: compressed.map((f) => ({
            mimeType: f.type || "image/jpeg",
            filename: f.name,
          })),
        }),
      });
      if (!signRes.ok) throw new Error(`upload URL 발급 실패 (${signRes.status})`);
      const { slots } = (await signRes.json()) as {
        slots: Array<{
          order: number;
          storageKey: string;
          publicUrl: string;
          token: string;
          mimeType: string;
        }>;
      };

      // 4) 브라우저 → Supabase 직접 업로드 (Vercel 4.5MB 한도 우회)
      setStage({ kind: "uploading", done: 0, total: slots.length });
      let done = 0;
      // 동시 업로드 — 모바일 네트워크 고려해 4개씩 묶음
      const queue = [...slots];
      const workers: Promise<void>[] = [];
      const CONCURRENCY = 4;
      for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(
          (async () => {
            while (queue.length > 0) {
              const slot = queue.shift();
              if (!slot) break;
              await uploadOnePhoto(slot, compressed[slot.order]);
              done++;
              setStage({ kind: "uploading", done, total: slots.length });
            }
          })(),
        );
      }
      await Promise.all(workers);

      // 4) Photo 레코드 생성 (서버에 결과 통보)
      setStage({ kind: "committing" });
      const commitRes = await fetch(`/api/draft/${draftId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: slots.map((s) => ({
            order: s.order,
            storageKey: s.storageKey,
            publicUrl: s.publicUrl,
            mimeType: s.mimeType,
          })),
        }),
      });
      if (!commitRes.ok) throw new Error(`사진 등록 실패 (${commitRes.status})`);

      router.push(`/preview/${draftId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "저장에 실패했어요";
      setStage({ kind: "error", message: msg });
    }
  };

  const isBusy = stage.kind !== "idle" && stage.kind !== "error";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          새 리뷰 만들기
        </h1>
        <p className="mt-2 text-muted-foreground">
          사진과 짧은 메모만 있으면 충분해요. 나머지는 AI가 받아 적을게요.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>사진</CardTitle>
            <CardDescription>
              음식·공간·메뉴판 사진을 자유롭게. 최대 10장.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="photos"
              render={({ field }) => (
                <PhotoDropzone value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.photos && (
              <p className="mt-2 text-sm text-danger">
                {errors.photos.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>한 줄 감상</CardTitle>
            <CardDescription>
              방문 인상을 짧게. 솔직할수록 좋아요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="mood"
              render={({ field }) => (
                <MoodInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.mood && (
              <p className="mt-2 text-sm text-danger">{errors.mood.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>키워드</CardTitle>
            <CardDescription>
              포인트 단어들. 엔터로 추가, 최대 10개.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="keywords"
              render={({ field }) => (
                <KeywordChips value={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span>가게 정보</span>{" "}
              <span className="text-xs font-normal text-muted-foreground">(선택)</span>
            </CardTitle>
            <CardDescription>
              검색해서 선택하면 글에 지도가 함께 들어가요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="place"
              render={({ field }) => (
                <PlacePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>

        {stage.kind !== "idle" && stage.kind !== "error" && (
          <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
            {stage.kind === "creating" && "초안 생성 중..."}
            {stage.kind === "compressing" && (
              <>
                사진 최적화 중 ({stage.done}/{stage.total}) — 블로그 호환 사이즈로 변환
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${(stage.done / stage.total) * 100}%` }}
                  />
                </div>
              </>
            )}
            {stage.kind === "signing" && "사진 업로드 준비 중..."}
            {stage.kind === "uploading" && (
              <>
                사진 업로드 중 ({stage.done}/{stage.total})
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${(stage.done / stage.total) * 100}%` }}
                  />
                </div>
              </>
            )}
            {stage.kind === "committing" && "최종 정리 중..."}
          </div>
        )}

        {stage.kind === "error" && (
          <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            {stage.message}
          </div>
        )}

        {/* 폼 검증 실패 시 — 어디서 막혔는지 한눈에 */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger space-y-1">
            <div className="font-semibold">입력에 문제가 있어요</div>
            <ul className="list-disc list-inside text-xs">
              {errors.photos && (
                <li>
                  사진: {(errors.photos as { message?: string }).message ?? "확인 필요"}
                </li>
              )}
              {errors.mood && <li>한 줄 감상: {errors.mood.message}</li>}
              {errors.keywords && (
                <li>
                  키워드: {(errors.keywords as { message?: string }).message ?? "확인 필요"}
                </li>
              )}
              {errors.place && (
                <li>가게 정보: 형식이 올바르지 않아요</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
            disabled={isBusy || isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" size="lg" disabled={isBusy || isSubmitting}>
            {isBusy ? "처리 중..." : "AI 리뷰 생성 →"}
          </Button>
        </div>
      </form>
    </main>
  );
}
