'use client';
import { useEffect, useRef, useState } from 'react';
import { iconUrl } from '@/shared/icons';
import styles from './Screensaver.module.scss';

const DEFAULT_IDLE_MS = 120_000;
const LOGO_SIZE = 96; // px — 튕김 경계 계산용(대략치, 실제 el 크기와 다소 오차 있어도 무방)
const SPEED = 140; // px/sec

// 스크린세이버는 테마 밖 존재 — CSS 변수 무관 자체 팔레트
const COLORS = ['#00ffea', '#ff2e88', '#ffd400', '#00ff6a', '#a259ff', '#ff6a00', '#4aa8ff'];

const IDLE_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/** DVD 스크린세이버 — idleMs 동안 입력 없으면 로고가 튕겨다니며 색이 바뀜. 입력 시 즉시 해제 */
export function Screensaver({ idleMs = DEFAULT_IDLE_MS }: { idleMs?: number }): JSX.Element | null {
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: SPEED, y: SPEED * 0.7 });
  const colorIdxRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // idle 감지 타이머 — 입력 시 리셋, 활성 중 입력 시 즉시 해제
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setActive(true), idleMs);
    };

    const onActivity = () => {
      setActive((prev) => (prev ? false : prev));
      resetTimer();
    };

    IDLE_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      IDLE_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
    };
  }, [idleMs]);

  // 활성 중일 때만 rAF로 튕김 애니메이션 구동
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    posRef.current = {
      x: Math.random() * Math.max(rect.width - LOGO_SIZE, 0),
      y: Math.random() * Math.max(rect.height - LOGO_SIZE, 0),
    };
    velRef.current = {
      x: (Math.random() < 0.5 ? -1 : 1) * SPEED,
      y: (Math.random() < 0.5 ? -1 : 1) * SPEED,
    };
    lastTsRef.current = null;

    const applyColor = () => {
      if (logoRef.current) {
        logoRef.current.style.color = COLORS[colorIdxRef.current % COLORS.length];
      }
    };
    applyColor();

    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const bounds = container.getBoundingClientRect();
      const maxX = Math.max(bounds.width - LOGO_SIZE, 0);
      const maxY = Math.max(bounds.height - LOGO_SIZE, 0);

      let { x, y } = posRef.current;
      const vel = velRef.current;
      x += vel.x * dt;
      y += vel.y * dt;

      let bounced = false;
      if (x <= 0) {
        x = 0;
        vel.x = Math.abs(vel.x);
        bounced = true;
      } else if (x >= maxX) {
        x = maxX;
        vel.x = -Math.abs(vel.x);
        bounced = true;
      }
      if (y <= 0) {
        y = 0;
        vel.y = Math.abs(vel.y);
        bounced = true;
      } else if (y >= maxY) {
        y = maxY;
        vel.y = -Math.abs(vel.y);
        bounced = true;
      }

      posRef.current = { x, y };

      if (bounced) {
        colorIdxRef.current += 1;
        applyColor();
      }

      if (logoRef.current) {
        logoRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={containerRef} className={styles.overlay}>
      <div ref={logoRef} className={styles.logo}>
        <img src={iconUrl('logo-favicon')} alt="" className={styles.logoImg} />
        <span className={styles.logoText}>
          딴짓<b>★</b>OS
        </span>
      </div>
    </div>
  );
}
