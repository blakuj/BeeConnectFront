// product-details.js - Szczegóły produktu i zakup

const API_BASE = 'http://localhost:8080/api';
let currentProduct = null;
let currentUser = null;
let productReviews = [];

// ==================== INICJALIZACJA ====================
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadProductDetails();
    setupEventListeners();
});

// ==================== ŁADOWANIE SZCZEGÓŁÓW PRODUKTU ====================
async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showError('Nie znaleziono produktu');
        return;
    }

    try {
        showLoading(true);

        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Produkt nie został znaleziony');
        }

        currentProduct = await response.json();
        displayProductDetails();
        await loadProductReviews();
        await loadSimilarProducts();
        await loadSellerBadges();

    } catch (error) {
        console.error('Błąd ładowania produktu:', error);
        showError('Nie udało się załadować produktu. Spróbuj ponownie później.');
    } finally {
        showLoading(false);
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ==================== WYŚWIETLANIE SZCZEGÓŁÓW ====================
function displayProductDetails() {
    const container = document.querySelector('.product-details-container');
    if (!container) return;

    // Obsługa zdjęć
    const images = (currentProduct.images && currentProduct.images.length > 0)
        ? currentProduct.images
        : null;

    // Główne zdjęcie (pierwsze z listy lub default)
    const mainImageUrl = images
        ? `data:image/jpeg;base64,${images[0]}`
        : 'assets/default-product.jpg';

    const categoryName = getCategoryName(currentProduct.category);
    const isOwner = currentUser && currentUser.id === currentProduct.sellerId;
    const canBuy = currentUser && !isOwner && currentProduct.available && currentProduct.stock > 0;

    // HTML dla miniatur
    let thumbnailsHtml = '';
    if (images && images.length > 1) {
        thumbnailsHtml = `
            <div class="product-thumbnails">
                ${images.map((img, index) => `
                    <div class="product-thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${img}')">
                        <img src="data:image/jpeg;base64,${img}" alt="Miniatura ${index + 1}">
                    </div>
                `).join('')}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="product-details-wrapper">
            <div class="product-details-left">
                <div class="product-image-main">
                    <img id="main-product-image" src="${mainImageUrl}" alt="${currentProduct.name}">
                    ${!currentProduct.available ? '<div class="product-badge unavailable">Niedostępny</div>' : ''}
                    ${currentProduct.stock === 0 ? '<div class="product-badge out-of-stock">Brak w magazynie</div>' : ''}
                </div>
                ${thumbnailsHtml}
            </div>

            <div class="product-details-right">
                <div class="product-category-badge">${categoryName}</div>
                <h1 class="product-name">${currentProduct.name}</h1>
                
                <div class="product-rating-section">
                    ${currentProduct.reviewCount > 0 ? `
                        <div class="rating-stars">
                            ${renderStars(currentProduct.rating)}
                            <span class="rating-text">${currentProduct.rating.toFixed(1)}/5</span>
                            <span class="review-count">(${currentProduct.reviewCount} ${currentProduct.reviewCount === 1 ? 'opinia' : 'opinii'})</span>
                        </div>
                    ` : '<p class="no-reviews">Brak opinii</p>'}
                </div>

                <div class="product-price-section">
                    <div class="product-price-main">${currentProduct.price.toFixed(2)} PLN</div>
                    ${currentProduct.weight ? `
                        <div class="product-unit">za ${currentProduct.weight} ${currentProduct.weightUnit}</div>
                    ` : ''}
                </div>

                <div class="product-info-grid">
                    <div class="info-item">
                        <i class="fas fa-boxes"></i>
                        <div>
                            <span class="info-label">Dostępność:</span>
                            <span class="info-value ${currentProduct.stock === 0 ? 'text-danger' : currentProduct.stock < 5 ? 'text-warning' : 'text-success'}">
                                ${currentProduct.stock === 0 ? 'Brak w magazynie' : currentProduct.stock < 5 ? `Ostatnie ${currentProduct.stock} szt.` : `${currentProduct.stock} szt.`}
                            </span>
                        </div>
                    </div>
                    ${currentProduct.location ? `
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <span class="info-label">Lokalizacja:</span>
                                <span class="info-value">${currentProduct.location}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="seller-info">
                    <div class="seller-info-header">
                        <i class="fas fa-user-circle"></i>
                        <span>Sprzedawca</span>
                    </div>
                    <div class="seller-info-content">
                        <div class="seller-name">${currentProduct.sellerFirstname} ${currentProduct.sellerLastname}</div>
                        
                        <div class="seller-badges" id="seller-badges-container">
                            </div>
                        
                        <div class="seller-email">
                            <i class="fas fa-envelope"></i>
                            <span>${currentProduct.sellerEmail}</span>
                        </div>
                    </div>
                </div>

                ${canBuy ? `
                    <div class="purchase-section">
                        <h3>Kup produkt</h3>
                        <div class="quantity-selector">
                            <label for="quantity">Ilość:</label>
                            <div class="quantity-controls">
                                <button type="button" class="qty-btn" onclick="changeQuantity(-1)">-</button>
                                <input type="number" id="quantity" value="1" min="1" max="${currentProduct.stock}" />
                                <button type="button" class="qty-btn" onclick="changeQuantity(1)">+</button>
                            </div>
                            <span class="total-price">Razem: <strong id="total-price">${currentProduct.price.toFixed(2)} PLN</strong></span>
                        </div>

                        <div class="form-group">
                            <label for="delivery-address">Adres dostawy:</label>
                            <input type="text" id="delivery-address" class="form-control" placeholder="ul. Przykładowa 1, 00-001 Warszawa" required>
                        </div>

                        <div class="form-group">
                            <label for="buyer-notes">Uwagi dla sprzedawcy (opcjonalnie):</label>
                            <textarea id="buyer-notes" class="form-control" rows="3" placeholder="Np. proszę o kontakt przed dostawą"></textarea>
                        </div>
                        <button class="btn btn-outline btn-block" onclick="contactSeller()" style="margin-bottom: 15px;">
                            <i class="fas fa-comments"></i>
                            Skontaktuj się ze sprzedawcą
                        </button>
                        <button class="btn btn-primary btn-large btn-buy" onclick="buyProduct()">
                            <i class="fas fa-shopping-cart"></i> Kup teraz
                        </button>

                        <p class="balance-info">Twoje saldo: <strong id="user-balance">${currentUser ? currentUser.balance.toFixed(2) : '0.00'} PLN</strong></p>
                    </div>
                ` : isOwner ? `
                    <div class="owner-section">
                        <p class="info-message"><i class="fas fa-info-circle"></i> To jest Twój produkt</p>
                        <a href="profile.html?tab=products" class="btn btn-secondary">
                            <i class="fas fa-edit"></i> Zarządzaj produktem
                        </a>
                    </div>
                ` : !currentUser ? `
                    <div class="login-prompt">
                        <p><i class="fas fa-sign-in-alt"></i> Zaloguj się, aby kupić ten produkt</p>
                        <a href="login.html" class="btn btn-primary">Zaloguj się</a>
                    </div>
                ` : `
                    <div class="unavailable-section">
                        <p class="error-message"><i class="fas fa-exclamation-circle"></i> Produkt jest obecnie niedostępny</p>
                    </div>
                `}
            </div>
        </div>

        <div class="product-description-section">
            <h2>Opis produktu</h2>
            <p>${currentProduct.description || 'Brak opisu produktu.'}</p>
        </div>
             ${currentProduct.reviewCount > 0 ? `
            <div class="product-tabs">
                <div class="tabs-header">
                    <button class="tab-button active" data-tab="reviews">
                        Opinie (${currentProduct.reviewCount})
                    </button>
                </div>
                <div class="tabs-content">
                    <div class="tab-pane active" id="reviews-tab">
                        <div id="reviews-container">
                            </div>
                    </div>
                </div>
            </div>
        ` : ''}
    `;

    // Aktualizuj ilość przy zmianie
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateTotalPrice);
    }
}

// Funkcja globalna do zmiany zdjęcia głównego po kliknięciu w miniaturę
window.changeMainImage = function(element, base64) {
    // Podmień źródło głównego zdjęcia
    document.getElementById('main-product-image').src = `data:image/jpeg;base64,${base64}`;

    // Zaktualizuj klasę active dla miniatur
    document.querySelectorAll('.product-thumbnail').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
};

async function loadSellerBadges() {
    if (!currentProduct || !currentProduct.sellerId) return;

    try {
        const response = await fetch(`${API_BASE}/badges/user/${currentProduct.sellerId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) return;

        const badges = await response.json();
        displaySellerBadges(badges);

    } catch (error) {
        console.error('Błąd ładowania odznak sprzedawcy:', error);
    }
}

function displaySellerBadges(badges) {
    const container = document.getElementById('seller-badges-container');
    if (!container || !badges || badges.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = badges.map(badge => `
        <div class="badge-item" title="${badge.description}" style="background-color: ${badge.color}15; border-color: ${badge.color};">
            <i class="${badge.icon}" style="color: ${badge.color};"></i>
            <span style="color: ${badge.color};">${badge.name}</span>
        </div>
    `).join('');
}

// ==================== ZAKUP PRODUKTU ====================
async function buyProduct() {
    if (!currentUser) {
        alert('Musisz być zalogowany, aby kupić produkt');
        window.location.href = 'login.html';
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').value);
    const deliveryAddress = document.getElementById('delivery-address').value.trim();
    const buyerNotes = document.getElementById('buyer-notes').value.trim();

    // Walidacja
    if (!deliveryAddress) {
        showNotification('Podaj adres dostawy', 'error');
        return;
    }

    if (quantity < 1 || quantity > currentProduct.stock) {
        showNotification('Nieprawidłowa ilość', 'error');
        return;
    }

    const totalPrice = currentProduct.price * quantity;
    if (currentUser.balance < totalPrice) {
        showNotification(`Niewystarczające środki. Potrzebujesz ${totalPrice.toFixed(2)} PLN, masz ${currentUser.balance.toFixed(2)} PLN`, 'error');
        return;
    }

    // Potwierdzenie
    if (!confirm(`Czy na pewno chcesz kupić ${quantity} szt. za ${totalPrice.toFixed(2)} PLN?`)) {
        return;
    }

    try {
        const buyBtn = document.querySelector('.btn-buy');
        buyBtn.disabled = true;
        buyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Przetwarzanie...';

        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                productId: currentProduct.id,
                quantity: quantity,
                deliveryAddress: deliveryAddress,
                buyerNotes: buyerNotes || null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Nie udało się złożyć zamówienia');
        }

        const order = await response.json();

        showNotification('Zakup zakończony pomyślnie! Sprawdź historię zakupów.', 'success');

        // Przekieruj do historii zakupów po 2 sekundach
        setTimeout(() => {
            window.location.href = 'profile.html?tab=bought-products';
        }, 2000);

    } catch (error) {
        console.error('Błąd zakupu:', error);
        showNotification(error.message, 'error');

        const buyBtn = document.querySelector('.btn-buy');
        if (buyBtn) {
            buyBtn.disabled = false;
            buyBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Kup teraz';
        }
    }
}

// ==================== PODOBNE PRODUKTY ====================
async function loadSimilarProducts() {
    try {
        const response = await fetch(`${API_BASE}/products/category/${currentProduct.category}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) return;

        const products = await response.json();
        const similarProducts = products
            .filter(p => p.id !== currentProduct.id)
            .slice(0, 4);

        displaySimilarProducts(similarProducts);

    } catch (error) {
        console.error('Błąd ładowania podobnych produktów:', error);
    }
}

function displaySimilarProducts(products) {
    const container = document.querySelector('.similar-products-grid');
    if (!container || products.length === 0) return;

    container.innerHTML = products.map(product => {
        // Obsługa pierwszego zdjęcia dla podobnych produktów
        const imageUrl = (product.images && product.images.length > 0)
            ? `data:image/jpeg;base64,${product.images[0]}`
            : 'assets/default-product.jpg';

        return `
            <div class="product-card-small" onclick="window.location.href='product-details.html?id=${product.id}'">
                <img src="${imageUrl}" alt="${product.name}">
                <div class="card-info">
                    <h4>${product.name}</h4>
                    <p class="price">${product.price.toFixed(2)} PLN</p>
                    ${product.reviewCount > 0 ? `
                        <div class="rating">
                            <i class="fas fa-star"></i> ${product.rating.toFixed(1)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ==================== POMOCNICZE FUNKCJE ====================
function changeQuantity(delta) {
    const input = document.getElementById('quantity');
    let value = parseInt(input.value) + delta;
    value = Math.max(1, Math.min(value, currentProduct.stock));
    input.value = value;
    updateTotalPrice();
}

// ==================== KONTAKT ZE SPRZEDAWCĄ ====================
async function contactSeller() {
    if (!currentProduct) {
        showNotification('Nie znaleziono produktu', 'error');
        return;
    }

    if (!currentUser) {
        showNotification('Musisz być zalogowany, aby wysłać wiadomość', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    if (currentProduct.sellerId === currentUser.id) {
        showNotification('To jest Twój własny produkt', 'info');
        return;
    }

    try {
        const btn = document.querySelector('.btn-outline');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Łączenie...';
        btn.disabled = true;

        const response = await fetch(`${API_BASE}/chat/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                productId: currentProduct.id,
                initialMessage: `Dzień dobry, jestem zainteresowany produktem: ${currentProduct.name}`
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.message || 'Nie udało się rozpocząć konwersacji');
        }

        const conversation = await response.json();

        window.location.href = `chat.html?conversation=${conversation.id}`;

    } catch (error) {
        console.error('Błąd kontaktu ze sprzedawcą:', error);
        showNotification(error.message, 'error');

        const btn = document.querySelector('.btn-outline');
        if(btn) {
            btn.innerHTML = '<i class="fas fa-comments"></i> Skontaktuj się ze sprzedawcą';
            btn.disabled = false;
        }
    }
}

function updateTotalPrice() {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const total = currentProduct.price * quantity;
    const totalPriceElement = document.getElementById('total-price');
    if (totalPriceElement) {
        totalPriceElement.textContent = `${total.toFixed(2)} PLN`;
    }
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
}

function getCategoryName(category) {
    const categories = {
        'HONEY': 'Miód',
        'WAX': 'Wosk',
        'POLLEN': 'Pyłek',
        'PROPOLIS': 'Propolis',
        'ROYAL_JELLY': 'Mleczko pszczele',
        'HONEYCOMB': 'Plaster miodu',
        'EQUIPMENT': 'Sprzęt',
        'OTHER': 'Inne'
    };
    return categories[category] || category;
}

async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/user`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            currentUser = await response.json();
        }
    } catch (error) {
        console.log('Użytkownik niezalogowany');
    }
}

function showLoading(show) {
    const container = document.querySelector('.product-details-container');
    if (show && container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div class="spinner"></div>
                <p style="color: #999; margin-top: 20px;">Ładowanie produktu...</p>
            </div>
        `;
    }
}

function showError(message) {
    const container = document.querySelector('.product-details-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 64px; color: #ff6b6b; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">Wystąpił błąd</h3>
                <p style="color: #999;">${message}</p>
                <a href="marketplace.html" class="btn btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-arrow-left"></i> Wróć do marketplace
                </a>
            </div>
        `;
    }
}

async function loadProductReviews() {
    if (!currentProduct || currentProduct.reviewCount === 0) return;

    try {
        const response = await fetch(`${API_BASE}/reviews/products/product/${currentProduct.id}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) return;

        productReviews = await response.json();
        displayProductReviews();

    } catch (error) {
        console.error('Błąd ładowania opinii:', error);
    }
}

function displayProductReviews() {
    const container = document.getElementById('reviews-container');
    if (!container || productReviews.length === 0) return;

    container.innerHTML = `
        <div class="reviews-summary">
            <div class="rating-overview">
                <div class="rating-big">${currentProduct.rating.toFixed(1)}</div>
                <div class="rating-stars-big">${renderStars(currentProduct.rating)}</div>
                <div class="rating-count">Na podstawie ${currentProduct.reviewCount} ${currentProduct.reviewCount === 1 ? 'opinii' : 'opinii'}</div>
            </div>
        </div>
        <div class="reviews-list">
            ${productReviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <div class="reviewer-avatar">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div>
                                <div class="reviewer-name">${review.reviewerFirstname} ${review.reviewerLastname}</div>
                                <div class="review-date">${formatDate(review.createdAt)}</div>
                            </div>
                        </div>
                        <div class="review-rating">
                            ${renderStars(review.rating)}
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${review.comment}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function showNotification(message, type = 'info') {
    // Usuń poprzednie powiadomienie jeśli istnieje
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function setupEventListeners() {
    // Event listeners są dodawane dynamicznie w displayProductDetails
}

// CSS dla product details - dodano style dla miniatur
const style = document.createElement('style');
style.textContent = `
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .notification-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    }
    
    .notification-toast.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left: 4px solid #28a745;
    }
    
    .notification-error {
        border-left: 4px solid #dc3545;
    }
    
    .notification-info {
        border-left: 4px solid #17a2b8;
    }
    
    .notification-toast i {
        font-size: 20px;
    }
    
    .notification-success i {
        color: #28a745;
    }
    
    .notification-error i {
        color: #dc3545;
    }
    
    .notification-info i {
        color: #17a2b8;
    }
    
    .btn-large {
        padding: 14px 28px;
        font-size: 16px;
        width: 100%;
    }
    
    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .qty-btn {
        width: 36px;
        height: 36px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
    }
    
    .qty-btn:hover {
        background: #f5f5f5;
    }
    
    #quantity {
        width: 80px;
        text-align: center;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .total-price {
        margin-left: 20px;
        font-size: 16px;
    }
    
    .text-danger {
        color: #dc3545;
    }
    
    .text-warning {
        color: #ffa500;
    }
    
    .text-success {
        color: #28a745;
    }
    
    .balance-info {
        margin-top: 15px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
        text-align: center;
    }
    
    /* ==================== GWIAZDKI ==================== */
    .star-filled {
        color: #FFD700;
    }
    
    .star-empty {
        color: #ddd;
    }
    
    .rating-stars {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        margin: 1rem 0;
    }
    
    .rating-stars i {
        font-size: 1.2rem;
    }
    
    .rating-text {
        margin-left: 0.5rem;
        font-weight: 600;
        color: #333;
        font-size: 1.1rem;
    }
    
    .review-count {
        color: #666;
        font-size: 0.95rem;
    }
    
    .no-reviews {
        color: #999;
        font-style: italic;
        margin: 1rem 0;
    }
    
    /* ==================== ZAKŁADKI ==================== */
    .product-tabs {
        margin-top: 3rem;
        border-top: 2px solid #eee;
        padding-top: 2rem;
    }
    
    .tabs-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid #eee;
    }
    
    .tab-button {
        padding: 1rem 2rem;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        font-size: 1.1rem;
        font-weight: 600;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .tab-button.active {
        color: #F2A900;
        border-bottom-color: #F2A900;
    }
    
    .tab-pane {
        display: none;
    }
    
    .tab-pane.active {
        display: block;
    }
    
    /* ==================== OPINIE ==================== */
    .reviews-summary {
        padding: 2rem;
        background-color: #f8f9fa;
        border-radius: 12px;
        margin-bottom: 2rem;
    }
    
    .rating-overview {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .rating-big {
        font-size: 4rem;
        font-weight: 700;
        color: #333;
    }
    
    .rating-stars-big {
        display: flex;
        gap: 0.5rem;
    }
    
    .rating-stars-big i {
        font-size: 2rem;
    }
    
    .rating-count {
        color: #666;
        font-size: 1.1rem;
        margin-top: 0.5rem;
    }
    
    .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .review-item {
        padding: 1.5rem;
        border: 1px solid #eee;
        border-radius: 12px;
        background: white;
    }
    
    .review-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }
    
    .reviewer-info {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .reviewer-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .reviewer-avatar i {
        font-size: 2rem;
        color: #999;
    }
    
    .reviewer-name {
        font-weight: 600;
        color: #333;
        font-size: 1.1rem;
    }
    
    .review-date {
        color: #999;
        font-size: 0.9rem;
        margin-top: 0.25rem;
    }
    
    .review-rating {
        display: flex;
        gap: 0.2rem;
    }
    
    .review-rating i {
        font-size: 1rem;
    }
    
    .review-content {
        color: #666;
        line-height: 1.6;
    }

    /* ==================== MINIATURY PRODUKTU ==================== */
    .product-thumbnails {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        overflow-x: auto;
        padding-bottom: 5px;
    }

    .product-thumbnail {
        width: 70px;
        height: 70px;
        border: 2px solid transparent;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        opacity: 0.7;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .product-thumbnail.active {
        border-color: #F2A900;
        opacity: 1;
    }

    .product-thumbnail:hover {
        opacity: 1;
    }

    .product-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;
document.head.appendChild(style);