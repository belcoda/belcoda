<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { appState } from '$lib/state.svelte';
	function getAccountId() {
		return appState.activeWhatsappAccountId ?? 'all';
	}
	function setAccountId(newAccountId: string) {
		if (newAccountId === 'all') {
			appState.activeWhatsappAccountId = null;
		} else {
			appState.activeWhatsappAccountId = newAccountId;
		}
	}
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
</script>

<Tabs.Root class="w-full" bind:value={getAccountId, setAccountId}>
	<Tabs.List class="w-full border-b rounded-none">
		<Tabs.Trigger value="all">Timeline</Tabs.Trigger>
		{#each appState.whatsappAccountsUsableByCurrentUser as account (account.id)}
			<Tabs.Trigger value={account.id} class="flex items-center gap-2">
				<Avatar
					src={account.metadata.profilePic}
					name1={account.metadata.displayName ?? 'WA'}
					class="size-4"
				/>
				{account.metadata.displayName}
			</Tabs.Trigger>
		{/each}
	</Tabs.List>
</Tabs.Root>
