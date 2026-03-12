<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	const displayOnboardingVideo = page.url.searchParams.get('display_onboarding_video') === 'true';
	if (displayOnboardingVideo) {
		page.url.searchParams.delete('display_onboarding_video');
		goto(page.url.pathname, { replaceState: true });
	}
	import OnboardingVideo from '$lib/components/widgets/tutorial/onboarding/OnboardingVideo.svelte';
</script>

{#if displayOnboardingVideo}
	<OnboardingVideo />
{/if}
