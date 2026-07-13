'use client';
import { useEffect, useState } from 'react';
import { Window } from '@/shared/ui/window';
import { Button } from '@/shared/ui/button';
import styles from './PopupAd.module.scss';

const AD_DELAY_MIN_MS = 3000;
const AD_DELAY_MAX_MS = 7000;

/** 접속 3~7초 후 우하단에서 올라오는 레트로 팝업광고 — 데스크탑 한정, 새로고침마다 등장 */
export function PopupAd({ onClaim }: { onClaim: () => void }) {
  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const delay = AD_DELAY_MIN_MS + Math.random() * (AD_DELAY_MAX_MS - AD_DELAY_MIN_MS);
    const id = setTimeout(() => {
      // 모바일은 화면이 좁아 광고가 진짜 방해가 됨 — 농담은 데스크탑에서만
      if (!window.matchMedia('(min-width: 768px)').matches) return;
      setVisible(true);
    }, delay);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.popup}>
      <Window icon="star" title="☆ 광고 ☆" onClose={() => setVisible(false)}>
        <div className={styles.body}>
          {claimed ? (
            <>
              <span>🎁 상품: 돌멩이 무제한 던지기 이용권 (평생)</span>
              <span className={styles.note}>이미 전 인류에게 지급된 상품입니다.</span>
              <Button isDefault onClick={() => setVisible(false)}>
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
