import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MutatorResultDetails } from '@rocicorp/zero';

const { trackAnalyticsEvent } = vi.hoisted(() => ({
	trackAnalyticsEvent: vi.fn()
}));

vi.mock('$lib/utils/analytics', () => ({ trackAnalyticsEvent }));

import { teamAnalyticsEventNames, trackTeamCreatedWhenConfirmed } from './analytics';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
}

describe('trackTeamCreatedWhenConfirmed', () => {
	beforeEach(() => {
		trackAnalyticsEvent.mockClear();
	});

	it('tracks a confirmed team creation', async () => {
		await trackTeamCreatedWhenConfirmed(Promise.resolve({ type: 'success' }));

		expect(trackAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(teamAnalyticsEventNames.created);
	});

	it('does not track a rejected team creation', async () => {
		const result: MutatorResultDetails = {
			type: 'error',
			error: { type: 'zero', message: 'Unable to create team' }
		};

		await trackTeamCreatedWhenConfirmed(Promise.resolve(result));

		expect(trackAnalyticsEvent).not.toHaveBeenCalled();
	});

	it('does not track while server confirmation is pending', async () => {
		const confirmation = deferred<MutatorResultDetails>();
		const tracking = trackTeamCreatedWhenConfirmed(confirmation.promise);

		await Promise.resolve();
		expect(trackAnalyticsEvent).not.toHaveBeenCalled();

		confirmation.resolve({ type: 'success' });
		await tracking;
		expect(trackAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(teamAnalyticsEventNames.created);
	});

	it('does not surface a failed confirmation request', async () => {
		await expect(
			trackTeamCreatedWhenConfirmed(Promise.reject(new Error('Connection failed')))
		).resolves.toBeUndefined();
		expect(trackAnalyticsEvent).not.toHaveBeenCalled();
	});
});
