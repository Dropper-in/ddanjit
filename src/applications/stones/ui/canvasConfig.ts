// Canvas rendering constants + animation helpers for StoneThrower GIF export

// --- GIF frame layout ---
export const GIF_TITLEBAR_H = 36;
export const GIF_FOOTER_H = 56;
export const GIF_BORDER = 3;
export const GIF_MIN_W = 420;
export const GIF_MIN_H = 300;
// 인코딩 폭 상한 — 큰 업로드 이미지를 다운스케일해 GIF 인코딩 가속(픽셀 수가 폭²로 감소).
export const GIF_MAX_W = 480;
// DOM 스테이지(딴짓 창 콘텐츠) 기준 크기 — 캔버스 좌표 스케일 산출 기준.
export const STAGE_REF = 512;

// --- Animation keyframes ---
export const WOBBLE_KF = [
  { t: 0.0, r: 0 },
  { t: 0.12, r: -5 },
  { t: 0.25, r: 4 },
  { t: 0.37, r: -3 },
  { t: 0.5, r: 2 },
  { t: 0.65, r: -1 },
  { t: 0.8, r: 0.5 },
  { t: 1.0, r: 0 },
];

export const JELLY_KF = [
  { t: 0.0, sx: 1, sy: 1, skx: 0 },
  { t: 0.08, sx: 1.07, sy: 0.91, skx: -1.5 },
  { t: 0.2, sx: 0.95, sy: 1.08, skx: 1 },
  { t: 0.32, sx: 1.03, sy: 0.97, skx: -0.5 },
  { t: 0.45, sx: 0.98, sy: 1.03, skx: 0 },
  { t: 0.58, sx: 1.01, sy: 0.99, skx: 0 },
  { t: 0.72, sx: 0.995, sy: 1.005, skx: 0 },
  { t: 1.0, sx: 1, sy: 1, skx: 0 },
];

// --- Animation interpolation helpers ---
// 키프레임 배열을 progress(0~1)로 선형보간 — t로 구간 찾고 나머지 숫자 필드 모두 보간
function lerpKeyframes<K extends Record<string, number>>(kf: K[], progress: number): K {
  const clamped = Math.min(Math.max(progress, 0), 1);
  let from = kf[0];
  let to = kf[kf.length - 1];
  for (let i = 0; i < kf.length - 1; i++) {
    if (clamped >= kf[i].t && clamped <= kf[i + 1].t) {
      from = kf[i];
      to = kf[i + 1];
      break;
    }
  }
  const f = to.t === from.t ? 1 : (clamped - from.t) / (to.t - from.t);
  const out = {} as K;
  for (const key of Object.keys(from) as (keyof K)[]) {
    out[key] = (from[key] + (to[key] - from[key]) * f) as K[keyof K];
  }
  return out;
}

export function wobbleRotation(progress: number): number {
  return lerpKeyframes(WOBBLE_KF, progress).r;
}

export function jellyTransform(progress: number): { sx: number; sy: number; skx: number } {
  const { sx, sy, skx } = lerpKeyframes(JELLY_KF, progress);
  return { sx, sy, skx };
}
