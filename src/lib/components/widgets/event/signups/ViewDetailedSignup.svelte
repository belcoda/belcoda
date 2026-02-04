<script lang="ts">
	import { type ReadEventSignupZeroWithPerson } from '$lib/schema/event-signup';
	import { type ReadEventZero } from '$lib/schema/event';

	type Props = {
		signup: ReadEventSignupZeroWithPerson;
		event: ReadEventZero;
		open: boolean;
	};

	let { signup, event, open = $bindable(false) }: Props = $props();
	import ResponsiveModal from '$lib/components/ui/responsive-modal/responsive-modal.svelte';

	import {
		getSurveyQuestions,
		renderPersonQuestionResponse
	} from '$lib/components/forms/event/survey_actions';
	const { person: personSurveyQuestions, custom: customSurveyQuestions } = getSurveyQuestions(
		event.settings.survey.collections[0].questions
	);
	import { renderPersonQuestion } from '$lib/components/forms/event/render_survey_question';

	import * as Table from '$lib/components/ui/table/index.js';
	import { locale } from '$lib/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import H5 from '$lib/components/ui/typography/H5.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
</script>

<ResponsiveModal bind:open title="Additional details">
	<Alert.Root variant="default">
		<Alert.Description>
			Personal details may differ the responses provided by the attendee if their recorded personal
			information in Belcoda has been modified or updated since they signed up for the event.
		</Alert.Description>
	</Alert.Root>
	<H5>Personal details</H5>
	<Table.Root>
		<Table.Body>
			{#each personSurveyQuestions as question}
				<Table.Row>
					<Table.Cell class="font-medium">
						{renderPersonQuestion(question.type)}
					</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{renderPersonQuestionResponse(question.type, signup.person, locale.current)}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
	<H5>Custom fields</H5>
	<Table.Root>
		<Table.Body>
			{#each customSurveyQuestions as question}
				<Table.Row>
					<Table.Cell class="font-medium">
						{question.label}
					</Table.Cell>
					<Table.Cell class="text-muted-foreground">
						{signup.details.customFields[question.id]}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
	{#snippet footer()}
		<div class="flex justify-end">
			<Button variant="outline" onclick={() => (open = false)}>Close</Button>
		</div>
	{/snippet}
</ResponsiveModal>
