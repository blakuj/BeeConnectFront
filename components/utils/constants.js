// ==================== API ====================
export const API_URL = 'http://localhost:8080/api';
export const API_BASE = 'http://localhost:8080';

// ==================== KATEGORIE PRODUKTÓW ====================
export const PRODUCT_CATEGORIES = {
    HONEY: 'Miód',
    WAX: 'Wosk',
    PROPOLIS: 'Propolis',
    POLLEN: 'Pyłek',
    ROYAL_JELLY: 'Mleczko pszczele',
    BEE_BREAD: 'Pierzga',
    MEAD: 'Miód pitny',
    COSMETICS: 'Kosmetyki',
    CANDLES: 'Świece',
    OTHER: 'Inne'
};

export const CATEGORY_KEYS = Object.keys(PRODUCT_CATEGORIES);

// ==================== STATUSY ====================
export const AVAILABILITY_STATUS = {
    AVAILABLE: 'Dostępny',
    UNAVAILABLE: 'Niedostępny',
    OUT_OF_STOCK: 'Brak w magazynie'
};

export const AREA_STATUS = {
    AVAILABLE: 'Dostępny',
    UNAVAILABLE: 'Niedostępny'
};

// ==================== KWIATY (POŻYTKI) ====================
export const PREDEFINED_FLOWERS = [
    { name: "Lipa", color: "#FF0000" },
    { name: "Wielokwiat", color: "#FFA500" },
    { name: "Gryka", color: "#FFFF00" },
    { name: "Rzepak", color: "#FFFF99" },
    { name: "Spadz", color: "#800000" },
    { name: "Akacja", color: "#7878FF" },
    { name: "Wrzos", color: "#800080" },
    { name: "Malina", color: "#FF69B4" }
];

// ==================== DOMYŚLNE WARTOŚCI ====================
export const DEFAULT_AVATAR = 'assets/default-avatar.png';
export const DEFAULT_AREA_IMAGE = 'assets/default-area.jpg';
export const DEFAULT_PRODUCT_IMAGE = 'assets/default-product.jpg';

// ==================== LIMITY ====================
export const MAX_IMAGES = 10;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// ==================== PAGINACJA ====================
export const ITEMS_PER_PAGE = 12;

// ==================== MAPA ====================
export const MAP_CENTER = [52.237049, 21.017532]; // Warszawa
export const MAP_DEFAULT_ZOOM = 7;
export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// ==================== REGEX PATTERNS ====================
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^(\+?48)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/;

// ==================== ROLE ====================
export const USER_ROLES = {
    USER: 'USER',
    BEEKEEPER: 'BEEKEEPER',
    LANDOWNER: 'LANDOWNER',
    ADMIN: 'ADMIN'
};