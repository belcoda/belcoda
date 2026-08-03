import { describe, expect, it } from 'vitest';

import {
	defaultMemberSettings,
	parseMemberSettings,
	updatePeopleSidebarSettingsZeroMutatorSchema
} from './settings';
import { parse } from 'valibot';

describe('member settings', () => {
	it('prioritizes people favourites by default', () => {
		expect(defaultMemberSettings().sidebar.prioritizePeopleFavourites).toBe(true);
	});

	it('adds the default sidebar setting to existing member settings', () => {
		expect(
			parseMemberSettings({
				notifications: { digestEnabled: false, digestFrequency: 'daily' }
			})
		).toEqual({
			notifications: { digestEnabled: false, digestFrequency: 'daily' },
			sidebar: { prioritizePeopleFavourites: true }
		});
	});

	it('accepts an explicit people sidebar preference', () => {
		const settings = parseMemberSettings({
			sidebar: { prioritizePeopleFavourites: false }
		});

		expect(settings?.sidebar.prioritizePeopleFavourites).toBe(false);
	});

	it('validates the people sidebar settings mutator input', () => {
		expect(
			parse(updatePeopleSidebarSettingsZeroMutatorSchema, {
				metadata: { organizationId: '11111111-1111-4111-8111-111111111111' },
				input: { prioritizePeopleFavourites: false }
			})
		).toEqual({
			metadata: { organizationId: '11111111-1111-4111-8111-111111111111' },
			input: { prioritizePeopleFavourites: false }
		});
	});
});
