
    const apiUrl = "http://localhost:8080/api/auth";

    function toggleDropdown() {
    document.getElementById("settingsDropdown").classList.toggle("show");
}

    window.onclick = function(event) {
    if (!event.target.matches('.settings-btn') && !event.target.matches('.fa-cog')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (var i = 0; i < dropdowns.length; i++) {
    var openDropdown = dropdowns[i];
    if (openDropdown.classList.contains('show')) {
    openDropdown.classList.remove('show');
}
}
}
}

    document.addEventListener('DOMContentLoaded', function() {
    function checkScreenSize() {
        const notificationContainer = document.querySelector('.notifications-container');
        if (window.innerWidth <= 768 && notificationContainer) {
            notificationContainer.remove();
        }
    }

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    // Obsługa sesji i przywitania
    const userJson = localStorage.getItem("currentUser");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const welcomeEl = document.getElementById("welcome-message");

    if (userJson) {
    const user = JSON.parse(userJson);
    if (welcomeEl) welcomeEl.textContent = `Witaj, ${user.firstname} ${user.lastname}`;
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    logoutBtn.addEventListener("click", async () => {
    try {
    await fetch(`${apiUrl}/logout`, {
    method: "POST",
    credentials: "include"
});
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
} catch (err) {
    console.error("Błąd wylogowania:", err);
    alert("Błąd podczas wylogowywania");
}
});
} else {
    if (welcomeEl) welcomeEl.textContent = "Witaj, Gościu";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
}
});

    // Mapa i style
    var map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([52.237049, 21.017532], 7);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.attribution({
    position: 'bottomright',
    prefix: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

    function redirectToReservation(areaId) {
    const userJson = localStorage.getItem("currentUser");
    if (!userJson) {
    alert('Musisz być zalogowany, aby zarezerwować obszar.');
    window.location.href = 'login.html';
    return;
}
    window.location.href = `reservation.html?areaId=${areaId}`;
}

    function formatPopup(area) {
    const isAvailable = area.status && area.status.toString().toUpperCase() === "AVAILABLE";
    const availability = isAvailable
    ? '<span class="status available">Dostępny</span>'
    : '<span class="status reserved">Zarezerwowany</span>';
    const buttonText = isAvailable ? 'Zarezerwuj obszar' : 'Zarezerwowany';

    let flowerType = "Brak danych";
    if (area.flowers && area.flowers.length > 0) {
    flowerType = area.flowers.map(f => f.name).join(", ");
}

    const areaSize = area.area ? `${area.area.toFixed(2)} ha` : "?";
    const price = area.pricePerDay ? `${area.pricePerDay} zł/dzień` : "?";
    const ownerName = `${area.ownerFirstName || ""} ${area.ownerLastName || ""}`.trim() || "?";

    return `
                <div class="custom-popup">
                    <h3>${area.name || "Obszar bez nazwy"}</h3>
                    <div class="property">
                        <span class="prop-label">Typ:</span>
                        <span>${flowerType}</span>
                    </div>
                    <div class="property">
                        <span class="prop-label">Powierzchnia:</span>
                        <span>${areaSize}</span>
                    </div>
                    <div class="property">
                        <span class="prop-label">Status:</span>
                        ${availability}
                    </div>
                    <div class="property">
                        <span class="prop-label">Właściciel:</span>
                        <span>${ownerName}</span>
                    </div>
                    <div class="property">
                        <span class="prop-label">Cena:</span>
                        <span>${price}</span>
                    </div>
                    <button class="reserve-btn${isAvailable ? '' : ' disabled-btn'}"
                            ${isAvailable ? '' : 'disabled'}
                            data-area-id="${area.id}"
                            onclick="redirectToReservation(${area.id})">
                        <i class="fas ${isAvailable ? 'fa-calendar-check' : 'fa-lock'}"></i>
                        ${buttonText}
                    </button>
                </div>
            `;
}

    const layers = {
    lipa: L.layerGroup(),
    wielokwiat: L.layerGroup(),
    gryka: L.layerGroup(),
    rzepak: L.layerGroup(),
    spadz: L.layerGroup(),
    akacja: L.layerGroup(),
    wrzos: L.layerGroup(),
    malina: L.layerGroup()
};

    // Pomocnicza funkcja do mapowania nazw kwiatów na klucze warstw
    function getLayerKey(name) {
    if (!name) return 'unknown';
    const lower = name.toLowerCase();
    // Mapowanie specjalnych przypadków (polskie znaki)
    if (lower === 'spadź') return 'spadz';
    // Domyślnie zwracamy małe litery
    return lower;
}

    // Pobieranie obszarów
    fetch(`${apiUrl.replace('/auth', '')}/areas`, {
    method: "GET",
    credentials: "include"
})
    .then(res => res.json())
    .then(areas => {
    areas.forEach(area => {
        const coords = area.coordinates;

        // Pobierz listę kwiatów z obiektu area (nowa struktura backendu)
        // Jeśli lista jest pusta, użyj domyślnego
        const flowersList = (area.flowers && area.flowers.length > 0)
            ? area.flowers
            : [{name: "unknown", color: "#999999"}];

        // Dla każdego kwiata na obszarze dodaj wielokąt do odpowiedniej warstwy
        flowersList.forEach(flower => {
            const color = flower.color || "#999999";
            const layerKey = getLayerKey(flower.name);

            const polygon = L.polygon(coords, {
                color: color,
                fillColor: color,
                fillOpacity: area.status === 'AVAILABLE' ? 0.6 : 0.3,
                weight: 2
            });

            polygon.bindTooltip(flower.name, {
                className: 'area-tooltip',
                direction: 'top',
                sticky: false,
                opacity: 0.9
            });

            polygon.bindPopup(formatPopup(area));

            polygon.on('mouseover', function() {
                this.setStyle({ weight: 3, opacity: 1, fillOpacity: 0.7 });
                this.bringToFront();
            });

            polygon.on('mouseout', function() {
                this.setStyle({ weight: 2, opacity: 0.8, fillOpacity: 0.6 });
            });

            polygon.on('click', function() {
                map.fitBounds(this.getBounds(), { padding: [50, 50], maxZoom: 12 });
            });

            // Dodaj do odpowiedniej grupy warstw, jeśli istnieje
            if (layers[layerKey]) {
                layers[layerKey].addLayer(polygon);
                // Domyślnie wszystkie warstwy są włączone, więc dodajemy do mapy
                layers[layerKey].addTo(map);
            }
        });
    });
})
    .catch(err => console.error("Błąd ładowania obszarów:", err));

    document.querySelectorAll('.toggle input[type="checkbox"]').forEach(function(toggle) {
    toggle.addEventListener('change', function() {
        const layerName = this.getAttribute('data-layer');
        const layerKey = getLayerKey(layerName); // Używamy tej samej funkcji normalizującej
        const layer = layers[layerKey];

        if (!layer) return;

        if (this.checked) {
            map.addLayer(layer);
            layer.eachLayer(function(l) {
                l.setStyle({ opacity: 0, fillOpacity: 0 });
                setTimeout(() => l.setStyle({ opacity: 0.8, fillOpacity: 0.6 }), 10);
            });
        } else {
            layer.eachLayer(l => l.setStyle({ opacity: 0, fillOpacity: 0 }));
            setTimeout(() => map.removeLayer(layer), 300);
        }
    });
});

    document.querySelector('.add-area-btn')?.addEventListener('click', function() {
    window.location.href = 'add-field.html';
});
