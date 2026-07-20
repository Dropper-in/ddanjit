'use client';

import { useEffect, useState } from 'react';
import { cx } from '@/shared/lib/ui';
import { getTodayFortune, type Fortune } from '../model/fortunes';
import styles from './FortuneApp.module.scss';

type Phase = 'idle' | 'loading' | 'revealed';

// 점술가 방 배경에 흩뿌릴 별 — 고정 시드라 렌더마다 동일
const TWINKLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  delay: `${(i % 6) * 0.5}s`,
}));

export function FortuneApp({ onExit: _onExit }: { onExit?: () => void }) {
  // new Date() 기반 값은 SSR 하이드레이션 미스매치 방지 위해 effect 이후에만 채우기
  const [dateLabel, setDateLabel] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [fortune, setFortune] = useState<Fortune | null>(null);

  useEffect(() => {
    const today = new Date();
    setDateLabel(
      new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(today),
    );
  }, []);

  // 하루 한 장
  function handleReveal() {
    if (phase !== 'idle') return;
    setPhase('loading');
    // 두구두구 연출 — 500~1000ms 사이 랜덤 대기 후 공개 (연출용이라 결과엔 영향 없음)
    const delay = 500 + Math.random() * 500;
    setTimeout(() => {
      setFortune(getTodayFortune(new Date()));
      setPhase('revealed');
    }, delay);
  }

  return (
    <div className={styles.room}>
      {TWINKLES.map((t, i) => (
        <span
          key={i}
          className={styles.twinkle}
          style={{ left: t.left, top: t.top, animationDelay: t.delay }}
          aria-hidden="true"
        />
      ))}

      <p className={styles.date}>{dateLabel || ' '}</p>

      <button
        type="button"
        className={cx(styles.orbBtn, phase === 'loading' ? styles.rolling : undefined)}
        onClick={handleReveal}
        disabled={phase === 'revealed'}
        aria-label="운세 보기"
      >
        <span className={styles.orb} aria-hidden="true">
          🥠
        </span>
      </button>

      {phase !== 'revealed' && (
        <p className={styles.hint}>
          {phase === 'loading' ? '와그작...' : '쿠키를 클릭해 오늘의 운세를 보세요'}
        </p>
      )}

      {phase === 'revealed' && fortune && (
        <>
          {/* 포춘쿠키 쪽지 — 하루 한 장 */}
          <div className={styles.slip}>
            <p className={styles.text}>{fortune.text}</p>
          </div>
          <p className={styles.hint}>{fortune.note}</p>
        </>
      )}
    </div>
  );
}
