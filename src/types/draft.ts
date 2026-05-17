import type { Place } from "./place";

export type PhotoInput = {
  storageKey: string;
  publicUrl?: string;
  mimeType: string;
  order: number;
};

export type DraftInput = {
  mood?: string;
  keywords: string[];
  place?: Place;
  photos: PhotoInput[];
};
