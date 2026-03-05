<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let profileLoading = $state(false);
	let passwordLoading = $state(false);

	let tab = $derived($page.url.searchParams.get('tab') ?? 'profile');
</script>

<svelte:head>
	<title>{tab === 'password' ? 'Change Password' : 'Edit Profile'} - AuthApp</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<!-- Header -->
	<div class="mb-10 animate-fade-in-up">
		<div class="flex items-center gap-4 mb-2">
			<div class="h-12 w-12 rounded-2xl bg-[#2a2b2e] flex items-center justify-center">
				<svg class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</div>
			<div>
				<h1 class="text-3xl font-bold text-white">{tab === 'password' ? 'Change Password' : 'Edit Profile'}</h1>
				<p class="text-gray-400">{tab === 'password' ? 'Update your account password.' : 'Manage your profile information.'}</p>
			</div>
		</div>
	</div>

	{#if form?.success}
		<div class="alert-enter mb-8 rounded-xl bg-emerald-900/20 border border-emerald-800/30 p-4 flex items-start gap-3">
			<svg class="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			<p class="text-sm font-medium text-emerald-300">{form.message}</p>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert-enter mb-8 rounded-xl bg-red-900/20 border border-red-800/30 p-4 flex items-start gap-3">
			<svg class="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
			<p class="text-sm font-medium text-red-300">{form.error}</p>
		</div>
	{/if}

	{#if tab === 'profile'}
		<!-- Profile Info -->
		<div class="card-hover bg-[#202124] rounded-2xl border border-[#2a2b2e] p-8 animate-fade-in-up stagger-1">
			<div class="flex items-center gap-3 mb-8">
				<div class="h-10 w-10 rounded-xl bg-[#2a2b2e] flex items-center justify-center">
					<svg class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
				</div>
				<h2 class="text-xl font-bold text-white">Profile Information</h2>
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
				<div class="max-w-md">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							value={data.user?.name ?? ''}
							class="block w-full rounded-xl border border-[#3a3b3e] bg-[#2a2b2e] px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
				</div>

				<div class="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div class="flex items-center gap-3 text-sm text-gray-500">
						<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide {data.user?.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-emerald-900/30 text-emerald-400'}">
							{data.user?.role}
						</span>
						<span class="text-gray-600">|</span>
						<span>Joined {data.user?.createdAt ? new Date(data.user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
					</div>
					<button
						type="submit"
						disabled={profileLoading}
						class="btn-shine inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
					>
						{#if profileLoading}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
						{/if}
						{profileLoading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	{:else if tab === 'password'}
		<!-- Change Password -->
		<div class="card-hover bg-[#202124] rounded-2xl border border-[#2a2b2e] p-8 animate-fade-in-up stagger-1">
			<div class="flex items-center gap-3 mb-8">
				<div class="h-10 w-10 rounded-xl bg-[#2a2b2e] flex items-center justify-center">
					<svg class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
				</div>
				<h2 class="text-xl font-bold text-white">Change Password</h2>
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
						<label for="currentPassword" class="block text-sm font-medium text-gray-300 mb-1.5">Current Password</label>
						<input
							id="currentPassword"
							name="currentPassword"
							type="password"
							required
							class="block w-full rounded-xl border border-[#3a3b3e] bg-[#2a2b2e] px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
					<div>
						<label for="newPassword" class="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
						<input
							id="newPassword"
							name="newPassword"
							type="password"
							required
							minlength="6"
							class="block w-full rounded-xl border border-[#3a3b3e] bg-[#2a2b2e] px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-1.5">Confirm New Password</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							required
							class="block w-full rounded-xl border border-[#3a3b3e] bg-[#2a2b2e] px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none text-sm transition-all duration-300"
						/>
					</div>
				</div>

				<div class="mt-8">
					<button
						type="submit"
						disabled={passwordLoading}
						class="btn-shine inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 hover:bg-amber-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
					>
						{#if passwordLoading}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
						{/if}
						{passwordLoading ? 'Changing...' : 'Change Password'}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>
