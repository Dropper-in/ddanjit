/** 던질 수 있는 탄약 종류 */
export interface AmmoType {
  id: string;
  icon: string;
  emoji?: string; // 이미지 대신 이모지 렌더링할 경우
  label: string;
  color: string;
  sticks: boolean; // true = 맞으면 박힘, false = 튕겨나감
  happy?: boolean; // 반응 말풍선 무드 — 생략 시 sticks 따름
  size: number; // 렌더링 크기 (px)
}

/** 비행 중이거나 튕기는 발사체 한 개 */
export interface Projectile {
  id: number;
  type: AmmoType;
  phase: 'flight' | 'bounce';
  frame: number; // 현재 애니메이션 프레임
  flightFrames: number; // 총 비행 프레임 수 (세기에 따라 결정)
  size: number; // 실제 렌더링 크기 (px) — stage 크기 비례 적용됨
  tx: number; // 목표 x 좌표 (target)
  ty: number; // 목표 y 좌표 (target)
  sx: number; // 발사 출발 x 좌표 (source)
  sy: number; // 발사 출발 y 좌표 (source)
  rot: number; // 현재 회전 각도 (deg)
  bounceFrame: number; // 튕김 페이즈 경과 프레임
  x: number; // 튕김 페이즈 실시간 위치
  y: number;
  vx: number; // 튕김 속도 벡터
  vy: number;
  rotVel: number; // 프레임당 회전 속도 (deg/frame)
}

/** 캐릭터에 박힌 탄약 */
export interface StuckItem {
  id: number;
  x: number;
  y: number;
  size: number; // 실제 렌더링 크기 (px) — stage 크기 비례 적용됨
  rotation: number; // deg, -45 ~ +45
  type: AmmoType;
}

export type GameState = {
  projectiles: Projectile[];
  stuck: StuckItem[];
  impactSeq: number; // 충돌할 때마다 +1 — useEffect 트리거용 카운터
};

export type GameAction =
  | { type: 'tick'; targetWidth: number } // 애니메이션 1프레임 진행
  | { type: 'fire'; projectile: Projectile } // 새 발사체 추가
  | { type: 'reset' } // 게임 초기화
  | { type: 'clear_stuck' }; // 박힌 탄약만 제거

/**
 * GIF drawFrame이 읽는 렌더 스냅샷 — StoneThrower가 매 렌더 갱신.
 * 렌더 주기와 동기화되는 state 파생 값만 포함한다.
 * throwing/jellyStart(렌더 외부에서 갱신)와 imgDims(업로드 onload 콜백에서
 * 렌더 전에 갱신)는 stale 위험이 있어 여기 넣지 않고 개별 ref로 유지한다.
 */
export interface FrameSnapshot {
  game: GameState;
  shake: number;
  reactionFrame: number;
  characterUrl: string;
  shotCount: number;
  ammoId: string;
  showReaction: boolean;
}
