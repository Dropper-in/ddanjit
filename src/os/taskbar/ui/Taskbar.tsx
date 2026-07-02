import type React from 'react';
import { iconUrl } from '@/shared/icons';
import { cx } from '@/shared/lib/ui';
import styles from './Taskbar.module.scss';
import type { AppDef } from '@/shared/types';

export interface Task {
  id: string;
  icon: string;
  title: string;
}

// div 기반 클릭 항목을 키보드로도 실행 가능하게 — role/tabIndex + Enter/Space
function activatable(run: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: run,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        run();
      }
    },
  };
}

export interface StartMenuProps {
  apps: AppDef[];
  onItem: (id: string) => void;
}

export function StartMenu({ apps, onItem }: StartMenuProps) {
  return (
    // data-startmenu — OsShell closest() 감지용
    <div data-startmenu="" className={styles.startmenu} onMouseDown={(e) => e.stopPropagation()}>
      <div className={styles.strip}>
        <span>
          딴짓<b>★</b>OS
        </span>
      </div>
      <div className={styles.items}>
        <div className={styles.sectionLabel}>앱 / Apps</div>
        {apps.map((app) => (
          <div key={app.id} className={styles.row} {...activatable(() => onItem(app.id))}>
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
        <div className={styles.row} {...activatable(() => onItem('spectrum'))}>
          <span style={{ fontSize: 24, lineHeight: '24px', width: 24, textAlign: 'center' }}>
            🎨
          </span>
          <div className={styles.meta}>
            <b>테마 바꾸기</b>
            <span className={styles.sub}>spectrum...</span>
          </div>
        </div>
        <div className={styles.row} {...activatable(() => onItem('about'))}>
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
        <div className={styles.row} {...activatable(() => onItem('shutdown'))}>
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

export interface TaskbarProps {
  tasks: Task[];
  activeId: string | null;
  onTask: (id: string) => void;
  onStart: () => void;
  startOpen: boolean;
  clock: string;
  startMenuApps?: AppDef[];
  onStartItem?: (id: string) => void;
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
}: TaskbarProps) {
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
          onStart();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onStart();
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
          {...activatable(() => onTask(task.id))}
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

      <div className={styles.tray}>{clock}</div>

      {startOpen && startMenuApps && onStartItem && (
        <StartMenu apps={startMenuApps} onItem={onStartItem} />
      )}
    </div>
  );
}
