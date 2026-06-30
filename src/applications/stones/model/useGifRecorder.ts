import { useState, useEffect, useCallback, useRef } from 'react';
import type React from 'react';
import { AMMO_TYPES, getReactions } from './constants';
import { loadImg } from './imageUtils';
import {
  GIF_TITLEBAR_H,
  GIF_FOOTER_H,
  GIF_BORDER,
  GIF_MIN_W,
  GIF_MIN_H,
  GIF_MAX_W,
  wobbleRotation,
  jellyTransform,
} from '../ui/canvasConfig';
import type { GameState } from './types';

async function prerenderEmoji(emoji: string, size: number): Promise<HTMLImageElement> {
  // Mona Emoji는 12px 픽셀 폰트 → 1:1 prerender 후 nearest neighbor 스케일
  const dim = size;
  const fontPx = Math.round(dim * 0.85);
  const fontSpec = `${fontPx}px "Mona Emoji", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  if (document.fonts?.load) {
    try {
      await document.fonts.load(`${fontPx}px "Mona Emoji"`, emoji);
    } catch {}
  }
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.font = fontSpec;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, dim / 2, dim / 2);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) {
        reject(new Error('toBlob failed'));
        return;
      }
      const u = URL.createObjectURL(b);
      loadImg(u)
        .then((finalImg) => {
          URL.revokeObjectURL(u);
          resolve(finalImg);
        })
        .catch(reject);
    });
  });
}

export type GifRecorderRefs = {
  hiddenCanvas: React.RefObject<HTMLCanvasElement | null>;
  target: React.RefObject<HTMLDivElement | null>;
  imgDims: React.MutableRefObject<{ width: number; height: number }>;
  game: React.MutableRefObject<GameState>;
  shake: React.MutableRefObject<number>;
  reactionFrame: React.MutableRefObject<number>;
  characterUrl: React.MutableRefObject<string>;
  shotCount: React.MutableRefObject<number>;
  ammoId: React.MutableRefObject<string>;
  throwing: React.MutableRefObject<boolean>;
  jellyStart: React.MutableRefObject<number>;
  showReaction: React.MutableRefObject<boolean>;
  jellyDuration: number;
  wobbleDuration: number;
  domTargetSize: number;
};

// ─── canvas draw ────────────────────────────────────────────────────────────

function drawFrame(
  canvas: HTMLCanvasElement,
  refs: GifRecorderRefs,
  imgCache: Map<string, HTMLImageElement>,
) {
  const {
    imgDims,
    game,
    shake,
    reactionFrame,
    characterUrl,
    shotCount,
    ammoId,
    throwing,
    jellyStart,
    target,
  } = refs;
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
  // ponytail: 임시 폭 상한 — 큰 업로드 이미지를 480으로 다운스케일해 인코딩 가속. min 보정 뒤 마지막에 캡.
  if (imgWidth > GIF_MAX_W) {
    imgHeight = Math.round((imgHeight * GIF_MAX_W) / imgWidth);
    imgWidth = GIF_MAX_W;
  }

  canvas.width = imgWidth + GIF_BORDER * 2;
  canvas.height = imgHeight + GIF_TITLEBAR_H + GIF_FOOTER_H + GIF_BORDER * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cs = getComputedStyle(document.documentElement);
  const getCssVar = (name: string) => cs.getPropertyValue(name).trim();
  const paper = getCssVar('--paper');
  const ink = getCssVar('--ink');
  const chrome = getCssVar('--chrome');
  const bevelHi = getCssVar('--bevel-hi');
  const bevelLo = getCssVar('--bevel-lo');
  const bevelXlo = getCssVar('--bevel-xlo');
  const titlebar = getCssVar('--titlebar');
  const titlebar2 = getCssVar('--titlebar-2');
  const titlebarFg = getCssVar('--titlebar-fg');

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

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

  const canvasTarget = Math.round(Math.min(imgWidth, imgHeight) * (480 / 512));
  const domTarget = target.current?.getBoundingClientRect().width ?? refs.domTargetSize;
  const coordScale = canvasTarget / domTarget;
  const offsetX = contentX + (imgWidth - canvasTarget) / 2;
  const offsetY = contentY + (imgHeight - canvasTarget) / 2;

  // character
  const charImg = imgCache.get(characterUrl.current);
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
    const naturalAspect = charImg.naturalWidth / charImg.naturalHeight;
    const drawWidth = naturalAspect >= 1 ? charDrawSize : Math.round(charDrawSize * naturalAspect);
    const drawHeight = naturalAspect >= 1 ? Math.round(charDrawSize / naturalAspect) : charDrawSize;
    ctx.drawImage(charImg, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
    ctx.restore();
  }

  // stuck items
  for (const stuckItem of game.current.stuck) {
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
  for (const projectile of game.current.projectiles) {
    const size = projectile.size * coordScale;
    let drawX: number, drawY: number, rotation: number;
    if (projectile.phase === 'flight') {
      const flightProgress = projectile.frame / (projectile.flightFrames - 1);
      drawX = (projectile.sx + (projectile.tx - projectile.sx) * flightProgress) * coordScale;
      drawY =
        (projectile.sy +
          (projectile.ty - projectile.sy) * flightProgress -
          Math.sin(flightProgress * Math.PI) * 130) *
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
  if (shake.current > 0 && refs.showReaction.current) {
    const curAmmo = AMMO_TYPES.find((ammoType) => ammoType.id === ammoId.current);
    const reactions = getReactions(curAmmo?.sticks ?? false);
    const expression = reactions[reactionFrame.current % reactions.length];
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

  const curAmmo = AMMO_TYPES.find((ammoType) => ammoType.id === ammoId.current)!;
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

  const statsText = `${shotCount.current}회 던짐`;
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

  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const framesRef = useRef<ImageData[]>([]);
  const encCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRecordingRef = useRef<() => void>(() => {});
  // 활성 인코딩 워커 — 언마운트/done/onerror 시 정리용
  const workerRef = useRef<Worker | null>(null);
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
    framesRef.current = [];
    setRecording(true);
    if (!encCanvasRef.current) encCanvasRef.current = document.createElement('canvas');
    frameIntervalRef.current = setInterval(() => {
      const canvas = refs.hiddenCanvas.current;
      const enc = encCanvasRef.current;
      if (!canvas || !enc) return;
      drawFrame(canvas, refs, imgCache.current);
      enc.width = canvas.width;
      enc.height = canvas.height;
      const encCtx = enc.getContext('2d');
      if (!encCtx) return;
      encCtx.imageSmoothingEnabled = false;
      encCtx.drawImage(canvas, 0, 0);
      framesRef.current.push(encCtx.getImageData(0, 0, enc.width, enc.height));
    }, 33);
    autoStopRef.current = setTimeout(() => stopRecordingRef.current(), MAX_RECORDING_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refs.ammoId]);

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
    const frames = framesRef.current;
    if (!frames.length) return;
    setEncoding(true);
    setEncodingPct(0);
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
    worker.postMessage(
      { frames, delay: 33 },
      frames.map((frame) => frame.data.buffer as ArrayBuffer),
    );
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
