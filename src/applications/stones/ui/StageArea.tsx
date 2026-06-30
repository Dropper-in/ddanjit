import type React from 'react';
import type { Projectile, StuckItem } from '../model/types';
import styles from './Stones.module.scss';

interface Props {
  targetRef: React.RefObject<HTMLDivElement>;
  imgDims: { width: number; height: number };
  characterUrl: string;
  stuck: StuckItem[];
  projectiles: Projectile[];
  reactionFrame: number;
  reactionExpr: string;
  showReaction: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function StageArea({
  targetRef,
  imgDims,
  characterUrl,
  stuck,
  projectiles,
  reactionFrame,
  reactionExpr,
  showReaction,
  onFileUpload,
}: Props) {
  return (
    <label
      className="st-stage"
      title={characterUrl ? '클릭해서 제물 바꾸기' : '클릭해서 제물 올리기'}
    >
      <input type="file" accept="image/*" onChange={onFileUpload} hidden />
      {characterUrl && (
        <span className="st-stage-hint" aria-hidden="true">
          클릭해서 제물 바꾸기
        </span>
      )}
      <div
        ref={targetRef}
        className="st-target"
        style={{ aspectRatio: `${imgDims.width}/${imgDims.height}` }}
      >
        {characterUrl ? (
          <div key={reactionFrame} className={reactionFrame > 0 ? styles.wobbleHit : undefined}>
            <div className={reactionFrame > 0 ? styles.jellyChar : undefined}>
              <img src={characterUrl} alt="목표" className="st-character" draggable={false} />
            </div>
          </div>
        ) : (
          <div className="st-placeholder">
            <span className="st-placeholder-icon" aria-hidden="true">
              +
            </span>
            <span className="st-placeholder-text">
              클릭해서
              <br />
              제물 올리기
            </span>
          </div>
        )}

        {stuck.map((stuckItem) =>
          stuckItem.type.emoji ? (
            <span
              key={stuckItem.id}
              className="st-stuck"
              style={{
                left: stuckItem.x - stuckItem.size / 2,
                top: stuckItem.y - stuckItem.size / 2,
                width: stuckItem.size,
                height: stuckItem.size,
                fontSize: Math.round(stuckItem.size * 0.85),
                lineHeight: `${stuckItem.size}px`,
                textAlign: 'center',
                overflow: 'visible',
                transform: `rotate(${stuckItem.rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              {stuckItem.type.emoji}
            </span>
          ) : (
            <img
              key={stuckItem.id}
              src={stuckItem.type.icon}
              className="st-stuck"
              style={{
                left: stuckItem.x - stuckItem.size / 2,
                top: stuckItem.y - stuckItem.size / 2,
                width: stuckItem.size,
                height: stuckItem.size,
                transform: `rotate(${stuckItem.rotation}deg)`,
                transformOrigin: 'center center',
              }}
              alt=""
            />
          ),
        )}

        {projectiles.map((projectile) => {
          const size = projectile.size;
          let drawX: number, drawY: number, rotation: number;
          if (projectile.phase === 'flight') {
            const flightProgress = projectile.frame / (projectile.flightFrames - 1);
            drawX = projectile.sx + (projectile.tx - projectile.sx) * flightProgress;
            drawY =
              projectile.sy +
              (projectile.ty - projectile.sy) * flightProgress -
              Math.sin(flightProgress * Math.PI) * 130;
            rotation = projectile.frame * 30;
          } else {
            drawX = projectile.x;
            drawY = projectile.y;
            rotation = projectile.rot;
          }
          const baseStyle = {
            position: 'absolute' as const,
            left: drawX - size / 2,
            top: drawY - size / 2,
            width: size,
            height: size,
            transform: `rotate(${rotation}deg)`,
            pointerEvents: 'none' as const,
            willChange: 'transform' as const,
          };
          return projectile.type.emoji ? (
            <span
              key={projectile.id}
              style={{
                ...baseStyle,
                fontSize: Math.round(size * 0.85),
                lineHeight: `${size}px`,
                textAlign: 'center',
                transformOrigin: 'center center',
                overflow: 'visible',
              }}
            >
              {projectile.type.emoji}
            </span>
          ) : (
            <img
              key={projectile.id}
              src={projectile.type.icon}
              style={{ ...baseStyle, imageRendering: 'pixelated' }}
              alt=""
            />
          );
        })}

        {reactionFrame > 0 && showReaction && (
          <div key={`rx-${reactionFrame}`} className={`st-reaction ${styles.reactionFade}`}>
            {reactionExpr}
          </div>
        )}
      </div>
    </label>
  );
}
