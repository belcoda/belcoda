import { t } from '$lib/index.svelte';

export type SettingsScope = 'account' | 'workspace';

export const settingsItems: {
	title: () => string;
	scope: SettingsScope;
	group: () => string;
	url: string;
	keywords: string[];
	permissions: 'admin' | 'owner' | 'member';
	dataTestId?: string;
}[] = [
	{
		title: () => t`Language`,
		scope: 'account',
		group: () => t`Account`,
		url: '/settings/language',
		keywords: ['language', 'preferences', 'config'],
		permissions: 'member',
		dataTestId: 'settings-sidebar-language'
	},
	{
		title: () => t`Notifications`,
		scope: 'account',
		group: () => t`Account`,
		url: '/settings/notifications',
		keywords: ['notifications', 'digest', 'email', 'preferences'],
		permissions: 'member',
		dataTestId: 'settings-sidebar-notifications'
	},
	{
		title: () => t`Configuration`,
		scope: 'workspace',
		group: () => t`Organization`,
		url: '/settings/organization/configuration',
		keywords: ['organization', 'settings', 'preferences', 'config'],
		permissions: 'admin',
		dataTestId: 'settings-sidebar-configuration'
	},
	{
		title: () => t`Themes & colors`,
		scope: 'workspace',
		group: () => t`Organization`,
		url: '/settings/organization/themes',
		keywords: ['themes', 'colors', 'icon', 'logo', 'branding'],
		permissions: 'admin',
		dataTestId: 'settings-sidebar-themes'
	},
	{
		title: () => t`Users`,
		scope: 'workspace',
		group: () => t`Organization`,
		url: '/settings/users',
		keywords: ['users', 'members', 'invite', 'roles', 'permissions'],
		permissions: 'admin'
	},
	{
		title: () => t`Email from signatures`,
		scope: 'workspace',
		group: () => t`Email`,
		url: '/settings/email/send_signatures',
		keywords: ['email', 'from', 'address', 'send', 'signature'],
		permissions: 'admin'
	},
	{
		title: () => t`Tags`,
		scope: 'workspace',
		group: () => t`Community`,
		url: '/settings/tags',
		keywords: ['tags', 'people', 'tag', 'tagging'],
		permissions: 'admin',
		dataTestId: 'settings-sidebar-tags'
	},
	{
		title: () => t`Teams`,
		scope: 'workspace',
		group: () => t`Community`,
		url: '/settings/teams',
		keywords: ['teams', 'people', 'team'],
		permissions: 'admin',
		dataTestId: 'settings-sidebar-teams'
	},
	{
		title: () => t`Imports`,
		scope: 'workspace',
		group: () => t`Community`,
		url: '/settings/people/imports',
		keywords: ['imports', 'people', 'import', 'csv'],
		permissions: 'admin',
		dataTestId: 'settings-sidebar-imports'
	},
	{
		title: () => t`Exports`,
		scope: 'workspace',
		group: () => t`Community`,
		url: '/settings/people/exports',
		keywords: ['exports', 'people', 'export', 'csv'],
		permissions: 'admin',
		dataTestId: 'settings-sidebar-exports'
	},
	{
		title: () => t`Subscription`,
		scope: 'workspace',
		group: () => t`Billing`,
		url: '/settings/billing/subscription',
		keywords: ['subscription', 'billing', 'payments'],
		permissions: 'owner'
	},
	{
		title: () => t`Account balance`,
		scope: 'workspace',
		group: () => t`Billing`,
		url: '/settings/billing/credit',
		keywords: ['balance', 'billing', 'payments', 'recharge', 'funds', 'usd'],
		permissions: 'owner'
	},
	{
		title: () => t`Webhooks`,
		scope: 'workspace',
		group: () => t`Developer`,
		url: '/settings/webhooks',
		keywords: ['webhooks', 'hooks', 'api', 'events'],
		permissions: 'owner'
	},
	{
		title: () => t`API keys`,
		scope: 'workspace',
		group: () => t`Developer`,
		url: '/settings/api-keys',
		keywords: ['api', 'api-key', 'api-keys'],
		permissions: 'owner'
	},
	{
		title: () => t`WhatsApp templates`,
		scope: 'workspace',
		group: () => t`WhatsApp`,
		url: '/settings/whatsapp/templates',
		keywords: ['whatsapp', 'templates'],
		permissions: 'admin'
	},
	{
		title: () => t`WhatsApp accounts`,
		scope: 'workspace',
		group: () => t`WhatsApp`,
		url: '/settings/whatsapp/accounts',
		keywords: ['whatsapp', 'accounts', 'onboarding', 'meta', 'embedded', 'wa'],
		permissions: 'admin',
		dataTestId: 'settings-sidebar-whatsapp-accounts'
	}
];

interface GroupedItem<T> {
	group: string;
	items: T[];
}

export function groupBy<T extends Record<string, any>>(array: T[], key: keyof T): GroupedItem<T>[] {
	// 1. Use Array.reduce() to create an intermediate grouping object.
	// The accumulator is typed as a Record<string, T[]>, meaning keys are strings
	// and values are arrays of the original type T.
	const groupedObject = array.reduce((acc: Record<string, T[]>, item: T) => {
		// We ensure the grouping key value is treated as a string for object keys.
		const groupKey = String(item[key]());

		// If the group doesn't exist, initialize it with an empty array.
		// The nullish coalescing operator (??) along with optional chaining
		// provides a clean way to ensure the array exists, though the classic
		// 'if (!acc[groupKey])' check from JS is often clearer in reduce.
		// For robustness, we stick with the standard initialization check.
		if (!acc[groupKey]) {
			acc[groupKey] = [];
		}

		// Add the current item to the array associated with its group key.
		acc[groupKey].push(item);

		return acc;
	}, {}); // Start with an empty object of the defined type

	// 2. Convert the intermediate Record into the final Array<GroupedItem<T>> structure.
	const finalGroupedArray = Object.entries(groupedObject).map(([groupName, itemsArray]) => ({
		group: groupName,
		items: itemsArray
	}));

	return finalGroupedArray;
}
