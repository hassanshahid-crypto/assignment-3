<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>AuthApp - Secure Authentication</title>
</svelte:head>

<div class="relative overflow-hidden">
	<!-- Decorative background blobs -->
	<div class="absolute top-0 left-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
	<div class="absolute top-20 right-1/4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style="animation-delay: 1s;"></div>
	<div class="absolute -bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style="animation-delay: 2s;"></div>

	<!-- Hero Section -->
	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36">
		<div class="text-center">
			<div class="animate-fade-in-up">
				<span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-700 mb-8">
					<span class="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
					SvelteKit + Auth.js + PostgreSQL
				</span>
			</div>
			<h1 class="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 animate-fade-in-up stagger-1">
				Secure Authentication
				<br />
				<span class="gradient-text">Made Simple</span>
			</h1>
			<p class="mt-8 text-lg sm:text-xl leading-8 text-gray-500 max-w-2xl mx-auto animate-fade-in-up stagger-2">
				A full-stack authentication system with role-based access control,
				database sessions, and a beautifully crafted UI.
			</p>
			<div class="mt-12 flex items-center justify-center gap-x-5 animate-fade-in-up stagger-3">
				{#if data.session?.user}
					<a
						href="/dashboard"
						class="btn-shine group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300"
					>
						Go to Dashboard
						<svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
					</a>
				{:else}
					<a
						href="/auth/register"
						class="btn-shine group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300"
					>
						Get Started Free
						<svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
					</a>
					<a
						href="/auth/login"
						class="group inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors duration-300"
					>
						Sign In
						<svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
		<div class="text-center mb-16 animate-fade-in-up stagger-3">
			<h2 class="text-3xl font-bold text-gray-900">Everything You Need</h2>
			<p class="mt-3 text-gray-500">Built with modern tools and best practices</p>
		</div>
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Card 1 -->
			<div class="card-hover group bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-100/80 animate-fade-in-up stagger-1">
				<div class="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white mb-6 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
					<svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900 mb-2">Database Sessions</h3>
				<p class="text-gray-500 leading-relaxed">Secure server-side sessions stored in PostgreSQL. No JWT tokens exposed in cookies.</p>
			</div>

			<!-- Card 2 -->
			<div class="card-hover group bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-100/80 animate-fade-in-up stagger-2">
				<div class="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white mb-6 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-300">
					<svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900 mb-2">Role-Based Access</h3>
				<p class="text-gray-500 leading-relaxed">Fine-grained RBAC with user and admin roles, enforced server-side with middleware.</p>
			</div>

			<!-- Card 3 -->
			<div class="card-hover group bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-100/80 animate-fade-in-up stagger-3">
				<div class="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white mb-6 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow duration-300">
					<svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
					</svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900 mb-2">PostgreSQL + Drizzle</h3>
				<p class="text-gray-500 leading-relaxed">Type-safe database queries with Drizzle ORM for reliable, performant data storage.</p>
			</div>
		</div>
	</div>
</div>
