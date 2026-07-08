import { useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { activatable, cx } from '@/shared/lib/ui';
import { useOutsideClick } from '@/shared/lib/useOutsideClick';
import styles from './Menubar.module.scss';

export interface MenuItem {
  id: string;
  label: ReactNode;
  shortcut?: string; // 우측에 표시될 단축키 텍스트 (표시 전용, 실제 바인딩 없음)
  checked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export type MenuItemOrSep = MenuItem | '---';

export interface MenuDef {
  label: string;
  mnemonic?: string; // 레이블에서 밑줄 칠 문자 (키보드 단축키 표시용)
  items: MenuItemOrSep[];
}

export interface MenubarProps {
  menus: MenuDef[];
  onAction: (id: string) => void;
}

export function Menubar({ menus, onAction }: MenubarProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  // 메뉴바 외부 클릭 시 열린 메뉴 닫기
  useOutsideClick(ref, () => setOpenIdx(null), openIdx !== null);

  return (
    <div className={styles.menubar} ref={ref}>
      {menus.map((m, i) => (
        <div key={m.label} style={{ position: 'relative' }}>
          <span
            className={cx(styles.item, openIdx === i ? styles.open : undefined)}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpenIdx(openIdx === i ? null : i);
            }}
            onMouseEnter={() => {
              if (openIdx !== null) setOpenIdx(i);
            }}
          >
            {m.label
              .split('')
              .map((ch, k) =>
                ch === m.mnemonic ? <u key={k}>{ch}</u> : <span key={k}>{ch}</span>,
              )}
          </span>
          {openIdx === i && (
            <div className={styles.menu} style={{ top: '100%', left: 0 }}>
              {m.items.map((it, j) =>
                it === '---' ? (
                  <div className={styles.sep} key={j} />
                ) : (
                  <div
                    key={j}
                    className={cx(
                      styles.row,
                      it.checked ? styles.checked : undefined,
                      it.disabled ? styles.disabled : undefined,
                    )}
                    {...activatable(() => {
                      if (it.disabled) return;
                      setOpenIdx(null);
                      if (it.onClick) it.onClick();
                      else onAction(it.id);
                    })}
                    tabIndex={it.disabled ? -1 : 0}
                  >
                    <span>{it.label}</span>
                    {it.shortcut && <span className={styles.right}>{it.shortcut}</span>}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export interface MenuButtonProps {
  items: MenuItemOrSep[];
  value?: string;
  onChange?: (id: string) => void;
  placeholder?: string;
  width?: number | string;
  align?: 'left' | 'right';
  footer?: ReactNode | ((ctx: { close: () => void }) => ReactNode);
  className?: string;
}

export function MenuButton({
  items,
  value,
  onChange,
  placeholder = '선택',
  width,
  align = 'left',
  footer,
  className,
}: MenuButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useOutsideClick(ref, () => setOpen(false), open);

  const current = items.find((it): it is MenuItem => it !== '---' && it.id === value);
  const label = current ? current.label : placeholder;
  const style: CSSProperties | undefined = width !== undefined ? { width } : undefined;

  return (
    // ui-menubtn 글로벌 훅 유지 — _apps.scss dd-input-compact 복합 셀렉터용
    <div className={cx(styles.menubtn, 'ui-menubtn', className)} ref={ref} style={style}>
      <button
        type="button"
        // ui-menubtn-trigger 글로벌 훅 유지 — _apps.scss 복합 셀렉터용
        className={cx(styles.trigger, 'ui-menubtn-trigger', open ? styles.open : undefined)}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
      >
        <span className={styles.label}>{label}</span>
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className={styles.menu} style={{ top: '100%', [align]: 0 } as CSSProperties}>
          {items.map((it, j) =>
            it === '---' ? (
              <div className={styles.sep} key={j} />
            ) : (
              <div
                key={it.id}
                className={cx(
                  styles.row,
                  it.id === value ? styles.checked : undefined,
                  it.disabled ? styles.disabled : undefined,
                )}
                {...activatable(() => {
                  if (it.disabled) return;
                  setOpen(false);
                  if (it.onClick) it.onClick();
                  else onChange?.(it.id);
                })}
                tabIndex={it.disabled ? -1 : 0}
              >
                <span>{it.label}</span>
                {it.shortcut && <span className={styles.right}>{it.shortcut}</span>}
              </div>
            ),
          )}
          {footer && (
            <>
              <div className={styles.sep} />
              <div className={styles.menuFooter} onMouseDown={(e) => e.stopPropagation()}>
                {typeof footer === 'function' ? footer({ close: () => setOpen(false) }) : footer}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
