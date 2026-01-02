import { formatPrice, formatArea, formatLocation, formatDate } from '../utils/formatters.js';
import { base64ToDataUrl } from '../utils/imageUtils.js';
import { createStatusBadge } from '../ui/StatusBadge.js';
import { DEFAULT_AREA_IMAGE } from '../utils/constants.js';

// ==================== AREA CARD ====================

/**
 * Tworzy kartę obszaru
 * @param {Object} area - Dane obszaru
 * @param {Object} options - Opcje konfiguracji
 * @returns {HTMLElement} Element karty
 */
export function createAreaCard(area, options = {}) {
    const {
        showButtons = true,
        showFlowers = true,
        size = 'normal',
        onClick = null,
        actions = {}
    } = options;

    const card = document.createElement('div');
    card.className = `area-card area-card-${size}`;
    card.dataset.areaId = area.id;
    card.style.cssText = `
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
    `;

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    const header = document.createElement('div');
    header.className = 'card-header';
    header.style.cssText = `
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;
    `;

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = area.name || 'Bez nazwy';
    title.style.cssText = `
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        flex: 1;
    `;
    header.appendChild(title);

    const statusBadge = createStatusBadge(
        area.status || area.availabilityStatus || 'UNAVAILABLE',
        { size: 'small' }
    );
    header.appendChild(statusBadge);

    card.appendChild(header);

    const imageUrl = getAreaImageUrl(area);

    const imageContainer = document.createElement('div');
    imageContainer.className = 'area-preview';
    imageContainer.style.cssText = `
        position: relative;
        width: 100%;
        aspect-ratio: 16/9;
        overflow: hidden;
        background: #f5f5f5;
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = area.name || 'Area';
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
    card.appendChild(imageContainer);

    const body = document.createElement('div');
    body.className = 'card-body';
    body.style.cssText = `
        padding: 15px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;

    const properties = [
        {
            label: 'Powierzchnia:',
            value: formatArea(area.area),
            icon: 'fa-ruler-combined'
        },
        {
            label: 'Lokalizacja:',
            value: formatLocation(area.coordinates),
            icon: 'fa-map-marker-alt'
        }
    ];

    if (showFlowers && area.flowers && area.flowers.length > 0) {
        const flowersText = area.flowers.map(f => f.name).join(', ');
        properties.push({
            label: 'Kwiaty:',
            value: flowersText,
            icon: 'fa-leaf'
        });
    }

    if (area.maxHives !== undefined) {
        properties.push({
            label: 'Max uli:',
            value: area.maxHives.toString(),
            icon: 'fa-home'
        });
    }

    properties.forEach(prop => {
        const propElement = document.createElement('div');
        propElement.className = 'card-property';
        propElement.style.cssText = `
            display: flex;
            gap: 8px;
            font-size: 13px;
        `;

        propElement.innerHTML = `
            <i class="fas ${prop.icon}" style="color: #F2A900; width: 16px; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <span style="font-weight: 600; color: #666;">${prop.label}</span>
                <span style="color: #333;">${prop.value}</span>
            </div>
        `;

        body.appendChild(propElement);
    });

    card.appendChild(body);

    if (area.pricePerDay !== undefined) {
        const priceContainer = document.createElement('div');
        priceContainer.style.cssText = `
            padding: 12px 15px;
            background: #f9f9f9;
            border-top: 1px solid #f0f0f0;
        `;

        const priceLabel = document.createElement('div');
        priceLabel.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
        `;
        priceLabel.textContent = 'Cena za ul/dzień:';

        const priceValue = document.createElement('div');
        priceValue.style.cssText = `
            font-size: 20px;
            font-weight: 700;
            color: #F2A900;
        `;
        priceValue.textContent = formatPrice(area.pricePerDay);

        priceContainer.appendChild(priceLabel);
        priceContainer.appendChild(priceValue);
        card.appendChild(priceContainer);
    }

    if (showButtons || Object.keys(actions).length > 0) {
        const footer = document.createElement('div');
        footer.className = 'card-footer';
        footer.style.cssText = `
            padding: 15px;
            display: flex;
            gap: 8px;
        `;

        if (actions.onEdit) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-outline card-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edytuj';
            editBtn.style.cssText = `
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s;
            `;
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                actions.onEdit(area);
            });
            footer.appendChild(editBtn);
        }

        if (actions.onDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger-outline card-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Usuń';
            deleteBtn.style.cssText = `
                flex: 1;
                padding: 10px;
                border: 1px solid #e74c3c;
                background: white;
                color: #e74c3c;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s;
            `;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                actions.onDelete(area);
            });
            footer.appendChild(deleteBtn);
        }

        if (actions.onReserve && area.status === 'AVAILABLE') {
            const reserveBtn = document.createElement('button');
            reserveBtn.className = 'btn btn-primary card-btn';
            reserveBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Zarezerwuj';
            reserveBtn.style.cssText = `
                flex: 1;
                padding: 10px;
                border: none;
                background: #F2A900;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s;
            `;
            reserveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                actions.onReserve(area);
            });
            footer.appendChild(reserveBtn);
        }

        if (footer.children.length > 0) {
            card.appendChild(footer);
        }
    }

    if (onClick) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                onClick(area, e);
            }
        });
    }

    return card;
}

/**
 * Tworzy kartę wynajętego obszaru
 * @param {Object} reservation - Dane rezerwacji
 * @returns {HTMLElement} Element karty
 */
export function createRentedAreaCard(reservation) {
    const card = document.createElement('div');
    card.className = 'area-card rented-area-card';
    card.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    const area = reservation.area || {};

    const title = document.createElement('h3');
    title.textContent = area.name || 'Wynajęty obszar';
    title.style.cssText = `
        margin: 0 0 15px 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
    `;
    card.appendChild(title);

    const properties = [
        { label: 'Właściciel:', value: `${reservation.ownerFirstname || ''} ${reservation.ownerLastname || ''}`.trim() },
        { label: 'Okres:', value: `${formatDate(reservation.startDate)} - ${formatDate(reservation.endDate)}` },
        { label: 'Liczba uli:', value: reservation.numberOfHives },
        { label: 'Koszt całkowity:', value: formatPrice(reservation.totalPrice) }
    ];

    if (reservation.notes) {
        properties.push({ label: 'Uwagi:', value: reservation.notes });
    }

    properties.forEach(prop => {
        const propElement = document.createElement('div');
        propElement.style.cssText = `
            display: flex;
            margin-bottom: 8px;
            font-size: 14px;
        `;

        propElement.innerHTML = `
            <span style="font-weight: 600; color: #666; min-width: 130px;">${prop.label}</span>
            <span style="color: #333;">${prop.value}</span>
        `;

        card.appendChild(propElement);
    });

    return card;
}

// ==================== FUNKCJE POMOCNICZE ====================

/**
 * Pobiera URL pierwszego zdjęcia obszaru
 * @param {Object} area - Dane obszaru
 * @returns {string} URL zdjęcia
 */
function getAreaImageUrl(area) {
    if (area.images && area.images.length > 0) {
        const firstImage = area.images[0];
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

    return DEFAULT_AREA_IMAGE;
}

/**
 * Renderuje listę kart obszarów w kontenerze
 * @param {HTMLElement|string} container - Kontener lub selektor
 * @param {Array} areas - Tablica obszarów
 * @param {Object} options - Opcje renderowania
 */
export function renderAreaCards(container, areas, options = {}) {
    const element = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!element) {
        console.error('Container not found');
        return;
    }

    element.innerHTML = '';

    if (!areas || areas.length === 0) {
        element.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-map-marked-alt" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">Nie znaleziono obszarów</h3>
                <p style="color: #999;">Dodaj swój pierwszy obszar dla pszczelarzy</p>
            </div>
        `;
        return;
    }

    areas.forEach(area => {
        const card = createAreaCard(area, options);
        element.appendChild(card);
    });
}