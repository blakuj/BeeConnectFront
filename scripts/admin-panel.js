// admin-panel.js - Kompletna logika panelu administracyjnego
const API_BASE = 'http://localhost:8080';

// Stan aplikacji
let currentTab = 'dashboard';
let currentFilter = 'all';
let verifications = [];
let allAreas = [];
let currentAreasFilter = 'all';
let allUsers = [];
let currentUsersFilter = 'all';

// ==================== INICJALIZACJA ====================
document.addEventListener('DOMContentLoaded', async function() {
    await checkAdminAuth();
    await loadDashboard();
    setupTabNavigation();
    setupVerificationFilters();
    setupAreaFilters();
    setupUsersFilters();
    setupUsersSearch();
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

        if (user.role !== 'ADMIN') {
            alert('Brak uprawnień administratora!');
            window.location.href = 'home.html';
            return;
        }

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

    const adminName = document.querySelector('.admin-name');
    if (adminName) {
        adminName.textContent = `${user.firstname} ${user.lastname}`;
    }

    const adminEmail = document.querySelector('.admin-email');
    if (adminEmail) {
        adminEmail.textContent = user.email;
    }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać statystyk');

        const stats = await response.json();
        updateDashboardStats(stats);
        await loadRecentVerifications();
        await loadRecentAreas();
    } catch (error) {
        console.error('Błąd ładowania dashboardu:', error);
        showError('Nie udało się załadować statystyk');
    }
}

function updateDashboardStats(stats) {
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 4) {
        statValues[0].textContent = stats.totalUsers || 0;
        statValues[1].textContent = stats.verifiedBeekeepers || 0;
        statValues[2].textContent = stats.pendingVerifications || 0;
        statValues[3].textContent = stats.totalAreas || 0;
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
        displayRecentVerifications(data.slice(0, 5));
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

    document.querySelectorAll('.view-verification-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewVerificationDetails(id);
        });
    });
}

async function loadRecentAreas() {
    try {
        const response = await fetch(`${API_BASE}/api/areas`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać obszarów');

        const areas = await response.json();
        const recentAreas = areas.sort((a, b) => b.id - a.id).slice(0, 5);
        displayRecentAreas(recentAreas);
    } catch (error) {
        console.error('Błąd ładowania ostatnich obszarów:', error);
    }
}

function displayRecentAreas(areas) {
    const tbody = document.getElementById('recent-areas-table');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (areas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Brak ostatnio dodanych obszarów</td></tr>';
        return;
    }

    areas.forEach(area => {
        const statusText = area.status === 'AVAILABLE' ? 'Dostępny' : 'Niedostępny';
        const statusClass = area.status === 'AVAILABLE' ? 'status-approved' : 'status-rejected';
        const ownerName = `${area.ownerFirstName || ''} ${area.ownerLastName || ''}`.trim() || 'Nieznany';

        // ZMIANA: Obsługa listy kwiatów
        const flowerType = (area.flowers && area.flowers.length > 0)
            ? area.flowers.map(f => f.name).join(', ')
            : 'Nie określono';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${area.name || 'Bez nazwy'}</td>
            <td>${flowerType}</td>
            <td>${ownerName}</td>
            <td>${area.area ? area.area.toFixed(2) + ' ha' : 'Brak danych'}</td>
            <td>${area.pricePerDay ? area.pricePerDay.toFixed(2) + ' PLN' : '0.00 PLN'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-primary card-btn view-area-btn" data-id="${area.id}">
                    <i class="fas fa-eye"></i> Szczegóły
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.view-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            viewAreaDetails(id);
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

    document.querySelectorAll('.view-verification-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            viewVerificationDetails(this.getAttribute('data-id'));
        });
    });
}

async function viewVerificationDetails(id) {
    console.log('Fetching verification details for ID:', id);

    try {
        const response = await fetch(`${API_BASE}/api/admin/verifications/${id}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const verification = await response.json();
        console.log('Verification data:', verification);

        showVerificationModal(verification);
    } catch (error) {
        console.error('Błąd pobierania szczegółów:', error);
        showError('Nie udało się załadować szczegółów weryfikacji: ' + error.message);
    }
}

function showVerificationModal(v) {
    const modal = document.getElementById('verification-details-modal');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }

    const setFieldValue = (selector, value) => {
        const element = modal.querySelector(selector);
        if (element) {
            element.textContent = value || '-';
        }
    };

    const setFieldHTML = (selector, html) => {
        const element = modal.querySelector(selector);
        if (element) {
            element.innerHTML = html;
        }
    };

    // Dane osobowe
    setFieldValue('[data-field="fullname"]', `${v.firstname} ${v.lastname}`);
    setFieldValue('[data-field="email"]', v.email);
    setFieldValue('[data-field="phone"]', v.phone);
    setFieldValue('[data-field="creationDate"]', formatDate(v.creationDate));

    // Dane pasieki
    setFieldValue('[data-field="beeGardenName"]', v.beeGardenName);
    setFieldValue('[data-field="hiveCount"]', v.hiveCount);
    setFieldValue('[data-field="beeGardenAddress"]', v.beeGardenAddress);
    setFieldValue('[data-field="yearsOfExperience"]', v.yearsOfExperience);

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

    // Notatki i ID
    const notesField = document.getElementById('verification-notes');
    if (notesField) {
        notesField.value = v.comment || '';
    }

    const idField = document.getElementById('current-verification-id');
    if (idField) {
        idField.value = v.id;
    }

    // Przyciski
    const approveBtn = modal.querySelector('.approve-verification-btn');
    const rejectBtn = modal.querySelector('.reject-verification-btn');

    if (approveBtn && rejectBtn) {
        if (v.status === 'PENDING') {
            approveBtn.style.display = 'inline-block';
            rejectBtn.style.display = 'inline-block';
        } else {
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }
    }

    openModal('verification-details-modal');
}

function handleVerificationDecision(decision) {
    const verificationId = document.getElementById('current-verification-id').value;
    const comment = document.getElementById('verification-notes').value;
    const approved = decision === 'APPROVED';

    if (!approved && !comment.trim()) {
        alert('Proszę podać powód odrzucenia wniosku.');
        return;
    }

    processVerification(verificationId, approved, comment);
}

async function processVerification(verificationId, approved, comment = '') {
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
        await loadVerifications(currentFilter);
        await loadDashboard();
    } catch (error) {
        console.error('Błąd przetwarzania wniosku:', error);
        alert('Wystąpił błąd: ' + error.message);
    }
}

// ==================== OBSZARY ====================
async function loadAllAreas() {
    try {
        const response = await fetch(`${API_BASE}/api/areas`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać obszarów');

        allAreas = await response.json();
        updateAreasStats();
        displayAreas(currentAreasFilter);
    } catch (error) {
        console.error('Błąd ładowania obszarów:', error);
        showError('Nie udało się załadować obszarów');
    }
}

function updateAreasStats() {
    const total = allAreas.length;
    const available = allAreas.filter(a => a.status === 'AVAILABLE').length;
    const unavailable = allAreas.filter(a => a.status === 'UNAVAILABLE').length;
    const avgPrice = total > 0
        ? (allAreas.reduce((sum, a) => sum + (a.pricePerDay || 0), 0) / total).toFixed(2)
        : 0;

    const elem = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    elem('total-areas-stat', total);
    elem('available-areas-stat', available);
    elem('rented-areas-stat', unavailable);
    elem('avg-price-stat', `${avgPrice} PLN`);
    elem('count-all', total);
    elem('count-available', available);
    elem('count-unavailable', unavailable);
}

function displayAreas(filter = 'all') {
    const container = document.getElementById('areas-container');
    if (!container) return;

    let filteredAreas = allAreas;
    if (filter === 'available') {
        filteredAreas = allAreas.filter(a => a.status === 'AVAILABLE');
    } else if (filter === 'unavailable') {
        filteredAreas = allAreas.filter(a => a.status === 'UNAVAILABLE');
    }

    container.innerHTML = '';

    if (filteredAreas.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;"><i class="fas fa-inbox fa-3x"></i><p style="margin-top: 20px;">Brak obszarów do wyświetlenia.</p></div>`;
        return;
    }

    filteredAreas.forEach(area => {
        const card = createAreaCard(area);
        container.appendChild(card);
    });
}

function createAreaCard(area) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-area-id', area.id);

    const statusText = area.status === 'AVAILABLE' ? 'Dostępny' : 'Niedostępny';
    const statusClass = area.status === 'AVAILABLE' ? 'status-approved' : 'status-rejected';
    const ownerName = `${area.ownerFirstName || ''} ${area.ownerLastName || ''}`.trim() || 'Nieznany';
    const location = area.coordinates && area.coordinates.length > 0
        ? `${area.coordinates[0][0].toFixed(4)}, ${area.coordinates[0][1].toFixed(4)}`
        : 'Brak lokalizacji';

    // ZMIANA: Obsługa listy kwiatów
    const flowerType = (area.flowers && area.flowers.length > 0)
        ? area.flowers.map(f => f.name).join(', ')
        : 'Nie określono';

    // ZMIANA: Obsługa zdjęcia głównego
    const imageUrl = (area.images && area.images.length > 0)
        ? `data:image/jpeg;base64,${area.images[0]}`
        : 'assets/default-area.jpg';

    // Pobierz kolor pierwszego kwiata dla belki tytułowej lub domyślny
    const firstFlowerColor = (area.flowers && area.flowers.length > 0)
        ? area.flowers[0].color
        : 'rgba(242, 169, 0, 0.15)'; // Domyślny kolor

    // Jeśli kolor jest hex, dodaj przezroczystość dla tła
    const headerColor = firstFlowerColor.startsWith('#')
        ? hexToRgba(firstFlowerColor, 0.15)
        : firstFlowerColor;

    card.innerHTML = `
        <div class="card-header" style="background-color: ${headerColor};">
            <div class="card-header-title">${area.name || 'Bez nazwy'}</div>
            <div class="card-header-status"><span class="status-badge ${statusClass}">${statusText}</span></div>
        </div>
        <div class="area-preview" style="position: relative; overflow: hidden;">
            <img src="${imageUrl}" alt="Obszar" style="width: 100%; height: 200px; object-fit: cover;">
        </div>
        <div class="card-body">
            <div class="card-property"><span class="property-label"><i class="fas fa-seedling"></i> Typ pożytku:</span><span class="property-value">${flowerType}</span></div>
            <div class="card-property"><span class="property-label"><i class="fas fa-user"></i> Właściciel:</span><span class="property-value">${ownerName}</span></div>
            <div class="card-property"><span class="property-label"><i class="fas fa-map-marker-alt"></i> Lokalizacja:</span><span class="property-value">${location}</span></div>
            <div class="card-property"><span class="property-label"><i class="fas fa-th"></i> Powierzchnia:</span><span class="property-value">${area.area ? area.area.toFixed(2) + ' ha' : 'Brak danych'}</span></div>
            <div class="card-property"><span class="property-label"><i class="fas fa-cubes"></i> Max. uli:</span><span class="property-value">${area.maxHives || 0}</span></div>
            <div class="card-property"><span class="property-label"><i class="fas fa-money-bill-wave"></i> Cena/dzień:</span><span class="property-value" style="color: var(--accent-dark); font-weight: 600;">${area.pricePerDay ? area.pricePerDay.toFixed(2) : '0.00'} PLN</span></div>
        </div>
        <div class="card-footer" style="display: flex; gap: 8px; padding: 16px; border-top: 1px solid #eee;">
            <button class="btn btn-primary card-btn" onclick="viewAreaDetails(${area.id})" style="flex: 1;"><i class="fas fa-eye"></i> Szczegóły</button>
            <button class="btn btn-danger card-btn" onclick="openDeleteAreaModal(${area.id})"><i class="fas fa-trash"></i> Usuń</button>
        </div>
    `;

    return card;
}

// Pomocnicza funkcja do konwersji HEX na RGBA
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function viewAreaDetails(areaId) {
    let area = allAreas.find(a => a.id === areaId);

    if (!area) {
        fetch(`${API_BASE}/api/areas`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => response.json())
            .then(areas => {
                area = areas.find(a => a.id === areaId);
                if (area) {
                    showAreaDetailsModal(area);
                } else {
                    alert('Nie znaleziono obszaru');
                }
            })
            .catch(error => {
                console.error('Błąd pobierania obszaru:', error);
                alert('Nie udało się pobrać szczegółów obszaru');
            });
        return;
    }

    showAreaDetailsModal(area);
}

function showAreaDetailsModal(area) {
    const ownerName = `${area.ownerFirstName || ''} ${area.ownerLastName || ''}`.trim() || 'Nieznany';
    const statusText = area.status === 'AVAILABLE' ? 'Dostępny' : 'Niedostępny';
    const statusClass = area.status === 'AVAILABLE' ? 'status-approved' : 'status-rejected';

    // ZMIANA: Obsługa listy kwiatów
    const flowerType = (area.flowers && area.flowers.length > 0)
        ? area.flowers.map(f => f.name).join(', ')
        : 'Nie określono';

    // ZMIANA: Obsługa galerii zdjęć
    let galleryHtml = '';
    const images = (area.images && area.images.length > 0) ? area.images : null;

    if (images) {
        // Główne zdjęcie
        galleryHtml += `
            <div class="area-gallery-container">
                <div class="area-image-main">
                    <img id="main-area-img" src="data:image/jpeg;base64,${images[0]}" alt="${area.name}">
                </div>
        `;

        // Miniatury (jeśli więcej niż jedno)
        if (images.length > 1) {
            galleryHtml += `
                <div class="area-thumbnails">
                    ${images.map((img, i) => `
                        <div class="area-thumbnail ${i === 0 ? 'active' : ''}" 
                             onclick="changeMainAreaImage(this, '${img}')">
                            <img src="data:image/jpeg;base64,${img}" alt="Miniatura ${i + 1}">
                        </div>
                    `).join('')}
                </div>
            `;
        }
        galleryHtml += `</div>`; // Zamknięcie area-gallery-container
    } else {
        galleryHtml = `
            <div class="area-gallery-container">
                <div class="area-image-main">
                    <div class="area-image-placeholder">
                        <i class="fas fa-image"></i>
                        <p>Brak zdjęć obszaru</p>
                    </div>
                </div>
            </div>
        `;
    }

    const content = document.getElementById('area-details-content');
    content.innerHTML = `
        ${galleryHtml}
        
        <h3 style="margin-bottom: 20px; color: var(--secondary);">
            ${area.name || 'Bez nazwy'}
            <span class="status-badge ${statusClass}" style="margin-left: 12px;">${statusText}</span>
        </h3>

        <div class="area-details-grid">
            <div class="area-detail-item"><div class="area-detail-label">ID Obszaru</div><div class="area-detail-value">#${area.id}</div></div>
            <div class="area-detail-item"><div class="area-detail-label">Typ pożytku</div><div class="area-detail-value">${flowerType}</div></div>
            <div class="area-detail-item"><div class="area-detail-label">Właściciel</div><div class="area-detail-value">${ownerName}</div></div>
            <div class="area-detail-item"><div class="area-detail-label">Powierzchnia</div><div class="area-detail-value">${area.area ? area.area.toFixed(2) + ' ha' : 'Brak danych'}</div></div>
            <div class="area-detail-item"><div class="area-detail-label">Maksymalna liczba uli</div><div class="area-detail-value">${area.maxHives || 0}</div></div>
            <div class="area-detail-item"><div class="area-detail-label">Cena za dzień</div><div class="area-detail-value" style="color: var(--accent-dark); font-weight: 600;">${area.pricePerDay ? area.pricePerDay.toFixed(2) : '0.00'} PLN</div></div>
            <div class="area-detail-item"><div class="area-detail-label">Dostępny od</div><div class="area-detail-value">${formatDate(area.availableFrom)}</div></div>
            <div class="area-detail-item"><div class="area-detail-label">Współrzędne</div><div class="area-detail-value" style="font-size: 12px;">${area.coordinates && area.coordinates.length > 0 ? `${area.coordinates[0][0].toFixed(6)}, ${area.coordinates[0][1].toFixed(6)}` : 'Brak danych'}</div></div>
        </div>

        ${area.description ? `<div style="margin-top: 20px; padding: 16px; background-color: #f9f9f9; border-radius: 8px;"><div style="font-weight: 600; margin-bottom: 8px; color: #333;">Opis:</div><div style="line-height: 1.6; color: #555;">${area.description}</div></div>` : ''}
    `;

    openModal('area-details-modal');
}

function openDeleteAreaModal(areaId) {
    const area = allAreas.find(a => a.id === areaId);
    if (!area) {
        alert('Nie znaleziono obszaru');
        return;
    }

    document.getElementById('delete-area-id').value = area.id;
    document.getElementById('delete-area-name-display').textContent = area.name || `Obszar #${area.id}`;
    openModal('delete-area-admin-modal');
}

async function confirmDeleteArea() {
    const areaId = document.getElementById('delete-area-id').value;

    try {
        const response = await fetch(`${API_BASE}/api/deleteArea/${areaId}`, {
            method: 'POST',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się usunąć obszaru');

        alert('✅ Obszar został usunięty pomyślnie!');
        closeModal('delete-area-admin-modal');
        await loadAllAreas();
        if (currentTab === 'dashboard') {
            await loadRecentAreas();
        }
    } catch (error) {
        console.error('Błąd podczas usuwania:', error);
        alert('❌ Nie udało się usunąć obszaru: ' + error.message);
    }
}

async function refreshAreas() {
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    icon.classList.add('fa-spin');
    btn.disabled = true;
    await loadAllAreas();
    setTimeout(() => {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }, 500);
}

// ==================== UŻYTKOWNICY ====================
async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE}/api/person/users`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Nie udało się pobrać użytkowników');

        allUsers = await response.json();
        console.log('Załadowano użytkowników:', allUsers.length);

        updateUsersStats();
        displayUsers(currentUsersFilter);

    } catch (error) {
        console.error('Błąd ładowania użytkowników:', error);
        showError('Nie udało się załadować użytkowników');

        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle fa-2x"></i>
                        <p style="margin-top: 10px;">Nie udało się załadować użytkowników.</p>
                    </td>
                </tr>
            `;
        }
    }
}


function updateUsersStats() {
    const total = allUsers.length;
    console.log(total);
    const admins = allUsers.filter(u => u.role === 'ADMIN').length;
    console.log(admins);
    const beekeepers = allUsers.filter(u => u.role === 'BEEKEEPER').length;
    const users = allUsers.filter(u => u.role === 'USER').length;

    const elem = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    elem('total-users-stat', total);
    elem('admins-count-stat', admins);
    elem('beekeepers-count-stat', beekeepers);
    elem('regular-users-stat', users);
    elem('count-all-users', total);
    elem('count-admins', admins);
    elem('count-beekeepers', beekeepers);
    elem('count-users', users);
}

function displayUsers(filter = 'all') {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    let filteredUsers = allUsers;
    if (filter === 'admins') {
        filteredUsers = allUsers.filter(u => u.role === 'ADMIN');
    } else if (filter === 'beekeepers') {
        filteredUsers = allUsers.filter(u => u.role === 'BEEKEEPER');
    } else if (filter === 'users') {
        filteredUsers = allUsers.filter(u => u.role === 'USER');
    }

    tbody.innerHTML = '';

    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">Brak użytkowników do wyświetlenia.</td></tr>';
        return;
    }

    filteredUsers.forEach((user, index) => {
        const row = document.createElement('tr');
        const roleText = {'ADMIN': 'Administrator','BEEKEEPER': 'Pszczelarz','USER': 'Użytkownik'}[user.role] || 'Użytkownik';
        const roleClass = {'ADMIN': 'status-rejected','BEEKEEPER': 'status-approved','USER': 'status-pending'}[user.role] || 'status-pending';

        row.innerHTML = `
            <td>#${String(user.id || index + 1).padStart(3, '0')}</td>
            <td>${user.firstname} ${user.lastname}</td>
            <td>${user.email}</td>
            <td>${user.phone || '-'}</td>
            <td>${formatDate(user.registrationDate) || '-'}</td>
            <td><span class="status-badge ${roleClass}">${roleText}</span></td>
            <td><button class="btn btn-primary card-btn view-user-btn" data-id="${user.id}"><i class="fas fa-eye"></i> Szczegóły</button></td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.view-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            viewUserDetails(id);
        });
    });
}

function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        alert('Nie znaleziono użytkownika');
        return;
    }
    showUserDetailsModal(user);
}

function showUserDetailsModal(user) {
    const roleText = {'ADMIN': 'Administrator','BEEKEEPER': 'Pszczelarz','USER': 'Użytkownik'}[user.role] || 'Użytkownik';
    const roleClass = {'ADMIN': 'status-rejected','BEEKEEPER': 'status-approved','USER': 'status-pending'}[user.role] || 'status-pending';

    const content = document.getElementById('user-details-content');
    content.innerHTML = `
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-dark)); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 600;">${user.firstname.charAt(0)}${user.lastname.charAt(0)}</div>
            <div style="flex: 1;"><h3 style="margin: 0 0 8px 0; color: var(--secondary); font-size: 24px;">${user.firstname} ${user.lastname}</h3><span class="status-badge ${roleClass}" style="font-size: 14px;">${roleText}</span></div>
        </div>
        <div class="user-details-grid">
            <div class="user-detail-item"><div class="user-detail-label">ID Użytkownika</div><div class="user-detail-value">#${String(user.id).padStart(3, '0')}</div></div>
            <div class="user-detail-item"><div class="user-detail-label">Email</div><div class="user-detail-value">${user.email}</div></div>
            <div class="user-detail-item"><div class="user-detail-label">Telefon</div><div class="user-detail-value">${user.phone || 'Nie podano'}</div></div>
            <div class="user-detail-item"><div class="user-detail-label">Data rejestracji</div><div class="user-detail-value">${formatDate(user.registrationDate) || 'Nieznana'}</div></div>
            <div class="user-detail-item"><div class="user-detail-label">Rola w systemie</div><div class="user-detail-value" style="font-weight: 600; color: var(--accent-dark);">${roleText}</div></div>
            <div class="user-detail-item"><div class="user-detail-label">Login</div><div class="user-detail-value">${user.login || user.email}</div></div>
        </div>
        ${user.role === 'BEEKEEPER' ? `<div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-left: 4px solid var(--accent); border-radius: 8px;"><div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;"><i class="fas fa-check-circle" style="color: var(--accent); font-size: 20px;"></i><span style="font-weight: 600; color: var(--secondary); font-size: 16px;">Zweryfikowany pszczelarz</span></div><p style="margin: 0; color: #555; line-height: 1.6;">Ten użytkownik przeszedł pozytywnie proces weryfikacji i może dodawać oraz wynajmować obszary pszczelarskie.</p></div>` : ''}
    `;

    openModal('user-details-modal');
}

async function searchUsers(query) {
    if (!query || query.trim() === '') {
        displayUsers(currentUsersFilter);
        return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = allUsers.filter(user => {
        const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
        const email = user.email.toLowerCase();
        const role = (user.role || '').toLowerCase();
        return fullName.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
    });

    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;"><i class="fas fa-search fa-2x"></i><p style="margin-top: 10px;">Nie znaleziono użytkowników: "${query}"</p></td></tr>`;
        return;
    }

    filtered.forEach((user, index) => {
        const row = document.createElement('tr');
        const roleText = {'ADMIN': 'Administrator','BEEKEEPER': 'Pszczelarz','USER': 'Użytkownik'}[user.role] || 'Użytkownik';
        const roleClass = {'ADMIN': 'status-rejected','BEEKEEPER': 'status-approved','USER': 'status-pending'}[user.role] || 'status-pending';

        row.innerHTML = `
            <td>#${String(user.id || index + 1).padStart(3, '0')}</td>
            <td>${user.firstname} ${user.lastname}</td>
            <td>${user.email}</td>
            <td>${user.phone || '-'}</td>
            <td>${formatDate(user.registrationDate) || '-'}</td>
            <td><span class="status-badge ${roleClass}">${roleText}</span></td>
            <td><button class="btn btn-primary card-btn view-user-btn" data-id="${user.id}"><i class="fas fa-eye"></i> Szczegóły</button></td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.view-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            viewUserDetails(id);
        });
    });
}

async function refreshUsers() {
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    icon.classList.add('fa-spin');
    btn.disabled = true;
    await loadAllUsers();
    setTimeout(() => {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }, 500);
}

function setupUsersSearch() {
    const searchInput = document.querySelector('#manage-users .search-input');
    const searchBtn = document.querySelector('#manage-users .search-btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput ? searchInput.value : '';
            searchUsers(query);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchUsers(this.value);
            }
        });

        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                displayUsers(currentUsersFilter);
            }
        });
    }
}

// ==================== NAWIGACJA ====================
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
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });

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
            await loadAllAreas();
            break;
        case 'manage-users':
            await loadAllUsers();
            break;
    }
}

// ==================== FILTRY ====================
function setupVerificationFilters() {
    document.querySelectorAll('.filter-btn:not([data-filter-areas]):not([data-filter-users])').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            currentFilter = filter;
            document.querySelectorAll('.filter-btn:not([data-filter-areas]):not([data-filter-users])').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadVerifications(filter);
        });
    });
}

function setupAreaFilters() {
    document.querySelectorAll('[data-filter-areas]').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter-areas');
            currentAreasFilter = filter;
            document.querySelectorAll('[data-filter-areas]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayAreas(filter);
        });
    });
}

function setupUsersFilters() {
    document.querySelectorAll('[data-filter-users]').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter-users');
            currentUsersFilter = filter;
            document.querySelectorAll('[data-filter-users]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            displayUsers(filter);
        });
    });
}

// ==================== MODALE ====================
function setupModals() {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

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
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('show');
        modal.style.display = 'none';
    });
    document.body.style.overflow = '';
}

// ==================== POMOCNICZE ====================
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
    console.error(message);
    alert('❌ ' + message);
}