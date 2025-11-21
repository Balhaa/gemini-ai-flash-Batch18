const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const newChatBtn = document.getElementById("new-chat-btn");
const historyList = document.getElementById("history-list");

// Data model: conversations stored in localStorage
let conversations = []; // array of { id, title, createdAt, messages: [{role, text}] }
let currentConversation = null;

// Initialization
init();

function init() {
    loadConversations();
    if (conversations.length > 0) {
        // Load the most recent conversation
        loadConversation(conversations[conversations.length - 1].id);
    } else {
        // Start a fresh conversation
        createNewConversation(false);
    }

    // Event listeners
    newChatBtn.addEventListener("click", () => createNewConversation(true));

    chatForm.addEventListener("submit", handleSubmit);
}

function handleSubmit(e) {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Add user message to UI and current conversation
    addMessage(userMessage, "user-message", false, true);
    userInput.value = "";

    // Show typing indicator
    const typingIndicator = addTypingIndicator();

    // Send full conversation to backend (roles preserved)
    const payload = { conversation: currentConversation.messages };

    fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
    .then(async (res) => {
        typingIndicator.remove();
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        if (data.result) {
            addMessage(data.result, "bot-message", false, true);
        } else {
            addMessage("Sorry, no response received.", "bot-message error", false, true);
        }
    })
    .catch((err) => {
        console.error("Error:", err);
        typingIndicator.remove();
        addMessage("Failed to get response from server.", "bot-message error", false, true);
    });
}

function addTypingIndicator() {
    const messageElement = document.createElement("div");
    messageElement.className = "chat-message bot-message";
    const typingDots = document.createElement("div");
    typingDots.className = "typing-indicator";
    typingDots.innerHTML = "<span></span><span></span><span></span>";
    messageElement.appendChild(typingDots);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElement;
}

function addMessage(text, className, isThinking = false, persist = false) {
    const messageElement = document.createElement("div");
    // map className to standardized classes
    const cls = className === 'user-message' ? 'user-message' : className.includes('error') ? 'bot-message error' : 'bot-message';
    messageElement.className = `chat-message ${cls}`;

    let sanitizedText = text;
    if (cls.includes('bot-message')) {
        sanitizedText = sanitizeBotText(sanitizedText);
    }

    messageElement.textContent = sanitizedText;
    chatBox.appendChild(messageElement);

    // Persist message to current conversation if requested
    if (persist && currentConversation) {
        const role = cls === 'user-message' ? 'user' : 'bot';
        currentConversation.messages.push({ role, text: sanitizedText });
        saveOrUpdateConversation(currentConversation);
        renderHistoryList();
    }

    // Scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    if (isThinking) return messageElement;
}

function sanitizeBotText(input) {
    if (!input) return input;
    let s = input;
    // Remove common Markdown and list markers
    s = s.replace(/\*\*(.*?)\*\*/g, '$1');
    s = s.replace(/\*(.*?)\*/g, '$1');
    s = s.replace(/^#+\s/gm, '');
    s = s.replace(/^\s*[\*\-]\s/gm, '');
    s = s.trim();
    // Remove leading/trailing characters like *, -, #
    const charsToRemove = ['*', '-', '#'];
    let again = true;
    while (again) {
        again = false;
        if (charsToRemove.includes(s.charAt(0))) { s = s.substring(1).trim(); again = true; }
        if (charsToRemove.includes(s.charAt(s.length - 1))) { s = s.slice(0, -1).trim(); again = true; }
    }
    return s;
}

/* History / storage helpers */
function loadConversations() {
    try {
        const raw = localStorage.getItem('chat_conversations');
        conversations = raw ? JSON.parse(raw) : [];
    } catch (e) {
        conversations = [];
    }
    renderHistoryList();
}

function saveConversations() {
    localStorage.setItem('chat_conversations', JSON.stringify(conversations));
}

function saveOrUpdateConversation(conv) {
    const idx = conversations.findIndex(c => c.id === conv.id);
    if (idx >= 0) {
        conversations[idx] = conv;
    } else {
        conversations.push(conv);
    }
    saveConversations();
}

function renderHistoryList() {
    if (!historyList) return;
    historyList.innerHTML = '';
    conversations.forEach((conv) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        if (currentConversation && conv.id === currentConversation.id) li.classList.add('active');
        li.dataset.id = conv.id;
        li.addEventListener('click', () => loadConversation(conv.id));

        const title = conv.title || formatDate(conv.createdAt);
        const titleSpan = document.createElement('span');
        titleSpan.className = 'history-item-title';
        titleSpan.textContent = title;
        li.appendChild(titleSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-chat-btn';
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
            </svg>`;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(conv.id);
        });
        li.appendChild(deleteBtn);

        historyList.appendChild(li);
    });
}

function deleteConversation(id) {
    const wasCurrent = currentConversation && currentConversation.id === id;
    conversations = conversations.filter(c => c.id !== id);
    saveConversations();
    renderHistoryList();

    if (wasCurrent) {
        if (conversations.length > 0) {
            loadConversation(conversations[conversations.length - 1].id);
        } else {
            createNewConversation(false);
        }
    } else if (conversations.length === 0) {
        createNewConversation(false);
    }
}


function createNewConversation(saveCurrent = true) {
    // Save current conversation if it has messages
    if (saveCurrent && currentConversation && currentConversation.messages.length > 0) {
        // ensure title exists
        if (!currentConversation.title) {
            currentConversation.title = deriveTitleFromConversation(currentConversation);
        }
        saveOrUpdateConversation(currentConversation);
    }

    // Create new conversation
    const id = String(Date.now());
    currentConversation = { id, title: '', createdAt: new Date().toISOString(), messages: [] };
    // Do not persist yet until there is content
    renderConversationMessages();
    renderHistoryList();
}

function deriveTitleFromConversation(conv) {
    const firstUser = conv.messages.find(m => m.role === 'user');
    if (firstUser && firstUser.text) return truncate(firstUser.text, 40);
    return `Chat ${conversations.length + 1}`;
}

function truncate(str, n) {
    return (str.length > n) ? str.substr(0, n - 1) + '…' : str;
}

function loadConversation(id) {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
    // save current before switching
    if (currentConversation && currentConversation.id !== id && currentConversation.messages.length > 0) {
        if (!currentConversation.title) currentConversation.title = deriveTitleFromConversation(currentConversation);
        saveOrUpdateConversation(currentConversation);
    }
    currentConversation = JSON.parse(JSON.stringify(conv)); // clone
    renderConversationMessages();
    renderHistoryList();
}

function renderConversationMessages() {
    chatBox.innerHTML = '';
    if (!currentConversation) return;
    currentConversation.messages.forEach(m => {
        const cls = m.role === 'user' ? 'user-message' : 'bot-message';
        addMessage(m.text, cls, false, false);
    });
}

function formatDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString();
    } catch (e) {
        return iso;
    }
}

