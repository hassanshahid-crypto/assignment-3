<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let profileLoading = $state(false);
	let passwordLoading = $state(false);
</script>

<svelte:head>
	<title>Profile - AuthApp</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<!-- Header -->
	<div class="mb-10 animate-fade-in-up">
		<div class="flex items-center gap-4 mb-2">
			<div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
				<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</div>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Profile Settings</h1>
				<p class="text-gray-500">Manage your account information and security.</p>
			</div>
		</div>
	</div>

	{#if form?.success}
		<div class="alert-enter mb-8 rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
			<svg class="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			<p class="text-sm font-medium text-emerald-700">{form.message}</p>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert-enter mb-8 rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
			<svg class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
			<p class="text-sm font-medium text-red-700">{form.error}</p>
		</div>
	{/if}

	<div class="space-y-8">
		<!-- Profile Info -->
		<div class="card-hover bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 p-8 animate-fade-in-up stagger-1">
			<div class="flex items-center gap-3 mb-8">
				<div class="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
					<svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
				</div>
				<h2 class="text-xl font-bold text-gray-900">Profile Information</h2>
			</div>
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					profileLoading = true;
					return async ({ update }) => {
						profileLoading = false;
						await update();
					};
				}}
			>
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							value={data.user?.name ?? ''}
							class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							value={data.user?.email ?? ''}
							class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
				</div>

				<div class="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div class="flex items-center gap-3 text-sm text-gray-500">
						<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide {data.user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}">
							{data.user?.role}
						</span>
						<span class="text-gray-300">|</span>
						<span>Joined {data.user?.createdAt ? new Date(data.user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
					</div>
					<button
						type="submit"
						disabled={profileLoading}
						class="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
					>
						{#if profileLoading}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
						{/if}
						{profileLoading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>

		<!-- Change Password -->
		<div class="card-hover bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 p-8 animate-fade-in-up stagger-2">
			<div class="flex items-center gap-3 mb-8">
				<div class="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
					<svg class="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
				</div>
				<h2 class="text-xl font-bold text-gray-900">Change Password</h2>
			</div>
			<form
				method="POST"
				action="?/changePassword"
				use:enhance={() => {
					passwordLoading = true;
					return async ({ update }) => {
						passwordLoading = false;
						await update();
					};
				}}
			>
				<div class="space-y-5 max-w-md">
					<div>
						<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
						<input
							id="currentPassword"
							name="currentPassword"
							type="password"
							required
							class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
					<div>
						<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
						<input
							id="newPassword"
							name="newPassword"
							type="password"
							required
							minlength="6"
							class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							required
							class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
				</div>

				<div class="mt-8">
					<button
						type="submit"
						disabled={passwordLoading}
						class="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
					>
						{#if passwordLoading}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
						{/if}
						{passwordLoading ? 'Changing...' : 'Change Password'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
