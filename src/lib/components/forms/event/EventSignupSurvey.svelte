<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import { locale } from '$lib/index.svelte';
	import { type SuperForm } from 'sveltekit-superforms';
	import { type Readable } from 'svelte/store';
	import { type CreateEventZero, type UpdateEventZero } from '$lib/schema/event';
	type Errors = Readable<
		{
			path: string;
			messages: string[];
		}[]
	>;

	type Props<T extends CreateEventZero | UpdateEventZero> = {
		form: SuperForm<T>;
		data: SuperForm<T>['form'];
		errors: Errors;
	};
	let {
		form = $bindable(),
		data = $bindable(),
		errors = $bindable()
	}: Props<CreateEventZero | UpdateEventZero> = $props();
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import XIcon from '@lucide/svelte/icons/x';
	import { type SurveyQuestionType, renderQuestionTypeName } from '$lib/schema/survey/questions';
	import {
		addFieldTypeToSurvey,
		removeFieldTypeFromSurvey,
		changeQuestionType as changeQuestionTypeAction
	} from './survey_actions';
	import PlusIcon from '@lucide/svelte/icons/plus';

	function toggleStandardInformation(field: SurveyQuestionType, checked: boolean) {
		if (!$data.settings?.survey) return;
		if (checked) {
			$data.settings.survey = addFieldTypeToSurvey($data.settings.survey, field, locale.current);
		} else {
			$data.settings.survey = removeFieldTypeFromSurvey($data.settings.survey, field);
		}
	}

	function addQuestion(type: SurveyQuestionType) {
		if (!$data.settings?.survey) return;
		$data.settings.survey = addFieldTypeToSurvey($data.settings.survey, type, locale.current);
	}

	function removeQuestion(id: string) {
		if (!$data.settings?.survey) return;
		$data.settings.survey.collections[0].questions =
			$data.settings.survey.collections[0].questions.filter((question) => question.id !== id);
	}
	import * as Dropdown from '$lib/components/ui/dropdown-menu/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form/index.js';

	function changeQuestionType(questionIndex: number, type: SurveyQuestionType) {
		if (!$data.settings?.survey) return;
		$data.settings.survey = changeQuestionTypeAction({
			survey: $data.settings.survey,
			collectionIndex: 0,
			questionIndex,
			type,
			locale: locale.current
		});
	}

	function addOption(questionIndex: number) {
		if (!$data.settings?.survey) return;
		if (!('options' in $data.settings.survey.collections[0].questions[questionIndex])) return;
		const length = $data.settings.survey.collections[0].questions[questionIndex].options.length;
		$data.settings.survey.collections[0].questions[questionIndex].options = [
			...$data.settings.survey.collections[0].questions[questionIndex].options,
			`Option ${length + 1}`
		];
	}

	function removeOption(questionIndex: number, optionIndex: number) {
		if (!$data.settings?.survey) return;
		if (!('options' in $data.settings.survey.collections[0].questions[questionIndex])) return;
		$data.settings.survey.collections[0].questions[questionIndex].options =
			$data.settings.survey.collections[0].questions[questionIndex].options.filter(
				(_, index) => index !== optionIndex
			);
	}

	function isChecked(field: SurveyQuestionType) {
		return $data.settings?.survey?.collections[0].questions.some(
			(question) => question.type === field
		);
	}
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<div>
			<h3 class="text-sm leading-none font-medium">Standard Information</h3>
			<p class="mt-1.5 text-sm text-muted-foreground">
				Select which standard information fields to collect from attendees.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="flex items-center gap-3">
				<Checkbox
					id="standard-information-address"
					checked={isChecked('person.address')}
					onCheckedChange={(checked) => toggleStandardInformation('person.address', checked)}
				/>
				<Label for="standard-information-address" class="cursor-pointer font-normal">Address</Label>
			</div>
			<div class="flex items-center gap-3">
				<Checkbox
					id="standard-information-gender"
					checked={isChecked('person.gender')}
					onCheckedChange={(checked) => toggleStandardInformation('person.gender', checked)}
				/>
				<Label for="standard-information-gender" class="cursor-pointer font-normal">Gender</Label>
			</div>
			<div class="flex items-center gap-3">
				<Checkbox
					id="standard-information-dob"
					checked={isChecked('person.dateOfBirth')}
					onCheckedChange={(checked) => toggleStandardInformation('person.dateOfBirth', checked)}
				/>
				<Label for="standard-information-dob" class="cursor-pointer font-normal"
					>Date of birth</Label
				>
			</div>
			<div class="flex items-center gap-3">
				<Checkbox
					id="standard-information-workplace"
					checked={isChecked('person.workplace')}
					onCheckedChange={(checked) => toggleStandardInformation('person.workplace', checked)}
				/>
				<Label for="standard-information-workplace" class="cursor-pointer font-normal"
					>Workplace</Label
				>
			</div>
			<div class="flex items-center gap-3">
				<Checkbox
					id="standard-information-position"
					checked={isChecked('person.position')}
					onCheckedChange={(checked) => toggleStandardInformation('person.position', checked)}
				/>
				<Label for="standard-information-position" class="cursor-pointer font-normal"
					>Position</Label
				>
			</div>
		</div>
	</div>

	<Separator />

	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-sm leading-none font-medium">Custom Questions</h3>
				<p class="mt-1.5 text-sm text-muted-foreground">
					Add custom questions to collect additional information from attendees.
				</p>
			</div>
			{@render addQuestionDropdown()}
		</div>

		{#if $data.settings?.survey && $data.settings?.survey?.collections[0].questions.length > 0}
			<Accordion.Root type="multiple" class="space-y-2">
				{#each $data.settings?.survey?.collections[0].questions as field, index (field.id)}
					{#if field.type.startsWith('custom.')}
						<Accordion.Item value={field.id} class="rounded-lg border last:border-b">
							<Accordion.Trigger class="px-4 py-3 hover:no-underline">
								<div class="flex w-full items-center justify-between pr-4">
									<span class="font-medium">{field.label || 'Untitled Question'}</span>
									<span class="text-xs text-muted-foreground">
										{renderQuestionTypeName(field.type, locale.current)}
									</span>
								</div>
							</Accordion.Trigger>
							<Accordion.Content class="px-4 pt-0 pb-4">
								<div class="space-y-4 pt-4">
									<Form.Field
										{form}
										name={`settings.survey.collections[0].questions[${index}].label`}
									>
										<Form.Control>
											{#snippet children({ props })}
												{#if $data.settings?.survey}
													<Form.Label>Question Label</Form.Label>
													<Input
														type="text"
														{...props}
														bind:value={$data.settings.survey.collections[0].questions[index].label}
														placeholder="Enter question label"
													/>
												{/if}
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<div class="flex items-center justify-between gap-4">
										<Form.Field
											{form}
											name={`settings.survey.collections[0].questions[${index}].required`}
										>
											<Form.Control>
												{#snippet children({ props })}
													{#if $data.settings?.survey}
														<div class="flex items-center gap-2">
															<Checkbox
																{...props}
																bind:checked={
																	$data.settings.survey.collections[0].questions[index].required
																}
															/>
															<Form.Label class="cursor-pointer font-normal"
																>Required field</Form.Label
															>
														</div>
													{/if}
												{/snippet}
											</Form.Control>
										</Form.Field>

										<div class="flex items-center gap-2">
											{@render changeQuestionTypeDropdown(index, field.type)}
											{@render removeQuestionButton(field.id)}
										</div>
									</div>

									{#if 'options' in $data.settings?.survey?.collections[0].questions[index]}
										<div class="space-y-3 rounded-md border p-4">
											<div class="flex items-center justify-between">
												<Label class="text-sm font-medium">Options</Label>
												<Button
													onclick={() => addOption(index)}
													variant="outline"
													size="sm"
													type="button"
												>
													<PlusIcon class="mr-2 size-4" />
													Add option
												</Button>
											</div>
											<div class="space-y-2">
												{#each $data.settings?.survey?.collections[0].questions[index].options as option, optionIndex (option)}
													<div class="flex items-center gap-2">
														<Form.Field
															{form}
															class="flex-1"
															name={`settings.survey.collections[0].questions[${index}].options[${optionIndex}]`}
														>
															<Form.Control>
																{#snippet children({ props })}
																	{#if $data.settings?.survey && 'options' in $data.settings.survey.collections[0].questions[index]}
																		<Input
																			type="text"
																			{...props}
																			bind:value={
																				$data.settings.survey.collections[0].questions[index]
																					.options[optionIndex]
																			}
																			placeholder={`Option ${optionIndex + 1}`}
																		/>
																	{/if}
																{/snippet}
															</Form.Control>
															<Form.FieldErrors />
														</Form.Field>
														<Button
															onclick={() => removeOption(index, optionIndex)}
															variant="ghost"
															size="icon"
															type="button"
															class="shrink-0"
														>
															<XIcon class="size-4" />
															<span class="sr-only">Remove option</span>
														</Button>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					{/if}
				{/each}
			</Accordion.Root>
		{:else}
			<div class="rounded-lg border border-dashed p-8 text-center">
				<p class="text-sm text-muted-foreground">No custom questions added yet.</p>
				<p class="mt-1 text-xs text-muted-foreground">Click "Add question" above to get started.</p>
			</div>
		{/if}
	</div>
</div>

{#snippet addQuestionDropdown()}
	<Dropdown.Root>
		<Dropdown.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>
			<PlusIcon class="mr-2 size-4" />
			Add question
			<ChevronDownIcon class="ml-2 size-4" />
		</Dropdown.Trigger>
		<Dropdown.Content>
			<Dropdown.Item onclick={() => addQuestion('custom.textInput')}>Short text</Dropdown.Item>
			<Dropdown.Item onclick={() => addQuestion('custom.textarea')}>Long text</Dropdown.Item>
			<Dropdown.Item onclick={() => addQuestion('custom.dateInput')}>Date</Dropdown.Item>
			<Dropdown.Item onclick={() => addQuestion('custom.checkboxGroup')}>Checkboxes</Dropdown.Item>
			<Dropdown.Item onclick={() => addQuestion('custom.radioGroup')}>Multiple choice</Dropdown.Item
			>
			<Dropdown.Item onclick={() => addQuestion('custom.dropdown')}>Dropdown</Dropdown.Item>
			<Dropdown.Item onclick={() => addQuestion('custom.emailInput')}>Email</Dropdown.Item>
			<Dropdown.Item onclick={() => addQuestion('custom.phoneInput')}>Phone</Dropdown.Item>
			<Dropdown.Item onclick={() => addQuestion('custom.numberInput')}>Number</Dropdown.Item>
		</Dropdown.Content>
	</Dropdown.Root>
{/snippet}

{#snippet changeQuestionTypeDropdown(questionIndex: number, questionType: SurveyQuestionType)}
	<Dropdown.Root>
		<Dropdown.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>
			Change type
			<ChevronDownIcon class="ml-2 size-4" />
		</Dropdown.Trigger>
		<Dropdown.Content>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.textInput')}
				>Short text</Dropdown.Item
			>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.textarea')}
				>Long text</Dropdown.Item
			>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.dateInput')}
				>Date</Dropdown.Item
			>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.checkboxGroup')}
				>Checkboxes</Dropdown.Item
			>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.radioGroup')}
				>Multiple choice</Dropdown.Item
			>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.dropdown')}
				>Dropdown</Dropdown.Item
			>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.emailInput')}
				>Email</Dropdown.Item
			>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.phoneInput')}
				>Phone</Dropdown.Item
			>
			<Dropdown.Item onclick={() => changeQuestionType(questionIndex, 'custom.numberInput')}
				>Number</Dropdown.Item
			>
		</Dropdown.Content>
	</Dropdown.Root>
{/snippet}

{#snippet removeQuestionButton(questionId: string)}
	<Button
		variant="ghost"
		size="icon"
		type="button"
		onclick={() => {
			if (window.confirm('Are you sure you want to remove this question?')) {
				removeQuestion(questionId);
			}
		}}
		class="text-destructive hover:text-destructive"
	>
		<XIcon class="size-4" />
		<span class="sr-only">Remove question</span>
	</Button>
{/snippet}
