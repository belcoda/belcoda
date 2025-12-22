<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import UserSearchIcon from '@lucide/svelte/icons/user-search';
	import AddPersonModal from '$lib/components/widgets/person/add_modal/AddPersonModal.svelte';
</script>

<ContentLayout rootLink="/community">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<UserSearchIcon />
			</Empty.Media>
			<Empty.Title>Community</Empty.Title>
			<Empty.Description>All your people and teams in one place.</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<div class="flex gap-2">
				<AddPersonModal {trigger} personIdsToExclude={[]} onSelected={(personIds) => {}} />
				{#snippet trigger()}<Button>Add Person</Button>{/snippet}
			</div>
		</Empty.Content>
		<Button variant="link" class="text-muted-foreground" size="sm">
			<a href="#/">
				Learn more about Belcoda's community module <ExternalLinkIcon class="inline" />
			</a>
		</Button>
	</Empty.Root>
</ContentLayout>
