'use client';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Radio } from '@/shared/ui/form-field';
import type { DialogState, Spectrum } from './config';
import { SPECTRUMS, SPECTRUM_LABELS } from './config';
import styles from './OsShell.module.scss';

export function DialogRouter({
  dialog,
  onClose,
  spectrum,
  setSpectrum,
}: {
  dialog: NonNullable<DialogState>;
  onClose: () => void;
  spectrum: Spectrum;
  setSpectrum: (spectrum: Spectrum) => void;
}) {
  if (dialog.type === 'about') {
    return (
      <Dialog
        icon="cat"
        title="딴짓.os 정보"
        onClose={onClose}
        buttons={
          <Button isDefault onClick={onClose}>
            알겠어요
          </Button>
        }
      >
        <div className={styles.dialogBody}>
          <b>딴짓.os</b>
          <br />
          <span className={styles.dialogNote}>ddanjit.os · v1.0</span>
          <br />
          <br />
          할일 안 하고 옆길로 새는 토이 프로젝트 모음.
          <br />
          <span className={styles.dialogNote}>
            A collection of toy projects for procrastinators.
          </span>
          <br />
          <br />
          ©2026 딴짓 컴퍼니.
        </div>
      </Dialog>
    );
  }
  if (dialog.type === 'shutdown') {
    return (
      <Dialog
        icon="start"
        title="전원 끄기"
        onClose={onClose}
        buttons={
          <>
            <Button isDefault onClick={onClose}>
              확인
            </Button>
            <Button onClick={onClose}>취소</Button>
          </>
        }
      >
        <div>
          이제 컴퓨터를 꺼도 안전합니다.
          <br />
          <span className={styles.dialogNote}>
            ...라고 해도, 사실은 끄는 기능이 없으니 농담이에요.
          </span>
        </div>
      </Dialog>
    );
  }
  if (dialog.type === 'spectrum') {
    return (
      <Dialog
        title="테마 바꾸기 / Choose Spectrum"
        onClose={onClose}
        buttons={
          <Button isDefault onClick={onClose}>
            닫기
          </Button>
        }
      >
        <div className={styles.spectrumList}>
          {SPECTRUMS.map((spectrumKey) => (
            <Radio
              key={spectrumKey}
              className={styles.spectrumItem}
              name="spec"
              value={spectrumKey}
              checked={spectrum === spectrumKey}
              onChange={(v) => setSpectrum(v as Spectrum)}
            >
              {SPECTRUM_LABELS[spectrumKey]}
            </Radio>
          ))}
        </div>
      </Dialog>
    );
  }
  return null;
}
