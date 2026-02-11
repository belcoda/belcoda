import { t } from '$lib/index.svelte';
export const preferencesItems: {
	title: () => string;
	url: string;
	keywords: string[];
	permissions: 'admin' | 'owner' | 'member';
}[] = [
	{
		title: () => t`Language`,
		url: '/preferences/language',
		keywords: ['language', 'preferences', 'config'],
		permissions: 'member'
	},
	{
		title: () => t`Themes & colors`,
		url: '/settings/organization/themes',
		keywords: ['themes', 'colors', 'icon', 'logo', 'branding'],
		permissions: 'admin'
	},
	{
		title: () => t`Tags`,
		url: '/settings/people/tags',
		keywords: ['tags', 'people', 'tag', 'tagging'],
		permissions: 'admin'
	},
	{
		title: () => t`Teams`,
		url: '/settings/people/teams',
		keywords: ['teams', 'people', 'team'],
		permissions: 'admin'
	},
	{
		title: () => t`Imports`,
		url: '/settings/people/imports',
		keywords: ['imports', 'people', 'import', 'csv'],
		permissions: 'admin'
	},
	{
		title: () => t`Exports`,
		url: '/settings/people/exports',
		keywords: ['exports', 'people', 'export', 'csv'],
		permissions: 'admin'
	},
	{
		title: () => t`Subscription`,
		url: '/settings/billing/subscription',
		keywords: ['subscription', 'billing', 'payments'],
		permissions: 'owner'
	},
	{
		title: () => t`Credit balance`,
		url: '/settings/billing/credit',
		keywords: ['credit', 'balance', 'billing', 'payments', 'recharge'],
		permissions: 'owner'
	},
	{
		title: () => t`Webhooks`,
		url: '/settings/webhooks',
		keywords: ['webhooks', 'hooks', 'api', 'events'],
		permissions: 'owner'
	},
	{
		title: () => t`API keys`,
		url: '/settings/api-keys',
		keywords: ['api', 'api-key', 'api-keys'],
		permissions: 'owner'
	},
	{
		title: () => t`WhatsApp templates`,
		url: '/settings/whatsapp/templates',
		keywords: ['whatsapp', 'templates'],
		permissions: 'admin'
	},
	{
		title: () => t`WhatsApp accounts`,
		url: '/settings/whatsapp/accounts',
		keywords: ['whatsapp', 'accounts', 'onboarding', 'meta', 'embedded', 'wa'],
		permissions: 'admin'
	}
];
