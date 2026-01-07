<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import H2 from '$lib/components/ui/typography/H2.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { LOCALES, type Locale, getLocaleName, isSupportedLanguage } from '$lib/utils/language';
	import { appState } from '$lib/state.svelte';
	import { t } from '$lib';
	let value = $state<Locale>(appState.locale);
	import { authClient } from '$lib/auth-client';
	async function setLocale(locale: string) {
		if (!isSupportedLanguage(locale)) {
			return;
		}
		await authClient.updateUser({
			//@ts-expect-error - better auth doesn't type the extended user schema...
			preferredLanguage: locale
		});
		appState.locale = locale;
		document.cookie = `BELCODA_LOCALE=${locale}; path=/; max-age=31536000; samesite=strict`;
	}
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
</script>

<ContentLayout rootLink="/preferences" {header} {footer}>
	<Card.Root>
		<Card.Content>
			<Label class="ms-0.5 mb-3">Update your preferred language:</Label>
			<Select.Root
				type="single"
				bind:value
				onValueChange={(value) => {
					if (isSupportedLanguage(value)) {
						setLocale(value);
					}
				}}
			>
				<Select.Trigger class="w-[180px]">
					{getLocaleName(value)}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>{t`Languages`}</Select.Label>
						{#each LOCALES as locale (locale)}
							<Select.Item value={locale} label={getLocaleName(locale)}>
								{getLocaleName(locale)}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
			<p class="ms-0.5 mt-2 text-sm text-muted-foreground">
				This will update your language for all the pages in the application.
			</p>
		</Card.Content>
	</Card.Root>
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<H2>{t`Language`}</H2>
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex w-full items-center justify-end">
		<Button>Save</Button>
	</div>
{/snippet}
