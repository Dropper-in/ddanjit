import type { GameState, GameAction, Projectile, StuckItem } from './types';
import { ARC_HEIGHT, BOUNCE_FRAMES, BOUNCE_GRAVITY, RESTITUTION } from './constants';

// tick: 모든 발사체 1프레임 진행, 착탄 시 박힘/튕김 분기
// fire: 새 발사체 추가 (StoneThrower가 fireAt 호출 시)
// reset/clear_stuck: UI 버튼으로 호출

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tick': {
      const next: Projectile[] = [];
      const newStuck: StuckItem[] = [];
      let didImpact = false;
      const centerX = action.targetWidth / 2;

      state.projectiles.forEach((projectile) => {
        if (projectile.phase === 'flight') {
          if (projectile.frame < projectile.flightFrames - 1) {
            next.push({ ...projectile, frame: projectile.frame + 1 });
          } else {
            didImpact = true;
            if (projectile.type.sticks) {
              newStuck.push({
                id: projectile.id,
                x: projectile.tx,
                y: projectile.ty,
                size: projectile.size,
                rotation: (Math.random() - 0.5) * 90,
                type: projectile.type,
              });
            } else {
              // 도착 속도(비행 궤적의 p=1 미분)를 반사 — 던지기 세기·스테이지 크기에 비례해 튕김
              const lastFrame = projectile.flightFrames - 1;
              const inVx = (projectile.tx - projectile.sx) / lastFrame;
              const inVy =
                (projectile.ty - projectile.sy) / lastFrame + (Math.PI * ARC_HEIGHT) / lastFrame;
              const speed = Math.hypot(inVx, inVy) * RESTITUTION;
              const dir = projectile.tx >= centerX ? 1 : -1;
              next.push({
                ...projectile,
                phase: 'bounce',
                bounceFrame: 0,
                x: projectile.tx,
                y: projectile.ty,
                vx: dir * speed * (0.55 + Math.random() * 0.5),
                vy: -speed * (0.6 + Math.random() * 0.45),
                rotVel: (Math.random() - 0.5) * 80,
              });
            }
          }
        } else if (projectile.phase === 'bounce') {
          if (projectile.bounceFrame >= BOUNCE_FRAMES) return;
          next.push({
            ...projectile,
            bounceFrame: projectile.bounceFrame + 1,
            x: projectile.x + projectile.vx,
            y: projectile.y + projectile.vy,
            vy: projectile.vy + BOUNCE_GRAVITY,
            vx: projectile.vx * 0.988,
            rot: projectile.rot + projectile.rotVel,
          });
        }
      });

      return {
        projectiles: next,
        stuck: newStuck.length ? [...state.stuck.slice(-40), ...newStuck] : state.stuck,
        impactSeq: didImpact ? state.impactSeq + 1 : state.impactSeq,
      };
    }
    case 'fire':
      return { ...state, projectiles: [...state.projectiles, action.projectile] };
    case 'reset':
      return { projectiles: [], stuck: [], impactSeq: 0 };
    case 'clear_stuck':
      return { ...state, stuck: [] };
    default: {
      // 새 액션 누락 시 컴파일 에러 + 런타임엔 상태 유지
      const _exhaustive: never = action;
      return state;
    }
  }
}
