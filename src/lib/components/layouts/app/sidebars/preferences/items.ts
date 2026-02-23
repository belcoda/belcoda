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
	}
];
