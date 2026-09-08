<script lang="ts">
	import ContentLayout from '$lib/components/layouts/app/ContentLayout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import WorkflowIcon from '@lucide/svelte/icons/workflow';
	import { t } from '$lib/index.svelte';
</script>

<ContentLayout rootLink="/flow">
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<WorkflowIcon />
			</Empty.Media>
			<Empty.Title>{t`Flows`}</Empty.Title>
			<Empty.Description>
				{t`Automate messages and actions for your community with flows.`}
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button href="/flow/new" data-testid="flow-create-button">{t`New flow`}</Button>
		</Empty.Content>
	</Empty.Root>
</ContentLayout>
