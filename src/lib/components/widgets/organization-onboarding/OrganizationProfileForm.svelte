<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	let {
		country = $bindable(''),
		language = $bindable('en'),
		timezone = $bindable('')
	}: {
		country?: string;
		language?: string;
		timezone?: string;
	} = $props();

	const countries = [
		{ value: 'GB', label: t`United Kingdom` },
		{ value: 'US', label: t`United States` },
		{ value: 'KE', label: t`Kenya` },
		{ value: 'ZA', label: t`South Africa` },
		{ value: 'IN', label: t`India` }
	];
	const languages = [
		{ value: 'en', label: t`English` },
		{ value: 'es', label: t`Spanish` },
		{ value: 'pt', label: t`Portuguese` }
	];
	const timezones = [
		{ value: 'Europe/London', label: t`Europe / London (GMT+1)` },
		{ value: 'America/New_York', label: t`America / New York (GMT-4)` },
		{ value: 'Africa/Nairobi', label: t`Africa / Nairobi (GMT+3)` },
		{ value: 'Asia/Kolkata', label: t`Asia / Kolkata (GMT+5:30)` }
	];

	const label = (list: { value: string; label: string }[], value: string, fallback: string) =>
		list.find((o) => o.value === value)?.label ?? fallback;
</script>

<div class="grid gap-4 sm:grid-cols-3">
	<div class="flex flex-col gap-2">
		<Label>{t`Country`}</Label>
		<Select.Root type="single" bind:value={country}>
			<Select.Trigger class="w-full">
				{label(countries, country, t`Select`)}
			</Select.Trigger>
			<Select.Content>
				{#each countries as option (option.value)}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<div class="flex flex-col gap-2">
		<Label>{t`Language`}</Label>
		<Select.Root type="single" bind:value={language}>
			<Select.Trigger class="w-full">
				{label(languages, language, t`Select`)}
			</Select.Trigger>
			<Select.Content>
				{#each languages as option (option.value)}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<div class="flex flex-col gap-2">
		<Label>{t`Time zone`}</Label>
		<Select.Root type="single" bind:value={timezone}>
			<Select.Trigger class="w-full">
				{label(timezones, timezone, t`Select`)}
			</Select.Trigger>
			<Select.Content>
				{#each timezones as option (option.value)}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
</div>
