<script lang="ts">
	import { t } from '$lib/index.svelte';
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import CogIcon from '@lucide/svelte/icons/cog';
	import * as Empty from '$lib/components/ui/empty/index.js';
</script>

<ContentLayout rootLink="/">
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">{t`Settings`}</h1>
		</div>
	{/snippet}

	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<CogIcon />
			</Empty.Media>
			<Empty.Title>{t`Settings`}</Empty.Title>
			<Empty.Description
				>{t`Manage your personal account preferences and, if you're an admin, your workspace settings.`}</Empty.Description
			>
		</Empty.Header>
	</Empty.Root>
</ContentLayout>
