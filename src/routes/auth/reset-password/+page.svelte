<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Reset Password - AuthApp</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="absolute top-1/4 left-10 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
	<div class="absolute bottom-1/4 right-10 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style="animation-delay: 1.5s;"></div>

	<div class="relative w-full max-w-md animate-fade-in-up">
		<div class="bg-white/70 backdrop-blur-2xl rounded-2xl shadow-xl shadow-indigo-200/30 border border-white/50 ring-1 ring-white/30 p-8 sm:p-10">
			{#if !data.valid}
				<!-- Invalid or expired token -->
				<div class="text-center">
					<div class="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 mb-5">
						<svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
					<p class="text-sm text-gray-500 mb-6">{data.error}</p>
					<a
						href="/auth/forgot-password"
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-300"
					>
						Request New Link
					</a>
				</div>
			{:else}
				<!-- Valid token - show reset form -->
				<div class="text-center mb-8">
					<div class="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-5">
						<svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900">Set new password</h2>
					<p class="mt-2 text-sm text-gray-500">Choose a strong password for your account.</p>
				</div>

				{#if form?.error}
					<div class="alert-enter mb-6 rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
						<svg class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
						<p class="text-sm text-red-700">{form.error}</p>
					</div>
				{/if}

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
					<input type="hidden" name="token" value={data.token} />

					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							minlength="6"
							class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
							placeholder="At least 6 characters"
						/>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							required
							class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
							placeholder="Repeat your password"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="btn-shine w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300"
					>
						{#if loading}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
							Resetting...
						{:else}
							Reset Password
						{/if}
					</button>
				</form>
			{/if}

			<div class="mt-6 text-center">
				<a href="/auth/login" class="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
					&larr; Back to Sign In
				</a>
			</div>
		</div>
	</div>
</div>
