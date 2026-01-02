import { API_URL, API_BASE } from './constants.js';

// ==================== KONFIGURACJA ====================

const defaultHeaders = {
    'Content-Type': 'application/json'
};

const defaultOptions = {
    credentials: 'include'
};

// ==================== OBSŁUGA BŁĘDÓW ====================

/**
 * Obsługuje błędy autoryzacji
 */
function handleAuthError() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

/**
 * Przetwarza odpowiedź z API
 * @param {Response} response - Odpowiedź fetch
 * @returns {Promise<any>} Sparsowane dane lub rzucony błąd
 */
async function handleResponse(response) {
    if (response.status === 401) {
        handleAuthError();
        throw new Error('Sesja wygasła. Zaloguj się ponownie.');
    }

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
            // Jeśli nie można sparsować błędu, zostaw domyślny komunikat
        }

        throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }

    return await response.text();
}

// ==================== METODY HTTP ====================

/**
 * GET request
 * @param {string} endpoint - Endpoint API (bez base URL)
 * @param {Object} options - Dodatkowe opcje fetch
 * @returns {Promise<any>} Dane z odpowiedzi
 */
export async function apiGet(endpoint, options = {}) {
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

        const response = await fetch(url, {
            method: 'GET',
            ...defaultOptions,
            ...options
        });

        return await handleResponse(response);
    } catch (error) {
        console.error(`API GET Error [${endpoint}]:`, error);
        throw error;
    }
}

/**
 * POST request
 * @param {string} endpoint - Endpoint API (bez base URL)
 * @param {any} data - Dane do wysłania
 * @param {Object} options - Dodatkowe opcje fetch
 * @returns {Promise<any>} Dane z odpowiedzi
 */
export async function apiPost(endpoint, data = null, options = {}) {
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

        const fetchOptions = {
            method: 'POST',
            ...defaultOptions,
            headers: {
                ...defaultHeaders,
                ...options.headers
            },
            ...options
        };

        if (data !== null) {
            fetchOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, fetchOptions);

        return await handleResponse(response);
    } catch (error) {
        console.error(`API POST Error [${endpoint}]:`, error);
        throw error;
    }
}

/**
 * PUT request
 * @param {string} endpoint - Endpoint API (bez base URL)
 * @param {any} data - Dane do wysłania
 * @param {Object} options - Dodatkowe opcje fetch
 * @returns {Promise<any>} Dane z odpowiedzi
 */
export async function apiPut(endpoint, data, options = {}) {
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

        const response = await fetch(url, {
            method: 'PUT',
            ...defaultOptions,
            headers: {
                ...defaultHeaders,
                ...options.headers
            },
            body: JSON.stringify(data),
            ...options
        });

        return await handleResponse(response);
    } catch (error) {
        console.error(`API PUT Error [${endpoint}]:`, error);
        throw error;
    }
}

/**
 * DELETE request
 * @param {string} endpoint - Endpoint API (bez base URL)
 * @param {Object} options - Dodatkowe opcje fetch
 * @returns {Promise<any>} Dane z odpowiedzi
 */
export async function apiDelete(endpoint, options = {}) {
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

        const response = await fetch(url, {
            method: 'DELETE',
            ...defaultOptions,
            ...options
        });

        return await handleResponse(response);
    } catch (error) {
        console.error(`API DELETE Error [${endpoint}]:`, error);
        throw error;
    }
}

// ==================== FUNKCJE POMOCNICZE ====================

/**
 * Buduje URL z parametrami query
 * @param {string} baseUrl - Bazowy URL
 * @param {Object} params - Parametry query
 * @returns {string} URL z parametrami
 */
export function buildUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl, window.location.origin);

    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
        }
    });

    return url.toString();
}

/**
 * Pobiera dane użytkownika z localStorage
 * @returns {Object|null} Dane użytkownika lub null
 */
export function getCurrentUser() {
    try {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
        console.error('Błąd odczytu użytkownika z localStorage:', error);
        return null;
    }
}

/**
 * Zapisuje dane użytkownika do localStorage
 * @param {Object} user - Dane użytkownika
 */
export function setCurrentUser(user) {
    try {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
        console.error('Błąd zapisu użytkownika do localStorage:', error);
    }
}

/**
 * Sprawdza czy użytkownik jest zalogowany
 * @returns {boolean} True jeśli zalogowany
 */
export function isAuthenticated() {
    return getCurrentUser() !== null;
}

/**
 * Wylogowuje użytkownika
 */
export async function logout() {
    try {
        await apiPost('/auth/logout');
    } catch (error) {
        console.error('Błąd wylogowania:', error);
    } finally {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// ==================== SKRÓTY DO KONKRETNYCH ENDPOINTÓW ====================

/**
 * Pobiera profil użytkownika
 * @returns {Promise<Object>} Dane użytkownika
 */
export async function fetchUserProfile() {
    return await apiGet('/auth/user');
}

/**
 * Pobiera wszystkie obszary
 * @returns {Promise<Array>} Lista obszarów
 */
export async function fetchAreas() {
    return await apiGet('/areas');
}

/**
 * Pobiera wszystkie produkty
 * @returns {Promise<Array>} Lista produktów
 */
export async function fetchProducts() {
    return await apiGet('/products');
}

/**
 * Pobiera szczegóły produktu
 * @param {number} id - ID produktu
 * @returns {Promise<Object>} Szczegóły produktu
 */
export async function fetchProductDetails(id) {
    return await apiGet(`/products/${id}`);
}

/**
 * Pobiera szczegóły obszaru
 * @param {number} id - ID obszaru
 * @returns {Promise<Object>} Szczegóły obszaru
 */
export async function fetchAreaDetails(id) {
    return await apiGet(`/areas/${id}`);
}

/**
 * Pobiera recenzje produktu
 * @param {number} productId - ID produktu
 * @returns {Promise<Array>} Lista recenzji
 */
export async function fetchProductReviews(productId) {
    return await apiGet(`/reviews/product/${productId}`);
}

/**
 * Dodaje recenzję produktu
 * @param {number} orderId - ID zamówienia
 * @param {Object} reviewData - Dane recenzji
 * @returns {Promise<Object>} Utworzona recenzja
 */
export async function addProductReview(orderId, reviewData) {
    return await apiPost(`/reviews/order/${orderId}`, reviewData);
}

/**
 * Dodaje recenzję obszaru
 * @param {number} reservationId - ID rezerwacji
 * @param {Object} reviewData - Dane recenzji
 * @returns {Promise<Object>} Utworzona recenzja
 */
export async function addAreaReview(reservationId, reviewData) {
    return await apiPost(`/reviews/reservation/${reservationId}`, reviewData);
}

/**
 * Usuwa produkt
 * @param {number} productId - ID produktu
 * @returns {Promise<any>} Odpowiedź API
 */
export async function deleteProduct(productId) {
    return await apiDelete(`/products/${productId}`);
}

/**
 * Usuwa obszar
 * @param {number} areaId - ID obszaru
 * @returns {Promise<any>} Odpowiedź API
 */
export async function deleteArea(areaId) {
    return await apiDelete(`/areas/${areaId}`);
}