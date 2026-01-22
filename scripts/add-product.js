// scripts/add-product.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Skrypt add-product.js załadowany poprawnie.');

    const API_URL = 'http://localhost:8080/api';

    // Zmienne
    let selectedFiles = [];

    // Elementy DOM
    const productImagesInput = document.getElementById('product-images');
    const addProductForm = document.getElementById('add-product-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const productTypeSelect = document.getElementById('product-type');
    const flowersField = document.getElementById('flowers-field');

    // --- Funkcje walidacji ---
    function showError(inputId, message) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.classList.add('input-error');

        let errorSpan = input.parentNode.querySelector('.error-message');
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'error-message';
            input.parentNode.appendChild(errorSpan);
        }
        errorSpan.textContent = message;
    }

    function clearErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const inputs = form.querySelectorAll('.input-error');
        inputs.forEach(input => input.classList.remove('input-error'));

        const messages = form.querySelectorAll('.error-message');
        messages.forEach(msg => msg.remove());
    }


    async function loadUserProfile() {
        try {
            const response = await fetch(`${API_URL}/auth/user`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const user = await response.json();
                if(document.getElementById('user-name'))
                    document.getElementById('user-name').textContent = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Użytkownik';
                if(document.getElementById('welcome-name'))
                    document.getElementById('welcome-name').textContent = user.firstname || 'Użytkowniku';
                if(document.getElementById('user-email'))
                    document.getElementById('user-email').textContent = user.email || 'nieznany@email.com';
                if(document.getElementById('user-status'))
                    document.getElementById('user-status').textContent = user.role === 'BEEKEEPER' ? 'Zweryfikowany Pszczelarz' : 'Użytkownik';
            } else if (response.status === 401) {
                alert('Sesja wygasła. Zaloguj się ponownie.');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Błąd podczas ładowania profilu:', error);
        }
    }

    // --- Obsługa zdjęć ---
    if (productImagesInput) {
        productImagesInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
                if (!exists) {
                    selectedFiles.push(file);
                }
            });
            updateImagePreview();
            this.value = ''; // Reset inputa
        });
    }

    function updateImagePreview() {
        const gallery = document.getElementById('preview-gallery');
        const countLabel = document.getElementById('file-count');
        if(!gallery) return;

        gallery.innerHTML = '';

        if (selectedFiles.length === 0) {
            gallery.innerHTML = `
                <div class="empty-preview">
                    <i class="fas fa-images" style="font-size: 32px; margin-bottom: 10px;"></i>
                    <span>Brak wybranych zdjęć</span>
                </div>
            `;
            if(countLabel) countLabel.textContent = 'Nie wybrano plików';
            return;
        }

        if(countLabel) countLabel.textContent = `Wybrano plików: ${selectedFiles.length}`;

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <div class="remove-btn" onclick="removeFile(${index})" title="Usuń zdjęcie">
                        <i class="fas fa-times"></i>
                    </div>
                `;
                gallery.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }


    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        updateImagePreview();
    };

    function filesToBase64List(files) {
        return Promise.all(files.map(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        })));
    }

    // --- Obsługa formularza ---
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearErrors('add-product-form');

            const nameInput = document.getElementById('product-name');
            const categoryInput = document.getElementById('product-type');
            const stockInput = document.getElementById('product-quantity');
            const priceInput = document.getElementById('product-price');
            const descInput = document.getElementById('product-description');

            const name = nameInput ? nameInput.value.trim() : '';
            const description = descInput ? descInput.value.trim() : '';
            const price = priceInput ? parseFloat(priceInput.value) : NaN;
            const stock = stockInput ? parseInt(stockInput.value) : NaN;
            const category = categoryInput ? categoryInput.value : '';

            let isValid = true;

            // 1. Nazwa: @NotBlank, @Size(3-100)
            if (!name) {
                showError('product-name', 'Nazwa produktu jest wymagana');
                isValid = false;
            } else if (name.length < 3 || name.length > 100) {
                showError('product-name', 'Nazwa produktu musi mieć od 3 do 100 znaków');
                isValid = false;
            }

            // 2. Kategoria: @NotNull
            if (!category) {
                showError('product-type', 'Kategoria jest wymagana');
                isValid = false;
            }

            // 3. Cena: @Positive, @Max(1000000)
            if (isNaN(price) || priceInput.value === '') {
                showError('product-price', 'Cena jest wymagana');
                isValid = false;
            } else if (price <= 0) {
                showError('product-price', 'Cena musi być większa od 0');
                isValid = false;
            } else if (price > 1000000) {
                showError('product-price', 'Cena przekracza limit (1 000 000)');
                isValid = false;
            }

            // 4. Ilość (Stock): @Min(0), @Max(10000)
            if (isNaN(stock) || stockInput.value === '') {
                showError('product-quantity', 'Ilość magazynowa jest wymagana');
                isValid = false;
            } else if (stock < 0) {
                showError('product-quantity', 'Ilość nie może być ujemna');
                isValid = false;
            } else if (stock > 10000) {
                showError('product-quantity', 'Maksymalna ilość to 10 000');
                isValid = false;
            }

            // 5. Opis: @Size(10-2000)
            if (!description) {
                showError('product-description', 'Opis produktu jest wymagany');
                isValid = false;
            } else if (description.length < 10) {
                showError('product-description', 'Opis musi mieć co najmniej 10 znaków');
                isValid = false;
            } else if (description.length > 2000) {
                showError('product-description', 'Opis nie może przekraczać 2000 znaków');
                isValid = false;
            }

            if (!isValid) return;

            const submitBtn = document.getElementById('save-product-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';

            try {
                let imagesBase64List = [];
                if (selectedFiles.length > 0) {
                    imagesBase64List = await filesToBase64List(selectedFiles);
                }

                const productData = {
                    name: name,
                    category: category,
                    stock: stock,
                    price: price,
                    description: description,
                    images: imagesBase64List
                };

                if (productData.category === 'HONEY') {
                    const flowersVal = document.getElementById('product-flowers') ? document.getElementById('product-flowers').value.trim() : '';
                    if (flowersVal) {
                        productData.description = `Pochodzenie kwiatowe: ${flowersVal}\n\n${productData.description}`;
                    }
                }

                const response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(productData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Błąd podczas dodawania produktu');
                }

                alert('✓ Produkt został pomyślnie dodany!');
                window.location.href = 'profile.html?tab=products';

            } catch (error) {
                console.error('Błąd:', error);
                alert(`Nie udało się dodać produktu:\n${error.message}`);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('Czy na pewno chcesz anulować dodawanie produktu? Wprowadzone dane zostaną utracone.')) {
                window.location.href = 'profile.html?tab=products';
            }
        });
    }

    if (productTypeSelect && flowersField) {
        flowersField.style.display = 'none';

        productTypeSelect.addEventListener('change', function() {
            if (this.value === 'HONEY') {
                flowersField.style.display = 'block';
            } else {
                flowersField.style.display = 'none';
            }
        });
    }

    loadUserProfile();
});