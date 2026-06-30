import type { GameState, GameAction, Projectile, StuckItem } from './types';
import { BOUNCE_FRAMES } from './constants';

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
              const dir = (projectile.tx >= centerX ? 1 : -1) * (0.6 + Math.random() * 0.8);
              const speed = 9 + Math.random() * 8;
              next.push({
                ...projectile,
                phase: 'bounce',
                bounceFrame: 0,
                x: projectile.tx,
                y: projectile.ty,
                vx: dir * speed,
                vy: -(7 + Math.random() * 6),
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
            vy: projectile.vy + 0.7,
            vx: projectile.vx * 0.988,
            rot: projectile.rot + projectile.rotVel,
          });
        }
      });

      const existingIds = newStuck.length
        ? new Set(state.stuck.map((stuckItem) => stuckItem.id))
        : null;
      const freshStuck = existingIds
        ? newStuck.filter((stuckItem) => !existingIds.has(stuckItem.id))
        : [];

      return {
        projectiles: next,
        stuck: freshStuck.length ? [...state.stuck.slice(-40), ...freshStuck] : state.stuck,
        impactSeq: didImpact ? state.impactSeq + 1 : state.impactSeq,
      };
    }
    case 'fire':
      return { ...state, projectiles: [...state.projectiles, action.projectile] };
    case 'reset':
      return { projectiles: [], stuck: [], impactSeq: 0 };
    case 'clear_stuck':
      return { ...state, stuck: [] };
  }
}
