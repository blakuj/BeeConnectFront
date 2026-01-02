// ==================== LOADING SPINNER ====================

/**
 * Tworzy loader/spinner
 * @param {Object} options - Opcje konfiguracji
 * @param {string} options.size - Rozmiar ('small', 'medium', 'large')
 * @param {string} options.color - Kolor (#hex lub var(--variable))
 * @param {string} options.text - Tekst pod spinnerem
 * @returns {HTMLElement} Element spinner
 */
export function createSpinner(options = {}) {
    const {
        size = 'medium',
        color = '#F2A900',
        text = ''
    } = options;

    const sizeMap = {
        small: '24px',
        medium: '48px',
        large: '64px'
    };

    const spinnerSize = sizeMap[size] || sizeMap.medium;

    const container = document.createElement('div');
    container.className = 'loading-spinner-container';
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    `;

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    spinner.style.cssText = `
        font-size: ${spinnerSize};
        color: ${color};
    `;

    container.appendChild(spinner);

    if (text) {
        const textElement = document.createElement('p');
        textElement.textContent = text;
        textElement.style.cssText = `
            color: #999;
            margin-top: 15px;
            font-size: 14px;
        `;
        container.appendChild(textElement);
    }

    return container;
}

/**
 * Wyświetla loader w kontenerze
 * @param {string|HTMLElement} container - Selektor lub element kontenera
 * @param {Object} options - Opcje loadera
 */
export function showLoading(container, options = {}) {
    const element = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!element) {
        console.error('Container not found');
        return;
    }

    const spinner = createSpinner(options);
    element.innerHTML = '';
    element.appendChild(spinner);
}

/**
 * Usuwa loader z kontenera
 * @param {string|HTMLElement} container - Selektor lub element kontenera
 */
export function hideLoading(container) {
    const element = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!element) return;

    const spinner = element.querySelector('.loading-spinner-container');
    if (spinner) {
        spinner.remove();
    }
}

/**
 * Tworzy overlay z spinnerem na całej stronie
 * @param {string} text - Tekst pod spinnerem
 * @returns {HTMLElement} Element overlay
 */
export function createLoadingOverlay(text = 'Ładowanie...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    const spinner = createSpinner({ size: 'large', text });
    content.appendChild(spinner);
    overlay.appendChild(content);

    return overlay;
}

/**
 * Pokazuje overlay z spinnerem
 * @param {string} text - Tekst pod spinnerem
 * @returns {HTMLElement} Element overlay (do późniejszego usunięcia)
 */
export function showLoadingOverlay(text = 'Ładowanie...') {
    const overlay = createLoadingOverlay(text);
    document.body.appendChild(overlay);
    return overlay;
}

/**
 * Ukrywa overlay z spinnerem
 * @param {HTMLElement} overlay - Element overlay do usunięcia
 */
export function hideLoadingOverlay(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

/**
 * Tworzy inline spinner (mały, do przycisków)
 * @returns {HTMLElement} Element spinner
 */
export function createInlineSpinner() {
    const spinner = document.createElement('i');
    spinner.className = 'fas fa-spinner fa-spin';
    spinner.style.marginRight = '8px';
    return spinner;
}