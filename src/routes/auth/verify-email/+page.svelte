<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Verify Email - AuthApp</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="relative w-full max-w-md animate-fade-in-up">
		<div class="bg-white/70 backdrop-blur-2xl rounded-2xl shadow-xl shadow-indigo-200/30 border border-white/50 ring-1 ring-white/30 p-8 sm:p-10 text-center">
			{#if data.success === false}
				<div class="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 mb-5">
					<svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
				<p class="text-sm text-gray-500 mb-6">{data.error}</p>
				<a
					href="/auth/login"
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-300"
				>
					Go to Login
				</a>
			{:else}
				<!-- This shouldn't render since successful verification redirects -->
				<p class="text-gray-500">Redirecting...</p>
			{/if}
		</div>
	</div>
</div>
