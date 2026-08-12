export const ALPHA_HIT_THRESHOLD = 10;

export function isOpaquePixel(imageData: ImageData, x: number, y: number): boolean {
  const pixelX = Math.floor(x);
  const pixelY = Math.floor(y);

  if (pixelX < 0 || pixelX >= imageData.width || pixelY < 0 || pixelY >= imageData.height) {
    return false;
  }

  return imageData.data[(pixelY * imageData.width + pixelX) * 4 + 3] > ALPHA_HIT_THRESHOLD;
}
