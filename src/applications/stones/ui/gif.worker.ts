import { GIFEncoder, quantize, applyPalette } from 'gifenc';

interface WorkerInput {
  frames: { data: Uint8ClampedArray; width: number; height: number }[];
  delay: number;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { frames, delay } = e.data;
  const gif = GIFEncoder();

  // Sample evenly across all frames for a representative palette
  const SAMPLE_COUNT = Math.min(8, frames.length);
  const step = Math.max(1, Math.floor(frames.length / SAMPLE_COUNT));
  const frameDataLen = frames[0].data.length;
  const sampleData = new Uint8ClampedArray(frameDataLen * SAMPLE_COUNT);
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const f = frames[Math.min(i * step, frames.length - 1)];
    sampleData.set(f.data, i * frameDataLen);
  }
  const palette = quantize(sampleData, 256);
  for (let i = 0; i < frames.length; i++) {
    const index = applyPalette(frames[i].data, palette);
    gif.writeFrame(index, frames[i].width, frames[i].height, { palette, delay });
    self.postMessage({ type: 'progress', percent: Math.round(((i + 1) / frames.length) * 100) });
  }
  gif.finish();
  const bytes = gif.bytes();
  (self as unknown as Worker).postMessage({ type: 'done', buffer: bytes.buffer }, [
    bytes.buffer as ArrayBuffer,
  ]);
};
