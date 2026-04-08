<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import CogIcon from '@lucide/svelte/icons/cog';
	let open = $state(false);
	import { generateStartingColumns, potentialColumns } from './actions';
	type Columns = ReturnType<typeof generateStartingColumns>;
	import type { ReadEventZero } from '$lib/schema/event';
	let {
		person = $bindable([]),
		custom = $bindable([]),
		event
	}: { person: Columns['person']; custom: Columns['custom']; event: ReadEventZero } = $props();
	import { getSurveyQuestions } from '$lib/components/forms/event/survey_actions';
	const surveyQuestions = $derived(event.settings.survey?.collections?.[0]?.questions ?? []);
	const customQuestions = $derived(getSurveyQuestions(surveyQuestions).custom);
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { renderColumnName } from './actions';
</script>

<ResponsiveModal bind:open title="Configure columns">
	<div class="grid grid-cols-2 gap-2">
		{#each potentialColumns as column}
			<div class="flex items-center gap-3">
				<Checkbox
					id={column}
					checked={person.includes(column)}
					onCheckedChange={(checked) => {
						if (checked) {
							person = [...person, column];
						} else {
							person = person.filter((p) => p !== column);
						}
					}}
				/>
				<Label for={column}>{renderColumnName(column)}</Label>
			</div>
		{/each}
		{#each customQuestions as column}
			<div class="flex items-center gap-3">
				<Checkbox
					id={column.id}
					checked={Object.is(column.id, custom.find((c) => c.id === column.id)?.id)}
					onCheckedChange={(checked) => {
						if (checked) {
							custom = [...custom, column];
						} else {
							custom = custom.filter((c) => c.id !== column.id);
						}
					}}
				/>
				<Label for={column.id}>{column.label}</Label>
			</div>
		{/each}
	</div>
	{#snippet footer()}
		<Button variant="outline" onclick={() => (open = false)}>Close</Button>
	{/snippet}
	{#snippet trigger()}
		<Button variant="outline" onclick={() => (open = true)}><CogIcon /> Configure Columns</Button>
	{/snippet}
</ResponsiveModal>
