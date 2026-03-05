<script lang="ts">
	import { page } from '$app/stores';
	import { signOut } from '@auth/sveltekit/client';

	let { session } = $props<{ session: any }>();
	let mobileMenuOpen = $state(false);

	function isActive(path: string): boolean {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}

	async function handleSignOut() {
		await signOut({ callbackUrl: '/' });
	}
</script>

<nav class="sticky top-0 z-50 animate-fade-in-down border-b border-[#2a2b2e] bg-[#202124]">
	<div class="w-full px-6 sm:px-8 lg:px-12">
		<div class="flex justify-between h-16">
			<div class="flex items-center">
				<a href="/" class="flex items-center gap-2 group">
					<div class="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md group-hover:shadow-emerald-500/25 transition-shadow duration-300">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<span class="text-xl font-bold text-white">AuthApp</span>
				</a>
				<div class="hidden sm:ml-8 sm:flex sm:space-x-1">
					{#if session?.user}
						<a
							href="/dashboard"
							class="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/dashboard') && !isActive('/dashboard/profile') && !isActive('/dashboard/chat')
								? 'bg-[#2a2b2e] text-emerald-400'
								: 'text-gray-300 hover:bg-[#2a2b2e]/60'}"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
								Dashboard
							</span>
						</a>
						<a
							href="/dashboard/profile"
							class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/dashboard/profile')
								? 'bg-[#2a2b2e] text-emerald-400'
								: 'text-gray-300 hover:bg-[#2a2b2e]/60'}"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
								Profile
							</span>
						</a>
						<a
							href="/dashboard/chat"
							class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/dashboard/chat')
								? 'bg-[#2a2b2e] text-emerald-400'
								: 'text-gray-300 hover:bg-[#2a2b2e]/60'}"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
								AI Chat
							</span>
						</a>
						{#if session.user.role === 'admin'}
							<a
								href="/admin"
								class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/admin')
									? 'bg-[#2a2b2e] text-purple-400'
									: 'text-gray-300 hover:bg-[#2a2b2e]/60'}"
							>
								<span class="flex items-center gap-1.5">
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
									Admin
								</span>
							</a>
						{/if}
					{/if}
				</div>
			</div>

			<div class="hidden sm:flex sm:items-center sm:space-x-3">
				{#if session?.user}
					<div class="flex items-center gap-3">
						<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2a2b2e] border border-[#3a3b3e]">
							<div class="h-6 w-6 rounded-full bg-gradient-to-br {session.user.role === 'admin' ? 'from-purple-400 to-purple-600' : 'from-emerald-400 to-emerald-600'} flex items-center justify-center">
								<span class="text-[10px] font-bold text-white">
									{(session.user.name || session.user.email)?.[0]?.toUpperCase() ?? '?'}
								</span>
							</div>
							<span class="text-sm font-medium text-gray-200">
								{session.user.name || session.user.email}
							</span>
							<span
								class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide {session.user.role === 'admin'
									? 'bg-purple-900/50 text-purple-300'
									: 'bg-emerald-900/50 text-emerald-300'}"
							>
								{session.user.role}
							</span>
						</div>
						<button
							onclick={handleSignOut}
							class="group px-4 py-2 text-sm font-medium text-gray-300 bg-[#2a2b2e] border border-[#3a3b3e] rounded-lg hover:border-red-800 hover:text-red-400 transition-all duration-300 cursor-pointer"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
								Sign Out
							</span>
						</button>
					</div>
				{:else}
					<a
						href="/auth/login"
						class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-emerald-400 transition-colors duration-300"
					>
						Login
					</a>
					<a
						href="/auth/register"
						class="btn-shine px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
					>
						Get Started
					</a>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<div class="flex items-center sm:hidden">
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-[#2a2b2e] transition-all duration-300 cursor-pointer"
				>
					<svg class="h-6 w-6 transition-transform duration-300 {mobileMenuOpen ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{#if mobileMenuOpen}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						{/if}
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="sm:hidden border-t border-[#2a2b2e] animate-slide-down">
			<div class="px-3 pt-3 pb-4 space-y-1">
				{#if session?.user}
					<div class="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-[#2a2b2e]">
						<div class="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
							<span class="text-xs font-bold text-white">{(session.user.name || session.user.email)?.[0]?.toUpperCase() ?? '?'}</span>
						</div>
						<div>
							<div class="text-sm font-medium text-white">{session.user.name || 'User'}</div>
							<div class="text-xs text-gray-500">{session.user.email}</div>
						</div>
					</div>
					<a href="/dashboard" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-[#2a2b2e] hover:text-emerald-400 transition-colors">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
						Dashboard
					</a>
					<a href="/dashboard/profile" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-[#2a2b2e] hover:text-emerald-400 transition-colors">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
						Profile
					</a>
					<a href="/dashboard/chat" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-[#2a2b2e] hover:text-emerald-400 transition-colors">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
						AI Chat
					</a>
					{#if session.user.role === 'admin'}
						<a href="/admin" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-[#2a2b2e] hover:text-purple-400 transition-colors">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
							Admin
						</a>
					{/if}
					<hr class="my-2 border-[#3a3b3e]" />
					<button
						onclick={handleSignOut}
						class="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-[#2a2b2e] transition-colors cursor-pointer"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
						Sign Out
					</button>
				{:else}
					<a href="/auth/login" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-[#2a2b2e] transition-colors">Login</a>
					<a href="/auth/register" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-[#2a2b2e] transition-colors">Register</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>
