import { MAX_IMAGE_SIZE_BYTES } from './constants.js';

// ==================== KONWERSJA DO BASE64 ====================

/**
 * Konwertuje pojedynczy plik na base64
 * @param {File} file - Plik do konwersji
 * @returns {Promise<string>} Base64 string (bez prefiksu data:image)
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };

        reader.onerror = () => {
            reject(new Error('Błąd podczas czytania pliku'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Konwertuje tablicę plików na tablicę base64
 * @param {File[]} files - Tablica plików do konwersji
 * @returns {Promise<string[]>} Tablica base64 strings
 */
export function filesToBase64List(files) {
    return Promise.all(files.map(file => fileToBase64(file)));
}

/**
 * Konwertuje base64 string na URL obiektu
 * @param {string} base64 - Base64 string (bez lub z prefiksem)
 * @param {string} mimeType - Typ MIME (domyślnie image/jpeg)
 * @returns {string} Data URL
 */
export function base64ToDataUrl(base64, mimeType = 'image/jpeg') {
    if (base64.startsWith('data:')) {
        return base64;
    }
    return `data:${mimeType};base64,${base64}`;
}

// ==================== WALIDACJA ====================

/**
 * Sprawdza czy plik jest prawidłowym obrazem
 * @param {File} file - Plik do sprawdzenia
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateImageFile(file) {
    if (!file) {
        return { valid: false, error: 'Brak pliku' };
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, GIF, WEBP'
        };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return {
            valid: false,
            error: `Plik jest za duży. Maksymalny rozmiar to ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`
        };
    }

    return { valid: true, error: null };
}

/**
 * Waliduje tablicę plików obrazów
 * @param {File[]} files - Tablica plików do sprawdzenia
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateImageFiles(files) {
    const errors = [];

    if (!files || files.length === 0) {
        return { valid: false, errors: ['Nie wybrano plików'] };
    }

    files.forEach((file, index) => {
        const validation = validateImageFile(file);
        if (!validation.valid) {
            errors.push(`Plik ${index + 1}: ${validation.error}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

// ==================== KOMPRESJA ====================

/**
 * Kompresuje obraz do określonych wymiarów
 * @param {File} file - Plik obrazu
 * @param {number} maxWidth - Maksymalna szerokość
 * @param {number} maxHeight - Maksymalna wysokość
 * @param {number} quality - Jakość (0-1)
 * @returns {Promise<Blob>} Skompresowany obraz
 */
export function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Błąd kompresji obrazu'));
                        }
                    },
                    file.type || 'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Błąd ładowania obrazu'));
            };

            img.src = e.target.result;
        };

        reader.onerror = () => {
            reject(new Error('Błąd czytania pliku'));
        };

        reader.readAsDataURL(file);
    });
}

// ==================== GENEROWANIE MINIATUR ====================

/**
 * Generuje miniaturę obrazu
 * @param {File} file - Plik obrazu
 * @param {number} size - Rozmiar miniatury (kwadrat)
 * @returns {Promise<string>} Data URL miniatury
 */
export function generateThumbnail(file, size = 200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;

                const ctx = canvas.getContext('2d');

                const scale = Math.max(size / img.width, size / img.height);
                const x = (size - img.width * scale) / 2;
                const y = (size - img.height * scale) / 2;

                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                resolve(canvas.toDataURL(file.type || 'image/jpeg'));
            };

            img.onerror = () => {
                reject(new Error('Błąd ładowania obrazu'));
            };

            img.src = e.target.result;
        };

        reader.onerror = () => {
            reject(new Error('Błąd czytania pliku'));
        };

        reader.readAsDataURL(file);
    });
}

// ==================== FUNKCJE POMOCNICZE ====================

/**
 * Sprawdza czy string jest prawidłowym base64
 * @param {string} str - String do sprawdzenia
 * @returns {boolean} True jeśli prawidłowy base64
 */
export function isValidBase64(str) {
    if (!str || typeof str !== 'string') {
        return false;
    }

    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
}

/**
 * Pobiera rozszerzenie pliku z nazwy
 * @param {string} filename - Nazwa pliku
 * @returns {string} Rozszerzenie (lowercase)
 */
export function getFileExtension(filename) {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
}

/**
 * Formatuje rozmiar pliku
 * @param {number} bytes - Rozmiar w bajtach
 * @returns {string} Sformatowany rozmiar
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}