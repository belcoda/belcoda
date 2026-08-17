<script lang="ts">
	import TransactionalBase from '../layouts/TransactionalBase.svelte';
	import { Heading, Text, Button, Hr } from '@better-svelte-email/components';
	type Props = {
		previewText: string;
		language?: string;
		instanceUrl: string;
		logoUrl: string;
		logoAlt: string;
		logoWidth?: string;
		logoHeight?: string;
		title: string;
		body: string;
		buttonUrl: string;
		buttonText: string;
		instanceName: string;
		/** Trusted HTML containing the plain-link fallback shown below the button. */
		buttonAltHtml?: string | null;
		copyright?: string;
	};

	let {
		previewText = 'This is email preview text',
		language = 'en',
		instanceUrl = 'https://example.com',
		logoUrl = 'https://belcoda-public-prod.t3.tigrisfiles.io/design/logo-belcoda-glass.png',
		logoAlt = 'Example Logo',
		title = 'Example Title',
		body = 'This is email body text',
		buttonUrl = 'https://example.com',
		buttonText = 'Example Button Text',
		instanceName = 'Example Instance Name',
		buttonAltHtml = 'If the button does not work, copy and paste the following link into your browser: [buttonUrl]',
		copyright = `${new Date().getFullYear()} Belcoda. All rights reserved.`
	}: Props = $props();
</script>

<TransactionalBase {previewText} {language} {instanceUrl} {logoUrl} {logoAlt} {copyright}>
	{#snippet children()}
		<Heading
			as="h1"
			class="mb-6 mt-8 text-3xl leading-tight font-extrabold text-slate-900 sm:text-4xl"
		>
			{title}
		</Heading>

		<Text class="mt-0 mb-7 text-lg leading-7 text-slate-600">
			{body}
		</Text>

		<Button
			href={buttonUrl}
			pX={24}
			pY={16}
			class="rounded bg-primary text-base font-extrabold text-white hover:bg-primary/80"
		>
			{buttonText}
		</Button>
		<Text class="mt-6 mb-4 text-lg leading-7 text-slate-600">
			<strong>- {instanceName}</strong>
		</Text>

		{#if buttonAltHtml}
			<Hr class="my-6 border-slate-300" />
			<Text class="m-0 break-all text-xs leading-5 text-slate-600">
				{@html buttonAltHtml}
			</Text>
		{/if}
	{/snippet}
</TransactionalBase>
