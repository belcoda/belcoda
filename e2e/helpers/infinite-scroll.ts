import { expect, type Locator, type Page } from '@playwright/test';

export async function scrollSidebarForMoreItems(
	page: Page,
	scrollTestIds: string[]
): Promise<void> {
	for (const testId of scrollTestIds) {
		await page
			.getByTestId(testId)
			.evaluate((element) => {
				element.scrollTop = element.scrollHeight;
			})
			.catch(() => {});
	}
}

export async function expectSidebarItemCountToReach(
	items: Locator,
	targetCount: number,
	page: Page,
	scrollTestIds: string[],
	timeout = 30_000
): Promise<void> {
	await expect(async () => {
		await scrollSidebarForMoreItems(page, scrollTestIds);
		await expect(items).toHaveCount(targetCount);
	}).toPass({ timeout });
}
