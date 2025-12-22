<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import UserSearchIcon from '@lucide/svelte/icons/user-search';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
</script>

<ContentLayout rootLink="/events">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<UserSearchIcon />
			</Empty.Media>
			<Empty.Title>Events</Empty.Title>
			<Empty.Description>
				Create events to track your team's activities and progress.
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button href="/events/new">Create event</Button>
		</Empty.Content>
		<Button variant="link" class="text-muted-foreground" size="sm">
			<a href="#/">
				Learn more about events <ExternalLinkIcon class="inline" />
			</a>
		</Button>
	</Empty.Root>
</ContentLayout>
