// scripts/chat.js

const API_BASE = 'http://localhost:8080/api';
const MAX_MESSAGE_LENGTH = 500;

let currentConversationId = null;
let currentUser = null;
let conversations = [];
let messages = [];
let messagePollingInterval = null;
let isInitialLoad = true;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Chat script loaded');
    await checkAuth();
    await loadConversations();
    setupEventListeners();
    setupMobileHandlers();

    updateCharCounter();

    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    if (conversationId) {
        await openConversation(parseInt(conversationId));
    }
});

// ==================== AUTENTYKACJA ====================
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/user`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            currentUser = await response.json();
            updateWelcomeMessage();
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Błąd autoryzacji:', error);
        window.location.href = 'login.html';
    }
}

function updateWelcomeMessage() {
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg && currentUser) {
        welcomeMsg.textContent = `Witaj, ${currentUser.firstname}!`;
    }
}

// ==================== ŁADOWANIE KONWERSACJI ====================
async function loadConversations() {
    try {
        if (isInitialLoad) {
            const list = document.querySelector('.conversation-list');
            if(list) list.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;"><i class="fas fa-spinner fa-spin"></i> Ładowanie...</div>';
        }

        const response = await fetch(`${API_BASE}/chat/conversations`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać konwersacji');

        const newConversations = await response.json();

        if (isInitialLoad || JSON.stringify(conversations) !== JSON.stringify(newConversations)) {
            conversations = newConversations;
            displayConversations();
        }

    } catch (error) {
        console.error('Błąd ładowania konwersacji:', error);
        if (isInitialLoad) {
            const list = document.querySelector('.conversation-list');
            if(list) list.innerHTML = '<div style="text-align: center; padding: 20px; color: #e74c3c;">Błąd połączenia.</div>';
        }
    } finally {
        isInitialLoad = false;
    }
}

function displayConversations() {
    const container = document.querySelector('.conversation-list');
    if (!container) return;

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments" style="font-size: 48px; color: #ddd; margin-bottom: 10px;"></i>
                <p>Brak konwersacji</p>
                <p style="font-size: 12px; color: #999;">Rozpocznij nową rozmowę z karty produktu</p>
            </div>
        `;
        return;
    }

    container.innerHTML = conversations.map(conv => createConversationItem(conv)).join('');
    attachConversationListeners();

    // Przywróć aktywną klasę
    if (currentConversationId) {
        const activeItem = document.querySelector(`[data-conversation="${currentConversationId}"]`);
        if (activeItem) activeItem.classList.add('active');
    }
}

function createConversationItem(conv) {
    const time = formatConversationTime(conv.lastMessageAt);
    const preview = conv.lastMessageContent || 'Brak wiadomości';
    const unreadBadge = conv.unreadCount > 0 ? `<div class="conversation-badge">${conv.unreadCount}</div>` : '';

    const name = `${conv.otherUserFirstname} ${conv.otherUserLastname}`;

    // Zdjęcie produktu jako avatar (jeśli jest), w przeciwnym razie default avatar
    const avatarSrc = conv.productImage
        ? `data:image/jpeg;base64,${conv.productImage}`
        : 'assets/default-avatar.png';

    return `
        <div class="conversation-item ${conv.id === currentConversationId ? 'active' : ''}" data-conversation="${conv.id}">
            <div class="conversation-avatar">
                <img src="${avatarSrc}" alt="${name}">
            </div>
            <div class="conversation-info">
                <div class="conversation-name">${name}</div>
                <div class="conversation-preview">${truncateText(preview, 40)}</div>
                <div style="font-size: 10px; color: #aaa;">Produkt: ${conv.productName}</div>
            </div>
            <div class="conversation-meta">
                <div class="conversation-time">${time}</div>
                ${unreadBadge}
            </div>
        </div>
    `;
}

function attachConversationListeners() {
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', function() {
            const convId = parseInt(this.getAttribute('data-conversation'));
            openConversation(convId);
        });
    });
}

// ==================== OTWIERANIE KONWERSACJI ====================
async function openConversation(conversationId) {
    if (currentConversationId === conversationId) return; // Już otwarta
    currentConversationId = conversationId;

    // UI Updates
    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`[data-conversation="${conversationId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        const badge = activeItem.querySelector('.conversation-badge');
        if (badge) badge.remove();
    }

    // Mobile UI
    if (window.innerWidth < 768) {
        document.getElementById('conversations-list').classList.add('hidden');
        document.getElementById('chat-main').classList.remove('hidden');
    } else {
        document.getElementById('chat-main').classList.remove('hidden');
    }

    // Header update
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
        const headerName = document.querySelector('.chat-header-name');
        const headerStatus = document.querySelector('.chat-header-status');
        const headerAvatar = document.querySelector('.chat-header .conversation-avatar img');

        if (headerName) headerName.textContent = `${conv.otherUserFirstname} ${conv.otherUserLastname} (${conv.productName})`;
        if (headerStatus) {
            headerStatus.textContent = 'Online'; // Mock status
            headerStatus.classList.add('online');
        }
        if(headerAvatar && conv.productImage) {
            headerAvatar.src = `data:image/jpeg;base64,${conv.productImage}`;
        } else if (headerAvatar) {
            headerAvatar.src = 'assets/default-avatar.png';
        }
    }

    // Reset messages and load
    messages = [];
    document.getElementById('chat-messages').innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i></div>';

    // Clear input
    const input = document.getElementById('chat-input');
    if(input) {
        input.value = '';
        input.classList.remove('input-error');
        updateCharCounter();
    }

    await loadMessages(conversationId);
    await markAsRead(conversationId);
    startMessagePolling();
}

// ==================== ŁADOWANIE WIADOMOŚCI ====================
async function loadMessages(conversationId) {
    try {
        const response = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać wiadomości');

        const newMessages = await response.json();

        const container = document.getElementById('chat-messages');
        const wasAtBottom = container && (container.scrollHeight - container.scrollTop - container.clientHeight < 100);

        if (newMessages.length !== messages.length || messages.length === 0) {
            messages = newMessages;
            displayMessages();


            if (wasAtBottom || messages.length === newMessages.length) {
                scrollToBottom();
            }
        }

    } catch (error) {
        console.error('Błąd ładowania wiadomości:', error);
        document.getElementById('chat-messages').innerHTML = '<div style="text-align: center; color: #e74c3c;">Błąd ładowania wiadomości.</div>';
    }
}

function displayMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="message-date-divider"><span>Rozpoczęcie czatu</span></div>
            <div style="text-align: center; padding: 40px 20px; color: #999;">
                <i class="fas fa-comment-dots" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                <p>Napisz pierwszą wiadomość!</p>
            </div>`;
        return;
    }

    const groupedMessages = groupMessagesByDate(messages);
    let html = '';
    for (const [date, msgs] of Object.entries(groupedMessages)) {
        html += `<div class="message-date-divider"><span>${date}</span></div>`;
        msgs.forEach(msg => { html += createMessageElement(msg); });
    }
    container.innerHTML = html;
}

function createMessageElement(msg) {
    const messageClass = msg.isMine ? 'message-sent' : 'message-received';
    const time = formatMessageTime(msg.sentAt);

    let readStatus = '';
    if (msg.isMine) {
        readStatus = msg.isRead
            ? '<span class="message-status read" title="Przeczytane"><i class="fas fa-check-double"></i></span>'
            : '<span class="message-status sent" title="Wysłane"><i class="fas fa-check"></i></span>';
    }

    return `
        <div class="message ${messageClass}">
            <div class="message-bubble">
                <div class="message-content">${escapeHtml(msg.content)}</div>
            </div>
            <div class="message-time">${time} ${readStatus}</div>
        </div>
    `;
}

function groupMessagesByDate(messages) {
    const grouped = {};
    messages.forEach(msg => {
        const date = formatDateDivider(msg.sentAt);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(msg);
    });
    return grouped;
}

// ==================== WYSYŁANIE WIADOMOŚCI ====================
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();

    if (!currentConversationId) {
        alert('Wybierz konwersację, aby wysłać wiadomość');
        return;
    }

    // --- WALIDACJA FRONT-END ---

    // 1. Pusta wiadomość
    if (!content) {
        input.classList.add('input-error');
        setTimeout(() => input.classList.remove('input-error'), 1000);
        return;
    }

    // 2. Długość wiadomości
    if (content.length > MAX_MESSAGE_LENGTH) {
        input.classList.add('input-error');
        alert(`Wiadomość jest zbyt długa (${content.length}/${MAX_MESSAGE_LENGTH})`);
        return;
    }

    // Usuń błędy jeśli walidacja przeszła
    input.classList.remove('input-error');

    const sendBtn = document.getElementById('send-message');
    input.disabled = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/chat/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                conversationId: currentConversationId,
                content: content
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Nie udało się wysłać wiadomości');
        }

        const newMessage = await response.json();


        messages.push(newMessage);
        displayMessages();
        scrollToBottom();

        input.value = '';
        updateCharCounter();

        loadConversations();

    } catch (error) {
        console.error('Błąd wysyłania wiadomości:', error);
        alert('Nie udało się wysłać wiadomości: ' + error.message);
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

// Funkcja aktualizująca licznik znaków
function updateCharCounter() {
    const input = document.getElementById('chat-input');
    const counter = document.getElementById('char-counter');
    if (!input || !counter) return;

    const length = input.value.length;
    counter.textContent = `${length} / ${MAX_MESSAGE_LENGTH}`;

    if (length > MAX_MESSAGE_LENGTH) {
        counter.style.color = '#e74c3c'; // Czerwony
        input.classList.add('input-error');
    } else {
        counter.style.color = '#999'; // Szary
        input.classList.remove('input-error');
    }
}

// ==================== OZNACZANIE JAKO PRZECZYTANE ====================
async function markAsRead(conversationId) {
    try {
        await fetch(`${API_BASE}/chat/conversations/${conversationId}/read`, {
            method: 'PUT',
            credentials: 'include'
        });
    } catch (error) { console.error('Błąd oznaczania jako przeczytane:', error); }
}

// ==================== POLLING ====================
function startMessagePolling() {
    stopMessagePolling();
    messagePollingInterval = setInterval(async () => {
        if (currentConversationId) {
            await loadMessages(currentConversationId);
        }
        await loadConversations();
    }, 3000);
}

function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    const sendBtn = document.getElementById('send-message');
    const input = document.getElementById('chat-input');

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        input.addEventListener('input', updateCharCounter);
    }

    const searchInput = document.querySelector('.search-input');
    if (searchInput) searchInput.addEventListener('input', filterConversations);
}

function setupMobileHandlers() {
    const backBtn = document.getElementById('back-to-conversations');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            document.getElementById('conversations-list').classList.remove('hidden');
            document.getElementById('chat-main').classList.add('hidden');
            currentConversationId = null;
            stopMessagePolling();
        });
    }
    window.addEventListener('resize', adjustLayout);
    adjustLayout();
}

function adjustLayout() {
    if (window.innerWidth >= 768) {
        document.getElementById('conversations-list').classList.remove('hidden');
        document.getElementById('chat-main').classList.remove('hidden');
    } else {
        if (currentConversationId) {
            document.getElementById('conversations-list').classList.add('hidden');
            document.getElementById('chat-main').classList.remove('hidden');
        } else {
            document.getElementById('conversations-list').classList.remove('hidden');
            document.getElementById('chat-main').classList.add('hidden');
        }
    }
}

function filterConversations() {
    const searchQuery = document.querySelector('.search-input').value.toLowerCase();
    document.querySelectorAll('.conversation-item').forEach(item => {
        const name = item.querySelector('.conversation-name').textContent.toLowerCase();
        const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();
        item.style.display = (name.includes(searchQuery) || preview.includes(searchQuery)) ? 'flex' : 'none';
    });
}

// ==================== POMOCNICZE ====================
function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 100);
}

function formatConversationTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) return date.toLocaleDateString('pl-PL', { weekday: 'short' });
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' });
}

function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Wczoraj';
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}