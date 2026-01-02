// ==================== RATING STARS ====================

/**
 * Tworzy wyświetlanie gwiazdek (tylko do odczytu)
 * @param {number} rating - Ocena (0-5)
 * @param {Object} options - Opcje konfiguracji
 * @param {number} options.maxStars - Maksymalna liczba gwiazdek (domyślnie 5)
 * @param {string} options.size - Rozmiar ('small', 'medium', 'large')
 * @param {boolean} options.showNumber - Czy pokazać liczbę obok gwiazdek
 * @param {string} options.color - Kolor gwiazdek
 * @returns {HTMLElement} Element z gwiazdkami
 */
export function createRatingDisplay(rating, options = {}) {
    const {
        maxStars = 5,
        size = 'medium',
        showNumber = false,
        color = '#FFD700'
    } = options;

    const sizeMap = {
        small: '12px',
        medium: '16px',
        large: '20px'
    };

    const fontSize = sizeMap[size] || sizeMap.medium;

    const container = document.createElement('div');
    container.className = 'rating-stars rating-display';
    container.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 2px;
    `;

    const starsContainer = document.createElement('div');
    starsContainer.style.display = 'inline-flex';
    starsContainer.style.gap = '2px';

    for (let i = 1; i <= maxStars; i++) {
        const star = document.createElement('i');

        if (i <= Math.floor(rating)) {
            star.className = 'fas fa-star';
            star.style.color = color;
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            star.className = 'fas fa-star-half-alt';
            star.style.color = color;
        } else {
            star.className = 'far fa-star';
            star.style.color = '#ddd';
        }

        star.style.fontSize = fontSize;
        starsContainer.appendChild(star);
    }

    container.appendChild(starsContainer);

    if (showNumber) {
        const number = document.createElement('span');
        number.textContent = rating.toFixed(1);
        number.style.cssText = `
            margin-left: 6px;
            font-size: ${fontSize};
            color: #666;
            font-weight: 600;
        `;
        container.appendChild(number);
    }

    return container;
}

/**
 * Tworzy interaktywne gwiazdki (do wyboru oceny)
 * @param {Object} options - Opcje konfiguracji
 * @param {number} options.initialRating - Początkowa ocena (0-5)
 * @param {number} options.maxStars - Maksymalna liczba gwiazdek
 * @param {string} options.size - Rozmiar
 * @param {Function} options.onChange - Callback przy zmianie oceny
 * @param {string} options.color - Kolor gwiazdek
 * @returns {Object} { element: HTMLElement, getValue: Function, setValue: Function }
 */
export function createRatingInput(options = {}) {
    const {
        initialRating = 0,
        maxStars = 5,
        size = 'medium',
        onChange = null,
        color = '#FFD700'
    } = options;

    const sizeMap = {
        small: '16px',
        medium: '24px',
        large: '32px'
    };

    const fontSize = sizeMap[size] || sizeMap.medium;

    let currentRating = initialRating;

    const container = document.createElement('div');
    container.className = 'rating-stars rating-input';
    container.style.cssText = `
        display: inline-flex;
        gap: 4px;
        cursor: pointer;
    `;

    const stars = [];

    function updateStars(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.className = 'fas fa-star';
                star.style.color = color;
            } else {
                star.className = 'far fa-star';
                star.style.color = '#ddd';
            }
        });
    }

    for (let i = 1; i <= maxStars; i++) {
        const star = document.createElement('i');
        star.className = i <= currentRating ? 'fas fa-star' : 'far fa-star';
        star.style.fontSize = fontSize;
        star.style.color = i <= currentRating ? color : '#ddd';
        star.style.cursor = 'pointer';
        star.style.transition = 'color 0.2s, transform 0.2s';
        star.dataset.value = i;

        star.addEventListener('mouseenter', () => {
            updateStars(i);
        });

        star.addEventListener('mouseleave', () => {
            updateStars(currentRating);
        });

        star.addEventListener('click', () => {
            currentRating = i;
            updateStars(currentRating);

            if (onChange) {
                onChange(currentRating);
            }
        });

        stars.push(star);
        container.appendChild(star);
    }

    updateStars(currentRating);

    return {
        element: container,
        getValue: () => currentRating,
        setValue: (rating) => {
            currentRating = Math.max(0, Math.min(maxStars, rating));
            updateStars(currentRating);
        },
        reset: () => {
            currentRating = 0;
            updateStars(0);
        }
    };
}

/**
 * Tworzy gwiazdki z tekstem opisu
 * @param {number} rating - Ocena
 * @param {number} reviewCount - Liczba recenzji
 * @param {Object} options - Opcje
 * @returns {HTMLElement} Element z gwiazdkami i opisem
 */
export function createRatingWithReviews(rating, reviewCount, options = {}) {
    const container = document.createElement('div');
    container.className = 'rating-with-reviews';
    container.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 8px;
    `;

    const starsElement = createRatingDisplay(rating, options);
    container.appendChild(starsElement);

    const reviewText = document.createElement('span');
    reviewText.textContent = `(${reviewCount} ${reviewCount === 1 ? 'recenzja' : 'recenzje'})`;
    reviewText.style.cssText = `
        color: #666;
        font-size: 14px;
    `;
    container.appendChild(reviewText);

    return container;
}

/**
 * Inicjalizuje gwiazdki w formularzu
 * @param {string|HTMLElement} container - Kontener lub selektor
 * @param {string|HTMLElement} hiddenInput - Input ukryty do przechowania wartości
 * @param {Object} options - Opcje konfiguracji
 */
export function initializeRatingForm(container, hiddenInput, options = {}) {
    const containerElement = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    const inputElement = typeof hiddenInput === 'string'
        ? document.querySelector(hiddenInput)
        : hiddenInput;

    if (!containerElement || !inputElement) {
        console.error('Container or input not found');
        return null;
    }

    const rating = createRatingInput({
        ...options,
        onChange: (value) => {
            inputElement.value = value;
            if (options.onChange) {
                options.onChange(value);
            }
        }
    });

    containerElement.innerHTML = '';
    containerElement.appendChild(rating.element);

    return rating;
}

/**
 * Konwertuje liczbową ocenę na tekst
 * @param {number} rating - Ocena (1-5)
 * @returns {string} Tekstowy opis oceny
 */
export function ratingToText(rating) {
    const ratingTexts = {
        1: 'Bardzo słaba',
        2: 'Słaba',
        3: 'Średnia',
        4: 'Dobra',
        5: 'Bardzo dobra'
    };

    return ratingTexts[Math.round(rating)] || 'Brak oceny';
}

/**
 * Oblicza średnią ocenę z tablicy ocen
 * @param {number[]} ratings - Tablica ocen
 * @returns {number} Średnia ocena
 */
export function calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return sum / ratings.length;
}

/**
 * Tworzy rozkład gwiazdek (histogram)
 * @param {number[]} ratings - Tablica wszystkich ocen
 * @returns {HTMLElement} Element z histogramem
 */
export function createRatingDistribution(ratings) {
    const distribution = [0, 0, 0, 0, 0];
    ratings.forEach(rating => {
        const index = Math.round(rating) - 1;
        if (index >= 0 && index < 5) {
            distribution[index]++;
        }
    });

    const total = ratings.length;
    const container = document.createElement('div');
    container.className = 'rating-distribution';
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

    for (let i = 4; i >= 0; i--) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const label = document.createElement('span');
        label.textContent = `${i + 1}★`;
        label.style.cssText = `
            width: 30px;
            font-size: 14px;
            font-weight: 600;
        `;

        const barContainer = document.createElement('div');
        barContainer.style.cssText = `
            flex: 1;
            height: 8px;
            background-color: #f0f0f0;
            border-radius: 4px;
            overflow: hidden;
        `;

        const bar = document.createElement('div');
        const percentage = total > 0 ? (distribution[i] / total) * 100 : 0;
        bar.style.cssText = `
            height: 100%;
            width: ${percentage}%;
            background-color: #FFD700;
            transition: width 0.3s;
        `;
        barContainer.appendChild(bar);

        const count = document.createElement('span');
        count.textContent = distribution[i];
        count.style.cssText = `
            width: 30px;
            text-align: right;
            font-size: 14px;
            color: #666;
        `;

        row.appendChild(label);
        row.appendChild(barContainer);
        row.appendChild(count);
        container.appendChild(row);
    }

    return container;
}