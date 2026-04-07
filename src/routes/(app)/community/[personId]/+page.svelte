<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import UserSearchIcon from '@lucide/svelte/icons/user-search';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const { params } = $props();
	const person = $derived.by(() => {
		return z.createQuery(queries.person.read({ personId: params.personId }));
	});
	import RenderPerson from '$lib/components/widgets/render/RenderPerson.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import NotesAction from '$lib/components/layouts/app/action-menus/person/NotesAction.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import ActivityTimeline from '$lib/components/widgets/activity/ActivityTimeline.svelte';
</script>

<ContentLayout rootLink="/community" {header} {footer}>
	<ActivityTimeline personId={params.personId} />
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<a href={`/community/${params.personId}/profile`}
			><RenderPerson
				person={person.data}
				personId={params.personId}
				textClass="text-lg font-medium"
				testId="person-timeline-display-name"
			/></a
		>
		{#if person.data}
			<NotesAction person={person.data} currentPage="timeline" />
		{:else}
			<Skeleton class="h-10 w-20 rounded-lg" />
		{/if}
	</div>
{/snippet}

{#snippet footer()}
	<InputGroup.Root>
		<InputGroup.Textarea placeholder="Write your message..." />
		<InputGroup.Addon align="block-end">
			<InputGroup.Button variant="outline" class="rounded-full" size="icon-xs">
				<PlusIcon />
			</InputGroup.Button>
			<InputGroup.Button variant="default" class="ml-auto rounded-full" size="icon-xs" disabled>
				<ArrowUpIcon />
				<span class="sr-only">Send</span>
			</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>
{/snippet}
