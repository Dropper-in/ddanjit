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
  const jellyStartRef = useRef(0);
  const throwingRef = useRef(false);
  const imgDimsRef = useRef({ width: 512, height: 512 });

  // snapshot refs to avoid stale closures in recording interval
  const gameRef = useRef(game);
  const shakeRef = useRef(shake);
  const reactionFrameRef = useRef(reactionFrame);
  const characterUrlRef = useRef(characterUrl);
  const shotCountRef = useRef(shotCount);
  const ammoIdRef = useRef(ammoId);
  const showReactionRef = useRef(showReaction);
  gameRef.current = game;
  shakeRef.current = shake;
  reactionFrameRef.current = reactionFrame;
  characterUrlRef.current = characterUrl;
  shotCountRef.current = shotCount;
  ammoIdRef.current = ammoId;
  showReactionRef.current = showReaction;

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
    imgDims: imgDimsRef,
    game: gameRef,
    shake: shakeRef,
    reactionFrame: reactionFrameRef,
    characterUrl: characterUrlRef,
    shotCount: shotCountRef,
    ammoId: ammoIdRef,
    throwing: throwingRef,
    jellyStart: jellyStartRef,
    showReaction: showReactionRef,
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

  useEffect(() => {
    if (projectiles.length === 0) return;
    const id = setInterval(() => {
      dispatch({
        type: 'tick',
        targetWidth: targetRef.current?.getBoundingClientRect().width ?? 320,
      });
    }, 30);
    return () => clearInterval(id);
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

      // 원본을 캔버스에 그린 뒤 투명 여백 자동 크롭 (알파 바운딩박스)
      const src = document.createElement('canvas');
      src.width = natW;
      src.height = natH;
      const sctx = src.getContext('2d')!;
      sctx.drawImage(img, 0, 0);
      let cropX = 0,
        cropY = 0,
        cropW = natW,
        cropH = natH;
      try {
        const { data } = sctx.getImageData(0, 0, natW, natH);
        const ALPHA = 10; // 이보다 불투명한 픽셀만 내용으로 간주
        let minX = natW,
          minY = natH,
          maxX = -1,
          maxY = -1;
        for (let y = 0; y < natH; y++) {
          for (let x = 0; x < natW; x++) {
            if (data[(y * natW + x) * 4 + 3] > ALPHA) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX >= minX && maxY >= minY) {
          // 가장자리 안티앨리어싱 보존용 소량 패딩
          const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
          cropX = Math.max(0, minX - pad);
          cropY = Math.max(0, minY - pad);
          cropW = Math.min(natW - 1, maxX + pad) - cropX + 1;
          cropH = Math.min(natH - 1, maxY + pad) - cropY + 1;
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
      cvs.getContext('2d')!.drawImage(src, cropX, cropY, cropW, cropH, 0, 0, width, height);
      imgDimsRef.current = { width, height };
      setImgDims({ width, height });
      setCharacterUrl(cvs.toDataURL('image/webp', 0.85));
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
