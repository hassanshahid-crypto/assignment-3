<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';

	let { data, children } = $props();
</script>

<div class="min-h-screen bg-[#1a1b1e] relative">
	<div class="relative">
		<Nav session={data.session} />
		<main class="page-enter">
			{@render children()}
		</main>
	</div>
</div>
