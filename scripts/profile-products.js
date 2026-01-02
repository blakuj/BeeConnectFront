import { createUserProductCard, renderProductCards } from '../components/cards/ProductCard.js';
import { createAreaCard, renderAreaCards } from '../components/cards/AreaCard.js';
import { renderBadgeCards } from '../components/cards/BadgeCard.js';

const API_URL = 'http://localhost:8080/api';

let editAreaFiles = [];
let editAreaExistingImages = [];
let editProductFiles = [];
let editProductExistingImages = [];

// ==================== INICJALIZACJA ====================
document.addEventListener('DOMContentLoaded', async function() {
    await loadUserProfile();
    setupEventListeners();
    await fetchMyAreas();
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
        document.querySelectorAll('.sidebar-nav-item').forEach(item => {
            if (item.getAttribute('data-tab') === tab) {
                item.click();
            }
        });
    }
});

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/user`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();
            document.getElementById('user-name').textContent = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Użytkownik';
            document.getElementById('welcome-name').textContent = user.firstname || 'Użytkowniku';
            document.getElementById('user-email').textContent = user.email || 'nieznany@email.com';
            document.getElementById('user-status').textContent = user.role === 'BEEKEEPER' ? 'Zweryfikowany Pszczelarz' : 'Użytkownik';
        } else if (response.status === 401) {
            alert('Sesja wygasła. Zaloguj się ponownie.');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Błąd podczas ładowania profilu:', error);
    }
}

// ==================== MOJE OBSZARY ====================
async function fetchMyAreas() {
    try {
        const response = await fetch(`${API_URL}/areas/my-areas`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const areas = await response.json();

        renderAreaCards('#my-areas-container', areas, {
            showButtons: true,
            onClick: (a) => window.location.href = `area-details.html?id=${a.id}`,
            actions: {
                onEdit: (a) => openEditAreaModal(a),
                onDelete: (a) => {
                    if (confirm(`Czy na pewno chcesz usunąć obszar "${a.name}"?`)) {
                        deleteArea(a.id);
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error fetching areas:', error);
        document.getElementById('my-areas-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania obszarów.</p>';
    }
}

// ==================== WYNAJĘTE OBSZARY ====================
async function fetchRentedAreas() {
    try {
        const response = await fetch(`${API_URL}/reservations/my-reservations`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reservations = await response.json();
        const container = document.getElementById('rented-areas-container');
        container.innerHTML = '';

        if (reservations.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nie wynajmujesz jeszcze żadnych obszarów.</p>';
            return;
        }

        for (const res of reservations) {
            let canReview = false;
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
                console.error('Error checking review status:', e);
            }

            const card = createAreaCard(res.area, {
                showButtons: false,
                onClick: (a) => window.location.href = `area-details.html?id=${a.id}`
            });

            const info = card.querySelector('.card-info');
            const reservationInfo = document.createElement('div');
            reservationInfo.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;';
            reservationInfo.innerHTML = `
                <div style="font-size: 13px; color: #666;">
                    <div><strong>Od:</strong> ${formatDate(res.startDate)}</div>
                    <div><strong>Do:</strong> ${formatDate(res.endDate)}</div>
                    <div><strong>Status:</strong> <span class="status-badge status-${res.status.toLowerCase()}">${translateStatus(res.status)}</span></div>
                </div>
            `;
            info.appendChild(reservationInfo);

            if (canReview) {
                const reviewBtn = document.createElement('button');
                reviewBtn.className = 'btn btn-accent card-btn review-area-btn';
                reviewBtn.dataset.reservationId = res.id;
                reviewBtn.dataset.areaId = res.area.id;
                reviewBtn.dataset.areaName = res.area.name;
                reviewBtn.innerHTML = '<i class="fas fa-star"></i> Wystaw opinię';
                reviewBtn.style.cssText = 'margin-top: 10px; width: 100%;';
                info.appendChild(reviewBtn);
            }

            container.appendChild(card);
        }

        document.querySelectorAll('.review-area-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const reservationId = this.dataset.reservationId;
                const areaId = this.dataset.areaId;
                const areaName = this.dataset.areaName;
                openAreaReviewModal(reservationId, areaId, areaName);
            });
        });

    } catch (error) {
        console.error('Error fetching rented areas:', error);
        document.getElementById('rented-areas-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania wynajętych obszarów.</p>';
    }
}

// ==================== REZERWACJE NA MOICH OBSZARACH ====================
async function fetchSoldAreas() {
    try {
        const response = await fetch(`${API_URL}/reservations/my-areas-reservations`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reservations = await response.json();
        const container = document.getElementById('sold-areas-container');
        container.innerHTML = '';

        if (reservations.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nie masz jeszcze żadnych rezerwacji na swoich obszarach.</p>';
            return;
        }

        reservations.forEach(res => {
            const card = createAreaCard(res.area, {
                showButtons: false,
                onClick: null
            });

            const info = card.querySelector('.card-info');
            const reservationInfo = document.createElement('div');
            reservationInfo.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;';
            reservationInfo.innerHTML = `
                <div style="font-size: 13px; color: #666;">
                    <div><strong>Pszczelarz:</strong> ${res.beekeeperFirstname} ${res.beekeeperLastname}</div>
                    <div><strong>Od:</strong> ${formatDate(res.startDate)}</div>
                    <div><strong>Do:</strong> ${formatDate(res.endDate)}</div>
                    <div><strong>Status:</strong> <span class="status-badge status-${res.status.toLowerCase()}">${translateStatus(res.status)}</span></div>
                </div>
            `;
            info.appendChild(reservationInfo);

            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching sold areas:', error);
        document.getElementById('sold-areas-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania rezerwacji.</p>';
    }
}

// ==================== MOJE PRODUKTY ====================
async function fetchMyProducts() {
    try {
        const response = await fetch(`${API_URL}/products/my-products`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const products = await response.json();

        renderProductCards('#my-products-container', products, {
            showButtons: false,
            showRating: false,
            actions: {
                onEdit: (prod) => openEditProductModal(prod),
                onDelete: (prod) => {
                    if (confirm(`Czy na pewno chcesz usunąć produkt "${prod.name}"?`)) {
                        deleteProduct(prod.id);
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('my-products-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania produktów.</p>';
    }
}

// ==================== SPRZEDANE PRODUKTY ====================
async function fetchSoldProducts() {
    try {
        const response = await fetch(`${API_URL}/orders/my-sales`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const orders = await response.json();
        const container = document.getElementById('sold-products-container');
        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nie sprzedałeś jeszcze żadnych produktów.</p>';
            return;
        }

        orders.forEach(order => {
            const productData = {
                id: order.productId,
                name: order.productName,
                price: order.price,
                images: order.productImage ? [order.productImage] : [],
                category: order.category || 'HONEY'
            };

            const card = createUserProductCard(productData, {});

            const info = card.querySelector('.card-info');
            const orderInfo = document.createElement('div');
            orderInfo.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;';
            orderInfo.innerHTML = `
                <div style="font-size: 13px; color: #666;">
                    <div><strong>Ilość:</strong> ${order.quantity} szt.</div>
                    <div><strong>Suma:</strong> ${(order.price * order.quantity).toFixed(2)} PLN</div>
                    <div><strong>Data sprzedaży:</strong> ${formatDate(order.orderedAt)}</div>
                    <div><strong>Kupujący:</strong> ${order.buyerFirstname} ${order.buyerLastname}</div>
                </div>
            `;
            info.appendChild(orderInfo);

            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching sold products:', error);
        document.getElementById('sold-products-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania sprzedanych produktów.</p>';
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

            const productData = {
                id: order.productId,
                name: order.productName,
                price: order.price,
                images: order.productImage ? [order.productImage] : [],
                category: order.category || 'HONEY'
            };

            const card = createUserProductCard(productData, {});

            const info = card.querySelector('.card-info');
            const orderInfo = document.createElement('div');
            orderInfo.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;';
            orderInfo.innerHTML = `
                <div style="font-size: 13px; color: #666;">
                    <div><strong>Ilość:</strong> ${order.quantity} szt.</div>
                    <div><strong>Suma:</strong> ${(order.price * order.quantity).toFixed(2)} PLN</div>
                    <div><strong>Data zakupu:</strong> ${formatDate(order.orderedAt)}</div>
                    <div><strong>Sprzedawca:</strong> ${order.sellerFirstname} ${order.sellerLastname}</div>
                </div>
            `;
            info.appendChild(orderInfo);

            if (canReview) {
                const reviewBtn = document.createElement('button');
                reviewBtn.className = 'btn btn-accent card-btn review-product-btn';
                reviewBtn.dataset.orderId = order.id;
                reviewBtn.dataset.productId = order.productId;
                reviewBtn.dataset.productName = order.productName;
                reviewBtn.innerHTML = '<i class="fas fa-star"></i> Wystaw opinię';
                reviewBtn.style.cssText = 'margin-top: 10px; width: 100%;';
                info.appendChild(reviewBtn);
            } else {
                const reviewedBadge = document.createElement('div');
                reviewedBadge.className = 'status-badge reviewed';
                reviewedBadge.innerHTML = '<i class="fas fa-check-circle"></i> Oceniono';
                reviewedBadge.style.cssText = 'margin-top: 10px; display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background-color: rgba(76, 175, 80, 0.1); color: #4CAF50;';
                info.appendChild(reviewedBadge);
            }

            container.appendChild(card);
        }

        document.querySelectorAll('.review-product-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.dataset.orderId;
                const productId = this.dataset.productId;
                const productName = this.dataset.productName;
                openProductReviewModal(orderId, productId, productName);
            });
        });

    } catch (error) {
        console.error('Error fetching purchases:', error);
        document.getElementById('bought-products-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania zakupów.</p>';
    }
}

// ==================== ODZNAKI ====================
async function loadMyBadges() {
    try {
        const response = await fetch(`${API_URL}/badges/my-badges`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const badges = await response.json();

        renderBadgeCards('#badges-container', badges, {
            earned: true,
            showProgress: false
        });

    } catch (error) {
        console.error('Error fetching badges:', error);
        document.getElementById('badges-container').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e74c3c;">Błąd podczas ładowania odznak.</p>';
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
        gallery.innerHTML = `<div class="empty-preview"><i class="fas fa-images" style="font-size: 32px; margin-bottom: 10px;"></i><span>Brak wybranych zdjęć</span></div>`;
        return;
    }
    editAreaExistingImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item existing';
        item.innerHTML = `<img src="data:image/jpeg;base64,${img}" alt="Existing"><div class="remove-btn" onclick="removeEditAreaFile(${index}, true)"><i class="fas fa-times"></i></div>`;
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
        gallery.innerHTML = `<div class="empty-preview"><i class="fas fa-images" style="font-size: 32px; margin-bottom: 10px;"></i><span>Brak wybranych zdjęć</span></div>`;
        return;
    }
    editProductExistingImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item existing';
        item.innerHTML = `<img src="data:image/jpeg;base64,${img}" alt="Existing"><div class="remove-btn" onclick="removeEditProductFile(${index}, true)"><i class="fas fa-times"></i></div>`;
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

    const reviewStars = document.querySelectorAll('.review-star');
    reviewStars.forEach((star, index) => {
        star.addEventListener('mouseenter', () => {
            reviewStars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });

        star.addEventListener('click', () => {
            const rating = index + 1;
            reviewStars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('selected');
                } else {
                    s.classList.remove('selected');
                }
            });
            const ratingInput = document.getElementById('review-rating-value');
            if (ratingInput) {
                ratingInput.value = rating;
            }
        });
    });

    const reviewStarsContainer = document.querySelector('.stars-container');
    if (reviewStarsContainer) {
        reviewStarsContainer.addEventListener('mouseleave', () => {
            const selectedRating = parseInt(document.getElementById('review-rating-value')?.value || 0);
            reviewStars.forEach((s, i) => {
                if (i < selectedRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    }

    const editAreaImageInput = document.getElementById('edit-area-images');
    if (editAreaImageInput) {
        editAreaImageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const exists = editAreaFiles.some(f => f.name === file.name && f.size === file.size);
                if (!exists) {
                    editAreaFiles.push(file);
                }
            });
            updateEditAreaPreview();
            this.value = '';
        });
    }

    const editProductImageInput = document.getElementById('edit-product-images');
    if (editProductImageInput) {
        editProductImageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const exists = editProductFiles.some(f => f.name === file.name && f.size === file.size);
                if (!exists) {
                    editProductFiles.push(file);
                }
            });
            updateEditProductPreview();
            this.value = '';
        });
    }
}

// ==================== MODALS - EDIT AREA ====================
function openEditAreaModal(area) {
    const modal = document.getElementById('edit-area-modal');
    if (!modal) return;

    document.getElementById('edit-area-id').value = area.id;
    document.getElementById('edit-area-name').value = area.name;
    document.getElementById('edit-area-description').value = area.description || '';
    document.getElementById('edit-area-flower-type').value = area.flowerType;
    document.getElementById('edit-area-price').value = area.pricePerDay;

    editAreaExistingImages = area.images ? [...area.images] : [];
    editAreaFiles = [];
    updateEditAreaPreview();

    modal.style.display = 'block';
}

function closeEditAreaModal() {
    const modal = document.getElementById('edit-area-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    editAreaFiles = [];
    editAreaExistingImages = [];
}

async function submitAreaEdit() {
    const areaId = document.getElementById('edit-area-id').value;
    const name = document.getElementById('edit-area-name').value;
    const description = document.getElementById('edit-area-description').value;
    const flowerType = document.getElementById('edit-area-flower-type').value;
    const pricePerDay = parseFloat(document.getElementById('edit-area-price').value);

    if (!name || !flowerType || !pricePerDay) {
        alert('Proszę wypełnić wszystkie wymagane pola.');
        return;
    }

    try {
        const newImagesBase64 = await filesToBase64List(editAreaFiles);
        const allImages = [...editAreaExistingImages, ...newImagesBase64];

        const updatedArea = {
            name: name,
            description: description,
            flowerType: flowerType,
            pricePerDay: pricePerDay,
            images: allImages
        };

        const response = await fetch(`${API_URL}/areas/${areaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updatedArea)
        });

        if (response.ok) {
            alert('Obszar został zaktualizowany pomyślnie!');
            closeEditAreaModal();
            await fetchMyAreas();
        } else {
            const errorData = await response.json();
            alert('Błąd podczas aktualizacji obszaru: ' + (errorData.message || 'Nieznany błąd'));
        }
    } catch (error) {
        console.error('Error updating area:', error);
        alert('Wystąpił błąd podczas aktualizacji obszaru.');
    }
}

async function deleteArea(areaId) {
    try {
        const response = await fetch(`${API_URL}/areas/${areaId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            alert('Obszar został usunięty.');
            await fetchMyAreas();
        } else {
            alert('Nie udało się usunąć obszaru.');
        }
    } catch (error) {
        console.error('Error deleting area:', error);
        alert('Wystąpił błąd podczas usuwania obszaru.');
    }
}

// ==================== MODALS - EDIT PRODUCT ====================
function openEditProductModal(product) {
    const modal = document.getElementById('edit-product-modal');
    if (!modal) return;

    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-description').value = product.description || '';
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-stock').value = product.stock;
    document.getElementById('edit-product-weight').value = product.weight || '';
    document.getElementById('edit-product-weight-unit').value = product.weightUnit || 'kg';

    editProductExistingImages = product.images ? [...product.images] : [];
    editProductFiles = [];
    updateEditProductPreview();

    modal.style.display = 'block';
}

function closeEditProductModal() {
    const modal = document.getElementById('edit-product-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    editProductFiles = [];
    editProductExistingImages = [];
}

async function submitProductEdit() {
    const productId = document.getElementById('edit-product-id').value;
    const name = document.getElementById('edit-product-name').value;
    const description = document.getElementById('edit-product-description').value;
    const category = document.getElementById('edit-product-category').value;
    const price = parseFloat(document.getElementById('edit-product-price').value);
    const stock = parseInt(document.getElementById('edit-product-stock').value);
    const weight = parseFloat(document.getElementById('edit-product-weight').value) || null;
    const weightUnit = document.getElementById('edit-product-weight-unit').value;

    if (!name || !category || !price || !stock) {
        alert('Proszę wypełnić wszystkie wymagane pola.');
        return;
    }

    try {
        const newImagesBase64 = await filesToBase64List(editProductFiles);
        const allImages = [...editProductExistingImages, ...newImagesBase64];

        const updatedProduct = {
            name: name,
            description: description,
            category: category,
            price: price,
            stock: stock,
            weight: weight,
            weightUnit: weightUnit,
            images: allImages
        };

        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updatedProduct)
        });

        if (response.ok) {
            alert('Produkt został zaktualizowany pomyślnie!');
            closeEditProductModal();
            await fetchMyProducts();
        } else {
            const errorData = await response.json();
            alert('Błąd podczas aktualizacji produktu: ' + (errorData.message || 'Nieznany błąd'));
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Wystąpił błąd podczas aktualizacji produktu.');
    }
}

async function deleteProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            alert('Produkt został usunięty.');
            await fetchMyProducts();
        } else {
            alert('Nie udało się usunąć produktu.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Wystąpił błąd podczas usuwania produktu.');
    }
}

// ==================== MODALS - REVIEWS ====================
function openAreaReviewModal(reservationId, areaId, areaName) {
    const modal = document.getElementById('area-review-modal');
    if (!modal) return;

    document.getElementById('area-review-reservation-id').value = reservationId;
    document.getElementById('area-review-area-id').value = areaId;
    document.getElementById('area-review-area-name').textContent = areaName;
    document.getElementById('area-review-rating-value').value = '0';
    document.getElementById('area-review-comment').value = '';

    const stars = modal.querySelectorAll('.review-star');
    stars.forEach(s => {
        s.classList.remove('selected');
        s.classList.remove('active');
    });

    modal.style.display = 'block';
}

function closeAreaReviewModal() {
    const modal = document.getElementById('area-review-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitAreaReview() {
    const reservationId = document.getElementById('area-review-reservation-id').value;
    const areaId = document.getElementById('area-review-area-id').value;
    const rating = parseInt(document.getElementById('area-review-rating-value').value);
    const comment = document.getElementById('area-review-comment').value;

    if (!rating || rating < 1 || rating > 5) {
        alert('Proszę wybrać ocenę od 1 do 5 gwiazdek.');
        return;
    }

    if (!comment.trim()) {
        alert('Proszę napisać komentarz.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reviews/areas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                reservationId: parseInt(reservationId),
                areaId: parseInt(areaId),
                rating: rating,
                comment: comment
            })
        });

        if (response.ok) {
            alert('Dziękujemy za wystawienie opinii!');
            closeAreaReviewModal();
            await fetchRentedAreas();
        } else {
            const errorData = await response.json();
            alert('Błąd: ' + (errorData.message || 'Nie udało się dodać opinii'));
        }
    } catch (error) {
        console.error('Error submitting area review:', error);
        alert('Wystąpił błąd podczas dodawania opinii.');
    }
}

function openProductReviewModal(orderId, productId, productName) {
    const modal = document.getElementById('product-review-modal');
    if (!modal) return;

    document.getElementById('product-review-order-id').value = orderId;
    document.getElementById('product-review-product-id').value = productId;
    document.getElementById('product-review-product-name').textContent = productName;
    document.getElementById('product-review-rating-value').value = '0';
    document.getElementById('product-review-comment').value = '';

    const stars = modal.querySelectorAll('.review-star');
    stars.forEach(s => {
        s.classList.remove('selected');
        s.classList.remove('active');
    });

    modal.style.display = 'block';
}

function closeProductReviewModal() {
    const modal = document.getElementById('product-review-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitProductReview() {
    const orderId = document.getElementById('product-review-order-id').value;
    const productId = document.getElementById('product-review-product-id').value;
    const rating = parseInt(document.getElementById('product-review-rating-value').value);
    const comment = document.getElementById('product-review-comment').value;

    if (!rating || rating < 1 || rating > 5) {
        alert('Proszę wybrać ocenę od 1 do 5 gwiazdek.');
        return;
    }

    if (!comment.trim()) {
        alert('Proszę napisać komentarz.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reviews/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                orderId: parseInt(orderId),
                productId: parseInt(productId),
                rating: rating,
                comment: comment
            })
        });

        if (response.ok) {
            alert('Dziękujemy za wystawienie opinii!');
            closeProductReviewModal();
            await loadMyPurchases();
        } else {
            const errorData = await response.json();
            alert('Błąd: ' + (errorData.message || 'Nie udało się dodać opinii'));
        }
    } catch (error) {
        console.error('Error submitting product review:', error);
        alert('Wystąpił błąd podczas dodawania opinii.');
    }
}

// ==================== FUNKCJE POMOCNICZE ====================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
}

function translateStatus(status) {
    const statusMap = {
        'PENDING': 'Oczekująca',
        'CONFIRMED': 'Potwierdzona',
        'CANCELLED': 'Anulowana',
        'COMPLETED': 'Zakończona'
    };
    return statusMap[status] || status;
}

window.openEditAreaModal = openEditAreaModal;
window.closeEditAreaModal = closeEditAreaModal;
window.submitAreaEdit = submitAreaEdit;
window.openEditProductModal = openEditProductModal;
window.closeEditProductModal = closeEditProductModal;
window.submitProductEdit = submitProductEdit;
window.openAreaReviewModal = openAreaReviewModal;
window.closeAreaReviewModal = closeAreaReviewModal;
window.submitAreaReview = submitAreaReview;
window.openProductReviewModal = openProductReviewModal;
window.closeProductReviewModal = closeProductReviewModal;
window.submitProductReview = submitProductReview;