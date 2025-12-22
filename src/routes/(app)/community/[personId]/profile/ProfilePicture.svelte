<script lang="ts">
	import { type ReadPersonZero } from '$lib/schema/person';
	import { appState } from '$lib/state.svelte';
	import { url as urlSchema } from '$lib/schema/helpers';
	import { parse } from 'valibot';

	import CroppedImageUpload from '$lib/components/ui/image-upload/CroppedImageUpload.svelte';
	import { z } from '$lib/zero.svelte';
	import { toast } from 'svelte-sonner';
	let { person }: { person: ReadPersonZero } = $props();
</script>

<div class="my-8 flex justify-center">
	<CroppedImageUpload
		aspectRatio={1 / 1}
		fileUrl={person.profilePicture}
		class="aspect-square h-40 w-40 rounded-lg object-cover"
		onUpload={async (url) => {
			try {
				const parsedUrl = parse(urlSchema, url);
				z.mutate.person.update({
					metadata: {
						organizationId: appState.organizationId,
						personId: person.id
					},
					input: {
						profilePicture: parsedUrl
					}
				});
			} catch (error) {
				toast.error('Could not update profile picture. Please try again.');
			}
		}}
	/>
</div>
