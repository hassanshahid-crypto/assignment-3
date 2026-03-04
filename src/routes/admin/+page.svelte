<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard - AuthApp</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<!-- Header -->
	<div class="mb-10 animate-fade-in-up">
		<div class="flex items-center gap-4 mb-2">
			<div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
				<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</div>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
				<p class="text-gray-500">Manage users and monitor system activity.</p>
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

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
		<div class="card-hover bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 p-6 animate-fade-in-up stagger-1">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm font-medium text-gray-500 mb-1">Total Users</div>
					<div class="text-3xl font-bold text-gray-900">{data.stats.totalUsers}</div>
				</div>
				<div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
					<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
				</div>
			</div>
		</div>

		<div class="card-hover bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 p-6 animate-fade-in-up stagger-2">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm font-medium text-gray-500 mb-1">Admins</div>
					<div class="text-3xl font-bold text-purple-600">{data.stats.adminCount}</div>
				</div>
				<div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
					<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
				</div>
			</div>
		</div>

		<div class="card-hover bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 p-6 animate-fade-in-up stagger-3">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm font-medium text-gray-500 mb-1">Active Sessions</div>
					<div class="text-3xl font-bold text-indigo-600">{data.stats.activeSessions}</div>
				</div>
				<div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
					<svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
				</div>
			</div>
		</div>

		<div class="card-hover bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 p-6 animate-fade-in-up stagger-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm font-medium text-gray-500 mb-1">New Users (7d)</div>
					<div class="text-3xl font-bold text-emerald-600">{data.stats.newUsers7d}</div>
				</div>
				<div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
					<svg class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Users Table -->
	<div class="bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 overflow-hidden animate-fade-in-up stagger-5">
		<div class="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
					<svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
				</div>
				<h2 class="text-lg font-bold text-gray-900">All Users</h2>
			</div>
			<span class="text-sm text-gray-500">{data.users.length} total</span>
		</div>
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="border-b border-gray-100 bg-gray-50/50">
						<th class="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
						<th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
						<th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
						<th class="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#each data.users as user, i}
						<tr class="table-row-hover" style="animation: fade-in-up 0.4s ease-out {0.05 * i}s both;">
							<td class="px-8 py-5 whitespace-nowrap">
								<div class="flex items-center gap-4">
									<div class="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br {user.role === 'admin' ? 'from-purple-400 to-purple-600' : 'from-indigo-400 to-indigo-600'} flex items-center justify-center shadow-sm">
										<span class="text-sm font-bold text-white">
											{(user.name || user.email)?.[0]?.toUpperCase() ?? '?'}
										</span>
									</div>
									<div>
										<div class="text-sm font-semibold text-gray-900">{user.name || 'No name'}</div>
										<div class="text-xs text-gray-500">{user.email}</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-5 whitespace-nowrap">
								<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide {user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}">
									{user.role}
								</span>
							</td>
							<td class="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
								{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
							</td>
							<td class="px-8 py-5 whitespace-nowrap text-right">
								{#if user.id !== data.currentUserId}
									<div class="flex items-center justify-end gap-2">
										<form method="POST" action="?/changeRole" use:enhance>
											<input type="hidden" name="userId" value={user.id} />
											<input type="hidden" name="role" value={user.role === 'admin' ? 'user' : 'admin'} />
											<button
												type="submit"
												class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold {user.role === 'admin'
													? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100'
													: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100'} transition-all duration-200 cursor-pointer"
											>
												{#if user.role === 'admin'}
													<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
													Demote
												{:else}
													<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
													Promote
												{/if}
											</button>
										</form>
										<form
											method="POST"
											action="?/deleteUser"
											use:enhance={() => {
												if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
													return async () => {};
												}
												return async ({ update }) => {
													await update();
												};
											}}
										>
											<input type="hidden" name="userId" value={user.id} />
											<button
												type="submit"
												class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 transition-all duration-200 cursor-pointer"
											>
												<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
												Delete
											</button>
										</form>
									</div>
								{:else}
									<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-gray-50 border border-gray-100">
										<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
										You
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
