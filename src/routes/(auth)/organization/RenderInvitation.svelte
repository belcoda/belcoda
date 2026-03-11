<script lang="ts">
	import { t } from '$lib/index.svelte';
	const { invitationId } = $props();
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import XIcon from '@lucide/svelte/icons/x';
	import Button from '$lib/components/ui/button/button.svelte';

	let accepting = $state(false);
	let declining = $state(false);
	let error = $state<string | null>(null);

	const invitedBy = (email: string) => {
		return t`Invited by ${email}`;
	};
	const errorLoadingInvitation = (err: Error) => {
		return t`Error loading invitation: ${err.message}`;
	};
	const declineConfirmMessage = () =>
		t`Are you sure you want to decline this invitation? You will need to contact an organizational admin to get invited again.`;

	async function handleAccept() {
		error = null;
		accepting = true;
		const { data, error: err } = await authClient.organization.acceptInvitation({
			invitationId
		});
		accepting = false;
		if (err) {
			error = err.message ?? t`Failed to accept invitation`;
			return;
		}
		if (data) {
			goto('/');
		}
	}

	async function handleDecline() {
		if (!window.confirm(declineConfirmMessage())) return;
		error = null;
		declining = true;
		const { error: err } = await authClient.organization.rejectInvitation({
			invitationId
		});
		declining = false;
		if (err) {
			error = err.message ?? t`Failed to decline invitation`;
			return;
		}
		goto('/organization');
	}
</script>

{#await authClient.organization.getInvitation({ query: { id: invitationId } })}
	{@render skeletonItem()}
{:then invitation}
	<Item.Root variant="outline">
		{#snippet child({ props })}
			<div {...props}>
				<Item.Media variant="icon">
					<MailIcon class="size-4 text-muted-foreground" />
				</Item.Media>
				<Item.Content>
					<Item.Title class="line-clamp-1">
						{invitation.data?.organizationName}
					</Item.Title>
					{#if invitation.data?.inviterEmail}
						<Item.Description class="line-clamp-1 text-xs text-muted-foreground"
							>{invitedBy(invitation.data.inviterEmail)}</Item.Description
						>
					{/if}
				</Item.Content>
				<Item.Content class="flex w-full flex-col items-end gap-2">
					{#if error}
						<ErrorAlert>{error}</ErrorAlert>
					{/if}
					<div class="">
						<Button
							variant="default"
							size="sm"
							disabled={accepting || declining}
							onclick={handleAccept}
						>
							{#if accepting}
								<Spinner class="size-4" />
							{:else}
								{t`Accept invitation`}
								<ArrowRightIcon class="size-4" />
							{/if}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							class="text-xs text-muted-foreground"
							disabled={accepting || declining}
							onclick={handleDecline}
						>
							{#if declining}
								<Spinner class="size-3" />
							{:else}
								{t`Decline invitation`}
								<XIcon class="size-3" />
							{/if}
						</Button>
					</div>
				</Item.Content>
			</div>
		{/snippet}
	</Item.Root>
{:catch err}
	<ErrorAlert>{errorLoadingInvitation(err)}</ErrorAlert>
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
