<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	import { listEmailFromSignatures } from '$lib/zero/query/email_from_signature/list';
	import { type ReadEmailFromSignatureZero } from '$lib/schema/email-from-signature';
	import { t } from '$lib/index.svelte';
	const listSignature = z.createQuery(
		listEmailFromSignatures(appState.queryContext, {
			...getListFilter(appState.organizationId),
			verified: true
		})
	);
	let {
		value = $bindable(),
		onValueChange,
		class: className,
		...props
	}: {
		value: string | null | undefined;
		onValueChange?: (value: string | null | undefined) => void;
		class?: string;
	} = $props();
	import { cn } from '$lib/utils.js';
	function renderEmailFrom(emailFrom: ReadEmailFromSignatureZero | null) {
		if (!emailFrom) return null;
		return `${emailFrom.name} <${emailFrom.emailAddress}>`;
	}
	import { getSystemEmailAddress } from '$lib/utils/string/domain';
	import type { ReadOrganizationZero } from '$lib/schema/organization';

	function getValue() {
		if (!value) return 'system'; // system is the default value
		return value;
	}
	function setValue(newValue: string) {
		if (newValue === 'system') {
			value = undefined;
		} else {
			value = newValue;
		}
		onValueChange?.(value);
	}

	function renderValue() {
		if (value) {
			const email = renderEmailFrom(
				listSignature.data.find((option) => option.id === value) ?? null
			);
			if (email) return email;
			return t`[Select a email]`;
		} else {
			return `${appState.activeOrganization.data?.settings.email.systemFromIdentity.name} <${getSystemEmailAddress(appState.activeOrganization.data as ReadOrganizationZero)}>`;
		}
	}
</script>

{#if listSignature.data}
	<Select.Root type="single" bind:value={getValue, setValue} {...props}>
		<Select.Trigger class={cn('w-full justify-between', className)}>
			{renderValue()}
		</Select.Trigger>
		<Select.Content>
			<Select.Item
				value="system"
				label={`${appState.activeOrganization.data?.settings.email.systemFromIdentity.name} <${getSystemEmailAddress(appState.activeOrganization.data as ReadOrganizationZero)}>`}
			/>
			{#each listSignature.data as option}
				<Select.Item value={option.id} label={renderEmailFrom(option) ?? undefined} />
			{/each}
		</Select.Content>
	</Select.Root>
{/if}
