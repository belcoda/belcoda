<script lang="ts">
	import BriefcaseBusinessIcon from '@lucide/svelte/icons/briefcase-business';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import Clock3Icon from '@lucide/svelte/icons/clock-3';
	import LanguagesIcon from '@lucide/svelte/icons/languages';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import NotebookPenIcon from '@lucide/svelte/icons/notebook-pen';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TagsIcon from '@lucide/svelte/icons/tags';
	import UsersIcon from '@lucide/svelte/icons/users';
	import VenusAndMarsIcon from '@lucide/svelte/icons/venus-and-mars';
	import XIcon from '@lucide/svelte/icons/x';

	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ColorBadge from '$lib/components/ui/colorbadge/badge.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import PersonNoteForm from '$lib/components/layouts/app/action-menus/person/notes/PersonNoteForm.svelte';
	import { locale, t } from '$lib/index.svelte';
	import type { CountryCode } from '$lib/schema/helpers';
	import { appState } from '$lib/state.svelte';
	import { renderLocalizedCountryName } from '$lib/utils/country';
	import { formatShortTimestamp } from '$lib/utils/date';
	import { getLocalizedLanguageName } from '$lib/utils/language';
	import { formatNumber } from '$lib/utils/number';
	import { renderGender } from '$lib/utils/person/gender/render';
	import { renderLocalPhoneNumber } from '$lib/utils/phone';
	import type { ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';

	let {
		person,
		whatsappConfigured,
		whatsappWindowOpen
	}: {
		person: ReadPersonOutputWithReadonlyArrays;
		whatsappConfigured: boolean;
		whatsappWindowOpen: boolean;
	} = $props();

	let addingNote = $state(false);
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
	const latestNoteCreatedAt = $derived(
		latestNote
			? formatShortTimestamp(
					latestNote.createdAt,
					locale.current,
					appState.activeOrganization?.data?.defaultTimezone
				)
			: null
	);
	const work = $derived([person.position, person.workplace].filter(Boolean).join(' - '));
	const dateOfBirth = $derived(
		person.dateOfBirth
			? new Intl.DateTimeFormat(locale.current, {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					timeZone: 'UTC'
				}).format(new Date(person.dateOfBirth))
			: null
	);
	const hasWhatsAppContact = $derived(Boolean(person.whatsAppUsername || person.phoneNumber));
	const lastActive = $derived(
		formatShortTimestamp(
			person.mostRecentActivityAt,
			locale.current,
			appState.activeOrganization?.data?.defaultTimezone
		)
	);
	const communicationLabel = $derived(t`Communication`);
	const organizingLabel = $derived(t`Organizing`);
	const notesLabel = $derived(t`Notes`);
	const detailsLabel = $derived(t`Details`);
	const contactLabel = $derived(t`Contact`);
</script>

<div class="space-y-5" data-testid="person-context-details">
	{#if person.doNotContact}
		<Alert.Root variant="destructive" data-testid="person-context-do-not-contact">
			<CircleAlertIcon />
			<Alert.Title>{t`Do not contact`}</Alert.Title>
			<Alert.Description>{t`This person should not receive communications.`}</Alert.Description>
		</Alert.Root>
	{/if}

	<section aria-label={communicationLabel}>
		<h2 class="mb-3 text-sm font-semibold">{communicationLabel}</h2>
		<dl class="space-y-3 text-sm">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<dt class="flex min-w-0 items-center gap-3">
					<MessageCircleIcon class="size-4 shrink-0 text-muted-foreground" />
					<span>{t`WhatsApp`}</span>
				</dt>
				<dd class="shrink-0" aria-live="polite" data-testid="person-context-whatsapp-status">
					{#if !whatsappConfigured}
						<ColorBadge color="gray">{t`Not configured`}</ColorBadge>
					{:else if !hasWhatsAppContact}
						<ColorBadge color="gray">{t`Unavailable`}</ColorBadge>
					{:else if whatsappWindowOpen}
						<ColorBadge color="green">{t`Reply window open`}</ColorBadge>
					{:else}
						<ColorBadge color="yellow">{t`Template required`}</ColorBadge>
					{/if}
				</dd>
			</div>
			<div class="flex min-w-0 items-center justify-between gap-3">
				<dt class="flex min-w-0 items-center gap-3">
					<MailIcon class="size-4 shrink-0 text-muted-foreground" />
					<span>{t`Email`}</span>
				</dt>
				<dd class="shrink-0" aria-live="polite" data-testid="person-context-email-status">
					{#if !person.emailAddress}
						<ColorBadge color="gray">{t`Unavailable`}</ColorBadge>
					{:else if person.subscribed}
						<ColorBadge color="green">{t`Subscribed`}</ColorBadge>
					{:else}
						<ColorBadge color="gray">{t`Unsubscribed`}</ColorBadge>
					{/if}
				</dd>
			</div>
			<div class="flex min-w-0 items-start gap-3">
				<Clock3Icon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<div class="min-w-0">
					<dt class="text-xs text-muted-foreground">{t`Last active`}</dt>
					<dd>{lastActive}</dd>
				</div>
			</div>
		</dl>
	</section>

	{#if person.teams.length > 0 || person.tags.length > 0}
		<Separator />
		<section aria-label={organizingLabel}>
			<h2 class="mb-3 text-sm font-semibold">{organizingLabel}</h2>
			<div class="space-y-4">
				{#if person.teams.length > 0}
					<div>
						<div class="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
							<UsersIcon class="size-4" />
							{t`Teams`}
						</div>
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
					</div>
				{/if}
				{#if person.tags.length > 0}
					<div>
						<div class="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
							<TagsIcon class="size-4" />
							{t`Tags`}
						</div>
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
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<Separator />
	<section aria-label={notesLabel}>
		<div class="mb-3 flex min-h-8 items-center justify-between gap-2">
			<h2 class="flex items-center gap-2 text-sm font-semibold">
				<NotebookPenIcon class="size-4 text-muted-foreground" />
				{notesLabel}
			</h2>
			<Button
				variant="ghost"
				size="sm"
				onclick={() => (addingNote = !addingNote)}
				aria-expanded={addingNote}
				data-testid="person-context-add-note"
			>
				{#if addingNote}
					<XIcon />
					{t`Cancel`}
				{:else}
					<PlusIcon />
					{t`Add note`}
				{/if}
			</Button>
		</div>

		{#if addingNote}
			<PersonNoteForm personId={person.id} onNotesChanged={() => (addingNote = false)} />
		{:else if latestNote}
			<div class="border-s-2 border-primary/40 ps-3">
				<p
					class="line-clamp-4 text-sm break-words whitespace-pre-wrap"
					data-testid="person-context-note"
				>
					{latestNote.note}
				</p>
				{#if latestNoteCreatedAt}
					<p class="mt-2 text-xs text-muted-foreground">{latestNoteCreatedAt}</p>
				{/if}
			</div>
		{:else}
			<p class="text-sm text-muted-foreground" data-testid="person-context-no-notes">
				{t`No notes yet.`}
			</p>
		{/if}
	</section>

	<Separator />
	<section aria-label={detailsLabel}>
		<h2 class="mb-3 text-sm font-semibold">{detailsLabel}</h2>
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
			{#if work}
				<div class="flex items-start gap-3">
					<BriefcaseBusinessIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<dt class="text-xs text-muted-foreground">{t`Work`}</dt>
						<dd class="break-words">{work}</dd>
					</div>
				</div>
			{/if}
			{#if person.gender}
				<div class="flex items-start gap-3">
					<VenusAndMarsIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<dt class="text-xs text-muted-foreground">{t`Gender`}</dt>
						<dd>{renderGender(person.gender)}</dd>
					</div>
				</div>
			{/if}
			{#if dateOfBirth}
				<div class="flex items-start gap-3">
					<CakeIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0">
						<dt class="text-xs text-muted-foreground">{t`Date of birth`}</dt>
						<dd>{dateOfBirth}</dd>
					</div>
				</div>
			{/if}
		</dl>
	</section>

	{#if person.phoneNumber || person.emailAddress}
		<Separator />
		<section aria-label={contactLabel}>
			<h2 class="mb-3 text-sm font-semibold">{contactLabel}</h2>
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
</div>
