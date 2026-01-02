// ==================== FORMATOWANIE DAT ====================

/**
 * Formatuje datę do formatu DD.MM.YYYY
 * @param {string|Date} dateString - Data do sformatowania
 * @returns {string} Sformatowana data
 */
export function formatDate(dateString) {
    if (!dateString) return 'Brak daty';

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Nieprawidłowa data';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    } catch (error) {
        console.error('Błąd formatowania daty:', error);
        return 'Błąd daty';
    }
}

/**
 * Formatuje datę do formatu ISO (YYYY-MM-DD) dla input[type="date"]
 * @param {string|Date} dateString - Data do sformatowania
 * @returns {string} Data w formacie ISO
 */
export function formatDateISO(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Błąd formatowania daty ISO:', error);
        return '';
    }
}

/**
 * Formatuje datę z czasem
 * @param {string|Date} dateString - Data do sformatowania
 * @returns {string} Sformatowana data z czasem
 */
export function formatDateTime(dateString) {
    if (!dateString) return 'Brak daty';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Nieprawidłowa data';

        const dateFormatted = formatDate(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${dateFormatted} ${hours}:${minutes}`;
    } catch (error) {
        console.error('Błąd formatowania daty i czasu:', error);
        return 'Błąd daty';
    }
}

// ==================== FORMATOWANIE CENY ====================

/**
 * Formatuje cenę do wyświetlenia
 * @param {number} price - Cena do sformatowania
 * @param {string} currency - Symbol waluty (domyślnie PLN)
 * @returns {string} Sformatowana cena
 */
export function formatPrice(price, currency = 'PLN') {
    if (price === null || price === undefined || isNaN(price)) {
        return '0.00 PLN';
    }

    const formatted = Number(price).toFixed(2);
    return `${formatted} ${currency}`;
}

/**
 * Formatuje cenę bez waluty
 * @param {number} price - Cena do sformatowania
 * @returns {string} Sformatowana cena
 */
export function formatPriceNumber(price) {
    if (price === null || price === undefined || isNaN(price)) {
        return '0.00';
    }

    return Number(price).toFixed(2);
}

// ==================== FORMATOWANIE LOKALIZACJI ====================

/**
 * Formatuje współrzędne do czytelnej formy
 * @param {Array} coordinates - Tablica współrzędnych [lat, lng] lub [[lat, lng], ...]
 * @returns {string} Sformatowane współrzędne
 */
export function formatLocation(coordinates) {
    if (!coordinates || !Array.isArray(coordinates)) {
        return 'Brak lokalizacji';
    }

    const coords = Array.isArray(coordinates[0]) ? coordinates[0] : coordinates;

    if (coords.length < 2) {
        return 'Brak lokalizacji';
    }

    const lat = Number(coords[0]).toFixed(4);
    const lng = Number(coords[1]).toFixed(4);

    return `${lat}, ${lng}`;
}

/**
 * Formatuje współrzędne do krótkiej formy (2 miejsca po przecinku)
 * @param {Array} coordinates - Tablica współrzędnych
 * @returns {string} Sformatowane współrzędne
 */
export function formatLocationShort(coordinates) {
    if (!coordinates || !Array.isArray(coordinates)) {
        return 'Brak';
    }

    const coords = Array.isArray(coordinates[0]) ? coordinates[0] : coordinates;

    if (coords.length < 2) {
        return 'Brak';
    }

    const lat = Number(coords[0]).toFixed(2);
    const lng = Number(coords[1]).toFixed(2);

    return `${lat}, ${lng}`;
}

// ==================== FORMATOWANIE POWIERZCHNI ====================

/**
 * Formatuje powierzchnię obszaru
 * @param {number} area - Powierzchnia w hektarach
 * @returns {string} Sformatowana powierzchnia
 */
export function formatArea(area) {
    if (area === null || area === undefined || isNaN(area)) {
        return '0.00 ha';
    }

    return `${Number(area).toFixed(2)} ha`;
}

// ==================== FORMATOWANIE LICZBY ====================

/**
 * Formatuje liczbę z separatorami tysięcy
 * @param {number} number - Liczba do sformatowania
 * @returns {string} Sformatowana liczba
 */
export function formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) {
        return '0';
    }

    return Number(number).toLocaleString('pl-PL');
}

// ==================== FORMATOWANIE TEKSTU ====================

/**
 * Skraca tekst do określonej długości
 * @param {string} text - Tekst do skrócenia
 * @param {number} maxLength - Maksymalna długość
 * @returns {string} Skrócony tekst
 */
export function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength) + '...';
}

/**
 * Kapitalizuje pierwszą literę
 * @param {string} text - Tekst do skapitalizowania
 * @returns {string} Skapitalizowany tekst
 */
export function capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ==================== FORMATOWANIE STATUSU ====================

/**
 * Formatuje status do wyświetlenia
 * @param {string} status - Status
 * @returns {string} Sformatowany status
 */
export function formatStatus(status) {
    if (!status) return 'Nieznany';

    const statusMap = {
        'AVAILABLE': 'Dostępny',
        'UNAVAILABLE': 'Niedostępny',
        'OUT_OF_STOCK': 'Brak w magazynie',
        'PENDING': 'Oczekujący',
        'APPROVED': 'Zatwierdzony',
        'REJECTED': 'Odrzucony'
    };

    return statusMap[status] || status;
}

// ==================== FORMATOWANIE KATEGORII ====================

/**
 * Formatuje nazwę kategorii produktu
 * @param {string} category - Kategoria
 * @returns {string} Sformatowana kategoria
 */
export function formatCategory(category) {
    if (!category) return 'Inne';

    const categoryMap = {
        'HONEY': 'Miód',
        'WAX': 'Wosk',
        'PROPOLIS': 'Propolis',
        'POLLEN': 'Pyłek',
        'ROYAL_JELLY': 'Mleczko pszczele',
        'BEE_BREAD': 'Pierzga',
        'MEAD': 'Miód pitny',
        'COSMETICS': 'Kosmetyki',
        'CANDLES': 'Świece',
        'OTHER': 'Inne'
    };

    return categoryMap[category] || category;
}