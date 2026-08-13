<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import LinkWhatsAppAccount from '$lib/components/forms/whatsapp/LinkWhatsAppAccount.svelte';
	import { appState } from '$lib/state.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<ContentLayout rootLink="/settings/whatsapp/_accounts/new">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="link-whatsapp-organization-heading">
				{t`Link an organization WhatsApp account`}
			</h1>
		</div>
	{/snippet}

	<div class="max-w-2xl space-y-6">
		{#if appState.isAdminOrOwner}
			<p class="text-muted-foreground">
				{t`Any Belcoda user in your organization will be able to send and receive messages using this account.`}
			</p>
			<LinkWhatsAppAccount scope="organization" />
		{:else}
			<Card.Root>
				<Card.Content class="py-8 text-center text-muted-foreground">
					{t`Only organization admins and owners can link an organization WhatsApp account.`}
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</ContentLayout>
