import { formatPrice, formatCategory } from '../utils/formatters.js';
import { base64ToDataUrl } from '../utils/imageUtils.js';
import { createStatusBadge } from '../ui/StatusBadge.js';
import { createRatingDisplay } from '../ui/RatingStars.js';
import { DEFAULT_PRODUCT_IMAGE } from '../utils/constants.js';

// ==================== PRODUCT CARD ====================

/**
 * Tworzy kartę produktu
 * @param {Object} product - Dane produktu
 * @param {Object} options - Opcje konfiguracji
 * @returns {HTMLElement} Element karty
 */
export function createProductCard(product, options = {}) {
    const {
        showButtons = true,
        showRating = true,
        size = 'normal',
        onClick = null,
        onButtonClick = null
    } = options;

    const card = document.createElement('div');
    card.className = `product-card product-card-${size}`;
    card.dataset.productId = product.id;
    card.style.cssText = `
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s;
        cursor: ${onClick ? 'pointer' : 'default'};
        display: flex;
        flex-direction: column;
    `;

    if (onClick) {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                onClick(product, e);
            }
        });
    }

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    const imageUrl = getProductImageUrl(product);

    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image';
    imageContainer.style.cssText = `
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        background: #f5f5f5;
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = product.name || 'Product';
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    `;

    card.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.05)';
    });

    card.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
    });

    imageContainer.appendChild(img);

    if (!product.available || (product.stock !== undefined && product.stock === 0)) {
        const badge = createStatusBadge(
            product.stock === 0 ? 'OUT_OF_STOCK' : 'UNAVAILABLE',
            { size: 'small' }
        );
        badge.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
        `;
        imageContainer.appendChild(badge);
    }

    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'card-info';
    info.style.cssText = `
        padding: 15px;
        flex: 1;
        display: flex;
        flex-direction: column;
    `;

    const category = document.createElement('div');
    category.className = 'card-category';
    category.textContent = formatCategory(product.category);
    category.style.cssText = `
        color: #999;
        font-size: 12px;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `;
    info.appendChild(category);

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = product.name || 'Bez nazwy';
    title.style.cssText = `
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    `;
    info.appendChild(title);

    if (product.description && size !== 'small') {
        const description = document.createElement('p');
        description.className = 'card-description';
        description.textContent = product.description;
        description.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 13px;
            color: #666;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        `;
        info.appendChild(description);
    }

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    footer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;
    `;

    const price = document.createElement('div');
    price.className = 'card-price';
    price.textContent = formatPrice(product.price);
    price.style.cssText = `
        font-size: 18px;
        font-weight: 700;
        color: #F2A900;
    `;
    footer.appendChild(price);

    if (showRating && product.averageRating !== undefined && product.reviewCount > 0) {
        const rating = createRatingDisplay(product.averageRating, {
            size: 'small',
            showNumber: true
        });
        rating.style.cssText = `
            font-size: 12px;
            color: #666;
        `;
        footer.appendChild(rating);
    }

    info.appendChild(footer);
    card.appendChild(info);

    if (showButtons && product.available && (product.stock === undefined || product.stock > 0)) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            padding: 0 15px 15px 15px;
        `;

        const button = document.createElement('button');
        button.className = 'btn btn-primary btn-block';
        button.innerHTML = '<i class="fas fa-eye"></i> Zobacz szczegóły';
        button.style.cssText = `
            width: 100%;
            padding: 10px;
            border: none;
            background: #F2A900;
            color: white;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#d89700';
            button.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#F2A900';
            button.style.transform = 'translateY(0)';
        });

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onButtonClick) {
                onButtonClick(product, e);
            } else {
                window.location.href = `product-details.html?id=${product.id}`;
            }
        });

        buttonContainer.appendChild(button);
        card.appendChild(buttonContainer);
    }

    return card;
}

/**
 * Tworzy małą kartę produktu (dla podobnych produktów)
 * @param {Object} product - Dane produktu
 * @param {Function} onClick - Callback po kliknięciu
 * @returns {HTMLElement} Element karty
 */
export function createProductCardSmall(product, onClick = null) {
    return createProductCard(product, {
        showButtons: false,
        showRating: true,
        size: 'small',
        onClick: onClick || (() => {
            window.location.href = `product-details.html?id=${product.id}`;
        })
    });
}

/**
 * Tworzy kartę produktu dla marketplace
 * @param {Object} product - Dane produktu
 * @returns {HTMLElement} Element karty
 */
export function createMarketplaceProductCard(product) {
    return createProductCard(product, {
        showButtons: true,
        showRating: true,
        size: 'normal',
        onClick: (prod) => {
            window.location.href = `product-details.html?id=${prod.id}`;
        }
    });
}

/**
 * Tworzy kartę produktu dla profilu użytkownika
 * @param {Object} product - Dane produktu
 * @param {Object} actions - Akcje (edit, delete)
 * @returns {HTMLElement} Element karty
 */
export function createUserProductCard(product, actions = {}) {
    const card = createProductCard(product, {
        showButtons: false,
        showRating: true,
        size: 'normal'
    });

    const info = card.querySelector('.card-info');

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'card-actions';
    actionsContainer.style.cssText = `
        display: flex;
        gap: 8px;
        margin-top: 12px;
    `;

    if (actions.onEdit) {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edytuj';
        editBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        `;
        editBtn.addEventListener('click', () => actions.onEdit(product));
        actionsContainer.appendChild(editBtn);
    }

    if (actions.onDelete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger-outline';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Usuń';
        deleteBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            border: 1px solid #e74c3c;
            background: white;
            color: #e74c3c;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        `;
        deleteBtn.addEventListener('click', () => actions.onDelete(product));
        actionsContainer.appendChild(deleteBtn);
    }

    if (actionsContainer.children.length > 0) {
        info.appendChild(actionsContainer);
    }

    return card;
}

// ==================== FUNKCJE POMOCNICZE ====================

/**
 * Pobiera URL pierwszego zdjęcia produktu
 * @param {Object} product - Dane produktu
 * @returns {string} URL zdjęcia
 */
function getProductImageUrl(product) {
    if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string') {
            if (firstImage.startsWith('http') || firstImage.startsWith('/') || firstImage.startsWith('data:')) {
                return firstImage;
            }
            return base64ToDataUrl(firstImage);
        }
        if (firstImage.fileContent) {
            return base64ToDataUrl(firstImage.fileContent);
        }
    }

    return DEFAULT_PRODUCT_IMAGE;
}

/**
 * Renderuje listę kart produktów w kontenerze
 * @param {HTMLElement|string} container - Kontener lub selektor
 * @param {Array} products - Tablica produktów
 * @param {Object} options - Opcje renderowania
 */
export function renderProductCards(container, products, options = {}) {
    const element = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!element) {
        console.error('Container not found');
        return;
    }

    element.innerHTML = '';

    if (!products || products.length === 0) {
        element.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-box-open" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">Nie znaleziono produktów</h3>
                <p style="color: #999;">Spróbuj zmienić filtry lub wyszukiwane hasło</p>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const card = createProductCard(product, options);
        element.appendChild(card);
    });
}