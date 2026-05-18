// 주소 문자열 → "시도 + 시군구" 형태 (예: "서울 마포구", "경기 성남시")
//
// 보관함 페이지에서 지역별 폴더 그룹핑에 사용.

const SIDO_MAP: Array<[RegExp, string]> = [
  [/^서울특별시\s*/, "서울 "],
  [/^부산광역시\s*/, "부산 "],
  [/^대구광역시\s*/, "대구 "],
  [/^인천광역시\s*/, "인천 "],
  [/^광주광역시\s*/, "광주 "],
  [/^대전광역시\s*/, "대전 "],
  [/^울산광역시\s*/, "울산 "],
  [/^세종특별자치시\s*/, "세종"],
  [/^경기도\s*/, "경기 "],
  [/^강원(?:특별자치)?도\s*/, "강원 "],
  [/^충청북도\s*/, "충북 "],
  [/^충청남도\s*/, "충남 "],
  [/^전라북도\s*/, "전북 "],
  [/^전북특별자치도\s*/, "전북 "],
  [/^전라남도\s*/, "전남 "],
  [/^경상북도\s*/, "경북 "],
  [/^경상남도\s*/, "경남 "],
  [/^제주특별자치도\s*/, "제주 "],
];

export function extractRegion(addr: string | null | undefined): string {
  if (!addr) return "미지정";
  let s = addr.trim();
  if (!s) return "미지정";

  for (const [re, replacement] of SIDO_MAP) {
    s = s.replace(re, replacement);
  }

  const tokens = s.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "미지정";

  // 세종같이 시도만 있고 시군구 없는 경우
  if (tokens.length === 1) return tokens[0];

  // "시도 + 시군구"
  return `${tokens[0]} ${tokens[1]}`;
}
