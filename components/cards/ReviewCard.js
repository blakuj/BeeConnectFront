import { formatDate } from '../utils/formatters.js';
import { createRatingDisplay } from '../ui/RatingStars.js';

// ==================== REVIEW CARD ====================

/**
 * Tworzy kartę recenzji
 * @param {Object} review - Dane recenzji
 * @param {Object} options - Opcje konfiguracji
 * @returns {HTMLElement} Element karty
 */
export function createReviewCard(review, options = {}) {
    const {
        size = 'normal',
        showAvatar = true
    } = options;

    const card = document.createElement('div');
    card.className = `review-card review-card-${size}`;
    card.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: ${size === 'small' ? '12px' : '20px'};
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        border-left: 4px solid #F2A900;
    `;

    const header = document.createElement('div');
    header.className = 'review-header';
    header.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    `;

    if (showAvatar) {
        const avatar = document.createElement('div');
        avatar.className = 'review-avatar';
        avatar.style.cssText = `
            width: ${size === 'small' ? '36px' : '48px'};
            height: ${size === 'small' ? '36px' : '48px'};
            border-radius: 50%;
            background: linear-gradient(135deg, #F2A900, #d89700);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: ${size === 'small' ? '14px' : '18px'};
        `;

        const initial = (review.reviewerName || review.reviewer || 'U')[0].toUpperCase();
        avatar.textContent = initial;

        header.appendChild(avatar);
    }

    const headerInfo = document.createElement('div');
    headerInfo.style.cssText = `
        flex: 1;
    `;

    const reviewerName = document.createElement('div');
    reviewerName.className = 'review-author';
    reviewerName.textContent = review.reviewerName || review.reviewer || 'Użytkownik';
    reviewerName.style.cssText = `
        font-weight: 600;
        font-size: ${size === 'small' ? '13px' : '15px'};
        color: #333;
        margin-bottom: 4px;
    `;
    headerInfo.appendChild(reviewerName);

    const reviewDate = document.createElement('div');
    reviewDate.className = 'review-date';
    reviewDate.textContent = formatDate(review.createdAt || review.date);
    reviewDate.style.cssText = `
        font-size: ${size === 'small' ? '11px' : '12px'};
        color: #999;
    `;
    headerInfo.appendChild(reviewDate);

    header.appendChild(headerInfo);

    if (review.rating !== undefined) {
        const rating = createRatingDisplay(review.rating, {
            size: size === 'small' ? 'small' : 'medium'
        });
        header.appendChild(rating);
    }

    card.appendChild(header);

    if (review.content || review.comment) {
        const content = document.createElement('div');
        content.className = 'review-content';
        content.textContent = review.content || review.comment;
        content.style.cssText = `
            color: #666;
            font-size: ${size === 'small' ? '13px' : '14px'};
            line-height: 1.6;
            margin: 0;
        `;
        card.appendChild(content);
    }

    return card;
}

/**
 * Renderuje listę kart recenzji w kontenerze
 * @param {HTMLElement|string} container - Kontener lub selektor
 * @param {Array} reviews - Tablica recenzji
 * @param {Object} options - Opcje renderowania
 */
export function renderReviewCards(container, reviews, options = {}) {
    const element = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!element) {
        console.error('Container not found');
        return;
    }

    element.innerHTML = '';

    if (!reviews || reviews.length === 0) {
        element.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-comments" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <p style="color: #999; margin: 0;">Brak recenzji</p>
            </div>
        `;
        return;
    }

    reviews.forEach(review => {
        const card = createReviewCard(review, options);
        element.appendChild(card);
    });
}