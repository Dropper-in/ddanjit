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
