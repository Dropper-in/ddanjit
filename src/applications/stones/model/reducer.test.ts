import { describe, it, expect } from 'vitest';
import { gameReducer } from './reducer';
import { BOUNCE_FRAMES } from './constants';
import type { GameState, Projectile, AmmoType } from './types';

const STONE: AmmoType = {
  id: 'stone',
  icon: '/icons/16/stone.png',
  label: '돌멩이',
  color: '#807a6e',
  sticks: false,
  size: 42,
};

const HEART: AmmoType = {
  id: 'heart',
  icon: '',
  emoji: '❤️',
  label: '하트',
  color: '#cc1a1a',
  sticks: true,
  size: 42,
};

const EMPTY_STATE: GameState = { projectiles: [], stuck: [], impactSeq: 0 };

function makeProjectile(overrides: Partial<Projectile> = {}): Projectile {
  return {
    id: 0,
    type: STONE,
    phase: 'flight',
    frame: 0,
    flightFrames: 3,
    size: 42,
    tx: 100,
    ty: 100,
    sx: 160,
    sy: 400,
    rot: 0,
    bounceFrame: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotVel: 0,
    ...overrides,
  };
}

describe('gameReducer', () => {
  describe('fire', () => {
    it('발사체를 추가한다', () => {
      const projectile = makeProjectile({ id: 1 });
      const next = gameReducer(EMPTY_STATE, { type: 'fire', projectile });
      expect(next.projectiles).toHaveLength(1);
      expect(next.projectiles[0].id).toBe(1);
    });

    it('기존 상태는 변경하지 않는다', () => {
      const projectile = makeProjectile({ id: 2 });
      const next = gameReducer(EMPTY_STATE, { type: 'fire', projectile });
      expect(EMPTY_STATE.projectiles).toHaveLength(0);
      expect(next.projectiles).toHaveLength(1);
    });
  });

  describe('tick — flight', () => {
    it('비행 중인 발사체의 frame을 1 증가시킨다', () => {
      const state: GameState = {
        ...EMPTY_STATE,
        projectiles: [makeProjectile({ frame: 0, flightFrames: 3 })],
      };
      const next = gameReducer(state, { type: 'tick', targetWidth: 320 });
      expect(next.projectiles[0].frame).toBe(1);
      expect(next.projectiles[0].phase).toBe('flight');
    });

    it('마지막 프레임 도달 시 sticks=false 탄약은 bounce 페이즈로 전환된다', () => {
      const state: GameState = {
        ...EMPTY_STATE,
        projectiles: [makeProjectile({ type: STONE, frame: 2, flightFrames: 3 })],
      };
      const next = gameReducer(state, { type: 'tick', targetWidth: 320 });
      expect(next.projectiles[0].phase).toBe('bounce');
    });

    it('마지막 프레임 도달 시 sticks=true 탄약은 stuck에 추가되고 projectiles에서 제거된다', () => {
      const state: GameState = {
        ...EMPTY_STATE,
        projectiles: [makeProjectile({ type: HEART, frame: 2, flightFrames: 3, tx: 50, ty: 80 })],
      };
      const next = gameReducer(state, { type: 'tick', targetWidth: 320 });
      expect(next.projectiles).toHaveLength(0);
      expect(next.stuck).toHaveLength(1);
      expect(next.stuck[0].x).toBe(50);
      expect(next.stuck[0].y).toBe(80);
    });

    it('충돌 시 impactSeq가 증가한다', () => {
      const state: GameState = {
        ...EMPTY_STATE,
        projectiles: [makeProjectile({ frame: 2, flightFrames: 3 })],
      };
      const next = gameReducer(state, { type: 'tick', targetWidth: 320 });
      expect(next.impactSeq).toBe(1);
    });

    it('충돌 없으면 impactSeq 변화 없다', () => {
      const state: GameState = {
        ...EMPTY_STATE,
        projectiles: [makeProjectile({ frame: 0, flightFrames: 3 })],
      };
      const next = gameReducer(state, { type: 'tick', targetWidth: 320 });
      expect(next.impactSeq).toBe(0);
    });
  });

  describe('tick — bounce', () => {
    it('BOUNCE_FRAMES 이후 발사체가 제거된다', () => {
      const state: GameState = {
        ...EMPTY_STATE,
        projectiles: [
          makeProjectile({
            phase: 'bounce',
            bounceFrame: BOUNCE_FRAMES,
            x: 50,
            y: 50,
            vx: 5,
            vy: -3,
            rotVel: 10,
          }),
        ],
      };
      const next = gameReducer(state, { type: 'tick', targetWidth: 320 });
      expect(next.projectiles).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('모든 상태를 초기화한다', () => {
      const state: GameState = {
        projectiles: [makeProjectile()],
        stuck: [{ id: 0, x: 10, y: 10, size: 42, rotation: 0, type: HEART }],
        impactSeq: 5,
      };
      const next = gameReducer(state, { type: 'reset' });
      expect(next).toEqual(EMPTY_STATE);
    });
  });

  describe('clear_stuck', () => {
    it('stuck만 비운다', () => {
      const projectile = makeProjectile();
      const state: GameState = {
        projectiles: [projectile],
        stuck: [{ id: 1, x: 10, y: 10, size: 42, rotation: 0, type: HEART }],
        impactSeq: 2,
      };
      const next = gameReducer(state, { type: 'clear_stuck' });
      expect(next.stuck).toHaveLength(0);
      expect(next.projectiles).toHaveLength(1);
      expect(next.impactSeq).toBe(2);
    });
  });
});
