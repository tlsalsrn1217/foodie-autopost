import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 임시 잠금 (Phase 6에서 Supabase Auth 로 교체 예정).
 *
 * APP_PASSWORD 환경변수를 설정해두면 모든 라우트가 HTTP Basic Auth 로 보호됩니다.
 * 사용자명은 무엇이든 OK, 비밀번호만 일치하면 통과.
 *
 * APP_PASSWORD 가 비어 있으면 잠금 해제 (로컬 개발에서 편하게).
 */
export function middleware(req: NextRequest) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const [, password] = decoded.split(":");
      if (password === expected) {
        return NextResponse.next();
      }
    } catch {
      // 디코드 실패 → 그냥 401 응답
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="foodie-autopost", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: [
    // 정적 자산·이미지·favicon 은 통과
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
