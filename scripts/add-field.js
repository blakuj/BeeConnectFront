// scripts/add-field.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Skrypt add-field.js załadowany poprawnie.');

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

    let selectedFiles = [];

    // Zmienne mapy
    let points = [];
    let markers = [];
    let polygon = null;
    let drawing = true;

    // Elementy DOM
    const flowersContainer = document.getElementById('flowersContainer');
    const statusBar = document.getElementById('statusBar');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const areaInput = document.getElementById('area');
    const areaForm = document.getElementById('areaForm');
    const imageInput = document.getElementById('area-images');

    // --- Funkcje pomocnicze walidacji ---
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

    // --- Inicjalizacja formularza kwiatów ---
    if (flowersContainer) {
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
    }

    // --- Inicjalizacja mapy ---
    let map = null;
    if (document.getElementById('map')) {
        map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([52.237049, 21.017532], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);

        map.on('click', function(e) {
            if (!drawing) return;

            var marker = L.marker(e.latlng).addTo(map);
            points.push(marker);
            markers.push(marker);

            var pointsLeft = 4 - points.length;
            if (pointsLeft > 0 && statusBar) {
                statusBar.textContent = `Umieść jeszcze ${pointsLeft} ${pointsLeft === 1 ? 'punkt' : 'punkty'}`;
            }

            if (polygon) map.removeLayer(polygon);
            var latlngs = points.map(marker => marker.getLatLng());

            if (points.length === 4) {
                polygon = L.polygon(latlngs, {color: '#8FC31F'}).addTo(map);
                drawing = false;
                if(statusBar) statusBar.textContent = 'Obszar narysowany! Wypełnij formularz.';
                if(resetBtn) resetBtn.style.display = 'block';
                if(saveBtn) saveBtn.disabled = false;

                var areaVal = calculateArea(points);
                if(areaInput) areaInput.value = areaVal.toFixed(2);
            } else if (points.length >= 2) {
                polygon = L.polyline(latlngs, {color: '#8FC31F'}).addTo(map);
            }
        });
    }

    function calculateArea(points) {
        if (points.length < 3) return 0;
        var latlngs = points.map(marker => marker.getLatLng());
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

    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if(map) {
                points.forEach(marker => map.removeLayer(marker));
                if (polygon) map.removeLayer(polygon);
            }
            points = [];
            markers = [];
            polygon = null;
            drawing = true;
            if(statusBar) statusBar.textContent = 'Kliknij na mapie, aby umieścić pierwszy punkt';
            this.style.display = 'none';
            if(saveBtn) saveBtn.disabled = true;
            if(areaInput) areaInput.value = '';
        });
    }

    // --- Obsługa zdjęć ---
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    selectedFiles.push(file);
                }
            });
            updateImagePreview();
            this.value = '';
        });
    }

    function updateImagePreview() {
        const gallery = document.getElementById('preview-gallery');
        if(!gallery) return;

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

    // --- WYSYŁANIE FORMULARZA ---
    if (areaForm) {
        areaForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Walidacja start...');

            clearErrors('areaForm');

            // Pobieranie pól
            const nameInput = document.getElementById('areaName');
            const descInput = document.getElementById('description');
            const maxHivesInput = document.getElementById('maxHives');
            const priceInput = document.getElementById('pricePerDay');

            // Wartości
            const name = nameInput ? nameInput.value.trim() : '';
            const description = descInput ? descInput.value.trim() : '';
            const maxHives = maxHivesInput ? parseInt(maxHivesInput.value) : 0;
            const pricePerDay = priceInput ? parseFloat(priceInput.value) : 0;

            console.log('Weryfikacja nazwy:', name, 'Długość:', name.length);

            let isValid = true;

            // 1. Nazwa: @NotBlank, @Size(min=3, max=100)
            if (!name) {
                showError('areaName', 'Nazwa obszaru jest wymagana');
                isValid = false;
            } else if (name.length < 3 || name.length > 100) {
                showError('areaName', 'Nazwa obszaru musi mieć od 3 do 100 znaków');
                isValid = false;
            }

            // 2. Opis: @Size(max=3000)
            if (description.length > 3000) {
                showError('description', 'Opis obszaru nie może przekraczać 3000 znaków');
                isValid = false;
            }

            // 3. Max Uli: @Min(1), @Max(500)
            if (!maxHivesInput || isNaN(maxHives) || maxHives < 1) {
                showError('maxHives', 'Maksymalna liczba uli musi wynosić co najmniej 1');
                isValid = false;
            } else if (maxHives > 500) {
                showError('maxHives', 'Maksymalna liczba uli na obszarze to 500');
                isValid = false;
            }

            // 4. Cena: @PositiveOrZero, @Max(100000)
            if (!priceInput || isNaN(pricePerDay) || pricePerDay < 0) {
                showError('pricePerDay', 'Cena za dzień nie może być ujemna');
                isValid = false;
            } else if (pricePerDay > 100000) {
                showError('pricePerDay', 'Cena za dzień jest zbyt wysoka');
                isValid = false;
            }

            // 5. Mapa (punkty)
            if (points.length < 4) {
                alert("Obszar musi składać się z co najmniej 4 punktów. Dokończ rysowanie na mapie.");
                isValid = false;
            }

            // 6. Kwiaty
            const selectedFlowers = [];
            document.querySelectorAll('input[name="flowers"]:checked').forEach(cb => {
                const def = PREDEFINED_FLOWERS.find(f => f.name === cb.value);
                if(def) selectedFlowers.push(def);
            });

            if(selectedFlowers.length === 0) {
                const container = document.getElementById('flowersContainer');
                let err = document.createElement('div');
                err.className = 'error-message';
                err.textContent = 'Wybierz przynajmniej jeden rodzaj pożytku.';
                err.style.width = '100%';

                const existingErr = container.parentNode.querySelector('.error-message');
                if(existingErr) existingErr.remove();

                container.parentNode.appendChild(err);
                isValid = false;
            }

            if (!isValid) {
                return;
            }


            const submitBtn = document.getElementById('saveBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';

            try {
                let imagesBase64List = [];
                if (selectedFiles.length > 0) {
                    imagesBase64List = await filesToBase64List(selectedFiles);
                }

                const areaValue = areaInput ? parseFloat(areaInput.value) : 0;

                var newArea = {
                    name: name,
                    flowers: selectedFlowers,
                    coordinates: points.map(marker => [marker.getLatLng().lat, marker.getLatLng().lng]),
                    area: areaValue,
                    description: description,
                    maxHives: maxHives,
                    pricePerDay: pricePerDay,
                    images: imagesBase64List
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
                submitBtn.innerHTML = originalText;
            }
        });
    }
});