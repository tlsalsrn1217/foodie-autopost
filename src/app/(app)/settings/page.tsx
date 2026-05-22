export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <header className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          앱 동작과 연동된 외부 서비스를 관리합니다.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-surface divide-y divide-border">
        <SettingRow
          label="LLM 제공자"
          value="Gemini 2.5 Flash"
          note="환경변수 LLM_PROVIDER 로 전환"
        />
        <SettingRow
          label="이미지 자동 최적화"
          value="활성 (1920px · JPEG q0.85)"
          note="업로드 직전 클라이언트에서 압축"
        />
        <SettingRow
          label="사진 한 장 최대 크기"
          value="20 MB"
        />
        <SettingRow
          label="공유 자격증명"
          value="APP_USERNAME / APP_PASSWORD"
          note="Phase 6 에서 Supabase Auth 로 교체 예정"
        />
        <SettingRow
          label="DB / Storage"
          value="Supabase"
        />
      </section>

      <section className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-4 text-xs text-muted-foreground">
        🛠 실시간으로 토글 가능한 설정 UI 는 다음 업데이트에서 추가됩니다. 지금은 환경변수와 코드에서 관리합니다.
      </section>
    </main>
  );
}

function SettingRow({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 text-left">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {note && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">{note}</div>
        )}
      </div>
      <div className="text-sm text-muted-foreground text-right">{value}</div>
    </div>
  );
}
