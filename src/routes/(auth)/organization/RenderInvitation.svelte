<script lang="ts">
	import { t } from '$lib/index.svelte';
	const { invitationId } = $props();
	import { authClient } from '$lib/auth-client';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import MailIcon from '@lucide/svelte/icons/mail';

	const invitedBy = (email: string) => {
		return t`Invited by ${email}`;
	};
	const errorLoadingInvitation = (error: Error) => {
		return t`Error loading invitation: ${error.message}`;
	};
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
					{#if invitation.data?.inviterEmail}
						<Item.Description>{invitedBy(invitation.data.inviterEmail)}</Item.Description>
					{/if}
				</Item.Content>
				<Item.Content class="flex-none text-center">{t`Accept / Reject`}</Item.Content>
			</a>
		{/snippet}
	</Item.Root>
{:catch error}
	<ErrorAlert>{errorLoadingInvitation(error)}</ErrorAlert>
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
