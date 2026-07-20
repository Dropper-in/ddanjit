'use client';
import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

// 드래그 중 핸들(타이틀바)이 화면 밖으로 완전히 사라지지 않도록 최소한 보이게 유지하는 여유값(px)
const MIN_VISIBLE = 24;
// 작업표시줄 높이 안전값(px) — 모바일 48px 기준. 핸들이 이 밑으로 내려가지 못하게 막는다.
const TASKBAR_SAFE = 48;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startDx: number;
  startDy: number;
  baseLeft: number;
  baseTop: number;
  handleWidth: number;
  handleHeight: number;
};

/**
 * 타이틀바 등 핸들을 잡고 창을 옮기는 공용 드래그 훅 — Window·Dialog 공유.
 * rootRef = 이동시킬 요소, handleProps = 드래그 핸들에 스프레드.
 * 핸들 안에서 `[data-nodrag]` 요소(닫기 버튼 등) 위에서 시작한 드래그는 무시한다.
 */
export function useDraggable<
  Root extends HTMLElement = HTMLDivElement,
  Handle extends HTMLElement = HTMLDivElement,
>(enabled: boolean) {
  const rootRef = useRef<Root>(null);
  const handleRef = useRef<Handle>(null);
  const dragRef = useRef<DragState | null>(null);
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled) return;
    // 컨트롤 버튼 등 위에서 시작한 드래그는 무시
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return;
    const root = rootRef.current;
    const handle = handleRef.current;
    if (!root || !handle) return;

    const rootRect = root.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startDx: offset.dx,
      startDy: offset.dy,
      // 현재 transform이 반영된 rect에서 오프셋을 제거해 원래 레이아웃 위치를 구함
      baseLeft: rootRect.left - offset.dx,
      baseTop: rootRect.top - offset.dy,
      handleWidth: handleRect.width,
      handleHeight: handleRect.height,
    };
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();

    let visualLeft = drag.baseLeft + drag.startDx + (e.clientX - drag.startX);
    let visualTop = drag.baseTop + drag.startDy + (e.clientY - drag.startY);

    const maxLeft = window.innerWidth - MIN_VISIBLE;
    const minLeft = MIN_VISIBLE - drag.handleWidth;
    visualLeft = Math.min(Math.max(visualLeft, minLeft), maxLeft);

    // 핸들 전체가 작업표시줄 위에 남도록 — 밑으로 숨으면 다시 잡을 수 없음
    const maxTop = window.innerHeight - TASKBAR_SAFE - drag.handleHeight;
    visualTop = Math.min(Math.max(visualTop, 0), maxTop);

    setOffset({ dx: visualLeft - drag.baseLeft, dy: visualTop - drag.baseTop });
  };

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (handleRef.current?.hasPointerCapture(e.pointerId)) {
      handleRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const transform: CSSProperties =
    enabled && (offset.dx !== 0 || offset.dy !== 0)
      ? { transform: `translate(${offset.dx}px, ${offset.dy}px)` }
      : {};

  return {
    rootRef,
    handleRef,
    transform,
    handleProps: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag },
  };
}
