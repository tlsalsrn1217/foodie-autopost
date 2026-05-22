export const dynamic = "force-dynamic";

export default function PersonaStudio() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <header className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          페르소나 스튜디오
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 에디터의 톤·문체·전문 분야를 조정하는 공간입니다.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div className="text-left">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Current Persona
          </div>
          <h2 className="mt-1 text-lg font-semibold">
            29세 F&B 트렌드 에디터 & 콘텐츠 마케터
          </h2>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">성향</dt>
            <dd className="mt-1">
              트렌디한 공간과 미식에 관심이 많으며, 감정에 치우치지 않고 공간의 완성도와 맛의 밸런스를 에디터의 시선으로 냉철하게 분석함.
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">문체</dt>
            <dd className="mt-1">차분하고 담백한 &lsquo;-해요&rsquo; 체 중심의 구어체.</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">미식관</dt>
            <dd className="mt-1">
              화려한 플레이팅에만 현혹되지 않고 원재료의 신선도, 조리 온도감, 텍스처의 조화를 중시. 노포부터 파인다이닝까지 편견 없이 다룸.
            </dd>
          </div>
        </dl>

        <div className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          🛠 현재 페르소나는 시스템 프롬프트에 고정돼 있어요. 사용자가 직접 페르소나를 만들고 전환하는 기능은 다음 업데이트에서 추가됩니다.
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 space-y-3">
        <div className="text-left">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Coming Soon
          </div>
          <h2 className="mt-1 text-lg font-semibold">곧 추가될 기능</h2>
        </div>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
          <li>여러 페르소나 프리셋 저장 (예: 에디토리얼 / 솔직 후기 / 가족 식당)</li>
          <li>금지 표현 · 톤 슬라이더 (격식 ↔ 친근)</li>
          <li>전문 분야 태그 (한식·일식·파인다이닝·디저트 ...)</li>
          <li>페르소나별 평균 글 길이 · Bold 빈도 설정</li>
        </ul>
      </section>
    </main>
  );
}
