
    const API_URL = 'http://localhost:8080/api';

    // Tablica przechowująca wybrane pliki (Files)
    let selectedFiles = [];

    // Load user profile
    async function loadUserProfile() {
    try {
    const response = await fetch(`${API_URL}/auth/user`, {
    method: 'GET',
    credentials: 'include'
});

    if (response.ok) {
    const user = await response.json();
    document.getElementById('user-name').textContent = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Użytkownik';
    document.getElementById('welcome-name').textContent = user.firstname || 'Użytkowniku';
    document.getElementById('user-email').textContent = user.email || 'nieznany@email.com';
    document.getElementById('user-status').textContent = user.role === 'BEEKEEPER' ? 'Zweryfikowany Pszczelarz' : 'Użytkownik';
} else if (response.status === 401) {
    alert('Sesja wygasła. Zaloguj się ponownie.');
    window.location.href = 'login.html';
}
} catch (error) {
    console.error('Błąd podczas ładowania profilu:', error);
}
}

    // Obsługa wyboru plików
    document.getElementById('product-images').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);

    // Dodaj nowe pliki do istniejącej tablicy
    files.forEach(file => {
    // Sprawdź czy plik już nie istnieje (po nazwie i rozmiarze)
    const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
    if (!exists) {
    selectedFiles.push(file);
}
});

    updateImagePreview();

    // Reset input value to allow selecting same files again if needed
    this.value = '';
});

    function updateImagePreview() {
    const gallery = document.getElementById('preview-gallery');
    const countLabel = document.getElementById('file-count');

    gallery.innerHTML = '';

    if (selectedFiles.length === 0) {
    gallery.innerHTML = `
                <div class="empty-preview">
                    <i class="fas fa-images" style="font-size: 32px; margin-bottom: 10px;"></i>
                    <span>Brak wybranych zdjęć</span>
                </div>
            `;
    countLabel.textContent = 'Nie wybrano plików';
    return;
}

    countLabel.textContent = `Wybrano plików: ${selectedFiles.length}`;

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

    // Funkcja globalna, aby była dostępna z onclick w HTML
    window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    updateImagePreview();
};

    // Helper: Konwersja wielu plików na Base64
    function filesToBase64List(files) {
    return Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
    // Usuwamy prefix "data:image/jpeg;base64," aby wysłać czysty string,
    // tak jak backend tego oczekuje w CreateProductDTO -> List<String> images
    const base64String = reader.result.split(',')[1];
    resolve(base64String);
};
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
})));
}

    // Obsługa formularza
    document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('save-product-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';

    try {
    // Konwersja wszystkich wybranych zdjęć
    let imagesBase64List = [];
    if (selectedFiles.length > 0) {
    imagesBase64List = await filesToBase64List(selectedFiles);
}

    const productData = {
    name: document.getElementById('product-name').value,
    category: document.getElementById('product-type').value,
    stock: parseInt(document.getElementById('product-quantity').value),
    price: parseFloat(document.getElementById('product-price').value),
    description: document.getElementById('product-description').value,
    images: imagesBase64List // Wysyłamy listę
};

    // Dodaj flowerOrigin tylko dla miodu (opcjonalnie, jeśli backend to obsługuje w opisie)
    if (productData.category === 'HONEY') {
    const flowers = document.getElementById('product-flowers').value;
    if (flowers) {
    // Jeśli w DTO nie ma pola flowerOrigin, dodajemy do opisu
    productData.description = `Pochodzenie kwiatowe: ${flowers}\n\n${productData.description}`;
}
}

    console.log('Wysyłanie danych produktu:', productData);

    const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json'
},
    credentials: 'include',
    body: JSON.stringify(productData)
});

    if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Błąd podczas dodawania produktu');
}

    const result = await response.json();
    console.log('Produkt dodany:', result);

    alert('✓ Produkt został pomyślnie dodany!');
    window.location.href = 'profile.html?tab=products';

} catch (error) {
    console.error('Błąd podczas dodawania produktu:', error);
    alert(`Nie udało się dodać produktu:\n${error.message}`);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Zapisz produkt';
}
});

    // Obsługa przycisku anuluj
    document.getElementById('cancel-btn').addEventListener('click', function() {
    if (confirm('Czy na pewno chcesz anulować dodawanie produktu? Wprowadzone dane zostaną utracone.')) {
    window.location.href = 'profile.html?tab=products';
}
});

    // Aktualizacja typu produktu w zależności od wyboru
    document.getElementById('product-type').addEventListener('change', function() {
    const flowersField = document.getElementById('flowers-field');

    // Pokaż/ukryj pole z kwiatami w zależności od typu produktu
    if (this.value === 'HONEY') {
    flowersField.style.display = 'block';
} else {
    flowersField.style.display = 'none';
}
});

    // Inicjalizacja - ukryj pole kwiatów na początku
    document.getElementById('flowers-field').style.display = 'none';

    // Load user profile on page load
    window.addEventListener('DOMContentLoaded', loadUserProfile);
