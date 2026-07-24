<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import PanelRightCloseIcon from '@lucide/svelte/icons/panel-right-close';
	import PanelRightOpenIcon from '@lucide/svelte/icons/panel-right-open';
	import XIcon from '@lucide/svelte/icons/x';

	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { t } from '$lib/index.svelte';
	import { cn } from '$lib/utils.js';
	import { renderName } from '$lib/utils/name';
	import type { ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';

	import type { PersonContextPanelState } from './person-context-panel';

	type Props = {
		personId: string;
		state: PersonContextPanelState;
		collapsible?: boolean;
		collapsed?: boolean;
		onCollapsedChange?: (collapsed: boolean) => void;
		onClose?: () => void;
		content?: Snippet<[person: ReadPersonOutputWithReadonlyArrays]>;
	};

	let {
		personId,
		state,
		collapsible = false,
		collapsed = false,
		onCollapsedChange,
		onClose,
		content
	}: Props = $props();

	const fullProfileHref = $derived(resolve(`/community/${personId}/profile`));
	const loadingSkeletons = [0, 1, 2];

	function setCollapsed(nextCollapsed: boolean) {
		onCollapsedChange?.(nextCollapsed);
	}
</script>

{#if collapsed}
	<aside
		class="flex h-full w-14 shrink-0 flex-col items-center border-s bg-background py-3"
		aria-label={t`Person profile`}
		data-testid="person-context-panel-collapsed"
	>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						aria-label={t`Show person profile`}
						onclick={() => setCollapsed(false)}
					>
						<PanelRightOpenIcon />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="left">{t`Show person profile`}</Tooltip.Content>
		</Tooltip.Root>

		{#if state.status === 'ready'}
			<a
				href={fullProfileHref}
				class="mt-3 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				aria-label={t`View full profile`}
				title={t`View full profile`}
			>
				<Avatar
					class="size-9 text-xs"
					name1={state.person.givenName ||
						state.person.familyName ||
						state.person.emailAddress ||
						''}
					name2={!state.person.givenName && state.person.familyName
						? undefined
						: state.person.familyName}
					src={state.person.profilePicture}
				/>
			</a>
		{/if}
	</aside>
{:else}
	<aside
		class="flex h-full w-full min-w-0 flex-col border-s bg-background"
		aria-label={t`Person profile`}
		data-testid="person-context-panel"
	>
		<header class="flex min-h-16 shrink-0 items-center gap-3 border-b px-4 py-3">
			{#if state.status === 'ready'}
				<Avatar
					class="size-10 shrink-0 text-sm"
					name1={state.person.givenName ||
						state.person.familyName ||
						state.person.emailAddress ||
						''}
					name2={!state.person.givenName && state.person.familyName
						? undefined
						: state.person.familyName}
					src={state.person.profilePicture}
				/>
				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-semibold" data-testid="person-context-panel-name">
						{renderName({
							givenName: state.person.givenName,
							familyName: state.person.familyName,
							country: state.person.country
						})}
					</div>
					<div class="truncate text-xs text-muted-foreground">
						{state.person.phoneNumber || state.person.emailAddress || t`No contact details`}
					</div>
				</div>
			{:else}
				<div class="min-w-0 flex-1 text-sm font-semibold">{t`Person profile`}</div>
			{/if}

			<div class="flex shrink-0 items-center">
				{#if collapsible}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="icon"
									aria-label={t`Hide person profile`}
									onclick={() => setCollapsed(true)}
								>
									<PanelRightCloseIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="left">{t`Hide person profile`}</Tooltip.Content>
					</Tooltip.Root>
				{/if}
				{#if onClose}
					<Button
						variant="ghost"
						size="icon"
						aria-label={t`Close person profile`}
						onclick={onClose}
					>
						<XIcon />
					</Button>
				{/if}
			</div>
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto p-4">
			{#if state.status === 'loading'}
				<div
					class="space-y-5"
					role="status"
					aria-live="polite"
					aria-busy="true"
					aria-label={t`Loading person profile`}
				>
					<div class="flex items-center gap-3">
						<Skeleton class="size-12 rounded-full" />
						<div class="flex-1 space-y-2">
							<Skeleton class="h-4 w-2/3" />
							<Skeleton class="h-3 w-1/2" />
						</div>
					</div>
					{#each loadingSkeletons as skeleton (skeleton)}
						<div class="space-y-2">
							<Skeleton class="h-3 w-1/3" />
							<Skeleton class="h-8 w-full" />
						</div>
					{/each}
				</div>
			{:else if state.status === 'error'}
				<Alert.Root variant="destructive">
					<AlertCircleIcon />
					<Alert.Title>{t`Unable to load person profile`}</Alert.Title>
					<Alert.Description>{t`Try again in a moment.`}</Alert.Description>
				</Alert.Root>
			{:else if state.status === 'forbidden'}
				<Alert.Root>
					<AlertCircleIcon />
					<Alert.Title>{t`Profile unavailable`}</Alert.Title>
					<Alert.Description>
						{t`You do not have permission to view this person's profile.`}
					</Alert.Description>
				</Alert.Root>
			{:else if state.status === 'not-found'}
				<Alert.Root>
					<AlertCircleIcon />
					<Alert.Title>{t`Person not found`}</Alert.Title>
					<Alert.Description>
						{t`This person may have been removed from the organization.`}
					</Alert.Description>
				</Alert.Root>
			{:else}
				<div data-testid="person-context-panel-content">
					{@render content?.(state.person)}
				</div>
			{/if}
		</div>

		{#if state.status === 'ready'}
			<footer class="shrink-0 border-t p-3">
				<a
					href={fullProfileHref}
					class={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
					data-testid="person-context-panel-full-profile"
				>
					{t`View full profile`}
				</a>
			</footer>
		{/if}
	</aside>
{/if}
