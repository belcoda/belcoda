<script lang="ts">
	import { t } from '$lib/index.svelte';
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

	let {
		orgName = 'Riverside Tenants Union',
		orgIcon,
		oninvite
	}: {
		orgName?: string;
		orgIcon?: string;
		oninvite?: () => void;
	} = $props();

	let country = $state('GB');
	let language = $state('en');
	let timezone = $state('Europe/London');
	let teamName = $state('');

	const profileDone = $derived(!!country && !!timezone);
	const teamDone = $derived(teamName.trim().length > 0);
	const essentialsDone = $derived(profileDone && teamDone);

	const profileMeta = $derived(
		[
			country === 'GB' ? t`United Kingdom` : country,
			timezone === 'Europe/London' ? t`Europe / London` : timezone
		]
			.filter(Boolean)
			.join(' · ')
	);

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
			label: t`First team`,
			status: teamDone ? 'done' : profileDone ? 'active' : 'todo',
			meta: teamDone ? teamName.trim() : undefined
		},
		{ id: 'whatsapp', label: t`WhatsApp later`, status: 'todo' },
		{ id: 'invite', label: t`Invite team later`, status: 'todo' }
	]);
</script>

<OnboardingLayout {orgName} {orgIcon} exitHref={resolve('/dashboard')}>
	<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
		<div class="flex flex-col gap-8">
			<header class="flex flex-col gap-1">
				<h1 class="text-2xl font-semibold tracking-tight">{t`Set up ${orgName}`}</h1>
				<p class="text-muted-foreground">
					{t`Do the essentials now; the rest is here whenever you come back.`}
				</p>
			</header>

			{#if essentialsDone}
				<div class="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
					<CheckCircleIcon class="mt-0.5 size-5 text-primary" />
					<div class="flex flex-col gap-0.5">
						<p class="font-medium">{t`You're all set`}</p>
						<p class="text-sm text-muted-foreground">
							{t`The essentials are done. You can head into Belcoda — the rest is waiting on your dashboard.`}
						</p>
					</div>
				</div>
			{/if}

			<section class="flex flex-col gap-3">
				<h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t`Do now`}
				</h2>

				<SetupTaskCard
					title={t`Organization profile`}
					description={t`Sets defaults for dates, language and messaging.`}
				>
					{#snippet icon()}<BuildingIcon class="size-4" />{/snippet}
					<OrganizationProfileForm bind:country bind:language bind:timezone />
				</SetupTaskCard>

				<SetupTaskCard
					title={t`Create a first team`}
					description={t`A team is where your organisers and their work live.`}
					badge={t`recommended`}
				>
					{#snippet icon()}<UsersIcon class="size-4" />{/snippet}
					<FirstTeamForm bind:teamName />
				</SetupTaskCard>
			</section>

			<section class="flex flex-col gap-3">
				<h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t`When you're ready`}
				</h2>

				<SetupTaskCard
					title={t`Connect WhatsApp`}
					description={t`Needs a business number + verification. Has ban risk — we guide you.`}
					actionLabel={t`Set up`}
					actionHref={resolve('/setup/whatsapp')}
				>
					{#snippet icon()}<MessageCircleIcon class="size-4" />{/snippet}
				</SetupTaskCard>

				<SetupTaskCard
					title={t`Invite your team`}
					description={t`Optional — you can run Belcoda solo and invite anyone later.`}
					actionLabel={t`Invite`}
					onAction={oninvite}
				>
					{#snippet icon()}<UserPlusIcon class="size-4" />{/snippet}
				</SetupTaskCard>
			</section>

			<div class="flex flex-wrap items-center gap-3 border-t pt-6">
				<Button onclick={() => goto(resolve('/dashboard'))}>{t`Save & go to dashboard`}</Button>
				<Button variant="ghost" onclick={() => goto(resolve('/dashboard'))}
					>{t`Skip for now`}</Button
				>
			</div>
		</div>

		<div class="order-first lg:order-none">
			<SetupProgressChecklist {steps} class="lg:sticky lg:top-24" />
		</div>
	</div>
</OnboardingLayout>
