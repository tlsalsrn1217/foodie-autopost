"use client";

import type { Place } from "@/types/place";

type Props = {
  restaurantName: string | undefined;
  mood: string | undefined;
  keywords: string[];
  place: Place | undefined;
  photos: File[];
};

/**
 * 네이버 블로그 모바일 뷰를 흉내낸 좌측 정렬 프리뷰.
 * 가로 폭 ~390px (iPhone 14 Pro 기준) 로 고정, 나눔고딕 폴백.
 */
export function MobilePreview({
  restaurantName,
  mood,
  keywords,
  place,
  photos,
}: Props) {
  const previewTitle = restaurantName?.trim() || place?.name || "여기에 식당 이름이 들어가요";
  const region = place?.roadAddress ?? place?.address ?? "위치 미입력";

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground text-left">
        Mobile Preview — Naver Blog
      </div>

      {/* 폰 프레임 */}
      <div
        className="overflow-hidden rounded-[28px] border-[10px] border-[#1A1A1A] bg-white shadow-lift"
        style={{ width: "min(390px, 100%)" }}
      >
        {/* 상단 상태 바 */}
        <div className="flex items-center justify-between bg-[#F5F5F5] px-4 py-1.5 text-[10px] text-[#333]">
          <span>9:41</span>
          <span>blog.naver.com</span>
          <span>■■■</span>
        </div>

        <div
          className="px-5 py-5 text-left text-[#1A1A1A]"
          style={{
            fontFamily:
              '"NanumGothic", "Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", "Pretendard Variable", sans-serif',
            fontSize: 15,
            lineHeight: 1.75,
          }}
        >
          {/* 제목 */}
          <h1
            className="text-left font-bold"
            style={{ fontSize: 20, lineHeight: 1.3, letterSpacing: "-0.01em" }}
          >
            {previewTitle}
          </h1>
          <div className="mt-1 text-[11px] text-[#888]">{region}</div>

          {/* 대표 사진 */}
          <div className="mt-4 overflow-hidden rounded-md bg-[#F0F0F0]">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={URL.createObjectURL(photos[0])}
                alt=""
                className="aspect-[4/3] w-full object-cover"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-xs text-[#999]">
                대표 사진이 여기에 표시돼요
              </div>
            )}
          </div>

          {/* 본문 미리보기 */}
          <div className="mt-5 space-y-4">
            {mood ? (
              <p className="text-left whitespace-pre-wrap">{mood}</p>
            ) : (
              <p className="text-left text-[#999]">
                방문 목적·인상을 입력하면 여기 본문 톤이 미리 보여요.
              </p>
            )}

            {keywords.length > 0 && (
              <div className="text-left">
                <div className="text-[12px] font-semibold">📌 핵심 포인트</div>
                <ul className="mt-1 list-disc list-inside text-[14px] text-[#333]">
                  {keywords.slice(0, 5).map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 추가 사진 자리표시자 */}
            {photos.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {photos.slice(1, 5).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={URL.createObjectURL(p)}
                    alt=""
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ))}
              </div>
            )}

            {/* 잼슐랭 요약 자리 */}
            <div className="mt-6 rounded-md border border-[#FF8C00]/30 bg-[#FFF7EC] p-4">
              <div className="text-[13px] font-bold">
                {previewTitle} 잼슐랭 요약
              </div>
              <ul className="mt-2 space-y-1 text-[13px] text-[#333]">
                <li>· 한줄평: AI 생성 후 표시</li>
                <li>· 잼슐랭 평점: ★★★★☆</li>
                <li>· 추천 타겟: AI 생성 후 표시</li>
                <li>· 영업시간: AI 생성 후 표시</li>
                <li>· 주차 여부: AI 생성 후 표시</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-left">
        실제 발행 글은 위 형태로 보여요. AI 생성 후엔 본문이 자연스러운 문단으로 채워집니다.
      </p>
    </div>
  );
}
