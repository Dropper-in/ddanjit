'use client';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { iconUrl } from '@/shared/icons';
import { activatable, cx } from '@/shared/lib/ui';
import { useOutsideClick } from '@/shared/lib/useOutsideClick';
import { playSound, setMuted, isMuted, setVolume, getVolume } from '@/shared/lib/sound';
import { Checkbox } from '@/shared/ui/form-field';
import styles from './Taskbar.module.scss';
import type { AppDef } from '@/shared/types';

export interface Task {
  id: string;
  icon: string;
  title: string;
}

export interface StartMenuProps {
  apps: AppDef[];
  onItem: (id: string) => void;
  onCloseMenu?: () => void;
}

// role="menuitem" 항목들 사이를 순환 이동 — Home/End 포함
function focusMenuItem(container: HTMLElement | null, delta: 'first' | 'last' | number) {
  const items = Array.from(container?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  if (items.length === 0) return;
  if (delta === 'first') {
    items[0]?.focus();
    return;
  }
  if (delta === 'last') {
    items[items.length - 1]?.focus();
    return;
  }
  const current = document.activeElement as HTMLElement | null;
  const idx = current ? items.indexOf(current) : -1;
  const next = (idx + delta + items.length) % items.length;
  items[next]?.focus();
}

export function StartMenu({ apps, onItem, onCloseMenu }: StartMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 열리면 첫 항목에 포커스
  useEffect(() => {
    focusMenuItem(menuRef.current, 'first');
  }, []);

  // 클릭 실행 시 클릭음 재생 후 실제 동작 위임
  function activate(id: string) {
    playSound('click');
    onItem(id);
  }

  function handleMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusMenuItem(menuRef.current, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusMenuItem(menuRef.current, -1);
        break;
      case 'Home':
        e.preventDefault();
        focusMenuItem(menuRef.current, 'first');
        break;
      case 'End':
        e.preventDefault();
        focusMenuItem(menuRef.current, 'last');
        break;
      case 'Escape':
        e.preventDefault();
        onCloseMenu?.();
        break;
      default:
        break;
    }
  }

  return (
    // data-startmenu — OsShell closest() 감지용
    <div data-startmenu="" className={styles.startmenu} onMouseDown={(e) => e.stopPropagation()}>
      <div className={styles.strip}>
        <span>
          딴짓<b>★</b>OS
        </span>
      </div>
      <div className={styles.items} ref={menuRef} role="menu" onKeyDown={handleMenuKeyDown}>
        <div className={styles.sectionLabel}>앱 / Apps</div>
        {apps.map((app) => (
          <div
            key={app.id}
            className={styles.row}
            {...activatable(() => activate(app.id))}
            role="menuitem"
          >
            <img
              src={app.icon}
              width="24"
              height="24"
              alt=""
              style={{ imageRendering: 'pixelated' }}
            />
            <div className={styles.meta}>
              <b>{app.titleKo}</b>
              {(app.description ?? app.titleEn) && (
                <span className={styles.sub}>{app.description ?? app.titleEn}</span>
              )}
            </div>
          </div>
        ))}
        <div className={styles.sep} />
        <div className={styles.sectionLabel}>설정 / Settings</div>
        <div className={styles.row} {...activatable(() => activate('spectrum'))} role="menuitem">
          <span style={{ fontSize: 24, lineHeight: '24px', width: 24, textAlign: 'center' }}>
            🎨
          </span>
          <div className={styles.meta}>
            <b>테마 바꾸기</b>
            <span className={styles.sub}>spectrum...</span>
          </div>
        </div>
        <div className={styles.row} {...activatable(() => activate('about'))} role="menuitem">
          <img
            src={iconUrl('help')}
            width="24"
            height="24"
            alt=""
            style={{ imageRendering: 'pixelated' }}
          />
          <div className={styles.meta}>
            <b>딴짓.os 정보</b>
            <span className={styles.sub}>about 딴짓.os</span>
          </div>
        </div>
        <div className={styles.sep} />
        <div className={styles.row} {...activatable(() => activate('shutdown'))} role="menuitem">
          <img
            src={iconUrl('close')}
            width="24"
            height="24"
            alt=""
            style={{ imageRendering: 'pixelated' }}
          />
          <div className={styles.meta}>
            <b>전원 끄기...</b>
            <span className={styles.sub}>shut down...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

interface CalendarPopupProps {
  viewDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

// 순수 렌더 달력 — Date만 사용, 날짜 라이브러리 없이 월 그리드 계산
function CalendarPopup({ viewDate, onPrevMonth, onNextMonth }: CalendarPopupProps) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className={styles.calendar} onMouseDown={(e) => e.stopPropagation()}>
      <div className={styles.calendarHeader}>
        <button
          type="button"
          className={styles.calendarNav}
          onClick={onPrevMonth}
          aria-label="이전 달"
        >
          ◀
        </button>
        <span>
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          className={styles.calendarNav}
          onClick={onNextMonth}
          aria-label="다음 달"
        >
          ▶
        </button>
      </div>
      <div className={styles.calendarGrid}>
        {WEEKDAYS_KO.map((w) => (
          <span key={w} className={styles.calendarWeekday}>
            {w}
          </span>
        ))}
        {cells.map((day, i) => (
          <span
            key={i}
            className={cx(
              styles.calendarDay,
              day !== null && isToday(day) ? styles.today : undefined,
            )}
          >
            {day ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface TaskbarProps {
  tasks: Task[];
  activeId: string | null;
  onTask: (id: string) => void;
  onStart: () => void;
  startOpen: boolean;
  clock: string;
  startMenuApps?: AppDef[];
  onStartItem?: (id: string) => void;
  onCloseMenu?: () => void; // Escape 시 시작메뉴 닫기 요청
}

export function Taskbar({
  tasks,
  activeId,
  onTask,
  onStart,
  startOpen,
  clock,
  startMenuApps,
  onStartItem,
  onCloseMenu,
}: TaskbarProps) {
  const [muted, setMutedState] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const trayRef = useRef<HTMLDivElement>(null);

  // 초기 렌더는 🔊/볼륨1 고정 — 마운트 후에만 실제 상태 반영 (SSR 하이드레이션 미스매치 방지)
  useEffect(() => {
    setMutedState(isMuted());
    setVolumeState(getVolume());
  }, []);

  useOutsideClick(trayRef, () => setCalendarOpen(false), calendarOpen);
  useOutsideClick(trayRef, () => setVolumeOpen(false), volumeOpen);

  function handleStartClick() {
    playSound('click');
    onStart();
  }

  function handleTaskClick(id: string) {
    playSound('click');
    onTask(id);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playSound('click'); // 음소거 해제 시 피드백
  }

  // 볼륨 팝업 슬라이더 — 드래그 중엔 상태만 갱신, 놓을 때 클릭음으로 피드백
  function handleVolumeChange(next: number) {
    setVolume(next);
    setVolumeState(next);
    // 바를 움직였다는 건 소리를 원한다는 뜻 — 음소거 상태였다면 해제
    if (muted && next > 0) {
      setMuted(false);
      setMutedState(false);
    }
  }

  // "음소거 체크박스
  function handleMuteAll(checked: boolean) {
    setMuted(checked);
    setMutedState(checked);
    if (!checked) playSound('click'); // 해제 시 피드백
  }

  function toggleVolumePopup() {
    setCalendarOpen(false);
    setVolumeOpen((isOpen) => !isOpen);
  }

  function toggleCalendar() {
    setVolumeOpen(false);
    setCalendarOpen((isOpen) => {
      const next = !isOpen;
      if (next) setViewDate(new Date());
      return next;
    });
  }

  function handlePrevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  return (
    <div className={styles.taskbar}>
      {/* data-start — OsShell closest() 감지용 */}
      <div
        data-start=""
        role="button"
        tabIndex={0}
        aria-label="시작"
        aria-expanded={startOpen}
        className={cx(styles.start, startOpen ? styles.open : undefined)}
        onMouseDown={(e) => {
          e.preventDefault();
          handleStartClick();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStartClick();
          }
        }}
      >
        <img
          src={iconUrl('start')}
          width="16"
          height="16"
          alt=""
          style={{ imageRendering: 'pixelated' }}
        />
        <span>시작</span>
      </div>

      {tasks.map((task) => (
        <div
          key={task.id}
          aria-label={task.title}
          className={cx(styles.task, activeId === task.id ? styles.active : undefined)}
          title={task.title}
          {...activatable(() => handleTaskClick(task.id))}
        >
          <img
            src={task.icon}
            width="16"
            height="16"
            alt=""
            style={{ imageRendering: 'pixelated' }}
          />
          <span>{task.title}</span>
        </div>
      ))}

      <div className={styles.trayGroup} ref={trayRef}>
        {/* 모바일 전용 — 데스크탑에선 볼륨 바로 대체 */}
        <button
          type="button"
          className={styles.muteBtn}
          onClick={toggleMute}
          aria-label={muted ? '음소거 해제' : '음소거'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        {/* 데스크탑 전용 — 스피커 클릭 시 win98풍 세로 볼륨 팝업 */}
        <div className={styles.volume}>
          <button
            type="button"
            className={styles.volumeBtn}
            onClick={toggleVolumePopup}
            aria-haspopup="true"
            aria-expanded={volumeOpen}
            aria-label="볼륨"
          >
            {muted || volume === 0 ? '🔇' : '🔊'}
          </button>
          {volumeOpen && (
            <div className={styles.volumePopup} onMouseDown={(e) => e.stopPropagation()}>
              <span className={styles.volumeLabel}>볼륨:</span>
              {/* 양옆 눈금은 sliderWrap의 ::before/::after */}
              <div className={styles.sliderWrap}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  aria-label="볼륨 조절"
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  onPointerUp={() => playSound('click')}
                  // Firefox 세로 슬라이더 — 표준 attr 아니라 spread로 주입
                  {...{ orient: 'vertical' }}
                />
              </div>
              <Checkbox checked={muted} onChange={handleMuteAll} name="mute-all">
                음소거
              </Checkbox>
            </div>
          )}
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={calendarOpen}
          className={styles.tray}
          onMouseDown={(e) => {
            e.preventDefault();
            toggleCalendar();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleCalendar();
            }
          }}
        >
          {clock}
        </div>
        {calendarOpen && (
          <CalendarPopup
            viewDate={viewDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        )}
      </div>

      {startOpen && startMenuApps && onStartItem && (
        <StartMenu apps={startMenuApps} onItem={onStartItem} onCloseMenu={onCloseMenu} />
      )}
    </div>
  );
}
