import { createMarketplaceProductCard } from '../components/cards/ProductCard.js';
const API_BASE = 'http://localhost:8080/api';


let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12;


let selectedCategories = [];
let selectedLocations = [];
let minPrice = 0;
let maxPrice = 1000;
let searchQuery = '';
let sortBy = 'newest'; // newest, price-asc, price-desc, popular

// ==================== INICJALIZACJA ====================
document.addEventListener('DOMContentLoaded', async function() {
    await loadProducts();
    setupEventListeners();
    await checkAuth();
    updateUnreadBadge();
});

// ==================== ŁADOWANIE PRODUKTÓW ====================
async function loadProducts() {
    try {
        showLoading(true);

        const response = await fetch(`${API_BASE}/products`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Nie udało się pobrać produktów');
        }

        allProducts = await response.json();
        filteredProducts = [...allProducts];
        console.log(allProducts);
        displayProducts();
        updateProductCount();

    } catch (error) {
        console.error('Błąd ładowania produktów:', error);
        showError('Nie udało się załadować produktów. Spróbuj ponownie później.');
    } finally {
        showLoading(false);
    }
}

// ==================== WYŚWIETLANIE PRODUKTÓW ====================
function displayProducts() {
    const productGrid = document.querySelector('.product-grid');

    if (!filteredProducts || filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-box-open" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">Nie znaleziono produktów</h3>
                <p style="color: #999;">Spróbuj zmienić filtry lub wyszukiwane hasło</p>
            </div>
        `;
        return;
    }

    sortProducts();

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

    productGrid.innerHTML = '';
    productsToDisplay.forEach(product => {
        const card = createMarketplaceProductCard(product);
        productGrid.appendChild(card);
    });

    renderPagination();
}



// ==================== FILTROWANIE ====================
function applyFilters() {
    filteredProducts = allProducts.filter(product => {

        if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
            return false;
        }


        if (selectedLocations.length > 0 && !selectedLocations.includes(product.location)) {
            return false;
        }


        if (product.price < minPrice || product.price > maxPrice) {
            return false;
        }


        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return product.name.toLowerCase().includes(query) ||
                (product.description && product.description.toLowerCase().includes(query));
        }

        return true;
    });

    currentPage = 1;
    updateProductCount();
}


function filterByCategory(category) {
    const allCheckbox = document.getElementById('category-all');

    if (category === 'ALL') {
        selectedCategories = [];
        document.querySelectorAll('.filter-checkbox[id^="category-"]').forEach(cb => {
            if (cb.id !== 'category-all') cb.checked = false;
        });
        if (allCheckbox) allCheckbox.checked = true;
    } else {
        const index = selectedCategories.indexOf(category);
        if (index > -1) {
            selectedCategories.splice(index, 1);
        } else {
            selectedCategories.push(category);
        }

        if (selectedCategories.length > 0) {
            if (allCheckbox) allCheckbox.checked = false;
        } else {
            if (allCheckbox) allCheckbox.checked = true;
        }
    }
    applyFilters();
    displayProducts();
}

function filterByLocation(location) {
    if (location === 'ALL') {
        selectedLocations = [];
    } else {
        const index = selectedLocations.indexOf(location);
        if (index > -1) {
            selectedLocations.splice(index, 1);
        } else {
            selectedLocations.push(location);
        }
    }
    applyFilters();
    displayProducts();
}

function filterByPrice() {
    const minInput = document.getElementById('min-price');
    const maxInput = document.getElementById('max-price');

    if (minInput) minPrice = parseFloat(minInput.value) || 0;
    if (maxInput) maxPrice = parseFloat(maxInput.value) || 1000;

    applyFilters();
    displayProducts();
}

function searchProducts() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchQuery = searchInput.value.trim();
        applyFilters();
        displayProducts();
    }
}

// ==================== SORTOWANIE ====================
function sortProducts() {
    switch (sortBy) {
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'popular':
            filteredProducts.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
            break;
    }
}

function changeSortOrder(order) {
    sortBy = order;
    displayProducts();
}

// ==================== PAGINACJA ====================
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginationContainer = document.querySelector('.pagination');

    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <button class="pagination-btn pagination-nav" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;


    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'active' : ''}" onclick="changePage(1)">1</button>
    `;

    if (currentPage > 3) {
        paginationHTML += `<button class="pagination-btn pagination-ellipsis" disabled>...</button>`;
    }


    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        paginationHTML += `
            <button class="pagination-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
        `;
    }

    if (currentPage < totalPages - 2) {
        paginationHTML += `<button class="pagination-btn pagination-ellipsis" disabled>...</button>`;
    }


    if (totalPages > 1) {
        paginationHTML += `
            <button class="pagination-btn ${currentPage === totalPages ? 'active' : ''}" onclick="changePage(${totalPages})">${totalPages}</button>
        `;
    }

    paginationHTML += `
        <button class="pagination-btn pagination-nav" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    displayProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {

    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchProducts, 300));
    }


    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            changeSortOrder(this.value);
        });
    }


    const priceInputs = document.querySelectorAll('.price-input');
    priceInputs.forEach(input => {
        input.addEventListener('change', filterByPrice);
    });


    document.querySelectorAll('.filter-checkbox[id^="category-"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const category = this.id.replace('category-', '').toUpperCase();
            filterByCategory(category);
        });
    });


    const filterToggle = document.getElementById('filter-toggle');
    if (filterToggle) {
        filterToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.marketplace-sidebar');
            sidebar.classList.toggle('show-filters');

            const icon = this.querySelector('i');
            if (sidebar.classList.contains('show-filters')) {
                icon.classList.remove('fa-filter');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-filter');
            }
        });
    }
}

// ==================== POMOCNICZE FUNKCJE ====================
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

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function updateProductCount() {
    const countElement = document.querySelector('.product-count');
    if (countElement) {
        countElement.textContent = `Znaleziono ${filteredProducts.length} produktów`;
    }
}

function showLoading(show) {
    const productGrid = document.querySelector('.product-grid');
    if (show) {
        productGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div class="spinner"></div>
                <p style="color: #999; margin-top: 20px;">Ładowanie produktów...</p>
            </div>
        `;
    }
}

function showError(message) {
    const productGrid = document.querySelector('.product-grid');
    productGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <i class="fas fa-exclamation-circle" style="font-size: 64px; color: #ff6b6b; margin-bottom: 20px;"></i>
            <h3 style="color: #666; margin-bottom: 10px;">Wystąpił błąd</h3>
            <p style="color: #999;">${message}</p>
            <button class="btn btn-primary" onclick="loadProducts()" style="margin-top: 20px;">
                <i class="fas fa-redo"></i> Spróbuj ponownie
            </button>
        </div>
    `;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/user`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();
            updateUserInfo(user);
        }
    } catch (error) {
        console.log('Użytkownik niezalogowany');
    }
}
// ==================== BADGE NIEPRZECZYTANYCH WIADOMOŚCI ====================
async function updateUnreadBadge() {
    try {
        const response = await fetch(`${API_BASE}/chat/conversations`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const conversations = await response.json();
            const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

            const badge = document.getElementById('unread-badge');
            if (badge) {
                if (totalUnread > 0) {
                    badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Błąd pobierania nieprzeczytanych wiadomości:', error);
    }
}


setInterval(updateUnreadBadge, 30000);
updateUnreadBadge();

function updateUserInfo(user) {
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Witaj, ${user.firstname}!`;
    }
}