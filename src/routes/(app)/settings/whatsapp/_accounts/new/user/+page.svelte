<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import LinkWhatsAppAccount from '$lib/components/forms/whatsapp/LinkWhatsAppAccount.svelte';
</script>

<ContentLayout rootLink="/settings/whatsapp/_accounts/new">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold" data-testid="link-whatsapp-user-heading">
				{t`Link a personal WhatsApp account`}
			</h1>
		</div>
	{/snippet}

	<div class="max-w-2xl space-y-6">
		<p class="text-muted-foreground">
			{t`Only you will be able to send and receive messages using this account.`}
		</p>
		<LinkWhatsAppAccount scope="user" />
	</div>
</ContentLayout>
