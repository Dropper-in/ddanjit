'use client';
import { useState, useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { OsDesktop } from '@/os/desktop';
import { Taskbar } from '@/os/taskbar';
import { PopupAd } from '@/os/popup-ad';
import { BootScreen } from '@/os/boot';
import { Screensaver } from '@/os/screensaver';
import type { Task } from '@/os/taskbar';
import { Window } from '@/shared/ui/window';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import { playSound } from '@/shared/lib/sound';
import { iconUrl } from '@/shared/icons';
import {
  APPS,
  formatClock,
  FUTURE_SLOTS,
  SPECTRUMS,
  NAG_FIXED,
  NAG_RANDOM,
  NAG_REPEAT_EVERY,
  NAG_THRESHOLD_1,
  NAG_THRESHOLD_2,
} from './config';
import type { AppId, AppEntry, Spectrum, DialogState } from './config';
import { DialogRouter } from './DialogRouter';
import styles from './OsShell.module.scss';

const SPECTRUM_KEY = 'ddanjit.spectrum';
const NAG_KEY = 'ddanjit.nagClicks';
const BOOT_KEY = 'ddanjit.booted';

export interface OsShellProps {
  initialAppId?: AppId;
  skipBoot?: boolean;
}

// 작업표시줄 다이얼로그 버튼 아이콘/제목 — DialogRouter의 아이콘과 결 맞춤
const THEME_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text x='8' y='13' font-size='12' text-anchor='middle'>🎨</text></svg>`,
)}`;

function dialogTask(d: NonNullable<DialogState>): Task {
  switch (d.type) {
    case 'about':
      return { id: 'dialog', icon: iconUrl('logo-favicon'), title: '딴짓.os 정보' };
    case 'shutdown':
      return { id: 'dialog', icon: iconUrl('start'), title: '전원 끄기' };
    case 'spectrum':
      return { id: 'dialog', icon: THEME_ICON, title: '테마 바꾸기' };
    case 'nag':
      return { id: 'dialog', icon: iconUrl('wrench'), title: d.msg.title };
  }
}

export function OsShell({ initialAppId, skipBoot = false }: OsShellProps) {
  const [openAppId, setOpenAppId] = useState<AppId | null>(initialAppId ?? null);
  const [startOpen, setStartOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [spectrum, setSpectrum] = useState<Spectrum>('win98');
  const [clock, setClock] = useState('');
  const [desktopSel, setDesktopSel] = useState<AppId | null>(null);
  const [booting, setBooting] = useState(false);
  // 실제 윈도우처럼 포커스된 창만 활성(컬러) 타이틀바 — 나머지는 회색. 새로 뜬 창이 포커스 획득.
  const [focused, setFocused] = useState<'app' | 'ad'>('app');
  // 팝업광고 표시 여부 — 작업표시줄 버튼 노출용 (PopupAd가 등장·닫힘을 알림)
  const [adOpen, setAdOpen] = useState(false);

  // 세션당 1회 부팅 시퀀스 — SSR 하이드레이션 미스매치 방지 위해 effect에서 판정
  useEffect(() => {
    if (skipBoot) return;
    if (sessionStorage.getItem(BOOT_KEY) !== '1') setBooting(true);
  }, [skipBoot]);

  // 공유 페이지와 ?open=fortune 모두 처음 요청한 앱을 앞에 연다.
  useEffect(() => {
    if (!initialAppId) return;
    setOpenAppId(initialAppId);
    setFocused('app');
  }, [initialAppId]);

  // 저장된 테마 복원 (최초 1회)
  useEffect(() => {
    const saved = localStorage.getItem(SPECTRUM_KEY);
    if (saved && (SPECTRUMS as readonly string[]).includes(saved)) setSpectrum(saved as Spectrum);
  }, []);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      setClock(formatClock());
      id = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', spectrum === 'win98' ? '' : spectrum);
    localStorage.setItem(SPECTRUM_KEY, spectrum);
  }, [spectrum]);

  // 시작버튼+메뉴 두 서브트리를 봐야 해서 useOutsideClick 미적용
  useEffect(() => {
    if (!startOpen) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-startmenu]') && !target.closest('[data-start]')) {
        setStartOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [startOpen]);

  function openApp(id: string) {
    setStartOpen(false);
    setOpenAppId(id as AppId);
    setFocused('app');
    playSound('open');
  }
  function closeApp() {
    setOpenAppId(null);
  }

  // 준비중 아이콘 연타 이스터에그 — 50·100회 고정 멘트, 이후 50회마다 랜덤 풀
  // 카운트는 localStorage 유지 — 재방문자도 100회 멘트까지 도달 가능
  const slotClicks = useRef(0);
  useEffect(() => {
    slotClicks.current = parseInt(localStorage.getItem(NAG_KEY) ?? '0', 10) || 0;
  }, []);
  function onSlotClick() {
    slotClicks.current += 1;
    const n = slotClicks.current;
    localStorage.setItem(NAG_KEY, String(n));
    let msg: (typeof NAG_FIXED)[number] | undefined;
    if (n === NAG_THRESHOLD_1) msg = NAG_FIXED[0];
    else if (n === NAG_THRESHOLD_2) msg = NAG_FIXED[1];
    else if (n > NAG_THRESHOLD_2 && n % NAG_REPEAT_EVERY === 0)
      msg = NAG_RANDOM[Math.floor(Math.random() * NAG_RANDOM.length)];
    if (msg) {
      setDialog({ type: 'nag', msg });
      playSound('error');
    }
  }

  function onStartItem(id: string) {
    setStartOpen(false);
    const appId = APPS.find((app) => app.id === id)?.id;
    if (appId) {
      openApp(appId);
      return;
    }
    if (id === 'spectrum') setDialog({ type: 'spectrum' });
    else if (id === 'about') setDialog({ type: 'about' });
    else if (id === 'shutdown') setDialog({ type: 'shutdown' });
  }

  const activeApp: AppEntry | undefined = APPS.find((app) => app.id === openAppId);

  // 작업표시줄 — 열린 모든 창(앱·다이얼로그·광고) 버튼
  const tasks: Task[] = [];
  if (activeApp) tasks.push({ id: activeApp.id, icon: activeApp.icon, title: activeApp.titleKo });
  if (dialog) tasks.push(dialogTask(dialog));
  if (adOpen) tasks.push({ id: 'ad', icon: iconUrl('star'), title: '☆ 광고 ☆' });

  // 하이라이트 대상 — 다이얼로그(항상 최상단) > 포커스된 창
  const activeTaskId = dialog
    ? 'dialog'
    : focused === 'ad' && adOpen
      ? 'ad'
      : (activeApp?.id ?? null);

  function handleTask(id: string) {
    if (id === 'dialog') return; // 다이얼로그는 항상 위에 떠 있어 별도 동작 없음
    setFocused(id === 'ad' ? 'ad' : 'app');
  }

  // 광고 표시 상태 반영 — 닫힐 때 포커스가 광고에 있었으면 앱으로 되돌림
  function handleAdVisibility(visible: boolean) {
    setAdOpen(visible);
    if (!visible) setFocused((f) => (f === 'ad' ? 'app' : f));
  }

  // 비전체화면 앱 프레임 클래스 — fullscreen 분기 제거, 비전체화면 전용
  const frameClass = [
    styles.appFrame,
    activeApp?.wide ? styles.appFrameWide : styles.appFrameNarrow,
  ].join(' ');

  const ActiveAppComponent = activeApp?.component as
    | ComponentType<{ onExit?: () => void }>
    | undefined;
  const activeAppContent =
    activeApp && ActiveAppComponent ? <ActiveAppComponent onExit={closeApp} /> : null;

  return (
    <>
      <OsDesktop
        apps={APPS}
        selectedId={desktopSel}
        onSelect={(id) => setDesktopSel(id as AppId | null)}
        onOpen={openApp}
        futureSlots={FUTURE_SLOTS}
        onSlotClick={onSlotClick}
      />

      <PopupAd
        onClaim={() => openApp('stones')}
        active={focused === 'ad'}
        onFocus={() => setFocused('ad')}
        onVisibilityChange={handleAdVisibility}
      />

      {activeApp &&
        (activeApp.fullscreen ? (
          // 전체화면 앱 — Window 없이 컴포넌트 직접 마운트
          <div className={styles.appFullscreen}>
            <ErrorBoundary appName={activeApp.titleKo}>{activeAppContent}</ErrorBoundary>
          </div>
        ) : (
          // 일반 앱 — Window 크롬 포함. 포커스 시 z-index 상승 + 컬러 타이틀바
          <div
            className={focused === 'app' ? `${frameClass} ${styles.appFrameFocused}` : frameClass}
            // pointerDown 사용 — 타이틀바 드래그가 preventDefault로 mousedown을 삼켜서
            onPointerDown={() => setFocused('app')}
          >
            <Window
              icon={activeApp.icon}
              title={activeApp.titleKo}
              active={focused === 'app'}
              draggable
              onClose={closeApp}
              style={{ flex: 1, minWidth: 0 }}
            >
              <ErrorBoundary appName={activeApp.titleKo}>{activeAppContent}</ErrorBoundary>
            </Window>
          </div>
        ))}

      <Taskbar
        tasks={tasks}
        activeId={activeTaskId}
        onTask={handleTask}
        onStart={() => setStartOpen((isOpen) => !isOpen)}
        startOpen={startOpen}
        clock={clock}
        startMenuApps={APPS}
        onStartItem={onStartItem}
        onCloseMenu={() => setStartOpen(false)}
      />

      <Screensaver />

      {booting && (
        <BootScreen
          onDone={() => {
            sessionStorage.setItem(BOOT_KEY, '1');
            setBooting(false);
          }}
        />
      )}

      {dialog && (
        <DialogRouter
          dialog={dialog}
          onClose={() => setDialog(null)}
          spectrum={spectrum}
          setSpectrum={setSpectrum}
        />
      )}
    </>
  );
}
