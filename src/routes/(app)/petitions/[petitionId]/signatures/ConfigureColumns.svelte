<script lang="ts">
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import CogIcon from '@lucide/svelte/icons/cog';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { getSurveyQuestions } from '$lib/components/forms/event/survey_actions';
	import type { SurveyQuestion } from '$lib/schema/survey/questions';
	import type { ReadPetitionZero } from '$lib/schema/petition/petition';
	import { generateStartingColumns, potentialColumns, renderColumnName } from './actions';

	type Columns = ReturnType<typeof generateStartingColumns>;

	let open = $state(false);

	let {
		person = $bindable(),
		custom = $bindable(),
		petition
	}: {
		person: string[];
		custom: Columns['custom'];
		petition: ReadPetitionZero;
	} = $props();

	const surveyQuestions = $derived(petition.settings.survey?.collections?.[0]?.questions ?? []);
	const customQuestions = $derived(getSurveyQuestions(surveyQuestions).custom);
</script>

<ResponsiveModal bind:open title="Configure columns">
	<div class="grid grid-cols-2 gap-2">
		{#each potentialColumns as column (column)}
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
		{#each customQuestions as column (column.id)}
			<div class="flex items-center gap-3">
				<Checkbox
					id={column.id}
					checked={custom.some((c) => c.id === column.id)}
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
