<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import UserSearchIcon from '@lucide/svelte/icons/user-search';
	import { z } from '$lib/zero.svelte';
	const { params } = $props();
	import { appState } from '$lib/state.svelte';
	import { readPerson } from '$lib/zero/query/person/read';
	const person = $derived.by(() => {
		return z.createQuery(readPerson(appState.queryContext, { personId: params.personId }));
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
</script>

<ContentLayout rootLink="/community" {header} {footer}>
	<div>&nbsp;</div>
</ContentLayout>

{#snippet header()}
	<div class="flex items-center justify-between">
		<a href={`/community/${params.personId}/profile`}
			><RenderPerson
				person={person.data}
				personId={params.personId}
				textClass="text-lg font-medium"
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
		<InputGroup.Textarea placeholder="Ask, Search or Chat..." />
		<InputGroup.Addon align="block-end">
			<InputGroup.Button variant="outline" class="rounded-full" size="icon-xs">
				<PlusIcon />
			</InputGroup.Button>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<InputGroup.Button {...props} variant="ghost">Auto</InputGroup.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content side="top" align="start" class="[--radius:0.95rem]">
					<DropdownMenu.Item>Auto</DropdownMenu.Item>
					<DropdownMenu.Item>Agent</DropdownMenu.Item>
					<DropdownMenu.Item>Manual</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<InputGroup.Text class="ms-auto">52% used</InputGroup.Text>
			<Separator orientation="vertical" class="!h-4" />
			<InputGroup.Button variant="default" class="rounded-full" size="icon-xs" disabled>
				<ArrowUpIcon />
				<span class="sr-only">Send</span>
			</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>
{/snippet}
