<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Verify Email - AuthApp</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#1a1b1e]">
	<div class="relative w-full max-w-md animate-fade-in-up">
		<div class="bg-[#202124] rounded-2xl border border-[#2a2b2e] p-8 sm:p-10 text-center">
			{#if data.success === false}
				<div class="mx-auto h-14 w-14 rounded-2xl bg-red-600 flex items-center justify-center mb-5">
					<svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-white mb-2">Verification Failed</h2>
				<p class="text-sm text-gray-400 mb-6">{data.error}</p>
				<a
					href="/auth/login"
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-all duration-300"
				>
					Go to Login
				</a>
			{:else}
				<!-- This shouldn't render since successful verification redirects -->
				<p class="text-gray-400">Redirecting...</p>
			{/if}
		</div>
	</div>
</div>
