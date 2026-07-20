'use client';
import { useEffect, useRef, useState } from 'react';
import { iconUrl } from '@/shared/icons';
import { playSound } from '@/shared/lib/sound';
import styles from './BootScreen.module.scss';

// 가짜 BIOS 로그 — 딴짓.os 세계관 톤(할일 안 하고 옆길 새는 사이트) 유머
const BOOT_LINES = [
  'DDANJIT BIOS v1.0',
  '메모리 검사... 딴짓 용량 충분',
  'CPU 클럭 감지: 농땡이 최적화 모드 ON',
  '할일 목록 로드... 건너뜀',
  '집중력 드라이버 로드... 실패 (정상입니다)',
  '게으름 드라이버 로드 완료',
  '딴짓거리 인덱싱 중...',
  '부팅 완료.',
] as const;

const LINE_INTERVAL_MS = 300; // 줄 하나당 출력 간격
const LOGO_HOLD_MS = 1000; // 로고 화면 유지 시간

/** 전체화면 부팅 시퀀스 — 마운트되면 무조건 재생, 클릭/키 입력으로 스킵 가능 */
export function BootScreen({ onDone }: { onDone: () => void }): JSX.Element {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  // onDone은 렌더마다 새 함수일 수 있어 ref로 최신값만 스냅샷 유지(effect 재실행 방지)
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      onDoneRef.current();
    };

    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), LINE_INTERVAL_MS * (i + 1)));
    });

    const logoDelay = LINE_INTERVAL_MS * (BOOT_LINES.length + 1);
    timers.push(
      setTimeout(() => {
        setShowLogo(true);
        // 자동 진행 타이머에서 호출 — 브라우저가 무음 처리해도 실패 무시(sound 모듈 책임)
        playSound('startup');
      }, logoDelay),
    );
    timers.push(setTimeout(finish, logoDelay + LOGO_HOLD_MS));

    // 아무 클릭/키 입력 시 즉시 스킵
    const skip = () => finish();
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  return (
    <div className={styles.boot}>
      {!showLogo ? (
        <div className={styles.log}>
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className={styles.line}>
              {line}
            </div>
          ))}
          <span className={styles.cursor} />
        </div>
      ) : (
        <div className={styles.logo}>
          <img src={iconUrl('logo-favicon')} alt="" className={styles.logoImg} />
          <div className={styles.logoText}>
            딴짓<b>★</b>OS
          </div>
        </div>
      )}
    </div>
  );
}
