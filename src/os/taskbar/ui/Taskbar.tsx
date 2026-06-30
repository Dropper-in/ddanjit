import { iconUrl } from '@/shared/icons';
import { cx } from '@/shared/lib/ui';
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
          <div key={app.id} className={styles.row} onClick={() => onItem(app.id)}>
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
        <div className={styles.row} onClick={() => onItem('spectrum')}>
          <span style={{ fontSize: 24, lineHeight: '24px', width: 24, textAlign: 'center' }}>
            🎨
          </span>
          <div className={styles.meta}>
            <b>테마 바꾸기</b>
            <span className={styles.sub}>spectrum...</span>
          </div>
        </div>
        <div className={styles.row} onClick={() => onItem('about')}>
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
        <div className={styles.row} onClick={() => onItem('shutdown')}>
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
        <div className={styles.attribution}>
          Icons by{' '}
          <a href="https://icons8.com" target="_blank" rel="noopener noreferrer">
            Icons8
          </a>
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
        className={cx(styles.start, startOpen ? styles.open : undefined)}
        onMouseDown={(e) => {
          e.preventDefault();
          onStart();
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
          className={cx(styles.task, activeId === task.id ? styles.active : undefined)}
          onClick={() => onTask(task.id)}
          title={task.title}
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
