// profile-products.js - Zarządzanie produktami, zakupami i ocenami użytkownika

const API_URL = 'http://localhost:8080/api';

const PREDEFINED_FLOWERS = [
    { name: "Lipa", color: "#FF0000" },
    { name: "Wielokwiat", color: "#FFA500" },
    { name: "Gryka", color: "#FFFF00" },
    { name: "Rzepak", color: "#FFFF99" },
    { name: "Spadź", color: "#800000" },
    { name: "Akacja", color: "#7878FF" },
    { name: "Wrzos", color: "#800080" },
    { name: "Malina", color: "#FF69B4" }
];

// --- Stan plików dla EDYCJI OBSZARU ---
let editAreaFiles = []; // Nowe pliki (File objects)
let editAreaExistingImages = []; // Istniejące zdjęcia (Base64 strings)

// --- Stan plików dla EDYCJI PRODUKTU ---
let editProductFiles = []; // Nowe pliki (File objects)
let editProductExistingImages = []; // Istniejące zdjęcia (Base64 strings)

// --- Stan Filtra Sprzedaży ---
let salesFilter = 'ACTIVE'; // 'ACTIVE' (w trakcie) lub 'HISTORY' (zakończone)

// --- Funkcje walidacji (standardowe) ---
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.add('input-error');

    let errorSpan = input.parentNode.querySelector('.error-message');
    if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        input.parentNode.appendChild(errorSpan);
    }
    errorSpan.textContent = message;
}

function clearErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll('.input-error');
    inputs.forEach(input => input.classList.remove('input-error'));

    const messages = form.querySelectorAll('.error-message');
    messages.forEach(msg => msg.remove());
}


// ==================== INICJALIZACJA ====================
document.addEventListener('DOMContentLoaded', async function() {
    await loadUserProfile();
    await fetchMyAreas();
    await fetchRentedAreas();
    await fetchMyProducts();
    await loadMyBadges();

    setupEventListeners();
});

// ==================== ŁADOWANIE PROFILU ====================
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/user`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();

            const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Gość';
            const welcomeName = document.getElementById('welcome-name');
            if (welcomeName) welcomeName.textContent = fullName;

            const userNameEl = document.getElementById('user-name');
            if (userNameEl) userNameEl.textContent = fullName;

            const userEmailEl = document.getElementById('user-email');
            if (userEmailEl) userEmailEl.textContent = user.email || '';

            const userStatusEl = document.getElementById('user-status');
            if (userStatusEl) userStatusEl.textContent = user.role === 'BEEKEEPER' ? 'Zweryfikowany Pszczelarz' : 'Użytkownik';
        } else if (response.status === 401) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ==================== OBSZARY ====================
async function fetchMyAreas() {
    try {
        const response = await fetch(`${API_URL}/ownedAreas`, {
            method: "GET",
            credentials: "include"
        });
        const areas = await response.json();
        const container = document.getElementById('my-areas-container');
        container.innerHTML = '';

        if (areas.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nie masz jeszcze żadnych obszarów. Dodaj pierwszy obszar!</p>';
            return;
        }

        areas.forEach(area => {
            const status = area.status === 'AVAILABLE' ? 'Aktywny' : 'Nieaktywny';
            const statusClass = area.status === 'AVAILABLE' ? 'card-status-active' : 'card-status-inactive';
            const availability = area.status === 'AVAILABLE'
                ? `Dostępny od ${formatDate(area.availableFrom)}`
                : `Nieaktywny od ${formatDate(area.availableFrom)}`;

            const location = area.coordinates && area.coordinates.length > 0
                ? `${area.coordinates[0][0].toFixed(4)}, ${area.coordinates[0][1].toFixed(4)}`
                : 'Brak lokalizacji';

            let flowersText = 'Brak danych';
            if (area.flowers && area.flowers.length > 0) {
                flowersText = area.flowers.map(f => f.name).join(', ');
            }

            // Używamy pierwszego zdjęcia jako miniatury lub default
            const thumbnail = (area.images && area.images.length > 0)
                ? `data:image/jpeg;base64,${area.images[0]}`
                : 'assets/default-area.jpg';

            const card = `
                <div class="card" data-area-id="${area.id || ''}">
                    <div class="card-header">
                        <div class="card-header-title">${area.name || 'Brak nazwy'}</div>
                        <div class="card-header-status ${statusClass}">${status}</div>
                    </div>
                    <div class="area-preview">
                        <img src="${thumbnail}" alt="Podgląd obszaru">
                    </div>
                    <div class="card-body">
                        <div class="card-property">
                            <div class="card-property-label">Powierzchnia:</div>
                            <div class="card-property-value">${area.area.toFixed(2)} ha</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Lokalizacja: </div>
                            <div class="card-property-value">${location}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Kwiaty: </div>
                            <div class="card-property-value">${flowersText}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Status: </div>
                            <div class="card-property-value">${availability}</div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-outline card-btn edit-area-btn" data-area='${JSON.stringify(area).replace(/'/g, "&apos;")}'>
                            <i class="fas fa-edit"></i> Edytuj
                        </button>
                        <button class="btn btn-danger card-btn delete-area-btn" data-id="${area.id || ''}">
                            <i class="fas fa-trash-alt"></i> Usuń
                        </button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });

        setupAreaButtons();
    } catch (error) {
        console.error('Error fetching areas:', error);
        document.getElementById('my-areas-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania obszarów.</p>';
    }
}

async function fetchRentedAreas() {
    try {
        const response = await fetch(`${API_URL}/reservations/my`, {
            method: "GET",
            credentials: "include"
        });
        const reservations = await response.json();
        const container = document.getElementById('rented-areas-container');
        container.innerHTML = '';

        if (reservations.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nie masz jeszcze żadnych wynajętych obszarów (rezerwacji).</p>';
            return;
        }

        for (const res of reservations) {
            let statusText = res.status;
            let statusClass = 'card-status-inactive';

            if (res.status === 'CONFIRMED' || res.status === 'ACTIVE') {
                statusText = (res.status === 'ACTIVE') ? 'Aktywna' : 'Potwierdzona';
                statusClass = 'card-status-active';
            } else if (res.status === 'COMPLETED') {
                statusText = 'Zakończona';
            } else if (res.status === 'CANCELLED') {
                statusText = 'Anulowana';
            }

            let canReview = false;
            if (res.id) {
                try {
                    const reviewCheckResponse = await fetch(`${API_URL}/reviews/areas/can-review/${res.id}`, {
                        method: "GET",
                        credentials: "include"
                    });
                    if (reviewCheckResponse.ok) {
                        const reviewData = await reviewCheckResponse.json();
                        canReview = reviewData.canReview;
                    }
                } catch (e) {
                    console.error('Błąd sprawdzania statusu opinii:', e);
                }
            }

            const reviewButtonHtml = canReview
                ? `<button class="btn btn-accent card-btn review-area-btn" data-reservation-id="${res.id}">
           <i class="fas fa-star"></i> Wystaw opinię
       </button>`
                : (['COMPLETED', 'ACTIVE', 'CONFIRMED'].includes(res.status) ? `<div class="status-badge reviewed" style="color: #27ae60; font-weight: 600; display: flex; align-items: center; gap: 5px; font-size: 0.9rem;">
           <i class="fas fa-check-circle"></i> Oceniono
       </div>` : '');

            const card = `
                <div class="card">
                    <div class="card-header">
                        <div class="card-header-title">${res.areaName || 'Brak nazwy'}</div>
                        <div class="card-header-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="card-body">
                        <div class="card-property">
                            <div class="card-property-label">Właściciel:</div>
                            <div class="card-property-value">${res.ownerFirstname} ${res.ownerLastname}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Kontakt:</div>
                            <div class="card-property-value" style="font-size:13px;">${res.ownerEmail} <br> ${res.ownerPhone || ''}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Okres:</div>
                            <div class="card-property-value">
                                ${formatDate(res.startDate)} - ${formatDate(res.endDate)}
                            </div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Liczba uli:</div>
                            <div class="card-property-value">${res.numberOfHives}</div>
                        </div>
                         <div class="card-property">
                            <div class="card-property-label">Koszt całkowity:</div>
                            <div class="card-property-value"><strong>${res.totalPrice.toFixed(2)} PLN</strong></div>
                        </div>
                    </div>
                    <div class="card-footer">
                        ${reviewButtonHtml}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        }

        setupAreaReviewButtons();
    } catch (error) {
        console.error('Error fetching rented areas:', error);
        document.getElementById('rented-areas-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania rezerwacji.</p>';
    }
}

// ==================== PRODUKTY ====================
function translateProductCategory(category) {
    const translations = {
        'HONEY': 'Miód',
        'POLLEN': 'Pyłek pszczeli',
        'WAX': 'Wosk pszczeli',
        'PROPOLIS': 'Propolis',
        'BEE_BREAD': 'Pierzga',
        'ROYAL_JELLY': 'Mleczko pszczele',
        'OTHER': 'Inny'
    };
    return translations[category] || category;
}

async function fetchMyProducts() {
    try {
        const response = await fetch(`${API_URL}/products/my`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const products = await response.json();
        const container = document.getElementById('my-products-container');
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nie masz jeszcze żadnych produktów. Dodaj pierwszy produkt!</p>';
            return;
        }

        products.forEach(product => {
            const status = product.available ? 'Dostępny' : 'Wyprzedany';
            const statusClass = product.available ? 'card-status-active' : 'card-status-inactive';
            const categoryName = translateProductCategory(product.category);

            const thumbnail = (product.images && product.images.length > 0)
                ? `data:image/jpeg;base64,${product.images[0]}`
                : 'assets/default-product.jpg';

            const card = `
                <div class="card" data-product-id="${product.id || ''}">
                    <div class="card-header">
                        <div class="card-header-title">${product.name || 'Brak nazwy'}</div>
                        <div class="card-header-status ${statusClass}">${status}</div>
                    </div>
                    <div class="area-preview">
                        <img src="${thumbnail}" alt="Zdjęcie produktu">
                    </div>
                    <div class="card-body">
                        <div class="card-property">
                            <div class="card-property-label">Typ:</div>
                            <div class="card-property-value">${categoryName}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Ilość:</div>
                            <div class="card-property-value">${product.stock || 0} szt.</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Cena:</div>
                            <div class="card-property-value">${(product.price || 0).toFixed(2)} PLN</div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-outline card-btn edit-product-btn" data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}'>
                            <i class="fas fa-edit"></i> Edytuj
                        </button>
                        <button class="btn btn-danger card-btn delete-product-btn" data-id="${product.id || ''}">
                            <i class="fas fa-trash-alt"></i> Usuń
                        </button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });

        setupProductButtons();
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('my-products-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania produktów.</p>';
    }
}

async function loadMyPurchases() {
    try {
        const response = await fetch(`${API_URL}/orders/my-purchases`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const orders = await response.json();
        const container = document.getElementById('bought-products-container');
        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nie masz jeszcze żadnych zakupów. Przejdź do marketplace!</p>';
            return;
        }

        for (const order of orders) {
            let canReview = false;
            try {
                const reviewCheckResponse = await fetch(`${API_URL}/reviews/products/can-review/${order.id}`, {
                    method: "GET",
                    credentials: "include"
                });
                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    canReview = reviewData.canReview;
                }
            } catch (e) {
                console.error('Error checking review status:', e);
            }

            const reviewButton = canReview
                ? `<button class="btn btn-accent card-btn review-product-btn" data-order-id="${order.id}" data-product-id="${order.productId}" data-product-name="${order.productName}">
                    <i class="fas fa-star"></i> Wystaw opinię
                   </button>`
                : `<div class="status-badge reviewed">
                    <i class="fas fa-check-circle"></i> Oceniono
                   </div>`;

            const thumbnail = order.productImage
                ? `data:image/jpeg;base64,${order.productImage}`
                : 'assets/default-product.jpg';

            let statusLabel = order.status;
            let statusClass = 'card-status-active';

            switch (order.status) {
                case 'PENDING':
                    statusLabel = 'Oczekujące';
                    break;
                case 'CONFIRMED':
                    statusLabel = 'Opłacone (W przygotowaniu)';
                    break;
                case 'PROCESSING':
                    statusLabel = 'W trakcie realizacji';
                    break;
                case 'SHIPPED':
                    statusLabel = 'Wysłane (W drodze)';
                    break;
                case 'DELIVERED':
                    statusLabel = 'Dostarczone';
                    break;
                case 'COMPLETED':
                    statusLabel = 'Zakończone';
                    statusClass = 'card-status-inactive';
                    break;
                case 'CANCELLED':
                    statusLabel = 'Anulowane';
                    statusClass = 'card-status-inactive';
                    break;
                default:
                    statusLabel = order.status;
            }

            const card = `
                <div class="card">
                    <div class="card-header">
                        <div class="card-header-title">${order.productName}</div>
                        <div class="card-header-status ${statusClass}">${statusLabel}</div>
                    </div>
                    <div class="area-preview">
                        <img src="${thumbnail}" alt="${order.productName}">
                    </div>
                    <div class="card-body">
                        <div class="card-property">
                            <div class="card-property-label">Kategoria:</div>
                            <div class="card-property-value">${translateProductCategory(order.productCategory)}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Ilość:</div>
                            <div class="card-property-value">${order.quantity} szt.</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Cena za sztukę:</div>
                            <div class="card-property-value">${order.pricePerUnit.toFixed(2)} PLN</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Suma:</div>
                            <div class="card-property-value"><strong>${order.totalPrice.toFixed(2)} PLN</strong></div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Data zakupu:</div>
                            <div class="card-property-value">${formatDate(order.orderedAt)}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Sprzedawca:</div>
                            <div class="card-property-value">${order.sellerFirstname} ${order.sellerLastname}</div>
                        </div>
                    </div>
                    <div class="card-footer">
                        ${reviewButton}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        }

        setupProductReviewButtons();
    } catch (error) {
        console.error('Error fetching purchases:', error);
        document.getElementById('bought-products-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania zakupów.</p>';
    }
}

// ==================== ZARZĄDZANIE GALERIĄ ZDJĘĆ ====================
window.removeEditAreaFile = function(index, isExisting) {
    if (isExisting) {
        editAreaExistingImages.splice(index, 1);
    } else {
        editAreaFiles.splice(index, 1);
    }
    updateEditAreaPreview();
};

window.removeEditProductFile = function(index, isExisting) {
    if (isExisting) {
        editProductExistingImages.splice(index, 1);
    } else {
        editProductFiles.splice(index, 1);
    }
    updateEditProductPreview();
};

function updateEditAreaPreview() {
    const gallery = document.getElementById('edit-area-gallery');
    gallery.innerHTML = '';
    if (editAreaExistingImages.length === 0 && editAreaFiles.length === 0) {
        gallery.innerHTML = `<div class="empty-preview"><i class="fas fa-images" style="font-size: 24px; margin-bottom: 5px;"></i><span>Brak zdjęć</span></div>`;
        return;
    }
    editAreaExistingImages.forEach((imgBase64, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item existing';
        item.innerHTML = `<img src="data:image/jpeg;base64,${imgBase64}" alt="Existing"><div class="remove-btn" onclick="removeEditAreaFile(${index}, true)"><i class="fas fa-times"></i></div>`;
        gallery.appendChild(item);
    });
    editAreaFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `<img src="${e.target.result}" alt="New"><div class="remove-btn" onclick="removeEditAreaFile(${index}, false)"><i class="fas fa-times"></i></div>`;
            gallery.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function updateEditProductPreview() {
    const gallery = document.getElementById('edit-product-gallery');
    gallery.innerHTML = '';
    if (editProductExistingImages.length === 0 && editProductFiles.length === 0) {
        gallery.innerHTML = `<div class="empty-preview"><i class="fas fa-images" style="font-size: 24px; margin-bottom: 5px;"></i><span>Brak zdjęć</span></div>`;
        return;
    }
    editProductExistingImages.forEach((imgBase64, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item existing';
        item.innerHTML = `<img src="data:image/jpeg;base64,${imgBase64}" alt="Existing"><div class="remove-btn" onclick="removeEditProductFile(${index}, true)"><i class="fas fa-times"></i></div>`;
        gallery.appendChild(item);
    });
    editProductFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `<img src="${e.target.result}" alt="New"><div class="remove-btn" onclick="removeEditProductFile(${index}, false)"><i class="fas fa-times"></i></div>`;
            gallery.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function filesToBase64List(files) {
    return Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    })));
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', async function(e) {
            const tabId = this.getAttribute('data-tab');
            if (!tabId) return;

            e.preventDefault();
            document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const tabElement = document.getElementById(tabId);
            if (tabElement) tabElement.classList.add('active');

            if (tabId === 'products') await fetchMyProducts();
            else if (tabId === 'sold-products') await fetchSoldProducts();
            else if (tabId === 'bought-products') await loadMyPurchases();
            else if (tabId === 'areas') await fetchMyAreas();
            else if (tabId === 'rented-areas') await fetchRentedAreas();
            else if (tabId === 'sold-areas') await fetchSoldAreas();
            else if (tabId === 'badges') await loadMyBadges();
        });
    });

    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            const stars = this.parentElement.querySelectorAll('.star');
            const ratingInput = this.closest('form').querySelector('input[name="rating"]');
            if (ratingInput) ratingInput.value = value;
            stars.forEach(s => {
                s.classList.toggle('active', parseInt(s.getAttribute('data-value')) <= value);
            });
        });
    });

    document.querySelectorAll('.modal-close, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeAllModals();
        });
    });

    const submitProductReviewBtn = document.querySelector('.submit-product-review-btn');
    if (submitProductReviewBtn) submitProductReviewBtn.addEventListener('click', submitProductReview);
    const submitAreaReviewBtn = document.querySelector('.submit-area-review-btn');
    if (submitAreaReviewBtn) submitAreaReviewBtn.addEventListener('click', submitAreaReview);
    const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleDelete);

    const submitEditAreaBtn = document.querySelector('.submit-edit-area-btn');
    if (submitEditAreaBtn) submitEditAreaBtn.onclick = handleEditAreaSubmit;
    const submitEditProductBtn = document.querySelector('.submit-edit-product-btn');
    if (submitEditProductBtn) submitEditProductBtn.onclick = handleEditProductSubmit;

    const editAreaImageInput = document.getElementById('edit-area-image');
    if (editAreaImageInput) {
        editAreaImageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (!editAreaFiles.some(f => f.name === file.name && f.size === file.size)) editAreaFiles.push(file);
            });
            updateEditAreaPreview();
            this.value = '';
        });
    }
    const editProductImageInput = document.getElementById('edit-product-image');
    if (editProductImageInput) {
        editProductImageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (!editProductFiles.some(f => f.name === file.name && f.size === file.size)) editProductFiles.push(file);
            });
            updateEditProductPreview();
            this.value = '';
        });
    }
}

function setupAreaButtons() {
    document.querySelectorAll('.edit-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            clearErrors('edit-area-form'); // Wyczyść błędy przy otwieraniu
            const area = JSON.parse(this.getAttribute('data-area'));
            document.getElementById('edit-area-id').value = area.id || '';
            document.getElementById('edit-area-title').value = area.name || '';
            const statusSwitch = document.getElementById('edit-area-status-switch');
            if (statusSwitch) statusSwitch.checked = area.status === 'AVAILABLE';
            document.getElementById('edit-area-size-display').textContent = `${(area.area || 0).toFixed(2)} ha`;
            const location = area.coordinates && area.coordinates.length > 0 ? `${area.coordinates[0][0].toFixed(4)}, ${area.coordinates[0][1].toFixed(4)}` : 'Brak lokalizacji';
            document.getElementById('edit-area-location-display').textContent = location;
            document.getElementById('edit-area-size').value = area.area || '';
            document.getElementById('edit-area-location').value = location;
            const flowersContainer = document.getElementById('edit-area-flowers-container');
            if (flowersContainer) {
                flowersContainer.innerHTML = '';
                PREDEFINED_FLOWERS.forEach(pf => {
                    const isChecked = area.flowers && area.flowers.some(f => f.name === pf.name);
                    flowersContainer.insertAdjacentHTML('beforeend', `
                        <label style="display: flex; align-items: center; font-size: 13px; cursor: pointer;">
                            <input type="checkbox" name="flowers" value="${pf.name}" ${isChecked ? 'checked' : ''} style="width: auto; margin-right: 8px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${pf.color}; margin-right: 6px; border-radius: 2px;"></span>
                            ${pf.name}
                        </label>`);
                });
            }
            document.getElementById('edit-area-date-to').value = area.endDate || '';
            document.getElementById('edit-area-max-hives').value = area.maxHives || '';
            document.getElementById('edit-area-price').value = area.pricePerDay || '';
            document.getElementById('edit-area-description').value = area.description || '';
            editAreaFiles = []; editAreaExistingImages = area.images ? [...area.images] : [];
            updateEditAreaPreview();
            openModal('edit-area-modal');
        });
    });
    document.querySelectorAll('.delete-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('delete-item-id').value = this.getAttribute('data-id');
            document.getElementById('delete-item-type').value = 'area';
            openModal('delete-confirm-modal');
        });
    });
}

function setupAreaReviewButtons() {
    document.querySelectorAll('.review-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('area-review-reservation-id').value = this.getAttribute('data-reservation-id');
            document.getElementById('area-review-content').value = '';
            document.getElementById('area-review-rating').value = '5';
            document.querySelectorAll('#area-review-modal .star').forEach((s, idx) => s.classList.toggle('active', idx < 5));
            openModal('area-review-modal');
        });
    });
}

function setupProductButtons() {
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            clearErrors('edit-product-form'); // Wyczyść błędy przy otwieraniu
            const product = JSON.parse(this.getAttribute('data-product'));
            document.getElementById('edit-product-id').value = product.id || '';
            document.getElementById('edit-product-title').value = product.name || '';
            const statusSwitch = document.getElementById('edit-product-status-switch');
            if(statusSwitch) statusSwitch.checked = product.available;
            document.getElementById('edit-product-type').value = product.category || 'OTHER';
            document.getElementById('edit-product-quantity').value = product.stock || 0;
            document.getElementById('edit-product-price').value = product.price || 0;
            document.getElementById('edit-product-description').value = product.description || '';
            editProductFiles = []; editProductExistingImages = product.images ? [...product.images] : [];
            updateEditProductPreview();
            openModal('edit-product-modal');
        });
    });
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('delete-item-id').value = this.getAttribute('data-id');
            document.getElementById('delete-item-type').value = 'product';
            openModal('delete-confirm-modal');
        });
    });
}

function setupProductReviewButtons() {
    document.querySelectorAll('.review-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('product-review-order-id').value = this.getAttribute('data-order-id');
            document.getElementById('product-review-id').value = this.getAttribute('data-product-id');
            document.getElementById('product-review-content').value = '';
            document.getElementById('product-review-rating').value = '5';
            document.querySelectorAll('#product-review-modal .star').forEach((s, idx) => s.classList.toggle('active', idx < 5));
            const modalTitle = document.querySelector('#product-review-modal .modal-title');
            if(modalTitle) modalTitle.textContent = `Wystaw opinię: ${this.getAttribute('data-product-name')}`;
            openModal('product-review-modal');
        });
    });
}


async function handleEditAreaSubmit(e) {
    e.preventDefault();
    clearErrors('edit-area-form');

    const nameInput = document.getElementById('edit-area-title');
    const maxHivesInput = document.getElementById('edit-area-max-hives');
    const priceInput = document.getElementById('edit-area-price');
    const dateToInput = document.getElementById('edit-area-date-to');
    const descInput = document.getElementById('edit-area-description');

    const name = nameInput.value.trim();
    const maxHives = parseInt(maxHivesInput.value);
    const price = parseFloat(priceInput.value);
    const description = descInput.value;

    // Zbieramy kwiaty wcześniej, aby móc je zwalidować
    const selectedFlowers = [];
    document.querySelectorAll('#edit-area-flowers-container input[type="checkbox"]:checked').forEach(cb => {
        const flowerDef = PREDEFINED_FLOWERS.find(pf => pf.name === cb.value);
        if (flowerDef) selectedFlowers.push({ name: flowerDef.name, color: flowerDef.color });
    });

    let isValid = true;

    // @NotBlank
    if (!name) {
        showError('edit-area-title', 'Nazwa obszaru jest wymagana');
        isValid = false;
    }

    // @Min(1)
    if (isNaN(maxHives) || maxHives < 1) {
        showError('edit-area-max-hives', 'Maksymalna liczba uli musi wynosić co najmniej 1');
        isValid = false;
    }

    // @PositiveOrZero
    if (isNaN(price) || price < 0) {
        showError('edit-area-price', 'Cena nie może być ujemna');
        isValid = false;
    }

    // Walidacja Kwiatów: Przynajmniej jeden
    if (selectedFlowers.length === 0) {
        showError('edit-area-flowers-container', 'Wybierz przynajmniej jeden rodzaj pożytku');
        isValid = false;
    }

    // @Future - endDate
    if (dateToInput.value) {
        const selectedDate = new Date(dateToInput.value);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (selectedDate <= today) {
            showError('edit-area-date-to', 'Data zakończenia musi być w przyszłości');
            isValid = false;
        }
    }

    if (!isValid) return;

    const form = document.getElementById('edit-area-form');
    const formData = new FormData(form);
    const finalImagesList = [...editAreaExistingImages];
    if (editAreaFiles.length > 0) {
        try { finalImagesList.push(...await filesToBase64List(editAreaFiles)); } catch (e) { alert('Błąd przetwarzania zdjęć'); return; }
    }

    const editAreaDTO = {
        id: parseInt(document.getElementById('edit-area-id').value),
        name: name,
        images: finalImagesList,
        flowers: selectedFlowers,
        maxHives: maxHives,
        pricePerDay: price,
        description: description,
        endDate: formData.get('dateTo'),
        availabilityStatus: formData.get('status') === 'on' ? 'AVAILABLE' : 'UNAVAILABLE'
    };
    try {
        const response = await fetch(`${API_URL}/editArea`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(editAreaDTO)
        });
        if (!response.ok) throw new Error('Błąd HTTP');
        alert('✅ Obszar zaktualizowany!'); closeAllModals(); await fetchMyAreas();
    } catch (error) { alert('❌ Błąd aktualizacji.'); }
}

async function handleEditProductSubmit(e) {
    e.preventDefault();
    clearErrors('edit-product-form');

    const nameInput = document.getElementById('edit-product-title');
    const stockInput = document.getElementById('edit-product-quantity');
    const priceInput = document.getElementById('edit-product-price');
    const descInput = document.getElementById('edit-product-description');

    const name = nameInput.value.trim();
    const stock = parseInt(stockInput.value);
    const price = parseFloat(priceInput.value);
    const description = descInput.value.trim();

    let isValid = true;

    // Walidacja UpdateProductDTO
    // @Size(min = 3, max = 100)
    if (!name) {
        showError('edit-product-title', 'Nazwa produktu jest wymagana');
        isValid = false;
    } else if (name.length < 3 || name.length > 100) {
        showError('edit-product-title', 'Nazwa produktu musi mieć od 3 do 100 znaków');
        isValid = false;
    }

    // @Min(0) - Stock
    if (isNaN(stock) || stock < 0) {
        showError('edit-product-quantity', 'Ilość nie może być ujemna');
        isValid = false;
    }

    // @Positive - Price
    if (isNaN(price) || price <= 0) {
        showError('edit-product-price', 'Cena musi być większa od 0');
        isValid = false;
    }

    // @Size(min = 10) - Description
    if (description.length < 10) {
        showError('edit-product-description', 'Opis produktu musi mieć co najmniej 10 znaków');
        isValid = false;
    }

    if (!isValid) return;

    const finalImagesList = [...editProductExistingImages];
    if (editProductFiles.length > 0) {
        try { finalImagesList.push(...await filesToBase64List(editProductFiles)); } catch (e) { alert('Błąd przetwarzania zdjęć'); return; }
    }
    const statusSwitch = document.getElementById('edit-product-status-switch');
    const updateProductDTO = {
        id: parseInt(document.getElementById('edit-product-id').value),
        name: name,
        category: document.getElementById('edit-product-type').value,
        stock: stock,
        price: price,
        description: description,
        images: finalImagesList,
        available: statusSwitch ? statusSwitch.checked : true
    };
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(updateProductDTO)
        });
        if (!response.ok) throw new Error('Błąd HTTP');
        alert('✅ Produkt zaktualizowany!'); closeAllModals(); await fetchMyProducts();
    } catch (error) { alert('❌ Błąd aktualizacji.'); }
}

async function submitProductReview() {
    const orderId = parseInt(document.getElementById('product-review-order-id').value);
    const rating = parseInt(document.getElementById('product-review-rating').value);
    const comment = document.getElementById('product-review-content').value.trim();
    if (!comment || comment.length < 10) { alert('⚠️ Opinia min. 10 znaków.'); return; }
    try {
        const response = await fetch(`${API_URL}/reviews/products`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ orderId, rating, comment })
        });
        if (response.ok) { alert('✅ Opinia dodana!'); closeAllModals(); await loadMyPurchases(); } else { alert('❌ Błąd.'); }
    } catch (e) { alert('❌ Błąd.'); }
}

async function submitAreaReview() {
    const reservationId = parseInt(document.getElementById('area-review-reservation-id').value);
    const rating = parseInt(document.getElementById('area-review-rating').value);
    const comment = document.getElementById('area-review-content').value.trim();
    if (!comment || comment.length < 10) { alert('⚠️ Opinia min. 10 znaków.'); return; }
    try {
        const response = await fetch(`${API_URL}/reviews/areas`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ reservationId, rating, comment })
        });
        if (response.ok) { alert('✅ Opinia dodana!'); closeAllModals(); await fetchRentedAreas(); } else { alert('❌ Błąd: Obszar ktoremu chcesz wystawić opinie nie istnieje..'); }
    } catch (e) { alert('❌ Obszar ktoremu chcesz wystawić opinie nie istnieje.'); }
}

async function handleDelete() {
    const itemId = document.getElementById('delete-item-id').value;
    const itemType = document.getElementById('delete-item-type').value;

    try {
        if (itemType === 'area') {
            const response = await fetch(`${API_URL}/deleteArea/${itemId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                alert('✅ Obszar usunięty!');
                await fetchMyAreas();
            } else {
                const errorText = await response.text();
                alert('❌ ' + (errorText || 'Nie udało się usunąć obszaru.'));
            }

        } else if (itemType === 'product') {
            const response = await fetch(`${API_URL}/products/${itemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert('✅ Produkt usunięty!');
                await fetchMyProducts();
            } else {
                let errorMessage = 'Nie udało się usunąć produktu.';
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    console.error('Błąd parsowania odpowiedzi błędu:', e);
                }
                alert('❌ ' + errorMessage);
            }
        }
    } catch (e) {
        console.error('Delete error:', e);
        alert('❌ Wystąpił błąd połączenia z serwerem.');
    }
    closeAllModals();
}

function formatDate(dateString) {
    if (!dateString) return 'Brak daty';
    return new Date(dateString).toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
function openModal(modalId) { const m = document.getElementById(modalId); if(m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; } }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); document.body.style.overflow = 'auto'; }

// ==================== FILTROWANIE SPRZEDAŻY I ZMIANA STATUSU ====================

window.setSalesFilter = function(filter) {
    salesFilter = filter;
    document.getElementById('filter-active').classList.toggle('active-filter', filter === 'ACTIVE');
    document.getElementById('filter-history').classList.toggle('active-filter', filter === 'HISTORY');
    fetchSoldProducts();
};

async function fetchSoldProducts() {
    try {
        const response = await fetch(`${API_URL}/orders/my-sales`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) throw new Error('Błąd pobierania sprzedaży');

        const allOrders = await response.json();
        const container = document.getElementById('sold-products-container');
        container.innerHTML = '';

        const filteredOrders = allOrders.filter(order => {
            if (salesFilter === 'ACTIVE') {
                return ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status);
            } else {
                return ['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status);
            }
        });

        if (filteredOrders.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>${salesFilter === 'ACTIVE' ? 'Brak aktywnych zamówień.' : 'Brak historii sprzedaży.'}</p></div>`;
            return;
        }

        filteredOrders.forEach(order => {
            const thumbnail = order.productImage
                ? `data:image/jpeg;base64,${order.productImage}`
                : 'assets/default-product.jpg';

            let statusText = 'Nieznany';
            let statusClass = 'card-status-inactive';
            let actionButton = '';

            switch (order.status) {
                case 'CONFIRMED':
                    statusText = 'Opłacone (Do wysyłki)';
                    statusClass = 'card-status-active';
                    actionButton = `
                        <button class="btn btn-primary card-btn" onclick="updateOrderStatus(${order.id}, 'SHIPPED')">
                            <i class="fas fa-shipping-fast"></i> Oznacz jako wysłane
                        </button>
                    `;
                    break;
                case 'SHIPPED':
                    statusText = 'Wysłane (W drodze)';
                    statusClass = 'card-status-active';
                    actionButton = `
                        <button class="btn btn-outline card-btn" onclick="updateOrderStatus(${order.id}, 'COMPLETED')">
                            <i class="fas fa-check"></i> Zakończ zamówienie
                        </button>
                    `;
                    break;
                case 'COMPLETED':
                    statusText = 'Zakończone';
                    statusClass = 'card-status-inactive';
                    break;
                case 'CANCELLED':
                    statusText = 'Anulowane';
                    statusClass = 'card-status-inactive';
                    break;
                default:
                    statusText = order.status;
            }

            const card = `
                <div class="card">
                    <div class="card-header">
                        <div class="card-header-title">Zamówienie #${order.id}</div>
                        <div class="card-header-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="area-preview">
                        <img src="${thumbnail}" alt="${order.productName}">
                    </div>
                    <div class="card-body">
                        <div class="card-property">
                            <div class="card-property-label">Produkt:</div>
                            <div class="card-property-value">${order.productName}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Kupujący:</div>
                            <div class="card-property-value">${order.buyerFirstname} ${order.buyerLastname}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Ilość:</div>
                            <div class="card-property-value">${order.quantity} szt.</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Suma:</div>
                            <div class="card-property-value"><strong>${order.totalPrice.toFixed(2)} PLN</strong></div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Data:</div>
                            <div class="card-property-value">${formatDate(order.orderedAt)}</div>
                        </div>
                        ${order.deliveryAddress ? `
                        <div class="card-property" style="display:block; margin-top:10px; border-top:1px solid #eee; padding-top:5px;">
                            <div class="card-property-label" style="margin-bottom:3px;">Adres dostawy:</div>
                            <div class="card-property-value" style="font-size:13px;">${order.deliveryAddress}</div>
                        </div>` : ''}
                    </div>
                    <div class="card-footer">
                        ${actionButton}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });

    } catch (error) {
        console.error('Error fetching sales:', error);
        document.getElementById('sold-products-container').innerHTML =
            '<p style="text-align: center; color: #e74c3c;">Błąd ładowania historii sprzedaży.</p>';
    }
}

window.updateOrderStatus = async function(orderId, newStatus) {
    if (!confirm(`Czy na pewno chcesz zmienić status zamówienia na: ${newStatus}?`)) return;

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status?status=${newStatus}`, {
            method: 'PUT',
            credentials: 'include'
        });

        if (response.ok) {
            alert('✅ Status zaktualizowany!');
            fetchSoldProducts();
        } else {
            const err = await response.json();
            alert('❌ Błąd: ' + (err.error || 'Nie udało się zmienić statusu'));
        }
    } catch (e) {
        console.error('Error updating status:', e);
        alert('❌ Błąd połączenia.');
    }
};

async function fetchSoldAreas() {
    try {
        const response = await fetch(`${API_URL}/reservations/areas`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) throw new Error('Błąd pobierania rezerwacji');

        const reservations = await response.json();
        const container = document.getElementById('sold-areas-container');
        container.innerHTML = '';

        if (reservations.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Nikt jeszcze nie zarezerwował Twoich obszarów.</p></div>';
            return;
        }

        reservations.forEach(res => {
            let statusText = res.status;
            let statusClass = 'card-status-inactive';

            if (res.status === 'CONFIRMED' || res.status === 'ACTIVE') {
                statusText = 'Potwierdzona';
                statusClass = 'card-status-active';
            } else if (res.status === 'COMPLETED') {
                statusText = 'Zakończona';
            } else if (res.status === 'CANCELLED') {
                statusText = 'Anulowana';
            }

            const card = `
                <div class="card">
                    <div class="card-header">
                        <div class="card-header-title">${res.areaName}</div>
                        <div class="card-header-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="card-body">
                        <div class="card-property">
                            <div class="card-property-label">Najemca:</div>
                            <div class="card-property-value">${res.tenantFirstname} ${res.tenantLastname}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Kontakt:</div>
                            <div class="card-property-value" style="font-size:13px;">${res.tenantEmail}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Okres:</div>
                            <div class="card-property-value">
                                ${formatDate(res.startDate)} - ${formatDate(res.endDate)}
                            </div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Liczba uli:</div>
                            <div class="card-property-value">${res.numberOfHives}</div>
                        </div>
                        <div class="card-property">
                            <div class="card-property-label">Zysk:</div>
                            <div class="card-property-value" style="color: #27ae60; font-weight:bold;">+${res.totalPrice.toFixed(2)} PLN</div>
                        </div>
                        ${res.notes ? `
                        <div class="card-property" style="display:block; margin-top:10px; background:#f9f9f9; padding:8px; border-radius:4px;">
                            <div class="card-property-label" style="font-size:11px;">Uwagi od najemcy:</div>
                            <div class="card-property-value" style="font-size:13px; font-style:italic;">"${res.notes}"</div>
                        </div>` : ''}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });

    } catch (error) {
        console.error('Error fetching area reservations:', error);
        document.getElementById('sold-areas-container').innerHTML =
            '<p style="text-align: center; color: #e74c3c;">Błąd ładowania rezerwacji.</p>';
    }
}

async function loadMyBadges() {
    try {
        const response = await fetch(`${API_URL}/badges/my`, { method: 'GET', credentials: 'include' });
        if (!response.ok) throw new Error('Błąd pobierania odznak');
        displayMyBadges(await response.json());
    } catch (error) { document.getElementById('my-badges-container').innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">Nie udało się załadować odznak.</p>'; }
}

function displayMyBadges(badges) {
    const container = document.getElementById('my-badges-container');
    if (!container) return;
    if (!badges || badges.length === 0) {
        container.innerHTML = `<div class="no-badges-message"><i class="fas fa-award" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i><h3 style="color: #999; margin-bottom: 10px;">Nie masz jeszcze żadnych odznak</h3><p style="color: #999;">Bądź aktywny na platformie, aby zdobywać odznaki!</p></div>`;
        return;
    }
    container.innerHTML = badges.map(badge => `
        <div class="badge-card">
            <div class="badge-card-icon" style="background-color: ${badge.color}15; border-color: ${badge.color};"><i class="${badge.icon}" style="color: ${badge.color};"></i></div>
            <div class="badge-card-content"><h3 class="badge-card-name">${badge.name}</h3><p class="badge-card-description">${badge.description}</p></div>
            <div class="badge-card-earned"><i class="fas fa-check-circle" style="color: ${badge.color};"></i><span>Zdobyte!</span></div>
        </div>`).join('');
}

async function refreshBadges() {
    const container = document.getElementById('my-badges-container');
    if (!container) return;
    const originalContent = container.innerHTML;
    container.innerHTML = `<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #F2A900;"></i><p style="color: #999; margin-top: 15px;">Sprawdzanie nowych odznak...</p></div>`;
    try {
        const response = await fetch(`${API_URL}/badges/my`, { method: 'GET', credentials: 'include' });
        if (!response.ok) throw new Error('Błąd odświeżania');
        const badges = await response.json();
        container.innerHTML = `<div style="text-align: center; padding: 2rem;"><i class="fas fa-check-circle" style="font-size: 48px; color: #51CF66;"></i><p style="color: #51CF66; margin-top: 15px; font-weight: 600;">Odznaki zaktualizowane!</p></div>`;
        setTimeout(() => displayMyBadges(badges), 1000);
    } catch (error) {
        console.error('Error refreshing badges:', error);
        container.innerHTML = originalContent;
        alert('❌ Nie udało się odświeżyć odznak.');
    }
}