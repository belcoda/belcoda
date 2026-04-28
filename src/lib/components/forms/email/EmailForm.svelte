<script lang="ts">
	import { t } from '$lib/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import SvelteLexical from '$lib/components/ui/wysiwyg/SvelteLexical.svelte';
	import EmailFrom from '$lib/components/ui/custom-select/email-from/email-from.svelte';
	import type { ReadEmailMessageZero } from '$lib/schema/email-message';
	import { type FilterGroupType, defaultFilterGroup } from '$lib/schema/person/filter';

	type UpdateEmailData = {
		subject: string | undefined;
		body: any | undefined;
		emailFromSignatureId: string | undefined;
		recipients: FilterGroupType;
	};

	let {
		subject = $bindable(),
		body = $bindable(),
		recipients = $bindable(),
		emailFromSignatureId = $bindable(),
		handleUpdate
	}: {
		subject: string;
		body: any;
		recipients: FilterGroupType;
		emailFromSignatureId: string | undefined;
		handleUpdate?: (data: UpdateEmailData) => void;
	} = $props();

	import { useDebounce } from 'runed';
	function triggerUpdate() {
		handleUpdate?.({
			subject,
			body: body ? JSON.parse(JSON.stringify(body)) : null,
			emailFromSignatureId: emailFromSignatureId ?? undefined,
			recipients: JSON.parse(JSON.stringify(recipients || defaultFilterGroup))
		});
	}
	const debouncedTriggerUpdate = useDebounce(triggerUpdate, 1000);
	import RecipientBox from '$lib/components/widgets/communications/recipients/RecipientBox.svelte';
</script>

<div class="flex h-full flex-col" data-testid="email-form">
	<div class="flex-1">
		<div class="mx-auto max-w-4xl space-y-6">
			<div class="space-y-2">
				<Label for="recipients">{t`From`}</Label>
				<div class="flex items-center gap-2" data-testid="email-form-from">
					<EmailFrom bind:value={emailFromSignatureId} onValueChange={debouncedTriggerUpdate} />
				</div>
			</div>
			<div class="space-y-2">
				<Label for="recipients">{t`Recipients`}</Label>
				<div class="" data-testid="email-form-recipients">
					<RecipientBox
						bind:filter={recipients}
						initialSelected={recipients.filters}
						onChange={(filter) => {
							debouncedTriggerUpdate();
						}}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="subject">{t`Subject`}</Label>
				<Input
					id="subject"
					type="text"
					placeholder={t`Enter email subject...`}
					data-testid="email-form-subject"
					bind:value={subject}
					oninput={debouncedTriggerUpdate}
				/>
			</div>

			<div class="space-y-2">
				<Label for="body">{t`Message`}</Label>
				<SvelteLexical bind:value={body} onChange={debouncedTriggerUpdate} />
			</div>
		</div>
	</div>
</div>
