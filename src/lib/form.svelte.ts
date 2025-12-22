import { type GenericSchema, type GenericSchemaAsync } from 'valibot';
import { superForm, defaults, type SuperValidated } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import SuperDebug from '$lib/components/ui/form/custom/debug.svelte';
import RenderError from '$lib/components/ui/form/custom/error.svelte';
type Props<T extends Record<string, unknown>, TInput extends Record<string, unknown>> = {
	schema: GenericSchema<TInput, T> | GenericSchemaAsync<TInput, T>;
	initialData?: TInput;
	validateOnLoad?: boolean;
	hideDebugger?: boolean;
	onSubmit: (value: T, form: SuperValidated<TInput>) => Promise<void>;
	class?: string;
};

export default function Form<
	T extends Record<string, unknown>,
	TInput extends Record<string, unknown>
>({ schema, initialData, validateOnLoad = true, onSubmit }: Props<T, TInput>) {
	const form = initialData
		? //@ts-ignore There seems to be a type issue with defaulting to the generic initialData, but it works fine
			superForm(defaults(initialData, valibot(schema)), {
				SPA: true,
				dataType: 'json',
				validators: valibot(schema),
				onUpdate({ form }) {
					if (form.valid) {
						// @ts-ignore Type error with generics? But also seems to work
						onSubmit(form.data, form);
					}
				}
			})
		: superForm(defaults(valibot(schema)), {
				SPA: true,
				dataType: 'json',
				validators: valibot(schema),
				onUpdate({ form }) {
					if (form.valid) {
						// @ts-ignore Type error with generics? But also seems to work
						onSubmit(form.data, form);
					}
				}
			});
	if (initialData && validateOnLoad) {
		form.validateForm({ update: true });
	}

	function warnBeforeDiscard(isTainted: typeof form.isTainted, callback?: () => void) {
		function callbackOrNavigateBack() {
			if (callback) {
				callback();
			} else {
				window.history.back();
			}
		}

		if (isTainted()) {
			if (confirm('Are you sure you want to discard your changes?')) {
				callbackOrNavigateBack();
			}
		} else {
			callbackOrNavigateBack();
		}
	}

	return {
		Debug: SuperDebug,
		Errors: RenderError,
		warnBeforeDiscard,
		form,
		errors: form.allErrors,
		fieldErrors: form.errors,
		data: form.form,
		helpers: {
			warnBeforeDiscard,
			validate: form.validate,
			isTainted: form.isTainted
		}
	};
}
