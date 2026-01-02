import { formatStatus } from '../utils/formatters.js';

// ==================== STATUS BADGE ====================

/**
 * Mapowanie statusów na klasy CSS
 */
const STATUS_CLASS_MAP = {
    'AVAILABLE': 'status-available',
    'UNAVAILABLE': 'status-unavailable',
    'OUT_OF_STOCK': 'status-out-of-stock',
    'PENDING': 'status-pending',
    'APPROVED': 'status-approved',
    'REJECTED': 'status-rejected',
    'ACTIVE': 'status-active',
    'INACTIVE': 'status-inactive'
};

/**
 * Mapowanie statusów na kolory
 */
const STATUS_COLOR_MAP = {
    'AVAILABLE': '#27ae60',
    'UNAVAILABLE': '#e74c3c',
    'OUT_OF_STOCK': '#95a5a6',
    'PENDING': '#f39c12',
    'APPROVED': '#27ae60',
    'REJECTED': '#e74c3c',
    'ACTIVE': '#27ae60',
    'INACTIVE': '#95a5a6'
};

/**
 * Tworzy badge statusu
 * @param {string} status - Status do wyświetlenia
 * @param {Object} options - Opcje konfiguracji
 * @param {string} options.size - Rozmiar ('small', 'medium', 'large')
 * @param {boolean} options.outlined - Czy ma być tylko outline
 * @param {string} options.customColor - Własny kolor
 * @param {string} options.customText - Własny tekst (zamiast formatStatus)
 * @returns {HTMLElement} Element badge
 */
export function createStatusBadge(status, options = {}) {
    const {
        size = 'medium',
        outlined = false,
        customColor = null,
        customText = null
    } = options;

    const badge = document.createElement('span');
    badge.className = `status-badge ${STATUS_CLASS_MAP[status] || ''} status-badge-${size}`;

    const color = customColor || STATUS_COLOR_MAP[status] || '#95a5a6';
    const text = customText || formatStatus(status);

    badge.textContent = text;

    if (outlined) {
        badge.style.cssText = `
            display: inline-block;
            padding: ${size === 'small' ? '4px 8px' : size === 'large' ? '8px 16px' : '6px 12px'};
            border: 2px solid ${color};
            color: ${color};
            background-color: transparent;
            border-radius: 20px;
            font-size: ${size === 'small' ? '11px' : size === 'large' ? '14px' : '12px'};
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
    } else {
        badge.style.cssText = `
            display: inline-block;
            padding: ${size === 'small' ? '4px 8px' : size === 'large' ? '8px 16px' : '6px 12px'};
            background-color: ${color};
            color: white;
            border-radius: 20px;
            font-size: ${size === 'small' ? '11px' : size === 'large' ? '14px' : '12px'};
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
    }

    return badge;
}

/**
 * Tworzy badge dostępności (dla produktów/obszarów)
 * @param {boolean} available - Czy dostępny
 * @param {number} stock - Ilość w magazynie (opcjonalne)
 * @returns {HTMLElement} Element badge
 */
export function createAvailabilityBadge(available, stock = null) {
    let status, text;

    if (stock !== null && stock === 0) {
        status = 'OUT_OF_STOCK';
        text = 'Brak w magazynie';
    } else if (available) {
        status = 'AVAILABLE';
        text = 'Dostępny';
    } else {
        status = 'UNAVAILABLE';
        text = 'Niedostępny';
    }

    return createStatusBadge(status, { customText: text });
}

/**
 * Tworzy badge z ikoną
 * @param {string} status - Status
 * @param {string} iconClass - Klasa ikony FontAwesome
 * @param {Object} options - Opcje konfiguracji
 * @returns {HTMLElement} Element badge z ikoną
 */
export function createStatusBadgeWithIcon(status, iconClass, options = {}) {
    const badge = createStatusBadge(status, options);

    const icon = document.createElement('i');
    icon.className = iconClass;
    icon.style.marginRight = '6px';

    badge.insertBefore(icon, badge.firstChild);

    return badge;
}

/**
 * Aktualizuje badge w istniejącym elemencie
 * @param {HTMLElement} element - Element zawierający badge
 * @param {string} newStatus - Nowy status
 */
export function updateStatusBadge(element, newStatus) {
    if (!element) return;

    const badge = element.querySelector('.status-badge');
    if (!badge) return;

    badge.className = `status-badge ${STATUS_CLASS_MAP[newStatus] || ''}`;
    badge.textContent = formatStatus(newStatus);

    const color = STATUS_COLOR_MAP[newStatus] || '#95a5a6';
    const isOutlined = badge.style.backgroundColor === 'transparent';

    if (isOutlined) {
        badge.style.borderColor = color;
        badge.style.color = color;
    } else {
        badge.style.backgroundColor = color;
    }
}

/**
 * Pomocnicze funkcje do szybkiego tworzenia popularnych badge'ów
 */
export const StatusBadges = {
    available: () => createStatusBadge('AVAILABLE'),
    unavailable: () => createStatusBadge('UNAVAILABLE'),
    outOfStock: () => createStatusBadge('OUT_OF_STOCK'),
    pending: () => createStatusBadge('PENDING'),
    approved: () => createStatusBadge('APPROVED'),
    rejected: () => createStatusBadge('REJECTED')
};