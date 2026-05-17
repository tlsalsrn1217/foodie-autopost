# 푸디 — AI 음식 리뷰 자동 포스팅 엔진

사진 + 짧은 메모 → 1인칭 솔직 톤의 네이버 블로그 리뷰를 생성하는 개인용 도구입니다.

## 스택

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind v4** + Pretendard
- **Prisma 7 + @prisma/adapter-pg** (PostgreSQL)
- **Supabase** (Postgres + Storage)
- **Gemini 2.5 Flash** via `@google/genai` (Vision + 스트리밍 + frontmatter SEO 메타)
- **Naver Local Search API** (지역 검색)
- **dnd-kit** (사진/단락 드래그 재배치)
- **marked / react-markdown** (마크다운 ↔ HTML)

## 로컬 개발

```bash
# 1. 환경변수
cp .env.example .env.local
# .env.local 채우기

# 2. DB 스키마 푸시
npx prisma db push

# 3. dev 서버
npm run dev
# → http://localhost:3000
```

> Next.js 16 Turbopack이 Windows에서 OOM 자주 떠서 `dev`는 webpack 모드 기본.
> Turbopack 시도하려면 `npm run dev:turbo`.

## Vercel 배포

1. **GitHub 저장소 만들기**
   - https://github.com/new 에서 새 repo 생성 (private 권장)
   - 로컬에서 push:
     ```bash
     git remote add origin <repo-url>
     git branch -M main
     git push -u origin main
     ```

2. **Vercel 연결**
   - https://vercel.com 가입 (GitHub 로그인)
   - "Add New" → "Project" → 방금 만든 repo 선택
   - Framework Preset: **Next.js** 자동 감지

3. **환경변수 설정** — Vercel 프로젝트 Settings → Environment Variables에 `.env.example`의 모든 키 추가.
   특히 `DATABASE_URL`은 **Transaction pooler (port 6543)** 변형 사용:
   ```
   postgresql://postgres.<REF>:<PW>@aws-1-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

4. **Deploy** 클릭 → 빌드 완료 후 `https://your-project.vercel.app` 자동 발급.

5. **모바일 접속**: 발급된 URL을 모바일 브라우저로 열면 됨. HTTPS 자동.

## 주요 디렉토리

```
src/
├── app/
│   ├── (app)/                    # 대시보드 그룹 (사이드바)
│   │   ├── layout.tsx
│   │   └── page.tsx              # 홈 = 최근 리뷰 카드
│   ├── compose/page.tsx          # 새 리뷰 작성 (사진/메모/키워드/장소)
│   ├── preview/[draftId]/        # 미리보기 + 편집 + 발행 도우미
│   └── api/
│       ├── draft/                # CRUD + revise-block + revise-all
│       ├── generate/             # AI 본문/제목 생성 (스트리밍)
│       └── places/search/        # 네이버 지역검색 프록시
├── components/
│   ├── compose/                  # 입력 폼 컴포넌트
│   ├── preview/                  # 미리보기 + 블럭 에디터
│   ├── dashboard/                # 사이드바 / 탑바
│   └── ui/                       # Button, Input, Card 등 primitives
├── lib/
│   ├── llm/                      # Gemini provider + 프롬프트 + frontmatter parser
│   ├── markdown/                 # markdown ↔ blocks ↔ html
│   ├── db.ts                     # Prisma 클라이언트 (driver adapter)
│   ├── storage.ts                # Supabase Storage 업로드
│   ├── supabase.ts               # 서버사이드 admin client
│   └── naver.ts                  # 지역검색 API 래퍼
└── generated/prisma/             # prisma client (gitignored)
```

## 빠른 액션

| 무엇 | 어디 |
|---|---|
| AI 톤·페르소나 수정 | `src/lib/llm/prompts/reviewPrompt.ts` |
| 디자인 토큰 (색·폰트) | `src/app/globals.css` `@theme` |
| 사이드바 항목 | `src/components/dashboard/Sidebar.tsx` |
| SEO meta 필드 추가 | `prisma/schema.prisma` + `parseFrontmatter.ts` |
