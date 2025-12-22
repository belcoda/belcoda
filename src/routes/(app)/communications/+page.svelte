<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import UserSearchIcon from '@lucide/svelte/icons/user-search';
</script>

<ContentLayout rootLink="/community">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<UserSearchIcon />
			</Empty.Media>
			<Empty.Title>No Projects Yet</Empty.Title>
			<Empty.Description>
				You haven't created any projects yet. Get started by creating your first project.
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<div class="flex gap-2">
				<Button>Create Project</Button>
				<Button variant="outline">Import Project</Button>
			</div>
		</Empty.Content>
		<Button variant="link" class="text-muted-foreground" size="sm">
			<a href="#/">
				Learn More <ExternalLinkIcon class="inline" />
			</a>
		</Button>
	</Empty.Root>
</ContentLayout>
