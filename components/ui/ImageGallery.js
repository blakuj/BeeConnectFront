import { base64ToDataUrl } from '../utils/imageUtils.js';

// ==================== IMAGE GALLERY ====================

/**
 * Klasa ImageGallery - Galeria zdjęć z nawigacją
 */
export class ImageGallery {
    constructor(options = {}) {
        const {
            container,
            images = [],
            showThumbnails = true,
            showNavigation = true,
            autoPlay = false,
            autoPlayInterval = 3000,
            onImageChange = null
        } = options;

        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.error('Gallery container not found');
            return;
        }

        this.images = images;
        this.currentIndex = 0;
        this.showThumbnails = showThumbnails;
        this.showNavigation = showNavigation;
        this.autoPlay = autoPlay;
        this.autoPlayInterval = autoPlayInterval;
        this.onImageChange = onImageChange;
        this.autoPlayTimer = null;

        this.render();

        if (this.autoPlay && this.images.length > 1) {
            this.startAutoPlay();
        }
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = 'image-gallery';
        this.container.style.cssText = `
            position: relative;
            width: 100%;
            background: #f5f5f5;
        `;

        if (this.images.length === 0) {
            this.renderEmpty();
            return;
        }

        this.renderMainImage();

        if (this.showNavigation && this.images.length > 1) {
            this.renderNavigation();
        }

        if (this.showThumbnails && this.images.length > 1) {
            this.renderThumbnails();
        }
    }

    renderEmpty() {
        const empty = document.createElement('div');
        empty.className = 'gallery-empty';
        empty.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #ccc;
        `;

        empty.innerHTML = `
            <i class="fas fa-images" style="font-size: 64px; margin-bottom: 15px;"></i>
            <p style="margin: 0; font-size: 16px;">Brak zdjęć</p>
        `;

        this.container.appendChild(empty);
    }

    renderMainImage() {
        const mainContainer = document.createElement('div');
        mainContainer.className = 'gallery-main';
        mainContainer.style.cssText = `
            position: relative;
            width: 100%;
            aspect-ratio: 1;
            overflow: hidden;
            background: #f5f5f5;
        `;

        const img = document.createElement('img');
        img.className = 'gallery-main-image';
        img.src = this.getImageUrl(this.images[this.currentIndex]);
        img.alt = `Image ${this.currentIndex + 1}`;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: opacity 0.3s;
        `;

        mainContainer.appendChild(img);

        const counter = document.createElement('div');
        counter.className = 'gallery-counter';
        counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        counter.style.cssText = `
            position: absolute;
            bottom: 15px;
            right: 15px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        `;

        mainContainer.appendChild(counter);

        this.container.appendChild(mainContainer);
        this.mainImage = img;
        this.counterElement = counter;
    }

    renderNavigation() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'gallery-nav gallery-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 15px;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.9);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.2s;
            z-index: 10;
        `;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'gallery-nav gallery-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.style.cssText = prevBtn.style.cssText;
        nextBtn.style.left = 'auto';
        nextBtn.style.right = '15px';

        prevBtn.addEventListener('click', () => this.prev());
        nextBtn.addEventListener('click', () => this.next());

        prevBtn.addEventListener('mouseenter', () => {
            prevBtn.style.transform = 'translateY(-50%) scale(1.1)';
        });

        prevBtn.addEventListener('mouseleave', () => {
            prevBtn.style.transform = 'translateY(-50%) scale(1)';
        });

        nextBtn.addEventListener('mouseenter', () => {
            nextBtn.style.transform = 'translateY(-50%) scale(1.1)';
        });

        nextBtn.addEventListener('mouseleave', () => {
            nextBtn.style.transform = 'translateY(-50%) scale(1)';
        });

        const mainContainer = this.container.querySelector('.gallery-main');
        mainContainer.appendChild(prevBtn);
        mainContainer.appendChild(nextBtn);
    }

    renderThumbnails() {
        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'gallery-thumbnails';
        thumbContainer.style.cssText = `
            display: flex;
            gap: 10px;
            padding: 15px;
            overflow-x: auto;
            background: white;
        `;

        this.images.forEach((image, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'gallery-thumbnail' + (index === this.currentIndex ? ' active' : '');
            thumb.style.cssText = `
                width: 80px;
                height: 80px;
                border: 3px solid ${index === this.currentIndex ? '#F2A900' : 'transparent'};
                border-radius: 4px;
                overflow: hidden;
                cursor: pointer;
                flex-shrink: 0;
                transition: all 0.2s;
                opacity: ${index === this.currentIndex ? '1' : '0.6'};
            `;

            const img = document.createElement('img');
            img.src = this.getImageUrl(image);
            img.alt = `Thumbnail ${index + 1}`;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;

            thumb.appendChild(img);

            thumb.addEventListener('click', () => {
                this.goTo(index);
            });

            thumb.addEventListener('mouseenter', () => {
                if (index !== this.currentIndex) {
                    thumb.style.opacity = '1';
                }
            });

            thumb.addEventListener('mouseleave', () => {
                if (index !== this.currentIndex) {
                    thumb.style.opacity = '0.6';
                }
            });

            thumbContainer.appendChild(thumb);
        });

        this.container.appendChild(thumbContainer);
        this.thumbnailContainer = thumbContainer;
    }

    getImageUrl(image) {
        if (!image) return '';

        if (typeof image === 'string') {
            if (image.startsWith('http') || image.startsWith('/') || image.startsWith('data:')) {
                return image;
            }
            return base64ToDataUrl(image);
        }

        if (image.url) return image.url;
        if (image.src) return image.src;
        if (image.fileContent) return base64ToDataUrl(image.fileContent);

        return '';
    }

    updateImage() {
        if (!this.mainImage) return;

        this.mainImage.style.opacity = '0';

        setTimeout(() => {
            this.mainImage.src = this.getImageUrl(this.images[this.currentIndex]);
            this.mainImage.style.opacity = '1';

            if (this.counterElement) {
                this.counterElement.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
            }

            if (this.thumbnailContainer) {
                const thumbnails = this.thumbnailContainer.querySelectorAll('.gallery-thumbnail');
                thumbnails.forEach((thumb, index) => {
                    if (index === this.currentIndex) {
                        thumb.classList.add('active');
                        thumb.style.borderColor = '#F2A900';
                        thumb.style.opacity = '1';
                    } else {
                        thumb.classList.remove('active');
                        thumb.style.borderColor = 'transparent';
                        thumb.style.opacity = '0.6';
                    }
                });
            }

            if (this.onImageChange) {
                this.onImageChange(this.currentIndex, this.images[this.currentIndex]);
            }
        }, 150);
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateImage();

        if (this.autoPlay) {
            this.resetAutoPlay();
        }
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateImage();

        if (this.autoPlay) {
            this.resetAutoPlay();
        }
    }

    goTo(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentIndex = index;
        this.updateImage();

        if (this.autoPlay) {
            this.resetAutoPlay();
        }
    }

    startAutoPlay() {
        if (this.autoPlayTimer) return;

        this.autoPlayTimer = setInterval(() => {
            this.next();
        }, this.autoPlayInterval);
    }

    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }

    resetAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    setImages(images) {
        this.images = images;
        this.currentIndex = 0;
        this.render();

        if (this.autoPlay && this.images.length > 1) {
            this.startAutoPlay();
        }
    }

    destroy() {
        this.stopAutoPlay();
        this.container.innerHTML = '';
    }
}

// ==================== PROSTY LIGHTBOX ====================

/**
 * Otwiera obrazek w lightbox (pełnoekranowy podgląd)
 * @param {string|Array} images - Pojedynczy obraz lub tablica obrazów
 * @param {number} startIndex - Początkowy indeks (jeśli tablica)
 */
export function openLightbox(images, startIndex = 0) {
    const imageArray = Array.isArray(images) ? images : [images];

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 40px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    `;

    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });

    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    const galleryContainer = document.createElement('div');
    galleryContainer.style.cssText = `
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
    `;

    overlay.appendChild(closeBtn);
    overlay.appendChild(galleryContainer);
    document.body.appendChild(overlay);

    const gallery = new ImageGallery({
        container: galleryContainer,
        images: imageArray,
        showThumbnails: imageArray.length > 1,
        showNavigation: imageArray.length > 1
    });

    if (startIndex > 0) {
        gallery.goTo(startIndex);
    }

    const close = () => {
        gallery.destroy();
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            close();
        }
    });

    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', handleEscape);
        }
    });
}