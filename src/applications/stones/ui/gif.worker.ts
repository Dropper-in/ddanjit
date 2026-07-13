import { GIFEncoder, quantize, applyPalette } from 'gifenc';

type WorkerIn =
  | { type: 'frame'; data: Uint8ClampedArray; width: number; height: number; delay: number }
  | { type: 'finish' };

// 4px 간격 서브샘플 — 팔레트 품질 손실 거의 없이 프레임당 quantize 비용 1/4
function paletteSource(data: Uint8ClampedArray): Uint8ClampedArray {
  const stride = 4;
  const out = new Uint8ClampedArray(Math.ceil(data.length / 4 / stride) * 4);
  for (let i = 0, j = 0; i < data.length; i += 4 * stride, j += 4) {
    out[j] = data[i];
    out[j + 1] = data[i + 1];
    out[j + 2] = data[i + 2];
    out[j + 3] = data[i + 3];
  }
  return out;
}

// Bayer 4x4 오더드 디더링 — 256색 매핑 전에 문턱 노이즈를 더해 그라데이션 밴딩을 패턴으로 분산.
// 진폭은 rgb565 양자화 스텝(R/B 8) 근처가 적정 — 크면 자글거리고 작으면 밴딩 잔존.
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const DITHER_AMP = 8;

function ditherInPlace(data: Uint8ClampedArray, width: number) {
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const offset = (BAYER4[(p / width) & 3][(p % width) & 3] / 16 - 0.5) * DITHER_AMP;
    // Uint8ClampedArray라 0~255 자동 클램프
    data[i] += offset;
    data[i + 1] += offset;
    data[i + 2] += offset;
  }
}

// 스트리밍 인코딩: 프레임 도착 즉시 양자화·기록 — 인코딩 시간이 녹화 시간에 숨고
// 프레임 원본을 쌓지 않아 워커 메모리도 압축 출력 버퍼 크기로 유지됨
let gif: ReturnType<typeof GIFEncoder> | null = null;
let processed = 0;

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  const msg = e.data;
  if (msg.type === 'frame') {
    if (!gif) gif = GIFEncoder();
    // 프레임별 로컬 팔레트 — 전 프레임 공유 256색 대비 실효 색 수 증가 (GIF는 프레임당 256색 한계)
    // 팔레트는 디더링 전 원본에서 뽑고, 인덱스 매핑만 디더링본으로 (팔레트 오염 방지)
    const palette = quantize(paletteSource(msg.data), 256);
    ditherInPlace(msg.data, msg.width);
    const index = applyPalette(msg.data, palette);
    gif.writeFrame(index, msg.width, msg.height, { palette, delay: msg.delay });
    processed += 1;
    // 진행률 재료 — main이 전송 프레임 수와 대조해 % 산출 (중지 후 잔여 큐 소화율)
    self.postMessage({ type: 'progress', processed });
    return;
  }

  // msg.type === 'finish' — 큐에 남은 frame 메시지가 모두 처리된 뒤 도착함이 보장됨
  if (!gif) return; // 프레임 0개는 main에서 차단되지만 방어
  gif.finish();
  const bytes = gif.bytes();
  (self as unknown as Worker).postMessage({ type: 'done', buffer: bytes.buffer }, [
    bytes.buffer as ArrayBuffer,
  ]);
  gif = null;
  processed = 0;
};
