import { validateImageFiles, filesToBase64List, formatFileSize } from '../utils/imageUtils.js';
import { MAX_IMAGES } from '../utils/constants.js';

// ==================== IMAGE UPLOADER ====================

/**
 * Klasa ImageUploader - Komponent do uploadowania i zarządzania zdjęciami
 */
export class ImageUploader {
    constructor(options = {}) {
        const {
            container,
            inputId = 'image-upload-input',
            maxImages = MAX_IMAGES,
            acceptTypes = 'image/*',
            multiple = true,
            onChange = null,
            showPreview = true
        } = options;

        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.error('Container not found');
            return;
        }

        this.inputId = inputId;
        this.maxImages = maxImages;
        this.acceptTypes = acceptTypes;
        this.multiple = multiple;
        this.onChange = onChange;
        this.showPreview = showPreview;

        this.selectedFiles = [];
        this.existingImages = [];

        this.render();
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = 'image-uploader';

        if (this.showPreview) {
            this.renderPreview();
        }

        this.renderControls();
    }

    renderPreview() {
        const gallery = document.createElement('div');
        gallery.className = 'preview-gallery';
        gallery.id = `preview-gallery-${this.inputId}`;
        gallery.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
            min-height: 120px;
            background: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            border: 1px dashed #ddd;
        `;

        this.updatePreviewContent(gallery);
        this.container.appendChild(gallery);
        this.galleryElement = gallery;
    }

    updatePreviewContent(gallery) {
        gallery.innerHTML = '';

        const totalImages = this.existingImages.length + this.selectedFiles.length;

        if (totalImages === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-preview';
            empty.style.cssText = `
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                color: #aaa;
            `;

            empty.innerHTML = `
                <i class="fas fa-images" style="font-size: 32px; margin-bottom: 10px;"></i>
                <span style="font-size: 14px;">Brak wybranych zdjęć</span>
            `;

            gallery.appendChild(empty);
            return;
        }

        this.existingImages.forEach((image, index) => {
            const item = this.createPreviewItem(image, index, true);
            gallery.appendChild(item);
        });

        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = this.createPreviewItem(e.target.result, index, false);
                gallery.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }

    createPreviewItem(src, index, isExisting) {
        const item = document.createElement('div');
        item.className = `preview-item ${isExisting ? 'existing' : ''}`;
        item.style.cssText = `
            position: relative;
            width: 100px;
            height: 100px;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            background: white;
            ${isExisting ? 'border: 2px solid #F2A900;' : ''}
        `;

        const img = document.createElement('img');
        img.src = typeof src === 'string' && !src.startsWith('data:')
            ? `data:image/jpeg;base64,${src}`
            : src;
        img.alt = 'Preview';
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;

        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Usuń';
        removeBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
            color: #e74c3c;
            transition: all 0.2s;
            z-index: 10;
        `;

        removeBtn.addEventListener('mouseenter', () => {
            removeBtn.style.background = '#e74c3c';
            removeBtn.style.color = 'white';
        });

        removeBtn.addEventListener('mouseleave', () => {
            removeBtn.style.background = 'rgba(255, 255, 255, 0.9)';
            removeBtn.style.color = '#e74c3c';
        });

        removeBtn.addEventListener('click', () => {
            if (isExisting) {
                this.removeExistingImage(index);
            } else {
                this.removeFile(index);
            }
        });

        item.appendChild(img);
        item.appendChild(removeBtn);

        return item;
    }

    renderControls() {
        const controls = document.createElement('div');
        controls.className = 'image-upload-controls';
        controls.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        const label = document.createElement('label');
        label.htmlFor = this.inputId;
        label.className = 'btn btn-outline image-upload-btn';
        label.innerHTML = '<i class="fas fa-upload"></i> Wybierz zdjęcia';
        label.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            border: 2px dashed #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            text-align: center;
        `;

        label.addEventListener('mouseenter', () => {
            label.style.borderColor = '#F2A900';
            label.style.background = '#fff8e6';
        });

        label.addEventListener('mouseleave', () => {
            label.style.borderColor = '#ddd';
            label.style.background = 'white';
        });

        const input = document.createElement('input');
        input.type = 'file';
        input.id = this.inputId;
        input.accept = this.acceptTypes;
        input.multiple = this.multiple;
        input.style.display = 'none';

        input.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
            e.target.value = ''; // Reset aby można było wybrać te same pliki ponownie
        });

        const info = document.createElement('small');
        info.className = 'upload-info';
        info.style.cssText = `
            display: block;
            color: #999;
            font-size: 12px;
            text-align: center;
        `;

        const currentCount = this.selectedFiles.length + this.existingImages.length;
        info.textContent = `Wybrano: ${currentCount}/${this.maxImages} zdjęć. Format: JPG, PNG, GIF, WEBP`;

        controls.appendChild(input);
        controls.appendChild(label);
        controls.appendChild(info);

        this.container.appendChild(controls);
        this.inputElement = input;
        this.infoElement = info;
    }

    handleFileSelect(files) {
        const filesArray = Array.from(files);
        const currentTotal = this.selectedFiles.length + this.existingImages.length;
        const availableSlots = this.maxImages - currentTotal;

        if (availableSlots <= 0) {
            alert(`Maksymalna liczba zdjęć to ${this.maxImages}`);
            return;
        }

        const filesToAdd = filesArray.slice(0, availableSlots);

        const validation = validateImageFiles(filesToAdd);
        if (!validation.valid) {
            alert(`Błędy walidacji:\n${validation.errors.join('\n')}`);
            return;
        }

        filesToAdd.forEach(file => {
            const exists = this.selectedFiles.some(
                f => f.name === file.name && f.size === file.size
            );
            if (!exists) {
                this.selectedFiles.push(file);
            }
        });

        this.update();

        if (filesArray.length > availableSlots) {
            alert(`Dodano tylko ${availableSlots} plików. Limit to ${this.maxImages} zdjęć.`);
        }
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.update();
    }

    removeExistingImage(index) {
        this.existingImages.splice(index, 1);
        this.update();
    }

    update() {
        if (this.galleryElement) {
            this.updatePreviewContent(this.galleryElement);
        }

        if (this.infoElement) {
            const currentCount = this.selectedFiles.length + this.existingImages.length;
            this.infoElement.textContent = `Wybrano: ${currentCount}/${this.maxImages} zdjęć. Format: JPG, PNG, GIF, WEBP`;
        }

        if (this.onChange) {
            this.onChange({
                files: this.selectedFiles,
                existingImages: this.existingImages,
                totalCount: this.selectedFiles.length + this.existingImages.length
            });
        }
    }

    async getBase64Files() {
        return await filesToBase64List(this.selectedFiles);
    }

    getAllImages() {
        return [...this.existingImages];
    }

    async getAllImagesBase64() {
        const newImagesBase64 = await this.getBase64Files();
        return [...this.existingImages, ...newImagesBase64];
    }

    setExistingImages(images) {
        this.existingImages = Array.isArray(images) ? [...images] : [];
        this.update();
    }

    clearNewFiles() {
        this.selectedFiles = [];
        this.update();
    }

    clearAll() {
        this.selectedFiles = [];
        this.existingImages = [];
        this.update();
    }

    getFileCount() {
        return this.selectedFiles.length;
    }

    getTotalCount() {
        return this.selectedFiles.length + this.existingImages.length;
    }
}