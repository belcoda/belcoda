import { expect, type Locator, type Page } from '@playwright/test';

export async function scrollSidebarSentinelIntoView(
	page: Page,
	sentinelTestId: string,
	scrollContainerTestId?: string
): Promise<void> {
	if (scrollContainerTestId) {
		await page
			.getByTestId(scrollContainerTestId)
			.evaluate((element) => {
				element.scrollTop = element.scrollHeight;
			})
			.catch(() => {});
	}
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
	timeout = 30_000,
	scrollContainerTestId?: string
): Promise<void> {
	await expect(async () => {
		await scrollSidebarSentinelIntoView(page, sentinelTestId, scrollContainerTestId);
		await expect(items).toHaveCount(targetCount);
	}).toPass({ timeout });
}
