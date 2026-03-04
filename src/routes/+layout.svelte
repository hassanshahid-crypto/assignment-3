<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';

	let { data, children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative">
	<!-- Subtle mesh overlay -->
	<div class="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(129,140,248,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(192,132,252,0.12),_transparent_50%),radial-gradient(ellipse_at_center,_rgba(244,114,182,0.08),_transparent_60%)] pointer-events-none"></div>
	<div class="relative">
		<Nav session={data.session} />
		<main class="page-enter">
			{@render children()}
		</main>
	</div>
</div>
