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

            // Obsługa listy kwiatów
            let flowersText = 'Brak danych';
            if (area.flowers && area.flowers.length > 0) {
                flowersText = area.flowers.map(f => f.name).join(', ');
            }

            const card = `
                <div class="card" data-area-id="${area.id || ''}">
                    <div class="card-header">
                        <div class="card-header-title">${area.name || 'Brak nazwy'}</div>
                        <div class="card-header-status ${statusClass}">${status}</div>
                    </div>
                    <div class="area-preview">
                        <img src="${area.imgBase64 ? `data:image/jpeg;base64,${area.imgBase64}` : 'assets/default-area.jpg'}"
                             alt="Podgląd obszaru"
                             onerror="this.src='assets/default-area.jpg'">
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
                            <button class="btn btn-primary card-btn activate-area-btn" data-id="${area.id || ''}">
                                <i class="fas fa-check"></i> Aktywuj
                            </button>
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

            const card = `
                <div class="card" data-area-id="${area.id || ''}">
                    <div class="card-header">
                        <div class="card-header-title">${area.name || 'Brak nazwy'}</div>
                        <div class="card-header-status ${statusClass}">${status}</div>
                    </div>
                    <div class="area-preview">
                        <img src="${area.imgBase64 ? `data:image/jpeg;base64,${area.imgBase64}` : 'assets/default-area.jpg'}"
                             alt="Podgląd obszaru">
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

            const card = `
                <div class="card" data-product-id="${product.id || ''}">
                    <div class="card-header">
                        <div class="card-header-title">${product.name || 'Brak nazwy'}</div>
                        <div class="card-header-status ${statusClass}">${status}</div>
                    </div>
                    <div class="area-preview">
                        <img src="${product.imageBase64 ? `data:image/jpeg;base64,${product.imageBase64}` : 'assets/default-product.jpg'}"
                             alt="Zdjęcie produktu">
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

            const card = `
                <div class="card">
                    <div class="card-header">
                        <div class="card-header-title">${order.productName}</div>
                        <div class="card-header-status card-status-active">Zakupiono</div>
                    </div>
                    <div class="area-preview">
                        <img src="${order.productImage ? `data:image/jpeg;base64,${order.productImage}` : 'assets/default-product.jpg'}" 
                             alt="${order.productName}">
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

// ==================== WYSYŁANIE OPINII ====================
async function submitProductReview() {
    const orderId = parseInt(document.getElementById('product-review-order-id').value);
    const rating = parseInt(document.getElementById('product-review-rating').value);
    const comment = document.getElementById('product-review-content').value.trim();

    if (!comment || comment.length < 10) {
        alert('⚠️ Proszę wpisać opinię (minimum 10 znaków).');
        return;
    }

    if (rating < 1 || rating > 5) {
        alert('⚠️ Ocena musi być w zakresie 1-5.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reviews/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                orderId: orderId,
                rating: rating,
                comment: comment
            })
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

    if (rating < 1 || rating > 5) {
        alert('⚠️ Ocena musi być w zakresie 1-5.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reviews/areas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                reservationId: reservationId,
                rating: rating,
                comment: comment
            })
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

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', async function(e) {
            e.preventDefault();

            document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'products') {
                await fetchMyProducts();
            } else if (tabId === 'bought-products') {
                await loadMyPurchases();
            } else if (tabId === 'areas') {
                await fetchMyAreas();
            } else if (tabId === 'rented-areas') {
                await fetchRentedAreas();
            } else if (tabId === 'badges') {
                await loadMyBadges();
            }
        });
    });

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

    // Obsługa zmiany zdjęcia
    const editAreaImageInput = document.getElementById('edit-area-image');
    if (editAreaImageInput) {
        editAreaImageInput.addEventListener('change', handleFilePreview);
    }

    const editProductImageInput = document.getElementById('edit-product-image');
    if (editProductImageInput) {
        editProductImageInput.addEventListener('change', handleFilePreview);
    }
}

function handleFilePreview() {
    const file = this.files[0];
    const targetImgId = this.id === 'edit-area-image' ? 'edit-area-current-image' : 'edit-product-current-image';
    const nameSpan = this.closest('.image-upload-controls').querySelector('.selected-file-name');

    if (file) {
        nameSpan.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(targetImgId).src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Zaktualizowana funkcja setupAreaButtons dla obsługi wielu kwiatów
function setupAreaButtons() {
    document.querySelectorAll('.edit-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const areaData = this.getAttribute('data-area');
            const area = JSON.parse(areaData);

            document.getElementById('edit-area-id').value = area.id || '';
            document.getElementById('edit-area-title').value = area.name || '';
            const statusSwitch = document.getElementById('edit-area-status-switch');
            if (statusSwitch) statusSwitch.checked = area.status === 'AVAILABLE';

            document.getElementById('edit-area-size-display').textContent = `${area.area.toFixed(2)} ha`;

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

            const currentImage = document.getElementById('edit-area-current-image');
            if(currentImage) {
                currentImage.src = area.imgBase64
                    ? `data:image/jpeg;base64,${area.imgBase64}`
                    : 'assets/default-area.jpg';
            }

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

            const currentImage = document.getElementById('edit-product-current-image');
            if(currentImage) {
                currentImage.src = product.imageBase64
                    ? `data:image/jpeg;base64,${product.imageBase64}`
                    : 'assets/default-product.jpg';
            }

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

// Funkcja pomocnicza do konwersji wielu plików
function convertFilesToBase64(files) {
    return Promise.all(Array.from(files).map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    })));
}

// Obsługa zapisu edycji obszaru
async function handleEditAreaSubmit(e) {
    e.preventDefault();

    const form = document.getElementById('edit-area-form');
    const formData = new FormData(form);
    const areaId = document.getElementById('edit-area-id').value;

    // Obsługa zdjęć (starych i nowych)
    let imagesList = null;
    const imageFiles = document.getElementById('edit-area-image').files;

    if (imageFiles.length > 0) {
        // Jeśli wybrano nowe pliki, konwertujemy je na listę Base64
        try {
            imagesList = await convertFilesToBase64(imageFiles);
        } catch (error) {
            alert('Błąd podczas przetwarzania zdjęć.');
            return;
        }
    } else {
        // Jeśli nie wybrano nowych plików, wysyłamy null (backend nie rusza zdjęć)
        // LUB jeśli chcemy zachować kompatybilność z polem imgBase64 (starym)
        // to backend i tak obsłuży to po swojemu.
        imagesList = null;
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
        // imgBase64: imgBase64, // To pole jest ignorowane przez nowy backend dla zdjęć, ale może być używane do podglądu
        images: imagesList, // <-- Nowa lista zdjęć
        flowers: selectedFlowers, // Wysyłamy listę obiektów
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

    let imagesList = null;
    const imageFiles = document.getElementById('edit-product-image').files;

    if (imageFiles.length > 0) {
        try {
            imagesList = await convertFilesToBase64(imageFiles);
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
        images: imagesList, // <-- Nowa lista zdjęć
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

// ==================== USUWANIE I PLIKI ====================
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

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// ==================== POMOCNICZE ====================
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

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// ==================== ODZNAKI ====================

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