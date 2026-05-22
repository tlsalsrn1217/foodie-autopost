// 디자인 목업 — 매거진 에디토리얼 톤의 블로그 발행 페이지 미리보기
// 실제 데이터 없이 샘플로 렌더. 사진은 Lorem Picsum placeholder.

const SAMPLE = {
  brand: "ACHELIN GUIDE",
  edition: "2026 · Vol. 17 · Spring",
  issueNo: "No. 042",
  category: "양식",
  region: "성수동",
  title: "오후의 다이닝",
  subtitle: "OFFICE HOURS",
  editorsNote:
    "파스타 한 그릇이 주말 오후를 단정하게 정리해주는 시간. 골목 안쪽 작은 공간에서 마주한 차분한 식사의 기록.",
  cover: "https://picsum.photos/seed/foodie-cover/1600/1000",
  paragraphs: [
    {
      photo: "https://picsum.photos/seed/foodie-interior/1200/900",
      body: "매장에 들어서자마자 받은 인상은 단정함이었다. 은은한 조명 아래 정갈하게 놓인 테이블들, 잔잔하게 흐르는 음악, 그리고 적당히 떨어진 테이블 간격. 옆자리 대화가 신경 쓰이지 않는 거리감이 마음을 가볍게 만들었다.",
    },
    {
      photo: "https://picsum.photos/seed/foodie-pasta/1200/900",
      body: "주문한 트러플 크림 파스타가 나왔다. 꾸덕한 소스 위로 은은하게 풍기는 트러플 향, 면은 알덴테로 단단했다. 한 입에 너무 진하지 않게, 두 입째에 비로소 풍성함이 드러나는 결.",
    },
    {
      photo: "https://picsum.photos/seed/foodie-steak/1200/900",
      body: "함께 주문한 부채살 스테이크. 미디움 레어로 정확히, 겉면은 단정하게 그을렸고 속은 촉촉했다. 양은 푸짐한 편이 아니라 둘이 메인을 따로 시킨 게 결과적으로 옳은 선택이었다.",
    },
  ],
  meta: {
    where: "서울 성수동 (성수역 도보 4분)",
    when: "2026. 5. 22. 토요일 오후 1시",
    price: "1인 35,000원 안팎",
    tags: ["성수동맛집", "성수동파스타", "오후의다이닝", "데이트", "주말브런치"],
  },
};

export default function MockupPage() {
  return (
    <div className="bg-[#FAF8F4] text-[#1A1B3D]">
      {/* 상단 마스트헤드 */}
      <header className="border-b border-[#1A1B3D]/15">
        <div className="mx-auto flex w-full max-w-3xl items-end justify-between px-6 py-5 sm:py-6">
          <div>
            <div
              className="font-serif text-2xl font-medium tracking-[0.18em] leading-none"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {SAMPLE.brand}
            </div>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-[#1A1B3D]/55">
              {SAMPLE.edition}
            </div>
          </div>
          <div className="text-right text-[10px] uppercase tracking-[0.25em] text-[#1A1B3D]/55">
            {SAMPLE.issueNo}
          </div>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-6 pb-24">
        {/* 히어로 */}
        <section className="pt-10 sm:pt-14">
          <div className="mb-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[#1A1B3D]/60">
            <span className="inline-block h-px w-6 bg-[#1A1B3D]/40" />
            <span>{SAMPLE.subtitle}</span>
          </div>

          <h1
            className="font-serif text-5xl sm:text-6xl font-medium leading-[1.05] tracking-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {SAMPLE.title}
          </h1>

          <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#1A1B3D]/60">
            <span>{SAMPLE.category}</span>
            <span className="inline-block h-px w-3 bg-[#1A1B3D]/40" />
            <span>{SAMPLE.region}</span>
          </div>
        </section>

        {/* 커버 사진 */}
        <figure className="mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SAMPLE.cover}
            alt="cover"
            className="aspect-[16/10] w-full object-cover"
          />
        </figure>

        {/* 에디터스 노트 */}
        <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-12">
          <div className="sm:col-span-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#1A1B3D]/55">
              Editor&apos;s Note
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#1A1B3D]/40">
              — Jamyoon
            </div>
          </div>
          <p
            className="sm:col-span-9 font-serif text-xl leading-relaxed text-[#1A1B3D]/90 italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            “{SAMPLE.editorsNote}”
          </p>
        </section>

        {/* 본문 — 사진 + 단락 */}
        <section className="mt-16 space-y-14">
          {SAMPLE.paragraphs.map((p, i) => (
            <div key={i} className="space-y-5">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photo}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#1A1B3D]/50">
                  Plate {String(i + 1).padStart(2, "0")}
                </figcaption>
              </figure>
              <p className="text-[15px] leading-[1.9] text-[#1A1B3D]/85">
                {p.body}
              </p>
            </div>
          ))}
        </section>

        {/* 메타 정보 — 잡지 인덱스 페이지 풍 */}
        <section className="mt-20 border-t border-[#1A1B3D]/15 pt-10">
          <dl className="grid grid-cols-1 gap-y-5 sm:grid-cols-12 sm:gap-y-6">
            {[
              { k: "WHERE", v: SAMPLE.meta.where },
              { k: "WHEN", v: SAMPLE.meta.when },
              { k: "PRICE", v: SAMPLE.meta.price },
            ].map((row) => (
              <div key={row.k} className="contents">
                <dt className="sm:col-span-3 text-[10px] uppercase tracking-[0.3em] text-[#1A1B3D]/55">
                  {row.k}
                </dt>
                <dd className="sm:col-span-9 text-sm">{row.v}</dd>
              </div>
            ))}
            <dt className="sm:col-span-3 text-[10px] uppercase tracking-[0.3em] text-[#1A1B3D]/55">
              TAGS
            </dt>
            <dd className="sm:col-span-9 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {SAMPLE.meta.tags.map((t) => (
                <span key={t} className="text-[#1A1B3D]/70">#{t}</span>
              ))}
            </dd>
          </dl>
        </section>

        {/* End marker */}
        <div className="mt-16 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] text-[#1A1B3D]/45">
          <span className="inline-block h-px w-8 bg-[#1A1B3D]/30" />
          <span>FIN</span>
          <span className="inline-block h-px w-8 bg-[#1A1B3D]/30" />
        </div>
      </article>

      {/* 디자인 노트 — 실제 발행글에는 안 들어감 */}
      <aside className="border-t border-[#1A1B3D]/10 bg-white/60">
        <div className="mx-auto w-full max-w-3xl px-6 py-10 text-xs leading-relaxed text-[#1A1B3D]/70 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#1A1B3D]/45">
            Design Notes
          </div>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>브랜드:</strong> <code>ACHELIN GUIDE 2026</code> — 자유롭게 변경 가능 (예: TASTE BUREAU / EDITORIAL TASTE / 한 그릇 가이드)</li>
            <li><strong>타이포:</strong> 제목·인용은 Cormorant Garamond/Noto Serif KR (세리프), 본문은 Pretendard (산세리프)</li>
            <li><strong>색:</strong> 크림 종이 <code>#FAF8F4</code> + 잉크 <code>#1A1B3D</code>. 강조 컬러는 절제.</li>
            <li><strong>레이아웃:</strong> 모든 텍스트 좌측 정렬, 12-col 그리드에서 메타는 col 3/본문 col 9</li>
            <li><strong>레퍼런스 톤:</strong> 하이엔드 미식 매거진 — 사진 1장 + 깊이 있는 코멘트 1단락, 충분한 여백</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
