// admin-panel.js - Pełna logika panelu administracyjnego
const API_BASE = 'http://localhost:8080';

// Stan aplikacji
let currentTab = 'dashboard';
let currentFilter = 'all';
let verifications = [];

// ==================== INICJALIZACJA ====================
document.addEventListener('DOMContentLoaded', async function() {
    // Sprawdź czy użytkownik jest zalogowany i czy jest adminem
    await checkAdminAuth();

    // Załaduj dane dashboardu
    await loadDashboard();

    // Obsługa zakładek
    setupTabNavigation();

    // Obsługa filtrów weryfikacji
    setupVerificationFilters();

    // Obsługa modali
    setupModals();
});

// ==================== AUTORYZACJA ====================
async function checkAdminAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/user`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }

        const user = await response.json();


        // Sprawdź czy użytkownik jest adminem
        if (user.role !== 'ADMIN') {
            alert('Brak uprawnień administratora!');
            window.location.href = 'home.html';
            return;
        }

        // Wyświetl dane admina w UI
        updateAdminInfo(user);
    } catch (error) {
        console.error('Błąd autoryzacji:', error);
        window.location.href = 'login.html';
    }
}

function updateAdminInfo(user) {
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Witaj, ${user.firstname} ${user.lastname}`;
    }
}

// ==================== DASHBOARD - STATYSTYKI ====================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać statystyk');

        const stats = await response.json();
        updateDashboardStats(stats);

        // Załaduj też ostatnie wnioski
        await loadRecentVerifications();
    } catch (error) {
        console.error('Błąd ładowania dashboardu:', error);
        showError('Nie udało się załadować statystyk');
    }
}

function updateDashboardStats(stats) {
    // Aktualizuj karty statystyk
    const statCards = {
        'totalUsers': stats.totalUsers,
        'verifiedBeekeepers': stats.verifiedBeekeepers,
        'pendingVerifications': stats.pendingVerifications,
        'totalAreas': stats.totalAreas
    };

    Object.keys(statCards).forEach(key => {
        const element = document.querySelector(`[data-stat="${key}"]`);
        if (element) {
            element.textContent = statCards[key];
        }
    });

    // Alternatywnie - jeśli nie ma data-stat, użyj selektorów po kolei
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 4) {
        statValues[0].textContent = stats.totalUsers;
        statValues[1].textContent = stats.verifiedBeekeepers;
        statValues[2].textContent = stats.pendingVerifications;
        statValues[3].textContent = stats.totalAreas;
    }
}

async function loadRecentVerifications() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/verifications/status/PENDING`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać wniosków');

        const data = await response.json();
        displayRecentVerifications(data.slice(0, 5)); // Tylko 5 najnowszych
    } catch (error) {
        console.error('Błąd ładowania wniosków:', error);
    }
}

function displayRecentVerifications(verifications) {
    const tbody = document.querySelector('#dashboard .admin-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (verifications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Brak oczekujących wniosków</td></tr>';
        return;
    }

    verifications.forEach(v => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${v.firstname} ${v.lastname}</td>
            <td>${v.email}</td>
            <td>${formatDate(v.creationDate)}</td>
            <td>${v.beeGardenName || 'Brak danych'}</td>
            <td><span class="status-badge status-${v.status.toLowerCase()}">${formatStatus(v.status)}</span></td>
            <td>
                <button class="btn btn-primary card-btn view-verification-btn" data-id="${v.id}">
                    <i class="fas fa-eye"></i> Szczegóły
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Dodaj event listenery do przycisków
    document.querySelectorAll('.view-verification-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewVerificationDetails(id);
        });
    });
}

// ==================== WERYFIKACJE ====================
async function loadVerifications(status = 'all') {
    try {
        let url = `${API_BASE}/api/admin/verifications`;
        if (status !== 'all') {
            url = `${API_BASE}/api/admin/verifications/status/${status.toUpperCase()}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać weryfikacji');

        verifications = await response.json();
        displayVerifications(verifications);
    } catch (error) {
        console.error('Błąd ładowania weryfikacji:', error);
        showError('Nie udało się załadować listy weryfikacji');
    }
}

function displayVerifications(data) {
    const tbody = document.querySelector('#verify-beekeepers .admin-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Brak wniosków do wyświetlenia</td></tr>';
        return;
    }

    data.forEach(v => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${v.firstname} ${v.lastname}</td>
            <td>${v.email}</td>
            <td>${formatDate(v.creationDate)}</td>
            <td>${v.beeGardenName || '-'}</td>
            <td><span class="status-badge status-${v.status.toLowerCase()}">${formatStatus(v.status)}</span></td>
            <td>
                <button class="btn btn-primary card-btn view-verification-btn" data-id="${v.id}">
                    <i class="fas fa-eye"></i> Szczegóły
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Event listenery
    document.querySelectorAll('.view-verification-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            viewVerificationDetails(this.getAttribute('data-id'));
        });
    });
}

async function viewVerificationDetails(id) {
    console.log('Fetching verification details for ID:', id); // DEBUG

    try {
        const response = await fetch(`${API_BASE}/api/admin/verifications/${id}`, {
            method: 'GET',
            credentials: 'include'
        });

        console.log('Response status:', response.status); // DEBUG

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const verification = await response.json();
        console.log('Verification data:', verification); // DEBUG

        showVerificationModal(verification);
    } catch (error) {
        console.error('Błąd pobierania szczegółów:', error);
        showError('Nie udało się załadować szczegółów weryfikacji: ' + error.message);
    }
}

function showVerificationModal(v) {
    console.log('Showing verification modal for:', v); // DEBUG

    const modal = document.getElementById('beekeeper-verification-modal');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }

    // Bezpieczne ustawianie wartości z fallbackiem
    const setFieldValue = (selector, value) => {
        const element = modal.querySelector(selector);
        if (element) {
            element.textContent = value || '-';
        } else {
            console.warn(`Element not found: ${selector}`);
        }
    };

    const setFieldHTML = (selector, html) => {
        const element = modal.querySelector(selector);
        if (element) {
            element.innerHTML = html;
        } else {
            console.warn(`Element not found: ${selector}`);
        }
    };

    // Dane osobowe
    setFieldValue('[data-field="name"]', `${v.firstname} ${v.lastname}`);
    setFieldValue('[data-field="email"]', v.email);
    setFieldValue('[data-field="phone"]', v.phone);
    setFieldValue('[data-field="creationDate"]', formatDate(v.creationDate));

    // Dane pasieki
    setFieldValue('[data-field="beeGardenName"]', v.beeGardenName);
    setFieldValue('[data-field="hiveCount"]', v.hiveCount);
    setFieldValue('[data-field="beeGardenAddress"]', v.beeGardenAddress);
    setFieldValue('[data-field="honeyType"]', v.honeyType);

    // Status
    setFieldHTML('[data-field="status"]',
        `<span class="status-badge status-${v.status.toLowerCase()}">${formatStatus(v.status)}</span>`);

    // Dokumenty
    const docsList = modal.querySelector('[data-field="documents"]');
    if (docsList) {
        if (v.documents && v.documents.length > 0) {
            docsList.innerHTML = v.documents.map(doc =>
                `<div class="document-item" style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <i class="fas fa-file-pdf" style="margin-right: 10px; color: #E74C3C;"></i>
                    <span>${doc.fileName}</span>
                </div>`
            ).join('');
        } else {
            docsList.innerHTML = '<p>Brak dokumentów</p>';
        }
    }

    // Wyczyść pole notatek
    const notesField = document.getElementById('verification-notes');
    if (notesField) {
        notesField.value = v.comment || '';
    }

    // Przyciski akcji - pokazuj tylko jeśli PENDING
    const approveBtn = modal.querySelector('.approve-verification-btn');
    const rejectBtn = modal.querySelector('.reject-verification-btn');

    if (approveBtn && rejectBtn) {
        if (v.status === 'PENDING') {
            approveBtn.style.display = 'inline-block';
            rejectBtn.style.display = 'inline-block';

            // Usuń stare event listenery
            approveBtn.replaceWith(approveBtn.cloneNode(true));
            rejectBtn.replaceWith(rejectBtn.cloneNode(true));

            // Dodaj nowe
            const newApproveBtn = modal.querySelector('.approve-verification-btn');
            const newRejectBtn = modal.querySelector('.reject-verification-btn');

            newApproveBtn.onclick = () => processVerification(v.id, true);
            newRejectBtn.onclick = () => processVerification(v.id, false);
        } else {
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }
    }

    // Otwórz modal
    openModal('beekeeper-verification-modal');
}

async function processVerification(verificationId, approved) {
    const comment = document.getElementById('verification-notes')?.value || '';

    if (!approved && !comment.trim()) {
        alert('Proszę podać powód odrzucenia wniosku.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/verifications/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                verificationId: verificationId,
                approved: approved,
                comment: comment
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        alert(approved ? '✅ Wniosek został zatwierdzony!' : '❌ Wniosek został odrzucony.');
        closeAllModals();

        // Odśwież listę weryfikacji
        await loadVerifications(currentFilter);
        await loadDashboard();
    } catch (error) {
        console.error('Błąd przetwarzania wniosku:', error);
        alert('Wystąpił błąd: ' + error.message);
    }
}

// ==================== NAWIGACJA ZAKŁADEK ====================
function setupTabNavigation() {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.getAttribute('data-tab');
            if (!tab) return;

            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;

    // Ukryj wszystkie zakładki
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Pokaż wybraną
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Aktualizuj nawigację
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });

    // Załaduj dane dla zakładki
    loadTabData(tabName);
}

async function loadTabData(tabName) {
    switch(tabName) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'verify-beekeepers':
            await loadVerifications(currentFilter);
            break;
        case 'manage-areas':
            // TODO: załaduj obszary
            break;
        case 'manage-users':
            // TODO: załaduj użytkowników
            break;
    }
}

// ==================== FILTRY WERYFIKACJI ====================
function setupVerificationFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            currentFilter = filter;

            // Aktualizuj UI
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Załaduj dane
            loadVerifications(filter);
        });
    });
}

// ==================== MODALE ====================
function setupModals() {
    // Zamykanie modali
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Zamknij po kliknięciu w overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = '';
}

// ==================== POMOCNICZE FUNKCJE ====================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatStatus(status) {
    const statusMap = {
        'PENDING': 'Oczekujący',
        'APPROVED': 'Zatwierdzony',
        'REJECTED': 'Odrzucony'
    };
    return statusMap[status] || status;
}

function showError(message) {
    alert('❌ ' + message);
}