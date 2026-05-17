import "server-only";
import type { Place } from "@/types/place";

const SEARCH_ENDPOINT = "https://openapi.naver.com/v1/search/local.json";

type NaverItem = {
  title: string;
  category?: string;
  description?: string;
  telephone?: string;
  address?: string;
  roadAddress?: string;
  mapx?: string;
  mapy?: string;
  link?: string;
};

function stripHtmlTags(s: string) {
  return s.replace(/<[^>]+>/g, "");
}

function toLatLng(mapx?: string, mapy?: string) {
  if (!mapx || !mapy) return { lat: 0, lng: 0 };
  const lng = Number(mapx) / 1e7;
  const lat = Number(mapy) / 1e7;
  return { lat, lng };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 가 설정되지 않았어요");
  }

  const url = `${SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&display=5&sort=random`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Naver search failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { items?: NaverItem[] };
  const items = data.items ?? [];

  return items.map((it) => {
    const { lat, lng } = toLatLng(it.mapx, it.mapy);
    return {
      name: stripHtmlTags(it.title ?? ""),
      address: it.address ?? "",
      roadAddress: it.roadAddress,
      category: it.category,
      url: it.link,
      lat,
      lng,
    };
  });
}
