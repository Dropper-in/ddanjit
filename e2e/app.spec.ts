import { test, expect, type Page } from '@playwright/test';

const STONE_LABEL = /사랑하는아이에게돌을던져보세요/;

async function openStones(page: Page) {
  await page.goto('/');
  await page.getByText(STONE_LABEL).first().dblclick();
  await expect(page.locator('.st-app')).toBeVisible();
}

test('데스크톱에 시작 버튼과 돌 던지기 아이콘을 렌더한다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('시작')).toBeVisible();
  await expect(page.getByText(STONE_LABEL).first()).toBeVisible();
});

test('돌 던지기 아이콘을 열면 제물 올리기 버튼을 렌더한다', async ({ page }) => {
  await openStones(page);
  const offeringButton = page.locator('.st-action-bar .st-throw');
  await expect(offeringButton).toHaveText('제물 올리기');
  const fileChooser = page.waitForEvent('filechooser');
  await offeringButton.click();
  await fileChooser;
});

test('창의 닫기 버튼을 누르면 앱이 닫힌다', async ({ page }) => {
  await openStones(page);
  await page.getByRole('button', { name: 'close' }).click();
  await expect(page.locator('.st-app')).toHaveCount(0);
});

test('제물 업로드 후 클릭한 좌표로 발사한다', async ({ page }) => {
  await openStones(page);

  await page
    .locator('.st-app > input[type=file]')
    .setInputFiles('public/icons/brand/character-placeholder.png');

  await expect(page.locator('.st-character')).toBeVisible();
  await expect(page.locator('.st-action-bar .st-throw')).toHaveText('제물 변경하기');

  const target = page.locator('.st-target');
  const box = await target.boundingBox();
  if (!box) throw new Error('target is not visible');
  await target.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('.st-reaction')).toBeVisible();
});

test('투명한 제물 여백은 발사해도 캐릭터 반응을 재생하지 않는다', async ({ page }) => {
  await openStones(page);

  await page.locator('.st-app > input[type=file]').setInputFiles({
    name: 'ring.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="20" fill="#f00"/></svg>',
    ),
  });

  const target = page.locator('.st-target');
  const box = await target.boundingBox();
  if (!box) throw new Error('target is not visible');
  await target.click({ position: { x: box.width * 0.18, y: box.height * 0.18 } });
  await page.waitForTimeout(600);
  await expect(page.locator('.st-reaction')).toHaveCount(0);
});

test('10MB 초과 파일은 오류 다이얼로그를 연다', async ({ page }) => {
  await openStones(page);

  await page.locator('.st-app > input[type=file]').setInputFiles({
    name: 'huge.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(11 * 1024 * 1024),
  });

  const dialog = page.getByRole('dialog', { name: '업로드 실패' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '확인' }).click();
  await expect(dialog).toHaveCount(0);
});
