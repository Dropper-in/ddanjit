// WebAudio 기반 레트로(8bit/칩튠풍) 효과음 유틸 — 오디오 파일 없이 OscillatorNode로 합성.
// AudioContext는 모듈 레벨 lazy 싱글턴 — 모듈 최상위에서 window/AudioContext 접근 금지.

export type SoundName = 'startup' | 'click' | 'error' | 'open';

const MUTED_KEY = 'ddanjit.muted';
const VOLUME_KEY = 'ddanjit.volume';

let audioCtx: AudioContext | null = null;

/** 첫 playSound 호출 시 생성, suspended면 resume — 반드시 클라이언트(사용자 제스처) 컨텍스트에서만 호출 */
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

/** 단일 톤 재생 — attack/decay 짧은 게인 엔벨로프로 클릭 노이즈 방지 */
function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'square',
  peakGain = 0.1,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + startOffset;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** 주파수가 지수적으로 미끄러지는 슬라이드음 — open 용 */
function playSlide(
  ctx: AudioContext,
  fromFreq: number,
  toFreq: number,
  duration: number,
  peakGain = 0.1,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime;

  osc.type = 'square';
  osc.frequency.setValueAtTime(fromFreq, start);
  osc.frequency.exponentialRampToValueAtTime(toFreq, start + duration);

  gain.gain.setValueAtTime(peakGain, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** win98 시작음 오마주 — 상승 아르페지오(도-미-솔-도) ~1초 */
function playStartup(ctx: AudioContext, volume: number): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    playTone(ctx, freq, i * 0.22, 0.3, 'square', 0.12 * volume);
  });
}

/** 음소거·볼륨 반영해 레트로 효과음 재생 — 들리지 않을 상황이면 즉시 return */
export function playSound(name: SoundName): void {
  if (typeof window === 'undefined') return;
  const volume = isMuted() ? 0 : getVolume();
  if (volume <= 0) return;

  const ctx = getAudioContext();

  switch (name) {
    case 'startup':
      playStartup(ctx, volume);
      break;
    case 'click':
      playTone(ctx, 1800, 0, 0.05, 'square', 0.08 * volume);
      break;
    case 'error':
      playTone(ctx, 600, 0, 0.15, 'square', 0.1 * volume);
      playTone(ctx, 400, 0.15, 0.15, 'square', 0.1 * volume);
      break;
    case 'open':
      playSlide(ctx, 200, 800, 0.15, 0.1 * volume);
      break;
    default:
      break;
  }
}

/** 볼륨 설정 — 0~1 클램프 후 localStorage 키 ddanjit.volume에 저장 */
export function setVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VOLUME_KEY, String(Math.min(Math.max(volume, 0), 1)));
}

/** 볼륨 조회 (0~1) — 미설정/SSR이면 1 */
export function getVolume(): number {
  if (typeof window === 'undefined') return 1;
  const raw = window.localStorage.getItem(VOLUME_KEY);
  if (raw === null) return 1;
  const volume = Number(raw);
  return Number.isFinite(volume) ? Math.min(Math.max(volume, 0), 1) : 1;
}

/** 음소거 설정 — localStorage 키 ddanjit.muted, '1'(음소거) 또는 키 제거(해제) */
export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  if (muted) {
    window.localStorage.setItem(MUTED_KEY, '1');
  } else {
    window.localStorage.removeItem(MUTED_KEY);
  }
}

/** 음소거 여부 조회 — SSR 가드: window 없으면 false */
export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MUTED_KEY) === '1';
}
