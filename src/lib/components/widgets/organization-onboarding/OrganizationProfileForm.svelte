<script lang="ts">
	import { t } from '$lib/index.svelte';
	import CountrySelect from '$lib/components/ui/custom-select/country/country.svelte';
	import LanguageSelect from '$lib/components/ui/custom-select/language/language.svelte';
	import TimezoneSelect from '$lib/components/ui/custom-select/timezone/timezone.svelte';

	let {
		country = $bindable(''),
		language = $bindable(''),
		timezone = $bindable('')
	}: {
		country?: string;
		language?: string;
		timezone?: string;
	} = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<fieldset class="min-w-0">
		<legend class="mb-2 text-sm font-medium">{t`Country`}</legend>
		<CountrySelect bind:value={country} />
	</fieldset>
	<fieldset class="min-w-0">
		<legend class="mb-2 text-sm font-medium">{t`Default language`}</legend>
		<LanguageSelect bind:value={language} />
	</fieldset>
	<fieldset class="min-w-0 sm:col-span-2">
		<legend class="mb-2 text-sm font-medium">{t`Time zone`}</legend>
		<TimezoneSelect class="w-full" bind:value={timezone} />
	</fieldset>
</div>
