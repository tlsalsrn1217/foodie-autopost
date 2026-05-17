"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  draftFormSchema,
  type DraftFormValues,
} from "@/lib/schemas/draftFormSchema";
import { PhotoDropzone } from "@/components/compose/PhotoDropzone";
import { MoodInput } from "@/components/compose/MoodInput";
import { KeywordChips } from "@/components/compose/KeywordChips";
import { PlacePicker } from "@/components/compose/PlacePicker";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default function ComposePage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const onSubmit = async (values: DraftFormValues) => {
    setSubmitError(null);
    try {
      const fd = new FormData();
      values.photos.forEach((f) => fd.append("photos", f));
      fd.append("mood", values.mood ?? "");
      fd.append("keywords", JSON.stringify(values.keywords));
      if (values.place) fd.append("place", JSON.stringify(values.place));

      const res = await fetch("/api/draft", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { draftId } = (await res.json()) as { draftId: string };
      router.push(`/preview/${draftId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "저장에 실패했어요";
      setSubmitError(msg);
    }
  };

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

        {submitError && (
          <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "AI 리뷰 생성 →"}
          </Button>
        </div>
      </form>
    </main>
  );
}
