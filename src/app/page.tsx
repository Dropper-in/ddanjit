'use client';
import { useState, useEffect, useRef } from 'react';
import { OsDesktop } from '@/os/desktop';
import { Taskbar } from '@/os/taskbar';
import { PopupAd } from '@/os/popup-ad';
import type { Task } from '@/os/taskbar';
import { Window } from '@/shared/ui/window';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import {
  APPS,
  formatClock,
  FUTURE_SLOTS,
  NAG_FIXED,
  NAG_RANDOM,
  NAG_REPEAT_EVERY,
  NAG_THRESHOLD_1,
  NAG_THRESHOLD_2,
} from './config';
import type { AppId, AppEntry, Spectrum, DialogState } from './config';
import { DialogRouter } from './DialogRouter';
import styles from './OsShell.module.scss';

export default function Home() {
  const [openAppId, setOpenAppId] = useState<AppId | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [spectrum, setSpectrum] = useState<Spectrum>('win98');
  const [clock, setClock] = useState('');
  const [desktopSel, setDesktopSel] = useState<AppId | null>(null);

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
  }
  function closeApp() {
    setOpenAppId(null);
  }

  // 준비중 아이콘 연타 이스터에그 — 50·100회 고정 멘트, 이후 50회마다 랜덤 풀
  const slotClicks = useRef(0);
  function onSlotClick() {
    slotClicks.current += 1;
    const n = slotClicks.current;
    if (n === NAG_THRESHOLD_1) setDialog({ type: 'nag', msg: NAG_FIXED[0] });
    else if (n === NAG_THRESHOLD_2) setDialog({ type: 'nag', msg: NAG_FIXED[1] });
    else if (n > NAG_THRESHOLD_2 && n % NAG_REPEAT_EVERY === 0)
      setDialog({ type: 'nag', msg: NAG_RANDOM[Math.floor(Math.random() * NAG_RANDOM.length)] });
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
  const tasks: Task[] = activeApp
    ? [{ id: activeApp.id, icon: activeApp.icon, title: activeApp.titleKo }]
    : [];

  // 비전체화면 앱 프레임 클래스 — fullscreen 분기 제거, 비전체화면 전용
  const frameClass = [
    styles.appFrame,
    activeApp?.wide ? styles.appFrameWide : styles.appFrameNarrow,
  ].join(' ');

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

      <PopupAd onClaim={() => openApp('stones')} />

      {activeApp &&
        (activeApp.fullscreen ? (
          // 전체화면 앱 — Window 없이 컴포넌트 직접 마운트
          <div className={styles.appFullscreen}>
            <ErrorBoundary appName={activeApp.titleKo}>
              <activeApp.component onExit={closeApp} />
            </ErrorBoundary>
          </div>
        ) : (
          // 일반 앱 — Window 크롬 포함
          <div className={frameClass}>
            <Window
              icon={activeApp.icon}
              title={activeApp.titleKo}
              active
              onMin={closeApp}
              onMax={() => {}}
              onClose={closeApp}
              style={{ flex: 1, minWidth: 0 }}
            >
              <ErrorBoundary appName={activeApp.titleKo}>
                <activeApp.component onExit={closeApp} />
              </ErrorBoundary>
            </Window>
          </div>
        ))}

      <Taskbar
        tasks={tasks}
        activeId={openAppId}
        onTask={openApp}
        onStart={() => setStartOpen((isOpen) => !isOpen)}
        startOpen={startOpen}
        clock={clock}
        startMenuApps={APPS}
        onStartItem={onStartItem}
      />

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
