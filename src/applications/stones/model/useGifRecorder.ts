import { useState, useEffect, useCallback, useRef } from 'react';
import type React from 'react';
import { AMMO_TYPES, ARC_HEIGHT, getReactions } from './constants';
import { loadImg } from './imageUtils';
import {
  GIF_TITLEBAR_H,
  GIF_FOOTER_H,
  GIF_BORDER,
  GIF_MIN_W,
  GIF_MIN_H,
  GIF_MAX_W,
  STAGE_REF,
  wobbleRotation,
  jellyTransform,
} from '../ui/canvasConfig';
import type { FrameSnapshot } from './types';

async function prerenderEmoji(emoji: string, size: number): Promise<HTMLCanvasElement> {
  // Mona Emoji는 12px 픽셀 폰트 → 1:1 prerender 후 nearest neighbor 스케일
  const dim = size;
  const fontPx = Math.round(dim * 0.85);
  const fontSpec = `${fontPx}px "Mona Emoji", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  if (document.fonts?.load) {
    try {
      await document.fonts.load(`${fontPx}px "Mona Emoji"`, emoji);
    } catch {}
  }
  // blob 왕복(toBlob → objectURL → Image) 제거 — canvas를 drawImage 소스로 직접 반환
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.font = fontSpec;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, dim / 2, dim / 2);
  return canvas;
}

// startRecording 시 1회 스냅샷하는 테마 색상(녹화 중 불변 가정)
type ThemeSnapshot = {
  paper: string;
  ink: string;
  chrome: string;
  bevelHi: string;
  bevelLo: string;
  bevelXlo: string;
  titlebar: string;
  titlebar2: string;
  titlebarFg: string;
};

function snapshotTheme(): ThemeSnapshot {
  const cs = getComputedStyle(document.documentElement);
  const getCssVar = (name: string) => cs.getPropertyValue(name).trim();
  return {
    paper: getCssVar('--paper'),
    ink: getCssVar('--ink'),
    chrome: getCssVar('--chrome'),
    bevelHi: getCssVar('--bevel-hi'),
    bevelLo: getCssVar('--bevel-lo'),
    bevelXlo: getCssVar('--bevel-xlo'),
    titlebar: getCssVar('--titlebar'),
    titlebar2: getCssVar('--titlebar-2'),
    titlebarFg: getCssVar('--titlebar-fg'),
  };
}

// CanvasImageSource의 고유 크기 — HTMLImageElement는 naturalWidth, canvas 등은 width 사용
function imgSourceWidth(src: CanvasImageSource): number {
  if (src instanceof HTMLImageElement) return src.naturalWidth;
  if (src instanceof HTMLCanvasElement || src instanceof ImageBitmap) return src.width;
  return (src as HTMLVideoElement).videoWidth ?? 0;
}

function imgSourceHeight(src: CanvasImageSource): number {
  if (src instanceof HTMLImageElement) return src.naturalHeight;
  if (src instanceof HTMLCanvasElement || src instanceof ImageBitmap) return src.height;
  return (src as HTMLVideoElement).videoHeight ?? 0;
}

export type GifRecorderRefs = {
  hiddenCanvas: React.RefObject<HTMLCanvasElement | null>;
  target: React.RefObject<HTMLDivElement | null>;
  // 렌더 주기와 동기화되는 state 파생 값 묶음 — StoneThrower가 매 렌더 한 번에 갱신
  snapshot: React.MutableRefObject<FrameSnapshot>;
  // 렌더 주기 밖에서 갱신되는 값들은 개별 ref로 유지 (snapshot에 넣으면 stale)
  imgDims: React.MutableRefObject<{ width: number; height: number }>;
  throwing: React.MutableRefObject<boolean>;
  jellyStart: React.MutableRefObject<number>;
  jellyDuration: number;
  wobbleDuration: number;
  domTargetSize: number;
};

// ─── canvas draw ────────────────────────────────────────────────────────────

function drawFrame(
  canvas: HTMLCanvasElement,
  refs: GifRecorderRefs,
  imgCache: Map<string, CanvasImageSource>,
  theme: ThemeSnapshot,
) {
  const { imgDims, throwing, jellyStart, target } = refs;
  const { game, shake, reactionFrame, characterUrl, shotCount, ammoId, showReaction } =
    refs.snapshot.current;
  const { width: rawWidth, height: rawHeight } = imgDims.current;

  let imgWidth = rawWidth,
    imgHeight = rawHeight;
  if (imgWidth < GIF_MIN_W) {
    imgHeight = Math.round((imgHeight * GIF_MIN_W) / imgWidth);
    imgWidth = GIF_MIN_W;
  }
  if (imgHeight < GIF_MIN_H) {
    imgWidth = Math.round((imgWidth * GIF_MIN_H) / imgHeight);
    imgHeight = GIF_MIN_H;
  }
  // 폭 상한 — 큰 업로드 이미지를 다운스케일해 인코딩 가속. min 보정 뒤 마지막에 캡.
  if (imgWidth > GIF_MAX_W) {
    imgHeight = Math.round((imgHeight * GIF_MAX_W) / imgWidth);
    imgWidth = GIF_MAX_W;
  }

  const canvasWidth = imgWidth + GIF_BORDER * 2;
  const canvasHeight = imgHeight + GIF_TITLEBAR_H + GIF_FOOTER_H + GIF_BORDER * 2;
  // 캔버스 크기는 imgDims에서 파생되고 녹화 중 불변 — 크기가 바뀔 때만 재대입(재대입은 컨텍스트 초기화 유발).
  if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
  if (canvas.height !== canvasHeight) canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const { paper, ink, chrome, bevelHi, bevelLo, bevelXlo, titlebar, titlebar2, titlebarFg } = theme;

  // bevel border
  ctx.fillStyle = bevelHi;
  ctx.fillRect(0, 0, canvasWidth, 2);
  ctx.fillRect(0, 0, 2, canvasHeight);
  ctx.fillStyle = bevelXlo;
  ctx.fillRect(0, canvasHeight - 2, canvasWidth, 2);
  ctx.fillRect(canvasWidth - 2, 0, 2, canvasHeight);
  ctx.fillStyle = bevelLo;
  ctx.fillRect(2, canvasHeight - 4, canvasWidth - 2, 2);
  ctx.fillRect(canvasWidth - 4, 2, 2, canvasHeight - 2);

  // titlebar
  const titlebarX = GIF_BORDER,
    titlebarY = GIF_BORDER;
  const gradient = ctx.createLinearGradient(titlebarX, 0, titlebarX + imgWidth, 0);
  gradient.addColorStop(0, titlebar);
  gradient.addColorStop(1, titlebar2);
  ctx.fillStyle = gradient;
  ctx.fillRect(titlebarX, titlebarY, imgWidth, GIF_TITLEBAR_H);
  ctx.font = 'bold 16px Mona, monospace';
  ctx.fillStyle = titlebarFg;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(
    '사랑하는아이에게돌을던져보세요....exe — 딴짓★OS',
    titlebarX + 8,
    titlebarY + GIF_TITLEBAR_H / 2,
  );

  // content area
  const contentX = GIF_BORDER;
  const contentY = titlebarY + GIF_TITLEBAR_H;
  ctx.fillStyle = paper;
  ctx.fillRect(contentX, contentY, imgWidth, imgHeight);

  ctx.save();
  ctx.beginPath();
  ctx.rect(contentX, contentY, imgWidth, imgHeight);
  ctx.clip();

  const canvasTarget = Math.round(Math.min(imgWidth, imgHeight) * (GIF_MAX_W / STAGE_REF));
  const domTarget = target.current?.getBoundingClientRect().width ?? refs.domTargetSize;
  const coordScale = canvasTarget / domTarget;
  const offsetX = contentX + (imgWidth - canvasTarget) / 2;
  const offsetY = contentY + (imgHeight - canvasTarget) / 2;

  // character
  const charImg = imgCache.get(characterUrl);
  if (charImg) {
    const elapsed = performance.now() - jellyStart.current;
    const { sx, sy, skx } = jellyTransform(Math.min(elapsed / refs.jellyDuration, 1));
    const wobbleDeg = wobbleRotation(Math.min(elapsed / refs.wobbleDuration, 1));
    const charDrawSize = Math.round(canvasTarget * 0.7);
    const charCenterX = offsetX + canvasTarget / 2;
    const charCenterY = offsetY + canvasTarget / 2;
    ctx.save();
    ctx.translate(charCenterX, charCenterY);
    ctx.rotate((wobbleDeg * Math.PI) / 180);
    ctx.translate(0, charDrawSize / 2);
    ctx.transform(sx, 0, Math.tan((skx * Math.PI) / 180) * sy, sy, 0, 0);
    // charImg는 loadImg 경유 HTMLImageElement(naturalWidth 보유)지만, cache 타입은 CanvasImageSource라 소스별로 크기 접근을 분기
    const charW = imgSourceWidth(charImg);
    const charH = imgSourceHeight(charImg);
    const naturalAspect = charW / charH;
    const drawWidth = naturalAspect >= 1 ? charDrawSize : Math.round(charDrawSize * naturalAspect);
    const drawHeight = naturalAspect >= 1 ? Math.round(charDrawSize / naturalAspect) : charDrawSize;
    ctx.drawImage(charImg, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
    ctx.restore();
  }

  // stuck items
  for (const stuckItem of game.stuck) {
    const stuckSize = stuckItem.size * coordScale;
    const cx = offsetX + stuckItem.x * coordScale;
    const cy = offsetY + stuckItem.y * coordScale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((stuckItem.rotation * Math.PI) / 180);
    if (stuckItem.type.emoji) {
      const emojiImg = imgCache.get(`emoji:${stuckItem.type.emoji}`);
      if (emojiImg) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(emojiImg, -stuckSize / 2, -stuckSize / 2, stuckSize, stuckSize);
      }
    } else {
      const img = imgCache.get(stuckItem.type.icon);
      if (img) ctx.drawImage(img, -stuckSize / 2, -stuckSize / 2, stuckSize, stuckSize);
    }
    ctx.restore();
  }

  // projectiles
  for (const projectile of game.projectiles) {
    const size = projectile.size * coordScale;
    let drawX: number, drawY: number, rotation: number;
    if (projectile.phase === 'flight') {
      const flightProgress = projectile.frame / (projectile.flightFrames - 1);
      drawX = (projectile.sx + (projectile.tx - projectile.sx) * flightProgress) * coordScale;
      drawY =
        (projectile.sy +
          (projectile.ty - projectile.sy) * flightProgress -
          Math.sin(flightProgress * Math.PI) * ARC_HEIGHT) *
        coordScale;
      rotation = projectile.frame * 30;
    } else {
      drawX = projectile.x * coordScale;
      drawY = projectile.y * coordScale;
      rotation = projectile.rot;
    }
    ctx.save();
    ctx.translate(offsetX + drawX, offsetY + drawY);
    ctx.rotate((rotation * Math.PI) / 180);
    if (projectile.type.emoji) {
      const emojiImg = imgCache.get(`emoji:${projectile.type.emoji}`);
      if (emojiImg) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(emojiImg, -size / 2, -size / 2, size, size);
      }
    } else {
      const img = imgCache.get(projectile.type.icon);
      if (img) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
    }
    ctx.restore();
  }

  // reaction bubble
  if (shake > 0 && showReaction) {
    const curAmmo = AMMO_TYPES.find((ammoType) => ammoType.id === ammoId);
    const reactions = getReactions(curAmmo ? (curAmmo.happy ?? curAmmo.sticks) : false);
    const expression = reactions[reactionFrame % reactions.length];
    ctx.font = 'bold 18px Mona, monospace';
    const textWidth = ctx.measureText(expression).width;
    const padX = 8,
      padY = 4;
    const bubbleWidth = textWidth + padX * 2;
    const bubbleHeight = 18 + padY * 2;
    const bubbleX = offsetX + canvasTarget - bubbleWidth - 8;
    const bubbleY = offsetY + 8;
    ctx.fillStyle = paper;
    ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(bubbleX + 0.5, bubbleY + 0.5, bubbleWidth - 1, bubbleHeight - 1);
    ctx.fillStyle = ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(expression, bubbleX + padX, bubbleY + bubbleHeight / 2);
  }

  ctx.restore();

  // footer
  const footerX = contentX,
    footerY = contentY + imgHeight;
  ctx.fillStyle = chrome;
  ctx.fillRect(footerX, footerY, imgWidth, GIF_FOOTER_H);
  ctx.fillStyle = bevelXlo;
  ctx.fillRect(footerX, footerY, imgWidth, 1);

  const curAmmo = AMMO_TYPES.find((ammoType) => ammoType.id === ammoId)!;
  const FONT_SIZE = 14;
  const ICON_SIZE = 18;
  const isPressed = throwing.current;
  ctx.font = `bold ${FONT_SIZE}px Mona, monospace`;
  const ammoImg = curAmmo.emoji ? null : imgCache.get(curAmmo.icon);
  const buttonLabel = `${curAmmo.label} 던지기 →`;
  const hasAmmoIcon = !!(ammoImg || curAmmo.emoji);
  const labelWidth = ctx.measureText(buttonLabel).width + (hasAmmoIcon ? ICON_SIZE + 6 : 0);
  const buttonPadding = 10;
  const buttonWidth = labelWidth + buttonPadding * 2;
  const buttonHeight = GIF_FOOTER_H - 12;
  const buttonX = footerX + 8;
  const buttonY = footerY + 6;
  const pressOffset = isPressed ? 1 : 0;
  ctx.fillStyle = chrome;
  ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
  const [bevelTopLeft, bevelBottomRight] = isPressed ? [bevelLo, bevelHi] : [bevelHi, bevelLo];
  ctx.fillStyle = bevelTopLeft;
  ctx.fillRect(buttonX, buttonY, buttonWidth, 2);
  ctx.fillRect(buttonX, buttonY, 2, buttonHeight);
  ctx.fillStyle = bevelBottomRight;
  ctx.fillRect(buttonX, buttonY + buttonHeight - 2, buttonWidth, 2);
  ctx.fillRect(buttonX + buttonWidth - 2, buttonY, 2, buttonHeight);
  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let buttonContentX = buttonX + buttonPadding + pressOffset;
  const buttonContentY = buttonY + buttonHeight / 2 + pressOffset;
  if (curAmmo.emoji) {
    const emojiImg = imgCache.get(`emoji:${curAmmo.emoji}`);
    if (emojiImg) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(emojiImg, buttonContentX, buttonContentY - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
    }
    buttonContentX += ICON_SIZE + 6;
  } else if (ammoImg) {
    ctx.drawImage(ammoImg, buttonContentX, buttonContentY - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
    buttonContentX += ICON_SIZE + 6;
  }
  ctx.fillText(buttonLabel, buttonContentX, buttonContentY);

  const statsText = `${shotCount}회 던짐`;
  const statsRightEdge = footerX + imgWidth - 8;
  const statsAvail = statsRightEdge - (buttonX + buttonWidth + 8);
  if (statsAvail > 20) {
    let statsFontSize = FONT_SIZE;
    ctx.font = `${statsFontSize}px Mona, monospace`;
    while (ctx.measureText(statsText).width > statsAvail && statsFontSize > 8) {
      statsFontSize--;
      ctx.font = `${statsFontSize}px Mona, monospace`;
    }
    ctx.fillStyle = ink;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(statsText, statsRightEdge, footerY + GIF_FOOTER_H / 2);
  }
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useGifRecorder(refs: GifRecorderRefs) {
  const [recording, setRecording] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [encodingPct, setEncodingPct] = useState(0);
  const [gifUrl, setGifUrl] = useState<string | null>(null);

  const MAX_RECORDING_MS = 10000;
  // 캡처 간격 = GIF 프레임 delay — 반드시 동일 값 (30fps)
  const FRAME_DELAY_MS = 33;

  const imgCache = useRef<Map<string, CanvasImageSource>>(new Map());
  const encCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRecordingRef = useRef<() => void>(() => {});
  // 활성 인코딩/녹화 워커 — startRecording에서 생성, 언마운트/done/onerror 시 정리용
  const workerRef = useRef<Worker | null>(null);
  // 이번 녹화에서 워커로 전송한 프레임 수 — finish 전송 여부 판단(0이면 워커 스킵)
  const frameCountRef = useRef(0);
  // gifUrl 스냅샷 ref — 언마운트 cleanup에서 revoke (stale 클로저 방지)
  const gifUrlRef = useRef<string | null>(null);
  gifUrlRef.current = gifUrl;

  const preload = useCallback((url: string) => {
    if (imgCache.current.has(url)) return;
    loadImg(url)
      .then((img) => imgCache.current.set(url, img))
      .catch(() => {});
  }, []);

  // preload all ammo icons on mount
  useEffect(() => {
    AMMO_TYPES.forEach((ammoType) => {
      if (ammoType.emoji) {
        prerenderEmoji(ammoType.emoji, ammoType.size)
          .then((img) => imgCache.current.set(`emoji:${ammoType.emoji}`, img))
          .catch(() => {});
      } else if (ammoType.icon) {
        preload(ammoType.icon);
      }
    });
  }, [preload]);

  const startRecording = useCallback(() => {
    setRecording(true);
    frameCountRef.current = 0;
    if (!encCanvasRef.current) encCanvasRef.current = document.createElement('canvas');

    // 녹화 시작 시 워커 생성 — 프레임은 캡처 즉시 transfer(메인 스레드 상주 제거)
    const worker = new Worker(new URL('../ui/gif.worker.ts', import.meta.url));
    workerRef.current = worker;
    const clearWorker = () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    worker.onmessage = (
      e: MessageEvent<
        { type: 'progress'; percent: number } | { type: 'done'; buffer: ArrayBuffer }
      >,
    ) => {
      if (e.data.type === 'progress') {
        setEncodingPct(e.data.percent);
        return;
      }
      const url = URL.createObjectURL(new Blob([e.data.buffer], { type: 'image/gif' }));
      // 이전 미리보기 URL이 남아있으면 revoke 후 교체 (blob 누수 방지)
      setGifUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      setEncoding(false);
      clearWorker();
    };
    // 인코딩 실패 시 상태 고착 방지 + 워커 정리
    worker.onerror = () => {
      setEncoding(false);
      clearWorker();
    };

    // 테마 색상은 녹화 중 불변 가정 — 시작 시 1회 스냅샷
    const theme = snapshotTheme();
    frameIntervalRef.current = setInterval(() => {
      const canvas = refs.hiddenCanvas.current;
      const enc = encCanvasRef.current;
      if (!canvas || !enc) return;
      drawFrame(canvas, refs, imgCache.current, theme);
      if (enc.width !== canvas.width) enc.width = canvas.width;
      if (enc.height !== canvas.height) enc.height = canvas.height;
      // willReadFrequently: 매 프레임 getImageData 리드백 → GPU 우회로 인코딩 가속
      const encCtx = enc.getContext('2d', { willReadFrequently: true });
      if (!encCtx) return;
      encCtx.imageSmoothingEnabled = false;
      encCtx.drawImage(canvas, 0, 0);
      const imageData = encCtx.getImageData(0, 0, enc.width, enc.height);
      // 캡처 즉시 워커로 transfer — framesRef 누적 제거
      workerRef.current?.postMessage(
        { type: 'frame', data: imageData.data, width: enc.width, height: enc.height },
        [imageData.data.buffer as ArrayBuffer],
      );
      frameCountRef.current += 1;
    }, FRAME_DELAY_MS);
    autoStopRef.current = setTimeout(() => stopRecordingRef.current(), MAX_RECORDING_MS);
  }, [refs]);

  const stopRecording = useCallback(() => {
    setRecording(false);
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    const worker = workerRef.current;
    if (!worker) return;
    // 즉시 stop 등으로 프레임이 0개면 인코딩 스킵 — 워커 terminate + 상태 해제
    if (frameCountRef.current === 0) {
      worker.terminate();
      workerRef.current = null;
      setEncoding(false);
      return;
    }
    setEncoding(true);
    setEncodingPct(0);
    // 프레임은 이미 스트리밍 transfer됨 — finish만 보내면 워커가 인코딩 실행
    worker.postMessage({ type: 'finish', delay: FRAME_DELAY_MS });
  }, []);

  stopRecordingRef.current = stopRecording;

  // 언마운트 정리 — 녹화 중 타이머/자동정지/워커/미리보기 URL 누수 방지
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current);
    };
  }, []);

  const closeGif = useCallback(() => {
    setGifUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }, []);

  return {
    recording,
    encoding,
    encodingPct,
    gifUrl,
    startRecording,
    stopRecording,
    closeGif,
    preload,
  };
}
