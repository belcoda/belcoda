<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { cn } from '$lib/utils.js';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import UserIcon from '@lucide/svelte/icons/user';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	const BASE = '/settings/whatsapp/_accounts/new';

	let certified = $state(false);
</script>

<ContentLayout rootLink="/settings/whatsapp/_accounts">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="link-whatsapp-heading">
				{t`Link a WhatsApp account`}
			</h1>
		</div>
	{/snippet}

	<div class="max-w-2xl space-y-6">
		<p class="text-muted-foreground">
			{t`Connect an existing WhatsApp account — one you already use in the WhatsApp app or the WhatsApp Business app — so you can send and receive messages from within Belcoda. This does not create a new WhatsApp account.`}
		</p>

		<Alert.Root variant="destructive">
			<TriangleAlertIcon class="size-4" />
			<Alert.Title>{t`Please read before continuing`}</Alert.Title>
			<Alert.Description>
				{t`Belcoda links accounts using the unofficial WhatsApp Linked Devices API, which is not endorsed or supported by Meta Platforms, Inc. While we aim to comply with all relevant policies, using a WhatsApp account in Belcoda via the Linked Devices API may violate Meta's terms of service. We cannot guarantee there is no risk of the account being suspended or banned as a result of using it via Belcoda.`}
			</Alert.Description>
		</Alert.Root>

		<div class="flex items-start gap-2">
			<Checkbox id="certify" bind:checked={certified} data-testid="link-whatsapp-certify" />
			<Label for="certify" class="cursor-pointer text-sm font-normal leading-snug">
				{t`I understand and certify that I am linking a WhatsApp account to Belcoda at my own risk, and that I am aware of the risk of suspension or banning of the account.`}
			</Label>
		</div>

		<div class="space-y-3">
			<h2 class="text-sm font-medium text-muted-foreground">
				{t`Choose how this account should be shared`}
			</h2>

			<a
				href={certified ? `${BASE}/user` : undefined}
				aria-disabled={!certified}
				tabindex={certified ? undefined : -1}
				data-testid="link-whatsapp-scope-user"
				class={cn(
					'flex items-start gap-4 rounded-lg border p-5 transition-colors hover:bg-muted/50',
					!certified && 'pointer-events-none opacity-50'
				)}
			>
				<UserIcon class="mt-0.5 size-6 shrink-0 text-muted-foreground" />
				<div class="flex-1 space-y-1">
					<div class="font-semibold">{t`Personal (user) account`}</div>
					<p class="text-sm text-muted-foreground">
						{t`Only you will be able to send and receive messages using this account.`}
					</p>
				</div>
				<ChevronRightIcon class="mt-0.5 size-5 shrink-0 text-muted-foreground" />
			</a>

			<a
				href={certified ? `${BASE}/organization` : undefined}
				aria-disabled={!certified}
				tabindex={certified ? undefined : -1}
				data-testid="link-whatsapp-scope-organization"
				class={cn(
					'flex items-start gap-4 rounded-lg border p-5 transition-colors hover:bg-muted/50',
					!certified && 'pointer-events-none opacity-50'
				)}
			>
				<UsersIcon class="mt-0.5 size-6 shrink-0 text-muted-foreground" />
				<div class="flex-1 space-y-1">
					<div class="font-semibold">{t`Organization account`}</div>
					<p class="text-sm text-muted-foreground">
						{t`Any Belcoda user in your organization will be able to send and receive messages using this account.`}
					</p>
				</div>
				<ChevronRightIcon class="mt-0.5 size-5 shrink-0 text-muted-foreground" />
			</a>
		</div>
	</div>
</ContentLayout>
