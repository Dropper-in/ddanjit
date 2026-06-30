'use client';
import { useState, useEffect, useRef } from 'react';
import type { AmmoType } from '../model/types';

export function AmmoDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: AmmoType[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const current = options.find((option) => option.id === value) ?? options[0];

  return (
    <div className="st-ammo-dropdown" ref={ref}>
      <button
        className="st-ammo-trigger"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((isOpen) => !isOpen);
        }}
        type="button"
      >
        {current.emoji ? (
          <span style={{ fontSize: 16, lineHeight: 1 }}>{current.emoji}</span>
        ) : (
          <img src={current.icon} width="16" height="16" alt="" />
        )}
        <span className="st-ammo-trigger-label">
          {current.label} <span className="dim">({current.sticks ? '박힘' : '튕겨나감'})</span>
        </span>
        <span className="caret">▾</span>
      </button>
      {open && (
        <div className="st-ammo-menu">
          {options.map((option) => (
            <div
              key={option.id}
              className={'row' + (option.id === value ? ' selected' : '')}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              {option.emoji ? (
                <span style={{ fontSize: 16, lineHeight: 1 }}>{option.emoji}</span>
              ) : (
                <img src={option.icon} width="16" height="16" alt="" />
              )}
              <span>{option.label}</span>
              <span className="dim">{option.sticks ? '박힘' : '튕겨나감'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
