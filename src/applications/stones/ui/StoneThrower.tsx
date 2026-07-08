'use client';
import { useState, useEffect, useReducer, useRef } from 'react';
import { cx } from '@/shared/lib/ui';
import { iconUrl } from '@/shared/icons';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import styles from './Stones.module.scss';
import { AMMO_TYPES, getReactions } from '../model/constants';
import { gameReducer } from '../model/reducer';
import { useGifRecorder } from '../model/useGifRecorder';
import type { FrameSnapshot } from '../model/types';
import { StageArea } from './StageArea';
import { Toolbar } from './Toolbar';
import { GifPreviewDialog } from './GifPreviewDialog';
import { STAGE_REF } from './canvasConfig';

const DOM_TARGET = parseInt(styles.domTarget);
const JELLY_DURATION = parseInt(styles.jellyDuration);
const WOBBLE_DURATION = parseInt(styles.wobbleDuration);

export function StoneThrower() {
  const [ammoId, setAmmoId] = useState('stone');
  const [showReaction, setShowReaction] = useState(true);
  const [shotCount, setShotCount] = useState(0);
  const [shake, setShake] = useState(0);
  const [reactionFrame, setReactionFrame] = useState(0);
  // 빈 문자열 = 아직 제물 없음 → StageArea가 드롭존 placeholder 표시
  const [characterUrl, setCharacterUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState({ width: 1, height: 1 });

  const [game, dispatch] = useReducer(gameReducer, { projectiles: [], stuck: [], impactSeq: 0 });
  const { projectiles, stuck } = game;

  const targetRef = useRef<HTMLDivElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextId = useRef(0);
  // 렌더 주기 밖에서 갱신되는 값 — snapshot에 넣으면 stale이라 개별 ref 유지
  const jellyStartRef = useRef(0);
  const throwingRef = useRef(false);
  const imgDimsRef = useRef({ width: 512, height: 512 });

  // 녹화 interval의 stale 클로저 방지용 렌더 스냅샷 — 매 렌더 한 번에 갱신
  const snapshotRef = useRef<FrameSnapshot>({
    game,
    shake,
    reactionFrame,
    characterUrl,
    shotCount,
    ammoId,
    showReaction,
  });
  snapshotRef.current = {
    game,
    shake,
    reactionFrame,
    characterUrl,
    shotCount,
    ammoId,
    showReaction,
  };

  const {
    recording,
    encoding,
    encodingPct,
    gifUrl,
    startRecording,
    stopRecording,
    closeGif,
    preload,
  } = useGifRecorder({
    hiddenCanvas: hiddenCanvasRef,
    target: targetRef,
    snapshot: snapshotRef,
    imgDims: imgDimsRef,
    throwing: throwingRef,
    jellyStart: jellyStartRef,
    jellyDuration: JELLY_DURATION,
    wobbleDuration: WOBBLE_DURATION,
    domTargetSize: DOM_TARGET,
  });

  useEffect(() => {
    document.fonts.load('bold 20px Mona');
    document.fonts.load('20px Mona');
  }, []);
  useEffect(() => {
    if (characterUrl) preload(characterUrl);
  }, [characterUrl, preload]);

  // 언마운트 시 현재 characterUrl blob revoke — snapshot 미러로 stale 클로저 방지
  useEffect(() => {
    return () => {
      const url = snapshotRef.current.characterUrl;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    if (projectiles.length === 0) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 30;
    const loop = (now: number) => {
      acc += now - last;
      last = now;
      // 백그라운드 복귀 시 누산 폭주 방지 — 최대 5스텝만 소화
      acc = Math.min(acc, STEP * 5);
      // getBoundingClientRect는 스텝당 동일 — 루프 밖으로 hoist
      const targetWidth = targetRef.current?.getBoundingClientRect().width ?? 320;
      while (acc >= STEP) {
        dispatch({ type: 'tick', targetWidth });
        acc -= STEP;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [projectiles.length]);

  useEffect(() => {
    if (game.impactSeq === 0) return;
    setShake(1);
    setReactionFrame((f) => f + 1);
    jellyStartRef.current = performance.now();
    const shakeTimeout = setTimeout(() => setShake(0), 220);
    return () => clearTimeout(shakeTimeout);
  }, [game.impactSeq]);

  function fireAt(tx: number, ty: number) {
    const rect = targetRef.current!.getBoundingClientRect();
    const ammo = AMMO_TYPES.find((ammoType) => ammoType.id === ammoId)!;
    // stage 너비 비례 — REF(512) 기준. 캐릭터(stage*0.7)와 같은 비율로 스케일.
    const size = ammo.size * (rect.width / STAGE_REF);
    dispatch({
      type: 'fire',
      projectile: {
        id: nextId.current++,
        type: ammo,
        phase: 'flight',
        frame: 0,
        flightFrames: Math.round(14 - Math.random() * 6),
        size,
        tx,
        ty,
        sx: rect.width / 2,
        sy: rect.height + 60,
        rot: 0,
        bounceFrame: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotVel: 0,
      },
    });
    setShotCount((count) => count + 1);
  }

  function throwRandom() {
    throwingRef.current = true;
    setTimeout(() => {
      throwingRef.current = false;
    }, 150);
    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;
    const charSize = Math.min(rect.width, rect.height) * 0.7;
    const charX0 = (rect.width - charSize) / 2;
    const charY0 = (rect.height - charSize) / 2;
    const charMargin = 0.12;
    const xRange = charSize * (1 - charMargin * 2);
    const yRange = charSize * (2 / 3 - charMargin);
    const pick = () => ({
      x: charX0 + charSize * charMargin + Math.random() * xRange,
      y: charY0 + charSize * charMargin + Math.random() * yRange,
    });

    const ammo = AMMO_TYPES.find((a) => a.id === ammoId)!;
    // 박힘 탄약: best-candidate로 기존 stuck과 가장 먼 위치 선택 (뭉침 방지)
    if (ammo.sticks && stuck.length > 0) {
      const CANDIDATES = 8;
      let best = pick();
      let bestDist = -1;
      for (let i = 0; i < CANDIDATES; i++) {
        const c = i === 0 ? best : pick();
        let minD = Infinity;
        for (const s of stuck) {
          const dx = c.x - s.x,
            dy = c.y - s.y;
          const d = dx * dx + dy * dy;
          if (d < minD) minD = d;
        }
        if (minD > bestDist) {
          bestDist = minD;
          best = c;
        }
      }
      fireAt(best.x, best.y);
      return;
    }
    const { x, y } = pick();
    fireAt(x, y);
  }

  function reset() {
    dispatch({ type: 'reset' });
    setShotCount(0);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('이미지 파일이 너무 큽니다 (최대 10MB)');
      e.target.value = '';
      return;
    }
    const raw = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(raw);
      const natW = img.naturalWidth,
        natH = img.naturalHeight;

      // 알파 스캔은 최대 변 1024로 다운스케일한 캔버스에서 수행 (메인 스레드 블로킹 방지).
      // 바운딩박스는 스캔 좌표계 기준으로 구한 뒤 원본 좌표로 환산해 원본에서 크롭.
      const SCAN_MAX = 1024;
      const scanScale = Math.max(natW, natH) > SCAN_MAX ? SCAN_MAX / Math.max(natW, natH) : 1;
      const scanW = Math.max(1, Math.round(natW * scanScale));
      const scanH = Math.max(1, Math.round(natH * scanScale));
      const src = document.createElement('canvas');
      src.width = scanW;
      src.height = scanH;
      const sctx = src.getContext('2d')!;
      sctx.drawImage(img, 0, 0, scanW, scanH);
      let cropX = 0,
        cropY = 0,
        cropW = natW,
        cropH = natH;
      try {
        const { data } = sctx.getImageData(0, 0, scanW, scanH);
        const ALPHA = 10; // 이보다 불투명한 픽셀만 내용으로 간주
        let minX = scanW,
          minY = scanH,
          maxX = -1,
          maxY = -1;
        for (let y = 0; y < scanH; y++) {
          for (let x = 0; x < scanW; x++) {
            if (data[(y * scanW + x) * 4 + 3] > ALPHA) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX >= minX && maxY >= minY) {
          // 스캔 좌표 → 원본 좌표 환산 (scale = natW / scanW)
          const scaleX = natW / scanW;
          const scaleY = natH / scanH;
          const oMinX = minX * scaleX,
            oMinY = minY * scaleY,
            oMaxX = maxX * scaleX,
            oMaxY = maxY * scaleY;
          // 가장자리 안티앨리어싱 보존용 소량 패딩 (환산 좌표 기준)
          const pad = Math.round(Math.max(oMaxX - oMinX, oMaxY - oMinY) * 0.02);
          cropX = Math.max(0, Math.floor(oMinX - pad));
          cropY = Math.max(0, Math.floor(oMinY - pad));
          cropW = Math.min(natW - 1, Math.ceil(oMaxX + pad)) - cropX + 1;
          cropH = Math.min(natH - 1, Math.ceil(oMaxY + pad)) - cropY + 1;
        }
      } catch {
        // 교차출처 등으로 캔버스가 tainted면 크롭 생략, 원본 사용
      }

      // 크롭 결과 기준으로 MAX 스케일
      const MAX = 1024;
      let width = cropW,
        height = cropH;
      if (width > MAX || height > MAX) {
        if (width >= height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const cvs = document.createElement('canvas');
      cvs.width = width;
      cvs.height = height;
      // 크롭은 다운스케일 스캔본이 아니라 원본 이미지에서 (환산 좌표 기준)
      cvs.getContext('2d')!.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, width, height);
      imgDimsRef.current = { width, height };
      setImgDims({ width, height });
      cvs.toBlob(
        (blob) => {
          if (!blob) return;
          const next = URL.createObjectURL(blob);
          // 교체 시 이전 characterUrl revoke (blob 누수 방지)
          setCharacterUrl((old) => {
            if (old) URL.revokeObjectURL(old);
            return next;
          });
        },
        'image/webp',
        0.85,
      );
      dispatch({ type: 'clear_stuck' });
    };
    img.src = raw;
    e.target.value = '';
  }

  const ammo = AMMO_TYPES.find((ammoType) => ammoType.id === ammoId)!;
  const reactions = getReactions(ammo.happy ?? ammo.sticks);
  const reactionExpr = reactions[reactionFrame % reactions.length];

  return (
    <div className="st-app">
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
      {gifUrl && <GifPreviewDialog gifUrl={gifUrl} onClose={closeGif} />}
      {uploadError && (
        <Dialog
          title="업로드 실패"
          onClose={() => setUploadError(null)}
          buttons={
            <Button isDefault onClick={() => setUploadError(null)}>
              확인
            </Button>
          }
        >
          {uploadError}
        </Dialog>
      )}

      <Toolbar
        ammoId={ammoId}
        onAmmoChange={setAmmoId}
        showReaction={showReaction}
        onShowReactionChange={setShowReaction}
      />

      <StageArea
        targetRef={targetRef}
        imgDims={imgDims}
        characterUrl={characterUrl}
        stuck={stuck}
        projectiles={projectiles}
        reactionFrame={reactionFrame}
        reactionExpr={reactionExpr}
        showReaction={showReaction}
        onFileUpload={handleFileUpload}
      />

      <div className="st-action-bar">
        <Button onClick={reset}>
          <img src={iconUrl('tool-eraser')} width="16" height="16" alt="" /> 초기화
        </Button>
        <Button
          className="st-throw"
          onClick={throwRandom}
          disabled={!characterUrl}
          title={!characterUrl ? '제물을 먼저 올려주세요' : undefined}
        >
          {ammo.emoji ? (
            <span style={{ fontSize: 20, lineHeight: 1 }}>{ammo.emoji}</span>
          ) : (
            <img src={ammo.icon} width="20" height="20" alt="" />
          )}
          {ammo.label} 던지기 ↑
        </Button>
        <Button
          className={recording ? 'is-recording' : undefined}
          onClick={recording ? stopRecording : startRecording}
          disabled={encoding || (!characterUrl && !recording)}
          title={!characterUrl ? '제물을 먼저 올려주세요' : undefined}
        >
          {!recording && <span style={{ fontSize: 16, lineHeight: 1 }}>🎥</span>}
          {recording ? '■ 녹화 중지' : '● 녹화 시작'}
        </Button>
      </div>

      <div className="st-hint">
        <b>{ammo.label}</b>이(가) {ammo.sticks ? '날아가 박힙니다' : '날아갑니다'}
        {encoding && (
          <span style={{ marginLeft: 12, color: 'var(--ink-dim)' }}>
            · GIF 인코딩 중 {encodingPct}%
          </span>
        )}
      </div>

      <div className={styles.statusbar}>
        <div className={styles.statusCell}>
          탄약: <b>{ammo.label}</b>
          <span className="mobile-hide"> ({ammo.sticks ? '박힘' : '튕겨나감'})</span>
        </div>
        <div className={cx(styles.statusCell, styles.statusCellFixed)}>
          <b>{shotCount}</b>회 던짐
        </div>
        <div className={cx(styles.statusCell, styles.statusCellFixed, 'mobile-hide')}>
          {recording ? '● REC' : '준비'}
        </div>
      </div>
    </div>
  );
}
