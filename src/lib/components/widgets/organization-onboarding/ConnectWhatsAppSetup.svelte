<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import OnboardingLayout from './OnboardingLayout.svelte';
	import SetupProgressChecklist from './SetupProgressChecklist.svelte';
	import type { SetupStep } from './types';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import LockIcon from '@lucide/svelte/icons/lock';

	let {
		orgName = 'Riverside Tenants Union',
		orgIcon
	}: {
		orgName?: string;
		orgIcon?: string;
	} = $props();

	let phoneNumber = $state('');
	let wabaId = $state('');

	const deferred = [
		{
			id: 'templates',
			title: t`Message templates & approval`,
			description: t`Draft the messages Meta must approve before you can broadcast.`
		},
		{
			id: 'opt-in',
			title: t`Opt-in collection flow`,
			description: t`Collect consent from people before you message them.`
		},
		{
			id: 'warm-up',
			title: t`Number warm-up`,
			description: t`Ramp up sending volume gradually to protect your number.`
		}
	];

	const steps: SetupStep[] = [
		{ id: 'org', label: t`Organization created`, status: 'done' },
		{ id: 'profile', label: t`Organization profile`, status: 'done' },
		{ id: 'team', label: t`First team`, status: 'done' },
		{ id: 'whatsapp', label: t`Connect WhatsApp`, status: 'active' },
		{ id: 'invite', label: t`Invite team later`, status: 'todo' }
	];
</script>

<OnboardingLayout {orgName} {orgIcon} exitHref={resolve('/dashboard')}>
	<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
		<div class="flex flex-col gap-6">
			<div class="flex flex-col gap-2">
				<a
					href={resolve('/setup')}
					class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ChevronLeftIcon class="size-4" />
					{t`Back to setup`}
				</a>
				<h1 class="text-2xl font-semibold tracking-tight">{t`Connect WhatsApp`}</h1>
				<p class="text-muted-foreground">{t`High-barrier — only what's needed right now.`}</p>
			</div>

			<div
				class="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
			>
				<TriangleAlertIcon class="mt-0.5 size-5 shrink-0" />
				<div class="flex flex-col gap-0.5 text-sm">
					<p class="font-medium">{t`Ban risk`}</p>
					<p>
						{t`Messaging people who never opted in can get your number suspended by Meta. We collect consent and warm the number up before any broadcast.`}
					</p>
				</div>
			</div>

			<section class="flex flex-col gap-4">
				<h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t`Due now`}
				</h2>
				<div class="flex flex-col gap-2">
					<Label for="whatsapp-phone">{t`Business phone number`}</Label>
					<Input id="whatsapp-phone" bind:value={phoneNumber} placeholder="+44 7700 900000" />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="whatsapp-waba">{t`WhatsApp Business Account (WABA) ID`}</Label>
					<Input id="whatsapp-waba" bind:value={wabaId} placeholder="1029384756…" />
				</div>
			</section>

			<section class="flex flex-col gap-3">
				<h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t`Deferred — after you're verified`}
				</h2>
				<ul class="flex flex-col gap-2">
					{#each deferred as item (item.id)}
						<li
							class="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-muted-foreground"
						>
							<LockIcon class="mt-0.5 size-4 shrink-0" />
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium text-foreground/70">{item.title}</span>
								<span class="text-xs">{item.description}</span>
							</div>
						</li>
					{/each}
				</ul>
			</section>

			<div class="flex flex-wrap items-center gap-3 border-t pt-6">
				<Button onclick={() => goto(resolve('/setup'))}>{t`Verify number`}</Button>
				<Button variant="ghost" onclick={() => goto(resolve('/setup'))}>{t`Do this later`}</Button>
			</div>
		</div>

		<div class="order-first lg:order-none">
			<SetupProgressChecklist {steps} class="lg:sticky lg:top-24" />
		</div>
	</div>
</OnboardingLayout>
