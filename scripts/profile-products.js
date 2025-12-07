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
                        ${area.status === 'AVAILABLE' ? `
                            <button class="btn btn-danger card-btn delete-area-btn" data-id="${area.id || ''}">
                                <i class="fas fa-trash-alt"></i> Usuń
                            </button>
                        ` : `
                            <button class="btn btn-danger card-btn delete-area-btn" data-id="${area.id || ''}">
                                <i class="fas fa-trash-alt"></i> Usuń
                            </button>
                        `}
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
        const response = await fetch(`${API_URL}/rentedAreas`, {
            method: "GET",
            credentials: "include"
        });
        const areas = await response.json();
        const container = document.getElementById('rented-areas-container');
        container.innerHTML = '';

        if (areas.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nie masz jeszcze żadnych wynajętych obszarów.</p>';
            return;
        }

        areas.forEach(area => {
            const status = area.status === 'AVAILABLE' ? 'Aktywny' : 'Zakończony';
            const statusClass = area.status === 'AVAILABLE' ? 'card-status-active' : 'card-status-inactive';

            const location = area.coordinates && area.coordinates.length > 0
                ? `${area.coordinates[0][0].toFixed(4)}, ${area.coordinates[0][1].toFixed(4)}`
                : 'Brak lokalizacji';

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
                    </div>
                    <div class="card-footer">
                        ${area.reservationId ? `
                            <button class="btn btn-accent card-btn review-area-btn" data-reservation-id="${area.reservationId}">
                                <i class="fas fa-star"></i> Wystaw opinię
                            </button>
                        ` : `
                            <span style="color: #999; font-size: 0.9rem;">Brak rezerwacji</span>
                        `}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });

        setupAreaReviewButtons();
    } catch (error) {
        console.error('Error fetching rented areas:', error);
        document.getElementById('rented-areas-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania wynajętych obszarów.</p>';
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

// ==================== KUPIONE PRODUKTY ====================
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

            const card = `
                <div class="card">
                    <div class="card-header">
                        <div class="card-header-title">${order.productName}</div>
                        <div class="card-header-status card-status-active">Zakupiono</div>
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

// Funkcja globalna do usuwania zdjęcia z edycji obszaru (wywoływana z onclick w HTML)
window.removeEditAreaFile = function(index, isExisting) {
    if (isExisting) {
        editAreaExistingImages.splice(index, 1);
    } else {
        editAreaFiles.splice(index, 1);
    }
    updateEditAreaPreview();
};

// Funkcja globalna do usuwania zdjęcia z edycji produktu (wywoływana z onclick w HTML)
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
        gallery.innerHTML = `
            <div class="empty-preview">
                <i class="fas fa-images" style="font-size: 24px; margin-bottom: 5px;"></i>
                <span>Brak zdjęć</span>
            </div>
        `;
        return;
    }

    // Wyświetl istniejące zdjęcia
    editAreaExistingImages.forEach((imgBase64, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item existing';
        item.title = 'Istniejące zdjęcie';
        item.innerHTML = `
            <img src="data:image/jpeg;base64,${imgBase64}" alt="Existing">
            <div class="remove-btn" onclick="removeEditAreaFile(${index}, true)" title="Usuń">
                <i class="fas fa-times"></i>
            </div>
        `;
        gallery.appendChild(item);
    });

    // Wyświetl nowe zdjęcia
    editAreaFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                <img src="${e.target.result}" alt="New">
                <div class="remove-btn" onclick="removeEditAreaFile(${index}, false)" title="Usuń">
                    <i class="fas fa-times"></i>
                </div>
            `;
            gallery.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function updateEditProductPreview() {
    const gallery = document.getElementById('edit-product-gallery');
    gallery.innerHTML = '';

    if (editProductExistingImages.length === 0 && editProductFiles.length === 0) {
        gallery.innerHTML = `
            <div class="empty-preview">
                <i class="fas fa-images" style="font-size: 24px; margin-bottom: 5px;"></i>
                <span>Brak zdjęć</span>
            </div>
        `;
        return;
    }

    // Wyświetl istniejące zdjęcia
    editProductExistingImages.forEach((imgBase64, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item existing';
        item.title = 'Istniejące zdjęcie';
        item.innerHTML = `
            <img src="data:image/jpeg;base64,${imgBase64}" alt="Existing">
            <div class="remove-btn" onclick="removeEditProductFile(${index}, true)" title="Usuń">
                <i class="fas fa-times"></i>
            </div>
        `;
        gallery.appendChild(item);
    });

    // Wyświetl nowe zdjęcia
    editProductFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                <img src="${e.target.result}" alt="New">
                <div class="remove-btn" onclick="removeEditProductFile(${index}, false)" title="Usuń">
                    <i class="fas fa-times"></i>
                </div>
            `;
            gallery.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

// Helper: Konwersja wielu plików na Base64 (taki sam jak w add-product.html)
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
            e.preventDefault();

            document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            const tabId = this.getAttribute('data-tab');
            const tabElement = document.getElementById(tabId);
            if (tabElement) tabElement.classList.add('active');


            if (tabId === 'products') {
                await fetchMyProducts();
            } else if (tabId === 'sold-products') {
                await fetchSoldProducts();
            } else if (tabId === 'bought-products') {
                await loadMyPurchases();
            } else if (tabId === 'areas') {
                await fetchMyAreas();
            } else if (tabId === 'rented-areas') {
                await fetchRentedAreas();
            } else if (tabId === 'sold-areas') {
                await fetchSoldAreas();
            } else if (tabId === 'badges') {
                await loadMyBadges();
            }
        });
    });

    // Gwiazdki w modalach opinii
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            const stars = this.parentElement.querySelectorAll('.star');
            const ratingInput = this.closest('form').querySelector('input[name="rating"]');
            if (ratingInput) ratingInput.value = value;

            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Modale
    document.querySelectorAll('.modal-close, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });

    const submitProductReviewBtn = document.querySelector('.submit-product-review-btn');
    if (submitProductReviewBtn) submitProductReviewBtn.addEventListener('click', submitProductReview);

    const submitAreaReviewBtn = document.querySelector('.submit-area-review-btn');
    if (submitAreaReviewBtn) submitAreaReviewBtn.addEventListener('click', submitAreaReview);

    const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleDelete);

    // Obsługa zapisu edycji obszaru
    const submitEditAreaBtn = document.querySelector('.submit-edit-area-btn');
    if (submitEditAreaBtn) {
        submitEditAreaBtn.onclick = handleEditAreaSubmit;
    }

    // Obsługa zapisu edycji produktu
    const submitEditProductBtn = document.querySelector('.submit-edit-product-btn');
    if (submitEditProductBtn) {
        submitEditProductBtn.onclick = handleEditProductSubmit;
    }

    // Obsługa wyboru plików w modalach (inputy z 'multiple')
    const editAreaImageInput = document.getElementById('edit-area-image');
    if (editAreaImageInput) {
        editAreaImageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (!editAreaFiles.some(f => f.name === file.name && f.size === file.size)) {
                    editAreaFiles.push(file);
                }
            });
            updateEditAreaPreview();
            this.value = ''; // Reset inputa
        });
    }

    const editProductImageInput = document.getElementById('edit-product-image');
    if (editProductImageInput) {
        editProductImageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (!editProductFiles.some(f => f.name === file.name && f.size === file.size)) {
                    editProductFiles.push(file);
                }
            });
            updateEditProductPreview();
            this.value = ''; // Reset inputa
        });
    }
}

// Funkcja setupAreaButtons - wypełnianie modalu edycji obszaru
function setupAreaButtons() {
    document.querySelectorAll('.edit-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const areaData = this.getAttribute('data-area');
            const area = JSON.parse(areaData);

            document.getElementById('edit-area-id').value = area.id || '';
            document.getElementById('edit-area-title').value = area.name || '';
            const statusSwitch = document.getElementById('edit-area-status-switch');
            if (statusSwitch) statusSwitch.checked = area.status === 'AVAILABLE';

            document.getElementById('edit-area-size-display').textContent = `${(area.area || 0).toFixed(2)} ha`;

            const location = area.coordinates && area.coordinates.length > 0
                ? `${area.coordinates[0][0].toFixed(4)}, ${area.coordinates[0][1].toFixed(4)}`
                : 'Brak lokalizacji';
            document.getElementById('edit-area-location-display').textContent = location;

            document.getElementById('edit-area-size').value = area.area || '';
            document.getElementById('edit-area-location').value = location;

            // Generowanie checkboxów dla kwiatów
            const flowersContainer = document.getElementById('edit-area-flowers-container');
            if (flowersContainer) {
                flowersContainer.innerHTML = '';
                PREDEFINED_FLOWERS.forEach(pf => {
                    const isChecked = area.flowers && area.flowers.some(f => f.name === pf.name);
                    const checkboxHtml = `
                        <label style="display: flex; align-items: center; font-size: 13px; cursor: pointer;">
                            <input type="checkbox" name="flowers" value="${pf.name}" ${isChecked ? 'checked' : ''} style="width: auto; margin-right: 8px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${pf.color}; margin-right: 6px; border-radius: 2px;"></span>
                            ${pf.name}
                        </label>
                    `;
                    flowersContainer.insertAdjacentHTML('beforeend', checkboxHtml);
                });
            }

            document.getElementById('edit-area-date-to').value = area.endDate || area.availableFrom || '';
            document.getElementById('edit-area-max-hives').value = area.maxHives || '';
            document.getElementById('edit-area-price').value = area.pricePerDay || '';
            document.getElementById('edit-area-description').value = area.description || '';

            // Obsługa zdjęć - reset i załadowanie istniejących
            editAreaFiles = []; // Wyczyść nowe pliki
            editAreaExistingImages = []; // Wyczyść listę istniejących

            if (area.images && Array.isArray(area.images)) {
                editAreaExistingImages = [...area.images]; // Kopia tablicy
            }
            updateEditAreaPreview();

            openModal('edit-area-modal');
        });
    });

    document.querySelectorAll('.delete-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            document.getElementById('delete-item-id').value = itemId;
            document.getElementById('delete-item-type').value = 'area';
            openModal('delete-confirm-modal');
        });
    });
}

function setupAreaReviewButtons() {
    document.querySelectorAll('.review-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-reservation-id');
            document.getElementById('area-review-reservation-id').value = reservationId;
            document.getElementById('area-review-content').value = '';
            document.getElementById('area-review-rating').value = '5';

            const stars = document.querySelectorAll('#area-review-modal .star');
            stars.forEach((s, idx) => {
                if (idx < 5) s.classList.add('active');
                else s.classList.remove('active');
            });

            openModal('area-review-modal');
        });
    });
}

// Funkcja setupProductButtons - wypełnianie modalu edycji produktu
function setupProductButtons() {
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productData = this.getAttribute('data-product');
            const product = JSON.parse(productData);

            document.getElementById('edit-product-id').value = product.id || '';
            document.getElementById('edit-product-title').value = product.name || '';

            const statusSwitch = document.getElementById('edit-product-status-switch');
            if(statusSwitch) statusSwitch.checked = product.available;

            document.getElementById('edit-product-type').value = product.category || 'OTHER';
            document.getElementById('edit-product-quantity').value = product.stock || 0;
            document.getElementById('edit-product-price').value = product.price || 0;
            document.getElementById('edit-product-description').value = product.description || '';

            // Obsługa zdjęć - reset i załadowanie istniejących
            editProductFiles = [];
            editProductExistingImages = [];

            if (product.images && Array.isArray(product.images)) {
                editProductExistingImages = [...product.images];
            }
            updateEditProductPreview();

            openModal('edit-product-modal');
        });
    });

    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            document.getElementById('delete-item-id').value = itemId;
            document.getElementById('delete-item-type').value = 'product';
            openModal('delete-confirm-modal');
        });
    });
}

function setupProductReviewButtons() {
    document.querySelectorAll('.review-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            document.getElementById('product-review-order-id').value = orderId;
            document.getElementById('product-review-id').value = productId;
            document.getElementById('product-review-content').value = '';
            document.getElementById('product-review-rating').value = '5';

            const stars = document.querySelectorAll('#product-review-modal .star');
            stars.forEach((s, idx) => {
                if (idx < 5) s.classList.add('active');
                else s.classList.remove('active');
            });

            const modalTitle = document.querySelector('#product-review-modal .modal-title');
            if(modalTitle) modalTitle.textContent = `Wystaw opinię: ${productName}`;

            openModal('product-review-modal');
        });
    });
}

// ==================== ZAPIS DANYCH (HANDLERS) ====================

// Obsługa zapisu edycji obszaru
async function handleEditAreaSubmit(e) {
    e.preventDefault();

    const form = document.getElementById('edit-area-form');
    const formData = new FormData(form);
    const areaId = document.getElementById('edit-area-id').value;

    // Przetwarzanie zdjęć:
    // 1. Weź istniejące (te, których user nie usunął)
    const finalImagesList = [...editAreaExistingImages];

    // 2. Skonwertuj i dodaj nowe
    if (editAreaFiles.length > 0) {
        try {
            const newImagesBase64 = await filesToBase64List(editAreaFiles);
            finalImagesList.push(...newImagesBase64);
        } catch (error) {
            alert('Błąd podczas przetwarzania nowych zdjęć.');
            return;
        }
    }

    // Zbieranie zaznaczonych kwiatów
    const selectedFlowers = [];
    document.querySelectorAll('#edit-area-flowers-container input[type="checkbox"]:checked').forEach(cb => {
        const flowerDef = PREDEFINED_FLOWERS.find(pf => pf.name === cb.value);
        if (flowerDef) {
            selectedFlowers.push({
                name: flowerDef.name,
                color: flowerDef.color
            });
        }
    });

    const editAreaDTO = {
        id: parseInt(areaId),
        name: document.getElementById('edit-area-title').value,
        images: finalImagesList, // <-- Połączona lista zdjęć (stare + nowe)
        flowers: selectedFlowers,
        maxHives: parseInt(formData.get('maxHives')) || 0,
        pricePerDay: parseFloat(formData.get('price')) || 0,
        description: formData.get('description'),
        endDate: formData.get('dateTo'),
        availabilityStatus: formData.get('status') === 'on' ? 'AVAILABLE' : 'UNAVAILABLE'
    };

    try {
        const response = await fetch(`${API_URL}/editArea`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(editAreaDTO)
        });

        if (!response.ok) throw new Error('Błąd HTTP');

        alert('✅ Obszar został zaktualizowany!');
        closeAllModals();
        await fetchMyAreas();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Nie udało się zaktualizować obszaru.');
    }
}

// Obsługa zapisu edycji produktu
async function handleEditProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('edit-product-id').value;

    // Przetwarzanie zdjęć:
    const finalImagesList = [...editProductExistingImages];

    if (editProductFiles.length > 0) {
        try {
            const newImagesBase64 = await filesToBase64List(editProductFiles);
            finalImagesList.push(...newImagesBase64);
        } catch (error) {
            alert('Błąd przetwarzania zdjęć');
            return;
        }
    }

    const statusSwitch = document.getElementById('edit-product-status-switch');

    const updateProductDTO = {
        id: parseInt(productId),
        name: document.getElementById('edit-product-title').value,
        category: document.getElementById('edit-product-type').value,
        stock: parseInt(document.getElementById('edit-product-quantity').value) || 0,
        price: parseFloat(document.getElementById('edit-product-price').value) || 0,
        description: document.getElementById('edit-product-description').value,
        images: finalImagesList, // <-- Połączona lista zdjęć
        available: statusSwitch ? statusSwitch.checked : true
    };

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateProductDTO)
        });

        if (!response.ok) throw new Error('Błąd HTTP');

        alert('✅ Produkt został zaktualizowany!');
        closeAllModals();
        await fetchMyProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        alert('❌ Nie udało się zaktualizować produktu.');
    }
}

// ==================== INNE FUNKCJE ====================

// Review submitting functions (takie same jak wcześniej)
async function submitProductReview() {
    const orderId = parseInt(document.getElementById('product-review-order-id').value);
    const rating = parseInt(document.getElementById('product-review-rating').value);
    const comment = document.getElementById('product-review-content').value.trim();

    if (!comment || comment.length < 10) {
        alert('⚠️ Proszę wpisać opinię (minimum 10 znaków).');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reviews/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ orderId, rating, comment })
        });

        if (response.ok) {
            alert('✅ Dziękujemy za opinię!');
            closeAllModals();
            await loadMyPurchases();
        } else {
            const error = await response.json();
            alert('❌ Błąd: ' + (error.error || 'Nie udało się wysłać opinii.'));
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('❌ Wystąpił błąd podczas wysyłania opinii.');
    }
}

async function submitAreaReview() {
    const reservationId = parseInt(document.getElementById('area-review-reservation-id').value);
    const rating = parseInt(document.getElementById('area-review-rating').value);
    const comment = document.getElementById('area-review-content').value.trim();

    if (!comment || comment.length < 10) {
        alert('⚠️ Proszę wpisać opinię (minimum 10 znaków).');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reviews/areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ reservationId, rating, comment })
        });

        if (response.ok) {
            alert('✅ Dziękujemy za opinię!');
            closeAllModals();
            await fetchRentedAreas();
        } else {
            const error = await response.json();
            alert('❌ Błąd: ' + (error.error || 'Nie udało się wysłać opinii.'));
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('❌ Wystąpił błąd podczas wysyłania opinii.');
    }
}

// Delete handlers
async function handleDelete() {
    const itemId = document.getElementById('delete-item-id').value;
    const itemType = document.getElementById('delete-item-type').value;

    if (itemType === 'area') {
        try {
            await fetch(`${API_URL}/deleteArea/${itemId}`, {
                method: 'POST',
                credentials: 'include'
            });
            alert('✅ Obszar został usunięty!');
            await fetchMyAreas();
        } catch (error) {
            alert('❌ Błąd podczas usuwania obszaru.');
        }
    } else if (itemType === 'product') {
        try {
            await fetch(`${API_URL}/products/${itemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            alert('✅ Produkt został usunięty!');
            await fetchMyProducts();
        } catch (error) {
            alert('❌ Błąd podczas usuwania produktu.');
        }
    }
    closeAllModals();
}

// Helpers
function formatDate(dateString) {
    if (!dateString) return 'Brak daty';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}
// ==================== SPRZEDANE PRODUKTY ====================
async function fetchSoldProducts() {
    try {
        const response = await fetch(`${API_URL}/orders/my-sales`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) throw new Error('Błąd pobierania sprzedaży');

        const orders = await response.json();
        const container = document.getElementById('sold-products-container');
        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Nie masz jeszcze żadnych sprzedanych produktów.</p></div>';
            return;
        }

        orders.forEach(order => {
            const thumbnail = order.productImage
                ? `data:image/jpeg;base64,${order.productImage}`
                : 'assets/default-product.jpg';

            // Status płatności (w tym systemie zakładamy, że Completed = Opłacone)
            const statusClass = 'card-status-active'; // Zielony

            const card = `
                <div class="card">
                    <div class="card-header">
                        <div class="card-header-title">Zamówienie #${order.id}</div>
                        <div class="card-header-status ${statusClass}">Opłacone</div>
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

// ==================== SPRZEDANE OBSZARY (REZERWACJE UŻYTKOWNIKA) ====================
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
            // Tłumaczenie statusu
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
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Odznaki
async function loadMyBadges() {
    try {
        const response = await fetch(`${API_URL}/badges/my`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Błąd pobierania odznak');

        const badges = await response.json();
        displayMyBadges(badges);

    } catch (error) {
        const container = document.getElementById('my-badges-container');
        if (container) container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">Nie udało się załadować odznak.</p>';
    }
}

function displayMyBadges(badges) {
    const container = document.getElementById('my-badges-container');
    if (!container) return;

    if (!badges || badges.length === 0) {
        container.innerHTML = `
            <div class="no-badges-message">
                <i class="fas fa-award" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #999; margin-bottom: 10px;">Nie masz jeszcze żadnych odznak</h3>
                <p style="color: #999;">Bądź aktywny na platformie, aby zdobywać odznaki!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = badges.map(badge => `
        <div class="badge-card">
            <div class="badge-card-icon" style="background-color: ${badge.color}15; border-color: ${badge.color};">
                <i class="${badge.icon}" style="color: ${badge.color};"></i>
            </div>
            <div class="badge-card-content">
                <h3 class="badge-card-name">${badge.name}</h3>
                <p class="badge-card-description">${badge.description}</p>
            </div>
            <div class="badge-card-earned">
                <i class="fas fa-check-circle" style="color: ${badge.color};"></i>
                <span>Zdobyte!</span>
            </div>
        </div>
    `).join('');
}

async function refreshBadges() {
    const container = document.getElementById('my-badges-container');
    if (!container) return;
    const originalContent = container.innerHTML;
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #F2A900;"></i>
            <p style="color: #999; margin-top: 15px;">Sprawdzanie nowych odznak...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/badges/check`, {
            method: 'POST',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Błąd odświeżania');

        const badges = await response.json();

        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #51CF66;"></i>
                <p style="color: #51CF66; margin-top: 15px; font-weight: 600;">Odznaki zaktualizowane!</p>
            </div>
        `;

        setTimeout(() => {
            displayMyBadges(badges);
        }, 1000);

    } catch (error) {
        console.error('Error refreshing badges:', error);
        container.innerHTML = originalContent;
        alert('❌ Nie udało się odświeżyć odznak.');
    }

}