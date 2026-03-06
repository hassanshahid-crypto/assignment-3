<script lang="ts">
	import { page } from '$app/stores';
	import { signOut } from '@auth/sveltekit/client';

	let { session, onCollapse } = $props<{ session: any; onCollapse?: (collapsed: boolean) => void }>();
	let collapsed = $state(false);

	$effect(() => { onCollapse?.(collapsed); });

	function isActive(path: string): boolean {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}

	async function handleSignOut() {
		await signOut({ callbackUrl: '/' });
	}

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'dashboard', activeCheck: () => isActive('/dashboard') && !isActive('/dashboard/profile') && !isActive('/dashboard/chat') && !isActive('/dashboard/documents') },
		{ href: '/dashboard/chat', label: 'Synapse AI', icon: 'chat', activeCheck: () => isActive('/dashboard/chat') },
		{ href: '/dashboard/profile', label: 'Profile', icon: 'profile', activeCheck: () => isActive('/dashboard/profile') },
	];
</script>

{#if session?.user}
	<aside class="fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 {collapsed ? 'w-[68px]' : 'w-60'} bg-[#151518] border-r border-[#2a2b2e]">
		<!-- Logo -->
		<div class="flex items-center gap-2.5 px-4 h-16 border-b border-[#2a2b2e] flex-shrink-0">
			<a href="/" class="flex items-center gap-2.5 group">
				<div class="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
					<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
					</svg>
				</div>
				{#if !collapsed}
					<span class="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Synapse</span>
				{/if}
			</a>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
						{item.activeCheck()
							? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-400 shadow-sm shadow-emerald-500/5'
							: 'text-gray-400 hover:text-gray-200 hover:bg-[#1e1f23]'}"
					title={collapsed ? item.label : undefined}
				>
					{#if item.icon === 'dashboard'}
						<svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
					{:else if item.icon === 'chat'}
						<svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
					{:else if item.icon === 'profile'}
						<svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
					{/if}
					{#if !collapsed}
						<span>{item.label}</span>
					{/if}
				</a>
			{/each}

			{#if session.user.role === 'admin'}
				<a
					href="/admin"
					class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
						{isActive('/admin')
							? 'bg-purple-500/15 text-purple-400 shadow-sm shadow-purple-500/5'
							: 'text-gray-400 hover:text-gray-200 hover:bg-[#1e1f23]'}"
					title={collapsed ? 'Admin' : undefined}
				>
					<svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
					{#if !collapsed}
						<span>Admin</span>
					{/if}
				</a>
			{/if}
		</nav>

		<!-- Collapse toggle -->
		<button
			onclick={() => (collapsed = !collapsed)}
			class="mx-3 mb-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-[#1e1f23] transition-all"
		>
			<svg class="h-4 w-4 transition-transform duration-300 {collapsed ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
			{#if !collapsed}
				<span>Collapse</span>
			{/if}
		</button>

		<!-- User -->
		<div class="border-t border-[#2a2b2e] px-3 py-3 flex-shrink-0">
			<div class="flex items-center gap-2.5 {collapsed ? 'justify-center' : ''}">
				<div class="h-8 w-8 rounded-full bg-gradient-to-br {session.user.role === 'admin' ? 'from-purple-400 to-purple-600' : 'from-emerald-400 to-cyan-500'} flex items-center justify-center flex-shrink-0">
					<span class="text-[11px] font-bold text-white">{(session.user.name || session.user.email)?.[0]?.toUpperCase() ?? '?'}</span>
				</div>
				{#if !collapsed}
					<div class="min-w-0 flex-1">
						<div class="text-sm font-medium text-gray-200 truncate">{session.user.name || 'User'}</div>
						<div class="text-[10px] text-gray-500 truncate">{session.user.email}</div>
					</div>
					<button
						onclick={handleSignOut}
						class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
						title="Sign Out"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
					</button>
				{/if}
			</div>
		</div>
	</aside>
{:else}
	<!-- Minimal top bar for unauthenticated pages -->
	<nav class="sticky top-0 z-50 border-b border-[#2a2b2e] bg-[#151518]/80 backdrop-blur-xl">
		<div class="max-w-7xl mx-auto px-6 flex justify-between h-16 items-center">
			<a href="/" class="flex items-center gap-2.5 group">
				<div class="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
					<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
					</svg>
				</div>
				<span class="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Synapse</span>
			</a>
			<div class="flex items-center gap-3">
				<a href="/auth/login" class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-emerald-400 transition-colors">Login</a>
				<a href="/auth/register" class="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">Get Started</a>
			</div>
		</div>
	</nav>
{/if}
