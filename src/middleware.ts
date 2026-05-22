import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 임시 공유 로그인 (Phase 6에서 Supabase Auth 로 교체 예정).
 *
 * 환경변수 셋팅:
 *  - APP_USERNAME + APP_PASSWORD 둘 다 설정 → 사용자명·비밀번호 둘 다 일치해야 통과
 *  - APP_PASSWORD 만 설정 → 사용자명은 아무거나, 비밀번호만 일치하면 통과
 *  - 둘 다 비어 있음 → 잠금 해제 (로컬 개발용)
 *
 * 어떤 사람이 접속해도 정확한 ID/PW 를 입력하면 들어올 수 있는 단일 공유 자격증명 모델.
 */
export function middleware(req: NextRequest) {
  const expectedUsername = process.env.APP_USERNAME;
  const expectedPassword = process.env.APP_PASSWORD;

  // 잠금 해제
  if (!expectedPassword && !expectedUsername) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const sep = decoded.indexOf(":");
      const providedUsername = sep >= 0 ? decoded.slice(0, sep) : "";
      const providedPassword = sep >= 0 ? decoded.slice(sep + 1) : "";

      const usernameOk = !expectedUsername || providedUsername === expectedUsername;
      const passwordOk = !expectedPassword || providedPassword === expectedPassword;

      if (usernameOk && passwordOk) {
        return NextResponse.next();
      }
    } catch {
      // 디코드 실패 → 401 재요청
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
