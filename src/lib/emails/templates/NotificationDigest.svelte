<script lang="ts" module>
	import type { DigestSection } from '$lib/server/utils/email/digest_context';

	export type Props = {
		previewText: string;
		language?: string;
		appUrl: string;
		logoUrl?: string;
		logoAlt: string;
		eyebrow: string;
		heading: string;
		organizationName: string;
		weekOf: string;
		sections: DigestSection[];
		allNotificationsUrl: string;
		ctaText: string;
		viewText: string;
		unsubscribeText: string;
		unsubscribeLinkText: string;
		copyright?: string;
	};
</script>

<script lang="ts">
	import TransactionalBase from '../layouts/TransactionalBase.svelte';
	import {
		Heading,
		Text,
		Button,
		Hr,
		Row,
		Column,
		Section,
		Link
	} from '@better-svelte-email/components';

	// Postmark expands this token into the recipient's unsubscribe link when the
	// message is sent on a broadcast stream. Used as an anchor href so the link
	// carries our own copy; the token reaches Postmark untouched by HTML escaping.
	const POSTMARK_UNSUBSCRIBE_TOKEN = '{{{pm:unsubscribe}}}';

	// The defaults below are anonymized sample data so the `email:dev` preview
	// server renders a representative digest. Production values come from the props
	// assembled in `send_notification_digest.ts`.
	let {
		previewText = '13 notifications from Rivertown Community Network',
		language = 'en',
		appUrl = 'https://example.com',
		logoUrl = 'https://belcoda-public-prod.t3.tigrisfiles.io/design/logo-belcoda-glass.png',
		logoAlt = 'Belcoda logo',
		eyebrow = 'Notification digest',
		heading = '13 notifications',
		organizationName = 'Rivertown Community Network',
		weekOf = 'Aug 27 – Sep 2, 2026',
		sections = [
			{
				label: 'WhatsApp messages',
				count: 5,
				items: [
					{
						title: 'Jordan Rivera',
						detail: '4 new messages',
						url: 'https://example.com/community/1'
					},
					{ title: 'Sam Okafor', detail: '6 new messages', url: 'https://example.com/community/2' },
					{ title: 'Priya Nair', detail: '1 new message', url: 'https://example.com/community/3' },
					{
						title: 'Mateo Bianchi',
						detail: '2 new messages',
						url: 'https://example.com/community/4'
					},
					{
						title: 'Amara Diallo',
						detail: '3 new messages',
						url: 'https://example.com/community/5'
					}
				]
			},
			{
				label: 'Event signups',
				count: 1,
				items: [
					{
						title: 'Neighbourhood canvassing day',
						detail: 'Alex Chen, Maria Santos, and 4 others signed up',
						url: 'https://example.com/events/12'
					}
				]
			},
			{
				label: 'Petition signatures',
				count: 1,
				items: [
					{
						title: 'Save the community garden',
						detail: 'Lena Fischer and Tomás Duarte signed',
						url: 'https://example.com/petitions/7'
					}
				]
			},
			{
				label: 'Note mentions',
				count: 1,
				items: [
					{
						title: 'Priya Nair',
						detail: 'Dana Weber mentioned you in a note: Can you follow up before Friday?',
						url: 'https://example.com/community/3'
					}
				]
			}
		],
		allNotificationsUrl = 'https://example.com/dashboard',
		ctaText = 'View all notifications',
		viewText = 'View',
		unsubscribeText = "You're receiving this because you have unread notifications in Belcoda.",
		unsubscribeLinkText = 'Unsubscribe',
		copyright = `Copyright ${new Date().getFullYear()} Belcoda`
	}: Props = $props();
</script>

<TransactionalBase {previewText} {language} instanceUrl={appUrl} {logoUrl} {logoAlt} {copyright}>
	<Text class="m-0 text-xs font-light tracking-widest text-slate-400 uppercase">
		{eyebrow}
	</Text>
	<Heading as="h1" class="my-2 text-3xl leading-tight font-extrabold text-slate-900 sm:text-4xl">
		{heading}
	</Heading>
	<Text class="m-0 mt-1 text-sm text-slate-500">
		{organizationName} · {weekOf}
	</Text>

	<Hr class="mt-6 mb-2 border-slate-200" />

	{#each sections as section (section.label)}
		<Text class="mt-5 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
			{section.label}
		</Text>
		<Section>
			{#each section.items as item (item.url)}
				<Row>
					<Column class="w-full border-b border-slate-100 py-3 align-top">
						<Text class="m-0 text-sm leading-snug font-semibold text-slate-900">
							{item.title}
						</Text>
						{#if item.detail}
							<Text class="m-0 mt-1 text-[13px] leading-snug text-slate-500">
								{item.detail}
							</Text>
						{/if}
					</Column>
					<Column
						class="border-b border-slate-100 py-3 pl-4 text-right align-middle whitespace-nowrap"
					>
						<Button
							href={item.url}
							pX={10}
							pY={4}
							class="rounded border border-slate-200 text-xs text-slate-600"
						>
							{viewText} →
						</Button>
					</Column>
				</Row>
			{/each}
		</Section>
	{/each}

	<Button
		href={allNotificationsUrl}
		pX={24}
		pY={16}
		class="mt-8 block rounded bg-slate-950 text-center text-base font-extrabold text-white hover:bg-slate-800"
	>
		{ctaText}
	</Button>

	<Hr class="my-6 border-slate-300" />
	<Text class="m-0 text-xs leading-5 text-slate-600">
		{unsubscribeText}
		<Link href={POSTMARK_UNSUBSCRIBE_TOKEN} class="text-slate-600 underline">
			{unsubscribeLinkText}
		</Link>
	</Text>
</TransactionalBase>
