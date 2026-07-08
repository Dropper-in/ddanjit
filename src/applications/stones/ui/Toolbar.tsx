import { memo } from 'react';
import { Checkbox } from '@/shared/ui/form-field';
import { AMMO_TYPES } from '../model/constants';
import { AmmoDropdown } from './AmmoDropdown';
import styles from './Stones.module.scss';

interface Props {
  ammoId: string;
  onAmmoChange: (id: string) => void;
  showReaction: boolean;
  onShowReactionChange: (v: boolean) => void;
}

export const Toolbar = memo(function Toolbar({
  ammoId,
  onAmmoChange,
  showReaction,
  onShowReactionChange,
}: Props) {
  return (
    <div className="st-toolbar">
      <div className="st-ammo-row">
        {AMMO_TYPES.map((ammoType) => (
          <button
            key={ammoType.id}
            className={'st-ammo-btn' + (ammoId === ammoType.id ? ' selected' : '')}
            onClick={() => onAmmoChange(ammoType.id)}
            title={ammoType.label + (ammoType.sticks ? ' (박힘)' : ' (튕겨나감)')}
            type="button"
          >
            {ammoType.emoji ? (
              <span style={{ fontSize: 18, lineHeight: 1 }}>{ammoType.emoji}</span>
            ) : (
              <img src={ammoType.icon} width="18" height="18" alt="" />
            )}
            <span>{ammoType.label}</span>
          </button>
        ))}
      </div>
      <AmmoDropdown value={ammoId} options={AMMO_TYPES} onChange={onAmmoChange} />
      <span className={styles.spacer} />
      <Checkbox checked={showReaction} onChange={onShowReactionChange}>
        말풍선
      </Checkbox>
    </div>
  );
});
