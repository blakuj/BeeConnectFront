
    // --- Stałe ---
    const API_BASE = 'http://localhost:8080';
    const PREDEFINED_FLOWERS = [
    { name: "Lipa", color: "#FF0000" },
    { name: "Wielokwiat", color: "#FFA500" },
    { name: "Gryka", color: "#FFFF00" },
    { name: "Rzepak", color: "#FFFF99" },
    { name: "Spadz", color: "#800000" },
    { name: "Akacja", color: "#7878FF" },
    { name: "Wrzos", color: "#800080" },
    { name: "Malina", color: "#FF69B4" }
    ];

    // --- Stan zdjęć ---
    let selectedFiles = [];

    // --- Inicjalizacja formularza kwiatów ---
    const flowersContainer = document.getElementById('flowersContainer');
    PREDEFINED_FLOWERS.forEach(flower => {
    const div = document.createElement('div');
    div.innerHTML = `
            <label class="checkbox-label">
                <input type="checkbox" name="flowers" value="${flower.name}">
                <span class="color-dot" style="background-color: ${flower.color}"></span>
                ${flower.name}
            </label>
        `;
    flowersContainer.appendChild(div);
});

    // --- Inicjalizacja mapy ---
    var map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([52.237049, 21.017532], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);

    var points = [];
    var markers = [];
    var polygon = null;
    var drawing = true;

    var statusBar = document.getElementById('statusBar');
    var resetBtn = document.getElementById('resetBtn');
    var saveBtn = document.getElementById('saveBtn');
    var areaInput = document.getElementById('area');

    // --- Obsługa zdjęć ---
    document.getElementById('area-images').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
    // Unikaj duplikatów
    if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
    selectedFiles.push(file);
}
});

    updateImagePreview();
    this.value = ''; // Reset inputa
});

    function updateImagePreview() {
    const gallery = document.getElementById('preview-gallery');
    gallery.innerHTML = '';

    if (selectedFiles.length === 0) {
    gallery.innerHTML = `
                <div class="empty-preview">
                    <i class="fas fa-camera" style="font-size: 24px; margin-bottom: 5px;"></i>
                    <span style="font-size: 12px;">Brak zdjęć</span>
                </div>
            `;
    return;
}

    selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <div class="remove-btn" onclick="removeFile(${index})" title="Usuń">
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
    reader.onerror = reject;
    reader.readAsDataURL(file);
})));
}

    // --- Funkcje mapy ---
    function calculateArea(points) {
    if (points.length < 3) return 0;
    var latlngs = points.map(marker => marker.getLatLng());

    // Uproszczona kalkulacja dla płaskiej powierzchni
    var areaInSquareMeters = geodesicAreaPolyfill(latlngs);
    return areaInSquareMeters / 10000; // m2 na hektary
}

    function geodesicAreaPolyfill(latLngs) {
    var pointsCount = latLngs.length, area = 0.0;
    if (pointsCount > 2) {
    for (var i = 0; i < pointsCount; i++) {
    var p1 = latLngs[i], p2 = latLngs[(i + 1) % pointsCount];
    area += ((p2.lng - p1.lng) * Math.PI / 180) * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
}
    area = area * 6378137.0 * 6378137.0 / 2.0;
}
    return Math.abs(area);
}

    map.on('click', function(e) {
    if (!drawing) return;

    var marker = L.marker(e.latlng).addTo(map);
    points.push(marker);
    markers.push(marker);

    var pointsLeft = 4 - points.length;
    if (pointsLeft > 0) {
    statusBar.textContent = `Umieść jeszcze ${pointsLeft} ${pointsLeft === 1 ? 'punkt' : 'punkty'}`;
}

    if (polygon) map.removeLayer(polygon);
    var latlngs = points.map(marker => marker.getLatLng());

    if (points.length === 4) {
    polygon = L.polygon(latlngs, {color: '#8FC31F'}).addTo(map);
    drawing = false;
    statusBar.textContent = 'Obszar narysowany! Wypełnij formularz.';
    resetBtn.style.display = 'block';
    saveBtn.disabled = false;

    var area = calculateArea(points);
    areaInput.value = area.toFixed(2);
} else if (points.length >= 2) {
    polygon = L.polyline(latlngs, {color: '#8FC31F'}).addTo(map);
}
});

    resetBtn.addEventListener('click', function() {
    points.forEach(marker => map.removeLayer(marker));
    if (polygon) map.removeLayer(polygon);
    points = [];
    markers = [];
    polygon = null;
    drawing = true;
    statusBar.textContent = 'Kliknij na mapie, aby umieścić pierwszy punkt';
    resetBtn.style.display = 'none';
    saveBtn.disabled = true;
    areaInput.value = '';
});

    // --- WYSYŁANIE FORMULARZA ---
    document.getElementById('areaForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Zbieranie kwiatów
    const selectedFlowers = [];
    document.querySelectorAll('input[name="flowers"]:checked').forEach(cb => {
    const def = PREDEFINED_FLOWERS.find(f => f.name === cb.value);
    if(def) selectedFlowers.push(def);
});

    if(selectedFlowers.length === 0) {
    alert("Wybierz przynajmniej jeden rodzaj pożytku (kwiaty).");
    return;
}

    const submitBtn = document.getElementById('saveBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';

    try {
    // Konwersja zdjęć
    let imagesBase64List = [];
    if (selectedFiles.length > 0) {
    imagesBase64List = await filesToBase64List(selectedFiles);
}

    var newArea = {
    name: document.getElementById('areaName').value, // Dodano pole name
    flowers: selectedFlowers,
    coordinates: points.map(marker => [marker.getLatLng().lat, marker.getLatLng().lng]),
    area: parseFloat(document.getElementById('area').value),
    description: document.getElementById('description').value,
    maxHives: parseInt(document.getElementById('maxHives').value),
    pricePerDay: parseFloat(document.getElementById('pricePerDay').value),
    images: imagesBase64List // Wysyłanie listy zdjęć
};

    const response = await fetch(`${API_BASE}/api/addArea`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(newArea),
    credentials: 'include'
});

    if (response.ok) {
    alert('Obszar został dodany pomyślnie!');
    window.location.href = 'home.html';
} else {
    const text = await response.text();
    throw new Error(text || 'Błąd serwera');
}
} catch(error) {
    alert('Błąd: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Zapisz obszar';
}
});
