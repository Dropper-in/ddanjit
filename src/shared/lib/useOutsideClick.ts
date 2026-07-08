import { useEffect, type RefObject } from 'react';

/** ref 바깥 mousedown 시 onOutside 호출. active=false면 리스너 미등록. */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  active = true,
): void {
  useEffect(() => {
    if (!active) return;
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onOutside();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, onOutside, active]);
}
