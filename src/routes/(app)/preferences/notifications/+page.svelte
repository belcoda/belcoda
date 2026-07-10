<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { t } from '$lib/index.svelte';
	import { toast } from 'svelte-sonner';
	import { deserialize } from '$app/forms';
	import { untrack } from 'svelte';
	import { appState } from '$lib/state.svelte';
	import type { MemberSettingsSchema } from '$lib/schema/member/settings';

	const { data }: { data: { organizationId: string; settings: MemberSettingsSchema } } = $props();

	let digestEnabled = $state(untrack(() => data.settings?.notifications?.digestEnabled ?? true));
	let digestFrequency = $state<'daily' | 'weekly'>(
		untrack(() => data.settings?.notifications?.digestFrequency ?? 'weekly')
	);
	let savedIndicator = $state(false);

	async function save(
		notificationSettings: Partial<{ digestEnabled: boolean; digestFrequency: 'daily' | 'weekly' }>
	) {
		const prevEnabled = digestEnabled;
		const prevFrequency = digestFrequency;

		if ('digestEnabled' in notificationSettings)
			digestEnabled = notificationSettings.digestEnabled!;
		if ('digestFrequency' in notificationSettings)
			digestFrequency = notificationSettings.digestFrequency!;

		const formData = new FormData();
		formData.set('organizationId', appState.organizationId || data.organizationId);
		if ('digestEnabled' in notificationSettings)
			formData.set('digestEnabled', String(notificationSettings.digestEnabled));
		if ('digestFrequency' in notificationSettings)
			formData.set('digestFrequency', notificationSettings.digestFrequency!);

		try {
			const response = await fetch('?/save', { method: 'POST', body: formData });
			const result = deserialize(await response.text());
			if (result.type === 'failure' || result.type === 'error') {
				digestEnabled = prevEnabled;
				digestFrequency = prevFrequency;
				toast.error(t`Failed to save notification preferences`);
			} else {
				savedIndicator = true;
				setTimeout(() => (savedIndicator = false), 2000);
			}
		} catch {
			digestEnabled = prevEnabled;
			digestFrequency = prevFrequency;
			toast.error(t`Failed to save notification preferences`);
		}
	}
</script>

<ContentLayout rootLink="/preferences" {header}>
	<Card.Root>
		<Card.Header class="pb-3">
			<Card.Title class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
				{t`Digest email`}
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-0 p-0">
			<div class="flex items-start justify-between gap-4 px-6 py-4 border-b">
				<div class="flex-1">
					<Label class="text-sm font-medium">{t`Send me a digest email`}</Label>
					<p class="mt-1 text-sm text-muted-foreground">
						{t`Receive a summary of your unread notifications — new signups, petition signatures, and WhatsApp messages.`}
					</p>
				</div>
				<Switch
					checked={digestEnabled}
					onCheckedChange={(v) => {
						save({ digestEnabled: v });
					}}
				/>
			</div>

			{#if digestEnabled}
				<div class="flex items-center justify-between gap-4 px-6 py-4">
					<div>
						<Label class="text-sm font-medium">{t`Digest frequency`}</Label>
					</div>
					<Select.Root
						type="single"
						value={digestFrequency}
						onValueChange={(v) => {
							if (v === 'daily' || v === 'weekly') {
								save({ digestFrequency: v });
							}
						}}
					>
						<Select.Trigger class="w-32">
							{digestFrequency === 'weekly' ? t`Weekly` : t`Daily`}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="weekly">{t`Weekly`}</Select.Item>
							<Select.Item value="daily">{t`Daily`}</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<H2>{t`Notifications`}</H2>
		{#if savedIndicator}
			<span class="text-xs text-muted-foreground">{t`Saved`}</span>
		{/if}
	</div>
{/snippet}
