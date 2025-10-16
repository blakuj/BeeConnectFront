// admin-panel.js
const API_BASE = 'http://localhost:8080';

// Stan aplikacji
let currentVerifications = [];
let currentStats = {};

// Funkcje pomocnicze
async function fetchWithAuth(url, options = {}) {
    const response = await fetch(API_BASE + url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (response.status === 403) {
        alert('Brak uprawnień administratora!');
        window.location.href = '/index.html';
        return;
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// Pobieranie statystyk
async function loadDashboardStats() {
    try {
        const stats = await fetchWithAuth('/api/admin/stats');
        currentStats = stats;
        updateDashboardUI(stats);
    } catch (error) {
        console.error('Błąd podczas pobierania statystyk:', error);
    }
}

// Aktualizacja UI dashboardu
function updateDashboardUI(stats) {
    // Aktualizacja liczników
    document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = stats.totalUsers;
    document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = stats.verifiedBeekeepers;
    document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = stats.pendingVerifications;
    document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = stats.totalAreas;

    // Aktualizacja liczników w filtrach
    updateFilterCounts();
}

// Pobieranie wniosków weryfikacyjnych
async function loadVerifications(statusFilter = null) {
    try {
        const url = statusFilter
            ? `/api/admin/verifications?status=${statusFilter}`
            : '/api/admin/verifications';

        const verifications = await fetchWithAuth(url);
        currentVerifications = verifications;
        updateVerificationTable(verifications);
    } catch (error) {
        console.error('Błąd podczas pobierania wniosków:', error);
    }
}

// Aktualizacja tabeli weryfikacji
function updateVerificationTable(verifications) {
    const tbody = document.querySelector('#verify-beekeepers .admin-table tbody');

    if (!verifications || verifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    Brak wniosków do wyświetlenia
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = verifications.map(v => {
        const statusBadge = getStatusBadge(v.status);
        const formattedDate = new Date(v.creationDate).toLocaleDateString('pl-PL');

        return `
            <tr>
                <td>${v.userName}</td>
                <td>${v.userEmail}</td>
                <td>${formattedDate}</td>
                <td>${v.beeGardenName || 'Brak nazwy'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-primary card-btn view-beekeeper-btn" 
                            data-id="${v.id}" 
                            onclick="viewVerificationDetails(${v.id})">
                        <i class="fas fa-eye"></i> Szczegóły
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Funkcja zwracająca HTML dla statusu
function getStatusBadge(status) {
    const statusMap = {
        'PENDING': '<span class="status-badge status-pending">Oczekujący</span>',
        'APPROVED': '<span class="status-badge status-approved">Zatwierdzony</span>',
        'REJECTED': '<span class="status-badge status-rejected">Odrzucony</span>'
    };
    return statusMap[status] || status;
}

// Wyświetlanie szczegółów weryfikacji
async function viewVerificationDetails(id) {
    try {
        const verification = await fetchWithAuth(`/api/admin/verifications/${id}`);

        // Wypełnij modal danymi
        const modal = document.getElementById('beekeeper-verification-modal');

        modal.querySelector('.modal-title').textContent =
            `Weryfikacja pszczelarza - ${verification.userName}`;

        // Wypełnij dane osobowe
        const personalData = modal.querySelector('.card-body');
        personalData.innerHTML = `
            <div class="card-property">
                <div class="card-property-label">Imię i nazwisko:</div>
                <div class="card-property-value">${verification.userName}</div>
            </div>
            <div class="card-property">
                <div class="card-property-label">E-mail:</div>
                <div class="card-property-value">${verification.userEmail}</div>
            </div>
            <div class="card-property">
                <div class="card-property-label">Telefon:</div>
                <div class="card-property-value">${verification.userPhone || 'Nie podano'}</div>
            </div>
            <div class="card-property">
                <div class="card-property-label">Data złożenia wniosku:</div>
                <div class="card-property-value">${new Date(verification.creationDate).toLocaleString('pl-PL')}</div>
            </div>
            <div class="card-property">
                <div class="card-property-label">Status:</div>
                <div class="card-property-value">${getStatusBadge(verification.status)}</div>
            </div>
        `;

        // Dane pasieki
        const apiarySection = document.createElement('div');
        apiarySection.innerHTML = `
            <div class="card" style="margin-top: 20px;">
                <div class="card-header card-header-secondary">
                    <div class="card-header-title">Dane pasieki</div>
                </div>
                <div class="card-body">
                    <div class="card-property">
                        <div class="card-property-label">Nazwa pasieki:</div>
                        <div class="card-property-value">${verification.beeGardenName || 'Nie podano'}</div>
                    </div>
                    <div class="card-property">
                        <div class="card-property-label">Liczba uli:</div>
                        <div class="card-property-value">${verification.hiveCount || 0}</div>
                    </div>
                    <div class="card-property">
                        <div class="card-property-label">Adres:</div>
                        <div class="card-property-value">${verification.address || 'Nie podano'}</div>
                    </div>
                    <div class="card-property">
                        <div class="card-property-label">Rodzaje miodu:</div>
                        <div class="card-property-value">${verification.honeyType || 'Nie podano'}</div>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('.modal-body').appendChild(apiarySection);

        // Ukryj/pokaż przyciski w zależności od statusu
        const approveBtn = modal.querySelector('.approve-verification-btn');
        const rejectBtn = modal.querySelector('.reject-verification-btn');

        if (verification.status === 'PENDING') {
            approveBtn.style.display = 'inline-flex';
            rejectBtn.style.display = 'inline-flex';
            approveBtn.onclick = () => approveVerification(id);
            rejectBtn.onclick = () => rejectVerification(id);
        } else {
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }

        // Otwórz modal
        openModal('beekeeper-verification-modal');
    } catch (error) {
        console.error('Błąd podczas pobierania szczegółów:', error);
        alert('Nie udało się pobrać szczegółów weryfikacji');
    }
}

// Zatwierdzanie weryfikacji
async function approveVerification(id) {
    const notes = document.getElementById('verification-notes').value;

    try {
        await fetchWithAuth(`/api/admin/verifications/${id}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ comment: notes })
        });

        alert('✅ Wniosek został zatwierdzony!');
        closeAllModals();
        loadVerifications(); // Odśwież listę
        loadDashboardStats(); // Odśwież statystyki
    } catch (error) {
        console.error('Błąd podczas zatwierdzania:', error);
        alert('❌ Nie udało się zatwierdzić wniosku');
    }
}

// Odrzucanie weryfikacji
async function rejectVerification(id) {
    const reason = document.getElementById('verification-notes').value;

    if (!reason.trim()) {
        alert('Proszę podać powód odrzucenia wniosku.');
        return;
    }

    try {
        await fetchWithAuth(`/api/admin/verifications/${id}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason: reason })
        });

        alert('✅ Wniosek został odrzucony.');
        closeAllModals();
        loadVerifications(); // Odśwież listę
        loadDashboardStats(); // Odśwież statystyki
    } catch (error) {
        console.error('Błąd podczas odrzucania:', error);
        alert('❌ Nie udało się odrzucić wniosku');
    }
}

// Aktualizacja liczników w filtrach
function updateFilterCounts() {
    const pendingCount = currentVerifications.filter(v => v.status === 'PENDING').length;
    const approvedCount = currentVerifications.filter(v => v.status === 'APPROVED').length;
    const rejectedCount = currentVerifications.filter(v => v.status === 'REJECTED').length;

    document.querySelector('.filter-btn:nth-child(1)').textContent =
        `Wszystkie (${currentVerifications.length})`;
    document.querySelector('.filter-btn:nth-child(2)').textContent =
        `Oczekujące (${pendingCount})`;
    document.querySelector('.filter-btn:nth-child(3)').textContent =
        `Zatwierdzone (${approvedCount})`;
    document.querySelector('.filter-btn:nth-child(4)').textContent =
        `Odrzucone (${rejectedCount})`;
}

// Filtrowanie weryfikacji
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');

            const filterText = this.textContent.toLowerCase();
            let statusFilter = null;

            if (filterText.includes('oczekujące')) statusFilter = 'PENDING';
            else if (filterText.includes('zatwierdzone')) statusFilter = 'APPROVED';
            else if (filterText.includes('odrzucone')) statusFilter = 'REJECTED';

            loadVerifications(statusFilter);
        });
    });
}

// Inicjalizacja przy ładowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź czy użytkownik jest zalogowany i ma uprawnienia admina
    checkAdminAuth();

    // Załaduj dane początkowe
    loadDashboardStats();
    loadVerifications();

    // Ustaw filtry
    setupFilters();

    // Ustaw obsługę zakładek (istniejący kod)
    setupTabs();
});

// Sprawdzenie uprawnień admina
async function checkAdminAuth() {
    try {
        const response = await fetch(API_BASE + '/api/person', {
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }

        const user = await response.json();

        if (user.role !== 'ADMIN') {
            alert('Brak uprawnień administratora!');
       //     window.location.href = '/index.html';
            return;
        }

        // Ustaw dane admina w UI
        document.querySelector('.admin-name').textContent =
            `${user.firstname} ${user.lastname}`;
        document.querySelector('.admin-email').textContent = user.email;
        document.querySelector('.welcome-message').textContent =
            `Administrator: ${user.firstname} ${user.lastname}`;
    } catch (error) {
        console.error('Błąd autoryzacji:', error);
        window.location.href = '/login.html';
    }
}

// Funkcja do obsługi zakładek (wykorzystaj istniejący kod)
function setupTabs() {
    // Tutaj wstaw istniejący kod obsługi zakładek z admin-panel.html
}

// Eksportuj funkcje dla użycia w HTML
window.viewVerificationDetails = viewVerificationDetails;
window.approveVerification = approveVerification;
window.rejectVerification = rejectVerification;