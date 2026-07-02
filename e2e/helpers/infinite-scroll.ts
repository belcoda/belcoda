import { expect, type Locator, type Page } from '@playwright/test';

export async function scrollSidebarSentinelIntoView(
	page: Page,
	sentinelTestId: string
): Promise<void> {
	await page
		.getByTestId(sentinelTestId)
		.scrollIntoViewIfNeeded()
		.catch(() => {});
}

export async function expectSidebarItemCountToReach(
	items: Locator,
	targetCount: number,
	page: Page,
	sentinelTestId: string,
	timeout = 30_000
): Promise<void> {
	await expect(async () => {
		await scrollSidebarSentinelIntoView(page, sentinelTestId);
		await expect(items).toHaveCount(targetCount);
	}).toPass({ timeout });
}
