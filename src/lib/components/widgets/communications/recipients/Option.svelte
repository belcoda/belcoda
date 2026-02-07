<script lang="ts">
	import { getAppState } from '$lib/state.svelte';
	const appState = getAppState();
	import { type FilterType } from '$lib/schema/person/filter';
	import { t } from '$lib/index.svelte';
	const { filter }: { filter: FilterType } = $props();
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import type { Snippet } from 'svelte';

	import { renderLocalizedCountryName } from '$lib/utils/country';
	import { getLocalizedLanguageName, type LanguageCode } from '$lib/utils/language';
	import { renderGender } from '$lib/utils/person';
</script>

{#snippet renderFilter(text: string, image: Snippet)}
	<div class="flex items-center gap-1">
		<div class="size-5">
			{@render image()}
		</div>
		<div class="text-sm font-medium text-foreground">
			{text}
		</div>
	</div>
{/snippet}

{#if filter.type === 'personId'}
	{#snippet personIdImage()}
		<Avatar
			src={filter.profilePicture}
			name1={filter.givenName || filter.familyName || filter.label || ''}
			name2={filter.familyName}
		/>
	{/snippet}
	{@render renderFilter(filter.givenName + ' ' + filter.familyName, personIdImage)}
{/if}

{#if filter.type === 'country'}
	{#snippet countryImage()}
		<div class="flex size-5 items-center overflow-hidden rounded-full">
			<img
				class="size-7 rounded-full"
				src={`/images/icons/flags/svg/${filter.country}.svg`}
				alt={renderLocalizedCountryName(filter.country, appState.locale)}
			/>
		</div>
	{/snippet}
	{@render renderFilter(renderLocalizedCountryName(filter.country, appState.locale), countryImage)}
{/if}

{#if filter.type === 'ageGroup'}
	{#snippet ageGroupImage()}
		<div
			class="flex size-5 items-center overflow-hidden rounded-full bg-linear-to-br from-red-700 to-red-900 p-0.5"
		>
			<img src={`/images/icons/filters/icon-cake.png`} alt={t`Age Group`} />
		</div>
	{/snippet}
	{@render renderFilter(filter.label, ageGroupImage)}
{/if}

{#if filter.type === 'preferredLanguage'}
	{#snippet languageImage()}
		<div
			class="flex size-5 items-center overflow-hidden rounded-full bg-linear-to-br from-purple-700 to-purple-900 p-0.5"
		>
			<img src={`/images/icons/filters/icon-language.png`} alt={t`Language`} />
		</div>
	{/snippet}
	{@render renderFilter(
		getLocalizedLanguageName(filter.preferredLanguage as LanguageCode),
		languageImage
	)}
{/if}

{#if filter.type === 'gender'}
	{#snippet genderImage()}
		<div
			class="flex size-5 items-center overflow-hidden rounded-full bg-linear-to-br from-yellow-500 to-yellow-600 p-0.5"
		>
			<img src={`/images/icons/filters/icon-person.png`} alt={t`Gender`} />
		</div>
	{/snippet}
	{@render renderFilter(renderGender(filter.gender), genderImage)}
{/if}

{#if filter.type === 'eventSignup'}
	{#snippet eventSignupImage()}
		<div
			class="flex size-5 items-center overflow-hidden rounded-full bg-linear-to-br from-green-600 to-green-800 p-1"
		>
			<img src={`/images/icons/filters/icon-calendar.png`} alt={t`Event Signup`} />
		</div>
	{/snippet}
	{@render renderFilter(filter.label, eventSignupImage)}
{/if}

{#if filter.type === 'teamId'}
	{#snippet teamImage()}
		<div class="flex size-5 items-center overflow-hidden rounded-full">
			<Avatar src={null} name1={filter.name} />
		</div>
	{/snippet}
	{@render renderFilter(filter.label, teamImage)}
{/if}

{#if filter.type === 'hasTag'}
	{#snippet tagImage()}
		<div
			class="flex size-5 items-center overflow-hidden rounded-full bg-linear-to-br from-orange-500 to-orange-600 p-0.5"
		>
			<img src={`/images/icons/filters/icon-tag.png`} alt={t`Tag`} />
		</div>
	{/snippet}
	{@render renderFilter(filter.label, tagImage)}
{/if}

{#if filter.type === 'eventActivity'}
	{#snippet eventActivityImage()}
		<div class="flex size-5 items-center overflow-hidden rounded-full">
			<img src={`/images/icons/filters/icon-event.png`} alt={t`Event Activity`} />
		</div>
	{/snippet}
	{@render renderFilter(filter.label, eventActivityImage)}
{/if}
