// ==================== MODAL SYSTEM ====================

/**
 * Klasa Modal - Uniwersalny modal
 */
export class Modal {
    constructor(options = {}) {
        const {
            title = '',
            content = '',
            size = 'medium',
            closeOnOverlay = true,
            closeOnEscape = true,
            showCloseButton = true,
            footer = null,
            onOpen = null,
            onClose = null
        } = options;

        this.options = {
            title,
            content,
            size,
            closeOnOverlay,
            closeOnEscape,
            showCloseButton,
            footer,
            onOpen,
            onClose
        };

        this.isOpen = false;
        this.overlay = null;
        this.modal = null;

        this.create();
    }

    create() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        const sizeMap = {
            small: '400px',
            medium: '600px',
            large: '800px',
            xlarge: '1000px'
        };

        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.style.cssText = `
            background: white;
            border-radius: 8px;
            max-width: ${sizeMap[this.options.size] || sizeMap.medium};
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;

        const header = document.createElement('div');
        header.className = 'modal-header';
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const titleElement = document.createElement('h3');
        titleElement.className = 'modal-title';
        titleElement.textContent = this.options.title;
        titleElement.style.cssText = `
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        `;

        header.appendChild(titleElement);

        if (this.options.showCloseButton) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s;
            `;

            closeBtn.addEventListener('mouseover', () => {
                closeBtn.style.color = '#333';
            });

            closeBtn.addEventListener('mouseout', () => {
                closeBtn.style.color = '#666';
            });

            closeBtn.addEventListener('click', () => this.close());
            header.appendChild(closeBtn);
        }

        const body = document.createElement('div');
        body.className = 'modal-body';
        body.style.cssText = `
            padding: 20px;
        `;

        if (typeof this.options.content === 'string') {
            body.innerHTML = this.options.content;
        } else if (this.options.content instanceof HTMLElement) {
            body.appendChild(this.options.content);
        }

        this.modal.appendChild(header);
        this.modal.appendChild(body);

        if (this.options.footer) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';
            footer.style.cssText = `
                padding: 20px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            `;

            if (typeof this.options.footer === 'string') {
                footer.innerHTML = this.options.footer;
            } else if (this.options.footer instanceof HTMLElement) {
                footer.appendChild(this.options.footer);
            } else if (Array.isArray(this.options.footer)) {
                this.options.footer.forEach(btn => footer.appendChild(btn));
            }

            this.modal.appendChild(footer);
        }

        this.overlay.appendChild(this.modal);

        if (this.options.closeOnOverlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        if (this.options.closeOnEscape) {
            this.handleEscape = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            };
        }
    }

    open() {
        if (this.isOpen) return;

        document.body.appendChild(this.overlay);
        this.overlay.style.display = 'flex';
        this.isOpen = true;

        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', this.handleEscape);
        }

        if (this.options.onOpen) {
            this.options.onOpen(this);
        }
    }

    close() {
        if (!this.isOpen) return;

        this.overlay.style.display = 'none';

        if (this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        this.isOpen = false;

        if (this.options.closeOnEscape) {
            document.removeEventListener('keydown', this.handleEscape);
        }

        if (this.options.onClose) {
            this.options.onClose(this);
        }
    }

    setTitle(title) {
        const titleElement = this.modal.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    setContent(content) {
        const body = this.modal.querySelector('.modal-body');
        if (!body) return;

        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.innerHTML = '';
            body.appendChild(content);
        }
    }

    setFooter(footer) {
        let footerElement = this.modal.querySelector('.modal-footer');

        if (!footerElement) {
            footerElement = document.createElement('div');
            footerElement.className = 'modal-footer';
            footerElement.style.cssText = `
                padding: 20px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            `;
            this.modal.appendChild(footerElement);
        }

        footerElement.innerHTML = '';

        if (typeof footer === 'string') {
            footerElement.innerHTML = footer;
        } else if (footer instanceof HTMLElement) {
            footerElement.appendChild(footer);
        } else if (Array.isArray(footer)) {
            footer.forEach(btn => footerElement.appendChild(btn));
        }
    }

    destroy() {
        this.close();
        this.overlay = null;
        this.modal = null;
    }
}

// ==================== GOTOWE SZABLONY MODALI ====================

/**
 * Modal potwierdzenia
 * @param {Object} options - Opcje
 * @returns {Promise<boolean>} True jeśli potwierdzono, False jeśli anulowano
 */
export function confirmModal(options = {}) {
    const {
        title = 'Potwierdź akcję',
        message = 'Czy na pewno chcesz kontynuować?',
        confirmText = 'Potwierdź',
        cancelText = 'Anuluj',
        danger = false
    } = options;

    return new Promise((resolve) => {
        const content = document.createElement('p');
        content.textContent = message;
        content.style.margin = '0';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.className = 'btn btn-outline';
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            border: 1px solid #ccc;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = confirmText;
        confirmBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
        confirmBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            background: ${danger ? '#e74c3c' : '#F2A900'};
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        `;

        const modal = new Modal({
            title,
            content,
            size: 'small',
            footer: [cancelBtn, confirmBtn],
            closeOnOverlay: true,
            onClose: () => {
                resolve(false);
                modal.destroy();
            }
        });

        cancelBtn.addEventListener('click', () => {
            modal.close();
        });

        confirmBtn.addEventListener('click', () => {
            resolve(true);
            modal.close();
        });

        modal.open();
    });
}

/**
 * Modal alertu
 * @param {Object} options - Opcje
 * @returns {Promise<void>}
 */
export function alertModal(options = {}) {
    const {
        title = 'Informacja',
        message = '',
        type = 'info',
        okText = 'OK'
    } = options;

    return new Promise((resolve) => {
        const content = document.createElement('div');

        const iconMap = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };

        const colorMap = {
            info: '#3498db',
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c'
        };

        const icon = document.createElement('i');
        icon.className = `fas ${iconMap[type] || iconMap.info}`;
        icon.style.cssText = `
            font-size: 48px;
            color: ${colorMap[type] || colorMap.info};
            display: block;
            text-align: center;
            margin-bottom: 20px;
        `;

        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.style.cssText = `
            margin: 0;
            text-align: center;
        `;

        content.appendChild(icon);
        content.appendChild(messageElement);

        const okBtn = document.createElement('button');
        okBtn.textContent = okText;
        okBtn.className = 'btn btn-primary';
        okBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            background: #F2A900;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        `;

        const modal = new Modal({
            title,
            content,
            size: 'small',
            footer: [okBtn],
            closeOnOverlay: true,
            onClose: () => {
                resolve();
                modal.destroy();
            }
        });

        okBtn.addEventListener('click', () => {
            modal.close();
        });

        modal.open();
    });
}

/**
 * Modal z formularzem (prompt)
 * @param {Object} options - Opcje
 * @returns {Promise<string|null>} Wartość z inputa lub null jeśli anulowano
 */
export function promptModal(options = {}) {
    const {
        title = 'Wprowadź wartość',
        message = '',
        defaultValue = '',
        placeholder = '',
        confirmText = 'OK',
        cancelText = 'Anuluj'
    } = options;

    return new Promise((resolve) => {
        const content = document.createElement('div');

        if (message) {
            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            messageElement.style.marginBottom = '15px';
            content.appendChild(messageElement);
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue;
        input.placeholder = placeholder;
        input.style.cssText = `
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        `;
        content.appendChild(input);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.className = 'btn btn-outline';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = confirmText;
        confirmBtn.className = 'btn btn-primary';

        const modal = new Modal({
            title,
            content,
            size: 'small',
            footer: [cancelBtn, confirmBtn],
            closeOnOverlay: true,
            onOpen: () => {
                input.focus();
            },
            onClose: () => {
                resolve(null);
                modal.destroy();
            }
        });

        cancelBtn.addEventListener('click', () => {
            modal.close();
        });

        confirmBtn.addEventListener('click', () => {
            resolve(input.value);
            modal.close();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                resolve(input.value);
                modal.close();
            }
        });

        modal.open();
    });
}