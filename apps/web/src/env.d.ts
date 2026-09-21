/// <reference types="vite/client" />

interface ImportMetaEnv { readonly VITE_LEADERBOARD_API?: string }

declare const __V3_REVIEW__: null | {
  geometry: { canvas: { width: number; height: number }; origin: { x: number; y: number }; appBays: { index: number; center: number[]; footprint: number[][]; moduleOffset: { x: number; y: number } }[] };
  records: { name: string; bounds: { x: number; y: number; width: number; height: number }; sha256: string }[];
};
