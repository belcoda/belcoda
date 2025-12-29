<script lang="ts">
	import { page } from '$app/state';
</script>

<div
	class="flex h-screen w-screen flex-wrap items-center justify-center bg-linear-to-br from-blue-100 to-purple-100 text-gray-600"
>
	<div class="-mt-20">
		<div class="grid w-64 grid-cols-1 gap-4 rounded-lg bg-gray-50 p-5 shadow">
			<div class="flex justify-center">
				<img src="/logos/logomark_black.svg" class="w-10 opacity-10" alt="Belcoda icon" />
			</div>
			<h2 class="text-center text-2xl font-bold text-gray-700">{page.status}</h2>
			<div class="text-center text-base font-light text-gray-500">{page.error?.message}</div>
		</div>
	</div>
</div>
