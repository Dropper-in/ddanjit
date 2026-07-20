'use client';
import { useEffect, useRef, useState } from 'react';
import { Window } from '@/shared/ui/window';
import { Button } from '@/shared/ui/button';
import styles from './PopupAd.module.scss';

const AD_DELAY_MIN_MS = 3000;
const AD_DELAY_MAX_MS = 7000;

interface PopupAdProps {
  onClaim: () => void;
  active: boolean; // 포커스 여부 — false면 회색 비활성 타이틀바
  onFocus: () => void; // 등장·클릭 시 셸에 포커스 이양 요청
  onVisibilityChange: (visible: boolean) => void; // 작업표시줄 버튼 노출용
}

/** 접속 3~7초 후 우하단에서 올라오는 레트로 팝업광고 — 데스크탑 한정, 새로고침마다 등장 */
export function PopupAd({ onClaim, active, onFocus, onVisibilityChange }: PopupAdProps) {
  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState(false);
  // 등장 시점 콜백을 effect 재실행 없이 부르기 위한 ref (inline 콜백 identity 변화 무시)
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const onVisibilityChangeRef = useRef(onVisibilityChange);
  onVisibilityChangeRef.current = onVisibilityChange;

  function close() {
    setVisible(false);
    onVisibilityChange(false);
  }

  useEffect(() => {
    const delay = AD_DELAY_MIN_MS + Math.random() * (AD_DELAY_MAX_MS - AD_DELAY_MIN_MS);
    const id = setTimeout(() => {
      // 모바일은 화면이 좁아 광고가 진짜 방해가 됨 — 농담은 데스크탑에서만
      if (!window.matchMedia('(min-width: 768px)').matches) return;
      setVisible(true);
      onFocusRef.current(); // 실제 팝업처럼 등장하면서 포커스 획득
      onVisibilityChangeRef.current(true);
    }, delay);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.popup} onPointerDown={onFocus}>
      <Window title="☆ 광고 ☆" active={active} draggable onClose={close}>
        <div className={styles.body}>
          {claimed ? (
            <>
              <span>🎁 상품: 돌멩이 무제한 던지기 이용권 (평생)</span>
              <span className={styles.note}>이미 전 인류에게 지급된 상품입니다.</span>
              <Button isDefault onClick={close}>
                닫기
              </Button>
            </>
          ) : (
            <>
              <span className={styles.headline}>★ 축하합니다!! ★</span>
              <span>
                당신은 이 사이트의
                <br />
                <b>1,048,576번째</b> 방문자입니다!!
              </span>
              <Button
                isDefault
                onClick={() => {
                  setClaimed(true);
                  onClaim();
                }}
              >
                상품 받기
              </Button>
              <span className={styles.note}>* 실제 방문자 수와 다를 수 있음</span>
            </>
          )}
        </div>
      </Window>
    </div>
  );
}
