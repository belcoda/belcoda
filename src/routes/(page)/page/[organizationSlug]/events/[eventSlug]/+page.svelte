<script lang="ts">
	const { data } = $props();
</script>

<div>
	<h1>Event Page</h1>
	<p>Session: {data.session?.user.id}</p>
</div>
