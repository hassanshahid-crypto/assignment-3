<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport } from 'ai';
	import { onMount, onDestroy, tick } from 'svelte';
	import { marked } from 'marked';

	// Configure marked for safe rendering
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	let inputValue = $state('');
	let editingMessageId = $state<string | null>(null);
	let editText = $state('');

	// File upload state
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

	// Auto-scroll
	let messagesContainer: HTMLDivElement | undefined = $state();
	let scrollObserver: MutationObserver | undefined;

	// Track alternative responses: messageId -> { responses: string[], currentIndex: number }
	let responseAlternatives = $state<Map<string, { responses: string[]; currentIndex: number }>>(
		new Map()
	);

	// Track edit history for user messages
	let editHistory = $state<
		Map<string, { versions: { userText: string; assistantText: string }[]; currentIndex: number }>
	>(new Map());

	let pendingEditMessageId = $state<string | null>(null);

	// Reactive chat instance — recreated when switching chats
	let chat = $state<Chat>(createChatInstance());

	function createChatInstance(): Chat {
		return new Chat({
			transport: new DefaultChatTransport({
				api: '/api/chat',
				body: () => ({ chatId: activeChatId })
			}),
			onFinish({ message }) {
				if (message.role === 'assistant') {
					const text = getMessageText(message.parts);

					const existing = responseAlternatives.get(message.id);
					if (existing) {
						existing.responses.push(text);
						existing.currentIndex = existing.responses.length - 1;
						responseAlternatives = new Map(responseAlternatives);
					}

					if (pendingEditMessageId) {
						const history = editHistory.get(pendingEditMessageId);
						if (history) {
							// Find the new user message — it's the last user message before this assistant response
							const msgIdx = chat.messages.findIndex((m) => m.id === message.id);
							const newUserMsg = msgIdx > 0 ? chat.messages[msgIdx - 1] : null;
							if (newUserMsg && newUserMsg.role === 'user') {
								history.versions.push({
									userText: getMessageText(newUserMsg.parts),
									assistantText: text
								});
								history.currentIndex = history.versions.length - 1;

								// Re-key edit history from old ID to new message ID
								editHistory.delete(pendingEditMessageId);
								editHistory.set(newUserMsg.id, history);
								editHistory = new Map(editHistory);
							}
						}
						pendingEditMessageId = null;
						saveEditHistoryToDB();
					}

					loadChatList();
				}
			}
		});
	}

	function resetChatInstance() {
		responseAlternatives = new Map();
		editHistory = new Map();
		pendingEditMessageId = null;
		editingMessageId = null;
		editText = '';
		chat = createChatInstance();
	}

	const isBusy = $derived(chat.status === 'submitted' || chat.status === 'streaming');

	// File upload handlers
	const allowedExtensions = ['.txt', '.md', '.csv', '.json', '.js', '.ts', '.py', '.html', '.css', '.xml', '.log', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bat', '.sql', '.env', '.svelte', '.jsx', '.tsx', '.vue', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.php'];
	const maxFileSize = 5 * 1024 * 1024; // 5MB

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		fileError = '';

		// Check file size
		if (file.size > maxFileSize) {
			fileError = 'File too large (max 5MB)';
			if (fileInputEl) fileInputEl.value = '';
			return;
		}

		// Check extension
		const ext = '.' + file.name.split('.').pop()?.toLowerCase();
		if (!allowedExtensions.includes(ext)) {
			fileError = `Unsupported file type. Supported: ${allowedExtensions.slice(0, 5).join(', ')}...`;
			if (fileInputEl) fileInputEl.value = '';
			return;
		}

		selectedFile = file;
		fileLoading = true;
		const reader = new FileReader();
		reader.onload = () => {
			fileContent = reader.result as string;
			fileLoading = false;
		};
		reader.onerror = () => {
			fileError = 'Failed to read file';
			selectedFile = null;
			fileLoading = false;
		};
		reader.readAsText(file);
	}

	function removeFile() {
		selectedFile = null;
		fileContent = '';
		fileError = '';
		if (fileInputEl) fileInputEl.value = '';
	}

	function getFileIcon(filename: string): string {
		const ext = filename.split('.').pop()?.toLowerCase() ?? '';
		if (['js', 'ts', 'py', 'java', 'c', 'cpp', 'go', 'rs', 'rb', 'php', 'jsx', 'tsx', 'svelte', 'vue'].includes(ext)) return 'code';
		if (['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'].includes(ext)) return 'config';
		if (['md', 'txt', 'log'].includes(ext)) return 'text';
		if (['csv', 'sql'].includes(ext)) return 'data';
		return 'file';
	}

	// Persist edit history to DB using message index as key (IDs change on edit)
	async function saveEditHistoryToDB() {
		if (!activeChatId || editHistory.size === 0) return;
		try {
			// Convert editHistory (keyed by message ID) to index-based for storage
			const indexBased: Record<
				number,
				{ versions: { userText: string; assistantText: string }[]; currentIndex: number }
			> = {};
			for (const [msgId, data] of editHistory.entries()) {
				const idx = chat.messages.findIndex((m) => m.id === msgId);
				if (idx >= 0) {
					indexBased[idx] = data;
				}
			}
			await fetch(`/api/chats/${activeChatId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ editVersions: indexBased })
			});
		} catch {
			// ignore
		}
	}

	// Restore edit history from DB data
	function restoreEditHistory(
		editVersionsJson: string | null,
		messages: Array<{ id: string; role: string }>
	) {
		editHistory = new Map();
		if (!editVersionsJson) return;
		try {
			const indexBased = JSON.parse(editVersionsJson);
			for (const [idxStr, data] of Object.entries(indexBased)) {
				const idx = parseInt(idxStr);
				if (idx >= 0 && idx < messages.length && messages[idx].role === 'user') {
					editHistory.set(
						messages[idx].id,
						data as {
							versions: { userText: string; assistantText: string }[];
							currentIndex: number;
						}
					);
				}
			}
			editHistory = new Map(editHistory);
		} catch {
			// ignore invalid JSON
		}
	}

	// Auto-scroll: use MutationObserver to detect any DOM changes in the messages container
	function setupScrollObserver() {
		if (scrollObserver) scrollObserver.disconnect();
		if (!messagesContainer) return;

		scrollObserver = new MutationObserver(() => {
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		});

		scrollObserver.observe(messagesContainer, {
			childList: true,
			subtree: true,
			characterData: true
		});
	}

	$effect(() => {
		if (messagesContainer) {
			setupScrollObserver();
		}
	});

	onDestroy(() => {
		if (scrollObserver) scrollObserver.disconnect();
	});

	function scrollToBottom() {
		tick().then(() => {
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		});
	}

	onMount(() => {
		loadChatList();
	});

	async function loadChatList() {
		try {
			const res = await fetch('/api/chats');
			if (res.ok) {
				chatList = await res.json();
			}
		} catch {
			// ignore
		}
	}

	async function createNewChat() {
		try {
			const res = await fetch('/api/chats', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			if (res.ok) {
				const newChat = await res.json();
				activeChatId = newChat.id;
				resetChatInstance();
				await loadChatList();
			}
		} catch {
			// ignore
		}
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
				const mappedMessages = data.messages.map(
					(m: { id: string; role: string; content: string }) => ({
						id: m.id,
						role: m.role,
						parts: [{ type: 'text', text: m.content }]
					})
				);
				chat.messages = mappedMessages;

				// Restore edit history from DB
				restoreEditHistory(data.chat.editVersions, data.messages);

				scrollToBottom();
			}
		} catch {
			// ignore
		} finally {
			loadingHistory = false;
		}
	}

	async function deleteChat(chatId: string, e: Event) {
		e.stopPropagation();
		try {
			await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
			chatList = chatList.filter((c) => c.id !== chatId);
			if (activeChatId === chatId) {
				activeChatId = null;
				resetChatInstance();
			}
		} catch {
			// ignore
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const text = inputValue.trim();
		if (!text && !selectedFile) return;

		// Auto-create chat if none is active
		if (!activeChatId) {
			try {
				const titleText = text || (selectedFile ? selectedFile.name : 'New Chat');
				const res = await fetch('/api/chats', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: titleText.slice(0, 50) + (titleText.length > 50 ? '...' : '') })
				});
				if (res.ok) {
					const newChat = await res.json();
					activeChatId = newChat.id;
					await loadChatList();
				}
			} catch {
				// ignore
			}
		}

		// Build message with file content if attached
		let messageText = text;
		if (selectedFile && fileContent) {
			const fileHeader = `[Uploaded Document: ${selectedFile.name}]`;
			if (messageText) {
				messageText = `${fileHeader}\n\`\`\`\n${fileContent}\n\`\`\`\n\n${messageText}`;
			} else {
				messageText = `${fileHeader}\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease analyze this document.`;
			}
			removeFile();
		}

		inputValue = '';
		await chat.sendMessage({ text: messageText });
	}

	function getMessageText(parts: Array<{ type: string; text?: string }>): string {
		return parts
			.filter((p) => p.type === 'text')
			.map((p) => p.text ?? '')
			.join('');
	}

	// Strip embedded document content for display, keeping just filename + user text
	function stripDocumentContent(text: string): string {
		const docRegex = /^\[Uploaded Document: (.+?)\]\n```\n[\s\S]*?\n```\n\n/;
		const match = text.match(docRegex);
		if (!match) return text;
		const remainder = text.slice(match[0].length);
		return remainder;
	}

	// Extract attached filename from message text (if any)
	function getAttachedFilename(messageId: string, parts: Array<{ type: string; text?: string }>): string | null {
		let text: string;
		const history = editHistory.get(messageId);
		if (history && history.currentIndex < history.versions.length) {
			text = history.versions[history.currentIndex].userText;
		} else {
			text = getMessageText(parts);
		}
		const match = text.match(/^\[Uploaded Document: (.+?)\]/);
		return match ? match[1] : null;
	}

	function getUserDisplayText(
		messageId: string,
		parts: Array<{ type: string; text?: string }>
	): string {
		const history = editHistory.get(messageId);
		if (history && history.currentIndex < history.versions.length) {
			return stripDocumentContent(history.versions[history.currentIndex].userText);
		}
		return stripDocumentContent(getMessageText(parts));
	}

	function getAssistantDisplayText(
		messageIndex: number,
		parts: Array<{ type: string; text?: string }>
	): string {
		if (messageIndex > 0) {
			const prevMsg = chat.messages[messageIndex - 1];
			if (prevMsg && prevMsg.role === 'user') {
				const history = editHistory.get(prevMsg.id);
				if (history && history.currentIndex < history.versions.length) {
					const isLatestVersion = history.currentIndex === history.versions.length - 1;
					if (!isLatestVersion) {
						return history.versions[history.currentIndex].assistantText;
					}
				}
			}
		}
		return getMessageText(parts);
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

		const userMsg = chat.messages[msgIndex];
		const currentUserText = getMessageText(userMsg.parts);

		const assistantMsg =
			msgIndex + 1 < chat.messages.length ? chat.messages[msgIndex + 1] : null;
		const currentAssistantText = assistantMsg ? getMessageText(assistantMsg.parts) : '';

		// Save current version to edit history
		const history = editHistory.get(messageId);
		if (history) {
			history.versions[history.currentIndex] = {
				userText: currentUserText,
				assistantText: currentAssistantText
			};
		} else {
			editHistory.set(messageId, {
				versions: [{ userText: currentUserText, assistantText: currentAssistantText }],
				currentIndex: 0
			});
		}
		editHistory = new Map(editHistory);

		// Keep only messages BEFORE the edited one
		const priorMessages = chat.messages.slice(0, msgIndex).map((m) => ({
			id: m.id,
			role: m.role,
			parts: [...m.parts]
		}));

		// Create a completely fresh Chat instance to nuke all internal SDK state
		pendingEditMessageId = messageId;
		chat = createChatInstance();
		chat.messages = priorMessages;
		await tick();

		// Send the edited text as a brand new message
		await chat.sendMessage({ text });
	}

	function handleEditKeydown(e: KeyboardEvent, messageId: string) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			saveEdit(messageId);
		} else if (e.key === 'Escape') {
			cancelEdit();
		}
	}

	function navigateEditVersion(messageId: string, direction: -1 | 1) {
		const history = editHistory.get(messageId);
		if (!history) return;
		const newIndex = history.currentIndex + direction;
		if (newIndex < 0 || newIndex >= history.versions.length) return;
		history.currentIndex = newIndex;
		editHistory = new Map(editHistory);
	}

	function getEditInfo(messageId: string): { total: number; current: number } | null {
		const history = editHistory.get(messageId);
		if (!history || history.versions.length <= 1) return null;
		return { total: history.versions.length, current: history.currentIndex + 1 };
	}

	async function handleRegenerate(messageId: string) {
		const message = chat.messages.find((m) => m.id === messageId);
		if (!message) return;
		const currentText = getMessageText(message.parts);

		const existing = responseAlternatives.get(messageId);
		if (existing) {
			const lastSaved = existing.responses[existing.currentIndex];
			if (lastSaved !== currentText) {
				existing.responses[existing.currentIndex] = currentText;
			}
		} else {
			responseAlternatives.set(messageId, { responses: [currentText], currentIndex: 0 });
			responseAlternatives = new Map(responseAlternatives);
		}

		await chat.regenerate({ messageId });
	}

	function navigateResponse(messageId: string, direction: -1 | 1) {
		const alt = responseAlternatives.get(messageId);
		if (!alt) return;
		const newIndex = alt.currentIndex + direction;
		if (newIndex < 0 || newIndex >= alt.responses.length) return;
		alt.currentIndex = newIndex;
		responseAlternatives = new Map(responseAlternatives);

		const message = chat.messages.find((m) => m.id === messageId);
		if (message) {
			const textPart = message.parts.find((p) => p.type === 'text') as
				| { type: string; text?: string }
				| undefined;
			if (textPart) {
				textPart.text = alt.responses[newIndex];
			}
		}
	}

	function getAltInfo(messageId: string): { total: number; current: number } | null {
		const alt = responseAlternatives.get(messageId);
		if (!alt || alt.responses.length <= 1) return null;
		return { total: alt.responses.length, current: alt.currentIndex + 1 };
	}

	// Hide messages that belong to a newer branch when viewing an older edit version
	function shouldShowMessage(messageIndex: number): boolean {
		for (let i = 0; i < messageIndex; i++) {
			const msg = chat.messages[i];
			if (msg.role === 'user') {
				const history = editHistory.get(msg.id);
				if (history && history.currentIndex < history.versions.length - 1) {
					// This user message is showing an older version.
					// Only the user msg (i) and its paired assistant response (i+1) should show.
					// Everything after i+1 belongs to the latest branch — hide it.
					if (messageIndex > i + 1) {
						return false;
					}
				}
			}
		}
		return true;
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		if (diff < 86400000) return 'Today';
		if (diff < 172800000) return 'Yesterday';
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>AI Chat - AuthApp</title>
</svelte:head>

<div class="h-[calc(100vh-4rem)] flex bg-[#1a1b1e]">
	<!-- Sidebar -->
	<div
		class="flex-shrink-0 transition-all duration-300 border-r border-[#2a2b2e] bg-[#202124] {sidebarOpen
			? 'w-64'
			: 'w-0 overflow-hidden'}"
	>
		<div class="w-64 flex flex-col h-full p-4">
			<!-- New Chat Button -->
			<button
				onclick={createNewChat}
				class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30 hover:-translate-y-0.5 transition-all duration-300 mb-5"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				New Chat
			</button>

			<!-- Chats Label -->
			<div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Chats</div>

			<!-- Chat List -->
			<div class="flex-1 overflow-y-auto space-y-0.5">
				{#if chatList.length === 0}
					<p class="text-xs text-gray-600 text-center mt-8 px-4">No chat history yet</p>
				{/if}
				{#each chatList as chatItem}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={() => selectChat(chatItem.id)}
						class="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2.5 group cursor-pointer {activeChatId ===
						chatItem.id
							? 'bg-[#2a2b2e] text-white'
							: 'text-gray-400 hover:bg-[#2a2b2e]/60 hover:text-gray-200'}"
					>
						<svg
							class="h-4 w-4 flex-shrink-0 {activeChatId === chatItem.id ? 'text-emerald-400' : 'text-gray-600'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
							/>
						</svg>
						<span class="truncate text-[13px]">{chatItem.title}</span>
						<button
							onclick={(e) => deleteChat(chatItem.id, e)}
							class="ml-auto opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
							title="Delete chat"
						>
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Main Chat Area -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Header -->
		<div class="px-5 py-3 flex items-center gap-3 border-b border-[#2a2b2e]">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="p-2 rounded-lg text-gray-400 hover:bg-[#2a2b2e] hover:text-white transition-colors"
				title="{sidebarOpen ? 'Hide' : 'Show'} sidebar"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
				</svg>
			</button>
			<div class="flex items-center gap-2">
				<div class="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
					<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
					</svg>
				</div>
				<div>
					<h1 class="text-base font-semibold text-white">AI Chat</h1>
					<p class="text-[11px] text-gray-500">Powered by Google Gemini</p>
				</div>
			</div>
		</div>

		<!-- Chat Messages -->
		<div
			bind:this={messagesContainer}
			class="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6"
		>
			{#if loadingHistory}
				<div class="flex items-center justify-center h-32 text-gray-500">
					<svg class="animate-spin h-6 w-6" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
				</div>
			{:else if chat.messages.length === 0}
				<div class="flex flex-col items-center justify-center h-64 text-gray-500">
					<div class="h-16 w-16 rounded-2xl bg-[#2a2b2e] flex items-center justify-center mb-4">
						<svg class="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
						</svg>
					</div>
					<p class="text-sm font-medium text-gray-300">Start a conversation</p>
					<p class="text-xs mt-1 text-gray-600">Type a message below to chat with AI</p>
				</div>
			{/if}

			{#each chat.messages as message, i}
				{#if !shouldShowMessage(i)}
					<!-- hidden: belongs to a different edit branch -->
				{:else if message.role === 'user'}
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
										<button
											onclick={cancelEdit}
											class="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-[#3a3b3e] rounded-lg transition-colors"
										>
											Cancel
										</button>
										<button
											onclick={() => saveEdit(message.id)}
											disabled={!editText.trim()}
											class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
										>
											Save & Submit
										</button>
									</div>
								</div>
							{:else}
								<button
									onclick={() => startEdit(message.id, getUserDisplayText(message.id, message.parts))}
									disabled={isBusy}
									class="absolute -left-9 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-600 hover:text-gray-300 disabled:opacity-0"
									title="Edit message"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
									</svg>
								</button>
								<div class="bg-[#2a2b2e] text-gray-100 rounded-2xl rounded-br-sm px-4 py-3">
									{#if getAttachedFilename(message.id, message.parts)}
										<div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b1e] border border-[#3a3b3e] text-xs text-emerald-400 mb-2">
											<svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
											</svg>
											{getAttachedFilename(message.id, message.parts)}
										</div>
									{/if}
									{#if getUserDisplayText(message.id, message.parts)}
										<div class="text-sm whitespace-pre-wrap leading-relaxed">
											{getUserDisplayText(message.id, message.parts)}
										</div>
									{/if}
								</div>
								{#if getEditInfo(message.id)}
									{@const info = getEditInfo(message.id)!}
									<div class="flex items-center justify-end gap-1 mt-1.5 mr-1 text-xs text-gray-500">
										<button
											onclick={() => navigateEditVersion(message.id, -1)}
											disabled={isBusy || info.current <= 1}
											aria-label="Previous edit version"
											class="p-0.5 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
										>
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
											</svg>
										</button>
										<span class="tabular-nums select-none">{info.current}/{info.total}</span>
										<button
											onclick={() => navigateEditVersion(message.id, 1)}
											disabled={isBusy || info.current >= info.total}
											aria-label="Next edit version"
											class="p-0.5 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
										>
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
											</svg>
										</button>
									</div>
								{/if}
							{/if}
						</div>
						<div class="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
							U
						</div>
					</div>
				{:else}
					<!-- AI Message -->
					<div class="flex justify-start gap-3">
						<div class="h-8 w-8 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center">
							<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
							</svg>
						</div>
						<div class="max-w-[80%]">
							<div class="text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-headings:text-gray-100 prose-headings:mt-4 prose-headings:mb-2 prose-p:text-gray-300 prose-p:my-2 prose-strong:text-white prose-ul:my-2 prose-ol:my-2 prose-li:text-gray-300 prose-li:my-0.5 prose-pre:bg-[#0d0d0f] prose-pre:border prose-pre:border-[#2a2b2e] prose-pre:rounded-xl prose-code:text-emerald-400 prose-code:bg-[#0d0d0f] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-a:text-emerald-400">
								{@html marked.parse(getAssistantDisplayText(i, message.parts))}
							</div>
							<div class="flex items-center gap-3 mt-2">
								<button
									onclick={() => handleRegenerate(message.id)}
									disabled={isBusy}
									class="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
									title="Regenerate response"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.985 4.356v4.992" />
									</svg>
									Try again
								</button>
								{#if getAltInfo(message.id)}
									{@const info = getAltInfo(message.id)!}
									<div class="flex items-center gap-1 text-xs text-gray-500">
										<button
											onclick={() => navigateResponse(message.id, -1)}
											disabled={isBusy || info.current <= 1}
											aria-label="Previous response"
											class="p-0.5 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
										>
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
											</svg>
										</button>
										<span class="tabular-nums select-none">{info.current}/{info.total}</span>
										<button
											onclick={() => navigateResponse(message.id, 1)}
											disabled={isBusy || info.current >= info.total}
											aria-label="Next response"
											class="p-0.5 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
										>
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
											</svg>
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
					<div class="h-8 w-8 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
						</svg>
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
					<svg class="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<p class="text-sm text-red-300">Something went wrong. Please try again.</p>
				</div>
			{/if}
		</div>

		<!-- Input Form -->
		<div class="px-6 pb-5 pt-2">
			<!-- File attachment preview -->
			{#if selectedFile}
				<div class="mb-2 flex items-center gap-2">
					<div class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2a2b2e] border border-[#3a3b3e] text-sm">
						<svg class="h-4 w-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
						</svg>
						<span class="text-gray-300 truncate max-w-[200px]">{selectedFile.name}</span>
						<span class="text-gray-500 text-xs">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
						{#if fileLoading}
							<svg class="animate-spin h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
						{/if}
						<button
							onclick={removeFile}
							class="p-0.5 text-gray-500 hover:text-red-400 transition-colors"
							title="Remove file"
						>
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{/if}

			{#if fileError}
				<div class="mb-2 text-xs text-red-400 flex items-center gap-1.5">
					<svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
					{fileError}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="relative flex items-center gap-2">
				<!-- Hidden file input -->
				<input
					bind:this={fileInputEl}
					type="file"
					accept={allowedExtensions.join(',')}
					onchange={handleFileSelect}
					class="hidden"
				/>

				<!-- Upload button -->
				<button
					type="button"
					onclick={() => fileInputEl?.click()}
					disabled={isBusy || fileLoading}
					class="p-3 rounded-xl border border-[#3a3b3e] bg-[#2a2b2e] text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
					title="Upload document"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
					</svg>
				</button>

				<!-- Text input -->
				<div class="flex-1 relative">
					<input
						bind:value={inputValue}
						placeholder={selectedFile ? 'Add a message about the document...' : 'Ask anything...'}
						disabled={isBusy}
						class="w-full rounded-2xl border border-[#3a3b3e] bg-[#2a2b2e] px-5 py-4 pr-14 text-sm text-gray-100 placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 disabled:opacity-50"
					/>
					<button
						type="submit"
						disabled={isBusy || (!inputValue.trim() && !selectedFile)}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
					>
						{#if isBusy}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
							</svg>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
