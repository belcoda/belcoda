<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { appState } from '$lib/state.svelte';
	import { t } from '$lib/index.svelte';
	import { defaultUserSettings } from '$lib/schema/user/settings';
	import type { UserSettingsSchema } from '$lib/schema/user/settings';
	import { toast } from 'svelte-sonner';

	const userQuery = $derived(appState.user);
	const currentSettings = $derived(userQuery.data?.settings ?? defaultUserSettings());

	let digestEnabled = $state(true);
	let digestFrequency = $state<'daily' | 'weekly'>('weekly');
	let savedIndicator = $state(false);

	$effect(() => {
		digestEnabled = currentSettings.notifications?.digestEnabled ?? true;
		digestFrequency = currentSettings.notifications?.digestFrequency ?? 'weekly';
	});

	async function save(patch: Partial<UserSettingsSchema['notifications']>) {
		const previous = {
			digestEnabled,
			digestFrequency
		};
		digestEnabled = patch.digestEnabled ?? digestEnabled;
		digestFrequency = patch.digestFrequency ?? digestFrequency;

		const updated: UserSettingsSchema = {
			notifications: {
				digestEnabled,
				digestFrequency
			}
		};

		try {
			const response = await fetch('/api/me/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updated)
			});
			if (!response.ok) {
				throw new Error(await response.text());
			}
			savedIndicator = true;
			setTimeout(() => (savedIndicator = false), 2000);
		} catch {
			digestEnabled = previous.digestEnabled;
			digestFrequency = previous.digestFrequency;
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
