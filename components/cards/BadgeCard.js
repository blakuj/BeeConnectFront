// ==================== BADGE CARD ====================

/**
 * Tworzy kartę odznaki
 * @param {Object} badge - Dane odznaki
 * @param {Object} options - Opcje konfiguracji
 * @returns {HTMLElement} Element karty
 */
export function createBadgeCard(badge, options = {}) {
    const {
        size = 'normal',
        showDescription = true,
        earned = false
    } = options;

    const card = document.createElement('div');
    card.className = `badge-card badge-card-${size}`;
    card.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: ${size === 'small' ? '15px' : '20px'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: ${size === 'small' ? '12px' : '15px'};
        opacity: ${earned ? '1' : '0.5'};
    `;

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    const badgeColor = badge.color || '#F2A900';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'badge-icon';
    iconContainer.style.cssText = `
        width: ${size === 'small' ? '50px' : '70px'};
        height: ${size === 'small' ? '50px' : '70px'};
        border-radius: 50%;
        background-color: ${badgeColor}15;
        border: 3px solid ${badgeColor};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `;

    const icon = document.createElement('i');
    icon.className = badge.icon || 'fas fa-award';
    icon.style.cssText = `
        font-size: ${size === 'small' ? '24px' : '32px'};
        color: ${badgeColor};
    `;

    iconContainer.appendChild(icon);
    card.appendChild(iconContainer);

    const content = document.createElement('div');
    content.className = 'badge-content';
    content.style.cssText = `
        flex: 1;
    `;

    const name = document.createElement('h4');
    name.className = 'badge-name';
    name.textContent = badge.name || 'Badge';
    name.style.cssText = `
        margin: 0 0 ${showDescription ? '6px' : '0'} 0;
        font-size: ${size === 'small' ? '14px' : '16px'};
        font-weight: 600;
        color: #333;
    `;
    content.appendChild(name);

    if (showDescription && badge.description) {
        const description = document.createElement('p');
        description.className = 'badge-description';
        description.textContent = badge.description;
        description.style.cssText = `
            margin: 0;
            font-size: ${size === 'small' ? '12px' : '13px'};
            color: #666;
            line-height: 1.4;
        `;
        content.appendChild(description);
    }

    card.appendChild(content);

    if (earned) {
        const earnedBadge = document.createElement('div');
        earnedBadge.className = 'badge-earned';
        earnedBadge.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            color: ${badgeColor};
            font-size: ${size === 'small' ? '12px' : '13px'};
            font-weight: 600;
        `;

        earnedBadge.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Zdobyte!</span>
        `;

        card.appendChild(earnedBadge);
    }

    return card;
}

/**
 * Tworzy inline badge (mały, do wyświetlenia obok nazwy użytkownika)
 * @param {Object} badge - Dane odznaki
 * @returns {HTMLElement} Element badge
 */
export function createInlineBadge(badge) {
    const container = document.createElement('span');
    container.className = 'inline-badge';
    container.title = badge.description || badge.name;
    container.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        background-color: ${badge.color}15;
        border: 1px solid ${badge.color};
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        color: ${badge.color};
        cursor: help;
    `;

    const icon = document.createElement('i');
    icon.className = badge.icon || 'fas fa-award';
    icon.style.fontSize = '10px';

    const name = document.createElement('span');
    name.textContent = badge.name;

    container.appendChild(icon);
    container.appendChild(name);

    return container;
}

/**
 * Renderuje listę kart odznak w kontenerze
 * @param {HTMLElement|string} container - Kontener lub selektor
 * @param {Array} badges - Tablica odznak
 * @param {Object} options - Opcje renderowania
 */
export function renderBadgeCards(container, badges, options = {}) {
    const element = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!element) {
        console.error('Container not found');
        return;
    }

    element.innerHTML = '';

    if (!badges || badges.length === 0) {
        element.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-award" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">Nie masz jeszcze odznak</h3>
                <p style="color: #999;">Bądź aktywny na platformie, aby zdobywać odznaki!</p>
            </div>
        `;
        return;
    }

    badges.forEach(badge => {
        const card = createBadgeCard(badge, { ...options, earned: true });
        element.appendChild(card);
    });
}