<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Forgot Password - AuthApp</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#1a1b1e]">
	<div class="relative w-full max-w-md animate-fade-in-up">
		<div class="bg-[#202124] rounded-2xl border border-[#2a2b2e] p-8 sm:p-10">
			<div class="text-center mb-8">
				<div class="mx-auto h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-5">
					<svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-white">Forgot password?</h2>
				<p class="mt-2 text-sm text-gray-400">
					Enter your email and we'll send you a reset link.
				</p>
			</div>

			{#if form?.success}
				<div class="alert-enter mb-6 rounded-xl bg-emerald-900/20 border border-emerald-800/30 p-4 flex items-start gap-3">
					<svg class="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
					<p class="text-sm text-emerald-300">{form.message}</p>
				</div>
			{/if}

			{#if form?.error}
				<div class="alert-enter mb-6 rounded-xl bg-red-900/20 border border-red-800/30 p-4 flex items-start gap-3">
					<svg class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
					<p class="text-sm text-red-300">{form.error}</p>
				</div>
			{/if}

			{#if !form?.success}
				<form
					method="POST"
					class="space-y-5"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							await update();
						};
					}}
				>
					<div>
						<label for="email" class="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							value=""
							class="block w-full rounded-xl border border-[#3a3b3e] bg-[#2a2b2e] px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-emerald-500/50 focus:bg-[#2a2b2e] focus:outline-none text-sm transition-all duration-300"
							placeholder="you@example.com"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
					>
						{#if loading}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
							Sending...
						{:else}
							Send Reset Link
						{/if}
					</button>
				</form>
			{/if}

			<div class="mt-6 text-center">
				<a href="/auth/login" class="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
					&larr; Back to Sign In
				</a>
			</div>
		</div>
	</div>
</div>
