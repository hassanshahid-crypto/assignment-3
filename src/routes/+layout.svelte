<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { page } from '$app/stores';

	let { data, children } = $props();
	let isAuthenticated = $derived(!!data.session?.user);
	let navCollapsed = $state(false);
	let isChatPage = $derived($page.url.pathname.startsWith('/dashboard/chat'));
</script>

<div class="min-h-screen bg-[#1a1b1e]">
	{#if !isChatPage}
		<Nav session={data.session} onCollapse={(c) => (navCollapsed = c)} />
	{/if}
	<main class="{isAuthenticated && !isChatPage ? (navCollapsed ? 'ml-[68px]' : 'ml-60') : ''} transition-all duration-300">
		{@render children()}
	</main>
</div>
