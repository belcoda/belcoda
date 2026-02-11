<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { authClient } from '$lib/auth-client';
	import { appState } from '$lib/state.svelte';
	import { parse } from 'valibot';
	import { type ReadOrganizationRest, readOrganizationRest } from '$lib/schema/organization';
	const organizations = authClient.useListOrganizations;

	import AuthLayout from '$lib/components/widgets/AuthLayout.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import ErrorAlert from '$lib/components/alerts/Error.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import RenderInvitation from './RenderInvitation.svelte';

	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { goto } from '$app/navigation';

	function returnLogo(organization: {
		id: string;
		name: string;
		slug: string;
		createdAt: Date;
		logo?: string | null | undefined;
		metadata?: any;
	}) {
		// @ts-expect-error - icon and logo are not defined in the organization schema
		return organization.icon || organization.logo;
	}

	const errorLoadingInvitations = (error: Error) => {
		return t`Error loading invitations: ${error.message}`;
	};
</script>

<AuthLayout
	link="/"
	title={t`My Organizations`}
	description={t`Each organization is a separate entity with its own resources and users`}
	{footer}
>
	<div class="flex w-full max-w-md flex-col gap-4">
		{@render invitationList()}
		{@render organizationsList()}
	</div>
</AuthLayout>
{#snippet footer()}
	<div class="text-center text-xs text-muted-foreground">
		<a href="/" class="underline underline-offset-4">{t`Back to dashboard`}</a>
	</div>
{/snippet}

{#snippet invitationList()}
	{#await authClient.organization.listUserInvitations()}
		<Spinner class="mx-auto my-12" />
		{@render skeletonItem()}
	{:then invitations}
		{#if invitations.data && invitations.data.length > 0}
			{#each invitations.data as invitation (invitation.id)}
				<RenderInvitation invitationId={invitation.id} />
			{/each}
		{/if}
	{:catch error}
		<ErrorAlert>{errorLoadingInvitations(error)}</ErrorAlert>
	{/await}
{/snippet}

{#snippet organizationsList()}
	{#if $organizations.isPending}
		{@render skeletonItem()}
		{@render skeletonItem()}
	{:else if $organizations?.data && $organizations.data.length > 0}
		{#each $organizations.data as organization (organization.id)}
			{@const isLoading = { loading: false }}
			<Item.Root variant="outline" class="hover:bg-accent/50">
				{#snippet child({ props })}
					<button
						onclick={async () => {
							isLoading.loading = true;
							await authClient.organization.setActive({ organizationId: organization.id });
							appState.organizationId = organization.id;
							isLoading.loading = false;
							goto(`/`);
						}}
						{...props}
					>
						<Item.Media>
							<img
								src={returnLogo(organization)}
								alt={organization.name}
								class="size-6 rounded-xs bg-linear-to-br from-primary to-primary/50"
							/>
						</Item.Media>
						<Item.Content>
							<Item.Title class="line-clamp-1">
								{organization.name}
							</Item.Title>
						</Item.Content>
						<Item.Content class="flex-none text-center">
							{#if isLoading.loading}
								<Spinner class="size-4" />
							{:else}
								<ChevronRightIcon class="size-4 text-muted-foreground" />
							{/if}
						</Item.Content>
					</button>
				{/snippet}
			</Item.Root>
		{/each}
		{@render createOrganizationItem()}
	{/if}
{/snippet}

{#snippet createOrganizationItem()}
	<Item.Root variant="outline">
		{#snippet child({ props })}
			<a {...props} href="/organization/new">
				<Item.Media>
					<CirclePlusIcon class="size-5 text-muted-foreground" />
				</Item.Media>
				<Item.Content>
					<Item.Title class="line-clamp-1">{t`Create a new organization`}</Item.Title>
				</Item.Content>
				<Item.Content>
					<ChevronRightIcon class="size-4 text-muted-foreground" />
				</Item.Content>
			</a>
		{/snippet}
	</Item.Root>
{/snippet}

{#snippet skeletonItem()}
	<div class="flex items-center space-x-4">
		<Skeleton class="size-12 rounded-lg" />
		<div class="space-y-2">
			<Skeleton class="h-4 w-[250px]" />
			<Skeleton class="h-4 w-[200px]" />
		</div>
	</div>
{/snippet}
