<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport } from 'ai';
	import { onMount, onDestroy, tick } from 'svelte';
	import { marked } from 'marked';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';

	marked.use({
		breaks: true,
		gfm: true,
		renderer: {
			code({ text, lang }: { text: string; lang?: string }) {
				const language = lang && hljs.getLanguage(lang) ? lang : undefined;
				const highlighted = language
					? hljs.highlight(text, { language }).value
					: hljs.highlightAuto(text).value;
				const langLabel = language || 'code';
				return `<div class="code-block-wrapper relative group/code"><div class="code-block-header flex items-center justify-between px-4 py-1.5 bg-[#161619] border-b border-[#2a2b2e] rounded-t-xl"><span class="text-[10px] font-mono text-gray-500 uppercase">${langLabel}</span><button onclick="navigator.clipboard.writeText(this.closest('.code-block-wrapper').querySelector('code').textContent)" class="text-[10px] text-gray-500 hover:text-emerald-400 transition-colors opacity-0 group-hover/code:opacity-100">Copy</button></div><pre class="!mt-0 !rounded-t-none"><code class="hljs language-${langLabel}">${highlighted}</code></pre></div>`;
			}
		}
	});

	function renderWithCitations(markdown: string): string {
		const html = marked.parse(markdown) as string;
		return html.replace(
			/\[Source\s+(\d+)(?::\s*([^\]]*))?\]/g,
			(_match, num, detail) => {
				const tooltip = detail ? detail.trim() : `Source ${num}`;
				return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/25 text-[11px] font-medium text-cyan-400 cursor-help align-baseline" title="${tooltip}"><svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>${num}</span>`;
			}
		);
	}

	let inputValue = $state('');
	let editingMessageId = $state<string | null>(null);
	let editText = $state('');

	// File upload state (inline with message)
	let selectedFile = $state<File | null>(null);
	let fileContent = $state<string>('');
	let fileLoading = $state(false);
	let fileError = $state('');
	let fileInputEl: HTMLInputElement | undefined = $state();

	// Chat history state
	let chatList = $state<{ id: string; title: string; updatedAt: string }[]>([]);
	let activeChatId = $state<string | null>(null);
	let sidebarOpen = $state(true);
	let loadingHistory = $state(false);

	// Sidebar tab: 'chats' or 'documents'
	let sidebarTab = $state<'chats' | 'documents'>('chats');

	// Documents state
	let documents = $state<any[]>([]);
	let docUploading = $state(false);
	let docError = $state('');
	let docSuccess = $state('');
	let docFileInput: HTMLInputElement | undefined = $state();
	let docSelectedFile = $state<File | null>(null);

	function handleDocFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		docSelectedFile = input.files?.[0] ?? null;
	}

	// Auto-scroll
	let messagesContainer: HTMLDivElement | undefined = $state();
	let scrollObserver: MutationObserver | undefined;

	// ============ BRANCH TREE SYSTEM ============
	interface BranchVersion {
		messages: Array<{ role: string; text: string }>;
		subBranches: Record<number, BranchData>;
	}

	interface BranchData {
		versions: BranchVersion[];
		currentIndex: number;
	}

	let branches = $state<Map<number, BranchData>>(new Map());
	let pendingBranchIndex = $state<number | null>(null);

	function saveCurrentBranch(msgIndex: number) {
		const bd = branches.get(msgIndex);
		if (!bd) return;

		const msgs: Array<{ role: string; text: string }> = [];
		for (let j = msgIndex; j < chat.messages.length; j++) {
			msgs.push({ role: chat.messages[j].role, text: getMessageText(chat.messages[j].parts) });
		}

		const subBranches: Record<number, BranchData> = {};
		for (const [key, val] of branches.entries()) {
			if (key > msgIndex) {
				subBranches[key] = val;
			}
		}

		bd.versions[bd.currentIndex] = { messages: msgs, subBranches };
	}

	function loadBranchVersion(msgIndex: number, versionIndex: number) {
		const bd = branches.get(msgIndex);
		if (!bd || !bd.versions[versionIndex]) return;

		const version = bd.versions[versionIndex];

		for (const key of [...branches.keys()]) {
			if (key > msgIndex) branches.delete(key);
		}

		if (version.subBranches) {
			for (const [key, val] of Object.entries(version.subBranches)) {
				branches.set(Number(key), val);
			}
		}

		const prior = chat.messages.slice(0, msgIndex);
		const loaded = version.messages.map((m) => ({
			id: crypto.randomUUID(),
			role: m.role as 'user' | 'assistant',
			parts: [{ type: 'text' as const, text: m.text }]
		}));

		chat = createChatInstance();
		chat.messages = [...prior, ...loaded];
		branches = new Map(branches);
	}

	function getBranchInfo(msgIndex: number): { total: number; current: number } | null {
		const bd = branches.get(msgIndex);
		if (!bd || bd.versions.length <= 1) return null;
		return { total: bd.versions.length, current: bd.currentIndex + 1 };
	}

	function navigateBranch(msgIndex: number, direction: -1 | 1) {
		const bd = branches.get(msgIndex);
		if (!bd) return;
		const newIndex = bd.currentIndex + direction;
		if (newIndex < 0 || newIndex >= bd.versions.length) return;

		saveCurrentBranch(msgIndex);
		bd.currentIndex = newIndex;
		loadBranchVersion(msgIndex, newIndex);
		scrollToBottom();
	}

	// ============ CHAT SDK ============
	let chat = $state<Chat>(createChatInstance());

	function createChatInstance(): Chat {
		return new Chat({
			transport: new DefaultChatTransport({
				api: '/api/chat',
				body: () => ({ chatId: activeChatId })
			}),
			onFinish({ message }) {
				if (message.role === 'assistant') {
					if (pendingBranchIndex !== null) {
						const bd = branches.get(pendingBranchIndex);
						if (bd) {
							const msgs: Array<{ role: string; text: string }> = [];
							for (let j = pendingBranchIndex; j < chat.messages.length; j++) {
								msgs.push({
									role: chat.messages[j].role,
									text: getMessageText(chat.messages[j].parts)
								});
							}
							bd.versions.push({ messages: msgs, subBranches: {} });
							bd.currentIndex = bd.versions.length - 1;
							branches = new Map(branches);
						}
						pendingBranchIndex = null;
					}
					loadChatList();
				}
			}
		});
	}

	function resetChatInstance() {
		branches = new Map();
		pendingBranchIndex = null;
		editingMessageId = null;
		editText = '';
		chat = createChatInstance();
	}

	const isBusy = $derived(chat.status === 'submitted' || chat.status === 'streaming');

	// ============ FILE UPLOAD (inline) ============
	const allowedExtensions = ['.txt', '.md', '.csv', '.json', '.js', '.ts', '.py', '.html', '.css', '.xml', '.log', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bat', '.sql', '.env', '.svelte', '.jsx', '.tsx', '.vue', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.php'];
	const maxFileSize = 5 * 1024 * 1024;

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		fileError = '';
		if (file.size > maxFileSize) {
			fileError = 'File too large (max 5MB)';
			if (fileInputEl) fileInputEl.value = '';
			return;
		}
		const ext = '.' + file.name.split('.').pop()?.toLowerCase();
		if (!allowedExtensions.includes(ext)) {
			fileError = `Unsupported file type.`;
			if (fileInputEl) fileInputEl.value = '';
			return;
		}
		selectedFile = file;
		fileLoading = true;
		const reader = new FileReader();
		reader.onload = () => { fileContent = reader.result as string; fileLoading = false; };
		reader.onerror = () => { fileError = 'Failed to read file'; selectedFile = null; fileLoading = false; };
		reader.readAsText(file);
	}

	function removeFile() {
		selectedFile = null; fileContent = ''; fileError = '';
		if (fileInputEl) fileInputEl.value = '';
	}

	// ============ DOCUMENTS (RAG knowledge base) ============
	async function loadDocuments() {
		try {
			const res = await fetch('/api/documents');
			if (res.ok) {
				const data = await res.json();
				documents = data.documents;
			}
		} catch { /* ignore */ }
	}

	async function handleDocUpload(e: Event) {
		e.preventDefault();
		docError = '';
		docSuccess = '';

		if (!docSelectedFile) { docError = 'Please select a file'; return; }

		docUploading = true;
		try {
			const formData = new FormData();
			formData.append('file', docSelectedFile);

			const res = await fetch('/api/documents', { method: 'POST', body: formData });
			if (res.ok) {
				const data = await res.json();
				docSuccess = `"${data.document.name}" - ${data.document.chunks} chunks`;
				docSelectedFile = null;
				if (docFileInput) docFileInput.value = '';
				await loadDocuments();
			} else {
				const data = await res.json().catch(() => null);
				docError = data?.message || 'Upload failed';
			}
		} catch {
			docError = 'Upload failed. Check embedding service.';
		} finally {
			docUploading = false;
		}
	}

	async function deleteDocument(id: string) {
		try {
			const res = await fetch('/api/documents', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ documentId: id })
			});
			if (res.ok) await loadDocuments();
		} catch { /* ignore */ }
	}

	// ============ AUTO-SCROLL ============
	function setupScrollObserver() {
		if (scrollObserver) scrollObserver.disconnect();
		if (!messagesContainer) return;
		scrollObserver = new MutationObserver(() => {
			if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
		});
		scrollObserver.observe(messagesContainer, { childList: true, subtree: true, characterData: true });
	}

	$effect(() => { if (messagesContainer) setupScrollObserver(); });
	onDestroy(() => { if (scrollObserver) scrollObserver.disconnect(); });

	function scrollToBottom() {
		tick().then(() => { if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight; });
	}

	// ============ CHAT LIST ============
	onMount(() => { loadChatList(); loadDocuments(); });

	async function loadChatList() {
		try {
			const res = await fetch('/api/chats');
			if (res.ok) chatList = await res.json();
		} catch { /* ignore */ }
	}

	async function createNewChat() {
		try {
			const res = await fetch('/api/chats', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			if (res.ok) {
				const newChat = await res.json();
				activeChatId = newChat.id;
				resetChatInstance();
				await loadChatList();
				sidebarTab = 'chats';
			}
		} catch { /* ignore */ }
	}

	async function selectChat(chatId: string) {
		if (chatId === activeChatId) return;
		loadingHistory = true;
		activeChatId = chatId;
		resetChatInstance();
		try {
			const res = await fetch(`/api/chats/${chatId}`);
			if (res.ok) {
				const data = await res.json();
				chat.messages = data.messages.map((m: { id: string; role: string; content: string }) => ({
					id: m.id, role: m.role, parts: [{ type: 'text', text: m.content }]
				}));
				scrollToBottom();
			}
		} catch { /* ignore */ } finally { loadingHistory = false; }
	}

	async function deleteChat(chatId: string, e: Event) {
		e.stopPropagation();
		try {
			await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
			chatList = chatList.filter((c) => c.id !== chatId);
			if (activeChatId === chatId) { activeChatId = null; resetChatInstance(); }
		} catch { /* ignore */ }
	}

	// ============ MESSAGE HANDLERS ============
	async function handleSubmit(e: Event) {
		e.preventDefault();
		const text = inputValue.trim();
		if (!text && !selectedFile) return;

		if (!activeChatId) {
			try {
				const titleText = text || (selectedFile ? selectedFile.name : 'New Chat');
				const res = await fetch('/api/chats', {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: titleText.slice(0, 50) + (titleText.length > 50 ? '...' : '') })
				});
				if (res.ok) {
					const newChat = await res.json();
					activeChatId = newChat.id;
					await loadChatList();
				}
			} catch { /* ignore */ }
		}

		let messageText = text;
		if (selectedFile && fileContent) {
			const fileHeader = `[Uploaded Document: ${selectedFile.name}]`;
			messageText = messageText
				? `${fileHeader}\n\`\`\`\n${fileContent}\n\`\`\`\n\n${messageText}`
				: `${fileHeader}\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease analyze this document.`;
			removeFile();
		}

		inputValue = '';
		await chat.sendMessage({ text: messageText });
	}

	function getMessageText(parts: Array<{ type: string; text?: string }>): string {
		return parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
	}

	function stripDocumentContent(text: string): string {
		const match = text.match(/^\[Uploaded Document: (.+?)\]\n```\n[\s\S]*?\n```\n\n/);
		if (!match) return text;
		return text.slice(match[0].length);
	}

	function getAttachedFilename(parts: Array<{ type: string; text?: string }>): string | null {
		const text = getMessageText(parts);
		const match = text.match(/^\[Uploaded Document: (.+?)\]/);
		return match ? match[1] : null;
	}

	function startEdit(messageId: string, currentText: string) {
		editingMessageId = messageId;
		editText = currentText;
	}

	function cancelEdit() {
		editingMessageId = null;
		editText = '';
	}

	async function saveEdit(messageId: string) {
		const text = editText.trim();
		if (!text) return;
		editingMessageId = null;
		editText = '';

		const msgIndex = chat.messages.findIndex((m) => m.id === messageId);
		if (msgIndex < 0) return;

		if (!branches.has(msgIndex)) {
			const currentMsgs: Array<{ role: string; text: string }> = [];
			for (let j = msgIndex; j < chat.messages.length; j++) {
				currentMsgs.push({ role: chat.messages[j].role, text: getMessageText(chat.messages[j].parts) });
			}
			const subBranches: Record<number, BranchData> = {};
			for (const [key, val] of branches.entries()) {
				if (key > msgIndex) subBranches[key] = val;
			}
			branches.set(msgIndex, {
				versions: [{ messages: currentMsgs, subBranches }],
				currentIndex: 0
			});
		} else {
			saveCurrentBranch(msgIndex);
		}

		for (const key of [...branches.keys()]) {
			if (key > msgIndex) branches.delete(key);
		}
		branches = new Map(branches);

		const priorMessages = chat.messages.slice(0, msgIndex).map((m) => ({
			id: m.id, role: m.role, parts: [...m.parts]
		}));

		pendingBranchIndex = msgIndex;
		chat = createChatInstance();
		chat.messages = priorMessages;
		await tick();
		await chat.sendMessage({ text });
	}

	async function handleRegenerate(msgIndex: number) {
		if (msgIndex < 0 || msgIndex >= chat.messages.length) return;

		if (!branches.has(msgIndex)) {
			const currentMsgs: Array<{ role: string; text: string }> = [];
			for (let j = msgIndex; j < chat.messages.length; j++) {
				currentMsgs.push({ role: chat.messages[j].role, text: getMessageText(chat.messages[j].parts) });
			}
			const subBranches: Record<number, BranchData> = {};
			for (const [key, val] of branches.entries()) {
				if (key > msgIndex) subBranches[key] = val;
			}
			branches.set(msgIndex, {
				versions: [{ messages: currentMsgs, subBranches }],
				currentIndex: 0
			});
		} else {
			saveCurrentBranch(msgIndex);
		}

		for (const key of [...branches.keys()]) {
			if (key > msgIndex) branches.delete(key);
		}
		branches = new Map(branches);

		const userMsg = chat.messages[msgIndex - 1];
		const userText = getMessageText(userMsg.parts);
		const priorMessages = chat.messages.slice(0, msgIndex - 1).map((m) => ({
			id: m.id, role: m.role, parts: [...m.parts]
		}));

		pendingBranchIndex = msgIndex;
		chat = createChatInstance();
		chat.messages = priorMessages;
		await tick();
		await chat.sendMessage({ text: userText });
	}

	function handleEditKeydown(e: KeyboardEvent, messageId: string) {
		if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(messageId); }
		else if (e.key === 'Escape') cancelEdit();
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		if (diff < 86400000) return 'Today';
		if (diff < 172800000) return 'Yesterday';
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<svelte:head>
	<title>Synapse AI - Chat</title>
</svelte:head>

<div class="h-screen flex bg-[#1a1b1e]">
	<!-- Sidebar -->
	<div
		class="flex-shrink-0 transition-all duration-300 border-r border-[#2a2b2e] bg-[#161619] {sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}"
	>
		<div class="w-72 flex flex-col h-full">
			<!-- New Chat Button -->
			<div class="p-3 border-b border-[#2a2b2e]">
				<button
					onclick={createNewChat}
					class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30 hover:-translate-y-0.5 transition-all duration-300"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
					New Chat
				</button>
			</div>

			<!-- Tab Switcher -->
			<div class="flex border-b border-[#2a2b2e]">
				<button
					onclick={() => (sidebarTab = 'chats')}
					class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200
						{sidebarTab === 'chats' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-gray-500 hover:text-gray-300'}"
				>
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
					Chats
				</button>
				<button
					onclick={() => (sidebarTab = 'documents')}
					class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200
						{sidebarTab === 'documents' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-gray-500 hover:text-gray-300'}"
				>
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
					Knowledge
				</button>
			</div>

			<!-- Tab Content -->
			{#if sidebarTab === 'chats'}
				<div class="flex-1 overflow-y-auto p-2 space-y-0.5">
					{#if chatList.length === 0}
						<p class="text-xs text-gray-600 text-center mt-8 px-4">No conversations yet</p>
					{/if}
					{#each chatList as chatItem}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							onclick={() => selectChat(chatItem.id)}
							class="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2.5 group cursor-pointer {activeChatId === chatItem.id ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-gray-400 hover:bg-[#2a2b2e]/60 hover:text-gray-200 border border-transparent'}"
						>
							<svg class="h-4 w-4 flex-shrink-0 {activeChatId === chatItem.id ? 'text-emerald-400' : 'text-gray-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
							</svg>
							<div class="min-w-0 flex-1">
								<span class="truncate text-[13px] block">{chatItem.title}</span>
								<span class="text-[10px] text-gray-600">{formatDate(chatItem.updatedAt)}</span>
							</div>
							<button
								onclick={(e) => deleteChat(chatItem.id, e)}
								class="ml-auto opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
								title="Delete chat"
							>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Documents / Knowledge Base Tab -->
				<div class="flex-1 overflow-y-auto p-3 space-y-3">
					<!-- Upload Form -->
					<form onsubmit={handleDocUpload} class="space-y-2">
						<input bind:this={docFileInput} type="file" accept=".txt,.md,.csv,.text" onchange={handleDocFileSelect} class="hidden" />
						<button
							type="button"
							onclick={() => docFileInput?.click()}
							class="w-full flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-[#3a3b3e] hover:border-cyan-500/40 bg-[#1a1b1e]/50 text-gray-500 hover:text-cyan-400 transition-all duration-200 cursor-pointer"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
							<span class="text-xs font-medium">Drop or click to upload</span>
							<span class="text-[10px] text-gray-600">.txt, .md, .csv</span>
						</button>
						{#if docSelectedFile}
							<div class="flex items-center gap-2 px-2 py-2 rounded-lg bg-[#1a1b1e] border border-[#3a3b3e]">
								<svg class="h-4 w-4 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
								<span class="text-xs text-gray-300 truncate flex-1">{docSelectedFile.name}</span>
								<button
									type="button"
									onclick={() => { docSelectedFile = null; if (docFileInput) docFileInput.value = ''; }}
									class="p-0.5 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
								>
									<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
								</button>
								<button
									type="submit"
									disabled={docUploading}
									class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-all flex items-center gap-1.5 flex-shrink-0"
								>
									{#if docUploading}
										<svg class="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
									{/if}
									Embed
								</button>
							</div>
						{/if}
					</form>

					{#if docError}
						<div class="rounded-lg bg-red-900/20 border border-red-800/30 px-3 py-2 text-xs text-red-400">{docError}</div>
					{/if}
					{#if docSuccess}
						<div class="rounded-lg bg-emerald-900/20 border border-emerald-800/30 px-3 py-2 text-xs text-emerald-400">{docSuccess}</div>
					{/if}

					<!-- Document List -->
					<div class="space-y-1">
						<div class="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1">Knowledge Base ({documents.length})</div>
						{#if documents.length === 0}
							<p class="text-xs text-gray-600 text-center py-6">No documents uploaded</p>
						{/if}
						{#each documents as doc}
							<div class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#2a2b2e]/50 group transition-colors">
								<div class="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
									<svg class="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
								</div>
								<div class="min-w-0 flex-1">
									<div class="text-xs font-medium text-gray-300 truncate">{doc.name}</div>
									<div class="text-[10px] text-gray-600">{doc.type}</div>
								</div>
								<button
									onclick={() => deleteDocument(doc.id)}
									class="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
									title="Remove"
								>
									<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Main Chat Area -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Header -->
		<div class="px-5 py-3 flex items-center gap-3 border-b border-[#2a2b2e] bg-[#1a1b1e]/80 backdrop-blur-sm">
			<button onclick={() => (sidebarOpen = !sidebarOpen)} class="p-2 rounded-lg text-gray-400 hover:bg-[#2a2b2e] hover:text-white transition-colors" title="{sidebarOpen ? 'Hide' : 'Show'} sidebar">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
			</button>
			<div class="flex items-center gap-2.5">
				<div class="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
					<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
				</div>
				<div>
					<h1 class="text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Synapse AI</h1>
					<p class="text-[10px] text-gray-500">Powered by Gemini &middot; RAG-enhanced</p>
				</div>
			</div>
			{#if documents.length > 0}
				<div class="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
					<div class="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
					<span class="text-[10px] font-medium text-cyan-400">{documents.length} doc{documents.length !== 1 ? 's' : ''} indexed</span>
				</div>
			{/if}
		</div>

		<!-- Chat Messages -->
		<div bind:this={messagesContainer} class="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
			{#if loadingHistory}
				<div class="flex items-center justify-center h-32 text-gray-500">
					<svg class="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
				</div>
			{:else if chat.messages.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-gray-500">
					<div class="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
						<svg class="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
					</div>
					<p class="text-base font-semibold text-gray-200 mb-1">What can I help you with?</p>
					<p class="text-xs text-gray-600 max-w-sm text-center">Ask anything, or upload documents to the Knowledge tab for RAG-powered answers with citations.</p>
				</div>
			{/if}

			{#each chat.messages as message, i}
				{#if message.role === 'user'}
					<!-- User Message -->
					<div class="flex justify-end gap-3 group">
						<div class="max-w-[70%] relative">
							{#if editingMessageId === message.id}
								<div class="bg-[#2a2b2e] rounded-2xl rounded-br-sm px-4 py-3 border border-[#3a3b3e]">
									<textarea
										bind:value={editText}
										onkeydown={(e) => handleEditKeydown(e, message.id)}
										class="w-full bg-[#1a1b1e] text-gray-200 text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 border border-[#3a3b3e]"
										rows="3"
									></textarea>
									<div class="flex justify-end gap-2 mt-2">
										<button onclick={cancelEdit} class="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#3a3b3e] rounded-lg transition-colors">Cancel</button>
										<button onclick={() => saveEdit(message.id)} disabled={!editText.trim()} class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50">Save & Submit</button>
									</div>
								</div>
							{:else}
								<button
									onclick={() => startEdit(message.id, stripDocumentContent(getMessageText(message.parts)))}
									disabled={isBusy}
									class="absolute -left-9 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-600 hover:text-gray-300 disabled:opacity-0"
									title="Edit message"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
								</button>
								<div class="bg-gradient-to-br from-emerald-600/90 to-cyan-600/90 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg shadow-emerald-900/20">
									{#if getAttachedFilename(message.parts)}
										<div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 text-xs text-white/90 mb-2">
											<svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
											{getAttachedFilename(message.parts)}
										</div>
									{/if}
									{#if stripDocumentContent(getMessageText(message.parts))}
										<div class="text-sm whitespace-pre-wrap leading-relaxed">{stripDocumentContent(getMessageText(message.parts))}</div>
									{/if}
								</div>
								{#if getBranchInfo(i)}
									{@const info = getBranchInfo(i)!}
									<div class="flex items-center justify-end gap-1 mt-1.5 mr-1 text-xs text-gray-500">
										<button onclick={() => navigateBranch(i, -1)} disabled={isBusy || info.current <= 1} class="p-0.5 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
										</button>
										<span class="tabular-nums select-none">{info.current}/{info.total}</span>
										<button onclick={() => navigateBranch(i, 1)} disabled={isBusy || info.current >= info.total} class="p-0.5 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
										</button>
									</div>
								{/if}
							{/if}
						</div>
						<div class="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-orange-500/20">U</div>
					</div>
				{:else}
					<!-- AI Message -->
					<div class="flex justify-start gap-3">
						<div class="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-emerald-500/20">
							<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
						</div>
						<div class="max-w-[80%]">
							<div class="text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-headings:mt-4 prose-headings:mb-2 prose-p:text-gray-300 prose-p:my-2 prose-strong:text-white prose-ul:my-2 prose-ol:my-2 prose-li:text-gray-300 prose-li:my-0.5 prose-pre:bg-[#0d0d0f] prose-pre:border prose-pre:border-[#2a2b2e] prose-pre:rounded-xl prose-code:text-emerald-400 prose-code:bg-[#0d0d0f] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-a:text-emerald-400">
								{@html renderWithCitations(getMessageText(message.parts))}
							</div>
							<div class="flex items-center gap-2 mt-2">
								<button
									onclick={() => copyToClipboard(getMessageText(message.parts))}
									class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition-colors p-1 rounded"
									title="Copy to clipboard"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
								</button>
								<button
									onclick={() => handleRegenerate(i)}
									disabled={isBusy}
									class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded"
									title="Regenerate"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.985 4.356v4.992" /></svg>
								</button>
								{#if getBranchInfo(i)}
									{@const info = getBranchInfo(i)!}
									<div class="flex items-center gap-1 text-xs text-gray-500">
										<button onclick={() => navigateBranch(i, -1)} disabled={isBusy || info.current <= 1} class="p-0.5 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
										</button>
										<span class="tabular-nums select-none">{info.current}/{info.total}</span>
										<button onclick={() => navigateBranch(i, 1)} disabled={isBusy || info.current >= info.total} class="p-0.5 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			{/each}

			{#if chat.status === 'submitted'}
				<div class="flex justify-start gap-3">
					<div class="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-emerald-500/20">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
					</div>
					<div class="flex items-center gap-1.5 py-2">
						<div class="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
						<div class="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
						<div class="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
					</div>
				</div>
			{/if}

			{#if chat.status === 'error' && chat.error}
				<div class="rounded-xl bg-red-900/20 border border-red-800/30 p-4 flex items-start gap-3">
					<svg class="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
					<p class="text-sm text-red-300">Something went wrong. Please try again.</p>
				</div>
			{/if}
		</div>

		<!-- Input Form -->
		<div class="px-6 pb-5 pt-2 border-t border-[#2a2b2e]/50">
			{#if selectedFile}
				<div class="mb-2 flex items-center gap-2">
					<div class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2a2b2e] border border-[#3a3b3e] text-sm">
						<svg class="h-4 w-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
						<span class="text-gray-300 truncate max-w-[200px]">{selectedFile.name}</span>
						<span class="text-gray-500 text-xs">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
						{#if fileLoading}
							<svg class="animate-spin h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
						{/if}
						<button onclick={removeFile} class="p-0.5 text-gray-500 hover:text-red-400 transition-colors" title="Remove file">
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
						</button>
					</div>
				</div>
			{/if}

			{#if fileError}
				<div class="mb-2 text-xs text-red-400 flex items-center gap-1.5">
					<svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
					{fileError}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="relative flex items-center gap-2">
				<input bind:this={fileInputEl} type="file" accept={allowedExtensions.join(',')} onchange={handleFileSelect} class="hidden" />
				<button
					type="button" onclick={() => fileInputEl?.click()} disabled={isBusy || fileLoading}
					class="p-3 rounded-xl border border-[#3a3b3e] bg-[#2a2b2e] text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
					title="Attach file to message"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
				</button>
				<div class="flex-1 relative">
					<input
						bind:value={inputValue}
						placeholder={selectedFile ? 'Add a message about the document...' : 'Ask Synapse anything...'}
						disabled={isBusy}
						class="w-full rounded-2xl border border-[#3a3b3e] bg-[#202124] px-5 py-4 pr-14 text-sm text-gray-100 placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 disabled:opacity-50"
					/>
					<button
						type="submit" disabled={isBusy || (!inputValue.trim() && !selectedFile)}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-900/20"
					>
						{#if isBusy}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
