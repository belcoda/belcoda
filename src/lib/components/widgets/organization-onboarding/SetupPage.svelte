<script lang="ts">
	import { locale, t } from '$lib/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import OnboardingLayout from './OnboardingLayout.svelte';
	import SetupTaskCard from './SetupTaskCard.svelte';
	import OrganizationProfileForm from './OrganizationProfileForm.svelte';
	import FirstTeamForm from './FirstTeamForm.svelte';
	import SetupProgressChecklist from './SetupProgressChecklist.svelte';
	import type { SetupStep } from './types';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import UsersIcon from '@lucide/svelte/icons/users';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check-big';

	import { untrack } from 'svelte';
	import { type ReadOrganizationZero, updateOrganization } from '$lib/schema/organization';
	import { parse } from 'valibot';
	import { renderLocalizedCountryName } from '$lib/utils/country';
	import { formatTimezone } from '$lib/components/ui/custom-select/timezone/actions';
	import { saveOrganizationProfile } from './save-profile';
	import { toast } from 'svelte-sonner';
	import { appState } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import { snapshotOrganizationSettings } from '$lib/utils/organization-onboarding';

	let {
		organization,
		oninvite
	}: {
		organization: Pick<
			ReadOrganizationZero,
			'id' | 'name' | 'icon' | 'country' | 'defaultLanguage' | 'defaultTimezone' | 'settings'
		>;
		oninvite?: () => void;
	} = $props();

	const orgName = $derived(organization.name);
	const orgIcon = $derived(organization.icon ?? undefined);
	let country = $state<string>(untrack(() => organization.country));
	let language = $state<string>(untrack(() => organization.defaultLanguage));
	let timezone = $state(untrack(() => organization.defaultTimezone));
	let createdTeamName = $state('');
	let saving = $state(false);
	let saveError = $state('');

	const profileDone = $derived(
		organization.settings.onboarding?.profile === 'complete' &&
			country === organization.country &&
			language === organization.defaultLanguage &&
			timezone === organization.defaultTimezone &&
			!saving &&
			!saveError
	);
	const teamDone = $derived(
		!!createdTeamName || organization.settings.onboarding?.team === 'complete'
	);
	const profileMeta = $derived(
		`${renderLocalizedCountryName(organization.country, locale.current)} · ${formatTimezone(organization.defaultTimezone, locale.current)}`
	);

	async function saveProfile() {
		if (saving) return;
		saving = true;
		saveError = '';
		try {
			const input = parse(updateOrganization, {
				country,
				defaultLanguage: language,
				defaultTimezone: timezone
			});
			await saveOrganizationProfile(organization, input);
			appState.clearOrganizationNeedsOnboardingFlag();
			toast.success(t`Organization profile saved`);
			await goto(resolve('/dashboard'));
		} catch {
			saveError = t`We couldn't save your profile. Your entries are still here. Please try again.`;
		} finally {
			saving = false;
		}
	}

	async function skipSetup() {
		if (saving) return;
		saving = true;
		saveError = '';
		try {
			const result = await z.mutate(
				mutators.organization.updateOnboarding({
					metadata: {
						organizationId: organization.id,
						existingSettings: snapshotOrganizationSettings(organization.settings)
					},
					input: { initialSetup: 'skipped' }
				})
			).server;
			if (result.type === 'error') throw new Error(result.error.message);
			appState.clearOrganizationNeedsOnboardingFlag();
			await goto(resolve('/dashboard'));
		} catch {
			saveError = t`We couldn't save your choice. Please try again.`;
		} finally {
			saving = false;
		}
	}

	const steps = $derived<SetupStep[]>([
		{ id: 'org', label: t`Organization created`, status: 'done' },
		{
			id: 'profile',
			label: t`Organization profile`,
			status: profileDone ? 'done' : 'active',
			meta: profileDone ? profileMeta : undefined
		},
		{
			id: 'team',
			label: t`Create a team`,
			optional: true,
			status: teamDone ? 'done' : 'todo',
			meta: teamDone ? createdTeamName || undefined : undefined
		},
		{
			id: 'whatsapp',
			label: t`Connect WhatsApp`,
			optional: true,
			status: organization.settings.onboarding?.whatsappAccount === 'complete' ? 'done' : 'todo'
		},
		{
			id: 'invite',
			label: t`Invite teammates`,
			optional: true,
			status: organization.settings.onboarding?.invitations === 'complete' ? 'done' : 'todo'
		}
	]);
</script>

<OnboardingLayout
	{orgName}
	{orgIcon}
	exitHref={resolve('/dashboard')}
	exitDisabled={saving}
	onexit={skipSetup}
>
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">{t`Set up ${orgName}`}</h1>
		<p class="text-muted-foreground">
			{t`Check your defaults, then start using Belcoda. Everything else can wait.`}
		</p>
	</header>

	<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8">
		<div class="flex flex-col gap-8">
			{#if profileDone}
				<div class="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
					<CheckCircleIcon class="mt-0.5 size-5 text-primary" />
					<div class="flex flex-col gap-0.5">
						<p class="font-medium">{t`You’re ready to get started`}</p>
						<p class="text-sm text-muted-foreground">
							{t`Your defaults are confirmed. You can leave the optional tasks for later.`}
						</p>
					</div>
				</div>
			{/if}

			<section class="flex flex-col gap-3">
				<h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					{t`Your defaults`}
				</h2>

				<SetupTaskCard
					title={t`Confirm your defaults`}
					description={t`These settings are already filled in. Change them if needed.`}
				>
					{#snippet icon()}<BuildingIcon class="size-4" />{/snippet}
					<fieldset disabled={saving} class="min-w-0">
						<OrganizationProfileForm bind:country bind:language bind:timezone />
					</fieldset>
				</SetupTaskCard>
			</section>

			<div class="flex flex-wrap items-center gap-3 border-t pt-6">
				{#if saveError}<p role="alert" class="w-full text-sm text-destructive">{saveError}</p>{/if}
				<Button onclick={saveProfile} disabled={saving}>
					{saving ? t`Saving…` : t`Save and continue`}
				</Button>
				<Button variant="ghost" disabled={saving} onclick={skipSetup}>{t`Skip for now`}</Button>
			</div>

			<section class="flex flex-col gap-3">
				<h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					{t`Optional setup`}
				</h2>
				<p class="text-sm text-muted-foreground">
					{t`You can do these now or return to them from your dashboard.`}
				</p>

				<SetupTaskCard
					title={t`Create a first team`}
					description={t`Group organisers and their work by location or project. You can do this later.`}
					badge={t`optional`}
				>
					{#snippet icon()}<UsersIcon class="size-4" />{/snippet}
					{#if teamDone}
						<p role="status" class="text-sm">
							{createdTeamName
								? t`Team created: ${createdTeamName}`
								: t`Your first team is created.`}
						</p>
					{:else}
						<FirstTeamForm
							{organization}
							oncreated={(name) => {
								createdTeamName = name;
							}}
						/>
					{/if}
				</SetupTaskCard>

				<SetupTaskCard
					title={t`Connect WhatsApp`}
					badge={t`optional`}
					description={t`Send updates and reminders, and receive replies from your community.`}
					actionLabel={t`Set up`}
					actionHref={resolve('/settings/whatsapp/accounts')}
				>
					{#snippet icon()}<MessageCircleIcon class="size-4" />{/snippet}
				</SetupTaskCard>

				<SetupTaskCard
					title={t`Invite your team`}
					badge={t`optional`}
					description={t`Optional — you can run Belcoda solo and invite anyone later.`}
					actionLabel={t`Invite`}
					onAction={oninvite}
				>
					{#snippet icon()}<UserPlusIcon class="size-4" />{/snippet}
				</SetupTaskCard>
			</section>
		</div>

		<div class="order-first lg:order-none">
			<SetupProgressChecklist {steps} compact class="lg:hidden" />
			<SetupProgressChecklist {steps} class="hidden lg:sticky lg:top-24 lg:block" />
		</div>
	</div>
</OnboardingLayout>
