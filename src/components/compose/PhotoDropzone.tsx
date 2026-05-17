"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

type Props = {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
};

export function PhotoDropzone({ value, onChange, maxFiles = 10 }: Props) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = value.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [value]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const next = [...value, ...accepted].slice(0, maxFiles);
      onChange(next);
    },
    [value, onChange, maxFiles],
  );

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const remaining = maxFiles - value.length;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [".heic"],
    },
    maxFiles: remaining,
    disabled: remaining <= 0,
  });

  const previewCells = useMemo(
    () =>
      previews.map((url, idx) => (
        <div
          key={url}
          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`photo ${idx + 1}`}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="사진 제거"
          >
            ×
          </button>
          {idx === 0 && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              대표
            </span>
          )}
        </div>
      )),
    [previews],
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {previewCells}
        {remaining > 0 && (
          <div
            {...getRootProps()}
            className={cn(
              "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
            )}
          >
            <input {...getInputProps()} />
            <span className="text-3xl text-muted-foreground">+</span>
            <span className="text-xs text-muted-foreground">
              {isDragActive ? "여기에 놓기" : `사진 추가 (${value.length}/${maxFiles})`}
            </span>
          </div>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          첫 번째 사진이 대표 이미지로 사용돼요. 드래그로 순서 변경은 곧 지원 예정.
        </p>
      )}
    </div>
  );
}
