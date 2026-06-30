import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import styles from './Stones.module.scss';

interface Props {
  gifUrl: string;
  onClose: () => void;
}

export function GifPreviewDialog({ gifUrl, onClose }: Props) {
  return (
    <Dialog
      title="GIF 저장"
      onClose={onClose}
      buttons={<Button onClick={onClose}>닫기</Button>}
      className={styles.gifDialog}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <img
          src={gifUrl}
          alt="녹화된 GIF"
          style={{ display: 'block', maxWidth: '100%', maxHeight: '60vh' }}
        />
        <span style={{ fontSize: 11, color: 'var(--ink-dim)', textAlign: 'center' }}>
          이미지를 우클릭(PC) 또는 길게 눌러(모바일) 저장하세요
        </span>
      </div>
    </Dialog>
  );
}
