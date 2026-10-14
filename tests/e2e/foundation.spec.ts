import { expect, test } from '@playwright/test';
test('foundation loads through the same-origin API and database', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'Good work starts with the right space.',
    }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Connected and ready');
  const response = await page.request.get('/api/v1/health/ready');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: 'ok' });
  await page.getByRole('link', { name: 'Explore SeatWise' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#project-status$/);
});
