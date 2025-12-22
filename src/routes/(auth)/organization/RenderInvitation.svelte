<script lang="ts">
	const { invitationId } = $props();
	import { authClient } from '$lib/auth-client';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import MailIcon from '@lucide/svelte/icons/mail';
</script>

{#await authClient.organization.getInvitation({ query: { id: invitationId } })}
	{@render skeletonItem()}
{:then invitation}
	<Item.Root variant="outline">
		{#snippet child({ props })}
			<a href="/" {...props}>
				<Item.Media variant="icon">
					<MailIcon class="size-4 text-muted-foreground" />
				</Item.Media>
				<Item.Content>
					<Item.Title class="line-clamp-1">
						{invitation.data?.organizationName}
					</Item.Title>
					<Item.Description>Invited by {invitation.data?.inviterEmail}</Item.Description>
				</Item.Content>
				<Item.Content class="flex-none text-center">Accept / Reject</Item.Content>
			</a>
		{/snippet}
	</Item.Root>
{:catch error}
	<ErrorAlert>Error loading invitation: {error?.message ?? 'Unknown error'}</ErrorAlert>
{/await}
{#snippet skeletonItem()}
	<div class="flex items-center space-x-4">
		<Skeleton class="size-12 rounded-lg" />
		<div class="space-y-2">
			<Skeleton class="h-4 w-[250px]" />
			<Skeleton class="h-4 w-[200px]" />
		</div>
	</div>
{/snippet}
