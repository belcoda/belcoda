<script lang="ts">
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import LanguagesIcon from '@lucide/svelte/icons/languages';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import NotebookPenIcon from '@lucide/svelte/icons/notebook-pen';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import TagsIcon from '@lucide/svelte/icons/tags';
	import UsersIcon from '@lucide/svelte/icons/users';

	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { locale, t } from '$lib/index.svelte';
	import type { CountryCode } from '$lib/schema/helpers';
	import { appState } from '$lib/state.svelte';
	import { renderLocalizedCountryName } from '$lib/utils/country';
	import { getLocalizedLanguageName } from '$lib/utils/language';
	import { formatNumber } from '$lib/utils/number';
	import { renderLocalPhoneNumber } from '$lib/utils/phone';
	import type { ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';

	let { person }: { person: ReadPersonOutputWithReadonlyArrays } = $props();

	const memberSince = $derived(
		new Intl.DateTimeFormat(locale.current, {
			month: 'short',
			year: 'numeric',
			timeZone: appState.activeOrganization?.data?.defaultTimezone
		}).format(new Date(person.createdAt))
	);
	const location = $derived(
		[
			person.locality,
			person.region,
			renderLocalizedCountryName(person.country as CountryCode, locale.current)
		]
			.filter(Boolean)
			.join(', ')
	);
	const visibleTags = $derived(person.tags.slice(0, 4));
	const hiddenTagCount = $derived(Math.max(0, person.tags.length - visibleTags.length));
	const hiddenTagCountLabel = $derived(formatNumber(hiddenTagCount, locale.current));
	const visibleTeams = $derived(person.teams.slice(0, 4));
	const hiddenTeamCount = $derived(Math.max(0, person.teams.length - visibleTeams.length));
	const hiddenTeamCountLabel = $derived(formatNumber(hiddenTeamCount, locale.current));
	const latestNote = $derived(person.notes[0]);
</script>

<div class="space-y-5" data-testid="person-context-details">
	<section aria-labelledby="person-context-overview-heading">
		<h2 id="person-context-overview-heading" class="mb-3 text-sm font-semibold">{t`Overview`}</h2>
		<dl class="space-y-3 text-sm">
			<div class="flex items-start gap-3">
				<CalendarDaysIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<div class="min-w-0">
					<dt class="text-xs text-muted-foreground">{t`Member since`}</dt>
					<dd>{memberSince}</dd>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<MapPinIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<div class="min-w-0">
					<dt class="text-xs text-muted-foreground">{t`Location`}</dt>
					<dd class="break-words">{location}</dd>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<LanguagesIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<div class="min-w-0">
					<dt class="text-xs text-muted-foreground">{t`Preferred language`}</dt>
					<dd>{getLocalizedLanguageName(person.preferredLanguage)}</dd>
				</div>
			</div>
		</dl>
	</section>

	{#if person.phoneNumber || person.emailAddress}
		<Separator />
		<section aria-labelledby="person-context-contact-heading">
			<h2 id="person-context-contact-heading" class="mb-3 text-sm font-semibold">{t`Contact`}</h2>
			<div class="space-y-3 text-sm">
				{#if person.phoneNumber}
					<a
						href={`tel:${person.phoneNumber}`}
						class="flex min-w-0 items-center gap-3 hover:underline"
						data-testid="person-context-phone"
					>
						<PhoneIcon class="size-4 shrink-0 text-muted-foreground" />
						<span class="truncate">
							{renderLocalPhoneNumber(person.phoneNumber, person.country)}
						</span>
					</a>
				{/if}
				{#if person.emailAddress}
					<a
						href={`mailto:${person.emailAddress}`}
						class="flex min-w-0 items-center gap-3 hover:underline"
						data-testid="person-context-email"
					>
						<MailIcon class="size-4 shrink-0 text-muted-foreground" />
						<span class="truncate">{person.emailAddress}</span>
					</a>
				{/if}
			</div>
		</section>
	{/if}

	{#if person.teams.length > 0}
		<Separator />
		<section aria-labelledby="person-context-teams-heading">
			<h2
				id="person-context-teams-heading"
				class="mb-3 flex items-center gap-2 text-sm font-semibold"
			>
				<UsersIcon class="size-4 text-muted-foreground" />
				{t`Teams`}
			</h2>
			<div class="flex flex-wrap gap-2" data-testid="person-context-teams">
				{#each visibleTeams as team (team.id)}
					<Badge variant="secondary" class="max-w-full">
						<span class="truncate">{team.name}</span>
					</Badge>
				{/each}
				{#if hiddenTeamCount > 0}
					<Badge variant="outline">{t`+${hiddenTeamCountLabel} more`}</Badge>
				{/if}
			</div>
		</section>
	{/if}

	{#if person.tags.length > 0}
		<Separator />
		<section aria-labelledby="person-context-tags-heading">
			<h2
				id="person-context-tags-heading"
				class="mb-3 flex items-center gap-2 text-sm font-semibold"
			>
				<TagsIcon class="size-4 text-muted-foreground" />
				{t`Tags`}
			</h2>
			<div class="flex flex-wrap gap-2" data-testid="person-context-tags">
				{#each visibleTags as tag (tag.id)}
					<Badge variant="outline" class="max-w-full">
						<span class="truncate">{tag.name}</span>
					</Badge>
				{/each}
				{#if hiddenTagCount > 0}
					<Badge variant="outline">{t`+${hiddenTagCountLabel} more`}</Badge>
				{/if}
			</div>
		</section>
	{/if}

	{#if latestNote}
		<Separator />
		<section aria-labelledby="person-context-note-heading">
			<h2
				id="person-context-note-heading"
				class="mb-3 flex items-center gap-2 text-sm font-semibold"
			>
				<NotebookPenIcon class="size-4 text-muted-foreground" />
				{t`Latest note`}
			</h2>
			<p
				class="line-clamp-4 text-sm break-words whitespace-pre-wrap"
				data-testid="person-context-note"
			>
				{latestNote.note}
			</p>
		</section>
	{/if}
</div>
