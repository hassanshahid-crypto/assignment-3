<script lang="ts">
	let { data } = $props();
	let user = $derived(data.session?.user);

	const greeting = $derived(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	});
</script>

<svelte:head>
	<title>Dashboard - AuthApp</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<!-- Welcome Header -->
	<div class="mb-10 animate-fade-in-up">
		<div class="flex items-center gap-4 mb-2">
			<div class="h-12 w-12 rounded-2xl bg-[#2a2b2e] flex items-center justify-center {user?.role === 'admin' ? 'text-purple-400' : 'text-emerald-400'}">
				<span class="text-lg font-bold">{(user?.name || user?.email)?.[0]?.toUpperCase() ?? '?'}</span>
			</div>
			<div>
				<h1 class="text-3xl font-bold text-white">{greeting()}, {user?.name || 'User'}!</h1>
				<p class="text-gray-400">Here's what's happening with your account.</p>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Profile Card -->
		<div class="card-hover group bg-[#202124] rounded-2xl border border-[#2a2b2e] p-7 animate-fade-in-up stagger-1">
			<div class="flex items-center gap-4">
				<div class="h-14 w-14 rounded-2xl bg-[#2a2b2e] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
					<svg class="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</div>
				<div class="min-w-0">
					<h3 class="text-lg font-semibold text-white">Your Profile</h3>
					<p class="text-sm text-gray-500 truncate">{user?.email}</p>
				</div>
			</div>
			<div class="mt-6">
				<a
					href="/dashboard/profile"
					class="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
				>
					View Profile
					<svg class="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
				</a>
			</div>
		</div>

		<!-- Role Card -->
		<div class="card-hover group bg-[#202124] rounded-2xl border border-[#2a2b2e] p-7 animate-fade-in-up stagger-2">
			<div class="flex items-center gap-4">
				<div class="h-14 w-14 rounded-2xl bg-[#2a2b2e] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
					<svg class="h-7 w-7 {user?.role === 'admin' ? 'text-purple-400' : 'text-emerald-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-white">Your Role</h3>
					<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide {user?.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-emerald-900/30 text-emerald-400'}">
						{user?.role}
					</span>
				</div>
			</div>
			{#if user?.role === 'admin'}
				<div class="mt-6">
					<a
						href="/admin"
						class="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
					>
						Admin Panel
						<svg class="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
					</a>
				</div>
			{/if}
		</div>

		<!-- Quick Actions Card -->
		<div class="card-hover group bg-[#202124] rounded-2xl border border-[#2a2b2e] p-7 animate-fade-in-up stagger-3">
			<div class="flex items-center gap-4">
				<div class="h-14 w-14 rounded-2xl bg-[#2a2b2e] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
					<svg class="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-white">Quick Actions</h3>
					<p class="text-sm text-gray-500">Manage your account</p>
				</div>
			</div>
			<div class="mt-6 space-y-3">
				<a href="/dashboard/profile?tab=profile" class="group/link flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors">
					<svg class="h-4 w-4 text-gray-500 group-hover/link:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
					Edit Profile
				</a>
				<a href="/dashboard/profile?tab=password" class="group/link flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors">
					<svg class="h-4 w-4 text-gray-500 group-hover/link:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
					Change Password
				</a>
			</div>
		</div>
	</div>
</div>
