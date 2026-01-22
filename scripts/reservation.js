
    const API_BASE_URL = 'http://localhost:8080/api';
    let currentArea = null;
    let userBalance = 0;
    let areaId = null;
    let areaReviews = [];
    let occupiedDates = [];

    const urlParams = new URLSearchParams(window.location.search);
    areaId = urlParams.get('areaId');

    if (!areaId) {
    showError('Nie podano ID obszaru');
}

    function showError(message) {
    const container = document.getElementById('error-container');
    container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i> ${message}
                </div>
            `;
}

    // ==================== ŁADOWANIE DANYCH ====================
    async function loadData() {
    document.getElementById('loading').style.display = 'block';

    try {
    const userResponse = await fetch(`${API_BASE_URL}/auth/user`, {
    credentials: 'include'
});

    if (!userResponse.ok) {
    throw new Error('Musisz być zalogowany');
}

    const userData = await userResponse.json();
    userBalance = userData.balance || 0;
    document.getElementById('user-balance').textContent = userBalance.toFixed(2) + ' PLN';

    // 2. Pobierz obszar
    const areaResponse = await fetch(`${API_BASE_URL}/areas`, {
    credentials: 'include'
});

    if (!areaResponse.ok) {
    throw new Error('Nie udało się pobrać danych obszaru');
}

    const areas = await areaResponse.json();
    currentArea = areas.find(a => a.id == areaId);

    if (!currentArea) {
    throw new Error('Nie znaleziono obszaru');
}

    if (currentArea.status !== 'AVAILABLE') {
    throw new Error('Ten obszar został wyłączony przez właściciela');
}

    const occupiedResponse = await fetch(`${API_BASE_URL}/reservations/area/${areaId}/occupied`, {
    credentials: 'include'
});
    if (occupiedResponse.ok) {
    occupiedDates = await occupiedResponse.json();
}

    displayAreaDetails(currentArea);
    await loadAreaReviews();

    initializeCalendars();

    document.getElementById('loading').style.display = 'none';
    document.getElementById('area-details').style.display = 'block';
    document.getElementById('reservation-form-container').style.display = 'block';

} catch (error) {
    document.getElementById('loading').style.display = 'none';
    showError(error.message);
}
}

    // ==================== INICJALIZACJA KALENDARZA (Flatpickr) ====================
    function initializeCalendars() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const config = {
    locale: "pl",
    dateFormat: "Y-m-d",
    minDate: tomorrow,
    disable: occupiedDates,
    onChange: function(selectedDates, dateStr, instance) {
    updateSummary();

    if (instance.element.id === 'start-date') {
    const endDatePicker = document.getElementById('end-date')._flatpickr;
    endDatePicker.set('minDate', dateStr);

    if (endDatePicker.selectedDates[0] && endDatePicker.selectedDates[0] < selectedDates[0]) {
    endDatePicker.clear();
}
}
}
};

    flatpickr("#start-date", config);
    flatpickr("#end-date", config);

    if (currentArea && currentArea.maxHives) {
    document.getElementById('hives-count').max = currentArea.maxHives;
    document.getElementById('max-hives-hint').textContent = currentArea.maxHives;
}
}

    // ==================== GALERIA I OPINIE ====================
    function displayAreaDetails(area) {
    document.getElementById('area-name').textContent = area.name || 'Obszar pszczelarski';

    let flowersText = '-';
    if (area.flowers && area.flowers.length > 0) {
    flowersText = area.flowers.map(f => f.name).join(', ');
}

    document.getElementById('area-type-quick').textContent = flowersText;
    document.getElementById('area-size-quick').textContent = area.area ? area.area.toFixed(2) + ' ha' : '-';
    document.getElementById('area-hives-quick').textContent = area.maxHives || '-';
    document.getElementById('area-price-quick').textContent = area.pricePerDay ? area.pricePerDay.toFixed(2) + ' PLN' : '-';

    document.getElementById('detail-name').textContent = area.name || '-';
    document.getElementById('detail-type').textContent = flowersText;
    document.getElementById('detail-size').textContent = area.area ? area.area.toFixed(2) + ' ha' : '-';
    document.getElementById('detail-hives').textContent = area.maxHives || '-';
    document.getElementById('detail-price').textContent = area.pricePerDay ? area.pricePerDay.toFixed(2) + ' PLN' : '-';
    document.getElementById('detail-owner').textContent = (area.ownerFirstName && area.ownerLastName) ? `${area.ownerFirstName} ${area.ownerLastName}` : '-';
    document.getElementById('detail-available').textContent = area.availableFrom || '-';
    document.getElementById('detail-description').textContent = area.description || 'Brak opisu';

    const galleryContainer = document.getElementById('area-gallery-container');
    const images = (area.images && area.images.length > 0) ? area.images : null;

    if (images) {
    const mainImgHtml = `<div class="area-image-main"><img id="main-area-img" src="data:image/jpeg;base64,${images[0]}" alt="${area.name}"></div>`;
    let thumbsHtml = '';
    if (images.length > 1) {
    thumbsHtml = `<div class="area-thumbnails">${images.map((img, i) => `<div class="area-thumbnail ${i === 0 ? 'active' : ''}" onclick="changeMainAreaImage(this, '${img}')"><img src="data:image/jpeg;base64,${img}" alt="Miniatura ${i + 1}"></div>`).join('')}</div>`;
}
    galleryContainer.innerHTML = mainImgHtml + thumbsHtml;
} else {
    galleryContainer.innerHTML = `<div class="area-image-main"><div class="area-image-placeholder"><i class="fas fa-image"></i><p>Brak zdjęć obszaru</p></div></div>`;
}
}

    window.changeMainAreaImage = function(element, base64) {
    document.getElementById('main-area-img').src = `data:image/jpeg;base64,${base64}`;
    document.querySelectorAll('.area-thumbnail').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
};

    async function loadAreaReviews() {
    if (!currentArea || !currentArea.reviewCount || currentArea.reviewCount === 0) return;
    try {
    const response = await fetch(`${API_BASE_URL}/reviews/areas/area/${currentArea.id}`, {
    method: 'GET',
    credentials: 'include'
});
    if (!response.ok) return;
    areaReviews = await response.json();
    displayAreaRating();
} catch (error) { console.error('Błąd ładowania opinii:', error); }
}

    function displayAreaRating() {
    const ratingSection = document.getElementById('area-rating-section');
    if (!ratingSection) return;
    ratingSection.style.display = 'block';
    ratingSection.innerHTML = `<div class="rating-stars">${renderStars(currentArea.averageRating)}<span class="rating-text">${currentArea.averageRating.toFixed(1)}/5</span><span class="review-count">(${currentArea.reviewCount} ${currentArea.reviewCount === 1 ? 'opinia' : 'opinii'})</span></div>`;
}

    function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star star-filled"></i>';
    if (hasHalfStar) starsHTML += '<i class="fas fa-star-half-alt star-filled"></i>';
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star star-empty"></i>';
    return starsHTML;
}

    function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
}

    // ==================== OBSŁUGA FORMULARZA I ZAPISU ====================
    function updateSummary() {
    const startDateStr = document.getElementById('start-date').value;
    const endDateStr = document.getElementById('end-date').value;
    const hivesCount = parseInt(document.getElementById('hives-count').value) || 0;

    if (!currentArea || !startDateStr || !endDateStr) return;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate > endDate) return;

    // Oblicz dni (minimum 1)
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const pricePerHivePerDay = currentArea.pricePerDay || 0;
    const dailyTotalPrice = pricePerHivePerDay * hivesCount;
    const totalCost = dailyTotalPrice * diffDays;

    document.getElementById('summary-date-range').textContent = `${formatDate(startDateStr)} - ${formatDate(endDateStr)}`;
    document.getElementById('summary-days').textContent = diffDays;
    document.getElementById('summary-hives').textContent = hivesCount;
    document.getElementById('summary-daily').textContent = dailyTotalPrice.toFixed(2);
    document.getElementById('summary-total').textContent = totalCost.toFixed(2);

    const submitBtn = document.getElementById('submit-btn');
    const warningDiv = document.getElementById('insufficient-balance-warning');

    if (totalCost > userBalance) {
    const missing = totalCost - userBalance;
    document.getElementById('missing-amount').textContent = missing.toFixed(2);
    warningDiv.style.display = 'block';
    submitBtn.disabled = true;
} else {
    warningDiv.style.display = 'none';
    submitBtn.disabled = false;
}
}

    document.getElementById('hives-count').addEventListener('input', updateSummary);

    document.getElementById('reservation-form').addEventListener('submit', function(e) {
    e.preventDefault();
    openConfirmationModal();
});

    function openConfirmationModal() {
    const startDateStr = document.getElementById('start-date').value;
    const endDateStr = document.getElementById('end-date').value;
    const hivesCount = parseInt(document.getElementById('hives-count').value);
    const totalCost = document.getElementById('summary-total').textContent;
    const dailyPrice = document.getElementById('summary-daily').textContent;
    const days = document.getElementById('summary-days').textContent;

    document.getElementById('modal-area-name').textContent = currentArea.name;
    document.getElementById('modal-date-range').textContent = `${formatDate(startDateStr)} - ${formatDate(endDateStr)}`;
    document.getElementById('modal-days').textContent = days + ' dni';
    document.getElementById('modal-hives').textContent = hivesCount + ' uli';
    document.getElementById('modal-daily-price').textContent = dailyPrice + ' PLN';
    document.getElementById('modal-total-price').textContent = totalCost;

    document.getElementById('confirmation-modal').classList.add('show');
}

    function closeConfirmationModal() {
    document.getElementById('confirmation-modal').classList.remove('show');
}

    // ==================== ZATWIERDZANIE REZERWACJI ====================
    async function confirmReservation() {
    closeConfirmationModal();

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rezerwuję...';

    const reservationData = {
    areaId: parseInt(areaId),
    startDate: document.getElementById('start-date').value,
    endDate: document.getElementById('end-date').value,
    numberOfHives: parseInt(document.getElementById('hives-count').value),
    notes: document.getElementById('reservation-notes').value || null
};

    try {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json'
},
    credentials: 'include',
    body: JSON.stringify(reservationData)
});

    const data = await response.json();

    if (!response.ok) {
    throw new Error(data.error || 'Nie udało się utworzyć rezerwacji');
}

    alert('Rezerwacja pomyślna! Środki zostały pobrane z Twojego konta.');
    window.location.href = 'profile.html?tab=rented-areas';

} catch (error) {
    showError(error.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Zarezerwuj obszar';
}
}

    // Obsługa zamykania modali
    document.getElementById('details-modal').addEventListener('click', function(e) {
    if (e.target === this) closeDetailsModal();
});

    document.getElementById('confirmation-modal').addEventListener('click', function(e) {
    if (e.target === this) closeConfirmationModal();
});
    function goBack() {window.history.back(); }
    function showDetailsModal() { document.getElementById('details-modal').classList.add('show'); }
    function closeDetailsModal() { document.getElementById('details-modal').classList.remove('show'); }

    // Start
    loadData();
