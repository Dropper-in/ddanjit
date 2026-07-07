import { test, expect } from '@playwright/test';

const STONE_LABEL = /돌을던져보세요/;

test('데스크톱이 시작 버튼과 돌 앱 아이콘을 렌더한다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('시작')).toBeVisible();
  await expect(page.getByText(STONE_LABEL).first()).toBeVisible();
});

test('돌 아이콘 더블클릭 시 앱 창이 열린다', async ({ page }) => {
  await page.goto('/');
  await page.getByText(STONE_LABEL).first().dblclick();

  // 앱 내부 UI가 떠야 함 (초기화 + 던지기 버튼)
  await expect(page.getByRole('button', { name: '초기화' })).toBeVisible();
  await expect(page.getByRole('button', { name: /던지기/ })).toBeVisible();
});

test('창의 닫기 버튼을 누르면 앱이 닫힌다', async ({ page }) => {
  await page.goto('/');
  await page.getByText(STONE_LABEL).first().dblclick();
  await expect(page.getByRole('button', { name: '초기화' })).toBeVisible();

  await page.getByRole('button', { name: 'close' }).click();
  await expect(page.getByRole('button', { name: '초기화' })).toHaveCount(0);
});

test('제물 업로드 전에는 던지기·녹화가 비활성화된다', async ({ page }) => {
  await page.goto('/');
  await page.getByText(STONE_LABEL).first().dblclick();

  await expect(page.locator('.st-placeholder')).toBeVisible();
  await expect(page.getByRole('button', { name: /던지기/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /녹화/ })).toBeDisabled();
});

test('제물 업로드 후 던지기가 동작하고 카운트가 오른다', async ({ page }) => {
  await page.goto('/');
  await page.getByText(STONE_LABEL).first().dblclick();

  await page
    .locator('label.st-stage input[type=file]')
    .setInputFiles('public/icons/brand/character-placeholder.png');

  // 업로드 완료: placeholder → 캐릭터, 버튼 활성화
  await expect(page.locator('.st-character')).toBeVisible();
  await expect(page.locator('.st-placeholder')).toHaveCount(0);
  const throwBtn = page.getByRole('button', { name: /던지기/ });
  await expect(throwBtn).toBeEnabled();

  await throwBtn.click();
  await expect(page.getByText('1회 던짐')).toBeVisible();
});

test('10MB 초과 파일은 오류 다이얼로그를 띄운다', async ({ page }) => {
  await page.goto('/');
  await page.getByText(STONE_LABEL).first().dblclick();

  await page.locator('label.st-stage input[type=file]').setInputFiles({
    name: 'huge.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(11 * 1024 * 1024),
  });

  const dialog = page.getByRole('dialog', { name: '업로드 실패' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/너무 큽니다/)).toBeVisible();

  await dialog.getByRole('button', { name: '확인' }).click();
  await expect(dialog).toHaveCount(0);
  // 초과 파일은 반영 안 됨 — 여전히 빈 placeholder
  await expect(page.locator('.st-placeholder')).toBeVisible();
});
