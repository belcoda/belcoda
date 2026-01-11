export const settingsItems: {
	title: string;
	group: string;
	url: string;
	keywords: string[];
	permissions: 'admin' | 'owner' | 'member';
}[] = [
	{
		title: 'Configuration',
		group: 'Organization',
		url: '/settings/organization/settings',
		keywords: ['organization', 'settings', 'preferences', 'config'],
		permissions: 'admin'
	},
	{
		title: 'Themes & colors',
		group: 'Organization',
		url: '/settings/organization/themes',
		keywords: ['themes', 'colors', 'icon', 'logo', 'branding'],
		permissions: 'admin'
	},
	{
		title: 'Email from signatures',
		group: 'Email',
		url: '/settings/email/send_signatures',
		keywords: ['email', 'from', 'address', 'send', 'signature'],
		permissions: 'admin'
	},
	{
		title: 'Tags',
		group: 'Community',
		url: '/settings/tags',
		keywords: ['tags', 'people', 'tag', 'tagging'],
		permissions: 'admin'
	},
	{
		title: 'Teams',
		group: 'Community',
		url: '/settings/people/teams',
		keywords: ['teams', 'people', 'team'],
		permissions: 'admin'
	},
	{
		title: 'Imports',
		group: 'Community',
		url: '/settings/people/imports',
		keywords: ['imports', 'people', 'import', 'csv'],
		permissions: 'admin'
	},
	{
		title: 'Exports',
		group: 'Community',
		url: '/settings/people/exports',
		keywords: ['exports', 'people', 'export', 'csv'],
		permissions: 'admin'
	},
	{
		title: 'Subscription',
		group: 'Billing',
		url: '/settings/billing/subscription',
		keywords: ['subscription', 'billing', 'payments'],
		permissions: 'owner'
	},
	{
		title: 'Credit balance',
		group: 'Billing',
		url: '/settings/billing/credit',
		keywords: ['credit', 'balance', 'billing', 'payments', 'recharge'],
		permissions: 'owner'
	},
	{
		title: 'Webhooks',
		group: 'Developer',
		url: '/settings/webhooks',
		keywords: ['webhooks', 'hooks', 'api', 'events'],
		permissions: 'owner'
	},
	{
		title: 'API keys',
		group: 'Developer',
		url: '/settings/api-keys',
		keywords: ['api', 'api-key', 'api-keys'],
		permissions: 'owner'
	},
	{
		title: 'WhatsApp templates',
		group: 'WhatsApp',
		url: '/settings/whatsapp/templates',
		keywords: ['whatsapp', 'templates'],
		permissions: 'admin'
	},
	{
		title: 'WhatsApp accounts',
		group: 'WhatsApp',
		url: '/settings/whatsapp/accounts',
		keywords: ['whatsapp', 'accounts', 'onboarding', 'meta', 'embedded', 'wa'],
		permissions: 'admin'
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
		const groupKey = String(item[key]);

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
