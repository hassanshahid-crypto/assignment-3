<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';

	let { data, children } = $props();
	let isAuthenticated = $derived(!!data.session?.user);
	let navCollapsed = $state(false);
</script>

<div class="min-h-screen bg-[#1a1b1e]">
	<Nav session={data.session} onCollapse={(c) => (navCollapsed = c)} />
	<main class="{isAuthenticated ? (navCollapsed ? 'ml-[68px]' : 'ml-60') : ''} transition-all duration-300">
		{@render children()}
	</main>
</div>
