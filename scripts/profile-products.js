// profile-products.js - Zarządzanie produktami, zakupami i ocenami użytkownika

const API_URL = 'http://localhost:8080/api';

// ==================== INICJALIZACJA ====================
document.addEventListener('DOMContentLoaded', async function() {
    await loadUserProfile();
    await fetchMyAreas();
    await fetchRentedAreas();
    await fetchMyProducts();

    setupEventListeners();
});

// ==================== ŁADOWANIE PROFILU ====================
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/person`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();

            const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Gość';
            document.getElementById('welcome-name').textContent = fullName;
            document.getElementById('user-name').textContent = fullName;
            document.getElementById('user-email').textContent = user.email || '';
            document.getElementById('user-status').textContent = user.role === 'BEEKEEPER' ? 'Zweryfikowany Pszczelarz' : 'Użytkownik';
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
                            <div class="card-property-value">${area.type || 'Brak danych'}</div>
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
        const response = await fetch(`${API_URL}/rentedAreas`, {
            method: "GET",
            credentials: "include"
        });
        const areas = await response.json();

        console.log('Rented areas response:', areas); // DEBUG - sprawdź czy jest reservationId

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

        // Dla każdego zamówienia sprawdź czy można wystawić opinię
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

    // Walidacja
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
            await loadMyPurchases(); // Odśwież listę zakupów
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

    // Walidacja
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
            await fetchRentedAreas(); // Odśwież listę wynajętych obszarów
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
    // Zakładki
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', async function(e) {
            e.preventDefault();

            document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Załaduj dane dla odpowiedniej zakładki
            if (tabId === 'products') {
                await fetchMyProducts();
            } else if (tabId === 'bought-products') {
                await loadMyPurchases();
            } else if (tabId === 'areas') {
                await fetchMyAreas();
            } else if (tabId === 'rented-areas') {
                await fetchRentedAreas();
            }
        });
    });

    // Gwiazdki w modalach
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            const stars = this.parentElement.querySelectorAll('.star');
            const ratingInput = this.closest('form').querySelector('input[name="rating"]');
            ratingInput.value = value;

            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Zamykanie modali
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

    // Przyciski wysyłania opinii
    document.querySelector('.submit-product-review-btn').addEventListener('click', submitProductReview);
    document.querySelector('.submit-area-review-btn').addEventListener('click', submitAreaReview);

    // Usuwanie
    document.querySelector('.confirm-delete-btn').addEventListener('click', handleDelete);
}

function setupAreaButtons() {
    document.querySelectorAll('.edit-area-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const areaData = this.getAttribute('data-area');
            const area = JSON.parse(areaData);

            console.log('Area data:', area);

            document.getElementById('edit-area-id').value = area.id || '';
            document.getElementById('edit-area-title').value = area.name || '';
            document.getElementById('edit-area-status-switch').checked = area.status === 'AVAILABLE';
            document.getElementById('edit-area-size-display').textContent = `${area.area.toFixed(2)} ha`;

            const location = area.coordinates && area.coordinates.length > 0
                ? `${area.coordinates[0][0].toFixed(4)}, ${area.coordinates[0][1].toFixed(4)}`
                : 'Brak lokalizacji';
            document.getElementById('edit-area-location-display').textContent = location;

            document.getElementById('edit-area-size').value = area.area || '';
            document.getElementById('edit-area-location').value = location;
            document.getElementById('edit-area-flowers').value = area.type || '';
            document.getElementById('edit-area-date-to').value = area.endDate || area.availableFrom || '';
            document.getElementById('edit-area-max-hives').value = area.maxHives || '';
            document.getElementById('edit-area-price').value = area.pricePerDay || '';
            document.getElementById('edit-area-description').value = area.description || '';
            document.getElementById('edit-area-current-image').src = area.imgBase64
                ? `data:image/jpeg;base64,${area.imgBase64}`
                : 'assets/default-area.jpg';

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

            // Zresetuj gwiazdki na 5
            const stars = document.querySelectorAll('#area-review-modal .star');
            stars.forEach((star, index) => {
                if (index < 5) {
                    star.classList.add('active');
                }
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

            console.log('Product data:', product);

            document.getElementById('edit-product-id').value = product.id || '';
            document.getElementById('edit-product-title').value = product.name || '';
            document.getElementById('edit-product-status-switch').checked = product.available;
            document.getElementById('edit-product-type').value = product.category || 'OTHER';
            document.getElementById('edit-product-quantity').value = product.stock || 0;
            document.getElementById('edit-product-price').value = product.price || 0;
            document.getElementById('edit-product-description').value = product.description || '';
            document.getElementById('edit-product-current-image').src = product.imageBase64
                ? `data:image/jpeg;base64,${product.imageBase64}`
                : 'assets/default-product.jpg';

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

            // Ustaw dane w modalu
            document.getElementById('product-review-order-id').value = orderId;
            document.getElementById('product-review-id').value = productId;
            document.getElementById('product-review-content').value = '';
            document.getElementById('product-review-rating').value = '5';

            // Zresetuj gwiazdki na 5
            const stars = document.querySelectorAll('#product-review-modal .star');
            stars.forEach((star, index) => {
                if (index < 5) {
                    star.classList.add('active');
                }
            });

            // Pokaż nazwę produktu w tytule modala
            document.querySelector('#product-review-modal .modal-title').textContent = `Wystaw opinię: ${productName}`;

            openModal('product-review-modal');
        });
    });
}

// ==================== USUWANIE ====================
async function handleDelete() {
    const itemId = document.getElementById('delete-item-id').value;
    const itemType = document.getElementById('delete-item-type').value;

    if (itemType === 'area') {
        try {
            const response = await fetch(`${API_URL}/deleteArea/${itemId}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                alert(`✅ Obszar został usunięty!`);
                await fetchMyAreas();
            } else {
                alert('❌ Błąd podczas usuwania obszaru.');
            }
        } catch (error) {
            console.error('Error deleting area:', error);
            alert('❌ Nie udało się usunąć obszaru.');
        }
    } else if (itemType === 'product') {
        try {
            const response = await fetch(`${API_URL}/products/${itemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                alert(`✅ Produkt został usunięty!`);
                await fetchMyProducts();
            } else {
                const errorData = await response.json();
                alert(`❌ Błąd: ${errorData.error || 'Nieznany błąd'}`);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('❌ Nie udało się usunąć produktu.');
        }
    }
    const editAreaImageInput = document.getElementById('edit-area-image');
    if (editAreaImageInput) {
        editAreaImageInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'Nie wybrano pliku';
            this.closest('.image-upload-controls').querySelector('.selected-file-name').textContent = fileName;
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('edit-area-current-image').src = e.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

// Obsługa zmiany zdjęcia produktu
    const editProductImageInput = document.getElementById('edit-product-image');
    if (editProductImageInput) {
        editProductImageInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'Nie wybrano pliku';
            this.closest('.image-upload-controls').querySelector('.selected-file-name').textContent = fileName;
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('edit-product-current-image').src = e.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

// Funkcja do konwersji pliku na Base64
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Get Base64 string without prefix
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

// Obsługa wysyłania formularza edycji obszaru
    const submitEditAreaBtn = document.querySelector('.submit-edit-area-btn');
    if (submitEditAreaBtn) {
        submitEditAreaBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            const form = document.getElementById('edit-area-form');
            const formData = new FormData(form);
            const areaId = document.getElementById('edit-area-id').value;
            let imgBase64 = document.getElementById('edit-area-current-image').src.includes('base64')
                ? document.getElementById('edit-area-current-image').src.split(',')[1] // Existing Base64
                : null;

            const imageFile = document.getElementById('edit-area-image').files[0];
            if (imageFile) {
                try {
                    imgBase64 = await toBase64(imageFile);
                } catch (error) {
                    console.error('Error converting image to Base64:', error);
                    alert('Błąd podczas przetwarzania zdjęcia. Spróbuj ponownie.');
                    return;
                }
            }

            const editAreaDTO = {
                id: parseInt(areaId),
                name: document.getElementById('edit-area-title').value,
                imgBase64: imgBase64,
                type: formData.get('flowers'),
                maxHives: parseInt(formData.get('maxHives')) || 0,
                pricePerDay: parseFloat(formData.get('price')) || 0,
                description: formData.get('description'),
                endDate: formData.get('dateTo'),
                availabilityStatus: formData.get('status') === 'on' ? 'AVAILABLE' : 'UNAVAILABLE'
            };

            try {
                const response = await fetch(`${API_URL}/editArea`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(editAreaDTO)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                alert('✅ Obszar został zaktualizowany!');
                closeAllModals();
                await fetchMyAreas();
            } catch (error) {
                console.error('Error updating area:', error);
                alert('❌ Nie udało się zaktualizować obszaru. Sprawdź konsolę dla szczegółów.');
            }
        });
    }

// Obsługa wysyłania formularza edycji produktu
    const submitEditProductBtn = document.querySelector('.submit-edit-product-btn');
    if (submitEditProductBtn) {
        submitEditProductBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            const productId = document.getElementById('edit-product-id').value;
            let imgBase64 = document.getElementById('edit-product-current-image').src.includes('base64')
                ? document.getElementById('edit-product-current-image').src.split(',')[1]
                : null;

            const imageFile = document.getElementById('edit-product-image').files[0];
            if (imageFile) {
                try {
                    imgBase64 = await toBase64(imageFile);
                } catch (error) {
                    console.error('Error converting image to Base64:', error);
                    alert('Błąd podczas przetwarzania zdjęcia. Spróbuj ponownie.');
                    return;
                }
            }

            const updateProductDTO = {
                id: parseInt(productId),
                name: document.getElementById('edit-product-title').value,
                category: document.getElementById('edit-product-type').value,
                stock: parseInt(document.getElementById('edit-product-quantity').value) || 0,
                price: parseFloat(document.getElementById('edit-product-price').value) || 0,
                description: document.getElementById('edit-product-description').value,
                imgBase64: imgBase64,
                available: document.getElementById('edit-product-status-switch').checked
            };

            try {
                const response = await fetch(`${API_URL}/products`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(updateProductDTO)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Błąd podczas aktualizacji produktu');
                }

                alert('✅ Produkt został zaktualizowany!');
                closeAllModals();
                await fetchMyProducts();
            } catch (error) {
                console.error('Error updating product:', error);
                alert(`❌ Nie udało się zaktualizować produktu: ${error.message}`);
            }
        });
    }
    closeAllModals();
}

// ==================== POMOCNICZE ====================
function formatDate(dateString) {
    if (!dateString) return 'Brak daty';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
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